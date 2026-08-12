import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import payrollService from "@/stores/payrollService";
import employeePenaltyService from "@/stores/employeePenaltyService";
// Props & Emits
const emit = defineEmits(['update-stats']);
// ==================== CONSTANTS ====================
const WORKING_DAYS = 22;
const HOURLY_FACTOR = WORKING_DAYS * 8;
const ALLOWANCE_RATE = 0.45;
const PENSION_RATE = 0.07;
const COMPANY_PENSION_RATE = 0.11;
const currentUser = "HR Admin";
const taxBrackets = [
    { min: 0, max: 600, rate: 0 },
    { min: 601, max: 1650, rate: 10 },
    { min: 1651, max: 3200, rate: 15 },
    { min: 3201, max: 5250, rate: 20 },
    { min: 5251, max: 7800, rate: 25 },
    { min: 7801, max: 10900, rate: 30 },
    { min: 10901, max: Infinity, rate: 35 },
];
const departments = ["IT", "Finance", "Operations", "HR"];
// ==================== STATE ====================
const selectedMonth = computed(() => {
    return `${selectedYear.value}-${String(selectedMonthNum.value).padStart(2, '0')}`;
});
const payrollData = ref([]);
const Penality = ref([]);
const holds = ref([]);
const carryForward = ref([]);
const penaltiesList = ref([]);
// UI State
const expandedRow = ref(null);
const showDeptDropdown = ref(false);
const deptDropdownRef = ref(null);
const loading = ref(false);
// Filters
const payrollSearch = ref("");
const selectedDept = ref(null);
// ==================== MONTH SELECTOR STATE ====================
const currentDate = new Date();
const selectedYear = ref(currentDate.getFullYear());
const selectedMonthNum = ref(currentDate.getMonth() + 1);
// Generate years from 2020 to 2030
// Replace the existing availableYears computed
const availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Start from 2020 up to current year only
    for (let y = 2020; y <= currentYear; y++) {
        years.push(y);
    }
    return years;
});
// Add this computed property
const isMonthValid = computed(() => {
    const selected = new Date(selectedYear.value, selectedMonthNum.value - 1);
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    // Check if selected date is in the future (beyond current month)
    const currentYearMonth = new Date(current.getFullYear(), current.getMonth());
    return selected <= currentYearMonth;
});
// Pagination
const payrollPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
// Modal States
const showPenalityModal = ref(false);
const showExportModal = ref(false);
// Modal Data
const editingEmployee = ref(null);
const employeePenality = ref([]);
const hasHold = ref(false);
const holdDuration = ref(1);
const holdReason = ref("");
const exportType = ref("government");
// UI Flags
const exporting = ref(false);
const savingPenality = ref(false);
// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
// ==================== COMPUTED ====================
const selectedDeptName = computed(() => selectedDept.value || null);
const filteredPayrollData = computed(() => {
    let data = payrollData.value;
    if (payrollSearch.value) {
        data = data.filter((e) => e.fullName?.toLowerCase().includes(payrollSearch.value.toLowerCase()));
    }
    if (selectedDept.value) {
        data = data.filter((e) => e.department === selectedDept.value);
    }
    payrollPagination.value.total = data.length;
    payrollPagination.value.totalPages = Math.ceil(data.length / payrollPagination.value.limit) || 1;
    return data;
});
const paginatedPayrollData = computed(() => {
    const start = (payrollPagination.value.page - 1) * payrollPagination.value.limit;
    return filteredPayrollData.value.slice(start, start + payrollPagination.value.limit);
});
const employees = computed(() => payrollData.value);
const currentPenalityTotal = computed(() => employeePenality.value.reduce((s, d) => s +
    (d.type === "percent"
        ? Math.floor(((editingEmployee.value?.governmentNet || 0) * d.value) / 100)
        : d.value || 0), 0));
