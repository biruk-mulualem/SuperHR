import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";
const router = useRouter();
const emit = defineEmits(['update-count']);
// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const departmentFilter = ref('all');
const departments = ref([]);
const employees = ref([]);
const pagination = ref({
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    total: 0
});
let searchTimeout = null;
// ========== COMPUTED ==========
const paginatedEmployees = computed(() => {
    return employees.value;
});
const visiblePages = computed(() => {
    const total = pagination.value.totalPages;
    const current = pagination.value.page;
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
const getRowIndex = (idx) => {
    return idx + 1 + (pagination.value.page - 1) * pagination.value.limit;
};
const goToEdit = (id) => {
    router.push(`/employees/${id}/edit`);
};
const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
        pagination.value.page = page;
        loadData();
        const table = document.querySelector('.table-container');
        if (table) {
            table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};
const updatePaginationFromResponse = (paginationData) => {
    if (paginationData) {
        pagination.value = {
            ...pagination.value,
            totalPages: paginationData.totalPages || 1,
            hasNextPage: paginationData.hasNextPage || false,
            hasPrevPage: paginationData.hasPrevPage || false,
            total: paginationData.total || 0
        };
    }
};
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        loadData();
    }, 400);
};
const clearSearch = () => {
    searchQuery.value = '';
    pagination.value.page = 1;
    loadData();
};
const applyFilters = () => {
    pagination.value.page = 1;
    loadData();
};
const loadData = async () => {
    loading.value = true;
    try {
        const response = await employeeService.getDegreeMissing({
            departmentId: departmentFilter.value,
            search: searchQuery.value,
            page: pagination.value.page,
            limit: pagination.value.limit
        });
        if (response.success && response.data) {
            employees.value = response.data.employees || [];
            updatePaginationFromResponse(response.data.pagination);
        }
        emit('update-count', pagination.value.total || 0);
    }
    catch (error) {
        console.error('Error loading degree data:', error);
        employees.value = [];
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
const exportToExcel = async () => {
    loading.value = true;
    try {
        const response = await employeeService.getDegreeMissing({
            departmentId: departmentFilter.value,
            search: searchQuery.value,
            page: 1,
            limit: 9999
        });
        if (response.success && response.data) {
            const allEmployees = response.data.employees || [];
            if (allEmployees.length === 0) {
                alert('No employees to export');
                loading.value = false;
                return;
            }
            let deptName = 'All_Departments';
            if (departmentFilter.value !== 'all') {
                const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
                if (dept)
                    deptName = dept.departmentName.replace(/\s+/g, '_');
            }
            const searchTerm = searchQuery.value ? `_Search_${searchQuery.value.replace(/\s+/g, '_')}` : '';
            let csv = 'Degree - Missing Employees Report\n';
            csv += `Generated: ${new Date().toLocaleString()}\n`;
            csv += `Department: ${departmentFilter.value !== 'all' ? getDepartmentName() : 'All Departments'}\n`;
            csv += `Search: ${searchQuery.value || 'None'}\n`;
            csv += `Total Missing: ${allEmployees.length}\n\n`;
            csv += 'Employee ID,Full Name (Amharic),Full Name (English),Department,Position,Email\n';
            allEmployees.forEach(emp => {
                csv += `"${emp.employeeId || emp.employeeCode || 'N/A'}"`;
                csv += `,"${emp.fullName || 'N/A'}"`;
                csv += `,"${emp.fullNameEnglish || emp.fullName || 'N/A'}"`;
                csv += `,"${emp.department || 'N/A'}"`;
                csv += `,"${emp.position || 'N/A'}"`;
                csv += `,"${emp.email || 'N/A'}"\n`;
            });
            csv += `\nTotal Employees Missing: ${allEmployees.length}`;
            downloadCSV(csv, `Degree_Missing_${deptName}${searchTerm}`);
        }
    }
    catch (error) {
        console.error('Error exporting:', error);
        alert('Failed to export data');
    }
    finally {
        loading.value = false;
    }
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
    return name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
// ========== WATCHERS ==========
watch([() => departmentFilter.value], () => {
    pagination.value.page = 1;
    loadData();
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
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-row']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-component" },
});
/** @type {__VLS_StyleScopedClasses['tab-component']} */ ;
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
    ...{ onInput: (__VLS_ctx.debounceSearch) },
    type: "text",
    value: (__VLS_ctx.searchQuery),
    placeholder: "Search by Amharic name, English name, or Employee ID...",
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
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
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
    (__VLS_ctx.pagination.total);
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp, idx] of __VLS_vFor((__VLS_ctx.paginatedEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (emp.id),
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
            ...{ class: "employee-names" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-names']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-name-english" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name-english']} */ ;
        (emp.fullNameEnglish || emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-id-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-id-badge']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.goToEdit(emp.id);
                    // @ts-ignore
                    [debounceSearch, searchQuery, searchQuery, clearSearch, exportToExcel, loading, loading, pagination, paginatedEmployees, getRowIndex, getAvatarColor, getInitials, goToEdit,];
                } },
            ...{ class: "btn-edit" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-edit']} */ ;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.paginatedEmployees.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        (__VLS_ctx.searchQuery ? 'No employees found matching your search' : '✅ All employees have submitted degrees!');
    }
    if (__VLS_ctx.pagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pagination.totalPages > 1))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
                    // @ts-ignore
                    [searchQuery, pagination, pagination, paginatedEmployees, changePage,];
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
                        if (!(!__VLS_ctx.loading))
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
                    if (!(!__VLS_ctx.loading))
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
    else if (__VLS_ctx.pagination.total > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-info-simple" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info-simple']} */ ;
        (__VLS_ctx.paginatedEmployees.length);
        (__VLS_ctx.pagination.total);
    }
}
// @ts-ignore
[loading, pagination, pagination, pagination, pagination, pagination, pagination, paginatedEmployees,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
});
export default {};
