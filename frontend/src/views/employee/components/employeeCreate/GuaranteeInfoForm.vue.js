import { ref, watch } from 'vue';
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue';
const props = defineProps({
    guaranteeInfo: {
        type: Array,
        default: () => []
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:guaranteeInfo', 'file-selected']);
// Local reactive copy of guaranteeInfo
const localGuaranteeInfo = ref([...(props.guaranteeInfo || [])]);
// Store refs for file inputs
const documentRefs = ref({});
const setDocumentRef = (index, type, el) => {
    if (!documentRefs.value[index])
        documentRefs.value[index] = {};
    if (el)
        documentRefs.value[index][type] = el;
};
// Flag to prevent recursive updates
let isUpdating = false;
// Watch for changes from parent - only update if not from local
watch(() => props.guaranteeInfo, (newVal) => {
    if (!isUpdating) {
        localGuaranteeInfo.value = [...(newVal || [])];
    }
}, { deep: true });
const addGuarantor = () => {
    isUpdating = true;
    const newGuarantor = {
        guarantorName: '',
        guarantorJob: '',
        guarantorOfficeName: '',
        guarantorOfficeAddress: '',
        guaranteeLetterNo: '',
        guaranteeLetterDateEC: '', // Changed from guaranteeLetterDate
        sdtLetterNo: '',
        sdtLetterDateEC: '', // Changed from sdtLetterDate
        confirmedDateEC: '', // Changed from confirmedDate
        guaranteeLetterFile: null,
        sdtLetterFile: null,
        otherDocumentFile: null
    };
    const newArray = [...localGuaranteeInfo.value, newGuarantor];
    localGuaranteeInfo.value = newArray;
    emit('update:guaranteeInfo', newArray);
    isUpdating = false;
};
const removeGuarantor = (index) => {
    isUpdating = true;
    const newArray = [...localGuaranteeInfo.value];
    newArray.splice(index, 1);
    localGuaranteeInfo.value = newArray;
    delete documentRefs.value[index];
    emit('update:guaranteeInfo', newArray);
    isUpdating = false;
};
const updateGuarantor = (index, field, value) => {
    isUpdating = true;
    const newArray = [...localGuaranteeInfo.value];
    newArray[index][field] = value;
    localGuaranteeInfo.value = newArray;
    emit('update:guaranteeInfo', newArray);
    isUpdating = false;
};
const triggerGuaranteeLetterInput = (index) => {
    if (documentRefs.value[index]?.guaranteeLetter) {
        documentRefs.value[index].guaranteeLetter.click();
    }
};
const triggerSdtLetterInput = (index) => {
    if (documentRefs.value[index]?.sdtLetter) {
        documentRefs.value[index].sdtLetter.click();
    }
};
const triggerOtherDocumentInput = (index) => {
    if (documentRefs.value[index]?.otherDocument) {
        documentRefs.value[index].otherDocument.click();
    }
};
const handleDocumentSelect = (index, type, event) => {
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
        isUpdating = true;
        const fieldMap = {
            guaranteeLetter: 'guaranteeLetterFile',
            sdtLetter: 'sdtLetterFile',
            otherDocument: 'otherDocumentFile'
        };
        const newArray = [...localGuaranteeInfo.value];
        newArray[index][fieldMap[type]] = file;
        localGuaranteeInfo.value = newArray;
        emit('update:guaranteeInfo', newArray);
        emit('file-selected', `${props.t('guarantee.document') || 'Document'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
        isUpdating = false;
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
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
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
    d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 2v20",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(props.t('guarantee.title') || 'Guarantee Information');
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
(props.t('guarantee.guarantors') || 'Guarantors');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addGuarantor) },
    type: "button",
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
(props.t('common.add') || 'Add Guarantor');
for (const [guarantor, index] of __VLS_vFor((__VLS_ctx.localGuaranteeInfo))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (index),
        ...{ class: "guarantor-card" },
    });
    /** @type {__VLS_StyleScopedClasses['guarantor-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-header" },
    });
    /** @type {__VLS_StyleScopedClasses['item-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('guarantee.guarantor') || 'Guarantor');
    (index + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeGuarantor(index);
                // @ts-ignore
                [addGuarantor, localGuaranteeInfo, removeGuarantor,];
            } },
        type: "button",
        ...{ class: "btn-remove" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-remove']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-four" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.guarantorName') || 'Guarantor Name');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateGuarantor(index, 'guarantorName', $event.target.value);
                // @ts-ignore
                [updateGuarantor,];
            } },
        type: "text",
        value: (guarantor.guarantorName),
        placeholder: (props.t('guarantee.guarantorNamePlaceholder') || 'Full name of guarantor'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.guarantorJob') || 'Guarantor Job / Position');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateGuarantor(index, 'guarantorJob', $event.target.value);
                // @ts-ignore
                [updateGuarantor,];
            } },
        type: "text",
        value: (guarantor.guarantorJob),
        placeholder: (props.t('guarantee.jobPlaceholder') || 'Job title or position'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.guarantorOfficeName') || 'Guarantor Office Name');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateGuarantor(index, 'guarantorOfficeName', $event.target.value);
                // @ts-ignore
                [updateGuarantor,];
            } },
        type: "text",
        value: (guarantor.guarantorOfficeName),
        placeholder: (props.t('guarantee.officeNamePlaceholder') || 'Company/Office name'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.guarantorOfficeAddress') || 'Guarantor Office Address');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateGuarantor(index, 'guarantorOfficeAddress', $event.target.value);
                // @ts-ignore
                [updateGuarantor,];
            } },
        type: "text",
        value: (guarantor.guarantorOfficeAddress),
        placeholder: (props.t('guarantee.addressPlaceholder') || 'Office address'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-two" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-section-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-section-title']} */ ;
    (props.t('guarantee.guaranteeLetterTitle') || 'Guarantee Letter Details');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.letterNumber') || 'Guarantee Letter Number');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateGuarantor(index, 'guaranteeLetterNo', $event.target.value);
                // @ts-ignore
                [updateGuarantor,];
            } },
        type: "text",
        value: (guarantor.guaranteeLetterNo),
        placeholder: (props.t('guarantee.letterNumberPlaceholder') || 'Letter reference number'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.letterDate') || 'Guarantee Letter Date');
    const __VLS_0 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (guarantor.guaranteeLetterDateEC),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (guarantor.guaranteeLetterDateEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateGuarantor(index, 'guaranteeLetterDateEC', value)) });
    var __VLS_3;
    var __VLS_4;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.letterDocument') || 'Guarantee Letter Document');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerGuaranteeLetterInput(index);
                // @ts-ignore
                [updateGuarantor, triggerGuaranteeLetterInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (guarantor.guaranteeLetterFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (guarantor.guaranteeLetterFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (guarantor.guaranteeLetterFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('guarantee.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleDocumentSelect(index, 'guaranteeLetter', $event);
                // @ts-ignore
                [handleDocumentSelect,];
            } },
        type: "file",
        ref: (el => __VLS_ctx.setDocumentRef(index, 'guaranteeLetter', el)),
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (props.t('guarantee.guaranteeLetterHint') || 'Select signed guarantee letter');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-section-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-section-title']} */ ;
    (props.t('guarantee.sdtLetterTitle') || 'SDT Letter Details');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.sdtLetterNumber') || 'SDT Letter Number');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateGuarantor(index, 'sdtLetterNo', $event.target.value);
                // @ts-ignore
                [updateGuarantor, setDocumentRef,];
            } },
        type: "text",
        value: (guarantor.sdtLetterNo),
        placeholder: (props.t('guarantee.sdtNumberPlaceholder') || 'SDT letter number'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.sdtLetterDate') || 'SDT Letter Date');
    const __VLS_7 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (guarantor.sdtLetterDateEC),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (guarantor.sdtLetterDateEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateGuarantor(index, 'sdtLetterDateEC', value)) });
    var __VLS_10;
    var __VLS_11;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('guarantee.sdtLetterDocument') || 'SDT Letter Document');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerSdtLetterInput(index);
                // @ts-ignore
                [updateGuarantor, triggerSdtLetterInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (guarantor.sdtLetterFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (guarantor.sdtLetterFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (guarantor.sdtLetterFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('guarantee.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleDocumentSelect(index, 'sdtLetter', $event);
                // @ts-ignore
                [handleDocumentSelect,];
            } },
        type: "file",
        ref: (el => __VLS_ctx.setDocumentRef(index, 'sdtLetter', el)),
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (props.t('guarantee.sdtLetterHint') || 'Select SDT letter document');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-two" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
    // @ts-ignore
    [setDocumentRef,];
}
if (!__VLS_ctx.localGuaranteeInfo || __VLS_ctx.localGuaranteeInfo.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    (props.t('guarantee.noGuarantors') || 'No guarantors added. Click "Add Guarantor" to add.');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-note" },
});
/** @type {__VLS_StyleScopedClasses['info-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
(props.t('guarantee.note') || 'Note: Guarantee information is required for employees handling financial responsibilities.');
// @ts-ignore
[localGuaranteeInfo, localGuaranteeInfo,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        guaranteeInfo: {
            type: Array,
            default: () => []
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
