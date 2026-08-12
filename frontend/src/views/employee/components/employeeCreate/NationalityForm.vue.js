import { ref } from 'vue';
const props = defineProps({
    nationalityAcquisition: {
        type: Object,
        default: () => ({ type: 'by_birth', documentId: null, documentUrl: null })
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:nationalityAcquisition', 'file-selected']);
const fileInput = ref(null);
const updateType = (value) => {
    emit('update:nationalityAcquisition', { ...props.nationalityAcquisition, type: value });
};
const triggerFileInput = () => {
    fileInput.value?.click();
};
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            emit('file-selected', props.t('validation.invalidFileType') || 'Invalid file type. Allowed: PDF, JPG, PNG', 'error');
            event.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            emit('file-selected', props.t('validation.fileTooLarge') || 'File size must be less than 5MB', 'error');
            event.target.value = '';
            return;
        }
        emit('update:nationalityAcquisition', {
            ...props.nationalityAcquisition,
            documentFile: file,
            documentUrl: null
        });
        emit('file-selected', `${props.t('nationality.certificate') || 'Certificate'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
    }
};
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
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
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
    d: "M3 21h18M3 10h18M5 6h14M8 3l-2 3h12l-2-3",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(props.t('nationality.title') || 'Nationality Information');
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
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('nationality.acquired') || 'How was nationality acquired?');
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateType($event.target.value);
            // @ts-ignore
            [updateType,];
        } },
    value: (__VLS_ctx.nationalityAcquisition.type),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "by_birth",
});
(props.t('nationality.byBirth') || 'By Birth');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "by_law",
});
(props.t('nationality.byLaw') || 'By Law (Naturalization)');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ethiopian_birth",
});
(props.t('nationality.ethiopianBirth') || 'Ethiopian by Birth');
if (__VLS_ctx.nationalityAcquisition.type === 'by_law') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('nationality.naturalizationCert') || 'Naturalization Certificate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.triggerFileInput) },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (__VLS_ctx.nationalityAcquisition.documentFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (__VLS_ctx.nationalityAcquisition.documentFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (__VLS_ctx.nationalityAcquisition.documentFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('nationality.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleFileSelect) },
        type: "file",
        ref: "fileInput",
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (props.t('nationality.certificateHint') || 'Select certificate (will be uploaded when you save the form)');
}
if (__VLS_ctx.nationalityAcquisition.type === 'by_law' && !__VLS_ctx.nationalityAcquisition.documentFile && !__VLS_ctx.nationalityAcquisition.documentUrl) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-message" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-message']} */ ;
    (props.t('nationality.certificateWarning') || 'Please select the naturalization certificate');
}
// @ts-ignore
[nationalityAcquisition, nationalityAcquisition, nationalityAcquisition, nationalityAcquisition, nationalityAcquisition, nationalityAcquisition, nationalityAcquisition, nationalityAcquisition, triggerFileInput, handleFileSelect,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        nationalityAcquisition: {
            type: Object,
            default: () => ({ type: 'by_birth', documentId: null, documentUrl: null })
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
