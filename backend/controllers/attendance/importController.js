const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const moment = require('moment');
const { Op } = require('sequelize');
const db = require('../../models');

// Debug logging
console.log('=== DB MODELS DEBUG ===');
console.log('Available models:', Object.keys(db));
console.log('daily_attendance exists?', !!db.daily_attendance);
console.log('daily_attendance type:', typeof db.daily_attendance);

const import_batches = db.import_batches;
const machine_raw_imports = db.machine_raw_imports;
const daily_attendance = db.daily_attendance;
const import_errors = db.import_errors;
const attendance_audit_log = db.attendance_audit_log;
const employees = db.Employee;
const Employee = db.Employee;
// ============================================
// 1. MAIN IMPORT FUNCTION
// ============================================
exports.importAttendanceFile = async (req, res) => {
    const transaction = await import_batches.sequelize.transaction();
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        // Create import batch record
        const batch = await import_batches.create({
            file_name: req.file.originalname,
            import_date: new Date(),
            import_type: req.body.import_type || 'daily',
            status: 'processing',
            started_at: new Date(),
            processed_by: req.user?.userId || null
        }, { transaction });

        // Parse file based on extension
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let rawData = [];

        if (fileExt === '.csv') {
            rawData = await parseCSV(req.file.path);
        } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            rawData = parseExcel(req.file.path);
        } else {
            throw new Error('Unsupported file format. Please upload CSV or Excel file.');
        }

        console.log(`Parsed ${rawData.length} rows from ${req.file.originalname}`);

        // Process each row
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const result = await processImportRow(row, batch.id, i + 2, transaction);
            
            if (result.success) {
                successCount++;
                console.log(`Row ${i + 2}: SUCCESS`);
            } else {
                errorCount++;
                await logImportError(batch.id, i + 2, row, result.error, transaction);
                console.log(`Row ${i + 2}: FAILED - ${result.error}`);
            }
        }

        // Update batch record
        await batch.update({
            total_records: rawData.length,
            success_records: successCount,
            error_records: errorCount,
            status: 'completed',
            completed_at: new Date()
        }, { transaction });

        await transaction.commit();

        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            message: `Import completed: ${successCount} successful, ${errorCount} failed`,
            data: {
                batch_id: batch.id,
                total: rawData.length,
                success: successCount,
                failed: errorCount
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Import error:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 2. PARSE CSV FILE
// ============================================
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

// ============================================
// 3. PARSE EXCEL FILE
// ============================================
const parseExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
};

