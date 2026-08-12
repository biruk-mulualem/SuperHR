import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";
const router = useRouter();
// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const sortBy = ref('count');
const sortOrder = ref('desc');
const expandedDept = ref(null);
const deptEmployeeSearch = ref({});
const deptEmployeeLoading = ref({});
const deptEmployeeData = ref({});
const lastUpdated = ref(new Date().toLocaleString());
// Transfer Modal State
const showTransferModal = ref(false);
const selectedEmployee = ref(null);
const selectedDept = ref(null);
const transferring = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const transferData = ref({
    toDepartmentId: null,
    transferDateEC: '',
    reason: ''
});
const departments = ref([]);
const pagination = reactive({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
});
let searchTimeout = null;
// ========== COMPUTED ==========
const totalEmployees = computed(() => {
    return departments.value.reduce((sum, d) => sum + d.count, 0);
});
const averagePerDept = computed(() => {
    if (!departments.value.length)
        return '0';
    return (totalEmployees.value / departments.value.length).toFixed(1);
});
const largestDepartment = computed(() => {
    if (!departments.value.length)
        return 'N/A';
    const d = [...departments.value].sort((a, b) => b.count - a.count)[0];
    return `${d.departmentName} (${d.count})`;
});
const smallestDepartment = computed(() => {
    if (!departments.value.length)
        return 'N/A';
    const d = [...departments.value].sort((a, b) => a.count - b.count)[0];
    return `${d.departmentName} (${d.count})`;
});
const filteredDepartments = computed(() => {
    let list = [...departments.value];
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        list = list.filter(d => d.departmentName.toLowerCase().includes(s) ||
            d.departmentCode?.toLowerCase().includes(s));
    }
    list.sort((a, b) => {
        let va, vb;
        switch (sortBy.value) {
            case 'name':
                va = a.departmentName;
                vb = b.departmentName;
                break;
            case 'count':
                va = a.count;
                vb = b.count;
                break;
            case 'percentage':
                va = parseFloat(a.percentage);
                vb = parseFloat(b.percentage);
                break;
            default:
                va = a.count;
                vb = b.count;
        }
        if (typeof va === 'string') {
            return sortOrder.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return sortOrder.value === 'asc' ? va - vb : vb - va;
    });
    return list;
});
const paginatedDepartments = computed(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredDepartments.value.slice(start, start + pagination.limit);
});
const visiblePages = computed(() => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages = [];
    const delta = 2;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - current) <= delta) {
            pages.push(i);
        }
        else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    return pages;
});
// ========== TOAST METHODS ==========
const showToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    setTimeout(() => {
        clearToast();
    }, 5000);
};
const clearToast = () => {
    toastMessage.value = '';
    toastType.value = 'success';
};
// ========== DEPARTMENT EMPLOYEE METHODS ==========
const getDepartmentEmployees = (deptId) => {
    return deptEmployeeData.value[deptId] || [];
};
const getFilteredDepartmentEmployees = (deptId) => {
    const employees = getDepartmentEmployees(deptId);
    const search = deptEmployeeSearch.value[deptId] || '';
    if (!search)
        return employees;
    const s = search.toLowerCase();
    return employees.filter(e => e.fullName?.toLowerCase().includes(s) ||
        e.fullNameEnglish?.toLowerCase().includes(s) ||
        e.employeeId?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.position?.toLowerCase().includes(s));
};
// Load ALL employees when a department is expanded
const loadDepartmentEmployees = async (deptId, search = '') => {
    if (deptEmployeeLoading.value[deptId])
        return;
    deptEmployeeLoading.value[deptId] = true;
    try {
        const response = await employeeService.getDepartmentEmployees({
            departmentId: deptId,
            page: 1,
            limit: 1000,
            search: search
        });
        if (response.success && response.data) {
            const data = response.data;
            deptEmployeeData.value[deptId] = data.employees || [];
        }
    }
    catch (error) {
        console.error('Error loading department employees:', error);
    }
    finally {
        deptEmployeeLoading.value[deptId] = false;
    }
};
// Toggle department expansion
const toggleDepartment = async (deptId) => {
    if (expandedDept.value === deptId) {
        expandedDept.value = null;
        return;
    }
    expandedDept.value = deptId;
    if (!deptEmployeeData.value[deptId] || deptEmployeeData.value[deptId].length === 0) {
        await loadDepartmentEmployees(deptId, '');
    }
};
const searchDepartmentEmployees = (deptId) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const search = deptEmployeeSearch.value[deptId] || '';
        loadDepartmentEmployees(deptId, search);
    }, 300);
};
// ========== TRANSFER MODAL METHODS ==========
const openTransferModal = (employee, department) => {
    selectedEmployee.value = employee;
    selectedDept.value = department;
    // Set current date as default
    const now = new Date();
    const ecYear = now.getFullYear() - 8;
    const ecMonth = String(now.getMonth() + 1).padStart(2, '0');
    const ecDay = String(now.getDate()).padStart(2, '0');
    transferData.value = {
        toDepartmentId: null,
        transferDateEC: `${ecDay}/${ecMonth}/${ecYear}`,
        reason: ''
    };
    showTransferModal.value = true;
};
const closeTransferModal = () => {
    showTransferModal.value = false;
    selectedEmployee.value = null;
    selectedDept.value = null;
    transferring.value = false;
};
const confirmTransfer = async () => {
    if (!transferData.value.toDepartmentId) {
        showToast('Please select a department to transfer to', 'error');
        return;
    }
    if (!transferData.value.transferDateEC) {
        showToast('Please enter a transfer date', 'error');
        return;
    }
    // Validate EC date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(transferData.value.transferDateEC)) {
        showToast('Invalid date format. Use DD/MM/YYYY', 'error');
        return;
    }
    transferring.value = true;
    try {
        const transferPayload = {
            employeeId: selectedEmployee.value.id,
            fromDepartmentId: selectedDept.value.departmentId,
            toDepartmentId: transferData.value.toDepartmentId,
            transferDateEC: transferData.value.transferDateEC,
            reason: transferData.value.reason || 'Department transfer',
            approvedBy: null
        };
        const response = await employeeService.createDepartmentTransfer(transferPayload);
        if (response.success) {
            showToast(`✅ ${selectedEmployee.value.fullName} successfully transferred to new department`, 'success');
            // Refresh data
            await refreshData();
            closeTransferModal();
        }
        else {
            showToast(`❌ Failed to transfer employee: ${response.error || 'Unknown error'}`, 'error');
        }
    }
    catch (error) {
        console.error('Error transferring employee:', error);
        showToast('❌ Failed to transfer employee. Please try again.', 'error');
    }
    finally {
        transferring.value = false;
    }
};
// ========== UTILITY METHODS ==========
const getDepartmentColor = (id) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#d946ef', '#f43f5e'];
    return colors[id % colors.length];
};
const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'];
    let hash = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    return colors[Math.abs(hash) % colors.length];
};
const getInitials = (name) => {
    if (!name)
        return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
const goBack = () => router.push({ name: 'dashboard' });
const viewEmployee = (id) => {
    if (id) {
        router.push(`/employees/${id}`);
    }
};
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.page = 1;
        updatePagination();
    }, 300);
};
const clearSearch = () => {
    searchQuery.value = '';
    pagination.page = 1;
    updatePagination();
};
const applyFilters = () => {
    pagination.page = 1;
    updatePagination();
};
const changePage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
        pagination.page = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
