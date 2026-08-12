import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import employeeService from "@/stores/employee";
const router = useRouter();
const route = useRoute();
// ========== STATE ==========
const loading = ref(false);
const activeTab = ref('hired');
const departmentId = ref(route.query.departmentId || 'all');
const timeRange = ref(route.query.timeRange || 'all');
const searchQuery = ref('');
const lastUpdated = ref(new Date().toLocaleString());
// Data
const departments = ref([]);
const hiredEmployees = ref([]);
const terminatedEmployees = ref([]);
const hiringChartData = ref([]);
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 });
// Pagination
const pagination = reactive({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
});
let searchTimeout = null;
// ========== COMPUTED ==========
const filteredHired = computed(() => {
    if (!searchQuery.value)
        return hiredEmployees.value;
    const s = searchQuery.value.toLowerCase();
    return hiredEmployees.value.filter(emp => (emp.fullName || '').toLowerCase().includes(s) ||
        (emp.department || '').toLowerCase().includes(s) ||
        (emp.position || '').toLowerCase().includes(s) ||
        (emp.email || '').toLowerCase().includes(s) ||
        (emp.employeeId || '').toLowerCase().includes(s));
});
const filteredTerminated = computed(() => {
    if (!searchQuery.value)
        return terminatedEmployees.value;
    const s = searchQuery.value.toLowerCase();
    return terminatedEmployees.value.filter(emp => (emp.fullName || '').toLowerCase().includes(s) ||
        (emp.department || '').toLowerCase().includes(s) ||
        (emp.position || '').toLowerCase().includes(s) ||
        (emp.email || '').toLowerCase().includes(s) ||
        (emp.employeeId || '').toLowerCase().includes(s));
});
const paginatedHired = computed(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredHired.value.slice(start, end);
});
const paginatedTerminated = computed(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredTerminated.value.slice(start, end);
});
const totalRecords = computed(() => {
    return activeTab.value === 'hired'
        ? hiredEmployees.value.length
        : terminatedEmployees.value.length;
});
const turnoverRate = computed(() => {
    const total = hiringStats.value.totalHired + hiringStats.value.totalTerminated;
    if (total === 0)
        return '0';
    return ((hiringStats.value.totalTerminated / total) * 100).toFixed(1);
});
const visiblePages = computed(() => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages = [];
    const delta = 2;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - current) <= delta) {
            pages.push(i);
        }
        else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    return pages;
});
// ========== METHODS ==========
const goBack = () => {
    router.push({ name: 'dashboard' });
};
const getDepartmentName = (deptId) => {
    const dept = departments.value.find(d => d.departmentId === parseInt(deptId));
    return dept?.departmentName || 'All Departments';
};
const getTimeRangeLabel = (range) => {
    const labels = {
        '1': 'Last 1 Month',
        '3': 'Last 3 Months',
        '6': 'Last 6 Months',
        '12': 'Last 12 Months',
        '24': 'Last 24 Months',
        '36': 'Last 36 Months',
        'all': 'All Time'
    };
    return labels[range] || 'All Time';
};
const formatNumber = (num) => {
    if (!num && num !== 0)
        return '0';
    return num.toLocaleString();
};
const formatMonth = (monthStr) => {
    if (!monthStr)
        return 'N/A';
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(month) - 1] + ' ' + year;
};
const calculateTurnoverRate = (month) => {
    const total = (month.hired || 0) + (month.terminated || 0);
    if (total === 0)
        return '0';
    return ((month.terminated || 0) / total * 100).toFixed(1);
};
const getTurnoverClass = (month) => {
    const rate = parseFloat(calculateTurnoverRate(month));
    if (rate > 50)
        return 'critical';
    if (rate > 30)
        return 'warning';
    return 'normal';
};
const getTrendClass = (month) => {
    if (!month || month.netChange === 0)
        return 'neutral';
    return month.netChange > 0 ? 'positive' : 'negative';
};
const getTrendIcon = (month) => {
    if (!month || month.netChange === 0)
        return '➖';
    return month.netChange > 0 ? '📈' : '📉';
};
const getInitials = (name) => {
    if (!name)
        return '?';
    return name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
const getAvatarColor = (name) => {
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
        '#10b981', '#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef'
    ];
    let hash = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    return colors[Math.abs(hash) % colors.length];
};
const getRowIndex = (index) => {
    return index + 1 + (pagination.page - 1) * pagination.limit;
};
const viewEmployee = (id) => {
    if (id) {
        router.push(`/employees/${id}`);
    }
};
const switchTab = (tab) => {
    activeTab.value = tab;
    pagination.page = 1;
    updatePagination();
};
const changePage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
        pagination.page = page;
    }
};
const updatePagination = () => {
    const total = activeTab.value === 'hired'
        ? filteredHired.value.length
        : filteredTerminated.value.length;
    pagination.total = total;
    pagination.totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    pagination.hasNextPage = pagination.page < pagination.totalPages;
    pagination.hasPrevPage = pagination.page > 1;
    if (pagination.page > pagination.totalPages) {
        pagination.page = pagination.totalPages;
    }
};
const onFilterChange = () => {
    pagination.page = 1;
    loadData();
};
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.page = 1;
        updatePagination();
    }, 300);
};
const clearSearch = () => {
    searchQuery.value = '';
    pagination.page = 1;
    updatePagination();
};
// ========== DATA LOADING ==========
const loadDepartments = async () => {
    try {
        const result = await employeeService.getDepartmentDistribution();
        if (result.success && result.data) {
            departments.value = result.data.departments || [];
        }
    }
    catch (error) {
        console.error('Error loading departments:', error);
    }
};
const loadData = async () => {
    loading.value = true;
    try {
        const params = {
            departmentId: departmentId.value === 'all' ? null : departmentId.value,
            months: timeRange.value === 'all' ? 'all' : timeRange.value,
        };
        const result = await employeeService.getHiringDetails(params);
        if (result.success && result.data) {
            hiredEmployees.value = result.data.hired || [];
            terminatedEmployees.value = result.data.terminated || [];
            hiringChartData.value = result.data.trends || [];
            hiringStats.value = result.data.summary || {
                totalHired: 0,
                totalTerminated: 0,
                netGrowth: 0
            };
            lastUpdated.value = new Date().toLocaleString();
            updatePagination();
        }
    }
    catch (error) {
        console.error('Error loading hiring details:', error);
    }
    finally {
        loading.value = false;
    }
};
const refreshData = () => {
    loadData();
};
// ========== EXPORT FUNCTIONS ==========
const printPage = () => {
    window.print();
};
const exportCSV = () => {
    let csvContent = '';
    let filename = '';
    if (activeTab.value === 'hired') {
        csvContent = 'Employee,Department,Position,Hire Date (EC),Email,Salary (ETB)\n';
        csvContent += hiredEmployees.value.map(emp => `"${emp.fullName || ''}","${emp.department || ''}","${emp.position || ''}","${emp.hireDate || ''}","${emp.email || ''}","${emp.salary || 0}"`).join('\n');
        filename = `hired_employees_${new Date().toISOString().split('T')[0]}.csv`;
    }
    else if (activeTab.value === 'terminated') {
        csvContent = 'Employee,Department,Position,Termination Date (EC),Email,Last Salary (ETB)\n';
        csvContent += terminatedEmployees.value.map(emp => `"${emp.fullName || ''}","${emp.department || ''}","${emp.position || ''}","${emp.terminationDate || ''}","${emp.email || ''}","${emp.salary || 0}"`).join('\n');
        filename = `terminated_employees_${new Date().toISOString().split('T')[0]}.csv`;
    }
    else {
        csvContent = 'Month,Hired,Terminated,Net Change,Turnover Rate (%)\n';
        csvContent += hiringChartData.value.map(month => `"${formatMonth(month.month)}",${month.hired || 0},${month.terminated || 0},${month.netChange || 0},${calculateTurnoverRate(month)}`).join('\n');
        filename = `monthly_comparison_${new Date().toISOString().split('T')[0]}.csv`;
    }
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
// ========== WATCHERS ==========
watch([() => pagination.page, () => activeTab.value], () => {
    updatePagination();
});
watch(() => route.query, (newQuery) => {
    if (newQuery.departmentId && newQuery.departmentId !== departmentId.value) {
        departmentId.value = newQuery.departmentId;
        loadData();
    }
    if (newQuery.timeRange && newQuery.timeRange !== timeRange.value) {
        timeRange.value = newQuery.timeRange;
        loadData();
    }
}, { deep: true });
// ========== LIFECYCLE ==========
onMounted(() => {
    loadDepartments();
    loadData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-search']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-count']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['terminated']} */ ;
/** @type {__VLS_StyleScopedClasses['email-link']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['negative']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['page-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
/** @type {__VLS_StyleScopedClasses['hiring-details-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs-container']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['hiring-details-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-count']} */ ;
/** @type {__VLS_StyleScopedClasses['col-email']} */ ;
/** @type {__VLS_StyleScopedClasses['col-action']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "hiring-details-page" },
});
/** @type {__VLS_StyleScopedClasses['hiring-details-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "back-btn" },
});
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 12H5M12 19l-7-7 7-7",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-title" },
});
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
if (__VLS_ctx.departmentId !== 'all') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.getDepartmentName(__VLS_ctx.departmentId));
}
(__VLS_ctx.getTimeRangeLabel(__VLS_ctx.timeRange));
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "loading-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-badge']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.printPage) },
    ...{ class: "action-btn" },
    title: "Print",
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "6 9 6 2 18 2 18 9",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M18 9H6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "6",
    y: "14",
    width: "12",
    height: "8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "6 18 4 18 4 12 20 12 20 18 18 18",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportCSV) },
    ...{ class: "action-btn" },
    title: "Export CSV",
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
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
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "action-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M23 4v6h-6M1 20v-6h6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filters-bar" },
});
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.departmentId),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (dept.departmentId),
        value: (dept.departmentId),
    });
    (dept.departmentName);
    (dept.count);
    // @ts-ignore
    [goBack, departmentId, departmentId, departmentId, getDepartmentName, getTimeRangeLabel, timeRange, loading, loading, printPage, exportCSV, refreshData, onFilterChange, departments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onFilterChange) },
    value: (__VLS_ctx.timeRange),
    ...{ class: "filter-select" },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "1",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "3",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "12",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "24",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "36",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "all",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group search-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['search-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['search-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "search-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "11",
    cy: "11",
    r: "8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M21 21l-4.35-4.35",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.debounceSearch) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search by name, department, position...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearSearch) },
        ...{ class: "clear-search" },
    });
    /** @type {__VLS_StyleScopedClasses['clear-search']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-summary" },
});
/** @type {__VLS_StyleScopedClasses['stats-summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon blue" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.hiringStats.totalHired || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon red" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.hiringStats.totalTerminated || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon green" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-value" },
    ...{ class: (__VLS_ctx.hiringStats.netGrowth >= 0 ? 'positive' : 'negative') },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.hiringStats.netGrowth >= 0 ? '+' : '');
(__VLS_ctx.hiringStats.netGrowth || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon purple" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.turnoverRate);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs-container" },
});
/** @type {__VLS_StyleScopedClasses['tabs-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs" },
});
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('hired');
            // @ts-ignore
            [timeRange, onFilterChange, debounceSearch, searchQuery, searchQuery, clearSearch, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, turnoverRate, switchTab,];
        } },
    ...{ class: (['tab-btn', { active: __VLS_ctx.activeTab === 'hired' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "tab-icon" },
});
/** @type {__VLS_StyleScopedClasses['tab-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "tab-count" },
});
/** @type {__VLS_StyleScopedClasses['tab-count']} */ ;
(__VLS_ctx.hiredEmployees.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('terminated');
            // @ts-ignore
            [switchTab, activeTab, hiredEmployees,];
        } },
    ...{ class: (['tab-btn', { active: __VLS_ctx.activeTab === 'terminated' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "tab-icon" },
});
/** @type {__VLS_StyleScopedClasses['tab-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "tab-count" },
});
/** @type {__VLS_StyleScopedClasses['tab-count']} */ ;
(__VLS_ctx.terminatedEmployees.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchTab('comparison');
            // @ts-ignore
            [switchTab, activeTab, terminatedEmployees,];
        } },
    ...{ class: (['tab-btn', { active: __VLS_ctx.activeTab === 'comparison' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "tab-icon" },
});
/** @type {__VLS_StyleScopedClasses['tab-icon']} */ ;
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
        ...{ class: "tab-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'hired') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-toolbar" },
    });
    /** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-info" },
    });
    /** @type {__VLS_StyleScopedClasses['table-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.filteredHired.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.hiredEmployees.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['table-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge success" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-number" },
    });
    /** @type {__VLS_StyleScopedClasses['col-number']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-employee" },
    });
    /** @type {__VLS_StyleScopedClasses['col-employee']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-department" },
    });
    /** @type {__VLS_StyleScopedClasses['col-department']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-position" },
    });
    /** @type {__VLS_StyleScopedClasses['col-position']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-date" },
    });
    /** @type {__VLS_StyleScopedClasses['col-date']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-action" },
    });
    /** @type {__VLS_StyleScopedClasses['col-action']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp, index] of __VLS_vFor((__VLS_ctx.paginatedHired))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [loading, activeTab, activeTab, hiredEmployees, filteredHired, paginatedHired, viewEmployee,];
                } },
            key: (emp.id),
            ...{ class: "clickable-row" },
        });
        /** @type {__VLS_StyleScopedClasses['clickable-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.getRowIndex(index));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "avatar" },
            ...{ style: ({ background: __VLS_ctx.getAvatarColor(emp.fullName) }) },
        });
        /** @type {__VLS_StyleScopedClasses['avatar']} */ ;
        (__VLS_ctx.getInitials(emp.fullName));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-id" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-id']} */ ;
        (emp.employeeId || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
        (emp.department || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.position || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
        (emp.hireDate || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-label" },
        });
        /** @type {__VLS_StyleScopedClasses['date-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, getRowIndex, getAvatarColor, getInitials,];
                } },
            ...{ class: "btn-view" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.paginatedHired.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "8",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-hint']} */ ;
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
                    // @ts-ignore
                    [paginatedHired, pagination, pagination, changePage,];
                } },
            disabled: (!__VLS_ctx.pagination.hasPrevPage || __VLS_ctx.loading),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-pages" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-pages']} */ ;
        for (const [page] of __VLS_vFor((__VLS_ctx.visiblePages))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.pagination.totalPages > 1))
                            return;
                        __VLS_ctx.changePage(page);
                        // @ts-ignore
                        [loading, pagination, changePage, visiblePages,];
                    } },
                key: (page),
                ...{ class: (['page-btn', { active: page === __VLS_ctx.pagination.page }]) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
            (page);
            // @ts-ignore
            [pagination,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
                    // @ts-ignore
                    [pagination, changePage,];
                } },
            disabled: (!__VLS_ctx.pagination.hasNextPage || __VLS_ctx.loading),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.pagination.page);
        (__VLS_ctx.pagination.totalPages);
        (__VLS_ctx.pagination.total);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'terminated') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-toolbar" },
    });
    /** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-info" },
    });
    /** @type {__VLS_StyleScopedClasses['table-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.filteredTerminated.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.terminatedEmployees.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['table-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge danger" },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-number" },
    });
    /** @type {__VLS_StyleScopedClasses['col-number']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-employee" },
    });
    /** @type {__VLS_StyleScopedClasses['col-employee']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-department" },
    });
    /** @type {__VLS_StyleScopedClasses['col-department']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-position" },
    });
    /** @type {__VLS_StyleScopedClasses['col-position']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-date" },
    });
    /** @type {__VLS_StyleScopedClasses['col-date']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-status" },
    });
    /** @type {__VLS_StyleScopedClasses['col-status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "col-action" },
    });
    /** @type {__VLS_StyleScopedClasses['col-action']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp, index] of __VLS_vFor((__VLS_ctx.paginatedTerminated))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [loading, activeTab, terminatedEmployees, viewEmployee, pagination, pagination, pagination, pagination, filteredTerminated, paginatedTerminated,];
                } },
            key: (emp.id),
            ...{ class: "clickable-row" },
        });
        /** @type {__VLS_StyleScopedClasses['clickable-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.getRowIndex(index));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "avatar" },
            ...{ style: ({ background: __VLS_ctx.getAvatarColor(emp.fullName) }) },
        });
        /** @type {__VLS_StyleScopedClasses['avatar']} */ ;
        (__VLS_ctx.getInitials(emp.fullName));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-id" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-id']} */ ;
        (emp.employeeId || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
        (emp.department || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.position || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-badge terminated" },
        });
        /** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
        /** @type {__VLS_StyleScopedClasses['terminated']} */ ;
        (emp.terminationDate || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "date-label" },
        });
        /** @type {__VLS_StyleScopedClasses['date-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-badge terminated" },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
        /** @type {__VLS_StyleScopedClasses['terminated']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, getRowIndex, getAvatarColor, getInitials,];
                } },
            ...{ class: "btn-view" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-view']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.paginatedTerminated.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "9",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-hint']} */ ;
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
                    // @ts-ignore
                    [pagination, pagination, changePage, paginatedTerminated,];
                } },
            disabled: (!__VLS_ctx.pagination.hasPrevPage || __VLS_ctx.loading),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-pages" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-pages']} */ ;
        for (const [page] of __VLS_vFor((__VLS_ctx.visiblePages))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.pagination.totalPages > 1))
                            return;
                        __VLS_ctx.changePage(page);
                        // @ts-ignore
                        [loading, pagination, changePage, visiblePages,];
                    } },
                key: (page),
                ...{ class: (['page-btn', { active: page === __VLS_ctx.pagination.page }]) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
            (page);
            // @ts-ignore
            [pagination,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
                    // @ts-ignore
                    [pagination, changePage,];
                } },
            disabled: (!__VLS_ctx.pagination.hasNextPage || __VLS_ctx.loading),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.pagination.page);
        (__VLS_ctx.pagination.totalPages);
        (__VLS_ctx.pagination.total);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'comparison') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comparison-container" },
    });
    /** @type {__VLS_StyleScopedClasses['comparison-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-info" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value positive" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    (__VLS_ctx.hiringStats.totalHired || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-info" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value negative" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['negative']} */ ;
    (__VLS_ctx.hiringStats.totalTerminated || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-info" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value" },
        ...{ class: (__VLS_ctx.hiringStats.netGrowth >= 0 ? 'positive' : 'negative') },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.hiringStats.netGrowth >= 0 ? '+' : '');
    (__VLS_ctx.hiringStats.netGrowth || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-info" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.turnoverRate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "monthly-section" },
    });
    /** @type {__VLS_StyleScopedClasses['monthly-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "total-months" },
    });
    /** @type {__VLS_StyleScopedClasses['total-months']} */ ;
    (__VLS_ctx.hiringChartData.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [month] of __VLS_vFor((__VLS_ctx.hiringChartData))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (month.month),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatMonth(month.month));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center hired-count" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['hired-count']} */ ;
        (month.hired || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center terminated-count" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['terminated-count']} */ ;
        (month.terminated || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
            ...{ class: (month.netChange >= 0 ? 'positive' : 'negative') },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (month.netChange >= 0 ? '+' : '');
        (month.netChange || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "turnover-badge" },
            ...{ class: (__VLS_ctx.getTurnoverClass(month)) },
        });
        /** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
        (__VLS_ctx.calculateTurnoverRate(month));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "trend-indicator" },
            ...{ class: (__VLS_ctx.getTrendClass(month)) },
        });
        /** @type {__VLS_StyleScopedClasses['trend-indicator']} */ ;
        (__VLS_ctx.getTrendIcon(month));
        // @ts-ignore
        [loading, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, turnoverRate, activeTab, pagination, pagination, pagination, pagination, hiringChartData, hiringChartData, formatMonth, getTurnoverClass, calculateTurnoverRate, getTrendClass, getTrendIcon,];
    }
    if (__VLS_ctx.hiringChartData.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "6",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-footer" },
});
/** @type {__VLS_StyleScopedClasses['page-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "footer-info" },
});
/** @type {__VLS_StyleScopedClasses['footer-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.lastUpdated);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "separator" },
});
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.totalRecords);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "separator" },
});
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
if (__VLS_ctx.departmentId !== 'all') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.getDepartmentName(__VLS_ctx.departmentId));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "separator" },
});
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.getTimeRangeLabel(__VLS_ctx.timeRange));
// @ts-ignore
[departmentId, departmentId, getDepartmentName, getTimeRangeLabel, timeRange, hiringChartData, lastUpdated, totalRecords,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
