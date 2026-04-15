const { Employee, Department, Position, User, EmployeeDocument, Role, SystemSetting, sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');

// ============================================================================
// ROLES CONTROLLER
// ============================================================================

// GET ALL ROLES
exports.getAllRoles = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = false } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (!includeInactive) where.isActive = true;
    
    const roles = await Role.findAndCountAll({
      where,
      attributes: ['roleId', 'name', 'description', 'isActive', 'created_at', 'updated_at'],
      order: [['roleId', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Get user count for each role
    const rolesWithCount = await Promise.all(
      roles.rows.map(async (role) => {
        const userCount = await User.count({ where: { roleId: role.roleId } });
        return {
          ...role.toJSON(),
          userCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: rolesWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: roles.count,
        totalPages: Math.ceil(roles.count / limit)
      }
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// GET ROLE BY ID
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id, {
      attributes: ['roleId', 'name', 'description', 'isActive', 'created_at', 'updated_at']
    });
    
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    
    const userCount = await User.count({ where: { roleId: role.roleId } });
    
    res.status(200).json({
      success: true,
      data: { ...role.toJSON(), userCount }
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// CREATE ROLE
exports.createRole = async (req, res) => {
  try {
    const { name, description, isActive = true } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }
    
    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name: name.toLowerCase() } });
    if (existingRole) {
      return res.status(400).json({ success: false, error: 'Role already exists' });
    }
    
    const role = await Role.create({
      name: name.toLowerCase(),
      description,
      isActive
    });
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// UPDATE ROLE
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    
    // Check if name is taken by another role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name: name.toLowerCase() } });
      if (existingRole) {
        return res.status(400).json({ success: false, error: 'Role name already exists' });
      }
      role.name = name.toLowerCase();
    }
    
    if (description !== undefined) role.description = description;
    if (isActive !== undefined) role.isActive = isActive;
    
    await role.save();
    
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// TOGGLE ROLE STATUS (Activate/Deactivate)
exports.toggleRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    
    role.isActive = isActive;
    await role.save();
    
    res.status(200).json({
      success: true,
      message: `Role ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { roleId: role.roleId, isActive: role.isActive }
    });
  } catch (error) {
    console.error('Toggle role status error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// DELETE ROLE
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    
    // Check if role has users assigned
    const userCount = await User.count({ where: { roleId: id } });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete role with ${userCount} users assigned. Deactivate it instead.`
      });
    }
    
    await role.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// DEPARTMENTS CONTROLLER
// ============================================================================

// GET ALL DEPARTMENTS
exports.getAllDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = false } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (!includeInactive) where.isActive = true;
    
    const departments = await Department.findAndCountAll({
      where,
      attributes: ['departmentId', 'code', 'name', 'description', 'managerId', 'parentDepartmentId', 'budget', 'location', 'isActive', 'created_at', 'updated_at'],
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['userId', 'fullName', 'email']
        },
        {
          model: Department,
          as: 'parent',
          attributes: ['departmentId', 'name', 'code']
        }
      ],
      order: [['departmentId', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.rows.map(async (dept) => {
        const employeeCount = await Employee.count({ where: { departmentId: dept.departmentId } });
        return {
          ...dept.toJSON(),
          employeeCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: departmentsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: departments.count,
        totalPages: Math.ceil(departments.count / limit)
      }
    });
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// GET DEPARTMENT BY ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id, {
      attributes: ['departmentId', 'code', 'name', 'description', 'managerId', 'parentDepartmentId', 'budget', 'location', 'isActive', 'created_at', 'updated_at'],
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['userId', 'fullName', 'email']
        },
        {
          model: Department,
          as: 'parent',
          attributes: ['departmentId', 'name', 'code']
        },
        {
          model: Department,
          as: 'subDepartments',
          attributes: ['departmentId', 'name', 'code'],
          where: { isActive: true },
          required: false
        }
      ]
    });
    
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    const employeeCount = await Employee.count({ where: { departmentId: department.departmentId } });
    const positionCount = await Position.count({ where: { departmentId: department.departmentId } });
    
    res.status(200).json({
      success: true,
      data: {
        ...department.toJSON(),
        employeeCount,
        positionCount
      }
    });
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
  try {
    const { code, name, description, managerId, parentDepartmentId, budget, location, isActive = true } = req.body;
    
    // Validate required fields
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Department code and name are required' });
    }
    
    // Check if code already exists
    const existingDept = await Department.findOne({ where: { code } });
    if (existingDept) {
      return res.status(400).json({ success: false, error: 'Department code already exists' });
    }
    
    // Check if parent department exists
    if (parentDepartmentId) {
      const parentDept = await Department.findByPk(parentDepartmentId);
      if (!parentDept) {
        return res.status(400).json({ success: false, error: 'Parent department not found' });
      }
    }
    
    // Check if manager exists
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({ success: false, error: 'Manager not found' });
      }
    }
    
    const department = await Department.create({
      code,
      name,
      description,
      managerId,
      parentDepartmentId,
      budget: budget || 0,
      location,
      isActive
    });
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, managerId, parentDepartmentId, budget, location, isActive } = req.body;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    // Check if code is taken by another department
    if (code && code !== department.code) {
      const existingDept = await Department.findOne({ where: { code } });
      if (existingDept) {
        return res.status(400).json({ success: false, error: 'Department code already exists' });
      }
      department.code = code;
    }
    
    // Check if parent department exists and not self
    if (parentDepartmentId) {
      if (parentDepartmentId === department.departmentId) {
        return res.status(400).json({ success: false, error: 'Department cannot be its own parent' });
      }
      const parentDept = await Department.findByPk(parentDepartmentId);
      if (!parentDept) {
        return res.status(400).json({ success: false, error: 'Parent department not found' });
      }
      department.parentDepartmentId = parentDepartmentId;
    } else {
      department.parentDepartmentId = null;
    }
    
    // Check if manager exists
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({ success: false, error: 'Manager not found' });
      }
      department.managerId = managerId;
    } else {
      department.managerId = null;
    }
    
    if (name) department.name = name;
    if (description !== undefined) department.description = description;
    if (budget !== undefined) department.budget = budget;
    if (location !== undefined) department.location = location;
    if (isActive !== undefined) department.isActive = isActive;
    
    await department.save();
    
    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// TOGGLE DEPARTMENT STATUS
