import { ref, computed, onMounted } from 'vue';
import checkerDashboardService from '@/stores/checkerDashboardService';
// ================================================================
// STATE
// ================================================================
const loading = ref(true);
const error = ref(null);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// Dashboard data from API
const dashboardData = ref(null);
// ================================================================
// COMPUTED - Data from API
// ================================================================
const inventoryStats = computed(() => {
    return dashboardData.value?.inventoryStats || {
        totalItems: 0,
        activeItems: 0,
        inactiveItems: 0,
        missingConversion: 0,
        missingCost: 0,
        healthyItems: 0
    };
});
const auditStats = computed(() => {
    return dashboardData.value?.auditStats || {
        totalStores: 0,
        totalItems: 0,
        matched: 0,
        conflicts: 0,
        dateDiffs: 0
    };
});
const storeConflictData = computed(() => {
    return dashboardData.value?.storeConflictData || [];
});
const topConflicts = computed(() => {
    return dashboardData.value?.topConflicts || [];
});
const topDateDiffs = computed(() => {
    return dashboardData.value?.topDateDiffs || [];
});
const lastUpdated = computed(() => {
    return dashboardData.value?.summary?.lastUpdated || null;
});
// ================================================================
// COMPUTED - UI Helpers
// ================================================================
const currentDate = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});
// Sort stores by conflicts (highest to lowest)
const sortedByConflicts = computed(() => {
    return [...storeConflictData.value]
        .sort((a, b) => b.conflicts - a.conflicts);
});
// Get max conflicts for percentage calculation
const maxConflicts = computed(() => {
    if (sortedByConflicts.value.length === 0)
        return 0;
    return sortedByConflicts.value[0].conflicts;
});
// ================================================================
// METHODS
// ================================================================
/**
 * Load dashboard data from API
 */
const loadDashboardData = async () => {
    loading.value = true;
    error.value = null;
    try {
        console.log('📊 Loading dashboard data...');
        const result = await checkerDashboardService.getDashboardSummary();
        if (result.success) {
            dashboardData.value = result.data;
            console.log('✅ Dashboard data loaded:', dashboardData.value);
        }
        else {
            error.value = result.error || 'Failed to load dashboard data';
            showToastMessage(error.value, 'error');
        }
    }
    catch (err) {
        console.error('❌ Error loading dashboard:', err);
        error.value = err.message || 'Failed to load dashboard data';
        showToastMessage(error.value, 'error');
    }
    finally {
        loading.value = false;
    }
};
/**
 * Refresh data
 */
const refreshData = async () => {
    try {
        loading.value = true;
        const result = await checkerDashboardService.refreshDashboard();
        if (result.success) {
            showToastMessage('Data refreshed successfully!', 'success');
            await loadDashboardData();
        }
        else {
            showToastMessage(result.message || 'Failed to refresh data', 'error');
        }
    }
    catch (err) {
        console.error('❌ Error refreshing data:', err);
        showToastMessage('Failed to refresh data', 'error');
    }
    finally {
        loading.value = false;
    }
};
/**
 * Format number with commas
 */
const formatNumber = (value) => {
    if (!value && value !== 0)
        return '0';
    return value.toLocaleString();
};
/**
 * Get percentage
 */
const getPercent = (value, total) => {
    if (total === 0)
        return 0;
    return Math.round((value / total) * 100);
};
/**
 * Get conflict percentage for bar width
 */
const getConflictPercentage = (conflicts) => {
    if (maxConflicts.value === 0)
        return 0;
    return Math.round((conflicts / maxConflicts.value) * 100);
};
/**
 * Get conflict color based on severity
 */
const getConflictColor = (conflicts) => {
    if (conflicts === 0)
        return '#94a3b8';
    if (conflicts <= 5)
        return '#f59e0b';
    if (conflicts <= 20)
        return '#f97316';
    if (conflicts <= 50)
        return '#ef4444';
    return '#dc2626';
};
/**
 * Format datetime
 */
