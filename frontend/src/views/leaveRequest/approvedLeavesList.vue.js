import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import leaveService from '@/stores/leaveService';
import employeeService from '@/stores/employee';
const router = useRouter();
// State
const loading = ref(false);
const refreshing = ref(false);
const exporting = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const toastIcon = ref('✅');
const showReturnConfirmModal = ref(false);
const returnConfirmEmployee = ref(null);
const actualReturnDate = ref('');
const returnNotes = ref('');
const today = new Date().toISOString().split('T')[0];
// Data
const departmentsList = ref([]);
const leaveTypesList = ref([]);
const approvedLeaveRequests = ref([]);
// Filters
const filters = ref({
    search: '',
    departmentId: null,
    leaveTypeId: null,
    status: null,
    month: new Date().toISOString().slice(0, 7)
});
// Pagination
const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
});
// Computed - Filtered and Paginated Data
const filteredLeaveRequests = computed(() => {
    let data = [...approvedLeaveRequests.value];
    // Filter by search
    if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase();
        data = data.filter(req => `${req.employee?.firstName} ${req.employee?.lastName}`.toLowerCase().includes(searchLower) ||
            req.employee?.employeeCode?.toLowerCase().includes(searchLower));
    }
    // Filter by status (upcoming, ongoing, returned, overdue)
    if (filters.value.status) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        data = data.filter(req => {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            const returnDate = new Date(req.returnDate);
            if (filters.value.status === 'upcoming') {
                return startDate > todayDate && !req.actualReturnDate;
            }
            else if (filters.value.status === 'ongoing') {
                return startDate <= todayDate && endDate >= todayDate && !req.actualReturnDate;
            }
            else if (filters.value.status === 'returned') {
                return req.actualReturnDate;
            }
            else if (filters.value.status === 'overdue') {
                return !req.actualReturnDate && returnDate < todayDate;
            }
            return true;
        });
    }
    return data;
});
const paginatedLeaveRequests = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.limit;
    const end = start + pagination.value.limit;
    return filteredLeaveRequests.value.slice(start, end);
});
// Stats
const stats = computed(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    let returned = 0;
    let onLeave = 0;
    let upcoming = 0;
    let overdueReturns = 0;
    approvedLeaveRequests.value.forEach(req => {
        const startDate = new Date(req.startDate);
        const endDate = new Date(req.endDate);
        const returnDate = new Date(req.returnDate);
        if (req.actualReturnDate) {
            returned++;
        }
        else if (startDate <= todayDate && endDate >= todayDate) {
            onLeave++;
        }
        else if (startDate > todayDate) {
            upcoming++;
        }
        if (!req.actualReturnDate && returnDate < todayDate) {
            overdueReturns++;
        }
    });
    return {
        totalApproved: approvedLeaveRequests.value.length,
        returned,
        onLeave,
        upcoming,
        overdueReturns
    };
});
// Debounce
let debounceTimeout;
function debounce(func, delay = 500) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, delay);
}
function debouncedLoadData() {
    debounce(() => {
        pagination.value.page = 1;
        loadApprovedRequests();
    });
}
// Helper Functions
function formatDate(dateStr) {
    if (!dateStr)
        return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime()))
            return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    catch {
        return 'N/A';
    }
}
function getInitials(name) {
    if (!name)
        return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function getLeaveTypeClass(type) {
    const classes = {
        'Annual Leave': 'type-annual',
        'Sick Leave': 'type-sick',
        'Maternity Leave': 'type-maternity',
        'Paternity Leave': 'type-paternity',
        'Bereavement Leave': 'type-bereavement',
        'Unpaid Leave': 'type-unpaid',
        'Study Leave': 'type-study'
    };
    return classes[type] || 'type-default';
}
function getReturnStatusClass(request) {
    if (request.actualReturnDate) {
        const expectedReturn = new Date(request.returnDate);
        const actual = new Date(request.actualReturnDate);
        if (actual > expectedReturn)
            return 'status-warning';
        return 'status-success';
    }
    const currentDate = new Date();
    const returnDate = new Date(request.returnDate);
    if (currentDate > returnDate)
        return 'status-danger';
    if (currentDate.toDateString() === returnDate.toDateString())
        return 'status-warning';
    return 'status-info';
}
function getReturnStatusText(request) {
    if (request.actualReturnDate) {
        const expectedReturn = new Date(request.returnDate);
        const actual = new Date(request.actualReturnDate);
        if (actual > expectedReturn) {
            const daysLate = Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24));
            return `Returned ${daysLate} day${daysLate > 1 ? 's' : ''} late`;
        }
        return 'Returned on time';
    }
    const currentDate = new Date();
    const returnDate = new Date(request.returnDate);
    if (currentDate > returnDate) {
        const daysOverdue = Math.ceil((currentDate - returnDate) / (1000 * 60 * 60 * 24));
        return `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`;
    }
    if (currentDate.toDateString() === returnDate.toDateString())
        return 'Expected today';
    return `Returns ${formatDate(request.returnDate)}`;
}
function getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24));
    return diff;
}
// API Calls
async function loadDepartments() {
    const result = await employeeService.getDepartments();
    if (result.success) {
        departmentsList.value = result.data;
    }
}
async function loadLeaveTypes() {
    const result = await leaveService.getLeaveTypes();
    if (result.success) {
        leaveTypesList.value = result.data;
    }
}
async function loadApprovedRequests() {
    loading.value = true;
    try {
        const params = {
            status: 'approved',
            page: 1,
            limit: 100,
            search: filters.value.search || undefined,
            departmentId: filters.value.departmentId || undefined,
            leaveTypeId: filters.value.leaveTypeId || undefined
        };
        if (filters.value.month) {
            const [year, month] = filters.value.month.split('-');
            params.startDate = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            params.endDate = `${year}-${month}-${lastDay}`;
        }
        const result = await leaveService.getLeaveRequests(params);
        if (result.success) {
            approvedLeaveRequests.value = result.data.map(request => ({
                ...request,
                approvedDate: request.approvedDate || request.approved_at || request.approvedAt || null
            }));
            pagination.value.total = filteredLeaveRequests.value.length;
            pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
        }
    }
    catch (error) {
        console.error('Error loading approved requests:', error);
        showToastMessage('Failed to load approved requests', 'error');
    }
    finally {
        loading.value = false;
    }
}
async function confirmReturn() {
    if (!actualReturnDate.value) {
        showToastMessage('Please select actual return date', 'error');
        return;
    }
    try {
        const result = await leaveService.confirmReturn(returnConfirmEmployee.value.leaveRequestId, actualReturnDate.value, returnNotes.value);
        if (result.success) {
            showToastMessage(result.message || 'Return confirmed successfully', 'success');
            await loadApprovedRequests();
            showReturnConfirmModal.value = false;
            actualReturnDate.value = '';
            returnNotes.value = '';
        }
        else {
            showToastMessage(result.error || 'Failed to confirm return', 'error');
        }
    }
    catch (error) {
        console.error('Error confirming return:', error);
        showToastMessage('Failed to confirm return', 'error');
    }
}
// Export Function
async function exportToExcel() {
    exporting.value = true;
    try {
        const headers = [
            'Employee Name',
            'Employee Code',
            'Department',
            'Leave Type',
            'Start Date',
            'End Date',
            'Total Days',
            'Return Status',
            'Actual Return Date',
            'Approved Date'
        ];
        const csvRows = [headers.join(',')];
        for (const req of filteredLeaveRequests.value) {
            const row = [
                `"${req.employee?.firstName} ${req.employee?.lastName}"`,
                `"${req.employee?.employeeCode}"`,
                `"${req.department?.name || '-'}"`,
                `"${req.leaveTypeName}"`,
                req.startDate,
                req.endDate,
                req.totalDays,
                getReturnStatusText(req),
                req.actualReturnDate || '',
                req.approvedDate || ''
            ];
            csvRows.push(row.join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `approved_leaves_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToastMessage('Export successful', 'success');
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export data', 'error');
    }
    finally {
        exporting.value = false;
    }
}
// UI Functions
function refreshData() {
    refreshing.value = true;
    loadApprovedRequests();
    setTimeout(() => {
        refreshing.value = false;
    }, 500);
}
function goToDetailPage(leaveId) {
    router.push(`/leave-detail/${leaveId}`);
}
function openReturnConfirmModal(request) {
    returnConfirmEmployee.value = request;
    actualReturnDate.value = today;
    returnNotes.value = '';
    showReturnConfirmModal.value = true;
}
function scrollToOverdue() {
    filters.value.status = 'overdue';
    loadApprovedRequests();
}
function changePage(page) {
    pagination.value.page = page;
}
function changeLimit() {
    pagination.value.page = 1;
    pagination.value.limit = parseInt(pagination.value.limit);
}
function showToastMessage(message, type = 'success') {
    toastMessage.value = message;
    toastType.value = type;
    toastIcon.value = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
}
// Watchers
watch(() => filters.value.departmentId, () => {
    pagination.value.page = 1;
    loadApprovedRequests();
});
watch(() => filters.value.leaveTypeId, () => {
    pagination.value.page = 1;
    loadApprovedRequests();
});
watch(() => filters.value.month, () => {
    pagination.value.page = 1;
    loadApprovedRequests();
});
watch(() => filters.value.status, () => {
    pagination.value.page = 1;
});
// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadDepartments(),
        loadLeaveTypes()
    ]);
    await loadApprovedRequests();
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
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm-return']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['month-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-close']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['approved-leave-page']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['month-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "approved-leave-page" },
});
/** @type {__VLS_StyleScopedClasses['approved-leave-page']} */ ;
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
    ...{ onClick: (__VLS_ctx.exportToExcel) },
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
(__VLS_ctx.exporting ? 'Exporting...' : 'Export to Excel');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "btn-secondary" },
    disabled: (__VLS_ctx.refreshing),
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
if (__VLS_ctx.refreshing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.refreshing ? 'Refreshing...' : 'Refresh');
if (__VLS_ctx.stats.overdueReturns > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overdue-alert" },
    });
    /** @type {__VLS_StyleScopedClasses['overdue-alert']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "alert-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "alert-message" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-message']} */ ;
    (__VLS_ctx.stats.overdueReturns);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.scrollToOverdue) },
        ...{ class: "alert-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-section" },
});
/** @type {__VLS_StyleScopedClasses['filter-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.debouncedLoadData) },
    type: "text",
    value: (__VLS_ctx.filters.search),
    placeholder: "Search employee...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
    value: (__VLS_ctx.filters.departmentId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
for (const [dept] of __VLS_vFor((__VLS_ctx.departmentsList))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept.departmentId),
        value: (dept.departmentId),
    });
    (dept.name);
    // @ts-ignore
    [exportToExcel, exporting, exporting, exporting, refreshData, refreshing, refreshing, refreshing, stats, stats, scrollToOverdue, debouncedLoadData, filters, filters, loadApprovedRequests, departmentsList,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
    value: (__VLS_ctx.filters.leaveTypeId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
for (const [type] of __VLS_vFor((__VLS_ctx.leaveTypesList))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (type.leaveTypeId),
        value: (type.leaveTypeId),
    });
    (type.name);
    // @ts-ignore
    [filters, loadApprovedRequests, leaveTypesList,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
    value: (__VLS_ctx.filters.status),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "upcoming",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ongoing",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "returned",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "overdue",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.loadApprovedRequests) },
    type: "month",
    ...{ class: "month-picker" },
});
(__VLS_ctx.filters.month);
/** @type {__VLS_StyleScopedClasses['month-picker']} */ ;
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
else if (__VLS_ctx.filteredLeaveRequests.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-hint']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "record-count" },
    });
    /** @type {__VLS_StyleScopedClasses['record-count']} */ ;
    (__VLS_ctx.pagination.total);
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [request] of __VLS_vFor((__VLS_ctx.paginatedLeaveRequests))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (request.leaveRequestId),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (request.employee?.firstName);
        (request.employee?.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-code" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
        (request.employee?.employeeCode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (request.department?.name || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['leave-type-badge', __VLS_ctx.getLeaveTypeClass(request.leaveTypeName)]) },
        });
        /** @type {__VLS_StyleScopedClasses['leave-type-badge']} */ ;
        (request.leaveTypeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "date-range" },
        });
        /** @type {__VLS_StyleScopedClasses['date-range']} */ ;
        (__VLS_ctx.formatDate(request.startDate));
        (__VLS_ctx.formatDate(request.endDate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center days-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['days-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "days-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['days-badge']} */ ;
        (request.totalDays);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', __VLS_ctx.getReturnStatusClass(request)]) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.getReturnStatusText(request));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "date-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['date-cell']} */ ;
        (__VLS_ctx.formatDate(request.approvedDate) || __VLS_ctx.formatDate(request.approved_at) || 'N/A');
        // @ts-ignore
        [filters, filters, loadApprovedRequests, loadApprovedRequests, loading, filteredLeaveRequests, pagination, paginatedLeaveRequests, getLeaveTypeClass, formatDate, formatDate, formatDate, formatDate, getReturnStatusClass, getReturnStatusText,];
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.filteredLeaveRequests.length === 0))
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
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.filteredLeaveRequests.length === 0))
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
    }
}
if (__VLS_ctx.showReturnConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReturnConfirmModal))
                    return;
                __VLS_ctx.showReturnConfirmModal = false;
                // @ts-ignore
                [pagination, pagination, pagination, changeLimit, showReturnConfirmModal, showReturnConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container return-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['return-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReturnConfirmModal))
                    return;
                __VLS_ctx.showReturnConfirmModal = false;
                // @ts-ignore
                [showReturnConfirmModal,];
            } },
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
        ...{ class: "emp-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-avatar']} */ ;
    (__VLS_ctx.getInitials(__VLS_ctx.returnConfirmEmployee?.employee?.firstName + ' ' + __VLS_ctx.returnConfirmEmployee?.employee?.lastName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-details" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-name" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-name']} */ ;
    (__VLS_ctx.returnConfirmEmployee?.employee?.firstName);
    (__VLS_ctx.returnConfirmEmployee?.employee?.lastName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-code" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-code']} */ ;
    (__VLS_ctx.returnConfirmEmployee?.employee?.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-dept" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-dept']} */ ;
    (__VLS_ctx.returnConfirmEmployee?.department?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "leave-info" },
    });
    /** @type {__VLS_StyleScopedClasses['leave-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.returnConfirmEmployee?.leaveTypeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.returnConfirmEmployee?.startDate));
    (__VLS_ctx.formatDate(__VLS_ctx.returnConfirmEmployee?.endDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-row" },
    });
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.returnConfirmEmployee?.returnDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        ...{ class: "form-input" },
        max: (__VLS_ctx.today),
    });
    (__VLS_ctx.actualReturnDate);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.actualReturnDate > __VLS_ctx.returnConfirmEmployee?.returnDate) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "input-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
        (__VLS_ctx.getDaysDifference(__VLS_ctx.actualReturnDate, __VLS_ctx.returnConfirmEmployee?.returnDate));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.returnNotes),
        ...{ class: "form-textarea" },
        rows: "2",
        placeholder: "Add any notes about the return...",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReturnConfirmModal))
                    return;
                __VLS_ctx.showReturnConfirmModal = false;
                // @ts-ignore
                [formatDate, formatDate, formatDate, showReturnConfirmModal, getInitials, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, returnConfirmEmployee, today, actualReturnDate, actualReturnDate, actualReturnDate, getDaysDifference, returnNotes,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmReturn) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
if (__VLS_ctx.showToast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
    (__VLS_ctx.toastIcon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-message" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
    (__VLS_ctx.toastMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToast))
                    return;
                __VLS_ctx.showToast = false;
                // @ts-ignore
                [confirmReturn, showToast, showToast, toastType, toastIcon, toastMessage,];
            } },
        ...{ class: "toast-close" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-close']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
