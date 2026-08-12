import { ref, watch } from 'vue';
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue';
const props = defineProps({
    training: {
        type: Array,
        default: () => []
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:training', 'file-selected']);
const localTraining = ref([...(props.training || [])]);
const fileInputs = ref({});
let isUpdating = false;
watch(() => props.training, (newVal) => {
    if (!isUpdating) {
        localTraining.value = [...(newVal || [])];
    }
}, { deep: true });
const setFileInputRef = (index, el) => {
    if (el) {
        fileInputs.value[index] = el;
    }
};
const addTraining = () => {
    isUpdating = true;
    const newTraining = [...localTraining.value, {
            trainingName: '',
            institutionName: '',
            institutionAddress: '',
            startDateEC: '', // Changed from startDate
            endDateEC: '', // Changed from endDate
            certificateFile: null
        }];
    localTraining.value = newTraining;
    emit('update:training', newTraining);
    isUpdating = false;
};
const updateTraining = (index, field, value) => {
    isUpdating = true;
    const newTraining = [...localTraining.value];
    newTraining[index][field] = value;
    localTraining.value = newTraining;
    emit('update:training', newTraining);
    isUpdating = false;
};
const removeTraining = (index) => {
    isUpdating = true;
    const newTraining = [...localTraining.value];
    newTraining.splice(index, 1);
    localTraining.value = newTraining;
    emit('update:training', newTraining);
    isUpdating = false;
};
const triggerCertificateInput = (index) => {
    if (fileInputs.value[index]) {
        fileInputs.value[index].click();
    }
};
const handleCertificateSelect = (index, event) => {
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
        const newTraining = [...localTraining.value];
        newTraining[index].certificateFile = file;
        localTraining.value = newTraining;
        emit('update:training', newTraining);
        emit('file-selected', `${props.t('training.certificate') || 'Certificate'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
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
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "2",
    y: "7",
    width: "20",
    height: "14",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(props.t('training.title') || 'Training History');
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
(props.t('training.sectionTitle') || 'Training & Certifications');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addTraining) },
    type: "button",
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
(props.t('common.add') || 'Add Training');
for (const [item, idx] of __VLS_vFor((__VLS_ctx.localTraining))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (idx),
        ...{ class: "training-card" },
    });
    /** @type {__VLS_StyleScopedClasses['training-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-header" },
    });
    /** @type {__VLS_StyleScopedClasses['item-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('training.training') || 'Training');
    (idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeTraining(idx);
                // @ts-ignore
                [addTraining, localTraining, removeTraining,];
            } },
        type: "button",
        ...{ class: "btn-remove" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-remove']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('training.trainingName') || 'Training/Course Name');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateTraining(idx, 'trainingName', $event.target.value);
                // @ts-ignore
                [updateTraining,];
            } },
        type: "text",
        value: (item.trainingName),
        placeholder: (props.t('training.trainingNamePlaceholder') || 'Training name'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('training.institution') || 'Institution/Provider');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateTraining(idx, 'institutionName', $event.target.value);
                // @ts-ignore
                [updateTraining,];
            } },
        type: "text",
        value: (item.institutionName),
        placeholder: (props.t('training.institutionPlaceholder') || 'Institution name'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('training.institutionAddress') || 'Institution Address');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateTraining(idx, 'institutionAddress', $event.target.value);
                // @ts-ignore
                [updateTraining,];
            } },
        type: "text",
        value: (item.institutionAddress),
        placeholder: (props.t('address.address') || 'Address'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('training.startDate') || 'Start Date');
    const __VLS_0 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.startDateEC),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.startDateEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateTraining(idx, 'startDateEC', value)) });
    var __VLS_3;
    var __VLS_4;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('training.endDate') || 'End Date');
    const __VLS_7 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.endDateEC),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.endDateEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateTraining(idx, 'endDateEC', value)) });
    var __VLS_10;
    var __VLS_11;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('training.certificate') || 'Certificate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerCertificateInput(idx);
                // @ts-ignore
                [updateTraining, updateTraining, triggerCertificateInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (item.certificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (item.certificateFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (item.certificateFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('training.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleCertificateSelect(idx, $event);
                // @ts-ignore
                [handleCertificateSelect,];
            } },
        type: "file",
        ref: (el => __VLS_ctx.setFileInputRef(idx, el)),
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (props.t('training.certificateHint') || 'Select certificate (will be uploaded when you save the form)');
    // @ts-ignore
    [setFileInputRef,];
}
if (!__VLS_ctx.localTraining || __VLS_ctx.localTraining.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    (props.t('training.emptyState') || 'No training records added. Click "Add Training" to add.');
}
// @ts-ignore
[localTraining, localTraining,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        training: {
            type: Array,
            default: () => []
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
