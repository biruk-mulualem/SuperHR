// controllers/leaveController.js
const { sequelize, LeaveRequest, LeaveBalance, LeaveType, LeaveExtension, Employee, Department, User, SystemSetting } = require('../models');
const { Op } = require('sequelize');

// ==================== HELPER FUNCTIONS ====================

// Get leave rules from database
// In leaveController.js, replace your getLeaveRules function:
// Get leave rules from database
async function getLeaveRules() {
  // Try to get the main attendance rules
  const settings = await SystemSetting.getSetting('attendance.rules');
  
  console.log('========== DEBUG: Settings structure ==========');
  console.log('settings keys:', Object.keys(settings || {}));
  
  // Try multiple possible paths for leave rules
  let leaveRules = null;
  
  // Path 1: settings.leaveRules (if saved from frontend)
  if (settings && settings.leaveRules) {
    leaveRules = settings.leaveRules;
    console.log('✅ Found leaveRules at settings.leaveRules');
  }
  // Path 2: settings.leave.rules (default structure from SystemSetting)
  else if (settings && settings.leave && settings.leave.rules) {
    leaveRules = settings.leave.rules;
    console.log('✅ Found leaveRules at settings.leave.rules');
  }
  // Path 3: settings.leaveRules from nested (if saved differently)
  else if (settings && settings.leaveRules && settings.leaveRules.validation) {
    leaveRules = settings.leaveRules;
    console.log('✅ Found leaveRules with validation');
  }
  
  if (!leaveRules || !leaveRules.validation) {
    console.log('⚠️ No valid leave rules found, using defaults');
    return getDefaultLeaveRules();
  }
  
  console.log('✅ Using leave rules from database');
  console.log('maxConcurrentEmployees:', leaveRules.validation?.maxConcurrentEmployees);
  
  return leaveRules;
}

// Default leave rules (Ethiopian system)
function getDefaultLeaveRules() {
  return {
    annualLeave: {
      baseDays: 16,
      incrementInterval: 2,
      incrementAmount: 1,
      maxDays: null,
      carryOverLimit: 10,
      carryOverExpiryYears: 2,
      accrualType: "anniversary",
      requiresApproval: true,
      minNoticeDays: 7,
      maxConsecutiveDays: 30
    },
    sickLeave: {
      hasFixedLimit: false,
      requiresDoctorNoteAfter: 3,
      alertThreshold: 15,
      resetFrequency: "yearly",
      requiresApproval: false,
      minNoticeDays: 0
    },
    maternityLeave: {
      defaultDays: 90,
      isPaid: true,
      requiresApproval: true,
      requiresDocumentation: true,
      minNoticeDays: 30,
      isOneTime: true,
      genderRestriction: "female",
      extensionAllowed: true,
      maxExtensionDays: 30
    },
    paternityLeave: {
      defaultDays: 3,
      isPaid: true,
      requiresApproval: true,
      minNoticeDays: 14,
      isOneTime: true,
      genderRestriction: "male",
      mustTakeWithinDays: 30
    },
    bereavementLeave: {
      defaultDays: 3,
      isPaid: true,
      requiresApproval: true,
      requiresDocumentation: true,
      minNoticeDays: 0,
      eligibleRelationships: ["spouse", "parent", "child", "sibling"],
      immediateFamilyDays: 5,
      isOneTime: false,
      maxPerYear: 10
    },
    unpaidLeave: {
      isPaid: false,
      requiresApproval: true,
      requiresDirectorApproval: true,
      minNoticeDays: 14,
      maxConsecutiveDays: 30,
      maxPerYear: 60,
      requiresReason: true
    },
    extensions: {
      maxExtensionsPerLeave: 2,
      maxTotalExtensionDays: 30,
      extensionRequiresApproval: true,
      extensionApprovalChain: ["manager", "hr"],
      autoApproveExtensionDays: 2,
      extensionReasonRequired: true,
      doctorNoteRequiredForExtension: true,
      allowedLeaveTypesForExtension: ["sick_leave"]
    },
    validation: {
      minDaysPerRequest: 1,
      maxDaysPerRequest: 30,
      overlapAllowed: false,
      concurrentLeavesAllowed: true,
      maxConcurrentEmployees: 3,
      pendingRequestsBlockNew: true,
      futureDateOnly: true,
      maxFutureDays: 365,
      weekendCounting: true,
      holidayCounting: false,
      minNoticeDaysPerType: {
        annual: 7,
        sick: 0,
        maternity: 30,
        paternity: 14,
        bereavement: 0,
        unpaid: 14
      }
    }
  };
}

// Calculate Ethiopian progressive entitlement based on config
function calculateProgressiveEntitlement(yearsOfService, config) {
  const baseDays = config.baseDays || 16;
  const incrementInterval = config.incrementInterval || 2;
  const incrementAmount = config.incrementAmount || 1;
  const maxDays = config.maxDays;
  

  
  if (yearsOfService < 2) {
    return baseDays;
  }
  
  const yearsAfterTwo = yearsOfService - 2;
  const extraDays = Math.floor(yearsAfterTwo / incrementInterval) * incrementAmount;
  let entitlement = baseDays + extraDays + 1; // +1 for the first increment at year 2
  
  if (maxDays && entitlement > maxDays) {
    entitlement = maxDays;
  }
  
  return entitlement;
}

// Get annual entitlement for an employee

