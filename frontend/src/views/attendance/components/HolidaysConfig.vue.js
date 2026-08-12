import { ref, computed, onMounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
const holidays = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const showDeleteModal = ref(false);
const deleteId = ref(null);
const deleteIndex = ref(null);
const deleteItemName = ref('');
const originalHolidays = ref([]);
const hasChanges = computed(() => {
    return JSON.stringify(holidays.value) !== JSON.stringify(originalHolidays.value);
});
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `success-toast ${type}`;
    toast.innerHTML = type === 'success' ? `✓ ${message}` : type === 'error' ? `⚠️ ${message}` : `ℹ️ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};
const markChanged = (holiday) => {
    holiday._hasChanges = true;
};
const saveOriginalState = () => {
    originalHolidays.value = JSON.parse(JSON.stringify(holidays.value));
};
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const data = await attendanceService.getHolidays();
        holidays.value = data.map(h => ({
            ...h,
            overtimeRate: parseFloat(h.overtimeRate) // Ensure it's a number
        }));
        saveOriginalState();
    }
    catch (err) {
        error.value = 'Failed to load holidays';
        console.error(err);
    }
    finally {
        loading.value = false;
    }
};
const addHoliday = () => {
    const newHoliday = {
        id: null,
        name: '',
        holidayDate: new Date().toISOString().split('T')[0],
        holidayType: 'public',
        overtimeRate: 2.5,
        isRecurring: false,
        _hasChanges: true
    };
    holidays.value.push(newHoliday);
    showToast('New holiday added', 'info');
};
const removeHoliday = (id, index) => {
    if (id) {
        deleteId.value = id;
        deleteIndex.value = index;
        deleteItemName.value = holidays.value[index].name || 'this holiday';
        showDeleteModal.value = true;
    }
    else {
        holidays.value.splice(index, 1);
        showToast('Holiday removed', 'info');
    }
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteId.value = null;
    deleteIndex.value = null;
    deleteItemName.value = '';
};
const confirmDelete = async () => {
    try {
        await attendanceService.deleteHoliday(deleteId.value);
        holidays.value.splice(deleteIndex.value, 1);
        saveOriginalState();
        closeDeleteModal();
        showToast('Holiday deleted', 'success');
    }
    catch (err) {
        showToast('Failed to delete', 'error');
        console.error(err);
    }
};
const saveAll = async () => {
    saving.value = true;
    error.value = null;
    let savedCount = 0;
    try {
        for (const holiday of holidays.value) {
            if (!holiday.name || !holiday.holidayDate)
                continue;
            // Ensure overtimeRate is a proper number
            let overtimeRateValue = parseFloat(holiday.overtimeRate);
            if (isNaN(overtimeRateValue)) {
                overtimeRateValue = 2.5;
            }
            console.log(`Saving ${holiday.name} with OT rate: ${overtimeRateValue}`);
            const payload = {
                name: holiday.name,
                holidayDate: holiday.holidayDate,
                holidayType: holiday.holidayType,
                overtimeRate: overtimeRateValue,
                isRecurring: holiday.isRecurring || false
            };
            if (payload.isRecurring) {
                payload.year = null;
            }
            else {
                payload.year = new Date(payload.holidayDate).getFullYear();
            }
            if (holiday.id) {
                await attendanceService.updateHoliday(holiday.id, payload);
            }
            else {
                await attendanceService.createHoliday(payload);
            }
            savedCount++;
        }
        await fetchData();
        showToast(`Saved ${savedCount} holiday(s)`, 'success');
    }
    catch (err) {
        console.error('Save error:', err);
        showToast(err.response?.data?.error || 'Failed to save holidays', 'error');
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
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['delete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-link']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['success-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge" },
});
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
(__VLS_ctx.holidays.length);
if (__VLS_ctx.hasChanges) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge unsaved" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['unsaved']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addHoliday) },
    ...{ class: "btn-add-small" },
    disabled: (__VLS_ctx.saving),
});
/** @type {__VLS_StyleScopedClasses['btn-add-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-icon" },
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveAll) },
    ...{ class: "btn-save-small" },
    disabled: (__VLS_ctx.saving || !__VLS_ctx.hasChanges),
});
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
if (__VLS_ctx.saving) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "btn-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
}
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
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [holiday, index] of __VLS_vFor((__VLS_ctx.holidays))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (index),
            ...{ class: ({
                    'new-holiday': !holiday.id,
                    'has-changes': holiday._hasChanges
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['new-holiday']} */ ;
        /** @type {__VLS_StyleScopedClasses['has-changes']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "date-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['date-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-input-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['date-input-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['date-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.markChanged(holiday);
                    // @ts-ignore
                    [holidays, holidays, hasChanges, hasChanges, addHoliday, saving, saving, saving, saving, saveAll, loading, error, error, fetchData, markChanged,];
                } },
            type: "date",
            ...{ class: "input-sm" },
        });
        (holiday.holidayDate);
        /** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.markChanged(holiday);
                    // @ts-ignore
                    [markChanged,];
                } },
            type: "text",
            value: (holiday.name),
            ...{ class: "input-sm" },
            placeholder: "e.g., Meskel",
        });
        /** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "select-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.markChanged(holiday);
                    // @ts-ignore
                    [markChanged,];
                } },
            value: (holiday.holidayType),
            ...{ class: "select-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "public",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "religious",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "company",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "select-arrow" },
        });
        /** @type {__VLS_StyleScopedClasses['select-arrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "select-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.markChanged(holiday);
                    // @ts-ignore
                    [markChanged,];
                } },
            value: (holiday.overtimeRate),
            ...{ class: "select-sm rate-select" },
        });
        /** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rate-select']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (1.5),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (2.0),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (2.5),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (3.0),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "select-arrow" },
        });
        /** @type {__VLS_StyleScopedClasses['select-arrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "recurring-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['recurring-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "checkbox-label" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.markChanged(holiday);
                    // @ts-ignore
                    [markChanged,];
                } },
            type: "checkbox",
            ...{ class: "checkbox" },
        });
        (holiday.isRecurring);
        /** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "checkbox-text" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.removeHoliday(holiday.id, index);
                    // @ts-ignore
                    [removeHoliday,];
                } },
            ...{ class: "btn-icon delete" },
            title: "Delete holiday",
            disabled: (__VLS_ctx.saving),
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['delete']} */ ;
        // @ts-ignore
        [saving,];
    }
    if (__VLS_ctx.holidays.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "6",
            ...{ class: "empty-row" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.addHoliday) },
            ...{ class: "btn-link" },
            disabled: (__VLS_ctx.saving),
        });
        /** @type {__VLS_StyleScopedClasses['btn-link']} */ ;
    }
}
if (__VLS_ctx.showDeleteModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal confirm-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['confirm-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body confirm-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    /** @type {__VLS_StyleScopedClasses['confirm-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deleteItemName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirm-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "btn-modal cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmDelete) },
        ...{ class: "btn-modal danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
}
// @ts-ignore
[holidays, addHoliday, saving, showDeleteModal, closeDeleteModal, closeDeleteModal, closeDeleteModal, deleteItemName, confirmDelete,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
