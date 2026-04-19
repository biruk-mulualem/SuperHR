// controllers/attendance/overtimeController.js
const { OvertimeRate } = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.calculateOvertime = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only view your own overtime.' 
      });
    }
    
    const targetDate = date ? new Date(date) : new Date();
    const overtime = await attendanceService.calculateOvertime(employeeId, targetDate);
    
    res.status(200).json({
      success: true,
      data: overtime
    });
  } catch (error) {
    console.error('Calculate overtime error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOvertimeRates = async (req, res) => {
  try {
    const rates = await OvertimeRate.findAll({ 
      order: [['shiftType', 'ASC'], ['dayType', 'ASC'], ['effectiveFrom', 'DESC']] 
    });
    res.status(200).json({ success: true, data: rates });
  } catch (error) {
    console.error('Get overtime rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createOvertimeRate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const rate = await OvertimeRate.create(req.body);
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    console.error('Create overtime rate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOvertimeRate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const rate = await OvertimeRate.findByPk(req.params.id);
    if (!rate) return res.status(404).json({ success: false, error: 'Overtime rate not found' });
    await rate.update(req.body);
    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    console.error('Update overtime rate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteOvertimeRate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const rate = await OvertimeRate.findByPk(req.params.id);
    if (!rate) return res.status(404).json({ success: false, error: 'Overtime rate not found' });
    await rate.destroy();
    res.status(200).json({ success: true, message: 'Overtime rate deleted successfully' });
  } catch (error) {
    console.error('Delete overtime rate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};