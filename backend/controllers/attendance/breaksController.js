// controllers/attendance/breaksController.js
const { Op } = require('sequelize');
const { 
  Employee, 
  Department,
  CompanyShiftDefault,
  DepartmentOverride,      
  EmployeeOverride,        
  BreakTicket
} = require('../../models');
const attendanceService = require('../../service/attendanceConfig.service');

exports.issueBreakTicket = async (req, res) => {
  try {
    const { employeeId, breakType, reason } = req.body;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only issue tickets for yourself.' 
      });
    }
    
    if (!employeeId || !breakType) {
      return res.status(400).json({ success: false, error: 'Employee ID and break type are required' });
    }
    
    if (!['lunch', 'dinner'].includes(breakType)) {
      return res.status(400).json({ success: false, error: 'Break type must be "lunch" or "dinner"' });
    }
    
    const ticket = await attendanceService.issueBreakTicket(employeeId, breakType, reason);
    
    res.status(201).json({
      success: true,
      message: `${breakType} ticket issued successfully`,
      data: ticket
    });
  } catch (error) {
    console.error('Issue break ticket error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
exports.returnFromBreak = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await attendanceService.returnFromBreak(ticketId);
    
    if (req.user.role !== 'admin' && req.user.userId != ticket.employeeId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only return your own breaks.' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Break completed successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Return from break error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getActiveBreaks = async (req, res) => {
  try {
    const { employeeId } = req.query;
    
    let breaks = await BreakTicket.findAll({
      where: { status: ['active', 'late'] },
      include: [
        { 
          model: Employee, 
          as: 'employee',
          include: [{ model: Department, as: 'Department', attributes: ['name'] }]
        }
      ],
      order: [['expectedReturnTime', 'ASC']]
    });
    
    if (employeeId && req.user.role !== 'admin') {
      breaks = breaks.filter(b => b.employeeId == employeeId);
    }
    
    const formattedBreaks = breaks.map(breakItem => ({
      id: breakItem.id,
      employeeId: breakItem.employeeId,
      employeeName: breakItem.employee ? `${breakItem.employee.firstName} ${breakItem.employee.lastName}` : 'Unknown',
      department: breakItem.employee?.Department?.name || 'N/A',
      breakType: breakItem.breakType,
      breakOutTime: breakItem.breakOutTime,
      expectedReturnTime: breakItem.expectedReturnTime,
      status: breakItem.status,
      lateMinutes: breakItem.lateMinutes,
      durationMinutes: breakItem.durationMinutes
    }));
    
    res.status(200).json({
      success: true,
      data: formattedBreaks,
      count: formattedBreaks.length
    });
  } catch (error) {
    console.error('Get active breaks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBreakHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    if (req.user.role !== 'admin' && req.user.userId != employeeId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const where = { employeeId };
    if (status) where.status = status;
    
    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const offset = (parseInt(page) - 1) * queryLimit;
    
    const { count, rows } = await BreakTicket.findAndCountAll({ 
      where, 
      order: [['created_at', 'DESC']], 
      limit: queryLimit, 
      offset 
    });
    
    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: queryLimit,
        totalPages: Math.ceil(count / queryLimit)
      }
    });
  } catch (error) {
    console.error('Get break history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLunchHistory = async (req, res) => {
  console.log('=== getLunchHistory START ===');
  try {
    const { 
      employeeId,
      page = 1, 
      limit = 10,
      search = '',
      statusFilter = 'all'
    } = req.query;
    
    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let whereCondition = { 
      breakType: 'lunch',
      breakOutTime: {
        [Op.gte]: today,
        [Op.lt]: tomorrow
      }
    };
    
    if (employeeId && req.user.role !== 'admin') {
      whereCondition.employeeId = employeeId;
    } else if (employeeId) {
      whereCondition.employeeId = employeeId;
    }
    
    // Build include with search filter
    const include = [
      { 
        model: Employee, 
        as: 'employee',
        include: [{ model: Department, as: 'Department', attributes: ['name'] }],
        where: {}
      }
    ];
    
    // Add search filter if provided
    if (search && search.trim()) {
      include[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { employeeCode: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    const tickets = await BreakTicket.findAll({
      where: whereCondition,
      include: include,
      order: [['breakOutTime', 'DESC']]
    });
    
    // Get company defaults
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: 'day', isActive: true },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (!companyDefault) {
      throw new Error('Company defaults not configured.');
    }
    
    const absentAfterMinutes = companyDefault.absentAfterMinutes;
    if (absentAfterMinutes == null) {
      throw new Error('Absent after minutes not configured in company defaults');
    }
    
    const formattedTickets = [];
    
    for (const ticket of tickets) {
      try {
        // Get effective lunch duration
        let effectiveDuration = null;
        let prioritySource = 'Company Default';
        
        // Priority 1: Employee Override
        const employeeOverride = await EmployeeOverride.findOne({
          where: { 
            employeeId: ticket.employeeId,
            effectiveFrom: { [Op.lte]: ticket.breakOutTime },
            [Op.or]: [
              { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
              { effectiveTo: null }
            ]
          },
          order: [['effectiveFrom', 'DESC']]
        });
        
        if (employeeOverride && employeeOverride.lunchDurationMinutes != null) {
          effectiveDuration = employeeOverride.lunchDurationMinutes;
          prioritySource = 'Employee Override';
        }
        
        // Priority 2: Department Override
        if (effectiveDuration == null) {
          const employee = await Employee.findByPk(ticket.employeeId);
          if (employee && employee.departmentId) {
            const shiftType = (employee.shiftType || 'day').toLowerCase();
            
            const deptOverride = await DepartmentOverride.findOne({
              where: {
                departmentId: employee.departmentId,
                shiftType: shiftType,
                effectiveFrom: { [Op.lte]: ticket.breakOutTime },
                [Op.or]: [
                  { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
                  { effectiveTo: null }
                ]
              },
              order: [['effectiveFrom', 'DESC']]
            });
            
            if (deptOverride && deptOverride.lunchDurationMinutes != null) {
              effectiveDuration = deptOverride.lunchDurationMinutes;
              prioritySource = 'Department Override';
            }
          }
        }
        
        // Priority 3: Company Default
        if (effectiveDuration == null) {
          if (companyDefault && companyDefault.lunchDurationMinutes != null) {
            effectiveDuration = companyDefault.lunchDurationMinutes;
            prioritySource = 'Company Default';
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
            displayStatus = 'on-time';
            finalStatus = 'on-time';
            lateMinutes = 0;
            needsUpdate = true;
          } else {
            lateMinutes = Math.floor((actualReturn - expectedReturn) / (1000 * 60));
            if (lateMinutes > absentAfterMinutes) {
              displayStatus = 'absent';
              finalStatus = 'absent';
              needsUpdate = true;
            } else {
              displayStatus = 'late';
              finalStatus = 'late';
              needsUpdate = true;
            }
          }
        } else if (ticket.status === 'active' || ticket.status === 'late') {
          const minutesLate = Math.floor((now - expectedReturn) / (1000 * 60));
          
          if (minutesLate > absentAfterMinutes) {
            displayStatus = 'absent';
            finalStatus = 'absent';
            lateMinutes = minutesLate;
            needsUpdate = true;
          } else if (minutesLate > 0) {
            displayStatus = 'late';
            finalStatus = 'active';  // Keep active in DB until returned
            lateMinutes = minutesLate;
          } else {
            displayStatus = 'active';
            finalStatus = 'active';
            lateMinutes = 0;
          }
        }
        
        // ✅ Update the database if status changed (especially for absent)
        if (needsUpdate && finalStatus !== ticket.status) {
          await ticket.update({ 
            status: finalStatus,
            lateMinutes: lateMinutes
          });
          console.log(`Ticket ${ticket.id} updated: ${ticket.status} → ${finalStatus}`);
        }
        
        formattedTickets.push({
          id: ticket.id,
          employeeId: ticket.employeeId,
          employeeName: ticket.employee ? `${ticket.employee.firstName} ${ticket.employee.lastName}` : 'Unknown',
          department: ticket.employee?.Department?.name || 'N/A',
          durationMinutes: effectiveDuration,
          prioritySource: prioritySource,
          breakOutTime: ticket.breakOutTime,
          expectedReturnTime: ticket.expectedReturnTime,
          actualReturnTime: ticket.actualReturnTime,
          status: finalStatus,
          displayStatus: displayStatus,
          lateMinutes: lateMinutes
        });
      } catch (ticketError) {
        console.error(`Error processing ticket ${ticket.id}:`, ticketError.message);
      }
    }
    
    // Apply status filter
    let filteredTickets = [...formattedTickets];
    if (statusFilter !== 'all') {
      filteredTickets = filteredTickets.filter(t => t.displayStatus === statusFilter);
    }
    
    // Apply pagination
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    const totalCount = filteredTickets.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);
    
    console.log(`Successfully processed ${formattedTickets.length} tickets for today`);
    console.log(`Filtered: ${totalCount}, Page: ${parsedPage}/${totalPages}`);
    
    res.status(200).json({
      success: true,
      data: paginatedTickets,
      count: totalCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('Get lunch history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// controllers/attendance/breaksController.js

exports.getDinnerHistory = async (req, res) => {
  console.log('=== getDinnerHistory START ===');
  try {
    const { 
      employeeId,
      page = 1, 
      limit = 10,
      search = '',
      statusFilter = 'all'
    } = req.query;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let whereCondition = { 
      breakType: 'dinner',
      breakOutTime: {
        [Op.gte]: today,
        [Op.lt]: tomorrow
      }
    };
    
    if (employeeId && req.user.role !== 'admin') {
      whereCondition.employeeId = employeeId;
    } else if (employeeId) {
      whereCondition.employeeId = employeeId;
    }
    
    // Build include with search filter
    const include = [
      { 
        model: Employee, 
        as: 'employee',
        include: [{ model: Department, as: 'Department', attributes: ['name'] }],
        where: {}
      }
    ];
    
    // Add search filter if provided
    if (search && search.trim()) {
      include[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { employeeCode: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    const tickets = await BreakTicket.findAll({
      where: whereCondition,
      include: include,
      order: [['breakOutTime', 'DESC']]
    });
    
    // Get company defaults for night shift
    const companyDefault = await CompanyShiftDefault.findOne({
      where: { shiftType: 'night', isActive: true },
      order: [['effectiveFrom', 'DESC']]
    });
    
    if (!companyDefault) {
      throw new Error('Company defaults not configured for night shift.');
    }
    
    // ✅ Use dinner-specific settings from company defaults
    const dinnerStartTime = companyDefault.dinnerStartTime || '02:00';
    const dinnerDuration = companyDefault.dinnerDurationMinutes || 40;
    const checkOutTime = companyDefault.checkOutTime || '06:00';
    const absentAfterMinutes = companyDefault.absentAfterMinutes || 60;
    
    const formattedTickets = [];
    
    for (const ticket of tickets) {
      try {
        // Get effective dinner duration (priority: Employee > Department > Company)
        let effectiveDuration = null;
        let prioritySource = 'Company Default';
        
        // Priority 1: Employee Override (using dinnerDurationMinutes)
        const employeeOverride = await EmployeeOverride.findOne({
          where: { 
            employeeId: ticket.employeeId,
            effectiveFrom: { [Op.lte]: ticket.breakOutTime },
            [Op.or]: [
              { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
              { effectiveTo: null }
            ]
          },
          order: [['effectiveFrom', 'DESC']]
        });
        
        if (employeeOverride && employeeOverride.dinnerDurationMinutes != null) {
          effectiveDuration = employeeOverride.dinnerDurationMinutes;
          prioritySource = 'Employee Override';
        }
        
        // Priority 2: Department Override
        if (effectiveDuration == null) {
          const employee = await Employee.findByPk(ticket.employeeId);
          if (employee && employee.departmentId) {
            const shiftType = (employee.shiftType || 'night').toLowerCase();
            
            const deptOverride = await DepartmentOverride.findOne({
              where: {
                departmentId: employee.departmentId,
                shiftType: shiftType,
                effectiveFrom: { [Op.lte]: ticket.breakOutTime },
                [Op.or]: [
                  { effectiveTo: { [Op.gte]: ticket.breakOutTime } },
                  { effectiveTo: null }
                ]
              },
              order: [['effectiveFrom', 'DESC']]
            });
            
            if (deptOverride && deptOverride.dinnerDurationMinutes != null) {
              effectiveDuration = deptOverride.dinnerDurationMinutes;
              prioritySource = 'Department Override';
            }
          }
        }
        
        // Priority 3: Company Default
        if (effectiveDuration == null) {
          if (companyDefault && companyDefault.dinnerDurationMinutes != null) {
            effectiveDuration = companyDefault.dinnerDurationMinutes;
            prioritySource = 'Company Default';
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
            displayStatus = 'on-time';
            finalStatus = 'on-time';
            lateMinutes = 0;
            needsUpdate = true;
          } else {
            lateMinutes = Math.floor((actualReturn - expectedReturn) / (1000 * 60));
            if (lateMinutes > absentAfterMinutes) {
              displayStatus = 'absent';
              finalStatus = 'absent';
              needsUpdate = true;
            } else {
              displayStatus = 'late';
              finalStatus = 'late';
              needsUpdate = true;
            }
          }
        } else if (ticket.status === 'active' || ticket.status === 'late') {
          const minutesLate = Math.floor((now - expectedReturn) / (1000 * 60));
          
          if (minutesLate > absentAfterMinutes) {
            displayStatus = 'absent';
            finalStatus = 'absent';
            lateMinutes = minutesLate;
            needsUpdate = true;
          } else if (minutesLate > 0) {
            displayStatus = 'late';
            finalStatus = 'active';
            lateMinutes = minutesLate;
          } else {
            displayStatus = 'active';
            finalStatus = 'active';
            lateMinutes = 0;
          }
        }
        
        // Update the database if status changed
        if (needsUpdate && finalStatus !== ticket.status) {
          await ticket.update({ 
            status: finalStatus,
            lateMinutes: lateMinutes
          });
          console.log(`Dinner ticket ${ticket.id} updated: ${ticket.status} → ${finalStatus}`);
        }
        
        formattedTickets.push({
          id: ticket.id,
          employeeId: ticket.employeeId,
          employeeName: ticket.employee ? `${ticket.employee.firstName} ${ticket.employee.lastName}` : 'Unknown',
          department: ticket.employee?.Department?.name || 'N/A',
          durationMinutes: effectiveDuration,
          prioritySource: prioritySource,
          breakOutTime: ticket.breakOutTime,
          expectedReturnTime: ticket.expectedReturnTime,
          actualReturnTime: ticket.actualReturnTime,
          status: finalStatus,
          displayStatus: displayStatus,
          lateMinutes: lateMinutes
        });
      } catch (ticketError) {
        console.error(`Error processing dinner ticket ${ticket.id}:`, ticketError.message);
      }
    }
    
    // Apply status filter
    let filteredTickets = [...formattedTickets];
    if (statusFilter !== 'all') {
      filteredTickets = filteredTickets.filter(t => t.displayStatus === statusFilter);
    }
    
    // Apply pagination
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    const totalCount = filteredTickets.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);
    
    console.log(`Successfully processed ${formattedTickets.length} dinner tickets for today`);
    console.log(`Dinner settings: Start at ${dinnerStartTime}, Duration ${dinnerDuration} min, Check-out ${checkOutTime}`);
    
    res.status(200).json({
      success: true,
      data: paginatedTickets,
      count: totalCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('Get dinner history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};