const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Department, Employee,Position } = require('../models');
const { Op, Sequelize } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getRoleIdFromName(roleName) {
  if (!roleName || roleName === 'all') return null;
  const role = await Role.findOne({ where: { name: roleName } });
  return role ? role.roleId : null;
}

// Advanced pagination helper
const getPagination = (page, size, defaultLimit = 10, maxLimit = 100) => {
  const limit = size ? Math.min(parseInt(size), maxLimit) : defaultLimit;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};

// Build dynamic search conditions
const buildSearchConditions = (search, fields = ['username', 'fullName', 'email']) => {
  if (!search || !search.trim()) return {};
  
  return {
    [Op.or]: fields.map(field => ({
      [field]: { [Op.like]: `%${search.trim()}%` }
    }))
  };
};

// Build filter conditions
const buildFilterConditions = (filters) => {
  const conditions = {};
  
  if (filters.role && filters.role !== 'all') {
    conditions.roleId = filters.role;
  }
  
  if (filters.status && filters.status !== 'all') {
    conditions.isActive = filters.status === 'active';
  }
  
  if (filters.department && filters.department !== 'all') {
    conditions.departmentId = filters.department;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    conditions.created_at = {};
    if (filters.dateFrom) conditions.created_at[Op.gte] = new Date(filters.dateFrom);
    if (filters.dateTo) conditions.created_at[Op.lte] = new Date(filters.dateTo);
  }
  
  if (filters.lastLoginFrom || filters.lastLoginTo) {
    conditions.lastLogin = {};
    if (filters.lastLoginFrom) conditions.lastLogin[Op.gte] = new Date(filters.lastLoginFrom);
    if (filters.lastLoginTo) conditions.lastLogin[Op.lte] = new Date(filters.lastLoginTo);
  }
  
  return conditions;
};

