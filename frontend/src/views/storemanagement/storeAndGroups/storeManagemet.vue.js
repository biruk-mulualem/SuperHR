import { ref, computed, onMounted, watch } from 'vue';
import storeService from '@/stores/storeService';
// ================================================================
// STATE
// ================================================================
const stores = ref([]);
const allGroups = ref([]);
const allUsers = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const searchQuery = ref('');
const filterStatus = ref('');
const filterLocation = ref('');
const totalItems = ref(0);
// Store Modal
const showStoreModal = ref(false);
const editingStore = ref(null);
const savingStore = ref(false);
const storeForm = ref({
    name: '',
    location: '',
    status: 'Active'
});
// Group Modal
const showGroupModal = ref(false);
const selectedStore = ref(null);
const selectedGroupToAdd = ref('');
const addingGroup = ref(false);
// Remove Group Modal
const showRemoveGroupModal = ref(false);
const removeGroupItem = ref(null);
// Toggle Modals
const showToggleModal = ref(false);
const toggleStore = ref(null);
const toggleNewStatus = ref('');
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
const hasActiveFilters = computed(() => {
    return filterStatus.value || filterLocation.value || searchQuery.value;
});
const locations = computed(() => {
    const locs = new Set();
    stores.value.forEach(store => {
        if (store.location) {
            locs.add(store.location);
        }
    });
    return Array.from(locs).sort();
});
const filteredStores = computed(() => {
    let result = stores.value;
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        result = result.filter(store => store.name.toLowerCase().includes(s) ||
            store.code.toLowerCase().includes(s) ||
            store.location?.toLowerCase().includes(s));
    }
    if (filterStatus.value) {
        result = result.filter(store => store.status === filterStatus.value);
    }
    if (filterLocation.value) {
        result = result.filter(store => store.location === filterLocation.value);
    }
    return result;
});
const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value) || 1;
});
const paginatedStores = computed(() => {
    return stores.value;
});
const availableGroupsToAdd = computed(() => {
    if (!selectedStore.value)
        return [];
    const existingGroupIds = selectedStore.value.groups?.map(g => g.id) || [];
    return allGroups.value.filter(g => !existingGroupIds.includes(g.id));
});
// ================================================================
// METHODS
// ================================================================
// -- Load Data --
const loadStores = async () => {
    loading.value = true;
    try {
        const response = await storeService.getStores({
            page: currentPage.value,
            limit: pageSize.value,
            search: searchQuery.value || undefined,
            status: filterStatus.value || undefined,
            location: filterLocation.value || undefined
        });
        if (response.success) {
            stores.value = response.data.stores || [];
            totalItems.value = response.data.pagination?.total || 0;
        }
        else {
            showToastMessage(response.error || 'Failed to load stores', 'error');
        }
    }
    catch (error) {
        console.error('Load stores error:', error);
        showToastMessage('Failed to load stores', 'error');
    }
    finally {
        loading.value = false;
    }
};
const loadGroups = async () => {
    try {
        const response = await storeService.getAllGroups();
        if (response.success) {
            allGroups.value = response.data || [];
            console.log('✅ Groups loaded:', allGroups.value.length);
        }
        else {
            console.error('❌ Failed to load groups:', response.error);
            // Fallback to mock data if API fails
            allGroups.value = [
                { id: 1, name: 'Storekeeper', code: 'GRP-001' },
                { id: 2, name: 'IT', code: 'GRP-002' },
                { id: 3, name: 'Auditor', code: 'GRP-003' },
                { id: 4, name: 'Supplier', code: 'GRP-004' },
                { id: 5, name: 'Quality Control', code: 'GRP-005' },
                { id: 6, name: 'Warehouse', code: 'GRP-006' },
                { id: 7, name: 'Logistics', code: 'GRP-007' }
            ];
        }
    }
    catch (error) {
        console.error('❌ Load groups error:', error);
        // Fallback to mock data
        allGroups.value = [
            { id: 1, name: 'Storekeeper', code: 'GRP-001' },
            { id: 2, name: 'IT', code: 'GRP-002' },
            { id: 3, name: 'Auditor', code: 'GRP-003' },
            { id: 4, name: 'Supplier', code: 'GRP-004' },
            { id: 5, name: 'Quality Control', code: 'GRP-005' },
            { id: 6, name: 'Warehouse', code: 'GRP-006' },
            { id: 7, name: 'Logistics', code: 'GRP-007' }
        ];
    }
};
// -- Store CRUD --
const openAddStoreModal = () => {
    editingStore.value = null;
    storeForm.value = {
        name: '',
        location: '',
        status: 'Active'
    };
    showStoreModal.value = true;
};
const openEditStore = (store) => {
    editingStore.value = store;
    storeForm.value = {
        name: store.name,
        location: store.location || '',
        status: store.status || 'Active'
    };
    showStoreModal.value = true;
};
const closeStoreModal = () => {
    showStoreModal.value = false;
    editingStore.value = null;
};
const saveStore = async () => {
    savingStore.value = true;
    try {
        let response;
        if (editingStore.value) {
            response = await storeService.updateStore(editingStore.value.id, storeForm.value);
            if (response.success) {
                showToastMessage('Store updated successfully!', 'success');
                await loadStores();
            }
        }
        else {
            response = await storeService.createStore(storeForm.value);
            if (response.success) {
                showToastMessage(`Store "${response.data.name}" added with code ${response.data.code}!`, 'success');
                await loadStores();
            }
        }
        closeStoreModal();
    }
    catch (error) {
        showToastMessage(error.message || 'Failed to save store', 'error');
    }
    finally {
        savingStore.value = false;
    }
};
// -- Group Management --
const openManageGroups = (store) => {
    selectedStore.value = JSON.parse(JSON.stringify(store));
    selectedGroupToAdd.value = '';
    showGroupModal.value = true;
};
const closeGroupModal = () => {
    showGroupModal.value = false;
    selectedStore.value = null;
    loadStores();
};
const addGroupToStore = async () => {
    if (!selectedGroupToAdd.value) {
        showToastMessage('Please select a group', 'error');
        return;
    }
    addingGroup.value = true;
    try {
        const response = await storeService.addGroupToStore(selectedStore.value.id, selectedGroupToAdd.value);
        if (response.success) {
            const groupToAdd = allGroups.value.find(g => g.id === selectedGroupToAdd.value);
            showToastMessage(`Group "${groupToAdd?.name}" added to store!`, 'success');
            selectedStore.value = response.data;
            selectedGroupToAdd.value = '';
            await loadStores();
        }
    }
    catch (error) {
        showToastMessage(error.message || 'Failed to add group', 'error');
    }
    finally {
        addingGroup.value = false;
    }
};
const openRemoveGroupModal = (group) => {
    removeGroupItem.value = group;
    showRemoveGroupModal.value = true;
};
const closeRemoveGroupModal = () => {
    showRemoveGroupModal.value = false;
    removeGroupItem.value = null;
};
const confirmRemoveGroup = async () => {
    if (removeGroupItem.value) {
        try {
            const response = await storeService.removeGroupFromStore(selectedStore.value.id, removeGroupItem.value.id);
            if (response.success) {
                showToastMessage(`Group "${removeGroupItem.value.name}" removed from store`, 'success');
                selectedStore.value = response.data;
                await loadStores();
            }
        }
        catch (error) {
            showToastMessage(error.message || 'Failed to remove group', 'error');
        }
        closeRemoveGroupModal();
    }
};
// -- Store Toggle Status --
const openToggleStatus = (store) => {
    toggleStore.value = store;
    toggleNewStatus.value = store.status === 'Active' ? 'Inactive' : 'Active';
    showToggleModal.value = true;
};
const closeToggleModal = () => {
    showToggleModal.value = false;
    toggleStore.value = null;
    toggleNewStatus.value = '';
};
const confirmToggleStatus = async () => {
    if (toggleStore.value) {
        try {
            const response = await storeService.updateStoreStatus(toggleStore.value.id, toggleNewStatus.value);
            if (response.success) {
                showToastMessage(`Store status changed to ${toggleNewStatus.value}`, 'success');
                await loadStores();
            }
        }
        catch (error) {
            showToastMessage(error.message || 'Failed to update status', 'error');
        }
        closeToggleModal();
    }
};
// -- Filters --
const onSearchChange = () => {
    currentPage.value = 1;
    loadStores();
};
const onFilterChange = () => {
    currentPage.value = 1;
    loadStores();
};
const clearFilters = () => {
    filterStatus.value = '';
    filterLocation.value = '';
    searchQuery.value = '';
    currentPage.value = 1;
    showToastMessage('Filters cleared', 'info');
    loadStores();
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
        const response = await storeService.exportStores({
            status: filterStatus.value || undefined,
            location: filterLocation.value || undefined
        });
        if (response.success && response.data.length > 0) {
            const headers = Object.keys(response.data[0]);
            const rows = response.data.map(item => headers.map(key => item[key]));
            const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `store_report_${new Date().toISOString().split('T')[0]}.csv`;
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
        <title>Store Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
          .group-tag { display: inline-block; padding: 2px 8px; background: #eff6ff; margin: 2px; border-radius: 4px; font-size: 10px; }
        </style>
      </head>
      <body>
        <h2>🏪 Store Management Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Stores: ${totalItems.value}</p>
        ${printContents}
        <div class="print-footer">Printed from Store Management System</div>
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
    loadStores();
};
const changePageSize = () => {
    currentPage.value = 1;
    loadStores();
};
// -- Toast --
const showToastMessage = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
};
// ================================================================
// WATCHERS
// ================================================================
watch([filterStatus, filterLocation], () => {
    currentPage.value = 1;
    loadStores();
});
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    await Promise.all([
        loadStores(),
        loadGroups()
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
/** @type {__VLS_StyleScopedClasses['store-table']} */ ;
/** @type {__VLS_StyleScopedClasses['store-table']} */ ;
/** @type {__VLS_StyleScopedClasses['store-table']} */ ;
/** @type {__VLS_StyleScopedClasses['group-tags-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['group-tags-wrapper']} */ ;
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
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['add-group-section']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add-group']} */ ;
/** @type {__VLS_StyleScopedClasses['existing-groups']} */ ;
/** @type {__VLS_StyleScopedClasses['user-management-note']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
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
/** @type {__VLS_StyleScopedClasses['store-table']} */ ;
/** @type {__VLS_StyleScopedClasses['store-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['group-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['store-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['add-group-form']} */ ;
/** @type {__VLS_StyleScopedClasses['group-item']} */ ;
/** @type {__VLS_StyleScopedClasses['store-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
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
    placeholder: "Search stores...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddStoreModal) },
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Closed",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterLocation),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [location] of __VLS_vFor((__VLS_ctx.locations))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (location),
        value: (location),
    });
    (location);
    // @ts-ignore
    [totalItems, onSearchChange, searchQuery, openAddStoreModal, onFilterChange, onFilterChange, filterStatus, filterLocation, locations,];
}
if (__VLS_ctx.hasActiveFilters) {
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
        ...{ class: "store-table" },
    });
    /** @type {__VLS_StyleScopedClasses['store-table']} */ ;
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
    if (__VLS_ctx.paginatedStores.length === 0) {
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
            ...{ onClick: (__VLS_ctx.openAddStoreModal) },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    }
    for (const [store, index] of __VLS_vFor((__VLS_ctx.paginatedStores))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (store.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        ((__VLS_ctx.currentPage - 1) * __VLS_ctx.pageSize + index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "code" },
        });
        /** @type {__VLS_StyleScopedClasses['code']} */ ;
        (store.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "store-name-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['store-name-cell']} */ ;
        (store.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (store.location || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "group-tags-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['group-tags-wrapper']} */ ;
        for (const [group] of __VLS_vFor((store.groups))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (group.id),
                ...{ class: "group-tag" },
                title: (group.name),
            });
            /** @type {__VLS_StyleScopedClasses['group-tag']} */ ;
            (group.name);
            // @ts-ignore
            [openAddStoreModal, hasActiveFilters, clearFilters, printReport, openExportModal, loading, paginatedStores, paginatedStores, currentPage, pageSize,];
        }
        if (!store.groups || store.groups.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "no-items" },
            });
            /** @type {__VLS_StyleScopedClasses['no-items']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (store.totalUsers || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', store.status?.toLowerCase() || 'active']) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (store.status || 'Active');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openEditStore(store);
                    // @ts-ignore
                    [openEditStore,];
                } },
            ...{ class: "icon-btn" },
            title: "Edit Store",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openManageGroups(store);
                    // @ts-ignore
                    [openManageGroups,];
                } },
            ...{ class: "icon-btn" },
            title: "Manage Groups",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openToggleStatus(store);
                    // @ts-ignore
                    [openToggleStatus,];
                } },
            ...{ class: "icon-btn" },
            title: "Toggle Status",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
        (store.status === 'Active' ? '⏸️' : '▶️');
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
if (__VLS_ctx.showStoreModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeStoreModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container store-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['store-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingStore ? '✏️ Edit Store' : '➕ Add New Store');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeStoreModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveStore) },
        ...{ class: "store-form" },
    });
    /** @type {__VLS_StyleScopedClasses['store-form']} */ ;
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
        value: (__VLS_ctx.storeForm.name),
        type: "text",
        required: true,
        placeholder: "e.g., Fiber Main Store",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.storeForm.location),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Wana Gebi",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Gebi Kuter 2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Gebi Kuter 3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Mekanisa office",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Other Location",
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
        value: (__VLS_ctx.storeForm.status),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Active",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Inactive",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Closed",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeStoreModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveStore) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingStore),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.savingStore ? 'Saving...' : (__VLS_ctx.editingStore ? 'Update' : 'Add'));
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
    (__VLS_ctx.selectedStore?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeGroupModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-group-section" },
    });
    /** @type {__VLS_StyleScopedClasses['add-group-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-group-form" },
    });
    /** @type {__VLS_StyleScopedClasses['add-group-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.selectedGroupToAdd),
        ...{ class: "group-select" },
    });
    /** @type {__VLS_StyleScopedClasses['group-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [group] of __VLS_vFor((__VLS_ctx.availableGroupsToAdd))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (group.id),
            value: (group.id),
        });
        (group.name);
        (group.code);
        // @ts-ignore
        [currentPage, pageSize, totalPages, changePageSize, showStoreModal, closeStoreModal, closeStoreModal, closeStoreModal, editingStore, editingStore, saveStore, saveStore, storeForm, storeForm, storeForm, savingStore, savingStore, showGroupModal, closeGroupModal, closeGroupModal, selectedStore, selectedGroupToAdd, availableGroupsToAdd,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addGroupToStore) },
        ...{ class: "btn-add-group" },
        disabled: (!__VLS_ctx.selectedGroupToAdd || __VLS_ctx.addingGroup),
    });
    /** @type {__VLS_StyleScopedClasses['btn-add-group']} */ ;
    (__VLS_ctx.addingGroup ? 'Adding...' : '➕ Add Group');
    if (__VLS_ctx.availableGroupsToAdd.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-available-groups" },
        });
        /** @type {__VLS_StyleScopedClasses['no-available-groups']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "existing-groups" },
    });
    /** @type {__VLS_StyleScopedClasses['existing-groups']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.selectedStore?.groups?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "groups-list" },
    });
    /** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
    if (__VLS_ctx.selectedStore?.groups?.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-groups" },
        });
        /** @type {__VLS_StyleScopedClasses['no-groups']} */ ;
    }
    for (const [group] of __VLS_vFor((__VLS_ctx.selectedStore?.groups))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (group.id),
            ...{ class: "group-item" },
        });
        /** @type {__VLS_StyleScopedClasses['group-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "group-info" },
        });
        /** @type {__VLS_StyleScopedClasses['group-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "group-name" },
        });
        /** @type {__VLS_StyleScopedClasses['group-name']} */ ;
        (group.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "group-user-count" },
        });
        /** @type {__VLS_StyleScopedClasses['group-user-count']} */ ;
        (group.users?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "group-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['group-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showGroupModal))
                        return;
                    __VLS_ctx.openRemoveGroupModal(group);
                    // @ts-ignore
                    [selectedStore, selectedStore, selectedStore, selectedGroupToAdd, availableGroupsToAdd, addGroupToStore, addingGroup, addingGroup, openRemoveGroupModal,];
                } },
            ...{ class: "icon-btn-small delete-btn" },
            title: "Remove from store",
        });
        /** @type {__VLS_StyleScopedClasses['icon-btn-small']} */ ;
        /** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "user-management-note" },
    });
    /** @type {__VLS_StyleScopedClasses['user-management-note']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeGroupModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showRemoveGroupModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeRemoveGroupModal) },
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
        ...{ onClick: (__VLS_ctx.closeRemoveGroupModal) },
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
    (__VLS_ctx.removeGroupItem?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedStore?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "delete-warning" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "delete-question" },
    });
    /** @type {__VLS_StyleScopedClasses['delete-question']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeRemoveGroupModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmRemoveGroup) },
        ...{ class: "btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeToggleModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.toggleStore?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.toggleStore?.status?.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.toggleStore?.status);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.toggleNewStatus?.toLowerCase()]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.toggleNewStatus);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
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
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
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
                [closeGroupModal, selectedStore, showRemoveGroupModal, closeRemoveGroupModal, closeRemoveGroupModal, closeRemoveGroupModal, removeGroupItem, confirmRemoveGroup, showToggleModal, closeToggleModal, closeToggleModal, closeToggleModal, toggleStore, toggleStore, toggleStore, toggleNewStatus, toggleNewStatus, confirmToggleStatus, showExportModal, closeExportModal, closeExportModal, exportType,];
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
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'groups';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "groups",
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
