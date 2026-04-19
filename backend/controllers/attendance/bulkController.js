// controllers/attendance/bulkController.js
const { Employee, AttendanceLog } = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.completeAllExpiredBreaks = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const expiredBreaks = await attendanceService.checkExpiredBreaks();
    
    res.status(200).json({
      success: true,
      message: `${expiredBreaks.length} expired breaks processed`,
      data: { completedCount: expiredBreaks.length }
    });
  } catch (error) {
    console.error('Complete all expired breaks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.processDailyAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const attendanceDate = targetDate.toISOString().split('T')[0];
    const employees = await Employee.findAll({ where: { employmentStatus: 'active' } });
    
    let processed = 0, created = 0;
    for (const employee of employees) {
      const existing = await AttendanceLog.findOne({ 
        where: { employeeId: employee.employeeId, attendanceDate } 
      });
      if (!existing) {
        await AttendanceLog.create({
          employeeId: employee.employeeId,
          attendanceDate,
          shiftType: employee.shiftType || 'day',
          isAbsent: true,
          notes: 'Auto-generated absent record'
        });
        created++;
      }
      processed++;
    }
    
    res.status(200).json({
      success: true,
      message: `Processed ${processed} employees, created ${created} absent records`,
      data: { processed, created }
    });
  } catch (error) {
    console.error('Process daily attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};