async function getAnnualEntitlement(employeeId, asOfDate = null) {
  const rules = await getLeaveRules();
  const annualConfig = rules.annualLeave;
  const baseDays = annualConfig.baseDays || 16;
  const minMonthsBeforeRequest = annualConfig.minMonthsBeforeRequest || 6;
  
  const employee = await Employee.findByPk(employeeId);
  if (!employee || !employee.hireDate) {
    return {
      yearlyEntitlement: baseDays,
      accruedDays: baseDays,
      canRequest: true,
      monthsRemaining: 0
    };
  }
  
  const hireDate = new Date(employee.hireDate);
  const currentDate = asOfDate ? new Date(asOfDate) : new Date();
  
  // Calculate completed anniversary periods
  let completedPeriods = 0;
  let currentPeriodStart = new Date(hireDate);
  
  while (currentPeriodStart <= currentDate) {
    const nextPeriodStart = new Date(currentPeriodStart);
    nextPeriodStart.setFullYear(currentPeriodStart.getFullYear() + 1);
    
    if (nextPeriodStart <= currentDate) {
      completedPeriods++;
      currentPeriodStart = nextPeriodStart;
    } else {
      break;
    }
  }
  
  // Entitlement is based on completed periods
  const yearlyEntitlement = calculateProgressiveEntitlement(completedPeriods, annualConfig);
  
  // Calculate accrued in current period
  const currentPeriodEnd = new Date(currentPeriodStart);
  currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1);
  
  const daysInPeriod = (currentPeriodEnd - currentPeriodStart) / (1000 * 60 * 60 * 24);
  const daysPassed = (currentDate - currentPeriodStart) / (1000 * 60 * 60 * 24);
  
  let accruedDays = 0;
  if (daysPassed > 0) {
    accruedDays = (yearlyEntitlement / daysInPeriod) * daysPassed;
  }
  
  // Check 6-month rule
  const monthsSinceHire = (currentDate.getFullYear() - hireDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - hireDate.getMonth());
  
  if (monthsSinceHire < minMonthsBeforeRequest) {
    return {
      yearlyEntitlement: yearlyEntitlement,
      accruedDays: 0,
      canRequest: false,
      monthsRemaining: minMonthsBeforeRequest - monthsSinceHire,
      message: `Cannot request leave until you have completed ${minMonthsBeforeRequest} months of employment.`
    };
  }
  
  return {
    yearlyEntitlement: yearlyEntitlement,
    accruedDays: Math.floor(accruedDays * 10) / 10,
    canRequest: true,
    monthsRemaining: 0,
    monthsSinceHire: monthsSinceHire,
    yearsOfService: completedPeriods,
    periodStart: currentPeriodStart,
    periodEnd: currentPeriodEnd,
    daysInPeriod: daysInPeriod,
    daysPassed: daysPassed
  };
}async function getAnnualEntitlement(employeeId, asOfDate = null) {
  const rules = await getLeaveRules();
  const annualConfig = rules.annualLeave;
  const baseDays = annualConfig.baseDays || 16;
  const minMonthsBeforeRequest = annualConfig.minMonthsBeforeRequest || 6;
  
  const employee = await Employee.findByPk(employeeId);
  if (!employee || !employee.hireDate) {
    return {
      yearlyEntitlement: baseDays,
      accruedDays: baseDays,
      canRequest: true,
      monthsRemaining: 0
    };
  }
  
  const hireDate = new Date(employee.hireDate);
  const currentDate = asOfDate ? new Date(asOfDate) : new Date();
  
  // Calculate completed anniversary periods
  let completedPeriods = 0;
  let currentPeriodStart = new Date(hireDate);
  
  while (currentPeriodStart <= currentDate) {
    const nextPeriodStart = new Date(currentPeriodStart);
    nextPeriodStart.setFullYear(currentPeriodStart.getFullYear() + 1);
    
    if (nextPeriodStart <= currentDate) {
      completedPeriods++;
      currentPeriodStart = nextPeriodStart;
    } else {
      break;
    }
  }
  
  // Entitlement is based on completed periods
  const yearlyEntitlement = calculateProgressiveEntitlement(completedPeriods, annualConfig);
  
  // Calculate accrued in current period
  const currentPeriodEnd = new Date(currentPeriodStart);
  currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1);
  
  const daysInPeriod = (currentPeriodEnd - currentPeriodStart) / (1000 * 60 * 60 * 24);
  const daysPassed = (currentDate - currentPeriodStart) / (1000 * 60 * 60 * 24);
  
  let accruedDays = 0;
  if (daysPassed > 0) {
    accruedDays = (yearlyEntitlement / daysInPeriod) * daysPassed;
  }
  
  // Check 6-month rule
  const monthsSinceHire = (currentDate.getFullYear() - hireDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - hireDate.getMonth());
  
  if (monthsSinceHire < minMonthsBeforeRequest) {
    return {
      yearlyEntitlement: yearlyEntitlement,
      accruedDays: 0,
      canRequest: false,
      monthsRemaining: minMonthsBeforeRequest - monthsSinceHire,
      message: `Cannot request leave until you have completed ${minMonthsBeforeRequest} months of employment.`
    };
  }
  
  return {
    yearlyEntitlement: yearlyEntitlement,
    accruedDays: Math.floor(accruedDays * 10) / 10,
    canRequest: true,
    monthsRemaining: 0,
    monthsSinceHire: monthsSinceHire,
    yearsOfService: completedPeriods,
    periodStart: currentPeriodStart,
    periodEnd: currentPeriodEnd,
    daysInPeriod: daysInPeriod,
    daysPassed: daysPassed
  };
}
// Process year-end carry over and expiry
async function processYearEndRollover(year) {
  const transaction = await sequelize.transaction();
  
  try {
    const rules = await getLeaveRules();
    const annualConfig = rules.annualLeave;
    const maxCarryOver = annualConfig.carryOverLimit || 10;
    const expiryYears = annualConfig.carryOverExpiryYears || 2;
    
    // Get all employees
    const employees = await Employee.findAll({
      where: { isActive: true }
    });
    
    for (const employee of employees) {
      // Get current year balance
      let currentBalance = await LeaveBalance.findOne({
        where: { 
          employeeId: employee.employeeId, 
          year: year 
        },
        transaction
      });
      
      if (!currentBalance) {
        // Calculate balance if doesn't exist
        const entitlement = await getAnnualEntitlement(employee.employeeId, new Date(year, 11, 31));
        currentBalance = {
          employeeId: employee.employeeId,
          year: year,
          yearlyEntitlement: entitlement.yearlyEntitlement,
          usedThisYear: 0,
          pendingDays: 0,
          carriedOver: 0,
          totalAllocation: entitlement.yearlyEntitlement,
          availableDays: entitlement.accruedDays
        };
      }
      
      // Calculate unused balance (don't go below 0)
      const unusedBalance = Math.max(0, currentBalance.availableDays);
      
      // Apply max carry over limit
      let carryOverAmount = Math.min(unusedBalance, maxCarryOver);
      
      // Get previous years' carry over amounts
      const previousBalances = await LeaveBalance.findAll({
        where: {
          employeeId: employee.employeeId,
          year: { [Op.lt]: year }
        },
        order: [['year', 'ASC']],
        transaction
      });
      
      // Calculate which carry over amounts expire (FIFO - oldest first)
      let totalCarryOver = carryOverAmount;
      let expiredAmount = 0;
      
      for (const oldBalance of previousBalances) {
        const ageInYears = year - oldBalance.year;
        
        if (ageInYears >= expiryYears) {
          // This balance expires
          expiredAmount += oldBalance.carriedOver;
          console.log(`Balance of ${oldBalance.carriedOver} days from ${oldBalance.year} expired for employee ${employee.employeeId}`);
        } else if (oldBalance.carriedOver > 0) {
          // Still valid, add to carry over (but subject to max limit)
          const remainingSpace = maxCarryOver - totalCarryOver;
          if (remainingSpace > 0) {
            const addAmount = Math.min(oldBalance.carriedOver, remainingSpace);
            totalCarryOver += addAmount;
          }
        }
      }
      
      // Calculate next year's entitlement
      const nextYear = year + 1;
      const nextYearEntitlement = await getAnnualEntitlement(employee.employeeId, new Date(nextYear, 0, 1));
      
      // Create or update next year's balance
      let nextYearBalance = await LeaveBalance.findOne({
        where: {
          employeeId: employee.employeeId,
          year: nextYear
        },
        transaction
      });
      
      const totalAllocation = nextYearEntitlement.yearlyEntitlement + totalCarryOver;
      
      if (nextYearBalance) {
        await nextYearBalance.update({
          yearlyEntitlement: nextYearEntitlement.yearlyEntitlement,
          carriedOver: totalCarryOver,
          totalAllocation: totalAllocation,
          availableDays: totalAllocation - (nextYearBalance.usedThisYear || 0)
        }, { transaction });
      } else {
        await LeaveBalance.create({
          employeeId: employee.employeeId,
          year: nextYear,
          yearsOfService: nextYearEntitlement.yearsOfService || 0,
          yearlyEntitlement: nextYearEntitlement.yearlyEntitlement,
          carriedOver: totalCarryOver,
          totalAllocation: totalAllocation,
          usedThisYear: 0,
          pendingDays: 0,
          availableDays: totalAllocation
        }, { transaction });
      }
      
      // Log the rollover
      console.log(`Year-end processing for ${employee.employeeId}: ${year} -> ${nextYear}, Carried over: ${totalCarryOver} days, Expired: ${expiredAmount} days`);
    }
    
    await transaction.commit();
    return { success: true, message: `Year-end processing completed for ${year}` };
  } catch (error) {
    await transaction.rollback();
    console.error('Error in year-end processing:', error);
    throw error;
  }
}

