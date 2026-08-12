const __VLS_props = defineProps({
    filters: {
        type: Object,
        default: () => ({})
    },
    departments: {
        type: Array,
        default: () => []
    }
});
const __VLS_emit = defineEmits(['update:filters', 'clear-filters', 'load-employees']);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-clear']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filters-bar" },
});
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "search-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "11",
    cy: "11",
    r: "8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M21 21l-4.35-4.35",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:filters', { search: $event.target.value });
            // @ts-ignore
            [$emit,];
        } },
    ...{ onKeyup: (...[$event]) => {
            __VLS_ctx.$emit('load-employees');
            // @ts-ignore
            [$emit,];
        } },
    type: "text",
    value: (__VLS_ctx.filters.search),
    placeholder: (__VLS_ctx.$t('common.searchEmployees') || 'Search employees...'),
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:filters', { departmentId: $event.target.value });
            // @ts-ignore
            [$emit, filters, $t,];
        } },
    value: (__VLS_ctx.filters.departmentId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.$t('common.allDepartments') || 'All Depts');
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept.departmentId),
        value: (dept.departmentId),
    });
    (dept.name);
    // @ts-ignore
    [filters, $t, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:filters', { employmentStatus: $event.target.value });
            // @ts-ignore
            [$emit,];
        } },
    value: (__VLS_ctx.filters.employmentStatus),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.$t('common.allStatus') || 'All Status');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "active",
});
(__VLS_ctx.$t('employee.active') || 'Active');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "on-leave",
});
(__VLS_ctx.$t('employee.onLeave') || 'On Leave');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "terminated",
});
(__VLS_ctx.$t('employee.terminated') || 'Terminated');
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:filters', { employmentType: $event.target.value });
            // @ts-ignore
            [$emit, filters, $t, $t, $t, $t,];
        } },
    value: (__VLS_ctx.filters.employmentType),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.$t('common.allTypes') || 'All Types');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "full-time",
});
(__VLS_ctx.$t('employee.fullTime') || 'Full Time');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "part-time",
});
(__VLS_ctx.$t('employee.partTime') || 'Part Time');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "contract",
});
(__VLS_ctx.$t('employee.contract') || 'Contract');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "intern",
});
(__VLS_ctx.$t('employee.intern') || 'Intern');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('clear-filters');
            // @ts-ignore
            [$emit, filters, $t, $t, $t, $t, $t,];
        } },
    ...{ class: "btn-clear" },
    title: (__VLS_ctx.$t('common.clearFilters') || 'Clear filters'),
});
/** @type {__VLS_StyleScopedClasses['btn-clear']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "btn-icon-small" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['btn-icon-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M18 6L6 18M6 6l12 12",
});
// @ts-ignore
[$t,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        filters: {
            type: Object,
            default: () => ({})
        },
        departments: {
            type: Array,
            default: () => []
        }
    },
});
export default {};
