const __VLS_props = defineProps({
    showModal: Boolean,
    showResetModal: Boolean,
    isEditing: Boolean,
    userForm: Object,
    resetUser: Object,
    resetPasswordData: Object,
    roles: Array,
    departments: Array,
    errors: Object,
    saving: Boolean,
    resetting: Boolean,
    toasts: Array
});
const __VLS_emit = defineEmits(['close-modal', 'close-reset-modal', 'save-user', 'reset-password', 'remove-toast']);
const capitalize = (value) => {
    if (!value)
        return '';
    if (value.toLowerCase() === 'hr')
        return 'HR';
    return value.charAt(0).toUpperCase() + value.slice(1);
};
const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(name)}`;
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
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['switch']} */ ;
/** @type {__VLS_StyleScopedClasses['slider']} */ ;
/** @type {__VLS_StyleScopedClasses['slider']} */ ;
/** @type {__VLS_StyleScopedClasses['slider']} */ ;
/** @type {__VLS_StyleScopedClasses['slider']} */ ;
/** @type {__VLS_StyleScopedClasses['slider']} */ ;
/** @type {__VLS_StyleScopedClasses['round']} */ ;
/** @type {__VLS_StyleScopedClasses['reset-info']} */ ;
/** @type {__VLS_StyleScopedClasses['reset-info']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-success']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-error']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
if (__VLS_ctx.showModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.$emit('close-modal');
                // @ts-ignore
                [showModal, $emit,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.isEditing ? 'Edit User' : 'Add User');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.$emit('close-modal');
                // @ts-ignore
                [$emit, isEditing,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.$emit('save-user');
                // @ts-ignore
                [$emit,];
            } },
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.userForm.fullName),
        ...{ class: "form-input" },
        ...{ class: ({ error: __VLS_ctx.errors.fullName }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    if (__VLS_ctx.errors.fullName) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.errors.fullName);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.userForm.username),
        disabled: (__VLS_ctx.isEditing),
        ...{ class: "form-input" },
        ...{ class: ({ error: __VLS_ctx.errors.username }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    if (__VLS_ctx.errors.username) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.errors.username);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "email",
        ...{ class: "form-input" },
        ...{ class: ({ error: __VLS_ctx.errors.email }) },
    });
    (__VLS_ctx.userForm.email);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    if (__VLS_ctx.errors.email) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.errors.email);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.userForm.roleId),
        ...{ class: "form-select" },
        ...{ class: ({ error: __VLS_ctx.errors.roleId }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [role] of __VLS_vFor((__VLS_ctx.roles))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (role.roleId),
            value: (role.roleId),
        });
        (__VLS_ctx.capitalize(role.name));
        // @ts-ignore
        [isEditing, userForm, userForm, userForm, userForm, errors, errors, errors, errors, errors, errors, errors, errors, errors, errors, roles, capitalize,];
    }
    if (__VLS_ctx.errors.roleId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.errors.roleId);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.userForm.departmentId),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [userForm, errors, errors, departments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toggle-switch" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-switch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "switch" },
    });
    /** @type {__VLS_StyleScopedClasses['switch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.userForm.isActive);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "slider round" },
    });
    /** @type {__VLS_StyleScopedClasses['slider']} */ ;
    /** @type {__VLS_StyleScopedClasses['round']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-label" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-label']} */ ;
    (__VLS_ctx.userForm.isActive ? 'Active' : 'Inactive');
    if (!__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            type: "password",
            ...{ class: "form-input" },
            ...{ class: ({ error: __VLS_ctx.errors.password }) },
        });
        (__VLS_ctx.userForm.password);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        if (__VLS_ctx.errors.password) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "error-text" },
            });
            /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
            (__VLS_ctx.errors.password);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "form-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.$emit('close-modal');
                // @ts-ignore
                [$emit, isEditing, userForm, userForm, userForm, errors, errors, errors,];
            } },
        type: "button",
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-save" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
    (__VLS_ctx.saving ? 'Saving...' : (__VLS_ctx.isEditing ? 'Update' : 'Create'));
}
if (__VLS_ctx.showResetModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showResetModal))
                    return;
                __VLS_ctx.$emit('close-reset-modal');
                // @ts-ignore
                [$emit, isEditing, saving, saving, showResetModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content reset-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['reset-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showResetModal))
                    return;
                __VLS_ctx.$emit('close-reset-modal');
                // @ts-ignore
                [$emit,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "reset-info" },
    });
    /** @type {__VLS_StyleScopedClasses['reset-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img, __VLS_intrinsics.img)({
        src: (__VLS_ctx.getAvatarUrl(__VLS_ctx.resetUser?.fullName || 'User')),
        ...{ class: "reset-avatar-img" },
    });
    /** @type {__VLS_StyleScopedClasses['reset-avatar-img']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.resetUser?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.resetUser?.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "password",
        ...{ class: "form-input" },
        ...{ class: ({ error: __VLS_ctx.errors.resetPassword }) },
    });
    (__VLS_ctx.resetPasswordData.newPassword);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    if (__VLS_ctx.errors.resetPassword) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.errors.resetPassword);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "password",
        ...{ class: "form-input" },
        ...{ class: ({ error: __VLS_ctx.errors.confirmPassword }) },
    });
    (__VLS_ctx.resetPasswordData.confirmPassword);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    if (__VLS_ctx.errors.confirmPassword) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.errors.confirmPassword);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showResetModal))
                    return;
                __VLS_ctx.$emit('close-reset-modal');
                // @ts-ignore
                [$emit, errors, errors, errors, errors, errors, errors, getAvatarUrl, resetUser, resetUser, resetUser, resetPasswordData, resetPasswordData,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showResetModal))
                    return;
                __VLS_ctx.$emit('reset-password');
                // @ts-ignore
                [$emit,];
            } },
        ...{ class: "btn-save" },
        disabled: (__VLS_ctx.resetting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
    (__VLS_ctx.resetting ? 'Resetting...' : 'Reset');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toast-container" },
});
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
for (const [toast] of __VLS_vFor((__VLS_ctx.toasts))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (toast.id),
        ...{ class: (`toast toast-${toast.type}`) },
    });
    if (toast.type === 'success') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "20 6 9 17 4 12",
        });
    }
    else if (toast.type === 'error') {
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
            x1: "18",
            y1: "6",
            x2: "6",
            y2: "18",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (toast.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('remove-toast', toast.id);
                // @ts-ignore
                [$emit, resetting, resetting, toasts,];
            } },
    });
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        showModal: Boolean,
        showResetModal: Boolean,
        isEditing: Boolean,
        userForm: Object,
        resetUser: Object,
        resetPasswordData: Object,
        roles: Array,
        departments: Array,
        errors: Object,
        saving: Boolean,
        resetting: Boolean,
        toasts: Array
    },
});
export default {};
