import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import transactionService from '@/stores/transactionService';
import balanceService from '@/stores/balanceService';
// ================================================================
// STATE
// ================================================================
const router = useRouter();
const authStore = useAuthStore();
const transactions = ref([]);
const stores = ref([]);
const allGroups = ref([]);
const categories = ref([]);
const inventoryItems = ref([]);
const isLoading = ref(true);
const paginationInfo = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
});
// User data
const userAssignedStoreId = ref(null);
const userAssignedStoreName = ref(null);
const userAssignedGroupId = ref(null);
const userAssignedGroupName = ref(null);
const userIsAdmin = ref(false);
const searchQuery = ref('');
const filterStore = ref('');
const filterGroup = ref('');
const filterCategory = ref('');
const filterItem = ref('');
const filterType = ref('');
const filterDate = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const expandedRow = ref(null);
const exporting = ref(false);
const exportType = ref('full');
const showExportModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => {
    return filterStore.value || filterGroup.value || filterCategory.value || filterItem.value || filterType.value || filterDate.value || searchQuery.value;
});
// ✅ Use server-side pagination - transactions already contains the current page
const totalPages = computed(() => {
    return paginationInfo.value.totalPages || 1;
});
const totalItems = computed(() => {
    return paginationInfo.value.total || 0;
});
const totalStockIn = computed(() => {
    return transactions.value.filter(t => t.type === 'Stock In').length;
});
const totalStockOut = computed(() => {
    return transactions.value.filter(t => t.type === 'Stock Out').length;
});
// ================================================================
// USER DATA
// ================================================================
const loadUserData = () => {
    const user = authStore.user;
    if (user) {
        userIsAdmin.value = user.isAdmin || user.role === 'admin' || user.role === 'Admin';
        if (user && 'assignedStore' in user && user.assignedStore) {
            const assignedStore = user.assignedStore;
            userAssignedStoreId.value = assignedStore.id || null;
            userAssignedStoreName.value = assignedStore.name || null;
        }
        else {
            userAssignedStoreId.value = null;
            userAssignedStoreName.value = null;
        }
        if (user && 'assignedGroup' in user && user.assignedGroup) {
            const assignedGroup = user.assignedGroup;
            userAssignedGroupId.value = assignedGroup.id || null;
            userAssignedGroupName.value = assignedGroup.name || null;
        }
        else {
            userAssignedGroupId.value = null;
            userAssignedGroupName.value = null;
        }
    }
};
// ================================================================
// API METHODS
// ================================================================
const fetchStores = async () => {
    try {
        const response = await balanceService.getStores();
        stores.value = response.data || [];
    }
    catch (error) {
        console.error('Error fetching stores:', error);
    }
};
const fetchGroups = async () => {
    try {
        const response = await balanceService.getGroups();
        allGroups.value = response.data || [];
    }
    catch (error) {
        console.error('Error fetching groups:', error);
    }
};
const fetchCategories = async () => {
    try {
        const response = await balanceService.getActiveCategories();
        if (response.success) {
            categories.value = response.data || [];
            console.log(`✅ Loaded ${categories.value.length} categories for transactions`);
        }
    }
    catch (error) {
        console.error('Error fetching categories:', error);
    }
};
const fetchItems = async () => {
    try {
        const response = await balanceService.getActiveItems();
        inventoryItems.value = response.data || [];
    }
    catch (error) {
        console.error('Error fetching items:', error);
    }
};
// ✅ FIXED: fetchTransactions with server-side pagination
const fetchTransactions = async () => {
    isLoading.value = true;
    try {
        const filters = {};
        // If non-admin with assigned store, filter by their store
        if (!userIsAdmin.value && userAssignedStoreId.value) {
            filters.storeId = userAssignedStoreId.value;
        }
        // If non-admin with assigned group, filter by their group
        if (!userIsAdmin.value && userAssignedGroupId.value) {
            filters.groupId = userAssignedGroupId.value;
        }
        // Add UI filters
        if (userIsAdmin.value) {
            if (filterStore.value) {
                filters.storeId = Number(filterStore.value);
            }
            if (filterGroup.value) {
                filters.groupId = Number(filterGroup.value);
            }
        }
        else {
            if (filterItem.value) {
                filters.itemId = Number(filterItem.value);
            }
            if (filterType.value) {
                filters.transactionType = filterType.value;
            }
        }
        if (filterCategory.value) {
            filters.categoryId = Number(filterCategory.value);
        }
        if (searchQuery.value) {
            filters.search = searchQuery.value;
        }
        // ✅ Server-side pagination
        filters.page = currentPage.value;
        filters.limit = pageSize.value;
        const response = await transactionService.getTransactions(filters);
        transactions.value = response.data || [];
        if (response.pagination) {
            paginationInfo.value = {
                page: response.pagination.page || 1,
                limit: response.pagination.limit || 10,
                total: response.pagination.total || 0,
                totalPages: response.pagination.totalPages || 1
            };
            currentPage.value = paginationInfo.value.page;
            pageSize.value = paginationInfo.value.limit;
        }
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        showToastMessage('Failed to load transactions', 'error');
        transactions.value = [];
    }
    finally {
        isLoading.value = false;
    }
};
// ================================================================
// HELPER METHODS
// ================================================================
const getItemStandardName = (itemId) => {
    if (!itemId)
        return null;
    const transaction = transactions.value.find(t => t.itemId === itemId);
    if (transaction)
        return transaction.itemStandardName || null;
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.standardName || null : null;
};
const getItemCommonName = (itemId) => {
    if (!itemId)
        return 'Unnamed';
    const transaction = transactions.value.find(t => t.itemId === itemId);
    if (transaction)
        return transaction.itemCommonName || 'Unnamed';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? (item.name || item.standardName || 'Unnamed') : 'Unnamed';
};
const getItemCode = (itemId, transaction) => {
    if (transaction && transaction.itemCode) {
        return transaction.itemCode;
    }
    const t = transactions.value.find(tx => tx.itemId === itemId);
    if (t)
        return t.itemCode || 'N/A';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.code || 'N/A' : 'N/A';
};
const getItemUnit = (itemId, transaction) => {
    if (transaction && transaction.uomCode) {
        return transaction.uomCode;
    }
    const t = transactions.value.find(tx => tx.itemId === itemId);
    if (t)
        return t.uomCode || '';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.uomCode || '' : '';
};
const getStoreName = (storeId) => {
    const store = stores.value.find(s => s.id === storeId);
    return store ? store.name : 'Unknown';
};
const getGroupName = (groupId) => {
    const group = allGroups.value.find(g => g.id === groupId);
    return group ? group.name : 'Unknown';
};
const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
};
const formatDateTime = (dateString) => {
    if (!dateString)
        return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
const formatDateShort = (dateString) => {
    if (!dateString)
        return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// ================================================================
// UI HELPERS
// ================================================================
const toggleExpand = (id) => {
    expandedRow.value = expandedRow.value === id ? null : id;
};
// ================================================================
// FILTERS & PAGINATION
// ================================================================
const onSearchChange = () => {
    currentPage.value = 1;
    fetchTransactions();
};
const onFilterChange = () => {
    currentPage.value = 1;
    fetchTransactions();
};
const clearFilters = () => {
    filterStore.value = '';
    filterGroup.value = '';
    filterCategory.value = '';
    filterItem.value = '';
    filterType.value = '';
    filterDate.value = '';
    searchQuery.value = '';
    currentPage.value = 1;
    showToastMessage('Filters cleared', 'info');
    fetchTransactions();
};
const changePage = (page) => {
    if (page < 1 || page > totalPages.value)
        return;
    currentPage.value = page;
    fetchTransactions();
};
const changePageSize = () => {
    currentPage.value = 1;
    fetchTransactions();
};
// ================================================================
// PRINT & EXPORT
// ================================================================
const printReport = () => {
    const query = {};
    if (filterStore.value)
        query.storeId = filterStore.value;
    if (filterGroup.value)
        query.groupId = filterGroup.value;
    if (filterCategory.value)
        query.categoryId = filterCategory.value;
    if (filterItem.value)
        query.itemId = filterItem.value;
    if (filterType.value)
        query.type = filterType.value;
    if (filterDate.value)
        query.date = filterDate.value;
    if (searchQuery.value)
        query.search = searchQuery.value;
    router.push({
        name: 'print-transactions',
        query: query
    });
};
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
        const filters = {};
        if (userIsAdmin.value) {
            if (filterStore.value) {
                filters.storeId = Number(filterStore.value);
            }
            if (filterGroup.value) {
                filters.groupId = Number(filterGroup.value);
            }
        }
        else {
            if (userAssignedStoreId.value) {
                filters.storeId = userAssignedStoreId.value;
            }
            if (userAssignedGroupId.value) {
                filters.groupId = userAssignedGroupId.value;
            }
        }
        if (filterCategory.value) {
            filters.categoryId = Number(filterCategory.value);
        }
        if (filterItem.value) {
            filters.itemId = Number(filterItem.value);
        }
        if (filterType.value) {
            filters.transactionType = filterType.value;
        }
        if (searchQuery.value) {
            filters.search = searchQuery.value;
        }
        filters.type = exportType.value;
        const blob = await transactionService.exportTransactions(filters);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Store_Transactions_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        closeExportModal();
        showToastMessage('Excel export completed successfully!', 'success');
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export transactions', 'error');
    }
    finally {
        exporting.value = false;
    }
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
// LIFECYCLE HOOKS
// ================================================================
onMounted(async () => {
    loadUserData();
    try {
        await Promise.all([
            fetchStores(),
            fetchGroups(),
            fetchCategories(),
            fetchItems()
        ]);
        if (!userIsAdmin.value) {
            if (userAssignedStoreId.value) {
                filterStore.value = String(userAssignedStoreId.value);
                console.log('🔒 Auto-selected store filter:', userAssignedStoreName.value);
            }
            if (userAssignedGroupId.value) {
                filterGroup.value = String(userAssignedGroupId.value);
                console.log('🔒 Auto-selected group filter:', userAssignedGroupName.value);
            }
        }
        await fetchTransactions();
    }
    catch (error) {
        console.error('Error loading page:', error);
        showToastMessage('Failed to load data', 'error');
    }
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
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['quantity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['quantity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['has-category']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['no-category']} */ ;
/** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
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
    placeholder: "Search transactions...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "action-buttons" },
});
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openExportModal) },
    ...{ class: "btn-export" },
    disabled: (__VLS_ctx.exporting),
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
if (__VLS_ctx.exporting) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.exporting ? "Report..." : "Report");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterStore),
    ...{ class: "filter-select" },
    disabled: (!__VLS_ctx.userIsAdmin && !!__VLS_ctx.userAssignedStoreId),
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
    [totalItems, onSearchChange, searchQuery, openExportModal, exporting, exporting, exporting, onFilterChange, filterStore, userIsAdmin, userAssignedStoreId, stores,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterGroup),
    ...{ class: "filter-select" },
    disabled: (!__VLS_ctx.userIsAdmin && !!__VLS_ctx.userAssignedGroupId),
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [group] of __VLS_vFor((__VLS_ctx.allGroups))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (group.id),
        value: (group.id),
    });
    (group.name);
    // @ts-ignore
    [onFilterChange, userIsAdmin, filterGroup, userAssignedGroupId, allGroups,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterCategory),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [cat] of __VLS_vFor((__VLS_ctx.categories))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cat.id),
        value: (cat.id),
    });
    (cat.name);
    // @ts-ignore
    [onFilterChange, filterCategory, categories,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterType),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Stock In",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Stock Out",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.filterDate),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "today",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "yesterday",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "week",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "month",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "3months",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "6months",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "12months",
});
if (__VLS_ctx.hasActiveFilters && __VLS_ctx.userIsAdmin) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
if (!__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.totalStockIn);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.totalStockOut);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.totalItems);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
    id: "printable-area",
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
if (__VLS_ctx.isLoading) {
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "transaction-table" },
    });
    /** @type {__VLS_StyleScopedClasses['transaction-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.transactions.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
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
    }
    for (const [transaction, index] of __VLS_vFor((__VLS_ctx.transactions))) {
        (transaction.id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: ({
                    'expanded-row': __VLS_ctx.expandedRow === transaction.id
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['expanded-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    __VLS_ctx.toggleExpand(transaction.id);
                    // @ts-ignore
                    [totalItems, onFilterChange, onFilterChange, userIsAdmin, filterType, filterDate, hasActiveFilters, clearFilters, isLoading, isLoading, totalStockIn, totalStockOut, transactions, transactions, expandedRow, toggleExpand,];
                } },
            ...{ class: "expand-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
        (__VLS_ctx.expandedRow === transaction.id ? "▼" : "▶");
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "date-time" },
        });
        /** @type {__VLS_StyleScopedClasses['date-time']} */ ;
        (__VLS_ctx.formatDateShort(transaction.createdAt));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "item-code" },
        });
        /** @type {__VLS_StyleScopedClasses['item-code']} */ ;
        (transaction.itemCode || __VLS_ctx.getItemCode(transaction.itemId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-info" },
        });
        /** @type {__VLS_StyleScopedClasses['item-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-common-name" },
        });
        /** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
        (transaction.itemCommonName || __VLS_ctx.getItemCommonName(transaction.itemId) || 'Unnamed');
        if (transaction.itemStandardName || __VLS_ctx.getItemStandardName(transaction.itemId)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-standard-name" },
            });
            /** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
            (transaction.itemStandardName || __VLS_ctx.getItemStandardName(transaction.itemId));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "category-tag" },
            ...{ class: (transaction.categoryName ? 'has-category' : 'no-category') },
        });
        /** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
        (transaction.categoryName || 'Uncategorized');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['type-badge', transaction.type === 'Stock In' ? 'stock-in' : 'stock-out']) },
        });
        /** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
        (transaction.type === 'Stock In' ? '📥' : '📤');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "quantity-amount" },
        });
        /** @type {__VLS_StyleScopedClasses['quantity-amount']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['quantity-value', transaction.type === 'Stock In' ? 'positive' : 'negative']) },
        });
        /** @type {__VLS_StyleScopedClasses['quantity-value']} */ ;
        (transaction.type === 'Stock In' ? '+' : '-');
        (__VLS_ctx.formatNumber(transaction.quantity));
        if (__VLS_ctx.expandedRow === transaction.id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: "detail-expand-row" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "7",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "expand-details" },
            });
            /** @type {__VLS_StyleScopedClasses['expand-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-container" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-container']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-row" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.id);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.formatDateTime(transaction.createdAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.getStoreName(transaction.storeId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.getGroupName(transaction.groupId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.type);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.itemCode || __VLS_ctx.getItemCode(transaction.itemId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.itemCommonName || __VLS_ctx.getItemCommonName(transaction.itemId) || 'Unnamed');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.itemStandardName || __VLS_ctx.getItemStandardName(transaction.itemId) || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.categoryName || 'Uncategorized');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.uomCode || __VLS_ctx.getItemUnit(transaction.itemId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.type === 'Stock In' ? '+' : '-');
            (__VLS_ctx.formatNumber(transaction.quantity));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (transaction.type === 'Stock In' ? 'From' : 'To');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.type === 'Stock In' ? transaction.sourceStore : transaction.destinationStore);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.updatedBy || 'System');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.remark || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (transaction.referenceType || '-');
        }
        // @ts-ignore
        [expandedRow, expandedRow, formatDateShort, getItemCode, getItemCode, getItemCommonName, getItemCommonName, getItemStandardName, getItemStandardName, getItemStandardName, formatNumber, formatNumber, formatDateTime, getStoreName, getGroupName, getItemUnit,];
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
                [totalItems, changePage, currentPage,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (50),
    });
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
                [currentPage, totalPages, changePageSize, pageSize, showExportModal, closeExportModal, closeExportModal, exportType,];
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
    (__VLS_ctx.exporting ? 'Generating...' : 'Generate Report');
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
[exporting, exporting, closeExportModal, exportType, exportSelectedReport, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
