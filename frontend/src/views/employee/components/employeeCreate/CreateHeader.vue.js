const __VLS_emit = defineEmits(['import-click']);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['import-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['import-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['create-header']} */ ;
/** @type {__VLS_StyleScopedClasses['import-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "create-header" },
});
/** @type {__VLS_StyleScopedClasses['create-header']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/employees",
    ...{ class: "back-btn" },
    title: (__VLS_ctx.$t('common.back') || 'Back'),
}));
const __VLS_2 = __VLS_1({
    to: "/employees",
    ...{ class: "back-btn" },
    title: (__VLS_ctx.$t('common.back') || 'Back'),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M15 18l-6-6 6-6",
});
// @ts-ignore
[$t,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-title" },
});
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.$t('employee.newEmployee') || 'New Employee');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.$t('employee.addEmployeeInfo') || 'Add employee information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('import-click');
            // @ts-ignore
            [$t, $t, $emit,];
        } },
    ...{ class: "import-btn" },
});
/** @type {__VLS_StyleScopedClasses['import-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "7 10 12 15 17 10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "15",
    x2: "12",
    y2: "3",
});
(__VLS_ctx.$t('common.importCSV') || 'Import CSV');
// @ts-ignore
[$t,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
});
export default {};
