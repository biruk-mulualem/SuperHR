import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import transactionService from '@/stores/transactionService';
import balanceService from '@/stores/balanceService';
// ================================================================
// STATE
// ================================================================
const router = useRouter();
const route = useRoute();
const loading = ref(true);
const transactionData = ref([]);
const stores = ref([]);
const groups = ref([]);
const categories = ref([]); // ✅ ADD CATEGORIES
const inventoryItems = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
// Get user data
const getUserData = () => {
    try {
        const data = JSON.parse(localStorage.getItem('user') || '{}');
        return data;
    }
    catch (error) {
        console.error('Error parsing user data:', error);
        return {};
    }
};
const userData = ref(getUserData());
const userDisplayName = computed(() => {
    return userData.value?.fullName || userData.value?.username || 'User';
});
// Filter params from query
const filterStore = ref(typeof route.query.storeId === 'string' ? route.query.storeId : '');
const filterGroup = ref(typeof route.query.groupId === 'string' ? route.query.groupId : '');
const filterCategory = ref(typeof route.query.categoryId === 'string' ? route.query.categoryId : ''); // ✅ ADD CATEGORY
const filterItem = ref(typeof route.query.itemId === 'string' ? route.query.itemId : '');
const filterType = ref(typeof route.query.type === 'string' ? route.query.type : '');
const filterDate = ref(typeof route.query.date === 'string' ? route.query.date : '');
const searchQuery = ref(typeof route.query.search === 'string' ? route.query.search : '');
// ================================================================
// COMPUTED
// ================================================================
const totalStockIn = computed(() => {
    if (!transactionData.value)
        return 0;
    return transactionData.value.filter(t => t.type === 'Stock In').length;
});
const totalStockOut = computed(() => {
    if (!transactionData.value)
        return 0;
    return transactionData.value.filter(t => t.type === 'Stock Out').length;
});
const totalPages = computed(() => {
    if (!transactionData.value)
        return 1;
    return Math.ceil(transactionData.value.length / pageSize.value) || 1;
});
const paginatedData = computed(() => {
    if (!transactionData.value)
        return [];
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return transactionData.value.slice(start, end);
});
// ✅ STORE SUMMARY
const storeSummary = computed(() => {
    if (!transactionData.value || transactionData.value.length === 0)
        return 'No stores';
    const storeNames = new Set();
    transactionData.value.forEach(t => {
        const name = t.storeName || getStoreName(t.storeId);
        if (name)
            storeNames.add(name);
    });
    return Array.from(storeNames).join(', ') || 'No stores';
});
// ✅ GROUP SUMMARY
const groupSummary = computed(() => {
    if (!transactionData.value || transactionData.value.length === 0)
        return 'No groups';
    const groupNames = new Set();
    transactionData.value.forEach(t => {
        const name = t.groupName || getGroupName(t.groupId);
        if (name)
            groupNames.add(name);
    });
    return Array.from(groupNames).join(', ') || 'No groups';
});
// ✅ CATEGORY SUMMARY
const categorySummary = computed(() => {
    if (!transactionData.value || transactionData.value.length === 0)
        return 'No categories';
    const categoryNames = new Set();
    transactionData.value.forEach(t => {
        const name = t.categoryName || getCategoryName(t.categoryId);
        if (name)
            categoryNames.add(name);
    });
    return Array.from(categoryNames).join(', ') || 'No categories';
});
// ✅ TRANSACTION TYPE SUMMARY
const transactionTypeSummary = computed(() => {
    if (!transactionData.value || transactionData.value.length === 0)
        return 'All Types';
    const types = new Set();
    transactionData.value.forEach(t => {
        types.add(t.type);
    });
    return Array.from(types).join(', ') || 'All Types';
});
// ================================================================
// METHODS
// ================================================================
const loadStores = async () => {
    try {
        const response = await balanceService.getStores();
        stores.value = response.data || [];
    }
    catch (error) {
        console.error('Load stores error:', error);
    }
};
const loadGroups = async () => {
    try {
        const response = await balanceService.getGroups();
        groups.value = response.data || [];
    }
    catch (error) {
        console.error('Load groups error:', error);
    }
};
// ✅ LOAD CATEGORIES
const loadCategories = async () => {
    try {
        const response = await balanceService.getActiveCategories();
        if (response.success) {
            categories.value = response.data || [];
            console.log(`✅ Loaded ${categories.value.length} categories for print`);
        }
    }
    catch (error) {
        console.error('Load categories error:', error);
    }
};
const loadItems = async () => {
    try {
        const response = await balanceService.getActiveItems();
        inventoryItems.value = response.data || [];
    }
    catch (error) {
        console.error('Load items error:', error);
    }
};
const loadTransactions = async () => {
    try {
        const filters = {};
        if (filterStore.value) {
            filters.storeId = Number(filterStore.value);
        }
        if (filterGroup.value) {
            filters.groupId = Number(filterGroup.value);
        }
        // ✅ ADD CATEGORY FILTER
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
        filters.limit = 1000; // Get all data for print
        const response = await transactionService.getTransactions(filters);
        transactionData.value = response.data || [];
    }
    catch (error) {
        console.error('Load transactions error:', error);
    }
    finally {
        loading.value = false;
    }
};
// -- Helper Methods --
const getStoreName = (storeId) => {
    if (!storeId)
        return 'Unknown';
    const store = stores.value.find(s => s.id === storeId);
    return store ? store.name : 'Unknown';
};
const getGroupName = (groupId) => {
    if (!groupId)
        return 'Unknown';
    const group = groups.value.find(g => g.id === groupId);
    return group ? group.name : 'Unknown';
};
// ✅ GET CATEGORY NAME
const getCategoryName = (categoryId) => {
    if (!categoryId)
        return 'Uncategorized';
    const transaction = transactionData.value.find(t => t.categoryId === categoryId);
    if (transaction)
        return transaction.categoryName || 'Uncategorized';
    const category = categories.value.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
};
// ✅ GET STANDARD NAME
const getItemStandardName = (itemId) => {
    if (!itemId)
        return '';
    const transaction = transactionData.value.find(t => t.itemId === itemId);
    if (transaction)
        return transaction.itemStandardName || '';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.standardName || '' : '';
};
// ✅ GET COMMON NAME (uses name as primary, standardName as fallback)
const getItemCommonName = (itemId) => {
    if (!itemId)
        return 'Unnamed';
    const transaction = transactionData.value.find(t => t.itemId === itemId);
    if (transaction)
        return transaction.itemCommonName || 'Unnamed';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? (item.name || item.standardName || 'Unnamed') : 'Unnamed';
};
const getItemName = (itemId) => {
    return getItemCommonName(itemId);
};
const getItemCode = (itemId) => {
    if (!itemId)
        return 'N/A';
    const transaction = transactionData.value.find(t => t.itemId === itemId);
    if (transaction)
        return transaction.itemCode || 'N/A';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.code : 'N/A';
};
const getItemUnit = (itemId) => {
    if (!itemId)
        return '';
    const transaction = transactionData.value.find(t => t.itemId === itemId);
    if (transaction)
        return transaction.uomCode || '';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.uomCode || item.uom?.code || '' : '';
};
const getDateLabel = (dateFilter) => {
    const labels = {
        'today': 'Today',
        'yesterday': 'Yesterday',
        'week': 'This Week',
        'month': 'This Month',
        '3months': 'Last 3 Months',
        '6months': 'Last 6 Months',
        '12months': 'Last 12 Months'
    };
    return labels[dateFilter] || dateFilter;
};
const formatNumber = (num) => {
    if (num === undefined || num === null)
        return '0';
    return new Intl.NumberFormat().format(num);
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
const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};
// -- Pagination --
const changePage = (page) => {
    if (page < 1 || page > totalPages.value)
        return;
    currentPage.value = page;
};
const changePageSize = () => {
    currentPage.value = 1;
};
// -- Navigation --
const goBack = () => {
    router.push('/store-transaction');
};
const printPage = () => {
    window.print();
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    await Promise.all([
        loadStores(),
        loadGroups(),
        loadCategories(), // ✅ ADD CATEGORIES
        loadItems()
    ]);
    await loadTransactions();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-in']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-out']} */ ;
