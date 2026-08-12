import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import itemRequestService from '@/stores/itemRequestService';
const emit = defineEmits(['toggle-sidebar']);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
// ================================================================
// STATE
// ================================================================
const isDropdownOpen = ref(false);
const showNotifications = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const submitting = ref(false);
const accepting = ref(false);
const notifications = ref([]);
const pagination = ref(null);
const currentNotification = ref(null);
const rejectReason = ref('');
const showAcceptModal = ref(false);
const showRejectModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const refreshInterval = ref(null);
const notificationsListRef = ref(null);
// ================================================================
// COMPUTED
// ================================================================
const pendingNotifications = computed(() => {
    return notifications.value.filter(n => n.status === 'pending');
});
const pendingCount = computed(() => {
    return pendingNotifications.value.length;
});
const acceptedCount = computed(() => {
    return notifications.value.filter(n => n.status === 'accepted').length;
});
const rejectedCount = computed(() => {
    return notifications.value.filter(n => n.status === 'rejected').length;
});
const hasMorePages = computed(() => {
    if (!pagination.value)
        return false;
    return pagination.value.page < pagination.value.pages;
});
const userDisplayName = computed(() => {
    const user = authStore.user;
    if (!user)
        return 'User';
    return user.fullEmployeeName || user.fullName || 'User';
});
const userProfilePicture = computed(() => {
    const user = authStore.user;
    if (!user)
        return null;
    return user.profilePicture || user.profilePictureUrl || null;
});
// ================================================================
// METHODS
// ================================================================
const loadNotifications = async (reset = true) => {
    try {
        if (reset) {
            loading.value = true;
            notifications.value = [];
            pagination.value = null;
        }
        else {
            loadingMore.value = true;
        }
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;
        console.log('🔍 Store ID:', storeId);
        console.log('🔍 Group ID:', groupId);
        if (!storeId || !groupId) {
            console.warn('⚠️ Missing storeId or groupId for user');
            notifications.value = [];
            pagination.value = null;
            loading.value = false;
            loadingMore.value = false;
            return;
        }
        const page = reset ? 1 : (pagination.value?.page || 0) + 1;
        const response = await itemRequestService.getGroupNotifications(storeId, groupId, {
            status: 'pending',
            limit: 10,
            page: page
        });
        console.log('📥 Notifications response:', response);
        if (response.success) {
            const newNotifications = response.data?.notifications || [];
            const newPagination = response.data?.pagination || null;
            if (reset) {
                notifications.value = newNotifications;
            }
            else {
                // Append new notifications, avoiding duplicates
                const existingIds = new Set(notifications.value.map(n => n.id));
                const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
                notifications.value = [...notifications.value, ...uniqueNew];
            }
            pagination.value = newPagination;
            console.log('✅ Loaded', notifications.value.length, 'notifications');
            console.log('📄 Pagination:', pagination.value);
        }
        else {
            console.error('❌ Failed to load notifications:', response.error);
            if (reset) {
                notifications.value = [];
            }
        }
    }
    catch (error) {
        console.error('❌ Error loading notifications:', error);
        if (reset) {
            notifications.value = [];
        }
    }
    finally {
        loading.value = false;
        loadingMore.value = false;
    }
};
const loadMoreNotifications = async () => {
    if (loadingMore.value || !hasMorePages.value)
        return;
    await loadNotifications(false);
};
const handleScroll = (event) => {
    const element = event.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    // Check if scrolled to bottom (with 50px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMoreNotifications();
    }
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
            // Reset and reload to get fresh data
            await loadNotifications(true);
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
            await loadNotifications(true);
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
const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
    showNotifications.value = false;
};
const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value;
    isDropdownOpen.value = false;
    if (showNotifications.value) {
        // Reset and load first page
        loadNotifications(true);
    }
};
const closeAll = () => {
    isDropdownOpen.value = false;
    showNotifications.value = false;
};
const goToNotifications = () => {
    closeAll();
    router.push('/notifications');
};
const getRoleTitle = () => {
    const titles = {
        admin: 'Administrator',
        hr: 'HR Manager',
        finance: 'Finance Officer',
        employee: 'Employee',
        attendance: 'Attendance Manager',
        storekeeper: 'Storekeeper',
        store_it: 'IT Store',
        checker: 'Checker'
    };
    return titles[authStore.user?.role] || authStore.user?.role || 'User';
};
const handleImageError = (e) => {
    const name = userDisplayName.value || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    e.target.src = `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${initials}`;
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
    return d.toLocaleDateString();
};
const goToProfile = () => {
    closeAll();
    router.push('/profile');
};
const goToSettings = () => {
    closeAll();
    router.push('/settings');
};
const handleLogout = async () => {
    closeAll();
    await authStore.logout();
    window.location.replace('/login');
};
const handleClickOutside = (event) => {
    if (showAcceptModal.value || showRejectModal.value) {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay && modalOverlay.contains(event.target)) {
            return;
        }
    }
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !headerRight.contains(event.target)) {
        closeAll();
    }
};
const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        if (showAcceptModal.value) {
            closeAcceptModal();
        }
        else if (showRejectModal.value) {
            closeRejectModal();
        }
        else {
            closeAll();
        }
    }
};
const toggleSidebar = () => {
    emit('toggle-sidebar');
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    if (authStore.isAuthenticated) {
        setTimeout(() => {
            loadNotifications(true);
        }, 500);
    }
    refreshInterval.value = setInterval(() => {
        if (authStore.isAuthenticated && !showAcceptModal.value && !showRejectModal.value) {
            // Refresh the list - this will reset to first page
            loadNotifications(true);
        }
    }, 50000);
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscapeKey);
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
        refreshInterval.value = null;
    }
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
/** @type {__VLS_StyleScopedClasses['menu-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['user-avatar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['notifications-header']} */ ;
/** @type {__VLS_StyleScopedClasses['mark-all']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['accepted']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['accepted']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-message']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-accept-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reject-small']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['accepted']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rejected']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-notifications']} */ ;
/** @type {__VLS_StyleScopedClasses['view-all']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['request-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['request-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['reject-textarea']} */ ;
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
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['system-name']} */ ;
/** @type {__VLS_StyleScopedClasses['notifications-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['system-name']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notifications-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
if (__VLS_ctx.authStore.isAuthenticated && __VLS_ctx.authStore.user) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "header" },
    });
    /** @type {__VLS_StyleScopedClasses['header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-left" },
    });
    /** @type {__VLS_StyleScopedClasses['header-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleSidebar) },
        ...{ class: "menu-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['menu-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "menu-icon" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['menu-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M4 6h16M4 12h16M4 18h16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "logo-section" },
    });
    /** @type {__VLS_StyleScopedClasses['logo-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "system-name" },
    });
    /** @type {__VLS_StyleScopedClasses['system-name']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-right" },
    });
    /** @type {__VLS_StyleScopedClasses['header-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "notification-dropdown" },
    });
    /** @type {__VLS_StyleScopedClasses['notification-dropdown']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleNotifications) },
        ...{ class: "notification-btn" },
        disabled: (__VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['notification-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "notification-icon" },
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    /** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M13.73 21a2 2 0 0 1-3.46 0",
    });
    if (__VLS_ctx.pendingCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "notification-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-badge']} */ ;
        (__VLS_ctx.pendingCount);
    }
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
    transition;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        name: "dropdown",
    }));
    const __VLS_2 = __VLS_1({
        name: "dropdown",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    if (__VLS_ctx.showNotifications) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notifications-panel" },
        });
        /** @type {__VLS_StyleScopedClasses['notifications-panel']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notifications-header" },
        });
        /** @type {__VLS_StyleScopedClasses['notifications-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "header-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
        if (__VLS_ctx.pendingCount > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "pending-count" },
            });
            /** @type {__VLS_StyleScopedClasses['pending-count']} */ ;
            (__VLS_ctx.pendingCount);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.authStore.isAuthenticated && __VLS_ctx.authStore.user))
                        return;
                    if (!(__VLS_ctx.showNotifications))
                        return;
                    __VLS_ctx.loadNotifications(true);
                    // @ts-ignore
                    [authStore, authStore, toggleSidebar, toggleNotifications, loading, pendingCount, pendingCount, pendingCount, pendingCount, showNotifications, loadNotifications,];
                } },
            ...{ class: "mark-all" },
            disabled: (__VLS_ctx.loading),
        });
        /** @type {__VLS_StyleScopedClasses['mark-all']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notification-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['notification-summary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item pending" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['pending']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "count" },
        });
        /** @type {__VLS_StyleScopedClasses['count']} */ ;
        (__VLS_ctx.pendingNotifications.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "label" },
        });
        /** @type {__VLS_StyleScopedClasses['label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "count" },
        });
        /** @type {__VLS_StyleScopedClasses['count']} */ ;
        (__VLS_ctx.acceptedCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "label" },
        });
        /** @type {__VLS_StyleScopedClasses['label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "count" },
        });
        /** @type {__VLS_StyleScopedClasses['count']} */ ;
        (__VLS_ctx.rejectedCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "label" },
        });
        /** @type {__VLS_StyleScopedClasses['label']} */ ;
        if (!__VLS_ctx.loading) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onScroll: (__VLS_ctx.handleScroll) },
                ...{ class: "notifications-list" },
                ref: "notificationsListRef",
            });
            /** @type {__VLS_StyleScopedClasses['notifications-list']} */ ;
            if (__VLS_ctx.pendingNotifications.length === 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "empty-notifications" },
                });
                /** @type {__VLS_StyleScopedClasses['empty-notifications']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "empty-icon" },
                });
                /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            }
            for (const [notif] of __VLS_vFor((__VLS_ctx.pendingNotifications))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (notif.id),
                    ...{ class: "notification-item pending" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
                /** @type {__VLS_StyleScopedClasses['pending']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notification-icon pending" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
                /** @type {__VLS_StyleScopedClasses['pending']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notification-content" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-content']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notification-header" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-header']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "request-code" },
                });
                /** @type {__VLS_StyleScopedClasses['request-code']} */ ;
                (notif.request?.requestCode);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "notification-time" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-time']} */ ;
                (__VLS_ctx.formatDate(notif.created_at));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "notification-message" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-message']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (notif.request?.requestedByUser?.fullName || 'Someone');
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (notif.request?.askingStore?.name || 'Unknown');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notification-items" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-items']} */ ;
                for (const [item, idx] of __VLS_vFor(((notif.request?.items || []).slice(0, 2)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (idx),
                        ...{ class: "item-tag" },
                    });
                    /** @type {__VLS_StyleScopedClasses['item-tag']} */ ;
                    (item.item?.name || 'Unknown');
                    (item.quantity);
                    // @ts-ignore
                    [loading, loading, pendingNotifications, pendingNotifications, pendingNotifications, acceptedCount, rejectedCount, handleScroll, formatDate,];
                }
                if ((notif.request?.items || []).length > 2) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "item-more" },
                    });
                    /** @type {__VLS_StyleScopedClasses['item-more']} */ ;
                    ((notif.request?.items || []).length - 2);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notification-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['notification-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.authStore.isAuthenticated && __VLS_ctx.authStore.user))
                                return;
                            if (!(__VLS_ctx.showNotifications))
                                return;
                            if (!(!__VLS_ctx.loading))
                                return;
                            __VLS_ctx.openAcceptModal(notif);
                            // @ts-ignore
                            [openAcceptModal,];
                        } },
                    ...{ class: "btn-accept-small" },
                });
                /** @type {__VLS_StyleScopedClasses['btn-accept-small']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.authStore.isAuthenticated && __VLS_ctx.authStore.user))
                                return;
                            if (!(__VLS_ctx.showNotifications))
                                return;
                            if (!(!__VLS_ctx.loading))
                                return;
                            __VLS_ctx.openRejectModal(notif);
                            // @ts-ignore
                            [openRejectModal,];
                        } },
                    ...{ class: "btn-reject-small" },
                });
                /** @type {__VLS_StyleScopedClasses['btn-reject-small']} */ ;
                // @ts-ignore
                [];
            }
            if (__VLS_ctx.loadingMore) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "loading-more" },
                });
                /** @type {__VLS_StyleScopedClasses['loading-more']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "spinner-small" },
                });
                /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
            }
            if (!__VLS_ctx.hasMorePages && __VLS_ctx.pendingNotifications.length > 0 && !__VLS_ctx.loadingMore) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "no-more" },
                });
                /** @type {__VLS_StyleScopedClasses['no-more']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            }
        }
        if (__VLS_ctx.loading && !__VLS_ctx.loadingMore) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "loading-notifications" },
            });
            /** @type {__VLS_StyleScopedClasses['loading-notifications']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "spinner-small" },
            });
            /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "notifications-footer" },
        });
        /** @type {__VLS_StyleScopedClasses['notifications-footer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToNotifications) },
            ...{ class: "view-all" },
        });
        /** @type {__VLS_StyleScopedClasses['view-all']} */ ;
    }
    // @ts-ignore
    [loading, pendingNotifications, loadingMore, loadingMore, loadingMore, hasMorePages, goToNotifications,];
    var __VLS_3;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.toggleDropdown) },
        ...{ class: "user-avatar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['user-avatar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ onError: (__VLS_ctx.handleImageError) },
        src: (__VLS_ctx.userProfilePicture),
        ...{ class: "avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['avatar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "dropdown-arrow" },
        ...{ class: ({ rotated: __VLS_ctx.isDropdownOpen }) },
        viewBox: "0 0 20 20",
        fill: "currentColor",
    });
    /** @type {__VLS_StyleScopedClasses['dropdown-arrow']} */ ;
    /** @type {__VLS_StyleScopedClasses['rotated']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'fill-rule': "evenodd",
        d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
        'clip-rule': "evenodd",
    });
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
    transition;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        name: "dropdown",
    }));
    const __VLS_8 = __VLS_7({
        name: "dropdown",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    if (__VLS_ctx.isDropdownOpen) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-menu" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-menu']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-header" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            ...{ onError: (__VLS_ctx.handleImageError) },
            src: (__VLS_ctx.userProfilePicture),
            ...{ class: "dropdown-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-avatar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-user-info" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-user-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dropdown-user-name" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-user-name']} */ ;
        (__VLS_ctx.userDisplayName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dropdown-role-badge" },
            ...{ class: (`role-${__VLS_ctx.authStore.user?.role}`) },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-role-badge']} */ ;
        (__VLS_ctx.getRoleTitle());
        if (__VLS_ctx.authStore.user?.departmentName) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dropdown-department" },
            });
            /** @type {__VLS_StyleScopedClasses['dropdown-department']} */ ;
            (__VLS_ctx.authStore.user.departmentName);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-divider" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-divider']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToProfile) },
            ...{ class: "dropdown-item" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "dropdown-icon" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToSettings) },
            ...{ class: "dropdown-item" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "dropdown-icon" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-divider" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-divider']} */ ;
        if (__VLS_ctx.authStore.user?.employeeCode || __VLS_ctx.authStore.user?.departmentCode) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dropdown-stats" },
            });
            /** @type {__VLS_StyleScopedClasses['dropdown-stats']} */ ;
            if (__VLS_ctx.authStore.user?.employeeCode) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "stat-item" },
                });
                /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "stat-label" },
                });
                /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "stat-value" },
                });
                /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
                (__VLS_ctx.authStore.user.employeeCode);
            }
            if (__VLS_ctx.authStore.user?.departmentCode) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "stat-item" },
                });
                /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "stat-label" },
                });
                /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "stat-value" },
                });
                /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
                (__VLS_ctx.authStore.user.departmentCode);
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-divider" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-divider']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.handleLogout) },
            ...{ class: "dropdown-item logout-item" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['logout-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "dropdown-icon" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    // @ts-ignore
    [authStore, authStore, authStore, authStore, authStore, authStore, authStore, authStore, authStore, toggleDropdown, handleImageError, handleImageError, userProfilePicture, userProfilePicture, isDropdownOpen, isDropdownOpen, userDisplayName, getRoleTitle, goToProfile, goToSettings, handleLogout,];
    var __VLS_9;
    if (__VLS_ctx.isDropdownOpen || __VLS_ctx.showNotifications) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (__VLS_ctx.closeAll) },
            ...{ class: "dropdown-backdrop" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-backdrop']} */ ;
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
            ...{ class: "request-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['request-summary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.currentNotification?.request?.requestCode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.currentNotification?.request?.items?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            ...{ onClick: () => { } },
            ...{ onKeydown: () => { } },
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
}
// @ts-ignore
[showNotifications, isDropdownOpen, closeAll, showAcceptModal, closeAcceptModal, closeAcceptModal, closeAcceptModal, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, currentNotification, confirmAccept, accepting, accepting, showRejectModal, closeRejectModal, closeRejectModal, closeRejectModal, rejectReason, rejectReason, confirmReject, submitting, submitting, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
});
export default {};
