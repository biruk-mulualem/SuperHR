import { ref, watch } from 'vue';
const props = defineProps({
    showDeleteModal: Boolean,
    employeeToDelete: Object,
    deleting: Boolean,
    showTerminateModal: Boolean,
    employeeToTerminate: Object,
    terminating: Boolean,
    showReactivateModal: Boolean,
    employeeToReactivate: Object,
    reactivating: Boolean,
    toasts: Array
});
const emit = defineEmits([
    'close-delete-modal',
    'delete-employee',
    'remove-toast',
    'close-terminate-modal',
    'confirm-terminate',
    'close-reactivate-modal',
    'confirm-reactivate'
]);
// Toast Modal state
const showToastModal = ref(false);
const toastModalMessage = ref('');
const toastModalType = ref('success');
const toastModalTitle = ref('');
let toastTimeout = null;
// Watch for toasts and show as modal
watch(() => props.toasts, (newToasts) => {
    if (newToasts && newToasts.length > 0) {
        const latestToast = newToasts[newToasts.length - 1];
        showToastModal.value = true;
        toastModalMessage.value = latestToast.message;
        toastModalType.value = latestToast.type || 'success';
        const titles = {
            success: '✅ Success',
            error: '❌ Error',
            warning: '⚠️ Warning',
            info: 'ℹ️ Information'
        };
        toastModalTitle.value = titles[latestToast.type] || 'ℹ️ Information';
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        toastTimeout = setTimeout(() => {
            closeToastModal();
        }, 4000);
    }
}, { deep: true });
const closeToastModal = () => {
    showToastModal.value = false;
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
    }
    if (props.toasts && props.toasts.length > 0) {
        const lastToast = props.toasts[props.toasts.length - 1];
        emit('remove-toast', lastToast.id);
    }
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
/** @type {__VLS_StyleScopedClasses['toast-header']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-header']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-header']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-header']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['terminate-details']} */ ;
/** @type {__VLS_StyleScopedClasses['terminate-details']} */ ;
/** @type {__VLS_StyleScopedClasses['terminate-details']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-terminate']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-terminate']} */ ;
/** @type {__VLS_StyleScopedClasses['reactivate-details']} */ ;
/** @type {__VLS_StyleScopedClasses['reactivate-details']} */ ;
/** @type {__VLS_StyleScopedClasses['reactivate-details']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reactivate']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reactivate']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
if (__VLS_ctx.showDeleteModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal))
                    return;
                __VLS_ctx.$emit('close-delete-modal');
                // @ts-ignore
                [showDeleteModal, $emit,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content delete-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['delete-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.$t('common.deleteEmployee') || 'Delete Employee');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal))
                    return;
                __VLS_ctx.$emit('close-delete-modal');
                // @ts-ignore
                [$emit, $t,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "delete-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "warning-icon" },
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    /** @type {__VLS_StyleScopedClasses['warning-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "8",
        x2: "12",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "16",
        r: "0.5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('messages.deleteConfirm') || 'Delete');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.employeeToDelete?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "delete-warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-warning-text']} */ ;
    (__VLS_ctx.$t('messages.deleteWarning') || 'This action cannot be undone.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal))
                    return;
                __VLS_ctx.$emit('close-delete-modal');
                // @ts-ignore
                [$emit, $t, $t, employeeToDelete,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    (__VLS_ctx.$t('common.cancel') || 'Cancel');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal))
                    return;
                __VLS_ctx.$emit('delete-employee');
                // @ts-ignore
                [$emit, $t,];
            } },
        ...{ class: "btn-delete" },
        disabled: (__VLS_ctx.deleting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
    (__VLS_ctx.deleting ? (__VLS_ctx.$t('common.deleting') || 'Deleting...') : (__VLS_ctx.$t('common.delete') || 'Delete'));
}
if (__VLS_ctx.showTerminateModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTerminateModal))
                    return;
                __VLS_ctx.$emit('close-terminate-modal');
                // @ts-ignore
                [$emit, $t, $t, deleting, deleting, showTerminateModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content terminate-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['terminate-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.$t('common.terminateEmployee') || 'Terminate Employee');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTerminateModal))
                    return;
                __VLS_ctx.$emit('close-terminate-modal');
                // @ts-ignore
                [$emit, $t,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "terminate-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['terminate-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "warning-icon" },
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    /** @type {__VLS_StyleScopedClasses['warning-icon']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "terminate-title" },
    });
    /** @type {__VLS_StyleScopedClasses['terminate-title']} */ ;
    (__VLS_ctx.$t('messages.terminateConfirm') || 'Are you sure you want to terminate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.employeeToTerminate?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "terminate-details" },
    });
    /** @type {__VLS_StyleScopedClasses['terminate-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('messages.terminateWarning') || 'This action will:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_ctx.$t('messages.terminateStatus') || 'Set status to "Terminated"');
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_ctx.$t('messages.terminateDate') || 'Record termination date');
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_ctx.$t('messages.terminateAccount') || 'Deactivate the account');
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
        ...{ class: "text-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['text-danger']} */ ;
    (__VLS_ctx.$t('messages.terminateIrreversible') || '⚠️ This action cannot be undone!');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTerminateModal))
                    return;
                __VLS_ctx.$emit('close-terminate-modal');
                // @ts-ignore
                [$emit, $t, $t, $t, $t, $t, $t, employeeToTerminate,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    (__VLS_ctx.$t('common.cancel') || 'Cancel');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTerminateModal))
                    return;
                __VLS_ctx.$emit('confirm-terminate');
                // @ts-ignore
                [$emit, $t,];
            } },
        ...{ class: "btn-terminate" },
        disabled: (__VLS_ctx.terminating),
    });
    /** @type {__VLS_StyleScopedClasses['btn-terminate']} */ ;
    (__VLS_ctx.terminating ? (__VLS_ctx.$t('common.terminating') || 'Terminating...') : (__VLS_ctx.$t('common.terminate') || 'Terminate'));
}
if (__VLS_ctx.showReactivateModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReactivateModal))
                    return;
                __VLS_ctx.$emit('close-reactivate-modal');
                // @ts-ignore
                [$emit, $t, $t, terminating, terminating, showReactivateModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content reactivate-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['reactivate-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.$t('common.reactivateEmployee') || 'Reactivate Employee');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReactivateModal))
                    return;
                __VLS_ctx.$emit('close-reactivate-modal');
                // @ts-ignore
                [$emit, $t,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "reactivate-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['reactivate-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "success-icon" },
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    /** @type {__VLS_StyleScopedClasses['success-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "12 8 12 12 15 14",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "reactivate-title" },
    });
    /** @type {__VLS_StyleScopedClasses['reactivate-title']} */ ;
    (__VLS_ctx.$t('messages.reactivateConfirm') || 'Reactivate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.employeeToReactivate?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "reactivate-details" },
    });
    /** @type {__VLS_StyleScopedClasses['reactivate-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('messages.reactivateInfo') || 'This action will:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_ctx.$t('messages.reactivateStatus') || 'Set status back to "Active"');
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_ctx.$t('messages.reactivateDate') || 'Clear termination dates');
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_ctx.$t('messages.reactivateAccount') || 'Reactivate the account');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReactivateModal))
                    return;
                __VLS_ctx.$emit('close-reactivate-modal');
                // @ts-ignore
                [$emit, $t, $t, $t, $t, $t, employeeToReactivate,];
            } },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    (__VLS_ctx.$t('common.cancel') || 'Cancel');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showReactivateModal))
                    return;
                __VLS_ctx.$emit('confirm-reactivate');
                // @ts-ignore
                [$emit, $t,];
            } },
        ...{ class: "btn-reactivate" },
        disabled: (__VLS_ctx.reactivating),
    });
    /** @type {__VLS_StyleScopedClasses['btn-reactivate']} */ ;
    (__VLS_ctx.reactivating ? (__VLS_ctx.$t('common.reactivating') || 'Reactivating...') : (__VLS_ctx.$t('common.reactivate') || 'Reactivate'));
}
if (__VLS_ctx.showToastModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeToastModal) },
        ...{ class: "modal-overlay toast-modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    /** @type {__VLS_StyleScopedClasses['toast-modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content toast-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['toast-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header toast-header" },
        ...{ class: (__VLS_ctx.toastModalType) },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['toast-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.toastModalTitle);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToastModal) },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body toast-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    /** @type {__VLS_StyleScopedClasses['toast-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast-icon-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-icon-wrapper']} */ ;
    if (__VLS_ctx.toastModalType === 'success') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "toast-icon success" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['success']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "12",
            r: "10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M8 12l3 3 5-6",
        });
    }
    else if (__VLS_ctx.toastModalType === 'error') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "toast-icon error" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "12",
            r: "10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "15",
            y1: "9",
            x2: "9",
            y2: "15",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "9",
            y1: "9",
            x2: "15",
            y2: "15",
        });
    }
    else if (__VLS_ctx.toastModalType === 'warning') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "toast-icon warning" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['warning']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "12",
            r: "10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "8",
            x2: "12",
            y2: "12",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "16",
            r: "0.5",
            fill: "currentColor",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "toast-icon info" },
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "12",
            r: "10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "12",
            x2: "12",
            y2: "16",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "8",
            x2: "12.01",
            y2: "8",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "toast-message" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
    (__VLS_ctx.toastModalMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToastModal) },
        ...{ class: "toast-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-action-btn']} */ ;
    (__VLS_ctx.$t('common.ok') || 'OK');
}
// @ts-ignore
[$t, $t, $t, reactivating, reactivating, showToastModal, closeToastModal, closeToastModal, closeToastModal, toastModalType, toastModalType, toastModalType, toastModalType, toastModalTitle, toastModalMessage,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        showDeleteModal: Boolean,
        employeeToDelete: Object,
        deleting: Boolean,
        showTerminateModal: Boolean,
        employeeToTerminate: Object,
        terminating: Boolean,
        showReactivateModal: Boolean,
        employeeToReactivate: Object,
        reactivating: Boolean,
        toasts: Array
    },
});
export default {};