/** @type {__VLS_StyleScopedClasses['quantity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['quantity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['print-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['print-page']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-in']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-out']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['has-category']} */ ;
/** @type {__VLS_StyleScopedClasses['category-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['no-category']} */ ;
/** @type {__VLS_StyleScopedClasses['store-group-category-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-in']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-out']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['form-header']} */ ;
/** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['store-group-category-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['item-common-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard-name']} */ ;
/** @type {__VLS_StyleScopedClasses['store-group-category-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['transaction-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-back-top']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-print-top']} */ ;
if (__VLS_ctx.transactionData || !__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "top-actions no-print" },
    });
    /** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-print']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn-back-top" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-back-top']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.printPage) },
        ...{ class: "btn-print-top" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-print-top']} */ ;
}
if (__VLS_ctx.transactionData) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "print-page" },
    });
    /** @type {__VLS_StyleScopedClasses['print-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "form-header" },
    });
    /** @type {__VLS_StyleScopedClasses['form-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "motto" },
    });
    /** @type {__VLS_StyleScopedClasses['motto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "motto" },
    });
    /** @type {__VLS_StyleScopedClasses['motto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "company-name" },
    });
    /** @type {__VLS_StyleScopedClasses['company-name']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "form-subtitle-title" },
    });
    /** @type {__VLS_StyleScopedClasses['form-subtitle-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-row" },
    });
    /** @type {__VLS_StyleScopedClasses['date-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatDateTime(new Date()));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.userDisplayName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "store-group-category-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['store-group-category-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.storeSummary);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.groupSummary);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.transactionData.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "transaction-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['transaction-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item stock-in" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['stock-in']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.totalStockIn);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item stock-out" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['stock-out']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.totalStockOut);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item total" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['total']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.transactionData.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "items-table" },
    });
    /** @type {__VLS_StyleScopedClasses['items-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (!__VLS_ctx.transactionData || __VLS_ctx.transactionData.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "9",
            ...{ class: "no-items" },
        });
        /** @type {__VLS_StyleScopedClasses['no-items']} */ ;
    }
    for (const [transaction, index] of __VLS_vFor((__VLS_ctx.paginatedData))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (transaction.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        ((__VLS_ctx.currentPage - 1) * __VLS_ctx.pageSize + index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "date-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['date-cell']} */ ;
        (__VLS_ctx.formatDateShort(transaction.createdAt));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['type-badge', transaction.type === 'Stock In' ? 'stock-in' : 'stock-out']) },
        });
        /** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
        (transaction.type === 'Stock In' ? '📥' : '📤');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "item-code" },
        });
        /** @type {__VLS_StyleScopedClasses['item-code']} */ ;
        (transaction.itemCode || __VLS_ctx.getItemCode(transaction.itemId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-left" },
        });
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
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
        (transaction.uomCode || __VLS_ctx.getItemUnit(transaction.itemId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['quantity-value', transaction.type === 'Stock In' ? 'positive' : 'negative']) },
        });
        /** @type {__VLS_StyleScopedClasses['quantity-value']} */ ;
        (transaction.type === 'Stock In' ? '+' : '-');
        (__VLS_ctx.formatNumber(transaction.quantity));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "reference-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['reference-cell']} */ ;
        (transaction.referenceType || '-');
        // @ts-ignore
        [transactionData, transactionData, transactionData, transactionData, transactionData, transactionData, loading, goBack, printPage, formatDateTime, userDisplayName, storeSummary, groupSummary, totalStockIn, totalStockOut, paginatedData, currentPage, pageSize, formatDateShort, getItemCode, getItemCommonName, getItemStandardName, getItemStandardName, getItemUnit, formatNumber,];
    }
    if (__VLS_ctx.transactionData && __VLS_ctx.transactionData.length > __VLS_ctx.pageSize) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination no-print" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-print']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.transactionData))
                        return;
                    if (!(__VLS_ctx.transactionData && __VLS_ctx.transactionData.length > __VLS_ctx.pageSize))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
                    // @ts-ignore
                    [transactionData, transactionData, currentPage, pageSize, changePage,];
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
                    if (!(__VLS_ctx.transactionData))
                        return;
                    if (!(__VLS_ctx.transactionData && __VLS_ctx.transactionData.length > __VLS_ctx.pageSize))
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
            value: (10),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (20),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (50),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (100),
        });
    }
}
else if (__VLS_ctx.loading) {
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
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn-back" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
}
// @ts-ignore
[loading, goBack, currentPage, pageSize, totalPages, changePageSize,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