exports.toggleDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    department.isActive = isActive;
    await department.save();
    
    // Also update sub-departments if deactivating?
    if (!isActive) {
      await Department.update(
        { isActive: false },
        { where: { parentDepartmentId: id } }
      );
    }
    
    res.status(200).json({
      success: true,
      message: `Department ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { departmentId: department.departmentId, isActive: department.isActive }
    });
  } catch (error) {
    console.error('Toggle department status error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// DELETE DEPARTMENT
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    // Check if department has employees
    const employeeCount = await Employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${employeeCount} employees. Deactivate it instead.`
      });
    }
    
    // Check if department has sub-departments
    const subDeptCount = await Department.count({ where: { parentDepartmentId: id } });
    if (subDeptCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${subDeptCount} sub-departments. Deactivate it instead.`
      });
    }
    
    // Check if department has positions
    const positionCount = await Position.count({ where: { departmentId: id } });
    if (positionCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${positionCount} positions. Deactivate it instead.`
      });
    }
    
    await department.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// POSITIONS CONTROLLER
// ============================================================================

// GET ALL POSITIONS
exports.getAllPositions = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = false, departmentId } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (!includeInactive) where.isActive = true;
    if (departmentId) where.departmentId = parseInt(departmentId);
    
    const positions = await Position.findAndCountAll({
      where,
      attributes: ['positionId', 'code', 'title', 'departmentId', 'level', 'minSalary', 'maxSalary', 'requirements', 'responsibilities', 'isActive', 'created_at', 'updated_at'],
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'name', 'code']
        }
      ],
      order: [['positionId', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Get employee count for each position
    const positionsWithCount = await Promise.all(
      positions.rows.map(async (position) => {
        const employeeCount = await Employee.count({ where: { positionId: position.positionId } });
        return {
          ...position.toJSON(),
          employeeCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: positionsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: positions.count,
        totalPages: Math.ceil(positions.count / limit)
      }
    });
  } catch (error) {
    console.error('Get all positions error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// GET POSITION BY ID
exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const position = await Position.findByPk(id, {
      attributes: ['positionId', 'code', 'title', 'departmentId', 'level', 'minSalary', 'maxSalary', 'requirements', 'responsibilities', 'isActive', 'created_at', 'updated_at'],
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'name', 'code']
        }
      ]
    });
    
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }
    
    const employeeCount = await Employee.count({ where: { positionId: position.positionId } });
    
    res.status(200).json({
      success: true,
      data: {
        ...position.toJSON(),
        employeeCount
      }
    });
  } catch (error) {
    console.error('Get position by ID error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// CREATE POSITION
exports.createPosition = async (req, res) => {
  try {
    const { code, title, departmentId, level, minSalary, maxSalary, requirements, responsibilities, isActive = true } = req.body;
    
    // Validate required fields
    if (!code || !title) {
      return res.status(400).json({ success: false, error: 'Position code and title are required' });
    }
    
    // Check if code already exists
    const existingPosition = await Position.findOne({ where: { code } });
    if (existingPosition) {
      return res.status(400).json({ success: false, error: 'Position code already exists' });
    }
    
    // Check if department exists
    if (departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({ success: false, error: 'Department not found' });
      }
    }
    
    // Validate salary range
    if (minSalary && maxSalary && parseFloat(maxSalary) < parseFloat(minSalary)) {
      return res.status(400).json({ success: false, error: 'Maximum salary must be greater than minimum salary' });
    }
    
    const position = await Position.create({
      code,
      title,
      departmentId,
      level,
      minSalary: minSalary || 0,
      maxSalary: maxSalary || 0,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      isActive
    });
    
    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: position
    });
  } catch (error) {
    console.error('Create position error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// UPDATE POSITION
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, departmentId, level, minSalary, maxSalary, requirements, responsibilities, isActive } = req.body;
    
    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }
    
    // Check if code is taken by another position
    if (code && code !== position.code) {
      const existingPosition = await Position.findOne({ where: { code } });
      if (existingPosition) {
        return res.status(400).json({ success: false, error: 'Position code already exists' });
      }
      position.code = code;
    }
    
    // Check if department exists
    if (departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({ success: false, error: 'Department not found' });
      }
      position.departmentId = departmentId;
    }
    
    // Validate salary range
    if (minSalary !== undefined && maxSalary !== undefined) {
      if (parseFloat(maxSalary) < parseFloat(minSalary)) {
        return res.status(400).json({ success: false, error: 'Maximum salary must be greater than minimum salary' });
      }
      position.minSalary = minSalary;
      position.maxSalary = maxSalary;
    } else if (minSalary !== undefined) {
      position.minSalary = minSalary;
    } else if (maxSalary !== undefined) {
      position.maxSalary = maxSalary;
    }
    
    if (title) position.title = title;
    if (level !== undefined) position.level = level;
    if (requirements) position.requirements = requirements;
    if (responsibilities) position.responsibilities = responsibilities;
    if (isActive !== undefined) position.isActive = isActive;
    
    await position.save();
    
    res.status(200).json({
      success: true,
      message: 'Position updated successfully',
      data: position
    });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// TOGGLE POSITION STATUS
