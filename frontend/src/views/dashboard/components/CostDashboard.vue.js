import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import costDashboardService from '@/stores/costDashboardService';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
// ================================================================
// STATE
// ================================================================
const loading = ref(false);
const exportingZero = ref(false);
const exportingStore = ref(false);
const exportingTop = ref(false);
// Dashboard Data
const summary = ref({
    totalItems: 0,
    zeroCostItems: 0,
    totalCost: 0,
    excludedByConflict: 0,
    excludedByData: 0,
    itemsWithCost: 0
});
const costByStore = ref([]);
const topCostItems = ref([]);
const zeroCostItems = ref([]);
const zeroCostPagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
});
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
const maxStoreCost = computed(() => {
    if (costByStore.value.length === 0)
        return 1;
    return Math.max(...costByStore.value.map(s => s.totalCost), 1);
});
const storeTotal = computed(() => {
    return costByStore.value.reduce((sum, s) => sum + s.totalCost, 0);
});
const topItemsTotal = computed(() => {
    return topCostItems.value.reduce((sum, i) => sum + i.totalCost, 0);
});
// ================================================================
// METHODS
// ================================================================
const getStoreColor = (storeId) => {
    return costDashboardService.getStoreColor(storeId);
};
const getPercentColor = (percent) => {
    return costDashboardService.getPercentColor(percent);
};
const getBarWidth = (value, max) => {
    if (max === 0)
        return 0;
    const percent = (value / max) * 100;
    return Math.max(Math.min(percent, 100), 8);
};
const formatCurrency = (value) => {
    return costDashboardService.formatCurrency(value);
};
const formatNumber = (value) => {
    return costDashboardService.formatNumber(value);
};
const navigateTo = (page) => {
    router.push(`/${page}`);
};
const scrollToZeroCost = () => {
    const element = document.getElementById('zero-cost-section');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};
