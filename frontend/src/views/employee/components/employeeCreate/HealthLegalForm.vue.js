import { ref, watch } from 'vue';
const props = defineProps({
    healthInfo: {
        type: Object,
        default: () => ({ hasPhysicalInjury: false, injuryDescription: '' })
    },
    legalInfo: {
        type: Object,
        default: () => ({ hasCriminalRecord: false, criminalRecordDescription: '' })
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:healthInfo', 'update:legalInfo']);
// Local reactive copies
const localHealthInfo = ref({ ...props.healthInfo });
const localLegalInfo = ref({ ...props.legalInfo });
// Flag to prevent recursive updates
let isUpdating = false;
// Watch for changes from parent
watch(() => props.healthInfo, (newVal) => {
    if (!isUpdating) {
        localHealthInfo.value = { ...newVal };
    }
}, { deep: true });
watch(() => props.legalInfo, (newVal) => {
    if (!isUpdating) {
        localLegalInfo.value = { ...newVal };
    }
}, { deep: true });
// Watch local changes and emit to parent
watch(localHealthInfo, (newVal) => {
    isUpdating = true;
    emit('update:healthInfo', newVal);
    isUpdating = false;
}, { deep: true });
watch(localLegalInfo, (newVal) => {
    isUpdating = true;
    emit('update:legalInfo', newVal);
    isUpdating = false;
}, { deep: true });
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
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-card" },
});
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(props.t('healthLegal.title') || 'Health & Legal Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "optional-badge" },
});
/** @type {__VLS_StyleScopedClasses['optional-badge']} */ ;
(props.t('common.optional') || 'Optional');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('healthLegal.healthTitle') || 'Health Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "checkbox-label" },
});
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "checkbox",
});
(__VLS_ctx.localHealthInfo.hasPhysicalInjury);
(props.t('healthLegal.hasInjury') || 'Has any physical injury or disability?');
if (__VLS_ctx.localHealthInfo.hasPhysicalInjury) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('healthLegal.injuryDescription') || 'Injury/Disability Description');
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.localHealthInfo.injuryDescription),
        rows: "3",
        placeholder: (props.t('healthLegal.injuryPlaceholder') || 'Please describe the injury, disability, or medical condition...'),
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('healthLegal.legalTitle') || 'Legal Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "checkbox-label" },
});
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "checkbox",
});
(__VLS_ctx.localLegalInfo.hasCriminalRecord);
(props.t('healthLegal.hasCriminalRecord') || 'Has any criminal record?');
if (__VLS_ctx.localLegalInfo.hasCriminalRecord) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('healthLegal.criminalDescription') || 'Criminal Record Description');
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.localLegalInfo.criminalRecordDescription),
        rows: "3",
        placeholder: (props.t('healthLegal.criminalPlaceholder') || 'Please describe the criminal record...'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (props.t('healthLegal.confidentialNote') || 'This information is kept confidential');
}
// @ts-ignore
[localHealthInfo, localHealthInfo, localHealthInfo, localLegalInfo, localLegalInfo, localLegalInfo,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        healthInfo: {
            type: Object,
            default: () => ({ hasPhysicalInjury: false, injuryDescription: '' })
        },
        legalInfo: {
            type: Object,
            default: () => ({ hasCriminalRecord: false, criminalRecordDescription: '' })
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
