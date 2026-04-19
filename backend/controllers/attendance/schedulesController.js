// controllers/attendance/schedulesController.js
const attendanceService = require('../../service/attendanceConfig.service');

exports.getEffectiveSchedule = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only view your own schedule.' 
      });
    }
    
    const schedule = await attendanceService.getEffectiveSchedule(employeeId, date ? new Date(date) : new Date());
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get effective schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getEffectiveWorkingHours = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const checkInTime = await attendanceService.getEffectiveCheckInTime(employeeId, targetDate);
    const checkOutTime = await attendanceService.getEffectiveCheckOutTime(employeeId, targetDate);
    
    const [inHours, inMinutes] = checkInTime.split(':');
    const [outHours, outMinutes] = checkOutTime.split(':');
    let totalMinutes = (parseInt(outHours) * 60 + parseInt(outMinutes)) - (parseInt(inHours) * 60 + parseInt(inMinutes));
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const totalHours = (totalMinutes / 60).toFixed(2);
    
    res.status(200).json({
      success: true,
      data: {
        employeeId,
        date: targetDate.toISOString().split('T')[0],
        checkInTime,
        checkOutTime,
        totalHours: parseFloat(totalHours),
        totalMinutes
      }
    });
  } catch (error) {
    console.error('Get effective working hours error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};