import { ref, computed, watch } from 'vue';
import Kenat from 'kenat';
import { useI18n } from 'vue-i18n';
const props = defineProps({
    modelValue: { type: String, default: '' },
    error: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);
const { locale } = useI18n();
const selectedDay = ref('');
const selectedMonth = ref('');
const selectedYear = ref('');
const gregorianHint = ref('');
const isInternalUpdate = ref(false);
// Ethiopian months with proper names
const ethiopianMonths = {
    en: [
        { value: 1, name: 'Meskerem' },
        { value: 2, name: 'Tikimt' },
        { value: 3, name: 'Hidar' },
        { value: 4, name: 'Tahsas' },
        { value: 5, name: 'Tir' },
        { value: 6, name: 'Yekatit' },
        { value: 7, name: 'Megabit' },
        { value: 8, name: 'Miazia' },
        { value: 9, name: 'Ginbot' },
        { value: 10, name: 'Sene' },
        { value: 11, name: 'Hamle' },
        { value: 12, name: 'Nehase' },
        { value: 13, name: 'Pagume' }
    ],
    am: [
        { value: 1, name: 'መስከረም' },
        { value: 2, name: 'ጥቅምት' },
        { value: 3, name: 'ህዳር' },
        { value: 4, name: 'ታህሳስ' },
        { value: 5, name: 'ጥር' },
        { value: 6, name: 'የካቲት' },
        { value: 7, name: 'መጋቢት' },
        { value: 8, name: 'ሚያዚያ' },
        { value: 9, name: 'ግንቦት' },
        { value: 10, name: 'ሰኔ' },
        { value: 11, name: 'ሐምሌ' },
        { value: 12, name: 'ነሃሴ' },
        { value: 13, name: 'ጳጉሜ' }
    ]
};
const currentMonths = computed(() => {
    return ethiopianMonths[locale.value] || ethiopianMonths.en;
});
const yearRange = computed(() => {
    const currentYear = new Kenat().getEthiopian().year;
    const years = [];
    for (let i = currentYear - 60; i <= currentYear + 18; i++) {
        years.push(i);
    }
    return years;
});
const maxDays = computed(() => {
    if (!selectedMonth.value || !selectedYear.value)
        return 30;
    const month = parseInt(selectedMonth.value);
    const year = parseInt(selectedYear.value);
    if (month === 13) {
        return year % 4 === 0 ? 6 : 5;
    }
    return 30;
});
const onMonthChange = () => {
    if (selectedDay.value && parseInt(selectedDay.value) > maxDays.value) {
        selectedDay.value = '';
    }
    emitEthiopianDate();
};
// ========== FIXED: Emit Ethiopian Date, NOT Gregorian ==========
const emitEthiopianDate = () => {
    if (selectedDay.value && selectedMonth.value && selectedYear.value) {
        const day = selectedDay.value.toString().padStart(2, '0');
        const month = selectedMonth.value.toString().padStart(2, '0');
        const year = selectedYear.value;
        // Format: DD/MM/YYYY (Ethiopian calendar)
        const ethiopianDate = `${day}/${month}/${year}`;
        console.log('Emitting Ethiopian date:', ethiopianDate);
        isInternalUpdate.value = true;
        emit('update:modelValue', ethiopianDate);
        // Show Gregorian equivalent as hint only (for reference)
        try {
            const kenat = new Kenat(parseInt(year), parseInt(selectedMonth.value) - 1, parseInt(day));
            const gregorianDate = kenat.toGregorian();
            const gregorianDateStr = gregorianDate.toISOString().split('T')[0];
            const date = new Date(gregorianDateStr);
            gregorianHint.value = `Gregorian equivalent: ${date.toLocaleDateString(locale.value === 'am' ? 'am-ET' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`;
        }
        catch (error) {
            gregorianHint.value = '';
        }
        setTimeout(() => {
            isInternalUpdate.value = false;
        }, 0);
    }
    else {
        if (!isInternalUpdate.value) {
            emit('update:modelValue', '');
            gregorianHint.value = '';
        }
    }
};
// Watch for external changes - expects Ethiopian date format "DD/MM/YYYY"
watch(() => props.modelValue, (newValue) => {
    if (!isInternalUpdate.value && newValue) {
        // Check if it's Ethiopian format (contains '/')
        if (newValue.includes('/')) {
            const parts = newValue.split('/');
            if (parts.length === 3) {
                selectedDay.value = parseInt(parts[0]);
                selectedMonth.value = parseInt(parts[1]);
                selectedYear.value = parseInt(parts[2]);
                // Show Gregorian hint
                try {
                    const kenat = new Kenat(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    const gregorianDate = kenat.toGregorian();
                    const gregorianDateStr = gregorianDate.toISOString().split('T')[0];
                    const date = new Date(gregorianDateStr);
                    gregorianHint.value = `Gregorian equivalent: ${date.toLocaleDateString(locale.value === 'am' ? 'am-ET' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}`;
                }
                catch (error) {
                    gregorianHint.value = '';
                }
            }
        }
    }
    else if (!newValue) {
        selectedDay.value = '';
        selectedMonth.value = '';
        selectedYear.value = '';
        gregorianHint.value = '';
    }
}, { immediate: true });
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
/** @type {__VLS_StyleScopedClasses['date-select']} */ ;
/** @type {__VLS_StyleScopedClasses['date-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ethiopian-date-selector" },
});
/** @type {__VLS_StyleScopedClasses['ethiopian-date-selector']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "selector-group" },
});
/** @type {__VLS_StyleScopedClasses['selector-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.emitEthiopianDate) },
    value: (__VLS_ctx.selectedDay),
    ...{ class: ({ 'error-input': __VLS_ctx.error }) },
    ...{ class: "date-select" },
});
/** @type {__VLS_StyleScopedClasses['error-input']} */ ;
/** @type {__VLS_StyleScopedClasses['date-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [day] of __VLS_vFor((__VLS_ctx.maxDays))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (day),
        value: (day),
    });
    (day);
    // @ts-ignore
    [emitEthiopianDate, selectedDay, error, maxDays,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onMonthChange) },
    value: (__VLS_ctx.selectedMonth),
    ...{ class: ({ 'error-input': __VLS_ctx.error }) },
    ...{ class: "date-select" },
});
/** @type {__VLS_StyleScopedClasses['error-input']} */ ;
/** @type {__VLS_StyleScopedClasses['date-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [month] of __VLS_vFor((__VLS_ctx.currentMonths))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (month.value),
        value: (month.value),
    });
    (month.name);
    // @ts-ignore
    [error, onMonthChange, selectedMonth, currentMonths,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.emitEthiopianDate) },
    value: (__VLS_ctx.selectedYear),
    ...{ class: ({ 'error-input': __VLS_ctx.error }) },
    ...{ class: "date-select" },
});
/** @type {__VLS_StyleScopedClasses['error-input']} */ ;
/** @type {__VLS_StyleScopedClasses['date-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [year] of __VLS_vFor((__VLS_ctx.yearRange))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (year),
        value: (year),
    });
    (year);
    // @ts-ignore
    [emitEthiopianDate, error, selectedYear, yearRange,];
}
if (__VLS_ctx.gregorianHint && !__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "gregorian-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['gregorian-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    (__VLS_ctx.gregorianHint);
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error-text" },
    });
    /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
    (__VLS_ctx.error);
}
// @ts-ignore
[error, error, error, gregorianHint, gregorianHint,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        modelValue: { type: String, default: '' },
        error: { type: String, default: '' }
    },
});
export default {};
