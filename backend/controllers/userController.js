const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Role, Department, Employee, Position, Group, StoreGroupRelation, Store, PushToken, WebSession } = require('../models');
const { Op, Sequelize } = require('sequelize');
const userStoreService = require('../services/userStoreService');
const deviceService = require('../services/deviceService');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// ============================================================
// ROLE-BASED ACCESS
// ============================================================

// Can VIEW user data (list, read, export, dropdowns)
const canViewUsers = (user) => {
  if (!user) return false;
  const role = (user.role || user.Role?.name)?.toLowerCase();
  return ['admin', 'superadmin', 'checker', 'purchase_organizer'].includes(role);
};

// Can MUTATE user data (bulk updates, imports)
const canMutateUsers = (user) => {
  if (!user) return false;
  const role = (user.role || user.Role?.name)?.toLowerCase();
  return ['admin', 'superadmin', 'checker'].includes(role);
};

// Legacy alias — keep for calls that still reference it (mutation endpoints)
const isAdminOrChecker = canMutateUsers;

const isAdmin = (user) => {
  if (!user) return false;
  const role = (user.role || user.Role?.name)?.toLowerCase();
  return ['admin', 'superadmin'].includes(role);
};

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
// DEVICE CHECK HELPER
// ----------------------------------------------------------------------------
// Runs the device approval flow for mobile logins. If the client did NOT send
// a `device` object (e.g. web login), this helper returns { blocked: false }
// and the login continues normally. If `device` is present, it registers the
// device if new and returns a rejection payload when the device is pending or
// blocked.
//
// Returns:
//   { blocked: false }                             → continue with login
//   { blocked: true, payload: {...} }              → send this payload & stop
// ============================================================================
// ============================================================================
// DEVICE CHECK HELPER
// ----------------------------------------------------------------------------
// Runs the device approval flow for mobile logins.
//
// Admins and superadmins skip the check entirely, so they can log in from any
// device without needing approval. For everyone else, a missing device object
// also skips the check (this keeps the web login path untouched).
//
// Returns:
//   { blocked: false }                             → continue with login
//   { blocked: true, payload: {...} }              → send this payload & stop
// ============================================================================
async function runDeviceCheck({ device, user, res }) {
  // ✅ 1. Admin / superadmin bypass — never subject to device approval
  const roleName = (user?.Role?.name || user?.role || '').toLowerCase();
  if (roleName === 'admin' || roleName === 'superadmin') {
    return { blocked: false };
  }

  // ✅ 2. No device object → not a mobile login (e.g. web) → skip
  if (!device || !device.deviceId || !device.fingerprint) {
    return { blocked: false };
  }

  // ✅ 3. Run the device approval flow for normal users
  const check = await deviceService.checkOrRegister(user.userId, device);

  if (check.status === 'new_device') {
    return {
      blocked: true,
      payload: {
        success: false,
        data: {
          status: 'new_device',
          deviceId: device.deviceId,
          message: 'This device is awaiting admin approval.',
        },
      },
    };
  }

  if (check.status === 'pending') {
    return {
      blocked: true,
      payload: {
        success: false,
        data: {
          status: 'pending',
          deviceId: device.deviceId,
          message: 'This device is still awaiting approval.',
        },
      },
    };
  }

  if (check.status === 'blocked') {
    return {
      blocked: true,
      payload: {
        success: false,
        data: {
          status: 'blocked',
          deviceId: device.deviceId,
          reason: check.reason || null,
        },
      },
    };
  }

  // status === 'ok'
  return { blocked: false };
}

