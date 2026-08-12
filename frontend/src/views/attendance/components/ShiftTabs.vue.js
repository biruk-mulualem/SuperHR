const __VLS_props = defineProps({
    modelValue: String
});
const __VLS_emit = defineEmits(['update:modelValue']);
const tabs = [
    { value: 'day', label: 'Day Shift', icon: '☀️' },
    { value: 'night', label: 'Night Shift', icon: '🌙' },
    { value: 'holidays', label: 'Holidays', icon: '📅' }
];
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
/** @type {__VLS_StyleScopedClasses['shift-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['shift-tabs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "shift-tabs" },
});
/** @type {__VLS_StyleScopedClasses['shift-tabs']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('update:modelValue', tab.value);
                // @ts-ignore
                [tabs, $emit,];
            } },
        key: (tab.value),
        ...{ class: ({ active: __VLS_ctx.modelValue === tab.value }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tab-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-icon']} */ ;
    (tab.icon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (tab.label);
    // @ts-ignore
    [modelValue,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        modelValue: String
    },
});
export default {};
