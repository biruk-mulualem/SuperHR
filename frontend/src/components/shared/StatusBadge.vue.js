import { computed } from 'vue';
const props = defineProps({
    status: {
        type: String,
        required: true
    }
});
const statusMap = {
    'active': 'On Break',
    'late': 'Late',
    'absent': 'Absent',
    'completed': 'Completed',
    'on-time': 'On Time'
};
const text = computed(() => statusMap[props.status] || props.status);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: (['status-badge', __VLS_ctx.status]) },
});
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
(__VLS_ctx.text);
// @ts-ignore
[status, text,];
const __VLS_export = (await import('vue')).defineComponent({
    props: {
        status: {
            type: String,
            required: true
        }
    },
});
export default {};
