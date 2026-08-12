import { ref, computed, onMounted, watch } from "vue";
import payrollService from "@/stores/payrollService";
// ==================== PROPS ====================
const props = defineProps({
    departments: {
        type: Array,
        default: () => []
    }
});
// ==================== EMITS ====================
const emit = defineEmits(['payment-processed', 'unclaimed-updated']);
// ==================== STATE ====================
const search = ref("");
const monthFilter = ref("");
const yearFilter = ref("");
const deptFilter = ref("all");
const overdueDaysThreshold = ref("");
const exporting = ref(false);
const movingToReturned = ref(false);
const processingPayment = ref(false);
const loading = ref(false);
const pagination = ref({ currentPage: 1, recordsPerPage: 10, totalRecords: 0, totalPages: 1 });
// Modal states
const showPayNowModal = ref(false);
const showBulkReturnModal = ref(false);
// Selected items
const selectedItem = ref(null);
const bulkReturnItems = ref([]);
const bulkReturnReason = ref("");
const paymentNotes = ref("");
const paymentMethod = ref("Bank Transfer");
// Selection state
const selectedUnclaimedIds = ref([]);
const selectAll = ref(false);
// Local data
const unclaimedList = ref([]);
// ==================== COMPUTED ====================
const availableYears = computed(() => {
    const years = [...new Set(unclaimedList.value.map(p => p.month?.split('-')[0]).filter(Boolean))];
    return years.sort((a, b) => b - a);
});
const filteredUnclaimed = computed(() => {
    let data = [...unclaimedList.value];
    if (search.value) {
        const searchLower = search.value.toLowerCase();
        data = data.filter(e => e.employee_name?.toLowerCase().includes(searchLower) ||
            e.employee_code?.toLowerCase().includes(searchLower));
    }
    if (monthFilter.value) {
        data = data.filter(e => e.month?.split('-')[1] === monthFilter.value);
    }
    if (yearFilter.value) {
        data = data.filter(e => e.month?.startsWith(yearFilter.value));
    }
    if (deptFilter.value !== "all") {
        data = data.filter(e => e.department === deptFilter.value);
    }
    if (overdueDaysThreshold.value && overdueDaysThreshold.value > 0) {
        data = data.filter(e => e.days_overdue >= overdueDaysThreshold.value);
    }
    return data;
});
const paginatedUnclaimed = computed(() => {
    const start = (pagination.value.currentPage - 1) * pagination.value.recordsPerPage;
    const end = start + pagination.value.recordsPerPage;
    return filteredUnclaimed.value.slice(start, end);
});
const bulkReturnTotalAmount = computed(() => {
    return bulkReturnItems.value.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
});
// ==================== METHODS ====================
function formatCurrency(amt) {
    return payrollService.formatCurrency(amt);
}
function formatDate(d) {
    return payrollService.formatDate(d);
}
function formatMonth(m) {
    return payrollService.formatMonth(m);
}
function getOverdueClass(days) {
    if (days > 60)
        return 'critical';
    if (days > 30)
        return 'high';
    if (days > 14)
        return 'medium';
    if (days > 0)
        return 'low';
    return 'new';
}
function changePage(page) {
    pagination.value.currentPage = page;
    loadUnclaimedData();
}
function changeLimit() {
    pagination.value.currentPage = 1;
    loadUnclaimedData();
}
function onSearchChange() {
    pagination.value.currentPage = 1;
    loadUnclaimedData();
}
function onFilterChange() {
    pagination.value.currentPage = 1;
    loadUnclaimedData();
}
// ==================== API METHODS ====================
async function loadUnclaimedData() {
    loading.value = true;
    try {
        const response = await payrollService.getUnclaimedPayroll({
            page: pagination.value.currentPage,
            limit: pagination.value.recordsPerPage,
            month: monthFilter.value,
            year: yearFilter.value,
            department: deptFilter.value,
            search: search.value
        });
        if (response.success) {
            unclaimedList.value = response.data || [];
            if (response.pagination) {
                pagination.value = {
                    currentPage: response.pagination.currentPage || 1,
                    recordsPerPage: response.pagination.recordsPerPage || 10,
                    totalRecords: response.pagination.totalRecords || 0,
                    totalPages: response.pagination.totalPages || 1
                };
            }
            clearSelection();
        }
        else {
            console.error('Failed to load unclaimed data:', response.error);
            unclaimedList.value = [];
        }
    }
    catch (error) {
        console.error('Error loading unclaimed data:', error);
        unclaimedList.value = [];
    }
    finally {
        loading.value = false;
    }
}
// ==================== PAY NOW METHODS ====================
function openPayNowModal(item) {
    // Store a copy of the item to avoid reference issues
    selectedItem.value = { ...item };
    const overdueText = item.days_overdue > 0
        ? `Payment processed after ${item.days_overdue} days of overdue. `
        : `Payment processed on time. `;
    paymentNotes.value = overdueText + `Amount: ${formatCurrency(parseFloat(item.amount))} - ${item.employee_name} (${item.employee_code})`;
    paymentMethod.value = "Bank Transfer";
    showPayNowModal.value = true;
}
function closePayNowModal() {
    showPayNowModal.value = false;
    // Don't set selectedItem to null immediately, wait for modal to close
    setTimeout(() => {
        selectedItem.value = null;
        paymentNotes.value = "";
        paymentMethod.value = "Bank Transfer";
    }, 300);
}
async function confirmPayNow() {
    // Check if selectedItem exists before proceeding
    if (!selectedItem.value) {
        console.error('No item selected for payment');
        closePayNowModal();
        return;
    }
    processingPayment.value = true;
    // Store the selected item data before closing modal
    const itemToPay = { ...selectedItem.value };
    const amount = parseFloat(itemToPay.amount || 0);
    const employeeName = itemToPay.employee_name || 'Unknown';
    const unclaimedId = itemToPay.unclaimed_id;
    try {
        const response = await payrollService.payUnclaimedSalary(unclaimedId, {
            paymentDate: new Date().toISOString().split('T')[0],
            method: paymentMethod.value,
            notes: paymentNotes.value
        });
        if (response.success) {
            // Remove from local list
            const index = unclaimedList.value.findIndex(u => u.unclaimed_id === unclaimedId);
            if (index !== -1) {
                unclaimedList.value.splice(index, 1);
            }
            // Emit event to refresh payment history
            emit('payment-processed', response.data.paymentRecord);
            emit('unclaimed-updated');
            closePayNowModal();
            clearSelection();
            // Show success message (you can replace this with a toast/notification)
            console.log(`Payment of ${formatCurrency(amount)} processed successfully for ${employeeName}`);
            // Optional: Show a temporary success indicator
            showTemporaryMessage('success', `Payment of ${formatCurrency(amount)} processed successfully!`);
        }
        else {
            console.error('Payment failed:', response.error);
            showTemporaryMessage('error', response.error || 'Failed to process payment');
            closePayNowModal();
        }
    }
    catch (error) {
        console.error('Error processing payment:', error);
        showTemporaryMessage('error', 'Failed to process payment. Please try again.');
        closePayNowModal();
    }
    finally {
        processingPayment.value = false;
    }
}
// ==================== BULK RETURN METHODS ====================
function openBulkReturnConfirmation() {
    bulkReturnItems.value = filteredUnclaimed.value.filter(item => selectedUnclaimedIds.value.includes(item.unclaimed_id));
    bulkReturnReason.value = "";
    showBulkReturnModal.value = true;
}
function closeBulkReturnModal() {
    showBulkReturnModal.value = false;
    setTimeout(() => {
        bulkReturnItems.value = [];
        bulkReturnReason.value = "";
    }, 300);
}
async function confirmBulkReturn() {
    if (bulkReturnItems.value.length === 0) {
        console.error('No items selected for return');
        closeBulkReturnModal();
        return;
    }
    movingToReturned.value = true;
    const itemsToReturn = [...bulkReturnItems.value];
    const unclaimedIds = itemsToReturn.map(item => item.unclaimed_id);
    try {
        const response = await payrollService.bulkReturnUnclaimed(unclaimedIds, bulkReturnReason.value);
        if (response.success) {
            // Remove returned items from local list
            for (const item of itemsToReturn) {
                const index = unclaimedList.value.findIndex(u => u.unclaimed_id === item.unclaimed_id);
                if (index !== -1) {
                    unclaimedList.value.splice(index, 1);
                }
            }
            closeBulkReturnModal();
            clearSelection();
            emit('unclaimed-updated');
            console.log(`${response.data.returnedCount} salaries marked as returned successfully`);
            showTemporaryMessage('success', `${response.data.returnedCount} salaries marked as returned successfully!`);
        }
        else {
            console.error('Bulk return failed:', response.error);
            showTemporaryMessage('error', response.error || 'Failed to process bulk return');
            closeBulkReturnModal();
        }
    }
    catch (error) {
        console.error('Error in bulk return:', error);
        showTemporaryMessage('error', 'Failed to process bulk return. Please try again.');
        closeBulkReturnModal();
    }
    finally {
        movingToReturned.value = false;
    }
}
// ==================== TEMPORARY MESSAGE SYSTEM ====================
const message = ref({ show: false, type: '', text: '' });
let messageTimeout = null;
function showTemporaryMessage(type, text) {
    // Clear existing timeout
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    message.value = { show: true, type, text };
    // Auto-hide after 3 seconds
    messageTimeout = setTimeout(() => {
        message.value.show = false;
    }, 3000);
}
// ==================== SELECTION METHODS ====================
function updateSelected() {
    selectedUnclaimedIds.value = filteredUnclaimed.value.filter(item => item.selected).map(item => item.unclaimed_id);
    selectAll.value = selectedUnclaimedIds.value.length === filteredUnclaimed.value.length && filteredUnclaimed.value.length > 0;
}
function toggleSelectAll() {
    filteredUnclaimed.value.forEach(item => item.selected = selectAll.value);
    updateSelected();
}
function clearSelection() {
    selectedUnclaimedIds.value = [];
    selectAll.value = false;
    unclaimedList.value.forEach(item => item.selected = false);
}
// ==================== EXPORT ====================
async function exportUnclaimed() {
    exporting.value = true;
    try {
        const headers = ["Employee Code", "Employee Name", "Department", "Payroll Month", "Due Date", "Amount (ETB)", "Days Overdue"];
        const rows = filteredUnclaimed.value.map(u => [
            u.employee_code,
            u.employee_name,
            u.department,
            u.month,
            u.due_date,
            parseFloat(u.amount),
            u.days_overdue
        ]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `unclaimed_salary_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    catch (error) {
        console.error("Export error:", error);
    }
    finally {
        exporting.value = false;
    }
}
// ==================== WATCHERS ====================
watch(() => props.departments, () => {
    loadUnclaimedData();
}, { deep: true });
// ==================== INITIALIZATION ====================
onMounted(() => {
    loadUnclaimedData();
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
/** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['days-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['pay']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['simple-body']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary-pay']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
if (__VLS_ctx.message.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast-message" },
        ...{ class: (__VLS_ctx.message.type) },
    });
    /** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
    (__VLS_ctx.message.type === 'success' ? '✓' : '⚠️');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-text" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-text']} */ ;
    (__VLS_ctx.message.text);
}
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
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.onSearchChange) },
    type: "text",
    value: (__VLS_ctx.search),
    placeholder: "Search employee...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.monthFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "01",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "02",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "03",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "04",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "05",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "06",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "07",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "08",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "09",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "11",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "12",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.yearFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [year] of __VLS_vFor((__VLS_ctx.availableYears))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (year),
        value: (year),
    });
    (year);
    // @ts-ignore
    [message, message, message, message, onSearchChange, search, onFilterChange, onFilterChange, monthFilter, yearFilter, availableYears,];
}
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
    [onFilterChange, deptFilter, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "days-filter-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['days-filter-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.onFilterChange) },
    type: "number",
    placeholder: "overdue",
    ...{ class: "days-input" },
    min: "0",
});
(__VLS_ctx.overdueDaysThreshold);
/** @type {__VLS_StyleScopedClasses['days-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "days-suffix" },
});
/** @type {__VLS_StyleScopedClasses['days-suffix']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportUnclaimed) },
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
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.selectedUnclaimedIds.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bulk-actions-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-actions-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "selected-count" },
    });
    /** @type {__VLS_StyleScopedClasses['selected-count']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.selectedUnclaimedIds.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bulk-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openBulkReturnConfirmation) },
        ...{ class: "btn-warning" },
        disabled: (__VLS_ctx.movingToReturned),
    });
    /** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
    if (__VLS_ctx.movingToReturned) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearSelection) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (!__VLS_ctx.loading) {
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.toggleSelectAll) },
        type: "checkbox",
    });
    (__VLS_ctx.selectAll);
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [item] of __VLS_vFor((__VLS_ctx.paginatedUnclaimed))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.unclaimed_id),
            ...{ class: ({ 'overdue-critical': item.days_overdue > 60 }) },
        });
        /** @type {__VLS_StyleScopedClasses['overdue-critical']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.updateSelected) },
            type: "checkbox",
        });
        (item.selected);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (item.employee_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-code" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
        (item.employee_code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (item.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.formatMonth(item.month));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.formatDate(item.due_date));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right net" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['net']} */ ;
        (__VLS_ctx.formatCurrency(parseFloat(item.amount)));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "overdue-badge" },
            ...{ class: (__VLS_ctx.getOverdueClass(item.days_overdue)) },
        });
        /** @type {__VLS_StyleScopedClasses['overdue-badge']} */ ;
        (item.days_overdue);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openPayNowModal(item);
                    // @ts-ignore
                    [onFilterChange, overdueDaysThreshold, exportUnclaimed, exporting, exporting, exporting, loading, loading, selectedUnclaimedIds, selectedUnclaimedIds, openBulkReturnConfirmation, movingToReturned, movingToReturned, clearSelection, toggleSelectAll, selectAll, paginatedUnclaimed, updateSelected, formatMonth, formatDate, formatCurrency, getOverdueClass, openPayNowModal,];
                } },
            ...{ class: "btn-small pay" },
            disabled: (__VLS_ctx.processingPayment),
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        /** @type {__VLS_StyleScopedClasses['pay']} */ ;
        // @ts-ignore
        [processingPayment,];
    }
    if (__VLS_ctx.filteredUnclaimed.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "8",
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
}
if (!__VLS_ctx.loading && __VLS_ctx.pagination.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.loading && __VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.currentPage - 1);
                // @ts-ignore
                [loading, filteredUnclaimed, pagination, pagination, changePage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.currentPage === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.pagination.currentPage);
    (__VLS_ctx.pagination.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.loading && __VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.currentPage + 1);
                // @ts-ignore
                [pagination, pagination, pagination, pagination, changePage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.currentPage === __VLS_ctx.pagination.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.changeLimit) },
        value: (__VLS_ctx.pagination.recordsPerPage),
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
if (__VLS_ctx.showPayNowModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePayNowModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container simple-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['simple-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePayNowModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body simple-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    /** @type {__VLS_StyleScopedClasses['simple-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedItem?.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "amount-text" },
    });
    /** @type {__VLS_StyleScopedClasses['amount-text']} */ ;
    (__VLS_ctx.formatCurrency(parseFloat(__VLS_ctx.selectedItem?.amount || 0)));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.paymentMethod),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Bank Transfer",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Cash",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Cheque",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.paymentNotes),
        ...{ class: "form-textarea-small" },
        rows: "3",
        placeholder: "Add payment notes...",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePayNowModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmPayNow) },
        ...{ class: "btn-primary-pay" },
        disabled: (__VLS_ctx.processingPayment),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary-pay']} */ ;
    (__VLS_ctx.processingPayment ? "Processing..." : "Confirm Payment");
}
if (__VLS_ctx.showBulkReturnModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeBulkReturnModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container simple-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['simple-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeBulkReturnModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body simple-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    /** @type {__VLS_StyleScopedClasses['simple-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.bulkReturnItems.length);
    (__VLS_ctx.bulkReturnItems.length === 1 ? 'salary' : 'salaries');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "amount-text" },
    });
    /** @type {__VLS_StyleScopedClasses['amount-text']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.bulkReturnTotalAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.bulkReturnReason),
        ...{ class: "form-textarea-small" },
        rows: "2",
        placeholder: "Reason for return (optional)",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeBulkReturnModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmBulkReturn) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.movingToReturned),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.movingToReturned ? "Processing..." : "Confirm Return");
}
// @ts-ignore
[movingToReturned, movingToReturned, formatCurrency, formatCurrency, processingPayment, processingPayment, pagination, pagination, pagination, changeLimit, showPayNowModal, closePayNowModal, closePayNowModal, closePayNowModal, selectedItem, selectedItem, paymentMethod, paymentNotes, confirmPayNow, showBulkReturnModal, closeBulkReturnModal, closeBulkReturnModal, closeBulkReturnModal, bulkReturnItems, bulkReturnItems, bulkReturnTotalAmount, bulkReturnReason, confirmBulkReturn,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        departments: {
            type: Array,
            default: () => []
        }
    },
});
export default {};