const formatDateTime = (dateStr) => {
    if (!dateStr)
        return '';
    return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
/**
 * Show toast message
 */
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
    loadDashboardData();
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
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-retry']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['main-card']} */ ;
/** @type {__VLS_StyleScopedClasses['main-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['main-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['main-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['main-card-title-group']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict']} */ ;
/** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['main-cards-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['issues-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['main-cards-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['issues-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-data-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['two-items']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-bar-row']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['issues-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['store-name']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['analytics-dashboard']} */ ;
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
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadDashboardData) },
        ...{ class: "btn-retry" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-retry']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-cards-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['main-cards-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-icon blue" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-title-group" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-title-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "main-card-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-body" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['main-stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.inventoryStats.totalItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['main-stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-item" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-dot active" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-content" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-value" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.inventoryStats.activeItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-percent']} */ ;
    (__VLS_ctx.getPercent(__VLS_ctx.inventoryStats.activeItems, __VLS_ctx.inventoryStats.totalItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-item" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-dot inactive" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['inactive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-content" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-value" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.inventoryStats.inactiveItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-percent']} */ ;
    (__VLS_ctx.getPercent(__VLS_ctx.inventoryStats.inactiveItems, __VLS_ctx.inventoryStats.totalItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-icon orange" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['orange']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-title-group" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-title-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "main-card-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-body" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['main-stat-value']} */ ;
    (__VLS_ctx.formatNumber(138 + 184 - 13));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['main-stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-grid two-items" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['two-items']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-item" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-dot cost" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['cost']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-content" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-value" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-value']} */ ;
    (__VLS_ctx.formatNumber(138));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-item" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-dot conversion-merged" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['conversion-merged']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-content" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-value" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-value']} */ ;
    (__VLS_ctx.formatNumber(184));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-icon purple" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['purple']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-title-group" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-title-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "main-card-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-card-body" },
    });
    /** @type {__VLS_StyleScopedClasses['main-card-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['main-stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.auditStats.totalStores));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "main-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['main-stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-grid two-items" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['two-items']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-item" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-dot conflict" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['conflict']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-content" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-value" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.auditStats.conflicts));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-percent']} */ ;
    (__VLS_ctx.getPercent(__VLS_ctx.auditStats.conflicts, __VLS_ctx.auditStats.totalItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-item" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-dot date-diff" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['date-diff']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-data-content" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-value" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.auditStats.dateDiffs));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sub-data-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-data-percent']} */ ;
    (__VLS_ctx.getPercent(__VLS_ctx.auditStats.dateDiffs, __VLS_ctx.auditStats.totalItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title-left" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    if (__VLS_ctx.storeConflictData.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "conflict-chart" },
        });
        /** @type {__VLS_StyleScopedClasses['conflict-chart']} */ ;
        for (const [store] of __VLS_vFor((__VLS_ctx.sortedByConflicts))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (store.name),
                ...{ class: "conflict-bar-row" },
            });
            /** @type {__VLS_StyleScopedClasses['conflict-bar-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "conflict-bar-label" },
            });
            /** @type {__VLS_StyleScopedClasses['conflict-bar-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "store-name" },
            });
            /** @type {__VLS_StyleScopedClasses['store-name']} */ ;
            (store.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "conflict-bar-track" },
            });
            /** @type {__VLS_StyleScopedClasses['conflict-bar-track']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "conflict-bar-fill" },
                ...{ style: ({
                        width: __VLS_ctx.getConflictPercentage(store.conflicts) + '%',
                        background: __VLS_ctx.getConflictColor(store.conflicts)
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['conflict-bar-fill']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "conflict-bar-value" },
            });
            /** @type {__VLS_StyleScopedClasses['conflict-bar-value']} */ ;
            (store.conflicts);
            // @ts-ignore
            [currentDate, refreshData, loading, loading, loading, loading, error, error, loadDashboardData, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, inventoryStats, inventoryStats, inventoryStats, inventoryStats, inventoryStats, inventoryStats, inventoryStats, getPercent, getPercent, getPercent, getPercent, auditStats, auditStats, auditStats, auditStats, auditStats, auditStats, auditStats, storeConflictData, sortedByConflicts, getConflictPercentage, getConflictColor,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title-left" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "issues-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['issues-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge danger" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    (__VLS_ctx.topConflicts.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "issues-list" },
    });
    /** @type {__VLS_StyleScopedClasses['issues-list']} */ ;
    if (__VLS_ctx.topConflicts.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.topConflicts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (index),
            ...{ class: "issue-item conflict" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['conflict']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-rank" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-rank']} */ ;
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-code" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-code']} */ ;
        (item.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-name" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-name']} */ ;
        (item.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-store" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-store']} */ ;
        (item.store);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-value" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-value']} */ ;
        (item.diff);
        // @ts-ignore
        [topConflicts, topConflicts, topConflicts,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge purple" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['purple']} */ ;
    (__VLS_ctx.topDateDiffs.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "issues-list" },
    });
    /** @type {__VLS_StyleScopedClasses['issues-list']} */ ;
    if (__VLS_ctx.topDateDiffs.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.topDateDiffs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (index),
            ...{ class: "issue-item date-diff" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['date-diff']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-rank" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-rank']} */ ;
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-code" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-code']} */ ;
        (item.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-name" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-name']} */ ;
        (item.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "issue-store" },
        });
        /** @type {__VLS_StyleScopedClasses['issue-store']} */ ;
        (item.store);
        // @ts-ignore
        [topDateDiffs, topDateDiffs, topDateDiffs,];
    }
    if (__VLS_ctx.lastUpdated) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "last-updated" },
        });
        /** @type {__VLS_StyleScopedClasses['last-updated']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.lastUpdated));
    }
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
[lastUpdated, lastUpdated, formatDateTime, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
