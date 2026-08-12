import { ref, computed, onMounted, onUnmounted } from "vue";
import payrollService from "@/stores/payrollService";
import penaltySummaryService from "@/stores/penaltySummaryService";
const departments = ["IT", "Finance", "Operations", "HR"];
// State
const penaltiesList = ref([]);
const loading = ref(false);
const reductionHistory = ref([]);
const penaltyDateFrom = ref("");
const penaltyDateTo = ref("");
const applyingReduction = ref(false);
const penaltySearch = ref("");
const penaltyDeptFilter = ref("all");
const penaltyPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const showPenaltyReductionModal = ref(false);
const showPenaltyDetailModal = ref(false);
const showEditReductionModal = ref(false);
const showDeleteConfirmModal = ref(false);
const showImportModal = ref(false);
const selectedPenaltyEmployee = ref(null);
const selectedDetailEmployee = ref(null);
const penaltyPercentReduction = ref(0);
const penaltyOtherReduction = ref(0);
const penaltyAssetReduction = ref(0);
const penaltyReductionReason = ref("");
const editingReduction = ref(null);
const editingReductionIndex = ref(-1);
const editingReductionAmount = ref(0);
const editingReductionReason = ref("");
const deletingReduction = ref(null);
const deletingReductionIndex = ref(-1);
const savingEdit = ref(false);
const deleting = ref(false);
const exportingPenalty = ref(false);
const importing = ref(false);
const importPreview = ref([]);
const importErrors = ref([]);
const fileInput = ref(null);
const isCurrentMonth = ref(false);
const isLastMonth = ref(false);
const isNextMonth = ref(false);
let searchTimeout = null;
// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
// Computed
const dateRangeLabel = computed(() => {
    if (penaltyDateFrom.value && penaltyDateTo.value)
        return `${formatDate(penaltyDateFrom.value)} - ${formatDate(penaltyDateTo.value)}`;
    if (penaltyDateFrom.value)
        return `From ${formatDate(penaltyDateFrom.value)}`;
    if (penaltyDateTo.value)
        return `Until ${formatDate(penaltyDateTo.value)}`;
    return "All Time";
});
const filteredPenaltiesList = computed(() => penaltiesList.value);
const paginatedPenaltiesList = computed(() => {
    const start = (penaltyPagination.value.page - 1) * penaltyPagination.value.limit;
    return filteredPenaltiesList.value.slice(start, start + penaltyPagination.value.limit);
});
const penaltiesTotalAmount = computed(() => filteredPenaltiesList.value.reduce((sum, p) => sum + (p.totalPenaltyAmount || 0), 0));
// Helpers
function formatCurrency(amt) { return payrollService.formatCurrency(amt); }
function formatDate(d) { if (!d)
    return ''; return payrollService.formatDate(d); }