// Helper function to calculate employee balance dynamically (Anniversary-based)
async function calculateEmployeeBalance(employeeId, asOfDate = new Date()) {
  const rules = await getLeaveRules();
  const annualConfig = rules.annualLeave;
  const baseDays = annualConfig.baseDays || 16;
  const maxCarryOver = annualConfig.carryOverLimit || 50;
  const expiryYears = annualConfig.carryOverExpiryYears || 2;
  const minMonthsBeforeRequest = annualConfig.minMonthsBeforeRequest || 6;
  const roundingMethod = annualConfig.rounding || 'floor';
  
  const employee = await Employee.findByPk(employeeId);
  if (!employee || !employee.hireDate) {
    return null;
  }
  
  const hireDate = new Date(employee.hireDate);
  const currentDate = new Date(asOfDate);
  
  // Get all approved annual leave requests
  const approvedLeaves = await LeaveRequest.findAll({
    where: {
      employeeId,
      status: 'approved',
      leaveTypeName: 'Annual Leave'
    }
  });
  
  // Calculate anniversary periods
  let anniversaryPeriods = [];
  let currentPeriodStart = new Date(hireDate);
  let periodNumber = 0;
  
  // Build all anniversary periods up to current date
  while (currentPeriodStart <= currentDate) {
    const periodEnd = new Date(currentPeriodStart);
    periodEnd.setFullYear(currentPeriodStart.getFullYear() + 1);
    
    const yearsOfService = periodNumber;
    const entitlement = calculateProgressiveEntitlement(yearsOfService, annualConfig);
    
    anniversaryPeriods.push({
      periodNumber,
      startDate: new Date(currentPeriodStart),
      endDate: new Date(periodEnd),
      yearsOfService,
      entitlement,
      usedDays: 0
    });
    
    currentPeriodStart = periodEnd;
    periodNumber++;
  }
  
  // Track used days per anniversary period
  approvedLeaves.forEach(leave => {
    const leaveStart = new Date(leave.startDate);
    
    for (const period of anniversaryPeriods) {
      if (leaveStart >= period.startDate && leaveStart < period.endDate) {
        period.usedDays += leave.totalDays;
        break;
      }
    }
  });
  
  // Calculate total accrued including ALL valid carry over from previous periods
  let totalAccrued = 0;
  let carryOverDetails = [];
  let currentPeriodAccrued = 0;
  
  // Process each period
  for (let i = 0; i < anniversaryPeriods.length; i++) {
    const period = anniversaryPeriods[i];
    const isCurrentPeriod = (i === anniversaryPeriods.length - 1);
    
    if (isCurrentPeriod) {
      // CURRENT PERIOD: Calculate prorated amount
      const daysInPeriod = (period.endDate - period.startDate) / (1000 * 60 * 60 * 24);
      const daysPassed = (currentDate - period.startDate) / (1000 * 60 * 60 * 24);
      let proratedAmount = 0;
      
      if (daysPassed > 0 && daysPassed <= daysInPeriod) {
        proratedAmount = (period.entitlement / daysInPeriod) * daysPassed;
      } else if (daysPassed > daysInPeriod) {
        proratedAmount = period.entitlement;
      }
      
      // Calculate TOTAL carry over from ALL previous valid periods
      let totalCarryOver = 0;
      let remainingCarryOverLimit = maxCarryOver;
      
      // Process previous periods from oldest to newest (FIFO)
      for (let j = 0; j < i; j++) {
        const prevPeriod = anniversaryPeriods[j];
        const periodEndDate = prevPeriod.endDate;
        const actualAgeInYears = (currentDate - periodEndDate) / (1000 * 60 * 60 * 24 * 365);
        
        // Check if period is still within expiry period
        if (actualAgeInYears <= expiryYears) {
          const prevUnused = Math.max(0, prevPeriod.entitlement - prevPeriod.usedDays);
          if (prevUnused > 0 && remainingCarryOverLimit > 0) {
            const carryOverAmount = Math.min(prevUnused, remainingCarryOverLimit);
            totalCarryOver += carryOverAmount;
            remainingCarryOverLimit -= carryOverAmount;
            
            carryOverDetails.push({
              fromPeriod: j,
              fromYear: prevPeriod.startDate.getFullYear(),
              originalUnused: prevUnused,
              carriedOver: carryOverAmount,
              expired: prevUnused - carryOverAmount
            });
          }
        } else {
          // Period expired
          const prevUnused = Math.max(0, prevPeriod.entitlement - prevPeriod.usedDays);
          if (prevUnused > 0) {
            carryOverDetails.push({
              fromPeriod: j,
              fromYear: prevPeriod.startDate.getFullYear(),
              originalUnused: prevUnused,
              carriedOver: 0,
              expired: prevUnused,
              reason: `Expired after ${expiryYears} years (ended ${periodEndDate.toLocaleDateString()})`
            });
          }
        }
      }
      
      currentPeriodAccrued = proratedAmount + totalCarryOver;
      totalAccrued = currentPeriodAccrued;
      
    } else {
      // NON-CURRENT PERIODS: Don't add to total here (handled in current period)
      // Just continue
      continue;
    }
  }
  
  const totalUsed = approvedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);
  let availableDays = Math.max(0, totalAccrued - totalUsed);
  
  // Get current period info
  const currentPeriod = anniversaryPeriods[anniversaryPeriods.length - 1];
  const daysInCurrentPeriod = (currentPeriod.endDate - currentPeriod.startDate) / (1000 * 60 * 60 * 24);
  const daysPassedInCurrent = (currentDate - currentPeriod.startDate) / (1000 * 60 * 60 * 24);
  let rawCurrentPeriodAccrued = (currentPeriod.entitlement / daysInCurrentPeriod) * Math.max(0, Math.min(daysPassedInCurrent, daysInCurrentPeriod));
  
  // Apply rounding based on configuration
  let roundedAvailableDays = availableDays;
  let roundedTotalAccrued = totalAccrued;
  let roundedCurrentPeriodAccrued = currentPeriodAccrued;
  
  switch (roundingMethod) {
    case 'whole':
      roundedAvailableDays = Math.round(availableDays);
      roundedTotalAccrued = Math.round(totalAccrued);
      roundedCurrentPeriodAccrued = Math.round(currentPeriodAccrued);
      break;
    case 'half':
      roundedAvailableDays = Math.round(availableDays * 2) / 2;
      roundedTotalAccrued = Math.round(totalAccrued * 2) / 2;
      roundedCurrentPeriodAccrued = Math.round(currentPeriodAccrued * 2) / 2;
      break;
    case 'floor':
      roundedAvailableDays = Math.floor(availableDays);
      roundedTotalAccrued = Math.floor(totalAccrued);
      roundedCurrentPeriodAccrued = Math.floor(currentPeriodAccrued);
      break;
    case 'ceil':
      roundedAvailableDays = Math.ceil(availableDays);
      roundedTotalAccrued = Math.ceil(totalAccrued);
      roundedCurrentPeriodAccrued = Math.ceil(currentPeriodAccrued);
      break;
    case 'decimal':
    default:
      roundedAvailableDays = Math.floor(availableDays * 10) / 10;
      roundedTotalAccrued = Math.floor(totalAccrued * 10) / 10;
      roundedCurrentPeriodAccrued = Math.floor(currentPeriodAccrued * 10) / 10;
  }
  
  // Check 6-month rule
  const monthsSinceHire = (currentDate.getFullYear() - hireDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - hireDate.getMonth());
  const canRequest = monthsSinceHire >= minMonthsBeforeRequest;
  
  return {
    employeeId,
    hireDate: employee.hireDate,
    currentDate,
    currentPeriodStart: currentPeriod.startDate,
    currentPeriodEnd: currentPeriod.endDate,
    currentPeriodEntitlement: currentPeriod.entitlement,
    currentPeriodUsed: currentPeriod.usedDays,
    currentPeriodAccrued: roundedCurrentPeriodAccrued,
    totalAccrued: roundedTotalAccrued,
    totalUsed,
    availableDays: roundedAvailableDays,
    rawAvailableDays: availableDays,
    canRequest,
    monthsRemaining: canRequest ? 0 : minMonthsBeforeRequest - monthsSinceHire,
    monthsSinceHire,
    message: canRequest ? null : `Cannot request leave until you have completed ${minMonthsBeforeRequest} months of employment. ${minMonthsBeforeRequest - monthsSinceHire} month(s) remaining.`,
    carryOverDetails,
    anniversaryPeriods: anniversaryPeriods.map(p => ({
      periodNumber: p.periodNumber,
      startDate: p.startDate,
      endDate: p.endDate,
      yearsOfService: p.yearsOfService,
      entitlement: p.entitlement,
      usedDays: p.usedDays
    })),
    carryOverLimit: maxCarryOver,
    expiryYears: expiryYears,
    roundingMethod: roundingMethod
  };
}

