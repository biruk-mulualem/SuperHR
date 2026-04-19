// services/attendanceConfig.service.js
const { Op } = require('sequelize');
const { 
  Employee, 
  CompanyShiftDefault, 
  DepartmentOverride, 
  EmployeeOverride,
  BreakTicket,
  AttendanceLog,
  OvertimeRate,
  LateNightAdjustment,
  FieldWorkAssignment,
  
  Holiday,
  WorkingDaysConfig
} = require('../models');

class AttendanceService {
  
  // =============================================
  // EFFECTIVE CONFIGURATION (Priority-based)
  // =============================================
  
  async getEffectiveLunchDuration(employeeId, date = new Date()) {
    const formattedDate = date.toISOString().split('T')[0];
    
    // Priority 1: Employee Override
    const employeeOverride = await EmployeeOverride.findOne({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (employeeOverride?.lunchDurationMinutes) {
      return employeeOverride.lunchDurationMinutes;
    }
    
    // Priority 2: Department Override
    const employee = await Employee.findByPk(employeeId);
    if (employee?.departmentId) {
      const deptOverride = await DepartmentOverride.findOne({
        where: {
          departmentId: employee.departmentId,
          shiftType: employee.shiftType,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      });
      
      if (deptOverride?.lunchDurationMinutes) {
        return deptOverride.lunchDurationMinutes;
      }
    }
    
    // Priority 3: Company Default
    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: employee?.shiftType || 'day',
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ],
        isActive: true
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    return companyDefault?.lunchDurationMinutes || 40;
  }
  
  async getEffectiveDinnerDuration(employeeId, date = new Date()) {
    const formattedDate = date.toISOString().split('T')[0];
    
    const employeeOverride = await EmployeeOverride.findOne({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (employeeOverride?.dinnerDurationMinutes) {
      return employeeOverride.dinnerDurationMinutes;
    }
    
    const employee = await Employee.findByPk(employeeId);
    if (employee?.departmentId) {
      const deptOverride = await DepartmentOverride.findOne({
        where: {
          departmentId: employee.departmentId,
          shiftType: employee.shiftType,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      });
      
      if (deptOverride?.dinnerDurationMinutes) {
        return deptOverride.dinnerDurationMinutes;
      }
    }
    
    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: employee?.shiftType || 'day',
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ],
        isActive: true
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    return companyDefault?.dinnerDurationMinutes || 40;
  }
  
  async getEffectiveCheckInTime(employeeId, date = new Date()) {
    const formattedDate = date.toISOString().split('T')[0];
    
    const employeeOverride = await EmployeeOverride.findOne({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (employeeOverride?.checkInTime) {
      return employeeOverride.checkInTime;
    }
    
    const employee = await Employee.findByPk(employeeId);
    if (employee?.departmentId) {
      const deptOverride = await DepartmentOverride.findOne({
        where: {
          departmentId: employee.departmentId,
          shiftType: employee.shiftType,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      });
      
      if (deptOverride?.checkInTime) {
        return deptOverride.checkInTime;
      }
    }
    
    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: employee?.shiftType || 'day',
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ],
        isActive: true
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    return companyDefault?.checkInTime || '06:20:00';
  }
  
  async getEffectiveCheckOutTime(employeeId, date = new Date()) {
    const formattedDate = date.toISOString().split('T')[0];
    
    const employeeOverride = await EmployeeOverride.findOne({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (employeeOverride?.checkOutTime) {
      return employeeOverride.checkOutTime;
    }
    
    const employee = await Employee.findByPk(employeeId);
    if (employee?.departmentId) {
      const deptOverride = await DepartmentOverride.findOne({
        where: {
          departmentId: employee.departmentId,
          shiftType: employee.shiftType,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      });
      
      if (deptOverride?.checkOutTime) {
        return deptOverride.checkOutTime;
      }
    }
    
    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: employee?.shiftType || 'day',
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ],
        isActive: true
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    return companyDefault?.checkOutTime || '18:00:00';
  }
  
  async getEffectiveSchedule(employeeId, date = new Date()) {
    const formattedDate = date.toISOString().split('T')[0];
    
    const employee = await Employee.findByPk(employeeId, {
      include: ['department']
    });
    
    const [employeeOverride, deptOverride, companyDefault] = await Promise.all([
      EmployeeOverride.findOne({
        where: {
          employeeId,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      }),
      DepartmentOverride.findOne({
        where: {
          departmentId: employee?.departmentId,
          shiftType: employee?.shiftType,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      }),
      CompanyShiftDefault.findOne({
        where: {
          shiftType: employee?.shiftType || 'day',
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ],
          isActive: true
        },
        order: [['effectiveFrom', 'DESC']]
      })
    ]);
    
    return {
      employeeId,
      employeeName: `${employee?.firstName} ${employee?.lastName}`,
      department: employee?.department?.name,
      shiftType: employee?.shiftType,
      effectiveDate: formattedDate,
      checkInTime: employeeOverride?.checkInTime || deptOverride?.checkInTime || companyDefault?.checkInTime,
      checkOutTime: employeeOverride?.checkOutTime || deptOverride?.checkOutTime || companyDefault?.checkOutTime,
      lunchDuration: employeeOverride?.lunchDurationMinutes || deptOverride?.lunchDurationMinutes || companyDefault?.lunchDurationMinutes,
      dinnerDuration: employeeOverride?.dinnerDurationMinutes || deptOverride?.dinnerDurationMinutes || companyDefault?.dinnerDurationMinutes,
      priority: employeeOverride ? 'Employee Override' : (deptOverride ? 'Department Override' : 'Company Default')
    };
  }
  
  // =============================================
  // BREAK TICKET MANAGEMENT
  // =============================================
async issueBreakTicket(employeeId, breakType, reason = null) {
  const now = new Date();
  const currentTimeString = now.toTimeString().slice(0, 5);
  
  // Get company defaults based on break type
  const shiftType = breakType === 'lunch' ? 'day' : 'night';
  const companyDefault = await CompanyShiftDefault.findOne({
    where: { shiftType: shiftType, isActive: true },
    order: [['effectiveFrom', 'DESC']]
  });
  
  if (!companyDefault) {
    throw new Error(`Company defaults not configured for ${shiftType} shift. Please contact administrator.`);
  }
  
  // VALIDATION 1: Check if employee already has a break ticket for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  const existingTodayTicket = await BreakTicket.findOne({
    where: {
      employeeId,
      breakType,
      breakOutTime: {
        [Op.between]: [todayStart, todayEnd]
      }
    }
  });
  
  if (existingTodayTicket) {
    throw new Error(`❌ You already took ${breakType} today. You can only take one ${breakType} break per day.`);
  }
  
  // Check for existing active break (not completed)
  const existingActive = await BreakTicket.findOne({
    where: {
      employeeId,
      breakType,
      actualReturnTime: null,
      status: ['active', 'late']
    }
  });
  
  if (existingActive) {
    throw new Error(`❌ You already have an active ${breakType} break. Please complete it first.`);
  }
  
  // VALIDATION 2: Time window based on break type
  if (breakType === 'lunch') {
    // Lunch: from lunch start time to 1 hour before check-out
    const lunchStartTime = companyDefault.lunchStartTime || '12:00';
    const checkOutTime = companyDefault.checkOutTime || '18:00';
    
    const [checkOutHour, checkOutMinute] = checkOutTime.split(':');
    let latestLunchHour = parseInt(checkOutHour) - 1;
    const latestLunchTime = `${latestLunchHour.toString().padStart(2, '0')}:${checkOutMinute}`;
    
    if (currentTimeString < lunchStartTime) {
      throw new Error(`❌ Lunch break is not yet available. Lunch starts at ${lunchStartTime}.`);
    }
    
    if (currentTimeString > latestLunchTime) {
      throw new Error(`❌ Lunch must start by ${latestLunchTime} (1 hour before check-out at ${checkOutTime}).`);
    }
  } else if (breakType === 'dinner') {
    // ✅ Dinner validation for night shift (crosses midnight)
    const dinnerStartTime = companyDefault.dinnerStartTime || '20:00'; // 8:00 PM
    const checkOutTime = companyDefault.checkOutTime || '06:00'; // 6:00 AM next day
    
    // Convert times to minutes for proper comparison
    const [currentHour, currentMinute] = currentTimeString.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = dinnerStartTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    
    const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);
    let checkOutMinutes = checkOutHour * 60 + checkOutMinute;
    
    // For night shift: dinner can be taken from dinnerStartTime until check-out time NEXT DAY
    // So add 24 hours (1440 minutes) to check-out time for comparison
    let isWithinWindow = false;
    
    // Case 1: Current time is after dinner start (e.g., 10:00 PM)
    if (currentMinutes >= startMinutes) {
      // Check if before check-out next day (add 24 hours)
      if (currentMinutes <= checkOutMinutes + 1440) {
        isWithinWindow = true;
      }
    }
    // Case 2: Current time is after midnight but before check-out (e.g., 2:00 AM)
    else if (currentMinutes >= 0 && currentMinutes <= checkOutMinutes) {
      isWithinWindow = true;
    }
    
    if (!isWithinWindow) {
      throw new Error(`❌ Dinner break is only available from ${dinnerStartTime} until ${checkOutTime} (next day).`);
    }
  }
  
  // Get duration based on priority (Employee > Department > Company)
  let durationMinutes = null;
  const employee = await Employee.findByPk(employeeId);
  
  // Priority 1: Employee Override
  const employeeOverride = await EmployeeOverride.findOne({
    where: {
      employeeId,
      effectiveFrom: { [Op.lte]: now },
      [Op.or]: [
        { effectiveTo: { [Op.gte]: now } },
        { effectiveTo: null }
      ]
    },
    order: [['effectiveFrom', 'DESC']]
  });
  
  if (breakType === 'lunch') {
    if (employeeOverride && employeeOverride.lunchDurationMinutes != null) {
      durationMinutes = employeeOverride.lunchDurationMinutes;
    }
  } else {
    if (employeeOverride && employeeOverride.dinnerDurationMinutes != null) {
      durationMinutes = employeeOverride.dinnerDurationMinutes;
    }
  }
  
  // Priority 2: Department Override
  if (durationMinutes == null) {
    if (employee && employee.departmentId) {
      const deptShiftType = (employee.shiftType || (breakType === 'lunch' ? 'day' : 'night')).toLowerCase();
      const deptOverride = await DepartmentOverride.findOne({
        where: {
          departmentId: employee.departmentId,
          shiftType: deptShiftType,
          effectiveFrom: { [Op.lte]: now },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: now } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      });
      
      if (breakType === 'lunch') {
        if (deptOverride && deptOverride.lunchDurationMinutes != null) {
          durationMinutes = deptOverride.lunchDurationMinutes;
        }
      } else {
        if (deptOverride && deptOverride.dinnerDurationMinutes != null) {
          durationMinutes = deptOverride.dinnerDurationMinutes;
        }
      }
    }
  }
  
  // Priority 3: Company Default
  if (durationMinutes == null) {
    if (breakType === 'lunch') {
      if (companyDefault && companyDefault.lunchDurationMinutes != null) {
        durationMinutes = companyDefault.lunchDurationMinutes;
      }
    } else {
      if (companyDefault && companyDefault.dinnerDurationMinutes != null) {
        durationMinutes = companyDefault.dinnerDurationMinutes;
      }
    }
    
    if (durationMinutes == null) {
      throw new Error(`No ${breakType} duration configured. Please set up company defaults first.`);
    }
  }
  
  const expectedReturnTime = new Date(now.getTime() + durationMinutes * 60000);
  
  const ticket = await BreakTicket.create({
    employeeId,
    breakType,
    breakOutTime: now,
    expectedReturnTime,
    durationMinutes,
    reason: reason || null,
    status: 'active',
    lateMinutes: 0
  });
  
  return await BreakTicket.findByPk(ticket.id, {
    include: [{ model: Employee, as: 'employee' }]
  });
}
  
  async returnFromBreak(ticketId) {
    const ticket = await BreakTicket.findByPk(ticketId, {
      include: [{ model: Employee, as: 'employee' }]
    });
    
    if (!ticket) {
      throw new Error('Break ticket not found');
    }
    
    if (ticket.actualReturnTime) {
      throw new Error('Break already completed');
    }
    
    const now = new Date();
    const expectedReturn = new Date(ticket.expectedReturnTime);
    
    // Get absent threshold based on break type
    const shiftType = ticket.breakType === 'lunch' ? 'day' : 'night';
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: shiftType, isActive: true },
      order: [['effectiveFrom', 'DESC']]
    });
    const absentAfterMinutes = companyDefault?.absentAfterMinutes || 60;
    
    let lateMinutes = 0;
    let status;
    
    if (now <= expectedReturn) {
      status = 'on-time';
      lateMinutes = 0;
    } else {
      lateMinutes = Math.floor((now - expectedReturn) / (1000 * 60));
      if (lateMinutes > absentAfterMinutes) {
        status = 'absent';
      } else {
        status = 'late';
      }
    }
    
    await ticket.update({
      actualReturnTime: now,
      lateMinutes,
      status
    });
    
    return ticket;
  }
  
  async getActiveBreaks() {
    return await BreakTicket.findAll({
      where: {
        status: ['active', 'late']
      },
      include: [{ 
        model: Employee, 
        as: 'employee',
      }],
      order: [['expectedReturnTime', 'ASC']]
    });
  }
  
  async checkExpiredBreaks() {
    const expiredBreaks = await BreakTicket.findAll({
      where: {
        status: ['active', 'late'],
        expectedReturnTime: { [Op.lt]: new Date() }
      }
    });
    
    for (const ticket of expiredBreaks) {
      const shiftType = ticket.breakType === 'lunch' ? 'day' : 'night';
      const companyDefault = await CompanyShiftDefault.findOne({
        where: { shiftType: shiftType, isActive: true },
        order: [['effectiveFrom', 'DESC']]
      });
      const absentAfterMinutes = companyDefault?.absentAfterMinutes || 60;
      
      const lateMinutes = Math.floor((new Date() - ticket.expectedReturnTime) / 60000);
      let status = 'late';
      
      if (lateMinutes > absentAfterMinutes) {
        status = 'absent';
      }
      
      await ticket.update({ status, lateMinutes });
    }
    
    return expiredBreaks;
  }
  
  // =============================================
  // ATTENDANCE LOGGING
  // =============================================
  
  async recordAttendance(employeeId, date, checkInTime = null, checkOutTime = null) {
    const attendanceDate = date.toISOString().split('T')[0];
    
    const effectiveCheckIn = await this.getEffectiveCheckInTime(employeeId, date);
    const effectiveCheckOut = await this.getEffectiveCheckOutTime(employeeId, date);
    
    let lateMinutes = 0;
    let isLate = false;
    
    if (checkInTime) {
      const scheduledCheckIn = new Date(date);
      const [hours, minutes] = effectiveCheckIn.split(':');
      scheduledCheckIn.setHours(parseInt(hours), parseInt(minutes), 0);
      
      if (checkInTime > scheduledCheckIn) {
        lateMinutes = Math.floor((checkInTime - scheduledCheckIn) / 60000);
        isLate = true;
      }
    }
    
    const fieldWork = await FieldWorkAssignment.findOne({
      where: {
        employeeId,
        status: 'active',
        startDate: { [Op.lte]: attendanceDate },
        [Op.or]: [
          { endDate: { [Op.gte]: attendanceDate } },
          { endDate: null },
          { assignmentType: 'permanent' }
        ]
      }
    });
    
    const holiday = await Holiday.findOne({
      where: { holidayDate: attendanceDate }
    });
    
    let totalHours = 0;
    if (checkInTime && checkOutTime) {
      totalHours = parseFloat(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2));
    }
    
    const employee = await Employee.findByPk(employeeId);
    
    const [attendance, created] = await AttendanceLog.upsert({
      employeeId,
      attendanceDate,
      shiftType: employee?.shiftType || 'day',
      checkInTime,
      checkOutTime,
      isLate,
      lateMinutes,
      isAbsent: !checkInTime && !fieldWork,
      isFieldWork: !!fieldWork,
      isHoliday: !!holiday,
      totalHours,
      notes: fieldWork ? 'Field work day' : null
    });
    
    return attendance;
  }
  
  async getAttendanceReport(employeeId, startDate, endDate) {
    return await AttendanceLog.findAll({
      where: {
        employeeId,
        attendanceDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['attendanceDate', 'ASC']]
    });
  }
  
  // =============================================
  // OVERTIME CALCULATION
  // =============================================
  
  async calculateOvertime(employeeId, date) {
    const attendance = await AttendanceLog.findOne({
      where: {
        employeeId,
        attendanceDate: date.toISOString().split('T')[0]
      }
    });
    
    if (!attendance || !attendance.checkOutTime) {
      return { overtimeMinutes: 0, rate: 1.5 };
    }
    
    const overtimeAfter = await this.getEffectiveOvertimeAfter(employeeId, date);
    const [hours, minutes] = overtimeAfter.split(':');
    const overtimeThreshold = new Date(date);
    overtimeThreshold.setHours(parseInt(hours), parseInt(minutes), 0);
    
    let overtimeMinutes = 0;
    if (attendance.checkOutTime > overtimeThreshold) {
      overtimeMinutes = Math.floor((attendance.checkOutTime - overtimeThreshold) / 60000);
    }
    
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = await Holiday.findOne({ where: { holidayDate: date } });
    
    let dayType = 'weekday';
    if (isHoliday) dayType = 'holiday';
    else if (isWeekend) dayType = 'weekend';
    
    const employee = await Employee.findByPk(employeeId);
    const overtimeRate = await OvertimeRate.findOne({
      where: {
        shiftType: employee?.shiftType || 'day',
        dayType,
        effectiveFrom: { [Op.lte]: date },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: date } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    await attendance.update({
      overtimeMinutes,
      overtimeRateApplied: overtimeRate?.rate || 1.5
    });
    
    return { overtimeMinutes, rate: overtimeRate?.rate || 1.5 };
  }
  
  async getEffectiveOvertimeAfter(employeeId, date = new Date()) {
    const formattedDate = date.toISOString().split('T')[0];
    
    const employeeOverride = await EmployeeOverride.findOne({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: formattedDate },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: formattedDate } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (employeeOverride?.overtimeAfterTime) {
      return employeeOverride.overtimeAfterTime;
    }
    
    const employee = await Employee.findByPk(employeeId);
    if (employee?.departmentId) {
      const deptOverride = await DepartmentOverride.findOne({
        where: {
          departmentId: employee.departmentId,
          shiftType: employee.shiftType,
          effectiveFrom: { [Op.lte]: formattedDate },
          [Op.or]: [
            { effectiveTo: { [Op.gte]: formattedDate } },
            { effectiveTo: null }
          ]
        },
        order: [['effectiveFrom', 'DESC']]
      });
      
      if (deptOverride?.overtimeAfterTime) {
        return deptOverride.overtimeAfterTime;
      }
    }
    
    return '18:00:00';
  }
  
  // =============================================
  // FIELD WORK MANAGEMENT
  // =============================================
  
  async registerFieldWork(employeeId, assignmentType, startDate, endDate = null, location = null, notes = null) {
    const existing = await FieldWorkAssignment.findOne({
      where: {
        employeeId,
        status: 'active'
      }
    });
    
    if (existing) {
      throw new Error('Employee already has active field work');
    }
    
    const assignment = await FieldWorkAssignment.create({
      employeeId,
      assignmentType,
      startDate,
      endDate: assignmentType === 'range' ? endDate : null,
      location,
      notes,
      status: 'active'
    });
    
    return assignment;
  }
  
  async completeFieldWork(assignmentId) {
    const assignment = await FieldWorkAssignment.findByPk(assignmentId);
    if (!assignment) {
      throw new Error('Field work assignment not found');
    }
    
    await assignment.update({
      status: 'completed',
      completedAt: new Date()
    });
    
    return assignment;
  }
  
  async getActiveFieldWork(employeeId) {
    return await FieldWorkAssignment.findOne({
      where: {
        employeeId,
        status: 'active'
      }
    });
  }
  
  // =============================================
  // HOLIDAY MANAGEMENT
  // =============================================
  
  async isHoliday(date) {
    const holiday = await Holiday.findOne({
      where: { holidayDate: date.toISOString().split('T')[0] }
    });
    return !!holiday;
  }
  
  async getHolidayOvertimeRate(date) {
    const holiday = await Holiday.findOne({
      where: { holidayDate: date.toISOString().split('T')[0] }
    });
    return holiday?.overtimeRate || 2.5;
  }
  
  async getHolidays(year) {
    return await Holiday.findAll({
      where: {
        [Op.or]: [
          { year },
          { isRecurring: true }
        ]
      },
      order: [['holidayDate', 'ASC']]
    });
  }
  
  // =============================================
  // WORKING DAYS CHECK
  // =============================================
  
  async isWorkingDay(employeeId, date) {
    const employee = await Employee.findByPk(employeeId);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const config = await WorkingDaysConfig.findOne({
      where: {
        shiftType: employee?.shiftType || 'day',
        dayOfWeek: dayName,
        effectiveFrom: { [Op.lte]: date },
        [Op.or]: [
          { effectiveTo: { [Op.gte]: date } },
          { effectiveTo: null }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
    
    return config?.isWorkingDay ?? (dayName !== 'sunday');
  }
  
  // =============================================
  // LATE NIGHT ADJUSTMENTS
  // =============================================
  
  async addLateNightAdjustment(employeeId, workDate, workedUntilTime, adjustedCheckInTime, reason = null) {
    const existing = await LateNightAdjustment.findOne({
      where: { employeeId, workDate }
    });
    
    if (existing) {
      throw new Error('Adjustment already exists for this date');
    }
    
    const employee = await Employee.findByPk(employeeId);
    
    const adjustment = await LateNightAdjustment.create({
      employeeId,
      workDate,
      workedUntilTime,
      adjustedCheckInTime,
      reason,
      status: 'approved'
    });
    
    return adjustment;
  }
  
  async getLateNightAdjustments(employeeId) {
    return await LateNightAdjustment.findAll({
      where: { employeeId },
      order: [['workDate', 'DESC']]
    });
  }
  
  async deleteLateNightAdjustment(adjustmentId) {
    const adjustment = await LateNightAdjustment.findByPk(adjustmentId);
    if (!adjustment) {
      throw new Error('Adjustment not found');
    }
    
    await adjustment.destroy();
    return { message: 'Adjustment deleted successfully' };
  }
}

module.exports = new AttendanceService();