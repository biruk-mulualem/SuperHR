import { ref, onMounted, watch, computed } from 'vue';
import attendanceService from '@/stores/attendanceService';
import employeeService from '@/stores/employee';
// ============== State ==============
const activeTab = ref('records');
const loading = ref(false);
const importing = ref(false);
const isDragging = ref(false);
const showImportModal = ref(false);
const showErrorsModal = ref(false);
const showBatchDetailsModal = ref(false);
const showCorrectionModal = ref(false);
const selectedFile = ref(null);
const fileInput = ref(null);
const importResult = ref(null);
const importErrors = ref([]);
const currentBatchId = ref(null);
const selectedBatch = ref(null);
const correctionData = ref({});
const tabs = [
    { value: 'records', label: 'Attendance', icon: '📋' },
    { value: 'imports', label: 'Import History', icon: '📦' }
];
const availableYears = ref([2024, 2025, 2026, 2027]);
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Data
const attendanceRecords = ref([]);
const importBatches = ref([]);
const departments = ref([]);
const monthInfo = ref({});
// Filters
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedDepartmentId = ref(null);
const filters = ref({
    search: ''
});
const importPeriod = ref({
    startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    endDate: new Date().toISOString().split('T')[0]
});
// Pagination
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const importPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
let debounceTimer = null;
// ============== Helper Functions ==============
function formatDate(dateStr) {
    if (!dateStr)
        return '';
    return new Date(dateStr).toLocaleDateString();
}
function formatDateTime(dateStr) {
    if (!dateStr)
        return '';
    return new Date(dateStr).toLocaleString();
}
function formatTime(minutes) {
    if (!minutes)
        return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
function formatFileSize(bytes) {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function getRateClass(rate) {
    const numRate = parseFloat(rate);
    if (numRate >= 90)
        return 'rate-excellent';
    if (numRate >= 75)
        return 'rate-good';
    if (numRate >= 60)
        return 'rate-average';
    return 'rate-poor';
}
function getStatusClass(status) {
    const classes = {
        completed: 'status-success',
        processing: 'status-warning',
        failed: 'status-danger'
    };
    return classes[status] || 'status-info';
}
function onDepartmentChange(event) {
    let newValue = event?.target?.value;
    if (newValue === 'null' || newValue === '' || newValue === undefined) {
        selectedDepartmentId.value = null;
    }
    else {
        const numValue = Number(newValue);
        selectedDepartmentId.value = isNaN(numValue) ? null : numValue;
    }
    pagination.value.page = 1;
    loadData();
}
// Template Download with Normal OT
function downloadTemplate() {
    const headers = ['Employee ID', 'Late Minutes', 'Half Day Absence', 'Absence Days', 'Normal OT Minutes', 'Weekend OT Minutes', 'Holiday OT Minutes'];
    const sampleRows = [
        ['44', '15', '0', '2', '30', '0', '0'],
        ['45', '30', '0', '1', '60', '60', '0'],
        ['46', '0', '0', '0', '0', '0', '0']
    ];
    let csvContent = headers.join(',') + '\n';
    sampleRows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
}
// Load departments
async function loadDepartments() {
    try {
        const res = await employeeService.getDepartments();
        if (res.success)
            departments.value = res.data;
    }
    catch (error) {
        console.error('Failed to load departments:', error);
    }
}
// Load attendance records
async function loadAttendanceRecords() {
    loading.value = true;
    try {
        const params = {
            year: selectedYear.value,
            month: selectedMonth.value,
            page: pagination.value.page,
            limit: pagination.value.limit
        };
        if (filters.value.search && filters.value.search.trim()) {
            params.search = filters.value.search.trim();
        }
        const deptId = selectedDepartmentId.value;
        if (deptId !== null && deptId !== undefined && !isNaN(deptId) && deptId !== '') {
            params.departmentId = Number(deptId);
        }
        const res = await attendanceService.getMonthlySummary(params);
        if (res.success) {
            attendanceRecords.value = res.data;
            pagination.value = res.pagination;
            monthInfo.value = res.month_info || {};
        }
    }
    catch (error) {
        console.error('Failed to load attendance records:', error);
    }
    finally {
        loading.value = false;
    }
}
// Load import batches
async function loadImportBatches() {
    loading.value = true;
    try {
        const res = await attendanceService.getImportBatches({
            page: importPagination.value.page,
            limit: importPagination.value.limit
        });
        if (res.success) {
            importBatches.value = res.data;
            importPagination.value = res.pagination;
        }
    }
    catch (error) {
        console.error('Failed to load import batches:', error);
    }
    finally {
        loading.value = false;
    }
}
async function loadData() {
    if (activeTab.value === 'records') {
        await loadAttendanceRecords();
    }
    else {
        await loadImportBatches();
    }
}
function debounceLoad() {
    if (debounceTimer)
        clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        pagination.value.page = 1;
        loadData();
    }, 500);
}
// Event Handlers
function switchTab(tab) {
    activeTab.value = tab;
    loadData();
}
function resetFilters() {
    selectedDepartmentId.value = null;
    filters.value.search = '';
    pagination.value.page = 1;
    loadData();
}
function changePage(page) {
    pagination.value.page = page;
    loadAttendanceRecords();
}
function changeLimit() {
    pagination.value.page = 1;
    loadAttendanceRecords();
}
function changeImportPage(page) {
    importPagination.value.page = page;
    loadImportBatches();
}
function refreshData() {
    loadData();
}
// Import Functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        importResult.value = null;
    }
}
function handleDrop(event) {
    isDragging.value = false;
    const file = event.dataTransfer.files[0];
    if (file) {
        selectedFile.value = file;
        importResult.value = null;
    }
}
function clearFile() {
    selectedFile.value = null;
    importResult.value = null;
    if (fileInput.value)
        fileInput.value.value = '';
}
async function processImport() {
    if (!selectedFile.value) {
        alert('Please select a file to import');
        return;
    }
    if (!importPeriod.value.startDate || !importPeriod.value.endDate) {
        alert('Please select period start and end dates');
        return;
    }
    importing.value = true;
    importResult.value = null;
    try {
        const result = await attendanceService.importAttendanceFile(selectedFile.value, importPeriod.value);
        importResult.value = result;
        if (result.success && result.data?.success > 0) {
            setTimeout(() => {
                showImportModal.value = false;
                clearFile();
                loadData();
            }, 2000);
        }
    }
    catch (error) {
        importResult.value = {
            success: false,
            message: error.response?.data?.error || 'Import failed',
            data: { success: 0, failed: 0, total: 0 }
        };
    }
    finally {
        importing.value = false;
    }
}
// Correction Functions
function openCorrectionModal(record) {
    correctionData.value = {
        ...record,
        id: record.id,
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        submitted_days: record.submitted_days || record.imported_days,
        days_present: record.days_present,
        absence_days: parseFloat(record.days_absent) || 0,
        normal_ot_minutes: parseFloat(record.normal_ot_hours) * 60 || 0,
        weekend_ot_minutes: parseFloat(record.weekend_ot_hours) * 60 || 0,
        holiday_ot_minutes: parseFloat(record.holiday_ot_hours) * 60 || 0
    };
    showCorrectionModal.value = true;
}
async function saveCorrection() {
    try {
        const payload = {
            late_minutes: correctionData.value.late_minutes,
            absence_days: correctionData.value.absence_days,
            normal_ot_minutes: correctionData.value.normal_ot_minutes,
            weekend_ot_minutes: correctionData.value.weekend_ot_minutes,
            holiday_ot_minutes: correctionData.value.holiday_ot_minutes
        };
        await attendanceService.updateAttendanceRecord(correctionData.value.id, payload);
        showCorrectionModal.value = false;
        await loadAttendanceRecords();
        alert('Correction saved successfully');
    }
    catch (error) {
        console.error('Failed to save correction:', error);
        alert('Failed to save correction');
    }
}
// Batch Functions
async function viewBatchDetails(batch) {
    selectedBatch.value = batch;
    showBatchDetailsModal.value = true;
}
async function viewBatchErrors(batchId) {
    try {
        const res = await attendanceService.getImportErrors({ batchId, resolved: false });
        if (res.success) {
            importErrors.value = res.data;
            currentBatchId.value = batchId;
            showErrorsModal.value = true;
        }
    }
    catch (error) {
        console.error('Failed to load errors:', error);
    }
}
function exportData() {
    if (attendanceRecords.value.length === 0)
        return;
    const headers = ['Employee Code', 'Employee Name', 'Department', 'Days in Month', 'Working Days', 'Submitted', 'Present', 'Absent', 'Missing', 'Late Minutes', 'Normal OT (h)', 'Weekend OT (h)', 'Holiday OT (h)', 'Attendance Rate (%)'];
    const rows = attendanceRecords.value.map(record => [
        record.employee_code,
        record.employee_name,
        record.department_name,
        record.total_days_in_month,
        record.total_working_days,
        record.submitted_days || record.imported_days,
        record.days_present,
        record.days_absent,
        record.missing_days,
        record.late_minutes,
        record.normal_ot_hours || '0',
        record.weekend_ot_hours,
        record.holiday_ot_hours,
        record.attendance_rate
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${selectedYear.value}_${selectedMonth.value}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
// Watchers
watch(() => selectedYear.value, () => loadData());
watch(() => selectedMonth.value, () => loadData());
watch(selectedDepartmentId, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        pagination.value.page = 1;
        loadData();
    }
});
watch(() => filters.value.search, () => debounceLoad());
// Lifecycle
onMounted(() => {
    loadDepartments();
    loadData();
});
// Computed Stats
// Computed Stats - Fix the missing halfDayPercent
const attendanceStats = computed(() => {
    const records = attendanceRecords.value;
    const totalEmployees = records.length;
    const employeesAbsent = records.filter(r => {
        const absenceDays = parseFloat(r.days_absent) || 0;
        return absenceDays >= 0.5;
    }).length;
    const absentPercent = totalEmployees > 0 ? Math.round((employeesAbsent / totalEmployees) * 100) : 0;
    const employeesLate = records.filter(r => (r.late_minutes || 0) > 0).length;
    const latePercent = totalEmployees > 0 ? Math.round((employeesLate / totalEmployees) * 100) : 0;
    const employeesWithOT = records.filter(r => (parseFloat(r.normal_ot_hours) > 0 || parseFloat(r.weekend_ot_hours) > 0 || parseFloat(r.holiday_ot_hours) > 0)).length;
    const totalOtHours = records.reduce((sum, r) => sum + parseFloat(r.normal_ot_hours || 0) + parseFloat(r.weekend_ot_hours) + parseFloat(r.holiday_ot_hours), 0).toFixed(1);
    // Half Day: employees with exact half day absence (0.5)
    const employeesHalfDay = records.filter(r => {
        const abs = parseFloat(r.days_absent) || 0;
        return abs === 0.5;
    }).length;
    const halfDayPercent = totalEmployees > 0 ? Math.round((employeesHalfDay / totalEmployees) * 100) : 0;
    // Average attendance rate
    const avgAttendance = records.length > 0
        ? (records.reduce((sum, r) => sum + parseFloat(r.attendance_rate || 0), 0) / records.length).toFixed(1)
        : 0;
    return {
        total_employees: totalEmployees,
        employees_absent: employeesAbsent,
        absent_percent: absentPercent,
        employees_late: employeesLate,
        late_percent: latePercent,
        employees_with_ot: employeesWithOT,
        total_ot_hours: totalOtHours,
        employees_half_day: employeesHalfDay,
        half_day_percent: halfDayPercent,
        avg_attendance_rate: avgAttendance
    };
});
const importStats = computed(() => {
    const batches = importBatches.value;
    const totalSuccess = batches.reduce((sum, b) => sum + (b.success_rows || 0), 0);
    const totalErrors = batches.reduce((sum, b) => sum + (b.error_rows || 0), 0);
    const completed = batches.filter(b => b.status === 'completed').length;
    const failed = batches.filter(b => b.status === 'failed').length;
    const avgSuccessRate = batches.length > 0 && totalSuccess + totalErrors > 0
        ? Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100)
        : 0;
    return {
        total_imports: batches.length,
        total_success_records: totalSuccess,
        total_error_records: totalErrors,
        completed_imports: completed,
        failed_imports: failed,
        avg_success_rate: avgSuccessRate
    };
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-correction']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "attendance-management" },
});
/** @type {__VLS_StyleScopedClasses['attendance-management']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "header-icon" },
});
/** @type {__VLS_StyleScopedClasses['header-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showImportModal = true;
            // @ts-ignore
            [showImportModal,];
        } },
    ...{ class: "btn-primary" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs-container" },
});
/** @type {__VLS_StyleScopedClasses['tabs-container']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab(tab.value);
                // @ts-ignore
                [refreshData, tabs, switchTab,];
            } },
        key: (tab.value),
        ...{ class: "tab-btn" },
        ...{ class: ({ active: __VLS_ctx.activeTab === tab.value }) },
    });
    /** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (tab.icon);
    (tab.label);
    // @ts-ignore
    [activeTab,];
}
if (__VLS_ctx.activeTab === 'records') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadData) },
        value: (__VLS_ctx.selectedYear),
    });
    for (const [y] of __VLS_vFor((__VLS_ctx.availableYears))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (y),
            value: (y),
        });
        (y);
        // @ts-ignore
        [activeTab, loadData, selectedYear, availableYears,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadData) },
        value: (__VLS_ctx.selectedMonth),
    });
    for (const [m, idx] of __VLS_vFor((__VLS_ctx.months))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (idx),
            value: (idx + 1),
        });
        (m);
        // @ts-ignore
        [loadData, selectedMonth, months,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onDepartmentChange) },
        value: (__VLS_ctx.selectedDepartmentId),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [onDepartmentChange, selectedDepartmentId, departments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.resetFilters) },
        ...{ class: "btn-reset" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-reset']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportData) },
        ...{ class: "btn-export" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
    if (__VLS_ctx.attendanceStats) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stats-cards" },
        });
        /** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.attendanceStats.total_employees || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.attendanceStats.employees_absent || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-percent" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-percent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-orange" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
        (__VLS_ctx.attendanceStats.employees_late || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-percent" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-percent']} */ ;
        (__VLS_ctx.attendanceStats.late_percent);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-purple" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
        (__VLS_ctx.attendanceStats.employees_with_ot || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-percent" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-percent']} */ ;
        (__VLS_ctx.attendanceStats.total_ot_hours);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.attendanceStats.avg_attendance_rate || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    }
    if (__VLS_ctx.monthInfo) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "month-info" },
        });
        /** @type {__VLS_StyleScopedClasses['month-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['info-badge']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.monthInfo.month_name);
        (__VLS_ctx.monthInfo.year);
        (__VLS_ctx.monthInfo.total_days_in_month);
        (__VLS_ctx.monthInfo.total_working_days);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "data-table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-search" },
    });
    /** @type {__VLS_StyleScopedClasses['table-search']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debounceLoad) },
        type: "text",
        value: (__VLS_ctx.filters.search),
        placeholder: "Search employee name or code...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else if (__VLS_ctx.attendanceRecords.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.monthInfo.month_name);
        (__VLS_ctx.selectedYear);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'records'))
                        return;
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.attendanceRecords.length === 0))
                        return;
                    __VLS_ctx.showImportModal = true;
                    // @ts-ignore
                    [showImportModal, selectedYear, resetFilters, exportData, attendanceStats, attendanceStats, attendanceStats, attendanceStats, attendanceStats, attendanceStats, attendanceStats, attendanceStats, monthInfo, monthInfo, monthInfo, monthInfo, monthInfo, monthInfo, debounceLoad, filters, loading, attendanceRecords,];
                } },
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [record] of __VLS_vFor((__VLS_ctx.attendanceRecords))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (record.employee_id),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-info" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (record.employee_name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-code" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
            (record.employee_code);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "dept-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-cell']} */ ;
            (record.department_name || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (record.submitted_days || record.imported_days);
            (record.total_days_in_month);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center text-green" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (record.days_present);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (record.days_absent);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (record.late_minutes);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (record.normal_ot_hours || '0');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (record.weekend_ot_hours);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (record.holiday_ot_hours);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (__VLS_ctx.getRateClass(record.attendance_rate)) },
            });
            (record.attendance_rate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'records'))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.attendanceRecords.length === 0))
                            return;
                        __VLS_ctx.openCorrectionModal(record);
                        // @ts-ignore
                        [attendanceRecords, getRateClass, openCorrectionModal,];
                    } },
                ...{ class: "btn-icon btn-correction" },
                title: "Make Correction",
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-correction']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'records'))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
                    // @ts-ignore
                    [pagination, pagination, changePage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.pagination.page === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.pagination.page);
        (__VLS_ctx.pagination.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'records'))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
                    // @ts-ignore
                    [pagination, pagination, pagination, pagination, changePage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.pagination.page === __VLS_ctx.pagination.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.changeLimit) },
            value: (__VLS_ctx.pagination.limit),
            ...{ class: "limit-select" },
        });
        /** @type {__VLS_StyleScopedClasses['limit-select']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (10),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (20),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (50),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (100),
        });
    }
}
if (__VLS_ctx.activeTab === 'imports') {
    if (__VLS_ctx.importStats) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stats-cards" },
        });
        /** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.importStats.total_imports || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-green" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
        (__VLS_ctx.importStats.total_success_records || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.importStats.total_error_records || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-blue" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue']} */ ;
        (__VLS_ctx.importStats.completed_imports || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value text-orange" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
        (__VLS_ctx.importStats.failed_imports || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-card" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.importStats.avg_success_rate || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "data-table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else if (__VLS_ctx.importBatches.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'imports'))
                        return;
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.importBatches.length === 0))
                        return;
                    __VLS_ctx.showImportModal = true;
                    // @ts-ignore
                    [showImportModal, activeTab, loading, pagination, pagination, pagination, changeLimit, importStats, importStats, importStats, importStats, importStats, importStats, importStats, importBatches,];
                } },
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [batch] of __VLS_vFor((__VLS_ctx.importBatches))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (batch.id),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "file-name-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name-cell']} */ ;
            (batch.file_name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (__VLS_ctx.formatDateTime(batch.import_date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (__VLS_ctx.formatDate(batch.period_start));
            (__VLS_ctx.formatDate(batch.period_end));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (batch.total_rows);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center text-green" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
            (batch.success_rows);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (batch.error_rows);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (__VLS_ctx.getStatusClass(batch.status)) },
            });
            (batch.status);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'imports'))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.importBatches.length === 0))
                            return;
                        __VLS_ctx.viewBatchDetails(batch);
                        // @ts-ignore
                        [importBatches, formatDateTime, formatDate, formatDate, getStatusClass, viewBatchDetails,];
                    } },
                ...{ class: "btn-icon" },
                title: "View Details",
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            if (batch.error_rows > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeTab === 'imports'))
                                return;
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.importBatches.length === 0))
                                return;
                            if (!(batch.error_rows > 0))
                                return;
                            __VLS_ctx.viewBatchErrors(batch.id);
                            // @ts-ignore
                            [viewBatchErrors,];
                        } },
                    ...{ class: "btn-icon" },
                    title: "View Errors",
                });
                /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.importPagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'imports'))
                        return;
                    if (!(__VLS_ctx.importPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeImportPage(__VLS_ctx.importPagination.page - 1);
                    // @ts-ignore
                    [importPagination, importPagination, changeImportPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.importPagination.page === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.importPagination.page);
        (__VLS_ctx.importPagination.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'imports'))
                        return;
                    if (!(__VLS_ctx.importPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeImportPage(__VLS_ctx.importPagination.page + 1);
                    // @ts-ignore
                    [importPagination, importPagination, importPagination, importPagination, changeImportPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.importPagination.page === __VLS_ctx.importPagination.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    }
}
if (__VLS_ctx.showImportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.showImportModal = false;
                // @ts-ignore
                [showImportModal, showImportModal, importPagination, importPagination,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-import modal-no-scroll" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-import']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-no-scroll']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.showImportModal = false;
                // @ts-ignore
                [showImportModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-info" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        required: true,
    });
    (__VLS_ctx.importPeriod.startDate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        required: true,
    });
    (__VLS_ctx.importPeriod.endDate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onDragover: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.isDragging = true;
                // @ts-ignore
                [importPeriod, importPeriod, isDragging,];
            } },
        ...{ onDragleave: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.isDragging = false;
                // @ts-ignore
                [isDragging,];
            } },
        ...{ onDrop: (__VLS_ctx.handleDrop) },
        ...{ class: "upload-area" },
        ...{ class: ({ dragging: __VLS_ctx.isDragging, hasFile: __VLS_ctx.selectedFile }) },
    });
    /** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragging']} */ ;
    /** @type {__VLS_StyleScopedClasses['hasFile']} */ ;
    if (!__VLS_ctx.selectedFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "upload-placeholder" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-placeholder']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "upload-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showImportModal))
                        return;
                    if (!(!__VLS_ctx.selectedFile))
                        return;
                    __VLS_ctx.$refs.fileInput.click();
                    // @ts-ignore
                    [isDragging, handleDrop, selectedFile, selectedFile, $refs,];
                } },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "upload-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            ...{ onClick: (__VLS_ctx.downloadTemplate) },
            href: "#",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['file-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['file-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-info" },
        });
        /** @type {__VLS_StyleScopedClasses['file-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (__VLS_ctx.selectedFile.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "file-size" },
        });
        /** @type {__VLS_StyleScopedClasses['file-size']} */ ;
        (__VLS_ctx.formatFileSize(__VLS_ctx.selectedFile.size));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.clearFile) },
            ...{ class: "btn-remove" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-remove']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleFileSelect) },
        type: "file",
        ref: "fileInput",
        accept: ".csv,.xlsx,.xls",
        ...{ style: {} },
    });
    if (__VLS_ctx.importResult) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-result" },
        });
        /** @type {__VLS_StyleScopedClasses['import-result']} */ ;
        if (__VLS_ctx.importResult.success) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "result-success" },
            });
            /** @type {__VLS_StyleScopedClasses['result-success']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.importResult.data?.success || 0);
            (__VLS_ctx.importResult.data?.failed || 0);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "result-error" },
            });
            /** @type {__VLS_StyleScopedClasses['result-error']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.importResult.message);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.showImportModal = false;
                // @ts-ignore
                [showImportModal, selectedFile, selectedFile, downloadTemplate, formatFileSize, clearFile, handleFileSelect, importResult, importResult, importResult, importResult, importResult,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.processImport) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.selectedFile || __VLS_ctx.importing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.importing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    (__VLS_ctx.importing ? 'Importing...' : 'Import');
}
if (__VLS_ctx.showCorrectionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCorrectionModal))
                    return;
                __VLS_ctx.showCorrectionModal = false;
                // @ts-ignore
                [selectedFile, processImport, importing, importing, importing, showCorrectionModal, showCorrectionModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-no-scroll" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-no-scroll']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCorrectionModal))
                    return;
                __VLS_ctx.showCorrectionModal = false;
                // @ts-ignore
                [showCorrectionModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.correctionData.employee_name),
        disabled: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (`${__VLS_ctx.monthInfo.month_name} ${__VLS_ctx.selectedYear}`),
        disabled: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.correctionData.submitted_days || __VLS_ctx.correctionData.imported_days),
        disabled: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.correctionData.days_present),
        disabled: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "0",
    });
    (__VLS_ctx.correctionData.late_minutes);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.5",
        min: "0",
    });
    (__VLS_ctx.correctionData.absence_days);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "0",
    });
    (__VLS_ctx.correctionData.normal_ot_minutes);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "0",
    });
    (__VLS_ctx.correctionData.weekend_ot_minutes);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group half" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['half']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "0",
    });
    (__VLS_ctx.correctionData.holiday_ot_minutes);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCorrectionModal))
                    return;
                __VLS_ctx.showCorrectionModal = false;
                // @ts-ignore
                [selectedYear, monthInfo, showCorrectionModal, correctionData, correctionData, correctionData, correctionData, correctionData, correctionData, correctionData, correctionData, correctionData,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveCorrection) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
if (__VLS_ctx.showBatchDetailsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showBatchDetailsModal))
                    return;
                __VLS_ctx.showBatchDetailsModal = false;
                // @ts-ignore
                [saveCorrection, showBatchDetailsModal, showBatchDetailsModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showBatchDetailsModal))
                    return;
                __VLS_ctx.showBatchDetailsModal = false;
                // @ts-ignore
                [showBatchDetailsModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    if (__VLS_ctx.selectedBatch) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "batch-info" },
        });
        /** @type {__VLS_StyleScopedClasses['batch-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.selectedBatch.file_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.selectedBatch.import_date));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatDate(__VLS_ctx.selectedBatch.period_start));
        (__VLS_ctx.formatDate(__VLS_ctx.selectedBatch.period_end));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (__VLS_ctx.getStatusClass(__VLS_ctx.selectedBatch.status)) },
        });
        (__VLS_ctx.selectedBatch.status);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.selectedBatch.total_rows);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.selectedBatch.success_rows);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.selectedBatch.error_rows);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showBatchDetailsModal))
                    return;
                __VLS_ctx.showBatchDetailsModal = false;
                // @ts-ignore
                [formatDateTime, formatDate, formatDate, getStatusClass, showBatchDetailsModal, selectedBatch, selectedBatch, selectedBatch, selectedBatch, selectedBatch, selectedBatch, selectedBatch, selectedBatch, selectedBatch, selectedBatch,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showErrorsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showErrorsModal))
                    return;
                __VLS_ctx.showErrorsModal = false;
                // @ts-ignore
                [showErrorsModal, showErrorsModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.currentBatchId);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showErrorsModal))
                    return;
                __VLS_ctx.showErrorsModal = false;
                // @ts-ignore
                [showErrorsModal, currentBatchId,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['error-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.importErrors.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [error] of __VLS_vFor((__VLS_ctx.importErrors))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (error.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (error.row_number);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (error.employee_id || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (error.error_message);
        // @ts-ignore
        [importErrors, importErrors,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadTemplate) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showErrorsModal))
                    return;
                __VLS_ctx.showErrorsModal = false;
                __VLS_ctx.showImportModal = true;
                // @ts-ignore
                [showImportModal, downloadTemplate, showErrorsModal,];
            } },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showErrorsModal))
                    return;
                __VLS_ctx.showErrorsModal = false;
                // @ts-ignore
                [showErrorsModal,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
