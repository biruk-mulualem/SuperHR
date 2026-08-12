import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import storeDashboardService from '@/stores/storeDashboardService';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const exporting = ref(false);
const selectedStore = ref('all');
const selectedGroup = ref('all');
const movementDateRange = ref('week');
// Dashboard data
const stockSummary = ref({});
const stockHealth = ref({});
const transactionStats = ref({});
const recentTransactions = ref([]);
const lowStockAlerts = ref([]);
const pendingRequestsList = ref([]);
const categoryDistribution = ref([]);
const highTransactionItems = ref([]);
const lowTransactionItems = ref([]);
const stores = ref([]);
const groups = ref([]);
const lowStockContainer = ref(null);
// ✅ Low Stock Alerts Pagination
const lowStockPagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
});
const lowStockLoading = ref(false);
const lowStockLoadedAll = ref(false);
// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
// ================================================================
// COMPUTED
// ================================================================
const currentDate = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});
// Add this to your computed section
const totalAlerts = computed(() => {
    return lowStockPagination.value.total || 0;
});
const hasActiveFilters = computed(() => {
    return selectedStore.value !== 'all' || selectedGroup.value !== 'all';
});
const criticalAlerts = computed(() => {
    return lowStockAlerts.value.filter((item) => item.currentStock === 0);
});
const warningAlerts = computed(() => {
    return lowStockAlerts.value.filter((item) => item.currentStock > 0 && item.currentStock <= item.minStock);
});
// ✅ FIXED: Group items by transaction count for high moving items
const groupedHighItems = computed(() => {
    const groups = new Map();
    if (!highTransactionItems.value || highTransactionItems.value.length === 0) {
        return [];
    }
    highTransactionItems.value.forEach(item => {
        const key = item.transactions || 0;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });
    return Array.from(groups.entries())
        .map(([transactionCount, items]) => ({
        transactionCount,
        items,
        itemNames: items.map(i => i.name || i.itemName || 'Unknown Item')
    }))
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, 10);
});
// ✅ FIXED: Group items by transaction count for low moving items
const groupedLowItems = computed(() => {
    const groups = new Map();
    if (!lowTransactionItems.value || lowTransactionItems.value.length === 0) {
        return [];
    }
    lowTransactionItems.value.forEach(item => {
        const key = item.transactions || 0;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });
    return Array.from(groups.entries())
        .map(([transactionCount, items]) => ({
        transactionCount,
        items,
        itemNames: items.map(i => i.name || i.itemName || 'Unknown Item')
    }))
        .sort((a, b) => a.transactionCount - b.transactionCount)
        .slice(0, 10);
});
// ✅ FIXED: maxTransactions
const maxTransactions = computed(() => {
    if (!highTransactionItems.value || highTransactionItems.value.length === 0) {
        return 1;
    }
    const max = Math.max(...highTransactionItems.value.map((g) => g.transactions || 0), 1);
    return max;
});
// ✅ FIXED: maxLowTransactions
const maxLowTransactions = computed(() => {
    if (!lowTransactionItems.value || lowTransactionItems.value.length === 0) {
        return 1;
    }
    const max = Math.max(...lowTransactionItems.value.map((g) => g.transactions || 0), 1);
    return max;
});
// ✅ FIXED: groupedItemsCount
const groupedItemsCount = computed(() => {
    let count = 0;
    if (groupedHighItems.value) {
        groupedHighItems.value.forEach(group => {
            if (group.items && group.items.length > 1)
                count += group.items.length;
        });
    }
    if (groupedLowItems.value) {
        groupedLowItems.value.forEach(group => {
            if (group.items && group.items.length > 1)
                count += group.items.length;
        });
    }
    return count;
});
// ================================================================
// METHODS
// ================================================================
// ✅ Get bar width for chart
const getBarWidth = (value, max) => {
    if (max === 0)
        return 0;
    return Math.max((value / max) * 100, 5);
};
const loadAllDashboardData = async () => {
    loading.value = true;
    try {
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;
        console.log('📍 Setting user context from auth store:', { storeId, groupId });
        if (storeId && groupId) {
            storeDashboardService.setUserContext(storeId, groupId);
        }
        else {
            console.warn('⚠️ No store or group found in auth store');
        }
        // ✅ Reset low stock pagination
        lowStockPagination.value.page = 1;
        lowStockAlerts.value = [];
        lowStockLoadedAll.value = false;
        // Load all sections in parallel
        await Promise.all([
            loadStockSummary(),
            loadStockHealth(),
            loadLowStockAlerts(1),
            loadApprovedRequests(),
            loadRecentTransactions(),
            loadMovingItems(),
            loadTransactionStats(),
            loadFilterOptions()
        ]);
        console.log('✅ All dashboard data loaded successfully');
    }
    catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
        showToastMessage('Failed to load dashboard data', 'error');
    }
    finally {
        loading.value = false;
    }
};
const loadStockSummary = async () => {
    try {
        const response = await storeDashboardService.getStockSummary();
        if (response.success) {
            stockSummary.value = response.data;
        }
    }
    catch (error) {
        console.error('❌ Failed to load stock summary:', error);
    }
};
const loadStockHealth = async () => {
    try {
        const response = await storeDashboardService.getStockHealth();
        if (response.success) {
            stockHealth.value = response.data;
        }
    }
    catch (error) {
        console.error('❌ Failed to load stock health:', error);
    }
};
const loadLowStockAlerts = async (page = 1) => {
    try {
        lowStockLoading.value = true;
        const limit = 10;
        const response = await storeDashboardService.getLowStockAlerts(limit, page);
        if (response.success) {
            const data = response.data;
            if (page === 1) {
                lowStockAlerts.value = data.alerts;
            }
            else {
                lowStockAlerts.value = [...lowStockAlerts.value, ...data.alerts];
            }
            lowStockPagination.value = data.pagination;
            lowStockLoadedAll.value = !data.pagination.hasMore;
            console.log(`✅ Loaded ${data.alerts.length} alerts (page ${page})`);
        }
    }
    catch (error) {
        console.error('❌ Failed to load low stock alerts:', error);
    }
    finally {
        lowStockLoading.value = false;
    }
};
const loadMoreLowStockAlerts = () => {
    if (!lowStockLoading.value && !lowStockLoadedAll.value && lowStockPagination.value.hasMore) {
        const nextPage = lowStockPagination.value.page + 1;
        loadLowStockAlerts(nextPage);
    }
};
const handleLowStockScroll = (event) => {
    const container = event.target;
    if (!container)
        return;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMoreLowStockAlerts();
    }
};
const loadApprovedRequests = async () => {
    try {
        const response = await storeDashboardService.getApprovedRequests(10);
        if (response.success) {
            pendingRequestsList.value = response.data;
        }
    }
    catch (error) {
        console.error('❌ Failed to load approved requests:', error);
    }
};
const loadRecentTransactions = async () => {
    try {
        const response = await storeDashboardService.getRecentTransactions(10);
        if (response.success) {
            recentTransactions.value = response.data;
        }
    }
    catch (error) {
        console.error('❌ Failed to load recent transactions:', error);
    }
};
const loadMovingItems = async () => {
    try {
        const response = await storeDashboardService.getMovingItems(movementDateRange.value);
        if (response.success) {
            highTransactionItems.value = response.data.highMoving;
            lowTransactionItems.value = response.data.lowMoving;
            console.log('✅ High moving items:', highTransactionItems.value);
            console.log('✅ Low moving items:', lowTransactionItems.value);
        }
    }
    catch (error) {
        console.error('❌ Failed to load moving items:', error);
    }
};
const loadTransactionStats = async () => {
    try {
        const response = await storeDashboardService.getTransactionStats();
        if (response.success) {
            transactionStats.value = response.data;
        }
    }
    catch (error) {
        console.error('❌ Failed to load transaction stats:', error);
    }
};
const loadFilterOptions = async () => {
    try {
        const response = await storeDashboardService.getFilterOptions();
        if (response.success) {
            stores.value = response.data.stores;
            groups.value = response.data.groups;
            if (response.data.userAccess.storeId) {
                selectedStore.value = response.data.userAccess.storeId.toString();
            }
            if (response.data.userAccess.groupId) {
                selectedGroup.value = response.data.userAccess.groupId.toString();
            }
        }
    }
    catch (error) {
        console.error('❌ Failed to load filter options:', error);
    }
};
const refreshData = async () => {
    showToastMessage('Refreshing dashboard...', 'info');
    await loadAllDashboardData();
    showToastMessage('Dashboard refreshed successfully!', 'success');
};
const exportDashboard = async () => {
    exporting.value = true;
    try {
        const response = await storeDashboardService.exportDashboard(movementDateRange.value);
        if (response.success) {
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showToastMessage('Dashboard exported successfully!', 'success');
        }
    }
    catch (error) {
        console.error('Export error:', error);
        showToastMessage('Failed to export dashboard', 'error');
    }
    finally {
        exporting.value = false;
    }
};
const getStoreName = (storeId) => {
    return storeDashboardService.getStoreName(stores.value, storeId);
};
const getGroupName = (groupId) => {
    return storeDashboardService.getGroupName(groups.value, groupId);
};
const getDateRangeLabel = (range) => {
    return storeDashboardService.getDateRangeLabel(range);
};
const formatNumber = (num) => {
    return storeDashboardService.formatNumber(num);
};
const formatDate = (dateString) => {
    return storeDashboardService.formatDate(dateString || null);
};
const formatDateShort = (dateString) => {
    return storeDashboardService.formatDateShort(dateString || null);
};
const getInitials = (name) => {
    return storeDashboardService.getInitials(name);
};
const onFilterChange = () => {
    loadAllDashboardData();
};
const onMovementDateChange = () => {
    loadMovingItems();
    showToastMessage(`📅 Date range changed to: ${getDateRangeLabel(movementDateRange.value)}`, 'info');
};
const clearFilters = () => {
    selectedStore.value = 'all';
    selectedGroup.value = 'all';
    movementDateRange.value = 'week';
    loadAllDashboardData();
    showToastMessage('Filters cleared', 'info');
};
const navigateTo = (page) => {
    router.push(`/${page}`);
};
const scrollToLowStock = () => {
    const element = document.getElementById('low-stock-section');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};
