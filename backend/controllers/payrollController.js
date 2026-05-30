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
 

