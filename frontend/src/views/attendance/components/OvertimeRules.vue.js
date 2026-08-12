import { ref, onMounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
const rates = ref({ weekday: 1.5, weekend: 2.0, holiday: 2.5 });
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const data = await attendanceService.getOvertimeRates();
        if (data && data.length) {
            const weekday = data.find(r => r.dayType === 'weekday');
            const weekend = data.find(r => r.dayType === 'weekend');
            const holiday = data.find(r => r.dayType === 'holiday');
            rates.value = {
                weekday: weekday?.rate || 1.5,
                weekend: weekend?.rate || 2.0,
                holiday: holiday?.rate || 2.5
            };
        }
    }
    catch (err) {
        error.value = 'Failed to load overtime rates';
        console.error(err);
    }
    finally {
        loading.value = false;
    }
};
const saveData = async () => {
    saving.value = true;
    error.value = null;
    try {
        await attendanceService.updateOvertimeRate(1, { dayType: 'weekday', rate: rates.value.weekday });
        await attendanceService.updateOvertimeRate(2, { dayType: 'weekend', rate: rates.value.weekend });
        await attendanceService.updateOvertimeRate(3, { dayType: 'holiday', rate: rates.value.holiday });
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.innerHTML = '✓ Overtime rates saved successfully';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    }
    catch (err) {
        error.value = 'Failed to save overtime rates';
        console.error(err);
    }
    finally {
        saving.value = false;
    }
};
onMounted(fetchData);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['config-card']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-info']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-input']} */ ;
/** @type {__VLS_StyleScopedClasses['info-content']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-input']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['rate-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "config-card" },
});
/** @type {__VLS_StyleScopedClasses['config-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "header-icon" },
});
/** @type {__VLS_StyleScopedClasses['header-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-info" },
});
/** @type {__VLS_StyleScopedClasses['header-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "header-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['header-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveData) },
    ...{ class: "btn-save-small" },
    disabled: (__VLS_ctx.saving),
});
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-icon" },
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
(__VLS_ctx.saving ? 'Saving...' : 'Save Changes');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loader" },
    });
    /** @type {__VLS_StyleScopedClasses['loader']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "error-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.fetchData) },
        ...{ class: "retry-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['retry-btn']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rates-container" },
    });
    /** @type {__VLS_StyleScopedClasses['rates-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-card weekday" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['weekday']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-header" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rate-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-info" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-input-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-input-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.1",
        ...{ class: "rate-input" },
        min: "0",
    });
    (__VLS_ctx.rates.weekday);
    /** @type {__VLS_StyleScopedClasses['rate-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rate-unit" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-unit']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-example" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-example']} */ ;
    (__VLS_ctx.rates.weekday);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-card weekend" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['weekend']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-header" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rate-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-info" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-input-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-input-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.1",
        ...{ class: "rate-input" },
        min: "0",
    });
    (__VLS_ctx.rates.weekend);
    /** @type {__VLS_StyleScopedClasses['rate-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rate-unit" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-unit']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-example" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-example']} */ ;
    (__VLS_ctx.rates.weekend);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-card holiday" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['holiday']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-header" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rate-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-info" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-input-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-input-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.1",
        ...{ class: "rate-input" },
        min: "0",
    });
    (__VLS_ctx.rates.holiday);
    /** @type {__VLS_StyleScopedClasses['rate-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rate-unit" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-unit']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rate-example" },
    });
    /** @type {__VLS_StyleScopedClasses['rate-example']} */ ;
    (__VLS_ctx.rates.holiday);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-content" },
    });
    /** @type {__VLS_StyleScopedClasses['info-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
// @ts-ignore
[saveData, saving, saving, loading, error, error, fetchData, rates, rates, rates, rates, rates, rates,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
