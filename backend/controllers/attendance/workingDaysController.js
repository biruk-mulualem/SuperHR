// controllers/attendance/workingDaysController.js
const { WorkingDaysConfig } = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.checkWorkingDay = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const isWorkingDay = await attendanceService.isWorkingDay(employeeId, targetDate);
    
    res.status(200).json({
      success: true,
      isWorkingDay
    });
  } catch (error) {
    console.error('Check working day error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWorkingDaysConfig = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const configs = await WorkingDaysConfig.findAll({
      order: [['shiftType', 'ASC'], ['dayOfWeek', 'ASC'], ['effectiveFrom', 'DESC']]
    });
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error('Get working days config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateWorkingDaysConfig = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const config = await WorkingDaysConfig.findByPk(req.params.id);
    if (!config) return res.status(404).json({ success: false, error: 'Working days config not found' });
    await config.update(req.body);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Update working days config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};