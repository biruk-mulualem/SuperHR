import { ref, computed, onMounted, watch } from 'vue';
import groupService from '@/stores/groupService';
import storeService from '@/stores/storeService';
// ================================================================
// STATE
// ================================================================
const stores = ref([]);
const groups = ref([]);
const allUsers = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const searchQuery = ref('');
const filterStore = ref('');
const filterStatus = ref('');
const filterStoreAssignment = ref('');
const totalItems = ref(0);
// Group Modal
const showGroupModal = ref(false);
const editingGroup = ref(null);
const savingGroup = ref(false);
const groupForm = ref({
    name: '',
    storeId: '',
    status: 'Active'
});
const getRoleClass = (role) => {
    if (!role)
        return 'role-user';
    const roleMap = {
        'admin': 'role-admin',
        'Admin': 'role-admin',
        'manager': 'role-manager',
        'Manager': 'role-manager',
        'superadmin': 'role-superadmin',
        'Superadmin': 'role-superadmin',
        'user': 'role-user',
        'User': 'role-user',
    };
    return roleMap[role] || 'role-user';
};
// Members Modal
const showMembersModal = ref(false);
const selectedGroup = ref(null);
const selectedMemberId = ref('');
const addingMember = ref(false);
// Toggle Modal
const showToggleModal = ref(false);
const toggleGroup = ref(null);
const toggleNewStatus = ref('');
const toggling = ref(false);
const toggleError = ref('');
// Remove Member Modal
const showRemoveMemberModal = ref(false);
const removeMember = ref(null);
// Export Modal
const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref('full');
// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// ================================================================
// COMPUTED
// ================================================================
// Only show active stores in dropdowns
const activeStores = computed(() => {
    return stores.value.filter(store => store.status === 'Active');
});
const filteredGroups = computed(() => {
    let result = groups.value;
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        result = result.filter(g => g.code.toLowerCase().includes(s) ||
            g.name.toLowerCase().includes(s));
    }
    if (filterStore.value) {
        result = result.filter(g => g.storeId === parseInt(filterStore.value));
    }
    if (filterStatus.value) {
        result = result.filter(g => g.status === filterStatus.value);
    }
    if (filterStoreAssignment.value === 'assigned') {
        result = result.filter(g => g.storeId && g.storeId !== null);
    }
    else if (filterStoreAssignment.value === 'unassigned') {
        result = result.filter(g => !g.storeId || g.storeId === null);
    }
    return result;
});
const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value) || 1;
});
const paginatedGroups = computed(() => {
    return filteredGroups.value;
});
const availableUsers = computed(() => {
    if (!selectedGroup.value)
        return allUsers.value;
    const existingUserIds = selectedGroup.value.users?.map(u => u.id) || [];
    return allUsers.value.filter(u => !existingUserIds.includes(u.id));
});
// ================================================================
// METHODS
// ================================================================
// -- Helper Methods for Member Display --
const getDisplayMembers = (group) => {
    return group.users?.slice(0, 3) || [];
};
const hasMoreMembers = (group) => {
    return (group.users?.length || 0) > 3;
};
const getRemainingMemberCount = (group) => {
    return Math.max(0, (group.users?.length || 0) - 3);
};
// -- Status Helper Methods --
const getEffectiveStatus = (group) => {
    // If group has no store assigned, just use its own status
    if (!group.storeId) {
        return group.status || 'Inactive';
    }
    // If group has a store, check both statuses
    if (group.status === 'Active' && group.storeStatus !== 'Active') {
        return 'Inactive';
    }
    return group.status || 'Active';
};
const canManageMembers = (group) => {
    // Groups without a store can always manage members regardless of status
    if (!group.storeId) {
        return true;
    }
    // Groups with a store need to be active and have active store
    return group.status === 'Active' && group.storeStatus === 'Active';
};
// -- Load Data --
const loadStores = async () => {
    try {
        const response = await storeService.getStores({ limit: 100 });
        if (response.success) {
            stores.value = response.data.stores || [];
        }
    }
    catch (error) {
        console.error('Load stores error:', error);
    }
};
const loadGroups = async () => {
    loading.value = true;
    try {
        const response = await groupService.getGroups({
            page: currentPage.value,
            limit: pageSize.value,
            search: searchQuery.value || undefined,
            storeId: filterStore.value || undefined,
            status: filterStatus.value || undefined
        });
        if (response.success) {
            groups.value = response.data.groups || [];
            totalItems.value = response.data.pagination?.total || 0;
        }
        else {
            showToastMessage(response.error || 'Failed to load groups', 'error');
        }
    }
    catch (error) {
        console.error('Load groups error:', error);
        showToastMessage('Failed to load groups', 'error');
    }
    finally {
        loading.value = false;
    }
};
const loadUsers = async () => {
    try {
        const response = await groupService.getAllUsers();
        if (response.success) {
            allUsers.value = response.data || [];
        }
    }
    catch (error) {
        console.error('Load users error:', error);
    }
};
// -- Group CRUD --
const openAddGroupModal = () => {
    editingGroup.value = null;
    groupForm.value = {
        name: '',
        storeId: '',
        status: 'Active'
    };
    showGroupModal.value = true;
};
const openEditGroup = (group) => {
    editingGroup.value = group;
    groupForm.value = {
        name: group.name,
        storeId: group.storeId || '',
        status: group.status || 'Active'
    };
    showGroupModal.value = true;
};
const closeGroupModal = () => {
    showGroupModal.value = false;
    editingGroup.value = null;
};
const saveGroup = async () => {
    savingGroup.value = true;
    try {
        let response;
        if (editingGroup.value) {
            response = await groupService.updateGroup(editingGroup.value.id, groupForm.value);
            if (response.success) {
                showToastMessage('Group updated successfully!', 'success');
                await loadGroups();
            }
        }
        else {
            response = await groupService.createGroup(groupForm.value);
            if (response.success) {
                const store = stores.value.find(s => s.id === response.data.storeId);
                const storeMsg = store ? ` to ${store.name}` : ' (No Store Assigned)';
                showToastMessage(`Group "${response.data.name}" created with code ${response.data.code}${storeMsg}!`, 'success');
                await loadGroups();
            }
        }
        closeGroupModal();
    }
    catch (error) {
        showToastMessage(error.message || 'Failed to save group', 'error');
    }
    finally {
        savingGroup.value = false;
    }
};
// -- Members Management --
const openManageMembers = (group) => {
    // Allow managing members even if group has no store or is inactive
    // But show warning if inactive
    if (group.status === 'Inactive') {
        showToastMessage('This group is inactive. You can still manage members but the group will not be usable until activated.', 'warning');
    }
    selectedGroup.value = JSON.parse(JSON.stringify(group));
    selectedMemberId.value = '';
    showMembersModal.value = true;
};
const closeMembersModal = () => {
    showMembersModal.value = false;
    selectedGroup.value = null;
    selectedMemberId.value = '';
    loadGroups();
};
const addMemberToGroup = async () => {
    if (!selectedMemberId.value) {
        showToastMessage('Please select a member', 'error');
        return;
    }
    addingMember.value = true;
    try {
        const response = await groupService.addUserToGroup(selectedGroup.value.id, selectedMemberId.value);
        if (response.success) {
            const user = allUsers.value.find(u => u.id === selectedMemberId.value);
            showToastMessage(`Member "${user?.fullName}" added to group!`, 'success');
            selectedGroup.value = response.data;
            selectedMemberId.value = '';
            await loadGroups();
        }
    }
    catch (error) {
        showToastMessage(error.message || 'Failed to add member', 'error');
    }
    finally {
        addingMember.value = false;
    }
};
const openRemoveMemberModal = (user) => {
    removeMember.value = user;
    showRemoveMemberModal.value = true;
};
const closeRemoveMemberModal = () => {
    showRemoveMemberModal.value = false;
    removeMember.value = null;
};
const confirmRemoveMember = async () => {
    if (removeMember.value && selectedGroup.value) {
        try {
            const response = await groupService.removeUserFromGroup(selectedGroup.value.id, removeMember.value.id);
            if (response.success) {
                showToastMessage(`Member "${removeMember.value.fullName}" removed from group`, 'success');
                selectedGroup.value = response.data;
                await loadGroups();
            }
        }
        catch (error) {
            showToastMessage(error.message || 'Failed to remove member', 'error');
        }
        closeRemoveMemberModal();
    }
};
// -- Toggle Status --
const openToggleStatus = (group) => {
    toggleError.value = '';
    toggleGroup.value = group;
    toggleNewStatus.value = group.status === 'Active' ? 'Inactive' : 'Active';
    showToggleModal.value = true;
};
const closeToggleModal = () => {
    showToggleModal.value = false;
    toggleGroup.value = null;
    toggleNewStatus.value = '';
    toggleError.value = '';
    toggling.value = false;
};
const confirmToggleStatus = async () => {
    if (!toggleGroup.value)
        return;
    // Check if trying to activate with inactive store (only if group has a store)
    if (toggleNewStatus === 'Active' && toggleGroup.value.storeId && toggleGroup.value.storeStatus !== 'Active') {
        toggleError.value = `Cannot activate group because the store "${toggleGroup.value.storeName}" is ${toggleGroup.value.storeStatus?.toLowerCase()}`;
        return;
    }
    toggling.value = true;
    toggleError.value = '';
    try {
        const response = await groupService.updateGroupStatus(toggleGroup.value.id, toggleNewStatus.value);
        if (response.success) {
            showToastMessage(response.message || `Group status changed to ${toggleNewStatus.value}`, 'success');
            await loadGroups();
            closeToggleModal();
        }
        else {
            const errorMsg = response.error || response.message || 'Failed to update status';
            toggleError.value = errorMsg;
            showToastMessage(errorMsg, 'error');
        }
    }
    catch (error) {
        console.error('Toggle status error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to update status';
        toggleError.value = errorMsg;
        showToastMessage(errorMsg, 'error');
    }
    finally {
        toggling.value = false;
    }
};
// -- Filters --
const onSearchChange = () => {
    currentPage.value = 1;
    loadGroups();
};
const onFilterChange = () => {
    currentPage.value = 1;
    loadGroups();
};
const clearFilters = () => {
    filterStore.value = '';
    filterStatus.value = '';
    filterStoreAssignment.value = '';
    searchQuery.value = '';
    currentPage.value = 1;
    showToastMessage('Filters cleared', 'info');
    loadGroups();
};
// -- Export --
const openExportModal = () => {
    exportType.value = 'full';
    showExportModal.value = true;
};
const closeExportModal = () => {
    showExportModal.value = false;
};
const exportSelectedReport = async () => {
    exporting.value = true;
    try {
        const response = await groupService.exportGroups({
            status: filterStatus.value || undefined,
            storeId: filterStore.value || undefined
        });
        if (response.success && response.data.length > 0) {
            const headers = Object.keys(response.data[0]);
            const rows = response.data.map(item => headers.map(key => item[key]));
            const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `group_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToastMessage('Export completed successfully!', 'success');
        }
        else {
            showToastMessage(response.error || 'No data to export', 'error');
        }
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage(error.message || 'Failed to export', 'error');
    }
    finally {
        exporting.value = false;
        closeExportModal();
    }
};
// -- Print --
const printReport = () => {
    const printContents = document.getElementById('printable-area').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `
    <html>
      <head>
        <title>Group Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
          .member-tag { display: inline-block; padding: 2px 8px; background: #dcfce7; margin: 2px; border-radius: 4px; font-size: 10px; }
          .unassigned { background: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <h2>👥 Group Management Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Groups: ${totalItems.value}</p>
        ${printContents}
        <div class="print-footer">Printed from Group Management System</div>
      </body>
    </html>
  `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
};
// -- Pagination --
const changePage = (page) => {
    if (page < 1 || page > totalPages.value)
        return;
    currentPage.value = page;
    loadGroups();
};
const changePageSize = () => {
    currentPage.value = 1;
    loadGroups();
};
// -- Toast --
const showToastMessage = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 4000);
};
// ================================================================
// WATCHERS
// ================================================================
watch([filterStore, filterStatus, filterStoreAssignment], () => {
    currentPage.value = 1;
    loadGroups();
});
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    await Promise.all([
        loadStores(),
        loadGroups(),
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
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['group-table']} */ ;
/** @type {__VLS_StyleScopedClasses['group-table']} */ ;
/** @type {__VLS_StyleScopedClasses['group-table']} */ ;
/** @type {__VLS_StyleScopedClasses['store-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['member-more']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['add-member-section']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-member']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-member']} */ ;
/** @type {__VLS_StyleScopedClasses['existing-members']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-member-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['group-table']} */ ;
/** @type {__VLS_StyleScopedClasses['group-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['member-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['add-member-form']} */ ;
/** @type {__VLS_StyleScopedClasses['group-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
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
(__VLS_ctx.totalItems);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "search-icon" },
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.onSearchChange) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search groups...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddGroupModal) },
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
for (const [store] of __VLS_vFor((__VLS_ctx.activeStores))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (store.id),
        value: (store.id),
    });
    (store.name);
    // @ts-ignore
    [totalItems, onSearchChange, searchQuery, openAddGroupModal, onFilterChange, filterStore, activeStores,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterStatus),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Active",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Inactive",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterStoreAssignment),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "assigned",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "unassigned",
});
if (__VLS_ctx.filterStore || __VLS_ctx.filterStatus || __VLS_ctx.filterStoreAssignment) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-actions" },
});
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.printReport) },
    ...{ class: "btn-print" },
});
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openExportModal) },
    ...{ class: "btn-export" },
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
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
        id: "printable-area",
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "group-table" },
    });
    /** @type {__VLS_StyleScopedClasses['group-table']} */ ;
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
    if (__VLS_ctx.paginatedGroups.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "8",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-content" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openAddGroupModal) },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    }
    for (const [group, index] of __VLS_vFor((__VLS_ctx.paginatedGroups))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (group.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        ((__VLS_ctx.currentPage - 1) * __VLS_ctx.pageSize + index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "code" },
        });
        /** @type {__VLS_StyleScopedClasses['code']} */ ;
        (group.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (group.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        if (group.storeId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "store-tag" },
            });
            /** @type {__VLS_StyleScopedClasses['store-tag']} */ ;
            (group.storeName || '-');
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "store-tag unassigned" },
            });
            /** @type {__VLS_StyleScopedClasses['store-tag']} */ ;
            /** @type {__VLS_StyleScopedClasses['unassigned']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        if (group.storeId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['status-badge', group.storeStatus?.toLowerCase() || 'inactive']) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (group.storeStatus || 'Inactive');
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-badge inactive" },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['inactive']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "member-list" },
        });
        /** @type {__VLS_StyleScopedClasses['member-list']} */ ;
        for (const [user] of __VLS_vFor((__VLS_ctx.getDisplayMembers(group)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (user.id),
                ...{ class: "member-tag" },
            });
            /** @type {__VLS_StyleScopedClasses['member-tag']} */ ;
            (user.fullName);
            // @ts-ignore
            [openAddGroupModal, onFilterChange, onFilterChange, filterStore, filterStatus, filterStatus, filterStoreAssignment, filterStoreAssignment, clearFilters, printReport, openExportModal, loading, paginatedGroups, paginatedGroups, currentPage, pageSize, getDisplayMembers,];
        }
        if (__VLS_ctx.hasMoreMembers(group)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.hasMoreMembers(group)))
                            return;
                        __VLS_ctx.openManageMembers(group);
                        // @ts-ignore
                        [hasMoreMembers, openManageMembers,];
                    } },
                ...{ class: "member-more" },
            });
            /** @type {__VLS_StyleScopedClasses['member-more']} */ ;
            (__VLS_ctx.getRemainingMemberCount(group));
        }
        if (!group.users || group.users.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "no-items" },
            });
            /** @type {__VLS_StyleScopedClasses['no-items']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', __VLS_ctx.getEffectiveStatus(group)]) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.getEffectiveStatus(group));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openEditGroup(group);
                    // @ts-ignore
                    [getRemainingMemberCount, getEffectiveStatus, getEffectiveStatus, openEditGroup,];
                } },
            ...{ class: "icon-btn" },
            title: "Edit Group",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        if (__VLS_ctx.canManageMembers(group)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.canManageMembers(group)))
                            return;
                        __VLS_ctx.openManageMembers(group);
                        // @ts-ignore
                        [openManageMembers, canManageMembers,];
                    } },
                ...{ class: "icon-btn" },
                title: "Manage Members",
            });
            /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openToggleStatus(group);
                    // @ts-ignore
                    [openToggleStatus,];
                } },
            ...{ class: "icon-btn" },
            title: (group.status === 'Active' ? 'Deactivate Group' : 'Activate Group'),
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        (group.status === 'Active' ? '⏸️' : '▶️');
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalItems > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalItems > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [totalItems, currentPage, changePage,];
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
                if (!(__VLS_ctx.totalItems > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [currentPage, currentPage, currentPage, changePage, totalPages,];
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
if (__VLS_ctx.showGroupModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeGroupModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container group-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingGroup ? '✏️ Edit Group' : '➕ Add New Group');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeGroupModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveGroup) },
        ...{ class: "group-form" },
    });
    /** @type {__VLS_StyleScopedClasses['group-form']} */ ;
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
        value: (__VLS_ctx.groupForm.name),
        type: "text",
        required: true,
        placeholder: "e.g., Storekeeper",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.groupForm.storeId),
        ...{ class: "store-select" },
    });
    /** @type {__VLS_StyleScopedClasses['store-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [store] of __VLS_vFor((__VLS_ctx.activeStores))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (store.id),
            value: (store.id),
        });
        (store.name);
        // @ts-ignore
        [activeStores, currentPage, pageSize, totalPages, changePageSize, showGroupModal, closeGroupModal, closeGroupModal, editingGroup, saveGroup, groupForm, groupForm,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
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
        value: (__VLS_ctx.groupForm.status),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Active",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Inactive",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeGroupModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveGroup) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingGroup),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.savingGroup ? 'Saving...' : (__VLS_ctx.editingGroup ? 'Update' : 'Add'));
}
if (__VLS_ctx.showMembersModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeMembersModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container members-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['members-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedGroup?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeMembersModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-member-section" },
    });
    /** @type {__VLS_StyleScopedClasses['add-member-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-member-form" },
    });
    /** @type {__VLS_StyleScopedClasses['add-member-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.selectedMemberId),
        ...{ class: "member-select" },
    });
    /** @type {__VLS_StyleScopedClasses['member-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [user] of __VLS_vFor((__VLS_ctx.availableUsers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (user.id),
            value: (user.id),
        });
        (user.fullName);
        (user.username);
        if (user.role) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "role-indicator" },
            });
            /** @type {__VLS_StyleScopedClasses['role-indicator']} */ ;
            (user.role);
        }
        // @ts-ignore
        [closeGroupModal, editingGroup, saveGroup, groupForm, savingGroup, savingGroup, showMembersModal, closeMembersModal, closeMembersModal, selectedGroup, selectedMemberId, availableUsers,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addMemberToGroup) },
        ...{ class: "btn-add-member" },
        disabled: (!__VLS_ctx.selectedMemberId || __VLS_ctx.addingMember),
    });
    /** @type {__VLS_StyleScopedClasses['btn-add-member']} */ ;
    (__VLS_ctx.addingMember ? 'Adding...' : '➕ Add Member');
    if (__VLS_ctx.availableUsers.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-available-members" },
        });
        /** @type {__VLS_StyleScopedClasses['no-available-members']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "existing-members" },
    });
    /** @type {__VLS_StyleScopedClasses['existing-members']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.selectedGroup?.users?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "members-list" },
    });
    /** @type {__VLS_StyleScopedClasses['members-list']} */ ;
    if (__VLS_ctx.selectedGroup?.users?.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-members" },
        });
        /** @type {__VLS_StyleScopedClasses['no-members']} */ ;
    }
    for (const [user] of __VLS_vFor((__VLS_ctx.selectedGroup?.users))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (user.id),
            ...{ class: "member-item" },
        });
        /** @type {__VLS_StyleScopedClasses['member-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "member-name" },
        });
        /** @type {__VLS_StyleScopedClasses['member-name']} */ ;
        (user.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "member-username" },
        });
        /** @type {__VLS_StyleScopedClasses['member-username']} */ ;
        (user.username);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['role-badge', __VLS_ctx.getRoleClass(user.role)]) },
        });
        /** @type {__VLS_StyleScopedClasses['role-badge']} */ ;
        (user.role || 'User');
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMembersModal))
                        return;
                    __VLS_ctx.openRemoveMemberModal(user);
                    // @ts-ignore
                    [selectedGroup, selectedGroup, selectedGroup, selectedMemberId, availableUsers, addMemberToGroup, addingMember, addingMember, getRoleClass, openRemoveMemberModal,];
                } },
            ...{ class: "remove-member-btn" },
            title: "Remove from group",
        });
        /** @type {__VLS_StyleScopedClasses['remove-member-btn']} */ ;
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeMembersModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showToggleModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container toggle-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['toggle-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.toggleGroup?.status === 'Active' ? '⏸️ Confirm Deactivate' : '▶️ Confirm Activate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirmation-title" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirmation-details" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-details']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.toggleGroup?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-value" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
    (__VLS_ctx.toggleGroup?.storeName || 'No Store Assigned');
    if (__VLS_ctx.toggleGroup?.storeId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "detail-row" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "detail-label" },
        });
        /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', __VLS_ctx.toggleGroup?.storeStatus?.toLowerCase() || 'inactive']) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (__VLS_ctx.toggleGroup?.storeStatus || 'Inactive');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.toggleGroup?.status?.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.toggleGroup?.status || 'Active');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "detail-label" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.toggleNewStatus?.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.toggleNewStatus);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    (__VLS_ctx.toggleGroup?.status === 'Active' ? 'deactivate' : 'activate');
    if (__VLS_ctx.toggleGroup?.status === 'Active') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "warning-subtext" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-subtext']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "warning-subtext" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-subtext']} */ ;
    }
    if (__VLS_ctx.toggleNewStatus === 'Active' && __VLS_ctx.toggleGroup?.storeId && __VLS_ctx.toggleGroup?.storeStatus !== 'Active') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-box" },
        });
        /** @type {__VLS_StyleScopedClasses['error-box']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.toggleGroup?.storeStatus?.toLowerCase());
    }
    if (__VLS_ctx.toggleError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-box" },
        });
        /** @type {__VLS_StyleScopedClasses['error-box']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "error-text" },
        });
        /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
        (__VLS_ctx.toggleError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmToggleStatus) },
        ...{ class: "btn-primary" },
        disabled: ((__VLS_ctx.toggleNewStatus === 'Active' && __VLS_ctx.toggleGroup?.storeId && __VLS_ctx.toggleGroup?.storeStatus !== 'Active') || __VLS_ctx.toggling),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.toggling ? 'Processing...' : 'Confirm');
}
if (__VLS_ctx.showRemoveMemberModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeRemoveMemberModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container delete-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['delete-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRemoveMemberModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "delete-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.removeMember?.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedGroup?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "delete-question" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-question']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRemoveMemberModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmRemoveMember) },
        ...{ class: "btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
}
if (__VLS_ctx.showExportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container export-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['export-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "export-options" },
    });
    /** @type {__VLS_StyleScopedClasses['export-options']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'full';
                // @ts-ignore
                [closeMembersModal, selectedGroup, showToggleModal, closeToggleModal, closeToggleModal, closeToggleModal, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleGroup, toggleNewStatus, toggleNewStatus, toggleNewStatus, toggleNewStatus, toggleError, toggleError, confirmToggleStatus, toggling, toggling, showRemoveMemberModal, closeRemoveMemberModal, closeRemoveMemberModal, closeRemoveMemberModal, removeMember, confirmRemoveMember, showExportModal, closeExportModal, closeExportModal, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "full",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'summary';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "summary",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeExportModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportSelectedReport) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.exporting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.exporting ? 'Exporting...' : 'Export');
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
[closeExportModal, exportType, exportSelectedReport, exporting, exporting, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