// ============================================================================
// ✅ NEW: WEB SESSION REGISTRATION
// ----------------------------------------------------------------------------
// Called from login handlers. Creates a row in web_sessions only for web
// clients (x-client-type: web). Mobile clients are skipped.
// ============================================================================
async function registerWebSessionIfNeeded(req, user, jti, expiresInSeconds = 7 * 24 * 60 * 60) {
  console.log('[WEBSESSION] helper called', {
    clientType: req.headers['x-client-type'],
    jti,
    userId: user.userId,
  });

  if (req.headers['x-client-type'] !== 'web') {
    console.log('[WEBSESSION] skipping — not a web client');
    return null;
  }

  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0].trim();

  console.log('[WEBSESSION] about to create row', {
    userId: user.userId,
    jti,
    ua: ua.slice(0, 60),
    ip,
  });

  try {
    const WebSessionController = require('./webSessionController');
    const uaParsed = WebSessionController.parseUserAgent(ua);

    const existing = await WebSession.findOne({ where: { sessionId: jti } });
    if (existing) {
      console.log('[WEBSESSION] row already exists for jti', jti);
      return existing;
    }

    const created = await WebSession.create({
      userId: user.userId,
      sessionId: jti,
      deviceId: req.body?.deviceId || req.headers['x-device-id'] || null,
      browser: uaParsed.browser,
      os: uaParsed.os,
      deviceName: `${uaParsed.browser} on ${uaParsed.os}`,
      userAgent: ua,
      ip,
      lastIp: ip,
      status: 'active',
      loggedInAt: new Date(),
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });

    console.log('[WEBSESSION] ✅ row created id=' + created.id + ' session=' + created.sessionId);
    return created;
  } catch (e) {
    console.error('[WEBSESSION] ❌ create failed:', e.message);
    console.error(e.stack);
    return null;
  }
}

// ============================================================================
// USER LOGIN - WITH COMPLETE USER DATA
// ============================================================================
exports.login = async (req, res) => {
  try {
    const { username, password, device } = req.body;

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
            'phoneNumber',
            'hireDateEC',
            'hireDateGC',
            'positionId',
            'employmentType',
            'employmentStatus',
            'dateOfBirthEC',
            'dateOfBirthGC',
            'gender',
            'maritalStatus',
            'nationality',
            'personalEmail',
            'workEmail',
            'emergencyContact',
            'currentAddress',
            'permanentAddress',
            'basicSalary',
            'bankAccount',
            'workLocation',
            'managerId'
          ]
        },
        // ✅ Get user's groups
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          attributes: ['groupId', 'name', 'code', 'description', 'status']
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
    const userGroups = user.groups || [];

    if (!roleName) {
      console.error('User has no role assigned:', user.userId);
      return res.status(500).json({
        success: false,
        error: 'User role not configured. Please contact administrator.'
      });
    }

    // ================================================================
    // ✅ DEVICE CHECK — only runs when the client sent a `device` object
    // ================================================================
    const deviceResult = await runDeviceCheck({ device, user, res });
    if (deviceResult.blocked) {
      return res.status(200).json(deviceResult.payload);
    }

    // ✅ GET THE STORE FOR EACH GROUP
    const groupsWithStores = [];
    let assignedStore = null;
    let assignedGroup = null;
    let isAdmin = ['admin', 'Admin', 'superadmin', 'Superadmin'].includes(roleName);

    if (!isAdmin && userGroups.length > 0) {
      // For non-admin users, find their store
      for (const group of userGroups) {
        const storeGroupRelation = await StoreGroupRelation.findOne({
          where: { groupId: group.groupId },
          include: [
            {
              model: Store,
              as: 'store',
              attributes: ['storeId', 'name', 'code', 'location', 'status']
            }
          ]
        });

        if (storeGroupRelation && storeGroupRelation.store) {
          const storeData = {
            id: storeGroupRelation.store.storeId,
            name: storeGroupRelation.store.name,
            code: storeGroupRelation.store.code,
            location: storeGroupRelation.store.location,
            status: storeGroupRelation.store.status
          };

          const groupData = {
            id: group.groupId,
            name: group.name,
            code: group.code,
            description: group.description,
            status: group.status
          };

          groupsWithStores.push({
            group: groupData,
            store: storeData
          });

          if (!assignedStore) {
            assignedStore = storeData;
            assignedGroup = groupData;
          }
        }
      }
    }

    // ✅ Generate a unique session id for this login
    const jti = crypto.randomUUID();

    // Generate tokens — jti is now included
    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        role: roleName,
        roleId: user.roleId,
        departmentId: user.departmentId,
        employeeId: employee?.employeeId,
        deviceId: device?.deviceId || null,
        jti,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId, jti },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Register web session (web clients only)
    await registerWebSessionIfNeeded(req, user, jti);

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

    // ✅ BUILD COMPLETE USER RESPONSE WITH GROUPS AND STORE
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
      dateOfBirthEC: employee?.dateOfBirthEC,
      dateOfBirthGC: employee?.dateOfBirthGC,
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
      hireDateEC: employee?.hireDateEC,
      hireDateGC: employee?.hireDateGC,
      employmentType: employee?.employmentType,
      employmentStatus: employee?.employmentStatus,
      basicSalary: employee?.basicSalary,
      bankAccount: employee?.bankAccount,
      workLocation: employee?.workLocation,

      // ✅ ===== GROUP & STORE ACCESS =====
      isAdmin: isAdmin,
      groups: userGroups.map(g => ({
        id: g.groupId,
        name: g.name,
        code: g.code,
        description: g.description,
        status: g.status
      })),
      assignedStore: assignedStore ? {
        id: assignedStore.id,
        name: assignedStore.name,
        code: assignedStore.code,
        location: assignedStore.location,
        status: assignedStore.status
      } : null,
      assignedGroup: assignedGroup ? {
        id: assignedGroup.id,
        name: assignedGroup.name,
        code: assignedGroup.code,
        description: assignedGroup.description,
        status: assignedGroup.status
      } : null,
      groupsWithStores: groupsWithStores,
      hasAccess: isAdmin || (assignedStore && assignedGroup)
    };

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      sessionId: jti,
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
        role: user.Role?.name,
        roleId: user.roleId,
        departmentId: user.departmentId,
        employeeId: user.employeeId,
        jti: decoded.jti,
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