function getInitials(name) { if (!name)
    return "?"; return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function showToastMessage(msg, type) { toastMessage.value = msg; toastType.value = type; showToast.value = true; setTimeout(() => { showToast.value = false; }, 3000); }
function downloadCSV(data, filename) { const csv = data.map(row => row.join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function formatDateValue(date) { return date.toISOString().split('T')[0]; }
function clearMonthFilters() { isCurrentMonth.value = false; isLastMonth.value = false; isNextMonth.value = false; }
// Status Functions
function getStatusText(penalty) {
    const hasPercent = penalty.percentPenalty > 0, hasAsset = penalty.assetPenalty > 0, hasOther = penalty.otherPenalty > 0;
    if (!hasPercent && !hasAsset && !hasOther)
        return "No Penalties";
    const statuses = [];
    if (hasPercent)
        statuses.push("Has %");
    if (hasAsset)
        statuses.push("Has Asset");
    if (hasOther)
        statuses.push("Has Other");
    return statuses.join(", ");
}
function getStatusClass(penalty) { return (penalty.percentPenalty > 0 || penalty.assetPenalty > 0 || penalty.otherPenalty > 0) ? 'status-warning' : 'status-success'; }
function getDetailStatusText(type) { return "Active"; }
function getDetailStatusClass(type) { return 'status-active'; }
// Month Filters
function setMonthFilter(type) {
    const now = new Date();
    let startDate, endDate;
    if (type === 'current') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        isCurrentMonth.value = true;
        isLastMonth.value = false;
        isNextMonth.value = false;
    }
    else if (type === 'last') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        isCurrentMonth.value = false;
        isLastMonth.value = true;
        isNextMonth.value = false;
    }
    else if (type === 'next') {
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        isCurrentMonth.value = false;
        isLastMonth.value = false;
        isNextMonth.value = true;
    }
    penaltyDateFrom.value = formatDateValue(startDate);
    penaltyDateTo.value = formatDateValue(endDate);
    loadPenaltyData();
}
// Load Data
async function loadPenaltyData() {
    loading.value = true;
    penaltyPagination.value.page = 1;
    try {
        const response = await penaltySummaryService.getPenaltySummary({
            fromDate: penaltyDateFrom.value || undefined,
            toDate: penaltyDateTo.value || undefined,
            department: penaltyDeptFilter.value !== 'all' ? penaltyDeptFilter.value : undefined,
            search: penaltySearch.value || undefined,
            page: penaltyPagination.value.page,
            limit: penaltyPagination.value.limit
        });
        if (response.success && response.data) {
            penaltiesList.value = response.data.map(item => ({
                id: item.id, employeeId: item.id, employeeCode: item.employeeCode, employeeName: item.employeeName,
                department: item.department, percentPenalty: item.percentPenalty || 0, assetPenalty: item.assetPenalty || 0,
                otherPenalty: item.otherPenalty || 0, totalPenaltyAmount: item.totalPenalty || 0,
                summary: item.summary || { percent: { original: 0, deducted: 0, current: 0, status: 'active' }, asset: { original: 0, deducted: 0, current: 0, status: 'active' }, other: { original: 0, deducted: 0, current: 0, status: 'active' } }
            }));
            penaltyPagination.value.total = response.pagination?.total || 0;
            penaltyPagination.value.totalPages = response.pagination?.totalPages || 1;
        }
        else {
            penaltiesList.value = [];
        }
    }
    catch (error) {
        console.error("Load penalty data error:", error);
        penaltiesList.value = [];
    }
    finally {
        loading.value = false;
    }
}
function debouncedSearch() { if (searchTimeout)
    clearTimeout(searchTimeout); searchTimeout = setTimeout(() => loadPenaltyData(), 500); }
function onDateRangeChange() { clearMonthFilters(); loadPenaltyData(); }
function clearDateRange() { penaltyDateFrom.value = ""; penaltyDateTo.value = ""; clearMonthFilters(); loadPenaltyData(); }
// Detail Modal
async function openPenaltyDetailModal(penalty) {
    selectedDetailEmployee.value = penalty;
    try {
        const response = await penaltySummaryService.getReductionHistory(penalty.id, { fromDate: penaltyDateFrom.value, toDate: penaltyDateTo.value });
        if (response.success && response.data) {
            reductionHistory.value = response.data.map(item => ({ id: item.id, type: item.type, amount: item.amount, isPercent: item.isPercent, reason: item.reason, processedBy: item.processedBy, date: item.date }));
        }
        else {
            reductionHistory.value = [];
        }
    }
    catch (error) {
        console.error("Load history error:", error);
        reductionHistory.value = [];
    }
    showPenaltyDetailModal.value = true;
}
// Reduction Functions
function openPenaltyReductionModal(penalty) { selectedPenaltyEmployee.value = { ...penalty }; penaltyPercentReduction.value = 0; penaltyOtherReduction.value = 0; penaltyAssetReduction.value = 0; penaltyReductionReason.value = ""; showPenaltyReductionModal.value = true; }
function validatePercentReduction() { const max = selectedPenaltyEmployee.value?.percentPenalty || 0; if (penaltyPercentReduction.value > max)
    penaltyPercentReduction.value = max; if (penaltyPercentReduction.value < 0)
    penaltyPercentReduction.value = 0; }
function validateOtherReduction() { const max = selectedPenaltyEmployee.value?.otherPenalty || 0; if (penaltyOtherReduction.value > max)
    penaltyOtherReduction.value = max; if (penaltyOtherReduction.value < 0)
    penaltyOtherReduction.value = 0; }
function validateAssetReduction() { const max = selectedPenaltyEmployee.value?.assetPenalty || 0; if (penaltyAssetReduction.value > max)
    penaltyAssetReduction.value = max; if (penaltyAssetReduction.value < 0)
    penaltyAssetReduction.value = 0; }
async function applyPenaltyReductionToEmployee() {
    if (!selectedPenaltyEmployee.value)
        return;
    const percentReduction = penaltyPercentReduction.value, otherReduction = penaltyOtherReduction.value, assetReduction = penaltyAssetReduction.value;
    if (percentReduction === 0 && otherReduction === 0 && assetReduction === 0) {
        showToastMessage("No reduction values entered", "error");
        return;
    }
    const employeeId = selectedPenaltyEmployee.value.id || selectedPenaltyEmployee.value.employeeId;
    if (!employeeId) {
        showToastMessage("Employee ID not found", "error");
        return;
    }
    if (!penaltyReductionReason.value.trim()) {
        showToastMessage("Please provide a reason for the reduction", "error");
        return;
    }
    applyingReduction.value = true;
    try {
        const results = [], errors = [];
        if (percentReduction > 0) {
            const resp = await penaltySummaryService.applyPenaltyReduction(employeeId, { deductionPercentage: percentReduction, reason: penaltyReductionReason.value, processedBy: "HR Admin", periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `RED-${Date.now()}-${employeeId}-percent` });
            if (resp.success)
                results.push(`% reduced by ${percentReduction}%`);
            else
                errors.push(`Percent: ${resp.error}`);
        }
        if (otherReduction > 0) {
            const resp = await penaltySummaryService.applyPenaltyReduction(employeeId, { deductionAmount: otherReduction, penaltyType: 'other', reason: penaltyReductionReason.value, processedBy: "HR Admin", periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `RED-${Date.now()}-${employeeId}-other` });
            if (resp.success)
                results.push(`Other reduced by ${formatCurrency(otherReduction)}`);
            else
                errors.push(`Other: ${resp.error}`);
        }
        if (assetReduction > 0) {
            const resp = await penaltySummaryService.applyPenaltyReduction(employeeId, { deductionAmount: assetReduction, penaltyType: 'asset', reason: penaltyReductionReason.value, processedBy: "HR Admin", periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `RED-${Date.now()}-${employeeId}-asset` });
            if (resp.success)
                results.push(`Asset reduced by ${formatCurrency(assetReduction)}`);
            else
                errors.push(`Asset: ${resp.error}`);
        }
        if (results.length > 0) {
            showToastMessage(`Penalty reduced for ${selectedPenaltyEmployee.value.employeeName}: ${results.join(", ")}`, errors.length > 0 ? "warning" : "success");
            showPenaltyReductionModal.value = false;
            await loadPenaltyData();
        }
        else {
            showToastMessage("No reductions were applied", "error");
        }
    }
    catch (error) {
        console.error("Apply reduction error:", error);
        showToastMessage("Failed to apply reduction", "error");
    }
    finally {
        applyingReduction.value = false;
    }
}
// Edit/Delete Reduction Functions
function editReduction(record, index) { editingReduction.value = { ...record }; editingReductionIndex.value = index; editingReductionAmount.value = record.amount; editingReductionReason.value = record.reason; showEditReductionModal.value = true; }
function deleteReduction(record, index) { deletingReduction.value = record; deletingReductionIndex.value = index; showDeleteConfirmModal.value = true; }
async function saveEditedReduction() {
    if (editingReductionAmount.value <= 0) {
        showToastMessage("Reduction amount must be greater than 0", "error");
        return;
    }
    savingEdit.value = true;
    try {
        const response = await penaltySummaryService.updateReduction(selectedDetailEmployee.value.id, editingReduction.value.id, { amount: editingReductionAmount.value, reason: editingReductionReason.value, type: editingReduction.value.type });
        if (response.success) {
            showToastMessage("Reduction updated successfully!", "success");
            showEditReductionModal.value = false;
            await openPenaltyDetailModal(selectedDetailEmployee.value);
            await loadPenaltyData();
        }
        else {
            showToastMessage(response.error || "Failed to update reduction", "error");
        }
    }
    catch (error) {
        console.error("Update reduction error:", error);
        showToastMessage("Failed to update reduction", "error");
    }
    finally {
        savingEdit.value = false;
    }
}
async function confirmDeleteReduction() {
    deleting.value = true;
    try {
        const response = await penaltySummaryService.deleteReduction(selectedDetailEmployee.value.id, deletingReduction.value.id);
        if (response.success) {
            showToastMessage("Reduction deleted successfully!", "success");
            showDeleteConfirmModal.value = false;
            await openPenaltyDetailModal(selectedDetailEmployee.value);
            await loadPenaltyData();
        }
        else {
            showToastMessage(response.error || "Failed to delete reduction", "error");
        }
    }
    catch (error) {
        console.error("Delete reduction error:", error);
        showToastMessage("Failed to delete reduction", "error");
    }
    finally {
        deleting.value = false;
    }
}
// Import Functions
function openImportModal() { showImportModal.value = true; importPreview.value = []; importErrors.value = []; if (fileInput.value)
    fileInput.value.value = ''; }
function closeImportModal() { showImportModal.value = false; importPreview.value = []; importErrors.value = []; }
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file)
        return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showToastMessage('Please upload a CSV file', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToastMessage('File size must be less than 5MB', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => { parseCSVAndPreview(e.target.result); };
    reader.readAsText(file);
}
function parseCSVAndPreview(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const expectedHeaders = ['Employee Code', 'Employee Name', 'Department', 'Penalty %', 'Asset Penalty (ETB)', 'Other Penalty (ETB)'];
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        showToastMessage(`Missing columns: ${missingHeaders.join(', ')}`, 'error');
        return;
    }
    const preview = [], errors = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim())
            continue;
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        if (values.length < headers.length)
            continue;
        const employeeCode = values[headers.indexOf('Employee Code')];
        const employeeName = values[headers.indexOf('Employee Name')];
        const department = values[headers.indexOf('Department')];
        const percentPenalty = parseFloat(values[headers.indexOf('Penalty %')]) || 0;
        const assetPenalty = parseFloat(values[headers.indexOf('Asset Penalty (ETB)')]) || 0;
        const otherPenalty = parseFloat(values[headers.indexOf('Other Penalty (ETB)')]) || 0;
        if (!employeeCode) {
            errors.push(`Row ${i}: Missing employee code`);
            continue;
        }
        const employee = penaltiesList.value.find(e => e.employeeCode === employeeCode);
        if (!employee) {
            errors.push(`Row ${i}: Employee ${employeeCode} not found`);
            continue;
        }
        preview.push({ row: i, employeeId: employee.id, employeeCode, employeeName, department, percentPenalty, assetPenalty, otherPenalty, originalPercent: employee.percentPenalty, originalAsset: employee.assetPenalty, originalOther: employee.otherPenalty });
    }
    if (errors.length > 0)
        importErrors.value = errors;
    importPreview.value = preview;
    if (preview.length === 0 && errors.length === 0)
        showToastMessage('No valid records found in the file', 'error');
    else if (preview.length > 0)
        showToastMessage(`Loaded ${preview.length} records for preview`, 'success');
}
async function confirmImport() {
    if (importPreview.value.length === 0) {
        showToastMessage('No records to import', 'error');
        return;
    }
    importing.value = true;
    let successCount = 0, errorCount = 0;
    try {
        for (const record of importPreview.value) {
            const percentReduction = record.originalPercent - record.percentPenalty;
            const assetReduction = record.originalAsset - record.assetPenalty;
            const otherReduction = record.originalOther - record.otherPenalty;
            if (percentReduction > 0) {
                const resp = await penaltySummaryService.applyPenaltyReduction(record.employeeId, { deductionPercentage: percentReduction, reason: 'Bulk import from CSV', processedBy: 'HR Admin', periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `IMPORT-${Date.now()}-${record.employeeCode}-percent` });
                if (resp.success)
                    successCount++;
                else
                    errorCount++;
            }
            if (assetReduction > 0) {
                const resp = await penaltySummaryService.applyPenaltyReduction(record.employeeId, { deductionAmount: assetReduction, penaltyType: 'asset', reason: 'Bulk import from CSV', processedBy: 'HR Admin', periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `IMPORT-${Date.now()}-${record.employeeCode}-asset` });
                if (resp.success)
                    successCount++;
                else
                    errorCount++;
            }
            if (otherReduction > 0) {
                const resp = await penaltySummaryService.applyPenaltyReduction(record.employeeId, { deductionAmount: otherReduction, penaltyType: 'other', reason: 'Bulk import from CSV', processedBy: 'HR Admin', periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `IMPORT-${Date.now()}-${record.employeeCode}-other` });
                if (resp.success)
                    successCount++;
                else
                    errorCount++;
            }
        }
        showToastMessage(`Import completed: ${successCount} reductions applied, ${errorCount} failed`, errorCount > 0 ? 'warning' : 'success');
        closeImportModal();
        await loadPenaltyData();
    }
    catch (error) {
        console.error('Import error:', error);
        showToastMessage('Failed to process import', 'error');
    }
    finally {
        importing.value = false;
    }
}
// Export Function
async function exportPenaltySummary() {
    exportingPenalty.value = true;
    try {
        const headers = ["Employee Code", "Employee Name", "Department", "Penalty %", "Asset Penalty (ETB)", "Other Penalty (ETB)"];
        const rows = filteredPenaltiesList.value.map(p => [p.employeeCode, p.employeeName, p.department, p.percentPenalty || 0, p.assetPenalty || 0, p.otherPenalty || 0]);
        rows.push(["", "", "TOTAL", "", penaltiesTotalAmount.value, ""]);
        downloadCSV([headers, ...rows], `penalty_summary_${new Date().toISOString().slice(0, 10)}.csv`);
        showToastMessage("Penalty summary exported!", "success");
    }
    catch (error) {
        showToastMessage("Failed to export penalty summary", "error");
    }
    finally {
        exportingPenalty.value = false;
    }
}
// Pagination
function changePenaltyPage(page) { penaltyPagination.value.page = page; loadPenaltyData(); }
function changePenaltyLimit() { penaltyPagination.value.page = 1; penaltyPagination.value.limit = parseInt(penaltyPagination.value.limit); loadPenaltyData(); }
// Refresh Handler
function handleRefreshAllTabs() { loadPenaltyData(); }
// Init
function init() {
    const now = new Date();
    penaltyDateFrom.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    penaltyDateTo.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    isCurrentMonth.value = true;
    loadPenaltyData();
}
onMounted(() => { init(); window.addEventListener('refresh-all-tabs', handleRefreshAllTabs); });
onUnmounted(() => { window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs); if (searchTimeout)
    clearTimeout(searchTimeout); });
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['history-edit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['history-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-month-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-month-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card-small']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card-small']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card-small']} */ ;
/** @type {__VLS_StyleScopedClasses['status-active']} */ ;
/** @type {__VLS_StyleScopedClasses['reduction-history']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-dates']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-row']} */ ;
/** @type {__VLS_StyleScopedClasses['range-input']} */ ;
/** @type {__VLS_StyleScopedClasses['reduction-input']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-rule-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-rule-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['date-range-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-header']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-row']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-penalty-config-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['date-range-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.dateRangeLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-filters" },
});
/** @type {__VLS_StyleScopedClasses['header-filters']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openImportModal) },
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportPenaltySummary) },
    ...{ class: "btn-export" },
    disabled: (__VLS_ctx.exportingPenalty || __VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
if (__VLS_ctx.exportingPenalty) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.exportingPenalty ? "Exporting..." : "Export");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filters-bar" },
});
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.debouncedSearch) },
    type: "text",
    value: (__VLS_ctx.penaltySearch),
    placeholder: "Search employee...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.loadPenaltyData) },
    value: (__VLS_ctx.penaltyDeptFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept),
        value: (dept),
    });
    (dept);
    // @ts-ignore
    [dateRangeLabel, openImportModal, loading, loading, exportPenaltySummary, exportingPenalty, exportingPenalty, exportingPenalty, debouncedSearch, penaltySearch, loadPenaltyData, penaltyDeptFilter, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-months" },
});
/** @type {__VLS_StyleScopedClasses['quick-months']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setMonthFilter('current');
            // @ts-ignore
            [setMonthFilter,];
        } },
    ...{ class: "quick-month-btn" },
    ...{ class: ({ active: __VLS_ctx.isCurrentMonth }) },
});
/** @type {__VLS_StyleScopedClasses['quick-month-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setMonthFilter('last');
            // @ts-ignore
            [setMonthFilter, isCurrentMonth,];
        } },
    ...{ class: "quick-month-btn" },
    ...{ class: ({ active: __VLS_ctx.isLastMonth }) },
});
/** @type {__VLS_StyleScopedClasses['quick-month-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setMonthFilter('next');
            // @ts-ignore
            [setMonthFilter, isLastMonth,];
        } },
    ...{ class: "quick-month-btn" },
    ...{ class: ({ active: __VLS_ctx.isNextMonth }) },
});
/** @type {__VLS_StyleScopedClasses['quick-month-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "date-range-filter" },
});
/** @type {__VLS_StyleScopedClasses['date-range-filter']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "date-input-group" },
});
/** @type {__VLS_StyleScopedClasses['date-input-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "date-label" },
});
/** @type {__VLS_StyleScopedClasses['date-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.onDateRangeChange) },
    type: "date",
    ...{ class: "date-input" },
});
(__VLS_ctx.penaltyDateFrom);
/** @type {__VLS_StyleScopedClasses['date-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "date-input-group" },
});
/** @type {__VLS_StyleScopedClasses['date-input-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "date-label" },
});
/** @type {__VLS_StyleScopedClasses['date-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.onDateRangeChange) },
    type: "date",
    ...{ class: "date-input" },
});
(__VLS_ctx.penaltyDateTo);
/** @type {__VLS_StyleScopedClasses['date-input']} */ ;
if (__VLS_ctx.penaltyDateFrom || __VLS_ctx.penaltyDateTo) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearDateRange) },
        ...{ class: "btn-clear-dates" },
        title: "Clear date range",
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-dates']} */ ;
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-container" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "payroll-table penalty-table" },
    });
    /** @type {__VLS_StyleScopedClasses['payroll-table']} */ ;
    /** @type {__VLS_StyleScopedClasses['penalty-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-right" },
    });
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [penalty, idx] of __VLS_vFor((__VLS_ctx.paginatedPenaltiesList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (penalty.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-info" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (penalty.employeeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-code" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
        (penalty.employeeCode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (penalty.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center percent-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['percent-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-orange" },
        });
        /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
        (penalty.percentPenalty || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right asset-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['asset-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-blue" },
        });
        /** @type {__VLS_StyleScopedClasses['text-blue']} */ ;
        (__VLS_ctx.formatCurrency(penalty.assetPenalty || 0));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right other-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['other-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-purple" },
        });
        /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
        (__VLS_ctx.formatCurrency(penalty.otherPenalty || 0));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge" },
            ...{ class: (__VLS_ctx.getStatusClass(penalty)) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.getStatusText(penalty));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openPenaltyReductionModal(penalty);
                    // @ts-ignore
                    [loading, isNextMonth, onDateRangeChange, onDateRangeChange, penaltyDateFrom, penaltyDateFrom, penaltyDateTo, penaltyDateTo, clearDateRange, paginatedPenaltiesList, formatCurrency, formatCurrency, getStatusClass, getStatusText, openPenaltyReductionModal,];
                } },
            ...{ class: "btn-small primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        /** @type {__VLS_StyleScopedClasses['primary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openPenaltyDetailModal(penalty);
                    // @ts-ignore
                    [openPenaltyDetailModal,];
                } },
            ...{ class: "btn-small info" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        /** @type {__VLS_StyleScopedClasses['info']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.filteredPenaltiesList.length === 0 && !__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "8",
            ...{ class: "empty-state-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-content" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.dateRangeLabel);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "empty-sub" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-sub']} */ ;
    }
}
if (__VLS_ctx.penaltyPagination.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.penaltyPagination.totalPages > 1))
                    return;
                __VLS_ctx.changePenaltyPage(__VLS_ctx.penaltyPagination.page - 1);
                // @ts-ignore
                [dateRangeLabel, loading, filteredPenaltiesList, penaltyPagination, penaltyPagination, changePenaltyPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.penaltyPagination.page === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.penaltyPagination.page);
    (__VLS_ctx.penaltyPagination.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.penaltyPagination.totalPages > 1))
                    return;
                __VLS_ctx.changePenaltyPage(__VLS_ctx.penaltyPagination.page + 1);
                // @ts-ignore
                [penaltyPagination, penaltyPagination, penaltyPagination, penaltyPagination, changePenaltyPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.penaltyPagination.page === __VLS_ctx.penaltyPagination.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.changePenaltyLimit) },
        value: (__VLS_ctx.penaltyPagination.limit),
        ...{ class: "limit-select" },
    });
    /** @type {__VLS_StyleScopedClasses['limit-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (10),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (20),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (50),
    });
}
if (__VLS_ctx.showPenaltyReductionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPenaltyReductionModal))
                    return;
                __VLS_ctx.showPenaltyReductionModal = false;
                // @ts-ignore
                [penaltyPagination, penaltyPagination, penaltyPagination, changePenaltyLimit, showPenaltyReductionModal, showPenaltyReductionModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container penalty-reduction-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['penalty-reduction-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedPenaltyEmployee?.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPenaltyReductionModal))
                    return;
                __VLS_ctx.showPenaltyReductionModal = false;
                // @ts-ignore
                [showPenaltyReductionModal, selectedPenaltyEmployee,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "current-penalty-info" },
    });
    /** @type {__VLS_StyleScopedClasses['current-penalty-info']} */ ;
    if (__VLS_ctx.selectedPenaltyEmployee?.percentPenalty > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-orange" },
        });
        /** @type {__VLS_StyleScopedClasses['text-orange']} */ ;
        (__VLS_ctx.selectedPenaltyEmployee?.percentPenalty || 0);
    }
    if (__VLS_ctx.selectedPenaltyEmployee?.assetPenalty > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-blue" },
        });
        /** @type {__VLS_StyleScopedClasses['text-blue']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedPenaltyEmployee?.assetPenalty || 0));
    }
    if (__VLS_ctx.selectedPenaltyEmployee?.otherPenalty > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-row" },
        });
        /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: "text-purple" },
        });
        /** @type {__VLS_StyleScopedClasses['text-purple']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedPenaltyEmployee?.otherPenalty || 0));
    }
    if (__VLS_ctx.selectedPenaltyEmployee?.percentPenalty > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.selectedPenaltyEmployee?.percentPenalty || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.validatePercentReduction) },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: (__VLS_ctx.selectedPenaltyEmployee?.percentPenalty),
            step: "1",
            placeholder: "Enter percentage to reduce",
        });
        (__VLS_ctx.penaltyPercentReduction);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "input-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
        (Math.max(0, (__VLS_ctx.selectedPenaltyEmployee?.percentPenalty || 0) - __VLS_ctx.penaltyPercentReduction));
    }
    if (__VLS_ctx.selectedPenaltyEmployee?.otherPenalty > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedPenaltyEmployee?.otherPenalty || 0));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.validateOtherReduction) },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: (__VLS_ctx.selectedPenaltyEmployee?.otherPenalty),
            step: "1",
            placeholder: "Enter amount to reduce",
        });
        (__VLS_ctx.penaltyOtherReduction);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "input-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
        (__VLS_ctx.formatCurrency(Math.max(0, (__VLS_ctx.selectedPenaltyEmployee?.otherPenalty || 0) - __VLS_ctx.penaltyOtherReduction)));
    }
    if (__VLS_ctx.selectedPenaltyEmployee?.assetPenalty > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedPenaltyEmployee?.assetPenalty || 0));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (__VLS_ctx.validateAssetReduction) },
            type: "number",
            ...{ class: "form-input" },
            min: "0",
            max: (__VLS_ctx.selectedPenaltyEmployee?.assetPenalty),
            step: "1",
            placeholder: "Enter amount to reduce",
        });
        (__VLS_ctx.penaltyAssetReduction);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "input-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
        (__VLS_ctx.formatCurrency(Math.max(0, (__VLS_ctx.selectedPenaltyEmployee?.assetPenalty || 0) - __VLS_ctx.penaltyAssetReduction)));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.penaltyReductionReason),
        ...{ class: "form-textarea" },
        rows: "2",
        placeholder: "Enter reason for penalty reduction...",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPenaltyReductionModal))
                    return;
                __VLS_ctx.showPenaltyReductionModal = false;
                // @ts-ignore
                [formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, showPenaltyReductionModal, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, selectedPenaltyEmployee, validatePercentReduction, penaltyPercentReduction, penaltyPercentReduction, validateOtherReduction, penaltyOtherReduction, penaltyOtherReduction, validateAssetReduction, penaltyAssetReduction, penaltyAssetReduction, penaltyReductionReason,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.applyPenaltyReductionToEmployee) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.applyingReduction),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.applyingReduction) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
}
if (__VLS_ctx.showPenaltyDetailModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPenaltyDetailModal))
                    return;
                __VLS_ctx.showPenaltyDetailModal = false;
                // @ts-ignore
                [applyPenaltyReductionToEmployee, applyingReduction, applyingReduction, showPenaltyDetailModal, showPenaltyDetailModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container penalty-detail-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['penalty-detail-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedDetailEmployee?.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPenaltyDetailModal))
                    return;
                __VLS_ctx.showPenaltyDetailModal = false;
                // @ts-ignore
                [showPenaltyDetailModal, selectedDetailEmployee,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-summary-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-summary-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-small percent" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-title" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-value']} */ ;
    (__VLS_ctx.selectedDetailEmployee?.percentPenalty || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-status" },
        ...{ class: (__VLS_ctx.getDetailStatusClass('percent')) },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-status']} */ ;
    (__VLS_ctx.getDetailStatusText('percent'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-small asset" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['asset']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-title" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedDetailEmployee?.assetPenalty || 0));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-status" },
        ...{ class: (__VLS_ctx.getDetailStatusClass('asset')) },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-status']} */ ;
    (__VLS_ctx.getDetailStatusText('asset'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-small other" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['other']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-title" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedDetailEmployee?.otherPenalty || 0));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-card-status" },
        ...{ class: (__VLS_ctx.getDetailStatusClass('other')) },
    });
    /** @type {__VLS_StyleScopedClasses['detail-card-status']} */ ;
    (__VLS_ctx.getDetailStatusText('other'));
    if (__VLS_ctx.reductionHistory.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "reduction-history" },
        });
        /** @type {__VLS_StyleScopedClasses['reduction-history']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-list" },
        });
        /** @type {__VLS_StyleScopedClasses['history-list']} */ ;
        for (const [record, idx] of __VLS_vFor((__VLS_ctx.reductionHistory))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "history-item" },
            });
            /** @type {__VLS_StyleScopedClasses['history-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-date" },
            });
            /** @type {__VLS_StyleScopedClasses['history-date']} */ ;
            (__VLS_ctx.formatDate(record.date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-details" },
            });
            /** @type {__VLS_StyleScopedClasses['history-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "history-type" },
            });
            /** @type {__VLS_StyleScopedClasses['history-type']} */ ;
            (record.type);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "history-amount" },
            });
            /** @type {__VLS_StyleScopedClasses['history-amount']} */ ;
            (record.amount);
            (record.isPercent ? '%' : 'ETB');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-reason" },
            });
            /** @type {__VLS_StyleScopedClasses['history-reason']} */ ;
            (record.reason);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-by" },
            });
            /** @type {__VLS_StyleScopedClasses['history-by']} */ ;
            (record.processedBy);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showPenaltyDetailModal))
                            return;
                        if (!(__VLS_ctx.reductionHistory.length > 0))
                            return;
                        __VLS_ctx.editReduction(record, idx);
                        // @ts-ignore
                        [formatCurrency, formatCurrency, selectedDetailEmployee, selectedDetailEmployee, selectedDetailEmployee, getDetailStatusClass, getDetailStatusClass, getDetailStatusClass, getDetailStatusText, getDetailStatusText, getDetailStatusText, reductionHistory, reductionHistory, formatDate, editReduction,];
                    } },
                ...{ class: "history-edit-btn" },
                title: "Edit Reduction",
            });
            /** @type {__VLS_StyleScopedClasses['history-edit-btn']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showPenaltyDetailModal))
                            return;
                        if (!(__VLS_ctx.reductionHistory.length > 0))
                            return;
                        __VLS_ctx.deleteReduction(record, idx);
                        // @ts-ignore
                        [deleteReduction,];
                    } },
                ...{ class: "history-delete-btn" },
                title: "Delete Reduction",
            });
            /** @type {__VLS_StyleScopedClasses['history-delete-btn']} */ ;
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-history" },
        });
        /** @type {__VLS_StyleScopedClasses['no-history']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPenaltyDetailModal))
                    return;
                __VLS_ctx.showPenaltyDetailModal = false;
                // @ts-ignore
                [showPenaltyDetailModal,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showEditReductionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showEditReductionModal))
                    return;
                __VLS_ctx.showEditReductionModal = false;
                // @ts-ignore
                [showEditReductionModal, showEditReductionModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container edit-reduction-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['edit-reduction-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingReduction?.type);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showEditReductionModal))
                    return;
                __VLS_ctx.showEditReductionModal = false;
                // @ts-ignore
                [showEditReductionModal, editingReduction,];
            } },
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        ...{ class: "form-input" },
        min: "0",
        step: "1",
        placeholder: "Enter new reduction amount",
    });
    (__VLS_ctx.editingReductionAmount);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.editingReductionReason),
        ...{ class: "form-textarea" },
        rows: "2",
        placeholder: "Enter reason for this reduction...",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showEditReductionModal))
                    return;
                __VLS_ctx.showEditReductionModal = false;
                // @ts-ignore
                [showEditReductionModal, editingReductionAmount, editingReductionReason,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveEditedReduction) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingEdit),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.savingEdit) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
}
if (__VLS_ctx.showDeleteConfirmModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteConfirmModal))
                    return;
                __VLS_ctx.showDeleteConfirmModal = false;
                // @ts-ignore
                [saveEditedReduction, savingEdit, savingEdit, showDeleteConfirmModal, showDeleteConfirmModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container delete-confirm-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['delete-confirm-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteConfirmModal))
                    return;
                __VLS_ctx.showDeleteConfirmModal = false;
                // @ts-ignore
                [showDeleteConfirmModal,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deletingReduction?.type);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deletingReduction?.amount);
    (__VLS_ctx.deletingReduction?.isPercent ? '%' : 'ETB');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.deletingReduction?.reason);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteConfirmModal))
                    return;
                __VLS_ctx.showDeleteConfirmModal = false;
                // @ts-ignore
                [showDeleteConfirmModal, deletingReduction, deletingReduction, deletingReduction, deletingReduction,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmDeleteReduction) },
        ...{ class: "btn-danger" },
        disabled: (__VLS_ctx.deleting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
    if (__VLS_ctx.deleting) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
}
if (__VLS_ctx.showImportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeImportModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container import-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['import-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeImportModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleFileUpload) },
        type: "file",
        ref: "fileInput",
        accept: ".csv",
        ...{ class: "file-input" },
    });
    /** @type {__VLS_StyleScopedClasses['file-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
    if (__VLS_ctx.importPreview.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['import-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        (__VLS_ctx.importPreview.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-table-container" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-table-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "preview-table" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [item, idx] of __VLS_vFor((__VLS_ctx.importPreview.slice(0, 5)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (idx),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.employeeCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.employeeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (item.percentPenalty);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatCurrency(item.assetPenalty));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatCurrency(item.otherPenalty));
            // @ts-ignore
            [formatCurrency, formatCurrency, confirmDeleteReduction, deleting, deleting, showImportModal, closeImportModal, closeImportModal, handleFileUpload, importPreview, importPreview, importPreview,];
        }
        if (__VLS_ctx.importPreview.length > 5) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "preview-more" },
            });
            /** @type {__VLS_StyleScopedClasses['preview-more']} */ ;
            (__VLS_ctx.importPreview.length - 5);
        }
    }
    if (__VLS_ctx.importErrors.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "import-errors" },
        });
        /** @type {__VLS_StyleScopedClasses['import-errors']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        (__VLS_ctx.importErrors.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "errors-list" },
        });
        /** @type {__VLS_StyleScopedClasses['errors-list']} */ ;
        for (const [error, idx] of __VLS_vFor((__VLS_ctx.importErrors))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "error-item" },
            });
            /** @type {__VLS_StyleScopedClasses['error-item']} */ ;
            (error);
            // @ts-ignore
            [importPreview, importPreview, importErrors, importErrors, importErrors,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeImportModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmImport) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.importing || __VLS_ctx.importPreview.length === 0),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.importing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.importPreview.length);
    }
}
if (__VLS_ctx.showToast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.toastMessage);
}
// @ts-ignore
[closeImportModal, importPreview, importPreview, confirmImport, importing, importing, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
