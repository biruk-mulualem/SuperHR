// controllers/penaltySummaryController.js
const { sequelize, Op } = require('sequelize');
const db = require('../models');

// ==================== HELPER FUNCTIONS ====================

function formatPeriodLabel(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getDate() === 1 && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()) {
    return start.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  
  const quarters = [[0,2], [3,5], [6,8], [9,11]];
  const startQuarter = quarters.findIndex(q => start.getMonth() >= q[0] && start.getMonth() <= q[1]);
  const endQuarter = quarters.findIndex(q => end.getMonth() >= q[0] && end.getMonth() <= q[1]);
  
  if (startQuarter === endQuarter && start.getDate() === 1 && 
      end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()) {
    return `Q${startQuarter + 1} ${start.getFullYear()}`;
  }
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

// ==================== GET PENALTY SUMMARY ====================
exports.getPenaltySummary = async (req, res) => {
  try {
    const { fromDate, toDate, department, search, page = 1, limit = 10 } = req.query;
    
    let startMonth = null;
    let endMonth = null;
    
    if (fromDate) {
      const from = new Date(fromDate);
      startMonth = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (toDate) {
      const to = new Date(toDate);
      endMonth = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}`;
    }
    
    let sql = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        COALESCE(d.name, 'Unassigned') as department_name,
        SUM(CASE WHEN ep.penalty_type ILIKE '%asset%' THEN ep.value ELSE 0 END) as asset_total,
        SUM(CASE WHEN ep.penalty_type NOT ILIKE '%asset%' AND ep.calculation_type != 'percent' THEN ep.value ELSE 0 END) as other_total,
        SUM(CASE WHEN ep.calculation_type = 'percent' OR ep.penalty_type ILIKE '%percent%' THEN ep.value ELSE 0 END) as percent_total,
        COUNT(ep.penalty_id) as penalty_count
      FROM employee_penalties ep
      INNER JOIN employees e ON ep.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE ep.status = 'active'
    `;
    
    const replacements = {};
    
    if (startMonth && endMonth) {
      sql += ` AND ep.month BETWEEN :startMonth AND :endMonth`;
      replacements.startMonth = startMonth;
      replacements.endMonth = endMonth;
    } else if (startMonth) {
      sql += ` AND ep.month >= :startMonth`;
      replacements.startMonth = startMonth;
    } else if (endMonth) {
      sql += ` AND ep.month <= :endMonth`;
      replacements.endMonth = endMonth;
    }
    
    if (department && department !== 'all') {
      sql += ` AND d.name = :department`;
      replacements.department = department;
    }
    
    if (search) {
      sql += ` AND (e.first_name ILIKE :search OR e.last_name ILIKE :search OR e.employee_code ILIKE :search)`;
      replacements.search = `%${search}%`;
    }
    
    sql += ` GROUP BY e.employee_id, e.employee_code, e.first_name, e.last_name, d.name`;
    sql += ` ORDER BY e.employee_id`;
    
    const penalties = await db.sequelize.query(sql, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });
    
    let result = penalties.map(p => ({
      id: p.employee_id,
      employeeId: p.employee_id,
      employeeCode: p.employee_code,
      employeeName: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      department: p.department_name,
      percentPenalty: parseFloat(p.percent_total) || 0,
      assetPenalty: parseFloat(p.asset_total) || 0,
      otherPenalty: parseFloat(p.other_total) || 0,
      totalPenalty: (parseFloat(p.asset_total) || 0) + (parseFloat(p.other_total) || 0) + (parseFloat(p.percent_total) || 0),
      penaltyCount: parseInt(p.penalty_count) || 0,
      summary: {
        percent: { original: 0, deducted: 0, current: 0, status: 'active' },
        asset: { original: 0, deducted: 0, current: 0, status: 'active' },
        other: { original: 0, deducted: 0, current: 0, status: 'active' }
      }
    }));
    
    // Fetch summary data for each employee
    for (const emp of result) {
      const summaries = await db.PenaltySummary.findAll({
        where: {
          employee_id: emp.id,
          period_start_date: fromDate || '2000-01-01',
          period_end_date: toDate || '2099-12-31'
        }
      });
      
      for (const summary of summaries) {
        if (summary.penalty_type === 'percent' && emp.summary.percent) {
          emp.summary.percent = {
            original: summary.original_percentage || 0,
            deducted: summary.deducted_percentage || 0,
            current: summary.current_percentage || 0,
            status: summary.status
          };
          emp.percentPenalty = summary.current_percentage || 0;
        } else if (summary.penalty_type === 'asset' && emp.summary.asset) {
          emp.summary.asset = {
            original: summary.original_amount || 0,
            deducted: summary.deducted_amount || 0,
            current: summary.current_amount || 0,
            status: summary.status
          };
          emp.assetPenalty = summary.current_amount || 0;
        } else if (summary.penalty_type === 'other' && emp.summary.other) {
          emp.summary.other = {
            original: summary.original_amount || 0,
            deducted: summary.deducted_amount || 0,
            current: summary.current_amount || 0,
            status: summary.status
          };
          emp.otherPenalty = summary.current_amount || 0;
        }
      }
      
      emp.totalPenalty = emp.assetPenalty + emp.otherPenalty + emp.percentPenalty;
    }
    
    const totals = {
      totalAssetPenalty: result.reduce((sum, emp) => sum + emp.assetPenalty, 0),
      totalOtherPenalty: result.reduce((sum, emp) => sum + emp.otherPenalty, 0),
      totalPercentPenalty: result.reduce((sum, emp) => sum + emp.percentPenalty, 0),
      totalPenaltyAmount: result.reduce((sum, emp) => sum + emp.totalPenalty, 0),
      totalEmployees: result.length,
      totalPenaltyCount: result.reduce((sum, emp) => sum + emp.penaltyCount, 0)
    };
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginatedData = result.slice(start, start + limitNum);
    
    res.json({
      success: true,
      data: paginatedData,
      totals,
      periodRange: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        label: fromDate && toDate ? formatPeriodLabel(fromDate, toDate) : 'All Time'
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.length,
        totalPages: Math.ceil(result.length / limitNum)
      },
      count: paginatedData.length
    });
    
  } catch (error) {
    console.error('Get penalty summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== APPLY PENALTY REDUCTION ====================
exports.applyPenaltyReduction = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { employeeId } = req.params;
    const {
      deductionAmount,
      deductionPercentage,
      reason,
      processedBy,
      periodStartDate,
      periodEndDate,
      reference
    } = req.body;
    
    const penaltyType = deductionPercentage ? 'percent' : 
                        (req.body.penaltyType === 'asset' ? 'asset' : 'other');
    
    const deductionValue = deductionPercentage || deductionAmount || 0;
    
    if (deductionValue <= 0) {
      return res.status(400).json({ success: false, error: 'Deduction amount must be greater than 0' });
    }
    
    const periodLabel = formatPeriodLabel(periodStartDate, periodEndDate);
    
    // Find existing summary for this employee, period, and penalty type
    let summary = await db.PenaltySummary.findOne({
      where: {
        employee_id: employeeId,
        period_start_date: periodStartDate,
        period_end_date: periodEndDate,
        penalty_type: penaltyType
      },
      transaction
    });
    
    let oldValue, deductedValue, newValue;
    
    if (!summary) {
      // Get current penalty totals
      const startMonth = periodStartDate.substring(0, 7);
      const endMonth = periodEndDate.substring(0, 7);
      
      const employeePenalties = await db.EmployeePenalty.findAll({
        where: {
          employee_id: employeeId,
          status: 'active',
          month: { [Op.between]: [startMonth, endMonth] }
        },
        transaction
      });
      
      let assetTotal = 0, otherTotal = 0, percentTotal = 0;
      
      for (const penalty of employeePenalties) {
        const amount = parseFloat(penalty.value);
        const typeLower = (penalty.penalty_type || '').toLowerCase();
        
        if (typeLower.includes('asset')) {
          assetTotal += amount;
        } else if (typeLower.includes('percent') || penalty.calculation_type === 'percent') {
          percentTotal += amount;
        } else {
          otherTotal += amount;
        }
      }
      
      if (penaltyType === 'percent') {
        oldValue = percentTotal;
        deductedValue = deductionValue;
        newValue = Math.max(0, oldValue - deductedValue);
      } else if (penaltyType === 'asset') {
        oldValue = assetTotal;
        deductedValue = deductionValue;
        newValue = Math.max(0, oldValue - deductedValue);
      } else {
        oldValue = otherTotal;
        deductedValue = deductionValue;
        newValue = Math.max(0, oldValue - deductedValue);
      }
      
      if (deductedValue <= 0 || oldValue <= 0) {
        return res.status(400).json({ success: false, error: `No ${penaltyType} penalties found` });
      }
      
      summary = await db.PenaltySummary.create({
        employee_id: employeeId,
        penalty_id: 0,
        period_start_date: periodStartDate,
        period_end_date: periodEndDate,
        period_label: periodLabel,
        penalty_type: penaltyType,
        penalty_name: `${penaltyType.charAt(0).toUpperCase() + penaltyType.slice(1)} Penalties`,
        penalty_category: penaltyType,
        original_amount: penaltyType === 'percent' ? 0 : oldValue,
        deducted_amount: penaltyType === 'percent' ? 0 : deductedValue,
        current_amount: penaltyType === 'percent' ? 0 : newValue,
        original_percentage: penaltyType === 'percent' ? oldValue : 0,
        deducted_percentage: penaltyType === 'percent' ? deductedValue : 0,
        current_percentage: penaltyType === 'percent' ? newValue : 0,
        status: newValue <= 0 ? 'fully_deducted' : 'partially_deducted',
        reference_document: reference,
        submitted_by: processedBy,
        last_reduction_date: new Date(),
        last_reduced_by: processedBy,
        last_reduction_reason: reason,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
      
    } else {
      // Update existing summary
      if (penaltyType === 'percent') {
        oldValue = summary.current_percentage || 0;
        deductedValue = deductionValue;
        newValue = Math.max(0, oldValue - deductedValue);
        
        await summary.update({
          deducted_percentage: (summary.deducted_percentage || 0) + deductedValue,
          current_percentage: newValue,
          status: newValue <= 0 ? 'fully_deducted' : 'partially_deducted',
          last_reduction_date: new Date(),
          last_reduced_by: processedBy,
          last_reduction_reason: reason,
          updated_at: new Date()
        }, { transaction });
      } else {
        oldValue = summary.current_amount || 0;
        deductedValue = deductionValue;
        newValue = Math.max(0, oldValue - deductedValue);
        
        await summary.update({
          deducted_amount: (summary.deducted_amount || 0) + deductedValue,
          current_amount: newValue,
          status: newValue <= 0 ? 'fully_deducted' : 'partially_deducted',
          last_reduction_date: new Date(),
          last_reduced_by: processedBy,
          last_reduction_reason: reason,
          updated_at: new Date()
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `${penaltyType} penalty reduced by ${deductedValue} ${deductionPercentage ? '%' : 'ETB'}`,
      data: {
        summary: {
          summary_id: summary.summary_id,
          penalty_type: penaltyType,
          old_value: oldValue,
          deducted: deductedValue,
          new_value: newValue,
          status: summary.status
        }
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Apply penalty reduction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== UPDATE REDUCTION ====================
exports.updateReduction = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { employeeId, reductionId } = req.params;
    const { amount, reason } = req.body;
    
    const reduction = await db.PenaltySummary.findOne({
      where: { summary_id: reductionId, employee_id: employeeId },
      transaction
    });
    
    if (!reduction) {
      return res.status(404).json({ success: false, error: 'Reduction not found' });
    }
    
    if (reduction.penalty_type === 'percent') {
      const newDeducted = amount;
      const newCurrent = Math.max(0, (reduction.original_percentage || 0) - newDeducted);
      
      await reduction.update({
        deducted_percentage: newDeducted,
        current_percentage: newCurrent,
        last_reduction_reason: reason,
        updated_at: new Date()
      }, { transaction });
    } else {
      const newDeducted = amount;
      const newCurrent = Math.max(0, (reduction.original_amount || 0) - newDeducted);
      
      await reduction.update({
        deducted_amount: newDeducted,
        current_amount: newCurrent,
        last_reduction_reason: reason,
        updated_at: new Date()
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.json({ success: true, message: 'Reduction updated successfully', data: reduction });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Update reduction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== DELETE REDUCTION ====================
exports.deleteReduction = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { employeeId, reductionId } = req.params;
    
    const reduction = await db.PenaltySummary.findOne({
      where: { summary_id: reductionId, employee_id: employeeId },
      transaction
    });
    
    if (!reduction) {
      return res.status(404).json({ success: false, error: 'Reduction not found' });
    }
    
    await reduction.destroy({ transaction });
    await transaction.commit();
    
    res.json({ success: true, message: 'Reduction deleted successfully' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Delete reduction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== GET REDUCTION HISTORY ====================
exports.getReductionHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { fromDate, toDate } = req.query;
    
    const where = { employee_id: employeeId };
    
    if (fromDate && toDate) {
      where.created_at = { [Op.between]: [new Date(fromDate), new Date(toDate)] };
    }
    
    const reductions = await db.PenaltySummary.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    const history = reductions.map(r => ({
      id: r.summary_id,
      type: r.penalty_type === 'percent' ? 'Percent Penalty' : (r.penalty_type === 'asset' ? 'Asset Penalty' : 'Other Penalty'),
      amount: r.penalty_type === 'percent' ? r.deducted_percentage : r.deducted_amount,
      isPercent: r.penalty_type === 'percent',
      reason: r.last_reduction_reason || 'No reason provided',
      processedBy: r.last_reduced_by || 'System',
      date: r.created_at
    }));
    
    res.json({ success: true, data: history, count: history.length });
    
  } catch (error) {
    console.error('Get reduction history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BATCH REDUCTION ====================
exports.applyBatchPenaltyReduction = async (req, res) => {
  res.json({ success: true, message: 'Batch reduction is deprecated. Please use import feature instead.' });
};

// ==================== OTHER ENDPOINTS (Placeholders) ====================
exports.getPenaltySummaryById = async (req, res) => {
  res.json({ success: true, message: 'Not implemented' });
};

exports.createPenaltySummary = async (req, res) => {
  res.json({ success: true, message: 'Not implemented' });
};

exports.getDeductionReport = async (req, res) => {
  res.json({ success: true, data: [] });
};

exports.getEmployeeDeductions = async (req, res) => {
  res.json({ success: true, data: [] });
};

exports.getEmployeePenaltySummary = async (req, res) => {
  res.json({ success: true, data: {} });
};

exports.getReductionRules = async (req, res) => {
  res.json({ success: true, data: {} });
};

exports.saveReductionRules = async (req, res) => {
  res.json({ success: true, message: 'Not implemented' });
};

exports.exportPenaltySummary = async (req, res) => {
  res.json({ success: true, message: 'Not implemented' });
};

exports.getPenaltyStatistics = async (req, res) => {
  res.json({ success: true, data: {} });
};