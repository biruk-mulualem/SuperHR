import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import attendanceService from '@/stores/attendanceService';
import employeesService from '@/stores/employee';
// State
const pendingEmployees = ref([]);
const selectedIds = ref([]);
const selectAll = ref(false);
const loading = ref(false);
const processing = ref(false);
const currentTime = ref('');
const showLateModal = ref(false);
const showConfirmModal = ref(false);
const pendingAction = ref('');
const allowUntilTime = ref('10:30');
const lateReason = ref('');
const toastMessage = ref('');
const toastType = ref('success');
const departments = ref([]);
// Undo state
const recentActions = ref([]);
const undoMessage = ref('');
// Pagination
const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
});
// Filters
const filters = reactive({
    search: '',
    departmentId: '',
    sortBy: 'lateMinutes',
    sortOrder: 'ASC'
});
let searchTimeout = null;
let refreshInterval = null;
let timeInterval = null;
// Helper: Format time display
const formatTimeDisplay = (timeStr) => {
    if (!timeStr)
        return '—';
    return timeStr.substring(0, 5);
};
// Add to recent actions
const addToRecentActions = (action, employeeIds, employeeNames) => {
    const actionId = Date.now();
    recentActions.value.unshift({
        id: actionId,
        action: action,
        employeeIds: [...employeeIds],
        employeeNames: employeeNames,
        employeeCount: employeeIds.length,
        time: new Date().toLocaleTimeString(),
        user: 'Admin',
        timestamp: Date.now()
    });
    if (recentActions.value.length > 10) {
        recentActions.value.pop();
    }
    setTimeout(() => {
        recentActions.value = recentActions.value.filter(a => a.id !== actionId);
    }, 300000);
};
// Undo action
const undoAction = async (actionId) => {
    const action = recentActions.value.find(a => a.id === actionId);
    if (!action)
        return;
    try {
        await attendanceService.revertAttendanceUpdate(action.employeeIds, action.action);
        await fetchPending();
        recentActions.value = recentActions.value.filter(a => a.id !== actionId);
        showToast(`Undo successful: ${action.action} for ${action.employeeCount} employee(s)`, 'success');
    }
    catch (error) {
        showToast('Undo failed', 'error');
    }
};
// Clear recent actions
const clearRecentActions = () => {
    recentActions.value = [];
};
// Fetch departments
const fetchDepartments = async () => {
    try {
        const res = await employeesService.getDepartments();
        if (res.success && res.data) {
            departments.value = res.data;
        }
    }
    catch (error) {
        console.error('Failed to fetch departments:', error);
    }
};
// Fetch pending employees
const fetchPending = async () => {
    loading.value = true;
    try {
        const res = await attendanceService.getPendingAbsentees({
            page: pagination.value.page,
            limit: pagination.value.limit,
            search: filters.search,
            departmentId: filters.departmentId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
        });
        if (res.success) {
            pendingEmployees.value = res.data;
            pagination.value = {
                page: res.pagination.page,
                limit: res.pagination.limit,
                total: res.pagination.total,
                totalPages: res.pagination.totalPages
            };
        }
        else {
            showToast('Failed to load pending employees', 'error');
        }
    }
    catch (error) {
        console.error('Error:', error);
        showToast('Failed to load pending employees', 'error');
    }
    finally {
        loading.value = false;
    }
};
// Handle search with debounce
const onSearchChange = () => {
    if (searchTimeout)
        clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        fetchPending();
    }, 500);
};
// Change page
const changePage = (page) => {
    pagination.value.page = page;
    fetchPending();
};
// Toggle select all
const toggleSelectAll = () => {
    if (selectAll.value) {
        selectedIds.value = pendingEmployees.value.map(e => e.employeeId);
    }
    else {
        selectedIds.value = [];
    }
};
// Open confirmation modal
const openConfirmModal = (action) => {
    pendingAction.value = action;
    showConfirmModal.value = true;
};
// Execute action after confirmation
const executeAction = async () => {
    await massAction(pendingAction.value);
    showConfirmModal.value = false;
    pendingAction.value = '';
};
// Mass action
const massAction = async (action) => {
    if (selectedIds.value.length === 0 || processing.value)
        return;
    const actionEmployeeIds = [...selectedIds.value];
    const actionEmployeeNames = pendingEmployees.value
        .filter(e => actionEmployeeIds.includes(e.employeeId))
        .map(e => e.employeeName);
    processing.value = true;
    try {
        let res;
        if (action === 'allow_late') {
            res = await attendanceService.massUpdateAttendance(selectedIds.value, action, allowUntilTime.value);
        }
        else {
            res = await attendanceService.massUpdateAttendance(selectedIds.value, action);
        }
        if (res.success) {
            addToRecentActions(action, actionEmployeeIds, actionEmployeeNames);
            const actionMessages = {
                absent: 'marked as ABSENT (no pay for today)',
                allow_late: 'approved for late check-in (can check in late)',
                leave: 'marked as LEAVE (paid full day)',
                sick: 'marked as SICK (paid sick leave)'
            };
            undoMessage.value = `${selectedIds.value.length} employee(s) ${actionMessages[action]}`;
            setTimeout(() => {
                undoMessage.value = '';
            }, 5000);
            showToast(`${selectedIds.value.length} employee(s) ${actionMessages[action]}`, 'success');
            await fetchPending();
            selectedIds.value = [];
            selectAll.value = false;
            showLateModal.value = false;
            lateReason.value = '';
        }
        else {
            showToast(res.message || 'Action failed', 'error');
        }
    }
    catch (error) {
        console.error('Error:', error);
        showToast('Action failed', 'error');
    }
    finally {
        processing.value = false;
    }
};
// Undo last action
const undoLastAction = async () => {
    if (recentActions.value.length === 0)
        return;
    const lastActionItem = recentActions.value[0];
    await undoAction(lastActionItem.id);
    undoMessage.value = '';
};
// Open late modal
const openLateModal = () => {
    pendingAction.value = 'allow_late';
    allowUntilTime.value = '10:30';
    lateReason.value = '';
    showLateModal.value = true;
};
// Show toast
const showToast = (message, type) => {
    toastMessage.value = message;
    toastType.value = type;
    setTimeout(() => {
        toastMessage.value = '';
    }, 3000);
};
// Update current time
const updateCurrentTime = () => {
    currentTime.value = new Date().toLocaleTimeString();
};
// Watch for filter changes
watch([() => filters.departmentId, () => filters.sortBy, () => filters.sortOrder], () => {
    pagination.value.page = 1;
    fetchPending();
});
// Lifecycle
onMounted(() => {
    fetchDepartments();
    fetchPending();
    updateCurrentTime();
    refreshInterval = setInterval(fetchPending, 120000);
    timeInterval = setInterval(updateCurrentTime, 1000);
});
onUnmounted(() => {
    if (refreshInterval)
        clearInterval(refreshInterval);
    if (timeInterval)
        clearInterval(timeInterval);
    if (searchTimeout)
        clearTimeout(searchTimeout);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['action-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['action-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['action-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['action-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['undo-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-absent']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sick']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-leave']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-late']} */ ;
/** @type {__VLS_StyleScopedClasses['absent']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sick']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['leave']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['action-description']} */ ;
/** @type {__VLS_StyleScopedClasses['absent']} */ ;
/** @type {__VLS_StyleScopedClasses['action-description']} */ ;
/** @type {__VLS_StyleScopedClasses['sick']} */ ;
/** @type {__VLS_StyleScopedClasses['action-description']} */ ;
/** @type {__VLS_StyleScopedClasses['leave']} */ ;
/** @type {__VLS_StyleScopedClasses['action-description']} */ ;
/** @type {__VLS_StyleScopedClasses['allow-late']} */ ;
/** @type {__VLS_StyleScopedClasses['action-details']} */ ;
/** @type {__VLS_StyleScopedClasses['absent']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['sick']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['leave']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['allow-late']} */ ;
/** @type {__VLS_StyleScopedClasses['undo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pending-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pending-table']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-col']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['pending-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-list']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "pending-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['pending-dashboard']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dashboard-header" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-right" },
});
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "time-badge" },
});
/** @type {__VLS_StyleScopedClasses['time-badge']} */ ;
(__VLS_ctx.currentTime);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.fetchPending) },
    ...{ class: "refresh-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-cards" },
});
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.selectedIds.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "warning-box" },
});
/** @type {__VLS_StyleScopedClasses['warning-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "warning-icon" },
});
/** @type {__VLS_StyleScopedClasses['warning-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "warning-content" },
});
/** @type {__VLS_StyleScopedClasses['warning-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "warning-list" },
});
/** @type {__VLS_StyleScopedClasses['warning-list']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge-absent" },
});
/** @type {__VLS_StyleScopedClasses['badge-absent']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge-sick" },
});
/** @type {__VLS_StyleScopedClasses['badge-sick']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge-leave" },
});
/** @type {__VLS_StyleScopedClasses['badge-leave']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge-late" },
});
/** @type {__VLS_StyleScopedClasses['badge-late']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filters-bar" },
});
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
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
    value: (__VLS_ctx.filters.search),
    type: "text",
    placeholder: "Search by name or employee code...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.fetchPending) },
    value: (__VLS_ctx.filters.departmentId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept.departmentId),
        value: (dept.departmentId),
    });
    (dept.name);
    // @ts-ignore
    [currentTime, fetchPending, fetchPending, loading, pagination, selectedIds, onSearchChange, filters, filters, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.fetchPending) },
    value: (__VLS_ctx.filters.sortBy),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "lateMinutes",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "employeeName",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.fetchPending) },
    value: (__VLS_ctx.filters.sortOrder),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ASC",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "DESC",
});
if (__VLS_ctx.recentActions.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-header" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearRecentActions) },
        ...{ class: "clear-recent" },
    });
    /** @type {__VLS_StyleScopedClasses['clear-recent']} */ ;
    for (const [action] of __VLS_vFor((__VLS_ctx.recentActions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (action.id),
            ...{ class: "action-item" },
        });
        /** @type {__VLS_StyleScopedClasses['action-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "action-time" },
        });
        /** @type {__VLS_StyleScopedClasses['action-time']} */ ;
        (action.time);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "action-user" },
        });
        /** @type {__VLS_StyleScopedClasses['action-user']} */ ;
        (action.user);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['action-badge', action.action]) },
        });
        /** @type {__VLS_StyleScopedClasses['action-badge']} */ ;
        (action.action.toUpperCase());
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "action-count" },
        });
        /** @type {__VLS_StyleScopedClasses['action-count']} */ ;
        (action.employeeCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.recentActions.length > 0))
                        return;
                    __VLS_ctx.undoAction(action.id);
                    // @ts-ignore
                    [fetchPending, fetchPending, filters, filters, recentActions, recentActions, clearRecentActions, undoAction,];
                } },
            ...{ class: "undo-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['undo-btn']} */ ;
        // @ts-ignore
        [];
    }
}
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
else if (__VLS_ctx.pendingEmployees.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "pending-table" },
    });
    /** @type {__VLS_StyleScopedClasses['pending-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "checkbox-col" },
    });
    /** @type {__VLS_StyleScopedClasses['checkbox-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.toggleSelectAll) },
        type: "checkbox",
    });
    (__VLS_ctx.selectAll);
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp] of __VLS_vFor((__VLS_ctx.pendingEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (emp.employeeId),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "checkbox-col" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
            value: (emp.employeeId),
        });
        (__VLS_ctx.selectedIds);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-info" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-avatar']} */ ;
        if (emp.profilePictureUrl) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (emp.profilePictureUrl),
                ...{ class: "avatar-img" },
            });
            /** @type {__VLS_StyleScopedClasses['avatar-img']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            ((emp.employeeName?.charAt(0) || 'U'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (emp.employeeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-code" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
        (emp.employeeCode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.departmentName || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "time-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['time-cell']} */ ;
        (__VLS_ctx.formatTimeDisplay(emp.expectedCheckIn));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "warning-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-cell']} */ ;
        (__VLS_ctx.formatTimeDisplay(emp.absentThreshold));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "late-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['late-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "late-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['late-badge']} */ ;
        (emp.lateMinutes);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "badge pending" },
        });
        /** @type {__VLS_StyleScopedClasses['badge']} */ ;
        /** @type {__VLS_StyleScopedClasses['pending']} */ ;
        // @ts-ignore
        [loading, selectedIds, pendingEmployees, pendingEmployees, toggleSelectAll, selectAll, formatTimeDisplay, formatTimeDisplay,];
    }
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
    (__VLS_ctx.pagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
                // @ts-ignore
                [pagination, pagination, pagination, pagination, pagination, changePage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.page === __VLS_ctx.pagination.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
}
if (__VLS_ctx.selectedIds.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 0))
                    return;
                __VLS_ctx.openConfirmModal('absent');
                // @ts-ignore
                [pagination, pagination, selectedIds, openConfirmModal,];
            } },
        ...{ class: "btn-absent" },
        disabled: (__VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-absent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 0))
                    return;
                __VLS_ctx.openConfirmModal('sick');
                // @ts-ignore
                [openConfirmModal, processing,];
            } },
        ...{ class: "btn-sick" },
        disabled: (__VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-sick']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 0))
                    return;
                __VLS_ctx.openConfirmModal('leave');
                // @ts-ignore
                [openConfirmModal, processing,];
            } },
        ...{ class: "btn-leave" },
        disabled: (__VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-leave']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openLateModal) },
        ...{ class: "btn-late" },
        disabled: (__VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-late']} */ ;
}
if (__VLS_ctx.showConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showConfirmModal))
                    return;
                __VLS_ctx.showConfirmModal = false;
                // @ts-ignore
                [processing, processing, openLateModal, showConfirmModal, showConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
        ...{ class: (__VLS_ctx.pendingAction) },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showConfirmModal))
                    return;
                __VLS_ctx.showConfirmModal = false;
                // @ts-ignore
                [showConfirmModal, pendingAction,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedIds.length);
    if (__VLS_ctx.pendingAction === 'absent') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-description absent" },
        });
        /** @type {__VLS_StyleScopedClasses['action-description']} */ ;
        /** @type {__VLS_StyleScopedClasses['absent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-details" },
        });
        /** @type {__VLS_StyleScopedClasses['action-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    }
    if (__VLS_ctx.pendingAction === 'sick') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-description sick" },
        });
        /** @type {__VLS_StyleScopedClasses['action-description']} */ ;
        /** @type {__VLS_StyleScopedClasses['sick']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-details" },
        });
        /** @type {__VLS_StyleScopedClasses['action-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    if (__VLS_ctx.pendingAction === 'leave') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-description leave" },
        });
        /** @type {__VLS_StyleScopedClasses['action-description']} */ ;
        /** @type {__VLS_StyleScopedClasses['leave']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-details" },
        });
        /** @type {__VLS_StyleScopedClasses['action-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    if (__VLS_ctx.pendingAction === 'allow_late') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-description allow-late" },
        });
        /** @type {__VLS_StyleScopedClasses['action-description']} */ ;
        /** @type {__VLS_StyleScopedClasses['allow-late']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-details" },
        });
        /** @type {__VLS_StyleScopedClasses['action-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showConfirmModal))
                    return;
                __VLS_ctx.showConfirmModal = false;
                // @ts-ignore
                [selectedIds, showConfirmModal, pendingAction, pendingAction, pendingAction, pendingAction,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.executeAction) },
        ...{ class: "btn-confirm" },
        ...{ class: (__VLS_ctx.pendingAction) },
        disabled: (__VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
    (__VLS_ctx.pendingAction.toUpperCase());
}
if (__VLS_ctx.showLateModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showLateModal))
                    return;
                __VLS_ctx.showLateModal = false;
                // @ts-ignore
                [processing, pendingAction, pendingAction, executeAction, showLateModal, showLateModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header allow-late" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['allow-late']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showLateModal))
                    return;
                __VLS_ctx.showLateModal = false;
                // @ts-ignore
                [showLateModal,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedIds.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-description allow-late" },
    });
    /** @type {__VLS_StyleScopedClasses['action-description']} */ ;
    /** @type {__VLS_StyleScopedClasses['allow-late']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "time",
        ...{ class: "time-input" },
    });
    (__VLS_ctx.allowUntilTime);
    /** @type {__VLS_StyleScopedClasses['time-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.lateReason),
        placeholder: "e.g., Traffic, Emergency, Manager approval",
        ...{ class: "reason-input" },
    });
    /** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showLateModal))
                    return;
                __VLS_ctx.showLateModal = false;
                // @ts-ignore
                [selectedIds, showLateModal, allowUntilTime, lateReason,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.executeAction) },
        ...{ class: "btn-confirm allow-late" },
        disabled: (__VLS_ctx.processing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
    /** @type {__VLS_StyleScopedClasses['allow-late']} */ ;
}
if (__VLS_ctx.undoMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "undo-toast" },
    });
    /** @type {__VLS_StyleScopedClasses['undo-toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.undoMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.undoLastAction) },
        ...{ class: "undo-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['undo-action-btn']} */ ;
}
if (__VLS_ctx.toastMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (['toast', __VLS_ctx.toastType]) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    (__VLS_ctx.toastMessage);
}
// @ts-ignore
[processing, executeAction, undoMessage, undoMessage, undoLastAction, toastMessage, toastMessage, toastType,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
