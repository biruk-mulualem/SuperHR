import { computed, ref, watch } from 'vue';
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue';
const props = defineProps({
    form: {
        type: Object,
        required: true
    },
    workExperience: {
        type: Array,
        default: () => []
    },
    errors: {
        type: Object,
        default: () => ({})
    },
    departments: {
        type: Array,
        default: () => []
    },
    positions: {
        type: Array,
        default: () => []
    },
    employees: {
        type: Array,
        default: () => []
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:form', 'update:workExperience', 'update:workDocument', 'file-selected']);
// Initialize localWorkExperience from props
const localWorkExperience = ref([...(props.workExperience || [])]);
// Store refs for file inputs
const workDocumentInputs = ref({});
// Flag to prevent recursive updates
let isUpdating = false;
// Watch for parent changes
watch(() => props.workExperience, (newVal) => {
    if (!isUpdating) {
        localWorkExperience.value = [...(newVal || [])];
    }
}, { deep: true });
const setWorkDocumentInputRef = (index, el) => {
    if (el) {
        workDocumentInputs.value[index] = el;
    }
};
// Add this watch to monitor form.hireDate changes
watch(() => props.form.hireDateEC, (newValue, oldValue) => {
    console.log('EmploymentForm - hireDateEC changed:', {
        oldValue: oldValue,
        newValue: newValue
    });
}, { immediate: true });
// Computed properties for allowance calculations
const basicSalaryAmount = computed(() => parseFloat(props.form.basicSalary) || 0);
const housingAllowanceAmount = computed(() => parseFloat(props.form.housingAllowance) || 0);
const positionAllowanceAmount = computed(() => parseFloat(props.form.positionAllowance) || 0);
const transportAllowanceAmount = computed(() => parseFloat(props.form.transportAllowance) || 0);
const mobileAllowanceAmount = computed(() => parseFloat(props.form.mobileAllowance) || 0);
const totalAllowances = computed(() => housingAllowanceAmount.value + positionAllowanceAmount.value + transportAllowanceAmount.value + mobileAllowanceAmount.value);
const grossPay = computed(() => basicSalaryAmount.value + totalAllowances.value);
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};
const updateBasicSalary = (event) => {
    const value = event.target.value;
    emit('update:form', { ...props.form, basicSalary: value });
};
const updateAllowance = (field, value) => {
    emit('update:form', { ...props.form, [field]: value });
};
// Work Experience methods - emit directly to parent
const addWorkExperience = () => {
    isUpdating = true;
    const newWorkExp = {
        position: '',
        companyName: '',
        companyTin: '',
        companyType: '',
        companyAddress: '',
        startDateEC: '', // Changed from startDate
        endDateEC: '', // Changed from endDate
        monthlySalary: null,
        salaryWhenLeft: null,
        providentFundSubmitted: '',
        providentFundStartDateEC: '',
        terminationReason: '',
        experienceLetterFile: null
    };
    const newArray = [...localWorkExperience.value, newWorkExp];
    localWorkExperience.value = newArray;
    emit('update:workExperience', newArray);
    isUpdating = false;
};
const updateWorkExperience = (index, field, value) => {
    isUpdating = true;
    const newArray = [...localWorkExperience.value];
    newArray[index][field] = value;
    localWorkExperience.value = newArray;
    emit('update:workExperience', newArray);
    isUpdating = false;
};
const removeWorkExperience = (index) => {
    isUpdating = true;
    const newArray = [...localWorkExperience.value];
    newArray.splice(index, 1);
    localWorkExperience.value = newArray;
    delete workDocumentInputs.value[index];
    emit('update:workExperience', newArray);
    isUpdating = false;
};
const triggerWorkDocumentInput = (index) => {
    if (workDocumentInputs.value[index]) {
        workDocumentInputs.value[index].click();
    }
};
const handleWorkDocumentSelect = (index, event) => {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
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
        const newArray = [...localWorkExperience.value];
        newArray[index].experienceLetterFile = file;
        localWorkExperience.value = newArray;
        emit('update:workDocument', { index, file });
        emit('update:workExperience', newArray);
        emit('file-selected', `${props.t('employee.document') || 'Document'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success');
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
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-header']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-header']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-header']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['gross']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['gross']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-header']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-body']} */ ;
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
(props.t('employee.employmentInfo') || 'Employment Details');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('employee.currentEmployment') || 'Current Employment');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.department') || 'Department');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:form', { ...__VLS_ctx.form, departmentId: $event.target.value ? parseInt($event.target.value) : null });
            // @ts-ignore
            [$emit, form,];
        } },
    value: (__VLS_ctx.form.departmentId),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
(props.t('common.select') || 'Select department');
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept.departmentId),
        value: (dept.departmentId),
    });
    (dept.name);
    // @ts-ignore
    [form, departments,];
}
if (__VLS_ctx.errors.departmentId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.departmentId);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.position') || 'Position');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:form', { ...__VLS_ctx.form, positionId: $event.target.value ? parseInt($event.target.value) : null });
            // @ts-ignore
            [$emit, form, errors, errors,];
        } },
    value: (__VLS_ctx.form.positionId),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
(props.t('common.select') || 'Select position');
for (const [pos] of __VLS_vFor((__VLS_ctx.positions))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (pos.positionId),
        value: (pos.positionId),
    });
    (pos.title);
    // @ts-ignore
    [form, positions,];
}
if (__VLS_ctx.errors.positionId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.positionId);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.manager') || 'Manager');
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:form', { ...__VLS_ctx.form, managerId: $event.target.value ? parseInt($event.target.value) : null });
            // @ts-ignore
            [$emit, form, errors, errors,];
        } },
    value: (__VLS_ctx.form.managerId),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
(props.t('common.select') || 'Select manager');
for (const [emp] of __VLS_vFor((__VLS_ctx.employees))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (emp.id),
        value: (emp.id),
    });
    (emp.fullName);
    // @ts-ignore
    [form, employees,];
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
(props.t('employee.workLocation') || 'Work Location');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:form', { ...__VLS_ctx.form, workLocation: $event.target.value });
            // @ts-ignore
            [$emit, form,];
        } },
    type: "text",
    value: (__VLS_ctx.form.workLocation),
    placeholder: (props.t('employee.workLocationPlaceholder') || 'Head Office, Addis Ababa'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.employmentType') || 'Employment Type');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:form', { ...__VLS_ctx.form, employmentType: $event.target.value });
            // @ts-ignore
            [$emit, form, form,];
        } },
    value: (__VLS_ctx.form.employmentType),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(props.t('common.select') || 'Select type');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "full-time",
});
(props.t('employee.fullTime') || 'Full Time');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "part-time",
});
(props.t('employee.partTime') || 'Part Time');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "contract",
});
(props.t('employee.contract') || 'Contract');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "intern",
});
(props.t('employee.intern') || 'Intern');
if (__VLS_ctx.errors.employmentType) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.employmentType);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.hireDate') || 'Hire Date');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
const __VLS_0 = EthiopianDateSelector;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.form.hireDateEC),
    error: (__VLS_ctx.errors.hireDateEC),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.form.hireDateEC),
    error: (__VLS_ctx.errors.hireDateEC),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': ((value) => __VLS_ctx.$emit('update:form', { ...__VLS_ctx.form, hireDateEC: value })) });
var __VLS_3;
var __VLS_4;
if (__VLS_ctx.errors.hireDate) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errors.hireDateEC);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "allowances-card" },
});
/** @type {__VLS_StyleScopedClasses['allowances-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "allowances-header" },
});
/** @type {__VLS_StyleScopedClasses['allowances-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "12",
    r: "10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 6v6l4 2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
(props.t('employee.compensationAllowances') || '💰 Compensation & Allowances');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(props.t('employee.basicSalaryAllowanceDesc') || 'Basic salary and allowance details');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "allowances-body" },
});
/** @type {__VLS_StyleScopedClasses['allowances-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "salary-field" },
});
/** @type {__VLS_StyleScopedClasses['salary-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.basicSalary') || 'Basic Salary (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.updateBasicSalary) },
    type: "number",
    value: (__VLS_ctx.form.basicSalary),
    placeholder: "0.00",
    step: "100",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
    ...{ class: "field-hint" },
});
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
(props.t('employee.basicSalaryHint') || 'Monthly basic salary before allowances');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "allowances-grid" },
});
/** @type {__VLS_StyleScopedClasses['allowances-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.housingAllowance') || 'Housing Allowance (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateAllowance('housingAllowance', $event.target.value);
            // @ts-ignore
            [$emit, form, form, form, form, errors, errors, errors, errors, errors, updateBasicSalary, updateAllowance,];
        } },
    type: "number",
    value: (__VLS_ctx.form.housingAllowance),
    placeholder: "0.00",
    step: "100",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.positionAllowance') || 'Position Allowance (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateAllowance('positionAllowance', $event.target.value);
            // @ts-ignore
            [form, updateAllowance,];
        } },
    type: "number",
    value: (__VLS_ctx.form.positionAllowance),
    placeholder: "0.00",
    step: "100",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.transportAllowance') || 'Transport Allowance (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateAllowance('transportAllowance', $event.target.value);
            // @ts-ignore
            [form, updateAllowance,];
        } },
    type: "number",
    value: (__VLS_ctx.form.transportAllowance),
    placeholder: "0.00",
    step: "100",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('employee.mobileAllowance') || 'Mobile Allowance (ETB)');
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateAllowance('mobileAllowance', $event.target.value);
            // @ts-ignore
            [form, updateAllowance,];
        } },
    type: "number",
    value: (__VLS_ctx.form.mobileAllowance),
    placeholder: "0.00",
    step: "100",
});
if (__VLS_ctx.totalAllowances > 0 || __VLS_ctx.basicSalaryAmount > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-title" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-title']} */ ;
    (props.t('employee.summary') || 'Summary');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.basicSalary') || 'Basic Salary:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.basicSalaryAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.housingAllowance') || 'Housing:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.housingAllowanceAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.positionAllowance') || 'Position:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.positionAllowanceAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.transportAllowance') || 'Transport:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.transportAllowanceAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.mobileAllowance') || 'Mobile:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.mobileAllowanceAmount));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item total" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['total']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.totalAllowances') || 'Total Allowances:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.totalAllowances));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item gross" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['gross']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.grossPay') || 'Gross Monthly Pay:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.grossPay));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "work-experience-section" },
});
/** @type {__VLS_StyleScopedClasses['work-experience-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('employee.workExperience') || 'Previous Work Experience');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addWorkExperience) },
    type: "button",
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
(props.t('common.add') || 'Add Experience');
for (const [item, idx] of __VLS_vFor((__VLS_ctx.localWorkExperience))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (idx),
        ...{ class: "work-card" },
    });
    /** @type {__VLS_StyleScopedClasses['work-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-header" },
    });
    /** @type {__VLS_StyleScopedClasses['item-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.t('employee.experience') || 'Experience');
    (idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeWorkExperience(idx);
                // @ts-ignore
                [form, totalAllowances, totalAllowances, basicSalaryAmount, basicSalaryAmount, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, housingAllowanceAmount, positionAllowanceAmount, transportAllowanceAmount, mobileAllowanceAmount, grossPay, addWorkExperience, localWorkExperience, removeWorkExperience,];
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
    (props.t('employee.positionTitle') || 'Position Title');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'position', $event.target.value);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        type: "text",
        value: (item.position),
        placeholder: (props.t('employee.positionPlaceholder') || 'e.g., Software Engineer'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.companyName') || 'Company Name');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'companyName', $event.target.value);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        type: "text",
        value: (item.companyName),
        placeholder: (props.t('employee.companyNamePlaceholder') || 'Company name'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.companyTin') || 'Company TIN Number');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'companyTin', $event.target.value);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        type: "text",
        value: (item.companyTin),
        placeholder: (props.t('employee.tinPlaceholder') || 'Tax Identification Number'),
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
    (props.t('employee.companyType') || 'Company Type');
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'companyType', $event.target.value);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        value: (item.companyType),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (props.t('common.select') || 'Select company type');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "government",
    });
    (props.t('employee.government') || 'Government');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "private",
    });
    (props.t('employee.private') || 'Private');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "military",
    });
    (props.t('employee.military') || 'Military');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "civil",
    });
    (props.t('employee.civil') || 'Civil');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "provident_fund",
    });
    (props.t('employee.providentFund') || 'Provident Fund');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "ngo",
    });
    (props.t('employee.ngo') || 'NGO');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "international",
    });
    (props.t('employee.international') || 'International Organization');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "other",
    });
    (props.t('employee.other') || 'Other');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.companyAddress') || 'Company Address');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'companyAddress', $event.target.value);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        type: "text",
        value: (item.companyAddress),
        placeholder: (props.t('employee.companyAddressPlaceholder') || 'Company address'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-three" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.startDate') || 'Start Date');
    const __VLS_7 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.startDateEC),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.startDateEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateWorkExperience(idx, 'startDateEC', value)) });
    var __VLS_10;
    var __VLS_11;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.endDate') || 'End Date');
    const __VLS_14 = EthiopianDateSelector;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.endDateEC),
    }));
    const __VLS_16 = __VLS_15({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (item.endDateEC),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    let __VLS_19;
    const __VLS_20 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateWorkExperience(idx, 'endDateEC', value)) });
    var __VLS_17;
    var __VLS_18;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.monthlySalary') || 'Monthly Salary (ETB)');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'monthlySalary', parseFloat($event.target.value) || 0);
                // @ts-ignore
                [updateWorkExperience, updateWorkExperience, updateWorkExperience,];
            } },
        type: "number",
        value: (item.monthlySalary),
        placeholder: "0.00",
        step: "100",
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
    (props.t('employee.salaryWhenLeft') || 'Salary When Left (ETB)');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'salaryWhenLeft', parseFloat($event.target.value) || 0);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        type: "number",
        value: (item.salaryWhenLeft),
        placeholder: "0.00",
        step: "100",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.providentFundSubmitted') || 'Provident Fund Submitted?');
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'providentFundSubmitted', $event.target.value);
                // @ts-ignore
                [updateWorkExperience,];
            } },
        value: (item.providentFundSubmitted),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (props.t('common.select') || 'Select');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "yes",
    });
    (props.t('common.yes') || 'Yes');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "no",
    });
    (props.t('common.no') || 'No');
    if (item.providentFundSubmitted === 'yes') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (props.t('employee.providentFundStartDate') || 'Provident Fund Starting From');
        const __VLS_21 = EthiopianDateSelector;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
            ...{ 'onUpdate:modelValue': {} },
            modelValue: (item.providentFundStartDateEC),
        }));
        const __VLS_23 = __VLS_22({
            ...{ 'onUpdate:modelValue': {} },
            modelValue: (item.providentFundStartDateEC),
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
        let __VLS_26;
        const __VLS_27 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': ((value) => __VLS_ctx.updateWorkExperience(idx, 'providentFundStartDateEC', value)) });
        var __VLS_24;
        var __VLS_25;
    }
    if (item.providentFundSubmitted !== 'yes') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row-full" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (props.t('employee.terminationReason') || 'Reason for Employment Termination');
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateWorkExperience(idx, 'terminationReason', $event.target.value);
                // @ts-ignore
                [updateWorkExperience, updateWorkExperience,];
            } },
        value: (item.terminationReason),
        rows: "2",
        placeholder: (props.t('employee.terminationPlaceholder') || 'e.g., Resignation, Contract ended, Layoff, Retirement, etc.'),
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
    (props.t('employee.experienceLetter') || 'Experience Letter/Contract');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['file-upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerWorkDocumentInput(idx);
                // @ts-ignore
                [triggerWorkDocumentInput,];
            } },
        type: "button",
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (item.experienceLetterFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File'));
    if (item.experienceLetterFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (item.experienceLetterFile.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name no-file" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-file']} */ ;
        (props.t('employee.noFileSelected') || 'No file selected');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleWorkDocumentSelect(idx, $event);
                // @ts-ignore
                [handleWorkDocumentSelect,];
            } },
        type: "file",
        ref: (el => __VLS_ctx.setWorkDocumentInputRef(idx, el)),
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    (props.t('employee.documentHint') || 'Select document (will be uploaded when you save the form)');
    // @ts-ignore
    [setWorkDocumentInputRef,];
}
if (!__VLS_ctx.localWorkExperience || __VLS_ctx.localWorkExperience.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    (props.t('employee.noWorkExperience') || 'No previous work experience added. Click "Add Experience" to add.');
}
// @ts-ignore
[localWorkExperience, localWorkExperience,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        form: {
            type: Object,
            required: true
        },
        workExperience: {
            type: Array,
            default: () => []
        },
        errors: {
            type: Object,
            default: () => ({})
        },
        departments: {
            type: Array,
            default: () => []
        },
        positions: {
            type: Array,
            default: () => []
        },
        employees: {
            type: Array,
            default: () => []
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
