import { ref, computed, onMounted, watch } from "vue";
import payrollService from "@/stores/payrollService";
// ==================== PROPS ====================
const props = defineProps({
    onHoldEmployees: {
        type: Array,
        default: () => []
    },
    departments: {
        type: Array,
        default: () => ['IT', 'Finance', 'Operations', 'HR']
    }
});
// ==================== EMITS ====================
const emit = defineEmits(['release-hold', 'export']);
// ==================== CONSTANTS ====================
const MAX_HOLD_MONTHS = 3;
// ==================== DEMO DATA (1-6 months hold) ====================
const generateDemoData = () => {
    const generateMonthlyDetails = (startDate, monthlySalary, hasPercentagePenalty = false, hasAssetPenalty = false, hasOtherDeductions = false, numMonths = 1) => {
        const details = [];
        const start = new Date(startDate);
        let tempDate = new Date(start);
        for (let i = 0; i < numMonths; i++) {
            const year = tempDate.getFullYear();
            const month = String(tempDate.getMonth() + 1).padStart(2, '0');
            const monthStr = `${year}-${month}`;
            const percentagePenalty = hasPercentagePenalty ? Math.floor(monthlySalary * (Math.random() * 0.05 + 0.02)) : 0;
            const assetPenalty = hasAssetPenalty ? Math.floor(Math.random() * 1000) : 0;
            const otherDeductions = hasOtherDeductions ? Math.floor(Math.random() * 500) : 0;
            const allowances = Math.floor(monthlySalary * 0.45);
            const basicSalary = monthlySalary;
            const totalDeductions = percentagePenalty + assetPenalty + otherDeductions;
            const netAmount = basicSalary + allowances - totalDeductions;
            details.push({
                month: monthStr,
                basicSalary: basicSalary,
                allowances: allowances,
                percentagePenalty: percentagePenalty,
                assetPenalty: assetPenalty,
                otherDeductions: otherDeductions,
                amount: Math.max(0, netAmount)
            });
            tempDate.setMonth(tempDate.getMonth() + 1);
        }
        return details;
    };
    const calculateTotal = (details) => {
        return details.reduce((sum, d) => sum + d.amount, 0);
    };
    // Employee 1: 1 month hold
    const details1 = generateMonthlyDetails(new Date(2024, 4, 15), 18750, true, false, false, 1);
    // Employee 2: 2 months hold
    const details2 = generateMonthlyDetails(new Date(2024, 3, 10), 21000, false, true, false, 2);
    // Employee 3: 3 months hold
    const details3 = generateMonthlyDetails(new Date(2024, 2, 5), 28000, true, true, false, 3);
    // Employee 4: 4 months hold
    const details4 = generateMonthlyDetails(new Date(2024, 0, 20), 32000, false, false, true, 4);
    // Employee 5: 5 months hold
    const details5 = generateMonthlyDetails(new Date(2023, 11, 1), 15000, true, false, true, 5);
    // Employee 6: 6 months hold (max)
    const details6 = generateMonthlyDetails(new Date(2023, 9, 10), 12000, true, true, true, 6);
    // Employee 7: 3 months hold (different)
    const details7 = generateMonthlyDetails(new Date(2024, 1, 25), 22000, false, false, false, 3);
    const demoOnHold = [
        {
            id: 1,
            employeeCode: 'EMP001',
            fullName: 'Biruk Mulualem',
            department: 'IT',
            monthlySalary: 18750,
            totalOnHold: calculateTotal(details1),
            monthsOnHold: details1.length,
            holdStartDate: new Date(2024, 4, 15).toISOString().split('T')[0],
            holdReason: 'Pending disciplinary investigation',
            monthlyDetails: details1
        },
        {
            id: 2,
            employeeCode: 'EMP002',
            fullName: 'Dagmawi Hadgu',
            department: 'IT',
            monthlySalary: 21000,
            totalOnHold: calculateTotal(details2),
            monthsOnHold: details2.length,
            holdStartDate: new Date(2024, 3, 10).toISOString().split('T')[0],
            holdReason: 'Bank account verification pending',
            monthlyDetails: details2
        },
        {
            id: 3,
            employeeCode: 'EMP003',
            fullName: 'Melkamu Zewdu',
            department: 'Operations',
            monthlySalary: 28000,
            totalOnHold: calculateTotal(details3),
            monthsOnHold: details3.length,
            holdStartDate: new Date(2024, 2, 5).toISOString().split('T')[0],
            holdReason: 'Salary dispute under review',
            monthlyDetails: details3
        },
        {
            id: 4,
            employeeCode: 'EMP004',
            fullName: 'Melaku Tewodros',
            department: 'Finance',
            monthlySalary: 32000,
            totalOnHold: calculateTotal(details4),
            monthsOnHold: details4.length,
            holdStartDate: new Date(2024, 0, 20).toISOString().split('T')[0],
            holdReason: 'Missing tax documents',
            monthlyDetails: details4
        },
        {
            id: 5,
            employeeCode: 'EMP005',
            fullName: 'Tamrat Zerihun',
            department: 'IT',
            monthlySalary: 15000,
            totalOnHold: calculateTotal(details5),
            monthsOnHold: details5.length,
            holdStartDate: new Date(2023, 11, 1).toISOString().split('T')[0],
            holdReason: 'Pending legal case',
            monthlyDetails: details5
        },
        {
            id: 6,
            employeeCode: 'EMP006',
            fullName: 'Nuru Seid',
            department: 'Finance',
            monthlySalary: 12000,
            totalOnHold: calculateTotal(details6),
            monthsOnHold: details6.length,
            holdStartDate: new Date(2023, 9, 10).toISOString().split('T')[0],
            holdReason: 'Awaiting HR decision - 6 months max',
            monthlyDetails: details6
        },
        {
            id: 7,
            employeeCode: 'EMP007',
            fullName: 'Tadese Jemberu',
            department: 'Operations',
            monthlySalary: 22000,
            totalOnHold: calculateTotal(details7),
            monthsOnHold: details7.length,
            holdStartDate: new Date(2024, 1, 25).toISOString().split('T')[0],
            holdReason: 'Awaiting document submission',
            monthlyDetails: details7
        }
    ];
    return demoOnHold;
};
// ==================== STATE ====================
const search = ref("");
const deptFilter = ref("all");
const exporting = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
// Modal state
const showSingleReleaseModal = ref(false);
const selectedEmployee = ref(null);
const releaseType = ref("full");
const releasePercent = ref(0);
const releaseAmount = ref(0);
const selectedMonths = ref([]);
const releaseNotes = ref("");
const isManualEdit = ref(false);
const isReleasing = ref(false);
const releasingEmployeeId = ref(null);
// Toast state
const toastVisible = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
// Local data
const localOnHoldList = ref([]);
// ==================== COMPUTED ====================
const totalBasic = computed(() => {
    if (!selectedEmployee.value?.monthlyDetails)
        return 0;
    return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.basicSalary, 0);
});
const totalAllowances = computed(() => {
    if (!selectedEmployee.value?.monthlyDetails)
        return 0;
    return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.allowances, 0);
});
const totalPercentagePenalty = computed(() => {
    if (!selectedEmployee.value?.monthlyDetails)
        return 0;
    return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.percentagePenalty, 0);
});
const totalAssetPenalty = computed(() => {
    if (!selectedEmployee.value?.monthlyDetails)
        return 0;
    return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.assetPenalty, 0);
});
const totalOtherDeductions = computed(() => {
    if (!selectedEmployee.value?.monthlyDetails)
        return 0;
    return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.otherDeductions, 0);
});
const longTermHolds = computed(() => {
    return filteredOnHoldList.value.filter(e => e.monthsOnHold >= MAX_HOLD_MONTHS);
});
const filteredOnHoldList = computed(() => {
    let data = [...localOnHoldList.value];
    if (search.value) {
        const searchLower = search.value.toLowerCase();
        data = data.filter(e => e.fullName?.toLowerCase().includes(searchLower) ||
            e.employeeCode?.toLowerCase().includes(searchLower));
    }
    if (deptFilter.value !== "all") {
        data = data.filter(e => e.department === deptFilter.value);
    }
    pagination.value.total = data.length;
    pagination.value.totalPages = Math.ceil(data.length / pagination.value.limit) || 1;
    return data;
});
const paginatedOnHoldList = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.limit;
    return filteredOnHoldList.value.slice(start, start + pagination.value.limit);
});
const onHoldStats = computed(() => ({
    total: filteredOnHoldList.value.length,
    totalAmount: filteredOnHoldList.value.reduce((sum, e) => sum + (e.totalOnHold || 0), 0),
    maxDuration: filteredOnHoldList.value.length > 0
        ? Math.max(...filteredOnHoldList.value.map(e => e.monthsOnHold))
        : 0
}));
const calculatedReleaseAmount = computed(() => {
    if (!selectedEmployee.value)
        return 0;
    switch (releaseType.value) {
        case "full":
            return selectedEmployee.value.totalOnHold;
        case "partial_months":
            return selectedMonths.value.reduce((sum, idx) => sum + selectedEmployee.value.monthlyDetails[idx].amount, 0);
        case "percent":
            return Math.floor((selectedEmployee.value.totalOnHold * releasePercent.value) / 100);
        case "amount":
            return Math.min(releaseAmount.value, selectedEmployee.value.totalOnHold);
        default:
            return 0;
    }
});
const calculatedRemainingAmount = computed(() => {
    if (!selectedEmployee.value)
        return 0;
    return selectedEmployee.value.totalOnHold - calculatedReleaseAmount.value;
});
// ==================== TOAST METHODS ====================
function showToast(message, type = "success") {
    toastMessage.value = message;
    toastType.value = type;
    toastVisible.value = true;
    setTimeout(() => {
        toastVisible.value = false;
    }, 3000);
}
// ==================== AUTO-GENERATE NOTES METHODS ====================
function generateReleaseNotes() {
    if (isManualEdit.value)
        return;
    const employee = selectedEmployee.value;
    if (!employee)
        return;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let notes = `[${date}] `;
    if (releaseType.value === 'full') {
        notes += `✅ FULL RELEASE - `;
    }
    else if (releaseType.value === 'partial_months') {
        notes += `📅 PARTIAL RELEASE (Specific Months) - `;
    }
    else if (releaseType.value === 'percent') {
        notes += `📊 PERCENTAGE RELEASE (${releasePercent.value}%) - `;
    }
    else {
        notes += `💰 FIXED AMOUNT RELEASE - `;
    }
    if (releaseType.value === 'full') {
        notes += `All held salary (${employee.monthsOnHold} months, total ${formatCurrency(employee.totalOnHold)}) has been released. `;
    }
    else if (releaseType.value === 'partial_months') {
        const selectedMonthsList = selectedMonths.value.map(idx => formatMonth(employee.monthlyDetails[idx].month)).join(', ');
        notes += `Months released: ${selectedMonthsList}. Total released: ${formatCurrency(calculatedReleaseAmount.value)}. `;
        if (calculatedRemainingAmount.value > 0) {
            notes += `Remaining on hold: ${formatCurrency(calculatedRemainingAmount.value)} (${employee.monthsOnHold - selectedMonths.value.length} months). `;
        }
    }
    else if (releaseType.value === 'percent') {
        notes += `${releasePercent.value}% (${formatCurrency(calculatedReleaseAmount.value)}) of total held salary (${formatCurrency(employee.totalOnHold)}) has been released. `;
        if (calculatedRemainingAmount.value > 0) {
            notes += `Remaining on hold: ${formatCurrency(calculatedRemainingAmount.value)} (${100 - releasePercent.value}%). `;
        }
    }
    else {
        notes += `${formatCurrency(releaseAmount.value)} has been released from total held salary of ${formatCurrency(employee.totalOnHold)}. `;
        if (calculatedRemainingAmount.value > 0) {
            notes += `Remaining on hold: ${formatCurrency(calculatedRemainingAmount.value)}. `;
        }
    }
    notes += `Original hold reason: ${employee.holdReason}. `;
    notes += `Employee has been on hold for ${employee.monthsOnHold} months since ${formatDate(employee.holdStartDate)}.`;
    releaseNotes.value = notes;
}
function onNotesEdit() {
    isManualEdit.value = true;
}
// ==================== OTHER METHODS ====================
function formatCurrency(amt) {
    return payrollService.formatCurrency(amt);
}
function formatDate(d) {
    return payrollService.formatDate(d);
}
function formatMonth(m) {
    return payrollService.formatMonth(m);
}
function getDurationClass(months) {
    if (months >= 6)
        return 'critical';
    if (months >= 4)
        return 'warning';
    if (months >= 2)
        return 'medium';
    return 'normal';
}
function changePage(page) {
    pagination.value.page = page;
}
function changeLimit() {
    pagination.value.page = 1;
    pagination.value.limit = parseInt(pagination.value.limit);
}
function onSearchChange() {
    pagination.value.page = 1;
}
function onFilterChange() {
    pagination.value.page = 1;
}
function calculatePercentAmount() {
    if (releasePercent.value > 100)
        releasePercent.value = 100;
    if (releasePercent.value < 0)
        releasePercent.value = 0;
    generateReleaseNotes();
}
function validateAmount() {
    if (releaseAmount.value > (selectedEmployee.value?.totalOnHold || 0)) {
        releaseAmount.value = selectedEmployee.value?.totalOnHold || 0;
    }
    if (releaseAmount.value < 0)
        releaseAmount.value = 0;
    generateReleaseNotes();
}
function openReleaseModal(emp) {
    selectedEmployee.value = emp;
    releaseType.value = "full";
    releasePercent.value = 0;
    releaseAmount.value = 0;
    selectedMonths.value = [];
    isManualEdit.value = false;
    generateReleaseNotes();
    showSingleReleaseModal.value = true;
}
function closeReleaseModal() {
    showSingleReleaseModal.value = false;
    selectedEmployee.value = null;
    selectedMonths.value = [];
    isManualEdit.value = false;
}
async function confirmSingleRelease() {
    if (!selectedEmployee.value) {
        showToast("No employee selected", "error");
        return;
    }
    // Store employee data locally before any potential nullification
    const employee = { ...selectedEmployee.value };
    const releasedAmount = calculatedReleaseAmount.value;
    const remainingAmount = calculatedRemainingAmount.value;
    if (releasedAmount <= 0) {
        showToast("Please select a valid release amount", "error");
        return;
    }
    isReleasing.value = true;
    releasingEmployeeId.value = employee.id;
    try {
        let releasedMonths = [];
        if (releaseType.value === "partial_months") {
            releasedMonths = selectedMonths.value.map(idx => employee.monthlyDetails[idx].month);
        }
        const finalNotes = releaseNotes.value;
        const releaseData = {
            employeeId: employee.id,
            employeeCode: employee.employeeCode,
            employeeName: employee.fullName,
            department: employee.department,
            totalOnHold: employee.totalOnHold,
            releasedAmount: releasedAmount,
            remainingAmount: remainingAmount,
            releaseType: releaseType.value,
            releasePercent: releaseType.value === "percent" ? releasePercent.value : null,
            releasedMonths: releasedMonths,
            releaseReason: finalNotes,
            releaseDate: new Date().toISOString().split('T')[0],
            monthsOnHold: employee.monthsOnHold,
            monthlyDetails: employee.monthlyDetails
        };
        // Remove from local list if fully released
        if (remainingAmount === 0) {
            const index = localOnHoldList.value.findIndex(e => e.id === employee.id);
            if (index !== -1) {
                localOnHoldList.value.splice(index, 1);
            }
        }
        else if (releaseType.value !== "full") {
            // Update the employee's total on hold for partial release
            const index = localOnHoldList.value.findIndex(e => e.id === employee.id);
            if (index !== -1) {
                localOnHoldList.value[index].totalOnHold = remainingAmount;
                // Also update the monthly details if needed
                if (releaseType.value === "partial_months" && releasedMonths.length > 0) {
                    const remainingDetails = localOnHoldList.value[index].monthlyDetails.filter(d => !releasedMonths.includes(d.month));
                    localOnHoldList.value[index].monthlyDetails = remainingDetails;
                    localOnHoldList.value[index].monthsOnHold = remainingDetails.length;
                }
            }
        }
        // Emit the release data to parent
        emit('release-hold', releaseData);
        // Close modal first
        closeReleaseModal();
        // Show toast after modal is closed
        showToast(`${employee.fullName}: ${formatCurrency(releasedAmount)} released successfully!`, "success");
    }
    catch (error) {
        console.error("Release error:", error);
        showToast("Failed to release salary. Please try again.", "error");
    }
    finally {
        isReleasing.value = false;
        releasingEmployeeId.value = null;
    }
}
async function exportOnHoldList() {
    exporting.value = true;
    try {
        const headers = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Total On Hold",
            "Months on Hold",
            "Hold Start Date",
            "Hold Reason"
        ];
        const rows = filteredOnHoldList.value.map((emp) => [
            emp.employeeCode,
            emp.fullName,
            emp.department,
            emp.totalOnHold,
            emp.monthsOnHold,
            emp.holdStartDate,
            emp.holdReason
        ]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `on_hold_employees_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        emit('export', { success: true, count: filteredOnHoldList.value.length });
        showToast(`Exported ${filteredOnHoldList.value.length} on-hold employees`, "success");
    }
    catch (error) {
        console.error("Export error:", error);
        emit('export', { success: false, error: error.message });
        showToast("Failed to export data", "error");
    }
    finally {
        exporting.value = false;
    }
}
// Watch for changes to auto-update notes
watch([releaseType, releasePercent, releaseAmount, selectedMonths], () => {
    if (!isManualEdit.value && selectedEmployee.value) {
        generateReleaseNotes();
    }
});
// ==================== INITIALIZATION ====================
function init() {
    if (props.onHoldEmployees && props.onHoldEmployees.length > 0) {
        localOnHoldList.value = props.onHoldEmployees;
    }
    else {
        localOnHoldList.value = generateDemoData();
    }
}
watch(() => props.onHoldEmployees, (newVal) => {
    if (newVal && newVal.length > 0) {
        localOnHoldList.value = newVal;
    }
}, { deep: true });
onMounted(() => {
    init();
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
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['monthly-breakdown']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['month-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-mini-row']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-mini-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-mini-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-mini-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['normal']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['medium']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['critical']} */ ;
/** @type {__VLS_StyleScopedClasses['long-term']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip-left']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-content']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['monthly-breakdown']} */ ;
/** @type {__VLS_StyleScopedClasses['monthly-breakdown']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
/** @type {__VLS_StyleScopedClasses['total-row']} */ ;
/** @type {__VLS_StyleScopedClasses['months-checkbox-group']} */ ;
/** @type {__VLS_StyleScopedClasses['month-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['month-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-info']} */ ;
/** @type {__VLS_StyleScopedClasses['limit-select']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['release-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-section']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-filters" },
});
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.onSearchChange) },
    type: "text",
    value: (__VLS_ctx.search),
    placeholder: "Search employee...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.deptFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept),
        value: (dept),
    });
    (dept);
    // @ts-ignore
    [onSearchChange, search, onFilterChange, deptFilter, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportOnHoldList) },
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
if (__VLS_ctx.longTermHolds.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-banner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-content" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.longTermHolds.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-mini-row" },
});
/** @type {__VLS_StyleScopedClasses['stats-mini-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-value text-red" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red']} */ ;
(__VLS_ctx.onHoldStats.total);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-value']} */ ;
(__VLS_ctx.formatCurrency(__VLS_ctx.onHoldStats.totalAmount));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-value text-orange" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
(__VLS_ctx.onHoldStats.maxDuration);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-mini-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-mini-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "payroll-table" },
});
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [emp, idx] of __VLS_vFor((__VLS_ctx.paginatedOnHoldList))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (emp.id),
        ...{ class: ({ 'long-term': emp.monthsOnHold >= 6 }) },
    });
    /** @type {__VLS_StyleScopedClasses['long-term']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (emp.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right text-purple" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(emp.totalOnHold));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "duration-badge" },
        ...{ class: (__VLS_ctx.getDurationClass(emp.monthsOnHold)) },
    });
    /** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
    (emp.monthsOnHold);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (__VLS_ctx.formatDate(emp.holdStartDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openReleaseModal(emp);
                // @ts-ignore
                [exportOnHoldList, exporting, exporting, exporting, longTermHolds, longTermHolds, onHoldStats, onHoldStats, onHoldStats, formatCurrency, formatCurrency, paginatedOnHoldList, getDurationClass, formatDate, openReleaseModal,];
            } },
        ...{ class: "btn-small warning" },
        disabled: (__VLS_ctx.releasingEmployeeId === emp.id),
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    if (__VLS_ctx.releasingEmployeeId === emp.id) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small-white" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small-white']} */ ;
    }
    (__VLS_ctx.releasingEmployeeId === emp.id ? "Releasing..." : "Release");
    // @ts-ignore
    [releasingEmployeeId, releasingEmployeeId, releasingEmployeeId,];
}
if (__VLS_ctx.filteredOnHoldList.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "6",
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
}
if (__VLS_ctx.pagination.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
                // @ts-ignore
                [filteredOnHoldList, pagination, pagination, changePage,];
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
}
if (__VLS_ctx.showSingleReleaseModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeReleaseModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container release-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['release-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedEmployee?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeReleaseModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedEmployee?.fullName);
    (__VLS_ctx.selectedEmployee?.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedEmployee?.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "text-purple" },
    });
    /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee?.totalOnHold));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedEmployee?.monthsOnHold);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatDate(__VLS_ctx.selectedEmployee?.holdStartDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedEmployee?.holdReason || "No reason");
    if (__VLS_ctx.selectedEmployee?.monthlyDetails?.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "monthly-breakdown" },
        });
        /** @type {__VLS_StyleScopedClasses['monthly-breakdown']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "breakdown-table" },
        });
        /** @type {__VLS_StyleScopedClasses['breakdown-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [detail] of __VLS_vFor((__VLS_ctx.selectedEmployee.monthlyDetails))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (detail.month),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (__VLS_ctx.formatMonth(detail.month));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            (__VLS_ctx.formatCurrency(detail.basicSalary));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            (__VLS_ctx.formatCurrency(detail.allowances));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (__VLS_ctx.formatCurrency(detail.percentagePenalty));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (__VLS_ctx.formatCurrency(detail.assetPenalty));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right text-red" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
            (__VLS_ctx.formatCurrency(detail.otherDeductions));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right text-purple" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.formatCurrency(detail.amount));
            // @ts-ignore
            [formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatDate, pagination, pagination, pagination, changeLimit, showSingleReleaseModal, closeReleaseModal, closeReleaseModal, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, formatMonth,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: "total-row" },
        });
        /** @type {__VLS_StyleScopedClasses['total-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.totalBasic));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.totalAllowances));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.totalPercentagePenalty));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.totalAssetPenalty));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.totalOtherDeductions));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee?.totalOnHold));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.generateReleaseNotes) },
        value: (__VLS_ctx.releaseType),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "full",
    });
    (__VLS_ctx.selectedEmployee?.monthsOnHold);
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "partial_months",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "percent",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "amount",
    });
    if (__VLS_ctx.releaseType === 'partial_months') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "months-checkbox-group" },
        });
        /** @type {__VLS_StyleScopedClasses['months-checkbox-group']} */ ;
        for (const [detail, idx] of __VLS_vFor((__VLS_ctx.selectedEmployee?.monthlyDetails))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (detail.month),
                ...{ class: "month-checkbox" },
            });
            /** @type {__VLS_StyleScopedClasses['month-checkbox']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (__VLS_ctx.generateReleaseNotes) },
                type: "checkbox",
                value: (idx),
            });
            (__VLS_ctx.selectedMonths);
            (__VLS_ctx.formatMonth(detail.month));
            (__VLS_ctx.formatCurrency(detail.amount));
            // @ts-ignore
            [formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, selectedEmployee, selectedEmployee, selectedEmployee, formatMonth, totalBasic, totalAllowances, totalPercentagePenalty, totalAssetPenalty, totalOtherDeductions, generateReleaseNotes, generateReleaseNotes, releaseType, releaseType, selectedMonths,];
        }
    }
    if (__VLS_ctx.releaseType === 'percent') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!(__VLS_ctx.showSingleReleaseModal))
                        return;
                    if (!(__VLS_ctx.releaseType === 'percent'))
                        return;
                    __VLS_ctx.calculatePercentAmount;
                    __VLS_ctx.generateReleaseNotes;
                    // @ts-ignore
                    [generateReleaseNotes, releaseType, calculatePercentAmount,];
                } },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: "100",
            placeholder: "e.g., 50",
        });
        (__VLS_ctx.releasePercent);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    }
    if (__VLS_ctx.releaseType === 'amount') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!(__VLS_ctx.showSingleReleaseModal))
                        return;
                    if (!(__VLS_ctx.releaseType === 'amount'))
                        return;
                    __VLS_ctx.validateAmount;
                    __VLS_ctx.generateReleaseNotes;
                    // @ts-ignore
                    [generateReleaseNotes, releaseType, releasePercent, validateAmount,];
                } },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: (__VLS_ctx.selectedEmployee?.totalOnHold),
            placeholder: "Enter amount to release",
        });
        (__VLS_ctx.releaseAmount);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    }
    if ((__VLS_ctx.releaseType === 'percent' && __VLS_ctx.releasePercent > 0) ||
        (__VLS_ctx.releaseType === 'amount' && __VLS_ctx.releaseAmount > 0) ||
        (__VLS_ctx.releaseType === 'partial_months' && __VLS_ctx.selectedMonths.length > 0)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-section" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-row" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-green" },
        });
        /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.calculatedReleaseAmount));
        if (__VLS_ctx.calculatedRemainingAmount > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "preview-row" },
            });
            /** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
                ...{ class: "text-orange" },
            });
            /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
            (__VLS_ctx.formatCurrency(__VLS_ctx.calculatedRemainingAmount));
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        ...{ onInput: (__VLS_ctx.onNotesEdit) },
        value: (__VLS_ctx.releaseNotes),
        ...{ class: "form-textarea" },
        rows: "4",
        placeholder: "Release notes will appear here...",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeReleaseModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmSingleRelease) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.isReleasing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.isReleasing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small-white" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small-white']} */ ;
    }
    (__VLS_ctx.isReleasing ? "Processing..." : "Confirm Release");
}
if (__VLS_ctx.toastVisible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.toastMessage);
}
// @ts-ignore
[formatCurrency, formatCurrency, closeReleaseModal, selectedEmployee, releaseType, releaseType, releaseType, selectedMonths, releasePercent, releaseAmount, releaseAmount, calculatedReleaseAmount, calculatedRemainingAmount, calculatedRemainingAmount, onNotesEdit, releaseNotes, confirmSingleRelease, isReleasing, isReleasing, isReleasing, toastVisible, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        onHoldEmployees: {
            type: Array,
            default: () => []
        },
        departments: {
            type: Array,
            default: () => ['IT', 'Finance', 'Operations', 'HR']
        }
    },
});
export default {};
