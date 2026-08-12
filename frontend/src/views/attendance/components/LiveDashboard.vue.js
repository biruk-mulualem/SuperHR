import { ref, onMounted, onUnmounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
const stats = ref({
    activeBreaks: 0,
    activeDinnerBreaks: 0,
    activeFieldWork: 0,
    pendingAdjustments: 0
});
const loading = ref(false);
const error = ref(null);
let refreshInterval = null;
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Use getAllLateNightAdjustments instead of getLateNightAdjustments
        const [activeBreaks, activeFieldWork, pendingAdjustments] = await Promise.all([
            attendanceService.getActiveBreaks(),
            attendanceService.getAllFieldWork(),
            attendanceService.getAllLateNightAdjustments() // ← Changed this
        ]);
        const lunchBreaks = activeBreaks.filter(b => b.breakType === 'lunch');
        const dinnerBreaks = activeBreaks.filter(b => b.breakType === 'dinner');
        stats.value = {
            activeBreaks: lunchBreaks.length,
            activeDinnerBreaks: dinnerBreaks.length,
            activeFieldWork: activeFieldWork?.length || 0,
            pendingAdjustments: pendingAdjustments?.length || 0 // All adjustments shown
        };
    }
    catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        error.value = 'Failed to load statistics';
    }
    finally {
        loading.value = false;
    }
};
const startAutoRefresh = () => {
    refreshInterval = setInterval(fetchData, 30000);
};
onMounted(() => {
    fetchData();
    startAutoRefresh();
});
onUnmounted(() => {
    if (refreshInterval)
        clearInterval(refreshInterval);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "live-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['live-dashboard']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dashboard-header" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "pulse-dot" },
});
/** @type {__VLS_StyleScopedClasses['pulse-dot']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "live-badge" },
});
/** @type {__VLS_StyleScopedClasses['live-badge']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loader" },
    });
    /** @type {__VLS_StyleScopedClasses['loader']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.fetchData) },
        ...{ class: "retry-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['retry-btn']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dashboard-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['dashboard-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card lunch" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['lunch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-details" },
    });
    /** @type {__VLS_StyleScopedClasses['card-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-label" },
    });
    /** @type {__VLS_StyleScopedClasses['card-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-count" },
    });
    /** @type {__VLS_StyleScopedClasses['card-count']} */ ;
    (__VLS_ctx.stats.activeBreaks || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card dinner" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['dinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-details" },
    });
    /** @type {__VLS_StyleScopedClasses['card-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-label" },
    });
    /** @type {__VLS_StyleScopedClasses['card-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-count" },
    });
    /** @type {__VLS_StyleScopedClasses['card-count']} */ ;
    (__VLS_ctx.stats.activeDinnerBreaks || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card field" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-details" },
    });
    /** @type {__VLS_StyleScopedClasses['card-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-label" },
    });
    /** @type {__VLS_StyleScopedClasses['card-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-count" },
    });
    /** @type {__VLS_StyleScopedClasses['card-count']} */ ;
    (__VLS_ctx.stats.activeFieldWork || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card overtime" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['overtime']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-details" },
    });
    /** @type {__VLS_StyleScopedClasses['card-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-label" },
    });
    /** @type {__VLS_StyleScopedClasses['card-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-count" },
    });
    /** @type {__VLS_StyleScopedClasses['card-count']} */ ;
    (__VLS_ctx.stats.pendingAdjustments || 0);
}
// @ts-ignore
[loading, error, fetchData, stats, stats, stats, stats,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
