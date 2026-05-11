const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const csv = require("csv-parser");
const { Op } = require("sequelize");

// Import models using destructuring
const {
  Employee,
  ImportBatch,
  AttendanceRecord,
  ImportError,
  Department,
  sequelize,
} = require("../models");

// ============================================
// HELPER FUNCTIONS
// ============================================

// Parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

// Parse Excel file
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
};

// ============================================
// ADD THESE HELPER FUNCTIONS
// ============================================

// Helper function for safe number conversion
const toNumber = (val, fallback = 0) => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

// Helper for safe rounding
const round = (num) => Math.round(num * 100) / 100;

// Helper for safe file deletion
const safeDelete = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper to get all dates in a range (without mutation)
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to midnight UTC to avoid timezone issues
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  
  let current = new Date(start);
  
  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return dates;
};

// Helper to batch load employees for performance
const getEmployeeMap = async (employeeIds) => {
  if (!employeeIds || employeeIds.length === 0) {
    return new Set();
  }
  
  // Convert all IDs to numbers
  const numericIds = employeeIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
  
  console.log('Looking for employee IDs:', numericIds);
  
  const employees = await Employee.findAll({
    where: {
      employee_id: { [Op.in]: numericIds },
      is_active: true
    },
    attributes: ['employee_id']
  });
  
  console.log('Found employees:', employees.map(e => e.employee_id));
  
  // Store as numbers
  const employeeSet = new Set(employees.map(e => Number(e.employee_id)));
  
  return employeeSet;
};

// Validate employee exists
const validateEmployee = async (employeeId) => {
  try {
    const employee = await Employee.findOne({
      where: {
        employee_id: employeeId,
        is_active: true,
      },
    });
    return employee;
  } catch (error) {
    console.error("Validate employee error:", error);
    return null;
  }
};

// Get working days in a month (Monday to Saturday)
const getWorkingDaysInMonth = (year, month) => {
  const date = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      workingDays++;
    }
  }
  return workingDays;
};

