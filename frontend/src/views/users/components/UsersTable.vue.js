import { computed } from 'vue';
const props = defineProps({
    users: {
        type: Array,
        default: () => []
    },
    selectedUsers: {
        type: Array,
        default: () => []
    },
    selectAll: {
        type: Boolean,
        default: false
    },
    pagination: {
        type: Object,
        default: () => ({ page: 1, totalPages: 1 })
    }
});
const __VLS_emit = defineEmits(['toggle-select-all', 'toggle-user-select', 'edit-user', 'reset-password', 'toggle-status', 'go-to-page', 'bulk-update', 'clear-filters']);
const formatRole = (role) => {
    if (!role)
        return 'User';
    if (role.toLowerCase() === 'hr')
        return 'HR';
    return role.charAt(0).toUpperCase() + role.slice(1);
};
// Local avatar functions - no external API needed
const getInitials = (name) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
const getAvatarColor = (name) => {
    const colors = ['#6a11cb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const index = name.length % colors.length;
    return colors[index];
};
const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : 'Never';
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
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "users-table" },
});
/** @type {__VLS_StyleScopedClasses['users-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('toggle-select-all');
            // @ts-ignore
            [$emit,];
        } },
    type: "checkbox",
    checked: (__VLS_ctx.selectAll),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [user] of __VLS_vFor((__VLS_ctx.users))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (user.userId),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.$emit('toggle-user-select', user.userId);
                // @ts-ignore
                [$emit, selectAll, users,];
            } },
        type: "checkbox",
        value: (user.userId),
        checked: (__VLS_ctx.selectedUsers.includes(user.userId)),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "user-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['user-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "avatar-placeholder" },
        ...{ style: ({ background: __VLS_ctx.getAvatarColor(user.fullName) }) },
    });
    /** @type {__VLS_StyleScopedClasses['avatar-placeholder']} */ ;
    (__VLS_ctx.getInitials(user.fullName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "user-info" },
    });
    /** @type {__VLS_StyleScopedClasses['user-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "user-name" },
    });
    /** @type {__VLS_StyleScopedClasses['user-name']} */ ;
    (user.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "user-email" },
    });
    /** @type {__VLS_StyleScopedClasses['user-email']} */ ;
    (user.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (`role-badge role-${user.role}`) },
    });
    (__VLS_ctx.formatRole(user.role));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "nowrap" },
    });
    /** @type {__VLS_StyleScopedClasses['nowrap']} */ ;
    (user.departmentName || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('toggle-status', user);
                // @ts-ignore
                [$emit, selectedUsers, getAvatarColor, getInitials, formatRole,];
            } },
        ...{ class: "status-toggle" },
        ...{ class: (user.isActive ? 'status-active' : 'status-inactive') },
    });
    /** @type {__VLS_StyleScopedClasses['status-toggle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-dot" },
    });
    /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
    (user.isActive ? 'Active' : 'Inactive');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "nowrap" },
    });
    /** @type {__VLS_StyleScopedClasses['nowrap']} */ ;
    (__VLS_ctx.formatDate(user.lastLogin));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "actions-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('edit-user', user);
                // @ts-ignore
                [$emit, formatDate,];
            } },
        ...{ class: "action-btn edit" },
        title: "Edit User",
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M4 20h16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('reset-password', user);
                // @ts-ignore
                [$emit,];
            } },
        ...{ class: "action-btn reset" },
        title: "Reset Password",
    });
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['reset']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 2L15 8M3 12h4M12 3v4M5.5 5.5l3 3M18.5 18.5l-3-3M21 22l-6-6M12 21v-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "2",
    });
    // @ts-ignore
    [];
}
if (__VLS_ctx.users.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "7",
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-state-message" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-message']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.users.length === 0))
                    return;
                __VLS_ctx.$emit('clear-filters');
                // @ts-ignore
                [$emit, users,];
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
}
if (__VLS_ctx.selectedUsers.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bulk-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.selectedUsers.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bulk-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedUsers.length > 0))
                    return;
                __VLS_ctx.$emit('bulk-update', true);
                // @ts-ignore
                [$emit, selectedUsers, selectedUsers,];
            } },
        ...{ class: "bulk-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedUsers.length > 0))
                    return;
                __VLS_ctx.$emit('bulk-update', false);
                // @ts-ignore
                [$emit,];
            } },
        ...{ class: "bulk-btn danger" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
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
                [$emit, pagination, pagination,];
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
    (__VLS_ctx.pagination.page);
    (__VLS_ctx.pagination.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.totalPages > 1))
                    return;
                __VLS_ctx.$emit('go-to-page', __VLS_ctx.pagination.page + 1);
                // @ts-ignore
                [$emit, pagination, pagination, pagination, pagination,];
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
        users: {
            type: Array,
            default: () => []
        },
        selectedUsers: {
            type: Array,
            default: () => []
        },
        selectAll: {
            type: Boolean,
            default: false
        },
        pagination: {
            type: Object,
            default: () => ({ page: 1, totalPages: 1 })
        }
    },
});
export default {};
