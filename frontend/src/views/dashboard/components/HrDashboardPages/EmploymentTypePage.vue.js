import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";
const router = useRouter();
// State
const loading = ref(false);
const searchQuery = ref('');
const expandedType = ref(null);
const typeEmployeeSearch = ref({});
const typeDeptFilter = ref({});
const typeEmployeeData = ref({});
const typeEmployeeLoading = ref({});
const lastUpdated = ref(new Date().toLocaleString());
const employmentTypes = ref([]);
const departments = ref([]);
let searchTimeout = null;
// Computed
const totalEmployees = computed(() => {
    return employmentTypes.value.reduce((sum, t) => sum + t.count, 0);
});
const mostCommonType = computed(() => {
    if (!employmentTypes.value.length)
        return 'N/A';
    const sorted = [...employmentTypes.value].sort((a, b) => b.count - a.count);
    return getEmploymentTypeLabel(sorted[0]?.type);
});
const diversityIndex = computed(() => {
    if (!employmentTypes.value.length)
        return '0';
    const total = totalEmployees.value;
    if (!total)
        return '0';
    let sum = 0;
    employmentTypes.value.forEach(t => {
        const p = t.count / total;
        sum += p * Math.log(p);
    });
    const shannon = -sum;
    const maxDiversity = Math.log(employmentTypes.value.length);
    return maxDiversity > 0 ? ((shannon / maxDiversity) * 100).toFixed(1) : '0';
});
const filteredTypes = computed(() => {
    let list = [...employmentTypes.value];
    if (searchQuery.value) {
        const s = searchQuery.value.toLowerCase();
        list = list.filter(t => {
            const label = getEmploymentTypeLabel(t.type).toLowerCase();
            return label.includes(s);
        });
    }
    return list;
});
// Methods
const goBack = () => router.push({ name: 'dashboard' });
const getEmploymentTypeLabel = (type) => ({
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'intern': 'Intern'
})[type] || type;
const getTypeColor = (type) => ({
    'full-time': '#10b981',
    'part-time': '#f59e0b',
    'contract': '#8b5cf6',
    'intern': '#ef4444'
})[type] || '#6366f1';
const getTypeIcon = (type) => ({
    'full-time': '💼',
    'part-time': '⏰',
    'contract': '📄',
    'intern': '🎓'
})[type] || '👤';
const getInitials = (name) => {
    if (!name)
        return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
// ========== TYPE EMPLOYEE METHODS ==========
const getTypeEmployees = (type) => {
    return typeEmployeeData.value[type] || [];
};
const getFilteredTypeEmployees = (type) => {
    const employees = getTypeEmployees(type);
    const search = typeEmployeeSearch.value[type] || '';
    if (!search)
        return employees;
    const s = search.toLowerCase();
    return employees.filter(e => e.fullName?.toLowerCase().includes(s) ||
        e.fullNameEnglish?.toLowerCase().includes(s) ||
        e.employeeId?.toLowerCase().includes(s) ||
        e.department?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s));
};
// ✅ Load ALL employees for a type (lazy loading)
const loadTypeEmployees = async (type) => {
    if (typeEmployeeLoading.value[type])
        return;
    typeEmployeeLoading.value[type] = true;
    try {
        const deptFilter = typeDeptFilter.value[type] || 'all';
        const search = typeEmployeeSearch.value[type] || '';
        console.log(`📊 Loading employees for type: ${type}, Dept: ${deptFilter}, Search: "${search}"`);
        const response = await employeeService.getTypeEmployees({
            type: type,
            search: search,
            departmentId: deptFilter
        });
        if (response.success && response.data) {
            const data = response.data;
            typeEmployeeData.value[type] = data.employees || [];
            console.log(`✅ Loaded ${data.employees?.length || 0} employees for ${type}`);
        }
    }
    catch (error) {
        console.error('Error loading type employees:', error);
    }
    finally {
        typeEmployeeLoading.value[type] = false;
    }
};
const toggleType = async (type) => {
    // If clicking the same type, collapse it
    if (expandedType.value === type) {
        expandedType.value = null;
        return;
    }
    // Expand the type
    expandedType.value = type;
    // ✅ Load employees ONLY for this type (lazy loading)
    if (!typeEmployeeData.value[type] || typeEmployeeData.value[type].length === 0) {
        await loadTypeEmployees(type);
    }
};
const applyTypeFilter = (type) => {
    // Reload employees with new department filter
    loadTypeEmployees(type);
};
const searchTypeEmployees = (type) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadTypeEmployees(type);
    }, 300);
};
const viewEmployee = (id) => {
    if (id)
        router.push(`/employees/${id}`);
};
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { }, 300);
};
const clearSearch = () => {
    searchQuery.value = '';
};
// ========== EXPORT FUNCTIONS ==========
const exportType = (type) => {
    if (!type)
        return;
    const employees = getTypeEmployees(type.type);
    const typeLabel = getEmploymentTypeLabel(type.type);
    if (employees.length === 0) {
        alert(`No employees found in ${typeLabel}`);
        return;
    }
    let csv = `Employment Type: ${typeLabel}\n`;
    csv += `Total Employees: ${employees.length}\n`;
    csv += `Percentage: ${type.percentage}%\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Employee ID,Full Name,English Name,Department,Email,Position\n';
    employees.forEach(emp => {
        csv += `"${emp.employeeId || emp.id || 'N/A'}"`;
        csv += `,"${emp.fullName || 'N/A'}"`;
        csv += `,"${emp.fullNameEnglish || ''}"`;
        csv += `,"${emp.department || 'N/A'}"`;
        csv += `,"${emp.email || 'N/A'}"`;
        csv += `,"${emp.position || 'N/A'}"\n`;
    });
    csv += `\nTotal Employees Exported: ${employees.length}`;
    downloadCSV(csv, `${typeLabel}_Employees_All`);
};
const downloadCSV = (content, name) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
// ========== DATA LOADING ==========
const loadEmploymentTypes = async () => {
    loading.value = true;
    try {
        const result = await employeeService.getEmploymentTypeDistribution();
        if (result.success && result.data) {
            employmentTypes.value = result.data.types || [];
            const deptResult = await employeeService.getDepartmentDistribution();
            if (deptResult.success && deptResult.data) {
                departments.value = deptResult.data.departments || [];
            }
            lastUpdated.value = new Date().toLocaleString();
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        loading.value = false;
    }
};
const refreshData = () => {
    // Clear cached employee data
    typeEmployeeData.value = {};
    typeEmployeeLoading.value = {};
    typeEmployeeSearch.value = {};
    typeDeptFilter.value = {};
    expandedType.value = null;
    loadEmploymentTypes();
};
onMounted(loadEmploymentTypes);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['global-search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['global-search-clear']} */ ;
/** @type {__VLS_StyleScopedClasses['type-card']} */ ;
/** @type {__VLS_StyleScopedClasses['type-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['type-export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['type-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['type-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['type-dept-select']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-input']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-view']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['type-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['type-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['type-dept-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['type-dept-select']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type-name']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-id']} */ ;
/** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "employment-page" },
});
/** @type {__VLS_StyleScopedClasses['employment-page']} */ ;
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
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M15 10H5M10 15l-5-5 5-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
(__VLS_ctx.totalEmployees);
(__VLS_ctx.employmentTypes.length);
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
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "action-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 4v6h-6M1 16v-6h6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M3.51 9a9 9 0 0 1 14.85-3.36L19 10M1 14l4.64 4.36A9 9 0 0 0 18.49 15",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-cards" },
});
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-icon blue" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-value']} */ ;
(__VLS_ctx.totalEmployees);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-icon purple" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-value']} */ ;
(__VLS_ctx.employmentTypes.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-icon green" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-value']} */ ;
(__VLS_ctx.mostCommonType);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-icon orange" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card-content" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-value']} */ ;
(__VLS_ctx.diversityIndex);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-card-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "global-search" },
});
/** @type {__VLS_StyleScopedClasses['global-search']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "global-search-icon" },
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['global-search-icon']} */ ;
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
    placeholder: "Search by type name or employee...",
    ...{ class: "global-search-input" },
});
/** @type {__VLS_StyleScopedClasses['global-search-input']} */ ;
if (__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearSearch) },
        ...{ class: "global-search-clear" },
    });
    /** @type {__VLS_StyleScopedClasses['global-search-clear']} */ ;
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
        ...{ class: "type-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['type-grid']} */ ;
    for (const [type] of __VLS_vFor((__VLS_ctx.filteredTypes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (type.type),
            ...{ class: "type-card" },
        });
        /** @type {__VLS_StyleScopedClasses['type-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.toggleType(type.type);
                    // @ts-ignore
                    [goBack, totalEmployees, totalEmployees, employmentTypes, employmentTypes, loading, loading, loading, refreshData, mostCommonType, diversityIndex, debounceSearch, searchQuery, searchQuery, clearSearch, filteredTypes, toggleType,];
                } },
            ...{ class: "type-card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['type-card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-badge" },
            ...{ style: ({ background: __VLS_ctx.getTypeColor(type.type) }) },
        });
        /** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
        (__VLS_ctx.getTypeIcon(type.type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-info" },
        });
        /** @type {__VLS_StyleScopedClasses['type-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-name" },
        });
        /** @type {__VLS_StyleScopedClasses['type-name']} */ ;
        (__VLS_ctx.getEmploymentTypeLabel(type.type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['type-stats']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (type.count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "type-dot" },
        });
        /** @type {__VLS_StyleScopedClasses['type-dot']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "type-percent" },
        });
        /** @type {__VLS_StyleScopedClasses['type-percent']} */ ;
        (type.percentage);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['type-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.exportType(type);
                    // @ts-ignore
                    [getTypeColor, getTypeIcon, getEmploymentTypeLabel, exportType,];
                } },
            ...{ class: "type-export-btn" },
            title: "Export to Excel",
        });
        /** @type {__VLS_StyleScopedClasses['type-export-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "type-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['type-toggle']} */ ;
        (__VLS_ctx.expandedType === type.type ? '−' : '+');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-progress" },
        });
        /** @type {__VLS_StyleScopedClasses['type-progress']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-progress-bar" },
            ...{ style: ({
                    width: type.percentage + '%',
                    background: __VLS_ctx.getTypeColor(type.type)
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['type-progress-bar']} */ ;
        if (__VLS_ctx.expandedType === type.type) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "type-expand" },
            });
            /** @type {__VLS_StyleScopedClasses['type-expand']} */ ;
            if (__VLS_ctx.typeEmployeeLoading[type.type]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "type-loading" },
                });
                /** @type {__VLS_StyleScopedClasses['type-loading']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "spinner-small" },
                });
                /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "type-dept-filter" },
                });
                /** @type {__VLS_StyleScopedClasses['type-dept-filter']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "type-dept-icon" },
                    viewBox: "0 0 20 20",
                    fill: "none",
                    stroke: "currentColor",
                    'stroke-width': "2",
                });
                /** @type {__VLS_StyleScopedClasses['type-dept-icon']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
                    x: "1",
                    y: "5",
                    width: "18",
                    height: "14",
                    rx: "2",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                    d: "M12 3v2M8 3v2M1 9h18",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                    ...{ onChange: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.expandedType === type.type))
                                return;
                            if (!!(__VLS_ctx.typeEmployeeLoading[type.type]))
                                return;
                            __VLS_ctx.applyTypeFilter(type.type);
                            // @ts-ignore
                            [getTypeColor, expandedType, expandedType, typeEmployeeLoading, applyTypeFilter,];
                        } },
                    value: (__VLS_ctx.typeDeptFilter[type.type]),
                    ...{ class: "type-dept-select" },
                });
                /** @type {__VLS_StyleScopedClasses['type-dept-select']} */ ;
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
                    [typeDeptFilter, departments,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "type-dept-count" },
                });
                /** @type {__VLS_StyleScopedClasses['type-dept-count']} */ ;
                (__VLS_ctx.getTypeEmployees(type.type).length);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "type-employees" },
                });
                /** @type {__VLS_StyleScopedClasses['type-employees']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "type-employee-search" },
                });
                /** @type {__VLS_StyleScopedClasses['type-employee-search']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.expandedType === type.type))
                                return;
                            if (!!(__VLS_ctx.typeEmployeeLoading[type.type]))
                                return;
                            __VLS_ctx.searchTypeEmployees(type.type);
                            // @ts-ignore
                            [getTypeEmployees, searchTypeEmployees,];
                        } },
                    ...{ onClick: () => { } },
                    type: "text",
                    value: (__VLS_ctx.typeEmployeeSearch[type.type]),
                    placeholder: "Filter employees...",
                    ...{ class: "type-employee-input" },
                });
                /** @type {__VLS_StyleScopedClasses['type-employee-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "type-employee-list-scroll" },
                });
                /** @type {__VLS_StyleScopedClasses['type-employee-list-scroll']} */ ;
                for (const [emp] of __VLS_vFor((__VLS_ctx.getFilteredTypeEmployees(type.type)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (emp.id),
                        ...{ class: "type-employee" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "type-employee-avatar" },
                        ...{ style: ({ background: __VLS_ctx.getAvatarColor(emp.fullName) }) },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-avatar']} */ ;
                    (__VLS_ctx.getInitials(emp.fullName));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "type-employee-info" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-info']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "type-employee-name" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-name']} */ ;
                    (emp.fullName || 'N/A');
                    if (emp.fullNameEnglish) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "type-employee-name-en" },
                        });
                        /** @type {__VLS_StyleScopedClasses['type-employee-name-en']} */ ;
                        (emp.fullNameEnglish);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "type-employee-dept" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-dept']} */ ;
                    (emp.department || 'N/A');
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "type-employee-id" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-id']} */ ;
                    (emp.employeeId || emp.id);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!(__VLS_ctx.expandedType === type.type))
                                    return;
                                if (!!(__VLS_ctx.typeEmployeeLoading[type.type]))
                                    return;
                                __VLS_ctx.viewEmployee(emp.id);
                                // @ts-ignore
                                [typeEmployeeSearch, getFilteredTypeEmployees, getAvatarColor, getInitials, viewEmployee,];
                            } },
                        ...{ class: "type-employee-view" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-view']} */ ;
                    // @ts-ignore
                    [];
                }
                if (__VLS_ctx.getFilteredTypeEmployees(type.type).length === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "type-employee-empty" },
                    });
                    /** @type {__VLS_StyleScopedClasses['type-employee-empty']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "type-employee-footer" },
                });
                /** @type {__VLS_StyleScopedClasses['type-employee-footer']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "type-employee-total" },
                });
                /** @type {__VLS_StyleScopedClasses['type-employee-total']} */ ;
                (__VLS_ctx.getFilteredTypeEmployees(type.type).length);
                (__VLS_ctx.getTypeEmployees(type.type).length);
            }
        }
        // @ts-ignore
        [getTypeEmployees, getFilteredTypeEmployees, getFilteredTypeEmployees,];
    }
    if (__VLS_ctx.filteredTypes.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-footer" },
});
/** @type {__VLS_StyleScopedClasses['page-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.lastUpdated);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.totalEmployees);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.employmentTypes.length);
// @ts-ignore
[totalEmployees, employmentTypes, filteredTypes, lastUpdated,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
