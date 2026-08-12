import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import EmployeesService from '@/stores/employee';
import UsersService from '@/stores/users';
import EmployeeStatsCards from './components/employee/EmployeeStatsCards.vue';
import EmployeeFiltersBar from './components/employee/EmployeeFiltersBar.vue';
import EmployeeTable from './components/employee/EmployeeTable.vue';
import EmployeeModals from './components/employee/EmployeeModals.vue';
const router = useRouter();
const { t, locale } = useI18n();
// Language state
const currentLanguage = ref(locale.value);
// Toggle language function
const setLanguage = (lang) => {
    locale.value = lang;
    currentLanguage.value = lang;
    localStorage.setItem('language', lang);
    addToast(lang === 'en' ? 'Switched to English' : 'ወደ አማርኛ ተቀይሯል', 'success');
};
// ============================================================================
// STATE
// ============================================================================
const employees = ref([]);
const departments = ref([]);
const kpiStats = ref({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
    fullyCompliant: 0,
    missingDocs: 0,
    complianceRate: '0'
});
const loading = ref(false);
const deleting = ref(false);
const terminating = ref(false);
const reactivating = ref(false);
// Pagination
const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
});
// Filters
const filters = ref({
    search: '',
    departmentId: '',
    employmentStatus: '',
    employmentType: ''
});
// ========== MODAL STATES ==========
// Delete Modal
const showDeleteModal = ref(false);
const employeeToDelete = ref(null);
// Terminate Modal
const showTerminateModal = ref(false);
const employeeToTerminate = ref(null);
// Reactivate Modal
const showReactivateModal = ref(false);
const employeeToReactivate = ref(null);
// Toast
const toasts = ref([]);
// Debounce timeout
let searchTimeout = null;
// ============================================================================
// MODAL HANDLERS
// ============================================================================
// ========== DELETE MODAL ==========
const confirmDelete = (employee) => {
    if (employee.status === 'terminated') {
        addToast(`${employee.fullName} is already terminated`, 'warning');
        return;
    }
    employeeToDelete.value = employee;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    employeeToDelete.value = null;
};
const deleteEmployee = async () => {
    deleting.value = true;
    try {
        const result = await EmployeesService.deleteEmployee(employeeToDelete.value.id);
        if (result.success) {
            addToast(result.message, 'success');
            closeDeleteModal();
            loadEmployees();
            loadKpiStats();
        }
        else {
            addToast(result.error || t('messages.error') || 'Delete failed', 'error');
        }
    }
    catch (error) {
        console.error('Delete employee error:', error);
        addToast(t('messages.error') || 'Delete failed', 'error');
    }
    finally {
        deleting.value = false;
    }
};
// ========== TERMINATE MODAL ==========
const handleTerminate = (employee) => {
    console.log('🔴 Terminate clicked for:', employee.fullName);
    employeeToTerminate.value = employee;
    showTerminateModal.value = true;
};
const closeTerminateModal = () => {
    showTerminateModal.value = false;
    employeeToTerminate.value = null;
};
const confirmTerminate = async () => {
    console.log('🔴 Confirming terminate for:', employeeToTerminate.value?.fullName);
    terminating.value = true;
    try {
        const result = await EmployeesService.terminateEmployee(employeeToTerminate.value.id);
        if (result.success) {
            addToast(`${employeeToTerminate.value.fullName} has been terminated successfully`, 'success');
            closeTerminateModal();
            loadKpiStats();
            loadEmployees();
        }
        else {
            addToast(result.error || 'Failed to terminate employee', 'error');
        }
    }
    catch (error) {
        console.error('Terminate error:', error);
        addToast('Failed to terminate employee', 'error');
    }
    finally {
        terminating.value = false;
    }
};
// ========== REACTIVATE MODAL ==========
const handleReactivation = (employee) => {
    console.log('🟢 Reactivate clicked for:', employee.fullName);
    employeeToReactivate.value = employee;
    showReactivateModal.value = true;
};
const closeReactivateModal = () => {
    showReactivateModal.value = false;
    employeeToReactivate.value = null;
};
const confirmReactivate = async () => {
    console.log('🟢 Confirming reactivate for:', employeeToReactivate.value?.fullName);
    reactivating.value = true;
    try {
        const result = await EmployeesService.reactivateEmployee(employeeToReactivate.value.id);
        if (result.success) {
            addToast(`${employeeToReactivate.value.fullName} has been reactivated successfully`, 'success');
            closeReactivateModal();
            loadKpiStats();
            loadEmployees();
        }
        else {
            addToast(result.error || 'Failed to reactivate employee', 'error');
        }
    }
    catch (error) {
        console.error('Reactivation error:', error);
        addToast('Failed to reactivate employee', 'error');
    }
    finally {
        reactivating.value = false;
    }
};
// ============================================================================
// NAVIGATION
// ============================================================================
const navigateToAnalytics = () => {
    router.push('/analytics');
};
// ============================================================================
// TOAST
// ============================================================================
const addToast = (message, type = 'success') => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => removeToast(id), 4000);
};
const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
};
// ============================================================================
// DATA LOADING
// ============================================================================
const loadDepartments = async () => {
    try {
        const result = await UsersService.getDepartments();
        if (result.success) {
            departments.value = result.departments;
        }
    }
    catch (error) {
        console.error('Load departments error:', error);
    }
};
const loadKpiStats = async () => {
    try {
        const result = await EmployeesService.getKpiStats();
        if (result.success && result.data) {
            kpiStats.value = result.data;
        }
    }
    catch (error) {
        console.error('Load KPI stats error:', error);
    }
};
const loadEmployees = async () => {
    loading.value = true;
    try {
        const params = {
            page: pagination.value.page,
            limit: pagination.value.limit,
            search: filters.value.search,
            departmentId: filters.value.departmentId,
            employmentStatus: filters.value.employmentStatus,
            employmentType: filters.value.employmentType
        };
        const result = await EmployeesService.getEmployees(params);
        if (result.success) {
            employees.value = result.data;
            pagination.value = result.pagination;
        }
        else {
            addToast(result.error || t('messages.error') || 'Failed to load employees', 'error');
        }
    }
    catch (error) {
        console.error('Load employees error:', error);
        addToast(t('messages.error') || 'Failed to load employees', 'error');
    }
    finally {
        loading.value = false;
    }
};
// ============================================================================
// EMPLOYEE ACTIONS
// ============================================================================
const toggleStatus = async (employee) => {
    console.log('🔄 Toggle status for:', employee.fullName, 'Current:', employee.status);
    if (employee.status === 'terminated') {
        addToast('Cannot toggle terminated employees', 'warning');
        return;
    }
    const newStatus = employee.status === 'active' ? 'on-leave' : 'active';
    try {
        const result = await EmployeesService.updateEmployee(employee.id, { status: newStatus });
        if (result.success) {
            employee.status = newStatus;
            addToast(`${employee.fullName} status changed to ${getStatusLabel(newStatus)}`, 'success');
            loadKpiStats();
            loadEmployees();
        }
        else {
            addToast(result.error || t('messages.error') || 'Status update failed', 'error');
        }
    }
    catch (error) {
        console.error('Toggle status error:', error);
        addToast(t('messages.error') || 'Status update failed', 'error');
    }
};
// ============================================================================
// NAVIGATION ACTIONS
// ============================================================================
const editEmployee = (employee) => {
    router.push(`/employees/${employee.id}/edit`);
};
const viewEmployee = (employee) => {
    router.push(`/employees/${employee.id}`);
};
// ============================================================================
// FILTERS & PAGINATION
// ============================================================================
const clearFilters = () => {
    filters.value = {
        search: '',
        departmentId: '',
        employmentStatus: '',
        employmentType: ''
    };
    pagination.value.page = 1;
    loadEmployees();
};
const updateFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
};
const goToPage = (page) => {
    pagination.value.page = page;
    loadEmployees();
};
// ============================================================================
// UTILITY
// ============================================================================
const getStatusLabel = (status) => {
    const labels = {
        active: t('employee.active') || 'Active',
        'on-leave': t('employee.onLeave') || 'On Leave',
        terminated: t('employee.terminated') || 'Terminated'
    };
    return labels[status] || status;
};
// ============================================================================
// WATCHERS
// ============================================================================
watch(() => filters.value.search, () => {
    if (searchTimeout)
        clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        loadEmployees();
    }, 500);
});
watch([() => filters.value.departmentId, () => filters.value.employmentStatus, () => filters.value.employmentType], () => {
    pagination.value.page = 1;
    loadEmployees();
});
// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
    await Promise.all([
        loadDepartments(),
        loadKpiStats(),
        loadEmployees()
    ]);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['lang-option']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-option']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['header-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "employees-page" },
});
/** @type {__VLS_StyleScopedClasses['employees-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "language-switcher-container" },
});
/** @type {__VLS_StyleScopedClasses['language-switcher-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "lang-toggle" },
});
/** @type {__VLS_StyleScopedClasses['lang-toggle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setLanguage('en');
            // @ts-ignore
            [setLanguage,];
        } },
    ...{ class: "lang-option" },
    ...{ class: ({ active: __VLS_ctx.currentLanguage === 'en' }) },
});
/** @type {__VLS_StyleScopedClasses['lang-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setLanguage('am');
            // @ts-ignore
            [setLanguage, currentLanguage,];
        } },
    ...{ class: "lang-option" },
    ...{ class: ({ active: __VLS_ctx.currentLanguage === 'am' }) },
});
/** @type {__VLS_StyleScopedClasses['lang-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "page-title" },
});
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
(__VLS_ctx.$t('employee.title') || 'Employee Management');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
(__VLS_ctx.$t('employee.subtitle') || 'Manage system employees, roles, and permissions');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-buttons" },
});
/** @type {__VLS_StyleScopedClasses['header-buttons']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/documents-letters",
    ...{ class: "btn-guarantee" },
}));
const __VLS_2 = __VLS_1({
    to: "/documents-letters",
    ...{ class: "btn-guarantee" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['btn-guarantee']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M4 4h16v16H4z",
    stroke: "currentColor",
    fill: "none",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M8 8h8M8 12h6M8 16h4",
    stroke: "currentColor",
    'stroke-linecap': "round",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M16 4v16",
    stroke: "currentColor",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M4 8h2M4 12h2M4 16h2",
    stroke: "currentColor",
});
(__VLS_ctx.$t('common.guaranteeLetters') || 'Guarantee & Letters');
// @ts-ignore
[currentLanguage, $t, $t, $t,];
var __VLS_3;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    to: "/employees/create",
    ...{ class: "btn-primary" },
}));
const __VLS_8 = __VLS_7({
    to: "/employees/create",
    ...{ class: "btn-primary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "btn-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 5v14M5 12h14",
});
(__VLS_ctx.$t('common.addEmployee') || 'Add Employee');
// @ts-ignore
[$t,];
var __VLS_9;
const __VLS_12 = EmployeeStatsCards;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ 'onNavigateToAnalytics': {} },
    stats: (__VLS_ctx.kpiStats),
    departments: (__VLS_ctx.departments),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onNavigateToAnalytics': {} },
    stats: (__VLS_ctx.kpiStats),
    departments: (__VLS_ctx.departments),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_17;
const __VLS_18 = ({ navigateToAnalytics: {} },
    { onNavigateToAnalytics: (__VLS_ctx.navigateToAnalytics) });
var __VLS_15;
var __VLS_16;
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
    (__VLS_ctx.$t('common.loading') || 'Loading employees...');
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_19 = EmployeeFiltersBar;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        ...{ 'onUpdate:filters': {} },
        ...{ 'onClearFilters': {} },
        ...{ 'onLoadEmployees': {} },
        filters: (__VLS_ctx.filters),
        departments: (__VLS_ctx.departments),
    }));
    const __VLS_21 = __VLS_20({
        ...{ 'onUpdate:filters': {} },
        ...{ 'onClearFilters': {} },
        ...{ 'onLoadEmployees': {} },
        filters: (__VLS_ctx.filters),
        departments: (__VLS_ctx.departments),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    let __VLS_24;
    const __VLS_25 = ({ 'update:filters': {} },
        { 'onUpdate:filters': (__VLS_ctx.updateFilters) });
    const __VLS_26 = ({ clearFilters: {} },
        { onClearFilters: (__VLS_ctx.clearFilters) });
    const __VLS_27 = ({ loadEmployees: {} },
        { onLoadEmployees: (__VLS_ctx.loadEmployees) });
    var __VLS_22;
    var __VLS_23;
    const __VLS_28 = EmployeeTable;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        ...{ 'onEditEmployee': {} },
        ...{ 'onViewEmployee': {} },
        ...{ 'onDeleteEmployee': {} },
        ...{ 'onToggleStatus': {} },
        ...{ 'onTerminateEmployee': {} },
        ...{ 'onReactivateEmployee': {} },
        ...{ 'onGoToPage': {} },
        ...{ 'onClearFilters': {} },
        employees: (__VLS_ctx.employees),
        pagination: (__VLS_ctx.pagination),
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onEditEmployee': {} },
        ...{ 'onViewEmployee': {} },
        ...{ 'onDeleteEmployee': {} },
        ...{ 'onToggleStatus': {} },
        ...{ 'onTerminateEmployee': {} },
        ...{ 'onReactivateEmployee': {} },
        ...{ 'onGoToPage': {} },
        ...{ 'onClearFilters': {} },
        employees: (__VLS_ctx.employees),
        pagination: (__VLS_ctx.pagination),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_33;
    const __VLS_34 = ({ editEmployee: {} },
        { onEditEmployee: (__VLS_ctx.editEmployee) });
    const __VLS_35 = ({ viewEmployee: {} },
        { onViewEmployee: (__VLS_ctx.viewEmployee) });
    const __VLS_36 = ({ deleteEmployee: {} },
        { onDeleteEmployee: (__VLS_ctx.confirmDelete) });
    const __VLS_37 = ({ toggleStatus: {} },
        { onToggleStatus: (__VLS_ctx.toggleStatus) });
    const __VLS_38 = ({ terminateEmployee: {} },
        { onTerminateEmployee: (__VLS_ctx.handleTerminate) });
    const __VLS_39 = ({ reactivateEmployee: {} },
        { onReactivateEmployee: (__VLS_ctx.handleReactivation) });
    const __VLS_40 = ({ goToPage: {} },
        { onGoToPage: (__VLS_ctx.goToPage) });
    const __VLS_41 = ({ clearFilters: {} },
        { onClearFilters: (__VLS_ctx.clearFilters) });
    var __VLS_31;
    var __VLS_32;
}
const __VLS_42 = EmployeeModals;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
    ...{ 'onCloseDeleteModal': {} },
    ...{ 'onDeleteEmployee': {} },
    ...{ 'onCloseTerminateModal': {} },
    ...{ 'onConfirmTerminate': {} },
    ...{ 'onCloseReactivateModal': {} },
    ...{ 'onConfirmReactivate': {} },
    ...{ 'onRemoveToast': {} },
    showDeleteModal: (__VLS_ctx.showDeleteModal),
    employeeToDelete: (__VLS_ctx.employeeToDelete),
    deleting: (__VLS_ctx.deleting),
    showTerminateModal: (__VLS_ctx.showTerminateModal),
    employeeToTerminate: (__VLS_ctx.employeeToTerminate),
    terminating: (__VLS_ctx.terminating),
    showReactivateModal: (__VLS_ctx.showReactivateModal),
    employeeToReactivate: (__VLS_ctx.employeeToReactivate),
    reactivating: (__VLS_ctx.reactivating),
    toasts: (__VLS_ctx.toasts),
}));
const __VLS_44 = __VLS_43({
    ...{ 'onCloseDeleteModal': {} },
    ...{ 'onDeleteEmployee': {} },
    ...{ 'onCloseTerminateModal': {} },
    ...{ 'onConfirmTerminate': {} },
    ...{ 'onCloseReactivateModal': {} },
    ...{ 'onConfirmReactivate': {} },
    ...{ 'onRemoveToast': {} },
    showDeleteModal: (__VLS_ctx.showDeleteModal),
    employeeToDelete: (__VLS_ctx.employeeToDelete),
    deleting: (__VLS_ctx.deleting),
    showTerminateModal: (__VLS_ctx.showTerminateModal),
    employeeToTerminate: (__VLS_ctx.employeeToTerminate),
    terminating: (__VLS_ctx.terminating),
    showReactivateModal: (__VLS_ctx.showReactivateModal),
    employeeToReactivate: (__VLS_ctx.employeeToReactivate),
    reactivating: (__VLS_ctx.reactivating),
    toasts: (__VLS_ctx.toasts),
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
let __VLS_47;
const __VLS_48 = ({ closeDeleteModal: {} },
    { onCloseDeleteModal: (__VLS_ctx.closeDeleteModal) });
const __VLS_49 = ({ deleteEmployee: {} },
    { onDeleteEmployee: (__VLS_ctx.deleteEmployee) });
const __VLS_50 = ({ closeTerminateModal: {} },
    { onCloseTerminateModal: (__VLS_ctx.closeTerminateModal) });
const __VLS_51 = ({ confirmTerminate: {} },
    { onConfirmTerminate: (__VLS_ctx.confirmTerminate) });
const __VLS_52 = ({ closeReactivateModal: {} },
    { onCloseReactivateModal: (__VLS_ctx.closeReactivateModal) });
const __VLS_53 = ({ confirmReactivate: {} },
    { onConfirmReactivate: (__VLS_ctx.confirmReactivate) });
const __VLS_54 = ({ removeToast: {} },
    { onRemoveToast: (__VLS_ctx.removeToast) });
var __VLS_45;
var __VLS_46;
// @ts-ignore
[$t, kpiStats, departments, departments, navigateToAnalytics, loading, filters, updateFilters, clearFilters, clearFilters, loadEmployees, employees, pagination, editEmployee, viewEmployee, confirmDelete, toggleStatus, handleTerminate, handleReactivation, goToPage, showDeleteModal, employeeToDelete, deleting, showTerminateModal, employeeToTerminate, terminating, showReactivateModal, employeeToReactivate, reactivating, toasts, closeDeleteModal, deleteEmployee, closeTerminateModal, confirmTerminate, closeReactivateModal, confirmReactivate, removeToast,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