// ============================================================================
// GET USERS WITH ADVANCED PAGINATION, FILTERS, AND SEARCH
// ============================================================================

exports.getUsers = async (req, res) => {
  try {
    if (!canViewUsers(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient privileges to view users.'
      });
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = '',
      role: roleName = 'all',
      status = 'all',
      department = 'all',
      dateFrom = '',
      dateTo = '',
      lastLoginFrom = '',
      lastLoginTo = '',
      employeeStatus = 'all'
    } = req.query;

    let whereCondition = {};

    const isAdminUser = isAdmin(req.user);
    if (!isAdminUser) {
      const adminRoles = await Role.findAll({
        where: {
          name: { [Op.in]: ['admin', 'Admin', 'superadmin', 'Superadmin'] }
        },
        attributes: ['roleId']
      });
      const adminRoleIds = adminRoles.map(r => r.roleId);

      if (adminRoleIds.length > 0) {
        whereCondition.roleId = { [Op.notIn]: adminRoleIds };
      }
    }

    if (roleName && roleName !== 'all') {
      const roleRecord = await Role.findOne({ where: { name: roleName } });
      if (roleRecord) {
        if (!isAdminUser) {
          const adminRoles = await Role.findAll({
            where: {
              name: { [Op.in]: ['admin', 'Admin', 'superadmin', 'Superadmin'] }
            },
            attributes: ['roleId']
          });
          const adminRoleIds = adminRoles.map(r => r.roleId);

          if (adminRoleIds.includes(roleRecord.roleId)) {
            return res.status(403).json({
              success: false,
              error: 'Access denied. You cannot view admin users.'
            });
          }
        }
        whereCondition.roleId = roleRecord.roleId;
      } else {
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

    if (status && status !== 'all') {
      whereCondition.isActive = status === 'active';
    }

    if (department && department !== 'all') {
      whereCondition.departmentId = parseInt(department);
    }

    if (search && search.trim()) {
      whereCondition[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (dateFrom) {
      whereCondition.created_at = { ...whereCondition.created_at, [Op.gte]: new Date(dateFrom) };
    }
    if (dateTo) {
      whereCondition.created_at = { ...whereCondition.created_at, [Op.lte]: new Date(dateTo) };
    }

    if (lastLoginFrom) {
      whereCondition.lastLogin = { ...whereCondition.lastLogin, [Op.gte]: new Date(lastLoginFrom) };
    }
    if (lastLoginTo) {
      whereCondition.lastLogin = { ...whereCondition.lastLogin, [Op.lte]: new Date(lastLoginTo) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = Math.min(parseInt(limit), 100);

    const allowedSortFields = ['userId', 'username', 'fullName', 'email', 'created_at', 'lastLogin', 'isActive'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    console.log('Where condition:', JSON.stringify(whereCondition, null, 2));

    const { count, rows: users } = await User.findAndCountAll({
      where: whereCondition,
      attributes: [
        'userId', 'username', 'email', 'fullName', 'isActive',
        'created_at', 'roleId', 'departmentId', 'lastLogin',
        'createdBy'                                       // ✅ ADDED
      ],
      include: [
        { model: Role, attributes: ['name', 'description'] },
        { model: Department, attributes: ['departmentId', 'name', 'code'] },
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

    // ✅ Collect unique creator IDs from this page
    const creatorIds = [...new Set(users.map(u => u.createdBy).filter(Boolean))];

    // ✅ Fetch creator names in a single query
    let creatorsMap = {};
    if (creatorIds.length > 0) {
      const creators = await User.findAll({
        where: { userId: { [Op.in]: creatorIds } },
        attributes: ['userId', 'fullName', 'username'],
        raw: true
      });
      creatorsMap = creators.reduce((acc, c) => {
        acc[c.userId] = c.fullName || c.username || `User #${c.userId}`;
        return acc;
      }, {});
    }

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
      createdBy: user.createdBy || null,                                       // ✅ ADDED
      createdByName: user.createdBy ? (creatorsMap[user.createdBy] || null) : null,  // ✅ ADDED
      isAdminRole: ['admin', 'Admin', 'superadmin', 'Superadmin'].includes(user.Role?.name),
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
    if (!canViewUsers(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient privileges to view user stats.'
      });
    }

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

      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

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
    if (!canViewUsers(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient privileges to search users.'
      });
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
// BULK UPDATE USERS  — mutation, keep strict
// ============================================================================
exports.bulkUpdateUsers = async (req, res) => {
  try {
    if (!isAdminOrChecker(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or Checker privileges required.'
      });
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
    if (!canViewUsers(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient privileges to export users.'
      });
    }

    const {
      format = 'json',
      role = 'all',
      status = 'all',
      department = 'all',
      search = ''
    } = req.query;

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
            'phoneNumber', 'hireDateEC', 'positionId', 'employmentType', 'employmentStatus',
            'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
            'personalEmail', 'workEmail', 'profilePictureUrl'
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isTargetAdmin = ['admin', 'Admin', 'superadmin', 'Superadmin'].includes(user.Role?.name);
    const isAdminUser = isAdmin(req.user);

    if (!isAdminUser && isTargetAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You cannot view admin users.'
      });
    }

    if (!canViewUsers(req.user) && req.user.userId !== user.userId) {
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
        isAdminRole: isTargetAdmin,
        employee: user.employee
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET ALL ROLES
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
// GET ALL DEPARTMENTS
// ============================================================================
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['departmentId', 'name', 'code', 'description', 'isActive'],
      order: [['departmentId', 'ASC']]
    });

    res.set('Cache-Control', 'private, max-age=300');
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET ALL POSITIONS
// ============================================================================
exports.getAllPositions = async (req, res) => {
  try {
    const positions = await Position.findAll({
      attributes: ['positionId', 'title','code','departmentId','level','minSalary','maxSalary','requirements','responsibilities','isActive'],
      order: [['positionId', 'ASC']]
    });

    res.set('Cache-Control', 'private, max-age=300');
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
    if (!canViewUsers(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient privileges to view filter options.'
      });
    }

    const [roles, departments, statuses, dateRange] = await Promise.all([
      Role.findAll({ attributes: ['roleId', 'name'], where: { isActive: true } }),
      Department.findAll({ attributes: ['departmentId', 'name'], where: { isActive: true } }),
      User.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('isActive')), 'status']], raw: true }),
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
// GET PROFILE
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
// CHANGE PASSWORD
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
// CREATE USER
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
// UPDATE USER
// ============================================================================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, roleId, departmentId, isActive, email, username } = req.body;

    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const isAdmin = ['admin', 'Admin', 'superadmin', 'Superadmin', 'checker', 'Checker'].includes(userRole);

    if (!isAdmin && parseInt(id) !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own profile.'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (username !== undefined && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username can only contain letters, numbers, and underscores'
        });
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Username must be between 3 and 50 characters'
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }

    if (!isAdmin) {
      if (roleId !== undefined && roleId !== user.roleId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only admins can change role.'
        });
      }
      if (departmentId !== undefined && departmentId !== user.departmentId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only admins can change department.'
        });
      }
      if (isActive !== undefined && isActive !== user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only admins can change account status.'
        });
      }
    } else {
      if (roleId) {
        const roleExists = await Role.findByPk(roleId);
        if (!roleExists) {
          return res.status(400).json({ success: false, error: 'Invalid role ID' });
        }
      }
    }

    const updateData = {};

    if (username !== undefined) updateData.username = username;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;

    if (isAdmin) {
      if (roleId !== undefined) updateData.roleId = roleId;
      if (departmentId !== undefined) updateData.departmentId = departmentId;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      include: [
        { model: Role, attributes: ['name'] },
        { model: Department, attributes: ['name'] }
      ]
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

    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

// ============================================================================
// RESET PASSWORD
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
// ACTIVATE USER
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
// DEACTIVATE USER
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
// TOGGLE USER STATUS
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

// ============================================================================
// GET STORES BY USERNAME
// ============================================================================
exports.getStoresByUsername = async (req, res) => {
  try {
    const { username } = req.body;

    console.log('========================================');
    console.log('📥 getStoresByUsername called with:', { username });
    console.log('========================================');

    if (!username || !username.trim()) {
      console.log('❌ Username is required');
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const result = await userStoreService.getUserStores(username.trim());

    console.log('📊 Result from userStoreService:');
    console.log('  success:', result.success);
    console.log('  hasAccess:', result.data?.hasAccess);
    console.log('  stores count:', result.data?.stores?.length);

    if (result.data?.stores) {
      console.log('  Stores:');
      result.data.stores.forEach((store, index) => {
        console.log(`    Store ${index + 1}:`);
        console.log(`      storeId: ${store.storeId}`);
        console.log(`      name: ${store.name}`);
        console.log(`      code: ${store.code}`);
        console.log(`      groups: ${store.groups?.length || 0}`);
        if (store.groups) {
          store.groups.forEach((group, gIndex) => {
            console.log(`        ${gIndex + 1}. ${group.groupName} (${group.groupCode})`);
          });
        }
      });
    }

    if (!result.success) {
      console.log('❌ Service returned error:', result.error);
      return res.status(404).json({
        success: false,
        error: result.error || 'User not found'
      });
    }

    const formattedStores = (result.data.stores || []).map(store => ({
      storeId: store.storeId,
      name: store.name,
      code: store.code,
      location: store.location || 'N/A',
      status: store.status || 'Active',
      groups: (store.groups || []).map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
        groupCode: group.groupCode,
        description: group.description || '',
        status: group.status || 'Active'
      }))
    }));

    console.log('📤 Final formatted response:');
    console.log('  stores count:', formattedStores.length);
    formattedStores.forEach((store, index) => {
      console.log(`  Store ${index + 1}:`);
      console.log(`    storeId: ${store.storeId}`);
      console.log(`    name: ${store.name}`);
      console.log(`    groups: ${store.groups.length}`);
    });
    console.log('========================================');

    res.status(200).json({
      success: true,
      data: {
        user: result.data.user,
        stores: formattedStores,
        hasAccess: result.data.hasAccess
      }
    });
  } catch (error) {
    console.error('❌ Get stores by username error:', error);
    console.error('❌ Error stack:', error.stack);
    console.log('========================================');
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// ============================================================================
// GET USER STORE GROUPS
// ============================================================================
exports.getUserStoreGroups = async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.userId;

    const result = await userStoreService.getUserGroupsForStore(userId, storeId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get user store groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// ============================================================================
// LOGIN WITH STORE
// ============================================================================
exports.loginWithStore = async (req, res) => {
  try {
    const { username, password, storeId, groupId, device } = req.body;

    console.log('========================================');
    console.log('🔐 loginWithStore request received:');
    console.log('  username:', username);
    console.log('  storeId:', storeId);
    console.log('  groupId:', groupId);
    console.log('  deviceId:', device?.deviceId || '(none)');
    console.log('========================================');

    // ================================================================
    // 1. VALIDATE REQUIRED FIELDS
    // ================================================================
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store selection is required'
      });
    }

    // ================================================================
    // 2. FIND USER WITH ALL RELATIONSHIPS
    // ================================================================
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: username }
        ],
        isActive: true
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
            'middleName', 'profilePicture', 'profilePictureUrl',
            'profilePicturePublicId',
            'phoneNumber', 'positionId', 'employmentStatus',
            'hireDateEC', 'hireDateGC', 'dateOfBirthEC', 'dateOfBirthGC',
            'gender', 'maritalStatus', 'nationality',
            'personalEmail', 'workEmail', 'emergencyContact',
            'currentAddress', 'permanentAddress', 'basicSalary',
            'bankAccount', 'workLocation', 'managerId'
          ]
        },
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          attributes: ['groupId', 'name', 'code', 'description', 'status']
        }
      ]
    });

    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // ================================================================
    // 3. VALIDATE PASSWORD
    // ================================================================
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // ================================================================
    // ✅ 3b. DEVICE CHECK — only runs when the client sent `device`
    // ================================================================
    const deviceResult = await runDeviceCheck({ device, user, res });
    if (deviceResult.blocked) {
      return res.status(200).json(deviceResult.payload);
    }

    // ================================================================
    // 4. CHECK IF USER IS ADMIN
    // ================================================================
    const roleName = user.Role?.name;
    const isAdmin = ['admin', 'Admin', 'superadmin', 'Superadmin'].includes(roleName);
    console.log('👑 isAdmin:', isAdmin, 'role:', roleName);

    // ================================================================
    // 5. VERIFY STORE ACCESS
    // ================================================================
    let store = null;
    let selectedGroup = null;
    let groupsForStore = [];

    console.log('📤 Fetching store with ID:', storeId);

    store = await Store.findByPk(storeId, {
      attributes: ['storeId', 'name', 'code', 'location', 'status']
    });

    console.log('📦 Store fetched:', store ? {
      storeId: store.storeId,
      name: store.name,
      code: store.code
    } : 'Not found');

    const actualStoreId = store ? store.storeId : null;
    console.log('✅ actualStoreId:', actualStoreId);

    if (isAdmin) {
      if (!store) {
        console.log('❌ Store not found for admin:', storeId);
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }

      if (groupId) {
        selectedGroup = await Group.findByPk(groupId, {
          attributes: ['groupId', 'name', 'code', 'description', 'status']
        });
        if (selectedGroup) {
          groupsForStore = [selectedGroup];
        }
      } else {
        const storeGroups = await StoreGroupRelation.findAll({
          where: { storeId: storeId },
          include: [
            {
              model: Group,
              as: 'group',
              attributes: ['groupId', 'name', 'code', 'description', 'status']
            }
          ]
        });
        groupsForStore = storeGroups.map(sg => sg.group).filter(g => g);
        if (groupsForStore.length > 0) {
          selectedGroup = groupsForStore[0];
        }
      }
    } else {
      console.log('📤 Verifying store access for user:', user.userId, 'store:', storeId);
      const accessResult = await userStoreService.verifyStoreAccess(user.userId, storeId);

      console.log('📊 verifyStoreAccess result:', {
        success: accessResult.success,
        hasAccess: accessResult.hasAccess,
        groupsCount: accessResult.groups?.length || 0
      });

      if (!accessResult.success || !accessResult.hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'You do not have access to this store'
        });
      }

      groupsForStore = accessResult.groups || [];

      if (!store) {
        console.log('❌ Store not found for non-admin:', storeId);
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }

      if (groupId) {
        selectedGroup = groupsForStore.find(g => {
          const gId = g.id || g.groupId;
          return gId === parseInt(groupId);
        });

        if (!selectedGroup) {
          console.error('❌ Group not found in store access:', {
            groupId,
            availableGroups: groupsForStore.map(g => g.id || g.groupId)
          });
          return res.status(403).json({
            success: false,
            error: 'You do not have access to this group in the selected store'
          });
        }
      } else {
        selectedGroup = groupsForStore[0] || null;
      }

      if (!selectedGroup) {
        return res.status(403).json({
          success: false,
          error: 'No group assigned for this store'
        });
      }
    }

    // ================================================================
    // 6. GET THE ACTUAL IDs
    // ================================================================
    const actualGroupId = selectedGroup?.id || selectedGroup?.groupId || null;
    const actualGroupName = selectedGroup?.name || null;
    const actualGroupCode = selectedGroup?.code || null;

    console.log('✅ Final selected IDs:', {
      storeId: actualStoreId,
      groupId: actualGroupId,
      storeName: store?.name,
      groupName: actualGroupName
    });

    // ================================================================
    // 7. GENERATE JWT TOKENS — jti included for web session tracking
    // ================================================================
    const jti = crypto.randomUUID();

    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        role: roleName,
        roleId: user.roleId,
        departmentId: user.departmentId,
        employeeId: user.employee?.employeeId,
        storeId: actualStoreId,
        groupId: actualGroupId,
        isAdmin: isAdmin,
        deviceId: device?.deviceId || null,
        jti,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId, jti },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // ✅ Register web session (web clients only)
    await registerWebSessionIfNeeded(req, user, jti);

    await user.update({ lastLogin: new Date() });

    // ================================================================
    // 8. BUILD PROFILE PICTURE URL
    // ================================================================
    const employee = user.employee;
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

    // ================================================================
    // 9. BUILD USER RESPONSE WITH COMPLETE DATA
    // ================================================================
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
      departmentName: user.Department?.name,
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
      dateOfBirthEC: employee?.dateOfBirthEC,
      dateOfBirthGC: employee?.dateOfBirthGC,
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
      hireDateEC: employee?.hireDateEC,
      hireDateGC: employee?.hireDateGC,
      employmentType: employee?.employmentType,
      employmentStatus: employee?.employmentStatus,
      basicSalary: employee?.basicSalary,
      bankAccount: employee?.bankAccount,
      workLocation: employee?.workLocation,

      storeId: actualStoreId,
      storeName: store?.name || null,
      storeCode: store?.code || null,
      groupId: actualGroupId,
      groupName: actualGroupName,
      groupCode: actualGroupCode,

      currentStore: store ? {
        id: actualStoreId,
        name: store.name,
        code: store.code,
        location: store.location || '',
        status: store.status || 'Active'
      } : null,
      currentGroup: selectedGroup ? {
        id: actualGroupId,
        name: actualGroupName,
        code: actualGroupCode,
        description: selectedGroup.description || '',
        status: selectedGroup.status || 'Active'
      } : null,

      isAdmin: isAdmin,

      groupsForStore: groupsForStore.map(g => ({
        id: g.id || g.groupId,
        name: g.name,
        code: g.code,
        description: g.description || '',
        status: g.status || 'Active'
      })),

      groups: user.groups ? user.groups.map(g => ({
        id: g.groupId,
        name: g.name,
        code: g.code,
        description: g.description,
        status: g.status
      })) : [],

      stores: store ? [{
        id: actualStoreId,
        name: store.name,
        code: store.code,
        location: store.location || '',
        status: store.status || 'Active'
      }] : [],

      hasMultipleStores: false,

      assignedStore: store ? {
        id: actualStoreId,
        name: store.name,
        code: store.code,
        location: store.location || ''
      } : null,
      assignedGroup: selectedGroup ? {
        id: actualGroupId,
        name: actualGroupName,
        code: actualGroupCode
      } : null,

      hasAccess: isAdmin || (store && actualGroupId)
    };

    // ================================================================
    // 10. LOG THE FINAL RESPONSE
    // ================================================================
    console.log('========================================');
    console.log('📤 FINAL USER RESPONSE DATA:');
    console.log('  userId:', userResponse.userId);
    console.log('  username:', userResponse.username);
    console.log('  storeId (direct):', userResponse.storeId);
    console.log('  groupId (direct):', userResponse.groupId);
    console.log('  storeName:', userResponse.storeName);
    console.log('  groupName:', userResponse.groupName);
    console.log('  isAdmin:', userResponse.isAdmin);
    console.log('========================================');

    console.log('✅ LoginWithStore successful for user:', user.username);
    console.log('📦 Store ID sent:', actualStoreId, 'Group ID sent:', actualGroupId);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      sessionId: jti,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login with store error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during login'
    });
  }
};



