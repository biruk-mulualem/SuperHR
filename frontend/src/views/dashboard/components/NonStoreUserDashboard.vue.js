import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import itemRequestService from '@/stores/itemRequestService';
const authStore = useAuthStore();
// ================================================================
// STATE
// ================================================================
const loading = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// User Info - from auth store
const user = computed(() => {
    return authStore.user || {
        fullName: 'Guest User',
        username: 'guest',
        role: 'Viewer',
        userId: null
    };
});
const getUserInitials = computed(() => {
    const name = user.value.fullName || user.value.username || 'Guest';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});
// Stats Data
const stats = ref({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
});
// ================================================================
// COMPUTED
// ================================================================
const currentDate = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});
// ================================================================
// METHODS
// ================================================================
const formatNumber = (value) => {
    if (!value)
        return '0';
    return value.toLocaleString();
};
// Load Stats - uses the backend which filters by user
const loadStats = async () => {
    loading.value = true;
    try {
        const response = await itemRequestService.getStats();
        if (response.success) {
            stats.value = {
                total: response.data.total || 0,
                pending: response.data.pending || 0,
                approved: response.data.approved || 0,
                rejected: response.data.rejected || 0
            };
            console.log('📊 Stats loaded for user:', {
                user: user.value.fullName || user.value.username,
                userId: user.value.userId,
                role: user.value.role,
                stats: stats.value
            });
        }
        else {
            showToastMessage(response.error || 'Failed to load statistics', 'error');
        }
    }
    catch (error) {
        console.error('Error loading stats:', error);
        showToastMessage(error.message || 'Failed to load statistics', 'error');
    }
    finally {
        loading.value = false;
    }
};
const refreshData = async () => {
    showToastMessage('Refreshing requests...', 'info');
    await loadStats();
    showToastMessage('Requests refreshed!', 'success');
};
const showToastMessage = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
    console.log('Non-Store User Dashboard mounted');
    console.log('User:', user.value);
    loadStats();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['nonstore-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['user-details']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "nonstore-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['nonstore-dashboard']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "dashboard-header" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "logo-badge" },
});
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "2",
    y: "7",
    width: "20",
    height: "10",
    rx: "1",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-right" },
});
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "date-display" },
});
/** @type {__VLS_StyleScopedClasses['date-display']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "date-icon" },
});
/** @type {__VLS_StyleScopedClasses['date-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "date-text" },
});
/** @type {__VLS_StyleScopedClasses['date-text']} */ ;
(__VLS_ctx.currentDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "refresh-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2.5",
        width: "18",
        height: "18",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M23 4v6h-6M1 20v-6h6",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-text" },
});
/** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
(__VLS_ctx.loading ? 'Loading...' : 'Refresh');
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
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card primary" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats.total));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card warning" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats.pending));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card success" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats.approved));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card danger" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats.rejected));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
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
[currentDate, refreshData, loading, loading, loading, loading, formatNumber, formatNumber, formatNumber, formatNumber, stats, stats, stats, stats, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
