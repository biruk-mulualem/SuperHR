import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";
const router = useRouter();
const emit = defineEmits(['update-count']);
// ========== STATE ==========
const loading = ref(false);
const filter = ref('missing');
const searchQuery = ref('');
const departmentFilter = ref('all');
const departments = ref([]);
const allData = ref([]);
const missingData = ref([]);
const needSecondData = ref([]);
const withTwoData = ref([]);
const pagination = ref({
    page: 1,
    limit: 20,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    totalItems: 0
});
let searchTimeout = null;
let isApplyingFilter = false;
// ========== COMPUTED ==========
const getFilteredData = computed(() => {
    let source = [];
    switch (filter.value) {
        case 'missing':
            source = missingData.value;
            break;
        case 'one':
            source = needSecondData.value;
            break;
        case 'two':
            source = withTwoData.value;
            break;
        default:
            source = allData.value;
    }
    // Client-side filtering for search when data is already loaded
    if (!searchQuery.value || searchQuery.value.trim() === '') {
        return source;
    }
    const s = searchQuery.value.toLowerCase().trim();
    return source.filter(emp => {
        const fullName = (emp.fullName || emp.fullNameEnglish || '').toLowerCase();
        const employeeCode = (emp.employeeCode || emp.employeeId || '').toLowerCase();
        const department = (emp.department || '').toLowerCase();
        const position = (emp.position || '').toLowerCase();
        const email = (emp.email || '').toLowerCase();
        return fullName.includes(s) ||
            employeeCode.includes(s) ||
            department.includes(s) ||
            position.includes(s) ||
            email.includes(s);
    });
});
const paginatedData = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.limit;
    const end = start + pagination.value.limit;
    return getFilteredData.value.slice(start, end);
});
const getPageNumbers = computed(() => {
    const total = pagination.value.totalPages;
    const current = pagination.value.page;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
        }
    }
    range.forEach((i) => {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            }
            else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    });
    return rangeWithDots;
});
// ========== METHODS ==========
const getRowIndex = (idx) => {
    return idx + 1 + (pagination.value.page - 1) * pagination.value.limit;
};
const goToEdit = (id) => {
    router.push(`/employees/${id}/edit`);
};
const changeFilter = (newFilter) => {
    if (isApplyingFilter)
        return;
    filter.value = newFilter;
    pagination.value.page = 1;
    // Reload data with new filter
    loadData();
};
const goToPreviousPage = () => {
    if (pagination.value.hasPrevPage) {
        const newPage = pagination.value.page - 1;
        goToPage(newPage);
    }
};
const goToNextPage = () => {
    if (pagination.value.hasNextPage) {
        const newPage = pagination.value.page + 1;
        goToPage(newPage);
    }
};
const goToPage = (page) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
        pagination.value.page = page;
        // Load data for new page
        loadData();
        // Scroll to top of table
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};
const updatePagination = () => {
    const total = getFilteredData.value.length;
    const limit = pagination.value.limit || 20;
    pagination.value.totalItems = total;
    pagination.value.totalPages = Math.max(1, Math.ceil(total / limit));
    pagination.value.hasNextPage = pagination.value.page < pagination.value.totalPages;
    pagination.value.hasPrevPage = pagination.value.page > 1;
    // Ensure current page is valid
    if (pagination.value.page > pagination.value.totalPages) {
        pagination.value.page = pagination.value.totalPages;
    }
};
const handleSearchInput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        // Use client-side filtering or server-side search
        if (searchQuery.value && searchQuery.value.trim().length > 0) {
            // Client-side filtering is handled by computed property
            updatePagination();
        }
        else {
            // Reload data when search is cleared
            loadData();
        }
    }, 300);
};
const clearSearch = () => {
    searchQuery.value = '';
    pagination.value.page = 1;
    loadData();
};
const applyFilters = () => {
    if (isApplyingFilter)
        return;
    isApplyingFilter = true;
    pagination.value.page = 1;
    loadData().finally(() => {
        isApplyingFilter = false;
    });
};
const loadData = async () => {
    loading.value = true;
    try {
        // Use the new API endpoint with pagination parameters
        const response = await employeeService.getGuaranteeStatus({
            departmentId: departmentFilter.value,
            search: searchQuery.value,
            filter: filter.value,
            page: pagination.value.page,
            limit: pagination.value.limit
        });
        if (response.success && response.data) {
            const data = response.data;
            // Map data from backend response
            allData.value = data.all || [];
            missingData.value = data.missing || [];
            needSecondData.value = data.needSecond || [];
            withTwoData.value = data.withTwo || [];
            // Update pagination from backend or client-side
            if (data.pagination) {
                pagination.value = {
                    page: data.pagination.page || 1,
                    limit: data.pagination.limit || 20,
                    totalPages: data.pagination.totalPages || 1,
                    hasPrevPage: data.pagination.hasPrevPage || false,
                    hasNextPage: data.pagination.hasNextPage || false,
                    totalItems: data.pagination.total || 0
                };
            }
            else {
                // Fallback to client-side pagination
                updatePagination();
            }
            // Emit count for parent component
            emit('update-count', missingData.value.length);
        }
    }
    catch (error) {
        console.error('Error loading guarantee data:', error);
    }
    finally {
        loading.value = false;
    }
};
const loadDepartments = async () => {
    try {
        const res = await employeeService.getDepartmentDistribution();
        if (res.success && res.data) {
            departments.value = res.data.departments || [];
        }
    }
    catch (error) {
        console.error('Error loading departments:', error);
    }
};
// ========== EXPORT TO EXCEL ==========
const exportToExcel = () => {
    if (getFilteredData.value.length === 0) {
        alert('No employees to export');
        return;
    }
    let deptName = 'All_Departments';
    if (departmentFilter.value !== 'all') {
        const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
        if (dept)
            deptName = dept.departmentName.replace(/\s+/g, '_');
    }
    let filterLabel = '';
    switch (filter.value) {
        case 'missing':
            filterLabel = 'No_Guarantee';
            break;
        case 'one':
            filterLabel = 'Only_1';
            break;
        case 'two':
            filterLabel = 'Has_2';
            break;
        default: filterLabel = 'All';
    }
    let csv = `Guarantee Letter - ${filterLabel.replace(/_/g, ' ')} Report\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `Department: ${departmentFilter.value !== 'all' ? getDepartmentName() : 'All Departments'}\n`;
    csv += `Total Employees: ${getFilteredData.value.length}\n\n`;
    csv += 'Employee Code,Full Name,Email,Department,Position,Guarantee Count\n';
    getFilteredData.value.forEach(emp => {
        csv += `"${emp.employeeCode || emp.employeeId || 'N/A'}"`;
        csv += `,"${emp.fullName || emp.fullNameEnglish || 'N/A'}"`;
        csv += `,"${emp.email || 'N/A'}"`;
        csv += `,"${emp.department || 'N/A'}"`;
        csv += `,"${emp.position || 'N/A'}"`;
        csv += `,${emp.guaranteeCount || 0}\n`;
    });
    csv += `\nTotal Employees: ${getFilteredData.value.length}`;
    downloadCSV(csv, `Guarantee_${filterLabel}_${deptName}`);
};
const getDepartmentName = () => {
    if (departmentFilter.value === 'all')
        return 'All Departments';
    const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
    return dept?.departmentName || 'Unknown';
};
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
// ========== HELPER FUNCTIONS ==========
const getInitials = (name) => {
    if (!name)
        return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};
const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'];
    let hash = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    return colors[Math.abs(hash) % colors.length];
};
const getGuaranteeCountClass = (count) => {
    if (count === 0)
        return 'count-critical';
    if (count === 1)
        return 'count-warning';
    return 'count-success';
};
// ========== WATCHERS ==========
// Watch for filter changes
watch(filter, () => {
    pagination.value.page = 1;
    if (!isApplyingFilter) {
        loadData();
    }
});
// Watch for department changes
watch(departmentFilter, () => {
    pagination.value.page = 1;
    if (!isApplyingFilter) {
        loadData();
    }
});
// Watch for search query changes (handled by debounce)
watch(searchQuery, (newVal, oldVal) => {
    if (newVal === '' && oldVal !== '') {
        // Search was cleared, reload data
        pagination.value.page = 1;
        loadData();
    }
});
// Watch for pagination page changes to update UI
watch(() => pagination.value.page, () => {
    // Scroll to top when page changes
    const tableWrapper = document.querySelector('.table-wrapper');
    if (tableWrapper) {
        tableWrapper.scrollTop = 0;
    }
});
// ========== LIFECYCLE ==========
onMounted(() => {
    loadDepartments();
    loadData();
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-email']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-numbers']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "guarantee-tab" },
});
/** @type {__VLS_StyleScopedClasses['guarantee-tab']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filters-row" },
});
/** @type {__VLS_StyleScopedClasses['filters-row']} */ ;
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
    [applyFilters, departmentFilter, departments,];
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
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "9",
    cy: "9",
    r: "7",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 19l-4.35-4.35",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.handleSearchInput) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search by name, code, department...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearSearch) },
        ...{ class: "clear-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-controls" },
});
/** @type {__VLS_StyleScopedClasses['filter-controls']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeFilter('missing');
            // @ts-ignore
            [handleSearchInput, searchQuery, searchQuery, clearSearch, changeFilter,];
        } },
    ...{ class: (['filter-btn', { active: __VLS_ctx.filter === 'missing' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "dot red" },
});
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
(__VLS_ctx.missingData.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeFilter('one');
            // @ts-ignore
            [changeFilter, filter, missingData,];
        } },
    ...{ class: (['filter-btn', { active: __VLS_ctx.filter === 'one' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "dot orange" },
});
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
(__VLS_ctx.needSecondData.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeFilter('two');
            // @ts-ignore
            [changeFilter, filter, needSecondData,];
        } },
    ...{ class: (['filter-btn', { active: __VLS_ctx.filter === 'two' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "dot green" },
});
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
(__VLS_ctx.withTwoData.length);
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
if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "table-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
    (__VLS_ctx.getFilteredData.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportToExcel) },
        ...{ class: "export-btn" },
        title: "Export to Excel",
    });
    /** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 20 20",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M10 2v12M7 11l3 3 3-3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2",
    });
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
    for (const [emp, idx] of __VLS_vFor((__VLS_ctx.paginatedData))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (emp.id || emp.employeeId),
            ...{ class: "data-row" },
        });
        /** @type {__VLS_StyleScopedClasses['data-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.getRowIndex(idx));
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-info" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (emp.fullName || emp.fullNameEnglish || 'N/A');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-email" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-email']} */ ;
        (emp.email || 'No email');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-code" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
        (emp.employeeCode || emp.employeeId || 'N/A');
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
            ...{ class: (['guarantee-badge', __VLS_ctx.getGuaranteeCountClass(emp.guaranteeCount)]) },
        });
        /** @type {__VLS_StyleScopedClasses['guarantee-badge']} */ ;
        (emp.guaranteeCount || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.goToEdit(emp.id || emp.employeeId);
                    // @ts-ignore
                    [filter, withTwoData, loading, loading, getFilteredData, exportToExcel, paginatedData, getRowIndex, getAvatarColor, getInitials, getGuaranteeCountClass, goToEdit,];
                } },
            ...{ class: "btn-edit" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-edit']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.paginatedData.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToPreviousPage) },
            disabled: (!__VLS_ctx.pagination.hasPrevPage),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.pagination.page);
        (__VLS_ctx.pagination.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-details" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-details']} */ ;
        (__VLS_ctx.getFilteredData.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToNextPage) },
            disabled: (!__VLS_ctx.pagination.hasNextPage),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-numbers" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-numbers']} */ ;
        for (const [page] of __VLS_vFor((__VLS_ctx.getPageNumbers))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.pagination.totalPages > 1))
                            return;
                        __VLS_ctx.goToPage(page);
                        // @ts-ignore
                        [getFilteredData, paginatedData, pagination, pagination, pagination, pagination, pagination, pagination, goToPreviousPage, goToNextPage, getPageNumbers, goToPage,];
                    } },
                key: (page),
                ...{ class: (['page-number', { active: page === __VLS_ctx.pagination.page }]) },
            });
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['page-number']} */ ;
            (page);
            // @ts-ignore
            [pagination,];
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
});
export default {};
