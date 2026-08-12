import { ref, reactive, computed } from 'vue';
const props = defineProps({
    t: {
        type: Function,
        required: true
    }
});
const emit = defineEmits([
    'update:documents',
    'file-selected'
]);
// Document files state - Only 3 types
const documentFiles = reactive({
    guaranteeLetter: null,
    employmentLetter: null,
    other: null
});
const otherDocumentName = ref('');
const customDocuments = ref([]);
const customInputRefs = ref({});
// File input refs
const guaranteeLetterInput = ref(null);
const employmentLetterInput = ref(null);
const otherInput = ref(null);
// Computed
const documentCount = computed(() => {
    let count = 0;
    Object.values(documentFiles).forEach(file => {
        if (file)
            count++;
    });
    customDocuments.value.forEach(doc => {
        if (doc.file)
            count++;
    });
    return count;
});
// Methods
const triggerFileUpload = (type) => {
    const inputMap = {
        guaranteeLetter: guaranteeLetterInput,
        employmentLetter: employmentLetterInput,
        other: otherInput
    };
    const input = inputMap[type];
    if (input && input.value) {
        input.value.click();
    }
};
const handleFileUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (!file)
        return;
    if (!validateFile(file)) {
        event.target.value = '';
        return;
    }
    documentFiles[type] = file;
    emit('file-selected', `${file.name} uploaded successfully`, 'success');
    emit('update:documents', getAllDocuments());
    event.target.value = '';
};
const clearOtherDocument = () => {
    documentFiles.other = null;
    otherDocumentName.value = '';
    emit('update:documents', getAllDocuments());
};
const addCustomDocument = () => {
    customDocuments.value.push({
        id: Date.now(),
        name: '',
        file: null
    });
};
const removeCustomDocument = (index) => {
    customDocuments.value.splice(index, 1);
    emit('update:documents', getAllDocuments());
};
const setCustomInputRef = (el, index) => {
    if (el) {
        customInputRefs.value[index] = el;
    }
};
const triggerCustomFileUpload = (index) => {
    const input = customInputRefs.value[index];
    if (input) {
        input.click();
    }
};
const handleCustomFileUpload = (event, index) => {
    const file = event.target.files?.[0];
    if (!file)
        return;
    if (!validateFile(file)) {
        event.target.value = '';
        return;
    }
    customDocuments.value[index].file = file;
    emit('file-selected', `${file.name} uploaded successfully`, 'success');
    emit('update:documents', getAllDocuments());
    event.target.value = '';
};
const validateFile = (file) => {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        emit('file-selected', 'File size must be less than 5MB', 'error');
        return false;
    }
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) &&
        !file.name.endsWith('.pdf') &&
        !file.name.endsWith('.doc') &&
        !file.name.endsWith('.docx') &&
        !file.name.endsWith('.png') &&
        !file.name.endsWith('.jpg') &&
        !file.name.endsWith('.jpeg')) {
        emit('file-selected', 'Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.', 'error');
        return false;
    }
    return true;
};
const getAllDocuments = () => {
    const docs = [];
    // Pre-defined documents
    const docTypes = {
        guaranteeLetter: 'Guarantee Letter',
        employmentLetter: 'Employment Letter',
        other: otherDocumentName.value || 'Other Document'
    };
    Object.entries(documentFiles).forEach(([key, file]) => {
        if (file) {
            docs.push({
                type: key,
                name: docTypes[key] || key,
                file: file
            });
        }
    });
    // Custom documents
    customDocuments.value.forEach(doc => {
        if (doc.file) {
            docs.push({
                type: 'custom',
                name: doc.name || 'Custom Document',
                file: doc.file
            });
        }
    });
    return docs;
};
// Expose for parent component
const __VLS_exposed = {
    getAllDocuments,
    documentFiles,
    customDocuments
};
defineExpose(__VLS_exposed);
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
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-doc-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-doc-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['file-info-note']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-label-group']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scanned-documents-card info-card" },
});
/** @type {__VLS_StyleScopedClasses['scanned-documents-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M4 4h16v16H4V4z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M8 4v16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M16 4v16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M4 8h16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M4 16h16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 4v16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t("documents.otherDocuments") || "Other Documents");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "doc-count-badge" },
});
/** @type {__VLS_StyleScopedClasses['doc-count-badge']} */ ;
(__VLS_ctx.documentCount);
(__VLS_ctx.$t("documents.files") || "files");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scanned-documents-content" },
});
/** @type {__VLS_StyleScopedClasses['scanned-documents-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "section-description" },
});
/** @type {__VLS_StyleScopedClasses['section-description']} */ ;
(__VLS_ctx.$t("documents.otherDocsHint") || "Upload supporting documents such as guarantee letters, employment letters, and other official documents.");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "documents-grid" },
});
/** @type {__VLS_StyleScopedClasses['documents-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "document-upload-item" },
    ...{ class: ({ 'has-file': __VLS_ctx.documentFiles.guaranteeLetter }) },
});
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-icon" },
});
/** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-info" },
});
/** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "doc-label" },
});
/** @type {__VLS_StyleScopedClasses['doc-label']} */ ;
(__VLS_ctx.$t("guarantee.guaranteeLetter") || "Guarantee Letter");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "doc-status" },
});
/** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
(__VLS_ctx.documentFiles.guaranteeLetter ? __VLS_ctx.$t("common.uploaded") : __VLS_ctx.$t("common.missing"));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-actions" },
});
/** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.triggerFileUpload('guaranteeLetter');
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, documentCount, documentFiles, documentFiles, triggerFileUpload,];
        } },
    type: "button",
    ...{ class: "upload-btn" },
    title: (__VLS_ctx.documentFiles.guaranteeLetter ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
});
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
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
    points: "17 8 12 3 7 8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15",
});
if (__VLS_ctx.documentFiles.guaranteeLetter) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    (__VLS_ctx.documentFiles.guaranteeLetter.name);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.handleFileUpload($event, 'guaranteeLetter');
            // @ts-ignore
            [$t, $t, documentFiles, documentFiles, documentFiles, handleFileUpload,];
        } },
    type: "file",
    ref: "guaranteeLetterInput",
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "document-upload-item" },
    ...{ class: ({ 'has-file': __VLS_ctx.documentFiles.employmentLetter }) },
});
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-icon" },
});
/** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-info" },
});
/** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "doc-label" },
});
/** @type {__VLS_StyleScopedClasses['doc-label']} */ ;
(__VLS_ctx.$t("documents.employmentLetter") || "Employment Letter");
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "doc-status" },
});
/** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
(__VLS_ctx.documentFiles.employmentLetter ? __VLS_ctx.$t("common.uploaded") : __VLS_ctx.$t("common.missing"));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-actions" },
});
/** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.triggerFileUpload('employmentLetter');
            // @ts-ignore
            [$t, $t, $t, documentFiles, documentFiles, triggerFileUpload,];
        } },
    type: "button",
    ...{ class: "upload-btn" },
    title: (__VLS_ctx.documentFiles.employmentLetter ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
});
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
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
    points: "17 8 12 3 7 8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15",
});
if (__VLS_ctx.documentFiles.employmentLetter) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    (__VLS_ctx.documentFiles.employmentLetter.name);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.handleFileUpload($event, 'employmentLetter');
            // @ts-ignore
            [$t, $t, documentFiles, documentFiles, documentFiles, handleFileUpload,];
        } },
    type: "file",
    ref: "employmentLetterInput",
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "document-upload-item" },
    ...{ class: ({ 'has-file': __VLS_ctx.documentFiles.other }) },
});
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-icon" },
});
/** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-info" },
});
/** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-label-group" },
});
/** @type {__VLS_StyleScopedClasses['doc-label-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    value: (__VLS_ctx.otherDocumentName),
    placeholder: (__VLS_ctx.$t('documents.otherDocumentName') || 'Other document name...'),
    ...{ class: "doc-name-input" },
});
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "doc-status" },
});
/** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
(__VLS_ctx.documentFiles.other ? __VLS_ctx.$t("common.uploaded") : __VLS_ctx.$t("common.missing"));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "doc-actions" },
});
/** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.triggerFileUpload('other');
            // @ts-ignore
            [$t, $t, $t, documentFiles, documentFiles, triggerFileUpload, otherDocumentName,];
        } },
    type: "button",
    ...{ class: "upload-btn" },
    title: (__VLS_ctx.documentFiles.other ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
});
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
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
    points: "17 8 12 3 7 8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15",
});
if (__VLS_ctx.documentFiles.other || __VLS_ctx.otherDocumentName) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearOtherDocument) },
        type: "button",
        ...{ class: "remove-btn" },
        title: (__VLS_ctx.$t('common.remove')),
    });
    /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
}
if (__VLS_ctx.documentFiles.other) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    (__VLS_ctx.documentFiles.other.name);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.handleFileUpload($event, 'other');
            // @ts-ignore
            [$t, $t, $t, documentFiles, documentFiles, documentFiles, documentFiles, handleFileUpload, otherDocumentName, clearOtherDocument,];
        } },
    type: "file",
    ref: "otherInput",
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addCustomDocument) },
    type: "button",
    ...{ class: "add-doc-btn" },
});
/** @type {__VLS_StyleScopedClasses['add-doc-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12",
});
(__VLS_ctx.$t("common.add"));
(__VLS_ctx.$t("documents.customDocument") || "Custom Document");
for (const [doc, index] of __VLS_vFor((__VLS_ctx.customDocuments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (`custom-${index}`),
        ...{ class: "document-upload-item custom-doc" },
        ...{ class: ({ 'has-file': doc.file }) },
    });
    /** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['custom-doc']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-file']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-info" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (doc.name),
        placeholder: (__VLS_ctx.$t('documents.documentName') || 'Document name...'),
        ...{ class: "doc-name-input" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-status" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
    (doc.file ? __VLS_ctx.$t("common.uploaded") : __VLS_ctx.$t("common.missing"));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.triggerCustomFileUpload(index);
                // @ts-ignore
                [$t, $t, $t, $t, $t, addCustomDocument, customDocuments, triggerCustomFileUpload,];
            } },
        type: "button",
        ...{ class: "upload-btn" },
        title: (doc.file ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
    });
    /** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
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
        points: "17 8 12 3 7 8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "3",
        x2: "12",
        y2: "15",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeCustomDocument(index);
                // @ts-ignore
                [$t, $t, removeCustomDocument,];
            } },
        type: "button",
        ...{ class: "remove-btn" },
        title: (__VLS_ctx.$t('common.remove')),
    });
    /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
    if (doc.file) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (doc.file.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.handleCustomFileUpload($event, index);
                // @ts-ignore
                [$t, handleCustomFileUpload,];
            } },
        ref: (el => __VLS_ctx.setCustomInputRef(el, index)),
        type: "file",
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        ...{ style: {} },
    });
    // @ts-ignore
    [setCustomInputRef,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "file-info-note" },
});
/** @type {__VLS_StyleScopedClasses['file-info-note']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.$t("documents.fileInfo") || "Accepted formats: PDF, JPG, PNG, DOC, DOCX. Max size: 5MB per file.");
// @ts-ignore
[$t,];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
    emits: {},
    props: {
        t: {
            type: Function,
            required: true
        }
    },
});
export default {};
