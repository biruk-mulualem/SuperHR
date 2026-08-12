const props = defineProps({
    emergency: {
        type: Object,
        default: () => ({ name: '', relationship: '', phone: '', alternatePhone: '' })
    },
    emergencyAddress: {
        type: Object,
        default: () => ({ city: '', subcity: '', district: '', kebele: '' })
    },
    bank: {
        type: Object,
        default: () => ({ bankName: '', accountNumber: '', accountHolderName: '', branch: '' })
    },
    ethiopianBanks: {
        type: Array,
        default: () => []
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:emergency', 'update:emergencyAddress', 'update:bank']);
const __VLS_ctx = {
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
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
    d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M13.73 21a2 2 0 0 1-3.46 0",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.t('family.emergencyContact') || 'Emergency Contact');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "optional-badge" },
});
/** @type {__VLS_StyleScopedClasses['optional-badge']} */ ;
(__VLS_ctx.t('common.optional') || 'Optional');
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
(__VLS_ctx.t('family.contactName') || 'Contact Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergency', { ...__VLS_ctx.emergency, name: $event.target.value });
            // @ts-ignore
            [t, t, t, $emit, emergency,];
        } },
    type: "text",
    value: (__VLS_ctx.emergency?.name),
    placeholder: (__VLS_ctx.t('family.contactNamePlaceholder') || 'Emergency contact name'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('family.relationship') || 'Relationship');
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:emergency', { ...__VLS_ctx.emergency, relationship: $event.target.value });
            // @ts-ignore
            [t, t, $emit, emergency, emergency,];
        } },
    value: (__VLS_ctx.emergency?.relationship),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t('common.select') || 'Select relationship');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Spouse",
});
(__VLS_ctx.t('family.spouse') || 'Spouse');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Parent",
});
(__VLS_ctx.t('family.parent') || 'Parent');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Child",
});
(__VLS_ctx.t('family.child') || 'Child');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Sibling",
});
(__VLS_ctx.t('family.sibling') || 'Sibling');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Relative",
});
(__VLS_ctx.t('family.relative') || 'Relative');
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Friend",
});
(__VLS_ctx.t('family.friend') || 'Friend');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('family.phoneNumber') || 'Phone Number');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergency', { ...__VLS_ctx.emergency, phone: $event.target.value });
            // @ts-ignore
            [t, t, t, t, t, t, t, t, $emit, emergency, emergency,];
        } },
    type: "tel",
    value: (__VLS_ctx.emergency?.phone),
    placeholder: "+251 912 000 000",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('family.alternatePhone') || 'Alternative Phone');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergency', { ...__VLS_ctx.emergency, alternatePhone: $event.target.value });
            // @ts-ignore
            [t, $emit, emergency, emergency,];
        } },
    type: "tel",
    value: (__VLS_ctx.emergency?.alternatePhone),
    placeholder: (__VLS_ctx.t('family.alternatePhonePlaceholder') || 'Alternative contact'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "address-section" },
});
/** @type {__VLS_StyleScopedClasses['address-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
(__VLS_ctx.t('family.emergencyAddress') || 'Emergency Contact Address');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('address.city') || 'City');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergencyAddress', { ...__VLS_ctx.emergencyAddress, city: $event.target.value });
            // @ts-ignore
            [t, t, t, $emit, emergency, emergencyAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.emergencyAddress?.city),
    placeholder: (__VLS_ctx.t('address.city') || 'City'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('address.subcity') || 'Subcity');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergencyAddress', { ...__VLS_ctx.emergencyAddress, subcity: $event.target.value });
            // @ts-ignore
            [t, t, $emit, emergencyAddress, emergencyAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.emergencyAddress?.subcity),
    placeholder: (__VLS_ctx.t('address.subcity') || 'Subcity'),
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
(__VLS_ctx.t('address.district') || 'District');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergencyAddress', { ...__VLS_ctx.emergencyAddress, district: $event.target.value });
            // @ts-ignore
            [t, t, $emit, emergencyAddress, emergencyAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.emergencyAddress?.district),
    placeholder: (__VLS_ctx.t('address.district') || 'District'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('address.kebele') || 'Kebele');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:emergencyAddress', { ...__VLS_ctx.emergencyAddress, kebele: $event.target.value });
            // @ts-ignore
            [t, t, $emit, emergencyAddress, emergencyAddress,];
        } },
    type: "text",
    value: (__VLS_ctx.emergencyAddress?.kebele),
    placeholder: (__VLS_ctx.t('address.kebele') || 'Kebele'),
});
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
    d: "M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.t('bank.title') || 'Bank Account');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "optional-badge" },
});
/** @type {__VLS_StyleScopedClasses['optional-badge']} */ ;
(__VLS_ctx.t('common.optional') || 'Optional');
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
(__VLS_ctx.t('bank.bankName') || 'Bank Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('update:bank', { ...__VLS_ctx.bank, bankName: $event.target.value });
            // @ts-ignore
            [t, t, t, t, $emit, emergencyAddress, bank,];
        } },
    value: (__VLS_ctx.bank?.bankName),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t('common.selectBank') || 'Select bank');
for (const [bankOption] of __VLS_vFor((__VLS_ctx.ethiopianBanks))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (bankOption.code),
        value: (bankOption.name),
    });
    (bankOption.name);
    // @ts-ignore
    [t, bank, ethiopianBanks,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('bank.accountNumber') || 'Account Number');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:bank', { ...__VLS_ctx.bank, accountNumber: $event.target.value });
            // @ts-ignore
            [t, $emit, bank,];
        } },
    type: "text",
    value: (__VLS_ctx.bank?.accountNumber),
    placeholder: "1000xxxxxxxx",
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
(__VLS_ctx.t('bank.accountHolderName') || 'Account Holder Name');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:bank', { ...__VLS_ctx.bank, accountHolderName: $event.target.value });
            // @ts-ignore
            [t, $emit, bank, bank,];
        } },
    type: "text",
    value: (__VLS_ctx.bank?.accountHolderName),
    placeholder: (__VLS_ctx.t('bank.accountHolderPlaceholder') || 'Name on account'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('bank.branch') || 'Branch');
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:bank', { ...__VLS_ctx.bank, branch: $event.target.value });
            // @ts-ignore
            [t, t, $emit, bank, bank,];
        } },
    type: "text",
    value: (__VLS_ctx.bank?.branch),
    placeholder: (__VLS_ctx.t('bank.branchPlaceholder') || 'Branch name'),
});
// @ts-ignore
[t, bank,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        emergency: {
            type: Object,
            default: () => ({ name: '', relationship: '', phone: '', alternatePhone: '' })
        },
        emergencyAddress: {
            type: Object,
            default: () => ({ city: '', subcity: '', district: '', kebele: '' })
        },
        bank: {
            type: Object,
            default: () => ({ bankName: '', accountNumber: '', accountHolderName: '', branch: '' })
        },
        ethiopianBanks: {
            type: Array,
            default: () => []
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
