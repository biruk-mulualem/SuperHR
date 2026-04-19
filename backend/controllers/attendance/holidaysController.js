// controllers/attendance/holidaysController.js
const { Holiday } = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.getHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const holidays = await attendanceService.getHolidays(year || new Date().getFullYear());
    res.status(200).json({ success: true, data: holidays, count: holidays.length });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.checkHoliday = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'Date is required' });
    
    const isHoliday = await attendanceService.isHoliday(new Date(date));
    const overtimeRate = await attendanceService.getHolidayOvertimeRate(new Date(date));
    
    res.status(200).json({
      success: true,
      isHoliday,
      overtimeRate
    });
  } catch (error) {
    console.error('Check holiday error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const holiday = await Holiday.create(req.body);
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, error: 'Holiday not found' });
    await holiday.update(req.body);
    res.status(200).json({ success: true, data: holiday });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, error: 'Holiday not found' });
    await holiday.destroy();
    res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};