import { ref, watch } from 'vue';
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue';
const props = defineProps({
    education: {
        type: Array,
        default: () => []
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:education', 'file-selected']);
const localEducation = ref([...(props.education || [])]);
const fileInputs = ref({});
let isUpdating = false;
watch(() => props.education, (newVal) => {
    if (!isUpdating) {
        localEducation.value = [...(newVal || [])];
    }
}, { deep: true });
const setFileInputRef = (index, el) => {
    if (el) {
        fileInputs.value[index] = el;
    }
};
const addEducation = () => {
    isUpdating = true;
    const newEducation = [...localEducation.value, {
            level: '',
            institutionName: '',
            institutionAddress: '',
            startDateEC: '', // Changed from startDate
            endDateEC: '', // Changed from endDate
            isCurrent: false,
            certificateFile: null
        }];
    localEducation.value = newEducation;
    emit('update:education', newEducation);
    isUpdating = false;
};
const updateEducation = (index, field, value) => {
    isUpdating = true;
    const newEducation = [...localEducation.value];
    newEducation[index][field] = value;
    localEducation.value = newEducation;
    emit('update:education', newEducation);
    isUpdating = false;
};
const removeEducation = (index) => {
    isUpdating = true;
    const newEducation = [...localEducation.value];
    newEducation.splice(index, 1);
    localEducation.value = newEducation;
    emit('update:education', newEducation);
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
        const newEducation = [...localEducation.value];
        newEducation[index].certificateFile = file;
        localEducation.value = newEducation;
        emit('update:education', newEducation);
        emit('file-selected', `${props.t('education.certificate')} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
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
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
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
    d: "M22 10v6M2 10l10-5 10-5-10 5z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M6 12v5c3 3 9 3 12 0v-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.t('education.title') || 'Education Background');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(__VLS_ctx.t('education.history') || 'Education History');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addEducation) },
    type: "button",
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
(__VLS_ctx.t('common.add') || 'Add Education');
for (const [item, idx] of __VLS_vFor((__VLS_ctx.localEducation))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (idx),
        ...{ class: "education-card" },
    });
    /** @type {__VLS_StyleScopedClasses['education-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-header" },
    });
    /** @type {__VLS_StyleScopedClasses['item-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('education.education') || 'Education');
    (idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeEducation(idx);
                // @ts-ignore
                [t, t, t, t, addEducation, localEducation, removeEducation,];
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
    (__VLS_ctx.t('education.level') || 'Education Level');
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.updateEducation(idx, 'level', $event.target.value);
                // @ts-ignore
                [t, updateEducation,];
            } },
        value: (item.level),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('common.select') || 'Select level');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "primary",
    });
    (__VLS_ctx.t('education.primary') || 'Primary School');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "secondary",
    });
    (__VLS_ctx.t('education.secondary') || 'Secondary School');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "diploma",
    });
    (__VLS_ctx.t('education.diploma') || 'Diploma');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "bachelor",
    });
    (__VLS_ctx.t('education.bachelor') || "Bachelor's Degree");
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "master",
    });
    (__VLS_ctx.t('education.master') || "Master's Degree");
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "phd",
    });
    (__VLS_ctx.t('education.phd') || 'PhD/Doctorate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "certificate",
    });
    (__VLS_ctx.t('education.certificate') || 'Certificate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('education.institutionName') || 'Institution Name');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateEducation(idx, 'institutionName', $event.target.value);
                // @ts-ignore
                [t, t, t, t, t, t, t, t, t, updateEducation,];
            } },
        type: "text",
        value: (item.institutionName),
        placeholder: (__VLS_ctx.t('education.institutionPlaceholder') || 'Institution name'),
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
    (__VLS_ctx.t('education.institutionAddress') || 'Institution Address');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateEducation(idx, 'institutionAddress', $event.target.value);
                // @ts-ignore
                [t, t, updateEducation,];
            } },
        type: "text",
        value: (item.institutionAddress),
        placeholder: (__VLS_ctx.t('address.address') || 'Address'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "checkbox-label" },
    });
    /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.updateEducation(idx, 'isCurrent', $event.target.checked);
                // @ts-ignore
                [t, updateEducation,];
            } },
        type: "checkbox",
        checked: (item.isCurrent),
    });
    (__VLS_ctx.t('education.currentlyStudying') || 'Currently Studying');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('education.startDate') || 'Start Date');
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
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateEducation(idx, 'startDateEC', value)) });
    var __VLS_3;
    var __VLS_4;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('education.endDate') || 'End Date');
    const __VLS_7 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.endDateEC),
        disabled: (item.isCurrent),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.endDateEC),
        disabled: (item.isCurrent),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateEducation(idx, 'endDateEC', value)) });
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
    (__VLS_ctx.t('education.certificate') || 'Certificate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerCertificateInput(idx);
                // @ts-ignore
                [t, t, t, t, updateEducation, updateEducation, triggerCertificateInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (item.certificateFile ? (__VLS_ctx.t('common.change') || 'Change File') : (__VLS_ctx.t('common.select') || 'Select File'));
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
        (__VLS_ctx.t('education.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleCertificateSelect(idx, $event);
                // @ts-ignore
                [t, t, t, handleCertificateSelect,];
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
    (__VLS_ctx.t('education.certificateHint') || 'Select certificate (will be uploaded when you save the form)');
    // @ts-ignore
    [t, setFileInputRef,];
}
if (!__VLS_ctx.localEducation || __VLS_ctx.localEducation.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    (__VLS_ctx.t('education.emptyState') || 'No education records added. Click "Add Education" to add.');
}
// @ts-ignore
[t, localEducation, localEducation,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        education: {
            type: Array,
            default: () => []
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
