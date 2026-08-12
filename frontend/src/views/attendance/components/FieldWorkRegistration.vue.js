import { ref, onMounted } from 'vue';
import attendanceService from '@/stores/attendanceService';
import employeesService from '@/stores/employee';
const assignments = ref([]);
const employees = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingItem = ref(null);
const deleteId = ref(null);
const deleteItemName = ref('');
const formData = ref({
    employeeId: null,
    assignmentType: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    location: ''
});
const formatDate = (dateStr) => {
    if (!dateStr)
        return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};
const getTypeLabel = (type) => {
    const labels = { 'today': 'Today Only', 'range': 'Date Range', 'permanent': 'Permanent' };
    return labels[type] || type;
};
const fetchEmployees = async () => {
    try {
        const result = await employeesService.getEmployees({ limit: 100 });
        if (result.success && result.data)
            employees.value = result.data;
    }
    catch (err) {
        console.error('Failed to fetch employees:', err);
    }
};
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
        assignments.value = await attendanceService.getAllFieldWork?.() || [];
    }
    catch (err) {
        error.value = 'Failed to load field work assignments';
        console.error(err);
    }
    finally {
        loading.value = false;
    }
};
const openAddModal = () => {
    editingItem.value = null;
    formData.value = {
        employeeId: null,
        assignmentType: 'today',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        location: ''
    };
    showModal.value = true;
};
const closeModal = () => {
    showModal.value = false;
    editingItem.value = null;
};
const saveItem = async () => {
    if (!formData.value.employeeId) {
        alert('Please select an employee');
        return;
    }
    if (formData.value.assignmentType !== 'permanent' && !formData.value.startDate) {
        alert('Start date is required');
        return;
    }
    if (formData.value.assignmentType === 'range' && !formData.value.endDate) {
        alert('End date is required for range type');
        return;
    }
    saving.value = true;
    try {
        if (editingItem.value) {
            await attendanceService.updateFieldWork(editingItem.value.id, formData.value);
        }
        else {
            await attendanceService.registerFieldWork(formData.value.employeeId, formData.value.assignmentType, formData.value.startDate, formData.value.assignmentType === 'range' ? formData.value.endDate : null, formData.value.location);
        }
        await fetchData();
        closeModal();
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.innerHTML = '✓ Field work ' + (editingItem.value ? 'updated' : 'registered') + ' successfully';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    }
    catch (err) {
        error.value = 'Failed to save field work assignment';
        console.error(err);
    }
    finally {
        saving.value = false;
    }
};
const completeFieldWork = async (id) => {
    try {
        await attendanceService.completeFieldWork(id);
        await fetchData();
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.innerHTML = '✓ Field work marked as completed';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    }
    catch (err) {
        error.value = 'Failed to complete field work';
        console.error(err);
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
        await attendanceService.deleteFieldWork(deleteId.value);
        await fetchData();
        closeDeleteModal();
    }
    catch (err) {
        error.value = 'Failed to delete field work';
        console.error(err);
    }
};
onMounted(() => {
    fetchEmployees();
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
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['complete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['delete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-link']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['location-input-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-label']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-label']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-custom']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-custom']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-label']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-custom']} */ ;
/** @type {__VLS_StyleScopedClasses['info-content']} */ ;
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
/** @type {__VLS_StyleScopedClasses['radio-group']} */ ;
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
(__VLS_ctx.assignments.length);
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
        ...{ class: "data-table compact" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    /** @type {__VLS_StyleScopedClasses['compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [fw] of __VLS_vFor((__VLS_ctx.assignments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (fw.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-info" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-avatar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (fw.employeeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
        (fw.departmentName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['type-badge', fw.assignmentType]) },
        });
        /** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
        (__VLS_ctx.getTypeLabel(fw.assignmentType));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-badge start-date" },
        });
        /** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
        /** @type {__VLS_StyleScopedClasses['start-date']} */ ;
        (__VLS_ctx.formatDate(fw.startDate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        if (fw.endDate) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "date-badge end-date" },
            });
            /** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['end-date']} */ ;
            (__VLS_ctx.formatDate(fw.endDate));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "permanent-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['permanent-badge']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge active-field" },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        /** @type {__VLS_StyleScopedClasses['active-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-dot" },
        });
        /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
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
                    __VLS_ctx.completeFieldWork(fw.id);
                    // @ts-ignore
                    [assignments, assignments, openAddModal, loading, error, error, fetchData, getTypeLabel, formatDate, formatDate, completeFieldWork,];
                } },
            ...{ class: "btn-icon complete" },
            title: "Mark as completed",
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['complete']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.confirmDelete(fw.id, fw.employeeName);
                    // @ts-ignore
                    [confirmDelete,];
                } },
            ...{ class: "btn-icon delete" },
            title: "Delete assignment",
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['delete']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.assignments.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
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
    (__VLS_ctx.editingItem ? '✏️' : '🏔️');
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingItem ? 'Edit' : 'Register');
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
        value: (__VLS_ctx.formData.employeeId),
        ...{ class: "input" },
        disabled: (__VLS_ctx.editingItem),
    });
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [emp] of __VLS_vFor((__VLS_ctx.employees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (emp.id),
            value: (emp.id),
        });
        (emp.fullName || emp.firstName + ' ' + emp.lastName);
        (emp.departmentName || 'N/A');
        // @ts-ignore
        [assignments, openAddModal, showModal, closeModal, closeModal, editingItem, editingItem, editingItem, formData, employees,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "select-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['select-arrow']} */ ;
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
        ...{ class: "radio-group" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "radio-label" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "today",
    });
    (__VLS_ctx.formData.assignmentType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "radio-custom" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-custom']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "radio-label-text" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-label-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "radio-label" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "range",
    });
    (__VLS_ctx.formData.assignmentType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "radio-custom" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-custom']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "radio-label-text" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-label-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "radio-label" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "permanent",
    });
    (__VLS_ctx.formData.assignmentType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "radio-custom" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-custom']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "radio-label-text" },
    });
    /** @type {__VLS_StyleScopedClasses['radio-label-text']} */ ;
    if (__VLS_ctx.formData.assignmentType === 'today') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "animate-in" },
        });
        /** @type {__VLS_StyleScopedClasses['animate-in']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "required" },
        });
        /** @type {__VLS_StyleScopedClasses['required']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "date",
            ...{ class: "input" },
        });
        (__VLS_ctx.formData.startDate);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
    }
    if (__VLS_ctx.formData.assignmentType === 'range') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "animate-in" },
        });
        /** @type {__VLS_StyleScopedClasses['animate-in']} */ ;
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
            ...{ class: "required" },
        });
        /** @type {__VLS_StyleScopedClasses['required']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "date",
            ...{ class: "input" },
        });
        (__VLS_ctx.formData.startDate);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "required" },
        });
        /** @type {__VLS_StyleScopedClasses['required']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "date",
            ...{ class: "input" },
        });
        (__VLS_ctx.formData.endDate);
        /** @type {__VLS_StyleScopedClasses['input']} */ ;
    }
    if (__VLS_ctx.formData.assignmentType === 'permanent') {
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "optional" },
    });
    /** @type {__VLS_StyleScopedClasses['optional']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "location-input-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['location-input-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "location-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['location-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.formData.location),
        ...{ class: "input" },
        placeholder: "e.g., Client site, Remote work, Construction site",
    });
    /** @type {__VLS_StyleScopedClasses['input']} */ ;
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
    (__VLS_ctx.saving ? 'Saving...' : (__VLS_ctx.editingItem ? 'Update' : 'Register'));
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
[closeModal, editingItem, formData, formData, formData, formData, formData, formData, formData, formData, formData, formData, saveItem, saving, saving, showDeleteModal, closeDeleteModal, closeDeleteModal, closeDeleteModal, deleteItemName, deleteItem,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