// Calculate days between dates (excluding weekends/holidays based on config)
async function calculateBusinessDays(startDate, endDate) {
  const rules = await getLeaveRules();
  const includeWeekends = rules.validation?.weekendCounting !== false;
  const includeHolidays = rules.validation?.holidayCounting || false;
  
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  
  // Get holidays from config if needed
  let holidays = [];
  if (includeHolidays) {
    const attendanceRules = await SystemSetting.getSetting('attendance.rules');
    holidays = attendanceRules?.holidayRules?.holidays || [];
  }
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = currentDate.toISOString().split('T')[0];
    const isHoliday = holidays.some(h => h.date === dateStr);
    
    if ((includeWeekends || !isWeekend) && (!includeHolidays || !isHoliday)) {
      days++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

// Validate leave request against rules
async function validateLeaveRequest(employeeId, leaveTypeId, startDate, endDate, reason, isRetroactive = false) {
  const rules = await getLeaveRules();
  const leaveType = await LeaveType.findByPk(leaveTypeId);
  
  if (!leaveType) {
    return { valid: false, message: 'Invalid leave type' };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get validation rules from config
  const validationConfig = rules.validation || {};
  
  // 1. Check future date only - WITH EXCEPTION FOR RETROACTIVE REQUESTS
  const isEmergencyLeave = leaveType.name === 'Sick Leave' || 
                           leaveType.name === 'Bereavement Leave' ||
                           isRetroactive === true;
  
  if (!isEmergencyLeave && validationConfig.futureDateOnly !== false && start < today) {
    return { valid: false, message: 'Start date cannot be in the past. For retroactive leave requests, please contact HR.' };
  }
  
  // For past dates, add a warning
  let warningMessage = null;
  if (start < today) {
    warningMessage = `Note: This leave request is for a past date (${formatDate(startDate)}). HR review required.`;
  }
  
  // 2. Check max future days (only for future dates)
  if (start >= today) {
    const maxFutureDays = validationConfig.maxFutureDays || 365;
    const futureDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    if (futureDays > maxFutureDays) {
      return { valid: false, message: `Cannot request leave more than ${maxFutureDays} days in advance` };
    }
  }
  
  // 3. Check min/max days per request - WITH SPECIAL HANDLING
  const minDays = validationConfig.minDaysPerRequest || 1;
  let maxDays = validationConfig.maxDaysPerRequest || 30;
  
  // SPECIAL HANDLING FOR DIFFERENT LEAVE TYPES
  if (leaveType.name === 'Maternity Leave') {
    maxDays = rules.maternityLeave?.defaultDays || 90;
  }
  else if (leaveType.name === 'Paternity Leave') {
    maxDays = rules.paternityLeave?.defaultDays || 10;
  }
  else if (leaveType.name === 'Annual Leave') {
    maxDays = rules.annualLeave?.maxConsecutiveDays || 30;
  }
  
  if (totalDays < minDays) {
    return { valid: false, message: `Minimum leave request is ${minDays} day(s)` };
  }
  if (totalDays > maxDays) {
    return { valid: false, message: `Maximum leave request for ${leaveType.name} is ${maxDays} day(s)` };
  }
  
  // 4. Check notice period - Read from minNoticeDaysPerType
  let minNoticeDays = 0;
  if (start >= today) {
    // Map leave type names to config keys
    const noticeTypeMap = {
      'Annual Leave': 'annual',
      'Sick Leave': 'sick',
      'Maternity Leave': 'maternity',
      'Paternity Leave': 'paternity',
      'Bereavement Leave': 'bereavement',
      'Unpaid Leave': 'unpaid'
    };
    
    const configKey = noticeTypeMap[leaveType.name];
    if (configKey && validationConfig.minNoticeDaysPerType) {
      minNoticeDays = validationConfig.minNoticeDaysPerType[configKey] ?? 0;
    }
    
    // Fallback to individual leave type configs if not found
    if (minNoticeDays === 0 && configKey === undefined) {
      if (leaveType.name === 'Annual Leave') {
        minNoticeDays = rules.annualLeave?.minNoticeDays ?? 7;
      } else if (leaveType.name === 'Maternity Leave') {
        minNoticeDays = rules.maternityLeave?.minNoticeDays ?? 30;
      } else if (leaveType.name === 'Paternity Leave') {
        minNoticeDays = rules.paternityLeave?.minNoticeDays ?? 14;
      } else if (leaveType.name === 'Sick Leave') {
        minNoticeDays = rules.sickLeave?.minNoticeDays ?? 0;
      } else if (leaveType.name === 'Bereavement Leave') {
        minNoticeDays = rules.bereavementLeave?.minNoticeDays ?? 0;
      } else if (leaveType.name === 'Unpaid Leave') {
        minNoticeDays = rules.unpaidLeave?.minNoticeDays ?? 14;
      }
    }
  }
  
  const daysNotice = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  
  // Only enforce notice if minNoticeDays > 0
  if (minNoticeDays > 0 && daysNotice < minNoticeDays) {
    return { valid: false, message: `Please request at least ${minNoticeDays} days in advance` };
  }
  
  // 5. Check max consecutive days
  let maxConsecutive = rules.annualLeave?.maxConsecutiveDays;
  if (leaveType.name === 'Maternity Leave') maxConsecutive = rules.maternityLeave?.defaultDays || 90;
  if (leaveType.name === 'Paternity Leave') maxConsecutive = rules.paternityLeave?.defaultDays || 10;
  if (leaveType.name === 'Bereavement Leave') maxConsecutive = rules.bereavementLeave?.defaultDays || 5;
  if (leaveType.name === 'Unpaid Leave') maxConsecutive = rules.unpaidLeave?.maxConsecutiveDays || 30;
  
  if (maxConsecutive && totalDays > maxConsecutive) {
    return { valid: false, message: `${leaveType.name} cannot exceed ${maxConsecutive} consecutive days` };
  }
  
  // 6. Check pending requests
  if (validationConfig.pendingRequestsBlockNew !== false) {
    const hasPending = await LeaveRequest.findOne({
      where: {
        employeeId,
        status: 'pending'
      }
    });
    if (hasPending) {
      return { valid: false, message: 'You have a pending leave request. Please wait for it to be processed.' };
    }
  }
  
  // 7. Check overlapping approved leaves
  if (validationConfig.overlapAllowed !== true) {
    const overlapping = await LeaveRequest.findOne({
      where: {
        employeeId,
        status: { [Op.in]: ['approved', 'pending'] },
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return { 
        valid: false, 
        message: `You already have a ${overlapping.status} leave request (${overlapping.leaveTypeName}) during this period.` 
      };
    }
  }
  
  // 8. Check concurrent employees limit
  const maxConcurrent = validationConfig.maxConcurrentEmployees;
  if (maxConcurrent && maxConcurrent > 0) {
    const concurrentCount = await LeaveRequest.count({
      where: {
        status: 'approved',
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });
    if (concurrentCount >= maxConcurrent) {
      return { valid: false, message: `Maximum ${maxConcurrent} employees can be on leave at the same time.` };
    }
  }
  
  return { valid: true, totalDays, warningMessage };
}

// Helper function to format date
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ==================== LEAVE REQUEST CRUD ====================

// Get all leave requests with filters
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { 
      status, 
      departmentId, 
      leaveTypeId, 
      startDate, 
      endDate,
      employeeId,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (employeeId) where.employeeId = employeeId;
    
    if (startDate && endDate) {
      where.start_date = { [Op.between]: [startDate, endDate] };
    }
    
    if (search) {
      where[Op.or] = [
        { '$Employee.firstName$': { [Op.iLike]: `%${search}%` } },
        { '$Employee.lastName$': { [Op.iLike]: `%${search}%` } },
        { '$Employee.employeeCode$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
        { model: Department, as: 'department', attributes: ['departmentId', 'name'] },
        { model: LeaveType, as: 'leaveType', attributes: ['leaveTypeId', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllLeaveRequests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// Get leave request by ID

exports.getLeaveRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    // Make sure id is a number, not 'types'
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'Invalid request ID' });
    }
    
    const leaveRequest = await LeaveRequest.findByPk(parseInt(id), {
      include: [
        { 
          model: Employee, 
          as: 'employee', 
          attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode', 'departmentId'] 
        },
        { 
          model: Department, 
          as: 'department', 
          attributes: ['departmentId', 'name'] 
        },
        { 
          model: LeaveType, 
          as: 'leaveType', 
          attributes: ['leaveTypeId', 'name', 'code'] 
        },
        // FIXED: Use correct column names from User model
        { 
          model: User, 
          as: 'approver', 
          attributes: ['user_id', 'username', 'full_name']  // Using 'full_name' instead of 'first_name', 'last_name'
        },
        { 
          model: LeaveExtension, 
          as: 'extensions' 
        }
      ]
    });
    
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    // Check permission
    if (userRole === 'employee') {
      const employee = await Employee.findOne({ where: { userId } });
      if (!employee || leaveRequest.employeeId !== employee.employeeId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }
    
    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    console.error('Error in getLeaveRequestById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create leave request

// Create leave request
exports.createLeaveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { employeeId, leaveTypeId, startDate, endDate, reason, status } = req.body;
    const rules = await getLeaveRules();
    
    // Check if this is a retroactive request (start date in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const isRetroactive = start < today;
    
    // Validate request - PASS isRetroactive flag
    const validation = await validateLeaveRequest(employeeId, leaveTypeId, startDate, endDate, reason, isRetroactive);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }
    
    const totalDays = validation.totalDays;
    const returnDate = new Date(endDate);
    returnDate.setDate(returnDate.getDate() + 1);
    
    // Get employee and leave type
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: {
          title: "Employee Not Found",
          message: "The employee you selected does not exist in the system.",
          suggestion: "Please verify the employee information or contact support."
        }
      });
    }
    
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({ 
        success: false, 
        error: {
          title: "Invalid Leave Type",
          message: "The selected leave type is not valid.",
          suggestion: "Please select a valid leave type from the list."
        }
      });
    }
    
    // ==================== CHECK 1: OVERLAPPING LEAVES ====================
    const overlappingLeave = await LeaveRequest.findOne({
      where: {
        employeeId,
        status: { [Op.in]: ['approved', 'pending'] },
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });
    
    if (overlappingLeave) {
      let message = "";
      if (overlappingLeave.status === 'approved') {
        message = `You already have an APPROVED leave request for ${overlappingLeave.leaveTypeName} from ${formatDate(overlappingLeave.startDate)} to ${formatDate(overlappingLeave.endDate)}. These dates overlap with your new request.`;
      } else {
        message = `You already have a PENDING leave request for ${overlappingLeave.leaveTypeName} from ${formatDate(overlappingLeave.startDate)} to ${formatDate(overlappingLeave.endDate)}. Please wait for it to be processed before requesting additional leave.`;
      }
      
      return res.status(400).json({ 
        success: false, 
        error: {
          title: "Leave Period Conflict",
          message: message,
          suggestion: "Please choose different dates or cancel your existing request.",
          existingRequest: {
            id: overlappingLeave.leaveRequestId,
            type: overlappingLeave.leaveTypeName,
            startDate: overlappingLeave.startDate,
            endDate: overlappingLeave.endDate,
            status: overlappingLeave.status
          }
        }
      });
    }
    
    // ==================== CHECK 2: CONCURRENT EMPLOYEES LIMIT ====================
    const maxConcurrent = rules.validation?.maxConcurrentEmployees;
    if (maxConcurrent && maxConcurrent > 0) {
      const concurrentCount = await LeaveRequest.count({
        where: {
          status: 'approved',
          [Op.or]: [
            { startDate: { [Op.between]: [startDate, endDate] } },
            { endDate: { [Op.between]: [startDate, endDate] } },
            {
              [Op.and]: [
                { startDate: { [Op.lte]: startDate } },
                { endDate: { [Op.gte]: endDate } }
              ]
            }
          ]
        }
      });
      
      if (concurrentCount >= maxConcurrent) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: "Maximum Employees on Leave",
            message: `We already have ${concurrentCount} employee(s) on leave during your requested period. To maintain smooth operations, we limit concurrent leave to ${maxConcurrent} employees.`,
            suggestion: "Please try different dates or contact your manager to discuss exceptions.",
            currentCount: concurrentCount,
            maxLimit: maxConcurrent
          }
        });
      }
    }
    
    // ==================== CHECK 3: ANNUAL LEAVE BALANCE ====================
    if (leaveType.name === 'Annual Leave') {
      const balance = await calculateEmployeeBalance(employeeId, new Date(startDate));
      
      if (!balance) {
        return res.status(500).json({ 
          success: false, 
          error: {
            title: "Unable to Calculate Balance",
            message: "Unable to calculate your leave balance. Please contact HR for assistance.",
            suggestion: "Please reach out to the HR department to resolve this issue."
          }
        });
      }
      
      if (!balance.canRequest) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: "Cannot Request Leave Yet",
            message: balance.message || `You need to complete ${balance.monthsRemaining} more month(s) of employment before you can take annual leave.`,
            suggestion: "Please contact HR if you need time off before then."
          }
        });
      }
      
      if (totalDays > balance.availableDays) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: "Insufficient Annual Leave Balance",
            message: `You have requested ${totalDays} days of annual leave, but you only have ${balance.availableDays} days available.`,
            details: {
              available: balance.availableDays,
              requested: totalDays,
              shortfall: totalDays - balance.availableDays,
              totalAccrued: balance.totalAccrued,
              usedThisYear: balance.totalUsed
            },
            suggestion: `Please reduce your request to ${balance.availableDays} days or less.`,
            contactHR: "If you believe this is an error, please contact HR."
          }
        });
      }
    }
    
    // ==================== CHECK 4: MATERNITY LEAVE - ONCE PER YEAR ====================
    if (leaveType.name === 'Maternity Leave') {
      // Check if employee has taken maternity leave in the same calendar year
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      
      const maternityUsedThisYear = await LeaveRequest.findOne({
        where: {
          employeeId,
          leaveTypeId,
          status: 'approved',
          [Op.or]: [
            { startDate: { [Op.between]: [yearStart, yearEnd] } },
            { endDate: { [Op.between]: [yearStart, yearEnd] } }
          ]
        }
      });
      
      if (maternityUsedThisYear) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: "Maternity Leave Already Taken This Year",
            message: `You have already taken maternity leave from ${formatDate(maternityUsedThisYear.startDate)} to ${formatDate(maternityUsedThisYear.endDate)}. Maternity leave can only be taken once per calendar year.`,
            suggestion: "If you need additional time off, please request other leave types or contact HR.",
            previousRequest: {
              id: maternityUsedThisYear.leaveRequestId,
              startDate: maternityUsedThisYear.startDate,
              endDate: maternityUsedThisYear.endDate
            }
          }
        });
      }
    }
    
    // ==================== CHECK 5: PATERNITY LEAVE - ONCE PER YEAR ====================
    if (leaveType.name === 'Paternity Leave') {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      
      const paternityUsedThisYear = await LeaveRequest.findOne({
        where: {
          employeeId,
          leaveTypeId,
          status: 'approved',
          [Op.or]: [
            { startDate: { [Op.between]: [yearStart, yearEnd] } },
            { endDate: { [Op.between]: [yearStart, yearEnd] } }
          ]
        }
      });
      
      if (paternityUsedThisYear) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: "Paternity Leave Already Taken This Year",
            message: `You have already taken paternity leave from ${formatDate(paternityUsedThisYear.startDate)} to ${formatDate(paternityUsedThisYear.endDate)}. Paternity leave can only be taken once per calendar year.`,
            suggestion: "If you need additional time, please request other leave types.",
            previousRequest: {
              id: paternityUsedThisYear.leaveRequestId,
              startDate: paternityUsedThisYear.startDate,
              endDate: paternityUsedThisYear.endDate
            }
          }
        });
      }
    }
    
    // ==================== CHECK 6: UNPAID LEAVE YEARLY LIMIT ====================
    if (leaveType.name === 'Unpaid Leave') {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      
      const usedUnpaidThisYear = await LeaveRequest.sum('totalDays', {
        where: {
          employeeId,
          leaveTypeId,
          status: 'approved',
          startDate: { [Op.between]: [yearStart, yearEnd] }
        }
      });
      
      const maxUnpaidPerYear = rules.unpaidLeave?.maxPerYear || 60;
      const remainingUnpaid = maxUnpaidPerYear - (usedUnpaidThisYear || 0);
      
      if ((usedUnpaidThisYear || 0) + totalDays > maxUnpaidPerYear) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: "Unpaid Leave Limit Reached",
            message: `You have requested ${totalDays} days of unpaid leave, but you only have ${remainingUnpaid} days remaining for this year.`,
            details: {
              usedThisYear: usedUnpaidThisYear || 0,
              requested: totalDays,
              maxPerYear: maxUnpaidPerYear,
              remaining: remainingUnpaid
            },
            suggestion: `Please reduce your request to ${remainingUnpaid} days or less, or use paid leave types. The unpaid leave limit resets on January 1st.`
          }
        });
      }
    }
    
    // ==================== CHECK 7: ONE-TIME LEAVES (Other than Maternity & Paternity) ====================
    if (leaveType.isOneTime && leaveType.name !== 'Maternity Leave' && leaveType.name !== 'Paternity Leave') {
      const alreadyUsed = await LeaveRequest.findOne({
        where: {
          employeeId,
          leaveTypeId,
          status: 'approved'
        }
      });
      if (alreadyUsed) {
        return res.status(400).json({ 
          success: false, 
          error: {
            title: `${leaveType.name} Already Taken`,
            message: `You have already taken ${leaveType.name}. This leave type can only be taken once.`,
            suggestion: "If you need additional time, please request a different leave type or contact HR.",
            previousRequest: {
              id: alreadyUsed.leaveRequestId,
              startDate: alreadyUsed.startDate,
              endDate: alreadyUsed.endDate
            }
          }
        });
      }
    }
    
    // ==================== DETERMINE FINAL STATUS (Auto-approve small requests) ====================
    let finalStatus = status || 'pending';
    const autoApproveThreshold = rules.approvalWorkflow?.autoApproveThresholdDays || 0;
    
    // Auto-approve small requests (except maternity leave)
    if (autoApproveThreshold > 0 && totalDays <= autoApproveThreshold && leaveType.name !== 'Maternity Leave') {
      finalStatus = 'approved';
    }
    
    // ==================== CREATE LEAVE REQUEST ====================
    const leaveRequest = await LeaveRequest.create({
      employeeId,
      departmentId: employee.departmentId,
      leaveTypeId,
      startDate,
      endDate,
      returnDate: returnDate.toISOString().split('T')[0],
      totalDays,
      reason,
      status: finalStatus,
      requestedDate: new Date(),
      leaveTypeName: leaveType?.name,
      approvedDate: finalStatus === 'approved' ? new Date() : null,
      approvedBy: finalStatus === 'approved' ? null : null
    }, { transaction });
    
    // ==================== UPDATE LEAVE BALANCE FOR ANNUAL LEAVE ====================
    if (leaveType.name === 'Annual Leave') {
      const currentYear = new Date().getFullYear();
      let balance = await LeaveBalance.findOne({
        where: { employeeId, year: currentYear },
        transaction
      });
      
      if (balance) {
        balance.pendingDays += totalDays;
        balance.availableDays -= totalDays;
        await balance.save({ transaction });
      }
    }
    
    await transaction.commit();
    
    // ==================== PREPARE RESPONSE MESSAGE ====================
    let responseTitle = '';
    let responseMessage = '';
    
    if (finalStatus === 'approved') {
      responseTitle = "✅ Leave Request Approved";
      responseMessage = `Your ${leaveType.name} request from ${formatDate(startDate)} to ${formatDate(endDate)} (${totalDays} days) has been automatically approved.`;
    } else {
      responseTitle = "📋 Leave Request Submitted";
      responseMessage = `Your ${leaveType.name} request from ${formatDate(startDate)} to ${formatDate(endDate)} (${totalDays} days) has been submitted and is pending HR approval. You will be notified once reviewed.`;
    }
    
    if (isRetroactive) {
      responseTitle = "⚠️ Retroactive Leave Request";
      responseMessage = `Your retroactive ${leaveType.name} request for ${formatDate(startDate)} to ${formatDate(endDate)} (${totalDays} days) has been submitted. Since this request is for past dates, it requires HR review.`;
    }
    
    res.status(201).json({ 
      success: true, 
      data: leaveRequest,
      message: {
        title: responseTitle,
        text: responseMessage
      },
      isRetroactive: isRetroactive,
      autoApproved: finalStatus === 'approved'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createLeaveRequest:', error);
    res.status(500).json({ 
      success: false, 
      error: {
        title: "Server Error",
        message: "An unexpected error occurred while processing your leave request.",
        suggestion: "Please try again later or contact technical support if the problem persists.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// Helper to get employee balance with rules
async function getEmployeeBalanceWithRules(employeeId, year) {
  const rules = await getLeaveRules();
const entitlement = await getAnnualEntitlement(employeeId, new Date(year, 0, 1));
const yearlyEntitlement = entitlement.yearlyEntitlement;
  
  let balance = await LeaveBalance.findOne({
    where: { employeeId, year }
  });
  
  if (!balance) {
    balance = {
      employeeId,
      year,
      yearsOfService: 0,
      yearlyEntitlement,
      carriedOver: 0,
      totalAllocation: yearlyEntitlement,
      usedThisYear: 0,
      pendingDays: 0,
      availableDays: yearlyEntitlement
    };
  }
  
  return balance;
}

// Approve leave request - WITH AUTO DATE ADJUSTMENT
exports.approveLeaveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const userId = req.user.userId;
    const rules = await getLeaveRules();
    
    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: [{ model: LeaveExtension, as: 'extensions' }],
      transaction
    });
    
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const originalStartDate = new Date(leaveRequest.startDate);
    const originalEndDate = new Date(leaveRequest.endDate);
    
    let startDateChanged = false;
    let newStartDate = leaveRequest.startDate;
    let newEndDate = leaveRequest.endDate;
    let newTotalDays = leaveRequest.totalDays;
    let adjustmentMessage = '';
    
    // CHECK IF START DATE HAS PASSED
    if (originalStartDate < today) {
      // Start date passed - adjust to today
      newStartDate = today.toISOString().split('T')[0];
      
      // Calculate new end date (keeping same duration)
      const durationDays = leaveRequest.totalDays;
      const calculatedEndDate = new Date(today);
      calculatedEndDate.setDate(today.getDate() + durationDays - 1);
      newEndDate = calculatedEndDate.toISOString().split('T')[0];
      
      // Recalculate total days
      newTotalDays = calculateDays(newStartDate, newEndDate);
      
      startDateChanged = true;
      adjustmentMessage = `\n\n[Auto-adjusted] Original dates: ${formatDate(leaveRequest.startDate)} to ${formatDate(leaveRequest.endDate)}. Since approval date (${formatDate(today)}) passed the requested start date, leave has been adjusted to start from approval date: ${newStartDate} to ${newEndDate}.`;
      
      // Update the leave request
      leaveRequest.startDate = newStartDate;
      leaveRequest.endDate = newEndDate;
      leaveRequest.totalDays = newTotalDays;
      
      // Update return date
      const returnDate = new Date(newEndDate);
      returnDate.setDate(returnDate.getDate() + 1);
      leaveRequest.returnDate = returnDate.toISOString().split('T')[0];
    }
    
    // Process pending extensions based on config
    const extensionConfig = rules.extensions;
    if (leaveRequest.extensions && leaveRequest.extensions.length > 0) {
      for (const ext of leaveRequest.extensions) {
        if (ext.status === 'pending') {
          // Check max extensions
          if (extensionConfig.maxExtensionsPerLeave && leaveRequest.extensionCount >= extensionConfig.maxExtensionsPerLeave) {
            ext.status = 'rejected';
            ext.rejectionReason = 'Maximum extensions reached';
            await ext.save({ transaction });
            continue;
          }
          
          // Check max total extension days
          if (extensionConfig.maxTotalExtensionDays && 
              leaveRequest.totalExtensionDays + ext.additionalDays > extensionConfig.maxTotalExtensionDays) {
            ext.status = 'rejected';
            ext.rejectionReason = 'Total extension days would exceed maximum';
            await ext.save({ transaction });
            continue;
          }
          
          ext.status = 'approved';
          ext.approvedDate = new Date();
          ext.approvedBy = userId;
          ext.newEndDate = ext.requestedNewEndDate;
          await ext.save({ transaction });
          
          // Update leave request dates
          leaveRequest.endDate = ext.requestedNewEndDate;
          leaveRequest.totalDays += ext.additionalDays;
          leaveRequest.extensionCount += 1;
          leaveRequest.totalExtensionDays += ext.additionalDays;
          leaveRequest.lastExtendedDate = new Date();
          
          const newReturnDate = new Date(leaveRequest.endDate);
          newReturnDate.setDate(newReturnDate.getDate() + 1);
          leaveRequest.returnDate = newReturnDate.toISOString().split('T')[0];
        }
      }
    }
    
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = userId;
    leaveRequest.approvedDate = new Date();
    leaveRequest.approvalNotes = (approvalNotes || '') + adjustmentMessage;
    await leaveRequest.save({ transaction });
    
    // Update balance for annual leave
    const leaveType = await LeaveType.findByPk(leaveRequest.leaveTypeId);
    if (leaveType && leaveType.name === 'Annual Leave') {
      const currentYear = new Date().getFullYear();
      let balance = await LeaveBalance.findOne({
        where: { employeeId: leaveRequest.employeeId, year: currentYear },
        transaction
      });
      
      if (balance) {
        balance.usedThisYear += leaveRequest.totalDays;
        balance.pendingDays = Math.max(0, (balance.pendingDays || 0) - leaveRequest.totalDays);
        await balance.save({ transaction });
      }
    }
    
    await transaction.commit();
    
    // Prepare response message
    let responseMessage = 'Leave request approved successfully';
    if (startDateChanged) {
      responseMessage = `Leave request approved. Start date automatically adjusted from ${formatDate(originalStartDate)} to today (${formatDate(today)}) because approval was after the requested start date.`;
    }
    
    res.json({ 
      success: true, 
      message: responseMessage,
      data: {
        startDateChanged,
        originalStartDate: formatDate(originalStartDate),
        newStartDate: formatDate(newStartDate),
        originalEndDate: formatDate(originalEndDate),
        newEndDate: formatDate(newEndDate)
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error in approveLeaveRequest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to format date for display
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to calculate days between dates
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

// Reject leave request
exports.rejectLeaveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { rejectionReason, hrNotes } = req.body;
    const userId = req.user.userId;
    
    const leaveRequest = await LeaveRequest.findByPk(id, { transaction });
    
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    leaveRequest.status = 'rejected';
    leaveRequest.rejectedBy = userId;
    leaveRequest.rejectedDate = new Date();
    leaveRequest.rejectionReason = rejectionReason;
    leaveRequest.hrNotes = hrNotes;
    await leaveRequest.save({ transaction });
    
    // Return pending days to balance for annual leave
    const leaveType = await LeaveType.findByPk(leaveRequest.leaveTypeId);
    if (leaveType && leaveType.name === 'Annual Leave') {
      const currentYear = new Date().getFullYear();
      const balance = await LeaveBalance.findOne({
        where: { employeeId: leaveRequest.employeeId, year: currentYear },
        transaction
      });
      
      if (balance) {
        balance.pendingDays = Math.max(0, (balance.pendingDays || 0) - leaveRequest.totalDays);
        balance.availableDays += leaveRequest.totalDays;
        await balance.save({ transaction });
      }
    }
    
    await transaction.commit();
    res.json({ success: true, message: 'Leave request rejected' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in rejectLeaveRequest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel leave request
exports.cancelLeaveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const leaveRequest = await LeaveRequest.findByPk(id, { transaction });
    
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    const leaveType = await LeaveType.findByPk(leaveRequest.leaveTypeId);
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({
      where: { employeeId: leaveRequest.employeeId, year: currentYear },
      transaction
    });
    
    if (leaveRequest.status === 'approved') {
      if (balance && leaveType && leaveType.name === 'Annual Leave') {
        balance.usedThisYear -= leaveRequest.totalDays;
        await balance.save({ transaction });
      }
    } else if (leaveRequest.status === 'pending') {
      if (balance && leaveType && leaveType.name === 'Annual Leave') {
        balance.pendingDays = Math.max(0, (balance.pendingDays || 0) - leaveRequest.totalDays);
        balance.availableDays += leaveRequest.totalDays;
        await balance.save({ transaction });
      }
    }
    
    leaveRequest.status = 'cancelled';
    await leaveRequest.save({ transaction });
    
    await transaction.commit();
    res.json({ success: true, message: 'Leave request cancelled' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in cancelLeaveRequest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete leave request
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const leaveRequest = await LeaveRequest.findByPk(id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    await leaveRequest.destroy();
    res.json({ success: true, message: 'Leave request deleted' });
  } catch (error) {
    console.error('Error in deleteLeaveRequest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update leave request
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const leaveRequest = await LeaveRequest.findByPk(id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    await leaveRequest.update(updates);
    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    console.error('Error in updateLeaveRequest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== LEAVE EXTENSIONS ====================

// Request extension
exports.requestExtension = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { additionalDays, reason } = req.body;
    const rules = await getLeaveRules();
    const extensionConfig = rules.extensions;
    
    const leaveRequest = await LeaveRequest.findByPk(id, { transaction });
    
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    if (leaveRequest.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Only approved leaves can be extended' });
    }
    
    // Check if this leave type allows extensions
    if (!extensionConfig.allowedLeaveTypesForExtension?.includes('sick_leave')) {
      return res.status(400).json({ success: false, error: 'This leave type does not allow extensions' });
    }
    
    // Check max extensions
    if (extensionConfig.maxExtensionsPerLeave && leaveRequest.extensionCount >= extensionConfig.maxExtensionsPerLeave) {
      return res.status(400).json({ success: false, error: `Maximum ${extensionConfig.maxExtensionsPerLeave} extension(s) reached` });
    }
    
    // Check max total extension days
    if (extensionConfig.maxTotalExtensionDays && 
        leaveRequest.totalExtensionDays + additionalDays > extensionConfig.maxTotalExtensionDays) {
      return res.status(400).json({ success: false, error: `Total extension days cannot exceed ${extensionConfig.maxTotalExtensionDays}` });
    }
    
    // Check if reason is required
    if (extensionConfig.extensionReasonRequired && !reason) {
      return res.status(400).json({ success: false, error: 'Reason for extension is required' });
    }
    
    const extension = await LeaveExtension.create({
      leaveRequestId: id,
      originalEndDate: leaveRequest.endDate,
      additionalDays,
      reason,
      requestedDate: new Date(),
      status: 'pending'
    }, { transaction });
    
    await transaction.commit();
    res.status(201).json({ success: true, data: extension });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in requestExtension:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve extension
exports.approveExtension = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { extensionId } = req.params;
    const userId = req.user.userId;
    const rules = await getLeaveRules();
    const extensionConfig = rules.extensions;
    
    const extension = await LeaveExtension.findByPk(extensionId, {
      include: [{ model: LeaveRequest, as: 'leaveRequest' }],
      transaction
    });
    
    if (!extension) {
      return res.status(404).json({ success: false, error: 'Extension not found' });
    }
    
    extension.status = 'approved';
    extension.approvedBy = userId;
    extension.approvedDate = new Date();
    extension.newEndDate = extension.requestedNewEndDate;
    await extension.save({ transaction });
    
    // Update leave request
    const leaveRequest = extension.leaveRequest;
    leaveRequest.endDate = extension.requestedNewEndDate;
    leaveRequest.totalDays += extension.additionalDays;
    leaveRequest.extensionCount += 1;
    leaveRequest.totalExtensionDays += extension.additionalDays;
    leaveRequest.lastExtendedDate = new Date();
    
    const newReturnDate = new Date(leaveRequest.endDate);
    newReturnDate.setDate(newReturnDate.getDate() + 1);
    leaveRequest.returnDate = newReturnDate.toISOString().split('T')[0];
    await leaveRequest.save({ transaction });
    
    await transaction.commit();
    res.json({ success: true, message: 'Extension approved' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in approveExtension:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject extension
exports.rejectExtension = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { extensionId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user.userId;
    
    const extension = await LeaveExtension.findByPk(extensionId, { transaction });
    
    if (!extension) {
      return res.status(404).json({ success: false, error: 'Extension not found' });
    }
    
    extension.status = 'rejected';
    extension.rejectedBy = userId;
    extension.rejectedDate = new Date();
    extension.rejectionReason = rejectionReason;
    await extension.save({ transaction });
    
    await transaction.commit();
    res.json({ success: true, message: 'Extension rejected' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in rejectExtension:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== RETURN TRACKING ====================

// Confirm employee return
exports.confirmReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualReturnDate } = req.body;
    const userId = req.user.userId;
    
    const leaveRequest = await LeaveRequest.findByPk(id);
    
    if (!leaveRequest) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    
    const expectedReturn = new Date(leaveRequest.returnDate);
    const actual = new Date(actualReturnDate);
    const daysLate = Math.max(0, Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24)));
    
    leaveRequest.returnStatus = daysLate > 0 ? 'returned_late' : 'returned';
    leaveRequest.actualReturnDate = actualReturnDate;
    leaveRequest.daysLate = daysLate;
    leaveRequest.returnConfirmedBy = userId;
    leaveRequest.returnConfirmedDate = new Date();
    
    await leaveRequest.save();
    res.json({ success: true, message: `Return confirmed${daysLate > 0 ? ` - ${daysLate} days late` : ''}` });
  } catch (error) {
    console.error('Error in confirmReturn:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get overdue returns
exports.getOverdueReturns = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const overdueRequests = await LeaveRequest.findAll({
      where: {
        status: 'approved',
        returnDate: { [Op.lt]: today },
        actualReturnDate: null
      },
      include: [
        { model: Employee, as: 'employee', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
        { model: Department, as: 'department', attributes: ['departmentId', 'name'] },
        { model: LeaveType, as: 'leaveType', attributes: ['leaveTypeId', 'name'] }
      ]
    });
    
    const result = overdueRequests.map(req => ({
      ...req.toJSON(),
      daysOverdue: Math.ceil((new Date(today) - new Date(req.returnDate)) / (1000 * 60 * 60 * 24))
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getOverdueReturns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};




// ==================== LEAVE BALANCES ====================

// Get employee balance

// Get employee balance - Dynamic calculation based on hire date
exports.getEmployeeBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { asOfDate = new Date() } = req.query;
    
    const balance = await calculateEmployeeBalance(employeeId, new Date(asOfDate));
    
    if (!balance) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Error in getEmployeeBalance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add this to your controller
exports.runYearEndProcessing = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.body;
    const result = await processYearEndRollover(year);
    res.json(result);
  } catch (error) {
    console.error('Error in year-end processing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get logged-in employee's current balance
exports.getMyCurrentBalance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.userId } });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    return exports.getEmployeeBalance({ params: { employeeId: employee.employeeId }, query: {} }, res);
  } catch (error) {
    console.error('Error in getMyCurrentBalance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STATISTICS ====================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalRequests = await LeaveRequest.count();
    const pendingRequests = await LeaveRequest.count({ where: { status: 'pending' } });
    const approvedRequests = await LeaveRequest.count({ where: { status: 'approved' } });
    const rejectedRequests = await LeaveRequest.count({ where: { status: 'rejected' } });
    
    const onLeaveToday = await LeaveRequest.count({
      where: {
        status: 'approved',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today }
      }
    });
    
    const totalDaysRequested = await LeaveRequest.sum('totalDays') || 0;
    
    const departmentsWithLeave = await LeaveRequest.count({
      distinct: true,
      col: 'departmentId',
      where: { status: { [Op.in]: ['approved', 'pending'] } }
    });
    
    const overdueReturns = await LeaveRequest.count({
      where: {
        status: 'approved',
        returnDate: { [Op.lt]: today },
        actualReturnDate: null
      }
    });
    
    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        employeesOnLeaveToday: onLeaveToday,
        totalDaysRequested,
        departmentsWithLeave,
        overdueReturns
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get department statistics
exports.getDepartmentStats = async (req, res) => {
  try {
    const stats = await LeaveRequest.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('COUNT', sequelize.col('leave_request_id')), 'totalRequests'],
        [sequelize.fn('SUM', sequelize.col('total_days')), 'totalDays']
      ],
      include: [{ model: Department, as: 'department', attributes: ['name'] }],
      group: ['departmentId', 'department.department_id', 'department.name'],
      where: {
        status: 'approved',
        created_at: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) }
      }
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in getDepartmentStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get calendar data
exports.getCalendarData = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const leaves = await LeaveRequest.findAll({
      where: {
        status: 'approved',
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate }
      },
      include: [
        { model: Employee, as: 'employee', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] }
      ]
    });
    
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Error in getCalendarData:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export to CSV
exports.exportToCSV = async (req, res) => {
  try {
    const leaves = await LeaveRequest.findAll({
      include: [
        { model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeCode'] },
        { model: Department, as: 'department', attributes: ['name'] },
        { model: LeaveType, as: 'leaveType', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    const csvData = leaves.map(leave => ({
      'Request ID': leave.leaveRequestId,
      'Employee': `${leave.employee.firstName} ${leave.employee.lastName}`,
      'Employee Code': leave.employee.employeeCode,
      'Department': leave.department?.name || 'N/A',
      'Leave Type': leave.leaveType?.name || 'N/A',
      'Start Date': leave.startDate,
      'End Date': leave.endDate,
      'Total Days': leave.totalDays,
      'Status': leave.status,
      'Requested Date': leave.requestedDate,
      'Approved Date': leave.approvedDate || ''
    }));
    
    res.json({ success: true, data: csvData });
  } catch (error) {
    console.error('Error in exportToCSV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};







// Add this to your leaveController.js

// ==================== LEAVE TYPES ====================

/**
 * Get all leave types
 */
exports.getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      attributes: ['leaveTypeId', 'name', 'code', 'description', 'defaultDays', 'isPaid', 'hasFixedLimit', 'isOneTime', 'requiresApproval', 'minNoticeDays', 'maxConsecutiveDays', 'requiresDocumentation', 'genderRestriction', 'carryOverLimit', 'carryOverExpiryYears', 'isActive', 'sortOrder']
    });
    
    res.json({ success: true, data: leaveTypes });
  } catch (error) {
    console.error('Error in getLeaveTypes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get leave type by ID
 */
exports.getLeaveTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByPk(id);
    
    if (!leaveType) {
      return res.status(404).json({ success: false, error: 'Leave type not found' });
    }
    
    res.json({ success: true, data: leaveType });
  } catch (error) {
    console.error('Error in getLeaveTypeById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create leave type (Admin only)
 */
exports.createLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.create(req.body);
    res.status(201).json({ success: true, data: leaveType, message: 'Leave type created successfully' });
  } catch (error) {
    console.error('Error in createLeaveType:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update leave type (Admin only)
 */
exports.updateLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByPk(id);
    
    if (!leaveType) {
      return res.status(404).json({ success: false, error: 'Leave type not found' });
    }
    
    await leaveType.update(req.body);
    res.json({ success: true, data: leaveType, message: 'Leave type updated successfully' });
  } catch (error) {
    console.error('Error in updateLeaveType:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete leave type (Admin only)
 */
exports.deleteLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByPk(id);
    
    if (!leaveType) {
      return res.status(404).json({ success: false, error: 'Leave type not found' });
    }
    
    await leaveType.destroy();
    res.json({ success: true, message: 'Leave type deleted successfully' });
  } catch (error) {
    console.error('Error in deleteLeaveType:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};