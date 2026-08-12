import { getCurrentInstance } from 'vue';
const { proxy } = getCurrentInstance();
const { $t } = proxy;
const __VLS_props = defineProps({
    employees: {
        type: Array,
        default: () => []
    },
    pagination: {
        type: Object,
        default: () => ({ page: 1, totalPages: 1 })
    }
});
const emit = defineEmits([
    'edit-employee',
    'view-employee',
    'delete-employee',
    'toggle-status',
    'terminate-employee',
    'reactivate-employee',
    'go-to-page',
    'clear-filters'
]);
// ========== HANDLE FUNCTIONS ==========
const handleToggleStatus = (emp) => {
    console.log('🔄 Toggle status clicked for:', emp.fullName, 'Current status:', emp.status);
    emit('toggle-status', emp);
};
const handleTerminate = (emp) => {
    console.log('🔴 Terminate clicked for:', emp.fullName);
    emit('terminate-employee', emp);
};
const handleReactivate = (emp) => {
    console.log('🟢 Reactivate clicked for:', emp.fullName);
    emit('reactivate-employee', emp);
};
const handleView = (emp) => {
    emit('view-employee', emp);
};
const handleEdit = (emp) => {
    emit('edit-employee', emp);
};
// ========== UTILITY FUNCTIONS ==========
const getInitials = (name) => {
    if (!name)
        return 'E';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
const getAvatarColor = (name) => {
    const colors = ['#6a11cb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
};
const getEmploymentTypeLabel = (type) => {
    const labels = {
        'full-time': $t('employmentType.fullTime') || 'Full Time',
        'part-time': $t('employmentType.partTime') || 'Part Time',
        'contract': $t('employmentType.contract') || 'Contract',
        'intern': $t('employmentType.intern') || 'Intern'
    };
    return labels[type] || type || 'N/A';
};
const getStatusLabel = (status) => {
    const labels = {
        'active': $t('status.active') || 'Active',
        'on-leave': $t('status.onLeave') || 'On Leave',
        'terminated': $t('status.terminated') || 'Terminated'
    };
    return labels[status] || status || 'N/A';
};
const formatDate = (date) => {
    if (!date)
        return "—";
    if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return date;
    }
    const parts = date.split(/[/-]/);
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${day}/${month}/${year}`;
    }
    return date;
};
const handleImageError = (event, fullName) => {
    const img = event.target;
    const parent = img.parentElement;
    const fallback = document.createElement('div');
    fallback.className = 'avatar-placeholder';
    fallback.style.background = getAvatarColor(fullName);
    fallback.textContent = getInitials(fullName);
    parent.replaceChild(fallback, img);
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
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['view']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['edit']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['terminate']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['reactivate']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "employees-table" },
});
/** @type {__VLS_StyleScopedClasses['employees-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.employee') || 'Employee');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.id') || 'ID');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.dept') || 'Dept');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.position') || 'Position');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.type') || 'Type');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.status') || 'Status');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('employee.hireDate') || 'Hire Date');
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('actions.actions') || 'Actions');
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [emp] of __VLS_vFor((__VLS_ctx.employees))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (emp.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "employee-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
    if (emp.profilePictureUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            ...{ onError: (...[$event]) => {
                    if (!(emp.profilePictureUrl))
                        return;
                    __VLS_ctx.handleImageError($event, emp.fullName);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, employees, handleImageError,];
                } },
            src: (emp.profilePictureUrl),
            ...{ class: "employee-avatar" },
            alt: (emp.fullName),
        });
        /** @type {__VLS_StyleScopedClasses['employee-avatar']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "avatar-placeholder" },
            ...{ style: ({ background: __VLS_ctx.getAvatarColor(emp.fullName) }) },
        });
        /** @type {__VLS_StyleScopedClasses['avatar-placeholder']} */ ;
        (__VLS_ctx.getInitials(emp.fullName));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-info" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "employee-name" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
    (emp.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "employee-email" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-email']} */ ;
    (emp.fullNameEnglish || emp.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "employee-id" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-id']} */ ;
    (emp.employeeId);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (emp.departmentName || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "position-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['position-cell']} */ ;
    (emp.position || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (`type-badge type-${emp.employmentType}`) },
    });
    (__VLS_ctx.getEmploymentTypeLabel(emp.employmentType));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleToggleStatus(emp);
                // @ts-ignore
                [getAvatarColor, getInitials, getEmploymentTypeLabel, handleToggleStatus,];
            } },
        ...{ class: "status-toggle" },
        ...{ class: (`status-${emp.status}`) },
        disabled: (emp.status === 'terminated'),
        title: (emp.status === 'terminated' ? 'Terminated employees cannot be toggled' : 'Toggle status'),
    });
    /** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-dot" },
    });
    /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
    (__VLS_ctx.getStatusLabel(emp.status));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "date-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['date-cell']} */ ;
    (__VLS_ctx.formatDate(emp.hireDateEC));
    (__VLS_ctx.$t('calendar.ec') || 'E.C');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "actions-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleView(emp);
                // @ts-ignore
                [$t, getStatusLabel, formatDate, handleView,];
            } },
        ...{ class: "action-btn view" },
        title: (__VLS_ctx.$t('actions.viewDetails') || 'View Details'),
    });
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['view']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleEdit(emp);
                // @ts-ignore
                [$t, handleEdit,];
            } },
        ...{ class: "action-btn edit" },
        title: (__VLS_ctx.$t('actions.editEmployee') || 'Edit Employee'),
    });
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['edit']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M17 3l4 4-7 7H10v-4l7-7z",
    });
    if (emp.status !== 'terminated') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(emp.status !== 'terminated'))
                        return;
                    __VLS_ctx.handleTerminate(emp);
                    // @ts-ignore
                    [$t, handleTerminate,];
                } },
            ...{ class: "action-btn terminate" },
            title: (__VLS_ctx.$t('actions.terminate') || 'Terminate Employee'),
        });
        /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['terminate']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "8",
            y1: "8",
            x2: "16",
            y2: "16",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "16",
            y1: "8",
            x2: "8",
            y2: "16",
        });
    }
    if (emp.status === 'terminated') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(emp.status === 'terminated'))
                        return;
                    __VLS_ctx.handleReactivate(emp);
                    // @ts-ignore
                    [$t, handleReactivate,];
                } },
            ...{ class: "action-btn reactivate" },
            title: (__VLS_ctx.$t('actions.reactivate') || 'Reactivate Employee'),
        });
        /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['reactivate']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "12 8 12 12 15 14",
        });
    }
    // @ts-ignore
    [$t,];
}
if (__VLS_ctx.employees.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "8",
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state-content" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "empty-state-icon" },
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "1.5",
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "9",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M23 21v-2a4 4 0 0 0-3-3.87",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 3.13a4 4 0 0 1 0 7.75",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "empty-state-title" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-title']} */ ;
    (__VLS_ctx.$t('messages.noData') || 'No Employee found');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-state-message" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-message']} */ ;
    (__VLS_ctx.$t('messages.adjustFilters') || 'Try adjusting your search or filter criteria');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.employees.length === 0))
                    return;
                __VLS_ctx.$emit('clear-filters');
                // @ts-ignore
                [$t, $t, employees, $emit,];
            } },
        ...{ class: "empty-state-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M18 6L6 18M6 6l12 12",
    });
    (__VLS_ctx.$t('common.clearFilters') || 'Clear Filters');
}
if (__VLS_ctx.pagination.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.$emit('go-to-page', __VLS_ctx.pagination.page - 1);
                // @ts-ignore
                [$t, $emit, pagination, pagination,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.page === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M15 18l-6-6 6-6",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('common.page') || 'Page');
    (__VLS_ctx.pagination.page);
    (__VLS_ctx.$t('common.of') || 'of');
    (__VLS_ctx.pagination.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.$emit('go-to-page', __VLS_ctx.pagination.page + 1);
                // @ts-ignore
                [$t, $t, $emit, pagination, pagination, pagination, pagination,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.pagination.page === __VLS_ctx.pagination.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M9 18l6-6-6-6",
    });
}
// @ts-ignore
[pagination, pagination,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        employees: {
            type: Array,
            default: () => []
        },
        pagination: {
            type: Object,
            default: () => ({ page: 1, totalPages: 1 })
        }
    },
});
export default {};