// ============================================
// 4. PROCESS SINGLE ROW
// ============================================
const processImportRow = async (row, batchId, rowNumber, transaction) => {
    try {
        const employeeCode = row['Employee ID'] || row['employee_id'] || row['EmployeeId'];
        const punchTimeStr = row['Punch Time'] || row['punch_time'] || row['DateTime'];
        const punchState = row['Punch State'] || row['punch_state'] || row['State'];

        if (!employeeCode) throw new Error('Employee ID missing');
        if (!punchTimeStr) throw new Error('Punch time missing');
        if (!punchState) throw new Error('Punch state missing');

        const punchTime = parsePunchTime(punchTimeStr);
        if (!punchTime) throw new Error(`Invalid date: ${punchTimeStr}`);

        // Find employee - database column is employee_code
        const employee = await employees.findOne({
            where: { employee_code: employeeCode }
        });
        
        if (!employee) throw new Error(`Employee not found: ${employeeCode}`);

        // Get the employee ID - Sequelize returns camelCase property names
        const employeeId = employee.employeeId || employee.id || employee.employee_id;
        
        console.log(`Found employee: ${employeeCode} -> ID: ${employeeId}`);

        // Save raw record
        await machine_raw_imports.create({
            employee_code: employeeCode,
            punch_time: punchTime,
            punch_type: normalizePunchType(punchState),
            import_batch_id: batchId,
            row_number: rowNumber,
            employee_id: employeeId,
            is_processed: true,
            processed_at: new Date()
        }, { transaction });

        // Update daily attendance
        await updateDailyAttendance(employeeId, punchTime, punchState, transaction);

        return { success: true };

    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================
// 5. UPDATE DAILY ATTENDANCE
// ============================================
const updateDailyAttendance = async (employeeId, punchTime, punchState, transaction) => {
    try {
        const attendanceDate = punchTime.toISOString().split('T')[0];
        const punchType = normalizePunchType(punchState);
        
        let [attendance, created] = await daily_attendance.findOrCreate({
            where: { employee_id: employeeId, attendance_date: attendanceDate },
            defaults: { employee_id: employeeId, attendance_date: attendanceDate },
            transaction
        });
        
        const updateData = {};
        
        switch (punchType) {
            case 'Check In':
                // Check for duplicate
                if (attendance.first_check_in) {
                    throw new Error(`Duplicate check-in for ${attendanceDate}. Employee already checked in at ${formatTime(attendance.first_check_in)}`);
                }
                
                // Check if trying to check in after checking out
                if (attendance.last_check_out) {
                    throw new Error(`Cannot check in: Employee already checked out at ${formatTime(attendance.last_check_out)}`);
                }
                
                updateData.first_check_in = punchTime;
                break;
                
            case 'Check Out':
                // Check for duplicate
                if (attendance.last_check_out) {
                    throw new Error(`Duplicate check-out for ${attendanceDate}. Employee already checked out at ${formatTime(attendance.last_check_out)}`);
                }
                
                // Must have check-in first
                if (!attendance.first_check_in) {
                    throw new Error(`Cannot check out: No check-in record found for ${attendanceDate}`);
                }
                
                // Can't check out before check-in
                if (new Date(punchTime) <= new Date(attendance.first_check_in)) {
                    throw new Error(`Check-out time (${formatTime(punchTime)}) cannot be before check-in time (${formatTime(attendance.first_check_in)})`);
                }
                
                // Can't check out while on break
                if (attendance.break_out_time && !attendance.break_in_time) {
                    throw new Error(`Cannot check out: Employee is currently on break (started at ${formatTime(attendance.break_out_time)})`);
                }
                
                updateData.last_check_out = punchTime;
                break;
                
            case 'Break Out':
                // Check for duplicate
                if (attendance.break_out_time) {
                    throw new Error(`Duplicate break-out for ${attendanceDate}. Employee already started break at ${formatTime(attendance.break_out_time)}`);
                }
                
                // Must have check-in first
                if (!attendance.first_check_in) {
                    throw new Error(`Cannot start break: No check-in record found for ${attendanceDate}`);
                }
                
                // Can't start break after check-out
                if (attendance.last_check_out && new Date(punchTime) > new Date(attendance.last_check_out)) {
                    throw new Error(`Cannot start break after check-out time (${formatTime(attendance.last_check_out)})`);
                }
                
                updateData.break_out_time = punchTime;
                break;
                
            case 'Break In':
                // Check for duplicate
                if (attendance.break_in_time) {
                    throw new Error(`Duplicate break-in for ${attendanceDate}. Employee already ended break at ${formatTime(attendance.break_in_time)}`);
                }
                
                // Must have break-out first
                if (!attendance.break_out_time) {
                    throw new Error(`Cannot end break: No break-out record found for ${attendanceDate}`);
                }
                
                // Break-in must be after break-out
                if (new Date(punchTime) <= new Date(attendance.break_out_time)) {
                    throw new Error(`Break-in time (${formatTime(punchTime)}) must be after break-out time (${formatTime(attendance.break_out_time)})`);
                }
                
                // Can't end break after check-out
                if (attendance.last_check_out && new Date(punchTime) > new Date(attendance.last_check_out)) {
                    throw new Error(`Cannot end break after check-out time (${formatTime(attendance.last_check_out)})`);
                }
                
                updateData.break_in_time = punchTime;
                
                // Calculate break duration
                const breakDuration = (new Date(punchTime) - new Date(attendance.break_out_time)) / (1000 * 60);
                if (breakDuration > 120) { // More than 2 hours
                    console.warn(`Warning: Long break duration: ${breakDuration} minutes for employee ${employeeId}`);
                }
                break;
        }
        
        // Rest of your calculation logic...
        if (Object.keys(updateData).length > 0) {
            await attendance.update(updateData, { transaction });
        }
        
        return attendance;
        
    } catch (error) {
        console.error('Validation error:', error.message);
        throw error;
    }
};

// ============================================
// 6. PARSE PUNCH TIME (handles multiple formats)
// ============================================
const parsePunchTime = (timeStr) => {
    if (!timeStr) return null;
    
    // Handle Excel serial number (e.g., 45221.31944)
    if (typeof timeStr === 'number' || !isNaN(parseFloat(timeStr))) {
        const excelDate = parseFloat(timeStr);
        const excelEpoch = new Date(1899, 11, 30);
        const daysOffset = excelDate;
        const milliseconds = daysOffset * 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + milliseconds);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Handle string date formats
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    
    // Handle MM/DD/YYYY HH:MM format
    const match = timeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    if (match) {
        return new Date(match[3], match[1] - 1, match[2], match[4], match[5]);
    }
    
    return null;
};

// ============================================
// 7. NORMALIZE PUNCH TYPE
// ============================================
const normalizePunchType = (punchState) => {
    const state = String(punchState).toLowerCase();
    if (state.includes('check in') || state === 'check-in') return 'Check In';
    if (state.includes('check out') || state === 'check-out') return 'Check Out';
    if (state.includes('break out')) return 'Break Out';
    if (state.includes('break in')) return 'Break In';
    return 'Check In';
};

// ============================================
// 8. LOG IMPORT ERRORS
// ============================================
const logImportError = async (batchId, rowNumber, rowData, errorMessage, transaction) => {
    await import_errors.create({
        import_batch_id: batchId,
        row_number: rowNumber,
        employee_code: rowData['Employee ID'] || rowData['employee_id'],
        error_type: 'validation_error',
        error_message: errorMessage,
        raw_data: rowData,
        created_at: new Date()
    }, { transaction });
};

// ============================================
// 9. GET IMPORT STATUS
// ============================================
exports.getImportStatus = async (req, res) => {
    try {
        const { batchId } = req.params;
        const batch = await import_batches.findByPk(batchId);
        if (!batch) {
            return res.status(404).json({ success: false, error: 'Batch not found' });
        }
        
        const errors = await import_errors.findAll({
            where: { import_batch_id: batchId, is_resolved: false },
            limit: 100
        });
        
        res.status(200).json({
            success: true,
            data: { batch, errors, error_count: errors.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 10. REPROCESS FAILED ROWS
// ============================================
exports.reprocessFailedRows = async (req, res) => {
    const transaction = await import_batches.sequelize.transaction();
    
    try {
        const { batchId } = req.params;
        
        const failedRows = await import_errors.findAll({
            where: { import_batch_id: batchId, is_resolved: false }
        });
        
        let successCount = 0;
        
        for (const error of failedRows) {
            const result = await processImportRow(
                error.raw_data, 
                batchId, 
                error.row_number, 
                transaction
            );
            
            if (result.success) {
                await error.update({ is_resolved: true, resolved_at: new Date() }, { transaction });
                successCount++;
            }
        }
        
        await transaction.commit();
        
        res.status(200).json({
            success: true,
            message: `Reprocessed ${successCount} of ${failedRows.length} failed rows`,
            data: { success: successCount, total: failedRows.length }
        });
        
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 11. GET DAILY ATTENDANCE
// ============================================
exports.getDailyAttendance = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            employeeId,
            search,
            departmentId,
            status,
            page = 1,
            limit = 20
        } = req.query;
        
        console.log('=== GET DAILY ATTENDANCE ===');
        console.log('Received params:', { startDate, endDate, employeeId, search, departmentId, status, page, limit });
        
        // Base SQL query
        let sql = `
            SELECT 
                d.id,
                d.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.department_id,
                dep.name as department_name,
                d.attendance_date,
                d.first_check_in,
                d.last_check_out,
                d.break_out_time,
                d.break_in_time,
                d.total_hours,
                d.late_minutes,
                d.morning_status,
                d.afternoon_status,
                d.is_half_day,
                d.half_day_type,
                d.created_at,
                d.updated_at
            FROM daily_attendance d
            INNER JOIN employees e ON e.employee_id = d.employee_id
            LEFT JOIN departments dep ON dep.department_id = e.department_id
            WHERE 1=1
        `;
        
        const replacements = {};
        let whereConditions = [];
        
        // Date range filter
        if (startDate && endDate) {
            whereConditions.push(`d.attendance_date BETWEEN :startDate AND :endDate`);
            replacements.startDate = startDate;
            replacements.endDate = endDate;
        }
        
        // Employee ID filter
        if (employeeId && employeeId !== 'null' && employeeId !== 'undefined') {
            whereConditions.push(`d.employee_id = :employeeId`);
            replacements.employeeId = parseInt(employeeId);
        }
        
        // Department filter - FIXED: Handle different possible values
        if (departmentId && departmentId !== 'null' && departmentId !== 'undefined' && departmentId !== '') {
            const deptId = parseInt(departmentId);
            if (!isNaN(deptId)) {
                whereConditions.push(`e.department_id = :departmentId`);
                replacements.departmentId = deptId;
                console.log('✅ Adding department filter for ID:', deptId);
            }
        }
        
        // Search filter (employee code or name)
        if (search && search.trim()) {
            whereConditions.push(`(e.employee_code ILIKE :search OR e.first_name ILIKE :search OR e.last_name ILIKE :search OR e.first_name || ' ' || e.last_name ILIKE :search)`);
            replacements.search = `%${search.trim()}%`;
        }
        
        // Status filter
        if (status && status !== 'null' && status !== 'undefined' && status !== '') {
            switch(status) {
                case 'present':
                    whereConditions.push(`d.morning_status = 'present' AND d.afternoon_status = 'present' AND d.is_half_day = false`);
                    break;
                case 'late':
                    whereConditions.push(`d.late_minutes > 0 AND d.is_half_day = false`);
                    break;
                case 'half_day':
                    whereConditions.push(`d.is_half_day = true`);
                    break;
                case 'absent':
                    whereConditions.push(`d.morning_status = 'absent' AND d.afternoon_status = 'absent'`);
                    break;
                default:
                    // Do nothing
                    break;
            }
        }
        
        // Add WHERE clause if conditions exist
        if (whereConditions.length > 0) {
            sql += ` AND ` + whereConditions.join(' AND ');
        }
        
        console.log('Final SQL:', sql);
        console.log('Replacements:', replacements);
        
        // Get total count for pagination
        let countSql = sql.replace(
            /SELECT[\s\S]*?FROM/,
            'SELECT COUNT(*) as total FROM'
        );
        
        const [countResult] = await db.sequelize.query(countSql, { replacements });
        const total = parseInt(countResult[0]?.total || 0);
        
        // Add pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        sql += ` ORDER BY d.attendance_date DESC LIMIT :limit OFFSET :offset`;
        replacements.limit = parseInt(limit);
        replacements.offset = offset;
        
        const [records] = await db.sequelize.query(sql, { replacements });
        
        console.log(`Found ${records.length} records out of ${total} total`);
        
        // Format the response
        const formattedRecords = records.map(record => ({
            id: record.id,
            employee_id: record.employee_id,
            employee_code: record.employee_code || 'N/A',
            employee_name: record.first_name ? `${record.first_name} ${record.last_name}` : 'Unknown',
            department_id: record.department_id,
            department: record.department_name || 'N/A',
            attendance_date: record.attendance_date,
            first_check_in: record.first_check_in,
            last_check_out: record.last_check_out,
            break_out_time: record.break_out_time,
            break_in_time: record.break_in_time,
            total_hours: parseFloat(record.total_hours),
            late_minutes: record.late_minutes,
            morning_status: record.morning_status,
            afternoon_status: record.afternoon_status,
            is_half_day: record.is_half_day,
            half_day_type: record.half_day_type,
            created_at: record.created_at,
            updated_at: record.updated_at
        }));
        
        res.status(200).json({
            success: true,
            data: formattedRecords,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                search: search || null,
                departmentId: departmentId || null,
                status: status || null
            }
        });
        
    } catch (error) {
        console.error('Get daily attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// GET WEEKLY ATTENDANCE SUMMARY (FULLY FIXED)
// ============================================
exports.getWeeklyAttendance = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            employeeId,
            departmentId,
            search,
            page = 1,
            limit = 20
        } = req.query;
        
        let whereClause = `WHERE d.attendance_date BETWEEN :startDate AND :endDate`;
        const replacements = {
            startDate: startDate,
            endDate: endDate
        };
        
        if (employeeId && employeeId !== 'null' && employeeId !== 'undefined') {
            whereClause += ` AND d.employee_id = :employeeId`;
            replacements.employeeId = parseInt(employeeId);
        }
        
        if (departmentId && departmentId !== 'null' && departmentId !== 'undefined' && departmentId !== '') {
            const deptId = parseInt(departmentId);
            if (!isNaN(deptId)) {
                whereClause += ` AND e.department_id = :departmentId`;
                replacements.departmentId = deptId;
            }
        }
        
        if (search && search.trim()) {
            whereClause += ` AND (e.employee_code ILIKE :search OR e.first_name ILIKE :search OR e.last_name ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }
        
        const sql = `
            WITH weekly_data AS (
                SELECT 
                    e.employee_id,
                    e.employee_code,
                    e.first_name,
                    e.last_name,
                    dep.name as department_name,
                    DATE_PART('year', d.attendance_date) as year,
                    DATE_PART('week', d.attendance_date) as week_number,
                    MIN(DATE_TRUNC('week', d.attendance_date))::date as week_start_date,
                    COUNT(DISTINCT d.attendance_date) as total_days_with_records,
                    SUM(CASE WHEN d.is_half_day = true THEN 0.5 ELSE 1 END) as effective_days,
                    COALESCE(SUM(d.total_hours), 0) as total_hours,
                    COALESCE(SUM(d.late_minutes), 0) as total_late_minutes,
                    COUNT(CASE WHEN d.late_minutes > 0 THEN 1 END) as late_days,
                    COUNT(CASE WHEN d.is_half_day = true THEN 1 END) as half_days
                FROM daily_attendance d
                INNER JOIN employees e ON e.employee_id = d.employee_id
                LEFT JOIN departments dep ON dep.department_id = e.department_id
                ${whereClause}
                GROUP BY 
                    e.employee_id,
                    e.employee_code,
                    e.first_name,
                    e.last_name,
                    dep.name,
                    DATE_PART('year', d.attendance_date),
                    DATE_PART('week', d.attendance_date)
            )
            SELECT 
                employee_id,
                employee_code,
                first_name,
                last_name,
                department_name,
                year,
                week_number,
                week_start_date as week_start,
                (week_start_date + INTERVAL '6 days')::date as week_end,
                total_days_with_records,
                effective_days,
                total_hours,
                total_late_minutes,
                late_days,
                half_days
            FROM weekly_data
            ORDER BY year DESC, week_number DESC
        `;
        
        const [records] = await db.sequelize.query(sql, { replacements });
        
        // Helper function to get working days in a week (Monday to Saturday)
        const getWorkingDaysInWeek = (weekStart, weekEnd) => {
            if (!weekStart || !weekEnd) return 6;
            
            const start = new Date(weekStart);
            const end = new Date(weekEnd);
            let workingDays = 0;
            
            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dayOfWeek = currentDate.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 6) {
                    workingDays++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return workingDays;
        };
        
        // Format all records to match Vue template expectations
        let allFormattedRecords = records.map(record => {
            const weekStart = record.week_start;
            const weekEnd = record.week_end;
            const totalWorkingDays = getWorkingDaysInWeek(weekStart, weekEnd);
            const totalDaysWithRecords = parseInt(record.total_days_with_records);
            const halfDays = parseInt(record.half_days);
            
            // Calculations
            const daysPresent = totalDaysWithRecords - halfDays;
            const daysAbsent = totalWorkingDays - (daysPresent + (halfDays * 0.5));
            const effectiveTotalDays = daysPresent + (halfDays * 0.5);
            const attendanceRate = totalWorkingDays > 0 
                ? ((effectiveTotalDays / totalWorkingDays) * 100).toFixed(1)
                : '0.0';
            
            return {
                employee_id: record.employee_id,
                employee_code: record.employee_code,
                employee_name: `${record.first_name} ${record.last_name}`.trim(),
                department: record.department_name || 'N/A',
                year: parseInt(record.year),
                week_number: parseInt(record.week_number),
                week_start: weekStart ? new Date(weekStart).toISOString().split('T')[0] : null,
                week_end: weekEnd ? new Date(weekEnd).toISOString().split('T')[0] : null,
                total_working_days: totalWorkingDays,
                days_present: daysPresent,
                days_absent: daysAbsent.toFixed(1),
                effective_days: parseFloat(record.effective_days).toFixed(1),
                total_hours: parseFloat(record.total_hours).toFixed(1),
                total_late_minutes: parseInt(record.total_late_minutes),
                late_days: parseInt(record.late_days),
                half_days: halfDays,
                attendance_rate: attendanceRate
            };
        });
        
        // Remove duplicates
        const uniqueRecords = [];
        const seen = new Set();
        
        for (const record of allFormattedRecords) {
            const key = `${record.employee_id}-${record.year}-${record.week_number}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRecords.push(record);
            }
        }
        
        allFormattedRecords = uniqueRecords;
        
        // Apply pagination
        const total = allFormattedRecords.length;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const paginatedRecords = allFormattedRecords.slice(offset, offset + parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: paginatedRecords,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            summary: calculateOverallWeeklySummary(paginatedRecords)
        });
        
    } catch (error) {
        console.error('Get weekly attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// GET MONTHLY ATTENDANCE SUMMARY (COMPLETELY FIXED)
// ============================================
exports.getMonthlyAttendance = async (req, res) => {
    try {
        const { 
            year, 
            month, 
            employeeId,
            departmentId,
            search,
            page = 1,
            limit = 20
        } = req.query;
        
        // Parse the target year and month from request
        let targetYear, targetMonth;
        
        if (year && year !== 'null' && year !== 'undefined') {
            targetYear = parseInt(year);
        } else {
            targetYear = new Date().getFullYear();
        }
        
        if (month && month !== 'null' && month !== 'undefined') {
            targetMonth = parseInt(month);
        } else {
            // If no month specified, return all months for the year
            targetMonth = null;
        }
        
        // Build the WHERE clause
        let whereClause = `WHERE 1=1`;
        const replacements = {};
        
        if (targetYear) {
            whereClause += ` AND EXTRACT(YEAR FROM d.attendance_date) = :year`;
            replacements.year = targetYear;
        }
        
        if (targetMonth) {
            whereClause += ` AND EXTRACT(MONTH FROM d.attendance_date) = :month`;
            replacements.month = targetMonth;
        }
        
        if (employeeId && employeeId !== 'null' && employeeId !== 'undefined') {
            whereClause += ` AND d.employee_id = :employeeId`;
            replacements.employeeId = parseInt(employeeId);
        }
        
        if (departmentId && departmentId !== 'null' && departmentId !== 'undefined' && departmentId !== '') {
            const deptId = parseInt(departmentId);
            if (!isNaN(deptId)) {
                whereClause += ` AND e.department_id = :departmentId`;
                replacements.departmentId = deptId;
            }
        }
        
        if (search && search.trim()) {
            whereClause += ` AND (e.employee_code ILIKE :search OR e.first_name ILIKE :search OR e.last_name ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }
        
        // For monthly summary, group by year and month
        const sql = `
            SELECT 
                e.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                dep.name as department_name,
                EXTRACT(YEAR FROM d.attendance_date) as year,
                EXTRACT(MONTH FROM d.attendance_date) as month,
                COUNT(DISTINCT d.attendance_date) as days_with_attendance,
                SUM(CASE WHEN d.is_half_day = true THEN 0.5 ELSE 1 END) as effective_days,
                COALESCE(SUM(d.total_hours), 0) as total_hours,
                COALESCE(SUM(d.late_minutes), 0) as total_late_minutes,
                COUNT(CASE WHEN d.late_minutes > 0 THEN 1 END) as late_days,
                COUNT(CASE WHEN d.is_half_day = true THEN 1 END) as half_days,
                MIN(d.first_check_in) as earliest_check_in,
                MAX(d.last_check_out) as latest_check_out
            FROM daily_attendance d
            INNER JOIN employees e ON e.employee_id = d.employee_id
            LEFT JOIN departments dep ON dep.department_id = e.department_id
            ${whereClause}
            GROUP BY 
                e.employee_id, 
                e.employee_code, 
                e.first_name, 
                e.last_name, 
                dep.name,
                EXTRACT(YEAR FROM d.attendance_date),
                EXTRACT(MONTH FROM d.attendance_date)
            ORDER BY year DESC, month DESC, e.first_name ASC
        `;
        
        const [records] = await db.sequelize.query(sql, { replacements });
        
        // Helper function to get working days in a month (Monday to Saturday)
        const getWorkingDaysInMonth = (year, month) => {
            const date = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0).getDate();
            let workingDays = 0;
            
            for (let day = 1; day <= lastDay; day++) {
                const currentDate = new Date(year, month - 1, day);
                const dayOfWeek = currentDate.getDay();
                // Monday(1) to Saturday(6) are working days
                if (dayOfWeek >= 1 && dayOfWeek <= 6) {
                    workingDays++;
                }
            }
            return workingDays;
        };
        
        // Format all records with CORRECT calculations
        let allFormattedRecords = records.map(record => {
            const recordYear = parseInt(record.year);
            const recordMonth = parseInt(record.month);
            const totalWorkingDays = getWorkingDaysInMonth(recordYear, recordMonth);
            const totalDaysInMonth = new Date(recordYear, recordMonth, 0).getDate();
            
            const daysWithAttendance = parseInt(record.days_with_attendance);
            const halfDays = parseInt(record.half_days);
            
            // ✅ CORRECT CALCULATIONS:
            // Full days present = Days with attendance - Half days
            const fullDaysPresent = daysWithAttendance - halfDays;
            
            // Total effective days = Full days + (Half days × 0.5)
            const effectiveTotalDays = fullDaysPresent + (halfDays * 0.5);
            
            // Absent days = Total Working Days - Effective Total Days
            const daysAbsent = totalWorkingDays - effectiveTotalDays;
            
            // Attendance rate = (Effective Total Days / Total Working Days) × 100
            const attendanceRate = totalWorkingDays > 0 
                ? ((effectiveTotalDays / totalWorkingDays) * 100).toFixed(1)
                : '0.0';
            
            // Format month start and end dates correctly
            const monthStartStr = `${recordYear}-${String(recordMonth).padStart(2, '0')}-01`;
            const monthEndStr = `${recordYear}-${String(recordMonth).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;
            
            return {
                employee_id: record.employee_id,
                employee_code: record.employee_code,
                employee_name: `${record.first_name} ${record.last_name}`.trim(),
                department: record.department_name || 'N/A',
                year: recordYear,
                month: recordMonth,
                month_name: getMonthName(recordMonth),
                month_start: monthStartStr,
                month_end: monthEndStr,
                total_days_in_month: totalDaysInMonth,
                total_working_days: totalWorkingDays,
                days_present: fullDaysPresent,
                days_absent: daysAbsent.toFixed(1),
                effective_days: effectiveTotalDays.toFixed(1),
                total_hours: parseFloat(record.total_hours).toFixed(1),
                total_late_minutes: parseInt(record.total_late_minutes),
                late_days: parseInt(record.late_days),
                half_days: halfDays,
                earliest_check_in: record.earliest_check_in,
                latest_check_out: record.latest_check_out,
                attendance_rate: attendanceRate
            };
        });
        
        // Apply pagination
        const total = allFormattedRecords.length;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const paginatedRecords = allFormattedRecords.slice(offset, offset + parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: paginatedRecords,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            summary: calculateOverallMonthlySummary(paginatedRecords, targetYear, targetMonth)
        });
        
    } catch (error) {
        console.error('Get monthly attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// HELPER FUNCTIONS FOR SUMMARIES
// ============================================

const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
};

const calculateOverallWeeklySummary = (records) => {
    if (!records || records.length === 0) return null;
    
    const totalHours = records.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0);
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.total_late_minutes || 0), 0);
    const totalAttendanceRate = records.reduce((sum, r) => sum + parseFloat(r.attendance_rate || 0), 0);
    const totalPresentDays = records.reduce((sum, r) => sum + (r.days_present || 0), 0);
    const totalAbsentDays = records.reduce((sum, r) => sum + (r.absent_days || 0), 0);
    
    return {
        total_employees: records.length,
        total_hours: totalHours.toFixed(1),
        total_late_minutes: totalLateMinutes,
        avg_attendance_rate: (totalAttendanceRate / records.length).toFixed(1),
        total_present_days: totalPresentDays,
        total_absent_days: totalAbsentDays
    };
};

const calculateOverallMonthlySummary = (records, year, month) => {
    if (!records || records.length === 0) return null;
    
    const totalHours = records.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0);
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.total_late_minutes || 0), 0);
    const totalAttendanceRate = records.reduce((sum, r) => sum + parseFloat(r.attendance_rate || 0), 0);
    const totalPresentDays = records.reduce((sum, r) => sum + (r.days_present || 0), 0);
    const totalAbsentDays = records.reduce((sum, r) => sum + (r.absent_days || 0), 0);
    const totalHalfDays = records.reduce((sum, r) => sum + (r.half_days || 0), 0);
    
    return {
        year: year ? parseInt(year) : null,
        month: month ? parseInt(month) : null,
        month_name: month ? getMonthName(parseInt(month)) : null,
        total_employees: records.length,
        total_hours: totalHours.toFixed(1),
        total_late_minutes: totalLateMinutes,
        avg_attendance_rate: (totalAttendanceRate / records.length).toFixed(1),
        total_present_days: totalPresentDays,
        total_absent_days: totalAbsentDays,
        total_half_days: totalHalfDays
    };
};

const getBasicWorkingDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    let workingDays = 0;
    
    for (let day = 1; day <= lastDay; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        // Monday(1) to Saturday(6) are working days
        // Sunday(0) is NOT a working day
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
            workingDays++;
        }
    }
    return workingDays;
};

const getWorkingDaysInWeek = (weekStart, weekEnd) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    let workingDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        // Monday(1) to Saturday(6) are working days
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
            workingDays++;
        }
    }
    return workingDays;
};