// ==================== HELPER FUNCTIONS ====================
// Add these helper functions
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
}
function isFutureMonth(month) {
    if (selectedYear.value > new Date().getFullYear())
        return true;
    if (selectedYear.value === new Date().getFullYear() && month > new Date().getMonth() + 1)
        return true;
    return false;
}
function formatCurrency(amt) {
    return payrollService.formatCurrency(amt);
}
function formatDate(d) {
    return payrollService.formatDate(d);
}
function formatMonth(m) {
    return payrollService.formatMonth(m);
}
function getInitials(name) {
    if (!name)
        return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
function showToastMessage(msg, type) {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
}
function getDeptCount(dept) {
    return payrollData.value.filter((e) => e.department === dept).length;
}
function downloadCSV(data, filename) {
    const csv = data.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
// ==================== TAX CALCULATION ====================
function calculateTax(income) {
    let tax = 0, remaining = income;
    for (const b of taxBrackets) {
        if (remaining <= 0)
            break;
        const taxable = Math.min(remaining, b.max) - b.min + 1;
        if (taxable > 0) {
            tax += (taxable * b.rate) / 100;
            remaining -= taxable;
        }
    }
    return Math.floor(Math.max(0, tax));
}
// ==================== LOAD DATA ====================
async function loadPayrollData() {
    loading.value = true;
    try {
        const [year, month] = selectedMonth.value.split("-");
        const result = await payrollService.getPayrollData({
            year: parseInt(year),
            month: parseInt(month),
            department: selectedDept.value || undefined,
            search: payrollSearch.value || undefined,
        });
        if (result.success && result.data && result.data.length > 0) {
            payrollData.value = result.data;
            // Emit stats to parent
            const totalGross = payrollData.value.reduce((s, e) => s + (e.grossPay || 0), 0);
            const totalTax = payrollData.value.reduce((s, e) => s + (e.tax || 0), 0);
            const totalPension7 = payrollData.value.reduce((s, e) => s + (e.pension7 || 0), 0);
            const totalPension11 = payrollData.value.reduce((s, e) => s + (e.pension11 || 0), 0);
            const activeHolds = payrollData.value.filter((e) => e.isOnHold).length;
            emit('update-stats', {
                employees: payrollData.value.length,
                grossPay: totalGross,
                tax: totalTax,
                pension7: totalPension7,
                pension11: totalPension11,
                activeHolds: activeHolds
            });
        }
        else {
            calculatePayroll();
        }
    }
    catch (error) {
        console.error("Error loading payroll data:", error);
        calculatePayroll();
    }
    finally {
        loading.value = false;
    }
}
// Replace the existing changeMonth function
function changeMonth() {
    // Check if selected month is valid (not future)
    const selected = new Date(selectedYear.value, selectedMonthNum.value - 1);
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    const currentYearMonth = new Date(current.getFullYear(), current.getMonth());
    if (selected > currentYearMonth) {
        // Reset to current month if trying to select future month
        const now = new Date();
        selectedYear.value = now.getFullYear();
        selectedMonthNum.value = now.getMonth() + 1;
        showToastMessage("Cannot select future months. Only current and past months are allowed.", "error");
        return;
    }
    loadPayrollData();
}
// Demo data calculation (fallback)
function calculatePayroll() {
    const employeesData = [
        { id: 1, employeeCode: "EMP001", fullName: "Biruk Mulualem", department: "IT", basicSalary: 25000, position: "Senior Developer" },
        { id: 2, employeeCode: "EMP002", fullName: "Dagmawi Hadgu", department: "IT", basicSalary: 35000, position: "Team Lead" },
        { id: 3, employeeCode: "EMP003", fullName: "Melkamu Zewdu", department: "Operations", basicSalary: 28000, position: "Manager" },
        { id: 4, employeeCode: "EMP004", fullName: "Melaku Tewodros", department: "Finance", basicSalary: 32000, position: "Finance Manager" },
        { id: 5, employeeCode: "EMP005", fullName: "Tamrat Zerihun", department: "IT", basicSalary: 18000, position: "Developer" },
        { id: 6, employeeCode: "EMP006", fullName: "Nuru Seid", department: "Finance", basicSalary: 15000, position: "Accountant" },
        { id: 7, employeeCode: "EMP007", fullName: "Tadese Jemberu", department: "Operations", basicSalary: 12000, position: "Coordinator" },
        { id: 8, employeeCode: "EMP008", fullName: "Eshete Worke", department: "IT", basicSalary: 22000, position: "System Admin" },
        { id: 9, employeeCode: "EMP009", fullName: "Haymanot Abebaw", department: "HR", basicSalary: 30000, position: "HR Manager" },
    ];
    payrollData.value = employeesData.map((emp) => {
        const allowancesTotal = Math.floor(emp.basicSalary * ALLOWANCE_RATE);
        const housingAllowance = Math.floor(emp.basicSalary * 0.2);
        const transportAllowance = Math.floor(emp.basicSalary * 0.1);
        const positionAllowance = Math.floor(emp.basicSalary * 0.15);
        const mobileAllowance = Math.floor(emp.basicSalary * 0.05);
        const overtimeHours = Math.floor(Math.random() * 12);
        const hourlyRate = emp.basicSalary / HOURLY_FACTOR;
        const overtimePay = Math.floor(hourlyRate * overtimeHours * 1.5);
        const grossPay = emp.basicSalary + allowancesTotal + overtimePay;
        const tax = calculateTax(grossPay);
        const pension7 = Math.floor(emp.basicSalary * PENSION_RATE);
        const pension11 = Math.floor(emp.basicSalary * COMPANY_PENSION_RATE);
        const governmentNet = grossPay - tax - pension7;
        const finalNetPay = governmentNet;
        return {
            ...emp,
            allowancesTotal,
            housingAllowance,
            transportAllowance,
            positionAllowance,
            mobileAllowance,
            overtimeHours,
            overtimePay,
            grossPay,
            tax,
            pension7,
            pension11,
            governmentNet,
            finalNetPay,
            isOnHold: false,
            Penality: [],
            otherPenalityTotal: 0,
            absentDays: 0,
            absentPenalty: 0,
            lateMinutes: 0,
            latePenalty: 0,
            totalPenalties: 0,
            dailyRate: emp.basicSalary / 30,
            hourlyRate: emp.basicSalary / (30 * 8),
            totalDaysInMonth: 30,
            allowanceCalculationMethod: 'full',
            allowanceFactor: 1,
            taxRate: 0,
            taxPenality: 0,
            taxBracketRange: '',
            taxableIncome: grossPay,
            taxCalculationFormula: '',
            pensionCalculationMethod: 'full'
        };
    });
}
// ==================== PENALTY FUNCTIONS ====================
function editEmployeePenality(emp) {
    editingEmployee.value = emp;
    employeePenality.value = (emp.Penality || []).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        value: p.value,
        reference: p.reference || "",
        submittedBy: p.submittedBy || currentUser,
        contact: p.contact || "",
        reason: p.reason || "",
        date: p.date || new Date().toISOString().split("T")[0],
    }));
    if (!employeePenality.value.length) {
        employeePenality.value.push({
            id: Date.now(),
            name: "",
            type: "fixed",
            value: 0,
            reason: "",
            reference: "",
            submittedBy: currentUser,
            contact: "",
            date: new Date().toISOString().split("T")[0],
        });
    }
    const existingHold = holds.value.find((h) => h.employeeId === emp.id && h.startMonth === selectedMonth.value);
    if (existingHold) {
        hasHold.value = true;
        holdDuration.value = existingHold.duration;
        holdReason.value = existingHold.reason;
    }
    else {
        hasHold.value = false;
        holdDuration.value = 1;
        holdReason.value = "";
    }
    showPenalityModal.value = true;
}
function addPenality() {
    employeePenality.value.push({
        id: Date.now(),
        name: "",
        type: "fixed",
        value: 0,
        reason: "",
        reference: "",
        submittedBy: currentUser,
        contact: "",
        date: new Date().toISOString().split("T")[0],
    });
}
function removePenality(idx) {
    employeePenality.value.splice(idx, 1);
}
function removeEmployeeHold() {
    holds.value = holds.value.filter((h) => h.employeeId !== editingEmployee.value.id);
    hasHold.value = false;
    calculatePayroll();
    showToastMessage("Hold removed", "success");
}
async function savePenality() {
    savingPenality.value = true;
    try {
        const validPenalties = employeePenality.value.filter((d) => d.name && d.value > 0);
        const existingPenalties = await employeePenaltyService.getEmployeePenalties(editingEmployee.value.id, { month: selectedMonth.value, status: 'active' });
        if (existingPenalties.success && existingPenalties.data) {
            for (const penalty of existingPenalties.data) {
                await employeePenaltyService.deletePenalty(penalty.penalty_id);
            }
        }
        for (const penalty of validPenalties) {
            await employeePenaltyService.createPenalty(editingEmployee.value.id, {
                penalty_type: penalty.name,
                calculation_type: penalty.type === "percent" ? "percent" : "fixed",
                value: penalty.value,
                reference: penalty.reference,
                submitted_by: penalty.submittedBy || currentUser,
                contact: penalty.contact,
                reason: penalty.reason,
                month: selectedMonth.value,
            });
        }
        await loadPayrollData();
        showToastMessage(`${validPenalties.length} penalty/penalties saved!`, "success");
        closePenalityModal();
    }
    catch (error) {
        console.error("Save penalties error:", error);
        showToastMessage("Failed to save penalties", "error");
    }
    finally {
        savingPenality.value = false;
    }
}
function closePenalityModal() {
    showPenalityModal.value = false;
    editingEmployee.value = null;
    employeePenality.value = [];
}
// ==================== EXPORT FUNCTIONS ====================
function openExportModal() {
    showExportModal.value = true;
}
function closeExportModal() {
    showExportModal.value = false;
}
function exportSelectedReport() {
    exporting.value = true;
    setTimeout(() => {
        let headers = [], rows = [];
        if (exportType.value === "government") {
            headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Housing Allowance", "Transport Allowance", "Position Allowance", "Mobile Allowance", "OT Pay", "Gross Pay", "Absent Days", "Absent Penalty", "Tax (PAYE)", "Pension (7%)", "Pension (11%)", "Net Pay"];
            rows = filteredPayrollData.value.map((e) => [
                e.employeeCode, e.fullName, e.department, e.basicSalary, e.housingAllowance,
                e.transportAllowance, e.positionAllowance, e.mobileAllowance, e.overtimePay,
                e.grossPay, e.absentDays || 0, e.absentPenalty || 0, e.tax, e.pension7, e.pension11, e.governmentNet
            ]);
        }
        else if (exportType.value === "internal") {
            headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Gross Pay", "Tax", "Pension", "Total Penalties", "Other Penality", "Final Net Pay"];
            rows = filteredPayrollData.value.map((e) => [
                e.employeeCode, e.fullName, e.department, e.basicSalary, e.grossPay,
                e.tax, e.pension7, e.totalPenalties, e.otherPenalityTotal, e.finalNetPay
            ]);
        }
        else {
            headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Gross Pay", "Government Net", "Total Penalties", "Other Penality", "Final Net Pay", "Difference"];
            rows = filteredPayrollData.value.map((e) => [
                e.employeeCode, e.fullName, e.department, e.basicSalary, e.grossPay,
                e.governmentNet, e.totalPenalties, e.otherPenalityTotal, e.finalNetPay,
                e.governmentNet - e.finalNetPay
            ]);
        }
        downloadCSV([headers, ...rows], `${exportType.value}_report_${selectedMonth.value}.csv`);
        exporting.value = false;
        closeExportModal();
        showToastMessage("Export completed!", "success");
    }, 500);
}
// ==================== UI HANDLERS ====================
function toggleExpand(id) {
    expandedRow.value = expandedRow.value === id ? null : id;
}
function selectDept(dept) {
    selectedDept.value = dept;
    showDeptDropdown.value = false;
    payrollPagination.value.page = 1;
    loadPayrollData();
}
function changePayrollPage(page) {
    payrollPagination.value.page = page;
}
function changePayrollLimit() {
    payrollPagination.value.page = 1;
    payrollPagination.value.limit = parseInt(payrollPagination.value.limit);
}
function handleClickOutside(event) {
    if (deptDropdownRef.value && !deptDropdownRef.value.contains(event.target)) {
        showDeptDropdown.value = false;
    }
}
// ==================== WATCHERS ====================
watch([payrollSearch, selectedDept], () => {
    payrollPagination.value.page = 1;
    loadPayrollData();
});
// Listen for global refresh events
function handleRefreshAllTabs() {
    loadPayrollData();
}
// Add this after other watch statements
watch([selectedYear, selectedMonthNum], ([newYear, newMonth]) => {
    const selected = new Date(newYear, newMonth - 1);
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    const currentYearMonth = new Date(current.getFullYear(), current.getMonth());
    if (selected > currentYearMonth) {
        const now = new Date();
        selectedYear.value = now.getFullYear();
        selectedMonthNum.value = now.getMonth() + 1;
        showToastMessage("Cannot select future months. Reset to current month.", "error");
    }
});
// ==================== INITIALIZATION ====================
// Replace the existing init function
async function init() {
    await loadPayrollData();
}
onMounted(() => {
    init();
    document.addEventListener("click", handleClickOutside);
    window.addEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
    window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['year-select']} */ ;
/** @type {__VLS_StyleScopedClasses['month-select']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['penalties-card']} */ ;
/** @type {__VLS_StyleScopedClasses['penalties-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['penalties-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['penalties-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['penalty-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['total-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['final-net-card']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['Penality-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['Penality-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['Penality-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['Penality-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
/** @type {__VLS_StyleScopedClasses['Penality-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-trigger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-title" },
});
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.formatMonth(__VLS_ctx.selectedMonth));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "month-selector" },
});
/** @type {__VLS_StyleScopedClasses['month-selector']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.changeMonth) },
    value: (__VLS_ctx.selectedYear),
    ...{ class: "year-select" },
});
/** @type {__VLS_StyleScopedClasses['year-select']} */ ;
for (const [y] of __VLS_vFor((__VLS_ctx.availableYears))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (y),
        value: (y),
    });
    (y);
    // @ts-ignore
    [formatMonth, selectedMonth, changeMonth, selectedYear, availableYears,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.changeMonth) },
    value: (__VLS_ctx.selectedMonthNum),
    ...{ class: "month-select" },
});
/** @type {__VLS_StyleScopedClasses['month-select']} */ ;
for (const [month] of __VLS_vFor((12))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (month),
        value: (month),
        disabled: (__VLS_ctx.isFutureMonth(month)),
    });
    (__VLS_ctx.getMonthName(month));
    // @ts-ignore
    [changeMonth, selectedMonthNum, isFutureMonth, getMonthName,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-filters" },
});
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dropdown-card" },
    ref: "deptDropdownRef",
});
/** @type {__VLS_StyleScopedClasses['dropdown-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showDeptDropdown = !__VLS_ctx.showDeptDropdown;
            // @ts-ignore
            [showDeptDropdown, showDeptDropdown,];
        } },
    ...{ class: "dropdown-trigger" },
});
/** @type {__VLS_StyleScopedClasses['dropdown-trigger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.selectedDeptName || "All Departments");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
if (__VLS_ctx.showDeptDropdown) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dropdown-menu-card" },
    });
    /** @type {__VLS_StyleScopedClasses['dropdown-menu-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dropdown-header" },
    });
    /** @type {__VLS_StyleScopedClasses['dropdown-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeptDropdown))
                    return;
                __VLS_ctx.selectDept(null);
                // @ts-ignore
                [showDeptDropdown, selectedDeptName, selectDept,];
            } },
        ...{ class: "dropdown-item" },
        ...{ class: ({ active: __VLS_ctx.selectedDept === null }) },
    });
    /** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "count" },
    });
    /** @type {__VLS_StyleScopedClasses['count']} */ ;
    (__VLS_ctx.employees.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dropdown-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['dropdown-divider']} */ ;
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showDeptDropdown))
                        return;
                    __VLS_ctx.selectDept(dept);
                    // @ts-ignore
                    [selectDept, selectedDept, employees, departments,];
                } },
            key: (dept),
            ...{ class: "dropdown-item" },
            ...{ class: ({ active: __VLS_ctx.selectedDept === dept }) },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (dept);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "count" },
        });
        /** @type {__VLS_StyleScopedClasses['count']} */ ;
        (__VLS_ctx.getDeptCount(dept));
        // @ts-ignore
        [selectedDept, getDeptCount,];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    value: (__VLS_ctx.payrollSearch),
    placeholder: "Search employee...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openExportModal) },
    ...{ class: "btn-export" },
    disabled: (__VLS_ctx.exporting),
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
if (__VLS_ctx.exporting) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.exporting ? "Exporting..." : "Export");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "payroll-table" },
});
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [emp, idx] of __VLS_vFor((__VLS_ctx.paginatedPayrollData))) {
    (emp.id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        ...{ class: ({
                'expanded-row': __VLS_ctx.expandedRow === emp.id,
                'on-hold-row': emp.isOnHold,
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['expanded-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['on-hold-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggleExpand(emp.id);
                // @ts-ignore
                [payrollSearch, openExportModal, exporting, exporting, exporting, paginatedPayrollData, expandedRow, toggleExpand,];
            } },
        ...{ class: "expand-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
    (__VLS_ctx.expandedRow === emp.id ? "▼" : "▶");
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "employee-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (emp.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-code" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
    (emp.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (emp.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    (__VLS_ctx.formatCurrency(emp.basicSalary));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    (__VLS_ctx.formatCurrency(emp.allowancesTotal));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(emp.grossPay));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right tax" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    /** @type {__VLS_StyleScopedClasses['tax']} */ ;
    (__VLS_ctx.formatCurrency(emp.tax));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right pension" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    /** @type {__VLS_StyleScopedClasses['pension']} */ ;
    (__VLS_ctx.formatCurrency(emp.pension7));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right net" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    /** @type {__VLS_StyleScopedClasses['net']} */ ;
    (__VLS_ctx.formatCurrency(emp.governmentNet));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    if (emp.isOnHold) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "badge-hold" },
        });
        /** @type {__VLS_StyleScopedClasses['badge-hold']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "badge-active" },
        });
        /** @type {__VLS_StyleScopedClasses['badge-active']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.editEmployeePenality(emp);
                // @ts-ignore
                [expandedRow, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, editEmployeePenality,];
            } },
        ...{ class: "icon-btn" },
        title: "Edit",
    });
    /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
    if (__VLS_ctx.expandedRow === emp.id) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: "detail-expand-row" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "12",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "expand-details" },
        });
        /** @type {__VLS_StyleScopedClasses['expand-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-container" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-row-two-cols" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.basicSalary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ style: {} },
        });
        (__VLS_ctx.formatCurrency(emp.dailyRate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ style: {} },
        });
        (__VLS_ctx.formatCurrency(emp.hourlyRate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ style: {} },
        });
        (emp.totalDaysInMonth || 30);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.housingAllowance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.transportAllowance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.positionAllowance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.mobileAllowance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        if (emp.allowanceCalculationMethod === 'proportional') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "allowance-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['allowance-badge']} */ ;
            ((emp.allowanceFactor * 100).toFixed(0));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "allowance-badge success" },
            });
            /** @type {__VLS_StyleScopedClasses['allowance-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['success']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.allowancesTotal));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (emp.overtimeHours || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.overtimePay));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "total" },
        });
        /** @type {__VLS_StyleScopedClasses['total']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.grossPay));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (emp.absentDays || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.formatCurrency(emp.absentPenalty || 0));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (emp.lateMinutes || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.formatCurrency(emp.latePenalty || 0));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "total" },
        });
        /** @type {__VLS_StyleScopedClasses['total']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.formatCurrency(emp.totalPenalties));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "penalty-note" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['penalty-note']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-row-two-cols" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-row-two-cols']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-info" },
        });
        /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
        (emp.taxRate);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-info" },
        });
        /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
        (__VLS_ctx.formatCurrency(emp.taxPenality));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (emp.taxBracketRange);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "penalty-note" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['penalty-note']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-info" },
        });
        /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
        (__VLS_ctx.formatCurrency(emp.taxableIncome));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-muted small" },
        });
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['small']} */ ;
        (emp.taxCalculationFormula);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-orange" },
        });
        /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
        (__VLS_ctx.formatCurrency(emp.tax));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "penalty-note" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['penalty-note']} */ ;
        (emp.pensionCalculationMethod === "proportional" ? "Proportional (worked <15 days)" : "Full (on basic salary)");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.pension7));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "penalty-note" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['penalty-note']} */ ;
        (emp.pensionCalculationMethod === "proportional" ? "Proportional (worked <15 days)" : "Full (on basic salary)");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-purple" },
        });
        /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
        (__VLS_ctx.formatCurrency(emp.pension11));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "total" },
        });
        /** @type {__VLS_StyleScopedClasses['total']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-purple" },
        });
        /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
        (__VLS_ctx.formatCurrency(emp.governmentNet));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "penalty-note" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['penalty-note']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-card penalties-card" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['penalties-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "penalties-stack" },
        });
        /** @type {__VLS_StyleScopedClasses['penalties-stack']} */ ;
        for (const [ded] of __VLS_vFor((emp.Penality || []))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (ded.id),
                ...{ class: "penalty-stack" },
            });
            /** @type {__VLS_StyleScopedClasses['penalty-stack']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "stack-header" },
            });
            /** @type {__VLS_StyleScopedClasses['stack-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "stack-name" },
            });
            /** @type {__VLS_StyleScopedClasses['stack-name']} */ ;
            (ded.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "stack-badge" },
                ...{ class: (ded.type === 'percent' ? 'badge-percent' : 'badge-fixed') },
            });
            /** @type {__VLS_StyleScopedClasses['stack-badge']} */ ;
            (ded.type === "percent" ? ded.value + "%" : __VLS_ctx.formatCurrency(ded.value));
            if (ded.type === 'percent') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "stack-amount-info" },
                });
                /** @type {__VLS_StyleScopedClasses['stack-amount-info']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "amount-label" },
                });
                /** @type {__VLS_StyleScopedClasses['amount-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "amount-value" },
                });
                /** @type {__VLS_StyleScopedClasses['amount-value']} */ ;
                (__VLS_ctx.formatCurrency(ded.amount));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "stack-meta" },
            });
            /** @type {__VLS_StyleScopedClasses['stack-meta']} */ ;
            if (ded.reference) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "meta-item" },
                });
                /** @type {__VLS_StyleScopedClasses['meta-item']} */ ;
                (ded.reference);
            }
            if (ded.submittedBy) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "meta-item" },
                });
                /** @type {__VLS_StyleScopedClasses['meta-item']} */ ;
                (ded.submittedBy);
            }
            if (ded.contact) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "meta-item" },
                });
                /** @type {__VLS_StyleScopedClasses['meta-item']} */ ;
                (ded.contact);
            }
            if (ded.date) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "meta-item" },
                });
                /** @type {__VLS_StyleScopedClasses['meta-item']} */ ;
                (__VLS_ctx.formatDate(ded.date));
            }
            if (ded.reason) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "stack-reason" },
                });
                /** @type {__VLS_StyleScopedClasses['stack-reason']} */ ;
                (ded.reason);
            }
            // @ts-ignore
            [expandedRow, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatDate,];
        }
        if (!emp.Penality || emp.Penality.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
        if (emp.Penality && emp.Penality.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "total-stack" },
            });
            /** @type {__VLS_StyleScopedClasses['total-stack']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.formatCurrency(emp.otherPenalityTotal || 0));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "final-net-card" },
        });
        /** @type {__VLS_StyleScopedClasses['final-net-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calculation-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['calculation-summary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calc-row" },
        });
        /** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.governmentNet));
        if (emp.latePenalty > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "calc-row" },
            });
            /** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (__VLS_ctx.formatCurrency(emp.latePenalty));
        }
        if ((emp.otherPenalityTotal || 0) > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "calc-row" },
            });
            /** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (__VLS_ctx.formatCurrency(emp.otherPenalityTotal || 0));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calc-divider" },
        });
        /** @type {__VLS_StyleScopedClasses['calc-divider']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calc-row final" },
        });
        /** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['final']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "final-amount" },
        });
        /** @type {__VLS_StyleScopedClasses['final-amount']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(emp.finalNetPay));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calculation-note" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['calculation-note']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        if (emp.isOnHold) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "hold-note" },
            });
            /** @type {__VLS_StyleScopedClasses['hold-note']} */ ;
            (emp.holdDetails?.reason);
        }
    }
    // @ts-ignore
    [formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency,];
}
if (__VLS_ctx.filteredPayrollData.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "12",
        ...{ class: "empty-state-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state-content" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.formatMonth(__VLS_ctx.selectedMonth));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-sub']} */ ;
}
if (__VLS_ctx.payrollPagination.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.payrollPagination.totalPages > 1))
                    return;
                __VLS_ctx.changePayrollPage(__VLS_ctx.payrollPagination.page - 1);
                // @ts-ignore
                [formatMonth, selectedMonth, filteredPayrollData, payrollPagination, payrollPagination, changePayrollPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.payrollPagination.page === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.payrollPagination.page);
    (__VLS_ctx.payrollPagination.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.payrollPagination.totalPages > 1))
                    return;
                __VLS_ctx.changePayrollPage(__VLS_ctx.payrollPagination.page + 1);
                // @ts-ignore
                [payrollPagination, payrollPagination, payrollPagination, payrollPagination, changePayrollPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.payrollPagination.page === __VLS_ctx.payrollPagination.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.changePayrollLimit) },
        value: (__VLS_ctx.payrollPagination.limit),
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
}
if (__VLS_ctx.showPenalityModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePenalityModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container Penality-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['Penality-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-info-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-info-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-avatar']} */ ;
    (__VLS_ctx.getInitials(__VLS_ctx.editingEmployee?.fullName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.editingEmployee?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-meta']} */ ;
    (__VLS_ctx.editingEmployee?.employeeCode);
    (__VLS_ctx.editingEmployee?.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePenalityModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "checkbox-label" },
    });
    /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.hasHold);
    if (__VLS_ctx.hasHold) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "hold-details" },
        });
        /** @type {__VLS_StyleScopedClasses['hold-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "duration-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['duration-buttons']} */ ;
        for (const [n] of __VLS_vFor((6))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showPenalityModal))
                            return;
                        if (!(__VLS_ctx.hasHold))
                            return;
                        __VLS_ctx.holdDuration = n;
                        // @ts-ignore
                        [payrollPagination, payrollPagination, payrollPagination, changePayrollLimit, showPenalityModal, closePenalityModal, closePenalityModal, getInitials, editingEmployee, editingEmployee, editingEmployee, editingEmployee, hasHold, hasHold, holdDuration,];
                    } },
                key: (n),
                ...{ class: (['duration-btn', { active: __VLS_ctx.holdDuration === n }]) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['duration-btn']} */ ;
            (n);
            // @ts-ignore
            [holdDuration,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (__VLS_ctx.holdReason),
            placeholder: "Reason for hold",
            ...{ class: "form-input" },
        });
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.removeEmployeeHold) },
            ...{ class: "btn-warning-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-warning-small']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "Penality-list" },
    });
    /** @type {__VLS_StyleScopedClasses['Penality-list']} */ ;
    for (const [ded, idx] of __VLS_vFor((__VLS_ctx.employeePenality))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "Penality-item" },
        });
        /** @type {__VLS_StyleScopedClasses['Penality-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "Penality-header" },
        });
        /** @type {__VLS_StyleScopedClasses['Penality-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (ded.name || "New Penality");
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showPenalityModal))
                        return;
                    __VLS_ctx.removePenality(idx);
                    // @ts-ignore
                    [holdReason, removeEmployeeHold, employeePenality, removePenality,];
                } },
            ...{ class: "remove-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "Penality-fields" },
        });
        /** @type {__VLS_StyleScopedClasses['Penality-fields']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (ded.name),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Absent Penalty",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Lateness",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Unauthorized Leave",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Poor Performance",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Policy Violation",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Asset Penalty",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Misconduct",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Suspension",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (ded.reference),
            placeholder: "Hardcopy Reference #",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (ded.submittedBy),
            placeholder: "Submitted By",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (ded.contact),
            placeholder: "Contact",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (ded.type),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "fixed",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "percent",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            placeholder: "Amount",
        });
        (ded.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (ded.reason),
            placeholder: "Reason for penalty/Penalty...",
            rows: "2",
        });
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addPenality) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePenalityModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.savePenality) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingPenality),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.savingPenality ? "Saving..." : "Save Changes");
}
if (__VLS_ctx.showExportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container export-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['export-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "export-options" },
    });
    /** @type {__VLS_StyleScopedClasses['export-options']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'government';
                // @ts-ignore
                [closePenalityModal, addPenality, savePenality, savingPenality, savingPenality, showExportModal, closeExportModal, closeExportModal, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "government",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'internal';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "internal",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'full';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "full",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportSelectedReport) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.exporting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.exporting ? "Exporting..." : "Export");
}
if (__VLS_ctx.showToast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.toastMessage);
}
// @ts-ignore
[exporting, exporting, closeExportModal, exportType, exportSelectedReport, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
});
export default {};
