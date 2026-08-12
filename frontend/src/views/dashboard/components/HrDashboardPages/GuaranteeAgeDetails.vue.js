import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import employeeService from '@/stores/employee';
const router = useRouter();
// State
const loading = ref(false);
const departments = ref([]);
const allEmployees = ref([]);
const summary = ref({
    totalGuarantees: 0,
    totalEmployeesWithGuarantees: 0,
    averageAgeMonths: 0,
    oldestAgeMonths: 0,
    youngestAgeMonths: 0,
    totalEmployees: 0,
    employeesWithoutGuarantees: 0,
    guaranteeDistribution: {
        zero: 0,
        one: 0,
        two: 0,
        twoPlus: 0
    }
});
const departmentFilter = ref('all');
const searchQuery = ref('');
const ageRangeFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(20);
// Renew Modal State
const showRenewModal = ref(false);
const selectedEmployee = ref(null);
const newDateEC = ref('');
const dateError = ref('');
const saving = ref(false);
// Toast State
const toast = ref({
    show: false,
    type: 'success',
    message: ''
});
// Age ranges for filter dropdown
const ageRanges = ref([]);
// ========== COMPUTED ==========
const filteredEmployees = computed(() => {
    let employees = allEmployees.value || [];
    if (ageRangeFilter.value !== 'all') {
        const range = ageRanges.value.find(r => r.label === ageRangeFilter.value);
        if (range) {
            employees = employees.filter(e => e.ageInMonths >= range.min && e.ageInMonths <= range.max);
        }
    }
    if (searchQuery.value.trim()) {
        const search = searchQuery.value.toLowerCase().trim();
        employees = employees.filter(e => {
            const amharicMatch = e.fullName?.toLowerCase().includes(search);
            const englishMatch = e.fullNameEnglish?.toLowerCase().includes(search);
            const codeMatch = e.employeeCode?.toLowerCase().includes(search);
            const deptMatch = e.department?.toLowerCase().includes(search);
            const positionMatch = e.position?.toLowerCase().includes(search);
            return amharicMatch || englishMatch || codeMatch || deptMatch || positionMatch;
        });
    }
    return employees;
});
const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredEmployees.value.slice(start, end);
});
const totalPages = computed(() => {
    return Math.ceil(filteredEmployees.value.length / pageSize.value);
});
// ========== TOAST METHODS ==========
const showToast = (message, type = 'success') => {
    toast.value = {
        show: true,
        type,
        message
    };
    setTimeout(() => {
        toast.value.show = false;
    }, 3000);
};
// ========== RENEW MODAL METHODS ==========
const openRenewModal = (employee) => {
    selectedEmployee.value = employee;
    newDateEC.value = '';
    dateError.value = '';
    showRenewModal.value = true;
};
const closeRenewModal = () => {
    if (saving.value)
        return;
    showRenewModal.value = false;
    selectedEmployee.value = null;
    newDateEC.value = '';
    dateError.value = '';
};
const validateDate = (date) => {
    if (!date || date.trim() === '') {
        return 'Date is required';
    }
    const pattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!pattern.test(date)) {
        return 'Invalid format. Use DD/MM/YYYY';
    }
    const parts = date.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return 'Invalid date values';
    }
    if (day < 1 || day > 30) {
        return 'Day must be between 1 and 30';
    }
    if (month < 1 || month > 13) {
        return 'Month must be between 1 and 13 (Ethiopian calendar has 13 months)';
    }
    if (year < 1900 || year > 2100) {
        return 'Year must be between 1900 and 2100';
    }
    return null;
};
const saveRenewal = async () => {
    // Validate date
    const error = validateDate(newDateEC.value);
    if (error) {
        dateError.value = error;
        return;
    }
    dateError.value = '';
    saving.value = true;
    try {
        const employeeData = await employeeService.getEmployeeById(selectedEmployee.value.id);
        if (!employeeData.success || !employeeData.data) {
            throw new Error('Could not fetch employee data');
        }
        const employee = employeeData.data;
        const guaranteeInfo = employee.guaranteeInfo || [];
        // Find which guarantor this is
        let targetIndex = -1;
        // Try to find by confirmedDateEC first
        if (selectedEmployee.value.confirmedDateEC) {
            targetIndex = guaranteeInfo.findIndex(g => g.confirmedDateEC === selectedEmployee.value.confirmedDateEC);
        }
        // If not found, try by guarantorName
        if (targetIndex === -1 && selectedEmployee.value.guarantorName) {
            targetIndex = guaranteeInfo.findIndex(g => g.guarantorName === selectedEmployee.value.guarantorName);
        }
        // If still not found, use the first one
        if (targetIndex === -1 && guaranteeInfo.length > 0) {
            targetIndex = 0;
        }
        if (targetIndex === -1) {
            throw new Error('Could not find the guarantee record to update');
        }
        // ✅ UPDATE BOTH DATES - confirmedDateEC (for age calculation) AND guaranteeLetterDateEC (for reference)
        guaranteeInfo[targetIndex].confirmedDateEC = newDateEC.value; // ✅ Primary for age calculation
        guaranteeInfo[targetIndex].guaranteeLetterDateEC = newDateEC.value; // For reference
        // Update the employee with new guarantee info
        const updateData = {
            guaranteeInfo: guaranteeInfo
        };
        const result = await employeeService.updateEmployee(selectedEmployee.value.id, updateData);
        if (result.success) {
            showToast('✅ Guarantee date updated successfully!', 'success');
            closeRenewModal();
            setTimeout(() => loadData(), 500);
        }
        else {
            throw new Error(result.error || 'Update failed');
        }
    }
    catch (error) {
        console.error('Error updating guarantee date:', error);
        showToast('❌ ' + (error.message || 'Failed to update guarantee date'), 'error');
    }
    finally {
        saving.value = false;
    }
};
// ========== METHODS ==========
const loadData = async () => {
    loading.value = true;
    try {
        const response = await employeeService.getGuaranteeAgeDetails({
            departmentId: departmentFilter.value === 'all' ? 'all' : departmentFilter.value,
            search: searchQuery.value,
            ageRange: ageRangeFilter.value,
            includeDetails: 'true',
            page: currentPage.value,
            limit: pageSize.value
        });
        console.log('📥 Details Response:', response);
        if (response && response.data && response.data.success && response.data.data) {
            const payload = response.data.data;
            const distribution = payload.distribution || [];
            summary.value = payload.summary || {};
            allEmployees.value = payload.employees || [];
            ageRanges.value = distribution.map(range => ({
                ...range,
                min: range.months === 1 ? 0 : range.months - 2,
                max: range.months === 13 ? Infinity : range.months
            }));
            if (payload.pagination) {
                currentPage.value = payload.pagination.page || 1;
                pageSize.value = payload.pagination.limit || 20;
            }
        }
    }
    catch (error) {
        console.error('Error loading guarantee age details:', error);
    }
    finally {
        loading.value = false;
    }
};
const loadDepartments = async () => {
    try {
        const res = await employeeService.getDepartmentDistribution();
        if (res.success && res.data) {
            departments.value = res.data.departments || [];
        }
    }
    catch (error) {
        console.error('Error loading departments:', error);
    }
};
const onFilterChange = () => {
    currentPage.value = 1;
    loadData();
};
const onSearch = () => {
    currentPage.value = 1;
    loadData();
};
const onRangeFilterChange = () => {
    currentPage.value = 1;
    loadData();
};
const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        loadData();
    }
};
const getRowIndex = (index) => {
    return index + 1 + (currentPage.value - 1) * pageSize.value;
};
const getInitials = (name) => {
    if (!name)
        return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
const getAgeBarColor = (months) => {
    if (months <= 1)
        return '#10b981';
    if (months <= 3)
        return '#34d399';
    if (months <= 6)
        return '#fbbf24';
    if (months <= 9)
        return '#f59e0b';
    if (months <= 12)
        return '#ef4444';
    return '#dc2626';
};
const getAgeBadgeClass = (months) => {
    if (months <= 1)
        return 'age-fresh';
    if (months <= 3)
        return 'age-recent';
    if (months <= 6)
        return 'age-moderate';
    if (months <= 9)
        return 'age-aging';
    if (months <= 12)
        return 'age-old';
    return 'age-very-old';
};
const getAgeCategoryLabel = (months) => {
    if (months <= 1)
        return '1 Month';
    if (months <= 3)
        return '3 Months';
    if (months <= 6)
        return '6 Months';
    if (months <= 9)
        return '9 Months';
    if (months <= 12)
        return '12 Months';
    return '> 12 Months';
};
const viewEmployee = (id) => {
    router.push(`/employees/${id}`);
};
const getDepartmentName = () => {
    if (departmentFilter.value === 'all')
        return 'All Departments';
    const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
    return dept?.departmentName || 'Unknown';
};
// ========== DISTRIBUTION PERCENTAGE ==========
const getDistributionPercentage = (key) => {
    const total = summary.value.totalEmployees || 1;
    const count = summary.value.guaranteeDistribution?.[key] || 0;
    return Math.round((count / total) * 100);
};
// ========== EXPORT FUNCTION ==========
const exportData = () => {
    if (filteredEmployees.value.length === 0) {
        alert('No data to export');
        return;
    }
    let csv = `Guarantee Age Distribution Report\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `Department: ${getDepartmentName()}\n`;
    csv += `Age Range: ${ageRangeFilter.value === 'all' ? 'All Ranges' : ageRangeFilter.value}\n`;
    csv += `Total Employees: ${filteredEmployees.value.length}\n\n`;
    csv += 'Employee Code,Full Name (Amharic),Full Name (English),Department,Position,Since Last Checked (months),Age Range,Last Checked Date (EC)\n';
    filteredEmployees.value.forEach(emp => {
        csv += `"${emp.employeeCode}","${emp.fullName || 'N/A'}","${emp.fullNameEnglish || ''}","${emp.department || 'N/A'}","${emp.position || 'N/A'}",${emp.ageInMonths || 0},"${emp.ageCategory || getAgeCategoryLabel(emp.ageInMonths)}","${emp.guaranteeDateEC || 'N/A'}"\n`;
    });
    const totalAge = filteredEmployees.value.reduce((sum, e) => sum + (e.ageInMonths || 0), 0);
    const avgAge = Math.round(totalAge / filteredEmployees.value.length);
    const oldest = Math.max(...filteredEmployees.value.map(e => e.ageInMonths || 0));
    const youngest = Math.min(...filteredEmployees.value.map(e => e.ageInMonths || 0));
    csv += `\n--- SUMMARY ---\n`;
    csv += `Total Employees: ${filteredEmployees.value.length}\n`;
    csv += `Average Since Last Checked: ${avgAge} months\n`;
    csv += `Oldest: ${oldest} months\n`;
    csv += `Youngest: ${youngest} months\n`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Guarantee_Age_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
// ========== LIFECYCLE ==========
onMounted(() => {
    loadDepartments();
    loadData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['zero']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['one']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['two']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['two-plus']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-renew']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-fresh']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-recent']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-moderate']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-aging']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-old']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-very-old']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-age-details']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-section']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-name-english']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-renew']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-footer-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-info-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-small']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-name']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['emp-date-info']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "guarantee-age-details" },
});
/** @type {__VLS_StyleScopedClasses['guarantee-age-details']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/dashboard",
    ...{ class: "back-btn" },
}));
const __VLS_2 = __VLS_1({
    to: "/dashboard",
    ...{ class: "back-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-right" },
});
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.loadData) },
    ...{ class: "refresh-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-section" },
});
/** @type {__VLS_StyleScopedClasses['distribution-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "section-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
(__VLS_ctx.summary.totalEmployees || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-grid" },
});
/** @type {__VLS_StyleScopedClasses['distribution-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-card zero" },
});
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['zero']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-top" },
});
/** @type {__VLS_StyleScopedClasses['card-top']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-badge" },
});
/** @type {__VLS_StyleScopedClasses['card-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-value" },
});
/** @type {__VLS_StyleScopedClasses['card-value']} */ ;
(__VLS_ctx.summary.guaranteeDistribution?.zero || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-label" },
});
/** @type {__VLS_StyleScopedClasses['card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bottom" },
});
/** @type {__VLS_StyleScopedClasses['card-bottom']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bar" },
});
/** @type {__VLS_StyleScopedClasses['card-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bar-fill" },
    ...{ style: ({ width: __VLS_ctx.getDistributionPercentage('zero') + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-percentage" },
});
/** @type {__VLS_StyleScopedClasses['card-percentage']} */ ;
(__VLS_ctx.getDistributionPercentage('zero'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-card one" },
});
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['one']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-top" },
});
/** @type {__VLS_StyleScopedClasses['card-top']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-badge" },
});
/** @type {__VLS_StyleScopedClasses['card-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-value" },
});
/** @type {__VLS_StyleScopedClasses['card-value']} */ ;
(__VLS_ctx.summary.guaranteeDistribution?.one || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-label" },
});
/** @type {__VLS_StyleScopedClasses['card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bottom" },
});
/** @type {__VLS_StyleScopedClasses['card-bottom']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bar" },
});
/** @type {__VLS_StyleScopedClasses['card-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bar-fill" },
    ...{ style: ({ width: __VLS_ctx.getDistributionPercentage('one') + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-percentage" },
});
/** @type {__VLS_StyleScopedClasses['card-percentage']} */ ;
(__VLS_ctx.getDistributionPercentage('one'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-card two" },
});
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['two']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-top" },
});
/** @type {__VLS_StyleScopedClasses['card-top']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-badge" },
});
/** @type {__VLS_StyleScopedClasses['card-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-value" },
});
/** @type {__VLS_StyleScopedClasses['card-value']} */ ;
(__VLS_ctx.summary.guaranteeDistribution?.two || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-label" },
});
/** @type {__VLS_StyleScopedClasses['card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bottom" },
});
/** @type {__VLS_StyleScopedClasses['card-bottom']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bar" },
});
/** @type {__VLS_StyleScopedClasses['card-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bar-fill" },
    ...{ style: ({ width: __VLS_ctx.getDistributionPercentage('two') + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-percentage" },
});
/** @type {__VLS_StyleScopedClasses['card-percentage']} */ ;
(__VLS_ctx.getDistributionPercentage('two'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-card two-plus" },
});
/** @type {__VLS_StyleScopedClasses['distribution-card']} */ ;
/** @type {__VLS_StyleScopedClasses['two-plus']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-top" },
});
/** @type {__VLS_StyleScopedClasses['card-top']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-badge" },
});
/** @type {__VLS_StyleScopedClasses['card-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-value" },
});
/** @type {__VLS_StyleScopedClasses['card-value']} */ ;
(__VLS_ctx.summary.guaranteeDistribution?.twoPlus || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-label" },
});
/** @type {__VLS_StyleScopedClasses['card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bottom" },
});
/** @type {__VLS_StyleScopedClasses['card-bottom']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-bar" },
});
/** @type {__VLS_StyleScopedClasses['card-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bar-fill" },
    ...{ style: ({ width: __VLS_ctx.getDistributionPercentage('twoPlus') + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-percentage" },
});
/** @type {__VLS_StyleScopedClasses['card-percentage']} */ ;
(__VLS_ctx.getDistributionPercentage('twoPlus'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-section" },
});
/** @type {__VLS_StyleScopedClasses['filter-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.departmentFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept.departmentId),
        value: (dept.departmentId),
    });
    (dept.departmentName);
    (dept.count);
    // @ts-ignore
    [loadData, loading, summary, summary, summary, summary, summary, getDistributionPercentage, getDistributionPercentage, getDistributionPercentage, getDistributionPercentage, getDistributionPercentage, getDistributionPercentage, getDistributionPercentage, getDistributionPercentage, onFilterChange, departmentFilter, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.onSearch) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search by Amharic name, English name, or code...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-hint" },
});
/** @type {__VLS_StyleScopedClasses['search-hint']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onRangeFilterChange) },
    value: (__VLS_ctx.ageRangeFilter),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
for (const [range] of __VLS_vFor((__VLS_ctx.ageRanges))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (range.label),
        value: (range.label),
    });
    (range.label);
    (range.count);
    // @ts-ignore
    [onSearch, searchQuery, onRangeFilterChange, ageRangeFilter, ageRanges,];
}
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
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "total-count" },
    });
    /** @type {__VLS_StyleScopedClasses['total-count']} */ ;
    (__VLS_ctx.filteredEmployees.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportData) },
        ...{ class: "export-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    if (__VLS_ctx.filteredEmployees.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "data-table" },
        });
        /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [emp, index] of __VLS_vFor((__VLS_ctx.paginatedEmployees))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (emp.id || index),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.getRowIndex(index));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "avatar" },
                ...{ style: ({ background: __VLS_ctx.getAvatarColor(emp.fullName) }) },
            });
            /** @type {__VLS_StyleScopedClasses['avatar']} */ ;
            (__VLS_ctx.getInitials(emp.fullName));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-info" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name-english" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name-english']} */ ;
            (emp.fullNameEnglish || '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-code" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
            (emp.employeeCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.department || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['age-badge', __VLS_ctx.getAgeBadgeClass(emp.ageInMonths)]) },
            });
            /** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
            (emp.ageInMonths);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "range-label" },
                ...{ style: ({ background: __VLS_ctx.getAgeBarColor(emp.ageInMonths) }) },
            });
            /** @type {__VLS_StyleScopedClasses['range-label']} */ ;
            (emp.ageCategory || __VLS_ctx.getAgeCategoryLabel(emp.ageInMonths));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "ec-date" },
            });
            /** @type {__VLS_StyleScopedClasses['ec-date']} */ ;
            (emp.confirmedDateEC || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "action-buttons" },
            });
            /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.filteredEmployees.length > 0))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [loading, filteredEmployees, filteredEmployees, exportData, paginatedEmployees, getRowIndex, getAvatarColor, getInitials, getAgeBadgeClass, getAgeBarColor, getAgeCategoryLabel, viewEmployee,];
                    } },
                ...{ class: "btn-view" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.filteredEmployees.length > 0))
                            return;
                        __VLS_ctx.openRenewModal(emp);
                        // @ts-ignore
                        [openRenewModal,];
                    } },
                ...{ class: "btn-renew" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-renew']} */ ;
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    }
    if (__VLS_ctx.filteredEmployees.length > __VLS_ctx.pageSize) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.filteredEmployees.length > __VLS_ctx.pageSize))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                    // @ts-ignore
                    [filteredEmployees, pageSize, changePage, currentPage,];
                } },
            disabled: (__VLS_ctx.currentPage === 1),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.currentPage);
        (__VLS_ctx.totalPages);
        (__VLS_ctx.filteredEmployees.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.filteredEmployees.length > __VLS_ctx.pageSize))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
                    // @ts-ignore
                    [filteredEmployees, changePage, currentPage, currentPage, currentPage, totalPages,];
                } },
            disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
    }
}
if (__VLS_ctx.showRenewModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeRenewModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content modal-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRenewModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-info-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-info-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "avatar-small" },
        ...{ style: ({ background: __VLS_ctx.getAvatarColor(__VLS_ctx.selectedEmployee?.fullName) }) },
    });
    /** @type {__VLS_StyleScopedClasses['avatar-small']} */ ;
    (__VLS_ctx.getInitials(__VLS_ctx.selectedEmployee?.fullName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-details-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-details-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-name" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-name']} */ ;
    (__VLS_ctx.selectedEmployee?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "emp-id" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-id']} */ ;
    (__VLS_ctx.selectedEmployee?.employeeCode);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "emp-dept" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-dept']} */ ;
    (__VLS_ctx.selectedEmployee?.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "emp-date-info" },
    });
    /** @type {__VLS_StyleScopedClasses['emp-date-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "date-label" },
    });
    /** @type {__VLS_StyleScopedClasses['date-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "date-value" },
    });
    /** @type {__VLS_StyleScopedClasses['date-value']} */ ;
    (__VLS_ctx.selectedEmployee?.confirmedDateEC || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "date-badge" },
        ...{ class: (__VLS_ctx.getAgeBadgeClass(__VLS_ctx.selectedEmployee?.ageInMonths)) },
    });
    /** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
    (__VLS_ctx.selectedEmployee?.ageInMonths || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "newDate",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onKeyup: (__VLS_ctx.saveRenewal) },
        id: "newDate",
        type: "text",
        value: (__VLS_ctx.newDateEC),
        placeholder: "DD/MM/YYYY",
        ...{ class: "form-input-compact" },
        ...{ class: ({ 'error': __VLS_ctx.dateError }) },
    });
    /** @type {__VLS_StyleScopedClasses['form-input-compact']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    if (__VLS_ctx.dateError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-message-compact" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message-compact']} */ ;
        (__VLS_ctx.dateError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "help-text-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['help-text-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer-compact" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRenewModal) },
        ...{ class: "btn-cancel-compact" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel-compact']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveRenewal) },
        ...{ class: "btn-save-compact" },
        disabled: (__VLS_ctx.saving || !__VLS_ctx.newDateEC),
    });
    /** @type {__VLS_StyleScopedClasses['btn-save-compact']} */ ;
    if (__VLS_ctx.saving) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    (__VLS_ctx.saving ? 'Saving...' : 'Update Date');
}
if (__VLS_ctx.toast.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast-container" },
        ...{ class: (__VLS_ctx.toast.type) },
    });
    /** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.toast.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.toast.show))
                    return;
                __VLS_ctx.toast.show = false;
                // @ts-ignore
                [getAvatarColor, getInitials, getAgeBadgeClass, currentPage, totalPages, showRenewModal, closeRenewModal, closeRenewModal, closeRenewModal, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, saveRenewal, saveRenewal, newDateEC, newDateEC, dateError, dateError, dateError, saving, saving, saving, saving, toast, toast, toast, toast,];
            } },
    });
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
