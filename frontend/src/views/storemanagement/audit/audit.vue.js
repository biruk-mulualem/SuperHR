import { ref, computed, onMounted } from 'vue';
import auditService from '@/stores/auditService';
// ================================================================
// STATE
// ================================================================
const stores = ref([]);
const selectedStoreId = ref('');
const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const pageSize = ref(5);
const loading = ref(false);
const refreshing = ref(false);
const exporting = ref(false);
const loadingTransactions = ref(false);
const error = ref(null);
// Stock data for selected store
const storeStockData = ref([]);
const auditData = ref(null);
const categoriesList = ref([]);
// Store balance counts
const storeBalanceCounts = ref({});
// Modal
const showTransactionModal = ref(false);
const selectedItem = ref(null);
const selectedGroupTab = ref('');
const showExportModal = ref(false);
const exportType = ref('full');
// Transaction data per group
const groupTransactions = ref({});
// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// Date Update Modal
const showDateUpdateModal = ref(false);
const selectedDateItem = ref(null);
const savingDates = ref(false);
const datePickerInput = ref(null);
let currentDatePickerGroup = null;
// ================================================================
// COMPUTED - UPDATED (Removed Outlier)
// ================================================================
const selectedStore = computed(() => {
    return stores.value.find(s => s.id === selectedStoreId.value);
});
const selectedStoreName = computed(() => {
    return selectedStore.value?.name || '';
});
const activeGroups = computed(() => {
    if (auditData.value?.groups) {
        return auditData.value.groups.map(g => ({
            id: g.groupId,
            groupId: g.groupId,
            name: g.name,
            code: g.code || ''
        }));
    }
    return selectedStore.value?.groups || [];
});
const categories = computed(() => {
    if (auditData.value?.categories && auditData.value.categories.length > 0) {
        return auditData.value.categories;
    }
    const cats = new Set();
    storeStockData.value.forEach(item => {
        if (item.category)
            cats.add(item.category);
    });
    return Array.from(cats);
});
const filteredAuditData = computed(() => {
    let result = storeStockData.value;
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        result = result.filter(item => (item.code || '').toLowerCase().includes(s) ||
            (item.commonName || item.itemName || '').toLowerCase().includes(s) ||
            (item.standardName || '').toLowerCase().includes(s));
    }
    if (filterCategory.value) {
        result = result.filter(item => item.category === filterCategory.value);
    }
    if (filterStatus.value) {
        if (filterStatus.value === 'DateDiff') {
            result = result.filter(item => item.hasDateDiff === true);
        }
        else {
            result = result.filter(item => item.status === filterStatus.value);
        }
    }
    return result;
});
const totalPages = computed(() => {
    return Math.ceil(filteredAuditData.value.length / pageSize.value) || 1;
});
const paginatedAuditData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredAuditData.value.slice(start, start + pageSize.value);
});
const matchedCount = computed(() => {
    return filteredAuditData.value.filter(item => item.status === 'Matched').length;
});
const conflictCount = computed(() => {
    return filteredAuditData.value.filter(item => item.status === 'Conflict').length;
});
const dateDiffCount = computed(() => {
    return filteredAuditData.value.filter(item => item.hasDateDiff === true).length;
});
// ================================================================
// METHODS
// ================================================================
const getStatusClass = (status) => {
    if (!status)
        return 'unknown';
    const map = {
        'Matched': 'matched',
        'Conflict': 'conflict',
        'No Data': 'unknown'
    };
    return map[status] || 'unknown';
};
const getGroupValue = (item, groupId) => {
    const value = item.groupBalances?.[groupId];
    return value !== undefined && value !== null ? value : '-';
};
const getRowClass = (item) => {
    if (item.status === 'Conflict')
        return 'conflict-row';
    if (item.status === 'Matched' && item.hasDateDiff)
        return 'date-diff-row';
    if (item.status === 'Matched')
        return 'matched-row';
    return '';
};
const getCellClass = (item, groupId) => {
    const value = getGroupValue(item, groupId);
    const values = Object.values(item.groupBalances || {});
    if (values.length === 0)
        return 'normal-cell';
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length === 1) {
        return 'normal-cell';
    }
    else {
        // Any difference = Conflict
        return 'conflict-cell';
    }
};
// -- Transform Audit Data - UPDATED (Removed Outlier) --
const transformAuditData = (data) => {
    console.log('🔄 Transform audit data:', data);
    if (!data) {
        return [];
    }
    if (data.comparison && data.comparison.items) {
        const totalGroups = data.groups ? data.groups.length : 0;
        return data.comparison.items.map(item => {
            const groupBalances = item.groupBalances || {};
            const groupLastTxDates = item.groupLastTxDates || {};
            const values = Object.values(groupBalances).filter(v => v !== undefined && v !== null);
            const missingCount = totalGroups - values.length;
            // Check for date differences
            const dates = Object.values(groupLastTxDates).filter(d => d !== undefined && d !== null);
            const uniqueDates = [...new Set(dates.map(d => new Date(d).toDateString()))];
            const hasDateDiff = uniqueDates.length > 1;
            let status = 'No Data';
            let statusClass = 'unknown';
            if (values.length === 0) {
                status = 'No Data';
                statusClass = 'unknown';
            }
            else if (missingCount > 0) {
                status = 'Conflict';
                statusClass = 'conflict';
            }
            else {
                const uniqueValues = [...new Set(values)];
                if (uniqueValues.length === 1) {
                    status = 'Matched';
                    statusClass = 'matched';
                }
                else {
                    // Any difference = Conflict (combines old Outlier + Conflict)
                    status = 'Conflict';
                    statusClass = 'conflict';
                }
            }
            return {
                productId: item.itemId,
                itemId: item.itemId,
                code: item.code || '',
                commonName: item.commonName || item.itemName || 'Unknown',
                itemName: item.itemName || 'Unknown',
                standardName: item.standardName || '',
                category: item.category || 'General',
                uom: item.uomCode || '',
                uomCode: item.uomCode || '',
                groupBalances: groupBalances,
                groupLastTxDates: groupLastTxDates,
                hasDateDiff: hasDateDiff,
                dateDiffDetails: hasDateDiff ? {
                    uniqueDates: uniqueDates,
                    dateCount: dates.length,
                    latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null,
                    earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : null,
                } : null,
                status: status,
                statusClass: statusClass
            };
        });
    }
    // Fallback: Build from groups data
    if (!data.groups) {
        return [];
    }
    const groups = data.groups || [];
    const totalGroups = groups.length;
    const itemMap = new Map();
    groups.forEach(group => {
        const balances = group.balances || [];
        balances.forEach(balance => {
            if (!itemMap.has(balance.itemId)) {
                itemMap.set(balance.itemId, {
                    productId: balance.itemId,
                    itemId: balance.itemId,
                    code: balance.itemCode || '',
                    commonName: balance.itemCommonName || balance.itemName || 'Unknown',
                    itemName: balance.itemName || 'Unknown',
                    standardName: balance.itemCommonName || '',
                    category: balance.category || 'General',
                    uom: balance.uomCode || '',
                    uomCode: balance.uomCode || '',
                    groupBalances: {},
                    groupLastTxDates: {},
                    hasDateDiff: false,
                    dateDiffDetails: null,
                    status: 'Matched'
                });
            }
        });
    });
    groups.forEach(group => {
        const groupId = group.groupId;
        const balances = group.balances || [];
        balances.forEach(balance => {
            const item = itemMap.get(balance.itemId);
            if (item) {
                item.groupBalances[groupId] = balance.balance;
                if (balance.lastTransactionDate) {
                    item.groupLastTxDates[groupId] = balance.lastTransactionDate;
                }
            }
        });
    });
    itemMap.forEach((item) => {
        const values = Object.values(item.groupBalances).filter(v => v !== undefined && v !== null);
        const missingCount = totalGroups - values.length;
        const dates = Object.values(item.groupLastTxDates).filter(d => d !== undefined && d !== null);
        const uniqueDates = [...new Set(dates.map(d => new Date(d).toDateString()))];
        const hasDateDiff = uniqueDates.length > 1;
        if (values.length === 0) {
            item.status = 'No Data';
            item.statusClass = 'unknown';
        }
        else if (missingCount > 0) {
            item.status = 'Conflict';
            item.statusClass = 'conflict';
        }
        else {
            const uniqueValues = [...new Set(values)];
            if (uniqueValues.length === 1) {
                item.status = 'Matched';
                item.statusClass = 'matched';
            }
            else {
                // Any difference = Conflict
                item.status = 'Conflict';
                item.statusClass = 'conflict';
            }
        }
        item.hasDateDiff = hasDateDiff;
        item.dateDiffDetails = hasDateDiff ? {
            uniqueDates: uniqueDates,
            dateCount: dates.length,
            latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null,
            earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : null,
        } : null;
    });
    return Array.from(itemMap.values());
};
// -- Load Categories --
const loadCategories = async () => {
    try {
        console.log('📂 Loading categories...');
        const result = await auditService.getCategories();
        if (result.success) {
            categoriesList.value = result.data.map(cat => cat.name);
        }
    }
    catch (err) {
        console.error('❌ Error loading categories:', err);
    }
};
// -- Load Stores --
const loadStores = async () => {
    try {
        console.log('🏪 Loading stores...');
        const result = await auditService.getStoresWithGroups();
        console.log('📥 Stores response:', result);
        if (result.success && result.data.length > 0) {
            stores.value = result.data.map((store) => {
                const storeId = store.id;
                return {
                    ...store,
                    id: storeId,
                    groups: (store.groups || []).map(group => ({
                        ...group,
                        id: group.id || group.groupId,
                        groupId: group.groupId || group.id
                    }))
                };
            });
            await autoSelectStore();
        }
        else {
            console.warn('No stores found');
            error.value = 'No stores available';
        }
    }
    catch (err) {
        console.error('❌ Error loading stores:', err);
        error.value = 'Failed to load stores';
        showToastMessage('Failed to load stores', 'error');
    }
};
const autoSelectStore = async () => {
    console.log('🔄 Auto-selecting store...');
    if (!stores.value || stores.value.length === 0) {
        console.warn('No stores available to auto-select');
        return;
    }
    const storesToCheck = stores.value.filter(store => store.id);
    if (storesToCheck.length === 0) {
        console.warn('No valid stores to check');
        return;
    }
    // Check stores with balances
    for (const store of storesToCheck) {
        try {
            const result = await auditService.getStoreAudit(store.id, {
                includeTransactions: false,
                transactionLimit: 1
            });
            if (result.success) {
                const count = result.data.summary?.totalItems || 0;
                storeBalanceCounts.value[store.id] = count;
            }
        }
        catch (err) {
            storeBalanceCounts.value[store.id] = 0;
        }
    }
    // Find a store with balances
    let storeWithBalances = storesToCheck.find(store => (storeBalanceCounts.value[store.id] || 0) > 0);
    if (storeWithBalances) {
        selectedStoreId.value = storeWithBalances.id;
    }
    else if (storesToCheck.length > 0) {
        selectedStoreId.value = storesToCheck[0].id;
    }
    else {
        return;
    }
    if (selectedStoreId.value) {
        await loadStoreData(selectedStoreId.value);
    }
};
// -- Load Store Data --
const loadStoreData = async (storeId) => {
    if (!storeId) {
        storeStockData.value = [];
        return;
    }
    loading.value = true;
    error.value = null;
    try {
        console.log(`🔍 Loading audit data for store: ${storeId}`);
        const result = await auditService.getStoreAudit(storeId, {
            includeTransactions: true,
            transactionLimit: 10
        });
        if (result.success) {
            auditData.value = result.data;
            if (result.data.categories) {
                categoriesList.value = result.data.categories;
            }
            const transformedData = transformAuditData(result.data);
            storeStockData.value = transformedData;
            storeBalanceCounts.value[storeId] = transformedData.length;
            if (result.data.store) {
                const existingStore = stores.value.find(s => s.id === result.data.store.id);
                if (existingStore && result.data.groups) {
                    existingStore.groups = result.data.groups.map(g => ({
                        id: g.groupId,
                        groupId: g.groupId,
                        name: g.name,
                        code: g.code || ''
                    }));
                }
            }
            if (transformedData.length === 0) {
                console.log(`ℹ️ No products found for this store`);
            }
            else {
                showToastMessage(`Loaded ${transformedData.length} products`, 'success');
            }
        }
        else {
            console.error('Failed to load audit data:', result);
            error.value = result.error || 'Failed to load audit data';
            showToastMessage('Failed to load audit data', 'error');
        }
    }
    catch (err) {
        console.error('❌ Error loading store audit:', err);
        error.value = err.message || 'Failed to load audit data';
        showToastMessage('Failed to load audit data', 'error');
    }
    finally {
        loading.value = false;
    }
};
// -- Store Change --
const onStoreChange = async () => {
    if (selectedStoreId.value) {
        currentPage.value = 1;
        filterCategory.value = '';
        filterStatus.value = '';
        searchQuery.value = '';
        await loadStoreData(selectedStoreId.value);
    }
    else {
        storeStockData.value = [];
    }
};
// -- Transaction Modal --
const openTransactionModal = async (item) => {
    if (!item.itemId) {
        showToastMessage('No item ID found for this product', 'error');
        return;
    }
    selectedItem.value = item;
    const groups = activeGroups.value;
    selectedGroupTab.value = groups.length > 0 ? groups[0].id : '';
    groupTransactions.value = {};
    loadingTransactions.value = true;
    try {
        const result = await auditService.getItemTransactions(selectedStoreId.value, item.itemId, 20);
        if (result.success && result.data) {
            const data = result.data;
            if (data.groupTransactions) {
                Object.entries(data.groupTransactions).forEach(([groupId, groupData]) => {
                    groupTransactions.value[groupId] = groupData.transactions.map(tx => ({
                        ...tx,
                        date: tx.createdAt,
                        type: tx.transactionType || 'ADJUSTMENT',
                        quantity: tx.changeAmount,
                        balanceAfter: tx.newBalance,
                        user: tx.changedBy,
                        reference: tx.referenceId,
                        notes: tx.remark
                    }));
                });
            }
            if (Object.keys(groupTransactions.value).length === 0) {
                showToastMessage('No transactions found for this item', 'info');
            }
        }
        else {
            // Fallback: try loading transactions per group
            for (const group of groups) {
                try {
                    const groupResult = await auditService.getGroupTransactions(selectedStoreId.value, group.id, { page: 1, limit: 20 });
                    if (groupResult.success) {
                        const itemTransactions = groupResult.data.transactions?.filter(tx => tx.itemId === item.itemId || tx.itemCode === item.code) || [];
                        groupTransactions.value[group.id] = itemTransactions.map(tx => ({
                            ...tx,
                            date: tx.createdAt,
                            type: tx.transactionType || 'ADJUSTMENT',
                            quantity: tx.changeAmount,
                            balanceAfter: tx.newBalance,
                            user: tx.changedBy,
                            reference: tx.referenceId,
                            notes: tx.remark
                        }));
                    }
                }
                catch (err) {
                    console.warn(`Failed to load transactions for group ${group.id}:`, err);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Failed to load transactions:', error);
        showToastMessage('Failed to load transactions', 'error');
    }
    finally {
        loadingTransactions.value = false;
    }
    showTransactionModal.value = true;
};
const closeTransactionModal = () => {
    showTransactionModal.value = false;
    selectedItem.value = null;
    selectedGroupTab.value = '';
    groupTransactions.value = {};
};
const getGroupTransactions = (groupId) => {
    return groupTransactions.value[groupId] || [];
};
const formatDate = (dateStr) => {
    if (!dateStr)
        return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    catch {
        return dateStr;
    }
};
// -- Date Update Methods --
const getGroupLastTxDate = (item, groupId) => {
    if (!item || !item.groupLastTxDates)
        return null;
    return item.groupLastTxDates[groupId] || null;
};
const openDateUpdateModal = (item) => {
    if (!item.hasDateDiff) {
        showToastMessage('No date differences to update', 'info');
        return;
    }
    selectedDateItem.value = JSON.parse(JSON.stringify(item));
    selectedDateItem.value._tempDate = {};
    showDateUpdateModal.value = true;
};
const closeDateUpdateModal = () => {
    showDateUpdateModal.value = false;
    selectedDateItem.value = null;
    currentDatePickerGroup = null;
};
const openDatePicker = (item, groupId) => {
    const currentDate = getGroupLastTxDate(item, groupId);
    if (!currentDate) {
        showToastMessage('No transaction date to update', 'error');
        return;
    }
    currentDatePickerGroup = groupId;
    const date = new Date(currentDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    if (datePickerInput.value) {
        datePickerInput.value.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        datePickerInput.value.showPicker();
    }
};
const onDatePickerChange = (event) => {
    if (!selectedDateItem.value || !currentDatePickerGroup)
        return;
    const newDate = event.target.value;
    if (newDate) {
        if (!selectedDateItem.value._tempDate) {
            selectedDateItem.value._tempDate = {};
        }
        selectedDateItem.value._tempDate[currentDatePickerGroup] = newDate;
        showToastMessage('Date updated temporarily. Click "Apply" to save.', 'info');
    }
    currentDatePickerGroup = null;
};
const applyDateUpdate = (item, groupId) => {
    if (!item._tempDate || !item._tempDate[groupId]) {
        showToastMessage('No date change to apply', 'error');
        return;
    }
    item.groupLastTxDates[groupId] = item._tempDate[groupId];
    delete item._tempDate[groupId];
    recalculateDateDiff(item);
    showToastMessage('Date updated successfully', 'success');
};
const cancelDateUpdate = (item, groupId) => {
    if (item._tempDate) {
        delete item._tempDate[groupId];
    }
    showToastMessage('Date update cancelled', 'info');
};
const resetToLatestDate = (item, groupId) => {
    const allDates = Object.values(item.groupLastTxDates || {}).filter(d => d);
    if (allDates.length === 0)
        return;
    const latestDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())));
    if (!item._tempDate) {
        item._tempDate = {};
    }
    item._tempDate[groupId] = latestDate.toISOString();
    showToastMessage(`Set to latest date: ${formatDate(latestDate.toISOString())}`, 'info');
};
const recalculateDateDiff = (item) => {
    const dates = Object.values(item.groupLastTxDates || {}).filter(d => d);
    const uniqueDateStrings = [...new Set(dates.map(d => new Date(d).toDateString()))];
    const hasDateDiff = uniqueDateStrings.length > 1;
    item.hasDateDiff = hasDateDiff;
    if (hasDateDiff && dates.length > 1) {
        const dateObjects = dates.map(d => new Date(d));
        const latestDate = new Date(Math.max(...dateObjects.map(d => d.getTime())));
        const earliestDate = new Date(Math.min(...dateObjects.map(d => d.getTime())));
        const diffMs = latestDate - earliestDate;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        item.dateDiffDetails = {
            latestDate: latestDate.toISOString(),
            earliestDate: earliestDate.toISOString(),
            diffDays: diffDays,
            diffHours: Math.round(diffMs / (1000 * 60 * 60)),
            uniqueDates: uniqueDateStrings,
        };
    }
    else {
        item.dateDiffDetails = null;
    }
};
const saveAllDateUpdates = async () => {
    if (!selectedDateItem.value)
        return;
    savingDates.value = true;
    try {
        const updates = {};
        const groups = activeGroups.value;
        for (const group of groups) {
            const date = getGroupLastTxDate(selectedDateItem.value, group.id);
            if (date) {
                updates[group.id] = date;
            }
        }
        const result = await auditService.updateItemTransactionDates(selectedStoreId.value, selectedDateItem.value.itemId, updates);
        if (result.success) {
            showToastMessage('All dates updated successfully!', 'success');
            const originalItem = storeStockData.value.find(item => item.itemId === selectedDateItem.value.itemId);
            if (originalItem) {
                originalItem.groupLastTxDates = { ...selectedDateItem.value.groupLastTxDates };
                originalItem.hasDateDiff = selectedDateItem.value.hasDateDiff;
                originalItem.dateDiffDetails = selectedDateItem.value.dateDiffDetails;
            }
            closeDateUpdateModal();
            await refreshData();
        }
        else {
            showToastMessage(result.error || 'Failed to update dates', 'error');
        }
    }
    catch (error) {
        console.error('Error saving date updates:', error);
        showToastMessage('Failed to save date updates', 'error');
    }
    finally {
        savingDates.value = false;
    }
};
// -- Filters --
const onSearchChange = () => {
    currentPage.value = 1;
};
const onFilterChange = () => {
    currentPage.value = 1;
};
const clearFilters = () => {
    filterCategory.value = '';
    filterStatus.value = '';
    searchQuery.value = '';
    currentPage.value = 1;
    showToastMessage('Filters cleared', 'info');
};
// -- Refresh --
const refreshData = async () => {
    refreshing.value = true;
    try {
        await loadStoreData(selectedStoreId.value);
        showToastMessage('Data refreshed successfully!', 'success');
    }
    catch (error) {
        showToastMessage('Failed to refresh data', 'error');
    }
    finally {
        refreshing.value = false;
    }
};
// -- Retry --
const retryLoad = () => {
    error.value = null;
    if (selectedStoreId.value) {
        loadStoreData(selectedStoreId.value);
    }
    else {
        loadStores();
    }
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
        const blob = await auditService.exportAuditData(selectedStoreId.value, {
            includeTransactions: exportType.value === 'full' || exportType.value === 'summary',
            filterBy: exportType.value
        });
        const filename = `audit_report_${selectedStoreName.value || 'store'}_${new Date().toISOString().split('T')[0]}.csv`;
        auditService.downloadFile(blob, filename);
        showToastMessage('Export completed successfully!', 'success');
    }
    catch (error) {
        console.error('Export failed:', error);
        showToastMessage('Failed to export data', 'error');
    }
    finally {
        exporting.value = false;
        closeExportModal();
    }
};
// -- Pagination --
const changePage = (page) => {
    currentPage.value = page;
};
const changePageSize = () => {
    currentPage.value = 1;
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
// LIFECYCLE
// ================================================================
onMounted(() => {
    loadStores();
    loadCategories();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-row']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-row']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-name']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-row']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-name']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner-large']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-retry']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict-row']} */ ;
