import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import EthiopianDateSelector from "@/components/shared/EthiopianDateSelector.vue";
const { locale } = useI18n();
const currentLanguage = computed(() => locale.value);
const props = defineProps({
    form: { type: Object, default: () => ({}) },
    errors: { type: Object, default: () => ({}) },
    countries: { type: Array, default: () => [] },
    profilePreview: { type: String, default: "" },
    t: { type: Function, default: (key) => key },
});
const emit = defineEmits([
    "update:form",
    "uploadDocument",
    "update:profileFile",
    "update:profilePreview",
    "file-selected",
    "update:nationalIdFile",
]);
const profileInput = ref(null);
const idFileInput = ref(null);
const nationalIdFile = ref(null);
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_ID_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
];
const validateFileType = (file, allowedTypes, typeName) => {
    if (!allowedTypes.includes(file.type)) {
        emit("file-selected", `Invalid file type for ${typeName}. Allowed: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`, "error");
        return false;
    }
    return true;
};
const validateFileSize = (file, maxSizeMB, typeName) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
        emit("file-selected", `${typeName} size must be less than ${maxSizeMB}MB`, "error");
        return false;
    }
    return true;
};
const triggerProfileInput = () => profileInput.value?.click();
const handleProfileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        if (!validateFileType(file, ALLOWED_IMAGE_TYPES, "Profile picture") ||
            !validateFileSize(file, 2, "Profile picture")) {
            event.target.value = "";
            return;
        }
        emit("update:profileFile", file);
        const reader = new FileReader();
        reader.onload = (e) => emit("update:profilePreview", e.target.result);
        reader.readAsDataURL(file);
        emit("file-selected", `Profile picture "${file.name}" selected`, "success");
    }
};
const triggerIdFileInput = () => {
    idFileInput.value?.click();
};
const handleIdFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        if (!validateFileType(file, ALLOWED_ID_TYPES, "ID document") ||
            !validateFileSize(file, 5, "ID document")) {
            event.target.value = "";
            return;
        }
        nationalIdFile.value = file;
        emit("update:nationalIdFile", file);
        emit("file-selected", `ID document "${file.name}" selected - ready to save`, "success");
    }
};
const updateField = (field, value) => {
    emit("update:form", { ...props.form, [field]: value });
};
const updateBirthPlace = (field, value) => {
    const newBirthPlace = { ...(props.form.birthPlace || {}), [field]: value };
    emit("update:form", { ...props.form, birthPlace: newBirthPlace });
};
const updateCurrentAddress = (field, value) => {
    const newAddress = { ...(props.form.currentAddress || {}), [field]: value };
    emit("update:form", { ...props.form, currentAddress: newAddress });
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
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-full']} */ ;
/** @type {__VLS_StyleScopedClasses['id-upload-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['fields-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['required']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['id-upload-group']} */ ;
/** @type {__VLS_StyleScopedClasses['id-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['info-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['id-upload-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['fields-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['required']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['id-upload-group']} */ ;
/** @type {__VLS_StyleScopedClasses['id-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['info-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
/** @type {__VLS_StyleScopedClasses['id-upload-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
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
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "7",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.t("employee.basicInfo") || "Basic Information");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "two-column-layout" },
});
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-section" },
});
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.triggerProfileInput) },
    ...{ class: "profile-upload" },
});
/** @type {__VLS_StyleScopedClasses['profile-upload']} */ ;
if (__VLS_ctx.profilePreview) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "profile-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['profile-preview']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.profilePreview),
        alt: "Profile preview",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "profile-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['profile-overlay']} */ ;
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
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "profile-placeholder" },
    });
    /** @type {__VLS_StyleScopedClasses['profile-placeholder']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t("employee.clickToUpload") || "Click to upload photo");
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleProfileUpload) },
    type: "file",
    ref: "profileInput",
    accept: "image/jpeg,image/png",
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "fields-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['fields-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.firstName") || "First Name");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('firstName', $event.target.value);
            // @ts-ignore
            [t, t, t, triggerProfileInput, profilePreview, profilePreview, handleProfileUpload, updateField,];
        } },
    type: "text",
    value: (__VLS_ctx.form.firstName),
    placeholder: (__VLS_ctx.t('employee.firstName') || 'First name'),
});
if (__VLS_ctx.errors.firstName) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.firstName);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.lastName") || "Last Name");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('lastName', $event.target.value);
            // @ts-ignore
            [t, t, updateField, form, errors, errors,];
        } },
    type: "text",
    value: (__VLS_ctx.form.lastName),
    placeholder: (__VLS_ctx.t('employee.lastName') || 'Last name'),
});
if (__VLS_ctx.errors.lastName) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.lastName);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.middleName") || "Middle Name");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('middleName', $event.target.value);
            // @ts-ignore
            [t, t, updateField, form, errors, errors,];
        } },
    type: "text",
    value: (__VLS_ctx.form.middleName),
    placeholder: (__VLS_ctx.t('employee.middleName') || 'Middle name'),
});
if (__VLS_ctx.currentLanguage === 'am') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-full" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t("employee.fullNameEnglish") || "Full Name (English)");
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                if (!(__VLS_ctx.currentLanguage === 'am'))
                    return;
                __VLS_ctx.updateField('fullNameEnglish', $event.target.value);
                // @ts-ignore
                [t, t, updateField, form, currentLanguage,];
            } },
        type: "text",
        value: (__VLS_ctx.form.fullNameEnglish),
        placeholder: (__VLS_ctx.t('employee.fullNameEnglishPlaceholder') ||
            'Enter your full name in English characters'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (__VLS_ctx.t("employee.fullNameEnglishHint") ||
        "Please enter your full name in English (Latin) characters");
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
(__VLS_ctx.t("employee.gender") || "Gender");
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateField('gender', $event.target.value);
            // @ts-ignore
            [t, t, t, updateField, form,];
        } },
    value: (__VLS_ctx.form.gender),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t("common.select") || "Select");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "male",
});
(__VLS_ctx.t("employee.male") || "Male");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "female",
});
(__VLS_ctx.t("employee.female") || "Female");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "other",
});
(__VLS_ctx.t("employee.other") || "Other");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.maritalStatus") || "Marital Status");
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateField('maritalStatus', $event.target.value);
            // @ts-ignore
            [t, t, t, t, t, updateField, form,];
        } },
    value: (__VLS_ctx.form.maritalStatus),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t("common.select") || "Select");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "single",
});
(__VLS_ctx.t("employee.single") || "Single");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "married",
});
(__VLS_ctx.t("employee.married") || "Married");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "divorced",
});
(__VLS_ctx.t("employee.divorced") || "Divorced");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "widowed",
});
(__VLS_ctx.t("employee.widowed") || "Widowed");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.$t("employee.dateOfBirth"));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
const __VLS_0 = EthiopianDateSelector;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.form.dateOfBirthEC),
    error: (__VLS_ctx.errors.dateOfBirthEC),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.form.dateOfBirthEC),
    error: (__VLS_ctx.errors.dateOfBirthEC),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-two" },
});
/** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.nationality") || "Nationality");
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateField('nationality', $event.target.value);
            // @ts-ignore
            [t, t, t, t, t, t, updateField, form, form, errors, $t,];
        } },
    value: (__VLS_ctx.form.nationality),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t("common.select") || "Select nationality");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Ethiopian",
});
(__VLS_ctx.t("employee.nationalityEthiopian") || "Ethiopian");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Eritrean",
});
(__VLS_ctx.t("employee.nationalityEritrean") || "Eritrean");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Kenyan",
});
(__VLS_ctx.t("employee.nationalityKenyan") || "Kenyan");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Somali",
});
(__VLS_ctx.t("employee.nationalitySomali") || "Somali");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Sudanese",
});
(__VLS_ctx.t("employee.nationalitySudanese") || "Sudanese");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "American",
});
(__VLS_ctx.t("employee.nationalityAmerican") || "American");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Canadian",
});
(__VLS_ctx.t("employee.nationalityCanadian") || "Canadian");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Chinese",
});
(__VLS_ctx.t("employee.nationalityChinese") || "Chinese");
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Other",
});
(__VLS_ctx.t("employee.nationalityOther") || "Other");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.nationalId") || "National ID / FAN Number");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "id-upload-group" },
});
/** @type {__VLS_StyleScopedClasses['id-upload-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('nationalId', $event.target.value);
            // @ts-ignore
            [t, t, t, t, t, t, t, t, t, t, t, updateField, form,];
        } },
    type: "text",
    value: (__VLS_ctx.form.nationalId),
    placeholder: "e.g., FAN-1234567890",
    ...{ class: "id-input" },
});
/** @type {__VLS_StyleScopedClasses['id-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.triggerIdFileInput) },
    type: "button",
    ...{ class: "btn-upload" },
    ...{ class: ({ 'has-file': __VLS_ctx.nationalIdFile }) },
});
/** @type {__VLS_StyleScopedClasses['btn-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
(__VLS_ctx.nationalIdFile
    ? __VLS_ctx.nationalIdFile.name
    : "📎 " + (__VLS_ctx.t("common.upload") || "Select File"));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleIdFileSelect) },
    type: "file",
    ref: "idFileInput",
    accept: ".pdf,.jpg,.jpeg,.png",
    ...{ style: {} },
});
if (!__VLS_ctx.nationalIdFile) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (__VLS_ctx.t("employee.selectIdDocument") ||
        "Select scanned copy of National ID / FAN Card");
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint success" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    (__VLS_ctx.t("employee.fileSelected") || "File selected");
    (__VLS_ctx.nationalIdFile.name);
    (__VLS_ctx.t("employee.readyToSave") || "ready to save");
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-section" },
});
/** @type {__VLS_StyleScopedClasses['info-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
(__VLS_ctx.t("employee.birthPlace") || "Birth Place");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-four" },
});
/** @type {__VLS_StyleScopedClasses['form-row-four']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.region") || "Region");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateBirthPlace('region', $event.target.value);
            // @ts-ignore
            [t, t, t, t, t, t, form, triggerIdFileInput, nationalIdFile, nationalIdFile, nationalIdFile, nationalIdFile, nationalIdFile, handleIdFileSelect, updateBirthPlace,];
        } },
    type: "text",
    value: (__VLS_ctx.form.birthPlace?.region),
    placeholder: (__VLS_ctx.t('address.region') || 'Region'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.city") || "City");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateBirthPlace('city', $event.target.value);
            // @ts-ignore
            [t, t, form, updateBirthPlace,];
        } },
    type: "text",
    value: (__VLS_ctx.form.birthPlace?.city),
    placeholder: (__VLS_ctx.t('address.city') || 'City'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.subcity") || "Subcity");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateBirthPlace('subcity', $event.target.value);
            // @ts-ignore
            [t, t, form, updateBirthPlace,];
        } },
    type: "text",
    value: (__VLS_ctx.form.birthPlace?.subcity),
    placeholder: (__VLS_ctx.t('address.subcity') || 'Subcity'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.district") || "District");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateBirthPlace('district', $event.target.value);
            // @ts-ignore
            [t, t, form, updateBirthPlace,];
        } },
    type: "text",
    value: (__VLS_ctx.form.birthPlace?.district),
    placeholder: (__VLS_ctx.t('address.district') || 'District'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-section" },
});
/** @type {__VLS_StyleScopedClasses['info-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
(__VLS_ctx.t("address.currentAddress") || "Current Address");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.region") || "Region");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCurrentAddress('region', $event.target.value);
            // @ts-ignore
            [t, t, t, form, updateCurrentAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.form.currentAddress?.region),
    placeholder: (__VLS_ctx.t('address.region') || 'Region'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.subcity") || "Subcity");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCurrentAddress('subcity', $event.target.value);
            // @ts-ignore
            [t, t, form, updateCurrentAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.form.currentAddress?.subcity),
    placeholder: (__VLS_ctx.t('address.subcity') || 'Subcity'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.kebele") || "Kebele");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCurrentAddress('kebele', $event.target.value);
            // @ts-ignore
            [t, t, form, updateCurrentAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.form.currentAddress?.kebele),
    placeholder: (__VLS_ctx.t('address.kebele') || 'Kebele'),
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
(__VLS_ctx.t("address.district") || "District");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCurrentAddress('district', $event.target.value);
            // @ts-ignore
            [t, t, form, updateCurrentAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.form.currentAddress?.district),
    placeholder: (__VLS_ctx.t('address.district') || 'District/Woreda'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.poBox") || "PO Box");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCurrentAddress('poBox', $event.target.value);
            // @ts-ignore
            [t, t, form, updateCurrentAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.form.currentAddress?.poBox),
    placeholder: (__VLS_ctx.t('address.poBox') || 'PO Box'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("address.houseNumber") || "House Number");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCurrentAddress('houseNumber', $event.target.value);
            // @ts-ignore
            [t, t, form, updateCurrentAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.form.currentAddress?.houseNumber),
    placeholder: (__VLS_ctx.t('address.houseNumber') || 'House number'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-section" },
});
/** @type {__VLS_StyleScopedClasses['info-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
(__VLS_ctx.t("employee.contactInfo") || "Contact Information");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.workEmail") || "Email");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('email', $event.target.value);
            // @ts-ignore
            [t, t, t, updateField, form,];
        } },
    type: "email",
    value: (__VLS_ctx.form.email),
    placeholder: "employee@company.com",
});
if (__VLS_ctx.errors.email) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.email);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.personalEmail") || "Personal Email");
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('personalEmail', $event.target.value);
            // @ts-ignore
            [t, updateField, form, errors, errors,];
        } },
    type: "email",
    value: (__VLS_ctx.form.personalEmail),
    placeholder: "personal@email.com",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t("employee.phone") || "Phone Number");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateField('phone', $event.target.value);
            // @ts-ignore
            [t, updateField, form,];
        } },
    type: "tel",
    value: (__VLS_ctx.form.phone),
    placeholder: "+251 911 000 000",
});
if (__VLS_ctx.errors.phone) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.phone);
}
// @ts-ignore
[form, errors, errors,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        form: { type: Object, default: () => ({}) },
        errors: { type: Object, default: () => ({}) },
        countries: { type: Array, default: () => [] },
        profilePreview: { type: String, default: "" },
        t: { type: Function, default: (key) => key },
    },
});
export default {};