const quickReorder = (item) => {
    showToastMessage(`Quick reorder initiated for ${item.name}`, 'info');
    router.push(`/item-requests?item=${item.id}`);
};
const showToastMessage = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
};
// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
    loadAllDashboardData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-process']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-process']} */ ;
/** @type {__VLS_StyleScopedClasses['request-item']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-action']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-action-card']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-content']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-content']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-action-card']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['health-card']} */ ;
/** @type {__VLS_StyleScopedClasses['health-percent']} */ ;
/** @type {__VLS_StyleScopedClasses['health-card']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['health-percent']} */ ;
/** @type {__VLS_StyleScopedClasses['health-card']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['health-percent']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-card']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['view-all-link']} */ ;
/** @type {__VLS_StyleScopedClasses['view-more-link']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-action']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
/** @type {__VLS_StyleScopedClasses['low']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['low']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-details']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-details']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-details']} */ ;
/** @type {__VLS_StyleScopedClasses['request-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-quick-reorder']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-approve']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more-button']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more-button']} */ ;
/** @type {__VLS_StyleScopedClasses['category-mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['category-mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['yellow']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-actions-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['store-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-actions-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-health-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-section']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-clear-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-filter-section']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-filter-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['movement-filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['category-mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-box']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['example']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-details']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-code']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['store-dashboard']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "dashboard-header" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "logo-badge" },
});
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "2",
    y: "7",
    width: "20",
    height: "14",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-right" },
});
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "date-display" },
});
/** @type {__VLS_StyleScopedClasses['date-display']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "date-icon" },
});
/** @type {__VLS_StyleScopedClasses['date-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "date-text" },
});
/** @type {__VLS_StyleScopedClasses['date-text']} */ ;
(__VLS_ctx.currentDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportDashboard) },
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
(__VLS_ctx.exporting ? 'Exporting...' : 'Export');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "refresh-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2.5",
        width: "18",
        height: "18",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M23 4v6h-6M1 20v-6h6",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "btn-text" },
});
/** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
(__VLS_ctx.loading ? 'Loading...' : 'Refresh');
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
    if (__VLS_ctx.totalAlerts > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "alert-banner critical" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-banner']} */ ;
        /** @type {__VLS_StyleScopedClasses['critical']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "alert-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "alert-message" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-message']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.totalAlerts);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "alert-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-detail']} */ ;
        if (__VLS_ctx.warningAlerts.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "alert-warning" },
            });
            /** @type {__VLS_StyleScopedClasses['alert-warning']} */ ;
            (__VLS_ctx.warningAlerts.length);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ onClick: (__VLS_ctx.scrollToLowStock) },
            ...{ class: "alert-action" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-action']} */ ;
    }
    else if (__VLS_ctx.warningAlerts.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "alert-banner warning" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-banner']} */ ;
        /** @type {__VLS_StyleScopedClasses['warning']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "alert-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "alert-message" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-message']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.warningAlerts.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ onClick: (__VLS_ctx.scrollToLowStock) },
            ...{ class: "alert-action" },
        });
        /** @type {__VLS_StyleScopedClasses['alert-action']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-balance');
                // @ts-ignore
                [currentDate, exportDashboard, exporting, exporting, exporting, refreshData, loading, loading, loading, loading, totalAlerts, totalAlerts, warningAlerts, warningAlerts, warningAlerts, warningAlerts, scrollToLowStock, scrollToLowStock, navigateTo,];
            } },
        ...{ class: "stat-card" },
        ...{ style: {} },
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
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.stockSummary.totalItems || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card success" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.stockSummary.totalStockIn || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card danger" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.stockSummary.totalStockOut || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.stockSummary.pendingRequests || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "quick-actions-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-actions-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-balance');
                // @ts-ignore
                [navigateTo, stockSummary, stockSummary, stockSummary, stockSummary,];
            } },
        ...{ class: "quick-action-card" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-action-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "quick-content" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-badge']} */ ;
    (__VLS_ctx.stockSummary.totalItems || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-transaction');
                // @ts-ignore
                [navigateTo, stockSummary,];
            } },
        ...{ class: "quick-action-card" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-action-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "quick-content" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-badge']} */ ;
    (__VLS_ctx.transactionStats.total || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('item-requests');
                // @ts-ignore
                [navigateTo, transactionStats,];
            } },
        ...{ class: "quick-action-card" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-action-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "quick-content" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-badge']} */ ;
    (__VLS_ctx.stockSummary.pendingRequests || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "quick-arrow" },
    });
    /** @type {__VLS_StyleScopedClasses['quick-arrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stock-health-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stock-health-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-card healthy" },
    });
    /** @type {__VLS_StyleScopedClasses['health-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['healthy']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['health-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-info" },
    });
    /** @type {__VLS_StyleScopedClasses['health-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-number" },
    });
    /** @type {__VLS_StyleScopedClasses['health-number']} */ ;
    (__VLS_ctx.stockHealth.healthy || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-label" },
    });
    /** @type {__VLS_StyleScopedClasses['health-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['health-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-fill" },
        ...{ style: ({ width: (__VLS_ctx.stockHealth.healthyPercent || 0) + '%', background: '#10b981' }) },
    });
    /** @type {__VLS_StyleScopedClasses['health-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['health-percent']} */ ;
    (__VLS_ctx.stockHealth.healthyPercent || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.scrollToLowStock) },
        ...{ class: "health-card warning" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['health-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['health-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-info" },
    });
    /** @type {__VLS_StyleScopedClasses['health-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-number" },
    });
    /** @type {__VLS_StyleScopedClasses['health-number']} */ ;
    (__VLS_ctx.stockHealth.lowStock || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-label" },
    });
    /** @type {__VLS_StyleScopedClasses['health-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['health-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-fill" },
        ...{ style: ({ width: (__VLS_ctx.stockHealth.lowStockPercent || 0) + '%', background: '#f59e0b' }) },
    });
    /** @type {__VLS_StyleScopedClasses['health-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['health-percent']} */ ;
    (__VLS_ctx.stockHealth.lowStockPercent || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-balance');
                // @ts-ignore
                [scrollToLowStock, navigateTo, stockSummary, stockHealth, stockHealth, stockHealth, stockHealth, stockHealth, stockHealth,];
            } },
        ...{ class: "health-card danger" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['health-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['health-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-info" },
    });
    /** @type {__VLS_StyleScopedClasses['health-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-number" },
    });
    /** @type {__VLS_StyleScopedClasses['health-number']} */ ;
    (__VLS_ctx.stockHealth.zeroStock || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-label" },
    });
    /** @type {__VLS_StyleScopedClasses['health-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['health-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-fill" },
        ...{ style: ({ width: (__VLS_ctx.stockHealth.zeroStockPercent || 0) + '%', background: '#ef4444' }) },
    });
    /** @type {__VLS_StyleScopedClasses['health-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "health-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['health-percent']} */ ;
    (__VLS_ctx.stockHealth.zeroStockPercent || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "mini-table" },
    });
    /** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.recentTransactions.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "4",
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    for (const [tx] of __VLS_vFor((__VLS_ctx.recentTransactions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (tx.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatDateShort(tx.createdAt));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (tx.itemName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['type-badge', tx.type === 'Stock In' ? 'stock-in' : 'stock-out']) },
        });
        /** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
        (tx.type === 'Stock In' ? '📥 In' : '📤 Out');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: (tx.type === 'Stock In' ? 'positive' : 'negative') },
        });
        (tx.type === 'Stock In' ? '+' : '-');
        (__VLS_ctx.formatNumber(tx.quantity));
        // @ts-ignore
        [stockHealth, stockHealth, stockHealth, recentTransactions, recentTransactions, formatDateShort, formatNumber,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-transaction');
                // @ts-ignore
                [navigateTo,];
            } },
        ...{ class: "view-all-link" },
    });
    /** @type {__VLS_StyleScopedClasses['view-all-link']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "movement-filter-section" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-filter-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "movement-filter-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-filter-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "movement-filter-label" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-filter-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onMovementDateChange) },
        value: (__VLS_ctx.movementDateRange),
        ...{ class: "movement-filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "today",
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
        value: "all",
    });
    if (__VLS_ctx.movementDateRange !== 'all') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "movement-filter-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['movement-filter-hint']} */ ;
        (__VLS_ctx.getDateRangeLabel(__VLS_ctx.movementDateRange));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-legend" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-legend']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-color high" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
    /** @type {__VLS_StyleScopedClasses['high']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-count" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-count']} */ ;
    (__VLS_ctx.highTransactionItems.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-color low" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
    /** @type {__VLS_StyleScopedClasses['low']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-count" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-count']} */ ;
    (__VLS_ctx.lowTransactionItems.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-color grouped" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
    /** @type {__VLS_StyleScopedClasses['grouped']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-count" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-count']} */ ;
    (__VLS_ctx.groupedItemsCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "movement-charts-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-charts-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "movement-chart-card high-chart full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-chart-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['high-chart']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-header" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-title" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-badge']} */ ;
    (__VLS_ctx.highTransactionItems.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-body" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
    if (!__VLS_ctx.highTransactionItems || __VLS_ctx.highTransactionItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else if (__VLS_ctx.groupedHighItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-bars" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-bars']} */ ;
        for (const [group, index] of __VLS_vFor((__VLS_ctx.groupedHighItems))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (group.transactionCount),
                ...{ class: "chart-bar-row grouped-row" },
                ...{ style: ({ animationDelay: (index * 0.05) + 's' }) },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-row']} */ ;
            /** @type {__VLS_StyleScopedClasses['grouped-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-info" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-rank" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-rank']} */ ;
            (index + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-name-wrapper" },
                title: (group.itemNames.join(', ')),
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-name-wrapper']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-name" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
            (group.itemNames.length === 1 ? group.itemNames[0] : group.itemNames[0] + ' +' + (group.itemNames.length - 1));
            if (group.items && group.items.length > 1) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "chart-bar-code" },
                });
                /** @type {__VLS_StyleScopedClasses['chart-bar-code']} */ ;
                (group.items.length);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-track" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-fill high-fill" },
                ...{ style: ({
                        width: __VLS_ctx.getBarWidth(group.transactionCount, __VLS_ctx.maxTransactions) + '%',
                        background: `linear-gradient(90deg, #f59e0b, #d97706)`
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
            /** @type {__VLS_StyleScopedClasses['high-fill']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-value" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-value']} */ ;
            (group.transactionCount);
            // @ts-ignore
            [onMovementDateChange, movementDateRange, movementDateRange, movementDateRange, getDateRangeLabel, highTransactionItems, highTransactionItems, highTransactionItems, highTransactionItems, lowTransactionItems, groupedItemsCount, groupedHighItems, groupedHighItems, getBarWidth, maxTransactions,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-total" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-total']} */ ;
    (__VLS_ctx.highTransactionItems.reduce((sum, i) => sum + (i.transactions || 0), 0));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-transaction');
                // @ts-ignore
                [navigateTo, highTransactionItems,];
            } },
        ...{ class: "chart-action" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-action']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "movement-chart-card low-chart full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['movement-chart-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['low-chart']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-header" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-title" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-badge low" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['low']} */ ;
    (__VLS_ctx.lowTransactionItems.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-body" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
    if (!__VLS_ctx.lowTransactionItems || __VLS_ctx.lowTransactionItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else if (__VLS_ctx.groupedLowItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-bars" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-bars']} */ ;
        for (const [group, index] of __VLS_vFor((__VLS_ctx.groupedLowItems))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (group.transactionCount),
                ...{ class: "chart-bar-row grouped-row" },
                ...{ style: ({ animationDelay: (index * 0.05) + 's' }) },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-row']} */ ;
            /** @type {__VLS_StyleScopedClasses['grouped-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-info" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-rank" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-rank']} */ ;
            (index + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-name-wrapper" },
                title: (group.itemNames.join(', ')),
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-name-wrapper']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-name" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
            (group.itemNames.length === 1 ? group.itemNames[0] : group.itemNames[0] + ' +' + (group.itemNames.length - 1));
            if (group.items && group.items.length > 1) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "chart-bar-code" },
                });
                /** @type {__VLS_StyleScopedClasses['chart-bar-code']} */ ;
                (group.items.length);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-track" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-fill low-fill" },
                ...{ style: ({
                        width: __VLS_ctx.getBarWidth(group.transactionCount, __VLS_ctx.maxLowTransactions) + '%',
                        background: `linear-gradient(90deg, #3b82f6, #6366f1)`
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
            /** @type {__VLS_StyleScopedClasses['low-fill']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-value" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-value']} */ ;
            (group.transactionCount);
            // @ts-ignore
            [lowTransactionItems, lowTransactionItems, lowTransactionItems, getBarWidth, groupedLowItems, groupedLowItems, maxLowTransactions,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-total" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-total']} */ ;
    (__VLS_ctx.lowTransactionItems.reduce((sum, i) => sum + (i.transactions || 0), 0));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.navigateTo('store-transaction');
                // @ts-ignore
                [navigateTo, lowTransactionItems,];
            } },
        ...{ class: "chart-action" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-action']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
        id: "low-stock-section",
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card alert-card warning" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['alert-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge warning" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    (__VLS_ctx.lowStockAlerts.length);
    (__VLS_ctx.lowStockPagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onScroll: (__VLS_ctx.handleLowStockScroll) },
        ...{ class: "scroll-container" },
        ref: "lowStockContainer",
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    if (__VLS_ctx.lowStockAlerts.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-list" },
        });
        /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.lowStockAlerts))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item.id),
                ...{ class: "list-item alert-item low" },
            });
            /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['alert-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['low']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-avatar alert-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
            /** @type {__VLS_StyleScopedClasses['alert-avatar']} */ ;
            (__VLS_ctx.getInitials(item.name));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-info" },
            });
            /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-name" },
            });
            /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
            (item.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-detail" },
            });
            /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
            (item.code);
            (item.category);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "alert-details" },
            });
            /** @type {__VLS_StyleScopedClasses['alert-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "current-stock" },
            });
            /** @type {__VLS_StyleScopedClasses['current-stock']} */ ;
            (item.currentStock);
            (item.uom);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "min-stock" },
            });
            /** @type {__VLS_StyleScopedClasses['min-stock']} */ ;
            (item.minStock);
            (item.uom);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "shortage" },
            });
            /** @type {__VLS_StyleScopedClasses['shortage']} */ ;
            (item.shortage);
            (item.uom);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.lowStockAlerts.length === 0))
                            return;
                        __VLS_ctx.quickReorder(item);
                        // @ts-ignore
                        [lowStockAlerts, lowStockAlerts, lowStockAlerts, lowStockPagination, handleLowStockScroll, getInitials, quickReorder,];
                    } },
                ...{ class: "btn-quick-reorder" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-quick-reorder']} */ ;
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.lowStockLoading) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "load-more-indicator" },
            });
            /** @type {__VLS_StyleScopedClasses['load-more-indicator']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "spinner-small" },
            });
            /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else if (__VLS_ctx.lowStockLoadedAll && __VLS_ctx.lowStockAlerts.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "load-more-indicator" },
            });
            /** @type {__VLS_StyleScopedClasses['load-more-indicator']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.lowStockPagination.total);
        }
        else if (__VLS_ctx.lowStockPagination.hasMore && !__VLS_ctx.lowStockLoading) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (__VLS_ctx.loadMoreLowStockAlerts) },
                ...{ class: "load-more-button" },
            });
            /** @type {__VLS_StyleScopedClasses['load-more-button']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (Math.min(10, __VLS_ctx.lowStockPagination.total - __VLS_ctx.lowStockAlerts.length));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "load-more-hint" },
            });
            /** @type {__VLS_StyleScopedClasses['load-more-hint']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card alert-card info" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['alert-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge info" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    (__VLS_ctx.pendingRequestsList.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    if (__VLS_ctx.pendingRequestsList.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-list" },
        });
        /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
        for (const [request] of __VLS_vFor((__VLS_ctx.pendingRequestsList.slice(0, 5)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (request.id),
                ...{ class: "list-item request-item" },
            });
            /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['request-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-avatar request-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
            /** @type {__VLS_StyleScopedClasses['request-avatar']} */ ;
            (__VLS_ctx.getInitials(request.requestedBy));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-info" },
            });
            /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-name" },
            });
            /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
            (request.requestCode);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-detail" },
            });
            /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
            for (const [item, index] of __VLS_vFor((request.items))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    key: (item.itemId),
                });
                (item.itemName);
                (item.quantity);
                (item.uom);
                // @ts-ignore
                [lowStockAlerts, lowStockAlerts, lowStockPagination, lowStockPagination, lowStockPagination, getInitials, lowStockLoading, lowStockLoading, lowStockLoadedAll, loadMoreLowStockAlerts, pendingRequestsList, pendingRequestsList, pendingRequestsList,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-date" },
            });
            /** @type {__VLS_StyleScopedClasses['list-date']} */ ;
            (__VLS_ctx.formatDate(request.requestedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-badge approved" },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['approved']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.pendingRequestsList.length === 0))
                            return;
                        __VLS_ctx.navigateTo('item-requests');
                        // @ts-ignore
                        [navigateTo, formatDate,];
                    } },
                ...{ class: "btn-process" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-process']} */ ;
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.pendingRequestsList.length > 5) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.pendingRequestsList.length === 0))
                            return;
                        if (!(__VLS_ctx.pendingRequestsList.length > 5))
                            return;
                        __VLS_ctx.navigateTo('item-requests');
                        // @ts-ignore
                        [navigateTo, pendingRequestsList,];
                    } },
                ...{ class: "view-more-link" },
            });
            /** @type {__VLS_StyleScopedClasses['view-more-link']} */ ;
            (__VLS_ctx.pendingRequestsList.length);
        }
    }
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
[pendingRequestsList, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
