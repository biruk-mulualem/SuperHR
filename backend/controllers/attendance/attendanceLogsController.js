// controllers/attendance/attendanceLogsController.js
const {
  Employee,
  Department,
  Holiday,
  User,
  CompanyShiftDefault,
  LateNightAdjustment,
  AttendanceLog,
} = require("../../models");

const { Op, Sequelize } = require("sequelize");
const attendanceService = require("../../service/attendanceConfig.service");
// Add at the top with other requires
const employeeScheduleService = require("../../service/employeeSchedule.service");

exports.recordCheckIn = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const numericEmployeeId = parseInt(employeeId);
    if (isNaN(numericEmployeeId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID. Must be a number.",
      });
    }

    const { checkInTime, latitude, longitude } = req.body;
    
    // ✅ FIX 1: SINGLE TIME SOURCE - use this throughout the function
    const now = checkInTime ? new Date(checkInTime) : new Date();
    const today = now.toISOString().split("T")[0];
    
    // Get current time once - no duplicate declarations
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // =============================================
    // 1. CHECK EMPLOYEE
    // =============================================
    const employee = await Employee.findByPk(numericEmployeeId);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found." });
    }

    if (employee.employmentStatus !== "active") {
      return res.status(403).json({
        success: false,
        error: `Cannot check in. Employee status is '${employee.employmentStatus}'.`,
      });
    }

    // =============================================
    // 2. GET OR CREATE ATTENDANCE RECORD
    // =============================================
    let attendance = await AttendanceLog.findOne({
      where: {
        employeeId: numericEmployeeId,
        attendanceDate: today,
      },
    });

    if (attendance && attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        error: "Employee already checked in today.",
      });
    }

    // =============================================
    // 3. GET COMPANY DEFAULTS & SCHEDULE
    // ✅ FIX 1: Use 'now' instead of new Date()
    // =============================================
    const effectiveSchedule = await attendanceService.getEffectiveSchedule(
      numericEmployeeId,
      now,
    );
    const shiftType = effectiveSchedule.shiftType;
    const effectiveCheckInTime = effectiveSchedule.checkInTime;
    const effectiveCheckOutTime = effectiveSchedule.checkOutTime;

    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: shiftType,
        isActive: true,
      },
      order: [["effectiveFrom", "DESC"]],
    });

    if (!companyDefault) {
      return res.status(500).json({
        success: false,
        error: `Company default configuration not found for ${shiftType} shift.`,
      });
    }

    // =============================================
    // ✅ FIX 4: PROPER TIME ADDITION (handles midnight crossing)
    // =============================================
    const addMinutesToTime = (timeStr, minutes) => {
      if (!timeStr) return "12:00";
      const [hours, mins] = timeStr.split(":");
      const totalMinutes = (parseInt(hours) * 60 + parseInt(mins) + minutes) % (24 * 60);
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
    };

    const lunchStartTime = companyDefault.lunchStartTime || "12:00";
    const lunchDurationMinutes = companyDefault.lunchDurationMinutes || 60;
    const lunchEndTime = addMinutesToTime(lunchStartTime, lunchDurationMinutes);

    const lunchStartMinutes =
      parseInt(lunchStartTime.split(":")[0]) * 60 +
      parseInt(lunchStartTime.split(":")[1] || 0);
    const lunchEndMinutes =
      parseInt(lunchEndTime.split(":")[0]) * 60 +
      parseInt(lunchEndTime.split(":")[1] || 0);

    console.log("Lunch times:", {
      lunchStartTime,
      lunchEndTime,
      lunchStartMinutes,
      lunchEndMinutes,
    });
    
    // =============================================
    // 4. CHECK WORKING DAY & HOLIDAY
    // ✅ FIX 1: Use 'now' instead of new Date()
    // =============================================
    let isWorkingDay = await attendanceService.isWorkingDay(
      numericEmployeeId,
      now,
    );
    const isHolidayToday = await attendanceService.isHoliday(now);

    let dayType = "normal";
    let overtimeRateApplied = 1.0;
    let isSpecialDay = false;
    let holiday = null;

    if (isHolidayToday) {
      dayType = "holiday";
      holiday = await Holiday.findOne({ where: { holidayDate: today } });
      overtimeRateApplied = holiday?.overtimeRate || 2.5;
      isSpecialDay = true;
      isWorkingDay = false;
    } else if (!isWorkingDay) {
      dayType = "weekend";
      overtimeRateApplied = 2.0;
      isSpecialDay = true;
      isWorkingDay = false;
    }

    // =============================================
    // 5. CHECK FIELD WORK & LATE NIGHT ADJUSTMENT
    // =============================================
    const isOnFieldWork = await attendanceService.getActiveFieldWork(numericEmployeeId);

    const lateNightAdjustment = await LateNightAdjustment.findOne({
      where: {
        employeeId: numericEmployeeId,
        workDate: today,
        status: "approved",
      },
    });

    let finalCheckInTime = now;
    let adjustedCheckInNote = null;

    if (lateNightAdjustment) {
      const [hours, minutes] = lateNightAdjustment.adjustedCheckInTime.split(":");
      const adjustedDate = new Date(now);
      adjustedDate.setHours(parseInt(hours), parseInt(minutes), 0);
      finalCheckInTime = adjustedDate;
      adjustedCheckInNote = `Late night adjustment applied. Worked until ${lateNightAdjustment.workedUntilTime}`;
    }

    // =============================================
    // 6. CHECK PENDING LATE DEADLINE
    // =============================================
    if (attendance && attendance.status === "PENDING_LATE" && attendance.allowUntilTime) {
      const [deadlineHour, deadlineMinute] = attendance.allowUntilTime.split(":");
      const deadlineInMinutes = parseInt(deadlineHour) * 60 + parseInt(deadlineMinute);

      if (currentTimeMinutes <= deadlineInMinutes) {
        // Allow normal check-in flow to continue
      } else if (currentTimeMinutes > deadlineInMinutes) {
        await attendance.update({
          morningStatus: "absent",
          afternoonStatus: "pending",
          sessionType: "pending",
          status: "PENDING_ABSENT",
          isLate: false,
          isAbsent: false,
          allowUntilTime: null,
          notes: `${attendance.notes || ""} Failed to check in by deadline (${attendance.allowUntilTime}). Marked as absent for morning. Can work afternoon.`,
        });

        return res.status(400).json({
          success: false,
          error: `❌ Late approval expired at ${attendance.allowUntilTime}. You have been marked as absent for morning. You can check in for afternoon session after ${lunchEndTime}.`,
        });
      }
    }

    // =============================================
    // 7. CHECK FOR AFTERNOON-ONLY CHECK-IN (PENDING_ABSENT only)
    // =============================================
    if (attendance && attendance.status === "PENDING_ABSENT") {
      if (currentTimeMinutes >= lunchEndMinutes) {
        const attendanceData = {
          checkInTime: finalCheckInTime,
          isLate: false,
          lateMinutes: 0,
          isFieldWork: !!isOnFieldWork,
          isHoliday: isHolidayToday,
          isWorkingDay: isWorkingDay,
          dayType: dayType,
          overtimeRateApplied: overtimeRateApplied,
          morningStatus: "absent",
          afternoonStatus: "present",
          sessionType: "afternoon_only",
          status: "PENDING",
          notes: `${attendance.notes || ""} Checked in for afternoon session only at ${finalCheckInTime.toLocaleTimeString()}.`,
        };

        await attendance.update(attendanceData);
        await attendance.reload();

        return res.status(200).json({
          success: true,
          message: `✅ Afternoon check-in recorded at ${finalCheckInTime.toLocaleTimeString()}. You are marked as absent for morning session.`,
          data: {
            attendance,
            sessionType: "afternoon_only",
            morningStatus: "absent",
            afternoonStatus: "present",
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          error: `❌ You are marked as absent for morning session. Please check in after ${lunchEndTime} for afternoon session.`,
        });
      }
    }
    
    // =============================================
    // 8. CHECK IF EMPLOYEE IS MARKED AS LEAVE OR SICK
    // =============================================
    if (attendance) {
      if (attendance.status === "ON_LEAVE") {
        return res.status(403).json({
          success: false,
          error: "❌ Cannot check in. Employee is marked as ON LEAVE for today.",
        });
      }

      if (attendance.status === "SICK") {
        return res.status(403).json({
          success: false,
          error: "❌ Cannot check in. Employee is marked as SICK for today.",
        });
      }

      if (
        attendance.morningStatus === "leave" ||
        attendance.morningStatus === "sick" ||
        attendance.morningStatus === "absent"
      ) {
        return res.status(403).json({
          success: false,
          error: `❌ Cannot check in. Employee is marked as ${attendance.morningStatus} for morning session.`,
        });
      }
    }

    // =============================================
    // 9. SHIFT-BASED CHECK-IN VALIDATIONS
    // =============================================

// =============================================
// SHIFT-BASED CHECK-IN VALIDATIONS (CLEAN)
// =============================================

// Parse shift times
const [checkInHour, checkInMinute] = effectiveCheckInTime.split(":").map(Number);
const [checkOutHour, checkOutMinute] = effectiveCheckOutTime.split(":").map(Number);

// Convert to minutes
let checkInMinutes = checkInHour * 60 + checkInMinute;
let checkOutMinutes = checkOutHour * 60 + checkOutMinute;

// Handle overnight shift (e.g. 18:00 → 06:00)
if (checkOutMinutes <= checkInMinutes) {
  checkOutMinutes += 1440;
}

// Current time
let currentMinutes = now.getHours() * 60 + now.getMinutes();

// Adjust current time if after midnight (for overnight continuity)
if (currentMinutes < checkInMinutes) {
  currentMinutes += 1440;
}

// ✅ Allow 1 hour early check-in
const earliestCheckInMinutes = checkInMinutes - 60;

// =============================================
// VALIDATIONS
// =============================================

if (!isSpecialDay) {
  // ✅ Ensure previous night shift is closed
  if (shiftType === "night") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const previousAttendance = await AttendanceLog.findOne({
      where: {
        employeeId: numericEmployeeId,
        attendanceDate: yesterdayStr,
      },
    });

    if (previousAttendance && !previousAttendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        error: "❌ You have not checked out from your previous night shift.",
      });
    }
  }

  // ❌ Too early
  if (currentMinutes < earliestCheckInMinutes) {
    const hours = Math.floor(earliestCheckInMinutes / 60);
    const minutes = earliestCheckInMinutes % 60;

    return res.status(400).json({
      success: false,
      error: `❌ Too early to check in. Allowed from ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}.`,
    });
  }

 // ❌ Too late (after shift end)
