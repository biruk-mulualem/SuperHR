// controllers/attendance/overridesController.js
const { 
  Employee, 
  Department,
  CompanyShiftDefault,
  DepartmentOverride,      
  EmployeeOverride        
} = require('../../models');

// ============================================================================
// COMPANY SHIFT DEFAULTS CRUD
// ============================================================================

exports.getCompanyDefaults = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const defaults = await CompanyShiftDefault.findAll({
      order: [['shiftType', 'ASC'], ['effectiveFrom', 'DESC']]
    });
    res.status(200).json({ success: true, data: defaults });
  } catch (error) {
    console.error('Get company defaults error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCompanyDefaultById = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const companyDefault = await CompanyShiftDefault.findByPk(req.params.id);
    if (!companyDefault) return res.status(404).json({ success: false, error: 'Company default not found' });
    res.status(200).json({ success: true, data: companyDefault });
  } catch (error) {
    console.error('Get company default error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCompanyDefault = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const companyDefault = await CompanyShiftDefault.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json({ success: true, data: companyDefault });
  } catch (error) {
    console.error('Create company default error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateCompanyDefault = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const companyDefault = await CompanyShiftDefault.findByPk(req.params.id);
    if (!companyDefault) return res.status(404).json({ success: false, error: 'Company default not found' });
    await companyDefault.update(req.body);
    res.status(200).json({ success: true, data: companyDefault });
  } catch (error) {
    console.error('Update company default error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteCompanyDefault = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const companyDefault = await CompanyShiftDefault.findByPk(req.params.id);
    if (!companyDefault) return res.status(404).json({ success: false, error: 'Company default not found' });
    await companyDefault.update({ isActive: false });
    res.status(200).json({ success: true, message: 'Company default deactivated successfully' });
  } catch (error) {
    console.error('Delete company default error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// DEPARTMENT OVERRIDES CRUD
// ============================================================================

exports.getDepartmentOverrides = async (req, res) => {
  try {
    const { departmentId, shiftType } = req.query;
    const where = {};
    
    if (departmentId && departmentId !== 'undefined' && departmentId !== '') {
      where.departmentId = parseInt(departmentId);
    }
    if (shiftType && shiftType !== 'undefined' && shiftType !== '') {
      where.shiftType = shiftType;
    }
    
    const overrides = await DepartmentOverride.findAll({
      where,
      include: [{ 
        model: Department, 
        as: 'department', 
        attributes: ['departmentId', 'name'] 
      }],
      order: [['departmentId', 'ASC'], ['effectiveFrom', 'DESC']]
    });
    
    const formattedOverrides = overrides.map(override => ({
      id: override.id,
      departmentId: override.departmentId,
      departmentName: override.department?.name || 'Unknown',
      shiftType: override.shiftType,
      checkInTime: override.checkInTime,
      checkOutTime: override.checkOutTime,
      lunchDurationMinutes: override.lunchDurationMinutes,
      dinnerDurationMinutes: override.dinnerDurationMinutes,
      dinnerStartTime: override.dinnerStartTime,
      overtimeAfterTime: override.overtimeAfterTime,
      effectiveFrom: override.effectiveFrom,
      effectiveTo: override.effectiveTo
    }));
    
    res.status(200).json({ 
      success: true, 
      data: formattedOverrides 
    });
  } catch (error) {
    console.error('Get department overrides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDepartmentOverrideById = async (req, res) => {
  try {
    const override = await DepartmentOverride.findByPk(req.params.id, {
      include: [{ model: Department, as: 'department', attributes: ['name'] }]
    });
    if (!override) return res.status(404).json({ success: false, error: 'Department override not found' });
    res.status(200).json({ success: true, data: override });
  } catch (error) {
    console.error('Get department override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createDepartmentOverride = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const { departmentId, shiftType, checkInTime, checkOutTime, lunchDurationMinutes, dinnerDurationMinutes, dinnerStartTime, overtimeAfterTime, effectiveFrom, effectiveTo } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'Department ID is required' });
    }
    
    if (lunchDurationMinutes && lunchDurationMinutes > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lunch duration cannot exceed 180 minutes' 
      });
    }
    
    const existing = await DepartmentOverride.findOne({
      where: { departmentId, shiftType: shiftType || 'day' }
    });
    
    if (existing) {
      return res.status(400).json({ success: false, error: 'This department already has an override. Please edit the existing one.' });
    }
    
    const override = await DepartmentOverride.create({
      departmentId,
      shiftType: shiftType || 'day',
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      lunchDurationMinutes: lunchDurationMinutes || null,
      dinnerDurationMinutes: dinnerDurationMinutes || null,
      dinnerStartTime: dinnerStartTime || null,
      overtimeAfterTime: overtimeAfterTime || null,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo: effectiveTo || null,
      createdBy: req.user.userId
    });
    
    const dept = await Department.findByPk(departmentId);
    
    res.status(201).json({ 
      success: true, 
      data: {
        id: override.id,
        departmentId: override.departmentId,
        departmentName: dept?.name || 'Unknown',
        shiftType: override.shiftType,
        checkInTime: override.checkInTime,
        checkOutTime: override.checkOutTime,
        lunchDurationMinutes: override.lunchDurationMinutes,
        dinnerDurationMinutes: override.dinnerDurationMinutes,
        dinnerStartTime: override.dinnerStartTime,
        overtimeAfterTime: override.overtimeAfterTime,
        effectiveFrom: override.effectiveFrom,
        effectiveTo: override.effectiveTo
      }
    });
  } catch (error) {
    console.error('Create department override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDepartmentOverride = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const override = await DepartmentOverride.findByPk(req.params.id);
    if (!override) {
      return res.status(404).json({ success: false, error: 'Department override not found' });
    }
    
    if (req.body.lunchDurationMinutes && req.body.lunchDurationMinutes > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lunch duration cannot exceed 180 minutes' 
      });
    }
    
    await override.update(req.body);
    
    const dept = await Department.findByPk(override.departmentId);
    
    res.status(200).json({ 
      success: true, 
      data: {
        id: override.id,
        departmentId: override.departmentId,
        departmentName: dept?.name || 'Unknown',
        shiftType: override.shiftType,
        checkInTime: override.checkInTime,
        checkOutTime: override.checkOutTime,
        lunchDurationMinutes: override.lunchDurationMinutes,
        dinnerDurationMinutes: override.dinnerDurationMinutes,
        dinnerStartTime: override.dinnerStartTime,
        overtimeAfterTime: override.overtimeAfterTime,
        effectiveFrom: override.effectiveFrom,
        effectiveTo: override.effectiveTo
      }
    });
  } catch (error) {
    console.error('Update department override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteDepartmentOverride = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const override = await DepartmentOverride.findByPk(req.params.id);
    if (!override) return res.status(404).json({ success: false, error: 'Department override not found' });
    await override.destroy();
    res.status(200).json({ success: true, message: 'Department override deleted successfully' });
  } catch (error) {
    console.error('Delete department override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// EMPLOYEE OVERRIDES CRUD
// ============================================================================

exports.getEmployeeOverrides = async (req, res) => {
  try {
    const { employeeId, shiftType } = req.query;
    const where = {};
    
    if (employeeId && employeeId !== 'undefined' && employeeId !== '') {
      where.employeeId = parseInt(employeeId);
    }
    if (shiftType && shiftType !== 'undefined' && shiftType !== '') {
      where.shiftType = shiftType;
    }
    
    const overrides = await EmployeeOverride.findAll({
      where,
      include: [{ 
        model: Employee, 
        as: 'employee',
        attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode', 'departmentId']
      }],
      order: [['employeeId', 'ASC'], ['effectiveFrom', 'DESC']]
    });
    
    const departmentIds = [...new Set(overrides.map(o => o.employee?.departmentId).filter(Boolean))];
    const departments = await Department.findAll({
      where: { departmentId: departmentIds },
      attributes: ['departmentId', 'name']
    });
    const deptMap = {};
    departments.forEach(d => { deptMap[d.departmentId] = d.name; });
    
    const formattedOverrides = overrides.map(override => ({
      id: override.id,
      employeeId: override.employeeId,
      employeeName: override.employee ? `${override.employee.firstName} ${override.employee.lastName}` : 'Unknown',
      departmentName: deptMap[override.employee?.departmentId] || 'Unknown',
      shiftType: override.shiftType,
      checkInTime: override.checkInTime,
      checkOutTime: override.checkOutTime,
      lunchDurationMinutes: override.lunchDurationMinutes,
      dinnerDurationMinutes: override.dinnerDurationMinutes,
      dinnerStartTime: override.dinnerStartTime,
      overtimeAfterTime: override.overtimeAfterTime,
      effectiveFrom: override.effectiveFrom,
      effectiveTo: override.effectiveTo
    }));
    
    res.status(200).json({ 
      success: true, 
      data: formattedOverrides 
    });
  } catch (error) {
    console.error('Get employee overrides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getEmployeeOverrideById = async (req, res) => {
  try {
    const override = await EmployeeOverride.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeCode'] }]
    });
    if (!override) return res.status(404).json({ success: false, error: 'Employee override not found' });
    res.status(200).json({ success: true, data: override });
  } catch (error) {
    console.error('Get employee override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createEmployeeOverride = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const { employeeId, shiftType, checkInTime, checkOutTime, lunchDurationMinutes, dinnerDurationMinutes, dinnerStartTime, overtimeAfterTime, effectiveFrom, effectiveTo } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Employee ID is required' });
    }
    
    if (lunchDurationMinutes && lunchDurationMinutes > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lunch duration cannot exceed 180 minutes' 
      });
    }
    
    const existing = await EmployeeOverride.findOne({
      where: { employeeId, shiftType: shiftType || 'day' }
    });
    
    if (existing) {
      return res.status(400).json({ success: false, error: 'This employee already has an override. Please edit the existing one.' });
    }
    
    const override = await EmployeeOverride.create({
      employeeId,
      shiftType: shiftType || 'day',
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      lunchDurationMinutes: lunchDurationMinutes || null,
      dinnerDurationMinutes: dinnerDurationMinutes || null,
      dinnerStartTime: dinnerStartTime || null,
      overtimeAfterTime: overtimeAfterTime || null,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo: effectiveTo || null,
      createdBy: req.user.userId
    });
    
    const employee = await Employee.findByPk(employeeId, {
      attributes: ['employeeId', 'firstName', 'lastName', 'departmentId']
    });
    
    let departmentName = 'Unknown';
    if (employee?.departmentId) {
      const dept = await Department.findByPk(employee.departmentId);
      departmentName = dept?.name || 'Unknown';
    }
    
    res.status(201).json({ 
      success: true, 
      data: {
        id: override.id,
        employeeId: override.employeeId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        departmentName: departmentName,
        shiftType: override.shiftType,
        checkInTime: override.checkInTime,
        checkOutTime: override.checkOutTime,
        lunchDurationMinutes: override.lunchDurationMinutes,
        dinnerDurationMinutes: override.dinnerDurationMinutes,
        dinnerStartTime: override.dinnerStartTime,
        overtimeAfterTime: override.overtimeAfterTime,
        effectiveFrom: override.effectiveFrom,
        effectiveTo: override.effectiveTo
      }
    });
  } catch (error) {
    console.error('Create employee override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateEmployeeOverride = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const override = await EmployeeOverride.findByPk(req.params.id);
    if (!override) {
      return res.status(404).json({ success: false, error: 'Employee override not found' });
    }
    
    if (req.body.lunchDurationMinutes && req.body.lunchDurationMinutes > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lunch duration cannot exceed 180 minutes' 
      });
    }
    
    await override.update(req.body);
    
    const employee = await Employee.findByPk(override.employeeId, {
      attributes: ['employeeId', 'firstName', 'lastName', 'departmentId']
    });
    
    let departmentName = 'Unknown';
    if (employee?.departmentId) {
      const dept = await Department.findByPk(employee.departmentId);
      departmentName = dept?.name || 'Unknown';
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        id: override.id,
        employeeId: override.employeeId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        departmentName: departmentName,
        shiftType: override.shiftType,
        checkInTime: override.checkInTime,
        checkOutTime: override.checkOutTime,
        lunchDurationMinutes: override.lunchDurationMinutes,
        dinnerDurationMinutes: override.dinnerDurationMinutes,
        dinnerStartTime: override.dinnerStartTime,
        overtimeAfterTime: override.overtimeAfterTime,
        effectiveFrom: override.effectiveFrom,
        effectiveTo: override.effectiveTo
      }
    });
  } catch (error) {
    console.error('Update employee override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteEmployeeOverride = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const override = await EmployeeOverride.findByPk(req.params.id);
    if (!override) return res.status(404).json({ success: false, error: 'Employee override not found' });
    await override.destroy();
    res.status(200).json({ success: true, message: 'Employee override deleted successfully' });
  } catch (error) {
    console.error('Delete employee override error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};