// Build sorting options
const getSortingOptions = (sortBy, sortOrder) => {
  const allowedSortFields = ['userId', 'username', 'fullName', 'email', 'created_at', 'lastLogin', 'isActive'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  return [[field, order]];
};

// ============================================================================
// USER LOGIN - WITH COMPLETE USER DATA
// ============================================================================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      },
      include: [
        { 
          model: Role, 
          attributes: ['roleId', 'name', 'description'] 
        },
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code', 'description'] 
        },
        { 
          model: Employee, 
          as: 'employee',
          required: false,
          attributes: [
            'employeeId', 'employeeCode', 'firstName', 'lastName', 
            'middleName', 'profilePicture', 'profilePictureUrl', 'profilePicturePublicId',
            'phoneNumber', 'hireDate', 'positionId', 'employmentType', 'employmentStatus',
            'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
            'personalEmail', 'workEmail', 'emergencyContact',
            'currentAddress', 'permanentAddress', 'basicSalary',
            'bankAccount', 'workLocation', 'managerId'
          ]
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account is deactivated. Please contact administrator.' 
      });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const roleName = user.Role?.name;
    const departmentName = user.Department?.name;
    const employee = user.employee;
    
    if (!roleName) {
      console.error('User has no role assigned:', user.userId);
      return res.status(500).json({ 
        success: false, 
        error: 'User role not configured. Please contact administrator.' 
      });
    }

    // Generate tokens
    const token = jwt.sign(
      { 
        userId: user.userId,
        username: user.username,
        role: roleName,
        roleId: user.roleId,
        departmentId: user.departmentId,
        employeeId: employee?.employeeId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await user.update({ lastLogin: new Date() });

    // Build profile picture URL
    let profilePictureUrl = null;
    if (employee?.profilePictureUrl) {
      if (employee.profilePictureUrl.startsWith('http://') || 
          employee.profilePictureUrl.startsWith('https://')) {
        profilePictureUrl = employee.profilePictureUrl;
      } else {
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        profilePictureUrl = `${baseUrl}${employee.profilePictureUrl}`;
      }
    } else if (employee?.profilePicture) {
      if (employee.profilePicture.startsWith('http://') || 
          employee.profilePicture.startsWith('https://')) {
        profilePictureUrl = employee.profilePicture;
      } else {
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        profilePictureUrl = `${baseUrl}${employee.profilePicture}`;
      }
    }

    // Build complete user response
    const userResponse = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.created_at,
      role: roleName,
      roleId: user.roleId,
      roleDescription: user.Role?.description,
      departmentId: user.departmentId,
      departmentName: departmentName,
      departmentCode: user.Department?.code,
      departmentDescription: user.Department?.description,
      employeeId: employee?.employeeId,
      employeeCode: employee?.employeeCode,
      firstName: employee?.firstName,
      lastName: employee?.lastName,
      middleName: employee?.middleName,
      fullEmployeeName: employee?.firstName && employee?.lastName 
        ? `${employee.firstName} ${employee.lastName}` 
        : user.fullName,
      dateOfBirth: employee?.dateOfBirth,
      gender: employee?.gender,
      maritalStatus: employee?.maritalStatus,
      nationality: employee?.nationality,
      profilePicture: profilePictureUrl,
      profilePicturePublicId: employee?.profilePicturePublicId || null,
      phoneNumber: employee?.phoneNumber,
      personalEmail: employee?.personalEmail,
      workEmail: employee?.workEmail,
      emergencyContact: employee?.emergencyContact,
      currentAddress: employee?.currentAddress,
      permanentAddress: employee?.permanentAddress,
      positionId: employee?.positionId,
      managerId: employee?.managerId,
      hireDate: employee?.hireDate,
      employmentType: employee?.employmentType,
      employmentStatus: employee?.employmentStatus,
      basicSalary: employee?.basicSalary,
      bankAccount: employee?.bankAccount,
      workLocation: employee?.workLocation
    };

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
// ============================================================================
// LOGOUT
// ============================================================================
exports.logout = async (req, res) => {
  try {
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
};
// ============================================================================
// REFRESH TOKEN
// ============================================================================

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, attributes: ['name'] }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    // Make sure to include ALL the same claims as the original token
    const newToken = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        role: user.Role?.name,  // ← Critical: Include role
        roleId: user.roleId,     // ← Critical: Include roleId
        departmentId: user.departmentId,
        employeeId: user.employeeId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
};

// ============================================================================
// GET USERS WITH ADVANCED PAGINATION, FILTERS, AND SEARCH
// ============================================================================

