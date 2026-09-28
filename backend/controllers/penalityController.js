// controllers/payrollController.js
const { sequelize, Op } = require('sequelize');
const db = require('../models');

// Get penalties for an employee
// Get penalties for an employee
exports.getEmployeePenalties = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;
    
    const where = { employee_id: employeeId };
    if (month) where.month = month;
    
    const penalties = await db.EmployeePenalty.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    // Format dates in UTC to prevent timezone shift
    const formattedPenalties = penalties.map(penalty => {
      let dateStr = null;
      
      if (penalty.penalty_date) {
        const d = new Date(penalty.penalty_date);
        dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      } else if (penalty.created_at) {
        const d = new Date(penalty.created_at);
        dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }
      
      return {
        ...penalty.toJSON(),
        date: dateStr,
        penalty_date: dateStr
      };
    });
    
    res.json({
      success: true,
      data: formattedPenalties
    });
  } catch (error) {
    console.error('Get employee penalties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a penalty
exports.createPenalty = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { employeeId } = req.params;
    const {
      penalty_type,
      calculation_type,
      value,
      reference,
      submitted_by,
      contact,
      reason,
      month,
      penalty_date  // Date from frontend as "YYYY-MM-DD" string
    } = req.body;
    
    const userId = req.user?.userId;
    const userName = req.user?.fullName;
    
    // Calculate period dates from month (YYYY-MM)
    let period_start_date = null;
    let period_end_date = null;
    let period_label = null;
    
    if (month) {
      const [year, monthNum] = month.split('-');
      const yearNum = parseInt(year);
      const monthIndex = parseInt(monthNum) - 1;
      
      // Set to UTC to avoid timezone issues
      period_start_date = new Date(Date.UTC(yearNum, monthIndex, 1));
      period_end_date = new Date(Date.UTC(yearNum, monthIndex + 1, 0));
      period_label = period_start_date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      const now = new Date();
      period_start_date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      period_end_date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      period_label = period_start_date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    
    // Calculate calculated_amount if percentage
    let calculated_amount = null;
    let finalValue = value;
    
    if (calculation_type === 'percent') {
      const employee = await db.Employee.findByPk(employeeId, { transaction });
      if (employee) {
        calculated_amount = (value / 100) * (employee.basic_salary || 0);
        finalValue = calculated_amount;
      }
    }
    
    // Handle penalty_date with UTC to prevent timezone shift
    let penaltyDate;
    if (penalty_date) {
      // Parse as UTC by using UTC constructor
      const [year, monthNum, day] = penalty_date.split('-').map(Number);
      penaltyDate = new Date(Date.UTC(year, monthNum - 1, day));
    } else {
      const now = new Date();
      penaltyDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    
    // Create the penalty record
    const penalty = await db.EmployeePenalty.create({
      employee_id: employeeId,
      penalty_type,
      calculation_type: calculation_type || 'fixed',
      value: finalValue,
      calculated_amount: calculated_amount,
      reference: reference || null,
      submitted_by: submitted_by || userName,
      contact: contact || null,
      reason: reason || null,
      month: month,
      period_start_date: period_start_date,
      period_end_date: period_end_date,
      period_label: period_label,
      status: 'active',
      created_by: userId,
      created_at: penaltyDate,
      updated_at: new Date(),
      penalty_date: penaltyDate
    }, { transaction });
    
    await transaction.commit();
    
    // Format the date as YYYY-MM-DD in UTC for response
    const formattedDate = `${penaltyDate.getUTCFullYear()}-${String(penaltyDate.getUTCMonth() + 1).padStart(2, '0')}-${String(penaltyDate.getUTCDate()).padStart(2, '0')}`;
    
    const responseData = {
      ...penalty.toJSON(),
      date: formattedDate,
      penalty_date: formattedDate
    };
    
    res.status(201).json({
      success: true,
      message: 'Penalty added successfully',
      data: responseData
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Create penalty error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// Delete a penalty (hard delete from database)
exports.deletePenalty = async (req, res) => {
  try {
    const { penaltyId } = req.params;
    
    const penalty = await db.EmployeePenalty.findByPk(penaltyId);
    if (!penalty) {
      return res.status(404).json({ success: false, error: 'Penalty not found' });
    }
    
    // Hard delete - completely remove from database
    await penalty.destroy();
    
    res.json({
      success: true,
      message: 'Penalty deleted successfully'
    });
  } catch (error) {
    console.error('Delete penalty error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Apply penalty reduction
exports.reducePenalty = async (req, res) => {
  try {
    const { penaltyId } = req.params;
    const { reductionValue, reductionReason } = req.body;
    const userName = req.user?.fullName;
    
    const penalty = await db.EmployeePenalty.findByPk(penaltyId);
    if (!penalty) {
      return res.status(404).json({ success: false, error: 'Penalty not found' });
    }
    
    const originalValue = penalty.value;
    const newValue = Math.max(0, originalValue - reductionValue);
    
    await penalty.update({
      original_value: originalValue,
      value: newValue,
      reduction_reason: reductionReason,
      reduced_by: userName,
      reduced_at: new Date(),
      status: newValue === 0 ? 'cancelled' : 'reduced'
    });
    
    res.json({
      success: true,
      message: `Penalty reduced from ${originalValue} to ${newValue}`,
      data: penalty
    });
  } catch (error) {
    console.error('Reduce penalty error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

