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
let searchTimeout = null;
// Filter states
const hiringFilters = reactive({ departmentId: "all", timeRange: "all" });
const complianceFilters = reactive({
    documentType: "all",
    guaranteeMonths: 6,
    departmentId: "all",
});
const recentHireDaysParam = ref(90);
// Modal states
const showDepartmentModal = ref(false);
const showSalaryModal = ref(false);
const showEmploymentTypeModal = ref(false);
const showRecentHiresModal = ref(false);
const showMissingDocsModal = ref(false);
const showHiringDetailsModal = ref(false);
const activeHiringTab = ref("hired");
// Filter values for modals
const departmentFilter = ref("");
const employmentTypeFilter = ref("");
const recentHiresFilter = ref("");
const missingDocsFilter = ref("");
const hiredFilter = ref("");
const terminatedFilter = ref("");
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
const recentHires = ref([]);
const employeesWithMissingDocs = ref([]);
const employeesByDepartment = ref({});
const employeesByType = ref({});
const highestPaid = ref([]);
const salaryByDepartment = ref([]);
const hiredEmployeesList = ref([]);
const terminatedEmployeesList = ref([]);
// Chart data
const hiringChartData = ref([]);
const salaryChartData = ref([]);
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 });
const salaryStats = ref({ avgSalary: 0, highestDept: "-", totalPool: 0 });
const docComplianceRate = ref(0);
// Document Compliance Data
const idCardData = ref({ submitted: [], missing: [] });
const cvData = ref({ submitted: [], missing: [] });
const degreeData = ref({ submitted: [], missing: [] });
const guaranteeData = ref({
    all: [],
    missing: [],
    needSecond: [],
    withTwo: [],
});
const activeTab = ref("id_card");
// ID Card State
const idCardView = ref("missing");
const idCardAgeFilter = ref("all");
const idCardSearch = ref("");
const idCardMissingList = ref([]);
const idCardSubmittedList = ref([]);
// CV State
const cvView = ref("missing");
const cvAgeFilter = ref("all");
const cvSearch = ref("");
const cvMissingList = ref([]);
const cvSubmittedList = ref([]);
// Degree State
const degreeView = ref("missing");
const degreeAgeFilter = ref("all");
const degreeSearch = ref("");
const degreeMissingList = ref([]);
const degreeSubmittedList = ref([]);
// Guarantee State
const guaranteeFilter = ref("missing");
const guaranteeAgeFilter = ref("all");
const guaranteeSearch = ref("");
const guaranteeList = ref([]);
// Employment Type Pagination
const employmentTypeFilterParam = ref("all");
const employmentTypeSearchFilter = ref("");
const employmentTypePagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
});
const paginatedEmploymentTypeEmployees = ref([]);
// Salary Pagination
const salaryRangeFilter = ref("all");
const salaryDistributionData = ref([]);
const salaryPagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
});
const paginatedHighestPaid = ref([]);
// Department Pagination
const departmentFilterParam = ref("all");
const departmentSearchFilter = ref("");
const departmentPagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
});
const paginatedDepartmentEmployees = ref([]);
// Computed properties for guarantee counts
const guaranteeMissingCount = computed(() => guaranteeData.value.missing?.length || 0);
const guaranteeNeedSecondCount = computed(() => guaranteeData.value.needSecond?.length || 0);
const guaranteeWithTwoCount = computed(() => guaranteeData.value.withTwo?.length || 0);
const guaranteeTotalCount = computed(() => guaranteeData.value.all?.length || 0);
// Computed
const filteredHiredEmployees = computed(() => {
    if (!hiredFilter.value)
        return hiredEmployeesList.value;
    const filter = hiredFilter.value.toLowerCase();
    return hiredEmployeesList.value.filter((emp) => (emp.full_name || "").toLowerCase().includes(filter) ||
        (emp.department || "").toLowerCase().includes(filter) ||
        (emp.position || "").toLowerCase().includes(filter) ||
        (emp.email || "").toLowerCase().includes(filter));
});
const filteredTerminatedEmployees = computed(() => {
    if (!terminatedFilter.value)
        return terminatedEmployeesList.value;
    const filter = terminatedFilter.value.toLowerCase();
    return terminatedEmployeesList.value.filter((emp) => (emp.full_name || "").toLowerCase().includes(filter) ||
        (emp.department || "").toLowerCase().includes(filter) ||
        (emp.position || "").toLowerCase().includes(filter) ||
        (emp.email || "").toLowerCase().includes(filter));
});
const filteredRecentHires = computed(() => recentHires.value.filter((hire) => hire.fullName
    .toLowerCase()
    .includes(recentHiresFilter.value.toLowerCase()) ||
    hire.department
        ?.toLowerCase()
        .includes(recentHiresFilter.value.toLowerCase()) ||
    hire.position
        ?.toLowerCase()
        .includes(recentHiresFilter.value.toLowerCase())));
const filteredMissingDocs = computed(() => employeesWithMissingDocs.value.filter((emp) => emp.fullName
    .toLowerCase()
    .includes(missingDocsFilter.value.toLowerCase()) ||
    emp.department
        .toLowerCase()
        .includes(missingDocsFilter.value.toLowerCase())));
const flattenedDepartmentEmployees = computed(() => {
    const result = [];
    Object.entries(employeesByDepartment.value).forEach(([deptName, employees]) => {
        employees.forEach((emp) => {
            if (emp.fullName
                .toLowerCase()
                .includes(departmentFilter.value.toLowerCase()) ||
                deptName.toLowerCase().includes(departmentFilter.value.toLowerCase())) {
                result.push({ ...emp, department: deptName });
            }
        });
    });
    return result;
});
const flattenedEmploymentTypeEmployees = computed(() => {
    const result = [];
    Object.entries(employeesByType.value).forEach(([typeName, employees]) => {
        employees.forEach((emp) => {
            if (emp.fullName
                .toLowerCase()
                .includes(employmentTypeFilter.value.toLowerCase())) {
                result.push({ ...emp, type: typeName });
            }
        });
    });
    return result;
});
const documentTabs = computed(() => [
    {
        id: "id_card",
        name: "ID Card",
        count: idCardData.missing?.length || 0,
        status: idCardData.missing?.length > 0 ? "warning" : "success",
    },
    {
        id: "cv",
        name: "CV / Resume",
        count: cvData.missing?.length || 0,
        status: cvData.missing?.length > 0 ? "warning" : "success",
    },
    {
        id: "degree",
        name: "Degree",
        count: degreeData.missing?.length || 0,
        status: degreeData.missing?.length > 0 ? "warning" : "success",
    },
    {
        id: "guarantee_letter",
        name: "Guarantee Letter",
        count: guaranteeMissingCount.value,
        status: guaranteeMissingCount.value > 0 ? "critical" : "success",
    },
]);
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
// Helper Functions
const formatNumber = (num) => (!num ? "0" : num.toLocaleString());
const formatDate = (date) => !date ? "N/A" : new Date(date).toLocaleDateString();
const getInitials = (name) => name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
const getDepartmentName = (deptId) => allDepartments.value.find((d) => d.departmentId === parseInt(deptId))
    ?.departmentName || "All Departments";
