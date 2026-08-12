import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
// State
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
const toastIcon = ref("✅");
const selectedMonth = ref("2026-05");
// Available months
const availableMonths = ref([
    { value: "2026-01", name: "January 2026" },
    { value: "2026-02", name: "February 2026" },
    { value: "2026-03", name: "March 2026" },
    { value: "2026-04", name: "April 2026" },
    { value: "2026-05", name: "May 2026" },
    { value: "2026-06", name: "June 2026" },
]);
// ==================== DEPARTMENT ANALYTICS DATA ====================
const topOTDepartments = ref([
    { rank: 1, name: "IT", hours: 245, percentage: 100 },
    { rank: 2, name: "Operations", hours: 189, percentage: 77 },
    { rank: 3, name: "Finance", hours: 156, percentage: 64 },
    { rank: 4, name: "Sales", hours: 98, percentage: 40 },
    { rank: 5, name: "HR", hours: 67, percentage: 27 },
    { rank: 6, name: "Marketing", hours: 45, percentage: 18 },
    { rank: 7, name: "Customer Support", hours: 34, percentage: 14 },
]);
const topAbsentDepartments = ref([
    { rank: 1, name: "Operations", days: 45, percentage: 100 },
    { rank: 2, name: "IT", days: 38, percentage: 84 },
    { rank: 3, name: "Finance", days: 28, percentage: 62 },
    { rank: 4, name: "Sales", days: 22, percentage: 49 },
    { rank: 5, name: "HR", days: 15, percentage: 33 },
    { rank: 6, name: "Marketing", days: 12, percentage: 27 },
    { rank: 7, name: "Customer Support", days: 8, percentage: 18 },
]);
const topLeaveDepartments = ref([
    { rank: 1, name: "IT", days: 98, percentage: 100 },
    { rank: 2, name: "Finance", days: 76, percentage: 78 },
    { rank: 3, name: "Operations", days: 65, percentage: 66 },
    { rank: 4, name: "HR", days: 42, percentage: 43 },
    { rank: 5, name: "Sales", days: 38, percentage: 39 },
    { rank: 6, name: "Marketing", days: 28, percentage: 29 },
    { rank: 7, name: "Customer Support", days: 22, percentage: 22 },
]);
const topLateDepartments = ref([
    { rank: 1, name: "IT", count: 45, percentage: 100 },
    { rank: 2, name: "Sales", count: 32, percentage: 71 },
    { rank: 3, name: "Finance", count: 28, percentage: 62 },
    { rank: 4, name: "Operations", count: 24, percentage: 53 },
    { rank: 5, name: "HR", count: 12, percentage: 27 },
    { rank: 6, name: "Marketing", count: 10, percentage: 22 },
    { rank: 7, name: "Customer Support", count: 6, percentage: 13 },
]);
const deptLeaveStats = ref([
    {
        name: "IT",
        leaveDays: 98,
        percentage: 98,
        color: "#3b82f6",
        employeeCount: 45,
    },
    {
        name: "Finance",
        leaveDays: 76,
        percentage: 76,
        color: "#10b981",
        employeeCount: 32,
    },
    {
        name: "Operations",
        leaveDays: 65,
        percentage: 65,
        color: "#f59e0b",
        employeeCount: 38,
    },
    {
        name: "HR",
        leaveDays: 42,
        percentage: 42,
        color: "#ef4444",
        employeeCount: 15,
    },
    {
        name: "Sales",
        leaveDays: 38,
        percentage: 38,
        color: "#8b5cf6",
        employeeCount: 26,
    },
    {
        name: "Marketing",
        leaveDays: 31,
        percentage: 31,
        color: "#ec4899",
        employeeCount: 18,
    },
    {
        name: "Customer Support",
        leaveDays: 25,
        percentage: 25,
        color: "#06b6d4",
        employeeCount: 22,
    },
]);
const overdueReturnsList = ref([
    {
        id: 1,
        employeeName: "Tamrat Zerihun",
        leaveType: "Annual Leave",
        expectedReturn: "2026-05-18",
        daysOverdue: 3,
    },
    {
        id: 2,
        employeeName: "Nuru Seid",
        leaveType: "Sick Leave",
        expectedReturn: "2026-05-19",
        daysOverdue: 2,
    },
    {
        id: 3,
        employeeName: "Tadese Jemberu",
        leaveType: "Bereavement Leave",
        expectedReturn: "2026-05-20",
        daysOverdue: 1,
    },
    {
        id: 4,
        employeeName: "Melkamu Zewdu",
        leaveType: "Maternity Leave",
        expectedReturn: "2026-05-15",
        daysOverdue: 6,
    },
    {
        id: 5,
        employeeName: "Biruk Mulualem",
        leaveType: "Annual Leave",
        expectedReturn: "2026-05-10",
        daysOverdue: 11,
    },
]);
const todayLeaves = ref([
    {
        leaveRequestId: 1,
        employeeName: "Biruk Mulualem",
        leaveType: "Annual Leave",
        returnDate: "2026-05-25",
    },
    {
        leaveRequestId: 2,
        employeeName: "Melkamu Zewdu",
        leaveType: "Maternity Leave",
        returnDate: "2026-07-20",
    },
    {
        leaveRequestId: 3,
        employeeName: "Dagmawi Hadgu",
        leaveType: "Sick Leave",
        returnDate: "2026-05-22",
    },
    {
        leaveRequestId: 4,
        employeeName: "Nuru Seid",
        leaveType: "Annual Leave",
        returnDate: "2026-05-28",
    },
    {
        leaveRequestId: 5,
        employeeName: "Eshete Worke",
        leaveType: "Sick Leave",
        returnDate: "2026-05-23",
    },
    {
        leaveRequestId: 6,
        employeeName: "Haymanot Abebaw",
        leaveType: "Annual Leave",
        returnDate: "2026-06-01",
    },
    {
        leaveRequestId: 7,
        employeeName: "Tigist Mulugeta",
        leaveType: "Sick Leave",
        returnDate: "2026-05-24",
    },
]);
const upcomingLeaves = ref([
    {
        leaveRequestId: 6,
        employeeName: "Dagmawi Hadgu",
        leaveType: "Annual Leave",
        totalDays: 5,
        startDate: "2026-05-28",
    },
    {
        leaveRequestId: 7,
        employeeName: "Melaku Tewodros",
        leaveType: "Sick Leave",
        totalDays: 3,
        startDate: "2026-05-30",
    },
    {
        leaveRequestId: 8,
        employeeName: "Tamrat Zerihun",
        leaveType: "Annual Leave",
        totalDays: 7,
        startDate: "2026-06-01",
    },
    {
        leaveRequestId: 9,
        employeeName: "Tadese Jemberu",
        leaveType: "Bereavement Leave",
        totalDays: 3,
        startDate: "2026-05-29",
    },
    {
        leaveRequestId: 10,
        employeeName: "Nuru Seid",
        leaveType: "Annual Leave",
        totalDays: 4,
        startDate: "2026-06-03",
    },
    {
        leaveRequestId: 11,
        employeeName: "Eshete Worke",
        leaveType: "Sick Leave",
        totalDays: 2,
        startDate: "2026-06-02",
    },
]);
const pendingLeaves = ref([
    {
        leaveRequestId: 10,
        employeeName: "Tamrat Zerihun",
        leaveType: "Annual Leave",
        totalDays: 3,
        requestedDate: "2026-05-20",
    },
    {
        leaveRequestId: 11,
        employeeName: "Nuru Seid",
        leaveType: "Sick Leave",
        totalDays: 2,
        requestedDate: "2026-05-21",
    },
    {
        leaveRequestId: 12,
        employeeName: "Eshete Worke",
        leaveType: "Annual Leave",
        totalDays: 4,
        requestedDate: "2026-05-19",
    },
    {
        leaveRequestId: 13,
        employeeName: "Tigist Mulugeta",
        leaveType: "Sick Leave",
        totalDays: 1,
        requestedDate: "2026-05-22",
    },
    {
        leaveRequestId: 14,
        employeeName: "Melaku Tewodros",
        leaveType: "Annual Leave",
        totalDays: 5,
        requestedDate: "2026-05-18",
    },
]);
const recentActivities = ref([
    {
        id: 1,
        icon: "✅",
        text: "Biruk Mulualem marked present",
        time: "10 min ago",
    },
    {
        id: 2,
        icon: "⏰",
        text: "Dagmawi Hadgu was late by 15 minutes",
        time: "1 hour ago",
    },
    {
        id: 3,
        icon: "✅",
        text: "Leave request approved for Melkamu Zewdu",
        time: "2 hours ago",
    },
    {
        id: 4,
        icon: "📝",
        text: "New leave request from Nuru Seid",
        time: "3 hours ago",
    },
    {
        id: 5,
        icon: "📊",
        text: "Attendance report generated for April",
        time: "Yesterday",
    },
    {
        id: 6,
        icon: "⚠️",
        text: "Overdue return notice sent to Tamrat Zerihun",
        time: "Yesterday",
    },
    {
        id: 7,
        icon: "✅",
        text: "Tadese Jemberu marked present",
        time: "Yesterday",
    },
]);
const topLateEmployees = ref([
    {
        id: 1,
        name: "Tamrat Zerihun",
        department: "IT",
        lateCount: 12,
        totalLateMinutes: 245,
    },
    {
        id: 2,
        name: "Nuru Seid",
        department: "Finance",
        lateCount: 10,
        totalLateMinutes: 189,
    },
    {
        id: 3,
        name: "Tadese Jemberu",
        department: "Operations",
        lateCount: 9,
        totalLateMinutes: 156,
    },
    {
        id: 4,
        name: "Eshete Worke",
        department: "IT",
        lateCount: 8,
        totalLateMinutes: 142,
    },
    {
        id: 5,
        name: "Haymanot Abebaw",
        department: "HR",
        lateCount: 7,
        totalLateMinutes: 98,
    },
    {
        id: 6,
        name: "Melaku Tewodros",
        department: "Sales",
        lateCount: 6,
        totalLateMinutes: 87,
    },
]);
const topAbsentEmployees = ref([
    {
        id: 1,
        name: "Melkamu Zewdu",
        department: "Operations",
        absentDays: 8,
        absentPercent: 36,
    },
    {
        id: 2,
        name: "Nuru Seid",
        department: "Finance",
        absentDays: 7,
        absentPercent: 32,
    },
    {
        id: 3,
        name: "Tadese Jemberu",
        department: "Operations",
        absentDays: 6,
        absentPercent: 27,
    },
    {
        id: 4,
        name: "Tamrat Zerihun",
        department: "IT",
        absentDays: 6,
        absentPercent: 27,
    },
    {
        id: 5,
        name: "Haymanot Abebaw",
        department: "HR",
        absentDays: 5,
        absentPercent: 23,
    },
    {
        id: 6,
        name: "Tigist Mulugeta",
        department: "Marketing",
        absentDays: 4,
        absentPercent: 18,
    },
]);
const stats = ref({
    totalEmployees: 180,
    avgAttendanceRate: 91,
    totalPresentDays: 2845,
    onLeaveToday: 5,
    pendingRequests: 5,
    overdueReturns: 5,
    approvedLeaves: 48,
    monthlyAttendanceRate: 91,
    attendanceTrend: 2.5,
    totalLeaveDaysThisMonth: 312,
    avgLeavePerEmployee: 5.2,
    departmentsWithLeave: 6,
    totalDepartments: 7,
    avgAvailableLeave: 12.5,
    lowBalanceCount: 22,
    totalOvertimeHours: 189,
    employeesWithOT: 48,
    highAbsenceCount: 8,
    thisMonthRequests: 32,
    requestsTrend: 6,
    frequentLateCount: 12,
    monthName: "May 2026",
});
// Helper Functions
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
function getDayOfMonth(date) {
    return new Date(date).getDate();
}
function getMonthAbbr(date) {
    return new Date(date).toLocaleDateString("en-US", { month: "short" });
}
function getInitials(name) {
    if (!name)
        return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
function goToAttendance() {
    router.push("/attendance");
}
function goToLeaves() {
    router.push("/leaves");
}
function markAsReturned(item) {
    overdueReturnsList.value = overdueReturnsList.value.filter((i) => i.id !== item.id);
    stats.value.overdueReturns = overdueReturnsList.value.length;
    showToastMessage(`${item.employeeName} marked as returned`, "success");
}
function quickApprove(request) {
    showToastMessage(`Leave approved for ${request.employeeName}`, "success");
    pendingLeaves.value = pendingLeaves.value.filter((r) => r.leaveRequestId !== request.leaveRequestId);
    stats.value.pendingRequests = pendingLeaves.value.length;
}
function quickReject(request) {
    showToastMessage(`Leave rejected for ${request.employeeName}`, "warning");
    pendingLeaves.value = pendingLeaves.value.filter((r) => r.leaveRequestId !== request.leaveRequestId);
    stats.value.pendingRequests = pendingLeaves.value.length;
}
function loadRecentActivity() {
    showToastMessage("Activity feed refreshed", "success");
    recentActivities.value.unshift({
        id: Date.now(),
        icon: "🔄",
        text: "Dashboard refreshed by HR Admin",
        time: "Just now",
    });
    if (recentActivities.value.length > 12) {
        recentActivities.value = recentActivities.value.slice(0, 12);
    }
}
function refreshData() {
    const monthNames = {
        "2026-01": "January 2026",
        "2026-02": "February 2026",
        "2026-03": "March 2026",
        "2026-04": "April 2026",
        "2026-05": "May 2026",
        "2026-06": "June 2026",
    };
    stats.value.monthName = monthNames[selectedMonth.value];
    showToastMessage(`Data refreshed for ${stats.value.monthName}`, "success");
}
function showToastMessage(message, type = "success") {
    toastMessage.value = message;
    toastType.value = type;
    toastIcon.value =
        type === "success"
            ? "✅"
            : type === "error"
                ? "❌"
                : type === "warning"
                    ? "⚠️"
                    : "ℹ️";
    showToast.value = true;
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
}
onMounted(() => {
    console.log("HR Dashboard loaded");
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-header']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-list']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-list']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-list']} */ ;
/** @type {__VLS_StyleScopedClasses['distribution-item-horizontal']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['hr-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-full-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['top-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "hr-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['hr-dashboard']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "dashboard-header" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-left" },
});
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
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
(__VLS_ctx.formatDate(new Date()));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.refreshData) },
    value: (__VLS_ctx.selectedMonth),
    ...{ class: "month-selector" },
});
/** @type {__VLS_StyleScopedClasses['month-selector']} */ ;
for (const [m] of __VLS_vFor((__VLS_ctx.availableMonths))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (m.value),
        value: (m.value),
    });
    (m.name);
    // @ts-ignore
    [formatDate, refreshData, selectedMonth, availableMonths,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-grid" },
});
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.goToAttendance) },
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.totalEmployees);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.goToAttendance) },
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.avgAttendanceRate);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-sub" },
});
/** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
(__VLS_ctx.stats.monthName);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.goToAttendance) },
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.totalPresentDays);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-sub" },
});
/** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.goToLeaves) },
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.onLeaveToday);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-sub" },
});
/** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
(__VLS_ctx.stats.approvedLeaves);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.goToLeaves) },
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.pendingRequests);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-sub" },
});
/** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.overdueReturns);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-sub" },
});
/** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-grid" },
});
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-icon green" },
});
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-content" },
});
/** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.stats.monthlyAttendanceRate);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-trend positive" },
});
/** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
(__VLS_ctx.stats.attendanceTrend);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-icon orange" },
});
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-content" },
});
/** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.stats.totalLeaveDaysThisMonth);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-trend" },
});
/** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
(__VLS_ctx.stats.avgLeavePerEmployee);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-icon purple" },
});
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-content" },
});
/** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.stats.departmentsWithLeave);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-trend" },
});
/** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
(__VLS_ctx.stats.totalDepartments);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-icon blue" },
});
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-content" },
});
/** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
(__VLS_ctx.stats.avgAvailableLeave);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-trend warning" },
});
/** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
(__VLS_ctx.stats.lowBalanceCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dept-analytics-full" },
});
/** @type {__VLS_StyleScopedClasses['dept-analytics-full']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-grid" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-header" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "analytics-full-icon" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-list scrollable-content" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-content']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.topOTDepartments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "analytics-full-item" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-rank" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-rank']} */ ;
    (dept.rank);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-name" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-name']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-fill" },
        ...{ style: ({
                width: dept.percentage + '%',
                background: '#10b981',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-value" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-value']} */ ;
    (dept.hours);
    // @ts-ignore
    [goToAttendance, goToAttendance, goToAttendance, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, stats, goToLeaves, goToLeaves, topOTDepartments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-header" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "analytics-full-icon" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-list scrollable-content" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-content']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.topAbsentDepartments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "analytics-full-item" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-rank" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-rank']} */ ;
    (dept.rank);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-name" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-name']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-fill" },
        ...{ style: ({
                width: dept.percentage + '%',
                background: '#ef4444',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-value" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-value']} */ ;
    (dept.days);
    // @ts-ignore
    [topAbsentDepartments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-header" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "analytics-full-icon" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-list scrollable-content" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-content']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.topLeaveDepartments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "analytics-full-item" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-rank" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-rank']} */ ;
    (dept.rank);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-name" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-name']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-fill" },
        ...{ style: ({
                width: dept.percentage + '%',
                background: '#f59e0b',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-value" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-value']} */ ;
    (dept.days);
    // @ts-ignore
    [topLeaveDepartments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-header" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "analytics-full-icon" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-full-list scrollable-content" },
});
/** @type {__VLS_StyleScopedClasses['analytics-full-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-content']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.topLateDepartments))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "analytics-full-item" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-rank" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-rank']} */ ;
    (dept.rank);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-name" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-name']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-fill" },
        ...{ style: ({
                width: dept.percentage + '%',
                background: '#8b5cf6',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-full-value" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-full-value']} */ ;
    (dept.count);
    // @ts-ignore
    [topLateDepartments,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dept-distribution-full" },
});
/** @type {__VLS_StyleScopedClasses['dept-distribution-full']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-header" },
});
/** @type {__VLS_StyleScopedClasses['distribution-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/approved-leaves",
    ...{ class: "view-link" },
}));
const __VLS_2 = __VLS_1({
    to: "/approved-leaves",
    ...{ class: "view-link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
// @ts-ignore
[];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "distribution-list scrollable-distribution" },
});
/** @type {__VLS_StyleScopedClasses['distribution-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scrollable-distribution']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.deptLeaveStats))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "distribution-item-horizontal" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-item-horizontal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "distribution-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "distribution-name" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-name']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "distribution-stats-text" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-stats-text']} */ ;
    (dept.leaveDays);
    (dept.employeeCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "distribution-bar-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-bar-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "distribution-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "distribution-fill" },
        ...{ style: ({
                width: dept.percentage + '%',
                background: dept.color,
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "distribution-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['distribution-percent']} */ ;
    (dept.percentage);
    // @ts-ignore
    [deptLeaveStats,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "two-column-layout" },
});
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "left-column" },
});
/** @type {__VLS_StyleScopedClasses['left-column']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card overdue-section" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['overdue-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "badge danger" },
});
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
(__VLS_ctx.overdueReturnsList.length);
if (__VLS_ctx.overdueReturnsList.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scrollable-list" },
    });
    /** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
    for (const [item] of __VLS_vFor((__VLS_ctx.overdueReturnsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (item.id),
            ...{ class: "list-item overdue-item" },
        });
        /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['overdue-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-avatar overdue-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
        /** @type {__VLS_StyleScopedClasses['overdue-avatar']} */ ;
        (__VLS_ctx.getInitials(item.employeeName));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-info" },
        });
        /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-name" },
        });
        /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
        (item.employeeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
        (item.leaveType);
        (__VLS_ctx.formatDate(item.expectedReturn));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overdue-days" },
        });
        /** @type {__VLS_StyleScopedClasses['overdue-days']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "days-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['days-badge']} */ ;
        (item.daysOverdue);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.overdueReturnsList.length > 0))
                        return;
                    __VLS_ctx.markAsReturned(item);
                    // @ts-ignore
                    [formatDate, overdueReturnsList, overdueReturnsList, overdueReturnsList, getInitials, markAsReturned,];
                } },
            ...{ class: "btn-small warning" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        /** @type {__VLS_StyleScopedClasses['warning']} */ ;
        // @ts-ignore
        [];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state-small" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    to: "/approved-leaves",
    ...{ class: "view-link" },
}));
const __VLS_8 = __VLS_7({
    to: "/approved-leaves",
    ...{ class: "view-link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
// @ts-ignore
[];
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scrollable-list" },
});
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
for (const [leave] of __VLS_vFor((__VLS_ctx.todayLeaves))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (leave.leaveRequestId),
        ...{ class: "list-item" },
    });
    /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
    (__VLS_ctx.getInitials(leave.employeeName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-info" },
    });
    /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-name" },
    });
    /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
    (leave.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
    (leave.leaveType);
    (__VLS_ctx.formatDate(leave.returnDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-status" },
    });
    /** @type {__VLS_StyleScopedClasses['list-status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-badge on-leave" },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['on-leave']} */ ;
    // @ts-ignore
    [formatDate, getInitials, todayLeaves,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
let __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    to: "/approved-leaves",
    ...{ class: "view-link" },
}));
const __VLS_14 = __VLS_13({
    to: "/approved-leaves",
    ...{ class: "view-link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
const { default: __VLS_17 } = __VLS_15.slots;
// @ts-ignore
[];
var __VLS_15;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scrollable-list" },
});
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
for (const [leave] of __VLS_vFor((__VLS_ctx.upcomingLeaves))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (leave.leaveRequestId),
        ...{ class: "list-item" },
    });
    /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "upcoming-date" },
    });
    /** @type {__VLS_StyleScopedClasses['upcoming-date']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-day" },
    });
    /** @type {__VLS_StyleScopedClasses['date-day']} */ ;
    (__VLS_ctx.getDayOfMonth(leave.startDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "date-month" },
    });
    /** @type {__VLS_StyleScopedClasses['date-month']} */ ;
    (__VLS_ctx.getMonthAbbr(leave.startDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-avatar-small" },
    });
    /** @type {__VLS_StyleScopedClasses['list-avatar-small']} */ ;
    (__VLS_ctx.getInitials(leave.employeeName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-info" },
    });
    /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-name" },
    });
    /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
    (leave.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
    (leave.leaveType);
    (leave.totalDays);
    // @ts-ignore
    [getInitials, upcomingLeaves, getDayOfMonth, getMonthAbbr,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "right-column" },
});
/** @type {__VLS_StyleScopedClasses['right-column']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
let __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    to: "/leaves",
    ...{ class: "view-link" },
}));
const __VLS_20 = __VLS_19({
    to: "/leaves",
    ...{ class: "view-link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
const { default: __VLS_23 } = __VLS_21.slots;
// @ts-ignore
[];
var __VLS_21;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scrollable-list" },
});
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
for (const [request] of __VLS_vFor((__VLS_ctx.pendingLeaves))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (request.leaveRequestId),
        ...{ class: "list-item" },
    });
    /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
    (__VLS_ctx.getInitials(request.employeeName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-info" },
    });
    /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-name" },
    });
    /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
    (request.employeeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
    (request.leaveType);
    (request.totalDays);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-date" },
    });
    /** @type {__VLS_StyleScopedClasses['list-date']} */ ;
    (__VLS_ctx.formatDate(request.requestedDate));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['list-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.quickApprove(request);
                // @ts-ignore
                [formatDate, getInitials, pendingLeaves, quickApprove,];
            } },
        ...{ class: "btn-small success" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.quickReject(request);
                // @ts-ignore
                [quickReject,];
            } },
        ...{ class: "btn-small danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.stats.monthName);
let __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    to: "/attendance",
    ...{ class: "view-link" },
}));
const __VLS_26 = __VLS_25({
    to: "/attendance",
    ...{ class: "view-link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
const { default: __VLS_29 } = __VLS_27.slots;
// @ts-ignore
[stats,];
var __VLS_27;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scrollable-list" },
});
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
for (const [emp, idx] of __VLS_vFor((__VLS_ctx.topLateEmployees))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (emp.id),
        ...{ class: "list-item" },
    });
    /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "top-rank" },
    });
    /** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
    (idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
    (__VLS_ctx.getInitials(emp.name));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-info" },
    });
    /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-name" },
    });
    /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
    (emp.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
    (emp.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "top-value" },
    });
    /** @type {__VLS_StyleScopedClasses['top-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "late-count" },
    });
    /** @type {__VLS_StyleScopedClasses['late-count']} */ ;
    (emp.lateCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "late-minutes" },
    });
    /** @type {__VLS_StyleScopedClasses['late-minutes']} */ ;
    (emp.totalLateMinutes);
    // @ts-ignore
    [getInitials, topLateEmployees,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-card" },
});
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.stats.monthName);
let __VLS_30;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    to: "/attendance",
    ...{ class: "view-link" },
}));
const __VLS_32 = __VLS_31({
    to: "/attendance",
    ...{ class: "view-link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
const { default: __VLS_35 } = __VLS_33.slots;
// @ts-ignore
[stats,];
var __VLS_33;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scrollable-list" },
});
/** @type {__VLS_StyleScopedClasses['scrollable-list']} */ ;
for (const [emp, idx] of __VLS_vFor((__VLS_ctx.topAbsentEmployees))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (emp.id),
        ...{ class: "list-item" },
    });
    /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "top-rank" },
    });
    /** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
    (idx + 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
    (__VLS_ctx.getInitials(emp.name));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-info" },
    });
    /** @type {__VLS_StyleScopedClasses['list-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-name" },
    });
    /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
    (emp.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['list-detail']} */ ;
    (emp.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "top-value absent" },
    });
    /** @type {__VLS_StyleScopedClasses['top-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['absent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absent-count" },
    });
    /** @type {__VLS_StyleScopedClasses['absent-count']} */ ;
    (emp.absentDays);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absent-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['absent-percent']} */ ;
    (emp.absentPercent);
    // @ts-ignore
    [getInitials, topAbsentEmployees,];
}
if (__VLS_ctx.showToast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toastType) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
    (__VLS_ctx.toastIcon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-message" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
    (__VLS_ctx.toastMessage);
}
// @ts-ignore
[showToast, toastType, toastIcon, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
