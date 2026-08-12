import { ref, computed, onMounted } from 'vue';
// ================================================================
// STATE
// ================================================================
const stores = ref([]);
const groups = ref([]);
const users = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
// Filters
const filterStore = ref('');
const filterGroup = ref('');
const filterRole = ref('');
// Modal
const showUserModal = ref(false);
const editingUser = ref(null);
const savingUser = ref(false);
const userForm = ref({
    username: '',
    fullName: '',
    email: '',
    role: 'storekeeper',
    storeId: '',
    groupId: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
});
// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// ================================================================
// COMPUTED
// ================================================================
const totalUsers = computed(() => users.value.length);
const filteredGroupsByStore = computed(() => {
    if (!filterStore.value)
        return groups.value;
    return groups.value.filter(g => g.storeId === filterStore.value);
});
const availableGroups = computed(() => {
    if (!userForm.value.storeId)
        return [];
    return groups.value.filter(g => g.storeId === userForm.value.storeId);
});
const filteredUsers = computed(() => {
    let result = users.value;
    if (filterStore.value) {
        result = result.filter(u => u.storeId === filterStore.value);
    }
    if (filterGroup.value) {
        result = result.filter(u => u.groupId === filterGroup.value);
    }
    if (filterRole.value) {
        result = result.filter(u => u.role === filterRole.value);
    }
    return result;
});
const totalPages = computed(() => {
    return Math.ceil(filteredUsers.value.length / pageSize.value) || 1;
});
const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredUsers.value.slice(start, start + pageSize.value);
});
// ================================================================
// METHODS
// ================================================================
const loadData = () => {
    loading.value = true;
    setTimeout(() => {
        stores.value = getMockStores();
        groups.value = getMockGroups();
        users.value = getMockUsers();
        loading.value = false;
    }, 300);
};
const getMockStores = () => {
    return [
        { id: 'store-1', name: 'Fiber Main Store' },
        { id: 'store-2', name: 'Paint Main Store' },
        { id: 'store-3', name: 'Fiber Mini Store' }
    ];
};
const getMockGroups = () => {
    return [
        { id: 'g1', name: 'Storekeeper', storeId: 'store-1' },
        { id: 'g2', name: 'IT', storeId: 'store-1' },
        { id: 'g3', name: 'Auditor', storeId: 'store-1' },
        { id: 'g4', name: 'Supplier', storeId: 'store-1' },
        { id: 'g5', name: 'Storekeeper', storeId: 'store-2' },
        { id: 'g6', name: 'IT', storeId: 'store-2' },
        { id: 'g7', name: 'Auditor', storeId: 'store-2' },
        { id: 'g8', name: 'Storekeeper', storeId: 'store-3' },
        { id: 'g9', name: 'IT', storeId: 'store-3' }
    ];
};
const getMockUsers = () => {
    return [
        { id: 'u1', username: 'birukm', fullName: 'Biruk Mulualem', email: 'biruk@example.com', role: 'storekeeper', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g1', groupName: 'Storekeeper', status: 'Active' },
        { id: 'u2', username: 'dagmawih', fullName: 'Dagmawi Hadgu', email: 'dagmawi@example.com', role: 'storekeeper', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g1', groupName: 'Storekeeper', status: 'Active' },
        { id: 'u3', username: 'melkamu', fullName: 'Melkamu Zewdu', email: 'melkamu@example.com', role: 'it', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g2', groupName: 'IT', status: 'Active' },
        { id: 'u4', username: 'melaku', fullName: 'Melaku Tewodros', email: 'melaku@example.com', role: 'auditor', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g3', groupName: 'Auditor', status: 'Active' },
        { id: 'u5', username: 'tamrat', fullName: 'Tamrat Zerihun', email: 'tamrat@example.com', role: 'supplier', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g4', groupName: 'Supplier', status: 'Active' },
        { id: 'u6', username: 'nuru', fullName: 'Nuru Seid', email: 'nuru@example.com', role: 'storekeeper', storeId: 'store-2', storeName: 'Paint Main Store', groupId: 'g5', groupName: 'Storekeeper', status: 'Active' },
        { id: 'u7', username: 'tadese', fullName: 'Tadese Jemberu', email: 'tadese@example.com', role: 'storekeeper', storeId: 'store-2', storeName: 'Paint Main Store', groupId: 'g5', groupName: 'Storekeeper', status: 'Inactive' },
        { id: 'u8', username: 'eshete', fullName: 'Eshete Worke', email: 'eshete@example.com', role: 'it', storeId: 'store-2', storeName: 'Paint Main Store', groupId: 'g6', groupName: 'IT', status: 'Active' }
    ];
};
const openAddUserModal = () => {
    editingUser.value = null;
    userForm.value = {
        username: '',
        fullName: '',
        email: '',
        role: 'storekeeper',
        storeId: '',
        groupId: '',
        password: '',
        confirmPassword: '',
        status: 'Active'
    };
    showUserModal.value = true;
};
const openEditUser = (user) => {
    editingUser.value = user;
    userForm.value = {
        ...user,
        password: '',
        confirmPassword: ''
    };
    showUserModal.value = true;
};
const closeUserModal = () => {
    showUserModal.value = false;
    editingUser.value = null;
};
const onStoreChange = () => {
    userForm.value.groupId = '';
};
const saveUser = () => {
    if (!editingUser.value && userForm.value.password !== userForm.value.confirmPassword) {
        showToastMessage('Passwords do not match!', 'error');
        return;
    }
    savingUser.value = true;
    setTimeout(() => {
        const store = stores.value.find(s => s.id === userForm.value.storeId);
        const group = groups.value.find(g => g.id === userForm.value.groupId);
        if (editingUser.value) {
            const idx = users.value.findIndex(u => u.id === editingUser.value.id);
            if (idx !== -1) {
                users.value[idx] = {
                    ...userForm.value,
                    id: editingUser.value.id,
                    storeName: store?.name || '',
                    groupName: group?.name || ''
                };
            }
            showToastMessage('User updated successfully!', 'success');
        }
        else {
            const newUser = {
                ...userForm.value,
                id: 'u' + Date.now(),
                storeName: store?.name || '',
                groupName: group?.name || ''
            };
            delete newUser.password;
            delete newUser.confirmPassword;
            users.value.push(newUser);
            showToastMessage('User added successfully!', 'success');
        }
        closeUserModal();
        savingUser.value = false;
    }, 500);
};
const toggleUserStatus = (user) => {
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    showToastMessage(`User ${user.status}`, 'success');
};
const resetPassword = (user) => {
    if (confirm(`Reset password for ${user.fullName}?`)) {
        showToastMessage(`Password reset for ${user.fullName}`, 'success');
    }
};
const onFilterChange = () => {
    currentPage.value = 1;
};
const changePage = (page) => {
    currentPage.value = page;
};
const changePageSize = () => {
    currentPage.value = 1;
};
const showToastMessage = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
    loadData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['user-table']} */ ;
/** @type {__VLS_StyleScopedClasses['user-table']} */ ;
/** @type {__VLS_StyleScopedClasses['user-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['user-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['user-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-title" },
});
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "total-badge" },
});
/** @type {__VLS_StyleScopedClasses['total-badge']} */ ;
(__VLS_ctx.totalUsers);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddUserModal) },
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterStore),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [store] of __VLS_vFor((__VLS_ctx.stores))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (store.id),
        value: (store.id),
    });
    (store.name);
    // @ts-ignore
    [totalUsers, openAddUserModal, onFilterChange, filterStore, stores,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterGroup),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [group] of __VLS_vFor((__VLS_ctx.filteredGroupsByStore))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (group.id),
        value: (group.id),
    });
    (group.name);
    // @ts-ignore
    [onFilterChange, filterGroup, filteredGroupsByStore,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterRole),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "admin",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "storekeeper",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "it",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "auditor",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "supplier",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "user-table" },
});
/** @type {__VLS_StyleScopedClasses['user-table']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [user, index] of __VLS_vFor((__VLS_ctx.paginatedUsers))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (user.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (index + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "username" },
    });
    /** @type {__VLS_StyleScopedClasses['username']} */ ;
    (user.username);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (user.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (user.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['role-badge', user.role.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
    (user.role);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "store-tag" },
    });
    /** @type {__VLS_StyleScopedClasses['store-tag']} */ ;
    (user.storeName || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "group-tag" },
    });
    /** @type {__VLS_StyleScopedClasses['group-tag']} */ ;
    (user.groupName || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', user.status?.toLowerCase() || 'active']) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (user.status || 'Active');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openEditUser(user);
                // @ts-ignore
                [onFilterChange, filterRole, paginatedUsers, openEditUser,];
            } },
        ...{ class: "icon-btn" },
        title: "Edit",
    });
    /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggleUserStatus(user);
                // @ts-ignore
                [toggleUserStatus,];
            } },
        ...{ class: "icon-btn" },
        title: "Toggle Status",
    });
    /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
    (user.status === 'Active' ? '⏸️' : '▶️');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.resetPassword(user);
                // @ts-ignore
                [resetPassword,];
            } },
        ...{ class: "icon-btn" },
        title: "Reset Password",
    });
    /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
    // @ts-ignore
    [];
}
if (__VLS_ctx.filteredUsers.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.filteredUsers.length > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [filteredUsers, changePage, currentPage,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.currentPage === 1),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-info" },
    });
    /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
    (__VLS_ctx.currentPage);
    (__VLS_ctx.totalPages);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.filteredUsers.length > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [changePage, currentPage, currentPage, currentPage, totalPages,];
            } },
        ...{ class: "page-btn" },
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    });
    /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.changePageSize) },
        value: (__VLS_ctx.pageSize),
        ...{ class: "limit-select" },
    });
    /** @type {__VLS_StyleScopedClasses['limit-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (5),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (10),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (20),
    });
}
if (__VLS_ctx.showUserModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeUserModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container user-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['user-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingUser ? '✏️ Edit User' : '➕ Add New User');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeUserModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveUser) },
        ...{ class: "user-form" },
    });
    /** @type {__VLS_StyleScopedClasses['user-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.userForm.username),
        type: "text",
        required: true,
        placeholder: "Enter username",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.userForm.fullName),
        type: "text",
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        required: true,
        placeholder: "user@example.com",
    });
    (__VLS_ctx.userForm.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.userForm.role),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "storekeeper",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "it",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "auditor",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "supplier",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "admin",
    });
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
        ...{ onChange: (__VLS_ctx.onStoreChange) },
        value: (__VLS_ctx.userForm.storeId),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [store] of __VLS_vFor((__VLS_ctx.stores))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (store.id),
            value: (store.id),
        });
        (store.name);
        // @ts-ignore
        [stores, currentPage, totalPages, changePageSize, pageSize, showUserModal, closeUserModal, closeUserModal, editingUser, saveUser, userForm, userForm, userForm, userForm, userForm, onStoreChange,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.userForm.groupId),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [group] of __VLS_vFor((__VLS_ctx.availableGroups))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (group.id),
            value: (group.id),
        });
        (group.name);
        // @ts-ignore
        [userForm, availableGroups,];
    }
    if (!__VLS_ctx.editingUser) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "password",
            required: true,
            placeholder: "Min 6 characters",
        });
        (__VLS_ctx.userForm.password);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "password",
            required: true,
        });
        (__VLS_ctx.userForm.confirmPassword);
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
        value: (__VLS_ctx.userForm.status),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Active",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Inactive",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Locked",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeUserModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveUser) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingUser),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.savingUser ? 'Saving...' : (__VLS_ctx.editingUser ? 'Update' : 'Add'));
}
// @ts-ignore
[closeUserModal, editingUser, editingUser, saveUser, userForm, userForm, userForm, savingUser, savingUser,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
