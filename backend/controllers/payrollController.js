// controllers/payrollController.js
const { sequelize, Op } = require('sequelize');
const db = require('../models');

// ==================== CONSTANTS (Excel/Old System) ====================
const WORKING_DAYS_PER_MONTH = 30;  // Fixed 30 days (Excel method)
const HOURS_PER_DAY = 8;
const PENSION_RATE = 0.07;
const COMPANY_PENSION_RATE = 0.11;
const PROPORTIONAL_PENSION_THRESHOLD = 15;      // Days present threshold for proportional pension
const PROPORTIONAL_ALLOWANCE_THRESHOLD = 25;    // Days present threshold for proportional allowances

// Old Ethiopian Tax Brackets (from Excel)
const TAX_BRACKETS = [
  { min: 0, max: 2000, rate: 0, deduction: 0 },
  { min: 2001, max: 4000, rate: 15, deduction: 300 },
  { min: 4001, max: 7000, rate: 20, deduction: 500 },
  { min: 7001, max: 10000, rate: 25, deduction: 850 },
  { min: 10001, max: 14000, rate: 30, deduction: 1350 },
  { min: 14001, max: Infinity, rate: 35, deduction: 2050 }
];

// Calculate tax using Excel method (nested IF) - NO ROUNDING
function calculateTax(taxableIncome) {
  if (taxableIncome <= 2000) return 0;
  if (taxableIncome <= 4000) return (taxableIncome - 2000) * 0.15;
  if (taxableIncome <= 7000) return (taxableIncome - 4000) * 0.20 + 300;
  if (taxableIncome <= 10000) return (taxableIncome - 7000) * 0.25 + 900;
  if (taxableIncome <= 14000) return (taxableIncome - 10000) * 0.30 + 1650;
  return (taxableIncome - 14000) * 0.35 + 2850;
}

// Helper function to get tax rate and deduction for a given income
function getTaxRateAndDeduction(income) {
  for (const bracket of TAX_BRACKETS) {
    if (income >= bracket.min && income <= bracket.max) {
      return {
        rate: bracket.rate,
        deduction: bracket.deduction,
        bracketMin: bracket.min,
        bracketMax: bracket.max === Infinity ? null : bracket.max
      };
    }
  }
  return { rate: 0, deduction: 0, bracketMin: 0, bracketMax: 0 };
}

// Helper function to calculate daily and hourly rates (Excel method)
function calculateRates(basicSalary) {
  const dailyRate = basicSalary / WORKING_DAYS_PER_MONTH;
  const hourlyRate = dailyRate / HOURS_PER_DAY;
  return { dailyRate, hourlyRate };
}

// Helper function to calculate proportional allowances
function calculateAllowances(allowances, daysPresent, totalDays) {
  let housingAllowance = allowances.housingAllowance;
  let transportAllowance = allowances.transportAllowance;
  let positionAllowance = allowances.positionAllowance;
  let mobileAllowance = allowances.mobileAllowance;
  let allowanceCalculationMethod = "full";
  let allowanceFactor = 1;
  
  if (daysPresent <= PROPORTIONAL_ALLOWANCE_THRESHOLD) {
    allowanceFactor = daysPresent / totalDays;
    housingAllowance = housingAllowance * allowanceFactor;
    transportAllowance = transportAllowance * allowanceFactor;
    positionAllowance = positionAllowance * allowanceFactor;
    mobileAllowance = mobileAllowance * allowanceFactor;
    allowanceCalculationMethod = "proportional";
  }
  
  const allowancesTotal = housingAllowance + transportAllowance + positionAllowance + mobileAllowance;
  
  return {
    housingAllowance,
    transportAllowance,
    positionAllowance,
    mobileAllowance,
    allowancesTotal,
    allowanceCalculationMethod,
    allowanceFactor
  };
}

// Helper function to calculate pension based on days present
function calculatePension(basicSalary, absentPenalty, absentDays, totalDays) {
  const daysPresent = totalDays - absentDays;
  let pensionBase, pension7, pension11, pensionCalculationMethod;
  
  if (daysPresent <= PROPORTIONAL_PENSION_THRESHOLD) {
    // Worked 15 days or less - pension on ACTUAL earned salary
    const actualEarnedSalary = basicSalary - absentPenalty;
    pensionBase = Math.max(0, actualEarnedSalary);
    pension7 = pensionBase * PENSION_RATE;
    pension11 = pensionBase * COMPANY_PENSION_RATE;
    pensionCalculationMethod = "proportional";
  } else {
    // Worked more than 15 days - pension on FULL basic salary
    pensionBase = basicSalary;
    pension7 = basicSalary * PENSION_RATE;
    pension11 = basicSalary * COMPANY_PENSION_RATE;
    pensionCalculationMethod = "full";
  }
  
  // Ensure no negative values
  pension7 = Math.max(0, pension7);
  pension11 = Math.max(0, pension11);
  
  return { pensionBase, pension7, pension11, pensionCalculationMethod, daysPresent };
}