exports.togglePositionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }
    
    position.isActive = isActive;
    await position.save();
    
    res.status(200).json({
      success: true,
      message: `Position ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { positionId: position.positionId, isActive: position.isActive }
    });
  } catch (error) {
    console.error('Toggle position status error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// DELETE POSITION
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    
    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }
    
    // Check if position has employees
    const employeeCount = await Employee.count({ where: { positionId: id } });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete position with ${employeeCount} employees. Deactivate it instead.`
      });
    }
    
    await position.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Position deleted successfully'
    });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// SYSTEM SETTINGS CONTROLLER
// ============================================================================

// GET ALL SYSTEM SETTINGS
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({
      attributes: ['settingId', 'settingKey', 'settingValue', 'category', 'description', 'dataType', 'isEditable', 'version', 'updated_at'],
      order: [['category', 'ASC'], ['settingKey', 'ASC']]
    });
    
    // Group by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) acc[category] = {};
      acc[category][setting.settingKey] = setting.settingValue;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: settings,
      grouped: groupedSettings
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// GET SETTING BY KEY
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await SystemSetting.findOne({
      where: { settingKey: key }
    });
    
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Get setting by key error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// CREATE OR UPDATE SETTING
exports.upsertSetting = async (req, res) => {
  try {
    const { key, value, category, description, dataType } = req.body;
    const userId = req.user?.userId;
    
    if (!key) {
      return res.status(400).json({ success: false, error: 'Setting key is required' });
    }
    
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { settingKey: key },
      defaults: {
        settingKey: key,
        settingValue: value || {},
        category: category || 'general',
        description: description || null,
        dataType: dataType || 'json',
        updatedBy: userId,
        isEditable: true
      }
    });
    
    if (!created) {
      if (!setting.isEditable) {
        return res.status(403).json({ success: false, error: 'This setting is not editable' });
      }
      
      setting.settingValue = value;
      if (category) setting.category = category;
      if (description) setting.description = description;
      if (dataType) setting.dataType = dataType;
      setting.updatedBy = userId;
      await setting.save();
    }
    
    res.status(200).json({
      success: true,
      message: created ? 'Setting created successfully' : 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// UPDATE MULTIPLE SETTINGS (Batch Update)
exports.batchUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user?.userId;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object is required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const [key, value] of Object.entries(settings)) {
      try {
        const setting = await SystemSetting.findOne({ where: { settingKey: key } });
        
        if (!setting) {
          errors.push({ key, error: 'Setting not found' });
          continue;
        }
        
        if (!setting.isEditable) {
          errors.push({ key, error: 'Setting is not editable' });
          continue;
        }
        
        setting.settingValue = value;
        setting.updatedBy = userId;
        await setting.save();
        
        results.push({ key, success: true });
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Updated ${results.length} settings, ${errors.length} failed`,
      results,
      errors
    });
  } catch (error) {
    console.error('Batch update settings error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// DELETE SETTING
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await SystemSetting.findOne({ where: { settingKey: key } });
    
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    if (!setting.isEditable) {
      return res.status(403).json({ success: false, error: 'This setting is not deletable' });
    }
    
    await setting.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// GET ATTENDANCE RULES (Specialized)
exports.getAttendanceRules = async (req, res) => {
  try {
    let attendanceRules = await SystemSetting.findOne({
      where: { settingKey: 'attendance.rules' }
    });
    
    if (!attendanceRules) {
      // Return default rules if not found
      const defaultRules = SystemSetting.getDefaultAttendanceRules();
      return res.status(200).json({
        success: true,
        data: defaultRules,
        isDefault: true
      });
    }
    
    res.status(200).json({
      success: true,
      data: attendanceRules.settingValue,
      isDefault: false,
      version: attendanceRules.version,
      lastUpdated: attendanceRules.updated_at
    });
  } catch (error) {
    console.error('Get attendance rules error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// UPDATE ATTENDANCE RULES (Specialized)
exports.updateAttendanceRules = async (req, res) => {
  try {
    const rules = req.body;
    const userId = req.user?.userId;
    
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { settingKey: 'attendance.rules' },
      defaults: {
        settingKey: 'attendance.rules',
        settingValue: rules,
        category: 'attendance',
        description: 'Complete attendance rules configuration',
        dataType: 'json',
        updatedBy: userId,
        isEditable: true
      }
    });
    
    if (!created) {
      if (!setting.isEditable) {
        return res.status(403).json({ success: false, error: 'Attendance rules are not editable' });
      }
      
      setting.settingValue = rules;
      setting.updatedBy = userId;
      await setting.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance rules updated successfully',
      data: setting,
      version: setting.version
    });
  } catch (error) {
    console.error('Update attendance rules error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// GET DEPARTMENT TREE (Hierarchy)
exports.getDepartmentTree = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      attributes: ['departmentId', 'code', 'name', 'parentDepartmentId', 'managerId', 'location'],
      order: [['name', 'ASC']]
    });
    
    // Build tree structure
    const buildTree = (parentId = null) => {
      return departments
        .filter(dept => dept.parentDepartmentId === parentId)
        .map(dept => ({
          ...dept.toJSON(),
          children: buildTree(dept.departmentId)
        }));
    };
    
    const tree = buildTree();
    
    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get department tree error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// GET DEPARTMENT STATISTICS
exports.getDepartmentStatistics = async (req, res) => {
  try {
    const stats = await Department.findAll({
      attributes: [
        'departmentId',
        'name',
        'code',
        [sequelize.fn('COUNT', sequelize.col('Employees.employeeId')), 'employeeCount']
      ],
      include: [
        {
          model: Employee,
          attributes: [],
          required: false
        }
      ],
      group: ['Department.departmentId'],
      raw: true
    });
    
    const totalEmployees = await Employee.count();
    const activeDepartments = await Department.count({ where: { isActive: true } });
    
    res.status(200).json({
      success: true,
      data: {
        departments: stats,
        summary: {
          totalDepartments: await Department.count(),
          activeDepartments,
          totalEmployees,
          avgEmployeesPerDept: activeDepartments > 0 ? (totalEmployees / activeDepartments).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get department statistics error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};