import { computed, defineAsyncComponent } from 'vue';
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
// Map roles to dashboard components
const dashboardComponents = {
    admin: defineAsyncComponent(() => import('./components/AdminDashboard.vue')),
    hr: defineAsyncComponent(() => import('./components/HRDashboard.vue')),
    finance: defineAsyncComponent(() => import('./components/FinanceDashboard.vue')),
    employee: defineAsyncComponent(() => import('./components/EmployeeDashboard.vue')),
    attendance: defineAsyncComponent(() => import('./components/AttendanceDashboard.vue')),
    // ⭐ NEW: Store and Checker dashboards
    store: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
    storekeeper: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
    store_it: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
    store_manager: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
    checker: defineAsyncComponent(() => import('./components/CheckerDashboard.vue')),
    cost: defineAsyncComponent(() => import('./components/CostDashboard.vue')),
    employee: defineAsyncComponent(() => import('./components/NonStoreUserDashboard.vue')),
};
// Get the current dashboard component based on user role
const currentDashboard = computed(() => {
    const role = authStore.user?.role || 'employee';
    // Map role to dashboard
    // If the role matches any of the store roles, use StoreDashboard
    const storeRoles = ['store', 'storekeeper', 'store_it', 'store_manager'];
    if (storeRoles.includes(role)) {
        return dashboardComponents.store;
    }
    // If role is checker, use CheckerDashboard
    if (role === 'checker') {
        return dashboardComponents.checker;
    }
    // Default: use the role mapping or fallback to employee
    return dashboardComponents[role] || dashboardComponents.employee;
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dashboard-content" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-content']} */ ;
const __VLS_0 = (__VLS_ctx.currentDashboard);
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
// @ts-ignore
[currentDashboard,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
