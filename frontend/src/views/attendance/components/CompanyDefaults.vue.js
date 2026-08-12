import { ref, computed, onMounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
const props = defineProps({
    shiftType: {
        type: String,
        default: 'day'
    }
});
const title = props.shiftType === 'day' ? 'Company Defaults (Day Shift)' : 'Company Defaults (Night Shift)';
const formData = ref({});
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const configId = ref(null);
// Working days state
const allWorkingDays = ref([]);
const workingDaysLoading = ref(false);
// Filter working days by current shift type
const filteredWorkingDays = computed(() => {
    if (!allWorkingDays.value || !Array.isArray(allWorkingDays.value)) {
        return [];
    }
    return allWorkingDays.value.filter(day => day.shiftType === props.shiftType);
});
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `success-toast ${type}`;
    toast.innerHTML = type === 'success' ? `✓ ${message}` : type === 'error' ? `⚠️ ${message}` : `ℹ️ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};
const getDayIcon = (day) => {
    const icons = {
        'monday': '',
        'tuesday': '',
        'wednesday': '',
        'thursday': '',
        'friday': '',
        'saturday': '',
        'sunday': ''
    };
    return icons[day?.toLowerCase()] || '📅';
};
const formatDayName = (day) => {
    if (!day)
        return '';
    return day.charAt(0).toUpperCase() + day.slice(1);
};
const fetchWorkingDays = async () => {
    workingDaysLoading.value = true;
    try {
        const data = await attendanceService.getWorkingDaysConfig();
        if (data && Array.isArray(data)) {
            allWorkingDays.value = data;
        }
        else {
            allWorkingDays.value = [];
        }
    }
    catch (err) {
        console.error('Failed to fetch working days:', err);
        showToast('Failed to load working days configuration', 'error');
        allWorkingDays.value = [];
    }
    finally {
        workingDaysLoading.value = false;
    }
};
const updateWorkingDay = async (config) => {
    const originalValue = config.isWorkingDay;
    try {
        await attendanceService.updateWorkingDaysConfig(config.id, { isWorkingDay: config.isWorkingDay });
        showToast(`${formatDayName(config.dayOfWeek)} updated to ${config.isWorkingDay ? 'Working Day' : 'Non-Working Day'}`, 'success');
    }
    catch (err) {
        console.error('Failed to update working day:', err);
        showToast('Failed to update working day', 'error');
        config.isWorkingDay = originalValue;
    }
};
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const defaults = await attendanceService.getCompanyDefaults();
        const configs = defaults.filter(d => d.shiftType === props.shiftType && d.isActive === true);
        const config = configs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
        if (config) {
            configId.value = config.id;
            formData.value = {
                checkInTime: config.checkInTime?.slice(0, 5) || (props.shiftType === 'day' ? '06:20' : '22:00'),
                checkOutTime: config.checkOutTime?.slice(0, 5) || (props.shiftType === 'day' ? '18:00' : '06:00'),
                lateThresholdMinutes: config.lateThresholdMinutes ?? 5,
                absentAfterMinutes: config.absentAfterMinutes ?? 60,
                lunchDurationMinutes: config.lunchDurationMinutes ?? 40,
                lunchStartTime: config.lunchStartTime?.slice(0, 5) || '12:00',
                lateNightTriggerTime: config.lateNightTriggerTime?.slice(0, 5) || '00:00',
                lateNightCompensatoryHours: config.lateNightCompensatoryHours ?? 2,
                dinnerStartTime: config.dinnerStartTime?.slice(0, 5) || '02:00',
                dinnerDurationMinutes: config.dinnerDurationMinutes ?? 40
            };
        }
    }
    catch (err) {
        error.value = 'Failed to load company defaults';
        console.error(err);
    }
    finally {
        loading.value = false;
    }
};
const saveData = async () => {
    if (!configId.value) {
        error.value = 'No configuration found to update';
        return;
    }
    saving.value = true;
    error.value = null;
    try {
        const payload = {
            shiftType: props.shiftType,
            checkInTime: formData.value.checkInTime,
            checkOutTime: formData.value.checkOutTime,
            checkOutDayOffset: props.shiftType === 'night' ? 1 : 0,
            isActive: true
        };
        if (props.shiftType === 'day') {
            payload.lateThresholdMinutes = parseInt(formData.value.lateThresholdMinutes);
            payload.absentAfterMinutes = parseInt(formData.value.absentAfterMinutes);
            payload.lunchDurationMinutes = parseInt(formData.value.lunchDurationMinutes);
            payload.lunchStartTime = formData.value.lunchStartTime;
            payload.lateNightTriggerTime = formData.value.lateNightTriggerTime;
            payload.lateNightCompensatoryHours = parseFloat(formData.value.lateNightCompensatoryHours);
        }
        else {
            payload.dinnerStartTime = formData.value.dinnerStartTime;
            payload.dinnerDurationMinutes = parseInt(formData.value.dinnerDurationMinutes);
        }
        await attendanceService.updateCompanyDefault(configId.value, payload);
        showToast(`${title} saved successfully`, 'success');
        await fetchData();
    }
    catch (err) {
        console.error('Save error:', err);
        error.value = err.response?.data?.error || 'Failed to save';
        showToast(error.value, 'error');
    }
    finally {
        saving.value = false;
    }
};
onMounted(() => {
    fetchData();
    fetchWorkingDays();
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['working-days-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['working-days-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['working-day-card']} */ ;
/** @type {__VLS_StyleScopedClasses['working-day-card']} */ ;
/** @type {__VLS_StyleScopedClasses['working-day-card']} */ ;
/** @type {__VLS_StyleScopedClasses['non-working']} */ ;
/** @type {__VLS_StyleScopedClasses['day-name']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-slider']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-slider']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-slider']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-label']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-label']} */ ;
/** @type {__VLS_StyleScopedClasses['non-working']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['working-days-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['working-days-grid']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveData) },
    ...{ class: "btn-save-small" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-icon" },
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
(__VLS_ctx.saving ? 'Saving...' : 'Save');
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.fetchData) },
        ...{ class: "retry-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['retry-btn']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "time",
        ...{ class: "input" },
    });
    (__VLS_ctx.formData.checkInTime);
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "time",
        ...{ class: "input" },
    });
    (__VLS_ctx.formData.checkOutTime);
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "field-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    if (__VLS_ctx.shiftType === 'day') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "number",
            ...{ class: "input" },
            min: "0",
        });
        (__VLS_ctx.formData.lateThresholdMinutes);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'day') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "number",
            ...{ class: "input" },
            min: "0",
        });
        (__VLS_ctx.formData.absentAfterMinutes);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'day') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "number",
            ...{ class: "input" },
            min: "0",
        });
        (__VLS_ctx.formData.lunchDurationMinutes);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'day') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "time",
            ...{ class: "input" },
        });
        (__VLS_ctx.formData.lunchStartTime);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'day') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "time",
            ...{ class: "input" },
        });
        (__VLS_ctx.formData.lateNightTriggerTime);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'day') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "number",
            ...{ class: "input" },
            min: "0",
            step: "0.5",
        });
        (__VLS_ctx.formData.lateNightCompensatoryHours);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'night') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "time",
            ...{ class: "input" },
        });
        (__VLS_ctx.formData.dinnerStartTime);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    if (__VLS_ctx.shiftType === 'night') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "number",
            ...{ class: "input" },
            min: "1",
        });
        (__VLS_ctx.formData.dinnerDurationMinutes);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "working-days-section" },
    });
    /** @type {__VLS_StyleScopedClasses['working-days-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['section-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "section-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
    (__VLS_ctx.shiftType === 'day' ? 'Day Shift' : 'Night Shift');
    if (__VLS_ctx.workingDaysLoading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "working-days-loading" },
        });
        /** @type {__VLS_StyleScopedClasses['working-days-loading']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mini-loader" },
        });
        /** @type {__VLS_StyleScopedClasses['mini-loader']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else if (__VLS_ctx.filteredWorkingDays.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "working-days-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['working-days-empty']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "working-days-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['working-days-grid']} */ ;
        for (const [config] of __VLS_vFor((__VLS_ctx.filteredWorkingDays))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (config.id),
                ...{ class: "working-day-card" },
                ...{ class: ({ 'non-working': !config.isWorkingDay }) },
            });
            /** @type {__VLS_StyleScopedClasses['working-day-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['non-working']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "day-header" },
            });
            /** @type {__VLS_StyleScopedClasses['day-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "day-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['day-icon']} */ ;
            (__VLS_ctx.getDayIcon(config.dayOfWeek));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "day-name" },
            });
            /** @type {__VLS_StyleScopedClasses['day-name']} */ ;
            (__VLS_ctx.formatDayName(config.dayOfWeek));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "day-toggle" },
            });
            /** @type {__VLS_StyleScopedClasses['day-toggle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "toggle-switch" },
            });
            /** @type {__VLS_StyleScopedClasses['toggle-switch']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.workingDaysLoading))
                            return;
                        if (!!(__VLS_ctx.filteredWorkingDays.length === 0))
                            return;
                        __VLS_ctx.updateWorkingDay(config);
                        // @ts-ignore
                        [title, saveData, loading, loading, saving, error, error, fetchData, formData, formData, formData, formData, formData, formData, formData, formData, formData, formData, shiftType, shiftType, shiftType, shiftType, shiftType, shiftType, shiftType, shiftType, shiftType, workingDaysLoading, filteredWorkingDays, filteredWorkingDays, getDayIcon, formatDayName, updateWorkingDay,];
                    } },
                type: "checkbox",
            });
            (config.isWorkingDay);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "toggle-slider" },
            });
            /** @type {__VLS_StyleScopedClasses['toggle-slider']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "toggle-label" },
                ...{ class: ({ 'working': config.isWorkingDay, 'non-working': !config.isWorkingDay }) },
            });
            /** @type {__VLS_StyleScopedClasses['toggle-label']} */ ;
            /** @type {__VLS_StyleScopedClasses['working']} */ ;
            /** @type {__VLS_StyleScopedClasses['non-working']} */ ;
            (config.isWorkingDay ? 'Working' : 'Non-Working');
            // @ts-ignore
            [];
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    props: {
        shiftType: {
            type: String,
            default: 'day'
        }
    },
});
export default {};