if (currentMinutes > checkOutMinutes) {
  let errorMessage = "";
  
  if (shiftType === "night") {
    // Night shift trying to check in during day shift hours
    // Get day shift times from database for comparison
    const dayShiftDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: "day", isActive: true },
    });
    
    if (dayShiftDefault) {
      const [dayStartHour] = dayShiftDefault.checkInTime.split(":").map(Number);
      const [dayEndHour] = dayShiftDefault.checkOutTime.split(":").map(Number);
      
      errorMessage = `❌ You are a night shift employee. Your shift hours are from ${effectiveCheckInTime} to ${effectiveCheckOutTime}. You cannot check in during day shift hours (${String(dayStartHour).padStart(2, "0")}:00 to ${String(dayEndHour).padStart(2, "0")}:00).`;
    } else {
      errorMessage = `❌ Too late to check in. Night shift ended at ${effectiveCheckOutTime}.`;
    }
  } else if (shiftType === "day") {
    // Day shift trying to check in during night shift hours
    const nightShiftDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: "night", isActive: true },
    });
    
    if (nightShiftDefault) {
      const [nightStartHour] = nightShiftDefault.checkInTime.split(":").map(Number);
      const [nightEndHour] = nightShiftDefault.checkOutTime.split(":").map(Number);
      
      errorMessage = `❌ You are a day shift employee. Your shift hours are from ${effectiveCheckInTime} to ${effectiveCheckOutTime}. You cannot check in during night shift hours (${String(nightStartHour).padStart(2, "0")}:00 to ${String(nightEndHour).padStart(2, "0")}:00).`;
    } else {
      errorMessage = `❌ Too late to check in. Day shift ended at ${effectiveCheckOutTime}.`;
    }
  }
  
  return res.status(400).json({
    success: false,
    error: errorMessage,
  });
}
}

    // =============================================
    // 10. CHECK LUNCH BREAK VALIDATION
    // =============================================
    if (!isSpecialDay && currentTimeMinutes > lunchStartMinutes && currentTimeMinutes < lunchEndMinutes) {
      return res.status(400).json({
        success: false,
        error: `❌ Cannot check in during lunch break (${lunchStartTime} - ${lunchEndTime}). Please check in after ${lunchEndTime}.`,
      });
    }

    // =============================================
    // 11. CALCULATE LATE MINUTES
    // =============================================
    const scheduledCheckIn = new Date(now);
    scheduledCheckIn.setHours(parseInt(checkInHour), parseInt(checkInMinute), 0);

    let isLate = false;
    let lateMinutes = 0;
    const lateThresholdMinutes = companyDefault.lateThresholdMinutes || 5;
    
    if (!isSpecialDay && finalCheckInTime > scheduledCheckIn && !lateNightAdjustment) {
      const diffMinutes = Math.floor((finalCheckInTime - scheduledCheckIn) / (1000 * 60));
      if (diffMinutes > lateThresholdMinutes) {
        isLate = true;
        lateMinutes = diffMinutes;
      }
    }

    // =============================================
    // 11.5 CHECK IF REGULAR EMPLOYEE IS BEYOND ABSENT THRESHOLD
    // ✅ FIX 2: REMOVED duplicate currentTimeMinutes declaration
    // =============================================
    const absentAfterMinutes = companyDefault.absentAfterMinutes || 30;

    if (!isSpecialDay && !attendance && !lateNightAdjustment && isLate) {
      const scheduledCheckInMinutes = parseInt(effectiveCheckInTime.split(":")[0]) * 60 + parseInt(effectiveCheckInTime.split(":")[1]);
      const minutesLate = currentTimeMinutes - scheduledCheckInMinutes;

      if (minutesLate > absentAfterMinutes) {
        // ✅ FIX 5: CREATE A BLOCKED RECORD FOR AUDIT TRAIL
        const blockedRecord = await AttendanceLog.create({
          employeeId: numericEmployeeId,
          attendanceDate: today,
          shiftType: shiftType,
          isLate: true,
          lateMinutes: minutesLate,
          morningStatus: "blocked",
          sessionType: "blocked",
          status: "BLOCKED",
          notes: `🚨 Exceeded absent threshold: ${minutesLate} minutes late. Blocked from checking in.`,
          isAbsent: false,
          payableHours: 0,
        });

        console.log(`🚨 Employee ${numericEmployeeId} (${employee.firstName} ${employee.lastName}) attempted to check in ${minutesLate} minutes late. BLOCKED - exceeds ${absentAfterMinutes} min threshold. Record ID: ${blockedRecord.id}`);
        
        return res.status(403).json({
          success: false,
          error: `❌ You are ${minutesLate} minutes late, which exceeds the ${absentAfterMinutes}-minute absent threshold. You cannot check in. Please contact the attendance person for assistance.`,
          requiresDecision: true,
          minutesLate: minutesLate,
          blockedRecordId: blockedRecord.id
        });
      }
    }

    // =============================================
    // 12. DETERMINE MORNING/AFTERNOON STATUS
    // =============================================
    let morningStatus = "absent";
    let afternoonStatus = "absent";
    let sessionType = "absent";

    if (currentTimeMinutes <= lunchStartMinutes) {
      if (attendance && attendance.morningStatus === "pending_late") {
        morningStatus = isLate ? "late" : "present";
      } else {
        morningStatus = isLate ? "late" : "present";
      }
      afternoonStatus = "pending";
      sessionType = "pending";
    } else if (currentTimeMinutes >= lunchEndMinutes) {
      morningStatus = "absent";
      afternoonStatus = "present";
      sessionType = "afternoon_only";
    }

    let finalStatus = "PENDING";
    if (attendance && attendance.status === "PENDING_LATE") {
      if (attendance.checkInTime || finalCheckInTime) {
        finalStatus = isLate ? "LATE" : "PRESENT";
      } else {
        finalStatus = "PENDING_LATE";
      }
    }

    // =============================================
    // 13. RECORD ATTENDANCE
    // =============================================
    let checkInNote = attendance?.notes || null;

    if (adjustedCheckInNote) {
      checkInNote = adjustedCheckInNote;
    } else if (isOnFieldWork) {
      checkInNote = "Field work day";
    } else if (isSpecialDay) {
      if (isHolidayToday) {
        const holidayName = holiday?.name || "Holiday";
        checkInNote = `Today is ${holidayName} check-in (${overtimeRateApplied}x overtime rate)`;
      } else if (dayType === "weekend") {
        checkInNote = `Weekend check-in (${overtimeRateApplied}x overtime rate)`;
      }
    }

    const attendanceData = {
      checkInTime: finalCheckInTime,
      isLate,
      lateMinutes,
      isFieldWork: !!isOnFieldWork,
      isHoliday: isHolidayToday,
      isWorkingDay: isWorkingDay,
      dayType: dayType,
      overtimeRateApplied: overtimeRateApplied,
      morningStatus: morningStatus,
      afternoonStatus: afternoonStatus,
      sessionType: sessionType,
      status: finalStatus,
      notes: checkInNote,
    };

    if (attendance) {
      await attendance.update(attendanceData);
      await attendance.reload();
    } else {
      attendance = await AttendanceLog.create({
        employeeId: numericEmployeeId,
        attendanceDate: today,
        shiftType: shiftType,
        isAbsent: false,
        payableHours: 0,
        ...attendanceData,
      });
    }

    // Clear allowUntilTime after successful check-in
    const newStatus = attendanceData.status || attendance.status;
    if (newStatus === "LATE" || newStatus === "PRESENT" || newStatus === "FULL_DAY") {
      await attendance.update({
        allowUntilTime: null
      });
    }

    // =============================================
    // 14. RESPONSE
    // =============================================
    let message = `✅ Check-in recorded at ${finalCheckInTime.toLocaleTimeString()}`;

    if (lateNightAdjustment) {
      message = `✅ Check-in recorded with late night adjustment.`;
    } else if (isSpecialDay) {
      message = `✅ ${dayType.toUpperCase()} check-in recorded (${overtimeRateApplied}x overtime rate)`;
    } else if (isLate) {
      message = `⚠️ Check-in recorded. ${lateMinutes} minutes late. Expected: ${effectiveCheckInTime}`;
    }

    if (isOnFieldWork) message += ` (Field work)`;
    if (sessionType === "afternoon_only") message += ` (Afternoon session only)`;

    res.status(200).json({
      success: true,
      message,
      data: {
        attendance,
        isLate,
        lateMinutes,
        effectiveCheckInTime,
        effectiveCheckOutTime,
        shiftType,
        isFieldWork: !!isOnFieldWork,
        dayType,
        overtimeRateApplied,
        isSpecialDay,
        morningStatus,
        afternoonStatus,
        sessionType,
      },
    });
  } catch (error) {
    console.error("Record check-in error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.recordCheckOut = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const numericEmployeeId = parseInt(employeeId);
    if (isNaN(numericEmployeeId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID.",
      });
    }

    const { checkOutTime } = req.body;
    const checkOutDateTime = checkOutTime ? new Date(checkOutTime) : new Date();

    // =============================================
    // 1. CHECK EMPLOYEE
    // =============================================
    const employee = await Employee.findByPk(numericEmployeeId);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found." });
    }

    if (employee.employmentStatus !== "active") {
      return res.status(403).json({
        success: false,
        error: `Cannot check out. Status: ${employee.employmentStatus}`,
      });
    }

    // =============================================
    // 2. FIND ATTENDANCE RECORD (WORKS FOR NIGHT SHIFT)
    // =============================================
    const todayStr = checkOutDateTime.toISOString().split("T")[0];
    
    let attendance = await AttendanceLog.findOne({
      where: {
        employeeId: numericEmployeeId,
        attendanceDate: todayStr,
      },
    });

    // ✅ Fix #1: Fallback for night shift (check-in was yesterday)
    if (!attendance) {
      const yesterday = new Date(checkOutDateTime);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      attendance = await AttendanceLog.findOne({
        where: {
          employeeId: numericEmployeeId,
          attendanceDate: yesterdayStr,
        },
      });
    }

    if (!attendance) {
      return res.status(400).json({
        success: false,
        error: "No check-in record found. Please check in first.",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        error: "Already checked out today.",
      });
    }

    if (!attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        error: "No check-in recorded. Cannot check out.",
      });
    }

    // =============================================
    // 3. GET DAY TYPE FROM CHECK-IN RECORD
    // =============================================
    const dayType = attendance.dayType || "normal";
    const isHoliday = attendance.isHoliday;
    const isWorkingDay = attendance.isWorkingDay;
    const checkInOvertimeRate = attendance.overtimeRateApplied || 1.0;

    // =============================================
    // 4. GET SCHEDULE & COMPANY DEFAULTS
    // ✅ Fix #7: Use checkOutDateTime, not new Date()
    // =============================================
    const effectiveSchedule = await attendanceService.getEffectiveSchedule(
      numericEmployeeId,
      checkOutDateTime,
    );
    const shiftType = effectiveSchedule.shiftType;
    const effectiveCheckOutTime = effectiveSchedule.checkOutTime;
    const effectiveCheckInTime = effectiveSchedule.checkInTime;

    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: shiftType,
        isActive: true,
      },
      order: [["effectiveFrom", "DESC"]],
    });

    if (!companyDefault) {
      return res.status(500).json({
        success: false,
        error: `Company defaults not found for ${shiftType} shift.`,
      });
    }

    // =============================================
    // 5. CALCULATE TOTAL HOURS (WITH SAFETY)
    // ✅ Fix #6: Handle negative minutes
    // =============================================
    const checkInTime = new Date(attendance.checkInTime);
    let totalMinutes = (checkOutDateTime - checkInTime) / (1000 * 60);
    
    if (totalMinutes < 0) {
      totalMinutes += 1440;
    }
    
    const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

    // =============================================
    // 6. DETERMINE FINAL OVERTIME RATE
    // =============================================
    let finalOvertimeRate = checkInOvertimeRate;
    let overtimeMinutes = 0;

    if (dayType === "holiday" || dayType === "weekend" || !isWorkingDay) {
      finalOvertimeRate = checkInOvertimeRate;
      overtimeMinutes = 0;
    } else {
      const overtime = await attendanceService.calculateOvertime(
        numericEmployeeId,
        checkOutDateTime,
      );
      overtimeMinutes = overtime.overtimeMinutes;
      if (overtime.rate > 1) {
        finalOvertimeRate = overtime.rate;
      }
    }

    // =============================================
    // 7. VALIDATE CHECK-OUT TIME (NO EARLY CHECK-OUT)
    // ✅ Fix #2 & #3: Consistent overnight adjustment
    // =============================================
    const currentHour = checkOutDateTime.getHours();
    const currentMinutes = checkOutDateTime.getMinutes();
    const actualCheckOutMinutes = currentHour * 60 + currentMinutes;

    const [checkOutHour, checkOutMinute] = effectiveCheckOutTime.split(":").map(Number);
    let scheduledCheckOutMinutes = checkOutHour * 60 + checkOutMinute;
    
    const [checkInHour, checkInMinute] = effectiveCheckInTime.split(":").map(Number);
    let scheduledCheckInMinutes = checkInHour * 60 + checkInMinute;

    // ✅ Consistent adjustment - same as check-in logic
    let adjustedActualMinutes = actualCheckOutMinutes;
    let adjustedScheduledMinutes = scheduledCheckOutMinutes;

    // Add 24 hours for overnight shift
    if (adjustedScheduledMinutes <= scheduledCheckInMinutes) {
      adjustedScheduledMinutes += 1440;
    }

    // Adjust actual time relative to shift start
    if (adjustedActualMinutes < scheduledCheckInMinutes) {
      adjustedActualMinutes += 1440;
    }

    // Only block if checking out EARLY
    if (adjustedActualMinutes < adjustedScheduledMinutes) {
      const earlyMinutes = adjustedScheduledMinutes - adjustedActualMinutes;
      const earlyHours = Math.floor(earlyMinutes / 60);
      const earlyMins = earlyMinutes % 60;
      
      let errorMessage = "";
      const displayHour = Math.floor(adjustedScheduledMinutes / 60) % 24;
      
      if (shiftType === "night") {
        errorMessage = `❌ Cannot check out early. Night shift ends at ${String(displayHour).padStart(2, "0")}:${String(checkOutMinute).padStart(2, "0")}. You are ${earlyHours}h ${earlyMins}m early.`;
      } else {
        errorMessage = `❌ Cannot check out early. Day shift ends at ${effectiveCheckOutTime}. You are ${earlyHours}h ${earlyMins}m early.`;
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    // =============================================
    // 8. VALIDATE CHECK-OUT AFTER CHECK-IN
    // =============================================
    if (checkOutDateTime <= checkInTime) {
      return res.status(400).json({
        success: false,
        error: "Check-out must be after check-in.",
      });
    }

    // =============================================
    // 9. CALCULATE PAYABLE HOURS
    // =============================================
    const totalPayableHours = parseFloat(
      (totalHours * finalOvertimeRate).toFixed(2),
    );

    // =============================================
    // 10. UPDATE ATTENDANCE
    // =============================================
    await attendance.update({
      checkOutTime: checkOutDateTime,
      totalHours: totalHours,
      overtimeMinutes: overtimeMinutes,
      overtimeRateApplied: finalOvertimeRate,
      payableHours: totalPayableHours,
    });

    // =============================================
    // 11. DETERMINE FINAL STATUS
    // ✅ Fix #4 & #5: Correct break times and status
    // =============================================
    let finalStatus = attendance.status;
    let sessionType = attendance.sessionType;
    let morningStatus = attendance.morningStatus;
    let afternoonStatus = attendance.afternoonStatus;

    // ✅ Use database values for break times
    const isNightShift = shiftType === "night";
    const breakStartTime = isNightShift 
      ? companyDefault.dinnerStartTime 
      : companyDefault.lunchStartTime;
    const breakDuration = isNightShift 
      ? companyDefault.dinnerDurationMinutes 
      : companyDefault.lunchDurationMinutes;
    
    let breakEndMinutes = 0;
    if (breakStartTime && breakDuration) {
      const [startHour, startMinute] = breakStartTime.split(":").map(Number);
      let totalBreakMinutes = startHour * 60 + startMinute + breakDuration;
      breakEndMinutes = totalBreakMinutes % (24 * 60);
    } else {
      breakEndMinutes = isNightShift ? 2 * 60 : 13 * 60; // 2 AM or 1 PM defaults
    }

    // ✅ Use adjustedActualMinutes for consistent comparison
    if (adjustedActualMinutes <= breakEndMinutes && morningStatus === "present") {
      sessionType = "morning_only";
      afternoonStatus = "absent";
      finalStatus = "HALF_DAY";
    } else if (afternoonStatus === "present") {
      if (morningStatus === "present" || morningStatus === "late") {
        sessionType = "full_day";
        finalStatus = "FULL_DAY";
      } else {
        sessionType = "afternoon_only";
        finalStatus = "HALF_DAY";
      }
    }

    await attendance.update({
      sessionType: sessionType,
      status: finalStatus,
      morningStatus: morningStatus,
      afternoonStatus: afternoonStatus,
    });

    // =============================================
    // 12. RESPONSE
    // =============================================
    let message = `🏁 Check-out recorded. Hours: ${totalHours}`;

    if (dayType === "holiday" || dayType === "weekend" || !isWorkingDay) {
      message = `🏁 ${dayType.toUpperCase()} check-out recorded. ${totalHours}h at ${finalOvertimeRate}x rate = ${totalPayableHours} payable hours.`;
    } else if (overtimeMinutes > 0) {
      const overtimeHours = (overtimeMinutes / 60).toFixed(1);
      message = `🏁 Check-out recorded. ${totalHours}h (${overtimeHours}h overtime at ${finalOvertimeRate}x).`;
    } else if (finalStatus === "HALF_DAY") {
      message = `🏁 Check-out recorded. ${totalHours}h (HALF DAY)`;
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        attendance,
        totalHours,
        totalPayableHours,
        effectiveCheckOutTime,
        shiftType,
        overtimeMinutes,
        overtimeRate: finalOvertimeRate,
        dayType,
        sessionType,
        finalStatus,
      },
    });
  } catch (error) {
    console.error("Record check-out error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getAllAttendanceByDate = async (req, res) => {
  try {
    const {
      date,
      page = 1,
      limit = 10,
      search = "",
      status = "",
      departmentId = "",
    } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required",
      });
    }

    console.log("Fetching attendance with filters:", {
      date,
      page,
      limit,
      search,
      status,
      departmentId,
    });

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause for attendance
    const whereClause = {
      attendanceDate: {
        [Op.between]: [startOfDay, endOfDay],
      },
    };

    // Status filter
    if (status === "present") {
      whereClause.checkInTime = { [Op.ne]: null };
      whereClause.isLate = false;
    } else if (status === "absent") {
      whereClause.checkInTime = null;
      whereClause.status = { [Op.notIn]: ["PENDING_LATE", "PENDING_ABSENT"] };
    } else if (status === "late") {
      whereClause.isLate = true;
      whereClause.checkInTime = { [Op.ne]: null };
    } else if (status === "ontime") {
      whereClause.checkInTime = { [Op.ne]: null };
      whereClause.isLate = false;
      whereClause.checkOutTime = { [Op.ne]: null };
    } else if (status === "pending_late") {
      whereClause.status = "PENDING_LATE";
    } else if (status === "pending_absent") {
      whereClause.status = "PENDING_ABSENT";
    }

    // Build employee include with search
    const employeeInclude = {
      model: Employee,
      as: "employee",
      required: true,
      attributes: [
        "employeeId",
        "employeeCode",
        "firstName",
        "lastName",
        "departmentId",
        "shiftType",
        "profilePictureUrl",
      ],
    };

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      employeeInclude.where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          Sequelize.where(
            Sequelize.fn(
              "concat",
              Sequelize.col("employee.first_name"),
              " ",
              Sequelize.col("employee.last_name"),
            ),
            { [Op.iLike]: `%${searchTerm}%` },
          ),
        ],
      };
    }

    // Add department filter
    if (departmentId) {
      employeeInclude.where = {
        ...employeeInclude.where,
        departmentId: parseInt(departmentId),
      };
    }

    // Get total count and paginated data
    const { count, rows } = await AttendanceLog.findAndCountAll({
      where: whereClause,
      include: [employeeInclude],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["attendanceDate", "DESC"]],
      distinct: true,
    });

    // Get department names for all unique department IDs
    const departmentIds = [
      ...new Set(rows.map((r) => r.employee?.departmentId).filter(Boolean)),
    ];
    let departmentMap = new Map();

    if (departmentIds.length > 0) {
      const departments = await Department.findAll({
        where: { departmentId: { [Op.in]: departmentIds } },
        attributes: ["departmentId", "name"],
      });
      departmentMap = new Map(departments.map((d) => [d.departmentId, d.name]));
    }

    // Get ALL attendance for summary (without pagination)
    const allAttendance = await AttendanceLog.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: "employee",
          required: true,
          attributes: ["departmentId"],
        },
      ],
      distinct: true,
    });

    // =============================================
    // FIXED SUMMARY CALCULATION
    // PENDING_LATE counts as LATE
    // PENDING_ABSENT counts as ABSENT
    // =============================================
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let sickCount = 0;
    let leaveCount = 0;

    for (const record of allAttendance) {
      // Priority 1: Sick or Leave
      if (record.status === "SICK") {
        sickCount++;
      } else if (record.status === "ON_LEAVE") {
        leaveCount++;
      }
      // Priority 2: PENDING_LATE counts as LATE (approved to come late)
      else if (record.status === "PENDING_LATE") {
        lateCount++;
      }
      // Priority 3: PENDING_ABSENT counts as ABSENT (morning absent)
      else if (record.status === "PENDING_ABSENT") {
        absentCount++;
      }
      // Priority 4: Has check-in time
      else if (record.checkInTime) {
        if (record.isLate) {
          lateCount++;
        } else {
          presentCount++;
        }
      }
      // Priority 5: No check-in time = absent
      else {
        absentCount++;
      }
    }

    const summary = {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      sick: sickCount,
      leave: leaveCount,
      total: allAttendance.length,
    };

    console.log("Summary calculated:", summary);

    const formattedAttendance = rows.map((record) => {
      const employee = record.employee;
      const shiftType = record.shiftType || employee?.shiftType || "day";

      // ✅ CORRECTLY MAP STATUS BASED ON DATABASE STATUS FIELD
      let displayStatus = "active";
      let statusText = "Active";

      if (record.status === "SICK") {
        displayStatus = "sick";
        statusText = "Sick";
      } else if (record.status === "ON_LEAVE") {
        displayStatus = "leave";
        statusText = "On Leave";
      } else if (record.status === "PENDING_LATE") {
        displayStatus = "pending_late";
        statusText = "Pending Late";
      } else if (record.status === "PENDING_ABSENT") {
        displayStatus = "pending_absent";
        statusText = "Pending Absent";
      } else if (!record.checkInTime) {
        displayStatus = "absent";
        statusText = "Absent";
      } else if (record.isLate) {
        displayStatus = "late";
        statusText = "Late";
      } else if (record.checkOutTime && !record.isLate) {
        displayStatus = "ontime";
        statusText = "On Time";
      }

      return {
        id: record.id,
        employeeId: record.employeeId,
        employeeCode: employee?.employeeCode || "N/A",
        employeeName: employee
          ? `${employee.firstName} ${employee.lastName}`.trim()
          : "Unknown",
        employeeFirstName: employee?.firstName || "",
        employeeLastName: employee?.lastName || "",
        departmentName: departmentMap.get(employee?.departmentId) || "N/A",
        departmentId: employee?.departmentId || null,
        profilePictureUrl: employee?.profilePictureUrl || null,
        shiftType: shiftType,
        isWorkingDay:
          record.isWorkingDay !== undefined ? record.isWorkingDay : true,
        isHoliday: record.isHoliday || false,
        isFieldWork: record.isFieldWork || false,
        isOnLeave: record.isOnLeave || false,
        isHalfDay: record.isHalfDay || false,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        isLate: record.isLate || false,
        lateMinutes: record.lateMinutes || 0,
        totalHours:
          typeof record.totalHours === "number"
            ? record.totalHours.toFixed(2)
            : "0.00",
        payableHours: record.payableHours || 0,
        isAbsent:
          !record.checkInTime &&
          record.status !== "SICK" &&
          record.status !== "ON_LEAVE" &&
          record.status !== "PENDING_LATE",
        status: displayStatus,
        statusText: statusText,
        dayType: record.dayType || "normal",
        overtimeRateApplied: record.overtimeRateApplied || 1.0,
        morningStatus: record.morningStatus || "absent",
        afternoonStatus: record.afternoonStatus || "absent",
        sessionType: record.sessionType || "absent",
        notes: record.notes,
        attendanceStatus: record.status,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedAttendance,
      summary: summary,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      filters: {
        search: search || null,
        status: status || null,
        departmentId: departmentId || null,
      },
    });
  } catch (error) {
    console.error("Get all attendance by date error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.getPendingAbsentees = async (req, res) => {
  try {
    console.log("🔍 getPendingAbsentees called");

    const {
      page = 1,
      limit = 20,
      search = "",
      departmentId = "",
      sortBy = "lateMinutes",
      sortOrder = "ASC",
    } = req.query;

    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().split("T")[0];

    // Build where clause for employees
    const employeeWhere = {
      employmentStatus: "active",
    };

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      employeeWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchTerm}%` } },
        { lastName: { [Op.iLike]: `%${searchTerm}%` } },
        { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
        Sequelize.where(
          Sequelize.fn(
            "concat",
            Sequelize.col("Employee.first_name"),
            " ",
            Sequelize.col("Employee.last_name"),
          ),
          { [Op.iLike]: `%${searchTerm}%` },
        ),
      ];
    }

    // Add department filter
    if (departmentId) {
      employeeWhere.departmentId = parseInt(departmentId);
    }

    // Get all matching employees
    const employees = await Employee.findAll({
      where: employeeWhere,
      attributes: [
        "employeeId",
        "employeeCode",
        "firstName",
        "lastName",
        "departmentId",
        "profilePictureUrl",
      ],
      order: [["firstName", "ASC"]],
    });

    console.log(`Found ${employees.length} employees matching filters`);

    // Get department names
    const departmentIds = [
      ...new Set(employees.map((e) => e.departmentId).filter(Boolean)),
    ];
    let departmentMap = new Map();

    if (departmentIds.length > 0) {
      const departments = await Department.findAll({
        where: { departmentId: { [Op.in]: departmentIds } },
        attributes: ["departmentId", "name"],
      });
      departmentMap = new Map(departments.map((d) => [d.departmentId, d.name]));
    }

    // Calculate pending employees
    const allPendingEmployees = [];

    for (const employee of employees) {
      try {
        // Skip holidays and weekends
        const isWorkingDay = await attendanceService.isWorkingDay(
          employee.employeeId,
          now,
        );
        const isHoliday = await attendanceService.isHoliday(now);

        if (!isWorkingDay || isHoliday) {
          continue;
        }

        const threshold =
          await employeeScheduleService.calculateAbsentThreshold(
            employee.employeeId,
            now,
          );
        const lunchStartTime = await employeeScheduleService.getLunchStartTime(
          employee.employeeId,
          now,
        );
        const lunchStartMinutes =
          employeeScheduleService.timeToMinutes(lunchStartTime);

        if (
          currentTimeMinutes > threshold.minutes &&
          currentTimeMinutes < lunchStartMinutes
        ) {
          // Check attendance record - ONLY include if NOT processed
          const attendance = await AttendanceLog.findOne({
            where: {
              employeeId: employee.employeeId,
              attendanceDate: todayStr,
            },
          });

          // Only include if:
          // 1. No attendance record exists, OR
          // 2. No check-in time AND status is 'PENDING' (not processed)
          const shouldInclude =
            !attendance ||
            (!attendance.checkInTime && attendance.status === "PENDING");

          if (shouldInclude) {
            const expectedMinutes = employeeScheduleService.timeToMinutes(
              threshold.checkInTime,
            );
            const lateMinutes = threshold.minutes - expectedMinutes;

            allPendingEmployees.push({
              employeeId: employee.employeeId,
              employeeCode: employee.employeeCode,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              departmentName: departmentMap.get(employee.departmentId) || "N/A",
              departmentId: employee.departmentId,
              profilePictureUrl: employee.profilePictureUrl || null,
              expectedCheckIn: threshold.checkInTime,
              absentThreshold: threshold.time,
              lateMinutes: lateMinutes,
            });
          }
        }
      } catch (err) {
        console.error(
          `Error processing employee ${employee.employeeCode}:`,
          err.message,
        );
      }
    }

    // Sort
    const sortField =
      sortBy === "employeeName" ? "employeeName" : "lateMinutes";
    const sortDirection = sortOrder === "ASC" ? 1 : -1;

    allPendingEmployees.sort((a, b) => {
      if (sortField === "employeeName") {
        return sortDirection === 1
          ? a.employeeName.localeCompare(b.employeeName)
          : b.employeeName.localeCompare(a.employeeName);
      } else {
        return sortDirection === 1
          ? a.lateMinutes - b.lateMinutes
          : b.lateMinutes - a.lateMinutes;
      }
    });

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedEmployees = allPendingEmployees.slice(
      offset,
      offset + parseInt(limit),
    );

    res.status(200).json({
      success: true,
      data: paginatedEmployees,
      pagination: {
        total: allPendingEmployees.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(allPendingEmployees.length / parseInt(limit)),
      },
      filters: {
        search: search || null,
        departmentId: departmentId || null,
        sortBy: sortBy,
        sortOrder: sortOrder,
      },
      currentTime: now.toLocaleTimeString(),
    });
  } catch (error) {
    console.error("Get pending absentees error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Mass update attendance
exports.massUpdateAttendance = async (req, res) => {
  try {
    const { employeeIds, action, allowUntilTime } = req.body;
    const todayStr = new Date().toISOString().split("T")[0];
    const userId = req.user.userId;

    // Get the user's full name from the User model
    const user = await User.findByPk(userId, {
      attributes: ["fullName", "username"],
    });

    const userFullName = user
      ? user.fullName
      : user?.username || `User ${userId}`;

    if (!employeeIds || !employeeIds.length) {
      return res
        .status(400)
        .json({ success: false, error: "No employees selected" });
    }

    // Helper functions
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(":");
      return parseInt(hours) * 60 + parseInt(minutes);
    };

    const addMinutesToTime = (timeStr, minutes) => {
      const [hours, mins] = timeStr.split(":");
      const totalMinutes = parseInt(hours) * 60 + parseInt(mins) + minutes;
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
    };

    // Get company defaults to calculate working hours
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: "day", isActive: true },
      order: [["effectiveFrom", "DESC"]],
    });

    // Default values
    let standardWorkHours = 8;
    let morningHours = 4;
    let afternoonHours = 4;

    if (companyDefault) {
      const checkInTime = companyDefault.checkInTime || "08:00";
      const checkOutTime = companyDefault.checkOutTime || "17:00";
      const lunchStartTime = companyDefault.lunchStartTime || "12:00";
      const lunchDurationMinutes = companyDefault.lunchDurationMinutes || 60;

      const lunchEndTime = addMinutesToTime(
        lunchStartTime,
        lunchDurationMinutes,
      );

      const checkInMinutes = timeToMinutes(checkInTime);
      const checkOutMinutes = timeToMinutes(checkOutTime);
      const lunchStartMinutes = timeToMinutes(lunchStartTime);
      const lunchEndMinutes = timeToMinutes(lunchEndTime);

      const morningMinutes = lunchStartMinutes - checkInMinutes;
      const afternoonMinutes = checkOutMinutes - lunchEndMinutes;
      const totalMinutes = morningMinutes + afternoonMinutes;

      morningHours = parseFloat((morningMinutes / 60).toFixed(2));
      afternoonHours = parseFloat((afternoonMinutes / 60).toFixed(2));
      standardWorkHours = parseFloat((totalMinutes / 60).toFixed(2));
    }

    const results = [];
    const validActions = [
      "absent",
      "allow_late",
      "leave",
      "sick",
      "remove_absent",
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    for (const employeeId of employeeIds) {
      const employee = await Employee.findByPk(employeeId, {
        attributes: ["firstName", "lastName", "employeeCode"],
      });

      let attendance = await AttendanceLog.findOne({
        where: {
          employeeId: employeeId,
          attendanceDate: todayStr,
        },
      });

      let updateData = {};
      let note = "";
      const timestamp = new Date().toLocaleString();

      switch (action) {
        case "absent":
          updateData = {
            morningStatus: "absent",
            afternoonStatus: "pending",
            sessionType: "pending",
            status: "PENDING_ABSENT",
            isLate: false,
            isAbsent: false,
            isHalfDay: false,
            isOnLeave: false,
            payableHours: 0,
            allowUntilTime: null,
            notes: `${userFullName} marked employee as absent for morning session on ${timestamp}. Employee can work afternoon session.`,
          };
          note = `Marked as absent for morning session`;
          break;

        case "allow_late":
          // Validate deadline time
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentInMinutes = currentHour * 60 + currentMinute;

          let isValidDeadline = true;
          let deadlineInMinutes = null;

          if (
            allowUntilTime &&
            allowUntilTime !== "null" &&
            allowUntilTime !== "undefined"
          ) {
            const [deadlineHour, deadlineMinute] = allowUntilTime.split(":");
            deadlineInMinutes =
              parseInt(deadlineHour) * 60 + parseInt(deadlineMinute);

            // Check if deadline is already passed
            if (currentInMinutes > deadlineInMinutes) {
              isValidDeadline = false;

              // Mark as ABSENT instead since deadline passed
              updateData = {
                morningStatus: "absent",
                afternoonStatus: "pending",
                sessionType: "pending",
                status: "PENDING_ABSENT",
                isLate: false,
                isAbsent: false,
                isHalfDay: false,
                isOnLeave: false,
                payableHours: 0,
                allowUntilTime: null,
                notes: `${userFullName} attempted to approve late arrival until ${allowUntilTime} on ${timestamp}, but deadline has already passed. Employee marked as absent for morning session.`,
              };
              note = `Late approval failed - deadline already passed`;
              break;
            }
          }

          // If deadline is valid, proceed with normal allow_late logic
          if (isValidDeadline) {
            const lateUntilText = allowUntilTime
              ? `until ${allowUntilTime}`
              : "until end of morning session";

            // Format time for PostgreSQL (HH:MM:SS)
            let formattedAllowUntilTime = null;
            if (allowUntilTime) {
              if (allowUntilTime.split(":").length === 2) {
                formattedAllowUntilTime = `${allowUntilTime}:00`;
              } else {
                formattedAllowUntilTime = allowUntilTime;
              }
            }

            updateData = {
              morningStatus: "pending_late",
              afternoonStatus: "pending",
              sessionType: "pending",
              status: "PENDING_LATE",
              isLate: true,
              isAbsent: false,
              isHalfDay: false,
              isOnLeave: false,
              payableHours: 0,
              allowUntilTime: formattedAllowUntilTime,
              notes: `${userFullName} approved late arrival ${lateUntilText} on ${timestamp}. Employee must check in by ${allowUntilTime || "end of morning session"}. Late penalty will apply.`,
            };
            note = `Approved late arrival ${lateUntilText}`;
          }
          break;

        case "leave":
          updateData = {
            morningStatus: "absent",
            afternoonStatus: "absent",
            sessionType: "absent",
            status: "ON_LEAVE",
            isLate: false,
            isOnLeave: true,
            isAbsent: false,
            isHalfDay: false,
            payableHours: 0,
            allowUntilTime: null,
            notes: `${userFullName} marked employee as ON LEAVE on ${timestamp}.`,
          };
          note = `Marked as on leave`;
          break;

        case "sick":
          updateData = {
            morningStatus: "absent",
            afternoonStatus: "absent",
            sessionType: "absent",
            status: "SICK",
            isLate: false,
            isOnLeave: false,
            isAbsent: false,
            isHalfDay: false,
            payableHours: 0,
            allowUntilTime: null,
            notes: `${userFullName} marked employee as SICK on ${timestamp}.`,
          };
          note = `Marked as sick`;
          break;

        case "remove_absent":
          updateData = {
            morningStatus: "pending",
            afternoonStatus: "pending",
            sessionType: "pending",
            status: "PENDING",
            isLate: false,
            isAbsent: false,
            isHalfDay: false,
            isOnLeave: false,
            payableHours: 0,
            allowUntilTime: null,
            notes: `${userFullName} reset attendance status from ${attendance?.status || "pending"} to pending on ${timestamp}.`,
          };
          note = `Reset attendance status`;
          break;
      }

      if (!attendance) {
        attendance = await AttendanceLog.create({
          employeeId: employeeId,
          attendanceDate: todayStr,
          shiftType: "day",
          ...updateData,
        });
      } else {
        // Preserve check-in time if it exists and we're not removing absent
        if (attendance.checkInTime && action !== "remove_absent") {
          delete updateData.checkInTime;
        }
        await attendance.update(updateData);
      }

      results.push({
        employeeId: employeeId,
        employeeName: employee
          ? `${employee.firstName} ${employee.lastName}`
          : `ID: ${employeeId}`,
        employeeCode: employee?.employeeCode,
        success: true,
        action: action,
        note: note,
        allowUntilTime: updateData.allowUntilTime || null,
        updatedBy: userFullName,
        timestamp: timestamp,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${results.length} employee(s)`,
      data: results,
      updatedBy: userFullName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Mass update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExpiredPendingLate = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Get current time in HH:MM:SS format for proper comparison
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentSecond = now.getSeconds().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}:${currentSecond}`;

    console.log("Fetching expired pending late for:", todayStr);
    console.log("Current time:", currentTime);

    // Find all PENDING_LATE records where deadline has passed but no check-in
    const expiredRecords = await AttendanceLog.findAll({
      where: {
        attendanceDate: todayStr,
        status: "PENDING_LATE",
        checkInTime: null,
        allowUntilTime: {
          [Op.ne]: null,
          [Op.lt]: currentTime, // This compares time strings
        },
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "employee_id",
            "firstName",
            "lastName",
            "employeeCode",
            "profilePictureUrl",
          ],
        },
      ],
      order: [["allowUntilTime", "ASC"]],
    });

    console.log(`Found ${expiredRecords.length} expired records`);

    // Format the response
    const formattedRecords = expiredRecords.map((record) => ({
      id: record.id,
      employeeId: record.employeeId,
      allowUntilTime: record.allowUntilTime,
      status: record.status,
      notes: record.notes,
      checkInTime: record.checkInTime,
      employee: record.employee
        ? {
            id: record.employee.id,
            firstName: record.employee.firstName,
            lastName: record.employee.lastName,
            employeeCode: record.employee.employeeCode,
            profilePictureUrl: record.employee.profilePictureUrl,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedRecords,
      count: formattedRecords.length,
    });
  } catch (error) {
    console.error("Error fetching expired pending late:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.markExpiredAsAbsent = async (req, res) => {
  try {
    const { recordIds } = req.body;
    const userId = req.user.userId;

    if (!recordIds || !recordIds.length) {
      return res.status(400).json({
        success: false,
        error: "No record IDs provided",
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ["fullName"],
    });

    const userFullName = user ? user.fullName : `User ${userId}`;
    const timestamp = new Date().toLocaleString();

    // Get all records first to append notes
    const records = await AttendanceLog.findAll({
      where: {
        id: recordIds,
        status: "PENDING_LATE",
        checkInTime: null,
      },
    });

    let updatedCount = 0;
    for (const record of records) {
      const existingNotes = record.notes || "";
      const newNotes = `${existingNotes} ${userFullName} marked as absent for morning (expired late approval) on ${timestamp}. Employee can still work afternoon session.`;

      await record.update({
        status: "PENDING_ABSENT", // Change to PENDING_ABSENT (morning absent, afternoon pending)
        morningStatus: "absent", // Morning is absent
        // afternoonStatus: 'pending' - KEEP AS IS (don't change)
        // sessionType: 'pending' - KEEP AS IS
        isAbsent: false, // Not fully absent because they can work afternoon
        isLate: false,
        allowUntilTime: null,
        notes: newNotes.trim(),
      });
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully marked ${updatedCount} employee(s) as absent for morning session`,
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error("Error marking expired as absent:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.revertAttendanceUpdate = async (req, res) => {
  try {
    const { employeeIds, action } = req.body;
    const todayStr = new Date().toISOString().split("T")[0];
    const userId = req.user.userId;

    if (!employeeIds || !employeeIds.length) {
      return res
        .status(400)
        .json({ success: false, error: "No employees selected" });
    }

    const results = [];

    for (const employeeId of employeeIds) {
      let attendance = await AttendanceLog.findOne({
        where: {
          employeeId: employeeId,
          attendanceDate: todayStr,
        },
      });

      if (!attendance) {
        results.push({
          employeeId: employeeId,
          success: false,
          error: "No attendance record found",
        });
        continue;
      }

      let updateData = {};
      let note = "";

      // REVERSE each action (undo what massUpdateAttendance did)
      switch (action) {
        case "absent":
          // Reverse ABSENT: Reset to pending state
          updateData = {
            morningStatus: "pending",
            afternoonStatus: "pending",
            sessionType: "pending",
            status: "PENDING",
            isAbsent: false,
            isHalfDay: false,
            payableHours: 0,
            notes: `[REVERT] Undid ABSENT marking by user ${userId} on ${new Date().toLocaleString()}. Original: ${attendance.notes}`,
          };
          note = "Reverted absent marking (back to pending)";
          break;

        case "allow_late":
          // Reverse ALLOW LATE: Reset to pending
          updateData = {
            morningStatus: "pending",
            sessionType: "pending",
            status: "PENDING",
            isAbsent: false,
            payableHours: 0,
            notes: `[REVERT] Undid ALLOW LATE marking by user ${userId} on ${new Date().toLocaleString()}`,
          };
          note = "Reverted allow late approval (back to pending)";
          break;

        case "leave":
          // Reverse LEAVE: Reset to pending
          updateData = {
            morningStatus: "pending",
            afternoonStatus: "pending",
            sessionType: "pending",
            status: "PENDING",
            isOnLeave: false,
            isAbsent: false,
            payableHours: 0,
            notes: `[REVERT] Undid LEAVE marking by user ${userId} on ${new Date().toLocaleString()}`,
          };
          note = "Reverted leave marking (back to pending)";
          break;

        case "sick":
          // Reverse SICK: Reset to pending
          updateData = {
            morningStatus: "pending",
            afternoonStatus: "pending",
            sessionType: "pending",
            status: "PENDING",
            isAbsent: false,
            payableHours: 0,
            notes: `[REVERT] Undid SICK marking by user ${userId} on ${new Date().toLocaleString()}`,
          };
          note = "Reverted sick marking (back to pending)";
          break;

        default:
          results.push({
            employeeId: employeeId,
            success: false,
            error: "Unknown action to revert",
          });
          continue;
      }

      await attendance.update(updateData);

      results.push({
        employeeId: employeeId,
        success: true,
        action: action,
        note: note,
      });
    }

    res.status(200).json({
      success: true,
      message: `${results.filter((r) => r.success).length} employees reverted successfully`,
      data: results,
    });
  } catch (error) {
    console.error("Revert update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//------------------------------------------------------------------------------------------------------
//---------------------------------unused---------------------------------------------------------------
//------------------------------------------------------------------------------------------------------
exports.getTodayAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await AttendanceLog.findOne({
      where: {
        employeeId,
        attendanceDate: today,
      },
    });

    res.status(200).json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    console.error("Get today attendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ✅ Validate employeeId is a number
    const numericEmployeeId = parseInt(employeeId);
    if (isNaN(numericEmployeeId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID. Must be a number.",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const attendance = await AttendanceLog.findOne({
      where: {
        employeeId: numericEmployeeId,
        attendanceDate: today,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        isCheckedIn: !!attendance?.checkInTime,
        isCheckedOut: !!attendance?.checkOutTime,
        checkInTime: attendance?.checkInTime,
        checkOutTime: attendance?.checkOutTime,
        isLate: attendance?.isLate || false,
        lateMinutes: attendance?.lateMinutes || 0,
        totalHours: attendance?.totalHours || 0,
        overtimeMinutes: attendance?.overtimeMinutes || 0,
        isFieldWork: attendance?.isFieldWork || false,
        isHoliday: attendance?.isHoliday || false,
      },
    });
  } catch (error) {
    console.error("Get today status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    let { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    // ✅ Handle "null" string or undefined employeeId
    let numericEmployeeId = null;
    if (employeeId && employeeId !== "null" && employeeId !== "undefined") {
      numericEmployeeId = parseInt(employeeId);
      if (isNaN(numericEmployeeId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid employee ID. Must be a number.",
        });
      }
    }

    // For admin/attendance person, allow viewing all employees
    if (
      numericEmployeeId &&
      req.user.role !== "admin" &&
      req.user.role !== "attendance" &&
      req.user.userId != numericEmployeeId
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own reports.",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Start date and end date are required",
      });
    }

    // Parse dates properly
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // If no employeeId or it's null, get all employees (for admin/attendance person)
    let attendance = [];

    if (!numericEmployeeId) {
      // Get all employees' attendance
      const allAttendance = await AttendanceLog.findAll({
        where: {
          attendanceDate: {
            [Op.between]: [startDateTime, endDateTime],
          },
        },
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "employeeId",
              "firstName",
              "lastName",
              "departmentId",
            ],
          },
        ],
        order: [["attendanceDate", "ASC"]],
      });

      // Format the attendance data for frontend
      attendance = allAttendance.map((record) => ({
        id: record.id,
        employeeId: record.employeeId,
        employeeCode: record.employee?.employeeId || "N/A",
        employeeName: record.employee
          ? `${record.employee.firstName} ${record.employee.lastName}`
          : "Unknown",
        departmentName: record.employee?.departmentId
          ? `Department ${record.employee.departmentId}`
          : "N/A",
        attendanceDate: record.attendanceDate,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        isLate: record.isLate || false,
        lateMinutes: record.lateMinutes || 0,
        isAbsent: record.isAbsent || false,
        totalHours: record.totalHours || 0,
        overtimeMinutes: record.overtimeMinutes || 0,
      }));
    } else {
      // Get single employee's attendance
      const employeeAttendance = await attendanceService.getAttendanceReport(
        numericEmployeeId,
        startDateTime,
        endDateTime,
      );

      // Format single employee data
      attendance = employeeAttendance.map((record) => ({
        id: record.id,
        employeeId: record.employeeId,
        employeeCode: record.employeeCode || "N/A",
        employeeName: record.employeeName || "Unknown",
        departmentName: record.departmentName || "N/A",
        attendanceDate: record.attendanceDate,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        isLate: record.isLate || false,
        lateMinutes: record.lateMinutes || 0,
        isAbsent: record.isAbsent || false,
        totalHours: record.totalHours || 0,
        overtimeMinutes: record.overtimeMinutes || 0,
      }));
    }

    // Calculate pagination
    const queryLimit = Math.min(parseInt(limit) || 50, 200);
    const offset = (parseInt(page) - 1) * queryLimit;
    const paginatedAttendance = attendance.slice(offset, offset + queryLimit);

    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter((a) => !a.isAbsent && a.checkInTime)
        .length,
      absentDays: attendance.filter((a) => a.isAbsent).length,
      lateDays: attendance.filter((a) => a.isLate).length,
      totalLateMinutes: attendance.reduce(
        (sum, a) => sum + (a.lateMinutes || 0),
        0,
      ),
      totalOvertimeMinutes: attendance.reduce(
        (sum, a) => sum + (a.overtimeMinutes || 0),
        0,
      ),
      totalHours: attendance
        .reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0)
        .toFixed(2),
    };

    res.status(200).json({
      success: true,
      data: paginatedAttendance,
      summary,
      pagination: {
        total: attendance.length,
        page: parseInt(page),
        limit: queryLimit,
        totalPages: Math.ceil(attendance.length / queryLimit),
      },
    });
  } catch (error) {
    console.error("Get attendance report error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const employee = await Employee.findOne({
      where: { userId: req.user.userId },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found for this user" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Start date and end date are required",
      });
    }

    const attendance = await attendanceService.getAttendanceReport(
      employee.employeeId,
      new Date(startDate),
      new Date(endDate),
    );

    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter((a) => !a.isAbsent).length,
      absentDays: attendance.filter((a) => a.isAbsent).length,
      lateDays: attendance.filter((a) => a.isLate).length,
      totalLateMinutes: attendance.reduce(
        (sum, a) => sum + (a.lateMinutes || 0),
        0,
      ),
      totalOvertimeMinutes: attendance.reduce(
        (sum, a) => sum + (a.overtimeMinutes || 0),
        0,
      ),
      totalHours: attendance
        .reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0)
        .toFixed(2),
    };

    res.status(200).json({
      success: true,
      data: attendance,
      summary,
      count: attendance.length,
    });
  } catch (error) {
    console.error("Get my attendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;

    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const attendance = await attendanceService.getAttendanceReport(
      employeeId,
      startDate,
      endDate,
    );

    const summary = {
      year: targetYear,
      month: targetMonth,
      totalDays: attendance.length,
      presentDays: attendance.filter((a) => !a.isAbsent && a.checkInTime)
        .length,
      absentDays: attendance.filter((a) => a.isAbsent).length,
      lateDays: attendance.filter((a) => a.isLate).length,
      totalLateMinutes: attendance.reduce(
        (sum, a) => sum + (a.lateMinutes || 0),
        0,
      ),
      totalOvertimeMinutes: attendance.reduce(
        (sum, a) => sum + (a.overtimeMinutes || 0),
        0,
      ),
      totalHours: attendance
        .reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0)
        .toFixed(2),
    };

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
