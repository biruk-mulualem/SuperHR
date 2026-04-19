// controllers/attendance/adminController.js
const { 
  Employee, 
  Department,
  BreakTicket,
  AttendanceLog,
  FieldWorkAssignment,
  Holiday,
  Op 
} = require('../../models');

exports.getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin access required.' 
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const activeBreaks = await BreakTicket.count({ where: { status: ['active', 'late'] } });
    const todayAttendance = await AttendanceLog.findAll({ where: { attendanceDate: todayStr } });
    const presentToday = todayAttendance.filter(a => !a.isAbsent && a.checkInTime).length;
    const absentToday = todayAttendance.filter(a => a.isAbsent).length;
    const lateToday = todayAttendance.filter(a => a.isLate).length;
    const activeFieldWork = await FieldWorkAssignment.count({ where: { status: 'active' } });
    
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const upcomingHolidays = await Holiday.findAll({
      where: { holidayDate: { [Op.between]: [today, thirtyDaysLater] } },
      order: [['holidayDate', 'ASC']],
      limit: 5
    });
    
    res.status(200).json({
      success: true,
      data: {
        activeBreaks,
        presentToday,
        absentToday,
        lateToday,
        activeFieldWork,
        upcomingHolidays: upcomingHolidays.map(h => ({
          name: h.name,
          date: h.holidayDate,
          type: h.holidayType
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAdminAttendanceSummary = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const { startDate, endDate, departmentId } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required' });
    }
    
    const whereCondition = { attendanceDate: { [Op.between]: [new Date(startDate), new Date(endDate)] } };
    if (departmentId && departmentId !== 'all') {
      const employees = await Employee.findAll({ where: { departmentId }, attributes: ['employeeId'] });
      whereCondition.employeeId = { [Op.in]: employees.map(e => e.employeeId) };
    }
    
    const attendance = await AttendanceLog.findAll({
      where: whereCondition,
      include: [{ model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeCode', 'departmentId'] }]
    });
    
    const byDepartment = {};
    attendance.forEach(record => {
      const deptId = record.employee?.departmentId || 'unknown';
      if (!byDepartment[deptId]) {
        byDepartment[deptId] = {
          departmentName: record.employee?.Department?.name || 'Unknown',
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          totalLateMinutes: 0,
          totalOvertimeMinutes: 0
        };
      }
      byDepartment[deptId].totalDays++;
      if (!record.isAbsent && record.checkInTime) byDepartment[deptId].presentDays++;
      if (record.isAbsent) byDepartment[deptId].absentDays++;
      if (record.isLate) byDepartment[deptId].lateDays++;
      byDepartment[deptId].totalLateMinutes += record.lateMinutes || 0;
      byDepartment[deptId].totalOvertimeMinutes += record.overtimeMinutes || 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: Object.values(byDepartment),
        totalRecords: attendance.length
      }
    });
  } catch (error) {
    console.error('Get admin attendance summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportAttendanceReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    
    const { startDate, endDate, departmentId } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required' });
    }
    
    const whereCondition = { attendanceDate: { [Op.between]: [new Date(startDate), new Date(endDate)] } };
    if (departmentId && departmentId !== 'all') {
      const employees = await Employee.findAll({ where: { departmentId }, attributes: ['employeeId'] });
      whereCondition.employeeId = { [Op.in]: employees.map(e => e.employeeId) };
    }
    
    const attendance = await AttendanceLog.findAll({
      where: whereCondition,
      include: [{ model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeCode'] }],
      order: [['attendanceDate', 'ASC']]
    });
    
    const csvHeaders = ['Employee Code', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Status', 'Late Minutes', 'Overtime Minutes', 'Total Hours'];
    const csvRows = attendance.map(record => [
      record.employee?.employeeCode || 'N/A',
      record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A',
      record.attendanceDate,
      record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
      record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-',
      record.isAbsent ? 'Absent' : (record.isLate ? 'Late' : 'Present'),
      record.lateMinutes || 0,
      record.overtimeMinutes || 0,
      record.totalHours || 0
    ]);
    
    const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${startDate}_to_${endDate}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export attendance report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};