const goToRules = () => {
    router.push('/cost-calculation-rules');
};
// ================================================================
// 📤 EXPORT: Cost by Store (using new endpoint with pagination)
// ================================================================
const handleExportCostByStore = async () => {
    exportingStore.value = true;
    try {
        const response = await costDashboardService.exportCostByStore(1, 100);
        if (response.success && response.data && response.data.length > 0) {
            const exportData = response.data;
            const headers = Object.keys(exportData[0]);
            const metadata = [
                `"Export Date","${new Date().toISOString()}"`,
                `"Total Stores","${response.pagination?.total || exportData.length}"`,
                `"Page","${response.pagination?.page || 1}"`,
                `"Total Cost (ETB)","${response.totalCost || 'N/A'}"`,
                ""
            ];
            const rows = exportData.map(row => {
                return headers.map(header => {
                    const value = row[header] ?? '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
            });
            const csvContent = [
                ...metadata,
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
            downloadCSV(csvContent, 'cost_by_store_export');
            showToastMessage(`Exported ${exportData.length} stores!`, 'success');
        }
        else {
            showToastMessage(response.error || 'No data to export', 'warning');
        }
    }
    catch (error) {
        console.error('Error exporting cost by store:', error);
        showToastMessage('Export failed', 'error');
    }
    finally {
        exportingStore.value = false;
    }
};
// ================================================================
// 📤 EXPORT: Top Cost Items (using new endpoint with pagination)
// ================================================================
const handleExportTopCostItems = async () => {
    exportingTop.value = true;
    try {
        const response = await costDashboardService.exportTopCostItems(1, 10);
        if (response.success && response.data && response.data.length > 0) {
            const exportData = response.data;
            const headers = Object.keys(exportData[0]);
            const metadata = [
                `"Export Date","${new Date().toISOString()}"`,
                `"Total Items","${response.pagination?.total || exportData.length}"`,
                `"Total Inventory Cost (ETB)","${response.totalInventoryCost || 'N/A'}"`,
                ""
            ];
            const rows = exportData.map(row => {
                return headers.map(header => {
                    const value = row[header] ?? '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
            });
            const csvContent = [
                ...metadata,
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
            downloadCSV(csvContent, 'top_cost_items_export');
            showToastMessage(`Exported ${exportData.length} items!`, 'success');
        }
        else {
            showToastMessage(response.error || 'No data to export', 'warning');
        }
    }
    catch (error) {
        console.error('Error exporting top cost items:', error);
        showToastMessage('Export failed', 'error');
    }
    finally {
        exportingTop.value = false;
    }
};
// ================================================================
// 📤 EXPORT: Zero Cost Items (using new endpoint with pagination)
// ================================================================
const handleExportZeroCostItems = async () => {
    exportingZero.value = true;
    try {
        const response = await costDashboardService.exportZeroCostItems(zeroCostPagination.value.page, zeroCostPagination.value.limit);
        if (response.success && response.data && response.data.length > 0) {
            const exportData = response.data;
            const headers = Object.keys(exportData[0]);
            const metadata = [
                `"Export Date","${new Date().toISOString()}"`,
                `"Page","${response.pagination?.page || zeroCostPagination.value.page}"`,
                `"Items Per Page","${response.pagination?.limit || zeroCostPagination.value.limit}"`,
                `"Total Items","${response.pagination?.total || zeroCostPagination.value.total}"`,
                `"Total Pages","${response.pagination?.totalPages || zeroCostPagination.value.totalPages}"`,
                ""
            ];
            const rows = exportData.map(row => {
                return headers.map(header => {
                    const value = row[header] ?? '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
            });
            const csvContent = [
                ...metadata,
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
            downloadCSV(csvContent, `zero_cost_items_page_${zeroCostPagination.value.page}`);
            showToastMessage(`Exported ${exportData.length} zero-cost items from page ${zeroCostPagination.value.page}!`, 'success');
        }
        else {
            showToastMessage(response.error || 'No data to export', 'warning');
        }
    }
    catch (error) {
        console.error('Error exporting zero cost items:', error);
        showToastMessage('Export failed', 'error');
    }
    finally {
        exportingZero.value = false;
    }
};
// ================================================================
// 🔥 Helper: Download CSV
// ================================================================
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
// ================================================================
// LOAD DATA
// ================================================================
const loadDashboardData = async () => {
    loading.value = true;
    try {
        const user = authStore.user;
        if (user) {
            costDashboardService.setUserContext(user.storeId || null, user.groupId || null);
        }
        const response = await costDashboardService.getDashboardData();
        if (response.success && response.data) {
            summary.value = {
                ...response.data.summary,
                itemsWithCost: response.data.summary.itemsWithCost || 0
            };
            costByStore.value = [...response.data.costByStore]
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((store, index) => ({
                ...store,
                color: store.color || getStoreColor(store.id)
            }));
            topCostItems.value = response.data.topCostItems || [];
            zeroCostItems.value = response.data.zeroCostItems || [];
            zeroCostPagination.value = response.data.zeroCostPagination || {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            };
            console.log('✅ Cost dashboard data loaded successfully');
        }
        else {
            showToastMessage(response.error || 'Failed to load dashboard data', 'error');
        }
    }
    catch (error) {
        console.error('Error loading dashboard:', error);
        showToastMessage('Failed to load dashboard data', 'error');
    }
    finally {
        loading.value = false;
    }
};
const refreshData = async () => {
    showToastMessage('Refreshing dashboard...', 'info');
    await loadDashboardData();
    showToastMessage('Dashboard refreshed!', 'success');
};
// ================================================================
// ZERO COST PAGINATION
// ================================================================
const changeZeroCostPage = async (page) => {
    if (page >= 1 && page <= zeroCostPagination.value.totalPages) {
        zeroCostPagination.value.page = page;
        await loadZeroCostItems();
    }
};
const changeZeroCostPageSize = async () => {
    zeroCostPagination.value.page = 1;
    await loadZeroCostItems();
};
const loadZeroCostItems = async () => {
    try {
        const response = await costDashboardService.getZeroCostItems(zeroCostPagination.value.page, zeroCostPagination.value.limit);
        if (response.success) {
            zeroCostItems.value = response.data;
            zeroCostPagination.value = response.pagination;
        }
    }
    catch (error) {
        console.error('Error loading zero cost items:', error);
        showToastMessage('Failed to load zero cost items', 'error');
    }
};
// ================================================================
// TOAST
// ================================================================
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
    loadDashboardData();
});
watch(() => authStore.user, () => {
    loadDashboardData();
}, { deep: true });
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-info']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-info']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['store-total-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['zero']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['item-info']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-value']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-value']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-percent']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['rank-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-value']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title-left']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-rank']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar-percent']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['rank-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-code']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['item-standard']} */ ;
/** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
/** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-value']} */ ;
/** @type {__VLS_StyleScopedClasses['percent-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['page-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "cost-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['cost-dashboard']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "2",
    y: "7",
    width: "20",
    height: "10",
    rx: "1",
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
    ...{ onClick: (__VLS_ctx.goToRules) },
    ...{ class: "btn-info" },
    title: "How costs are calculated",
});
/** @type {__VLS_StyleScopedClasses['btn-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
    width: "18",
    height: "18",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "12",
    r: "10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 16v-4M12 8h.01",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
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
                __VLS_ctx.navigateTo('item-cost');
                // @ts-ignore
                [currentDate, goToRules, refreshData, loading, loading, loading, loading, navigateTo,];
            } },
        ...{ class: "stat-card" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.summary.totalItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.scrollToZeroCost) },
        ...{ class: "stat-card danger" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.summary.zeroCostItems));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card info" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.summary.totalCost));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.summary.itemsWithCost || 0));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card warning" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.summary.excludedByConflict));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card danger" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-content" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.summary.excludedByData));
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title-left" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title-right" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "store-total-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['store-total-badge']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.storeTotal));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "store-count" },
    });
    /** @type {__VLS_StyleScopedClasses['store-count']} */ ;
    (__VLS_ctx.costByStore.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-card full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-header" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chart-header-title" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-header-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleExportCostByStore) },
        ...{ class: "btn-export-icon" },
        disabled: (__VLS_ctx.exportingStore),
        title: "Export Store Cost Data",
    });
    /** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
    if (!__VLS_ctx.exportingStore) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
            width: "16",
            height: "16",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "7 10 12 15 17 10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "15",
            x2: "12",
            y2: "3",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-body" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
    if (__VLS_ctx.costByStore.length === 0) {
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
        for (const [store, index] of __VLS_vFor((__VLS_ctx.costByStore))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (store.id),
                ...{ class: "chart-bar-row" },
                ...{ style: ({ animationDelay: (index * 0.05) + 's' }) },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-info" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-rank" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-rank']} */ ;
            (index + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-name" },
                title: (store.name),
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-name']} */ ;
            (store.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-sub" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-sub']} */ ;
            (__VLS_ctx.formatNumber(store.itemCount));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-track" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-track']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chart-bar-fill store-fill" },
                ...{ style: ({
                        width: __VLS_ctx.getBarWidth(store.totalCost, __VLS_ctx.maxStoreCost) + '%',
                        background: store.color || __VLS_ctx.getStoreColor(store.id)
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-fill']} */ ;
            /** @type {__VLS_StyleScopedClasses['store-fill']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-value" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-value']} */ ;
            (__VLS_ctx.formatCurrency(store.totalCost));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-bar-percent" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-bar-percent']} */ ;
            (store.percent.toFixed(3));
            // @ts-ignore
            [formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, summary, summary, summary, summary, summary, summary, scrollToZeroCost, formatCurrency, formatCurrency, formatCurrency, storeTotal, costByStore, costByStore, costByStore, handleExportCostByStore, exportingStore, exportingStore, getBarWidth, maxStoreCost, getStoreColor,];
        }
    }
    if (__VLS_ctx.costByStore.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-footer" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-footer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "chart-total" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-total']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.storeTotal));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "chart-stores" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-stores']} */ ;
        (__VLS_ctx.costByStore.length);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title-left" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title-left']} */ ;
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
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header-left" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "header-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['header-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header-right" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleExportTopCostItems) },
        ...{ class: "btn-export-icon" },
        disabled: (__VLS_ctx.exportingTop),
        title: "Export Top Cost Items",
    });
    /** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
    if (!__VLS_ctx.exportingTop) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
            width: "16",
            height: "16",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "7 10 12 15 17 10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "15",
            x2: "12",
            y2: "3",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "mini-table top-items-table" },
    });
    /** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-items-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.topCostItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "5",
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.topCostItems))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "rank-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['rank-cell']} */ ;
        (index + 1);
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
        (item.itemStandardName || '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "total-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
        (__VLS_ctx.formatCurrency(item.totalCost));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "percent-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['percent-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "percent-value" },
        });
        /** @type {__VLS_StyleScopedClasses['percent-value']} */ ;
        (item.percent.toFixed(3));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "percent-bar-track" },
        });
        /** @type {__VLS_StyleScopedClasses['percent-bar-track']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "percent-bar-fill" },
            ...{ style: ({ width: Math.min(item.percent, 100) + '%', background: __VLS_ctx.getPercentColor(item.percent) }) },
        });
        /** @type {__VLS_StyleScopedClasses['percent-bar-fill']} */ ;
        // @ts-ignore
        [formatCurrency, formatCurrency, storeTotal, costByStore, costByStore, handleExportTopCostItems, exportingTop, exportingTop, topCostItems, topCostItems, getPercentColor,];
    }
    if (__VLS_ctx.topCostItems.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-footer" },
        });
        /** @type {__VLS_StyleScopedClasses['table-footer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "footer-total" },
        });
        /** @type {__VLS_StyleScopedClasses['footer-total']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.topItemsTotal));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "footer-count" },
        });
        /** @type {__VLS_StyleScopedClasses['footer-count']} */ ;
        (__VLS_ctx.topCostItems.length);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-title" },
        id: "zero-cost-section",
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
    (__VLS_ctx.zeroCostPagination.total);
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header-left" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "header-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['header-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header-right" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge warning" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    (__VLS_ctx.zeroCostPagination.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleExportZeroCostItems) },
        ...{ class: "btn-export-icon zero" },
        disabled: (__VLS_ctx.exportingZero),
        title: "Export Zero Cost Items",
    });
    /** @type {__VLS_StyleScopedClasses['btn-export-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['zero']} */ ;
    if (!__VLS_ctx.exportingZero) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
            width: "16",
            height: "16",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "7 10 12 15 17 10",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "15",
            x2: "12",
            y2: "3",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    }
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    if (__VLS_ctx.zeroCostItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "9",
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.zeroCostItems))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        ((__VLS_ctx.zeroCostPagination.page - 1) * __VLS_ctx.zeroCostPagination.limit + index + 1);
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
        (item.itemStandardName || '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (item.categoryName || 'Uncategorized');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (item.baseUOM || 'PCS');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "balance-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['balance-cell']} */ ;
        (__VLS_ctx.formatNumber(item.balance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge status-zero-cost" },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-zero-cost']} */ ;
        // @ts-ignore
        [formatNumber, formatCurrency, topCostItems, topCostItems, topItemsTotal, zeroCostPagination, zeroCostPagination, zeroCostPagination, zeroCostPagination, handleExportZeroCostItems, exportingZero, exportingZero, zeroCostItems, zeroCostItems,];
    }
    if (__VLS_ctx.zeroCostPagination.total > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.zeroCostPagination.total > 0))
                        return;
                    __VLS_ctx.changeZeroCostPage(__VLS_ctx.zeroCostPagination.page - 1);
                    // @ts-ignore
                    [zeroCostPagination, zeroCostPagination, changeZeroCostPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.zeroCostPagination.page === 1),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.zeroCostPagination.page);
        (__VLS_ctx.zeroCostPagination.totalPages);
        (__VLS_ctx.zeroCostPagination.total);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.zeroCostPagination.total > 0))
                        return;
                    __VLS_ctx.changeZeroCostPage(__VLS_ctx.zeroCostPagination.page + 1);
                    // @ts-ignore
                    [zeroCostPagination, zeroCostPagination, zeroCostPagination, zeroCostPagination, zeroCostPagination, changeZeroCostPage,];
                } },
            ...{ class: "page-btn" },
            disabled: (__VLS_ctx.zeroCostPagination.page === __VLS_ctx.zeroCostPagination.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.changeZeroCostPageSize) },
            value: (__VLS_ctx.zeroCostPagination.limit),
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
[zeroCostPagination, zeroCostPagination, zeroCostPagination, changeZeroCostPageSize, showToast, toastType, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