const updatePagination = () => {
    const total = filteredDepartments.value.length;
    pagination.total = total;
    pagination.totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    pagination.hasNextPage = pagination.page < pagination.totalPages;
    pagination.hasPrevPage = pagination.page > 1;
    if (pagination.page > pagination.totalPages)
        pagination.page = pagination.totalPages;
};
// ========== EXPORT FUNCTIONS ==========
const exportDepartment = async (dept) => {
    try {
        const employees = getDepartmentEmployees(dept.departmentId);
        if (employees.length === 0) {
            alert(`No employees found in ${dept.departmentName} department`);
            return;
        }
        let csv = `Department: ${dept.departmentName}\n`;
        csv += `Total Employees: ${employees.length}\n`;
        csv += `Percentage of Total: ${dept.percentage}%\n\n`;
        csv += 'Employee ID,Full Name,English Name,Email,Position\n';
        employees.forEach(emp => {
            csv += `"${emp.employeeId || emp.id || 'N/A'}"`;
            csv += `,"${emp.fullName || 'N/A'}"`;
            csv += `,"${emp.fullNameEnglish || ''}"`;
            csv += `,"${emp.email || 'N/A'}"`;
            csv += `,"${emp.position || 'N/A'}"\n`;
        });
        csv += `\nReport Generated: ${new Date().toLocaleString()}`;
        csv += `\nTotal Employees Exported: ${employees.length}`;
        downloadCSV(csv, `${dept.departmentName}_Employees_All`);
    }
    catch (error) {
        console.error('Error exporting department:', error);
        alert('Failed to export employees');
    }
};
const exportAllDepartments = async () => {
    if (departments.value.length === 0) {
        alert('No departments available to export');
        return;
    }
    try {
        let csv = 'DEPARTMENT DISTRIBUTION REPORT\n';
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Total Departments: ${departments.value.length}\n`;
        csv += `Total Employees: ${totalEmployees.value}\n\n`;
        csv += '='.repeat(80) + '\n\n';
        for (const dept of departments.value) {
            const employees = getDepartmentEmployees(dept.departmentId);
            csv += `DEPARTMENT: ${dept.departmentName}\n`;
            csv += `Employees: ${dept.count} (${dept.percentage}% of total)\n`;
            csv += '-'.repeat(60) + '\n';
            csv += 'Employee ID,Full Name,English Name,Email,Position\n';
            if (employees.length > 0) {
                employees.forEach(emp => {
                    csv += `"${emp.employeeId || emp.id || 'N/A'}"`;
                    csv += `,"${emp.fullName || 'N/A'}"`;
                    csv += `,"${emp.fullNameEnglish || ''}"`;
                    csv += `,"${emp.email || 'N/A'}"`;
                    csv += `,"${emp.position || 'N/A'}"\n`;
                });
            }
            else {
                csv += 'No employees found in this department\n';
            }
            csv += '\n' + '-'.repeat(60) + '\n\n';
        }
        downloadCSV(csv, 'All_Departments_Report_Full');
    }
    catch (error) {
        console.error('Error exporting all departments:', error);
        alert('Failed to export all departments');
    }
};
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
// ========== DATA LOADING ==========
const loadDepartmentData = async () => {
    loading.value = true;
    try {
        const result = await employeeService.getDepartmentDistribution({
            page: pagination.page,
            limit: pagination.limit
        });
        if (result.success && result.data) {
            departments.value = result.data.departments || [];
            lastUpdated.value = new Date().toLocaleString();
            updatePagination();
        }
    }
    catch (error) {
        console.error('Error loading departments:', error);
    }
    finally {
        loading.value = false;
    }
};
const refreshData = async () => {
    deptEmployeeData.value = {};
    deptEmployeeLoading.value = {};
    deptEmployeeSearch.value = {};
    expandedDept.value = null;
    await loadDepartmentData();
};
// ========== LIFECYCLE ==========
onMounted(() => {
    loadDepartmentData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
/** @type {__VLS_StyleScopedClasses['highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
/** @type {__VLS_StyleScopedClasses['highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['department-item']} */ ;
/** @type {__VLS_StyleScopedClasses['department-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-main']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-main']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-emp-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-search']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-item']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-item']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-transfer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-info']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-info']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-cancel-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-confirm-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-confirm-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-num']} */ ;
/** @type {__VLS_StyleScopedClasses['page-num']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['department-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-search']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-main']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-bar-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-header']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-item']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-email']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-confirm-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-cancel-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "department-page" },
});
/** @type {__VLS_StyleScopedClasses['department-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "back-btn" },
});
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 12H5M12 19l-7-7 7-7",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
(__VLS_ctx.totalEmployees);
(__VLS_ctx.departments.length);
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "loading-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-badge']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportAllDepartments) },
    ...{ class: "action-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "action-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-row" },
});
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-box" },
});
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
(__VLS_ctx.departments.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-box" },
});
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
(__VLS_ctx.totalEmployees);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-box" },
});
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
(__VLS_ctx.averagePerDept);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-box highlight" },
});
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
/** @type {__VLS_StyleScopedClasses['highlight']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
(__VLS_ctx.largestDepartment);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-box highlight" },
});
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
/** @type {__VLS_StyleScopedClasses['highlight']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-value']} */ ;
(__VLS_ctx.smallestDepartment);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-box-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-box-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filters-row" },
});
/** @type {__VLS_StyleScopedClasses['filters-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "search-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "11",
    cy: "11",
    r: "8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M21 21l-4.35-4.35",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.debounceSearch) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search departments...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearSearch) },
        ...{ class: "clear-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.applyFilters) },
    value: (__VLS_ctx.sortBy),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "name",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "count",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "percentage",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.applyFilters) },
    value: (__VLS_ctx.sortOrder),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "asc",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "desc",
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "department-list" },
    });
    /** @type {__VLS_StyleScopedClasses['department-list']} */ ;
    for (const [dept] of __VLS_vFor((__VLS_ctx.paginatedDepartments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (dept.departmentId),
            ...{ class: "department-item" },
            ...{ class: ({ expanded: __VLS_ctx.expandedDept === dept.departmentId }) },
        });
        /** @type {__VLS_StyleScopedClasses['department-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['expanded']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.toggleDepartment(dept.departmentId);
                    // @ts-ignore
                    [goBack, totalEmployees, totalEmployees, departments, departments, loading, loading, loading, loading, exportAllDepartments, refreshData, averagePerDept, largestDepartment, smallestDepartment, debounceSearch, searchQuery, searchQuery, clearSearch, applyFilters, applyFilters, sortBy, sortOrder, paginatedDepartments, expandedDept, toggleDepartment,];
                } },
            ...{ class: "dept-main" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-main']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-info" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-name" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (dept.departmentName);
        if (dept.departmentCode) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-code" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-code']} */ ;
            (dept.departmentCode);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-count-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-count-badge']} */ ;
        (dept.count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-percent" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-percent']} */ ;
        (dept.percentage);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-bar-wrap" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-bar-wrap']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-bar-fill" },
            ...{ style: ({
                    width: dept.percentage + '%',
                    background: __VLS_ctx.getDepartmentColor(dept.departmentId)
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['dept-bar-fill']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "expand-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['expand-icon']} */ ;
        (__VLS_ctx.expandedDept === dept.departmentId ? '−' : '+');
        if (__VLS_ctx.expandedDept === dept.departmentId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dept-employees" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-employees']} */ ;
            if (__VLS_ctx.deptEmployeeLoading[dept.departmentId]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "emp-loading" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-loading']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "spinner-small" },
                });
                /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "emp-header" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-header']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.getDepartmentEmployees(dept.departmentId).length);
                (dept.departmentName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "emp-header-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-header-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.expandedDept === dept.departmentId))
                                return;
                            if (!!(__VLS_ctx.deptEmployeeLoading[dept.departmentId]))
                                return;
                            __VLS_ctx.searchDepartmentEmployees(dept.departmentId);
                            // @ts-ignore
                            [expandedDept, expandedDept, getDepartmentColor, deptEmployeeLoading, getDepartmentEmployees, searchDepartmentEmployees,];
                        } },
                    type: "text",
                    value: (__VLS_ctx.deptEmployeeSearch[dept.departmentId]),
                    placeholder: "Search by name, English name, or ID...",
                    ...{ class: "emp-search" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-search']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.expandedDept === dept.departmentId))
                                return;
                            if (!!(__VLS_ctx.deptEmployeeLoading[dept.departmentId]))
                                return;
                            __VLS_ctx.exportDepartment(dept);
                            // @ts-ignore
                            [deptEmployeeSearch, exportDepartment,];
                        } },
                    ...{ class: "export-emp-btn" },
                });
                /** @type {__VLS_StyleScopedClasses['export-emp-btn']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "emp-list-scroll" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-list-scroll']} */ ;
                for (const [emp] of __VLS_vFor((__VLS_ctx.getFilteredDepartmentEmployees(dept.departmentId)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (emp.id),
                        ...{ class: "emp-item" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-item']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "emp-avatar" },
                        ...{ style: ({ background: __VLS_ctx.getAvatarColor(emp.fullName) }) },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-avatar']} */ ;
                    (__VLS_ctx.getInitials(emp.fullName));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "emp-details" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-details']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "emp-name-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-name-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "emp-name" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-name']} */ ;
                    (emp.fullName || 'N/A');
                    if (emp.fullNameEnglish) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "emp-name-english" },
                        });
                        /** @type {__VLS_StyleScopedClasses['emp-name-english']} */ ;
                        (emp.fullNameEnglish);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "emp-meta-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-meta-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "emp-id" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-id']} */ ;
                    (emp.employeeId || emp.id);
                    if (emp.position) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "emp-position" },
                        });
                        /** @type {__VLS_StyleScopedClasses['emp-position']} */ ;
                        (emp.position);
                    }
                    if (emp.email) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "emp-email" },
                        });
                        /** @type {__VLS_StyleScopedClasses['emp-email']} */ ;
                        (emp.email);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "emp-actions" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-actions']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!(__VLS_ctx.expandedDept === dept.departmentId))
                                    return;
                                if (!!(__VLS_ctx.deptEmployeeLoading[dept.departmentId]))
                                    return;
                                __VLS_ctx.viewEmployee(emp.id);
                                // @ts-ignore
                                [getFilteredDepartmentEmployees, getAvatarColor, getInitials, viewEmployee,];
                            } },
                        ...{ class: "emp-view-btn" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-view-btn']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!(__VLS_ctx.expandedDept === dept.departmentId))
                                    return;
                                if (!!(__VLS_ctx.deptEmployeeLoading[dept.departmentId]))
                                    return;
                                __VLS_ctx.openTransferModal(emp, dept);
                                // @ts-ignore
                                [openTransferModal,];
                            } },
                        ...{ class: "emp-transfer-btn" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-transfer-btn']} */ ;
                    // @ts-ignore
                    [];
                }
                if (__VLS_ctx.getFilteredDepartmentEmployees(dept.departmentId).length === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "emp-empty" },
                    });
                    /** @type {__VLS_StyleScopedClasses['emp-empty']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "emp-footer" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-footer']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "emp-total-count" },
                });
                /** @type {__VLS_StyleScopedClasses['emp-total-count']} */ ;
                (__VLS_ctx.getFilteredDepartmentEmployees(dept.departmentId).length);
                (__VLS_ctx.getDepartmentEmployees(dept.departmentId).length);
            }
        }
        // @ts-ignore
        [getDepartmentEmployees, getFilteredDepartmentEmployees, getFilteredDepartmentEmployees,];
    }
    if (__VLS_ctx.filteredDepartments.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
                    // @ts-ignore
                    [filteredDepartments, pagination, pagination, changePage,];
                } },
            disabled: (!__VLS_ctx.pagination.hasPrevPage),
            ...{ class: "page-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        for (const [page] of __VLS_vFor((__VLS_ctx.visiblePages))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.pagination.totalPages > 1))
                            return;
                        __VLS_ctx.changePage(page);
                        // @ts-ignore
                        [pagination, changePage, visiblePages,];
                    } },
                key: (page),
                ...{ class: (['page-num', { active: page === __VLS_ctx.pagination.page }]) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['page-num']} */ ;
            (page);
            // @ts-ignore
            [pagination,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
                    // @ts-ignore
                    [pagination, changePage,];
                } },
            disabled: (!__VLS_ctx.pagination.hasNextPage),
            ...{ class: "page-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.pagination.page);
        (__VLS_ctx.pagination.totalPages);
    }
}
if (__VLS_ctx.showTransferModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeTransferModal) },
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeTransferModal) },
        ...{ class: "modal-close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "transfer-info" },
    });
    /** @type {__VLS_StyleScopedClasses['transfer-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedEmployee?.fullName || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedDept?.departmentName || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.transferData.toDepartmentId),
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
            disabled: (dept.departmentId === __VLS_ctx.selectedEmployee?.departmentId),
        });
        (dept.departmentName);
        (dept.count);
        // @ts-ignore
        [departments, pagination, pagination, pagination, showTransferModal, closeTransferModal, closeTransferModal, selectedEmployee, selectedEmployee, selectedDept, transferData,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.transferData.transferDateEC),
        placeholder: "DD/MM/YYYY",
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.transferData.reason),
        placeholder: "Reason for department change",
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeTransferModal) },
        ...{ class: "modal-cancel-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-cancel-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmTransfer) },
        ...{ class: "modal-confirm-btn" },
        disabled: (__VLS_ctx.transferring),
    });
    /** @type {__VLS_StyleScopedClasses['modal-confirm-btn']} */ ;
    (__VLS_ctx.transferring ? 'Transferring...' : 'Confirm Transfer');
}
if (__VLS_ctx.toastMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast-container" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (['toast', __VLS_ctx.toastType]) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.toastMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearToast) },
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-footer" },
});
/** @type {__VLS_StyleScopedClasses['page-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.lastUpdated);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.totalEmployees);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.departments.length);
// @ts-ignore
[totalEmployees, departments, closeTransferModal, transferData, transferData, confirmTransfer, transferring, transferring, toastMessage, toastMessage, toastType, clearToast, lastUpdated,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
