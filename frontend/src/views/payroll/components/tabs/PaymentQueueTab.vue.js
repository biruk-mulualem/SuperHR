import { ref, computed, onMounted, onUnmounted } from "vue";
import payrollService from "@/stores/payrollService";
const departments = ["IT", "Finance", "Operations", "HR"];
const currentUser = "HR Admin";
// State
const selectedMonth = ref("");
const paymentQueue = ref([]);
const paymentHistory = ref([]);
const paymentSession = ref(null);
const paymentSearch = ref("");
const paymentDeptFilter = ref("all");
const paymentPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const selectAllPayment = ref(false);
const processingPayment = ref(false);
const showPaymentMethodModal = ref(false);
const showBatchModal = ref(false);
const selectedPaymentItem = ref(null);
const selectedPaymentMethod = ref("Cash");
const transactionReference = ref("");
const cashReference = ref("");
const batchMethod = ref("Bank Transfer");
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
// Computed
const filteredPaymentQueue = computed(() => {
    let data = paymentQueue.value;
    if (paymentSearch.value) {
        data = data.filter(e => e.employeeName?.toLowerCase().includes(paymentSearch.value.toLowerCase()));
    }
    if (paymentDeptFilter.value !== "all") {
        data = data.filter(e => e.department === paymentDeptFilter.value);
    }
    paymentPagination.value.total = data.length;
    paymentPagination.value.totalPages = Math.ceil(data.length / paymentPagination.value.limit) || 1;
    return data;
});
const paginatedPaymentQueue = computed(() => {
    const start = (paymentPagination.value.page - 1) * paymentPagination.value.limit;
    return filteredPaymentQueue.value.slice(start, start + paymentPagination.value.limit);
});
const selectedPaymentsList = computed(() => filteredPaymentQueue.value.filter(e => e.selected));
const selectedPaymentsTotal = computed(() => selectedPaymentsList.value.reduce((s, e) => s + (e.amount || 0), 0));
const isPaymentWindowActive = computed(() => paymentSession.value && new Date() >= new Date(paymentSession.value.payDate));
// Helpers
function formatCurrency(amt) { return payrollService.formatCurrency(amt); }
function formatDate(d) { return payrollService.formatDate(d); }
function formatMonth(m) { return payrollService.formatMonth(m); }
function getInitials(name) { if (!name)
    return "?"; return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function showToastMessage(msg, type) { toastMessage.value = msg; toastType.value = type; showToast.value = true; setTimeout(() => { showToast.value = false; }, 3000); }
// Payment Methods
function openPaymentMethodModal(item) {
    selectedPaymentItem.value = item;
    selectedPaymentMethod.value = "Cash";
    transactionReference.value = "";
    cashReference.value = "";
    showPaymentMethodModal.value = true;
}
function closePaymentMethodModal() {
    showPaymentMethodModal.value = false;
    selectedPaymentItem.value = null;
}
function confirmPaymentWithMethod() {
    processingPayment.value = true;
    setTimeout(() => {
        const ref = selectedPaymentMethod.value === "Bank Transfer"
            ? transactionReference.value || `TXN${Date.now()}`
            : cashReference.value || `CASH${Date.now()}`;
        paymentHistory.value.push({
            id: Date.now(),
            employeeId: selectedPaymentItem.value.employeeId,
            employeeName: selectedPaymentItem.value.employeeName,
            employeeCode: selectedPaymentItem.value.employeeCode,
            department: selectedPaymentItem.value.department,
            amount: selectedPaymentItem.value.amount,
            paymentDate: new Date().toISOString().split("T")[0],
            month: selectedPaymentItem.value.month,
            method: selectedPaymentMethod.value,
            transactionId: ref,
            processedBy: currentUser,
        });
        const idx = paymentQueue.value.findIndex(p => p.id === selectedPaymentItem.value.id);
        if (idx !== -1)
            paymentQueue.value.splice(idx, 1);
        processingPayment.value = false;
        showToastMessage(`${selectedPaymentItem.value.employeeName} paid via ${selectedPaymentMethod.value}!`, "success");
        closePaymentMethodModal();
    }, 500);
}
// Batch Payment
function openBatchPaymentModal() { if (selectedPaymentsList.value.length)
    showBatchModal.value = true; }
function closeBatchModal() { showBatchModal.value = false; }
function confirmBatchPayment() {
    processingPayment.value = true;
    setTimeout(() => {
        selectedPaymentsList.value.forEach(p => {
            paymentHistory.value.push({
                id: Date.now(),
                employeeId: p.employeeId,
                employeeName: p.employeeName,
                employeeCode: p.employeeCode,
                department: p.department,
                amount: p.amount,
                paymentDate: new Date().toISOString().split("T")[0],
                month: p.month,
                method: batchMethod.value,
                transactionId: `BATCH${Date.now()}`,
                processedBy: currentUser,
            });
            const idx = paymentQueue.value.findIndex(pq => pq.id === p.id);
            if (idx !== -1)
                paymentQueue.value.splice(idx, 1);
        });
        processingPayment.value = false;
        closeBatchModal();
        showToastMessage(`Batch payment completed for ${selectedPaymentsList.value.length} employees`, "success");
    }, 500);
}
function toggleSelectAllPayments() {
    filteredPaymentQueue.value.forEach(e => e.selected = selectAllPayment.value);
}
// Pagination
function changePaymentPage(page) { paymentPagination.value.page = page; }
function changePaymentLimit() { paymentPagination.value.page = 1; paymentPagination.value.limit = parseInt(paymentPagination.value.limit); }
// Refresh handler
function handleRefreshAllTabs() {
    // Refresh logic
}
// Event handler for process payroll
function handleProcessPayroll(event) {
    const { month, paymentDate: payDate, paymentWindowDays, unclaimedWindowDays } = event.detail;
    selectedMonth.value = month;
    paymentSession.value = { month, payDate, totalAmount: 0, employeeCount: 0 };
    // In a real app, you would fetch from API
    // For now, we'll use mock data
    const demoPayments = [
        { id: 1, employeeId: 1, employeeName: "Biruk Mulualem", employeeCode: "EMP001", department: "IT", amount: 18750, dueDate: payDate, month: month, selected: false },
        { id: 2, employeeId: 2, employeeName: "Dagmawi Hadgu", employeeCode: "EMP002", department: "IT", amount: 26250, dueDate: payDate, month: month, selected: false },
        { id: 3, employeeId: 3, employeeName: "Melkamu Zewdu", employeeCode: "EMP003", department: "Operations", amount: 21000, dueDate: payDate, month: month, selected: false },
        { id: 4, employeeId: 6, employeeName: "Nuru Seid", employeeCode: "EMP006", department: "Finance", amount: 11250, dueDate: payDate, month: month, selected: false },
        { id: 5, employeeId: 5, employeeName: "Tamrat Zerihun", employeeCode: "EMP005", department: "IT", amount: 13500, dueDate: payDate, month: month, selected: false },
    ];
    paymentQueue.value = demoPayments;
    paymentSession.value.totalAmount = paymentQueue.value.reduce((s, e) => s + e.amount, 0);
    paymentSession.value.employeeCount = paymentQueue.value.length;
    paymentPagination.value.page = 1;
}
// Initialization
function init() {
    selectedMonth.value = new Date().toISOString().slice(0, 7);
}
onMounted(() => {
    init();
    window.addEventListener('process-payroll', handleProcessPayroll);
    window.addEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
onUnmounted(() => {
    window.removeEventListener('process-payroll', handleProcessPayroll);
    window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['payment-option-styled']} */ ;
/** @type {__VLS_StyleScopedClasses['payment-option-styled']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['payment-info-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.formatMonth(__VLS_ctx.selectedMonth));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-filters" },
});
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    value: (__VLS_ctx.paymentSearch),
    placeholder: "Search...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.paymentDeptFilter),
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
    [formatMonth, selectedMonth, paymentSearch, paymentDeptFilter, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openBatchPaymentModal) },
    ...{ class: "btn-success" },
    disabled: (__VLS_ctx.selectedPaymentsList.length === 0 || !__VLS_ctx.isPaymentWindowActive || __VLS_ctx.processingPayment),
});
/** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
if (__VLS_ctx.processingPayment) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.processingPayment ? "Processing..." : `Batch Pay (${__VLS_ctx.selectedPaymentsList.length})`);
if (__VLS_ctx.paymentSession) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "payment-info-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['payment-info-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatDate(__VLS_ctx.paymentSession.payDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.paymentSession.totalAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.paymentSession.employeeCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-group" },
    });
    /** @type {__VLS_StyleScopedClasses['info-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: (__VLS_ctx.isPaymentWindowActive ? 'text-green' : 'text-orange') },
    });
    (__VLS_ctx.isPaymentWindowActive ? "Available" : "Locked");
}
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
    ...{ onChange: (__VLS_ctx.toggleSelectAllPayments) },
    type: "checkbox",
    disabled: (!__VLS_ctx.isPaymentWindowActive),
});
(__VLS_ctx.selectAllPayment);
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
for (const [item, idx] of __VLS_vFor((__VLS_ctx.paginatedPaymentQueue))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (item.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        disabled: (!__VLS_ctx.isPaymentWindowActive),
    });
    (item.selected);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    ((__VLS_ctx.paymentPagination.page - 1) * __VLS_ctx.paymentPagination.limit + idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "employee-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (item.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-code" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
    (item.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (item.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right net" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    /** @type {__VLS_StyleScopedClasses['net']} */ ;
    (__VLS_ctx.formatCurrency(item.amount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (__VLS_ctx.formatDate(item.dueDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openPaymentMethodModal(item);
                // @ts-ignore
                [openBatchPaymentModal, selectedPaymentsList, selectedPaymentsList, isPaymentWindowActive, isPaymentWindowActive, isPaymentWindowActive, isPaymentWindowActive, isPaymentWindowActive, processingPayment, processingPayment, processingPayment, paymentSession, paymentSession, paymentSession, paymentSession, formatDate, formatDate, formatCurrency, formatCurrency, toggleSelectAllPayments, selectAllPayment, paginatedPaymentQueue, paymentPagination, paymentPagination, openPaymentMethodModal,];
            } },
        ...{ class: "btn-small success" },
        disabled: (!__VLS_ctx.isPaymentWindowActive || __VLS_ctx.processingPayment),
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    // @ts-ignore
    [isPaymentWindowActive, processingPayment,];
}
if (__VLS_ctx.filteredPaymentQueue.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "7",
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
if (__VLS_ctx.paymentPagination.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.paymentPagination.totalPages > 1))
                    return;
                __VLS_ctx.changePaymentPage(__VLS_ctx.paymentPagination.page - 1);
                // @ts-ignore
                [paymentPagination, paymentPagination, filteredPaymentQueue, changePaymentPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.paymentPagination.page === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.paymentPagination.page);
    (__VLS_ctx.paymentPagination.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.paymentPagination.totalPages > 1))
                    return;
                __VLS_ctx.changePaymentPage(__VLS_ctx.paymentPagination.page + 1);
                // @ts-ignore
                [paymentPagination, paymentPagination, paymentPagination, paymentPagination, changePaymentPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.paymentPagination.page === __VLS_ctx.paymentPagination.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.changePaymentLimit) },
        value: (__VLS_ctx.paymentPagination.limit),
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
if (__VLS_ctx.showPaymentMethodModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePaymentMethodModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container payment-method-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['payment-method-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePaymentMethodModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-info-card-styled" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-info-card-styled']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-avatar-small" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-avatar-small']} */ ;
    (__VLS_ctx.getInitials(__VLS_ctx.selectedPaymentItem?.employeeName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-details" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-name" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-name']} */ ;
    (__VLS_ctx.selectedPaymentItem?.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-code" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-code']} */ ;
    (__VLS_ctx.selectedPaymentItem?.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-dept" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-dept']} */ ;
    (__VLS_ctx.selectedPaymentItem?.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-amount-large" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-amount-large']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedPaymentItem?.amount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "payment-options-styled" },
    });
    /** @type {__VLS_StyleScopedClasses['payment-options-styled']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPaymentMethodModal))
                    return;
                __VLS_ctx.selectedPaymentMethod = 'Cash';
                // @ts-ignore
                [formatCurrency, paymentPagination, paymentPagination, paymentPagination, changePaymentLimit, showPaymentMethodModal, closePaymentMethodModal, closePaymentMethodModal, getInitials, selectedPaymentItem, selectedPaymentItem, selectedPaymentItem, selectedPaymentItem, selectedPaymentItem, selectedPaymentMethod,];
            } },
        ...{ class: "payment-option-styled" },
        ...{ class: ({ active: __VLS_ctx.selectedPaymentMethod === 'Cash' }) },
    });
    /** @type {__VLS_StyleScopedClasses['payment-option-styled']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-radio" },
    });
    /** @type {__VLS_StyleScopedClasses['option-radio']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        checked: (__VLS_ctx.selectedPaymentMethod === 'Cash'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['option-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-info" },
    });
    /** @type {__VLS_StyleScopedClasses['option-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-label" },
    });
    /** @type {__VLS_StyleScopedClasses['option-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['option-desc']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPaymentMethodModal))
                    return;
                __VLS_ctx.selectedPaymentMethod = 'Bank Transfer';
                // @ts-ignore
                [selectedPaymentMethod, selectedPaymentMethod, selectedPaymentMethod,];
            } },
        ...{ class: "payment-option-styled" },
        ...{ class: ({ active: __VLS_ctx.selectedPaymentMethod === 'Bank Transfer' }) },
    });
    /** @type {__VLS_StyleScopedClasses['payment-option-styled']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-radio" },
    });
    /** @type {__VLS_StyleScopedClasses['option-radio']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        checked: (__VLS_ctx.selectedPaymentMethod === 'Bank Transfer'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['option-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-info" },
    });
    /** @type {__VLS_StyleScopedClasses['option-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-label" },
    });
    /** @type {__VLS_StyleScopedClasses['option-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "option-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['option-desc']} */ ;
    if (__VLS_ctx.selectedPaymentMethod === 'Bank Transfer') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (__VLS_ctx.transactionReference),
            ...{ class: "form-input" },
            placeholder: "Enter transaction ID",
        });
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    }
    if (__VLS_ctx.selectedPaymentMethod === 'Cash') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (__VLS_ctx.cashReference),
            ...{ class: "form-input" },
            placeholder: "Enter receipt number",
        });
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePaymentMethodModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmPaymentWithMethod) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.processingPayment),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.processingPayment ? "Processing..." : "Confirm Payment");
}
if (__VLS_ctx.showBatchModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeBatchModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container batch-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['batch-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeBatchModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "batch-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['batch-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedPaymentsList.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedPaymentsTotal));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.batchMethod),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "batch-list" },
    });
    /** @type {__VLS_StyleScopedClasses['batch-list']} */ ;
    for (const [emp] of __VLS_vFor((__VLS_ctx.selectedPaymentsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (emp.id),
            ...{ class: "batch-item" },
        });
        /** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (emp.employeeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(emp.amount));
        // @ts-ignore
        [selectedPaymentsList, selectedPaymentsList, processingPayment, processingPayment, formatCurrency, formatCurrency, closePaymentMethodModal, selectedPaymentMethod, selectedPaymentMethod, selectedPaymentMethod, selectedPaymentMethod, transactionReference, cashReference, confirmPaymentWithMethod, showBatchModal, closeBatchModal, closeBatchModal, selectedPaymentsTotal, batchMethod,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeBatchModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmBatchPayment) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.processingPayment),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.processingPayment ? "Processing..." : "Process Payment");
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
[processingPayment, processingPayment, closeBatchModal, confirmBatchPayment, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
