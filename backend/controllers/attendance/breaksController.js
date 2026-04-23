// controllers/attendance/breaksController.js
const { Op } = require("sequelize");
const {
  Employee,
  Department,
  CompanyShiftDefault,
  DepartmentOverride,
  EmployeeOverride,
  AttendanceLog,
  BreakTicket,
} = require("../../models");
const attendanceService = require("../../service/attendanceConfig.service");

exports.issueBreakTicket = async (req, res) => {
  try {
    const { employeeId, breakType, reason } = req.body;

    console.log(
      `🔍 Issuing break ticket for employee ${employeeId}, type: ${breakType}`,
    );

    if (req.user.role !== "admin" && req.user.userId != employeeId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only issue tickets for yourself.",
      });
    }

    if (!employeeId || !breakType) {
      return res.status(400).json({
        success: false,
        error: "Employee ID and break type are required",
      });
    }

    if (!["lunch", "dinner"].includes(breakType)) {
      return res.status(400).json({
        success: false,
        error: 'Break type must be "lunch" or "dinner"',
      });
    }

    // ✅ CHECK IF EMPLOYEE HAS CHECKED IN TODAY
    const today = new Date().toISOString().split("T")[0];
    const attendance = await AttendanceLog.findOne({
      where: {
        employeeId: employeeId,
        attendanceDate: today,
      },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot take break. You have not checked in today. Please check in first.",
      });
    }

    if (!attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot take break. You have not checked in yet. Please check in first.",
      });
    }

    // Get lunch end time from company defaults
    const companyDefault = await CompanyShiftDefault.findOne({
      where: {
        shiftType: attendance.shiftType || "day",
        isActive: true,
      },
      order: [["effectiveFrom", "DESC"]],
    });

    if (companyDefault) {
      const lunchStartTime = companyDefault.lunchStartTime || "12:00";
      const lunchDurationMinutes = companyDefault.lunchDurationMinutes || 60;

      // Calculate lunch end time
      const addMinutesToTime = (timeStr, minutes) => {
        const [hours, mins] = timeStr.split(":");
        const totalMinutes = parseInt(hours) * 60 + parseInt(mins) + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
      };

      const lunchEndTime = addMinutesToTime(
        lunchStartTime,
        lunchDurationMinutes,
      );
      const lunchEndMinutes =
        parseInt(lunchEndTime.split(":")[0]) * 60 +
        parseInt(lunchEndTime.split(":")[1] || 0);

      const checkInTime = new Date(attendance.checkInTime);
      const checkInMinutes =
        checkInTime.getHours() * 60 + checkInTime.getMinutes();

      // If employee checked in after lunch end, they cannot take lunch break
      if (breakType === "lunch" && checkInMinutes >= lunchEndMinutes) {
        return res.status(400).json({
          success: false,
          error: `Cannot take lunch break. You checked in after lunch time (after ${lunchEndTime}). Lunch break is only for employees who checked-in in the morning.`,
        });
      }
    }

    // ✅ CHECK IF ALREADY ON BREAK
    const existingBreak = await BreakTicket.findOne({
      where: {
        employeeId: employeeId,
        breakType: breakType,
        actualReturnTime: null,
        status: ["active", "late"],
      },
    });

    if (existingBreak) {
      return res.status(400).json({
        success: false,
        error: `You already have an active ${breakType} break. Please return first.`,
      });
    }

    const ticket = await attendanceService.issueBreakTicket(
      employeeId,
      breakType,
      reason,
    );

    console.log(`✅ Break ticket created: ID ${ticket.id}`);

    // UPDATE ATTENDANCE LOG - Mark afternoon as pending for lunch break
    if (breakType === "lunch" && attendance) {
      await attendance.update({
        afternoonStatus: "pending",
        notes: attendance.notes
          ? `${attendance.notes} | Lunch break started at ${new Date(ticket.breakOutTime).toLocaleTimeString()}`
          : `Lunch break started at ${new Date(ticket.breakOutTime).toLocaleTimeString()}`,
      });
      console.log(`✅ Attendance updated: afternoonStatus = pending`);
    }

    res.status(201).json({
      success: true,
      message: `${breakType} ticket issued successfully`,
      data: ticket,
    });
  } catch (error) {
    console.error("❌ Issue break ticket error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};
exports.returnFromBreak = async (req, res) => {
  try {
    const { ticketId } = req.params;

    console.log(`🔍 Processing return for ticket ID: ${ticketId}`);

    const ticket = await attendanceService.returnFromBreak(ticketId);

    console.log(`📋 Ticket found:`, {
      id: ticket.id,
      employeeId: ticket.employeeId,
      breakType: ticket.breakType,
      expectedReturn: ticket.expectedReturnTime,
      actualReturn: ticket.actualReturnTime,
      status: ticket.status,
    });

    if (req.user.role !== "admin" && req.user.userId != ticket.employeeId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only return your own breaks.",
      });
    }

    // =============================================
    // UPDATE ATTENDANCE LOG BASED ON BREAK RETURN
    // =============================================
    const today = new Date().toISOString().split("T")[0];

    // ✅ Find attendance record - MUST exist
    const attendance = await AttendanceLog.findOne({
      where: {
        employeeId: ticket.employeeId,
        attendanceDate: today,
      },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        error: "Attendance record not found. Please check in first.",
      });
    }

    // Get company defaults for thresholds
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: "day", isActive: true },
      order: [["effectiveFrom", "DESC"]],
    });

    const absentAfterMinutes = companyDefault?.absentAfterMinutes || 60;

    // Calculate lateness for this break
    const expectedReturn = new Date(ticket.expectedReturnTime);
    const actualReturn = new Date(ticket.actualReturnTime);
    const breakLateMinutes = Math.floor(
      (actualReturn - expectedReturn) / (1000 * 60),
    );

    console.log(`⏰ Break timing:`, {
      expectedReturn: expectedReturn.toLocaleTimeString(),
      actualReturn: actualReturn.toLocaleTimeString(),
      breakLateMinutes: breakLateMinutes,
      absentAfterMinutes: absentAfterMinutes,
    });

    // Get existing values from attendance
    const existingLateMinutes = attendance.lateMinutes || 0;
    const existingIsLate = attendance.isLate || false;

    let afternoonStatus = attendance.afternoonStatus;
    let isLate = existingIsLate;
    let lateMinutes = existingLateMinutes;
    let sessionType = attendance.sessionType;
    let finalStatus = attendance.status;
    let notes = "";

    if (ticket.breakType === "lunch") {
      console.log(
        `🔄 Updating attendance for employee ${ticket.employeeId}...`,
      );
      console.log(`Existing late minutes: ${existingLateMinutes}, isLate: ${existingIsLate}`);

      if (actualReturn <= expectedReturn) {
        // =============================================
        // CASE 1: ON TIME or EARLY
        // =============================================
        afternoonStatus = "present";
        // Keep existing isLate and lateMinutes (preserve morning lateness)
        isLate = existingIsLate;
        lateMinutes = existingLateMinutes;
        notes = `Lunch break returned on time at ${actualReturn.toLocaleTimeString()}`;

        if (
          attendance.morningStatus === "present" ||
          attendance.morningStatus === "late"
        ) {
          sessionType = "full_day";
          finalStatus = "FULL_DAY";
        }
        console.log(`✅ Case: ON TIME - afternoonStatus = ${afternoonStatus}`);

      } else if (breakLateMinutes > absentAfterMinutes) {
        // =============================================
        // CASE 2: VERY LATE - Mark afternoon as ABSENT
        // =============================================
        afternoonStatus = "absent";
        // PRESERVE morning lateness - don't reset
        isLate = existingIsLate;
        lateMinutes = existingLateMinutes;
        sessionType = "morning_only";
        finalStatus = "HALF_DAY";
        notes = `Lunch break returned ${breakLateMinutes} minutes late - Afternoon marked as absent`;
        console.log(`❌ Case: VERY LATE - afternoonStatus = ${afternoonStatus}`);

      } else {
        // =============================================
        // CASE 3: LATE but within threshold
        // =============================================
        afternoonStatus = "present";
        // ADD break late minutes to existing late minutes
        isLate = true;  // Either morning or break was late
        lateMinutes = existingLateMinutes + breakLateMinutes;
        notes = `Lunch break returned ${breakLateMinutes} minutes late`;

        if (
          attendance.morningStatus === "present" ||
          attendance.morningStatus === "late"
        ) {
          sessionType = "full_day";
          finalStatus = "FULL_DAY";
        }
        console.log(
          `⚠️ Case: LATE - afternoonStatus = ${afternoonStatus}, total lateMinutes = ${lateMinutes} (${existingLateMinutes} + ${breakLateMinutes})`,
        );
      }

      await attendance.update({
        afternoonStatus: afternoonStatus,
        isLate: isLate,
        lateMinutes: lateMinutes,
        sessionType: sessionType,
        status: finalStatus,
        notes: attendance.notes ? `${attendance.notes} | ${notes}` : notes,
      });

      console.log(`✅ Attendance updated! New values:`, {
        afternoonStatus: afternoonStatus,
        isLate: isLate,
        lateMinutes: lateMinutes,
        sessionType: sessionType,
        status: finalStatus,
      });
    }

    res.status(200).json({
      success: true,
      message: "Break completed successfully",
      data: ticket,
      attendanceUpdate: {
        afternoonStatus: afternoonStatus,
        isLate: isLate,
        lateMinutes: lateMinutes,
        sessionType: sessionType,
        status: finalStatus,
      },
    });
  } catch (error) {
    console.error("❌ Return from break error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getActiveBreaks = async (req, res) => {
  try {
    const { employeeId } = req.query;

    let breaks = await BreakTicket.findAll({
      where: { status: ["active", "late"] },
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            { model: Department, as: "Department", attributes: ["name"] },
          ],
        },
      ],
      order: [["expectedReturnTime", "ASC"]],
    });

    if (employeeId && req.user.role !== "admin") {
      breaks = breaks.filter((b) => b.employeeId == employeeId);
    }

    const formattedBreaks = breaks.map((breakItem) => ({
      id: breakItem.id,
      employeeId: breakItem.employeeId,
      employeeName: breakItem.employee
        ? `${breakItem.employee.firstName} ${breakItem.employee.lastName}`
        : "Unknown",
      department: breakItem.employee?.Department?.name || "N/A",
      breakType: breakItem.breakType,
      breakOutTime: breakItem.breakOutTime,
      expectedReturnTime: breakItem.expectedReturnTime,
      status: breakItem.status,
      lateMinutes: breakItem.lateMinutes,
      durationMinutes: breakItem.durationMinutes,
    }));

    res.status(200).json({
      success: true,
      data: formattedBreaks,
      count: formattedBreaks.length,
    });
  } catch (error) {
    console.error("Get active breaks error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBreakHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    if (req.user.role !== "admin" && req.user.userId != employeeId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const where = { employeeId };
    if (status) where.status = status;

    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const offset = (parseInt(page) - 1) * queryLimit;

    const { count, rows } = await BreakTicket.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: queryLimit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: queryLimit,
        totalPages: Math.ceil(count / queryLimit),
      },
    });
  } catch (error) {
    console.error("Get break history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLunchHistory = async (req, res) => {
  console.log("=== getLunchHistory START ===");
  try {
    const {
      employeeId,
      page = 1,
      limit = 10,
      search = "",
      statusFilter = "all",
    } = req.query;

    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let whereCondition = {
      breakType: "lunch",
      breakOutTime: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    };

    if (employeeId && req.user.role !== "admin") {
      whereCondition.employeeId = employeeId;
    } else if (employeeId) {
      whereCondition.employeeId = employeeId;
    }

    // Build include with search filter
    const include = [
      {
        model: Employee,
        as: "employee",
        include: [
          { model: Department, as: "Department", attributes: ["name"] },
        ],
        where: {},
      },
    ];

    // Add search filter if provided
    if (search && search.trim()) {
      include[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { employeeCode: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const tickets = await BreakTicket.findAll({
      where: whereCondition,
      include: include,
      order: [["breakOutTime", "DESC"]],
    });

    // Get company defaults
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: "day", isActive: true },
      order: [["effectiveFrom", "DESC"]],
    });

    if (!companyDefault) {
      throw new Error("Company defaults not configured.");
    }

    const absentAfterMinutes = companyDefault.absentAfterMinutes;
    if (absentAfterMinutes == null) {
      throw new Error(
        "Absent after minutes not configured in company defaults",
      );
    }

    const formattedTickets = [];

    for (const ticket of tickets) {
      try {
        // Get effective lunch duration
        let effectiveDuration = null;
        let prioritySource = "Company Default";

        // Priority 1: Employee Override
        const employeeOverride = await EmployeeOverride.findOne({
          where: {
            employeeId: ticket.employeeId,
            effectiveFrom: { [Op.lte]: ticket.breakOutTime },
            [Op.or]: [
              { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
              { effectiveTo: null },
            ],
          },
          order: [["effectiveFrom", "DESC"]],
        });

        if (employeeOverride && employeeOverride.lunchDurationMinutes != null) {
          effectiveDuration = employeeOverride.lunchDurationMinutes;
          prioritySource = "Employee Override";
        }

        // Priority 2: Department Override
        if (effectiveDuration == null) {
          const employee = await Employee.findByPk(ticket.employeeId);
          if (employee && employee.departmentId) {
            const shiftType = (employee.shiftType || "day").toLowerCase();

            const deptOverride = await DepartmentOverride.findOne({
              where: {
                departmentId: employee.departmentId,
                shiftType: shiftType,
                effectiveFrom: { [Op.lte]: ticket.breakOutTime },
                [Op.or]: [
                  { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
                  { effectiveTo: null },
                ],
              },
              order: [["effectiveFrom", "DESC"]],
            });

            if (deptOverride && deptOverride.lunchDurationMinutes != null) {
              effectiveDuration = deptOverride.lunchDurationMinutes;
              prioritySource = "Department Override";
            }
          }
        }

        // Priority 3: Company Default
        if (effectiveDuration == null) {
          if (companyDefault && companyDefault.lunchDurationMinutes != null) {
            effectiveDuration = companyDefault.lunchDurationMinutes;
            prioritySource = "Company Default";
          } else {
            effectiveDuration = 40;
          }
        }

        // Calculate status and late minutes
        let finalStatus = ticket.status;
        let displayStatus = ticket.status;
        let lateMinutes = ticket.lateMinutes || 0;
        const now = new Date();
        const expectedReturn = new Date(ticket.expectedReturnTime);
        let needsUpdate = false;

        if (ticket.actualReturnTime) {
          const actualReturn = new Date(ticket.actualReturnTime);
          if (actualReturn <= expectedReturn) {
            displayStatus = "on-time";
            finalStatus = "on-time";
            lateMinutes = 0;
            needsUpdate = true;
          } else {
            lateMinutes = Math.floor(
              (actualReturn - expectedReturn) / (1000 * 60),
            );
            if (lateMinutes > absentAfterMinutes) {
              displayStatus = "absent";
              finalStatus = "absent";
              needsUpdate = true;
            } else {
              displayStatus = "late";
              finalStatus = "late";
              needsUpdate = true;
            }
          }
        } else if (ticket.status === "active" || ticket.status === "late") {
          const minutesLate = Math.floor((now - expectedReturn) / (1000 * 60));

          if (minutesLate > absentAfterMinutes) {
            displayStatus = "absent";
            finalStatus = "absent";
            lateMinutes = minutesLate;
            needsUpdate = true;
          } else if (minutesLate > 0) {
            displayStatus = "late";
            finalStatus = "active"; // Keep active in DB until returned
            lateMinutes = minutesLate;
          } else {
            displayStatus = "active";
            finalStatus = "active";
            lateMinutes = 0;
          }
        }

        // ✅ Update the database if status changed (especially for absent)
        if (needsUpdate && finalStatus !== ticket.status) {
          await ticket.update({
            status: finalStatus,
            lateMinutes: lateMinutes,
          });
          console.log(
            `Ticket ${ticket.id} updated: ${ticket.status} → ${finalStatus}`,
          );
        }

        formattedTickets.push({
          id: ticket.id,
          employeeId: ticket.employeeId,
          employeeName: ticket.employee
            ? `${ticket.employee.firstName} ${ticket.employee.lastName}`
            : "Unknown",
          department: ticket.employee?.Department?.name || "N/A",
          durationMinutes: effectiveDuration,
          prioritySource: prioritySource,
          breakOutTime: ticket.breakOutTime,
          expectedReturnTime: ticket.expectedReturnTime,
          actualReturnTime: ticket.actualReturnTime,
          status: finalStatus,
          displayStatus: displayStatus,
          lateMinutes: lateMinutes,
        });
      } catch (ticketError) {
        console.error(
          `Error processing ticket ${ticket.id}:`,
          ticketError.message,
        );
      }
    }

    // Apply status filter
    let filteredTickets = [...formattedTickets];
    if (statusFilter !== "all") {
      filteredTickets = filteredTickets.filter(
        (t) => t.displayStatus === statusFilter,
      );
    }

    // Apply pagination
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    const totalCount = filteredTickets.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    console.log(
      `Successfully processed ${formattedTickets.length} tickets for today`,
    );
    console.log(`Filtered: ${totalCount}, Page: ${parsedPage}/${totalPages}`);

    res.status(200).json({
      success: true,
      data: paginatedTickets,
      count: totalCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Get lunch history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getDinnerHistory = async (req, res) => {
  console.log("=== getDinnerHistory START ===");
  try {
    const {
      employeeId,
      page = 1,
      limit = 10,
      search = "",
      statusFilter = "all",
    } = req.query;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let whereCondition = {
      breakType: "dinner",
      breakOutTime: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    };

    if (employeeId && req.user.role !== "admin") {
      whereCondition.employeeId = employeeId;
    } else if (employeeId) {
      whereCondition.employeeId = employeeId;
    }

    // Build include with search filter
    const include = [
      {
        model: Employee,
        as: "employee",
        include: [
          { model: Department, as: "Department", attributes: ["name"] },
        ],
        where: {},
      },
    ];

    // Add search filter if provided
    if (search && search.trim()) {
      include[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { employeeCode: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const tickets = await BreakTicket.findAll({
      where: whereCondition,
      include: include,
      order: [["breakOutTime", "DESC"]],
    });

    // Get company defaults for night shift
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: "night", isActive: true },
      order: [["effectiveFrom", "DESC"]],
    });

    if (!companyDefault) {
      throw new Error("Company defaults not configured for night shift.");
    }

    // ✅ Use dinner-specific settings from company defaults
    const dinnerStartTime = companyDefault.dinnerStartTime || "02:00";
    const dinnerDuration = companyDefault.dinnerDurationMinutes || 40;
    const checkOutTime = companyDefault.checkOutTime || "06:00";
    const absentAfterMinutes = companyDefault.absentAfterMinutes || 60;

    const formattedTickets = [];

    for (const ticket of tickets) {
      try {
        // Get effective dinner duration (priority: Employee > Department > Company)
        let effectiveDuration = null;
        let prioritySource = "Company Default";

        // Priority 1: Employee Override (using dinnerDurationMinutes)
        const employeeOverride = await EmployeeOverride.findOne({
          where: {
            employeeId: ticket.employeeId,
            effectiveFrom: { [Op.lte]: ticket.breakOutTime },
            [Op.or]: [
              { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
              { effectiveTo: null },
            ],
          },
          order: [["effectiveFrom", "DESC"]],
        });

        if (
          employeeOverride &&
          employeeOverride.dinnerDurationMinutes != null
        ) {
          effectiveDuration = employeeOverride.dinnerDurationMinutes;
          prioritySource = "Employee Override";
        }

        // Priority 2: Department Override
        if (effectiveDuration == null) {
          const employee = await Employee.findByPk(ticket.employeeId);
          if (employee && employee.departmentId) {
            const shiftType = (employee.shiftType || "night").toLowerCase();

            const deptOverride = await DepartmentOverride.findOne({
              where: {
                departmentId: employee.departmentId,
                shiftType: shiftType,
                effectiveFrom: { [Op.lte]: ticket.breakOutTime },
                [Op.or]: [
                  { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
                  { effectiveTo: null },
                ],
              },
              order: [["effectiveFrom", "DESC"]],
            });

            if (deptOverride && deptOverride.dinnerDurationMinutes != null) {
              effectiveDuration = deptOverride.dinnerDurationMinutes;
              prioritySource = "Department Override";
            }
          }
        }

        // Priority 3: Company Default
        if (effectiveDuration == null) {
          if (companyDefault && companyDefault.dinnerDurationMinutes != null) {
            effectiveDuration = companyDefault.dinnerDurationMinutes;
            prioritySource = "Company Default";
          } else {
            effectiveDuration = dinnerDuration;
          }
        }

        // Calculate status and late minutes
        let finalStatus = ticket.status;
        let displayStatus = ticket.status;
        let lateMinutes = ticket.lateMinutes || 0;
        const now = new Date();
        const expectedReturn = new Date(ticket.expectedReturnTime);
        let needsUpdate = false;

        if (ticket.actualReturnTime) {
          const actualReturn = new Date(ticket.actualReturnTime);
          if (actualReturn <= expectedReturn) {
            displayStatus = "on-time";
            finalStatus = "on-time";
            lateMinutes = 0;
            needsUpdate = true;
          } else {
            lateMinutes = Math.floor(
              (actualReturn - expectedReturn) / (1000 * 60),
            );
            if (lateMinutes > absentAfterMinutes) {
              displayStatus = "absent";
              finalStatus = "absent";
              needsUpdate = true;
            } else {
              displayStatus = "late";
              finalStatus = "late";
              needsUpdate = true;
            }
          }
        } else if (ticket.status === "active" || ticket.status === "late") {
          const minutesLate = Math.floor((now - expectedReturn) / (1000 * 60));

          if (minutesLate > absentAfterMinutes) {
            displayStatus = "absent";
            finalStatus = "absent";
            lateMinutes = minutesLate;
            needsUpdate = true;
          } else if (minutesLate > 0) {
            displayStatus = "late";
            finalStatus = "active";
            lateMinutes = minutesLate;
          } else {
            displayStatus = "active";
            finalStatus = "active";
            lateMinutes = 0;
          }
        }

        // Update the database if status changed
        if (needsUpdate && finalStatus !== ticket.status) {
          await ticket.update({
            status: finalStatus,
            lateMinutes: lateMinutes,
          });
          console.log(
            `Dinner ticket ${ticket.id} updated: ${ticket.status} → ${finalStatus}`,
          );
        }

        formattedTickets.push({
          id: ticket.id,
          employeeId: ticket.employeeId,
          employeeName: ticket.employee
            ? `${ticket.employee.firstName} ${ticket.employee.lastName}`
            : "Unknown",
          department: ticket.employee?.Department?.name || "N/A",
          durationMinutes: effectiveDuration,
          prioritySource: prioritySource,
          breakOutTime: ticket.breakOutTime,
          expectedReturnTime: ticket.expectedReturnTime,
          actualReturnTime: ticket.actualReturnTime,
          status: finalStatus,
          displayStatus: displayStatus,
          lateMinutes: lateMinutes,
        });
      } catch (ticketError) {
        console.error(
          `Error processing dinner ticket ${ticket.id}:`,
          ticketError.message,
        );
      }
    }

    // Apply status filter
    let filteredTickets = [...formattedTickets];
    if (statusFilter !== "all") {
      filteredTickets = filteredTickets.filter(
        (t) => t.displayStatus === statusFilter,
      );
    }

    // Apply pagination
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    const totalCount = filteredTickets.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    console.log(
      `Successfully processed ${formattedTickets.length} dinner tickets for today`,
    );
    console.log(
      `Dinner settings: Start at ${dinnerStartTime}, Duration ${dinnerDuration} min, Check-out ${checkOutTime}`,
    );

    res.status(200).json({
      success: true,
      data: paginatedTickets,
      count: totalCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Get dinner history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
