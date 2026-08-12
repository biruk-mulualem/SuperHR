import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";
// Import Tab Components
import IDCardTab from "./tabs/IDCardTab.vue";
import DegreeTab from "./tabs/DegreeTab.vue";
import GuaranteeTab from "./tabs/GuaranteeTab.vue";
const router = useRouter();
// ========== STATE ==========
const loading = ref(false);
const activeTab = ref('id_card');
const lastUpdated = ref(new Date().toLocaleString());
const departments = ref([]);
// ========== SUMMARY STATS ==========
const summaryStats = ref({
    totalEmployees: 0,
    fullyCompliant: 0,
    missingDocuments: 0,
    complianceRate: '0'
});
// ========== TAB MISSING COUNTS ==========
const tabMissingCounts = ref({
    id_card: 0,
    degree: 0,
    guarantee_letter: 0
});
// ========== TABS WITH MISSING COUNTS ==========
const tabs = computed(() => [
    {
        id: 'id_card',
        name: 'National ID',
        icon: '🪪',
        missingCount: tabMissingCounts.value.id_card
    },
    {
        id: 'degree',
        name: 'Degree',
        icon: '🎓',
        missingCount: tabMissingCounts.value.degree
    },
    {
        id: 'guarantee_letter',
        name: 'Guarantee',
        icon: '📋',
        missingCount: tabMissingCounts.value.guarantee_letter
    }
]);
// ========== METHODS ==========
const goBack = () => router.push({ name: 'dashboard' });
const viewEmployee = (id) => {
    if (id)
        router.push(`/employees/${id}`);
};
const getBadgeClass = (count) => {
    if (count === 0)
        return 'badge-success';
    if (count <= 5)
        return 'badge-warning';
    return 'badge-critical';
};
const switchTab = (tabId) => {
    activeTab.value = tabId;
};
const updateTabCount = (tabId, count) => {
    tabMissingCounts.value[tabId] = count;
};
// ========== LOAD COMPLIANCE SUMMARY ==========
const loadComplianceSummary = async () => {
    try {
        const res = await employeeService.getComplianceSummary();
        if (res.success && res.data) {
            const data = res.data;
            summaryStats.value = {
                totalEmployees: data.totalEmployees || 0,
                fullyCompliant: data.fullyCompliant || 0,
                missingDocuments: data.missingDocuments || 0,
                complianceRate: data.overallRate?.toFixed(2) || '0.00'
            };
        }
    }
    catch (error) {
        console.error('Error loading compliance summary:', error);
    }
};
// ========== LOAD TAB MISSING COUNTS - FIXED ==========
const loadTabCounts = async () => {
    try {
        // ✅ Use the existing getComplianceSummary which has all the data
        const res = await employeeService.getComplianceSummary();
        if (res.success && res.data) {
            const data = res.data;
            // ID Card missing count
            tabMissingCounts.value.id_card = data.idCard?.missing || 0;
            // Degree missing count
            tabMissingCounts.value.degree = data.degree?.missing || 0;
            // Guarantee missing count (employees with 0 or 1 guarantee)
            tabMissingCounts.value.guarantee_letter = (data.guarantee?.missing || 0) + (data.guarantee?.needSecond || 0);
        }
    }
    catch (error) {
        console.error('Error loading tab counts:', error);
    }
};
// ========== LOAD DEPARTMENTS ==========
const loadDepartments = async () => {
    try {
        const deptRes = await employeeService.getDepartmentDistribution();
        if (deptRes.success && deptRes.data) {
            departments.value = deptRes.data.departments || [];
        }
    }
    catch (error) {
        console.error('Error loading departments:', error);
    }
};
// ========== LOAD ALL DATA ==========
const loadAllData = async () => {
    loading.value = true;
    try {
        await Promise.all([
            loadComplianceSummary(),
            loadTabCounts(),
            loadDepartments()
        ]);
        lastUpdated.value = new Date().toLocaleString();
    }
    catch (error) {
        console.error('Error loading data:', error);
    }
    finally {
        loading.value = false;
    }
};
const refreshData = () => {
    loadAllData();
};
// ========== WATCHERS ==========
// Watch for changes in tab counts to update the UI
watch(tabMissingCounts, () => {
    // The tabs computed property will automatically update
}, { deep: true });
// ========== LIFECYCLE ==========
onMounted(() => {
    loadAllData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-link']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-link']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-link']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "compliance-page" },
});
/** @type {__VLS_StyleScopedClasses['compliance-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "back-btn" },
});
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 12H5M12 19l-7-7 7-7",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "action-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 4v6h-6M1 16v-6h6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M3.51 9a9 9 0 0 1 14.85-3.36L19 10M1 14l4.64 4.36A9 9 0 0 0 18.49 15",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-grid" },
});
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon blue" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.summaryStats.totalEmployees || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon green" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.summaryStats.fullyCompliant || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon red" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.summaryStats.missingDocuments || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon purple" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.summaryStats.complianceRate || '0');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs-nav" },
});
/** @type {__VLS_StyleScopedClasses['tabs-nav']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab(tab.id);
                // @ts-ignore
                [goBack, refreshData, loading, summaryStats, summaryStats, summaryStats, summaryStats, tabs, switchTab,];
            } },
        key: (tab.id),
        ...{ class: (['tab-link', { active: __VLS_ctx.activeTab === tab.id }]) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['tab-link']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-icon']} */ ;
    (tab.icon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-name" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-name']} */ ;
    (tab.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-badge" },
        ...{ class: (__VLS_ctx.getBadgeClass(tab.missingCount)) },
    });
    /** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
    (tab.missingCount);
    // @ts-ignore
    [activeTab, getBadgeClass,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-content" },
});
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-panel" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'id_card') }, null, null);
/** @type {__VLS_StyleScopedClasses['tab-panel']} */ ;
const __VLS_0 = IDCardTab;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onUpdateCount': {} },
    ...{ 'onViewEmployee': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdateCount': {} },
    ...{ 'onViewEmployee': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ updateCount: {} },
    { onUpdateCount: (...[$event]) => {
            __VLS_ctx.updateTabCount('id_card', $event);
            // @ts-ignore
            [activeTab, updateTabCount,];
        } });