// ==================== GET PAYROLL DATA ====================
exports.getPayrollData = async (req, res) => {
  try {
    const { year, month, department, search } = req.query;
    
    const currentYear = parseInt(year) || new Date().getFullYear();
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    
    // Fixed 30 days per month (Excel method)
    const TOTAL_DAYS_IN_MONTH = WORKING_DAYS_PER_MONTH;
    
    console.log(`Month: ${currentYear}-${currentMonth}, Using fixed: ${TOTAL_DAYS_IN_MONTH} days (Excel method)`);
    
    // Build where clause for employees
    const whereClause = { employment_status: 'active', is_active: true };
    
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { employee_code: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (department && department !== 'all') {
      whereClause.department_id = parseInt(department);
    }
    
    // Get all employees
    const employees = await db.Employee.findAll({
      where: whereClause,
      include: [
        { 
          model: db.Department, 
          as: 'Department', 
          attributes: ['department_id', 'name'] 
        }
      ],
      order: [['first_name', 'ASC']]
    });
    
    if (employees.length === 0) {
      return res.json({
        success: true,
        data: [],
        totals: { 
          totalGrossPay: 0, 
          totalTax: 0, 
          totalPension7: 0, 
          totalPension11: 0, 
          totalNetPay: 0,
          totalOvertimePay: 0,
          totalAbsentPenalty: 0,
          totalLatePenalty: 0,
          totalPenalties: 0
        },
        count: 0
      });
    }
    
    // Get employee IDs
    const employeeIds = employees.map(emp => emp.employee_id || emp.employeeId);
    
    // Fetch attendance records for the selected period
    const attendanceRecords = await db.AttendanceRecord.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        period_year: currentYear,
        period_month: currentMonth,
        is_valid: true
      }
    });
    
    // Create a map for quick attendance lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.employee_id, record);
    });
    
    // ==============================================
    // FETCH EMPLOYEE PENALTIES FROM DATABASE
    // ==============================================
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const penalties = await db.EmployeePenalty.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        month: monthStr,
        status: 'active'
      }
    });
    
    // Create a map for quick penalty lookup
    const penaltiesMap = new Map();
    penalties.forEach(penalty => {
      if (!penaltiesMap.has(penalty.employee_id)) {
        penaltiesMap.set(penalty.employee_id, []);
      }
      penaltiesMap.get(penalty.employee_id).push(penalty);
    });
    
    // Process each employee
    const payrollData = [];
    let totals = {
      totalGrossPay: 0,
      totalTax: 0,
      totalPension7: 0,
      totalPension11: 0,
      totalNetPay: 0,
      totalOvertimePay: 0,
      totalAbsentPenalty: 0,
      totalLatePenalty: 0,
      totalPenalties: 0
    };
    
    for (const emp of employees) {
      // Get employee values
      const employeeId = emp.employee_id || emp.employeeId;
      const basicSalary = Number(emp.basicSalary) || Number(emp.basic_salary) || 0;
      
      // Get raw allowance values
      const rawHousingAllowance = Number(emp.housingAllowance) || Number(emp.housing_allowance) || 0;
      const rawTransportAllowance = Number(emp.transportAllowance) || Number(emp.transport_allowance) || 0;
      const rawPositionAllowance = Number(emp.positionAllowance) || Number(emp.position_allowance) || 0;
      const rawMobileAllowance = Number(emp.mobileAllowance) || Number(emp.mobile_allowance) || 0;
      
      const departmentName = emp.Department?.name || 'Unassigned';
      const attendance = attendanceMap.get(employeeId);
      
      // Calculate daily and hourly rates (Excel method - fixed 30 days)
      const { dailyRate, hourlyRate } = calculateRates(basicSalary);
      
      console.log(`Employee ${employeeId}: Basic=${basicSalary}, DailyRate=${dailyRate.toFixed(2)}, HourlyRate=${hourlyRate.toFixed(2)}`);
      
      // Overtime calculations
      const normalOtMinutes = attendance ? (attendance.normal_ot_minutes || 0) : 0;
      const weekendOtMinutes = attendance ? (attendance.weekend_ot_minutes || 0) : 0;
      const holidayOtMinutes = attendance ? (attendance.holiday_ot_minutes || 0) : 0;
      
      const normalOtHours = normalOtMinutes / 60;
      const weekendOtHours = weekendOtMinutes / 60;
      const holidayOtHours = holidayOtMinutes / 60;
      
      const normalOtPay = hourlyRate * normalOtHours * 1.5;
      const weekendOtPay = hourlyRate * weekendOtHours * 2;
      const holidayOtPay = hourlyRate * holidayOtHours * 3;
      const overtimePay = normalOtPay + weekendOtPay + holidayOtPay;
      const totalOvertimeHours = normalOtHours + weekendOtHours + holidayOtHours;
      
      // Absent days penalty (deducted BEFORE tax)
      const absentDays = attendance ? (attendance.absence_days || 0) : 0;
      const absentPenalty = absentDays * dailyRate;
      
      // Late minutes penalty (deducted AFTER tax)
      const lateMinutes = attendance ? (attendance.late_minutes || 0) : 0;
      const latePenalty = lateMinutes * (hourlyRate / 60);
      
      // Total penalties for DISPLAY ONLY
      const totalPenaltiesDisplay = absentPenalty + latePenalty;
      
      // Calculate days present
      const daysPresent = TOTAL_DAYS_IN_MONTH - absentDays;
      
      // ==============================================
      // ALLOWANCE CALCULATION WITH PROPORTIONAL RULE
      // ==============================================
      const allowanceResult = calculateAllowances(
        {
          housingAllowance: rawHousingAllowance,
          transportAllowance: rawTransportAllowance,
          positionAllowance: rawPositionAllowance,
          mobileAllowance: rawMobileAllowance
        },
        daysPresent,
        TOTAL_DAYS_IN_MONTH
      );
      
      const {
        housingAllowance,
        transportAllowance,
        positionAllowance,
        mobileAllowance,
        allowancesTotal,
        allowanceCalculationMethod,
        allowanceFactor
      } = allowanceResult;
      
      // ==============================================
      // PENSION CALCULATION WITH PROPORTIONAL RULE
      // ==============================================
      const { pensionBase, pension7, pension11, pensionCalculationMethod } = 
        calculatePension(basicSalary, absentPenalty, absentDays, TOTAL_DAYS_IN_MONTH);
      
      // Calculate TAXABLE INCOME (Basic - Absence + Overtime + Allowances)
      const taxableIncome = basicSalary - absentPenalty + overtimePay + allowancesTotal;
      
      // Calculate tax using Excel method
      const tax = calculateTax(taxableIncome);
      
      // Government Net (Taxable Income - Tax - Employee Pension)
      const governmentNet = taxableIncome - tax - pension7;
      
      // Final Net Pay (Government Net - Late Penalty)
      const finalNetPay = governmentNet - latePenalty;
      
      // Get tax rate and deduction for this employee
      const taxInfo = getTaxRateAndDeduction(taxableIncome);
      
      // Calculate attendance rate
      const attendanceRate = TOTAL_DAYS_IN_MONTH > 0 ? (daysPresent / TOTAL_DAYS_IN_MONTH) * 100 : 0;
      
   // ==============================================
// GET EMPLOYEE PENALTIES FROM DATABASE
// ==============================================
const employeePenalties = penaltiesMap.get(employeeId) || [];
const formattedPenalties = employeePenalties.map(p => {
  const createdAt = p.created_at;
  const formattedDate = createdAt ? new Date(createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return {
    id: p.penalty_id,
    name: p.penalty_type,
    type: p.calculation_type,
    value: parseFloat(p.value),
    reference: p.reference,
    submittedBy: p.submitted_by,
    contact: p.contact,
    reason: p.reason,
    date: formattedDate,
    amount: p.calculation_type === 'percent' ? (basicSalary * parseFloat(p.value) / 100) : parseFloat(p.value)
  };
});
      // Calculate total other penalties amount
      const otherPenalityTotal = formattedPenalties.reduce((sum, p) => sum + p.amount, 0);
      
      // Final Net Pay after deducting other penalties
      const finalNetPayWithPenalties = finalNetPay - otherPenalityTotal;
      
      payrollData.push({
        id: employeeId,
        employeeId: employeeId,
        employeeCode: emp.employeeCode || emp.employee_code || '',
        fullName: `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim(),
        department: departmentName,
        
        // Period info
        totalDaysInMonth: TOTAL_DAYS_IN_MONTH,
        
        // Salary components
        basicSalary: basicSalary,
        housingAllowance: parseFloat(housingAllowance.toFixed(2)),
        transportAllowance: parseFloat(transportAllowance.toFixed(2)),
        positionAllowance: parseFloat(positionAllowance.toFixed(2)),
        mobileAllowance: parseFloat(mobileAllowance.toFixed(2)),
        allowancesTotal: parseFloat(allowancesTotal.toFixed(2)),
        
        // Raw allowances (for reference)
        rawHousingAllowance: rawHousingAllowance,
        rawTransportAllowance: rawTransportAllowance,
        rawPositionAllowance: rawPositionAllowance,
        rawMobileAllowance: rawMobileAllowance,
        
        // Daily and Hourly Rates
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        hourlyRate: parseFloat(hourlyRate.toFixed(2)),
        
        // Overtime details
        overtimeHours: parseFloat(totalOvertimeHours.toFixed(1)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        normalOtHours: parseFloat(normalOtHours.toFixed(1)),
        normalOtPay: parseFloat(normalOtPay.toFixed(2)),
        weekendOtHours: parseFloat(weekendOtHours.toFixed(1)),
        weekendOtPay: parseFloat(weekendOtPay.toFixed(2)),
        holidayOtHours: parseFloat(holidayOtHours.toFixed(1)),
        holidayOtPay: parseFloat(holidayOtPay.toFixed(2)),
        
        // Attendance penalties
        absentDays: absentDays,
        absentPenalty: parseFloat(absentPenalty.toFixed(2)),
        lateMinutes: lateMinutes,
        latePenalty: parseFloat(latePenalty.toFixed(2)),
        totalPenalties: parseFloat(totalPenaltiesDisplay.toFixed(2)),
        
        // Days present
        daysPresent: daysPresent,
        
        // Payroll calculations
        taxableIncome: parseFloat(taxableIncome.toFixed(2)),
        grossPay: parseFloat((basicSalary + allowancesTotal + overtimePay).toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        
        // Pension with proportional rule
        pensionBase: parseFloat(pensionBase.toFixed(2)),
        pension7: parseFloat(pension7.toFixed(2)),
        pension11: parseFloat(pension11.toFixed(2)),
        pensionCalculationMethod: pensionCalculationMethod,
        pensionNote: daysPresent <= PROPORTIONAL_PENSION_THRESHOLD 
          ? `Pension calculated on actual earned salary (${pensionBase.toFixed(2)}) because employee worked ${daysPresent} days (≤ ${PROPORTIONAL_PENSION_THRESHOLD} days)`
          : `Pension calculated on full basic salary (${pensionBase.toFixed(2)}) because employee worked ${daysPresent} days (> ${PROPORTIONAL_PENSION_THRESHOLD} days)`,
        
        // Allowance info
        allowanceCalculationMethod: allowanceCalculationMethod,
        allowanceFactor: allowanceFactor,
        allowanceNote: allowanceCalculationMethod === "proportional" 
          ? `Allowances calculated proportionally (${(allowanceFactor * 100).toFixed(0)}% of full amount) because employee worked ${daysPresent} days (≤ ${PROPORTIONAL_ALLOWANCE_THRESHOLD} days)`
          : `Allowances paid in full (100%) because employee worked ${daysPresent} days (> ${PROPORTIONAL_ALLOWANCE_THRESHOLD} days)`,
        
        // Penalties from database (Other Penalties)
        Penality: formattedPenalties,
        otherPenalityTotal: parseFloat(otherPenalityTotal.toFixed(2)),
        
        governmentNet: parseFloat(governmentNet.toFixed(2)),
        finalNetPay: parseFloat((finalNetPayWithPenalties > 0 ? finalNetPayWithPenalties : 0).toFixed(2)),
        
        // Tax rate and deduction used for this employee
        taxRate: taxInfo.rate,
        taxDeduction: taxInfo.deduction,
        taxBracketRange: `${taxInfo.bracketMin} - ${taxInfo.bracketMax === null ? '∞' : taxInfo.bracketMax}`,
        taxCalculationFormula: taxInfo.deduction > 0 
          ? `(${taxableIncome.toFixed(2)} × ${taxInfo.rate}%) - ${taxInfo.deduction} = ${(taxableIncome * taxInfo.rate / 100 - taxInfo.deduction).toFixed(2)}`
          : `${taxableIncome.toFixed(2)} × ${taxInfo.rate}% = ${(taxableIncome * taxInfo.rate / 100).toFixed(2)}`,
        
        // Additional info
        isOnHold: attendance ? (attendance.is_on_hold || false) : false,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        
        // Attendance summary
        attendanceSummary: {
          totalDaysInMonth: TOTAL_DAYS_IN_MONTH,
          presentDays: attendance ? (attendance.present_days || 0) : 0,
          absentDays: absentDays,
          lateMinutes: lateMinutes,
          lateDays: attendance ? (attendance.late_days || 0) : 0,
          normalOtHours: parseFloat(normalOtHours.toFixed(1)),
          weekendOtHours: parseFloat(weekendOtHours.toFixed(1)),
          holidayOtHours: parseFloat(holidayOtHours.toFixed(1)),
          totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(1))
        },
        
        // Frontend compatibility fields
        deductions: formattedPenalties,
        otherDeductionsTotal: parseFloat(otherPenalityTotal.toFixed(2)),
        totalDeductions: parseFloat((tax + pension7 + latePenalty + otherPenalityTotal).toFixed(2)),
        internalNet: parseFloat((finalNetPayWithPenalties > 0 ? finalNetPayWithPenalties : 0).toFixed(2)),
        penaltySummary: {
          absentDays: absentDays,
          absentPenalty: parseFloat(absentPenalty.toFixed(2)),
          lateMinutes: lateMinutes,
          latePenalty: parseFloat(latePenalty.toFixed(2)),
          total: parseFloat(totalPenaltiesDisplay.toFixed(2))
        }
      });
      
      // Update totals
      totals.totalGrossPay += (basicSalary + allowancesTotal + overtimePay);
      totals.totalTax += tax;
      totals.totalPension7 += pension7;
      totals.totalPension11 += pension11;
      totals.totalNetPay += (finalNetPayWithPenalties > 0 ? finalNetPayWithPenalties : 0);
      totals.totalOvertimePay += overtimePay;
      totals.totalAbsentPenalty += absentPenalty;
      totals.totalLatePenalty += latePenalty;
      totals.totalPenalties += totalPenaltiesDisplay;
    }
    
    // Prepare tax brackets for response
    const taxBracketsWithDeduction = TAX_BRACKETS.map(bracket => ({
      min: bracket.min,
      max: bracket.max === Infinity ? null : bracket.max,
      rate: bracket.rate,
      deduction: bracket.deduction,
      formula: bracket.deduction > 0 
        ? `(${bracket.rate}% × Income) - ${bracket.deduction}`
        : `${bracket.rate}% × Income`,
      example: bracket.max !== Infinity ? `Income ${bracket.min + 500} ETB → Tax = ${((bracket.min + 500) * bracket.rate / 100 - bracket.deduction).toFixed(2)} ETB` : null
    }));
    
    res.json({
      success: true,
      data: payrollData,
      totals: {
        totalGrossPay: parseFloat(totals.totalGrossPay.toFixed(2)),
        totalTax: parseFloat(totals.totalTax.toFixed(2)),
        totalPension7: parseFloat(totals.totalPension7.toFixed(2)),
        totalPension11: parseFloat(totals.totalPension11.toFixed(2)),
        totalNetPay: parseFloat(totals.totalNetPay.toFixed(2)),
        totalOvertimePay: parseFloat(totals.totalOvertimePay.toFixed(2)),
        totalAbsentPenalty: parseFloat(totals.totalAbsentPenalty.toFixed(2)),
        totalLatePenalty: parseFloat(totals.totalLatePenalty.toFixed(2)),
        totalPenalties: parseFloat(totals.totalPenalties.toFixed(2))
      },
      period: {
        year: currentYear,
        month: currentMonth,
        monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' }),
        totalDays: TOTAL_DAYS_IN_MONTH,
        method: "Excel Method - Fixed 30 days",
        note: `Calculated using old Ethiopian tax system (pre-2024) with fixed 30 days per month`,
        dailyRateNote: `Daily rate = Basic Salary ÷ 30 days (fixed)`,
        hourlyRateNote: `Hourly rate = Daily rate ÷ 8 hours`
      },
      taxBrackets: taxBracketsWithDeduction,
      taxCalculationInfo: {
        method: "Old Ethiopian System (from Excel)",
        formula: "IF(Taxable ≤ 2000, 0, IF(Taxable ≤ 4000, (Taxable-2000)×15%, IF(Taxable ≤ 7000, (Taxable-4000)×20%+300, ...)))",
        taxableIncomeFormula: "Basic Salary - Absence Penalty + Overtime + All Allowances",
        rounding: "No rounding - exact values to 2 decimal places",
        workingDays: "Fixed 30 days per month",
        pensionBase: "Full Basic Salary if days present > 15, otherwise Actual Earned Salary",
        pensionThreshold: `${PROPORTIONAL_PENSION_THRESHOLD} days`,
        allowanceBase: "Full Allowances if days present > 25, otherwise Proportional (days/30)",
        allowanceThreshold: `${PROPORTIONAL_ALLOWANCE_THRESHOLD} days`,
        penaltyHandling: {
          absentPenalty: "Deducted BEFORE tax (reduces taxable income)",
          latePenalty: "Deducted AFTER tax (from government net)",
          totalPenalties: "For display only - not used in calculation"
        }
      },
      count: payrollData.length
    });
    
  } catch (error) {
    console.error('Get payroll data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
 
// ==================== SIMPLIFIED STATS ENDPOINT (Only for 6 cards) ====================
exports.getStats = async (req, res) => {
  try {
    // Get total active employees - this should always work
    const totalEmployees = await db.Employee.count({
      where: { is_active: true }
    });

    // Initialize default values
    let totalGrossPay = 0;
    let totalTax = 0;
    let totalPension7 = 0;
    let totalPension11 = 0;
    let activeHolds = 0;

    // Try to get payroll totals if PayrollRecord table exists
    try {
      if (db.PayrollRecord) {
        const latestPayroll = await db.PayrollRecord.findOne({
          order: [['period_year', 'DESC'], ['period_month', 'DESC']],
          attributes: [
            [db.sequelize.fn('SUM', db.sequelize.col('gross_pay')), 'totalGrossPay'],
            [db.sequelize.fn('SUM', db.sequelize.col('tax')), 'totalTax'],
            [db.sequelize.fn('SUM', db.sequelize.col('pension_7')), 'totalPension7'],
            [db.sequelize.fn('SUM', db.sequelize.col('pension_11')), 'totalPension11']
          ]
        });
        
        if (latestPayroll) {
          totalGrossPay = parseFloat(latestPayroll.dataValues?.totalGrossPay || 0);
          totalTax = parseFloat(latestPayroll.dataValues?.totalTax || 0);
          totalPension7 = parseFloat(latestPayroll.dataValues?.totalPension7 || 0);
          totalPension11 = parseFloat(latestPayroll.dataValues?.totalPension11 || 0);
        }
      }
    } catch (payrollError) {
      console.log('PayrollRecord table not found, using default values');
    }

    // Try to get active holds if AttendanceRecord table exists
    try {
      if (db.AttendanceRecord) {
        activeHolds = await db.AttendanceRecord.count({
          where: { is_on_hold: true, is_valid: true }
        });
      }
    } catch (holdError) {
      console.log('AttendanceRecord table not found, using default values');
    }

    const responseData = {
      employees: totalEmployees || 0,
      grossPay: totalGrossPay,
      tax: totalTax,
      pension7: totalPension7,
      pension11: totalPension11,
      activeHolds: activeHolds || 0
    };
    
    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    // Return default values instead of error
    res.json({
      success: true,
      data: {
        employees: 0,
        grossPay: 0,
        tax: 0,
        pension7: 0,
        pension11: 0,
        activeHolds: 0
      },
      timestamp: new Date().toISOString(),
      note: 'Using default values - some tables may not exist yet'
    });
  }
};
// ==================== PROCESS PAYROLL ====================
exports.processPayroll = async (req, res) => {
  try {
    console.log('=== PROCESS PAYROLL STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { month, paymentDate, unclaimedEmployeeCodes } = req.body;
    
    // Validate required fields
    if (!month || !paymentDate) {
      console.log('Validation failed: Missing month or payment date');
      return res.status(400).json({
        success: false,
        error: 'Month and payment date are required'
      });
    }
    
    const [year, monthNum] = month.split('-');
    
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      console.log('Validation failed: Invalid month format');
      return res.status(400).json({
        success: false,
        error: 'Invalid month format. Use YYYY-MM'
      });
    }
    
    console.log(`Processing payroll for: ${month} (Year: ${year}, Month: ${monthNum})`);
    console.log(`Payment date: ${paymentDate}`);
    console.log(`Unclaimed codes: ${unclaimedEmployeeCodes?.length || 0} codes`);
    
    // 1. Check if this month has already been processed
    console.log('Checking if month already processed...');
    const existingProcessing = await db.PayrollProcessing.findOne({
      where: { month_year: month }
    });
    
    if (existingProcessing) {
      console.log(`Month ${month} already processed, rejecting`);
      return res.status(400).json({
        success: false,
        error: `Payroll for ${month} has already been processed`
      });
    }
    console.log('Month not processed yet, continuing...');
    
    // 2. Get all active employees
    console.log('Fetching active employees...');
    const employees = await db.Employee.findAll({
      where: { is_active: true, employment_status: 'active' },
      include: [
        { model: db.Department, as: 'Department', attributes: ['name'] }
      ]
    });
    
    console.log(`Found ${employees.length} active employees`);
    
    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active employees found'
      });
    }
    
    let paidCount = 0;
    let unclaimedCount = 0;
    let totalPaidAmount = 0;
    const unclaimedList = [];
    const PayrollHistoryList = [];
    
    // 3. Process each employee
    console.log('Starting employee processing loop...');
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      try {
        console.log(`\n--- Processing employee ${i + 1}/${employees.length}: ${emp.employee_code} ---`);
        
        const employeeId = emp.employee_id || emp.employeeId;
        const employeeCode = emp.employee_code || emp.employeeCode;
        const departmentName = emp.Department?.name || 'Unassigned';
        const basicSalary = Number(emp.basicSalary) || Number(emp.basic_salary) || 0;
        
        console.log(`Employee: ${employeeCode}, Name: ${emp.first_name} ${emp.last_name}, Basic Salary: ${basicSalary}`);
        
        if (basicSalary <= 0) {
          console.log(`Warning: Employee ${employeeCode} has zero basic salary`);
        }
        
        // Get attendance for this month
        console.log(`Fetching attendance for ${employeeCode} - Year: ${year}, Month: ${monthNum}`);
        const attendance = await db.AttendanceRecord.findOne({
          where: {
            employee_id: employeeId,
            period_year: parseInt(year),
            period_month: parseInt(monthNum),
            is_valid: true
          }
        });
        
        console.log(`Attendance found: ${attendance ? 'Yes' : 'No'}`);
        if (attendance) {
          console.log(`  Absent days: ${attendance.absence_days || 0}, Late minutes: ${attendance.late_minutes || 0}`);
          console.log(`  OT - Normal: ${attendance.normal_ot_minutes || 0}, Weekend: ${attendance.weekend_ot_minutes || 0}, Holiday: ${attendance.holiday_ot_minutes || 0}`);
        }
        
        // Calculate rates
        const dailyRate = basicSalary / WORKING_DAYS_PER_MONTH;
        const hourlyRate = dailyRate / HOURS_PER_DAY;
        
        console.log(`Rates - Daily: ${dailyRate.toFixed(2)}, Hourly: ${hourlyRate.toFixed(2)}`);
        
        // Get attendance data
        const absentDays = attendance?.absence_days || 0;
        const lateMinutes = attendance?.late_minutes || 0;
        const normalOtMinutes = attendance?.normal_ot_minutes || 0;
        const weekendOtMinutes = attendance?.weekend_ot_minutes || 0;
        const holidayOtMinutes = attendance?.holiday_ot_minutes || 0;
        
        // Calculate overtime
        const normalOtHours = normalOtMinutes / 60;
        const weekendOtHours = weekendOtMinutes / 60;
        const holidayOtHours = holidayOtMinutes / 60;
        
        const normalOtPay = hourlyRate * normalOtHours * 1.5;
        const weekendOtPay = hourlyRate * weekendOtHours * 2;
        const holidayOtPay = hourlyRate * holidayOtHours * 3;
        const overtimePay = normalOtPay + weekendOtPay + holidayOtPay;
        
        console.log(`Overtime - Hours: ${(normalOtHours + weekendOtHours + holidayOtHours).toFixed(1)}, Pay: ${overtimePay.toFixed(2)}`);
        
        // Calculate absent penalty
        const absentPenalty = absentDays * dailyRate;
        const daysPresent = WORKING_DAYS_PER_MONTH - absentDays;
        
        console.log(`Absent - Days: ${absentDays}, Penalty: ${absentPenalty.toFixed(2)}, Days Present: ${daysPresent}`);
        
        // Get raw allowance values from employee
        const rawHousingAllowance = Number(emp.housingAllowance) || Number(emp.housing_allowance) || 0;
        const rawTransportAllowance = Number(emp.transportAllowance) || Number(emp.transport_allowance) || 0;
        const rawPositionAllowance = Number(emp.positionAllowance) || Number(emp.position_allowance) || 0;
        const rawMobileAllowance = Number(emp.mobileAllowance) || Number(emp.mobile_allowance) || 0;
        
        // Calculate allowances (proportional if days present <= 25)
        let housingAllowance = rawHousingAllowance;
        let transportAllowance = rawTransportAllowance;
        let positionAllowance = rawPositionAllowance;
        let mobileAllowance = rawMobileAllowance;
        let allowancesTotal = housingAllowance + transportAllowance + positionAllowance + mobileAllowance;
        
        if (daysPresent <= PROPORTIONAL_ALLOWANCE_THRESHOLD && daysPresent > 0) {
          const factor = daysPresent / WORKING_DAYS_PER_MONTH;
          housingAllowance = housingAllowance * factor;
          transportAllowance = transportAllowance * factor;
          positionAllowance = positionAllowance * factor;
          mobileAllowance = mobileAllowance * factor;
          allowancesTotal = housingAllowance + transportAllowance + positionAllowance + mobileAllowance;
          console.log(`Allowances proportional - Factor: ${factor.toFixed(2)}, Total: ${allowancesTotal.toFixed(2)}`);
        } else {
          console.log(`Allowances full - Total: ${allowancesTotal.toFixed(2)}`);
        }
        
        // Calculate pension (proportional if days present <= 15)
        let pension7, pension11;
        if (daysPresent <= PROPORTIONAL_PENSION_THRESHOLD && daysPresent > 0) {
          const actualEarnedSalary = Math.max(0, basicSalary - absentPenalty);
          pension7 = actualEarnedSalary * PENSION_RATE;
          pension11 = actualEarnedSalary * COMPANY_PENSION_RATE;
          console.log(`Pension proportional - Base: ${actualEarnedSalary.toFixed(2)}, 7%: ${pension7.toFixed(2)}, 11%: ${pension11.toFixed(2)}`);
        } else {
          pension7 = basicSalary * PENSION_RATE;
          pension11 = basicSalary * COMPANY_PENSION_RATE;
          console.log(`Pension full - 7%: ${pension7.toFixed(2)}, 11%: ${pension11.toFixed(2)}`);
        }
        
        // Calculate gross pay and taxable income
        const grossPay = basicSalary + allowancesTotal + overtimePay;
        const taxableIncome = Math.max(0, basicSalary - absentPenalty + overtimePay + allowancesTotal);
        
        // Calculate tax
        const tax = calculateTax(taxableIncome);
        
        console.log(`Gross Pay: ${grossPay.toFixed(2)}, Taxable Income: ${taxableIncome.toFixed(2)}, Tax: ${tax.toFixed(2)}`);
        
        // Calculate government net and final net
        const governmentNet = Math.max(0, taxableIncome - tax - pension7);
        const latePenalty = lateMinutes * (hourlyRate / 60);
        let finalNetPay = Math.max(0, governmentNet - latePenalty);
        
        console.log(`Government Net: ${governmentNet.toFixed(2)}, Late Penalty: ${latePenalty.toFixed(2)}, Net Pay before other penalties: ${finalNetPay.toFixed(2)}`);
        
        // Get active penalties for this employee
        const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
        console.log(`Fetching active penalties for month: ${monthStr}`);
        
        const activePenalties = await db.EmployeePenalty.findAll({
          where: {
            employee_id: employeeId,
            month: { [Op.lte]: monthStr },
            status: 'active'
          }
        });
        
        console.log(`Found ${activePenalties.length} active penalties`);
        
        // Calculate penalty amounts
        let otherPenalityTotal = 0;
        
        for (const penalty of activePenalties) {
          let amount = 0;
          if (penalty.calculation_type === 'percent') {
            amount = (finalNetPay * parseFloat(penalty.value)) / 100;
            console.log(`  Penalty: ${penalty.penalty_type} (${penalty.value}% of ${finalNetPay.toFixed(2)} = ${amount.toFixed(2)})`);
          } else {
            amount = parseFloat(penalty.value);
            console.log(`  Penalty: ${penalty.penalty_type} (Fixed ${amount.toFixed(2)})`);
          }
          otherPenalityTotal += amount;
        }
        
        finalNetPay = Math.max(0, finalNetPay - otherPenalityTotal);
        console.log(`Final Net Pay after all deductions: ${finalNetPay.toFixed(2)}`);
        
        const employeeName = `${emp.first_name || emp.firstName || ''} ${emp.last_name || emp.lastName || ''}`.trim() || employeeCode;
        const isUnclaimed = unclaimedEmployeeCodes && unclaimedEmployeeCodes.includes(employeeCode);
        console.log(`Is Unclaimed: ${isUnclaimed}`);
        
        if (isUnclaimed) {
          // Add to unclaimed list with employee_code
          unclaimedList.push({
            employeeId: employeeId,
            employeeCode: employeeCode,  // FIXED: Added employee_code
            employeeName: employeeName,
            department: departmentName,
            amount: finalNetPay,
            dueDate: paymentDate,
            month: monthStr,
            daysOverdue: 0,
            status: 'unclaimed'
          });
          unclaimedCount++;
          console.log(`Added to UNCLAIMED list`);
        } else {
          // Add to payment history with employee_code
          PayrollHistoryList.push({
            employeeId: employeeId,
            employeeCode: employeeCode,  // FIXED: Added employee_code
            employeeName: employeeName,
            department: departmentName,
            amount: finalNetPay,
            paymentDate: paymentDate,
            month: monthStr,
            method: 'Bank Transfer',
            transactionId: `PAY-${Date.now()}-${employeeCode}`,
            processedBy: req.user?.username || 'System',
            status: 'completed',
            source: 'normal',
            notes: `Regular salary payment for ${monthStr}`
          });
          paidCount++;
          totalPaidAmount += finalNetPay;
          console.log(`Added to PAYMENT HISTORY list`);
        }
        
        // Update penalty status to 'applied'
        if (activePenalties.length > 0) {
          console.log(`Updating ${activePenalties.length} penalties status to 'applied'`);
          await db.EmployeePenalty.update(
            { status: 'applied' },
            {
              where: {
                penalty_id: { [Op.in]: activePenalties.map(p => p.penalty_id) }
              }
            }
          );
        }
        
      } catch (empError) {
        console.error(`Error processing employee ${emp.employee_code}:`, empError);
        // Continue with next employee
      }
    }
    
    console.log('\n=== PROCESSING SUMMARY ===');
    console.log(`Total employees processed: ${employees.length}`);
    console.log(`Paid: ${paidCount}, Unclaimed: ${unclaimedCount}`);
    console.log(`Total paid amount: ${totalPaidAmount.toFixed(2)}`);
    
    // 4. Save payroll processing record
    console.log('\nSaving payroll processing record...');
    const payrollProcessing = await db.PayrollProcessing.create({
      month_year: month,
      year: parseInt(year),
      month: parseInt(monthNum),
      payment_date: paymentDate,
      status: 'completed',
      processed_by: req.user?.username || req.user?.userId || 'System',
      processed_at: new Date(),
      paid_count: paidCount,
      unclaimed_count: unclaimedCount,
      total_amount: Math.round(totalPaidAmount * 100) / 100,
      unclaimed_file_name: unclaimedEmployeeCodes?.length > 0 ? `unclaimed_${month}.csv` : null
    });
    
    console.log(`Payroll processing record saved. ID: ${payrollProcessing.processing_id}`);
    
    // 5. Save to PayrollHistory and UnclaimedPayroll tables
    console.log('\n=== CHECKING DATABASE MODELS ===');
    console.log('db.PayrollHistory exists:', !!db.PayrollHistory);
    console.log('db.UnclaimedPayroll exists:', !!db.UnclaimedPayroll);
    
    // Save to PayrollHistory
    if (db.PayrollHistory && PayrollHistoryList.length > 0) {
      console.log(`\nSaving ${PayrollHistoryList.length} records to PayrollHistory...`);
      let savedCount = 0;
      for (const payment of PayrollHistoryList) {
        try {
          const result = await db.PayrollHistory.create({
            payroll_processing_id: payrollProcessing.processing_id,
            employee_id: payment.employeeId,
            employee_code: payment.employeeCode,
            employee_name: payment.employeeName,
            department: payment.department,
            amount: payment.amount,
            payment_date: payment.paymentDate,
            month: payment.month,
            method: payment.method,
            transaction_id: payment.transactionId,
            processed_by: payment.processedBy,
            status: payment.status,
            source: payment.source,
            notes: payment.notes
          });
          savedCount++;
          console.log(`  ✓ Saved payment for ${payment.employeeCode} (ID: ${result.history_id})`);
        } catch (saveError) {
          console.error(`  ✗ Error saving payment for ${payment.employeeCode}:`, saveError.message);
          console.error('  Payment data:', JSON.stringify(payment, null, 2));
        }
      }
      console.log(`PayrollHistory save complete: ${savedCount}/${PayrollHistoryList.length} records saved`);
    } else if (!db.PayrollHistory) {
      console.log('⚠️ db.PayrollHistory model not found! Skipping PayrollHistory save.');
    } else {
      console.log('No payment history records to save');
    }
    
    // Save to UnclaimedPayroll
    if (db.UnclaimedPayroll && unclaimedList.length > 0) {
      console.log(`\nSaving ${unclaimedList.length} records to UnclaimedPayroll...`);
      let savedCount = 0;
      for (const unclaimed of unclaimedList) {
        try {
          const result = await db.UnclaimedPayroll.create({
            payroll_processing_id: payrollProcessing.processing_id,
            employee_id: unclaimed.employeeId,
            employee_code: unclaimed.employeeCode,
            employee_name: unclaimed.employeeName,
            department: unclaimed.department,
            amount: unclaimed.amount,
            due_date: unclaimed.dueDate,
            month: unclaimed.month,
            days_overdue: 0,
            status: 'unclaimed',
            notes: null
          });
          savedCount++;
          console.log(`  ✓ Saved unclaimed for ${unclaimed.employeeCode} (ID: ${result.unclaimed_id})`);
        } catch (saveError) {
          console.error(`  ✗ Error saving unclaimed for ${unclaimed.employeeCode}:`, saveError.message);
          console.error('  Unclaimed data:', JSON.stringify(unclaimed, null, 2));
        }
      }
      console.log(`UnclaimedPayroll save complete: ${savedCount}/${unclaimedList.length} records saved`);
    } else if (!db.UnclaimedPayroll) {
      console.log('⚠️ db.UnclaimedPayroll model not found! Skipping UnclaimedPayroll save.');
    } else {
      console.log('No unclaimed records to save');
    }
    
    console.log('\n=== PROCESS PAYROLL COMPLETED SUCCESSFULLY ===');
    
    res.json({
      success: true,
      data: {
        payrollProcessingId: payrollProcessing.processing_id,
        month: month,
        paymentDate: paymentDate,
        paidCount: paidCount,
        unclaimedCount: unclaimedCount,
        totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
        unclaimedList: unclaimedList,
        PayrollHistoryList: PayrollHistoryList
      },
      message: `Payroll for ${month} processed successfully. ${paidCount} employees paid, ${unclaimedCount} marked as unclaimed.`
    });
    
  } catch (error) {
    console.error('\n=== PROCESS PAYROLL FAILED ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process payroll'
    });
  }
};

// ==================== CHECK IF MONTH IS PROCESSED ====================
exports.checkMonthProcessed = async (req, res) => {
  try {
    const { monthYear } = req.params;
    
    const existing = await db.PayrollProcessing.findOne({
      where: { month_year: monthYear }
    });
    
    res.json({
      success: true,
      isProcessed: !!existing,
      data: existing
    });
  } catch (error) {
    console.error('Check month processed error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET PROCESSED MONTHS ====================
exports.getProcessedMonths = async (req, res) => {
  try {
    const processedMonths = await db.PayrollProcessing.findAll({
      where: { status: 'completed' },
      attributes: ['processing_id', 'month_year', 'payment_date', 'processed_at', 'paid_count', 'unclaimed_count', 'total_amount'],
      order: [['month_year', 'DESC']]
    });
    
    res.json({
      success: true,
      data: processedMonths
    });
  } catch (error) {
    console.error('Get processed months error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET ACTIVE EMPLOYEES ====================
exports.getActiveEmployees = async (req, res) => {
  try {
    const employees = await db.Employee.findAll({
      where: { is_active: true, employment_status: 'active' },
      attributes: ['employee_id', 'employee_code', 'first_name', 'last_name', 'basic_salary', 'basicSalary', 'department_id'],
      include: [
        { model: db.Department, as: 'Department', attributes: ['name'] }
      ],
      order: [['first_name', 'ASC']]
    });
    
    const formattedEmployees = employees.map(emp => ({
      id: emp.employee_id,
      employeeCode: emp.employee_code,
      fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      department: emp.Department?.name || 'Unassigned',
      basicSalary: Number(emp.basic_salary) || Number(emp.basicSalary) || 0
    }));
    
    res.json({
      success: true,
      data: formattedEmployees,
      count: formattedEmployees.length
    });
  } catch (error) {
    console.error('Get active employees error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET PAYMENT HISTORY ====================
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, employeeId, month, year, department, search } = req.query;
    
    const whereClause = {};
    
    // Apply filters
    if (employeeId) {
      whereClause.employee_id = parseInt(employeeId);
    }
    
    if (month) {
      whereClause.month = month;
    }
    
    if (year) {
      // Filter by year (month format is YYYY-MM)
      whereClause.month = { [Op.like]: `${year}-%` };
    }
    
    if (department && department !== 'all') {
      whereClause.department = department;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { employee_code: { [Op.like]: `%${search}%` } },
        { employee_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get payment history with pagination
    const { count, rows } = await db.PayrollHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['employee_id', 'employee_code', 'first_name', 'last_name', 'basic_salary']
        },
        {
          model: db.PayrollProcessing,
          as: 'payrollProcessing',
          attributes: ['processing_id', 'payment_date', 'processed_by', 'processed_at']
        }
      ],
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalRecords: count,
        recordsPerPage: parseInt(limit)
      },
      summary: {
        totalAmount: rows.reduce((sum, record) => sum + parseFloat(record.amount), 0),
        averageAmount: rows.length > 0 ? rows.reduce((sum, record) => sum + parseFloat(record.amount), 0) / rows.length : 0
      }
    });
    
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET PAYMENT HISTORY DETAIL ====================
exports.getPaymentHistoryDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const paymentRecord = await db.PayrollHistory.findOne({
      where: { history_id: id },
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['employee_id', 'employee_code', 'first_name', 'last_name', 'basic_salary', 'department_id']
        },
        {
          model: db.PayrollProcessing,
          as: 'payrollProcessing',
          attributes: ['processing_id', 'month_year', 'payment_date', 'processed_by', 'processed_at', 'paid_count', 'unclaimed_count', 'total_amount']
        }
      ]
    });
    
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }
    
    res.json({
      success: true,
      data: paymentRecord
    });
    
  } catch (error) {
    console.error('Get payment history detail error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET UNCLAIMED PAYROLL ====================
exports.getUnclaimedPayroll = async (req, res) => {
  try {
    const { page = 1, limit = 50, employeeId, month, department, search } = req.query;
    
    const whereClause = { status: 'unclaimed' };
    
    // Apply filters
    if (employeeId) {
      whereClause.employee_id = parseInt(employeeId);
    }
    
    if (month) {
      whereClause.month = month;
    }
    
    if (department && department !== 'all') {
      whereClause.department = department;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { employee_code: { [Op.like]: `%${search}%` } },
        { employee_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get unclaimed payroll with pagination
    const { count, rows } = await db.UnclaimedPayroll.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['employee_id', 'employee_code', 'first_name', 'last_name']
        }
      ],
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    // Calculate days overdue for each record
    const today = new Date();
    const rowsWithOverdue = rows.map(record => {
      const dueDate = new Date(record.due_date);
      const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      return {
        ...record.toJSON(),
        days_overdue: daysOverdue
      };
    });
    
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.json({
      success: true,
      data: rowsWithOverdue,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalRecords: count,
        recordsPerPage: parseInt(limit)
      },
      summary: {
        totalUnclaimedAmount: rows.reduce((sum, record) => sum + parseFloat(record.amount), 0),
        totalRecords: count
      }
    });
    
  } catch (error) {
    console.error('Get unclaimed payroll error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== PAY UNCLAIMED SALARY ====================
exports.payUnclaimedSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate, method, notes } = req.body;
    
    console.log(`Processing payment for unclaimed ID: ${id}`);
    
    // Find the unclaimed record
    const unclaimedRecord = await db.UnclaimedPayroll.findOne({
      where: { 
        unclaimed_id: id,
        status: 'unclaimed'
      },
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['employee_id', 'employee_code', 'first_name', 'last_name', 'department_id']
        }
      ]
    });
    
    if (!unclaimedRecord) {
      return res.status(404).json({
        success: false,
        error: 'Unclaimed record not found or already processed'
      });
    }
    
    // Get the payroll processing record
    const payrollProcessing = await db.PayrollProcessing.findOne({
      where: { processing_id: unclaimedRecord.payroll_processing_id }
    });
    
    // Create payment history record
    const paymentRecord = await db.PayrollHistory.create({
      payroll_processing_id: unclaimedRecord.payroll_processing_id,
      employee_id: unclaimedRecord.employee_id,
      employee_code: unclaimedRecord.employee_code,
      employee_name: unclaimedRecord.employee_name,
      department: unclaimedRecord.department,
      amount: unclaimedRecord.amount,
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
      month: unclaimedRecord.month,
      method: method || 'Cash',
      transaction_id: `UNCLAIMED-${Date.now()}-${unclaimedRecord.employee_code}`,
      processed_by: req.user?.username || 'System',
      status: 'completed',
      source: 'unclaimed',
      notes: notes || `Payment from unclaimed salary for ${unclaimedRecord.month}`
    });
    
    // DELETE the unclaimed record (remove from unclaimed table)
    await unclaimedRecord.destroy();
    
    res.json({
      success: true,
      data: {
        paymentRecord,
        message: `Payment of ${unclaimedRecord.amount} processed successfully for ${unclaimedRecord.employee_name} and removed from unclaimed`
      },
      message: `Payment of ${unclaimedRecord.amount} processed successfully for ${unclaimedRecord.employee_name}`
    });
    
  } catch (error) {
    console.error('Pay unclaimed salary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== BULK RETURN UNCLAIMED TO RETURNED PAYROLL ====================
exports.bulkReturnUnclaimed = async (req, res) => {
  try {
    const { unclaimedIds, reason } = req.body;
    
    if (!unclaimedIds || !Array.isArray(unclaimedIds) || unclaimedIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No unclaimed records selected for return'
      });
    }
    
    console.log(`Bulk returning ${unclaimedIds.length} unclaimed records to returned_payroll table`);
    
    const returnedRecords = [];
    
    for (const id of unclaimedIds) {
      const unclaimedRecord = await db.UnclaimedPayroll.findOne({
        where: { 
          unclaimed_id: id,
          status: 'unclaimed'
        }
      });
      
      if (unclaimedRecord) {
        // Create record in returned_payroll table
        const returnedRecord = await db.ReturnedPayroll.create({
          payroll_processing_id: unclaimedRecord.payroll_processing_id,
          employee_id: unclaimedRecord.employee_id,
          employee_code: unclaimedRecord.employee_code,
          employee_name: unclaimedRecord.employee_name,
          department: unclaimedRecord.department,
          month: unclaimedRecord.month,
          original_payment_id: null,
          original_amount: unclaimedRecord.amount,
          return_date: new Date().toISOString().split('T')[0],
          return_reason: reason || 'Moved from unclaimed',
          return_source: 'unclaimed',
          status: 'pending',
          paid_amount: 0,
          remaining_amount: unclaimedRecord.amount,
          kept_amount: 0,
          payment_history_id: null
        });
        
        // DELETE the unclaimed record (remove from unclaimed table)
        await unclaimedRecord.destroy();
        
        returnedRecords.push(returnedRecord);
      }
    }
    
    res.json({
      success: true,
      data: {
        returnedCount: returnedRecords.length,
        returnedRecords: returnedRecords,
        totalRequested: unclaimedIds.length
      },
      message: `${returnedRecords.length} unclaimed salaries moved to returned payroll and removed from unclaimed`
    });
    
  } catch (error) {
    console.error('Bulk return unclaimed error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== SINGLE RETURN UNCLAIMED ====================
exports.returnUnclaimed = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log(`Returning unclaimed ID: ${id} to returned_payroll table`);
    
    const unclaimedRecord = await db.UnclaimedPayroll.findOne({
      where: { 
        unclaimed_id: id,
        status: 'unclaimed'
      }
    });
    
    if (!unclaimedRecord) {
      return res.status(404).json({
        success: false,
        error: 'Unclaimed record not found or already processed'
      });
    }
    
    // Create record in returned_payroll table
    const returnedRecord = await db.ReturnedPayroll.create({
      payroll_processing_id: unclaimedRecord.payroll_processing_id,
      employee_id: unclaimedRecord.employee_id,
      employee_code: unclaimedRecord.employee_code,
      employee_name: unclaimedRecord.employee_name,
      department: unclaimedRecord.department,
      month: unclaimedRecord.month,
      original_payment_id: null,
      original_amount: unclaimedRecord.amount,
      return_date: new Date().toISOString().split('T')[0],
      return_reason: reason || 'Moved from unclaimed',
      return_source: 'individual',
      status: 'pending',
      paid_amount: 0,
      remaining_amount: unclaimedRecord.amount,
      kept_amount: 0,
      payment_history_id: null
    });
    
    // DELETE the unclaimed record (remove from unclaimed table)
    await unclaimedRecord.destroy();
    
    res.json({
      success: true,
      data: {
        returnedRecord,
        message: `Unclaimed salary for ${unclaimedRecord.employee_name} moved to returned payroll`
      },
      message: `Unclaimed salary for ${unclaimedRecord.employee_name} moved to returned payroll`
    });
    
  } catch (error) {
    console.error('Return unclaimed error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// || ==================== RETURNED PAYROLL ENDPOINTS ====================

// GET all returned payroll records
exports.getReturnedPayroll = async (req, res) => {
  try {
    const { page = 1, limit = 50, employeeId, month, year, department, search, status } = req.query;
    
    const whereClause = {};
    
    if (employeeId) whereClause.employee_id = parseInt(employeeId);
    if (month) whereClause.month = month;
    if (year) whereClause.month = { [Op.like]: `${year}-%` };
    if (department && department !== 'all') whereClause.department = department;
    if (status && status !== 'all') whereClause.status = status;
    
    if (search) {
      whereClause[Op.or] = [
        { employee_code: { [Op.like]: `%${search}%` } },
        { employee_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await db.ReturnedPayroll.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['employee_id', 'employee_code', 'first_name', 'last_name', 'basic_salary']
        }
      ],
      order: [['return_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    const totalPages = Math.ceil(count / parseInt(limit));
    
    // Calculate summary
    const summary = {
      totalOriginalAmount: rows.reduce((sum, r) => sum + parseFloat(r.original_amount), 0),
      totalPaidAmount: rows.reduce((sum, r) => sum + parseFloat(r.paid_amount || 0), 0),
      totalKeptAmount: rows.reduce((sum, r) => sum + parseFloat(r.kept_amount || 0), 0),
      totalRemainingAmount: rows.reduce((sum, r) => sum + parseFloat(r.remaining_amount || 0), 0),
      totalRecords: count,
      pendingCount: rows.filter(r => r.status === 'pending').length,
      partiallyPaidCount: rows.filter(r => r.status === 'partially_paid').length,
      paidCount: rows.filter(r => r.status === 'paid').length
    };
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalRecords: count,
        recordsPerPage: parseInt(limit)
      },
      summary: summary
    });
    
  } catch (error) {
    console.error('Get returned payroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET single returned payroll record
exports.getReturnedPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await db.ReturnedPayroll.findOne({
      where: { returned_id: id },
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['employee_id', 'employee_code', 'first_name', 'last_name', 'basic_salary', 'bank_account']
        }
      ]
    });
    
    if (!record) {
      return res.status(404).json({ success: false, error: 'Returned payroll record not found' });
    }
    
    res.json({ success: true, data: record });
    
  } catch (error) {
    console.error('Get returned payroll by id error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PROCESS payment for returned payroll
exports.payReturnedPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      paymentType, 
      paidAmount, 
      keptAmount, 
      percentagePaid,
      paymentMethod, 
      transactionReference,
      paymentNotes 
    } = req.body;
    
    const returnedRecord = await db.ReturnedPayroll.findOne({
      where: { returned_id: id, status: ['pending', 'partially_paid'] }
    });
    
    if (!returnedRecord) {
      return res.status(404).json({ success: false, error: 'Returned record not found or already fully paid' });
    }
    
    // Calculate new amounts
    const newPaidAmount = parseFloat(returnedRecord.paid_amount || 0) + parseFloat(paidAmount);
    const newRemainingAmount = parseFloat(returnedRecord.original_amount) - newPaidAmount;
    const newKeptAmount = parseFloat(returnedRecord.kept_amount || 0) + parseFloat(keptAmount);
    
    let isFullyPaid = newRemainingAmount <= 0;
    
    // Create payment history record
    const paymentRecord = await db.PayrollHistory.create({
      payroll_processing_id: returnedRecord.payroll_processing_id,
      employee_id: returnedRecord.employee_id,
      employee_code: returnedRecord.employee_code,
      employee_name: returnedRecord.employee_name,
      department: returnedRecord.department,
      amount: parseFloat(paidAmount),
      payment_date: new Date().toISOString().split('T')[0],
      month: returnedRecord.month,
      method: paymentMethod || 'Bank Transfer',
      transaction_id: transactionReference || `RETURN-${Date.now()}-${returnedRecord.employee_code}`,
      processed_by: req.user?.username || 'System',
      status: 'completed',
      source: 'returned',
      notes: paymentNotes || `Payment from returned payroll. Paid: ${paidAmount}, Kept: ${keptAmount}. Original returned amount: ${returnedRecord.original_amount}`
    });
    
    let finalReturnedRecord;
    
    if (isFullyPaid) {
      // FULLY PAID - DELETE from returned_payroll table
      const deletedRecord = { ...returnedRecord.toJSON() };
      await returnedRecord.destroy();
      finalReturnedRecord = {
        ...deletedRecord,
        status: 'paid',
        paid_amount: newPaidAmount,
        remaining_amount: 0,
        kept_amount: newKeptAmount,
        deleted_at: new Date(),
        deleted_reason: 'Fully paid'
      };
    } else {
      // PARTIALLY PAID - Update the record
      await returnedRecord.update({
        status: 'partially_paid',
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        kept_amount: newKeptAmount,
        payment_history_id: paymentRecord.history_id,
        updated_at: new Date()
      });
      finalReturnedRecord = returnedRecord.toJSON();
    }
    
    res.json({
      success: true,
      data: {
        paymentRecord,
        returnedRecord: finalReturnedRecord,
        summary: {
          originalAmount: returnedRecord.original_amount,
          totalPaid: newPaidAmount,
          totalKept: newKeptAmount,
          remaining: newRemainingAmount,
          isFullyPaid: isFullyPaid,
          percentPaid: ((newPaidAmount / returnedRecord.original_amount) * 100).toFixed(1)
        }
      },
      message: isFullyPaid 
        ? `Payment of ${paidAmount} completed. Record removed from returned payroll.`
        : `Payment of ${paidAmount} processed. Remaining: ${newRemainingAmount}`
    });
    
  } catch (error) {
    console.error('Pay returned payroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET returned payroll summary
exports.getReturnedPayrollSummary = async (req, res) => {
  try {
    const byStatus = await db.ReturnedPayroll.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('returned_id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('original_amount')), 'total_amount'],
        [db.sequelize.fn('SUM', db.sequelize.col('paid_amount')), 'total_paid'],
        [db.sequelize.fn('SUM', db.sequelize.col('kept_amount')), 'total_kept'],
        [db.sequelize.fn('SUM', db.sequelize.col('remaining_amount')), 'total_remaining']
      ],
      group: ['status']
    });
    
    const total = await db.ReturnedPayroll.findOne({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('returned_id')), 'total_count'],
        [db.sequelize.fn('SUM', db.sequelize.col('original_amount')), 'total_amount'],
        [db.sequelize.fn('SUM', db.sequelize.col('paid_amount')), 'total_paid'],
        [db.sequelize.fn('SUM', db.sequelize.col('kept_amount')), 'total_kept'],
        [db.sequelize.fn('SUM', db.sequelize.col('remaining_amount')), 'total_remaining']
      ]
    });
    
    res.json({
      success: true,
      data: { byStatus: byStatus || [], total: total || {} }
    });
    
  } catch (error) {
    console.error('Get returned payroll summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE return reason
exports.updateReturnReason = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnReason } = req.body;
    
    const record = await db.ReturnedPayroll.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Returned record not found' });
    }
    
    await record.update({ return_reason: returnReason, updated_at: new Date() });
    
    res.json({ success: true, data: record, message: 'Return reason updated successfully' });
    
  } catch (error) {
    console.error('Update return reason error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE returned record (admin only, only if not paid)
exports.deleteReturnedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await db.ReturnedPayroll.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Returned record not found' });
    }
    
    if (record.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Cannot delete a fully paid record' });
    }
    
    await record.destroy();
    
    res.json({ success: true, message: 'Returned record deleted successfully' });
    
  } catch (error) {
    console.error('Delete returned record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};