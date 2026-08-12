import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import itemRequestService from '@/stores/itemRequestService';
const router = useRouter();
const authStore = useAuthStore();
// ================================================================
// STATE
// ================================================================
const loading = ref(false);
const submitting = ref(false);
const accepting = ref(false);
const notifications = ref([]);
const pagination = ref(null);
const summary = ref({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
});
const currentNotification = ref(null);
const rejectReason = ref('');
const showAcceptModal = ref(false);
const showRejectModal = ref(false);
const showFilter = ref(false);
const filterStatus = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// ================================================================
// COMPUTED
// ================================================================
const totalPages = computed(() => {
    return pagination.value?.pages || 1;
});
// ================================================================
// METHODS
// ================================================================
const loadAllNotifications = async (resetPage = true) => {
    try {
        loading.value = true;
        if (resetPage) {
            currentPage.value = 1;
        }
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;
        if (!storeId || !groupId) {
            showToastMessage('Store or group not found', 'error');
            notifications.value = [];
            loading.value = false;
            return;
        }
        // Build params
        const params = {
            page: currentPage.value,
            limit: pageSize.value,
        };
        if (filterStatus.value !== 'all') {
            params.status = filterStatus.value;
        }
        const response = await itemRequestService.getGroupNotifications(storeId, groupId, params);
        if (response.success) {
            notifications.value = response.data?.notifications || [];
            pagination.value = response.data?.pagination || null;
            summary.value = response.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 };
            // Apply client-side search filter
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase();
                notifications.value = notifications.value.filter(n => {
                    const requestCode = n.request?.requestCode?.toLowerCase() || '';
                    const items = n.request?.items?.map(i => i.item?.name?.toLowerCase() || '').join(' ');
                    const askingStore = n.request?.askingStore?.name?.toLowerCase() || '';
                    const supplyingStore = n.request?.supplyingStore?.name?.toLowerCase() || '';
                    const remark = n.request?.remark?.toLowerCase() || '';
                    return requestCode.includes(query) ||
                        items.includes(query) ||
                        askingStore.includes(query) ||
                        supplyingStore.includes(query) ||
                        remark.includes(query);
                });
            }
            console.log('✅ Loaded', notifications.value.length, 'notifications');
            console.log('📄 Pagination:', pagination.value);
        }
        else {
            showToastMessage(response.error || 'Failed to load notifications', 'error');
            notifications.value = [];
        }
    }
    catch (error) {
        console.error('Error loading notifications:', error);
        showToastMessage('Failed to load notifications', 'error');
        notifications.value = [];
    }
    finally {
        loading.value = false;
    }
};
const goToPage = (page) => {
    if (page < 1 || page > totalPages.value || loading.value)
        return;
    currentPage.value = page;
    loadAllNotifications(false);
};
const onFilterChange = () => {
    loadAllNotifications(true);
};
const onSearchChange = () => {
    loadAllNotifications(true);
};
const showToastMessage = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
};
// ================================================================
// ACCEPT CONFIRMATION
// ================================================================
const openAcceptModal = (notification) => {
    currentNotification.value = notification;
    showAcceptModal.value = true;
};
const closeAcceptModal = () => {
    showAcceptModal.value = false;
    currentNotification.value = null;
    accepting.value = false;
};
const confirmAccept = async () => {
    accepting.value = true;
    try {
        const response = await itemRequestService.acceptNotification(currentNotification.value.id);
        if (response.success) {
            showToastMessage('✅ Request accepted successfully!', 'success');
            await loadAllNotifications(true);
            closeAcceptModal();
        }
        else {
            showToastMessage(response.error || 'Failed to accept request', 'error');
        }
    }
    catch (error) {
        console.error('Error accepting notification:', error);
        showToastMessage('Failed to accept request', 'error');
    }
    finally {
        accepting.value = false;
    }
};
// ================================================================
// REJECT CONFIRMATION
// ================================================================
const openRejectModal = (notification) => {
    currentNotification.value = notification;
    rejectReason.value = '';
    showRejectModal.value = true;
};
const closeRejectModal = () => {
    showRejectModal.value = false;
    currentNotification.value = null;
    rejectReason.value = '';
    submitting.value = false;
};
const confirmReject = async () => {
    if (!rejectReason.value.trim()) {
        showToastMessage('Please provide a rejection reason', 'warning');
        return;
    }
    submitting.value = true;
    try {
        const response = await itemRequestService.rejectNotification(currentNotification.value.id, rejectReason.value.trim());
        if (response.success) {
            showToastMessage('❌ Request rejected', 'warning');
            await loadAllNotifications(true);
            closeRejectModal();
        }
        else {
            showToastMessage(response.error || 'Failed to reject request', 'error');
        }
    }
    catch (error) {
        console.error('Error rejecting notification:', error);
        showToastMessage('Failed to reject request', 'error');
    }
    finally {
        submitting.value = false;
    }
};
const clearFilters = () => {
    filterStatus.value = 'all';
    searchQuery.value = '';
    currentPage.value = 1;
    loadAllNotifications(true);
};
const formatDate = (date) => {
    if (!date)
        return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
        return 'Just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    if (hours < 24)
        return `${hours}h ago`;
    if (days < 7)
        return `${days}d ago`;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
    loadAllNotifications(true);
});
// Watch for filter changes
watch([filterStatus, searchQuery], () => {
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => {
        loadAllNotifications(true);
    }, 300);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['number']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['number']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['number']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['number']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-card']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-card']} */ ;