// ============================================================================
// SAVE PUSH TOKEN
// POST /api/users/push-token
// Body: { token, platform, deviceName?, appVersion? }
//
// Upserts into push_tokens. If the same physical device logs in as a different
// user, the token row is reassigned to the new user automatically (token is
// unique across the table).
// ============================================================================
exports.savePushToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { token, platform, deviceName, appVersion } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No authenticated user',
      });
    }

    if (!token || typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Invalid push token',
      });
    }

    // Find by token — token is globally unique
    const existing = await PushToken.findOne({ where: { token } });

    if (existing) {
      await existing.update({
        userId,                                          // reassign if needed
        platform: platform || existing.platform,
        deviceName: deviceName || existing.deviceName,
        appVersion: appVersion || existing.appVersion,
        isActive: true,
        lastUsedAt: new Date(),
      });

      console.log(
        `♻️ Push token updated — user ${userId} (${platform || 'unknown'})`
      );

      return res.status(200).json({
        success: true,
        message: 'Push token updated',
        data: { id: existing.id },
      });
    }

    const row = await PushToken.create({
      userId,
      token,
      platform: platform || null,
      deviceName: deviceName || null,
      appVersion: appVersion || null,
      isActive: true,
      lastUsedAt: new Date(),
    });

    console.log(
      `✅ Push token registered — user ${userId} (${platform || 'unknown'})`
    );

    res.status(200).json({
      success: true,
      message: 'Push token registered',
      data: { id: row.id },
    });
  } catch (error) {
    console.error('❌ savePushToken error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

// ============================================================================
// CLEAR PUSH TOKEN (on logout)
// DELETE /api/users/push-token
// Body: { token }
//
// Marks the specific token inactive. If no token is passed, marks ALL of the
// user's tokens inactive ("log out everywhere").
// ============================================================================
exports.clearPushToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No authenticated user',
      });
    }

    if (!token) {
      // Deactivate every token this user owns
      await PushToken.update(
        { isActive: false },
        { where: { userId } }
      );
      console.log(`🚫 All push tokens deactivated — user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'All tokens deactivated',
      });
    }

    const row = await PushToken.findOne({ where: { token, userId } });
    if (!row) {
      return res.status(200).json({
        success: true,
        message: 'Token not found or already inactive',
      });
    }

    await row.update({ isActive: false });
    console.log(`🚫 Push token deactivated — user ${userId}`);
    res.status(200).json({ success: true, message: 'Token deactivated' });
  } catch (error) {
    console.error('❌ clearPushToken error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};