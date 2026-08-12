import { ref, computed, onMounted, watch } from "vue";
import payrollService from "@/stores/payrollService";
const props = defineProps({
    paymentHistory: {
        type: Array,
        default: () => []
    },
    departments: {
        type: Array,
        default: () => ['IT', 'Finance', 'Operations', 'HR']
    }
});
const emit = defineEmits(['update:history', 'export']);
// ==================== STATE ====================
const search = ref("");
const monthFilter = ref("");
const yearFilter = ref("");
const deptFilter = ref("all");
const sourceFilter = ref("all");
const exporting = ref(false);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const paymentHistoryData = ref([]);
// ==================== COMPUTED ====================
const availableYears = computed(() => {
    const years = [...new Set(paymentHistoryData.value.map(p => p.month?.split('-')[0]).filter(Boolean))];
    return years.sort((a, b) => b - a);
});
const filteredHistory = computed(() => {
    let data = [...paymentHistoryData.value];
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
    if (sourceFilter.value !== "all") {
        data = data.filter(e => e.source === sourceFilter.value);
    }
    pagination.value.total = data.length;
    pagination.value.totalPages = Math.ceil(data.length / pagination.value.limit) || 1;
    // Reset to first page if current page is out of range
    if (pagination.value.page > pagination.value.totalPages) {
        pagination.value.page = 1;
    }
    return data;
});
const paginatedHistory = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.limit;
    const end = start + pagination.value.limit;
    return filteredHistory.value.slice(start, end);
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
// ==================== LOAD DATA FROM API ====================
async function loadPaymentHistory() {
    loading.value = true;
    try {
        // Fetch payment history from API
        const response = await payrollService.getPaymentHistory();
        if (response.success && response.data) {
            paymentHistoryData.value = response.data;
        }
        else if (props.paymentHistory && props.paymentHistory.length > 0) {
            // Fallback to props if API fails
            paymentHistoryData.value = props.paymentHistory;
        }
        else {
            // Fallback to empty array
            paymentHistoryData.value = [];
        }
    }
    catch (error) {
        console.error('Error loading payment history:', error);
        // Fallback to props
        if (props.paymentHistory && props.paymentHistory.length > 0) {
            paymentHistoryData.value = props.paymentHistory;
        }
        else {
            paymentHistoryData.value = [];
        }
    }
    finally {
        loading.value = false;
    }
}
// ==================== EXPORT ====================
async function exportHistory() {
    exporting.value = true;
    try {
        const headers = ["Payment Date", "Payroll Month", "Employee Code", "Employee Name", "Department", "Amount (ETB)", "Processed By", "Status", "Source", "Notes"];
        const rows = filteredHistory.value.map(p => [
            p.payment_date,
            p.month,
            p.employee_code,
            p.employee_name,
            p.department,
            parseFloat(p.amount),
            p.processed_by || "System",
            "Completed",
            p.source || "normal",
            p.notes || ""
        ]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payment_history_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        emit('export', { success: true, count: filteredHistory.value.length });
    }
    catch (error) {
        console.error('Export error:', error);
        emit('export', { success: false, error: error.message });
    }
    finally {
        exporting.value = false;
    }
}
// ==================== WATCH PROPS ====================
watch(() => props.paymentHistory, (newVal) => {
    if (newVal && newVal.length > 0 && paymentHistoryData.value.length === 0) {
        paymentHistoryData.value = newVal;
    }
}, { deep: true });
// ==================== REFRESH HANDLER ====================
function handleRefreshAllTabs() {
    loadPaymentHistory();
}
// ==================== INITIALIZATION ====================
onMounted(() => {
    loadPaymentHistory();
    window.addEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
// Cleanup
import { onUnmounted } from 'vue';
onUnmounted(() => {
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
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip-left']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
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
    [onSearchChange, search, onFilterChange, onFilterChange, monthFilter, yearFilter, availableYears,];
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
    value: (__VLS_ctx.sourceFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "normal",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "unclaimed",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "returned",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportHistory) },
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
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [payment] of __VLS_vFor((__VLS_ctx.paginatedHistory))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (payment.history_id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (__VLS_ctx.formatDate(payment.payment_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (__VLS_ctx.formatMonth(payment.month));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "employee-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (payment.employee_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-code" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
    (payment.employee_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (payment.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    (__VLS_ctx.formatCurrency(parseFloat(payment.amount)));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (payment.processed_by || 'System');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-completed" },
    });
    /** @type {__VLS_StyleScopedClasses['status-completed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center notes-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['notes-cell']} */ ;
    if (payment.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notes-tooltip notes-tooltip-left" },
        });
        /** @type {__VLS_StyleScopedClasses['notes-tooltip']} */ ;
        /** @type {__VLS_StyleScopedClasses['notes-tooltip-left']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "note-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "note-text" },
        });
        /** @type {__VLS_StyleScopedClasses['note-text']} */ ;
        (payment.notes);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "no-notes" },
        });
        /** @type {__VLS_StyleScopedClasses['no-notes']} */ ;
    }
    // @ts-ignore
    [onFilterChange, sourceFilter, exportHistory, exporting, exporting, exporting, paginatedHistory, formatDate, formatMonth, formatCurrency,];
}
if (__VLS_ctx.filteredHistory.length === 0) {
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
                [filteredHistory, pagination, pagination, changePage,];
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
// @ts-ignore
[pagination, pagination, pagination, changeLimit,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        paymentHistory: {
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
