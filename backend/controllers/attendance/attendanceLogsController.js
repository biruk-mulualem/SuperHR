// controllers/attendance/attendanceLogsController.js
const { 
  Employee, 
  AttendanceLog,
  Op 
} = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.recordCheckIn = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { checkInTime, latitude, longitude } = req.body;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only check in for yourself.' 
      });
    }
    
    const checkInDateTime = checkInTime ? new Date(checkInTime) : new Date();
    const attendance = await attendanceService.recordAttendance(employeeId, new Date(), checkInDateTime, null);
    
    if (latitude && longitude) {
      await attendance.update({ 
        notes: `Check-in at: ${latitude}, ${longitude}` 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Check-in recorded successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Record check-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.recordCheckOut = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { checkOutTime } = req.body;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only check out for yourself.' 
      });
    }
    
    const checkOutDateTime = checkOutTime ? new Date(checkOutTime) : new Date();
    const attendance = await attendanceService.recordAttendance(employeeId, new Date(), null, checkOutDateTime);
    const overtime = await attendanceService.calculateOvertime(employeeId, new Date());
    
    res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully',
      data: attendance,
      overtime
    });
  } catch (error) {
    console.error('Record check-out error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only view your own reports.' 
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required' });
    }
    
    const attendance = await attendanceService.getAttendanceReport(
      employeeId, 
      new Date(startDate), 
      new Date(endDate)
    );
    
    const queryLimit = Math.min(parseInt(limit) || 50, 200);
    const offset = (parseInt(page) - 1) * queryLimit;
    const paginatedAttendance = attendance.slice(offset, offset + queryLimit);
    
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => !a.isAbsent).length,
      absentDays: attendance.filter(a => a.isAbsent).length,
      lateDays: attendance.filter(a => a.isLate).length,
      totalLateMinutes: attendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0),
      totalOvertimeMinutes: attendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0),
      totalHours: attendance.reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0).toFixed(2)
    };
    
    res.status(200).json({
      success: true,
      data: paginatedAttendance,
      summary,
      pagination: {
        total: attendance.length,
        page: parseInt(page),
        limit: queryLimit,
        totalPages: Math.ceil(attendance.length / queryLimit)
      }
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const employee = await Employee.findOne({ where: { userId: req.user.userId } });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found for this user' });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required' });
    }
    
    const attendance = await attendanceService.getAttendanceReport(
      employee.employeeId, 
      new Date(startDate), 
      new Date(endDate)
    );
    
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => !a.isAbsent).length,
      absentDays: attendance.filter(a => a.isAbsent).length,
      lateDays: attendance.filter(a => a.isLate).length,
      totalLateMinutes: attendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0),
      totalOvertimeMinutes: attendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0),
      totalHours: attendance.reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0).toFixed(2)
    };
    
    res.status(200).json({
      success: true,
      data: attendance,
      summary,
      count: attendance.length
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;
    
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    const attendance = await attendanceService.getAttendanceReport(employeeId, startDate, endDate);
    
    const summary = {
      year: targetYear,
      month: targetMonth,
      totalDays: attendance.length,
      presentDays: attendance.filter(a => !a.isAbsent && a.checkInTime).length,
      absentDays: attendance.filter(a => a.isAbsent).length,
      lateDays: attendance.filter(a => a.isLate).length,
      totalLateMinutes: attendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0),
      totalOvertimeMinutes: attendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0),
      totalHours: attendance.reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0).toFixed(2)
    };
    
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};