import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import balanceService from '@/stores/balanceService';
// ================================================================
// STATE
// ================================================================
const router = useRouter();
const route = useRoute();
const loading = ref(true);
const balanceData = ref([]);
const stores = ref([]);
const groups = ref([]);
const categories = ref([]);
const inventoryItems = ref([]);
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
const filterStore = ref(route.query.storeId || '');
const filterGroup = ref(route.query.groupId || '');
const filterCategory = ref(route.query.categoryId || '');
const filterStatus = ref(route.query.status || '');
// ================================================================
// COMPUTED
// ================================================================
const storeSummary = computed(() => {
    if (!balanceData.value || balanceData.value.length === 0)
        return 'No stores';
    const storeNames = new Set();
    balanceData.value.forEach(item => {
        const name = item.storeName || getStoreName(item.storeId);
        if (name)
            storeNames.add(name);
    });
    return Array.from(storeNames).join(', ') || 'No stores';
});
const groupSummary = computed(() => {
    if (!balanceData.value || balanceData.value.length === 0)
        return 'No groups';
    const groupNames = new Set();
    balanceData.value.forEach(item => {
        const name = item.groupName || getGroupName(item.groupId);
        if (name)
            groupNames.add(name);
    });
    return Array.from(groupNames).join(', ') || 'No groups';
});
const categorySummary = computed(() => {
    if (!balanceData.value || balanceData.value.length === 0)
        return 'No categories';
    const categoryNames = new Set();
    balanceData.value.forEach(item => {
        const name = item.categoryName || getCategoryName(item.categoryId);
        if (name)
            categoryNames.add(name);
    });
    return Array.from(categoryNames).join(', ') || 'No categories';
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
const loadCategories = async () => {
    try {
        const response = await balanceService.getActiveCategories();
        if (response.success) {
            categories.value = response.data || [];
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
const loadBalances = async () => {
    try {
        const filters = {};
        if (filterStore.value)
            filters.storeId = Number(filterStore.value);
        if (filterGroup.value)
            filters.groupId = Number(filterGroup.value);
        if (filterCategory.value)
            filters.categoryId = Number(filterCategory.value);
        if (filterStatus.value)
            filters.status = filterStatus.value;
        filters.limit = 10000; // ✅ Get ALL data for print
        const response = await balanceService.getBalances(filters);
        balanceData.value = response.data || [];
    }
    catch (error) {
        console.error('Load balances error:', error);
    }
    finally {
        loading.value = false;
    }
};
// -- Helper Methods --
const getStoreName = (storeId) => {
    if (!storeId)
        return 'Unknown';
    const balance = balanceData.value.find(b => b.storeId === storeId);
    if (balance)
        return balance.storeName || 'Unknown';
    const store = stores.value.find(s => s.id === storeId);
    return store ? store.name : 'Unknown';
};
const getGroupName = (groupId) => {
    if (!groupId)
        return 'Unknown';
    const balance = balanceData.value.find(b => b.groupId === groupId);
    if (balance)
        return balance.groupName || 'Unknown';
    const group = groups.value.find(g => g.id === groupId);
    return group ? group.name : 'Unknown';
};
const getCategoryName = (categoryId) => {
    if (!categoryId)
        return 'Uncategorized';
    const balance = balanceData.value.find(b => b.categoryId === categoryId);
    if (balance)
        return balance.categoryName || 'Uncategorized';
    const category = categories.value.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
};
const getItemStandardName = (itemId) => {
    if (!itemId)
        return '';
    const balance = balanceData.value.find(b => b.itemId === itemId);
    if (balance)
        return balance.itemStandardName || '';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.standardName || '' : '';
};
const getItemCommonName = (itemId) => {
    if (!itemId)
        return 'Unnamed';
    const balance = balanceData.value.find(b => b.itemId === itemId);
    if (balance)
        return balance.itemCommonName || balance.itemName || 'Unnamed';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? (item.name || item.standardName || 'Unnamed') : 'Unnamed';
};
const getItemCode = (itemId) => {
    if (!itemId)
        return 'N/A';
    const balance = balanceData.value.find(b => b.itemId === itemId);
    if (balance)
        return balance.itemCode || 'N/A';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.code : 'N/A';
};
const getItemUnit = (itemId) => {
    if (!itemId)
        return '';
    const balance = balanceData.value.find(b => b.itemId === itemId);
    if (balance)
        return balance.uomCode || '';
    const item = inventoryItems.value.find(i => i.id === itemId);
    return item ? item.uomCode || '' : '';
};
const formatNumber = (num) => {
    if (num === undefined || num === null)
        return '0';
    return new Intl.NumberFormat().format(num);
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
// -- Navigation --
const goBack = () => {
    router.push('/store-balance');
};
// ✅ FIXED: Give Vue time to render before printing
const printPage = () => {
    setTimeout(() => {
        window.print();
    }, 500);
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
    await Promise.all([
        loadStores(),
        loadGroups(),
        loadCategories(),
        loadItems()
    ]);
    await loadBalances();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['print-table']} */ ;
/** @type {__VLS_StyleScopedClasses['print-table']} */ ;
/** @type {__VLS_StyleScopedClasses['print-table']} */ ;
/** @type {__VLS_StyleScopedClasses['print-table']} */ ;
/** @type {__VLS_StyleScopedClasses['print-table']} */ ;
/** @type {__VLS_StyleScopedClasses['print-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "no-print" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['no-print']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "btn-back" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.printPage) },
    ...{ class: "btn-print" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['btn-print']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    id: "print-area",
});
if (__VLS_ctx.balanceData) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "print-header" },
    });
    /** @type {__VLS_StyleScopedClasses['print-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "motto" },
    });
    /** @type {__VLS_StyleScopedClasses['motto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "motto" },
    });
    /** @type {__VLS_StyleScopedClasses['motto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "company" },
    });
    /** @type {__VLS_StyleScopedClasses['company']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "report-title" },
    });
    /** @type {__VLS_StyleScopedClasses['report-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "report-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['report-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatDateTime(new Date()));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.userDisplayName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "print-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['print-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.storeSummary);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.groupSummary);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.categorySummary);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.balanceData.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "print-table" },
    });
    /** @type {__VLS_StyleScopedClasses['print-table']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (!__VLS_ctx.balanceData || __VLS_ctx.balanceData.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
            ...{ class: "no-data" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data']} */ ;
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.balanceData))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (item.itemCode || __VLS_ctx.getItemCode(item.itemId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-left" },
        });
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-name" },
        });
        /** @type {__VLS_StyleScopedClasses['item-name']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "common-name" },
        });
        /** @type {__VLS_StyleScopedClasses['common-name']} */ ;
        (item.itemCommonName || __VLS_ctx.getItemCommonName(item.itemId) || 'Unnamed');
        if (item.itemStandardName || __VLS_ctx.getItemStandardName(item.itemId)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "standard-name" },
            });
            /** @type {__VLS_StyleScopedClasses['standard-name']} */ ;
            (item.itemStandardName || __VLS_ctx.getItemStandardName(item.itemId));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "category-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['category-badge']} */ ;
        (item.categoryName || 'Uncategorized');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (item.uomCode || __VLS_ctx.getItemUnit(item.itemId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        (__VLS_ctx.formatNumber(item.balance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['status-badge', (item.status || 'inactive').toLowerCase()]) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        (item.status || 'Inactive');
        // @ts-ignore
        [goBack, printPage, balanceData, balanceData, balanceData, balanceData, balanceData, formatDateTime, userDisplayName, storeSummary, groupSummary, categorySummary, getItemCode, getItemCommonName, getItemStandardName, getItemStandardName, getItemUnit, formatNumber,];
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
}
// @ts-ignore
[loading,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
