import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import itemCostService from '@/stores/itemCostService';
import { debounce } from 'lodash-es';
// ================================================================
// STATE
// ================================================================
const loading = ref(false);
const exporting = ref(false);
const searchQuery = ref('');
const selectedStoreId = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const expandedRow = ref(null);
const totalItems = ref(0);
const totalPages = ref(0);
// Data from API
const allStores = ref([]);
const allGroups = ref([]);
const items = ref([]);
// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// ================================================================
// PERFORMANCE: Debounced search
// ================================================================
const debouncedLoad = debounce(async () => {
    currentPage.value = 1;
    await loadAllData();
}, 300);
const onSearchChange = () => {
    if (!searchQuery.value) {
        currentPage.value = 1;
        loadAllData();
        return;
    }
    debouncedLoad();
};
const clearSearch = () => {
    searchQuery.value = '';
    currentPage.value = 1;
    loadAllData();
};
// ================================================================
// COMPUTED - FILTERED & PAGINATED ITEMS
// ================================================================
const pageTotal = computed(() => {
    if (!items.value || items.value.length === 0)
        return 0;
    return items.value
        .filter(item => (item.status === 'Active' || item.status === 'Completed') && !item.isExcluded)
        .reduce((sum, item) => sum + (item.totalCost || 0), 0);
});
const hasActiveFilters = computed(() => {
    return selectedStoreId.value || filterStatus.value || searchQuery.value;
});
// ================================================================
// METHODS
// ================================================================
const getStoreName = (storeId) => {
    const store = allStores.value.find(s => s.id === storeId);
    return store ? store.name : 'Unknown Store';
};
const isStoreVisible = (storeId) => {
    if (!selectedStoreId.value)
        return true;
    return storeId === Number(selectedStoreId.value);
};
// ================================================================
// 🔥 TOGGLE COST EXCLUSION
// ================================================================
const toggleItemStatus = async (item) => {
    try {
        const isCurrentlyExcluded = item.isExcluded || item.status === 'Inactive';
        const newStatus = isCurrentlyExcluded ? 'Active' : 'Inactive';
        const response = await itemCostService.toggleItemStatus(item.id, newStatus);
        if (response.success) {
            const updatedItem = response.data.item;
            const index = items.value.findIndex(i => i.id === item.id);
            if (index !== -1) {
                items.value[index] = updatedItem;
            }
            showToastMessage(response.message || `Item "${item.itemName}" ${updatedItem.isExcluded ? 'excluded from' : 'included in'} cost calculations`, updatedItem.isExcluded ? 'warning' : 'success');
        }
        else {
            showToastMessage(response.error || 'Failed to update status', 'error');
        }
    }
    catch (error) {
        console.error('Error toggling status:', error);
        showToastMessage('Failed to update status', 'error');
    }
};
// ================================================================
// API METHODS
// ================================================================
const loadStores = async () => {
    try {
        const response = await itemCostService.getStores();
        if (response.success) {
            allStores.value = response.data;
        }
    }
    catch (error) {
        console.error('Error loading stores:', error);
        showToastMessage('Failed to load stores', 'error');
    }
};
const loadItems = async () => {
    loading.value = true;
    try {
        const params = {
            page: currentPage.value,
            limit: pageSize.value,
        };
        if (searchQuery.value) {
            params.search = searchQuery.value;
        }
        if (selectedStoreId.value) {
            params.storeId = Number(selectedStoreId.value);
        }
        if (filterStatus.value) {
            params.status = filterStatus.value;
        }
        console.log('📄 Loading page:', currentPage.value, 'with params:', params);
        const response = await itemCostService.getItemsWithCost(params);
        if (response.success) {
            items.value = response.data;
            totalItems.value = response.pagination.total;
            totalPages.value = response.pagination.pages;
            console.log('✅ Loaded page', currentPage.value, 'of', totalPages.value);
        }
        else {
            showToastMessage(response.error || 'Failed to load items', 'error');
        }
    }
    catch (error) {
        console.error('Error loading items:', error);
        showToastMessage('Failed to load items', 'error');
    }
    finally {
        loading.value = false;
    }
};
const loadAllData = async () => {
    await loadItems();
};
const printReport = () => {
    window.print();
};
// ================================================================
// 📥 DOWNLOAD CSV HELPER
// ================================================================
const downloadCSV = (data) => {
    if (!data || data.length === 0) {
        showToastMessage('No data to export', 'warning');
        return;
    }
    // Get all columns from the first item
    const columns = Object.keys(data[0]);
    // Build CSV header
    const csvRows = [];
    csvRows.push(columns.join(','));
    // Build CSV rows
    for (const item of data) {
        const row = columns.map(key => {
            let value = item[key];
            // Handle special cases
            if (value === null || value === undefined) {
                value = '';
            }
            // Handle arrays
            if (Array.isArray(value)) {
                value = value.join(', ');
            }
            // Handle booleans
            if (typeof value === 'boolean') {
                value = value ? 'Yes' : 'No';
            }
            // Handle numbers with decimals
            if (typeof value === 'number' && !Number.isInteger(value)) {
                value = value.toFixed(2);
            }
            const stringValue = String(value);
            // Escape special characters for CSV
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(row.join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `cost_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToastMessage(`Exported ${data.length} items to CSV!`, 'success');
};
// ================================================================
// 📊 EXPORT ALL FILTERED DATA
// ================================================================
const exportAllFilteredData = async () => {
    try {
        exporting.value = true;
        showToastMessage('Preparing export...', 'info');
        const params = {};
        if (selectedStoreId.value)
            params.storeId = Number(selectedStoreId.value);
        if (filterStatus.value)
            params.status = filterStatus.value;
        if (searchQuery.value)
            params.search = searchQuery.value;
        console.log('📤 Exporting with params:', params);
        // 🔥 Get data directly from exportAllItems
        const response = await itemCostService.exportAllItems(params);
        if (response.success && response.data && response.data.length > 0) {
            // 🔥 Use the downloadCSV function
            downloadCSV(response.data);
        }
        else if (response.success && response.data && response.data.length === 0) {
            showToastMessage('No data to export for current filters', 'warning');
        }
        else {
            showToastMessage(response.error || 'Failed to fetch data for export', 'error');
        }
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export data', 'error');
    }
    finally {
        exporting.value = false;
    }
};
// ================================================================
// UI METHODS
// ================================================================
const onFilterChange = () => {
    currentPage.value = 1;
    loadAllData();
};
const clearFilters = () => {
    selectedStoreId.value = '';
    filterStatus.value = '';
    searchQuery.value = '';
    currentPage.value = 1;
    showToastMessage('Filters cleared', 'info');
    loadAllData();
};
const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        loadItems();
    }
};
const changePageSize = () => {
    currentPage.value = 1;
    loadAllData();
};
const toggleExpand = (id) => {
    expandedRow.value = expandedRow.value === id ? null : id;
};
// ================================================================
// HELPER METHODS
// ================================================================
const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value))
        return '0.00';
    return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value))
        return '0';
    return Number(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const formatDate = (dateString) => {
    if (!dateString)
        return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
// WATCHERS
// ================================================================
watch([selectedStoreId, filterStatus], () => {
    currentPage.value = 1;
    loadAllData();
}, { deep: true });
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    await loadStores();
    await loadAllData();
});
onUnmounted(() => {
    debouncedLoad.cancel();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-export-all']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-all']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-clear']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['total-value']} */ ;
/** @type {__VLS_StyleScopedClasses['total-value']} */ ;
/** @type {__VLS_StyleScopedClasses['total-value']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
/** @type {__VLS_StyleScopedClasses['total-value']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
/** @type {__VLS_StyleScopedClasses['store-breakdown-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-breakdown-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-breakdown-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-breakdown-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-conflict']} */ ;
/** @type {__VLS_StyleScopedClasses['store-header']} */ ;
/** @type {__VLS_StyleScopedClasses['store-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['store-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['group-row']} */ ;
/** @type {__VLS_StyleScopedClasses['group-row']} */ ;
/** @type {__VLS_StyleScopedClasses['group-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-total']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-content']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-top-section']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-top-section']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
/** @type {__VLS_StyleScopedClasses['store-header']} */ ;
/** @type {__VLS_StyleScopedClasses['store-status']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['group-row']} */ ;
/** @type {__VLS_StyleScopedClasses['group-quantity']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-details']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-partial']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-incomplete']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-inactive']} */ ;
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
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "search-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['search-badge']} */ ;
    (__VLS_ctx.searchQuery);
}
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
    ...{ onKeyup: (__VLS_ctx.clearSearch) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search by code, name, brand...",
});
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (__VLS_ctx.clearSearch) },
        ...{ class: "search-clear" },
        title: "Clear search",
    });
    /** @type {__VLS_StyleScopedClasses['search-clear']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportAllFilteredData) },
    ...{ class: "btn-export-all" },
    disabled: (__VLS_ctx.exporting),
});
/** @type {__VLS_StyleScopedClasses['btn-export-all']} */ ;
if (__VLS_ctx.exporting) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.exporting ? 'Exporting...' : `Export All (${__VLS_ctx.totalItems})`);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "filter-label" },
});
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.selectedStoreId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [store] of __VLS_vFor((__VLS_ctx.allStores))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (store.id),
        value: (store.id),
    });
    (store.name);
    // @ts-ignore
    [totalItems, totalItems, searchQuery, searchQuery, searchQuery, searchQuery, onSearchChange, clearSearch, clearSearch, exportAllFilteredData, exporting, exporting, exporting, onFilterChange, selectedStoreId, allStores,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "filter-label" },
});
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
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
    value: "Partial",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Incomplete",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Inactive",
});
if (__VLS_ctx.hasActiveFilters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "search-results-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['search-results-badge']} */ ;
    (__VLS_ctx.totalItems);
    (__VLS_ctx.searchQuery);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
    id: "printable-area",
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "cost-table" },
    });
    /** @type {__VLS_StyleScopedClasses['cost-table']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.items.length === 0) {
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
        if (__VLS_ctx.searchQuery) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.searchQuery);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        }
        if (__VLS_ctx.selectedStoreId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "empty-sub" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-sub']} */ ;
        }
        if (__VLS_ctx.searchQuery && !__VLS_ctx.selectedStoreId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "empty-sub" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-sub']} */ ;
        }
    }
    for (const [item] of __VLS_vFor((__VLS_ctx.items))) {
        (item.id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: ({
                    'expanded-row': __VLS_ctx.expandedRow === item.id,
                    'status-row-active': item.status === 'Active' || item.status === 'Completed',
                    'status-row-partial': item.status === 'Partial',
                    'status-row-incomplete': item.status === 'Incomplete',
                    'status-row-inactive': item.status === 'Inactive' || item.isExcluded
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['expanded-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-row-active']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-row-partial']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-row-incomplete']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-row-inactive']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.toggleExpand(item.id);
                    // @ts-ignore
                    [totalItems, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, onFilterChange, selectedStoreId, selectedStoreId, filterStatus, hasActiveFilters, clearFilters, loading, items, items, expandedRow, toggleExpand,];
                } },
            ...{ class: "expand-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
        (__VLS_ctx.expandedRow === item.id ? "▼" : "▶");
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "item-code" },
        });
        /** @type {__VLS_StyleScopedClasses['item-code']} */ ;
        (item.itemCode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-info" },
        });
        /** @type {__VLS_StyleScopedClasses['item-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "item-name" },
        });
        /** @type {__VLS_StyleScopedClasses['item-name']} */ ;
        (item.itemName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "item-standard" },
        });
        /** @type {__VLS_StyleScopedClasses['item-standard']} */ ;
        (item.itemStandardName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "uom-code" },
        });
        /** @type {__VLS_StyleScopedClasses['uom-code']} */ ;
        (item.conversionUOM);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "balance-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "balance-value" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-value']} */ ;
        (__VLS_ctx.formatNumber(item.totalQty));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "cost-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['cost-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cost-details" },
        });
        /** @type {__VLS_StyleScopedClasses['cost-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "unit-cost" },
        });
        /** @type {__VLS_StyleScopedClasses['unit-cost']} */ ;
        (__VLS_ctx.formatCurrency(item.unitCost));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "total-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "total-value" },
            ...{ class: ({
                    'active-value': item.status === 'Active' || item.status === 'Completed',
                    'partial-value': item.status === 'Partial',
                    'incomplete-value': item.status === 'Incomplete',
                    'inactive-value': item.status === 'Inactive' || item.isExcluded
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['total-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['active-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['partial-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['incomplete-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['inactive-value']} */ ;
        (__VLS_ctx.formatCurrency(item.totalCost));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.toggleItemStatus(item);
                    // @ts-ignore
                    [expandedRow, formatNumber, formatCurrency, formatCurrency, toggleItemStatus,];
                } },
            ...{ class: (['status-badge',
                    item.status === 'Active' || item.status === 'Completed' ? 'status-active' :
                        item.status === 'Partial' ? 'status-partial' :
                            item.status === 'Incomplete' ? 'status-incomplete' :
                                'status-inactive'
                ]) },
            ...{ style: {} },
            title: (item.isExcluded ? 'Click to include in cost calculations' : 'Click to exclude from cost calculations'),
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (item.status);
        if (item.isExcluded) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "exclusion-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['exclusion-icon']} */ ;
        }
        if (__VLS_ctx.expandedRow === item.id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: "detail-expand-row" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-expand-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "8",
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
                ...{ class: "detail-top-section" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-top-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card item-detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['item-detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-vertical" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (item.itemCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (item.itemName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (item.itemStandardName || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (item.categoryName || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (item.brand || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (item.model || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (item.baseUOM);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.expandedRow === item.id))
                            return;
                        __VLS_ctx.toggleItemStatus(item);
                        // @ts-ignore
                        [expandedRow, toggleItemStatus,];
                    } },
                ...{ class: (['status-badge',
                        item.status === 'Active' || item.status === 'Completed' ? 'status-active' :
                            item.status === 'Partial' ? 'status-partial' :
                                item.status === 'Incomplete' ? 'status-incomplete' :
                                    'status-inactive'
                    ]) },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (item.status);
            if (item.isExcluded && item.exclusionReason) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value inactive-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['inactive-text']} */ ;
                (item.exclusionReason);
            }
            if (item.statusMessage) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                (item.statusMessage);
            }
            if (item.hasMissingData && item.missingData && item.missingData.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value missing-data" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['missing-data']} */ ;
                (item.missingData.join(', '));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card cost-summary-card" },
                ...{ class: ({
                        'card-active': item.status === 'Active' || item.status === 'Completed',
                        'card-partial': item.status === 'Partial',
                        'card-incomplete': item.status === 'Incomplete',
                        'card-inactive': item.status === 'Inactive' || item.isExcluded
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['cost-summary-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['card-active']} */ ;
            /** @type {__VLS_StyleScopedClasses['card-partial']} */ ;
            /** @type {__VLS_StyleScopedClasses['card-incomplete']} */ ;
            /** @type {__VLS_StyleScopedClasses['card-inactive']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-vertical" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-vertical']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.formatCurrency(item.unitCost));
            (item.conversionUOM);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            (__VLS_ctx.formatNumber(item.totalQty));
            (item.conversionUOM);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "value highlight-total" },
            });
            /** @type {__VLS_StyleScopedClasses['value']} */ ;
            /** @type {__VLS_StyleScopedClasses['highlight-total']} */ ;
            (__VLS_ctx.formatCurrency(item.totalCost));
            if (item.isExcluded) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value inactive-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['inactive-text']} */ ;
            }
            if (item.status === 'Partial') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value partial-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['partial-text']} */ ;
            }
            if (item.status === 'Incomplete') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value incomplete-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['incomplete-text']} */ ;
            }
            if (item.status === 'Active' || item.status === 'Completed') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value active-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['active-text']} */ ;
            }
            if (item.status === 'Partial' && item.excludedStores.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value partial-text" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['partial-text']} */ ;
                (item.excludedStores.join(', '));
            }
            if (__VLS_ctx.selectedStoreId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "value highlight-total" },
                });
                /** @type {__VLS_StyleScopedClasses['value']} */ ;
                /** @type {__VLS_StyleScopedClasses['highlight-total']} */ ;
                (__VLS_ctx.getStoreName(Number(__VLS_ctx.selectedStoreId)));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-card full-width breakdown-card" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
            /** @type {__VLS_StyleScopedClasses['breakdown-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "breakdown-container" },
            });
            /** @type {__VLS_StyleScopedClasses['breakdown-container']} */ ;
            for (const [store] of __VLS_vFor((item.storeBreakdown))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (store.storeId),
                    ...{ class: "store-breakdown-card" },
                    ...{ class: ({
                            'store-conflict': store.hasConflict,
                            'store-excluded': store.isExcluded,
                            'store-hidden': !__VLS_ctx.isStoreVisible(store.storeId)
                        }) },
                });
                __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.isStoreVisible(store.storeId)) }, null, null);
                /** @type {__VLS_StyleScopedClasses['store-breakdown-card']} */ ;
                /** @type {__VLS_StyleScopedClasses['store-conflict']} */ ;
                /** @type {__VLS_StyleScopedClasses['store-excluded']} */ ;
                /** @type {__VLS_StyleScopedClasses['store-hidden']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "store-header" },
                });
                /** @type {__VLS_StyleScopedClasses['store-header']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "store-info" },
                });
                /** @type {__VLS_StyleScopedClasses['store-info']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "store-icon" },
                });
                /** @type {__VLS_StyleScopedClasses['store-icon']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "store-name" },
                });
                /** @type {__VLS_StyleScopedClasses['store-name']} */ ;
                (store.storeName);
                if (store.isExcluded) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "excluded-badge" },
                    });
                    /** @type {__VLS_StyleScopedClasses['excluded-badge']} */ ;
                }
                if (__VLS_ctx.selectedStoreId && store.storeId === Number(__VLS_ctx.selectedStoreId)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "active-filter-badge" },
                    });
                    /** @type {__VLS_StyleScopedClasses['active-filter-badge']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "store-status" },
                });
                /** @type {__VLS_StyleScopedClasses['store-status']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "store-status-badge" },
                    ...{ class: (store.hasConflict ? 'conflict' : 'active') },
                });
                /** @type {__VLS_StyleScopedClasses['store-status-badge']} */ ;
                (store.hasConflict ? '⚠️ Conflict' : '✅ Included');
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "store-total-qty" },
                });
                /** @type {__VLS_StyleScopedClasses['store-total-qty']} */ ;
                (__VLS_ctx.formatNumber(store.agreedQuantity));
                (item.conversionUOM);
                if (store.hasConflict) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "conflict-note-small" },
                    });
                    /** @type {__VLS_StyleScopedClasses['conflict-note-small']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "groups-list" },
                });
                /** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
                for (const [group] of __VLS_vFor((store.groups))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (group.groupId),
                        ...{ class: "group-row" },
                        ...{ class: ({ 'group-conflict': store.hasConflict }) },
                    });
                    /** @type {__VLS_StyleScopedClasses['group-row']} */ ;
                    /** @type {__VLS_StyleScopedClasses['group-conflict']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "group-info" },
                    });
                    /** @type {__VLS_StyleScopedClasses['group-info']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "group-dot" },
                        ...{ class: ({ 'conflict-dot': store.hasConflict }) },
                    });
                    /** @type {__VLS_StyleScopedClasses['group-dot']} */ ;
                    /** @type {__VLS_StyleScopedClasses['conflict-dot']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "group-name" },
                    });
                    /** @type {__VLS_StyleScopedClasses['group-name']} */ ;
                    (group.groupName);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "group-quantity" },
                    });
                    /** @type {__VLS_StyleScopedClasses['group-quantity']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "qty-value" },
                    });
                    /** @type {__VLS_StyleScopedClasses['qty-value']} */ ;
                    (__VLS_ctx.formatNumber(group.quantity));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "qty-uom" },
                    });
                    /** @type {__VLS_StyleScopedClasses['qty-uom']} */ ;
                    (item.conversionUOM);
                    if (group.conversionRate && group.conversionRate > 1) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "conversion-badge" },
                        });
                        /** @type {__VLS_StyleScopedClasses['conversion-badge']} */ ;
                        (group.originalUOM);
                        (item.conversionUOM);
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "conversion-rate" },
                        });
                        /** @type {__VLS_StyleScopedClasses['conversion-rate']} */ ;
                        (group.conversionRate);
                    }
                    // @ts-ignore
                    [selectedStoreId, selectedStoreId, selectedStoreId, selectedStoreId, formatNumber, formatNumber, formatNumber, formatCurrency, formatCurrency, getStoreName, isStoreVisible, isStoreVisible,];
                }
                if (store.hasConflict) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "conflict-warning-bar" },
                    });
                    /** @type {__VLS_StyleScopedClasses['conflict-warning-bar']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "warning-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['warning-icon']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "warning-text" },
                    });
                    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                }
                // @ts-ignore
                [];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "total-summary-bar" },
                ...{ class: ({
                        'summary-active': item.status === 'Active' || item.status === 'Completed',
                        'summary-partial': item.status === 'Partial',
                        'summary-incomplete': item.status === 'Incomplete',
                        'summary-inactive': item.status === 'Inactive' || item.isExcluded
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['total-summary-bar']} */ ;
            /** @type {__VLS_StyleScopedClasses['summary-active']} */ ;
            /** @type {__VLS_StyleScopedClasses['summary-partial']} */ ;
            /** @type {__VLS_StyleScopedClasses['summary-incomplete']} */ ;
            /** @type {__VLS_StyleScopedClasses['summary-inactive']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "total-summary-item" },
            });
            /** @type {__VLS_StyleScopedClasses['total-summary-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "total-label" },
            });
            /** @type {__VLS_StyleScopedClasses['total-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "total-value-highlight" },
            });
            /** @type {__VLS_StyleScopedClasses['total-value-highlight']} */ ;
            (__VLS_ctx.formatNumber(item.totalQty));
            (item.conversionUOM);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "total-value-sub" },
            });
            /** @type {__VLS_StyleScopedClasses['total-value-sub']} */ ;
            (__VLS_ctx.formatNumber(item.totalQty / item.conversionValue));
            (item.baseUOM);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "total-summary-item" },
            });
            /** @type {__VLS_StyleScopedClasses['total-summary-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "total-label" },
            });
            /** @type {__VLS_StyleScopedClasses['total-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "total-value-highlight" },
            });
            /** @type {__VLS_StyleScopedClasses['total-value-highlight']} */ ;
            (__VLS_ctx.formatCurrency(item.totalCost));
            if (item.isExcluded) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "total-summary-sub inactive-sub" },
                });
                /** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
                /** @type {__VLS_StyleScopedClasses['inactive-sub']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-label inactive-label" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['inactive-label']} */ ;
                if (item.exclusionReason) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "sub-detail" },
                    });
                    /** @type {__VLS_StyleScopedClasses['sub-detail']} */ ;
                    (item.exclusionReason);
                }
            }
            if (item.status === 'Partial') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "total-summary-sub partial-sub" },
                });
                /** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
                /** @type {__VLS_StyleScopedClasses['partial-sub']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-label partial-label" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['partial-label']} */ ;
                (item.excludedStores.length);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-detail" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-detail']} */ ;
                (item.excludedStores.join(', '));
            }
            if (item.status === 'Incomplete') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "total-summary-sub incomplete-sub" },
                });
                /** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
                /** @type {__VLS_StyleScopedClasses['incomplete-sub']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-label incomplete-label" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['incomplete-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-detail" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-detail']} */ ;
                (item.missingData?.join(', ') || 'Unknown');
            }
            else if ((item.status === 'Active' || item.status === 'Completed') && !item.isExcluded) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "total-summary-sub" },
                });
                /** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-label" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
            }
            if (__VLS_ctx.selectedStoreId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "total-summary-sub filter-info" },
                });
                /** @type {__VLS_StyleScopedClasses['total-summary-sub']} */ ;
                /** @type {__VLS_StyleScopedClasses['filter-info']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-label filter-label" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
                (__VLS_ctx.getStoreName(Number(__VLS_ctx.selectedStoreId)));
            }
            if (item.costHistory && item.costHistory.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-card full-width" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
                /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                    ...{ class: "history-table" },
                });
                /** @type {__VLS_StyleScopedClasses['history-table']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
                for (const [history] of __VLS_vFor((item.costHistory.slice(0, 5)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                        key: (history.id),
                    });
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                    (__VLS_ctx.formatDate(history.createdAt));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                    (__VLS_ctx.formatCurrency(history.previousCost));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                    (__VLS_ctx.formatCurrency(history.newCost));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                    (history.changedBy || 'System');
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                    (history.reason || '-');
                    // @ts-ignore
                    [selectedStoreId, selectedStoreId, formatNumber, formatNumber, formatCurrency, formatCurrency, formatCurrency, getStoreName, formatDate,];
                }
                if (item.costHistory.length > 5) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                        colspan: "5",
                        ...{ class: "text-center more-history" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['more-history']} */ ;
                    (item.costHistory.length - 5);
                }
            }
        }
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.items.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tfoot, __VLS_intrinsics.tfoot)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: "footer-total" },
        });
        /** @type {__VLS_StyleScopedClasses['footer-total']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "6",
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "total-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatCurrency(__VLS_ctx.pageTotal));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
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
                [totalItems, items, formatCurrency, pageTotal, changePage, currentPage,];
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
[currentPage, totalPages, changePageSize, pageSize, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
