// controllers/payrollController.js
const { sequelize, Op } = require('sequelize');
const db = require('../models');

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
    
    res.json({
      success: true,
      data: penalties
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
      month
    } = req.body;
    
    const userId = req.user?.userId;
    const userName = req.user?.fullName;
    
    const penalty = await db.EmployeePenalty.create({
      employee_id: employeeId,
      penalty_type,
      calculation_type: calculation_type || 'fixed',
      value: value,
      reference: reference || null,
      submitted_by: submitted_by || userName,
      contact: contact || null,
      reason: reason || null,
      month: month,
      status: 'active',
      created_by: userId
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Penalty added successfully',
      data: penalty
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