import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import * as XLSX from 'xlsx';
import EmployeesService from '@/stores/employee';
const { t } = useI18n();
const props = defineProps({
    show: Boolean
});
const emit = defineEmits(['update:show', 'import', 'toast']);
const file = ref(null);
const isImporting = ref(false);
const importResults = ref(null);
const fileInput = ref(null);
const triggerFileInput = () => fileInput.value?.click();
const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
        file.value = selectedFile;
        importResults.value = null;
        emit('toast', `📁 ${t('import.fileSelected') || 'File selected'}: ${selectedFile.name}`, 'success');
    }
};
const importEmployees = async () => {
    if (!file.value)
        return;
    isImporting.value = true;
    importResults.value = null;
    try {
        const formData = new FormData();
        formData.append('file', file.value);
        const result = await EmployeesService.importEmployeesFromExcel(formData);
        if (result.success && result.data) {
            importResults.value = result.data;
            let message = `✅ Import completed: ${result.data.successCount} successful`;
            if (result.data.failedCount > 0) {
                message += `, ${result.data.failedCount} failed`;
                emit('toast', message, 'warning');
            }
            else {
                emit('toast', message, 'success');
            }
            emit('update:show', false);
            emit('import', result.data);
        }
        else {
            emit('toast', result.error || 'Import failed', 'error');
        }
    }
    catch (error) {
        console.error('Import error:', error);
        emit('toast', error.message || 'Failed to import employees', 'error');
    }
    finally {
        isImporting.value = false;
        file.value = null;
        if (fileInput.value)
            fileInput.value.value = '';
    }
};
// ✅ Generate Excel file with data and reference sheets
const downloadTemplate = async () => {
    try {
        // ========== FETCH REFERENCE DATA ==========
        // Fetch departments
        const deptResponse = await EmployeesService.getDepartments();
        const departments = deptResponse?.data?.data || deptResponse?.data || [];
        // Fetch positions
        const posResponse = await EmployeesService.getPositions();
        const positions = posResponse?.data?.data || posResponse?.data || [];
        // Employment types
        const employmentTypes = [
            { id: 'full-time', nameAm: 'ሙሉ ጊዜ', nameEn: 'Full Time' },
            { id: 'part-time', nameAm: 'የትርፍ ጊዜ', nameEn: 'Part Time' },
            { id: 'contract', nameAm: 'ውል', nameEn: 'Contract' },
            { id: 'intern', nameAm: 'ተለማማጅ', nameEn: 'Intern' }
        ];
        // ========== SHEET 1: EMPLOYEES (Data Entry) ==========
        // Headers - includes positionId but NOT managerId
        const headers = [
            ['ስም', 'የአባት ስም', 'የአያት ስም', 'የእንግሊዝኛ ሙሉ ስም', 'ኢሜይል', 'የግል ኢሜይል', 'ስልክ',
                'የትውልድ ቀን', 'ፆታ', 'የጋብቻ ሁኔታ', 'ዜግነት', 'ክፍል መለያ',
                'ሹመት መለያ', 'የሥራ ዓይነት', 'የተቀጠረበት ቀን',
                'መሰረታዊ ደሞዝ', 'የቤት አበል', 'የሹመት አበል', 'የትራንስፖርት አበል',
                'አድራሻ', 'የሥራ ቦታ']
        ];
        // Sample data with ETHIOPIAN dates (DD/MM/YYYY)
        const sampleData = [
            ['ብሩክ', 'ታደሰ', 'አድማሱ', 'Biruk Tadese Admasu', 'biruk@email.com', '', '+251911000001',
                '15/02/1992', 'male', 'single', 'ኢትዮጵያዊ',
                departments.length > 0 ? departments[0]?.departmentId || 1 : 1,
                positions.length > 0 ? positions[0]?.positionId || 1 : 1,
                'full-time',
                '25/05/2001', '15000', '3000', '2250', '1500', 'አዲስ አበባ, ኢትዮጵያ', 'ዋና መሥሪያ ቤት'],
            ['ሰላም', 'አለሙ', 'ተስፋዬ', 'Selam Alemu Tesfaye', 'selam@email.com', '', '+251911000002',
                '23/03/1988', 'female', 'married', 'ኢትዮጵያዊ',
                departments.length > 1 ? departments[1]?.departmentId || 2 : 2,
                positions.length > 1 ? positions[1]?.positionId || 2 : 2,
                'contract',
                '08/09/2001', '20000', '4000', '3000', '2000', 'ባህር ዳር, ኢትዮጵያ', 'ቅርንጫፍ ቢሮ']
        ];
        // Create Data Entry worksheet
        const wsData = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
        wsData['!cols'] = headers[0].map(() => ({ wch: 22 }));
        // ========== SHEET 2: REFERENCES ==========
        const refData = [];
        // --- Departments Section ---
        refData.push(['=== ዲፓርትመንቶች / DEPARTMENTS ===']);
        refData.push([]);
        refData.push(['መለያ (ID)', 'ስም (Amharic)', 'ስም (English)', 'ኮድ (Code)']);
        if (departments.length > 0) {
            departments.forEach(d => {
                refData.push([
                    d.departmentId || d.id || '',
                    d.nameAm || d.name_am || d.name || '',
                    d.name || '',
                    d.code || ''
                ]);
            });
        }
        else {
            refData.push(['1', 'ሰብአዊ ሀብት', 'Human Resources', 'HR']);
            refData.push(['2', 'የአይቲ', 'IT', 'IT']);
            refData.push(['3', 'ፋይናንስ', 'Finance', 'FIN']);
        }
        refData.push([]);
        refData.push([]);
        // --- Positions Section ---
        refData.push(['=== ሹመቶች / POSITIONS ===']);
        refData.push([]);
        refData.push(['መለያ (ID)', 'ሹመት (Amharic)', 'ሹመት (English)', 'ደረጃ (Level)']);
        if (positions.length > 0) {
            positions.forEach(p => {
                refData.push([
                    p.positionId || p.id || '',
                    p.titleAm || p.title_am || p.title || '',
                    p.title || '',
                    p.level || ''
                ]);
            });
        }
        else {
            refData.push(['1', 'ሥራ አስኪያጅ', 'Manager', 'Senior']);
            refData.push(['2', 'ባለሙያ', 'Specialist', 'Mid']);
            refData.push(['3', 'ጁኒየር', 'Junior', 'Junior']);
        }
        refData.push([]);
        refData.push([]);
        // --- Employment Types Section ---
        refData.push(['=== የሥራ ዓይነቶች / EMPLOYMENT TYPES ===']);
        refData.push([]);
        refData.push(['መለያ (ID)', 'ዓይነት (Amharic)', 'ዓይነት (English)']);
        employmentTypes.forEach(e => {
            refData.push([e.id, e.nameAm, e.nameEn]);
        });
        refData.push([]);
        refData.push([]);
        // --- Gender Section ---
        refData.push(['=== ፆታ / GENDER ===']);
        refData.push([]);
        refData.push(['መለያ (ID)', 'ፆታ (Amharic)', 'ፆታ (English)']);
        refData.push(['male', 'ወንድ', 'Male']);
        refData.push(['female', 'ሴት', 'Female']);
        refData.push(['other', 'ሌላ', 'Other']);
        refData.push([]);
        refData.push([]);
        // --- Marital Status Section ---
        refData.push(['=== የጋብቻ ሁኔታ / MARITAL STATUS ===']);
        refData.push([]);
        refData.push(['መለያ (ID)', 'ሁኔታ (Amharic)', 'ሁኔታ (English)']);
        refData.push(['single', 'ያላገባ', 'Single']);
        refData.push(['married', 'ያገባ', 'Married']);
        refData.push(['divorced', 'የተፋታ', 'Divorced']);
        refData.push(['widowed', 'የባለትዳር ሞት', 'Widowed']);
        // Create References worksheet
        const wsRef = XLSX.utils.aoa_to_sheet(refData);
        wsRef['!cols'] = [
            { wch: 20 },
            { wch: 30 },
            { wch: 30 },
            { wch: 15 }
        ];
        // ========== CREATE WORKBOOK ==========
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsData, 'Employees');
        XLSX.utils.book_append_sheet(wb, wsRef, 'References');
        // ========== GENERATE AND DOWNLOAD ==========
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employee_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    catch (error) {
        console.error('Error generating template:', error);
        emit('toast', 'Failed to generate template. Please try again.', 'error');
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
/** @type {__VLS_StyleScopedClasses['excel-info']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['result-row']} */ ;
/** @type {__VLS_StyleScopedClasses['result-row']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
if (__VLS_ctx.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.show))
                    return;
                __VLS_ctx.$emit('update:show', false);
                // @ts-ignore
                [show, $emit,];
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
    (__VLS_ctx.t('import.title') || 'Import Employees');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.show))
                    return;
                __VLS_ctx.$emit('update:show', false);
                // @ts-ignore
                [$emit, t,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "excel-info" },
    });
    /** @type {__VLS_StyleScopedClasses['excel-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.t('import.requiredColumns') || 'Required columns:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.t('import.optionalColumns') || 'Optional columns:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['highlight']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['highlight']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
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
    if (!__VLS_ctx.file) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.t('import.clickToUpload') || 'Click to upload Excel file');
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: {} },
        });
        (__VLS_ctx.file.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    (__VLS_ctx.t('import.supportedFormat') || 'Supported format: .xlsx, .xls');
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleFileSelect) },
        type: "file",
        ref: "fileInput",
        accept: ".xlsx,.xls",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadTemplate) },
        ...{ class: "template-link" },
    });
    /** @type {__VLS_StyleScopedClasses['template-link']} */ ;
    (__VLS_ctx.t('import.downloadTemplate') || 'Download template');
    if (__VLS_ctx.importResults) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-results" },
        });
        /** @type {__VLS_StyleScopedClasses['import-results']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "result-row success" },
        });
        /** @type {__VLS_StyleScopedClasses['result-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['success']} */ ;
        (__VLS_ctx.t('import.successful') || 'Successful');
        (__VLS_ctx.importResults.successCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "result-row fail" },
        });
        /** @type {__VLS_StyleScopedClasses['result-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['fail']} */ ;
        (__VLS_ctx.t('import.failed') || 'Failed');
        (__VLS_ctx.importResults.failedCount);
        if (__VLS_ctx.importResults.failedCount > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "failed-list" },
            });
            /** @type {__VLS_StyleScopedClasses['failed-list']} */ ;
            for (const [fail, idx] of __VLS_vFor((__VLS_ctx.importResults.failed.slice(0, 3)))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (idx),
                    ...{ class: "fail-item" },
                });
                /** @type {__VLS_StyleScopedClasses['fail-item']} */ ;
                (fail.data?.email || 'Row');
                (fail.error);
                // @ts-ignore
                [t, t, t, t, t, t, t, triggerFileInput, file, file, handleFileSelect, downloadTemplate, importResults, importResults, importResults, importResults, importResults,];
            }
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.show))
                    return;
                __VLS_ctx.$emit('update:show', false);
                // @ts-ignore
                [$emit,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    (__VLS_ctx.t('common.cancel') || 'Cancel');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.importEmployees) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.file || __VLS_ctx.isImporting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.isImporting ? (__VLS_ctx.t('common.importing') || 'Importing...') : (__VLS_ctx.t('common.import') || 'Import'));
}
// @ts-ignore
[t, t, t, file, importEmployees, isImporting, isImporting,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        show: Boolean
    },
});
export default {};
