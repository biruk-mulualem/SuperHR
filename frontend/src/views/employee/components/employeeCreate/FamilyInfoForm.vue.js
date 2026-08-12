import { ref, watch } from 'vue';
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue';
const props = defineProps({
    spouseInfo: {
        type: Object,
        default: () => ({})
    },
    children: {
        type: Array,
        default: () => []
    },
    parentsInfo: {
        type: Object,
        default: () => ({
            father: { fullName: '', monthlyIncome: null, job: '' },
            mother: { fullName: '', monthlyIncome: null, job: '' },
            financialSupport: '',
            otherSupport: ''
        })
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:spouseInfo', 'update:children', 'update:parentsInfo', 'file-selected']);
// Local reactive copy of children
const localChildren = ref([...(props.children || [])]);
// Flag to prevent recursive updates
let isUpdating = false;
// Watch for changes from parent - only update if not from local
watch(() => props.children, (newVal) => {
    if (!isUpdating) {
        localChildren.value = [...(newVal || [])];
    }
}, { deep: true });
// Refs for file inputs
const spouseProfileInput = ref(null);
const marriageCertificateInput = ref(null);
const childDocumentRefs = ref({});
const childProfileRefs = ref({});
// Helper function to calculate age
// Update the calculateAge function to handle Ethiopian dates
const calculateAge = (dateOfBirthEC) => {
    if (!dateOfBirthEC)
        return null;
    // Parse Ethiopian date (DD/MM/YYYY)
    const parts = dateOfBirthEC.split('/');
    if (parts.length !== 3)
        return null;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2]);
    // Create a date object (this is approximate - for age warnings only)
    // For accurate age, you'd need to convert EC to GC first
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
// Update spouse info - emits directly, no watch needed
const updateSpouse = (field, value) => {
    const newSpouse = { ...props.spouseInfo, [field]: value };
    emit('update:spouseInfo', newSpouse);
};
// Spouse file handlers
const triggerSpouseProfileInput = () => {
    spouseProfileInput.value?.click();
};
const handleSpouseProfileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            emit('file-selected', props.t('validation.invalidFileType') || 'Invalid file type. Allowed: JPG, PNG', 'error');
            event.target.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            emit('file-selected', props.t('validation.fileTooLarge') || 'File size must be less than 2MB', 'error');
            event.target.value = '';
            return;
        }
        const newSpouse = { ...props.spouseInfo, profilePictureFile: file };
        emit('update:spouseInfo', newSpouse);
        emit('file-selected', `${props.t('family.profilePicture') || 'Profile picture'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
    }
};
const triggerMarriageCertificateInput = () => {
    marriageCertificateInput.value?.click();
};
const handleMarriageCertificateSelect = (event) => {
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
        const newSpouse = { ...props.spouseInfo, marriageCertificateFile: file };
        emit('update:spouseInfo', newSpouse);
        emit('file-selected', `${props.t('family.marriageCertificate') || 'Marriage certificate'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
    }
};
// Child management - emit directly to parent
const addChild = () => {
    isUpdating = true;
    const newChildren = [...localChildren.value, {
            name: '',
            dateOfBirthEC: '', // Changed from dateOfBirth
            hasMedicalCondition: false,
            medicalConditionNotes: '',
            isAdopted: false,
            ageWarning: null,
            birthCertificateFile: null,
            medicalReportFile: null,
            adoptionCertificateFile: null,
            profilePictureFile: null
        }];
    localChildren.value = newChildren;
    emit('update:children', newChildren);
    isUpdating = false;
};
const updateChild = (index, field, value) => {
    isUpdating = true;
    const newChildren = [...localChildren.value];
    newChildren[index] = { ...newChildren[index], [field]: value };
    if (field === 'dateOfBirth' || field === 'hasMedicalCondition') {
        const age = calculateAge(newChildren[index].dateOfBirth);
        const hasDisability = newChildren[index].hasMedicalCondition;
        let warning = null;
        if (age !== null) {
            if (hasDisability) {
                if (age >= 21) {
                    warning = props.t('family.warningAgeDisabilityOver21') || `Child is ${age} years old. With disability, maximum age for dependent is 21 years.`;
                }
                else if (age >= 18) {
                    warning = props.t('family.warningAgeDisability18to21') || `Child is ${age} years old (with disability). Eligible up to 21 years.`;
                }
            }
            else {
                if (age >= 18) {
                    warning = props.t('family.warningAgeOver18') || `Child is ${age} years old. Without disability, maximum age for dependent is 18 years.`;
                }
                else if (age >= 16) {
                    warning = props.t('family.warningAge16to18') || `Child is ${age} years old. Will age out of dependent status soon.`;
                }
            }
        }
        newChildren[index].ageWarning = warning;
    }
    // If medical condition is unchecked, clear medical report file
    if (field === 'hasMedicalCondition' && value === false) {
        newChildren[index].medicalReportFile = null;
    }
    localChildren.value = newChildren;
    emit('update:children', newChildren);
    isUpdating = false;
};
const removeChild = (index) => {
    isUpdating = true;
    const newChildren = [...localChildren.value];
    newChildren.splice(index, 1);
    localChildren.value = newChildren;
    emit('update:children', newChildren);
    isUpdating = false;
};
// Child document handlers
const setChildDocumentRef = (index, type, el) => {
    if (!childDocumentRefs.value[index])
        childDocumentRefs.value[index] = {};
    if (el)
        childDocumentRefs.value[index][type] = el;
};
const triggerChildDocumentInput = (index, type) => {
    if (childDocumentRefs.value[index]?.[type]) {
        childDocumentRefs.value[index][type].click();
    }
};
const handleChildDocumentSelect = (index, type, event) => {
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
        const newChildren = [...localChildren.value];
        const fieldMap = {
            birthCertificate: 'birthCertificateFile',
            medicalReport: 'medicalReportFile',
            adoptionCertificate: 'adoptionCertificateFile'
        };
        newChildren[index][fieldMap[type]] = file;
        localChildren.value = newChildren;
        emit('update:children', newChildren);
        emit('file-selected', `${props.t('family.document') || 'Document'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
        isUpdating = false;
    }
};
// Child profile picture handlers
const setChildProfileRef = (index, el) => {
    if (el)
        childProfileRefs.value[index] = el;
};
const triggerChildProfileInput = (index) => {
    if (childProfileRefs.value[index]) {
        childProfileRefs.value[index].click();
    }
};
const handleChildProfileSelect = (index, event) => {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            emit('file-selected', props.t('validation.invalidFileType') || 'Invalid file type. Allowed: JPG, PNG', 'error');
            event.target.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            emit('file-selected', props.t('validation.fileTooLarge') || 'File size must be less than 2MB', 'error');
            event.target.value = '';
            return;
        }
        isUpdating = true;
        const newChildren = [...localChildren.value];
        newChildren[index].profilePictureFile = file;
        localChildren.value = newChildren;
        emit('update:children', newChildren);
        emit('file-selected', `${props.t('family.childProfilePicture') || 'Child profile picture'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
        isUpdating = false;
    }
};
// Parents Information - emits directly, no watch needed
const updateParent = (parent, field, value) => {
    const newParentsInfo = {
        ...props.parentsInfo,
        [parent]: { ...props.parentsInfo[parent], [field]: value }
    };
    emit('update:parentsInfo', newParentsInfo);
};
const updateParentsInfo = (field, value) => {
    const newParentsInfo = { ...props.parentsInfo, [field]: value };
    emit('update:parentsInfo', newParentsInfo);
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
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width-message']} */ ;
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
(props.t('family.title') || 'Family Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('family.spouseTitle') || 'Spouse Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.tinNumber') || 'TIN Number');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateSpouse('tinNumber', $event.target.value);
            // @ts-ignore
            [updateSpouse,];
        } },
    type: "text",
    value: (__VLS_ctx.spouseInfo.tinNumber),
    placeholder: (props.t('family.tinPlaceholder') || 'Tax Identification Number'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.spouseFullName') || 'Spouse Full Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateSpouse('fullName', $event.target.value);
            // @ts-ignore
            [updateSpouse, spouseInfo,];
        } },
    type: "text",
    value: (__VLS_ctx.spouseInfo.fullName),
    placeholder: (props.t('family.spouseNamePlaceholder') || 'Spouse full name'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.dateOfBirth') || 'Date of Birth');
const __VLS_0 = EthiopianDateSelector;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.spouseInfo.dateOfBirthEC),
    error: (__VLS_ctx.errors?.spouseDateOfBirthEC),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.spouseInfo.dateOfBirthEC),
    error: (__VLS_ctx.errors?.spouseDateOfBirthEC),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateSpouse('dateOfBirthEC', value)) });
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.jobStatus') || 'Job Status');
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateSpouse('jobStatus', $event.target.value);
            // @ts-ignore
            [updateSpouse, updateSpouse, spouseInfo, spouseInfo, errors,];
        } },
    value: (__VLS_ctx.spouseInfo.jobStatus),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(props.t('common.select') || 'Select');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "government",
});
(props.t('family.government') || 'Government');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "private",
});
(props.t('family.private') || 'Private Company');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "unemployed",
});
(props.t('family.unemployed') || 'Unemployed');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "business",
});
(props.t('family.business') || 'Own Business');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "other",
});
(props.t('family.other') || 'Other');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.companyName') || 'Company Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateSpouse('companyName', $event.target.value);
            // @ts-ignore
            [updateSpouse, spouseInfo,];
        } },
    value: (__VLS_ctx.spouseInfo.companyName),
    placeholder: (props.t('company.namePlaceholder') || 'Company name'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.companyAddress') || 'Company Address');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateSpouse('companyAddress', $event.target.value);
            // @ts-ignore
            [updateSpouse, spouseInfo,];
        } },
    type: "text",
    value: (__VLS_ctx.spouseInfo.companyAddress),
    placeholder: (props.t('company.addressPlaceholder') || 'Company address'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.profilePicture') || 'Profile Picture');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "file-upload-row" },
});
/** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.triggerSpouseProfileInput) },
    type: "button",
    ...{ class: "btn-small" },
});
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
(__VLS_ctx.spouseInfo.profilePictureFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
if (__VLS_ctx.spouseInfo.profilePictureFile) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    (__VLS_ctx.spouseInfo.profilePictureFile.name);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name no-file" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
    (props.t('family.noFileSelected') || 'No file selected');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleSpouseProfileSelect) },
    type: "file",
    ref: "spouseProfileInput",
    accept: "image/jpeg,image/jpg,image/png",
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
    ...{ class: "field-hint" },
});
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
(props.t('family.profileHint') || 'Select photo (will be uploaded on save)');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.marriageCertificate') || 'Marriage Certificate');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "file-upload-row" },
});
/** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.triggerMarriageCertificateInput) },
    type: "button",
    ...{ class: "btn-small" },
});
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
(__VLS_ctx.spouseInfo.marriageCertificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
if (__VLS_ctx.spouseInfo.marriageCertificateFile) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    (__VLS_ctx.spouseInfo.marriageCertificateFile.name);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name no-file" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
    (props.t('family.noFileSelected') || 'No file selected');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleMarriageCertificateSelect) },
    type: "file",
    ref: "marriageCertificateInput",
    accept: ".pdf,.jpg,.jpeg,.png",
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
    ...{ class: "field-hint" },
});
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
(props.t('family.certificateHint') || 'Select certificate (will be uploaded on save)');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('family.childrenTitle') || 'Children');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addChild) },
    type: "button",
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
(props.t('common.add') || 'Add Child');
for (const [child, idx] of __VLS_vFor((__VLS_ctx.localChildren))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (idx),
        ...{ class: "child-card" },
    });
    /** @type {__VLS_StyleScopedClasses['child-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "child-header" },
    });
    /** @type {__VLS_StyleScopedClasses['child-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('family.child') || 'Child');
    (idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeChild(idx);
                // @ts-ignore
                [spouseInfo, spouseInfo, spouseInfo, spouseInfo, spouseInfo, spouseInfo, spouseInfo, triggerSpouseProfileInput, handleSpouseProfileSelect, triggerMarriageCertificateInput, handleMarriageCertificateSelect, addChild, localChildren, removeChild,];
            } },
        type: "button",
        ...{ class: "btn-remove" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-remove']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-three" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('family.childFullName') || "Child's Full Name");
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateChild(idx, 'name', $event.target.value);
                // @ts-ignore
                [updateChild,];
            } },
        type: "text",
        value: (child.name),
        placeholder: (props.t('family.childNamePlaceholder') || 'Child\'s name'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('family.dateOfBirth') || 'Date of Birth');
    const __VLS_7 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (child.dateOfBirthEC),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (child.dateOfBirthEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateChild(idx, 'dateOfBirthEC', value)) });
    var __VLS_10;
    var __VLS_11;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    if (child.ageWarning) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "warning-message full-width-message" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-message']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width-message']} */ ;
        (child.ageWarning);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-three" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
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
                __VLS_ctx.updateChild(idx, 'hasMedicalCondition', $event.target.checked);
                // @ts-ignore
                [updateChild, updateChild,];
            } },
        type: "checkbox",
        checked: (child.hasMedicalCondition),
    });
    (props.t('family.hasMedicalCondition') || 'Has Medical Condition / Disability');
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
                __VLS_ctx.updateChild(idx, 'isAdopted', $event.target.checked);
                // @ts-ignore
                [updateChild,];
            } },
        type: "checkbox",
        checked: (child.isAdopted),
    });
    (props.t('family.isAdopted') || 'Is Adopted');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    if (child.hasMedicalCondition) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row-full" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (props.t('family.medicalConditionNotes') || 'Medical Condition Notes');
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            ...{ onInput: (...[$event]) => {
                    if (!(child.hasMedicalCondition))
                        return;
                    __VLS_ctx.updateChild(idx, 'medicalConditionNotes', $event.target.value);
                    // @ts-ignore
                    [updateChild,];
                } },
            value: (child.medicalConditionNotes),
            rows: "2",
            placeholder: (props.t('family.medicalNotesPlaceholder') || 'Describe medical condition or disability'),
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-three" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('family.birthCertificate') || 'Birth Certificate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerChildDocumentInput(idx, 'birthCertificate');
                // @ts-ignore
                [triggerChildDocumentInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (child.birthCertificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (child.birthCertificateFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (child.birthCertificateFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('family.noFile') || 'No file');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleChildDocumentSelect(idx, 'birthCertificate', $event);
                // @ts-ignore
                [handleChildDocumentSelect,];
            } },
        type: "file",
        ref: (el => __VLS_ctx.setChildDocumentRef(idx, 'birthCertificate', el)),
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    if (child.hasMedicalCondition) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (props.t('family.medicalReport') || 'Medical Report');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-upload-row" },
        });
        /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(child.hasMedicalCondition))
                        return;
                    __VLS_ctx.triggerChildDocumentInput(idx, 'medicalReport');
                    // @ts-ignore
                    [triggerChildDocumentInput, setChildDocumentRef,];
                } },
            type: "button",
            ...{ class: "btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (child.medicalReportFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
        if (child.medicalReportFile) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            (child.medicalReportFile.name);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name no-file" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
            (props.t('family.noFile') || 'No file');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(child.hasMedicalCondition))
                        return;
                    __VLS_ctx.handleChildDocumentSelect(idx, 'medicalReport', $event);
                    // @ts-ignore
                    [handleChildDocumentSelect,];
                } },
            type: "file",
            ref: (el => __VLS_ctx.setChildDocumentRef(idx, 'medicalReport', el)),
            accept: ".pdf,.jpg,.jpeg,.png",
            ...{ style: {} },
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    }
    if (child.isAdopted) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (props.t('family.adoptionCertificate') || 'Adoption Certificate');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-upload-row" },
        });
        /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(child.isAdopted))
                        return;
                    __VLS_ctx.triggerChildDocumentInput(idx, 'adoptionCertificate');
                    // @ts-ignore
                    [triggerChildDocumentInput, setChildDocumentRef,];
                } },
            type: "button",
            ...{ class: "btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (child.adoptionCertificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
        if (child.adoptionCertificateFile) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            (child.adoptionCertificateFile.name);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name no-file" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
            (props.t('family.noFile') || 'No file');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(child.isAdopted))
                        return;
                    __VLS_ctx.handleChildDocumentSelect(idx, 'adoptionCertificate', $event);
                    // @ts-ignore
                    [handleChildDocumentSelect,];
                } },
            type: "file",
            ref: (el => __VLS_ctx.setChildDocumentRef(idx, 'adoptionCertificate', el)),
            accept: ".pdf,.jpg,.jpeg,.png",
            ...{ style: {} },
        });
    }
    if (!child.isAdopted) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-three" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('family.childProfilePicture') || "Child's Profile Picture");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerChildProfileInput(idx);
                // @ts-ignore
                [setChildDocumentRef, triggerChildProfileInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (child.profilePictureFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (child.profilePictureFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (child.profilePictureFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('family.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleChildProfileSelect(idx, $event);
                // @ts-ignore
                [handleChildProfileSelect,];
            } },
        type: "file",
        ref: (el => __VLS_ctx.setChildProfileRef(idx, el)),
        accept: "image/jpeg,image/jpg,image/png",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    // @ts-ignore
    [setChildProfileRef,];
}
if (__VLS_ctx.localChildren.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    (props.t('family.noChildrenAdded') || 'No children added. Click "Add Child" to add.');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('family.parentsTitle') || 'Parents Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "parent-card" },
});
/** @type {__VLS_StyleScopedClasses['parent-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "parent-header" },
});
/** @type {__VLS_StyleScopedClasses['parent-header']} */ ;
(props.t('family.fatherInfo') || "Father's Information");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.fullName') || 'Full Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParent('father', 'fullName', $event.target.value);
            // @ts-ignore
            [localChildren, updateParent,];
        } },
    type: "text",
    value: (__VLS_ctx.parentsInfo.father?.fullName),
    placeholder: (props.t('family.fatherNamePlaceholder') || 'Father\'s full name'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.monthlyIncome') || 'Monthly Income (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParent('father', 'monthlyIncome', parseFloat($event.target.value));
            // @ts-ignore
            [updateParent, parentsInfo,];
        } },
    type: "number",
    value: (__VLS_ctx.parentsInfo.father?.monthlyIncome),
    placeholder: "0.00",
    step: "100",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.jobOccupation') || 'Job / Occupation');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParent('father', 'job', $event.target.value);
            // @ts-ignore
            [updateParent, parentsInfo,];
        } },
    type: "text",
    value: (__VLS_ctx.parentsInfo.father?.job),
    placeholder: (props.t('family.jobPlaceholder') || 'e.g., Government Employee, Farmer'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "parent-card" },
});
/** @type {__VLS_StyleScopedClasses['parent-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "parent-header" },
});
/** @type {__VLS_StyleScopedClasses['parent-header']} */ ;
(props.t('family.motherInfo') || "Mother's Information");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.fullName') || 'Full Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParent('mother', 'fullName', $event.target.value);
            // @ts-ignore
            [updateParent, parentsInfo,];
        } },
    type: "text",
    value: (__VLS_ctx.parentsInfo.mother?.fullName),
    placeholder: (props.t('family.motherNamePlaceholder') || 'Mother\'s full name'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.monthlyIncome') || 'Monthly Income (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParent('mother', 'monthlyIncome', parseFloat($event.target.value));
            // @ts-ignore
            [updateParent, parentsInfo,];
        } },
    type: "number",
    value: (__VLS_ctx.parentsInfo.mother?.monthlyIncome),
    placeholder: "0.00",
    step: "100",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.jobOccupation') || 'Job / Occupation');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParent('mother', 'job', $event.target.value);
            // @ts-ignore
            [updateParent, parentsInfo,];
        } },
    type: "text",
    value: (__VLS_ctx.parentsInfo.mother?.job),
    placeholder: (props.t('family.jobPlaceholder') || 'e.g., Government Employee, Housewife'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "support-section" },
});
/** @type {__VLS_StyleScopedClasses['support-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
(props.t('family.supportTitle') || 'Support Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-full" },
});
/** @type {__VLS_StyleScopedClasses['form-row-full']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.financialSupport') || 'Financial Support (Money)');
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParentsInfo('financialSupport', $event.target.value);
            // @ts-ignore
            [parentsInfo, updateParentsInfo,];
        } },
    value: (__VLS_ctx.parentsInfo.financialSupport),
    rows: "2",
    placeholder: (props.t('family.financialPlaceholder') || 'Describe any financial support provided to parents (amount, frequency, etc.)'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-full" },
});
/** @type {__VLS_StyleScopedClasses['form-row-full']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('family.otherSupport') || 'Other Support');
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateParentsInfo('otherSupport', $event.target.value);
            // @ts-ignore
            [parentsInfo, updateParentsInfo,];
        } },
    value: (__VLS_ctx.parentsInfo.otherSupport),
    rows: "2",
    placeholder: (props.t('family.otherPlaceholder') || 'Describe any other support provided (medical, housing, etc.)'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-note" },
});
/** @type {__VLS_StyleScopedClasses['info-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
(props.t('family.ageNote') || 'Note: Children under 18 years old are eligible as dependents. Children with disabilities under 21 years old may also be eligible.');
// @ts-ignore
[parentsInfo,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        spouseInfo: {
            type: Object,
            default: () => ({})
        },
        children: {
            type: Array,
            default: () => []
        },
        parentsInfo: {
            type: Object,
            default: () => ({
                father: { fullName: '', monthlyIncome: null, job: '' },
                mother: { fullName: '', monthlyIncome: null, job: '' },
                financialSupport: '',
                otherSupport: ''
            })
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
