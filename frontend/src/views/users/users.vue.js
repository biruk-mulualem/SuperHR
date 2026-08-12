import { ref, onMounted, watch } from 'vue';
import UsersService from '@/stores/users';
import UsersStatsCards from './components/UsersStatsCards.vue';
import UsersFiltersBar from './components/UsersFiltersBar.vue';
import UsersTable from './components/UsersTable.vue';
import UsersModals from './components/UsersModals.vue';
// ============================================================================
// STATE
// ============================================================================
const users = ref([]);
const roles = ref([]);
const departments = ref([]);
const stats = ref({ overview: { total: 0, active: 0 } });
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
// Pagination
const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
});
// Filters
const filters = ref({
    search: '',
    role: '',
    department: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
});
// Selection
const selectedUsers = ref([]);
const selectAll = ref(false);
// Modals
const showModal = ref(false);
const showResetModal = ref(false);
const isEditing = ref(false);
const resetUser = ref(null);
// Forms
const userForm = ref({
    userId: null,
    username: '',
    fullName: '',
    email: '',
    roleId: null,
    departmentId: null,
    isActive: true,
    password: ''
});
const resetPasswordData = ref({
    newPassword: '',
    confirmPassword: ''
});
// Errors
const errors = ref({
    fullName: '',
    username: '',
    email: '',
    roleId: '',
    password: '',
    resetPassword: '',
    confirmPassword: ''
});
// Toast
const toasts = ref([]);
// Debounce timeout for search
let searchTimeout = null;
// ============================================================================
// METHODS
// ============================================================================
// Toast functions
const addToast = (message, type = 'success') => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => removeToast(id), 3000);
};
const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
};
// Validation
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateForm = () => {
    let isValid = true;
    errors.value = { fullName: '', username: '', email: '', roleId: '', password: '' };
    if (!userForm.value.fullName?.trim()) {
        errors.value.fullName = 'Full name required';
        isValid = false;
    }
    if (!userForm.value.username?.trim()) {
        errors.value.username = 'Username required';
        isValid = false;
    }
    else if (userForm.value.username.length < 3) {
        errors.value.username = 'Min 3 characters';
        isValid = false;
    }
    if (!userForm.value.email) {
        errors.value.email = 'Email required';
        isValid = false;
    }
    else if (!validateEmail(userForm.value.email)) {
        errors.value.email = 'Valid email required';
        isValid = false;
    }
    if (!userForm.value.roleId) {
        errors.value.roleId = 'Role required';
        isValid = false;
    }
    if (!isEditing.value && !userForm.value.password) {
        errors.value.password = 'Password required';
        isValid = false;
    }
    else if (!isEditing.value && userForm.value.password.length < 6) {
        errors.value.password = 'Min 6 characters';
        isValid = false;
    }
    return isValid;
};
const validateResetPassword = () => {
    let isValid = true;
    errors.value.resetPassword = '';
    errors.value.confirmPassword = '';
    if (!resetPasswordData.value.newPassword) {
        errors.value.resetPassword = 'Password required';
        isValid = false;
    }
    else if (resetPasswordData.value.newPassword.length < 6) {
        errors.value.resetPassword = 'Min 6 characters';
        isValid = false;
    }
    if (!resetPasswordData.value.confirmPassword) {
        errors.value.confirmPassword = 'Confirm password';
        isValid = false;
    }
    else if (resetPasswordData.value.newPassword !== resetPasswordData.value.confirmPassword) {
        errors.value.confirmPassword = 'Passwords do not match';
        isValid = false;
    }
    return isValid;
};
// API Calls
const loadUsers = async () => {
    loading.value = true;
    try {
        let roleParam = filters.value.role;
        if (roleParam && roleParam !== '') {
            const selectedRole = roles.value.find(r => r.name === roleParam);
            if (selectedRole) {
                roleParam = selectedRole.roleId;
            }
        }
        const params = {
            page: pagination.value.page,
            limit: pagination.value.limit,
            sortBy: filters.value.sortBy,
            sortOrder: filters.value.sortOrder,
            search: filters.value.search,
            role: filters.value.role,
            status: filters.value.status,
            department: filters.value.department
        };
        const result = await UsersService.getUsers(params);
        if (result.success) {
            users.value = result.data;
            pagination.value = result.pagination;
        }
        else {
            addToast(result.error || 'Failed to load users', 'error');
        }
    }
    catch (error) {
        console.error('Load users error:', error);
        addToast('Failed to load users', 'error');
    }
    finally {
        loading.value = false;
    }
};
const loadRoles = async () => {
    try {
        const result = await UsersService.getRoles();
        if (result.success && result.roles) {
            roles.value = result.roles;
        }
        else if (result.success && result.data) {
            roles.value = result.data;
        }
        else {
            console.warn('No roles found, using defaults');
            roles.value = [
                { roleId: 1, name: 'admin', description: 'Administrator', isActive: true },
                { roleId: 2, name: 'hr', description: 'HR Manager', isActive: true },
                { roleId: 3, name: 'finance', description: 'Finance Officer', isActive: true },
                { roleId: 4, name: 'employee', description: 'Employee', isActive: true }
            ];
        }
    }
    catch (error) {
        console.error('Load roles error:', error);
        roles.value = [
            { roleId: 1, name: 'admin', description: 'Administrator', isActive: true },
            { roleId: 2, name: 'hr', description: 'HR Manager', isActive: true },
            { roleId: 3, name: 'finance', description: 'Finance Officer', isActive: true },
            { roleId: 4, name: 'employee', description: 'Employee', isActive: true }
        ];
    }
};
const loadDepartments = async () => {
    try {
        const result = await UsersService.getDepartments();
        if (result.success) {
            departments.value = result.departments;
        }
        else {
            departments.value = [];
        }
    }
    catch (error) {
        console.error('Load departments error:', error);
        departments.value = [];
    }
};
const loadStats = async () => {
    try {
        const result = await UsersService.getUserStats();
        if (result.success) {
            stats.value = result.stats;
        }
        else {
            stats.value = { overview: { total: 0, active: 0, inactive: 0 } };
        }
    }
    catch (error) {
        console.error('Load stats error:', error);
        stats.value = { overview: { total: 0, active: 0, inactive: 0 } };
    }
};
const saveUser = async () => {
    if (!validateForm())
        return;
    saving.value = true;
    try {
        let result;
        if (isEditing.value) {
            result = await UsersService.updateUser(userForm.value.userId, {
                fullName: userForm.value.fullName,
                email: userForm.value.email,
                roleId: userForm.value.roleId,
                departmentId: userForm.value.departmentId,
                isActive: userForm.value.isActive
            });
        }
        else {
            result = await UsersService.createUser({
                username: userForm.value.username,
                email: userForm.value.email,
                fullName: userForm.value.fullName,
                roleId: userForm.value.roleId,
                departmentId: userForm.value.departmentId,
                password: userForm.value.password
            });
        }
        if (result.success) {
            addToast(result.message, 'success');
            closeModal();
            loadUsers();
            loadStats();
        }
        else {
            addToast(result.error || 'Operation failed', 'error');
        }
    }
    catch (error) {
        console.error('Save user error:', error);
        addToast('Operation failed', 'error');
    }
    finally {
        saving.value = false;
    }
};
const resetPassword = async () => {
    if (!validateResetPassword())
        return;
    resetting.value = true;
    try {
        const result = await UsersService.resetUserPassword(resetUser.value.userId, resetPasswordData.value.newPassword);
        if (result.success) {
            addToast(result.message, 'success');
            closeResetModal();
        }
        else {
            addToast(result.error || 'Reset failed', 'error');
        }
    }
    catch (error) {
        console.error('Reset password error:', error);
        addToast('Reset failed', 'error');
    }
    finally {
        resetting.value = false;
    }
};
const toggleStatus = async (user) => {
    try {
        const result = await UsersService.toggleUserStatus(user.userId);
        if (result.success) {
            user.isActive = result.isActive;
            addToast(`${user.fullName} is now ${result.isActive ? 'active' : 'inactive'}`, 'success');
            loadStats();
        }
        else {
            addToast(result.error || 'Status update failed', 'error');
        }
    }
    catch (error) {
        console.error('Toggle status error:', error);
        addToast('Status update failed', 'error');
    }
};
const bulkUpdateStatus = async (status) => {
    try {
        const result = await UsersService.bulkUpdateUsers(selectedUsers.value, { isActive: status });
        if (result.success) {
            addToast(result.message, 'success');
            selectedUsers.value = [];
            selectAll.value = false;
            loadUsers();
            loadStats();
        }
        else {
            addToast(result.error || 'Bulk update failed', 'error');
        }
    }
    catch (error) {
        console.error('Bulk update error:', error);
        addToast('Bulk update failed', 'error');
    }
};
// Selection - FIXED
const toggleSelectAll = () => {
    if (selectAll.value) {
        // If currently selected, deselect all
        selectedUsers.value = [];
        selectAll.value = false;
    }
    else {
        // Select all users on current page
        selectedUsers.value = users.value.map(u => u.userId);
        selectAll.value = true;
    }
};
const toggleUserSelect = (userId) => {
    const index = selectedUsers.value.indexOf(userId);
    if (index > -1) {
        selectedUsers.value.splice(index, 1);
    }
    else {
        selectedUsers.value.push(userId);
    }
    selectAll.value = selectedUsers.value.length === users.value.length && users.value.length > 0;
};
// Watch for users changes to reset selection when page changes
watch(() => users.value, () => {
    selectedUsers.value = [];
    selectAll.value = false;
}, { deep: true });
// Watch for search with debounce
watch(() => filters.value.search, () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        loadUsers();
    }, 500);
});
// Watch for filter changes
watch([() => filters.value.role, () => filters.value.department, () => filters.value.status, () => filters.value.sortBy], () => {
    pagination.value.page = 1;
    loadUsers();
});
// Pagination
const goToPage = (page) => {
    pagination.value.page = page;
    loadUsers();
};
// Filter methods
const updateFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
};
const clearFilters = () => {
    filters.value = {
        search: '',
        role: '',
        department: '',
        status: '',
        sortBy: 'created_at',
        sortOrder: 'DESC'
    };
    pagination.value.page = 1;
    loadUsers();
};
// Modal functions
const openUserModal = (user = null) => {
    errors.value = { fullName: '', username: '', email: '', roleId: '', password: '' };
    isEditing.value = !!user;
    if (user) {
        userForm.value = {
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            roleId: user.roleId,
            departmentId: user.departmentId,
            isActive: user.isActive,
            password: ''
        };
    }
    else {
        userForm.value = {
            userId: null,
            username: '',
            fullName: '',
            email: '',
            roleId: null,
            departmentId: null,
            isActive: true,
            password: ''
        };
    }
    showModal.value = true;
};
const openResetPasswordModal = (user) => {
    errors.value.resetPassword = '';
    errors.value.confirmPassword = '';
    resetUser.value = user;
    resetPasswordData.value = { newPassword: '', confirmPassword: '' };
    showResetModal.value = true;
};
const closeModal = () => {
    showModal.value = false;
    userForm.value = {
        userId: null,
        username: '',
        fullName: '',
        email: '',
        roleId: null,
        departmentId: null,
        isActive: true,
        password: ''
    };
};
const closeResetModal = () => {
    showResetModal.value = false;
    resetUser.value = null;
};
// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
    await Promise.all([
        loadRoles(),
        loadDepartments(),
        loadStats(),
        loadUsers()
    ]);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['users-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "users-page" },
});
/** @type {__VLS_StyleScopedClasses['users-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "page-title" },
});
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openUserModal();
            // @ts-ignore
            [openUserModal,];
        } },
    ...{ class: "btn-primary" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
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
const __VLS_0 = UsersStatsCards;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    stats: (__VLS_ctx.stats),
}));
const __VLS_2 = __VLS_1({
    stats: (__VLS_ctx.stats),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = UsersFiltersBar;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    ...{ 'onUpdate:filters': {} },
    ...{ 'onClearFilters': {} },
    filters: (__VLS_ctx.filters),
    roles: (__VLS_ctx.roles),
    departments: (__VLS_ctx.departments),
}));
const __VLS_7 = __VLS_6({
    ...{ 'onUpdate:filters': {} },
    ...{ 'onClearFilters': {} },
    filters: (__VLS_ctx.filters),
    roles: (__VLS_ctx.roles),
    departments: (__VLS_ctx.departments),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
const __VLS_11 = ({ 'update:filters': {} },
    { 'onUpdate:filters': (__VLS_ctx.updateFilters) });
const __VLS_12 = ({ clearFilters: {} },
    { onClearFilters: (__VLS_ctx.clearFilters) });
var __VLS_8;
var __VLS_9;
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
    const __VLS_13 = UsersTable;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        ...{ 'onToggleSelectAll': {} },
        ...{ 'onToggleUserSelect': {} },
        ...{ 'onEditUser': {} },
        ...{ 'onResetPassword': {} },
        ...{ 'onToggleStatus': {} },
        ...{ 'onGoToPage': {} },
        ...{ 'onBulkUpdate': {} },
        ...{ 'onClearFilters': {} },
        users: (__VLS_ctx.users),
        selectedUsers: (__VLS_ctx.selectedUsers),
        selectAll: (__VLS_ctx.selectAll),
        pagination: (__VLS_ctx.pagination),
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onToggleSelectAll': {} },
        ...{ 'onToggleUserSelect': {} },
        ...{ 'onEditUser': {} },
        ...{ 'onResetPassword': {} },
        ...{ 'onToggleStatus': {} },
        ...{ 'onGoToPage': {} },
        ...{ 'onBulkUpdate': {} },
        ...{ 'onClearFilters': {} },
        users: (__VLS_ctx.users),
        selectedUsers: (__VLS_ctx.selectedUsers),
        selectAll: (__VLS_ctx.selectAll),
        pagination: (__VLS_ctx.pagination),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_18;
    const __VLS_19 = ({ toggleSelectAll: {} },
        { onToggleSelectAll: (__VLS_ctx.toggleSelectAll) });
    const __VLS_20 = ({ toggleUserSelect: {} },
        { onToggleUserSelect: (__VLS_ctx.toggleUserSelect) });
    const __VLS_21 = ({ editUser: {} },
        { onEditUser: (__VLS_ctx.openUserModal) });
    const __VLS_22 = ({ resetPassword: {} },
        { onResetPassword: (__VLS_ctx.openResetPasswordModal) });
    const __VLS_23 = ({ toggleStatus: {} },
        { onToggleStatus: (__VLS_ctx.toggleStatus) });
    const __VLS_24 = ({ goToPage: {} },
        { onGoToPage: (__VLS_ctx.goToPage) });
    const __VLS_25 = ({ bulkUpdate: {} },
        { onBulkUpdate: (__VLS_ctx.bulkUpdateStatus) });
    const __VLS_26 = ({ clearFilters: {} },
        { onClearFilters: (__VLS_ctx.clearFilters) });
    var __VLS_16;
    var __VLS_17;
}
const __VLS_27 = UsersModals;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
    ...{ 'onCloseModal': {} },
    ...{ 'onCloseResetModal': {} },
    ...{ 'onSaveUser': {} },
    ...{ 'onResetPassword': {} },
    ...{ 'onRemoveToast': {} },
    showModal: (__VLS_ctx.showModal),
    showResetModal: (__VLS_ctx.showResetModal),
    isEditing: (__VLS_ctx.isEditing),
    userForm: (__VLS_ctx.userForm),
    resetUser: (__VLS_ctx.resetUser),
    resetPasswordData: (__VLS_ctx.resetPasswordData),
    roles: (__VLS_ctx.roles),
    departments: (__VLS_ctx.departments),
    errors: (__VLS_ctx.errors),
    saving: (__VLS_ctx.saving),
    resetting: (__VLS_ctx.resetting),
    toasts: (__VLS_ctx.toasts),
}));
const __VLS_29 = __VLS_28({
    ...{ 'onCloseModal': {} },
    ...{ 'onCloseResetModal': {} },
    ...{ 'onSaveUser': {} },
    ...{ 'onResetPassword': {} },
    ...{ 'onRemoveToast': {} },
    showModal: (__VLS_ctx.showModal),
    showResetModal: (__VLS_ctx.showResetModal),
    isEditing: (__VLS_ctx.isEditing),
    userForm: (__VLS_ctx.userForm),
    resetUser: (__VLS_ctx.resetUser),
    resetPasswordData: (__VLS_ctx.resetPasswordData),
    roles: (__VLS_ctx.roles),
    departments: (__VLS_ctx.departments),
    errors: (__VLS_ctx.errors),
    saving: (__VLS_ctx.saving),
    resetting: (__VLS_ctx.resetting),
    toasts: (__VLS_ctx.toasts),
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
let __VLS_32;
const __VLS_33 = ({ closeModal: {} },
    { onCloseModal: (__VLS_ctx.closeModal) });
const __VLS_34 = ({ closeResetModal: {} },
    { onCloseResetModal: (__VLS_ctx.closeResetModal) });
const __VLS_35 = ({ saveUser: {} },
    { onSaveUser: (__VLS_ctx.saveUser) });
const __VLS_36 = ({ resetPassword: {} },
    { onResetPassword: (__VLS_ctx.resetPassword) });
const __VLS_37 = ({ removeToast: {} },
    { onRemoveToast: (__VLS_ctx.removeToast) });
var __VLS_30;
var __VLS_31;
// @ts-ignore
[openUserModal, stats, filters, roles, roles, departments, departments, updateFilters, clearFilters, clearFilters, loading, users, selectedUsers, selectAll, pagination, toggleSelectAll, toggleUserSelect, openResetPasswordModal, toggleStatus, goToPage, bulkUpdateStatus, showModal, showResetModal, isEditing, userForm, resetUser, resetPasswordData, errors, saving, resetting, toasts, closeModal, closeResetModal, saveUser, resetPassword, removeToast,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