exports.getUsers = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    // Extract query parameters with defaults
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = '',
      role: roleName = 'all',  // Rename to roleName to avoid confusion
      status = 'all',
      department = 'all',
      dateFrom = '',
      dateTo = '',
      lastLoginFrom = '',
      lastLoginTo = '',
      employeeStatus = 'all'
    } = req.query;

    // Build where condition
    let whereCondition = {};
    
    // Handle role filter - convert role name to roleId
    if (roleName && roleName !== 'all') {
      const roleRecord = await Role.findOne({ where: { name: roleName } });
      if (roleRecord) {
        whereCondition.roleId = roleRecord.roleId;
      } else {
        // If role name not found, return empty results
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
            startOffset: 0,
            endOffset: 0
          },
          filters: {},
          sorting: { field: sortBy, order: sortOrder }
        });
      }
    }
    
    // Handle status filter
    if (status && status !== 'all') {
      whereCondition.isActive = status === 'active';
    }
    
    // Handle department filter
    if (department && department !== 'all') {
      whereCondition.departmentId = parseInt(department);
    }
    
    // Handle search
    if (search && search.trim()) {
      whereCondition[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Handle date filters
    if (dateFrom) {
      whereCondition.created_at = { ...whereCondition.created_at, [Op.gte]: new Date(dateFrom) };
    }
    if (dateTo) {
      whereCondition.created_at = { ...whereCondition.created_at, [Op.lte]: new Date(dateTo) };
    }
    
    // Handle last login filters
    if (lastLoginFrom) {
      whereCondition.lastLogin = { ...whereCondition.lastLogin, [Op.gte]: new Date(lastLoginFrom) };
    }
    if (lastLoginTo) {
      whereCondition.lastLogin = { ...whereCondition.lastLogin, [Op.lte]: new Date(lastLoginTo) };
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = Math.min(parseInt(limit), 100);
    
    // Sorting
    const allowedSortFields = ['userId', 'username', 'fullName', 'email', 'created_at', 'lastLogin', 'isActive'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    console.log('Where condition:', JSON.stringify(whereCondition, null, 2)); // Debug log

    // Execute query
    const { count, rows: users } = await User.findAndCountAll({
      where: whereCondition,
      attributes: [
        'userId', 'username', 'email', 'fullName', 'isActive', 
        'created_at', 'roleId', 'departmentId', 'lastLogin'
      ],
      include: [
        { 
          model: Role, 
          attributes: ['name', 'description'] 
        },
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        {
          model: Employee,
          as: 'employee',
          required: false,
          attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'employmentStatus']
        }
      ],
      limit: queryLimit,
      offset: offset,
      order: [[sortField, sortDirection]],
      distinct: true
    });

    // Format response
    const formattedUsers = users.map(user => ({
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.Role?.name,
      roleId: user.roleId,
      departmentId: user.departmentId,
      departmentName: user.Department?.name,
      departmentCode: user.Department?.code,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.created_at,
      employee: user.employee ? {
        employeeId: user.employee.employeeId,
        employeeCode: user.employee.employeeCode,
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
        employmentStatus: user.employee.employmentStatus
      } : null
    }));

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        total: count,
        page: currentPage,
        limit: queryLimit,
        totalPages: totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? currentPage + 1 : null,
        prevPage: hasPrevPage ? currentPage - 1 : null,
        startOffset: offset + 1,
        endOffset: Math.min(offset + queryLimit, count)
      },
      filters: {
        search: search || null,
        role: roleName !== 'all' ? roleName : null,
        status: status !== 'all' ? status : null,
        department: department !== 'all' ? department : null,
        dateRange: (dateFrom || dateTo) ? { from: dateFrom || null, to: dateTo || null } : null,
        lastLoginRange: (lastLoginFrom || lastLoginTo) ? { from: lastLoginFrom || null, to: lastLoginTo || null } : null
      },
      sorting: {
        field: sortField,
        order: sortDirection
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
// ============================================================================
// GET USER STATISTICS WITH DETAILED BREAKDOWN
// ============================================================================
exports.getUserStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    // Parallel queries for better performance
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleStats,
      departmentStats,
      lastWeekStats,
      lastMonthStats,
      employeeStatusStats
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      
      // Role distribution - FIXED
      Role.findAll({
        attributes: [
          ['role_id', 'roleId'],
          'name',
          [Sequelize.fn('COUNT', Sequelize.col('Users.user_id')), 'count']
        ],
        include: [{ model: User, attributes: [], required: false }],
        group: ['Role.role_id', 'Role.name'],
        raw: true
      }),
      
      // Department distribution - FIXED
      Department.findAll({
        attributes: [
          ['department_id', 'departmentId'],
          'name',
          [Sequelize.fn('COUNT', Sequelize.col('Users.user_id')), 'count']
        ],
        include: [{ model: User, attributes: [], required: false }],
        group: ['Department.department_id', 'Department.name'],
        raw: true
      }),
      
      // New users in last 7 days
      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // New users in last 30 days
      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Employee status breakdown - FIXED
      Employee.findAll({
        attributes: [
          'employmentStatus',
          [Sequelize.fn('COUNT', Sequelize.col('Employee.employee_id')), 'count']
        ],
        include: [{ model: User, attributes: [], required: true }],
        group: ['employmentStatus'],
        raw: true
      }).catch(() => [])
    ]);

    // Calculate percentages
    const activePercentage = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;
    const inactivePercentage = totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          activePercentage: parseFloat(activePercentage),
          inactivePercentage: parseFloat(inactivePercentage)
        },
        trends: {
          last7Days: lastWeekStats,
          last30Days: lastMonthStats,
          percentageGrowth: lastMonthStats > 0 
            ? (((lastWeekStats - (lastMonthStats - lastWeekStats)) / (lastMonthStats - lastWeekStats)) * 100).toFixed(1)
            : 0
        },
        byRole: roleStats.map(role => ({
          roleId: role.roleId,
          roleName: role.name,
          count: parseInt(role.count),
          percentage: totalUsers > 0 ? parseFloat(((role.count / totalUsers) * 100).toFixed(1)) : 0
        })),
        byDepartment: departmentStats.map(dept => ({
          departmentId: dept.departmentId,
          departmentName: dept.name,
          count: parseInt(dept.count),
          percentage: totalUsers > 0 ? parseFloat(((dept.count / totalUsers) * 100).toFixed(1)) : 0
        })),
        byEmployeeStatus: employeeStatusStats.map(status => ({
          status: status.employmentStatus,
          count: parseInt(status.count)
        }))
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// ADVANCED SEARCH USERS
// ============================================================================
exports.advancedSearchUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const {
      q = '',
      fields = 'username,fullName,email',
      exactMatch = 'false',
      page = 1,
      limit = 20
    } = req.query;

    const searchFields = fields.split(',');
    const isExactMatch = exactMatch === 'true';
    
    let searchCondition = {};
    
    if (q.trim()) {
      if (isExactMatch) {
        searchCondition = {
          [Op.or]: searchFields.map(field => ({
            [field]: q
          }))
        };
      } else {
        searchCondition = {
          [Op.or]: searchFields.map(field => ({
            [field]: { [Op.like]: `%${q}%` }
          }))
        };
      }
    }

    const { limit: queryLimit, offset } = getPagination(page, limit, 20, 50);
    
    const { count, rows: users } = await User.findAndCountAll({
      where: searchCondition,
      attributes: ['userId', 'username', 'fullName', 'email', 'isActive'],
      include: [
        { model: Role, attributes: ['name'] },
        { model: Department, attributes: ['name'] }
      ],
      limit: queryLimit,
      offset: offset,
      order: [['fullName', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: queryLimit,
        totalPages: Math.ceil(count / queryLimit)
      },
      searchInfo: {
        query: q,
        fields: searchFields,
        exactMatch: isExactMatch,
        resultsCount: count
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// BULK UPDATE USERS
// ============================================================================
exports.bulkUpdateUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { userIds, updates } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User IDs array is required' 
      });
    }
    
    if (userIds.includes(req.user.userId)) {
      return res.status(403).json({ 
        success: false, 
        error: 'You cannot update your own account in bulk operation' 
      });
    }
    
    const allowedUpdates = ['departmentId', 'isActive'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid updates provided' 
      });
    }
    
    const [updatedCount] = await User.update(filteredUpdates, {
      where: { userId: userIds }
    });
    
    res.status(200).json({
      success: true,
      message: `${updatedCount} user(s) updated successfully`,
      updatedCount,
      updates: filteredUpdates
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// EXPORT USERS WITH FILTERS
// ============================================================================
exports.exportUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const {
      format = 'json',
      role = 'all',
      status = 'all',
      department = 'all',
      search = ''
    } = req.query;

    // Build filters
    const whereCondition = {};
    
    if (role && role !== 'all') {
      const roleId = await getRoleIdFromName(role);
      if (roleId) whereCondition.roleId = roleId;
    }
    
    if (status && status !== 'all') {
      whereCondition.isActive = status === 'active';
    }
    
    if (department && department !== 'all') {
      whereCondition.departmentId = department;
    }
    
    if (search && search.trim()) {
      whereCondition[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAll({
      where: whereCondition,
      include: [
        { model: Role, attributes: ['name'] },
        { model: Department, attributes: ['name', 'code'] },
        { 
          model: Employee, 
          as: 'employee',
          required: false,
          attributes: ['employeeCode', 'firstName', 'lastName', 'employmentStatus']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    const exportData = users.map(user => ({
      'User ID': user.userId,
      'Username': user.username,
      'Full Name': user.fullName,
      'Email': user.email,
      'Role': user.Role?.name,
      'Department': user.Department?.name,
      'Department Code': user.Department?.code,
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Employee Code': user.employee?.employeeCode,
      'Employee Name': user.employee?.firstName && user.employee?.lastName 
        ? `${user.employee.firstName} ${user.employee.lastName}` 
        : '',
      'Employment Status': user.employee?.employmentStatus || 'N/A',
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toISOString() : 'Never',
      'Created At': new Date(user.created_at).toISOString()
    }));
    
    // Handle different export formats
    if (format === 'csv') {
      const csvHeaders = Object.keys(exportData[0] || {}).join(',');
      const csvRows = exportData.map(row => 
        Object.values(row).map(value => 
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      );
      const csv = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.csv`);
      return res.status(200).send(csv);
    }
    
    // Default JSON format
    res.status(200).json({
      success: true,
      data: exportData,
      count: exportData.length,
      exportDate: new Date().toISOString(),
      filters: { role, status, department, search }
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET USER BY ID (Enhanced)
// ============================================================================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['userId', 'username', 'email', 'fullName', 'isActive', 'created_at', 'roleId', 'departmentId', 'lastLogin'],
      include: [
        { model: Role, attributes: ['roleId', 'name', 'description'] },
        { model: Department, attributes: ['departmentId', 'name', 'code', 'description'] },
        { 
          model: Employee, 
          as: 'employee',
          required: false,
          attributes: [
            'employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName',
            'phoneNumber', 'hireDate', 'positionId', 'employmentType', 'employmentStatus',
            'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
            'personalEmail', 'workEmail', 'profilePictureUrl'
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check permission (admin or own profile)
    if (req.user.role !== 'admin' && req.user.userId !== user.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only view your own profile.' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.Role?.name,
        roleId: user.roleId,
        roleDescription: user.Role?.description,
        departmentId: user.departmentId,
        departmentName: user.Department?.name,
        departmentCode: user.Department?.code,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.created_at,
        employee: user.employee
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// Keep other existing endpoints (createUser, updateUser, deleteUser, etc.)
// with consistent error handling and response format...

// ============================================================================
// GET ALL ROLES (Optimized with caching headers)
// ============================================================================
exports.getAllRoles = async (req, res) => {
  try {
    console.log('=== getAllRoles called ===');
    console.log('User from token:', req.user);
    console.log('Authorization header:', req.headers.authorization);
    
    const roles = await Role.findAll({ 
      attributes: ['roleId', 'name', 'description', 'isActive'], 
      order: [['roleId', 'ASC']] 
    });
    
    console.log(`Found ${roles.length} roles`);
    
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET ALL DEPARTMENTS (Optimized with caching headers)
// ============================================================================
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({ 
      attributes: ['departmentId', 'name', 'code', 'description', 'isActive'], 
      order: [['departmentId', 'ASC']] 
    });
    
    // Set cache headers
    res.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET ALL POSITIONS (Optimized with caching headers)
// ============================================================================
exports.getAllPositions = async (req, res) => {
  try {
    const positions = await Position.findAll({ 
      attributes: ['positionId', 'title','code','departmentId','level','minSalary','maxSalary','requirements','responsibilities','isActive'], 
      order: [['positionId', 'ASC']] 
    });
    
    // Set cache headers
    res.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
    res.status(200).json({ success: true, data: positions });
  } catch (error) {
    console.error('Get all positions error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};



// ============================================================================
// GET AVAILABLE FILTER OPTIONS
// ============================================================================
exports.getFilterOptions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [roles, departments, statuses, dateRange] = await Promise.all([
      Role.findAll({ attributes: ['roleId', 'name'], where: { isActive: true } }),
      Department.findAll({ attributes: ['departmentId', 'name'], where: { isActive: true } }),
      // Get unique status values
      User.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('isActive')), 'status']], raw: true }),
      // Get date range for filtering
      User.findOne({ 
        attributes: [
          [Sequelize.fn('MIN', Sequelize.col('created_at')), 'minDate'],
          [Sequelize.fn('MAX', Sequelize.col('created_at')), 'maxDate']
        ],
        raw: true 
      })
    ]);

    res.status(200).json({
      success: true,
      filters: {
        roles: roles.map(r => ({ value: r.name, label: r.name, id: r.roleId })),
        departments: departments.map(d => ({ value: d.departmentId, label: d.name })),
        statuses: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ],
        dateRange: {
          min: dateRange?.minDate,
          max: dateRange?.maxDate
        },
        sortFields: ['userId', 'username', 'fullName', 'email', 'created_at', 'lastLogin'],
        sortOrders: ['ASC', 'DESC'],
        defaultLimit: 10,
        maxLimit: 100
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET PROFILE (Add this if missing)
// ============================================================================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['userId', 'username', 'email', 'fullName', 'isActive', 'created_at', 'departmentId', 'lastLogin'],
      include: [
        { model: Role, attributes: ['name', 'description'] },
        { model: Department, attributes: ['name', 'code', 'description'] }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.Role?.name,
        roleDescription: user.Role?.description,
        departmentId: user.departmentId,
        departmentName: user.Department?.name,
        departmentCode: user.Department?.code,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ============================================================================
// CHANGE PASSWORD (Add this if missing)
// ============================================================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(403).json({ success: false, error: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// CREATE USER (Add this if missing)
// ============================================================================
exports.createUser = async (req, res) => {
  try {
    const { username, email, fullName, roleId, departmentId, password } = req.body;

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }

    const roleExists = await Role.findByPk(roleId);
    if (!roleExists) {
      return res.status(400).json({ success: false, error: 'Invalid role ID' });
    }

    const user = await User.create({
      username,
      email,
      passwordHash: password || 'password123',
      fullName,
      roleId,
      departmentId: departmentId || null,
      createdBy: req.user.userId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { 
        userId: user.userId, 
        username: user.username, 
        email: user.email, 
        fullName: user.fullName, 
        roleId: user.roleId, 
        departmentId: user.departmentId, 
        isActive: user.isActive 
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ============================================================================
// UPDATE USER (Add this if missing)
// ============================================================================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, roleId, departmentId, isActive, email } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }

    if (roleId) {
      const roleExists = await Role.findByPk(roleId);
      if (!roleExists) {
        return res.status(400).json({ success: false, error: 'Invalid role ID' });
      }
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (isActive !== undefined) updateData.isActive = isActive;

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      include: [{ model: Role, attributes: ['name'] }, { model: Department, attributes: ['name'] }]
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        userId: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        roleId: updatedUser.roleId,
        role: updatedUser.Role?.name,
        departmentId: updatedUser.departmentId,
        departmentName: updatedUser.Department?.name,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ============================================================================
// RESET PASSWORD (Add this if missing)
// ============================================================================
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.passwordHash = newPassword || 'password123';
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ============================================================================
// ACTIVATE USER (Add this if missing)
// ============================================================================
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.update({ isActive: true });
    res.status(200).json({ success: true, message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ============================================================================
// DEACTIVATE USER (Add this if missing)
// ============================================================================
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (user.userId === req.user.userId) {
      return res.status(403).json({ success: false, error: 'You cannot deactivate your own account' });
    }

    await user.update({ isActive: false });
    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ============================================================================
// TOGGLE USER STATUS (Add this if missing)
// ============================================================================
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (user.userId === req.user.userId) {
      return res.status(403).json({ success: false, error: 'You cannot change your own status' });
    }
    
    await user.update({ isActive: !user.isActive });
    
    res.status(200).json({ 
      success: true, 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