// ============================================
// 1. IMPORT ATTENDANCE FILE (SIMPLIFIED & FIXED)
// ============================================
// ============================================
// 1. IMPORT ATTENDANCE FILE (FULLY FIXED)
// ============================================
exports.importAttendanceFile = async (req, res) => {
  const transaction = await sequelize.transaction();
  let processedEmployees = new Set();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { period_start, period_end, period_type, imported_by } = req.body;

    if (!period_start || !period_end) {
      safeDelete(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Period start and end dates are required',
      });
    }

    // Validate date range
    if (new Date(period_start) > new Date(period_end)) {
      safeDelete(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid period range: start date cannot be after end date',
      });
    }

    const periodYear = new Date(period_start).getFullYear();
    const periodMonth = new Date(period_start).getMonth() + 1;

    // Validate same month
    if (new Date(period_start).getMonth() !== new Date(period_end).getMonth()) {
      safeDelete(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Import period must be within the same month',
      });
    }

    // Generate dates in this period
    const newDates = getDatesInRange(period_start, period_end);
    if (newDates.length === 0) {
      safeDelete(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
      });
    }

    // Create import batch
    const batch = await ImportBatch.create({
      file_name: req.file.originalname,
      file_path: req.file.path,
      period_start,
      period_end,
      period_type: period_type || 'custom',
      imported_by: imported_by || (req.user ? req.user.employee_id : null),
      status: 'processing',
      started_at: new Date(),
    }, { transaction });

    // Parse file
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let rawData = [];

    try {
      if (fileExt === '.csv') {
        rawData = await parseCSV(req.file.path);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        rawData = parseExcel(req.file.path);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (parseError) {
      await batch.update({ status: 'failed' }, { transaction });
      throw parseError;
    }

    let successCount = 0, errorCount = 0, skippedCount = 0;
    processedEmployees.clear();

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNumber = i + 2;

      try {
        // Get employee ID from CSV
        const employeeIdRaw = row['Employee ID'] || row['employee_id'] || row['EmployeeId'] || row['Emp ID'];
        const employeeId = parseInt(employeeIdRaw);
        
        console.log(`Processing row ${rowNumber}: Employee ID = ${employeeId}`);

        if (isNaN(employeeId) || employeeId <= 0) {
          throw new Error('Invalid Employee ID');
        }

        // Skip duplicate employees in same file
        if (processedEmployees.has(employeeId)) {
          skippedCount++;
          continue;
        }

        // ✅ FIX 1: Validate employee exists - DON'T use getEmployeeMap
        const employee = await Employee.findOne({
          where: {
            employee_id: employeeId,
            is_active: true
          }
        });

        if (!employee) {
          // Don't throw - just log error and continue
          await ImportError.create({
            import_batch_id: batch.id,
            row_number: rowNumber,
            employee_id: employeeId,
            error_type: 'validation_error',
            error_message: `Employee with ID ${employeeId} not found or inactive`,
            raw_data: row,
            is_resolved: false,
          }, { transaction });
          errorCount++;
          continue;
        }

        // ✅ FIX 2: Parse values as numbers using parseFloat
        const lateMinutes = parseFloat(row['Late Minutes'] || row['late_minutes'] || row['Late In (M)'] || 0);
        const halfDayAbsence = parseFloat(row['Half Day Absence'] || row['half_day_absence'] || row['Morning Absence (D)'] || 0);
        const absenceDays = parseFloat(row['Absence Days'] || row['absence_days'] || row['Absence (D)'] || 0);
        const weekendOtMinutes = parseFloat(row['Weekend OT Minutes'] || row['weekend_ot_minutes'] || row['Weekend OT (M)'] || 0);
        const holidayOtMinutes = parseFloat(row['Holiday OT Minutes'] || row['holiday_ot_minutes'] || row['Holiday OT (M)'] || 0);

        // Validate numbers
        if (isNaN(lateMinutes)) throw new Error(`Invalid Late Minutes: ${row['Late Minutes']}`);
        if (isNaN(halfDayAbsence)) throw new Error(`Invalid Half Day Absence: ${row['Half Day Absence']}`);
        if (isNaN(absenceDays)) throw new Error(`Invalid Absence Days: ${row['Absence Days']}`);
        if (isNaN(weekendOtMinutes)) throw new Error(`Invalid Weekend OT Minutes: ${row['Weekend OT Minutes']}`);
        if (isNaN(holidayOtMinutes)) throw new Error(`Invalid Holiday OT Minutes: ${row['Holiday OT Minutes']}`);

        // ✅ FIX 3: Calculate total absence days correctly
        const totalAbsenceDays = (absenceDays || 0) + ((halfDayAbsence || 0) * 0.5);

        processedEmployees.add(employeeId);

        // Find existing record for this employee and month
        const existingRecord = await AttendanceRecord.findOne({
          where: {
            employee_id: employeeId,
            period_year: periodYear,
            period_month: periodMonth,
          },
          transaction,
        });

        if (existingRecord) {
          // Get existing imported dates
          const existingDates = existingRecord.imported_dates || {};
          const alreadyImportedDates = Object.keys(existingDates);
          
          // Find NEW dates
          const datesToAdd = newDates.filter(date => !alreadyImportedDates.includes(date));
          
          if (datesToAdd.length === 0) {
            console.log(`Employee ${employeeId}: All dates already imported. Skipping.`);
            skippedCount++;
            continue;
          }
          
          // Merge imported dates
          const newImportedDates = { ...existingDates };
          datesToAdd.forEach(date => {
            newImportedDates[date] = true;
          });
          
          // Update date range
          const allDates = Object.keys(newImportedDates).sort();
          const mergedStartDate = allDates[0];
          const mergedEndDate = allDates[allDates.length - 1];
          const mergedPeriodDays = allDates.length;
          
          // Get current values as numbers
          const currentLate = parseFloat(existingRecord.late_minutes) || 0;
          const currentAbsence = parseFloat(existingRecord.absence_days) || 0;
          const currentWeekendOt = parseFloat(existingRecord.weekend_ot_minutes) || 0;
          const currentHolidayOt = parseFloat(existingRecord.holiday_ot_minutes) || 0;
          
          // ✅ FIX 4: ADD to existing values (accumulate)
          const newLate = currentLate + lateMinutes;
          const newAbsence = currentAbsence + totalAbsenceDays;
          const newWeekendOt = currentWeekendOt + weekendOtMinutes;
          const newHolidayOt = currentHolidayOt + holidayOtMinutes;
          
          console.log(`Employee ${employeeId}: Updated - Late: ${currentLate} + ${lateMinutes} = ${newLate}`);
          console.log(`Employee ${employeeId}: Updated - Absence: ${currentAbsence} + ${totalAbsenceDays} = ${newAbsence}`);
          
          await existingRecord.update({
            period_start_date: mergedStartDate,
            period_end_date: mergedEndDate,
            period_days: mergedPeriodDays,
            late_minutes: newLate,
            absence_days: newAbsence,
            weekend_ot_minutes: newWeekendOt,
            holiday_ot_minutes: newHolidayOt,
            imported_dates: newImportedDates,
            updated_at: new Date(),
          }, { transaction });
          
          successCount++;
        } else {
          // Create new record
          const importedDates = {};
          newDates.forEach(date => {
            importedDates[date] = true;
          });
          
          console.log(`Employee ${employeeId}: Creating new record with ${lateMinutes} late, ${totalAbsenceDays} absence`);
          
          await AttendanceRecord.create({
            import_batch_id: batch.id,
            employee_id: employeeId,
            late_minutes: lateMinutes,
            half_day_absence: 0,
            early_leave_days: 0,
            absence_days: totalAbsenceDays,
            weekend_ot_minutes: weekendOtMinutes,
            holiday_ot_minutes: holidayOtMinutes,
            period_start_date: period_start,
            period_end_date: period_end,
            period_days: newDates.length,
            period_year: periodYear,
            period_month: periodMonth,
            imported_dates: importedDates,
            raw_data: row,
            is_valid: true,
          }, { transaction });
          
          successCount++;
        }
      } catch (rowError) {
        errorCount++;
        console.error(`Row ${rowNumber} error:`, rowError.message);
        
        // Don't let the transaction abort - just log the error
        try {
          await ImportError.create({
            import_batch_id: batch.id,
            row_number: rowNumber,
            employee_id: parseInt(row['Employee ID'] || row['employee_id'] || row['EmployeeId'] || 0),
            error_type: 'validation_error',
            error_message: rowError.message,
            raw_data: row,
            is_resolved: false,
          }, { transaction });
        } catch (importError) {
          console.error(`Failed to log error for row ${rowNumber}:`, importError.message);
        }
      }
    }

    await batch.update({
      total_rows: rawData.length,
      success_rows: successCount,
      error_rows: errorCount,
      status: 'completed',
      completed_at: new Date(),
    }, { transaction });

    await transaction.commit();
    safeDelete(req.file.path);

    res.status(200).json({
      success: true,
      message: `Import completed: ${successCount} successful, ${errorCount} failed, ${skippedCount} skipped`,
      data: {
        batch_id: batch.id,
        total: rawData.length,
        success: successCount,
        failed: errorCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Import error:', error);
    safeDelete(req.file.path);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



// ============================================
// 2. GET ATTENDANCE RECORDS (Grouped by Month/Year)
// ============================================
exports.getAttendanceRecords = async (req, res) => {
  try {
    const {
      year,
      month,
      employee_id,
      department_id,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let whereClause = {};

    if (employee_id) {
      whereClause.employee_id = parseInt(employee_id);
    }

    // Filter by year and month
    if (year && month) {
      whereClause.period_year = parseInt(year);
      whereClause.period_month = parseInt(month);
    } else if (year) {
      whereClause.period_year = parseInt(year);
    } else {
      // Default to current month
      const currentDate = new Date();
      whereClause.period_year = currentDate.getFullYear();
      whereClause.period_month = currentDate.getMonth() + 1;
    }

    // Build include for employee with department
    const employeeInclude = {
      model: Employee,
      as: "employee",
      attributes: [
        "employee_id",
        "employee_code",
        "first_name",
        "last_name",
        "department_id",
      ],
      include: [
        {
          model: Department,
          as: "Department",
          attributes: ["name"],
          required: false,
        },
      ],
      required: true,
    };

    // Add search filter on employee name or code
    if (search && search.trim()) {
      employeeInclude.where = {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search.trim()}%` } },
          { last_name: { [Op.iLike]: `%${search.trim()}%` } },
          { employee_code: { [Op.iLike]: `%${search.trim()}%` } },
        ],
      };
    }

    // Add department filter if specified
    if (department_id) {
      if (employeeInclude.where) {
        employeeInclude.where.department_id = parseInt(department_id);
      } else {
        employeeInclude.where = { department_id: parseInt(department_id) };
      }
    }

    const include = [employeeInclude];
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where: whereClause,
      include: include,
      distinct: true,
      limit: parseInt(limit),
      offset: offset,
      order: [
        ["period_year", "DESC"],
        ["period_month", "DESC"],
      ],
    });

    // Format response
    const formattedRows = rows.map((record) => {
      const recordData = record.toJSON();
      const employee = recordData.employee;

      const totalWorkingDays = getWorkingDaysInMonth(
        recordData.period_year,
        recordData.period_month,
      );
      const daysPresent = totalWorkingDays - (recordData.absence_days || 0);

      return {
        id: recordData.id,
        employee_id: recordData.employee_id,
        employee_code: employee?.employee_code || null,
        employee_name: employee
          ? `${employee.first_name} ${employee.last_name}`
          : null,
        department_name: employee?.Department?.name || null,
        year: recordData.period_year,
        month: recordData.period_month,
        month_name: new Date(
          recordData.period_year,
          recordData.period_month - 1,
        ).toLocaleString("default", { month: "long" }),
        total_working_days: totalWorkingDays,
        days_present: daysPresent,
        days_absent: (recordData.absence_days || 0).toFixed(1),
        late_minutes: recordData.late_minutes || 0,
        weekend_ot_minutes: recordData.weekend_ot_minutes || 0,
        weekend_ot_hours: ((recordData.weekend_ot_minutes || 0) / 60).toFixed(
          1,
        ),
        holiday_ot_minutes: recordData.holiday_ot_minutes || 0,
        holiday_ot_hours: ((recordData.holiday_ot_minutes || 0) / 60).toFixed(
          1,
        ),
        attendance_rate:
          totalWorkingDays > 0
            ? ((daysPresent / totalWorkingDays) * 100).toFixed(1)
            : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET MONTHLY SUMMARY (Only employees with attendance)
// ============================================
exports.getMonthlySummary = async (req, res) => {
    try {
        const {
            year,
            month,
            department_id,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        
        // Get total days in the month (calendar days)
        const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        const totalWorkingDays = getWorkingDaysInMonth(targetYear, targetMonth);

        // Build query for attendance records with employee join
        let query = `
            SELECT 
                ar.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                d.name as department_name,
                COALESCE(ar.late_minutes, 0) as late_minutes,
                COALESCE(ar.absence_days, 0) as absence_days,
                COALESCE(ar.weekend_ot_minutes, 0) as weekend_ot_minutes,
                COALESCE(ar.holiday_ot_minutes, 0) as holiday_ot_minutes,
                ar.period_start_date,
                ar.period_end_date,
                ar.period_days
            FROM attendance_records ar
            INNER JOIN employees e ON e.employee_id = ar.employee_id
            LEFT JOIN departments d ON d.department_id = e.department_id
            WHERE ar.period_year = :year 
                AND ar.period_month = :month
        `;

        const replacements = {
            year: targetYear,
            month: targetMonth
        };

        if (department_id) {
            query += ` AND e.department_id = :departmentId`;
            replacements.departmentId = parseInt(department_id);
        }

        if (search && search.trim()) {
            query += ` AND (e.employee_code ILIKE :search OR e.first_name ILIKE :search OR e.last_name ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }

        query += ` ORDER BY e.first_name ASC`;

        const [records] = await sequelize.query(query, { replacements });

        // Format the response
        const formattedRows = records.map(record => {
            const importedDays = record.period_days || 0;
            const absenceDays = parseFloat(record.absence_days) || 0;
            
            // CORRECT: Present days = Imported days - Absence days
            const daysPresent = importedDays - absenceDays;
            const missingDays = totalDaysInMonth - importedDays;
            
            // Attendance rate based ONLY on imported days
            const attendanceRate = importedDays > 0 ? ((daysPresent / importedDays) * 100).toFixed(1) : 0;
            
            return {
                employee_id: record.employee_id,
                employee_code: record.employee_code,
                employee_name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                department_name: record.department_name || null,
                total_days_in_month: totalDaysInMonth,
                total_working_days: totalWorkingDays,
                submitted_days: importedDays,
                days_present: daysPresent,
                days_absent: absenceDays.toFixed(1),
                missing_days: missingDays,
                late_minutes: parseInt(record.late_minutes) || 0,
                weekend_ot_hours: ((parseInt(record.weekend_ot_minutes) || 0) / 60).toFixed(1),
                holiday_ot_hours: ((parseInt(record.holiday_ot_minutes) || 0) / 60).toFixed(1),
                attendance_rate: attendanceRate,
                is_complete: importedDays === totalDaysInMonth
            };
        });

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const paginatedRecords = formattedRows.slice(offset, offset + parseInt(limit));

        res.status(200).json({
            success: true,
            data: paginatedRecords,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: formattedRows.length,
                totalPages: Math.ceil(formattedRows.length / parseInt(limit))
            },
            month_info: {
                year: targetYear,
                month: targetMonth,
                month_name: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' }),
                total_days_in_month: totalDaysInMonth,
                total_working_days: totalWorkingDays
            }
        });

    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// ============================================
// 4. GET IMPORT BATCHES
// ============================================
exports.getImportBatches = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ImportBatch.findAndCountAll({
      limit: parseInt(limit),
      offset: offset,
      order: [["import_date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get import batches error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 5. GET IMPORT BATCH DETAILS
// ============================================
exports.getImportBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ImportBatch.findByPk(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: "Import batch not found",
      });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error("Get import batch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 6. GET IMPORT ERRORS
// ============================================
exports.getImportErrors = async (req, res) => {
  try {
    const { batch_id, resolved = false, page = 1, limit = 10 } = req.query;

    let whereClause = { is_resolved: resolved === "true" };

    if (batch_id) {
      whereClause.import_batch_id = parseInt(batch_id);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ImportError.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get import errors error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 7. RESOLVE IMPORT ERROR
// ============================================
exports.resolveImportError = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const error = await ImportError.findByPk(id);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: "Import error not found",
      });
    }

    await error.update(
      {
        is_resolved: true,
        resolved_at: new Date(),
        resolution_notes: resolution_notes,
      },
      { transaction },
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Error resolved successfully",
      data: error,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Resolve error error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 8. DELETE ATTENDANCE RECORD
// ============================================
exports.deleteAttendanceRecord = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findByPk(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found",
      });
    }

    await record.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Delete attendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 9. UPDATE ATTENDANCE RECORD (EDIT)
// ============================================
exports.updateAttendanceRecord = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      late_minutes,
      absence_days,
      weekend_ot_minutes,
      holiday_ot_minutes,
    } = req.body;

    const record = await AttendanceRecord.findByPk(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found",
      });
    }

    // Update only provided fields
    const updateData = {};
    if (late_minutes !== undefined) updateData.late_minutes = late_minutes;
    if (absence_days !== undefined) updateData.absence_days = absence_days;
    if (weekend_ot_minutes !== undefined)
      updateData.weekend_ot_minutes = weekend_ot_minutes;
    if (holiday_ot_minutes !== undefined)
      updateData.holiday_ot_minutes = holiday_ot_minutes;

    await record.update(updateData, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Attendance record updated successfully",
      data: record,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Update attendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// ============================================
// 10. GET SALARY DATA
// ============================================
exports.getSalaryData = async (req, res) => {
    try {
        const {
            employee_id,
            department_id,
            year,
            month
        } = req.query;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

        let whereClause = {
            period_year: targetYear,
            period_month: targetMonth,
            is_valid: true
        };
        
        if (employee_id) {
            whereClause.employee_id = parseInt(employee_id);
        }
        
        // Get all attendance records for the period
        const records = await AttendanceRecord.findAll({
            where: whereClause,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['employee_code', 'first_name', 'last_name', 'department_id', 'basic_salary']
                }
            ]
        });

        // Apply department filter
        let filteredRecords = records;
        if (department_id) {
            filteredRecords = records.filter(r => r.employee && r.employee.department_id === parseInt(department_id));
        }

        const totalWorkingDays = getWorkingDaysInMonth(targetYear, targetMonth);
        
        const formattedRecords = filteredRecords.map(record => {
            const employee = record.employee;
            const daysPresent = totalWorkingDays - (record.absence_days || 0);
            const attendanceRate = totalWorkingDays > 0 ? ((daysPresent / totalWorkingDays) * 100).toFixed(1) : 0;
            
            // Salary calculations (example)
            const basicSalary = employee ? (parseFloat(employee.basic_salary) || 0) : 0;
            const dailyRate = basicSalary / totalWorkingDays;
            const hourlyRate = dailyRate / 8;
            
            const absenceDeduction = (record.absence_days || 0) * dailyRate;
            const lateDeduction = ((record.late_minutes || 0) / 60) * hourlyRate * 0.5;
            const weekendOtPayment = ((record.weekend_ot_minutes || 0) / 60) * hourlyRate * 2;
            const holidayOtPayment = ((record.holiday_ot_minutes || 0) / 60) * hourlyRate * 3;
            
            const netSalary = basicSalary - absenceDeduction - lateDeduction + weekendOtPayment + holidayOtPayment;
            
            return {
                employee_id: record.employee_id,
                employee_code: employee?.employee_code || null,
                employee_name: employee ? `${employee.first_name} ${employee.last_name}` : null,
                department_name: employee?.Department?.name || null,
                basic_salary: basicSalary,
                total_working_days: totalWorkingDays,
                days_present: daysPresent,
                days_absent: (record.absence_days || 0).toFixed(1),
                late_minutes: record.late_minutes || 0,
                late_hours: ((record.late_minutes || 0) / 60).toFixed(1),
                weekend_ot_hours: ((record.weekend_ot_minutes || 0) / 60).toFixed(1),
                holiday_ot_hours: ((record.holiday_ot_minutes || 0) / 60).toFixed(1),
                daily_rate: dailyRate.toFixed(2),
                hourly_rate: hourlyRate.toFixed(2),
                absence_deduction: absenceDeduction.toFixed(2),
                late_deduction: lateDeduction.toFixed(2),
                weekend_ot_payment: weekendOtPayment.toFixed(2),
                holiday_ot_payment: holidayOtPayment.toFixed(2),
                net_salary: netSalary.toFixed(2),
                attendance_rate: attendanceRate
            };
        });

        const summary = {
            total_employees: formattedRecords.length,
            total_late_minutes: formattedRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
            total_absence_days: formattedRecords.reduce((sum, r) => sum + parseFloat(r.days_absent), 0),
            total_weekend_ot_hours: formattedRecords.reduce((sum, r) => sum + parseFloat(r.weekend_ot_hours), 0),
            total_holiday_ot_hours: formattedRecords.reduce((sum, r) => sum + parseFloat(r.holiday_ot_hours), 0),
            total_net_salary: formattedRecords.reduce((sum, r) => sum + parseFloat(r.net_salary), 0).toFixed(2)
        };

        res.status(200).json({
            success: true,
            data: formattedRecords,
            summary: summary,
            period: { year: targetYear, month: targetMonth, month_name: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' }), total_working_days: totalWorkingDays }
        });

    } catch (error) {
        console.error('Get salary data error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 11. GET EMPLOYEE ATTENDANCE SUMMARY
// ============================================
exports.getEmployeeAttendanceSummary = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ 
                success: false, 
                error: 'Year and month are required' 
            });
        }

        const record = await AttendanceRecord.findOne({
            where: {
                employee_id: parseInt(employeeId),
                period_year: parseInt(year),
                period_month: parseInt(month)
            }
        });

        if (!record) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No attendance record found for this period'
            });
        }

        const totalWorkingDays = getWorkingDaysInMonth(parseInt(year), parseInt(month));
        const daysPresent = totalWorkingDays - (record.absence_days || 0);
        const attendanceRate = totalWorkingDays > 0 ? ((daysPresent / totalWorkingDays) * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                employee_id: record.employee_id,
                year: record.period_year,
                month: record.period_month,
                total_working_days: totalWorkingDays,
                days_present: daysPresent,
                days_absent: record.absence_days || 0,
                late_minutes: record.late_minutes || 0,
                weekend_ot_hours: ((record.weekend_ot_minutes || 0) / 60).toFixed(1),
                holiday_ot_hours: ((record.holiday_ot_minutes || 0) / 60).toFixed(1),
                attendance_rate: attendanceRate
            }
        });

    } catch (error) {
        console.error('Get employee summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 12. GET DEPARTMENT ATTENDANCE SUMMARY
// ============================================
exports.getDepartmentAttendanceSummary = async (req, res) => {
    try {
        const { departmentId } = req.params;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ 
                success: false, 
                error: 'Year and month are required' 
            });
        }

        const targetYear = parseInt(year);
        const targetMonth = parseInt(month);
        const totalWorkingDays = getWorkingDaysInMonth(targetYear, targetMonth);

        const records = await AttendanceRecord.findAll({
            where: {
                period_year: targetYear,
                period_month: targetMonth,
                is_valid: true
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    where: { department_id: parseInt(departmentId) },
                    attributes: ['employee_code', 'first_name', 'last_name', 'department_id'],
                    include: [
                        {
                            model: Department,
                            as: 'Department',
                            attributes: ['name']
                        }
                    ]
                }
            ]
        });

        const formattedRecords = records.map(record => {
            const employee = record.employee;
            const daysPresent = totalWorkingDays - (record.absence_days || 0);
            
            return {
                employee_id: record.employee_id,
                employee_code: employee?.employee_code || null,
                employee_name: employee ? `${employee.first_name} ${employee.last_name}` : null,
                total_working_days: totalWorkingDays,
                days_present: daysPresent,
                days_absent: (record.absence_days || 0).toFixed(1),
                late_minutes: record.late_minutes || 0,
                weekend_ot_hours: ((record.weekend_ot_minutes || 0) / 60).toFixed(1),
                holiday_ot_hours: ((record.holiday_ot_minutes || 0) / 60).toFixed(1),
                attendance_rate: totalWorkingDays > 0 ? ((daysPresent / totalWorkingDays) * 100).toFixed(1) : 0
            };
        });

        const summary = {
            department_id: parseInt(departmentId),
            department_name: records[0]?.employee?.Department?.name || 'N/A',
            total_employees: formattedRecords.length,
            total_late_minutes: formattedRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
            total_absence_days: formattedRecords.reduce((sum, r) => sum + parseFloat(r.days_absent), 0),
            avg_attendance_rate: formattedRecords.length > 0 
                ? (formattedRecords.reduce((sum, r) => sum + parseFloat(r.attendance_rate), 0) / formattedRecords.length).toFixed(1)
                : 0
        };

        res.status(200).json({
            success: true,
            data: formattedRecords,
            summary: summary,
            period: { year: targetYear, month: targetMonth }
        });

    } catch (error) {
        console.error('Get department summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 13. GET ATTENDANCE STATISTICS
// ============================================
exports.getAttendanceStatistics = async (req, res) => {
    try {
        const { year, month, department_id, search } = req.query;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const totalWorkingDays = getWorkingDaysInMonth(targetYear, targetMonth);

        let whereClause = {
            period_year: targetYear,
            period_month: targetMonth,
            is_valid: true
        };

        // Get employee filter
        let employeeWhere = {};
        if (department_id) {
            employeeWhere.department_id = parseInt(department_id);
        }
        if (search && search.trim()) {
            employeeWhere[Op.or] = [
                { first_name: { [Op.iLike]: `%${search.trim()}%` } },
                { last_name: { [Op.iLike]: `%${search.trim()}%` } },
                { employee_code: { [Op.iLike]: `%${search.trim()}%` } }
            ];
        }

        // Get filtered employees
        const employees = await Employee.findAll({
            where: employeeWhere,
            attributes: ['employee_id']
        });
        const employeeIds = employees.map(e => e.employee_id);

        if (employeeIds.length > 0) {
            whereClause.employee_id = { [Op.in]: employeeIds };
        } else if (Object.keys(employeeWhere).length > 0) {
            return res.status(200).json({
                success: true,
                data: {
                    total_employees: 0,
                    total_records: 0,
                    total_working_days: totalWorkingDays,
                    total_late_minutes: 0,
                    total_absence_days: 0,
                    total_weekend_ot_hours: 0,
                    total_holiday_ot_hours: 0,
                    avg_attendance_rate: 0
                },
                period: { year: targetYear, month: targetMonth }
            });
        }

        const records = await AttendanceRecord.findAll({
            where: whereClause,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['employee_id'],
                    required: true
                }
            ]
        });

        const totalAbsenceDays = records.reduce((sum, r) => sum + (r.absence_days || 0), 0);
        const totalPresentDays = (records.length * totalWorkingDays) - totalAbsenceDays;

        const statistics = {
            total_employees: records.length,
            total_records: records.length,
            total_working_days: totalWorkingDays,
            total_late_minutes: records.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
            total_absence_days: totalAbsenceDays,
            total_weekend_ot_hours: records.reduce((sum, r) => sum + ((r.weekend_ot_minutes || 0) / 60), 0).toFixed(1),
            total_holiday_ot_hours: records.reduce((sum, r) => sum + ((r.holiday_ot_minutes || 0) / 60), 0).toFixed(1),
            avg_attendance_rate: (records.length * totalWorkingDays) > 0 
                ? ((totalPresentDays / (records.length * totalWorkingDays)) * 100).toFixed(1)
                : 0
        };

        res.status(200).json({
            success: true,
            data: statistics,
            period: { year: targetYear, month: targetMonth, month_name: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' }), total_working_days: totalWorkingDays }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};