/** @type {__VLS_StyleScopedClasses['outlier-row']} */ ;
/** @type {__VLS_StyleScopedClasses['matched-row']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-transaction']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-transaction']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['group-date-card']} */ ;
/** @type {__VLS_StyleScopedClasses['group-date-card']} */ ;
/** @type {__VLS_StyleScopedClasses['date-value']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-update-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-update-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-update-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reset-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reset-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-apply-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-apply-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel-date']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-list']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-product']} */ ;
/** @type {__VLS_StyleScopedClasses['product-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['group-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['group-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-item']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-item']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-item']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stock_in']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stock_out']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-quantity']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-quantity']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['export-option']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-transaction']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['product-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-details']} */ ;
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
(__VLS_ctx.filteredAuditData.length);
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
    placeholder: "Search products...",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "btn-refresh" },
    disabled: (__VLS_ctx.refreshing),
});
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
if (__VLS_ctx.refreshing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
(__VLS_ctx.refreshing ? 'Refreshing...' : 'Refresh');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openExportModal) },
    ...{ class: "btn-export" },
    disabled: (__VLS_ctx.exporting || __VLS_ctx.filteredAuditData.length === 0),
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
(__VLS_ctx.exporting ? 'Exporting...' : 'Export');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-cards" },
});
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.filteredAuditData.length);
if (__VLS_ctx.selectedStore) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value store-name" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['store-name']} */ ;
    (__VLS_ctx.selectedStoreName);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card success" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.matchedCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card critical" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['critical']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.conflictCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card date-diff" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['date-diff']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.dateDiffCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-bar" },
});
/** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onStoreChange) },
    value: (__VLS_ctx.selectedStoreId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
for (const [store] of __VLS_vFor((__VLS_ctx.stores))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (store.id),
        value: (store.id),
    });
    (store.name);
    if (__VLS_ctx.storeBalanceCounts[store.id] > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.storeBalanceCounts[store.id]);
    }
    // @ts-ignore
    [filteredAuditData, filteredAuditData, filteredAuditData, onSearchChange, searchQuery, refreshData, refreshing, refreshing, refreshing, openExportModal, exporting, exporting, selectedStore, selectedStoreName, matchedCount, conflictCount, dateDiffCount, onStoreChange, selectedStoreId, stores, storeBalanceCounts, storeBalanceCounts,];
}
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
        key: (cat),
        value: (cat),
    });
    (cat);
    // @ts-ignore
    [onFilterChange, filterCategory, categories,];
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
    value: "Matched",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "Conflict",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "DateDiff",
});
if (__VLS_ctx.filterCategory || __VLS_ctx.filterStatus) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-container" },
    id: "printable-area",
});
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
if (__VLS_ctx.loading || __VLS_ctx.refreshing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner-large" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "loading-text" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-text']} */ ;
    (__VLS_ctx.loading ? 'Loading audit data...' : 'Refreshing data...');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "loading-subtext" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-subtext']} */ ;
}
else if (!__VLS_ctx.selectedStoreId && !__VLS_ctx.loading && !__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner-large" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "loading-text" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-text']} */ ;
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.retryLoad) },
        ...{ class: "btn-retry" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-retry']} */ ;
}
else if (__VLS_ctx.storeStockData.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    if (__VLS_ctx.selectedStore) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.selectedStore.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "empty-list" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
}
else if (__VLS_ctx.filteredAuditData.length === 0 && __VLS_ctx.storeStockData.length > 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn-clear-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-clear-filters']} */ ;
}
else if (__VLS_ctx.filteredAuditData.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "audit-table" },
    });
    /** @type {__VLS_StyleScopedClasses['audit-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    for (const [group] of __VLS_vFor((__VLS_ctx.activeGroups))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            key: (group.id),
            colspan: (1),
            ...{ style: {} },
        });
        (group.name);
        // @ts-ignore
        [filteredAuditData, filteredAuditData, refreshing, selectedStore, selectedStore, selectedStoreId, onFilterChange, filterCategory, filterStatus, filterStatus, clearFilters, clearFilters, loading, loading, loading, loading, loading, error, error, error, retryLoad, storeStockData, storeStockData, activeGroups,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        rowspan: "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [item, index] of __VLS_vFor((__VLS_ctx.paginatedAuditData))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ class: (__VLS_ctx.getRowClass(item)) },
            key: (item.productId || item.itemId),
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
        (item.code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-info" },
        });
        /** @type {__VLS_StyleScopedClasses['product-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "common-name" },
        });
        /** @type {__VLS_StyleScopedClasses['common-name']} */ ;
        (item.commonName || item.itemName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "standard-name" },
        });
        /** @type {__VLS_StyleScopedClasses['standard-name']} */ ;
        (item.standardName || '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (item.category || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (item.uom || item.uomCode || '-');
        for (const [group] of __VLS_vFor((__VLS_ctx.activeGroups))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                key: (group.id),
                ...{ class: (__VLS_ctx.getCellClass(item, group.id)) },
            });
            (__VLS_ctx.getGroupValue(item, group.id));
            // @ts-ignore
            [activeGroups, paginatedAuditData, getRowClass, currentPage, pageSize, getCellClass, getGroupValue,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', __VLS_ctx.getStatusClass(item.status)]) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (item.status);
        if (item.hasDateDiff) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading || __VLS_ctx.refreshing))
                            return;
                        if (!!(!__VLS_ctx.selectedStoreId && !__VLS_ctx.loading && !__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.storeStockData.length === 0 && !__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.filteredAuditData.length === 0 && __VLS_ctx.storeStockData.length > 0 && !__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.filteredAuditData.length > 0))
                            return;
                        if (!(item.hasDateDiff))
                            return;
                        __VLS_ctx.openDateUpdateModal(item);
                        // @ts-ignore
                        [getStatusClass, openDateUpdateModal,];
                    } },
                ...{ class: "date-diff-icon clickable" },
                title: "Different last transaction dates across groups - Click to update",
            });
            /** @type {__VLS_StyleScopedClasses['date-diff-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['clickable']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading || __VLS_ctx.refreshing))
                        return;
                    if (!!(!__VLS_ctx.selectedStoreId && !__VLS_ctx.loading && !__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.storeStockData.length === 0 && !__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.filteredAuditData.length === 0 && __VLS_ctx.storeStockData.length > 0 && !__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.filteredAuditData.length > 0))
                        return;
                    __VLS_ctx.openTransactionModal(item);
                    // @ts-ignore
                    [openTransactionModal,];
                } },
            ...{ class: "btn-transaction" },
            title: "View Transactions",
            disabled: (!item.itemId),
        });
        /** @type {__VLS_StyleScopedClasses['btn-transaction']} */ ;
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.filteredAuditData.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.filteredAuditData.length > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [filteredAuditData, currentPage, changePage,];
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
                if (!(__VLS_ctx.filteredAuditData.length > 0))
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
if (__VLS_ctx.showTransactionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeTransactionModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container transaction-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['transaction-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeTransactionModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "transaction-product" },
    });
    /** @type {__VLS_StyleScopedClasses['transaction-product']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.selectedItem?.commonName || __VLS_ctx.selectedItem?.itemName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "product-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['product-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedItem?.code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedItem?.category || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedStoreName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.getStatusClass(__VLS_ctx.selectedItem?.status)]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.selectedItem?.status);
    if (__VLS_ctx.selectedItem?.hasDateDiff) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-diff-icon" },
            title: "Different last transaction dates across groups",
        });
        /** @type {__VLS_StyleScopedClasses['date-diff-icon']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "group-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['group-tabs']} */ ;
    for (const [group] of __VLS_vFor((__VLS_ctx.activeGroups))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showTransactionModal))
                        return;
                    __VLS_ctx.selectedGroupTab = group.id;
                    // @ts-ignore
                    [selectedStoreName, activeGroups, currentPage, pageSize, getStatusClass, totalPages, changePageSize, showTransactionModal, closeTransactionModal, closeTransactionModal, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedItem, selectedGroupTab,];
                } },
            key: (group.id),
            ...{ class: (['group-tab', { active: __VLS_ctx.selectedGroupTab === group.id }]) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-tab']} */ ;
        (group.name);
        // @ts-ignore
        [selectedGroupTab,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "transaction-list" },
    });
    /** @type {__VLS_StyleScopedClasses['transaction-list']} */ ;
    if (__VLS_ctx.loadingTransactions) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-transactions" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-transactions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else if (__VLS_ctx.getGroupTransactions(__VLS_ctx.selectedGroupTab).length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-transactions" },
        });
        /** @type {__VLS_StyleScopedClasses['no-transactions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "transaction-items" },
        });
        /** @type {__VLS_StyleScopedClasses['transaction-items']} */ ;
        for (const [tx, idx] of __VLS_vFor((__VLS_ctx.getGroupTransactions(__VLS_ctx.selectedGroupTab)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "transaction-item" },
                ...{ class: ((tx.transactionType || tx.type || 'adjustment').toLowerCase()) },
            });
            /** @type {__VLS_StyleScopedClasses['transaction-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tx-header" },
            });
            /** @type {__VLS_StyleScopedClasses['tx-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "tx-date" },
            });
            /** @type {__VLS_StyleScopedClasses['tx-date']} */ ;
            (__VLS_ctx.formatDate(tx.createdAt || tx.date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['tx-type-badge', (tx.transactionType || tx.type || 'adjustment').toLowerCase()]) },
            });
            /** @type {__VLS_StyleScopedClasses['tx-type-badge']} */ ;
            (tx.transactionType || tx.type || 'ADJUSTMENT');
            if (tx.referenceId || tx.reference) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tx-reference" },
                });
                /** @type {__VLS_StyleScopedClasses['tx-reference']} */ ;
                (tx.referenceId || tx.reference);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tx-details" },
            });
            /** @type {__VLS_StyleScopedClasses['tx-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "tx-quantity" },
                ...{ class: ((tx.changeAmount || tx.quantity || 0) > 0 ? 'positive' : 'negative') },
            });
            /** @type {__VLS_StyleScopedClasses['tx-quantity']} */ ;
            ((tx.changeAmount || tx.quantity || 0) > 0 ? '+' : '');
            (tx.changeAmount || tx.quantity || 0);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "tx-balance" },
            });
            /** @type {__VLS_StyleScopedClasses['tx-balance']} */ ;
            (tx.newBalance || tx.balanceAfter || 0);
            if (tx.changedBy || tx.user) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "tx-user" },
                });
                /** @type {__VLS_StyleScopedClasses['tx-user']} */ ;
                (tx.changedBy || tx.user);
            }
            if (tx.remark || tx.notes) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "tx-notes" },
                });
                /** @type {__VLS_StyleScopedClasses['tx-notes']} */ ;
                (tx.remark || tx.notes);
            }
            // @ts-ignore
            [selectedGroupTab, selectedGroupTab, loadingTransactions, getGroupTransactions, getGroupTransactions, formatDate,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeTransactionModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showDateUpdateModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDateUpdateModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container date-update-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['date-update-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDateUpdateModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "transaction-product" },
    });
    /** @type {__VLS_StyleScopedClasses['transaction-product']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.selectedDateItem?.commonName || __VLS_ctx.selectedDateItem?.itemName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "product-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['product-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedDateItem?.code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedDateItem?.category || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedStoreName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.getStatusClass(__VLS_ctx.selectedDateItem?.status)]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.selectedDateItem?.status);
    if (__VLS_ctx.selectedDateItem?.hasDateDiff) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-diff-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['date-diff-icon']} */ ;
    }
    if (__VLS_ctx.selectedDateItem?.dateDiffDetails) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-diff-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['date-diff-summary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "diff-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['diff-badge']} */ ;
        (__VLS_ctx.selectedDateItem.dateDiffDetails.diffDays);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "group-date-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['group-date-cards']} */ ;
    for (const [group] of __VLS_vFor((__VLS_ctx.activeGroups))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (group.id),
            ...{ class: "group-date-card" },
            ...{ class: ({ 'has-date': __VLS_ctx.getGroupLastTxDate(__VLS_ctx.selectedDateItem, group.id) }) },
        });
        /** @type {__VLS_StyleScopedClasses['group-date-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['has-date']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "group-date-header" },
        });
        /** @type {__VLS_StyleScopedClasses['group-date-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "group-name" },
        });
        /** @type {__VLS_StyleScopedClasses['group-name']} */ ;
        (group.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "group-balance" },
        });
        /** @type {__VLS_StyleScopedClasses['group-balance']} */ ;
        (__VLS_ctx.getGroupValue(__VLS_ctx.selectedDateItem, group.id));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "group-date-body" },
        });
        /** @type {__VLS_StyleScopedClasses['group-date-body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-display" },
        });
        /** @type {__VLS_StyleScopedClasses['date-display']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-label" },
        });
        /** @type {__VLS_StyleScopedClasses['date-label']} */ ;
        if (__VLS_ctx.getGroupLastTxDate(__VLS_ctx.selectedDateItem, group.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "date-value" },
            });
            /** @type {__VLS_StyleScopedClasses['date-value']} */ ;
            (__VLS_ctx.formatDate(__VLS_ctx.getGroupLastTxDate(__VLS_ctx.selectedDateItem, group.id)));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "date-value no-date" },
            });
            /** @type {__VLS_StyleScopedClasses['date-value']} */ ;
            /** @type {__VLS_StyleScopedClasses['no-date']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['date-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showDateUpdateModal))
                        return;
                    __VLS_ctx.openDatePicker(__VLS_ctx.selectedDateItem, group.id);
                    // @ts-ignore
                    [selectedStoreName, activeGroups, getGroupValue, getStatusClass, closeTransactionModal, formatDate, showDateUpdateModal, closeDateUpdateModal, closeDateUpdateModal, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, getGroupLastTxDate, getGroupLastTxDate, getGroupLastTxDate, openDatePicker,];
                } },
            ...{ class: "btn-update-date" },
            disabled: (!__VLS_ctx.getGroupLastTxDate(__VLS_ctx.selectedDateItem, group.id)),
        });
        /** @type {__VLS_StyleScopedClasses['btn-update-date']} */ ;
        if (__VLS_ctx.getGroupLastTxDate(__VLS_ctx.selectedDateItem, group.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showDateUpdateModal))
                            return;
                        if (!(__VLS_ctx.getGroupLastTxDate(__VLS_ctx.selectedDateItem, group.id)))
                            return;
                        __VLS_ctx.resetToLatestDate(__VLS_ctx.selectedDateItem, group.id);
                        // @ts-ignore
                        [selectedDateItem, selectedDateItem, selectedDateItem, getGroupLastTxDate, getGroupLastTxDate, resetToLatestDate,];
                    } },
                ...{ class: "btn-reset-date" },
                title: "Set to latest date across all groups",
            });
            /** @type {__VLS_StyleScopedClasses['btn-reset-date']} */ ;
        }
        if (__VLS_ctx.selectedDateItem?._tempDate && __VLS_ctx.selectedDateItem._tempDate[group.id]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "group-date-footer" },
            });
            /** @type {__VLS_StyleScopedClasses['group-date-footer']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "temp-date-label" },
            });
            /** @type {__VLS_StyleScopedClasses['temp-date-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "temp-date-value" },
            });
            /** @type {__VLS_StyleScopedClasses['temp-date-value']} */ ;
            (__VLS_ctx.formatDate(__VLS_ctx.selectedDateItem._tempDate[group.id]));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showDateUpdateModal))
                            return;
                        if (!(__VLS_ctx.selectedDateItem?._tempDate && __VLS_ctx.selectedDateItem._tempDate[group.id]))
                            return;
                        __VLS_ctx.applyDateUpdate(__VLS_ctx.selectedDateItem, group.id);
                        // @ts-ignore
                        [formatDate, selectedDateItem, selectedDateItem, selectedDateItem, selectedDateItem, applyDateUpdate,];
                    } },
                ...{ class: "btn-apply-date" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-apply-date']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showDateUpdateModal))
                            return;
                        if (!(__VLS_ctx.selectedDateItem?._tempDate && __VLS_ctx.selectedDateItem._tempDate[group.id]))
                            return;
                        __VLS_ctx.cancelDateUpdate(__VLS_ctx.selectedDateItem, group.id);
                        // @ts-ignore
                        [selectedDateItem, cancelDateUpdate,];
                    } },
                ...{ class: "btn-cancel-date" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-cancel-date']} */ ;
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.onDatePickerChange) },
        type: "datetime-local",
        ref: "datePickerInput",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDateUpdateModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveAllDateUpdates) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.savingDates),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.savingDates ? 'Saving...' : '💾 Save All Changes');
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
                [closeDateUpdateModal, onDatePickerChange, saveAllDateUpdates, savingDates, savingDates, showExportModal, closeExportModal, closeExportModal, exportType,];
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
                __VLS_ctx.exportType = 'conflict';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "conflict",
    });
    (__VLS_ctx.exportType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showExportModal))
                    return;
                __VLS_ctx.exportType = 'dateDiff';
                // @ts-ignore
                [exportType, exportType,];
            } },
        ...{ class: "export-option" },
    });
    /** @type {__VLS_StyleScopedClasses['export-option']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: "dateDiff",
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
        disabled: (__VLS_ctx.exporting || __VLS_ctx.filteredAuditData.length === 0),
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
[filteredAuditData, exporting, exporting, closeExportModal, exportType, exportSelectedReport, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
