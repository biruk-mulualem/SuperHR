const props = defineProps({
    currentCompany: {
        type: Object,
        default: () => ({
            companyName: 'SUPER DOUBLE T GENERAL TRADING PLC',
            companyTin: '000360429',
            companyPhone: '0113662218',
            companyEmail: 'supertt2012@gmail.com',
            companyAddress: 'Alemgena',
            poBox: '',
            website: 'rodaspaint.com'
        })
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:currentCompany']);
const updateCompany = (field, value) => {
    const newCompany = { ...props.currentCompany, [field]: value };
    emit('update:currentCompany', newCompany);
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
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
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
(props.t('company.title') || 'Current Company Information');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row-three" },
});
/** @type {__VLS_StyleScopedClasses['form-row-three']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('company.name') || 'Company Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('companyName', $event.target.value);
            // @ts-ignore
            [updateCompany,];
        } },
    type: "text",
    value: (__VLS_ctx.currentCompany.companyName),
    placeholder: (props.t('company.namePlaceholder') || 'Company name'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('company.tin') || 'Company TIN Number');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('companyTin', $event.target.value);
            // @ts-ignore
            [updateCompany, currentCompany,];
        } },
    type: "text",
    value: (__VLS_ctx.currentCompany.companyTin),
    placeholder: (props.t('company.tinPlaceholder') || 'Tax Identification Number'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('company.phone') || 'Company Phone Number');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('companyPhone', $event.target.value);
            // @ts-ignore
            [updateCompany, currentCompany,];
        } },
    type: "tel",
    value: (__VLS_ctx.currentCompany.companyPhone),
    placeholder: "+251 911 000 000",
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
(props.t('company.email') || 'Company Email');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('companyEmail', $event.target.value);
            // @ts-ignore
            [updateCompany, currentCompany,];
        } },
    type: "email",
    value: (__VLS_ctx.currentCompany.companyEmail),
    placeholder: "info@company.com",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('company.poBox') || 'PO Box');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('poBox', $event.target.value);
            // @ts-ignore
            [updateCompany, currentCompany,];
        } },
    type: "text",
    value: (__VLS_ctx.currentCompany.poBox),
    placeholder: (props.t('company.poBoxPlaceholder') || 'PO Box'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(props.t('company.website') || 'Website');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('website', $event.target.value);
            // @ts-ignore
            [updateCompany, currentCompany,];
        } },
    type: "text",
    value: (__VLS_ctx.currentCompany.website),
    placeholder: "www.company.com",
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
(props.t('company.address') || 'Company Address');
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.updateCompany('companyAddress', $event.target.value);
            // @ts-ignore
            [updateCompany, currentCompany,];
        } },
    value: (__VLS_ctx.currentCompany.companyAddress),
    rows: "3",
    placeholder: (props.t('company.addressPlaceholder') || 'Company physical address'),
});
// @ts-ignore
[currentCompany,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        currentCompany: {
            type: Object,
            default: () => ({
                companyName: 'SUPER DOUBLE T GENERAL TRADING PLC',
                companyTin: '000360429',
                companyPhone: '0113662218',
                companyEmail: 'supertt2012@gmail.com',
                companyAddress: 'Alemgena',
                poBox: '',
                website: 'rodaspaint.com'
            })
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
