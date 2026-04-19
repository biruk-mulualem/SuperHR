// controllers/attendance/lateNightController.js
const { 
  Employee, 
  Department,
  LateNightAdjustment
} = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.addLateNightAdjustment = async (req, res) => {
  try {
    const { employeeId, workDate, workedUntilTime, adjustedCheckInTime, reason } = req.body;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Only admins can add adjustments for others.' 
      });
    }
    
    const adjustment = await attendanceService.addLateNightAdjustment(
      employeeId, new Date(workDate), workedUntilTime, adjustedCheckInTime, reason
    );
    
    res.status(201).json({
      success: true,
      message: 'Late night adjustment added successfully',
      data: adjustment
    });
  } catch (error) {
    console.error('Add late night adjustment error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getLateNightAdjustments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!employeeId || employeeId === 'undefined') {
      if (req.user.role === 'admin') {
        const adjustments = await LateNightAdjustment.findAll({
          include: [{ 
            model: Employee, 
            as: 'employee',
            attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode', 'departmentId']
          }],
          order: [['workDate', 'DESC']]
        });
        
        const departmentIds = [...new Set(adjustments.map(adj => adj.employee?.departmentId).filter(Boolean))];
        const departments = await Department.findAll({
          where: { departmentId: departmentIds },
          attributes: ['departmentId', 'name']
        });
        const deptMap = {};
        departments.forEach(d => { deptMap[d.departmentId] = d.name; });
        
        const formatted = adjustments.map(adj => ({
          id: adj.id,
          employeeId: adj.employeeId,
          employeeName: adj.employee ? `${adj.employee.firstName} ${adj.employee.lastName}` : 'Unknown',
          departmentName: deptMap[adj.employee?.departmentId] || 'N/A',
          workDate: adj.workDate,
          workedUntilTime: adj.workedUntilTime,
          adjustedCheckInTime: adj.adjustedCheckInTime,
          reason: adj.reason,
          status: adj.status
        }));
        
        return res.status(200).json({ success: true, data: formatted });
      }
      return res.status(200).json({ success: true, data: [] });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only view your own adjustments.' 
      });
    }
    
    const adjustments = await LateNightAdjustment.findAll({
      where: { employeeId: parseInt(employeeId) },
      include: [{ 
        model: Employee, 
        as: 'employee',
        attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode', 'departmentId']
      }],
      order: [['workDate', 'DESC']]
    });
    
    const departmentIds = [...new Set(adjustments.map(adj => adj.employee?.departmentId).filter(Boolean))];
    const departments = await Department.findAll({
      where: { departmentId: departmentIds },
      attributes: ['departmentId', 'name']
    });
    const deptMap = {};
    departments.forEach(d => { deptMap[d.departmentId] = d.name; });
    
    const formatted = adjustments.map(adj => ({
      id: adj.id,
      employeeId: adj.employeeId,
      employeeName: adj.employee ? `${adj.employee.firstName} ${adj.employee.lastName}` : 'Unknown',
      departmentName: deptMap[adj.employee?.departmentId] || 'N/A',
      workDate: adj.workDate,
      workedUntilTime: adj.workedUntilTime,
      adjustedCheckInTime: adj.adjustedCheckInTime,
      reason: adj.reason,
      status: adj.status
    }));
    
    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length
    });
  } catch (error) {
    console.error('Get late night adjustments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLateNightAdjustment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const adjustment = await LateNightAdjustment.findByPk(req.params.adjustmentId);
    if (!adjustment) return res.status(404).json({ success: false, error: 'Adjustment not found' });
    await adjustment.update(req.body);
    res.status(200).json({ success: true, data: adjustment });
  } catch (error) {
    console.error('Update late night adjustment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteLateNightAdjustment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    await attendanceService.deleteLateNightAdjustment(req.params.adjustmentId);
    res.status(200).json({ success: true, message: 'Adjustment deleted successfully' });
  } catch (error) {
    console.error('Delete late night adjustment error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAllLateNightAdjustments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin only.' 
      });
    }
    
    const adjustments = await LateNightAdjustment.findAll({
      order: [['workDate', 'DESC']]
    });
    
    if (!adjustments || adjustments.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const employeeIds = [...new Set(adjustments.map(adj => adj.employeeId))];
    
    const employees = await Employee.findAll({
      where: { employeeId: employeeIds },
      attributes: ['employeeId', 'firstName', 'lastName', 'departmentId'],
      include: [{
        model: Department,
        as: 'Department',
        attributes: ['name']
      }]
    });
    
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = {
        name: `${emp.firstName} ${emp.lastName}`,
        departmentName: emp.Department?.name || 'N/A'
      };
    });
    
    const formatted = adjustments.map(adj => ({
      id: adj.id,
      employeeId: adj.employeeId,
      employeeName: employeeMap[adj.employeeId]?.name || 'Unknown',
      departmentName: employeeMap[adj.employeeId]?.departmentName || 'N/A',
      workDate: adj.workDate,
      workedUntilTime: adj.workedUntilTime,
      adjustedCheckInTime: adj.adjustedCheckInTime,
      reason: adj.reason,
      status: adj.status
    }));
    
    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Get all late night adjustments error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack 
    });
  }
};

