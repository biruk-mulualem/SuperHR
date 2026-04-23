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
    
    console.log('Creating holiday with data:', req.body);
    
    const { name, holidayDate, ethiopianDate, holidayType, overtimeRate, isRecurring } = req.body;
    
    // Validation
    if (!name || !holidayDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and holiday date are required' 
      });
    }
    
    const holidayData = {
      name,
      holidayDate,
      ethiopianDate: ethiopianDate || null,
      holidayType: holidayType || 'public',
      overtimeRate: overtimeRate || 2.5,
      isRecurring: isRecurring || false,
    };
    
    // Set year based on recurring flag
    if (holidayData.isRecurring) {
      holidayData.year = null;
    } else {
      holidayData.year = new Date(holidayData.holidayDate).getFullYear();
    }
    
    const holiday = await Holiday.create(holidayData);
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
    if (!holiday) {
      return res.status(404).json({ success: false, error: 'Holiday not found' });
    }
    
    const { name, holidayDate, ethiopianDate, holidayType, overtimeRate, isRecurring } = req.body;
    
    const updateData = {
      name: name || holiday.name,
      holidayDate: holidayDate || holiday.holidayDate,
      ethiopianDate: ethiopianDate !== undefined ? ethiopianDate : holiday.ethiopianDate,
      holidayType: holidayType || holiday.holidayType,
      overtimeRate: overtimeRate || holiday.overtimeRate,
      isRecurring: isRecurring !== undefined ? isRecurring : holiday.isRecurring,
    };
    
    // Set year based on recurring flag
    if (updateData.isRecurring) {
      updateData.year = null;
    } else {
      updateData.year = new Date(updateData.holidayDate).getFullYear();
    }
    
    await holiday.update(updateData);
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
    if (!holiday) {
      return res.status(404).json({ success: false, error: 'Holiday not found' });
    }
    
    await holiday.destroy();
    res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};