const __VLS_7 = ({ viewEmployee: {} },
    { onViewEmployee: (__VLS_ctx.viewEmployee) });
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-panel" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'degree') }, null, null);
/** @type {__VLS_StyleScopedClasses['tab-panel']} */ ;
const __VLS_8 = DegreeTab;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ 'onUpdateCount': {} },
    ...{ 'onViewEmployee': {} },
}));
const __VLS_10 = __VLS_9({
    ...{ 'onUpdateCount': {} },
    ...{ 'onViewEmployee': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_13;
const __VLS_14 = ({ updateCount: {} },
    { onUpdateCount: (...[$event]) => {
            __VLS_ctx.updateTabCount('degree', $event);
            // @ts-ignore
            [activeTab, updateTabCount, viewEmployee,];
        } });
const __VLS_15 = ({ viewEmployee: {} },
    { onViewEmployee: (__VLS_ctx.viewEmployee) });
var __VLS_11;
var __VLS_12;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-panel" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'guarantee_letter') }, null, null);
/** @type {__VLS_StyleScopedClasses['tab-panel']} */ ;
const __VLS_16 = GuaranteeTab;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    ...{ 'onUpdateCount': {} },
    ...{ 'onViewEmployee': {} },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onUpdateCount': {} },
    ...{ 'onViewEmployee': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_21;
const __VLS_22 = ({ updateCount: {} },
    { onUpdateCount: (...[$event]) => {
            __VLS_ctx.updateTabCount('guarantee_letter', $event);
            // @ts-ignore
            [activeTab, updateTabCount, viewEmployee,];
        } });
const __VLS_23 = ({ viewEmployee: {} },
    { onViewEmployee: (__VLS_ctx.viewEmployee) });
var __VLS_19;
var __VLS_20;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-footer" },
});
/** @type {__VLS_StyleScopedClasses['page-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.lastUpdated);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.summaryStats.totalEmployees || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.summaryStats.complianceRate || '0');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.summaryStats.fullyCompliant || 0);
// @ts-ignore
[summaryStats, summaryStats, summaryStats, viewEmployee, lastUpdated,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
