import { ref, onMounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
import employeesService from '@/stores/employee';
const overrides = ref([]);
const departments = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingItem = ref(null);
const deleteId = ref(null);
const deleteItemName = ref('');
const formData = ref({
    departmentId: null,
    checkInTime: '',
    checkOutTime: '',
    lunchDurationMinutes: null,
    overtimeAfterTime: ''
});
const fetchDepartments = async () => {
    try {
        const result = await employeesService.getDepartments();
        if (result.success && result.data)
            departments.value = result.data;
    }
    catch (err) {
        console.error('Failed to fetch departments:', err);
    }
};
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
        overrides.value = await attendanceService.getDepartmentOverrides();
    }
    catch (err) {
        error.value = 'Failed to load department overrides';
        console.error(err);
    }
    finally {
        loading.value = false;
    }
};
const saveAll = async () => {
    saving.value = true;
    error.value = null;
    try {
        for (const dept of overrides.value) {
            await attendanceService.updateDepartmentOverride(dept.id, dept);
        }
        alert('✓ All department overrides saved successfully');
    }
    catch (err) {
        error.value = 'Failed to save changes';
        console.error(err);
    }
    finally {
        saving.value = false;
    }
};
const openAddModal = () => {
    editingItem.value = null;
    formData.value = {
        departmentId: null,
        checkInTime: '',
        checkOutTime: '',
        lunchDurationMinutes: null,
        overtimeAfterTime: ''
    };
    showModal.value = true;
};
const openEditModal = (dept) => {
    editingItem.value = dept;
    formData.value = { ...dept };
    showModal.value = true;
};
const closeModal = () => {
    showModal.value = false;
    editingItem.value = null;
};
const saveItem = async () => {
    if (!formData.value.departmentId) {
        alert('Please select a department');
        return;
    }
    saving.value = true;
    try {
        if (editingItem.value) {
            await attendanceService.updateDepartmentOverride(editingItem.value.id, formData.value);
        }
        else {
            await attendanceService.createDepartmentOverride({ ...formData.value, shiftType: 'day' });
        }
        await fetchData();
        closeModal();
    }
    catch (err) {
        error.value = 'Failed to save department override';
        console.error(err);
    }
    finally {
        saving.value = false;
    }
};
const confirmDelete = (id, name) => {
    deleteId.value = id;
    deleteItemName.value = name;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteId.value = null;
};
const deleteItem = async () => {
    try {
        await attendanceService.deleteDepartmentOverride(deleteId.value);
        await fetchData();
        closeDeleteModal();
    }
    catch (err) {
        error.value = 'Failed to delete department override';
        console.error(err);
    }
};
onMounted(() => {
    fetchDepartments();
    fetchData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['config-card']} */ ;
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
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['edit']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['delete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-link']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm-body']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
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
(__VLS_ctx.overrides.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddModal) },
    ...{ class: "btn-add-small" },
});
/** @type {__VLS_StyleScopedClasses['btn-add-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-icon" },
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveAll) },
    ...{ class: "btn-save-small" },
    disabled: (__VLS_ctx.saving),
});
/** @type {__VLS_StyleScopedClasses['btn-save-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-icon" },
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "th-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['th-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "th-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['th-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "th-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['th-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "th-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['th-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [dept] of __VLS_vFor((__VLS_ctx.overrides))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (dept.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "department-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['department-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-name" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
        (dept.departmentName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "time",
            ...{ class: "input-sm" },
        });
        (dept.checkInTime);
        /** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "time",
            ...{ class: "input-sm" },
        });
        (dept.checkOutTime);
        /** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "number",
            ...{ class: "input-sm" },
            min: "0",
            step: "5",
        });
        (dept.lunchDurationMinutes);
        /** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "time",
            ...{ class: "input-sm" },
        });
        (dept.overtimeAfterTime);
        /** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
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
                    __VLS_ctx.openEditModal(dept);
                    // @ts-ignore
                    [overrides, overrides, openAddModal, saveAll, saving, loading, error, error, fetchData, openEditModal,];
                } },
            ...{ class: "btn-icon edit" },
            title: "Edit department override",
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['edit']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.confirmDelete(dept.id, dept.departmentName);
                    // @ts-ignore
                    [confirmDelete,];
                } },
            ...{ class: "btn-icon delete" },
            title: "Delete department override",
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['delete']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.overrides.length === 0) {
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
            ...{ onClick: (__VLS_ctx.openAddModal) },
            ...{ class: "btn-link" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-link']} */ ;
    }
}
if (__VLS_ctx.showModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header-left" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "modal-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-icon']} */ ;
    (__VLS_ctx.editingItem ? '✏️' : '➕');
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingItem ? 'Edit' : 'Add');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "select-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.formData.departmentId),
        ...{ class: "input" },
        disabled: (__VLS_ctx.editingItem),
    });
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [overrides, openAddModal, showModal, closeModal, closeModal, editingItem, editingItem, editingItem, formData, departments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "select-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['select-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "time",
        ...{ class: "input" },
        placeholder: "--:--",
    });
    (__VLS_ctx.formData.checkInTime);
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "time",
        ...{ class: "input" },
        placeholder: "--:--",
    });
    (__VLS_ctx.formData.checkOutTime);
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['label-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "number",
        ...{ class: "input" },
        min: "0",
        step: "5",
        placeholder: "e.g., 60",
    });
    (__VLS_ctx.formData.lunchDurationMinutes);
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "time",
        ...{ class: "input" },
        placeholder: "--:--",
    });
    (__VLS_ctx.formData.overtimeAfterTime);
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    if (__VLS_ctx.formData.lunchDurationMinutes && __VLS_ctx.formData.lunchDurationMinutes > 120) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-banner" },
        });
        /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['info-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "btn-modal cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveItem) },
        ...{ class: "btn-modal confirm" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['confirm']} */ ;
    (__VLS_ctx.saving ? 'Saving...' : (__VLS_ctx.editingItem ? 'Update' : 'Create'));
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
        ...{ onClick: (__VLS_ctx.deleteItem) },
        ...{ class: "btn-modal danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
}
// @ts-ignore
[saving, saving, closeModal, editingItem, formData, formData, formData, formData, formData, formData, saveItem, showDeleteModal, closeDeleteModal, closeDeleteModal, closeDeleteModal, deleteItemName, deleteItem,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