const getTimeRangeLabel = (range) => ({
    1: "Last 1 Month",
    3: "Last 3 Months",
    6: "Last 6 Months",
    12: "Last 12 Months",
    24: "Last 24 Months",
    36: "Last 36 Months",
    all: "All Time",
})[range] || "All Time";
const formatMonth = (monthStr) => {
    if (!monthStr)
        return "N/A";
    const [year, month] = monthStr.split("-");
    return ([
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ][parseInt(month) - 1] +
        " " +
        year);
};
const calculateTurnoverRate = (month) => {
    if (!month.hired && !month.terminated)
        return "0";
    const total = month.hired + month.terminated;
    return total === 0 ? "0" : ((month.terminated / total) * 100).toFixed(1);
};
const getTurnoverClass = (month) => {
    const rate = parseFloat(calculateTurnoverRate(month));
    if (rate > 50)
        return "critical";
    if (rate > 30)
        return "warning";
    return "normal";
};
const getAgeClass = (months) => {
    if (!months)
        return "";
    if (months > 12)
        return "age-critical";
    if (months > 6)
        return "age-warning";
    if (months > 3)
        return "age-attention";
    return "age-ok";
};
const getStatusClass = (status) => ({
    valid: "status-ok",
    recent: "status-attention",
    expiring_soon: "status-warning",
    expired: "status-critical",
    missing: "status-critical",
    no_guarantee: "status-critical",
    need_second: "status-warning",
    compliant: "status-ok",
})[status] || "status-ok";
const getStatusLabel = (status) => ({
    valid: "✅ Valid",
    recent: "📄 Recent",
    expiring_soon: "⚠️ Expiring Soon",
    expired: "🔴 Expired",
    missing: "❌ Missing",
    no_guarantee: "⚠️ No Guarantee",
    need_second: "🟡 Need 1 more",
    compliant: "✅ Compliant",
})[status] || status;
const getGuaranteeCountClass = (count) => {
    if (count === 0)
        return "count-critical";
    if (count === 1)
        return "count-warning";
    return "count-success";
};
const getGuaranteeStatusClass = (emp) => ({
    no_guarantee: "status-critical",
    need_second: "status-warning",
    expired: "status-critical",
    expiring_soon: "status-warning",
    compliant: "status-ok",
})[emp.status] || "status-ok";
const getGuaranteeStatusLabel = (emp) => ({
    no_guarantee: "⚠️ No Guarantee",
    need_second: "🟡 Need 1 more",
    expired: "🔴 Expired",
    expiring_soon: "🟠 Expiring Soon",
    compliant: "✅ Compliant",
})[emp.status] || emp.status;
// Debounced search functions
const debouncedIdCardSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadIdCardData();
    }, 500);
};
const debouncedCvSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadCvData();
    }, 500);
};
const debouncedDegreeSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadDegreeData();
    }, 500);
};
const debouncedGuaranteeSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyGuaranteeFilters();
    }, 500);
};
// View Change Functions
const changeIdCardView = (view) => {
    idCardView.value = view;
    loadIdCardData();
};
const changeCvView = (view) => {
    cvView.value = view;
    loadCvData();
};
const changeDegreeView = (view) => {
    degreeView.value = view;
    loadDegreeData();
};
const changeGuaranteeFilter = (filter) => {
    guaranteeFilter.value = filter;
    applyGuaranteeFilters();
};
// Data Loading Functions
const loadIdCardData = async () => {
    try {
        const response = await employeeService.getDocumentCompliance({
            documentType: "id_card",
            departmentId: complianceFilters.departmentId,
            guaranteeMonths: 6,
        });
        if (response.success && response.data) {
            const data = response.data;
            idCardData.value = {
                submitted: data.id_card?.submitted || [],
                missing: data.id_card?.missing || [],
            };
            if (idCardView.value === "missing") {
                let list = [...idCardData.value.missing];
                if (idCardSearch.value) {
                    const search = idCardSearch.value.toLowerCase();
                    list = list.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
                        emp.department?.toLowerCase().includes(search));
                }
                idCardMissingList.value = list;
            }
            else {
                let list = [...idCardData.value.submitted];
                if (idCardAgeFilter.value !== "all") {
                    list = list.filter((emp) => {
                        const months = emp.monthsOld || 0;
                        switch (idCardAgeFilter.value) {
                            case "0-3":
                                return months < 3;
                            case "3-6":
                                return months >= 3 && months < 6;
                            case "6-12":
                                return months >= 6 && months < 12;
                            case "12+":
                                return months >= 12;
                            default:
                                return true;
                        }
                    });
                }
                if (idCardSearch.value) {
                    const search = idCardSearch.value.toLowerCase();
                    list = list.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
                        emp.department?.toLowerCase().includes(search));
                }
                idCardSubmittedList.value = list;
            }
        }
    }
    catch (error) {
        console.error("Error loading ID card data:", error);
    }
};
const loadCvData = async () => {
    try {
        const response = await employeeService.getDocumentCompliance({
            documentType: "cv",
            departmentId: complianceFilters.departmentId,
            guaranteeMonths: 6,
        });
        if (response.success && response.data) {
            const data = response.data;
            cvData.value = {
                submitted: data.cv?.submitted || [],
                missing: data.cv?.missing || [],
            };
            if (cvView.value === "missing") {
                let list = [...cvData.value.missing];
                if (cvSearch.value) {
                    const search = cvSearch.value.toLowerCase();
                    list = list.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
                        emp.department?.toLowerCase().includes(search));
                }
                cvMissingList.value = list;
            }
            else {
                let list = [...cvData.value.submitted];
                if (cvAgeFilter.value !== "all") {
                    list = list.filter((emp) => {
                        const months = emp.monthsOld || 0;
                        switch (cvAgeFilter.value) {
                            case "0-3":
                                return months < 3;
                            case "3-6":
                                return months >= 3 && months < 6;
                            case "6-12":
                                return months >= 6 && months < 12;
                            case "12+":
                                return months >= 12;
                            default:
                                return true;
                        }
                    });
                }
                if (cvSearch.value) {
                    const search = cvSearch.value.toLowerCase();
                    list = list.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
                        emp.department?.toLowerCase().includes(search));
                }
                cvSubmittedList.value = list;
            }
        }
    }
    catch (error) {
        console.error("Error loading CV data:", error);
    }
};
const loadDegreeData = async () => {
    try {
        const response = await employeeService.getDocumentCompliance({
            documentType: "degree",
            departmentId: complianceFilters.departmentId,
            guaranteeMonths: 6,
        });
        if (response.success && response.data) {
            const data = response.data;
            degreeData.value = {
                submitted: data.degree?.submitted || [],
                missing: data.degree?.missing || [],
            };
            if (degreeView.value === "missing") {
                let list = [...degreeData.value.missing];
                if (degreeSearch.value) {
                    const search = degreeSearch.value.toLowerCase();
                    list = list.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
                        emp.department?.toLowerCase().includes(search));
                }
                degreeMissingList.value = list;
            }
            else {
                let list = [...degreeData.value.submitted];
                if (degreeAgeFilter.value !== "all") {
                    list = list.filter((emp) => {
                        const months = emp.monthsOld || 0;
                        switch (degreeAgeFilter.value) {
                            case "0-3":
                                return months < 3;
                            case "3-6":
                                return months >= 3 && months < 6;
                            case "6-12":
                                return months >= 6 && months < 12;
                            case "12+":
                                return months >= 12;
                            default:
                                return true;
                        }
                    });
                }
                if (degreeSearch.value) {
                    const search = degreeSearch.value.toLowerCase();
                    list = list.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
                        emp.department?.toLowerCase().includes(search));
                }
                degreeSubmittedList.value = list;
            }
        }
    }
    catch (error) {
        console.error("Error loading degree data:", error);
    }
};
const loadGuaranteeData = async () => {
    try {
        const response = await employeeService.getDocumentCompliance({
            documentType: "guarantee_letter",
            departmentId: complianceFilters.departmentId,
            guaranteeMonths: 6,
        });
        if (response.success && response.data) {
            const data = response.data;
            guaranteeData.value = {
                all: data.guarantee_letter?.all || [],
                missing: data.guarantee_letter?.missing || [],
                needSecond: data.guarantee_letter?.needSecond || [],
                withTwo: data.guarantee_letter?.withTwo || [],
            };
            applyGuaranteeFilters();
        }
    }
    catch (error) {
        console.error("Error loading guarantee data:", error);
    }
};
const applyGuaranteeFilters = () => {
    let sourceList = [];
    switch (guaranteeFilter.value) {
        case "missing":
            sourceList = [...guaranteeData.value.missing];
            break;
        case "one":
            sourceList = [...guaranteeData.value.needSecond];
            break;
        case "two":
            sourceList = [...guaranteeData.value.withTwo];
            break;
        default:
            sourceList = [...guaranteeData.value.all];
    }
    if (guaranteeAgeFilter.value !== "all") {
        sourceList = sourceList.filter((emp) => {
            const age = emp.latestAge || 0;
            switch (guaranteeAgeFilter.value) {
                case "0-3":
                    return age < 3;
                case "3-6":
                    return age >= 3 && age < 6;
                case "6-12":
                    return age >= 6 && age < 12;
                case "12+":
                    return age >= 12;
                default:
                    return true;
            }
        });
    }
    if (guaranteeSearch.value) {
        const search = guaranteeSearch.value.toLowerCase();
        sourceList = sourceList.filter((emp) => emp.fullName.toLowerCase().includes(search) ||
            emp.department?.toLowerCase().includes(search));
    }
    guaranteeList.value = sourceList;
};
const loadDocumentCompliance = async () => {
    try {
        await Promise.all([
            loadIdCardData(),
            loadCvData(),
            loadDegreeData(),
            loadGuaranteeData(),
        ]);
        const result = await employeeService.getDocumentCompliance({
            documentType: "all",
            departmentId: complianceFilters.departmentId,
            guaranteeMonths: 6,
        });
        if (result.success && result.data)
            docComplianceRate.value = parseFloat(result.data.summary?.complianceRate || "0");
    }
    catch (error) {
        console.error("Error loading document compliance:", error);
    }
};
// Other Data Loading Functions
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
        if (result.success && result.data && result.data.trends) {
            hiringChartData.value = [...result.data.trends];
            hiringStats.value = {
                totalHired: result.data.totalHired || 0,
                totalTerminated: result.data.totalTerminated || 0,
                netGrowth: result.data.netGrowth || 0,
            };
            await nextTick();
            setTimeout(() => initHiringChart(), 100);
        }
    }
    catch (error) {
        console.error("Error loading hiring trends:", error);
    }
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
            highestPaid.value = result.data.highestPaid || [];
            salaryByDepartment.value = result.data.byDepartment || [];
            await nextTick();
            setTimeout(() => initSalaryChart(), 100);
        }
    }
    catch (error) {
        console.error("Error loading salary analysis:", error);
    }
};
const loadDepartmentEmployees = async () => {
    try {
        const response = await employeeService.getDepartmentDistributionPaginated({
            page: departmentPagination.value.page,
            limit: 20,
            departmentId: departmentFilterParam.value,
            search: departmentSearchFilter.value,
        });
        if (response.success && response.data) {
            paginatedDepartmentEmployees.value = [];
            Object.values(response.data.employeesByDepartment || {}).forEach((employees) => paginatedDepartmentEmployees.value.push(...employees));
            departmentPagination.value = response.data.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 1,
                hasPrevPage: false,
                hasNextPage: false,
            };
        }
    }
    catch (error) {
        console.error("Error loading department employees:", error);
    }
};
const loadEmploymentTypeEmployees = async () => {
    try {
        const response = await employeeService.getEmploymentTypeDistributionPaginated({
            page: employmentTypePagination.value.page,
            limit: 20,
            employmentTypeFilter: employmentTypeFilterParam.value,
            search: employmentTypeSearchFilter.value,
        });
        if (response.success && response.data) {
            employmentTypes.value = response.data.types || [];
            paginatedEmploymentTypeEmployees.value = [];
            Object.entries(response.data.employeesByType || {}).forEach(([type, employees]) => employees.forEach((emp) => paginatedEmploymentTypeEmployees.value.push({ ...emp, type })));
            employmentTypePagination.value = response.data.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 1,
                hasPrevPage: false,
                hasNextPage: false,
            };
        }
    }
    catch (error) {
        console.error("Error loading employment type employees:", error);
    }
};
const loadSalaryAnalysisWithPagination = async () => {
    try {
        const response = await employeeService.getSalaryAnalysisPaginated({
            page: salaryPagination.value.page,
            limit: 20,
            salaryRange: salaryRangeFilter.value,
        });
        if (response.success && response.data) {
            salaryByDepartment.value = response.data.byDepartment || [];
            paginatedHighestPaid.value = response.data.highestPaid || [];
            salaryPagination.value = response.data.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 1,
                hasPrevPage: false,
                hasNextPage: false,
            };
            salaryStats.value = {
                avgSalary: response.data.overview?.avg_salary || 0,
                highestDept: response.data.byDepartment?.[0]?.department_name || "-",
                totalPool: response.data.overview?.total_salary_pool || 0,
            };
            salaryChartData.value = response.data.distribution || [];
            await nextTick();
            setTimeout(() => initSalaryChart(), 100);
        }
    }
    catch (error) {
        console.error("Error loading salary analysis:", error);
    }
};
const loadHiringDetails = async () => {
    try {
        const result = await employeeService.getHiringDetails({
            departmentId: hiringFilters.departmentId === "all"
                ? null
                : hiringFilters.departmentId,
            months: hiringFilters.timeRange === "all" ? "all" : hiringFilters.timeRange,
        });
        if (result?.data?.hired) {
            hiredEmployeesList.value = result.data.hired || [];
            terminatedEmployeesList.value = result.data.terminated || [];
        }
        else if (result?.data?.data?.hired) {
            hiredEmployeesList.value = result.data.data.hired || [];
            terminatedEmployeesList.value = result.data.data.terminated || [];
        }
    }
    catch (error) {
        console.error("Error loading hiring details:", error);
        hiredEmployeesList.value = [];
        terminatedEmployeesList.value = [];
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
            loadDocumentCompliance(),
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
    recentHireDaysParam.value = 90;
    loadAllData();
};
// Chart Functions
const initHiringChart = () => {
    if (!hiringChartCanvas.value) {
        setTimeout(() => {
            if (hiringChartData.value?.length > 0)
                initHiringChart();
        }, 100);
        return false;
    }
    const ctx = hiringChartCanvas.value.getContext("2d");
    if (!ctx)
        return false;
    if (hiringChart) {
        hiringChart.destroy();
        hiringChart = null;
    }
    if (!hiringChartData.value?.length)
        return false;
    const labels = hiringChartData.value.map((m) => {
        const [year, month] = m.month.split("-");
        return ([
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ][parseInt(month) - 1] +
            " " +
            year);
    });
    hiringChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Hires",
                    data: hiringChartData.value.map((m) => m.hired || 0),
                    backgroundColor: "#10b981",
                    borderRadius: 8,
                    barPercentage: 0.7,
                },
                {
                    label: "Terminations",
                    data: hiringChartData.value.map((m) => m.terminated || 0),
                    backgroundColor: "#ef4444",
                    borderRadius: 8,
                    barPercentage: 0.7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "top" },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} employee${ctx.raw !== 1 ? "s" : ""}`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Number of Employees" },
                    grid: { color: "#e2e8f0" },
                    ticks: { precision: 0, stepSize: 1 },
                },
                x: {
                    title: { display: true, text: "Month" },
                    grid: { display: false },
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
// Print Compliance Tab - With clean layout for printing
const printComplianceTab = () => {
    let printContent = null;
    let title = "";
    let tableId = "";
    switch (activeTab.value) {
        case "id_card":
            tableId =
                idCardView.value === "missing"
                    ? "id-card-missing-table"
                    : "id-card-submitted-table";
            title =
                idCardView.value === "missing"
                    ? "Employees Missing ID Cards"
                    : "Employees Who Submitted ID Cards";
            break;
        case "cv":
            tableId =
                cvView.value === "missing" ? "cv-missing-table" : "cv-submitted-table";
            title =
                cvView.value === "missing"
                    ? "Employees Missing CV/Resume"
                    : "Employees Who Submitted CV/Resume";
            break;
        case "degree":
            tableId =
                degreeView.value === "missing"
                    ? "degree-missing-table"
                    : "degree-submitted-table";
            title =
                degreeView.value === "missing"
                    ? "Employees Missing Degree/Certificate"
                    : "Employees Who Submitted Degree/Certificate";
            break;
        case "guarantee_letter":
            tableId = "guarantee-table";
            title = "Guarantee Letter Status";
            break;
    }
    printContent = document.getElementById(tableId);
    if (!printContent)
        return;
    // Clone the table to avoid modifying the original
    const clonedTable = printContent.cloneNode(true);
    // Remove action buttons from the cloned table for printing
    const actionCells = clonedTable.querySelectorAll(".btn-remind, .btn-outline, .btn-warning, .compliant-badge-modern");
    actionCells.forEach((cell) => {
        const parentTd = cell.closest("td");
        if (parentTd)
            parentTd.remove();
    });
    // Remove the entire Action column header
    const headers = clonedTable.querySelectorAll("th");
    headers.forEach((header) => {
        if (header.textContent === "Action" ||
            header.textContent.includes("Action")) {
            header.remove();
        }
    });
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - HR Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          .print-header { margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 15px; }
          .print-header h1 { color: #1e293b; margin: 0 0 5px 0; font-size: 24px; }
          .print-header .subtitle { color: #64748b; font-size: 12px; margin: 0; }
          .print-info { color: #64748b; margin-bottom: 20px; font-size: 12px; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .print-info span { margin-right: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f2f2f2; font-weight: bold; }
          .employee-cell { display: flex; align-items: center; gap: 8px; }
          .employee-name { font-weight: 500; }
          .dept-badge { background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .age-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .guarantee-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print {
            body { print-color-adjust: exact; }
            .no-break { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${title}</h1>
          <p class="subtitle">HR Intelligence Platform - Document Compliance Report</p>
        </div>
        <div class="print-info">
          <span>Department: ${complianceFilters.departmentId !== "all" ? getDepartmentName(complianceFilters.departmentId) : "All Departments"}</span>
          <span>Generated: ${new Date().toLocaleString()}</span>
        </div>
        ${clonedTable.outerHTML}
        <div class="footer">
          This is a system-generated report. For any discrepancies, please contact HR department.
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
};
// Modal Functions
const openHiringDetailsModal = async () => {
    showHiringDetailsModal.value = true;
    activeHiringTab.value = "hired";
    hiredFilter.value = "";
    terminatedFilter.value = "";
    await loadHiringDetails();
};
const closeHiringDetailsModal = () => {
    showHiringDetailsModal.value = false;
};
const openDepartmentModal = () => {
    showDepartmentModal.value = true;
    departmentFilterParam.value = "all";
    departmentSearchFilter.value = "";
    departmentPagination.value.page = 1;
    loadDepartmentEmployees();
};
const closeDepartmentModal = () => {
    showDepartmentModal.value = false;
};
const openSalaryModal = () => {
    showSalaryModal.value = true;
    salaryRangeFilter.value = "all";
    salaryPagination.value.page = 1;
    loadSalaryAnalysisWithPagination();
};
const closeSalaryModal = () => {
    showSalaryModal.value = false;
};
const openEmploymentTypeModal = () => {
    showEmploymentTypeModal.value = true;
    employmentTypeFilterParam.value = "all";
    employmentTypeSearchFilter.value = "";
    employmentTypePagination.value.page = 1;
    loadEmploymentTypeEmployees();
};
const closeEmploymentTypeModal = () => {
    showEmploymentTypeModal.value = false;
};
const openRecentHiresModal = () => {
    showRecentHiresModal.value = true;
    recentHiresFilter.value = "";
};
const closeRecentHiresModal = () => {
    showRecentHiresModal.value = false;
};
const openMissingDocsModal = () => {
    showMissingDocsModal.value = true;
    missingDocsFilter.value = "";
};
const closeMissingDocsModal = () => {
    showMissingDocsModal.value = false;
};
const remindEmployee = (employee, docType) => {
    alert(`Reminder sent to ${employee.fullName} for ${docType || "missing documents"}`);
};
const requestNewGuarantee = (employee) => {
    alert(`Request sent to ${employee.fullName} for ${2 - employee.guaranteeCount} additional guarantee letter(s)`);
};
const viewEmployee = (id) => {
    router.push(`/employees/${id}`);
};
// Pagination Functions
const changeEmploymentTypePage = (page) => {
    if (page >= 1 && page <= employmentTypePagination.value.totalPages) {
        employmentTypePagination.value.page = page;
        loadEmploymentTypeEmployees();
    }
};
const changeSalaryPage = (page) => {
    if (page >= 1 && page <= salaryPagination.value.totalPages) {
        salaryPagination.value.page = page;
        loadSalaryAnalysisWithPagination();
    }
};
// Print Modal Function
const printModal = (modalType) => {
    const elementId = {
        department: "department-modal-content",
        salary: "salary-modal-content",
        employmentType: "employment-type-modal-content",
        recentHires: "recent-hires-modal-content",
        missingDocs: "missing-docs-modal-content",
        hiringDetails: "hiring-details-modal-content",
    }[modalType];
    if (!elementId)
        return;
    const printContent = document.getElementById(elementId);
    if (!printContent)
        return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>HR Analytics Report</title><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
};
// Save Modal as CSV
const saveModalAsCSV = (modalType) => {
    let csvContent = "", filename = "";
    switch (modalType) {
        case "department":
            csvContent =
                "Department,Employee Name,Email\n" +
                    flattenedDepartmentEmployees.value
                        .map((emp) => `"${emp.department}","${emp.fullName}","${emp.email}"`)
                        .join("\n");
            filename = "department_employees";
            break;
        case "salary":
            csvContent =
                "Type,Name,Value\n" +
                    highestPaid.value
                        .map((emp, i) => `"Highest Paid ${i + 1}","${emp.full_name}","ETB ${formatNumber(emp.basic_salary)}"`)
                        .join("\n") +
                    "\nDepartment,Employees,Avg Salary,Min Salary,Max Salary\n" +
                    salaryByDepartment.value
                        .map((dept) => `"${dept.department_name}","${dept.employee_count}","ETB ${formatNumber(dept.avg_salary)}","ETB ${formatNumber(dept.min_salary)}","ETB ${formatNumber(dept.max_salary)}"`)
                        .join("\n");
            filename = "salary_details";
            break;
        case "employmentType":
            csvContent =
                "Employment Type,Employee Name,Email\n" +
                    flattenedEmploymentTypeEmployees.value
                        .map((emp) => `"${getEmploymentTypeLabel(emp.type)}","${emp.fullName}","${emp.email}"`)
                        .join("\n");
            filename = "employment_type_employees";
            break;
        case "recentHires":
            csvContent =
                "Employee Name,Department,Position,Hire Date,Days Ago\n" +
                    filteredRecentHires.value
                        .map((hire) => `"${hire.fullName}","${hire.department}","${hire.position}","${formatDate(hire.hireDate)}","${hire.daysSinceHire} days"`)
                        .join("\n");
            filename = "recent_hires";
            break;
        case "missingDocs":
            csvContent =
                "Employee Name,Department,Missing Documents\n" +
                    filteredMissingDocs.value
                        .map((emp) => `"${emp.fullName}","${emp.department}","${emp.missingList}"`)
                        .join("\n");
            filename = "missing_documents";
            break;
        case "hiringDetails":
            if (activeHiringTab.value === "hired") {
                csvContent =
                    "Employee Name,Department,Position,Hire Date,Email,Salary (ETB)\n" +
                        filteredHiredEmployees.value
                            .map((emp) => `"${emp.full_name}","${emp.department}","${emp.position}","${formatDate(emp.hiredate)}","${emp.email}","${formatNumber(emp.salary)}"`)
                            .join("\n");
                filename = `hired_employees_${new Date().toISOString().split("T")[0]}`;
            }
            else if (activeHiringTab.value === "terminated") {
                csvContent =
                    "Employee Name,Department,Position,Termination Date,Email,Last Salary (ETB)\n" +
                        filteredTerminatedEmployees.value
                            .map((emp) => `"${emp.full_name}","${emp.department}","${emp.position}","${formatDate(emp.terminationdate)}","${emp.email}","${formatNumber(emp.salary)}"`)
                            .join("\n");
                filename = `terminated_employees_${new Date().toISOString().split("T")[0]}`;
            }
            else {
                csvContent =
                    "Month,Hired,Terminated,Net Change,Turnover Rate (%)\n" +
                        hiringChartData.value
                            .map((month) => `"${formatMonth(month.month)}",${month.hired},${month.terminated},${month.netChange},${calculateTurnoverRate(month)}`)
                            .join("\n");
                filename = `monthly_comparison_${new Date().toISOString().split("T")[0]}`;
            }
            break;
    }
    if (!csvContent)
        return;
    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};
// Watchers
watch(() => hiringFilters.departmentId, () => loadHiringTrends());
watch(() => hiringFilters.timeRange, () => loadHiringTrends());
watch(() => complianceFilters.departmentId, () => loadDocumentCompliance());
watch(idCardAgeFilter, () => {
    if (idCardView.value === "submitted")
        loadIdCardData();
});
watch(cvAgeFilter, () => {
    if (cvView.value === "submitted")
        loadCvData();
});
watch(degreeAgeFilter, () => {
    if (degreeView.value === "submitted")
        loadDegreeData();
});
watch(guaranteeAgeFilter, () => applyGuaranteeFilters());
watch(idCardSearch, () => debouncedIdCardSearch());
watch(cvSearch, () => debouncedCvSearch());
watch(degreeSearch, () => debouncedDegreeSearch());
watch(guaranteeSearch, () => debouncedGuaranteeSearch());
// Icons
const UsersIcon = {
    template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};
const ActivityIcon = {
    template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
};
const CalendarIcon = {
    template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
};
const CheckIcon = {
    template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
};
const AlertIcon = {
    template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>',
};
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
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-card']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
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
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['no-data-message']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['hire-item']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['print-compliance-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['print-compliance-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-ring']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-value']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-label']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-content']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-content']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-name']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-name']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-filters-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-filters-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-filters-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
/** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['compliant-badge-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-remind']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-remind']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['negative']} */ ;
/** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['critical']} */ ;
/** @type {__VLS_StyleScopedClasses['hr-analytics']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['kpi-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-row']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['compliance-tabs-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-filters-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['search-group']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantee-filters-modern']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['comparison-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
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
        ...{ onChange: (__VLS_ctx.loadHiringTrends) },
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
        [loadHiringTrends, hiringFilters, allDepartments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadHiringTrends) },
        value: (__VLS_ctx.hiringFilters.timeRange),
        ...{ class: "filter-select-small" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openHiringDetailsModal) },
        ...{ class: "expand-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openDepartmentModal) },
        ...{ class: "expand-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
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
            ...{ style: ({
                    width: dept.percentage + '%',
                    background: '#6366f1',
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['metric-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (dept.percentage);
        // @ts-ignore
        [loading, loadHiringTrends, hiringFilters, openHiringDetailsModal, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringChartData, hiringChartData, openDepartmentModal, departments,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openSalaryModal) },
        ...{ class: "expand-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openEmploymentTypeModal) },
        ...{ class: "expand-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
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
            ...{ style: ({
                    width: type.percentage + '%',
                    background: __VLS_ctx.getTypeColor(type.type),
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['type-fill']} */ ;
        // @ts-ignore
        [loading, openSalaryModal, salaryStats, salaryStats, salaryStats, salaryStats, formatNumber, formatNumber, salaryChartData, salaryChartData, openEmploymentTypeModal, employmentTypes, getEmploymentTypeLabel, getTypeColor,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.printComplianceTab) },
        ...{ class: "print-compliance-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['print-compliance-btn']} */ ;
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
        ...{ onChange: (__VLS_ctx.loadDocumentCompliance) },
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
        [departments, printComplianceTab, docComplianceRate, docComplianceRate, loadDocumentCompliance, complianceFilters,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "compliance-tabs-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['compliance-tabs-modern']} */ ;
    for (const [tab] of __VLS_vFor((__VLS_ctx.documentTabs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.activeTab = tab.id;
                    // @ts-ignore
                    [documentTabs, activeTab,];
                } },
            key: (tab.id),
            ...{ class: (['tab-btn-modern', { active: __VLS_ctx.activeTab === tab.id }]) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        /** @type {__VLS_StyleScopedClasses['tab-btn-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "tab-content-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['tab-content-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "tab-name" },
        });
        /** @type {__VLS_StyleScopedClasses['tab-name']} */ ;
        (tab.name);
        // @ts-ignore
        [activeTab,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content-modern" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'id_card') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-filters-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-filters-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toggle-switch-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeIdCardView('missing');
                // @ts-ignore
                [activeTab, changeIdCardView,];
            } },
        ...{ class: ({ active: __VLS_ctx.idCardView === 'missing' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-count" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
    (__VLS_ctx.idCardData.missing?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeIdCardView('submitted');
                // @ts-ignore
                [changeIdCardView, idCardView, idCardData,];
            } },
        ...{ class: ({ active: __VLS_ctx.idCardView === 'submitted' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-count" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
    (__VLS_ctx.idCardData.submitted?.length || 0);
    if (__VLS_ctx.idCardView === 'submitted') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-group-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.loadIdCardData) },
            value: (__VLS_ctx.idCardAgeFilter),
            ...{ class: "filter-select-modern small" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
        /** @type {__VLS_StyleScopedClasses['small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "all",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "0-3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "3-6",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "6-12",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "12+",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern search-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    /** @type {__VLS_StyleScopedClasses['search-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedIdCardSearch) },
        type: "text",
        value: (__VLS_ctx.idCardSearch),
        placeholder: "🔍 Search employee...",
        ...{ class: "filter-input-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input-modern']} */ ;
    if (__VLS_ctx.idCardView === 'missing') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employees-table-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-header" },
        });
        /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
        (__VLS_ctx.idCardData.missing?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
            id: "id-card-missing-table",
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [emp, idx] of __VLS_vFor((__VLS_ctx.idCardMissingList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.idCardView === 'missing'))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [idCardView, idCardView, idCardView, idCardData, idCardData, loadIdCardData, idCardAgeFilter, debouncedIdCardSearch, idCardSearch, idCardMissingList, viewEmployee,];
                    } },
                key: (emp.id),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.position);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.email);
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.idCardMissingList.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
    }
    if (__VLS_ctx.idCardView === 'submitted') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employees-table-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-header" },
        });
        /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
        (__VLS_ctx.idCardData.submitted?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
            id: "id-card-submitted-table",
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
        for (const [emp, idx] of __VLS_vFor((__VLS_ctx.idCardSubmittedList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.idCardView === 'submitted'))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [idCardView, idCardData, idCardMissingList, viewEmployee, idCardSubmittedList,];
                    } },
                key: (emp.id),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.position);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(emp.submittedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['age-badge', __VLS_ctx.getAgeClass(emp.monthsOld)]) },
            });
            /** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
            (emp.monthsOld);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: ([
                        'status-badge-modern',
                        __VLS_ctx.getStatusClass(emp.status),
                    ]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
            (__VLS_ctx.getStatusLabel(emp.status));
            // @ts-ignore
            [formatDate, getAgeClass, getStatusClass, getStatusLabel,];
        }
        if (__VLS_ctx.idCardSubmittedList.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "8",
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content-modern" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'cv') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-filters-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-filters-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toggle-switch-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeCvView('missing');
                // @ts-ignore
                [activeTab, idCardSubmittedList, changeCvView,];
            } },
        ...{ class: ({ active: __VLS_ctx.cvView === 'missing' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-count" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
    (__VLS_ctx.cvData.missing?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeCvView('submitted');
                // @ts-ignore
                [changeCvView, cvView, cvData,];
            } },
        ...{ class: ({ active: __VLS_ctx.cvView === 'submitted' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-count" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
    (__VLS_ctx.cvData.submitted?.length || 0);
    if (__VLS_ctx.cvView === 'submitted') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-group-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.loadCvData) },
            value: (__VLS_ctx.cvAgeFilter),
            ...{ class: "filter-select-modern small" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
        /** @type {__VLS_StyleScopedClasses['small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "all",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "0-3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "3-6",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "6-12",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "12+",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern search-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    /** @type {__VLS_StyleScopedClasses['search-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedCvSearch) },
        type: "text",
        value: (__VLS_ctx.cvSearch),
        placeholder: "🔍 Search employee...",
        ...{ class: "filter-input-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input-modern']} */ ;
    if (__VLS_ctx.cvView === 'missing') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employees-table-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-header" },
        });
        /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
        (__VLS_ctx.cvData.missing?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
            id: "cv-missing-table",
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [emp, idx] of __VLS_vFor((__VLS_ctx.cvMissingList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.cvView === 'missing'))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [viewEmployee, cvView, cvView, cvView, cvData, cvData, loadCvData, cvAgeFilter, debouncedCvSearch, cvSearch, cvMissingList,];
                    } },
                key: (emp.id),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.position);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.email);
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.cvMissingList.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
    }
    if (__VLS_ctx.cvView === 'submitted') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employees-table-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-header" },
        });
        /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
        (__VLS_ctx.cvData.submitted?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
            id: "cv-submitted-table",
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
        for (const [emp, idx] of __VLS_vFor((__VLS_ctx.cvSubmittedList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.cvView === 'submitted'))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [viewEmployee, cvView, cvData, cvMissingList, cvSubmittedList,];
                    } },
                key: (emp.id),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.position);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(emp.submittedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['age-badge', __VLS_ctx.getAgeClass(emp.monthsOld)]) },
            });
            /** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
            (emp.monthsOld);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: ([
                        'status-badge-modern',
                        __VLS_ctx.getStatusClass(emp.status),
                    ]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
            (__VLS_ctx.getStatusLabel(emp.status));
            // @ts-ignore
            [formatDate, getAgeClass, getStatusClass, getStatusLabel,];
        }
        if (__VLS_ctx.cvSubmittedList.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "8",
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content-modern" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'degree') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-filters-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-filters-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toggle-switch-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-switch-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeDegreeView('missing');
                // @ts-ignore
                [activeTab, cvSubmittedList, changeDegreeView,];
            } },
        ...{ class: ({ active: __VLS_ctx.degreeView === 'missing' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-count" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
    (__VLS_ctx.degreeData.missing?.length || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeDegreeView('submitted');
                // @ts-ignore
                [changeDegreeView, degreeView, degreeData,];
            } },
        ...{ class: ({ active: __VLS_ctx.degreeView === 'submitted' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toggle-count" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-count']} */ ;
    (__VLS_ctx.degreeData.submitted?.length || 0);
    if (__VLS_ctx.degreeView === 'submitted') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-group-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.loadDegreeData) },
            value: (__VLS_ctx.degreeAgeFilter),
            ...{ class: "filter-select-modern small" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
        /** @type {__VLS_StyleScopedClasses['small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "all",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "0-3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "3-6",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "6-12",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "12+",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern search-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    /** @type {__VLS_StyleScopedClasses['search-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedDegreeSearch) },
        type: "text",
        value: (__VLS_ctx.degreeSearch),
        placeholder: "🔍 Search employee...",
        ...{ class: "filter-input-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input-modern']} */ ;
    if (__VLS_ctx.degreeView === 'missing') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employees-table-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-header" },
        });
        /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
        (__VLS_ctx.degreeData.missing?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
            id: "degree-missing-table",
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [emp, idx] of __VLS_vFor((__VLS_ctx.degreeMissingList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.degreeView === 'missing'))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [viewEmployee, degreeView, degreeView, degreeView, degreeData, degreeData, loadDegreeData, degreeAgeFilter, debouncedDegreeSearch, degreeSearch, degreeMissingList,];
                    } },
                key: (emp.id),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.position);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.email);
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.degreeMissingList.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
    }
    if (__VLS_ctx.degreeView === 'submitted') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employees-table-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-header" },
        });
        /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
        (__VLS_ctx.degreeData.submitted?.length || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
            id: "degree-submitted-table",
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
        for (const [emp, idx] of __VLS_vFor((__VLS_ctx.degreeSubmittedList))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.degreeView === 'submitted'))
                            return;
                        __VLS_ctx.viewEmployee(emp.id);
                        // @ts-ignore
                        [viewEmployee, degreeView, degreeData, degreeMissingList, degreeSubmittedList,];
                    } },
                key: (emp.id),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "employee-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "employee-name" },
            });
            /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "dept-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
            (emp.department);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (emp.position);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(emp.submittedDate));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['age-badge', __VLS_ctx.getAgeClass(emp.monthsOld)]) },
            });
            /** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
            (emp.monthsOld);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: ([
                        'status-badge-modern',
                        __VLS_ctx.getStatusClass(emp.status),
                    ]) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
            (__VLS_ctx.getStatusLabel(emp.status));
            // @ts-ignore
            [formatDate, getAgeClass, getStatusClass, getStatusLabel,];
        }
        if (__VLS_ctx.degreeSubmittedList.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "8",
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content-modern" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'guarantee_letter') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-filters-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-filters-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "guarantee-filters-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['guarantee-filters-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeGuaranteeFilter('missing');
                // @ts-ignore
                [activeTab, degreeSubmittedList, changeGuaranteeFilter,];
            } },
        ...{ class: ({ active: __VLS_ctx.guaranteeFilter === 'missing' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot red" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['red']} */ ;
    (__VLS_ctx.guaranteeMissingCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeGuaranteeFilter('one');
                // @ts-ignore
                [changeGuaranteeFilter, guaranteeFilter, guaranteeMissingCount,];
            } },
        ...{ class: ({ active: __VLS_ctx.guaranteeFilter === 'one' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot orange" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['orange']} */ ;
    (__VLS_ctx.guaranteeNeedSecondCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeGuaranteeFilter('two');
                // @ts-ignore
                [changeGuaranteeFilter, guaranteeFilter, guaranteeNeedSecondCount,];
            } },
        ...{ class: ({ active: __VLS_ctx.guaranteeFilter === 'two' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot green" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    (__VLS_ctx.guaranteeWithTwoCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.changeGuaranteeFilter('all');
                // @ts-ignore
                [changeGuaranteeFilter, guaranteeFilter, guaranteeWithTwoCount,];
            } },
        ...{ class: ({ active: __VLS_ctx.guaranteeFilter === 'all' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot blue" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    (__VLS_ctx.guaranteeTotalCount);
    if (__VLS_ctx.guaranteeFilter !== 'missing') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-group-modern" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.applyGuaranteeFilters) },
            value: (__VLS_ctx.guaranteeAgeFilter),
            ...{ class: "filter-select-modern small" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select-modern']} */ ;
        /** @type {__VLS_StyleScopedClasses['small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "all",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "0-3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "3-6",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "6-12",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "12+",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group-modern search-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group-modern']} */ ;
    /** @type {__VLS_StyleScopedClasses['search-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.debouncedGuaranteeSearch) },
        type: "text",
        value: (__VLS_ctx.guaranteeSearch),
        placeholder: "🔍 Search employee...",
        ...{ class: "filter-input-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employees-table-modern" },
    });
    /** @type {__VLS_StyleScopedClasses['employees-table-modern']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-header" },
    });
    /** @type {__VLS_StyleScopedClasses['table-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['table-stats']} */ ;
    (__VLS_ctx.guaranteeTotalCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
        id: "guarantee-table",
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
    if (__VLS_ctx.guaranteeFilter !== 'missing') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    }
    if (__VLS_ctx.guaranteeFilter !== 'missing') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp, idx] of __VLS_vFor((__VLS_ctx.guaranteeList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, guaranteeFilter, guaranteeFilter, guaranteeFilter, guaranteeFilter, guaranteeTotalCount, guaranteeTotalCount, applyGuaranteeFilters, guaranteeAgeFilter, debouncedGuaranteeSearch, guaranteeSearch, guaranteeList,];
                } },
            key: (emp.id),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "employee-name" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-name']} */ ;
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "dept-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['dept-badge']} */ ;
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.position);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: ([
                    'guarantee-badge',
                    __VLS_ctx.getGuaranteeCountClass(emp.guaranteeCount),
                ]) },
        });
        /** @type {__VLS_StyleScopedClasses['guarantee-badge']} */ ;
        (emp.guaranteeCount);
        if (__VLS_ctx.guaranteeFilter !== 'missing') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatDate(emp.latestDate));
        }
        if (__VLS_ctx.guaranteeFilter !== 'missing') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['age-badge', __VLS_ctx.getAgeClass(emp.latestAge)]) },
            });
            /** @type {__VLS_StyleScopedClasses['age-badge']} */ ;
            (emp.latestAge || "N/A");
            (emp.latestAge ? "months" : "");
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: ([
                    'status-badge-modern',
                    __VLS_ctx.getGuaranteeStatusClass(emp),
                ]) },
        });
        /** @type {__VLS_StyleScopedClasses['status-badge-modern']} */ ;
        (__VLS_ctx.getGuaranteeStatusLabel(emp));
        // @ts-ignore
        [formatDate, getAgeClass, guaranteeFilter, guaranteeFilter, getGuaranteeCountClass, getGuaranteeStatusClass, getGuaranteeStatusLabel,];
    }
    if (__VLS_ctx.guaranteeList.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: (__VLS_ctx.guaranteeFilter !== 'missing' ? 9 : 7),
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    }
}
if (__VLS_ctx.showDepartmentModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDepartmentModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDepartmentModal))
                    return;
                __VLS_ctx.printModal('department');
                // @ts-ignore
                [guaranteeFilter, guaranteeList, showDepartmentModal, closeDepartmentModal, printModal,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDepartmentModal))
                    return;
                __VLS_ctx.saveModalAsCSV('department');
                // @ts-ignore
                [saveModalAsCSV,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDepartmentModal) },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
        id: "department-modal-content",
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-filter" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-filter']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.departmentFilter),
        placeholder: "Filter by department or employee...",
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp] of __VLS_vFor((__VLS_ctx.flattenedDepartmentEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showDepartmentModal))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, closeDepartmentModal, departmentFilter, flattenedDepartmentEmployees,];
                } },
            key: (emp.id),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.email);
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDepartmentModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showSalaryModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeSalaryModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSalaryModal))
                    return;
                __VLS_ctx.printModal('salary');
                // @ts-ignore
                [closeDepartmentModal, printModal, showSalaryModal, closeSalaryModal,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSalaryModal))
                    return;
                __VLS_ctx.saveModalAsCSV('salary');
                // @ts-ignore
                [saveModalAsCSV,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeSalaryModal) },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
        id: "salary-modal-content",
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    if (__VLS_ctx.salaryPagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showSalaryModal))
                        return;
                    if (!(__VLS_ctx.salaryPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeSalaryPage(__VLS_ctx.salaryPagination.page - 1);
                    // @ts-ignore
                    [closeSalaryModal, salaryPagination, salaryPagination, changeSalaryPage,];
                } },
            disabled: (!__VLS_ctx.salaryPagination.hasPrevPage),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.salaryPagination.page);
        (__VLS_ctx.salaryPagination.totalPages);
        (__VLS_ctx.salaryPagination.total);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showSalaryModal))
                        return;
                    if (!(__VLS_ctx.salaryPagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeSalaryPage(__VLS_ctx.salaryPagination.page + 1);
                    // @ts-ignore
                    [salaryPagination, salaryPagination, salaryPagination, salaryPagination, salaryPagination, changeSalaryPage,];
                } },
            disabled: (!__VLS_ctx.salaryPagination.hasNextPage),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [dept] of __VLS_vFor((__VLS_ctx.salaryByDepartment))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (dept.department_name),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (dept.department_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (dept.employee_count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatNumber(dept.avg_salary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatNumber(dept.min_salary));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatNumber(dept.max_salary));
        // @ts-ignore
        [formatNumber, formatNumber, formatNumber, salaryPagination, salaryByDepartment,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeSalaryModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showEmploymentTypeModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeEmploymentTypeModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showEmploymentTypeModal))
                    return;
                __VLS_ctx.printModal('employmentType');
                // @ts-ignore
                [printModal, closeSalaryModal, showEmploymentTypeModal, closeEmploymentTypeModal,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showEmploymentTypeModal))
                    return;
                __VLS_ctx.saveModalAsCSV('employmentType');
                // @ts-ignore
                [saveModalAsCSV,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeEmploymentTypeModal) },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
        id: "employment-type-modal-content",
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-filter" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-filter']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadEmploymentTypeEmployees) },
        value: (__VLS_ctx.employmentTypeFilterParam),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "all",
    });
    for (const [type] of __VLS_vFor((__VLS_ctx.employmentTypes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (type.type),
            value: (type.type),
        });
        (__VLS_ctx.getEmploymentTypeLabel(type.type));
        (type.count);
        // @ts-ignore
        [employmentTypes, getEmploymentTypeLabel, closeEmploymentTypeModal, loadEmploymentTypeEmployees, employmentTypeFilterParam,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.loadEmploymentTypeEmployees) },
        type: "text",
        value: (__VLS_ctx.employmentTypeSearchFilter),
        placeholder: "Filter by employee name, department, or email...",
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp] of __VLS_vFor((__VLS_ctx.paginatedEmploymentTypeEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showEmploymentTypeModal))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, loadEmploymentTypeEmployees, employmentTypeSearchFilter, paginatedEmploymentTypeEmployees,];
                } },
            key: (emp.id),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "type-badge" },
            ...{ style: ({
                    background: __VLS_ctx.getTypeColor(emp.type) + '20',
                    color: __VLS_ctx.getTypeColor(emp.type),
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['type-badge']} */ ;
        (__VLS_ctx.getEmploymentTypeLabel(emp.type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.email);
        // @ts-ignore
        [getEmploymentTypeLabel, getTypeColor, getTypeColor,];
    }
    if (__VLS_ctx.paginatedEmploymentTypeEmployees.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "4",
            ...{ class: "no-data-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data-cell']} */ ;
    }
    if (__VLS_ctx.employmentTypePagination.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showEmploymentTypeModal))
                        return;
                    if (!(__VLS_ctx.employmentTypePagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeEmploymentTypePage(__VLS_ctx.employmentTypePagination.page - 1);
                    // @ts-ignore
                    [paginatedEmploymentTypeEmployees, employmentTypePagination, employmentTypePagination, changeEmploymentTypePage,];
                } },
            disabled: (!__VLS_ctx.employmentTypePagination.hasPrevPage),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pagination-info" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
        (__VLS_ctx.employmentTypePagination.page);
        (__VLS_ctx.employmentTypePagination.totalPages);
        (__VLS_ctx.employmentTypePagination.total);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showEmploymentTypeModal))
                        return;
                    if (!(__VLS_ctx.employmentTypePagination.totalPages > 1))
                        return;
                    __VLS_ctx.changeEmploymentTypePage(__VLS_ctx.employmentTypePagination.page + 1);
                    // @ts-ignore
                    [employmentTypePagination, employmentTypePagination, employmentTypePagination, employmentTypePagination, employmentTypePagination, changeEmploymentTypePage,];
                } },
            disabled: (!__VLS_ctx.employmentTypePagination.hasNextPage),
            ...{ class: "pagination-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination-btn']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeEmploymentTypeModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showMissingDocsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeMissingDocsModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showMissingDocsModal))
                    return;
                __VLS_ctx.printModal('missingDocs');
                // @ts-ignore
                [printModal, closeEmploymentTypeModal, employmentTypePagination, showMissingDocsModal, closeMissingDocsModal,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showMissingDocsModal))
                    return;
                __VLS_ctx.saveModalAsCSV('missingDocs');
                // @ts-ignore
                [saveModalAsCSV,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeMissingDocsModal) },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
        id: "missing-docs-modal-content",
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-filter" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-filter']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.missingDocsFilter),
        placeholder: "Filter by employee or department...",
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [emp] of __VLS_vFor((__VLS_ctx.filteredMissingDocs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (emp.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMissingDocsModal))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, closeMissingDocsModal, missingDocsFilter, filteredMissingDocs,];
                } },
            ...{ style: {} },
        });
        (emp.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMissingDocsModal))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee,];
                } },
            ...{ style: {} },
        });
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "missing-list" },
        });
        /** @type {__VLS_StyleScopedClasses['missing-list']} */ ;
        (emp.missingList);
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeMissingDocsModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
if (__VLS_ctx.showHiringDetailsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeHiringDetailsModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-container large" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-subtitle']} */ ;
    if (__VLS_ctx.hiringFilters.departmentId !== 'all') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.getDepartmentName(__VLS_ctx.hiringFilters.departmentId));
    }
    (__VLS_ctx.getTimeRangeLabel(__VLS_ctx.hiringFilters.timeRange));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showHiringDetailsModal))
                    return;
                __VLS_ctx.printModal('hiringDetails');
                // @ts-ignore
                [hiringFilters, hiringFilters, hiringFilters, printModal, closeMissingDocsModal, showHiringDetailsModal, closeHiringDetailsModal, getDepartmentName, getTimeRangeLabel,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showHiringDetailsModal))
                    return;
                __VLS_ctx.saveModalAsCSV('hiringDetails');
                // @ts-ignore
                [saveModalAsCSV,];
            } },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeHiringDetailsModal) },
        ...{ class: "modal-action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
        id: "hiring-details-modal-content",
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-tabs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showHiringDetailsModal))
                    return;
                __VLS_ctx.activeHiringTab = 'hired';
                // @ts-ignore
                [closeHiringDetailsModal, activeHiringTab,];
            } },
        ...{ class: (['tab-btn', { active: __VLS_ctx.activeHiringTab === 'hired' }]) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
    (__VLS_ctx.hiredEmployeesList.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showHiringDetailsModal))
                    return;
                __VLS_ctx.activeHiringTab = 'terminated';
                // @ts-ignore
                [activeHiringTab, activeHiringTab, hiredEmployeesList,];
            } },
        ...{ class: (['tab-btn', { active: __VLS_ctx.activeHiringTab === 'terminated' }]) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
    (__VLS_ctx.terminatedEmployeesList.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showHiringDetailsModal))
                    return;
                __VLS_ctx.activeHiringTab = 'comparison';
                // @ts-ignore
                [activeHiringTab, activeHiringTab, terminatedEmployeesList,];
            } },
        ...{ class: (['tab-btn', { active: __VLS_ctx.activeHiringTab === 'comparison' }]) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeHiringTab === 'hired') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-filter" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-filter']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.hiredFilter),
        placeholder: "Filter by name, department, position, or email...",
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-stats']} */ ;
    (__VLS_ctx.filteredHiredEmployees.length);
    (__VLS_ctx.hiredEmployeesList.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
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
    for (const [emp, index] of __VLS_vFor((__VLS_ctx.filteredHiredEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showHiringDetailsModal))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, activeHiringTab, activeHiringTab, hiredEmployeesList, hiredFilter, filteredHiredEmployees, filteredHiredEmployees,];
                } },
            key: (emp.id),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (emp.full_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.position);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatDate(emp.hiredate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatNumber(emp.salary));
        // @ts-ignore
        [formatNumber, formatDate,];
    }
    if (__VLS_ctx.filteredHiredEmployees.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
            ...{ class: "no-data-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data-cell']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeHiringTab === 'terminated') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-filter" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-filter']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.terminatedFilter),
        placeholder: "Filter by name, department, position, or email...",
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-stats']} */ ;
    (__VLS_ctx.filteredTerminatedEmployees.length);
    (__VLS_ctx.terminatedEmployeesList.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
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
    for (const [emp, index] of __VLS_vFor((__VLS_ctx.filteredTerminatedEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showHiringDetailsModal))
                        return;
                    __VLS_ctx.viewEmployee(emp.id);
                    // @ts-ignore
                    [viewEmployee, activeHiringTab, terminatedEmployeesList, filteredHiredEmployees, terminatedFilter, filteredTerminatedEmployees, filteredTerminatedEmployees,];
                } },
            key: (emp.id),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employee-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['employee-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (emp.full_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.position);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatDate(emp.terminationdate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (emp.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatNumber(emp.salary));
        // @ts-ignore
        [formatNumber, formatDate,];
    }
    if (__VLS_ctx.filteredTerminatedEmployees.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "7",
            ...{ class: "no-data-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['no-data-cell']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeHiringTab === 'comparison') }, null, null);
    /** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comparison-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['comparison-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comparison-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['comparison-summary']} */ ;
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
    (__VLS_ctx.hiringStats.totalHired);
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
    (__VLS_ctx.hiringStats.totalTerminated);
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
    (__VLS_ctx.hiringStats.netGrowth >= 0 ? "+" : "");
    (__VLS_ctx.hiringStats.netGrowth);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "monthly-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['monthly-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "modal-table" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [month] of __VLS_vFor((__VLS_ctx.hiringChartData))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (month.month),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatMonth(month.month));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "hired-count" },
        });
        /** @type {__VLS_StyleScopedClasses['hired-count']} */ ;
        (month.hired);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "terminated-count" },
        });
        /** @type {__VLS_StyleScopedClasses['terminated-count']} */ ;
        (month.terminated);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: (month.netChange >= 0 ? 'positive' : 'negative') },
        });
        (month.netChange >= 0 ? "+" : "");
        (month.netChange);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "turnover-badge" },
            ...{ class: (__VLS_ctx.getTurnoverClass(month)) },
        });
        /** @type {__VLS_StyleScopedClasses['turnover-badge']} */ ;
        (__VLS_ctx.calculateTurnoverRate(month));
        // @ts-ignore
        [hiringStats, hiringStats, hiringStats, hiringStats, hiringStats, hiringChartData, activeHiringTab, filteredTerminatedEmployees, formatMonth, getTurnoverClass, calculateTurnoverRate,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeHiringDetailsModal) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
// @ts-ignore
[closeHiringDetailsModal,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
