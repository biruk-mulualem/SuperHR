// controllers/attendance/fieldWorkController.js
const { 
  Employee, 
  Department,
  FieldWorkAssignment
} = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.registerFieldWork = async (req, res) => {
  try {
    const { employeeId, assignmentType, startDate, endDate, location, notes } = req.body;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Only admins can register field work for others.' 
      });
    }
    
    if (!employeeId || !assignmentType || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID, assignment type, and start date are required'
      });
    }
    
    const assignment = await attendanceService.registerFieldWork(
      employeeId, assignmentType, new Date(startDate), endDate ? new Date(endDate) : null, location, notes
    );
    
    res.status(201).json({
      success: true,
      message: 'Field work registered successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Register field work error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.completeFieldWork = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await attendanceService.completeFieldWork(assignmentId);
    
    if (req.user.role !== 'admin' && req.user.userId != assignment.employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only complete your own field work.' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Field work completed successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Complete field work error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getActiveFieldWork = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only view your own field work.' 
      });
    }
    
    const fieldWork = await attendanceService.getActiveFieldWork(employeeId);
    
    res.status(200).json({
      success: true,
      data: fieldWork
    });
  } catch (error) {
    console.error('Get active field work error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllFieldWork = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const fieldWork = await FieldWorkAssignment.findAll({
      where: { status: 'active' },
      include: [
        { 
          model: Employee, 
          as: 'employee',
          attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode', 'departmentId']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    const departmentIds = [...new Set(fieldWork.map(fw => fw.employee?.departmentId).filter(Boolean))];
    const departments = await Department.findAll({
      where: { departmentId: departmentIds },
      attributes: ['departmentId', 'name']
    });
    const deptMap = {};
    departments.forEach(d => { deptMap[d.departmentId] = d.name; });
    
    const formattedFieldWork = fieldWork.map(fw => ({
      id: fw.id,
      employeeId: fw.employeeId,
      employeeName: fw.employee ? `${fw.employee.firstName} ${fw.employee.lastName}` : 'Unknown',
      departmentName: deptMap[fw.employee?.departmentId] || 'Unknown',
      assignmentType: fw.assignmentType,
      startDate: fw.startDate,
      endDate: fw.endDate,
      location: fw.location,
      notes: fw.notes,
      status: fw.status
    }));
    
    res.status(200).json({ success: true, data: formattedFieldWork });
  } catch (error) {
    console.error('Get all field work error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateFieldWork = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const { id } = req.params;
    const { assignmentType, startDate, endDate, location, notes } = req.body;
    
    const fieldWork = await FieldWorkAssignment.findByPk(id);
    if (!fieldWork) {
      return res.status(404).json({ success: false, error: 'Field work assignment not found' });
    }
    
    await fieldWork.update({
      assignmentType: assignmentType || fieldWork.assignmentType,
      startDate: startDate || fieldWork.startDate,
      endDate: endDate !== undefined ? endDate : fieldWork.endDate,
      location: location !== undefined ? location : fieldWork.location,
      notes: notes !== undefined ? notes : fieldWork.notes
    });
    
    const updatedFieldWork = await FieldWorkAssignment.findByPk(id, {
      include: [{ model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'departmentId'] }]
    });
    
    let departmentName = 'Unknown';
    if (updatedFieldWork.employee?.departmentId) {
      const dept = await Department.findByPk(updatedFieldWork.employee.departmentId);
      departmentName = dept?.name || 'Unknown';
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedFieldWork.id,
        employeeId: updatedFieldWork.employeeId,
        employeeName: updatedFieldWork.employee ? `${updatedFieldWork.employee.firstName} ${updatedFieldWork.employee.lastName}` : 'Unknown',
        departmentName: departmentName,
        assignmentType: updatedFieldWork.assignmentType,
        startDate: updatedFieldWork.startDate,
        endDate: updatedFieldWork.endDate,
        location: updatedFieldWork.location,
        notes: updatedFieldWork.notes,
        status: updatedFieldWork.status
      }
    });
  } catch (error) {
    console.error('Update field work error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteFieldWork = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const fieldWork = await FieldWorkAssignment.findByPk(req.params.id);
    if (!fieldWork) {
      return res.status(404).json({ success: false, error: 'Field work assignment not found' });
    }
    
    await fieldWork.destroy();
    res.status(200).json({ success: true, message: 'Field work deleted successfully' });
  } catch (error) {
    console.error('Delete field work error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFieldWorkHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const offset = (parseInt(page) - 1) * queryLimit;
    
    const { count, rows } = await FieldWorkAssignment.findAndCountAll({
      where: { employeeId },
      order: [['created_at', 'DESC']],
      limit: queryLimit,
      offset
    });
    
    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: queryLimit,
        totalPages: Math.ceil(count / queryLimit)
      }
    });
  } catch (error) {
    console.error('Get field work history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};