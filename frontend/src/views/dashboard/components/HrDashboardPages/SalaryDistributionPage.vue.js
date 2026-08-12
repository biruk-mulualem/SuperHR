import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";
const router = useRouter();
// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const departmentFilter = ref('all');
const lastUpdated = ref(new Date().toLocaleString());
// Data
const departments = ref([]);
const avgSalary = ref(0);
const totalSalaryPool = ref(0);
const maxSalary = ref(0);
const minSalary = ref(0);
const highestPaidDept = ref('');
const salaryByDepartment = ref([]);
// Pagination
const deptPagination = reactive({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
});
let searchTimeout = null;
// ========== COMPUTED ==========
const filteredSalaryByDept = computed(() => {
    let list = [...salaryByDepartment.value];
    if (departmentFilter.value !== 'all') {
        const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
        if (dept) {
            list = list.filter(d => d.department_name === dept.departmentName);
        }
    }
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        list = list.filter(dept => dept.department_name.toLowerCase().includes(s));
    }
    return list;
});
const paginatedSalaryByDept = computed(() => {
    const start = (deptPagination.page - 1) * deptPagination.limit;
    const end = start + deptPagination.limit;
    return filteredSalaryByDept.value.slice(start, end);
});
const deptVisiblePages = computed(() => {
    const total = deptPagination.totalPages;
    const current = deptPagination.page;
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
const totalEmployees = computed(() => {
    return salaryByDepartment.value.reduce((sum, dept) => sum + dept.employee_count, 0);
});
// ========== METHODS ==========
const goBack = () => {
    router.push({ name: 'dashboard' });
};
const formatNumber = (num) => {
    if (!num && num !== 0)
        return '0';
    return num.toLocaleString();
};
const getDeptRowIndex = (index) => {
    return index + 1 + (deptPagination.page - 1) * deptPagination.limit;
};
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        deptPagination.page = 1;
        updatePagination();
    }, 300);
};
const clearSearch = () => {
    searchQuery.value = '';
    deptPagination.page = 1;
    updatePagination();
};
const applyFilters = () => {
    deptPagination.page = 1;
    updatePagination();
};
const changeDeptPage = (page) => {
    if (page >= 1 && page <= deptPagination.totalPages) {
        deptPagination.page = page;
        window.scrollTo({ top: 400, behavior: 'smooth' });
    }
};
const updatePagination = () => {
    const deptTotal = filteredSalaryByDept.value.length;
    deptPagination.total = deptTotal;
    deptPagination.totalPages = Math.max(1, Math.ceil(deptTotal / deptPagination.limit));
    deptPagination.hasNextPage = deptPagination.page < deptPagination.totalPages;
    deptPagination.hasPrevPage = deptPagination.page > 1;
    if (deptPagination.page > deptPagination.totalPages) {
        deptPagination.page = deptPagination.totalPages;
    }
};
// ========== EXPORT FUNCTIONS ==========
const exportDepartmentTable = () => {
    let csv = 'Department Salary Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `Total Departments: ${salaryByDepartment.value.length}\n`;
    csv += `Total Employees: ${totalEmployees.value}\n`;
    csv += `Total Salary Pool: ETB ${formatNumber(totalSalaryPool.value)}\n\n`;
    csv += 'Department,Employees,Avg Salary,Min Salary,Max Salary,Total Pool\n';
    salaryByDepartment.value.forEach(dept => {
        const total = dept.avg_salary * dept.employee_count;
        csv += `"${dept.department_name}",${dept.employee_count},${dept.avg_salary},${dept.min_salary},${dept.max_salary},${total}\n`;
    });
    downloadCSV(csv, 'Department_Salary_Report');
};
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
const printPage = () => {
    window.print();
};
const exportCSV = () => {
    exportDepartmentTable();
};
// ========== DATA LOADING ==========
const loadSalaryData = async () => {
    loading.value = true;
    try {
        const result = await employeeService.getSalaryAnalysis();
        if (result.success && result.data) {
            // Overview
            const overview = result.data.overview || {};
            avgSalary.value = overview.avg_salary || 0;
            totalSalaryPool.value = overview.total_salary_pool || 0;
            maxSalary.value = overview.max_salary || 0;
            minSalary.value = overview.min_salary || 0;
            // Department data
            salaryByDepartment.value = result.data.byDepartment || [];
            // Get departments for filter
            const deptResult = await employeeService.getDepartmentDistribution();
            if (deptResult.success && deptResult.data) {
                departments.value = deptResult.data.departments || [];
            }
            // Find highest paid department
            if (salaryByDepartment.value.length > 0) {
                const sorted = [...salaryByDepartment.value].sort((a, b) => b.avg_salary - a.avg_salary);
                highestPaidDept.value = sorted[0]?.department_name || 'N/A';
            }
            lastUpdated.value = new Date().toLocaleString();
            updatePagination();
        }
    }
    catch (error) {
        console.error('Error loading salary data:', error);
    }
    finally {
        loading.value = false;
    }
};
const refreshData = () => {
    loadSalaryData();
};
// ========== WATCHERS ==========
watch(() => deptPagination.page, () => {
    updatePagination();
});
// ========== LIFECYCLE ==========
onMounted(() => {
    loadSalaryData();
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
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-search']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-table-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['page-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
/** @type {__VLS_StyleScopedClasses['export-table-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['salary-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['table-section']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['salary-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "salary-page" },
});
/** @type {__VLS_StyleScopedClasses['salary-page']} */ ;
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
(__VLS_ctx.totalEmployees);
(__VLS_ctx.formatNumber(__VLS_ctx.totalSalaryPool));
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
    ...{ class: "summary-stats" },
});
/** @type {__VLS_StyleScopedClasses['summary-stats']} */ ;
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
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.formatNumber(__VLS_ctx.avgSalary));
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
(__VLS_ctx.formatNumber(__VLS_ctx.totalSalaryPool));
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
(__VLS_ctx.formatNumber(__VLS_ctx.maxSalary));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon orange" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
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
(__VLS_ctx.formatNumber(__VLS_ctx.minSalary));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon pink" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pink']} */ ;
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
(__VLS_ctx.highestPaidDept || 'N/A');
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
    ...{ onChange: (__VLS_ctx.applyFilters) },
    value: (__VLS_ctx.departmentFilter),
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
    [goBack, totalEmployees, formatNumber, formatNumber, formatNumber, formatNumber, formatNumber, totalSalaryPool, totalSalaryPool, loading, loading, printPage, exportCSV, refreshData, avgSalary, maxSalary, minSalary, highestPaidDept, applyFilters, departmentFilter, departments,];
}
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
    placeholder: "Search by department name...",
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
        ...{ class: "table-section" },
    });
    /** @type {__VLS_StyleScopedClasses['table-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['table-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "table-info" },
    });
    /** @type {__VLS_StyleScopedClasses['table-info']} */ ;
    (__VLS_ctx.salaryByDepartment.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportDepartmentTable) },
        ...{ class: "export-table-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['export-table-btn']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [dept, index] of __VLS_vFor((__VLS_ctx.paginatedSalaryByDept))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (dept.department_name),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.getDeptRowIndex(index));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-name" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
        (dept.department_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (dept.employee_count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "salary-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['salary-cell']} */ ;
        (__VLS_ctx.formatNumber(dept.avg_salary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "salary-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['salary-cell']} */ ;
        (__VLS_ctx.formatNumber(dept.min_salary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "salary-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['salary-cell']} */ ;
        (__VLS_ctx.formatNumber(dept.max_salary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "salary-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['salary-cell']} */ ;
        (__VLS_ctx.formatNumber(dept.avg_salary * dept.employee_count));
        // @ts-ignore
        [formatNumber, formatNumber, formatNumber, formatNumber, loading, debounceSearch, searchQuery, searchQuery, clearSearch, salaryByDepartment, exportDepartmentTable, paginatedSalaryByDept, getDeptRowIndex,];
    }
    if (__VLS_ctx.paginatedSalaryByDept.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    if (__VLS_ctx.deptPagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.deptPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeDeptPage(__VLS_ctx.deptPagination.page - 1);
                    // @ts-ignore
                    [paginatedSalaryByDept, deptPagination, deptPagination, changeDeptPage,];
                } },
            disabled: (!__VLS_ctx.deptPagination.hasPrevPage || __VLS_ctx.loading),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-pages" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-pages']} */ ;
        for (const [page] of __VLS_vFor((__VLS_ctx.deptVisiblePages))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.deptPagination.totalPages > 1))
                            return;
                        __VLS_ctx.changeDeptPage(page);
                        // @ts-ignore
                        [loading, deptPagination, changeDeptPage, deptVisiblePages,];
                    } },
                key: (page),
                ...{ class: (['page-btn', { active: page === __VLS_ctx.deptPagination.page }]) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
            (page);
            // @ts-ignore
            [deptPagination,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.deptPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeDeptPage(__VLS_ctx.deptPagination.page + 1);
                    // @ts-ignore
                    [deptPagination, changeDeptPage,];
                } },
            disabled: (!__VLS_ctx.deptPagination.hasNextPage || __VLS_ctx.loading),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.deptPagination.page);
        (__VLS_ctx.deptPagination.totalPages);
        (__VLS_ctx.deptPagination.total);
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
(__VLS_ctx.totalEmployees);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "separator" },
});
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.formatNumber(__VLS_ctx.totalSalaryPool));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "separator" },
});
/** @type {__VLS_StyleScopedClasses['separator']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.salaryByDepartment.length);
// @ts-ignore
[totalEmployees, formatNumber, totalSalaryPool, loading, salaryByDepartment, deptPagination, deptPagination, deptPagination, deptPagination, lastUpdated,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
