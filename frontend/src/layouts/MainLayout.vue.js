import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/components/shared/AppSidebar.vue';
import AppHeader from '@/components/shared/AppHeader.vue';
import AppFooter from '@/components/shared/AppFooter.vue';
const route = useRoute();
const isSidebarCollapsed = ref(false);
// Check if current route is a print route
const isPrintRoute = computed(() => {
    return route.meta?.hideLayout === true || route.path.includes('/print-');
});
const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-layout" },
});
/** @type {__VLS_StyleScopedClasses['app-layout']} */ ;
if (!__VLS_ctx.isPrintRoute) {
    const __VLS_0 = AppHeader;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onToggleSidebar': {} },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onToggleSidebar': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ toggleSidebar: {} },
        { onToggleSidebar: (__VLS_ctx.toggleSidebar) });
    var __VLS_3;
    var __VLS_4;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "layout-body" },
});
/** @type {__VLS_StyleScopedClasses['layout-body']} */ ;
if (!__VLS_ctx.isPrintRoute) {
    const __VLS_7 = AppSidebar;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ class: ({ collapsed: __VLS_ctx.isSidebarCollapsed }) },
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: ({ collapsed: __VLS_ctx.isSidebarCollapsed }) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "main-container" },
    ...{ class: ({
            expanded: __VLS_ctx.isSidebarCollapsed,
            'print-mode': __VLS_ctx.isPrintRoute
        }) },
});
/** @type {__VLS_StyleScopedClasses['main-container']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['print-mode']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "content-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
let __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
routerView;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
if (!__VLS_ctx.isPrintRoute) {
    const __VLS_17 = AppFooter;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({}));
    const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
}
// @ts-ignore
[isPrintRoute, isPrintRoute, isPrintRoute, isPrintRoute, toggleSidebar, isSidebarCollapsed, isSidebarCollapsed,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
