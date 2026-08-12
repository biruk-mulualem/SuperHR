import { ref, onMounted, onUnmounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
import employeesService from '@/stores/employee';
const tickets = ref([]);
const employees = ref([]);
const initialLoading = ref(true);
const issuing = ref(false);
const error = ref(null);
const showIssueModal = ref(false);
const selectedEmployeeId = ref(null);
const currentTime = ref('');
const returningTicketId = ref(null);
const modalError = ref(null);
// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalCount = ref(0);
const totalPages = ref(1);
// Filters
const searchQuery = ref('');
const statusFilter = ref('all');
let refreshInterval = null;
let timeInterval = null;
let searchTimeout = null;
const formatTime = (time) => {
    if (!time)
        return null;
    try {
        const date = new Date(time);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    catch (e) {
        return null;
    }
};
const updateCurrentTime = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `success-toast ${type}`;
    toast.innerHTML = type === 'success' ? `✓ ${message}` : type === 'error' ? `⚠️ ${message}` : `ℹ️ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};
const getStatusClass = (status) => {
    const classes = {
        'active': 'status-badge active',
        'late': 'status-badge late',
        'absent': 'status-badge absent',
        'on-time': 'status-badge on-time',
        'completed': 'status-badge completed'
    };
    return classes[status] || 'status-badge';
};
const getStatusText = (status) => {
    const texts = {
        'active': 'On Break',
        'late': 'Late',
        'absent': 'Absent',
        'on-time': 'On Time',
        'completed': 'Completed'
    };
    return texts[status] || status;
};
const fetchEmployees = async () => {
    try {
        const result = await employeesService.getEmployees({ limit: 100 });
        if (result.success && result.data)
            employees.value = result.data;
    }
    catch (err) {
        console.error('Failed to fetch employees:', err);
    }
};
const fetchData = async () => {
    try {
        const params = {
            page: currentPage.value,
            limit: itemsPerPage.value
        };
        if (searchQuery.value) {
            params.search = searchQuery.value;
        }
        if (statusFilter.value !== 'all') {
            params.statusFilter = statusFilter.value;
        }
        const response = await attendanceService.getDinnerHistory(params);
        if (response && response.success === true && Array.isArray(response.data)) {
            tickets.value = response.data
                .filter(item => item !== null && item !== undefined)
                .map(item => ({
                id: item?.id || Math.random(),
                employeeId: item?.employeeId,
                employeeName: item?.employeeName || 'Unknown',
                department: item?.department || 'N/A',
                breakOutTime: item?.breakOutTime,
                expectedReturnTime: item?.expectedReturnTime,
                actualReturnTime: item?.actualReturnTime,
                durationMinutes: item?.durationMinutes || 0,
                status: item?.status || 'active',
                displayStatus: item?.displayStatus || item?.status || 'active',
                lateMinutes: item?.lateMinutes || 0
            }));
            if (response.pagination) {
                totalCount.value = response.pagination.total;
                totalPages.value = response.pagination.totalPages;
                currentPage.value = response.pagination.page;
            }
            else {
                totalCount.value = response.count || tickets.value.length;
                totalPages.value = Math.ceil(totalCount.value / itemsPerPage.value);
            }
        }
    }
    catch (err) {
        console.error('Failed to load dinner tickets:', err);
        error.value = err.response?.data?.error || 'Failed to load dinner tickets';
    }
};
const initialFetch = async () => {
    initialLoading.value = true;
    await fetchEmployees();
    await fetchData();
    initialLoading.value = false;
};
const handleSearch = () => {
    if (searchTimeout)
        clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        fetchData();
    }, 500);
};
const clearSearch = () => {
    searchQuery.value = '';
    currentPage.value = 1;
    fetchData();
};
const handleFilterChange = () => {
    currentPage.value = 1;
    fetchData();
};
const handleItemsPerPageChange = () => {
    currentPage.value = 1;
    fetchData();
};
const goToPage = (page) => {
    currentPage.value = page;
    fetchData();
};
const openIssueModal = () => {
    modalError.value = null;
    selectedEmployeeId.value = null;
    showIssueModal.value = true;
};
const closeIssueModal = () => {
    showIssueModal.value = false;
    modalError.value = null;
    selectedEmployeeId.value = null;
};
const issueTicket = async () => {
    if (!selectedEmployeeId.value) {
        modalError.value = 'Please select an employee';
        return;
    }
    issuing.value = true;
    modalError.value = null;
    try {
        await attendanceService.issueBreakTicket(selectedEmployeeId.value, 'dinner');
        await fetchData();
        closeIssueModal();
        showToast('Dinner ticket issued successfully', 'success');
    }
    catch (err) {
        const errorMsg = err.response?.data?.error || err.message || 'Failed to issue ticket';
        modalError.value = errorMsg;
    }
    finally {
        issuing.value = false;
    }
};
const returnFromBreak = async (ticketId) => {
    returningTicketId.value = ticketId;
    const ticketIndex = tickets.value.findIndex(t => t.id === ticketId);
    let originalStatus = null;
    if (ticketIndex !== -1) {
        originalStatus = tickets.value[ticketIndex].status;
        tickets.value[ticketIndex].status = 'returning';
    }
    try {
        await attendanceService.returnFromBreak(ticketId);
        await fetchData();
        showToast('Returned from break successfully', 'success');
    }
    catch (err) {
        if (ticketIndex !== -1 && originalStatus) {
            tickets.value[ticketIndex].status = originalStatus;
        }
        const errorMsg = err.response?.data?.error || 'Failed to return from break';
        showToast(errorMsg, 'error');
        if (errorMsg.includes('already completed')) {
            await fetchData();
        }
    }
    finally {
        returningTicketId.value = null;
    }
};
onMounted(() => {
    initialFetch();
    refreshInterval = setInterval(fetchData, 30000);
    timeInterval = setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
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
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary-small']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-search']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['return']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['return']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "config-card" },
});
/** @type {__VLS_StyleScopedClasses['config-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "header-icon" },
});
/** @type {__VLS_StyleScopedClasses['header-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-info" },
});
/** @type {__VLS_StyleScopedClasses['header-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "header-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['header-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge" },
    ...{ class: ({ live: __VLS_ctx.tickets.length > 0 }) },
});
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['live']} */ ;
(__VLS_ctx.totalCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openIssueModal) },
    ...{ class: "btn-primary-small" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
if (__VLS_ctx.initialLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loader" },
    });
    /** @type {__VLS_StyleScopedClasses['loader']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.fetchData) },
        ...{ class: "retry-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['retry-btn']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-box" },
    });
    /** @type {__VLS_StyleScopedClasses['search-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "search-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.handleSearch) },
        type: "text",
        value: (__VLS_ctx.searchQuery),
        placeholder: "Search by employee name or department...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    if (__VLS_ctx.searchQuery) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.clearSearch) },
            ...{ class: "clear-search" },
        });
        /** @type {__VLS_StyleScopedClasses['clear-search']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleFilterChange) },
        value: (__VLS_ctx.statusFilter),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "all",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "active",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "late",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "on-time",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "absent",
    });
    if (__VLS_ctx.tickets.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-container" },
        });
        /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table compact" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        /** @type {__VLS_StyleScopedClasses['compact']} */ ;
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
        for (const [ticket] of __VLS_vFor((__VLS_ctx.tickets))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (ticket.id),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-info" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (ticket.employeeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (ticket.department || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "allowed-time" },
            });
            /** @type {__VLS_StyleScopedClasses['allowed-time']} */ ;
            (ticket.durationMinutes || 0);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatTime(ticket.breakOutTime));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatTime(ticket.expectedReturnTime));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (ticket.actualReturnTime ? __VLS_ctx.formatTime(ticket.actualReturnTime) : '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "status-container" },
            });
            /** @type {__VLS_StyleScopedClasses['status-container']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['status-badge', __VLS_ctx.getStatusClass(ticket.displayStatus)]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (__VLS_ctx.getStatusText(ticket.displayStatus));
            if (ticket.displayStatus === 'late') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "late-minutes" },
                });
                /** @type {__VLS_StyleScopedClasses['late-minutes']} */ ;
                (ticket.lateMinutes);
            }
            else if (ticket.displayStatus === 'absent') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "absent-text" },
                });
                /** @type {__VLS_StyleScopedClasses['absent-text']} */ ;
            }
            else if (ticket.displayStatus === 'on-time') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "on-time-text" },
                });
                /** @type {__VLS_StyleScopedClasses['on-time-text']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "action-buttons" },
            });
            /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
            if (ticket.status === 'active') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.initialLoading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!(__VLS_ctx.tickets.length > 0))
                                return;
                            if (!(ticket.status === 'active'))
                                return;
                            __VLS_ctx.returnFromBreak(ticket.id);
                            // @ts-ignore
                            [tickets, tickets, tickets, totalCount, openIssueModal, initialLoading, error, error, fetchData, handleSearch, searchQuery, searchQuery, clearSearch, handleFilterChange, statusFilter, formatTime, formatTime, formatTime, getStatusClass, getStatusText, returnFromBreak,];
                        } },
                    ...{ class: "btn-icon return" },
                    disabled: (__VLS_ctx.returningTicketId === ticket.id),
                    title: "Return from break",
                });
                /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
                /** @type {__VLS_StyleScopedClasses['return']} */ ;
                if (__VLS_ctx.returningTicketId === ticket.id) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "spinner" },
                    });
                    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                }
            }
            // @ts-ignore
            [returningTicketId, returningTicketId,];
        }
    }
    if (__VLS_ctx.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.initialLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.totalPages > 1))
                        return;
                    __VLS_ctx.goToPage(__VLS_ctx.currentPage - 1);
                    // @ts-ignore
                    [totalPages, goToPage, currentPage,];
                } },
            ...{ class: "pagination-btn" },
            disabled: (__VLS_ctx.currentPage === 1),
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.currentPage);
        (__VLS_ctx.totalPages);
        (__VLS_ctx.totalCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.initialLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.totalPages > 1))
                        return;
                    __VLS_ctx.goToPage(__VLS_ctx.currentPage + 1);
                    // @ts-ignore
                    [totalCount, totalPages, goToPage, currentPage, currentPage, currentPage,];
                } },
            ...{ class: "pagination-btn" },
            disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "items-per-page" },
    });
    /** @type {__VLS_StyleScopedClasses['items-per-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleItemsPerPageChange) },
        value: (__VLS_ctx.itemsPerPage),
        ...{ class: "per-page-select" },
    });
    /** @type {__VLS_StyleScopedClasses['per-page-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (5),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (10),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (20),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (50),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
if (!__VLS_ctx.initialLoading && __VLS_ctx.tickets.length === 0 && !__VLS_ctx.error) {
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
        ...{ onClick: (__VLS_ctx.openIssueModal) },
        ...{ class: "btn-primary-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary-small']} */ ;
}
if (__VLS_ctx.showIssueModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeIssueModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header-left" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "modal-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeIssueModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    if (__VLS_ctx.modalError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "modal-error" },
        });
        /** @type {__VLS_StyleScopedClasses['modal-error']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "modal-error-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['modal-error-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.modalError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "select-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.selectedEmployeeId),
        ...{ class: "input" },
    });
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [emp] of __VLS_vFor((__VLS_ctx.employees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (emp.id),
            value: (emp.id),
        });
        (emp.fullName || emp.firstName + ' ' + emp.lastName);
        (emp.departmentName || 'N/A');
        // @ts-ignore
        [tickets, openIssueModal, initialLoading, error, totalPages, currentPage, handleItemsPerPageChange, itemsPerPage, showIssueModal, closeIssueModal, closeIssueModal, modalError, modalError, selectedEmployeeId, employees,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "select-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['select-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-box" },
    });
    /** @type {__VLS_StyleScopedClasses['info-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.currentTime);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeIssueModal) },
        ...{ class: "btn-modal cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.issueTicket) },
        ...{ class: "btn-modal confirm" },
        disabled: (__VLS_ctx.issuing),
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['confirm']} */ ;
    (__VLS_ctx.issuing ? 'Issuing...' : 'Issue Ticket');
}
// @ts-ignore
[closeIssueModal, currentTime, issueTicket, issuing, issuing,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
