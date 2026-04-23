// controllers/attendance/fieldWorkController.js
const { 
  Employee, 
  Department,
  FieldWorkAssignment,
  Op 
} = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

// Helper function to clean up expired field work
// Replace your cleanupExpiredFieldWork function with this debug version

const cleanupExpiredFieldWork = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log('=== CLEANUP START ===');
  console.log('Today (UTC):', today.toISOString());
  console.log('Today (Local):', today.toLocaleString());
  
  // First, find ALL active assignments to see what's there
  const allActive = await FieldWorkAssignment.findAll({
    where: { status: 'active' }
  });
  
  console.log(`Total active assignments: ${allActive.length}`);
  
  for (const assignment of allActive) {
    console.log(`Assignment ${assignment.id}: type=${assignment.assignmentType}, start=${assignment.startDate}, end=${assignment.endDate}`);
    
    let isExpired = false;
    
    if (assignment.assignmentType === 'today') {
      const startDate = new Date(assignment.startDate);
      startDate.setHours(0, 0, 0, 0);
      console.log(`  Today assignment - Start: ${startDate.toISOString().split('T')[0]}, Today: ${today.toISOString().split('T')[0]}`);
      if (startDate < today) {
        isExpired = true;
        console.log(`  → EXPIRED (start date before today)`);
      }
    } 
    else if (assignment.assignmentType === 'range' && assignment.endDate) {
      const endDate = new Date(assignment.endDate);
      endDate.setHours(0, 0, 0, 0);
      console.log(`  Range assignment - End: ${endDate.toISOString().split('T')[0]}, Today: ${today.toISOString().split('T')[0]}`);
      if (endDate < today) {
        isExpired = true;
        console.log(`  → EXPIRED (end date before today)`);
      }
    }
    
    if (isExpired) {
      await assignment.update({
        status: 'expired',
        notes: assignment.notes ? `${assignment.notes} - Auto-expired on ${today.toISOString().split('T')[0]}` : `Auto-expired on ${today.toISOString().split('T')[0]}`
      });
      console.log(`  ✅ Updated assignment ${assignment.id} to expired`);
    }
  }
  
  const expiredCount = await FieldWorkAssignment.count({
    where: { status: 'expired' }
  });
  
  console.log(`Total expired assignments: ${expiredCount}`);
  console.log('=== CLEANUP END ===');
  
  return expiredCount;
};

// Call cleanup on each request to ensure data is fresh
const ensureCleanup = async () => {
  try {
    await cleanupExpiredFieldWork();
  } catch (error) {
    console.error('Error cleaning up expired field work:', error);
  }
};

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
    
    // Validate date ranges
    const startDateObj = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (assignmentType === 'today' && startDateObj < today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create field work for a past date'
      });
    }
    
    if (assignmentType === 'range' && endDate) {
      const endDateObj = new Date(endDate);
      if (endDateObj < startDateObj) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }
    }
    
    const assignment = await attendanceService.registerFieldWork(
      employeeId, assignmentType, new Date(startDate), endDate ? new Date(endDate) : null, location, notes
    );
    
    // Clean up expired assignments after creating new one
    await ensureCleanup();
    
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
    
    // Clean up expired assignments first
    await ensureCleanup();
    
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
    
    // Clean up expired assignments first
    await ensureCleanup();
    
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
    
    // Validate date ranges for update
    if (startDate && assignmentType === 'today') {
      const startDateObj = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDateObj < today) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update field work to a past date'
        });
      }
    }
    
    if (assignmentType === 'range' && endDate && startDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (endDateObj < startDateObj) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }
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
    
    // Clean up expired assignments after update
    await ensureCleanup();
    
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
    
    // Clean up after deletion
    await ensureCleanup();
    
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

// Export cleanup function for scheduled tasks
exports.cleanupExpiredFieldWork = cleanupExpiredFieldWork;