/** @type {__VLS_StyleScopedClasses['accepted']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['accepted']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-accept']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-accept']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['request-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['request-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['reject-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-accept-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-accept-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['notifications-page']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-card']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-status-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['request-remark']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "notifications-page" },
});
/** @type {__VLS_StyleScopedClasses['notifications-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.loadAllNotifications) },
    ...{ class: "btn-refresh" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
(__VLS_ctx.loading ? 'Loading...' : 'Refresh');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showFilter = !__VLS_ctx.showFilter;
            // @ts-ignore
            [loadAllNotifications, loading, loading, showFilter, showFilter,];
        } },
    ...{ class: "btn-filter" },
});
/** @type {__VLS_StyleScopedClasses['btn-filter']} */ ;
if (__VLS_ctx.showFilter) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onFilterChange) },
        value: (__VLS_ctx.filterStatus),
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
        value: "accepted",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "rejected",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.onSearchChange) },
        type: "text",
        value: (__VLS_ctx.searchQuery),
        placeholder: "Search by request code, item, or store...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-cards" },
});
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card total" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "number" },
});
/** @type {__VLS_StyleScopedClasses['number']} */ ;
(__VLS_ctx.summary.total);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "label" },
});
/** @type {__VLS_StyleScopedClasses['label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card pending" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "number" },
});
/** @type {__VLS_StyleScopedClasses['number']} */ ;
(__VLS_ctx.summary.pending);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "label" },
});
/** @type {__VLS_StyleScopedClasses['label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card accepted" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['accepted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "number" },
});
/** @type {__VLS_StyleScopedClasses['number']} */ ;
(__VLS_ctx.summary.accepted);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "label" },
});
/** @type {__VLS_StyleScopedClasses['label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card rejected" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "number" },
});
/** @type {__VLS_StyleScopedClasses['number']} */ ;
(__VLS_ctx.summary.rejected);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "label" },
});
/** @type {__VLS_StyleScopedClasses['label']} */ ;
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
else if (__VLS_ctx.notifications.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "notifications-list" },
    });
    /** @type {__VLS_StyleScopedClasses['notifications-list']} */ ;
    for (const [notif] of __VLS_vFor((__VLS_ctx.notifications))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (notif.id),
            ...{ class: "notification-card" },
            ...{ class: (notif.status) },
        });
        /** @type {__VLS_StyleScopedClasses['notification-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notification-status-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-status-icon']} */ ;
        if (notif.status === 'pending') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else if (notif.status === 'accepted') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else if (notif.status === 'rejected') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notification-body" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notification-top" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-top']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notification-title" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "request-code" },
        });
        /** @type {__VLS_StyleScopedClasses['request-code']} */ ;
        (notif.request?.requestCode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', notif.status]) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (notif.status);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "notification-date" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-date']} */ ;
        (__VLS_ctx.formatDate(notif.created_at));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "notification-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-detail']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (notif.request?.requestedByUser?.fullName || 'Someone');
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (notif.request?.askingStore?.name || 'Unknown');
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (notif.request?.supplyingStore?.name || 'Unknown');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notification-items" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-items']} */ ;
        for (const [item, idx] of __VLS_vFor(((notif.request?.items || []).slice(0, 3)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (idx),
                ...{ class: "item-tag" },
            });
            /** @type {__VLS_StyleScopedClasses['item-tag']} */ ;
            (item.item?.name || 'Unknown');
            (item.quantity);
            // @ts-ignore
            [loading, showFilter, onFilterChange, filterStatus, onSearchChange, searchQuery, clearFilters, summary, summary, summary, summary, notifications, notifications, formatDate,];
        }
        if ((notif.request?.items || []).length > 3) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "item-more" },
            });
            /** @type {__VLS_StyleScopedClasses['item-more']} */ ;
            ((notif.request?.items || []).length - 3);
        }
        if (notif.request?.remark) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "request-remark" },
            });
            /** @type {__VLS_StyleScopedClasses['request-remark']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "remark-label" },
            });
            /** @type {__VLS_StyleScopedClasses['remark-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "remark-text" },
            });
            /** @type {__VLS_StyleScopedClasses['remark-text']} */ ;
            (notif.request.remark);
        }
        if (notif.status === 'rejected' && notif.rejected_reason) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rejection-reason" },
            });
            /** @type {__VLS_StyleScopedClasses['rejection-reason']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rejection-label" },
            });
            /** @type {__VLS_StyleScopedClasses['rejection-label']} */ ;
            (notif.rejected_reason);
        }
        if (notif.status !== 'pending') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "response-info" },
            });
            /** @type {__VLS_StyleScopedClasses['response-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "responded-by" },
            });
            /** @type {__VLS_StyleScopedClasses['responded-by']} */ ;
            (notif.status === 'accepted' ? '✅ Accepted' : '❌ Rejected');
            (notif.respondedByUser?.fullName || 'Unknown');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "responded-at" },
            });
            /** @type {__VLS_StyleScopedClasses['responded-at']} */ ;
            (__VLS_ctx.formatDate(notif.responded_at));
        }
        if (notif.status === 'pending') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "notification-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['notification-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.notifications.length === 0))
                            return;
                        if (!(notif.status === 'pending'))
                            return;
                        __VLS_ctx.openAcceptModal(notif);
                        // @ts-ignore
                        [formatDate, openAcceptModal,];
                    } },
                ...{ class: "btn-accept" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-accept']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.notifications.length === 0))
                            return;
                        if (!(notif.status === 'pending'))
                            return;
                        __VLS_ctx.openRejectModal(notif);
                        // @ts-ignore
                        [openRejectModal,];
                    } },
                ...{ class: "btn-reject" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-reject']} */ ;
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.pagination && __VLS_ctx.pagination.total > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination && __VLS_ctx.pagination.total > 0))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.pagination.page - 1);
                // @ts-ignore
                [pagination, pagination, pagination, goToPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.page === 1 || __VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.pagination.page);
    (__VLS_ctx.pagination.pages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "total-count" },
    });
    /** @type {__VLS_StyleScopedClasses['total-count']} */ ;
    (__VLS_ctx.pagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination && __VLS_ctx.pagination.total > 0))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.pagination.page + 1);
                // @ts-ignore
                [loading, pagination, pagination, pagination, pagination, pagination, goToPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.page === __VLS_ctx.pagination.pages || __VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
}
if (__VLS_ctx.showAcceptModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeAcceptModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container accept-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['accept-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAcceptModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirmation-title" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-details" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.currentNotification?.request?.requestCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.currentNotification?.request?.items?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.currentNotification?.request?.requestedByUser?.fullName || 'Unknown');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.currentNotification?.request?.askingStore?.name || 'Unknown');
    if (__VLS_ctx.currentNotification?.request?.remark) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-row" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "detail-label" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "detail-value" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
        (__VLS_ctx.currentNotification?.request?.remark);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirm-text" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAcceptModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmAccept) },
        ...{ class: "btn-accept-confirm" },
        disabled: (__VLS_ctx.accepting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-accept-confirm']} */ ;
    (__VLS_ctx.accepting ? 'Processing...' : '✅ Confirm Accept');
}
if (__VLS_ctx.showRejectModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeRejectModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container reject-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['reject-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRejectModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirmation-title" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-details" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.currentNotification?.request?.requestCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.currentNotification?.request?.items?.length || 0);
    if (__VLS_ctx.currentNotification?.request?.remark) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-row" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "detail-label" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "detail-value" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
        (__VLS_ctx.currentNotification?.request?.remark);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.rejectReason),
        placeholder: "Please provide a reason for rejecting...",
        rows: "3",
        ...{ class: "reject-textarea" },
    });
    /** @type {__VLS_StyleScopedClasses['reject-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRejectModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmReject) },
        ...{ class: "btn-danger" },
        disabled: (!__VLS_ctx.rejectReason.trim() || __VLS_ctx.submitting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
    (__VLS_ctx.submitting ? 'Submitting...' : 'Confirm Reject');
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
[loading, pagination, pagination, showAcceptModal, closeAcceptModal, closeAcceptModal, closeAcceptModal, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, confirmAccept, accepting, accepting, showRejectModal, closeRejectModal, closeRejectModal, closeRejectModal, rejectReason, rejectReason, confirmReject, submitting, submitting, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
