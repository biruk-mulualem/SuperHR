import { ref, reactive, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { Chart, registerables } from "chart.js";
import employeeService from "@/stores/employee";
Chart.register(...registerables);
const router = useRouter();
const loading = ref(false);
// Chart refs
const hiringChartCanvas = ref(null);
const salaryChartCanvas = ref(null);
// Chart instances
let hiringChart = null;
let salaryChart = null;
// Filter states
const hiringFilters = reactive({ departmentId: "all", timeRange: "all" });
const complianceFilters = reactive({
    documentType: "all",
    guaranteeMonths: 6,
    departmentId: "all",
});
// Data stores
const kpiData = ref({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
    fullyCompliant: 0,
    missingDocs: 0,
    complianceRate: "0",
});
const departments = ref([]);
const allDepartments = ref([]);
const employmentTypes = ref([]);
const employeesByDepartment = ref({});
const employeesByType = ref({});
const salaryByDepartment = ref([]);
// ========== GUARANTEE AGE STATE ==========
const ageDepartmentFilter = ref('all');
const guaranteeAgeData = ref([]);
const guaranteeAgeStats = ref({
    total: 0,
    averageAge: 0,
    oldest: 0,
    youngest: 0
});
// ========== GUARANTEE AGE FUNCTIONS ==========
const getAgeBarColor = (months) => {
    if (months <= 1)
        return '#10b981';
    if (months <= 3)
        return '#34d399';
    if (months <= 6)
        return '#fbbf24';
    if (months <= 9)
        return '#f59e0b';
    if (months <= 12)
        return '#ef4444';
    return '#dc2626';
};
const getBarHeight = (count, data) => {
    if (!data || data.length === 0)
        return '5%';
    const max = Math.max(...data.map(d => d.count));
    if (max === 0)
        return '5%';
    const height = (count / max) * 100;
    if (count === 0)
        return '5%';
    return Math.max(height, 10) + '%';
};
const getYAxisLabel = (index, data) => {
    if (!data || data.length === 0)
        return '0';
    const max = Math.max(...data.map(d => d.count));
    if (max === 0)
        return '0';
    const value = Math.ceil((max / 5) * index);
    return value.toString();
};
// ========== LOAD GUARANTEE AGE DATA ==========
// ========== LOAD GUARANTEE AGE DATA ==========
const loadGuaranteeAgeData = async () => {
    try {
        console.log('📤 Fetching guarantee age data...');
        const response = await employeeService.getGuaranteeAgeDistribution({
            departmentId: ageDepartmentFilter.value === 'all' ? 'all' : ageDepartmentFilter.value,
            search: '',
            includeDetails: false
        });
        console.log('📥 Full Response:', response);
        console.log('📥 response.data:', response.data);
        console.log('📥 response.data.data:', response.data?.data);
        // ✅ CORRECT: The data is at response.data.data
        if (response && response.data && response.data.success && response.data.data) {
            const payload = response.data.data;
            const distribution = payload.distribution || [];
            const summary = payload.summary || {};
            console.log('📊 Distribution from API:', distribution);
            console.log('📊 Summary from API:', summary);
            // ✅ Assign the data
            guaranteeAgeData.value = distribution;
            guaranteeAgeStats.value = {
                total: summary.totalGuarantees || 0,
                averageAge: summary.averageAgeMonths || 0,
                oldest: summary.oldestAgeMonths || 0,
                youngest: summary.youngestAgeMonths || 0
            };
            console.log('✅ Data assigned:', {
                distribution: guaranteeAgeData.value,
                stats: guaranteeAgeStats.value,
                hasData: guaranteeAgeData.value.some(d => d.count > 0)
            });
            await nextTick();
        }
        else {
            console.warn('⚠️ No data received');
            setEmptyData();
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
        setEmptyData();
    }
};
const setEmptyData = () => {
    guaranteeAgeData.value = [
        { label: "1 Month", months: 1, count: 0, percentage: 0 },
        { label: "3 Months", months: 3, count: 0, percentage: 0 },
        { label: "6 Months", months: 6, count: 0, percentage: 0 },
        { label: "9 Months", months: 9, count: 0, percentage: 0 },
        { label: "12 Months", months: 12, count: 0, percentage: 0 },
        { label: "> 12 Months", months: 13, count: 0, percentage: 0 }
    ];
    guaranteeAgeStats.value = { total: 0, averageAge: 0, oldest: 0, youngest: 0 };
};
// Watch for department filter changes
watch(ageDepartmentFilter, () => {
    loadGuaranteeAgeData();
});
// Chart data
const hiringChartData = ref([]);
const salaryChartData = ref([]);
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 });
const salaryStats = ref({ avgSalary: 0, highestDept: "-", totalPool: 0 });
const docComplianceRate = ref(0);
// ========== COMPLIANCE SUMMARY ==========
const complianceSummary = ref({
    totalEmployees: 0,
    fullyCompliant: 0,
    missingDocuments: 0,
    overallRate: 0,
    idCard: { submitted: 0, missing: 0, rate: 0 },
    degree: { submitted: 0, missing: 0, rate: 0 },
    guarantee: { withTwo: 0, needSecond: 0, missing: 0, rate: 0 }
});
// KPI List
const kpiList = computed(() => [
    {
        label: "Total Headcount",
        value: kpiData.value.total || "0",
        icon: "UsersIcon",
        gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    {
        label: "Active Employees",
        value: kpiData.value.active || "0",
        icon: "ActivityIcon",
        gradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
        label: "On Leave",
        value: kpiData.value.onLeave || "0",
        icon: "CalendarIcon",
        gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    },
    {
        label: "Fully Compliant",
        value: kpiData.value.complianceRate || "0%",
        icon: "CheckIcon",
        gradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
        label: "Missing Docs",
        value: kpiData.value.missingDocs || "0",
        icon: "AlertIcon",
        gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    },
]);
// ========== HELPER FUNCTIONS ==========
const formatNumber = (num) => (!num ? "0" : num.toLocaleString());
const formatDate = (date) => !date ? "N/A" : new Date(date).toLocaleDateString();
const getEmploymentTypeLabel = (type) => ({
    "full-time": "Full Time",
    "part-time": "Part Time",
    contract: "Contract",
    intern: "Intern",
})[type] || type;
const getTypeColor = (type) => ({
    "full-time": "#10b981",
    "part-time": "#f59e0b",
    contract: "#8b5cf6",
    intern: "#ef4444",
})[type] || "#6366f1";
// ========== COMPLIANCE SUMMARY LOADING ==========
const loadComplianceSummary = async () => {
    try {
        const result = await employeeService.getComplianceSummary({
            departmentId: complianceFilters.departmentId
        });
        if (result.success && result.data) {
            complianceSummary.value = result.data;
            docComplianceRate.value = result.data.overallRate || 0;
        }
    }
    catch (error) {
        console.error("Error loading compliance summary:", error);
    }
};
// ========== OTHER DATA LOADING FUNCTIONS ==========
const loadKpiStats = async () => {
    try {
        const result = await employeeService.getKpiStats();
        if (result.success && result.data)
            kpiData.value = result.data;
    }
    catch (error) {
        console.error("Error loading KPI stats:", error);
    }
};
const loadHiringTrends = async () => {
    try {
        const result = await employeeService.getHiringTrends({
            departmentId: hiringFilters.departmentId,
            months: hiringFilters.timeRange === "all" ? "all" : hiringFilters.timeRange,
        });
        console.log('📊 Hiring Trends Response:', result);
        if (result.success && result.data && result.data.trends) {
            const trends = result.data.trends || [];
            // ✅ Ensure each trend has a monthName
            const monthNames = [
                'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
                'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
            ];
            const formattedTrends = trends.map((item, index) => {
                const monthNum = parseInt(item.month) - 1;
                return {
                    ...item,
                    monthName: item.monthName || monthNames[monthNum] || `Month ${item.month}`,
                    monthNum: monthNum
                };
            });
            hiringChartData.value = formattedTrends;
            hiringStats.value = {
                totalHired: result.data.totalHired || 0,
                totalTerminated: result.data.totalTerminated || 0,
                netGrowth: result.data.netGrowth || 0,
                year: result.data.year || '2018'
            };
            console.log('📊 Formatted Trends:', formattedTrends);
            await nextTick();
            setTimeout(() => initHiringChart(), 200);
        }
    }
    catch (error) {
        console.error("Error loading hiring trends:", error);
    }
};
// Apply hiring filters with debounce
const applyHiringFilters = () => {
    loadHiringTrends();
};
const loadDepartmentDistribution = async () => {
    try {
        const result = await employeeService.getDepartmentDistribution();
        if (result.success && result.data) {
            departments.value = result.data.departments || [];
            allDepartments.value = result.data.departments || [];
            employeesByDepartment.value = result.data.employeesByDepartment || {};
        }
    }
    catch (error) {
        console.error("Error loading department distribution:", error);
    }
};
const loadEmploymentTypeDistribution = async () => {
    try {
        const result = await employeeService.getEmploymentTypeDistribution();
        if (result.success && result.data) {
            employmentTypes.value = result.data.types || [];
            employeesByType.value = result.data.employeesByType || {};
        }
    }
    catch (error) {
        console.error("Error loading employment type distribution:", error);
    }
};
const loadSalaryAnalysis = async () => {
    try {
        const result = await employeeService.getSalaryAnalysis();
        if (result.success && result.data) {
            salaryChartData.value = result.data.distribution || [];
            salaryStats.value = {
                avgSalary: result.data.overview?.avg_salary || 0,
                highestDept: result.data.byDepartment?.[0]?.department_name || "-",
                totalPool: result.data.overview?.total_salary_pool || 0,
            };
            salaryByDepartment.value = result.data.byDepartment || [];
            await nextTick();
            setTimeout(() => initSalaryChart(), 100);
        }
    }
    catch (error) {
        console.error("Error loading salary analysis:", error);
    }
};
const loadAllData = async () => {
    loading.value = true;
    try {
        await Promise.all([
            loadKpiStats(),
            loadHiringTrends(),
            loadDepartmentDistribution(),
            loadEmploymentTypeDistribution(),
            loadSalaryAnalysis(),
            loadComplianceSummary(),
            loadGuaranteeAgeData(),
        ]);
        await nextTick();
        setTimeout(() => {
            if (hiringChartData.value?.length > 0)
                initHiringChart();
            if (salaryChartData.value?.length > 0)
                initSalaryChart();
        }, 200);
    }
    catch (error) {
        console.error("Error loading analytics data:", error);
    }
    finally {
        loading.value = false;
    }
};
const refreshData = () => {
    hiringFilters.departmentId = "all";
    hiringFilters.timeRange = "all";
    complianceFilters.documentType = "all";
    complianceFilters.guaranteeMonths = 6;
    complianceFilters.departmentId = "all";
    ageDepartmentFilter.value = "all";
    loadAllData();
};
// ========== CHART FUNCTIONS ==========
const initHiringChart = () => {
    if (!hiringChartCanvas.value) {
        setTimeout(() => {
            if (hiringChartData.value?.length > 0)
                initHiringChart();
        }, 200);
        return false;
    }
    const ctx = hiringChartCanvas.value.getContext("2d");
    if (!ctx)
        return false;
    if (hiringChart) {
        hiringChart.destroy();
        hiringChart = null;
    }
    if (!hiringChartData.value?.length) {
        console.warn('⚠️ No hiring chart data available');
        return false;
    }
    // ✅ Get labels from monthName or fallback
    const labels = hiringChartData.value.map((m) => {
        return m.monthName || m.month || `Month ${m.month}`;
    });
    console.log('📊 Chart Labels:', labels);
    console.log('📊 Chart Data:', hiringChartData.value);
    hiringChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Hires",
                    data: hiringChartData.value.map((m) => m.hired || 0),
                    backgroundColor: "#10b981",
                    borderRadius: 6,
                    barPercentage: 0.6,
                },
                {
                    label: "Terminations",
                    data: hiringChartData.value.map((m) => m.terminated || 0),
                    backgroundColor: "#ef4444",
                    borderRadius: 6,
                    barPercentage: 0.6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: { size: 11 },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const label = ctx.dataset.label || '';
                            const value = ctx.raw || 0;
                            return `${label}: ${value} employee${value !== 1 ? 's' : ''}`;
                        },
                        title: (items) => {
                            const index = items[0]?.dataIndex;
                            const data = hiringChartData.value[index];
                            return data?.monthName || items[0]?.label || '';
                        }
                    }
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Number of Employees",
                        font: { size: 11 }
                    },
                    grid: { color: "#e2e8f0" },
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        font: { size: 10 }
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: `Ethiopian Calendar - ${hiringStats.value.year || '2018'} EC`,
                        font: { size: 11 }
                    },
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 9 },
                        autoSkip: true,
                        maxTicksLimit: 13
                    }
                },
            },
        },
    });
    return true;
};
const initSalaryChart = () => {
    if (!salaryChartCanvas.value)
        return false;
    const ctx = salaryChartCanvas.value.getContext("2d");
    if (!ctx)
        return false;
    if (salaryChart) {
        salaryChart.destroy();
        salaryChart = null;
    }
    if (!salaryChartData.value?.length)
        return false;
    salaryChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: salaryChartData.value.map((s) => s.salary_range),
            datasets: [
                {
                    label: "Number of Employees",
                    data: salaryChartData.value.map((s) => s.employee_count),
                    backgroundColor: "#10b981",
                    borderRadius: 8,
                    barPercentage: 0.7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw} employee${ctx.raw !== 1 ? "s" : ""}`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Number of Employees" },
                    grid: { color: "#e2e8f0" },
                    ticks: { precision: 0 },
                },
                x: {
                    title: { display: true, text: "Salary Range (ETB)" },
                    grid: { display: false },
                },
            },
        },
    });
    return true;
};
// Icons
const UsersIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' };
const ActivityIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' };
const CalendarIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' };
const CheckIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' };
const AlertIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>' };
// Watchers
watch(() => hiringFilters.departmentId, () => loadHiringTrends());
watch(() => hiringFilters.timeRange, () => loadHiringTrends());
watch(() => complianceFilters.departmentId, () => loadComplianceSummary());
// ========== LIFECYCLE ==========
onMounted(() => {
    loadAllData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['view-details-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['y-axis-label']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['age-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-card']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pink']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input-small']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['no-data-message']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['view-full-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-ring']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-content']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-status-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-status-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['hr-analytics']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-row']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-status-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-summary-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-with-labels']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bars']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar-count']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['age-stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['age-stats-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['age-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-status-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['status-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['age-chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-with-labels']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bars']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar-count']} */ ;
/** @type {__VLS_StyleScopedClasses['age-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['age-stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['y-axis-label']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "hr-analytics" },
});
/** @type {__VLS_StyleScopedClasses['hr-analytics']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-gradient" },
});
/** @type {__VLS_StyleScopedClasses['bg-gradient']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-header" },
});
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
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
    d: "M12 2L2 7l10 5 10-5-10-5z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M2 17l10 5 10-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M2 12l10 5 10-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-right" },
});
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshData) },
    ...{ class: "refresh-btn" },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
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
        ...{ class: "kpi-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-grid']} */ ;
    for (const [kpi] of __VLS_vFor((__VLS_ctx.kpiList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "kpi-card" },
            key: (kpi.label),
        });
        /** @type {__VLS_StyleScopedClasses['kpi-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "kpi-icon" },
            ...{ style: ({ background: kpi.gradient }) },
        });
        /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
        const __VLS_0 = (kpi.icon);
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
        const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "kpi-content" },
        });
        /** @type {__VLS_StyleScopedClasses['kpi-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "kpi-value" },
        });
        /** @type {__VLS_StyleScopedClasses['kpi-value']} */ ;
        (kpi.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "kpi-label" },
        });
        /** @type {__VLS_StyleScopedClasses['kpi-label']} */ ;
        (kpi.label);
        // @ts-ignore
        [refreshData, loading, loading, kpiList,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-card" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-title" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-icon blue" },
    });
    /** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "9",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M22 21v-2a4 4 0 0 0-3-3.87",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 3.13a4 4 0 0 1 0 7.75",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-small" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.applyHiringFilters) },
        value: (__VLS_ctx.hiringFilters.departmentId),
        ...{ class: "filter-select-small" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "all",
    });
    for (const [dept] of __VLS_vFor((__VLS_ctx.allDepartments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.departmentName);
        // @ts-ignore
        [applyHiringFilters, hiringFilters, allDepartments,];
    }
    let __VLS_5;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        to: "/dashboard/hiring-details",
        ...{ class: "expand-btn" },
    }));
    const __VLS_7 = __VLS_6({
        to: "/dashboard/hiring-details",
        ...{ class: "expand-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
    const { default: __VLS_10 } = __VLS_8.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "3",
    });
    // @ts-ignore
    [];
    var __VLS_8;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-container" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.canvas, __VLS_intrinsics.canvas)({
        ref: "hiringChartCanvas",
    });
    if (__VLS_ctx.hiringStats.totalHired > 0 || __VLS_ctx.hiringStats.totalTerminated > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-stats']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat" },
        });
        /** @type {__VLS_StyleScopedClasses['stat']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.hiringStats.totalHired || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat" },
        });
        /** @type {__VLS_StyleScopedClasses['stat']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.hiringStats.totalTerminated || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat" },
        });
        /** @type {__VLS_StyleScopedClasses['stat']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
            ...{ class: (__VLS_ctx.hiringStats.netGrowth >= 0 ? 'positive' : 'negative') },
        });
        (__VLS_ctx.hiringStats.netGrowth >= 0 ? "+" : "");
        (__VLS_ctx.hiringStats.netGrowth || 0);
    }
    if ((!__VLS_ctx.hiringChartData || __VLS_ctx.hiringChartData.length === 0) && !__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-data-message" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data-message']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-card" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-title" },
    });
    /** @type {__VLS_StyleScopedClasses['header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-icon purple" },
    });
    /** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['purple']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_11;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        to: "/dashboard/department-distribution",
        ...{ class: "expand-btn" },
    }));
    const __VLS_13 = __VLS_12({
        to: "/dashboard/department-distribution",
        ...{ class: "expand-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
    const { default: __VLS_16 } = __VLS_14.slots;
    // @ts-ignore
    [loading, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringChartData, hiringChartData,];
    var __VLS_14;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dept-list" },
    });
    /** @type {__VLS_StyleScopedClasses['dept-list']} */ ;
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (dept.departmentId),
            ...{ class: "dept-row" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-info" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-name" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
        (dept.departmentName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-count" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-count']} */ ;
        (dept.count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dept-metrics" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-metrics']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "metric" },
        });
        /** @type {__VLS_StyleScopedClasses['metric']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "metric-bar" },
            ...{ style: ({ width: dept.percentage + '%', background: '#6366f1' }) },
        });
        /** @type {__VLS_StyleScopedClasses['metric-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (dept.percentage);
        // @ts-ignore
        [departments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-card" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-title" },
    });
    /** @type {__VLS_StyleScopedClasses['header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-icon green" },
    });
    /** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_17;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        to: "/dashboard/salary-distribution",
        ...{ class: "expand-btn" },
    }));
    const __VLS_19 = __VLS_18({
        to: "/dashboard/salary-distribution",
        ...{ class: "expand-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
    const { default: __VLS_22 } = __VLS_20.slots;
    // @ts-ignore
    [];
    var __VLS_20;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-container small" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.canvas, __VLS_intrinsics.canvas)({
        ref: "salaryChartCanvas",
    });
    if (__VLS_ctx.salaryStats.avgSalary > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "salary-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['salary-stats']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat" },
        });
        /** @type {__VLS_StyleScopedClasses['stat']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatNumber(__VLS_ctx.salaryStats.avgSalary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat" },
        });
        /** @type {__VLS_StyleScopedClasses['stat']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.salaryStats.highestDept);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat" },
        });
        /** @type {__VLS_StyleScopedClasses['stat']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatNumber(__VLS_ctx.salaryStats.totalPool));
    }
    if ((!__VLS_ctx.salaryChartData || __VLS_ctx.salaryChartData.length === 0) && !__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-data-message" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data-message']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-card" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-title" },
    });
    /** @type {__VLS_StyleScopedClasses['header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-icon pink" },
    });
    /** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['pink']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_23;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        to: "/dashboard/employment-distribution",
        ...{ class: "expand-btn" },
    }));
    const __VLS_25 = __VLS_24({
        to: "/dashboard/employment-distribution",
        ...{ class: "expand-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
    const { default: __VLS_28 } = __VLS_26.slots;
    // @ts-ignore
    [loading, salaryStats, salaryStats, salaryStats, salaryStats, formatNumber, formatNumber, salaryChartData, salaryChartData,];
    var __VLS_26;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employment-types" },
    });
    /** @type {__VLS_StyleScopedClasses['employment-types']} */ ;
    for (const [type] of __VLS_vFor((__VLS_ctx.employmentTypes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (type.type),
            ...{ class: "type-row" },
        });
        /** @type {__VLS_StyleScopedClasses['type-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-label" },
        });
        /** @type {__VLS_StyleScopedClasses['type-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.getEmploymentTypeLabel(type.type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (type.count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['type-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "type-fill" },
            ...{ style: ({ width: type.percentage + '%', background: __VLS_ctx.getTypeColor(type.type) }) },
        });
        /** @type {__VLS_StyleScopedClasses['type-fill']} */ ;
        // @ts-ignore
        [employmentTypes, getEmploymentTypeLabel, getTypeColor,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "compliance-section" },
    });
    /** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
    let __VLS_29;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        to: "/dashboard/document-compliance",
        ...{ class: "view-full-btn" },
    }));
    const __VLS_31 = __VLS_30({
        to: "/dashboard/document-compliance",
        ...{ class: "view-full-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    /** @type {__VLS_StyleScopedClasses['view-full-btn']} */ ;
    const { default: __VLS_34 } = __VLS_32.slots;
    // @ts-ignore
    [];
    var __VLS_32;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overall-compliance" },
    });
    /** @type {__VLS_StyleScopedClasses['overall-compliance']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "compliance-ring" },
    });
    /** @type {__VLS_StyleScopedClasses['compliance-ring']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 100 100",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "50",
        cy: "50",
        r: "45",
        fill: "none",
        stroke: "#e2e8f0",
        'stroke-width': "8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "50",
        cy: "50",
        r: "45",
        fill: "none",
        stroke: "#6366f1",
        'stroke-width': "8",
        'stroke-dasharray': (283),
        'stroke-dashoffset': (283 - (283 * __VLS_ctx.docComplianceRate) / 100),
        transform: "rotate(-90 50 50)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ring-value" },
    });
    /** @type {__VLS_StyleScopedClasses['ring-value']} */ ;
    (__VLS_ctx.docComplianceRate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ring-label" },
    });
    /** @type {__VLS_StyleScopedClasses['ring-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "global-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['global-filters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-card" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-content" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadComplianceSummary) },
        value: (__VLS_ctx.complianceFilters.departmentId),
        ...{ class: "filter-select-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
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
        [departments, docComplianceRate, docComplianceRate, loadComplianceSummary, complianceFilters,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "compliance-status-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['compliance-status-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-title" },
    });
    /** @type {__VLS_StyleScopedClasses['status-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['status-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value success" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    (__VLS_ctx.complianceSummary.idCard?.submitted || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value danger" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    (__VLS_ctx.complianceSummary.idCard?.missing || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.complianceSummary.idCard?.rate || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-progress" },
    });
    /** @type {__VLS_StyleScopedClasses['status-progress']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-progress-bar" },
        ...{ style: ({
                width: (__VLS_ctx.complianceSummary.idCard?.rate || 0) + '%',
                background: (__VLS_ctx.complianceSummary.idCard?.rate || 0) >= 80 ? '#10b981' :
                    (__VLS_ctx.complianceSummary.idCard?.rate || 0) >= 50 ? '#f59e0b' : '#ef4444'
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-progress-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-title" },
    });
    /** @type {__VLS_StyleScopedClasses['status-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['status-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value success" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    (__VLS_ctx.complianceSummary.degree?.submitted || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value danger" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    (__VLS_ctx.complianceSummary.degree?.missing || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.complianceSummary.degree?.rate || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-progress" },
    });
    /** @type {__VLS_StyleScopedClasses['status-progress']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-progress-bar" },
        ...{ style: ({
                width: (__VLS_ctx.complianceSummary.degree?.rate || 0) + '%',
                background: (__VLS_ctx.complianceSummary.degree?.rate || 0) >= 80 ? '#10b981' :
                    (__VLS_ctx.complianceSummary.degree?.rate || 0) >= 50 ? '#f59e0b' : '#ef4444'
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-progress-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['status-card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-title" },
    });
    /** @type {__VLS_StyleScopedClasses['status-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['status-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value success" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    (__VLS_ctx.complianceSummary.guarantee?.withTwo || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value warning" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    (__VLS_ctx.complianceSummary.guarantee?.needSecond || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value danger" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    (__VLS_ctx.complianceSummary.guarantee?.missing || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-progress" },
    });
    /** @type {__VLS_StyleScopedClasses['status-progress']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-progress-bar" },
        ...{ style: ({
                width: (__VLS_ctx.complianceSummary.guarantee?.rate || 0) + '%',
                background: (__VLS_ctx.complianceSummary.guarantee?.rate || 0) >= 80 ? '#10b981' :
                    (__VLS_ctx.complianceSummary.guarantee?.rate || 0) >= 50 ? '#f59e0b' : '#ef4444'
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-progress-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "compliance-summary-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['compliance-summary-footer']} */ ;
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
    (__VLS_ctx.complianceSummary.fullyCompliant || 0);
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
    ((__VLS_ctx.complianceSummary.totalEmployees || 0) - (__VLS_ctx.complianceSummary.fullyCompliant || 0) - (__VLS_ctx.complianceSummary.missingDocuments || 0));
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
    (__VLS_ctx.complianceSummary.missingDocuments || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "guarantee-age-section" },
    });
    /** @type {__VLS_StyleScopedClasses['guarantee-age-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "age-stats-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['age-stats-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-badge']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.guaranteeAgeStats.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-badge']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.guaranteeAgeStats.averageAge);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-badge']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.guaranteeAgeStats.oldest);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-badge']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.guaranteeAgeStats.youngest);
    let __VLS_35;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        to: "/dashboard/guarantee-age-details",
        ...{ class: "view-details-btn" },
    }));
    const __VLS_37 = __VLS_36({
        to: "/dashboard/guarantee-age-details",
        ...{ class: "view-details-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    /** @type {__VLS_StyleScopedClasses['view-details-btn']} */ ;
    const { default: __VLS_40 } = __VLS_38.slots;
    // @ts-ignore
    [complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, complianceSummary, guaranteeAgeStats, guaranteeAgeStats, guaranteeAgeStats, guaranteeAgeStats,];
    var __VLS_38;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "global-filters" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['global-filters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-card" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-content" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadGuaranteeAgeData) },
        value: (__VLS_ctx.ageDepartmentFilter),
        ...{ class: "filter-select-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
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
        [departments, loadGuaranteeAgeData, ageDepartmentFilter,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.guaranteeAgeData.length);
    (__VLS_ctx.guaranteeAgeData.some(item => item.count > 0));
    (__VLS_ctx.guaranteeAgeData.map(d => d.count).join(', '));
    if (__VLS_ctx.guaranteeAgeData.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "age-chart-container" },
        });
        /** @type {__VLS_StyleScopedClasses['age-chart-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-with-labels" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-with-labels']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "y-axis-label" },
        });
        /** @type {__VLS_StyleScopedClasses['y-axis-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-area" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-area']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "y-axis-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['y-axis-grid']} */ ;
        for (const [i] of __VLS_vFor((5))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (i),
                ...{ class: "grid-line" },
            });
            /** @type {__VLS_StyleScopedClasses['grid-line']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grid-label" },
            });
            /** @type {__VLS_StyleScopedClasses['grid-label']} */ ;
            (__VLS_ctx.getYAxisLabel(i, __VLS_ctx.guaranteeAgeData));
            // @ts-ignore
            [guaranteeAgeData, guaranteeAgeData, guaranteeAgeData, guaranteeAgeData, guaranteeAgeData, getYAxisLabel,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "age-bars" },
        });
        /** @type {__VLS_StyleScopedClasses['age-bars']} */ ;
        for (const [item, index] of __VLS_vFor((__VLS_ctx.guaranteeAgeData))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (index),
                ...{ class: "age-bar-group" },
            });
            /** @type {__VLS_StyleScopedClasses['age-bar-group']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "age-bar-wrapper" },
            });
            /** @type {__VLS_StyleScopedClasses['age-bar-wrapper']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "age-bar" },
                ...{ style: ({
                        height: __VLS_ctx.getBarHeight(item.count, __VLS_ctx.guaranteeAgeData),
                        background: __VLS_ctx.getAgeBarColor(item.months)
                    }) },
                title: (`${item.label}: ${item.count} employees (${item.percentage}%)`),
            });
            /** @type {__VLS_StyleScopedClasses['age-bar']} */ ;
            if (item.count > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "age-bar-count" },
                });
                /** @type {__VLS_StyleScopedClasses['age-bar-count']} */ ;
                (item.count);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "age-bar-label" },
            });
            /** @type {__VLS_StyleScopedClasses['age-bar-label']} */ ;
            (item.label);
            // @ts-ignore
            [guaranteeAgeData, guaranteeAgeData, getBarHeight, getAgeBarColor,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "x-axis-label" },
        });
        /** @type {__VLS_StyleScopedClasses['x-axis-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-data-message small" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data-message']} */ ;
        /** @type {__VLS_StyleScopedClasses['small']} */ ;
    }
    if (__VLS_ctx.guaranteeAgeData.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "age-stats-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['age-stats-grid']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.guaranteeAgeData))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "age-stat-card" },
                key: (item.label),
            });
            /** @type {__VLS_StyleScopedClasses['age-stat-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "age-stat-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['age-stat-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "age-stat-value" },
            });
            /** @type {__VLS_StyleScopedClasses['age-stat-value']} */ ;
            (item.count);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "age-stat-label" },
            });
            /** @type {__VLS_StyleScopedClasses['age-stat-label']} */ ;
            (item.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "age-stat-percent" },
            });
            /** @type {__VLS_StyleScopedClasses['age-stat-percent']} */ ;
            (item.percentage);
            // @ts-ignore
            [guaranteeAgeData, guaranteeAgeData,];
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
