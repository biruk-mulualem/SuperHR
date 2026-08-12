import { ref } from 'vue';
import EmployeesService from '@/stores/employee';
const props = defineProps({
    context: {
        type: Object,
        required: true
    }
});
const emit = defineEmits(['close', 'uploaded']);
const fileInput = ref(null);
const selectedFile = ref(null);
const isUploading = ref(false);
const triggerFileInput = () => {
    fileInput.value?.click();
};
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
    }
};
const uploadFile = async () => {
    if (!selectedFile.value)
        return;
    isUploading.value = true;
    try {
        // Determine document type based on context
        let documentType = 'certificate';
        if (props.context.type === 'basic_info') {
            documentType = 'national_id_card';
        }
        else if (props.context.type === 'spouse') {
            documentType = 'marriage_certificate';
        }
        else if (props.context.type === 'child') {
            documentType = 'birth_certificate';
        }
        else if (props.context.type === 'education') {
            documentType = 'education_certificate';
        }
        else if (props.context.type === 'training') {
            documentType = 'training_certificate';
        }
        else if (props.context.type === 'work') {
            documentType = 'experience_letter';
        }
        else if (props.context.type === 'parent') {
            documentType = 'parent_support_document';
        }
        else if (props.context.type === 'nationality') {
            documentType = 'naturalization_certificate';
        }
        // Upload to existing employee (you'll need employeeId)
        // For new employee, store temp and upload after creation
        const formData = new FormData();
        formData.append('document', selectedFile.value);
        formData.append('documentType', documentType);
        // This assumes you have an endpoint for temporary uploads
        // Or you can return the file info and save documentId after employee is created
        const result = await EmployeesService.uploadDocumentTemp(formData);
        if (result.success) {
            emit('uploaded', {
                documentId: result.data.documentId,
                fileUrl: result.data.fileUrl
            });
        }
        else {
            throw new Error(result.error);
        }
    }
    catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload file');
    }
    finally {
        isUploading.value = false;
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
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "modal-overlay" },
});
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: () => { } },
    ...{ class: "modal-container" },
});
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal-header" },
});
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "modal-close" },
});
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal-body" },
});
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.triggerFileInput) },
    ...{ class: "upload-zone" },
});
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "7 10 12 15 17 10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "15",
    x2: "12",
    y2: "3",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleFileSelect) },
    type: "file",
    ref: "fileInput",
    accept: ".pdf,.jpg,.jpeg,.png",
    ...{ style: {} },
});
if (__VLS_ctx.selectedFile) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "selected-file" },
    });
    /** @type {__VLS_StyleScopedClasses['selected-file']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.selectedFile.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedFile))
                    return;
                __VLS_ctx.selectedFile = null;
                // @ts-ignore
                [triggerFileInput, handleFileSelect, selectedFile, selectedFile, selectedFile,];
            } },
        ...{ class: "remove-file" },
    });
    /** @type {__VLS_StyleScopedClasses['remove-file']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal-footer" },
});
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.uploadFile) },
    ...{ class: "btn-primary" },
    disabled: (!__VLS_ctx.selectedFile || __VLS_ctx.isUploading),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
(__VLS_ctx.isUploading ? 'Uploading...' : 'Upload');
// @ts-ignore
[selectedFile, uploadFile, isUploading, isUploading,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        context: {
            type: Object,
            required: true
        }
    },
});
export default {};
