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
const emit = defineEmits(['payment-processed', 'returned-updated']);
// ==================== STATE ====================
const search = ref("");
const monthFilter = ref("");
const yearFilter = ref("");
const deptFilter = ref("all");
const statusFilter = ref("all");
const exporting = ref(false);
const processingPaymentLocal = ref(false);
const loading = ref(false);
const pagination = ref({ currentPage: 1, recordsPerPage: 10, totalRecords: 0, totalPages: 1 });
// Modal state
const showPaymentModal = ref(false);
const selectedItem = ref(null);
const paymentType = ref("full");
const paymentPercent = ref(100);
const paymentAmount = ref(0);
const paymentMethod = ref("Cash");
const transactionReference = ref("");
const cashReference = ref("");
const paymentNotes = ref("");
const isManualEdit = ref(false);
// Local data
const returnedList = ref([]);
// Message toast
const message = ref({ show: false, type: '', text: '' });
let messageTimeout = null;
// ==================== COMPUTED ====================
const availableYears = computed(() => {
    const years = [...new Set(returnedList.value.map(p => p.month?.split('-')[0]).filter(Boolean))];
    return years.sort((a, b) => b - a);
});
const remainingAmount = computed(() => {
    if (!selectedItem.value)
        return 0;
    return parseFloat(selectedItem.value.remaining_amount || selectedItem.value.original_amount || 0);
});
const calculatedAmount = computed(() => {
    if (paymentType.value === "percent") {
        return Math.floor((remainingAmount.value * paymentPercent.value) / 100);
    }
    return paymentAmount.value;
});
const isValidPayment = computed(() => {
    if (paymentType.value === "full")
        return true;
    if (paymentType.value === "percent") {
        return paymentPercent.value > 0 && paymentPercent.value <= 100;
    }
    if (paymentType.value === "amount") {
        return paymentAmount.value > 0 && paymentAmount.value <= remainingAmount.value;
    }
    return false;
});
const filteredReturned = computed(() => {
    let data = [...returnedList.value];
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
    if (statusFilter.value !== "all") {
        data = data.filter(e => e.status === statusFilter.value);
    }
    pagination.value.totalRecords = data.length;
    pagination.value.totalPages = Math.ceil(data.length / pagination.value.recordsPerPage) || 1;
    if (pagination.value.currentPage > pagination.value.totalPages) {
        pagination.value.currentPage = 1;
    }
    return data;
});
const paginatedReturned = computed(() => {
    const start = (pagination.value.currentPage - 1) * pagination.value.recordsPerPage;
    const end = start + pagination.value.recordsPerPage;
    return filteredReturned.value.slice(start, end);
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
function getStatusClass(status) {
    const classes = {
        pending: 'status-pending',
        partially_paid: 'status-partial',
        paid: 'status-paid'
    };
    return classes[status] || 'status-pending';
}
function getStatusText(status) {
    const texts = {
        pending: 'Pending',
        partially_paid: 'Partially Paid',
        paid: 'Fully Paid'
    };
    return texts[status] || status;
}
function showTemporaryMessage(type, text) {
    if (messageTimeout)
        clearTimeout(messageTimeout);
    message.value = { show: true, type, text };
    messageTimeout = setTimeout(() => {
        message.value.show = false;
    }, 3000);
}
function changePage(page) {
    pagination.value.currentPage = page;
    loadReturnedData();
}
function changeLimit() {
    pagination.value.currentPage = 1;
    pagination.value.recordsPerPage = parseInt(pagination.value.recordsPerPage);
    loadReturnedData();
}
function onSearchChange() {
    pagination.value.currentPage = 1;
    loadReturnedData();
}
function onFilterChange() {
    pagination.value.currentPage = 1;
    loadReturnedData();
}
// ==================== API METHODS ====================
async function loadReturnedData() {
    loading.value = true;
    try {
        const response = await payrollService.getReturnedPayroll({
            page: pagination.value.currentPage,
            limit: pagination.value.recordsPerPage,
            month: monthFilter.value,
            year: yearFilter.value,
            department: deptFilter.value,
            search: search.value,
            status: statusFilter.value
        });
        if (response.success) {
            returnedList.value = response.data || [];
            if (response.pagination) {
                pagination.value = {
                    currentPage: response.pagination.currentPage || 1,
                    recordsPerPage: response.pagination.recordsPerPage || 10,
                    totalRecords: response.pagination.totalRecords || 0,
                    totalPages: response.pagination.totalPages || 1
                };
            }
        }
        else {
            console.error('Failed to load returned data:', response.error);
            returnedList.value = [];
        }
    }
    catch (error) {
        console.error('Error loading returned data:', error);
        returnedList.value = [];
    }
    finally {
        loading.value = false;
    }
}
// ==================== PAYMENT METHODS ====================
function generatePaymentNotes() {
    if (isManualEdit.value)
        return;
    const employee = selectedItem.value;
    if (!employee)
        return;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let notes = `[${date}] `;
    if (paymentType.value === 'full') {
        notes += `✅ FULL PAYMENT - `;
    }
    else if (paymentType.value === 'percent') {
        notes += `📊 PARTIAL PAYMENT (${paymentPercent.value}%) - `;
    }
    else {
        notes += `💰 PARTIAL PAYMENT (Fixed Amount) - `;
    }
    if (paymentMethod.value === 'Bank Transfer') {
        const ref = transactionReference.value || 'pending reference';
        notes += `Paid via BANK TRANSFER with Reference #${ref}. `;
    }
    else {
        const ref = cashReference.value || 'pending receipt';
        notes += `Paid via CASH with Receipt #${ref}. `;
    }
    const paidAmount = calculatedAmount.value;
    const keptAmount = remainingAmount.value - paidAmount;
    notes += `Paid ${formatCurrency(paidAmount)} to employee. `;
    notes += `Remaining ${formatCurrency(keptAmount)} kept by company. `;
    if (employee.return_reason) {
        notes += `Original return reason: ${employee.return_reason}.`;
    }
    paymentNotes.value = notes;
}
function onNotesEdit() {
    isManualEdit.value = true;
}
function calculatePercentAmount() {
    if (paymentPercent.value > 100)
        paymentPercent.value = 100;
    if (paymentPercent.value < 0)
        paymentPercent.value = 0;
    generatePaymentNotes();
}
function validateAmount() {
    if (paymentAmount.value > remainingAmount.value) {
        paymentAmount.value = remainingAmount.value;
    }
    if (paymentAmount.value < 0)
        paymentAmount.value = 0;
    generatePaymentNotes();
}
function openPaymentModal(item) {
    selectedItem.value = { ...item };
    paymentType.value = "full";
    paymentPercent.value = 100;
    paymentAmount.value = remainingAmount.value;
    paymentMethod.value = "Cash";
    transactionReference.value = "";
    cashReference.value = "";
    isManualEdit.value = false;
    generatePaymentNotes();
    showPaymentModal.value = true;
}
function closePaymentModal() {
    showPaymentModal.value = false;
    setTimeout(() => {
        selectedItem.value = null;
        isManualEdit.value = false;
    }, 300);
}
async function confirmPayment() {
    if (!isValidPayment.value)
        return;
    if (!selectedItem.value)
        return;
    processingPaymentLocal.value = true;
    const itemToPay = { ...selectedItem.value };
    const paidAmount = paymentType.value === "full"
        ? remainingAmount.value
        : (paymentType.value === "percent" ? calculatedAmount.value : paymentAmount.value);
    const keptAmount = remainingAmount.value - paidAmount;
    const reference = paymentMethod.value === "Bank Transfer"
        ? transactionReference.value || `TXN${Date.now()}`
        : cashReference.value || `CASH${Date.now()}`;
    try {
        const response = await payrollService.payReturnedPayroll(itemToPay.returned_id, {
            paymentType: paymentType.value,
            paidAmount: paidAmount,
            keptAmount: keptAmount,
            percentagePaid: paymentType.value === "percent" ? paymentPercent.value : null,
            paymentMethod: paymentMethod.value,
            transactionReference: reference,
            paymentNotes: paymentNotes.value
        });
        if (response.success) {
            // Refresh the list
            await loadReturnedData();
            emit('payment-processed', response.data.paymentRecord);
            emit('returned-updated');
            closePaymentModal();
            showTemporaryMessage('success', `Payment of ${formatCurrency(paidAmount)} processed successfully!`);
        }
        else {
            showTemporaryMessage('error', response.error || 'Failed to process payment');
        }
    }
    catch (error) {
        console.error('Payment error:', error);
        showTemporaryMessage('error', 'Failed to process payment. Please try again.');
    }
    finally {
        processingPaymentLocal.value = false;
    }
}
// ==================== EXPORT ====================
async function exportReturned() {
    exporting.value = true;
    try {
        const headers = ["Employee Code", "Employee Name", "Department", "Payroll Month", "Return Date", "Original Amount", "Paid Amount", "Kept Amount", "Status", "Return Reason"];
        const rows = filteredReturned.value.map(r => [
            r.employee_code,
            r.employee_name,
            r.department,
            r.month,
            r.return_date,
            parseFloat(r.original_amount),
            parseFloat(r.paid_amount || 0),
            parseFloat(r.kept_amount || 0),
            r.status,
            r.return_reason || '-'
        ]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `returned_payroll_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showTemporaryMessage('success', `Exported ${filteredReturned.value.length} records`);
    }
    catch (error) {
        console.error("Export error:", error);
        showTemporaryMessage('error', 'Failed to export data');
    }
    finally {
        exporting.value = false;
    }
}
// ==================== WATCHERS ====================
watch([paymentType, paymentPercent, paymentAmount, paymentMethod, transactionReference, cashReference], () => {
    if (!isManualEdit.value && selectedItem.value) {
        generatePaymentNotes();
    }
});
// ==================== INITIALIZATION ====================
onMounted(() => {
    loadReturnedData();
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
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary-pay']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary-pay']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.statusFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "pending",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "partially_paid",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "paid",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportReturned) },
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
else {
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [item] of __VLS_vFor((__VLS_ctx.paginatedReturned))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.returned_id),
        });
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
        (__VLS_ctx.formatDate(item.return_date));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        (__VLS_ctx.formatCurrency(parseFloat(item.original_amount)));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right text-green" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
        (__VLS_ctx.formatCurrency(parseFloat(item.paid_amount || 0)));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.formatCurrency(parseFloat(item.kept_amount || 0)));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge" },
            ...{ class: (__VLS_ctx.getStatusClass(item.status)) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.getStatusText(item.status));
        if (item.status === 'partially_paid') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "progress-bar" },
            });
            /** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "progress-fill" },
                ...{ style: ({ width: item.percent_paid + '%' }) },
            });
            /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "progress-text" },
            });
            /** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
            (item.percent_paid);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        if (item.status !== 'paid') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(item.status !== 'paid'))
                            return;
                        __VLS_ctx.openPaymentModal(item);
                        // @ts-ignore
                        [onFilterChange, statusFilter, exportReturned, exporting, exporting, exporting, loading, paginatedReturned, formatMonth, formatDate, formatCurrency, formatCurrency, formatCurrency, getStatusClass, getStatusText, openPaymentModal,];
                    } },
                ...{ class: "btn-small success" },
                disabled: (__VLS_ctx.processingPaymentLocal),
            });
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
            /** @type {__VLS_StyleScopedClasses['success']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "paid-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['paid-badge']} */ ;
        }
        // @ts-ignore
        [processingPaymentLocal,];
    }
    if (__VLS_ctx.filteredReturned.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "9",
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
                [loading, filteredReturned, pagination, pagination, changePage,];
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
}
if (__VLS_ctx.showPaymentModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePaymentModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container payment-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['payment-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedItem?.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePaymentModal) },
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
    (__VLS_ctx.selectedItem?.employee_name);
    (__VLS_ctx.selectedItem?.employee_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedItem?.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatMonth(__VLS_ctx.selectedItem?.month));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "text-purple" },
    });
    /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
    (__VLS_ctx.formatCurrency(parseFloat(__VLS_ctx.selectedItem?.original_amount || 0)));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "text-green" },
    });
    /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
    (__VLS_ctx.formatCurrency(parseFloat(__VLS_ctx.selectedItem?.paid_amount || 0)));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "text-orange" },
    });
    /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
    (__VLS_ctx.formatCurrency(parseFloat(__VLS_ctx.selectedItem?.remaining_amount || __VLS_ctx.selectedItem?.original_amount)));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "text-red" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
    (__VLS_ctx.selectedItem?.return_reason || 'No reason provided');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.generatePaymentNotes) },
        value: (__VLS_ctx.paymentType),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "full",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "percent",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "amount",
    });
    if (__VLS_ctx.paymentType === 'percent') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!(__VLS_ctx.showPaymentModal))
                        return;
                    if (!(__VLS_ctx.paymentType === 'percent'))
                        return;
                    __VLS_ctx.calculatePercentAmount;
                    __VLS_ctx.generatePaymentNotes;
                    // @ts-ignore
                    [formatMonth, formatCurrency, formatCurrency, formatCurrency, pagination, pagination, pagination, changeLimit, showPaymentModal, closePaymentModal, closePaymentModal, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, generatePaymentNotes, generatePaymentNotes, paymentType, paymentType, calculatePercentAmount,];
                } },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: "100",
            step: "1",
        });
        (__VLS_ctx.paymentPercent);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "input-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calculation-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['calculation-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-row paid" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['paid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-green" },
        });
        /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.calculatedAmount));
        (__VLS_ctx.paymentPercent);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-row kept" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['kept']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.remainingAmount - __VLS_ctx.calculatedAmount));
        (100 - __VLS_ctx.paymentPercent);
    }
    if (__VLS_ctx.paymentType === 'amount') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!(__VLS_ctx.showPaymentModal))
                        return;
                    if (!(__VLS_ctx.paymentType === 'amount'))
                        return;
                    __VLS_ctx.validateAmount;
                    __VLS_ctx.generatePaymentNotes;
                    // @ts-ignore
                    [formatCurrency, formatCurrency, generatePaymentNotes, paymentType, paymentPercent, paymentPercent, paymentPercent, calculatedAmount, calculatedAmount, remainingAmount, validateAmount,];
                } },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: (__VLS_ctx.remainingAmount),
            step: "100",
        });
        (__VLS_ctx.paymentAmount);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "input-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.remainingAmount));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calculation-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['calculation-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-row paid" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['paid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-green" },
        });
        /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.paymentAmount));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-row kept" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['kept']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-red" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.remainingAmount - __VLS_ctx.paymentAmount));
    }
    if (__VLS_ctx.paymentType === 'full') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-banner full" },
        });
        /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
        /** @type {__VLS_StyleScopedClasses['full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.remainingAmount));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.generatePaymentNotes) },
        value: (__VLS_ctx.paymentMethod),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Cash",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Bank Transfer",
    });
    if (__VLS_ctx.paymentMethod === 'Bank Transfer') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.generatePaymentNotes) },
            type: "text",
            value: (__VLS_ctx.transactionReference),
            ...{ class: "form-input" },
            placeholder: "Enter transaction ID",
        });
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    }
    if (__VLS_ctx.paymentMethod === 'Cash') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.generatePaymentNotes) },
            type: "text",
            value: (__VLS_ctx.cashReference),
            ...{ class: "form-input" },
            placeholder: "Enter receipt number",
        });
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        ...{ onInput: (__VLS_ctx.onNotesEdit) },
        value: (__VLS_ctx.paymentNotes),
        ...{ class: "form-textarea" },
        rows: "5",
        placeholder: "Payment notes will appear here...",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-note" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-note']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePaymentModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmPayment) },
        ...{ class: "btn-primary-pay" },
        disabled: (__VLS_ctx.processingPaymentLocal || !__VLS_ctx.isValidPayment),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary-pay']} */ ;
    (__VLS_ctx.processingPaymentLocal ? "Processing..." : "Confirm Payment");
}
// @ts-ignore
[formatCurrency, formatCurrency, formatCurrency, formatCurrency, processingPaymentLocal, processingPaymentLocal, closePaymentModal, generatePaymentNotes, generatePaymentNotes, generatePaymentNotes, paymentType, remainingAmount, remainingAmount, remainingAmount, remainingAmount, paymentAmount, paymentAmount, paymentAmount, paymentMethod, paymentMethod, paymentMethod, transactionReference, cashReference, onNotesEdit, paymentNotes, confirmPayment, isValidPayment,];
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
