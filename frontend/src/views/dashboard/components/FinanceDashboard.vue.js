import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
const router = useRouter();
// State
const loading = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const toastIcon = ref('✅');
const selectedMonth = ref('2026-05');
const trendYear = ref(2026);
let compositionChart = null;
let netPayChart = null;
const payrollCompositionChart = ref(null);
const netPayDeductionsChart = ref(null);
const availableMonths = ref([
    { value: '2026-01', name: 'January 2026' },
    { value: '2026-02', name: 'February 2026' },
    { value: '2026-03', name: 'March 2026' },
    { value: '2026-04', name: 'April 2026' },
    { value: '2026-05', name: 'May 2026' },
    { value: '2026-06', name: 'June 2026' }
]);
const selectedMonthName = computed(() => {
    const month = availableMonths.value.find(m => m.value === selectedMonth.value);
    return month ? month.name : selectedMonth.value;
});
// Employee Stats
const employeeStats = ref({
    total: 180,
    active: 156,
    newHires: 5,
    terminations: 3
});
// Attendance Stats
const attendanceStats = ref({
    avgAttendanceRate: 91,
    totalAbsentDays: 42,
    lateCount: 28
});
// Payroll Stats
const payrollStats = ref({
    totalGrossPay: 3425000,
    totalNetPay: 2850000,
    totalTax: 275000,
    totalPension7: 210000,
    totalPension11: 330000,
    totalPenalties: 45000,
    employeesWithPenalties: 12,
    employeesOnHold: 5,
    holdAmount: 125000
});
// Payroll Composition Data
const payrollComposition = ref({
    basicSalary: 2226250,
    allowances: 685000,
    overtime: 274000,
    bonuses: 239750,
    total: 3425000
});
// Monthly Net Pay vs Deductions Data
const monthlyNetPayData = ref({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    netPay: [2350000, 2380000, 2420000, 2450000, 2480000, 2520000, 2550000, 2580000, 2620000, 2650000, 2680000, 2720000],
    deductions: [500000, 520000, 530000, 540000, 550000, 560000, 570000, 580000, 590000, 600000, 610000, 620000]
});
// Computed values for summary stats
const averageNetPay = computed(() => {
    const sum = monthlyNetPayData.value.netPay.reduce((a, b) => a + b, 0);
    return Math.round(sum / monthlyNetPayData.value.netPay.length);
});
const averageDeductions = computed(() => {
    const sum = monthlyNetPayData.value.deductions.reduce((a, b) => a + b, 0);
    return Math.round(sum / monthlyNetPayData.value.deductions.length);
});
const netPayRatio = computed(() => {
    const totalNet = monthlyNetPayData.value.netPay.reduce((a, b) => a + b, 0);
    const totalDeductions = monthlyNetPayData.value.deductions.reduce((a, b) => a + b, 0);
    const totalGross = totalNet + totalDeductions;
    return Math.round((totalNet / totalGross) * 100);
});
const netPayGrowth = computed(() => {
    const firstHalf = monthlyNetPayData.value.netPay.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const secondHalf = monthlyNetPayData.value.netPay.slice(6).reduce((a, b) => a + b, 0) / 6;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
});
const deductionsGrowth = computed(() => {
    const firstHalf = monthlyNetPayData.value.deductions.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const secondHalf = monthlyNetPayData.value.deductions.slice(6).reduce((a, b) => a + b, 0) / 6;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
});
// Department Payroll
const departmentPayroll = ref([
    { rank: 1, name: 'IT', employeeCount: 45, totalPayroll: 1125000, percentage: 100 },
    { rank: 2, name: 'Operations', employeeCount: 38, totalPayroll: 950000, percentage: 84 },
    { rank: 3, name: 'Finance', employeeCount: 32, totalPayroll: 800000, percentage: 71 },
    { rank: 4, name: 'Sales', employeeCount: 26, totalPayroll: 650000, percentage: 58 },
    { rank: 5, name: 'HR', employeeCount: 15, totalPayroll: 375000, percentage: 33 },
    { rank: 6, name: 'Marketing', employeeCount: 18, totalPayroll: 450000, percentage: 40 }
]);
// Department Attendance
const departmentAttendance = ref([
    { rank: 1, name: 'HR', attendanceRate: 95, absentDays: 8 },
    { rank: 2, name: 'Finance', attendanceRate: 92, absentDays: 12 },
    { rank: 3, name: 'IT', attendanceRate: 89, absentDays: 22 },
    { rank: 4, name: 'Marketing', attendanceRate: 87, absentDays: 18 },
    { rank: 5, name: 'Sales', attendanceRate: 84, absentDays: 20 },
    { rank: 6, name: 'Operations', attendanceRate: 82, absentDays: 28 }
]);
// Payment Status
const paymentStatus = ref({
    paid: 145,
    paidPercent: 80,
    pending: 12,
    pendingPercent: 7,
    unclaimed: 8,
    unclaimedPercent: 4,
    returned: 5,
    returnedPercent: 3
});
// Top Lists
const highestPaid = ref([
    { id: 1, name: 'Biruk Mulualem', position: 'Senior Developer', department: 'IT', salary: 35000 },
    { id: 2, name: 'Melaku Tewodros', position: 'Finance Manager', department: 'Finance', salary: 32000 },
    { id: 3, name: 'Haymanot Abebaw', position: 'HR Manager', department: 'HR', salary: 30000 },
    { id: 4, name: 'Melkamu Zewdu', position: 'Operations Manager', department: 'Operations', salary: 28000 },
    { id: 5, name: 'Dagmawi Hadgu', position: 'Team Lead', department: 'IT', salary: 27000 }
]);
const mostAbsent = ref([
    { id: 1, name: 'Melkamu Zewdu', department: 'Operations', absentDays: 8, penalty: 8000 },
    { id: 2, name: 'Nuru Seid', department: 'Finance', absentDays: 7, penalty: 7000 },
    { id: 3, name: 'Tadese Jemberu', department: 'Operations', absentDays: 6, penalty: 6000 },
    { id: 4, name: 'Tamrat Zerihun', department: 'IT', absentDays: 5, penalty: 5000 },
    { id: 5, name: 'Eshete Worke', department: 'IT', absentDays: 4, penalty: 4000 }
]);
const mostLate = ref([
    { id: 1, name: 'Tamrat Zerihun', department: 'IT', lateMinutes: 245, lateCount: 12 },
    { id: 2, name: 'Nuru Seid', department: 'Finance', lateMinutes: 189, lateCount: 10 },
    { id: 3, name: 'Tadese Jemberu', department: 'Operations', lateMinutes: 156, lateCount: 9 },
    { id: 4, name: 'Eshete Worke', department: 'IT', lateMinutes: 142, lateCount: 8 },
    { id: 5, name: 'Haymanot Abebaw', department: 'HR', lateMinutes: 98, lateCount: 7 }
]);
const onHoldEmployees = ref([
    { id: 1, name: 'Biruk Mulualem', department: 'IT', position: 'Senior Developer', amount: 25000, holdReason: 'Pending disciplinary review' },
    { id: 2, name: 'Melkamu Zewdu', department: 'Operations', position: 'Manager', amount: 28000, holdReason: 'Awaiting document submission' },
    { id: 3, name: 'Tadese Jemberu', department: 'Operations', position: 'Coordinator', amount: 12000, holdReason: 'Salary dispute' },
    { id: 4, name: 'Nuru Seid', department: 'Finance', position: 'Accountant', amount: 15000, holdReason: 'Bank verification pending' }
]);
const pendingLeaves = ref([
    { id: 1, employeeName: 'Tamrat Zerihun', leaveType: 'Annual Leave', totalDays: 3, requestedDate: '2026-05-20' },
    { id: 2, employeeName: 'Nuru Seid', leaveType: 'Sick Leave', totalDays: 2, requestedDate: '2026-05-21' },
    { id: 3, employeeName: 'Eshete Worke', leaveType: 'Annual Leave', totalDays: 4, requestedDate: '2026-05-19' }
]);
const recentPayments = ref([
    { id: 1, employeeName: 'Biruk Mulualem', method: 'Bank Transfer', amount: 28500, paymentDate: '2026-05-15' },
    { id: 2, employeeName: 'Dagmawi Hadgu', method: 'Cash', amount: 32000, paymentDate: '2026-05-15' },
    { id: 3, employeeName: 'Melaku Tewodros', method: 'Bank Transfer', amount: 29500, paymentDate: '2026-05-14' },
    { id: 4, employeeName: 'Haymanot Abebaw', method: 'Bank Transfer', amount: 27500, paymentDate: '2026-05-14' },
    { id: 5, employeeName: 'Tamrat Zerihun', method: 'Cash', amount: 16500, paymentDate: '2026-05-13' }
]);
// Helper Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US').format(amount || 0);
}
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function getInitials(name) {
    if (!name)
        return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function goToEmployees() { router.push('/employees'); }
function goToAttendance() { router.push('/attendance'); }
function goToPayroll() { router.push('/payroll'); }
function quickApprove(leave) {
    showToastMessage(`Leave approved for ${leave.employeeName}`, 'success');
    pendingLeaves.value = pendingLeaves.value.filter(l => l.id !== leave.id);
}
function quickReject(leave) {
    showToastMessage(`Leave rejected for ${leave.employeeName}`, 'warning');
    pendingLeaves.value = pendingLeaves.value.filter(l => l.id !== leave.id);
}
function initPayrollCompositionChart() {
    if (!payrollCompositionChart.value) {
        setTimeout(() => {
            initPayrollCompositionChart();
        }, 200);
        return;
    }
    const ctx = payrollCompositionChart.value.getContext('2d');
    if (!ctx)
        return;
    if (compositionChart) {
        compositionChart.destroy();
        compositionChart = null;
    }
    compositionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Basic Salary', 'Allowances', 'Overtime', 'Bonuses'],
            datasets: [{
                    data: [
                        payrollComposition.value.basicSalary,
                        payrollComposition.value.allowances,
                        payrollComposition.value.overtime,
                        payrollComposition.value.bonuses
                    ],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderColor: 'white',
                    borderWidth: 2,
                    hoverOffset: 10,
                    cutout: '60%'
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
function initNetPayDeductionsChart() {
    if (!netPayDeductionsChart.value) {
        setTimeout(() => {
            initNetPayDeductionsChart();
        }, 200);
        return;
    }
    const ctx = netPayDeductionsChart.value.getContext('2d');
    if (!ctx)
        return;
    if (netPayChart) {
        netPayChart.destroy();
        netPayChart = null;
    }
    netPayChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyNetPayData.value.labels,
            datasets: [
                {
                    label: 'Net Pay (Take Home)',
                    data: monthlyNetPayData.value.netPay,
                    type: 'line',
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Total Deductions',
                    data: monthlyNetPayData.value.deductions,
                    type: 'bar',
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            let value = context.raw;
                            let percentage = '';
                            if (context.dataset.label === 'Net Pay (Take Home)') {
                                const total = value + (monthlyNetPayData.value.deductions[context.dataIndex] || 0);
                                percentage = ` (${Math.round((value / total) * 100)}% of gross)`;
                            }
                            return `${label}: ${formatCurrency(value)}${percentage}`;
                        },
                        footer: function (tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const netPay = monthlyNetPayData.value.netPay[index];
                            const deductions = monthlyNetPayData.value.deductions[index];
                            const gross = netPay + deductions;
                            return `Gross Pay: ${formatCurrency(gross)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Amount (ETB)',
                        font: { weight: 'bold', size: 12 }
                    },
                    ticks: {
                        callback: (val) => formatCurrency(val),
                        stepSize: 500000
                    },
                    grid: {
                        color: '#e2e8f0'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        font: { weight: 'bold', size: 12 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
function refreshData() {
    showToastMessage(`Dashboard refreshed for ${selectedMonthName.value}`, 'success');
}
function showToastMessage(message, type = 'success') {
    toastMessage.value = message;
    toastType.value = type;
    toastIcon.value = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️');
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
}
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            initPayrollCompositionChart();
            initNetPayDeductionsChart();
        }, 300);
    });
});
onUnmounted(() => {
    if (compositionChart) {
        compositionChart.destroy();
        compositionChart = null;
    }
    if (netPayChart) {
        netPayChart.destroy();
        netPayChart = null;
    }
});
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
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
/** @type {__VLS_StyleScopedClasses['pie-chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['color-box']} */ ;
/** @type {__VLS_StyleScopedClasses['color-box']} */ ;
/** @type {__VLS_StyleScopedClasses['color-box']} */ ;
/** @type {__VLS_StyleScopedClasses['color-box']} */ ;
/** @type {__VLS_StyleScopedClasses['total-payroll']} */ ;
/** @type {__VLS_StyleScopedClasses['total-payroll']} */ ;
/** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
/** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
/** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
/** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
/** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
/** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
/** @type {__VLS_StyleScopedClasses['list-value']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
/** @type {__VLS_StyleScopedClasses['list-value']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-header']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-header']} */ ;
/** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['purple']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-header']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['insight-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['insight-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['finance-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['list-item']} */ ;
/** @type {__VLS_StyleScopedClasses['composition-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['pie-chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['pie-chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-section']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-header']} */ ;
/** @type {__VLS_StyleScopedClasses['trend-summary-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-insights']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "finance-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['finance-dashboard']} */ ;
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
    d: "M3 10h18M6 14h12M12 4v16M8 4h8M8 20h8M12 8v4M12 12v4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "4",
    y: "4",
    width: "16",
    height: "16",
    rx: "2",
    ry: "2",
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
        ...{ class: "stats-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.goToEmployees) },
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
    (__VLS_ctx.employeeStats.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    (__VLS_ctx.employeeStats.active);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.goToEmployees) },
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
    (__VLS_ctx.employeeStats.newHires);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.goToEmployees) },
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
    (__VLS_ctx.employeeStats.terminations);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
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
    (__VLS_ctx.attendanceStats.avgAttendanceRate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    (__VLS_ctx.selectedMonthName);
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
    (__VLS_ctx.attendanceStats.totalAbsentDays);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    (__VLS_ctx.attendanceStats.lateCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.goToPayroll) },
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
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.totalNetPay));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-sub" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-sub']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.totalTax));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-content" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.totalGrossPay));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-trend" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-content" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.totalPension7));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-trend" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.totalPension11));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-content" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.totalPenalties));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-trend" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
    (__VLS_ctx.payrollStats.employeesWithPenalties);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-content" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-value" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
    (__VLS_ctx.payrollStats.employeesOnHold);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-label" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-trend" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-trend']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollStats.holdAmount));
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
    });
    /** @type {__VLS_StyleScopedClasses['header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-icon blue" },
    });
    /** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: "/payroll",
        ...{ class: "view-link" },
    }));
    const __VLS_2 = __VLS_1({
        to: "/payroll",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_5 } = __VLS_3.slots;
    // @ts-ignore
    [refreshData, loading, loading, goToEmployees, goToEmployees, goToEmployees, employeeStats, employeeStats, employeeStats, employeeStats, goToAttendance, goToAttendance, attendanceStats, attendanceStats, attendanceStats, selectedMonthName, goToPayroll, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, payrollStats, payrollStats, payrollStats, payrollStats, payrollStats, payrollStats, payrollStats, payrollStats, payrollStats,];
    var __VLS_3;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-list hover-scroll" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-list']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover-scroll']} */ ;
    for (const [dept] of __VLS_vFor((__VLS_ctx.departmentPayroll))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (dept.name),
            ...{ class: "analytics-item" },
        });
        /** @type {__VLS_StyleScopedClasses['analytics-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-rank" },
        });
        /** @type {__VLS_StyleScopedClasses['item-rank']} */ ;
        (dept.rank);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-name" },
        });
        /** @type {__VLS_StyleScopedClasses['item-name']} */ ;
        (dept.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['item-stats']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "emp-count" },
        });
        /** @type {__VLS_StyleScopedClasses['emp-count']} */ ;
        (dept.employeeCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "payroll-amount" },
        });
        /** @type {__VLS_StyleScopedClasses['payroll-amount']} */ ;
        (__VLS_ctx.formatCurrency(dept.totalPayroll));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['item-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bar-fill" },
            ...{ style: ({ width: dept.percentage + '%', background: '#3b82f6' }) },
        });
        /** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
        // @ts-ignore
        [formatCurrency, departmentPayroll,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        to: "/attendance",
        ...{ class: "view-link" },
    }));
    const __VLS_8 = __VLS_7({
        to: "/attendance",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_11 } = __VLS_9.slots;
    // @ts-ignore
    [];
    var __VLS_9;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analytics-list hover-scroll" },
    });
    /** @type {__VLS_StyleScopedClasses['analytics-list']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover-scroll']} */ ;
    for (const [dept] of __VLS_vFor((__VLS_ctx.departmentAttendance))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (dept.name),
            ...{ class: "analytics-item" },
        });
        /** @type {__VLS_StyleScopedClasses['analytics-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-rank" },
        });
        /** @type {__VLS_StyleScopedClasses['item-rank']} */ ;
        (dept.rank);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-name" },
        });
        /** @type {__VLS_StyleScopedClasses['item-name']} */ ;
        (dept.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['item-stats']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "attendance-rate" },
        });
        /** @type {__VLS_StyleScopedClasses['attendance-rate']} */ ;
        (dept.attendanceRate);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absent-days" },
        });
        /** @type {__VLS_StyleScopedClasses['absent-days']} */ ;
        (dept.absentDays);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['item-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bar-fill" },
            ...{ style: ({ width: dept.attendanceRate + '%', background: '#10b981' }) },
        });
        /** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
        // @ts-ignore
        [departmentAttendance,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_12;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        to: "/payroll",
        ...{ class: "view-link" },
    }));
    const __VLS_14 = __VLS_13({
        to: "/payroll",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_17 } = __VLS_15.slots;
    // @ts-ignore
    [];
    var __VLS_15;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pie-chart-container" },
    });
    /** @type {__VLS_StyleScopedClasses['pie-chart-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.canvas, __VLS_intrinsics.canvas)({
        ref: "payrollCompositionChart",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "composition-legend" },
    });
    /** @type {__VLS_StyleScopedClasses['composition-legend']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "color-box basic" },
    });
    /** @type {__VLS_StyleScopedClasses['color-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['basic']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-text" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-amount" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-amount']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollComposition.basicSalary));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "color-box allowances" },
    });
    /** @type {__VLS_StyleScopedClasses['color-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['allowances']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-text" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-amount" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-amount']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollComposition.allowances));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "color-box overtime" },
    });
    /** @type {__VLS_StyleScopedClasses['color-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['overtime']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-text" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-amount" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-amount']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollComposition.overtime));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-item" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "color-box bonuses" },
    });
    /** @type {__VLS_StyleScopedClasses['color-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['bonuses']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend-text" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-label" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-percent" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-percent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "legend-amount" },
    });
    /** @type {__VLS_StyleScopedClasses['legend-amount']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollComposition.bonuses));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "total-payroll" },
    });
    /** @type {__VLS_StyleScopedClasses['total-payroll']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatCurrency(__VLS_ctx.payrollComposition.total));
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_18;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        to: "/payroll",
        ...{ class: "view-link" },
    }));
    const __VLS_20 = __VLS_19({
        to: "/payroll",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_23 } = __VLS_21.slots;
    // @ts-ignore
    [formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, payrollComposition, payrollComposition, payrollComposition, payrollComposition, payrollComposition,];
    var __VLS_21;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "payment-status-list" },
    });
    /** @type {__VLS_StyleScopedClasses['payment-status-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-value" },
    });
    /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
    (__VLS_ctx.paymentStatus.paid);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['status-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-fill green" },
        ...{ style: ({ width: __VLS_ctx.paymentStatus.paidPercent + '%' }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-value" },
    });
    /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
    (__VLS_ctx.paymentStatus.pending);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['status-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-fill orange" },
        ...{ style: ({ width: __VLS_ctx.paymentStatus.pendingPercent + '%' }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
    /** @type {__VLS_StyleScopedClasses['orange']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-value" },
    });
    /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
    (__VLS_ctx.paymentStatus.unclaimed);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['status-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-fill red" },
        ...{ style: ({ width: __VLS_ctx.paymentStatus.unclaimedPercent + '%' }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
    /** @type {__VLS_StyleScopedClasses['red']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-value" },
    });
    /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
    (__VLS_ctx.paymentStatus.returned);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['status-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-fill purple" },
        ...{ style: ({ width: __VLS_ctx.paymentStatus.returnedPercent + '%' }) },
    });
    /** @type {__VLS_StyleScopedClasses['status-fill']} */ ;
    /** @type {__VLS_StyleScopedClasses['purple']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "two-column-layout" },
    });
    /** @type {__VLS_StyleScopedClasses['two-column-layout']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "left-column" },
    });
    /** @type {__VLS_StyleScopedClasses['left-column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_24;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        to: "/employees",
        ...{ class: "view-link" },
    }));
    const __VLS_26 = __VLS_25({
        to: "/employees",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_29 } = __VLS_27.slots;
    // @ts-ignore
    [paymentStatus, paymentStatus, paymentStatus, paymentStatus, paymentStatus, paymentStatus, paymentStatus, paymentStatus,];
    var __VLS_27;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-list" },
    });
    /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
    for (const [emp, idx] of __VLS_vFor((__VLS_ctx.highestPaid))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (emp.id),
            ...{ class: "list-item" },
        });
        /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "top-rank" },
            ...{ class: ({ gold: idx === 0, silver: idx === 1, bronze: idx === 2 }) },
        });
        /** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
        /** @type {__VLS_StyleScopedClasses['gold']} */ ;
        /** @type {__VLS_StyleScopedClasses['silver']} */ ;
        /** @type {__VLS_StyleScopedClasses['bronze']} */ ;
        (idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1);
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
        (emp.position);
        (emp.department);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-value" },
        });
        /** @type {__VLS_StyleScopedClasses['list-value']} */ ;
        (__VLS_ctx.formatCurrency(emp.salary));
        // @ts-ignore
        [formatCurrency, highestPaid, getInitials,];
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
    [];
    var __VLS_33;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-list" },
    });
    /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
    for (const [emp, idx] of __VLS_vFor((__VLS_ctx.mostAbsent))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (emp.id),
            ...{ class: "list-item absent-item" },
        });
        /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['absent-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "top-rank" },
        });
        /** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-avatar warning-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
        /** @type {__VLS_StyleScopedClasses['warning-avatar']} */ ;
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
            ...{ class: "list-value red" },
        });
        /** @type {__VLS_StyleScopedClasses['list-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['red']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absent-count" },
        });
        /** @type {__VLS_StyleScopedClasses['absent-count']} */ ;
        (emp.absentDays);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "penalty-amount" },
        });
        /** @type {__VLS_StyleScopedClasses['penalty-amount']} */ ;
        (__VLS_ctx.formatCurrency(emp.penalty));
        // @ts-ignore
        [formatCurrency, getInitials, mostAbsent,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card hold-card" },
    });
    /** @type {__VLS_StyleScopedClasses['section-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['hold-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    let __VLS_36;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        to: "/payroll",
        ...{ class: "view-link" },
    }));
    const __VLS_38 = __VLS_37({
        to: "/payroll",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_41 } = __VLS_39.slots;
    // @ts-ignore
    [];
    var __VLS_39;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-list" },
    });
    /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
    for (const [emp] of __VLS_vFor((__VLS_ctx.onHoldEmployees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (emp.id),
            ...{ class: "list-item hold-item" },
        });
        /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['hold-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-avatar hold-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
        /** @type {__VLS_StyleScopedClasses['hold-avatar']} */ ;
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
        (emp.position);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "hold-reason" },
        });
        /** @type {__VLS_StyleScopedClasses['hold-reason']} */ ;
        (emp.holdReason);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-value red" },
        });
        /** @type {__VLS_StyleScopedClasses['list-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['red']} */ ;
        (__VLS_ctx.formatCurrency(emp.amount));
        // @ts-ignore
        [formatCurrency, getInitials, onHoldEmployees,];
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
    let __VLS_42;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        to: "/attendance",
        ...{ class: "view-link" },
    }));
    const __VLS_44 = __VLS_43({
        to: "/attendance",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_47 } = __VLS_45.slots;
    // @ts-ignore
    [];
    var __VLS_45;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-list" },
    });
    /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
    for (const [emp, idx] of __VLS_vFor((__VLS_ctx.mostLate))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (emp.id),
            ...{ class: "list-item late-item" },
        });
        /** @type {__VLS_StyleScopedClasses['list-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['late-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "top-rank" },
        });
        /** @type {__VLS_StyleScopedClasses['top-rank']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-avatar late-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['list-avatar']} */ ;
        /** @type {__VLS_StyleScopedClasses['late-avatar']} */ ;
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
            ...{ class: "list-value orange" },
        });
        /** @type {__VLS_StyleScopedClasses['list-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['orange']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "late-count" },
        });
        /** @type {__VLS_StyleScopedClasses['late-count']} */ ;
        (emp.lateMinutes);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "late-times" },
        });
        /** @type {__VLS_StyleScopedClasses['late-times']} */ ;
        (emp.lateCount);
        // @ts-ignore
        [getInitials, mostLate,];
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
    let __VLS_48;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
        to: "/leaves",
        ...{ class: "view-link" },
    }));
    const __VLS_50 = __VLS_49({
        to: "/leaves",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_53 } = __VLS_51.slots;
    // @ts-ignore
    [];
    var __VLS_51;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-list" },
    });
    /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
    for (const [leave] of __VLS_vFor((__VLS_ctx.pendingLeaves))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (leave.id),
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
        (leave.totalDays);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-date" },
        });
        /** @type {__VLS_StyleScopedClasses['list-date']} */ ;
        (__VLS_ctx.formatDate(leave.requestedDate));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['list-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.quickApprove(leave);
                    // @ts-ignore
                    [formatDate, getInitials, pendingLeaves, quickApprove,];
                } },
            ...{ class: "btn-small success" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        /** @type {__VLS_StyleScopedClasses['success']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.quickReject(leave);
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
    let __VLS_54;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
        to: "/payroll",
        ...{ class: "view-link" },
    }));
    const __VLS_56 = __VLS_55({
        to: "/payroll",
        ...{ class: "view-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_55));
    /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    const { default: __VLS_59 } = __VLS_57.slots;
    // @ts-ignore
    [];
    var __VLS_57;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scroll-container" },
    });
    /** @type {__VLS_StyleScopedClasses['scroll-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-list" },
    });
    /** @type {__VLS_StyleScopedClasses['item-list']} */ ;
    for (const [payment] of __VLS_vFor((__VLS_ctx.recentPayments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (payment.id),
            ...{ class: "activity-item" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-info" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-text" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-text']} */ ;
        (payment.employeeName);
        (payment.method);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-amount" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-amount']} */ ;
        (__VLS_ctx.formatCurrency(payment.amount));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-time" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-time']} */ ;
        (__VLS_ctx.formatDate(payment.paymentDate));
        // @ts-ignore
        [formatDate, formatCurrency, recentPayments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trend-section" },
    });
    /** @type {__VLS_StyleScopedClasses['trend-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trend-header" },
    });
    /** @type {__VLS_StyleScopedClasses['trend-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-title" },
    });
    /** @type {__VLS_StyleScopedClasses['header-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-icon purple" },
    });
    /** @type {__VLS_StyleScopedClasses['title-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['purple']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trend-filters" },
    });
    /** @type {__VLS_StyleScopedClasses['trend-filters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.trendYear),
        ...{ class: "filter-select-small" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (2024),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (2025),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (2026),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trend-summary-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['trend-summary-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value text-green" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-green']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.averageNetPay));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-trend positive" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    (__VLS_ctx.netPayGrowth);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value text-red" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.averageDeductions));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-trend negative" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
    /** @type {__VLS_StyleScopedClasses['negative']} */ ;
    (__VLS_ctx.deductionsGrowth);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value text-blue" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue']} */ ;
    (__VLS_ctx.netPayRatio);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-trend" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-container" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.canvas, __VLS_intrinsics.canvas)({
        ref: "netPayDeductionsChart",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-insights" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-insights']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "insight-item" },
    });
    /** @type {__VLS_StyleScopedClasses['insight-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "insight-dot green" },
    });
    /** @type {__VLS_StyleScopedClasses['insight-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "insight-item" },
    });
    /** @type {__VLS_StyleScopedClasses['insight-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "insight-dot red" },
    });
    /** @type {__VLS_StyleScopedClasses['insight-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['red']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "insight-note" },
    });
    /** @type {__VLS_StyleScopedClasses['insight-note']} */ ;
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
[formatCurrency, formatCurrency, trendYear, averageNetPay, netPayGrowth, averageDeductions, deductionsGrowth, netPayRatio, showToast, toastType, toastIcon, toastMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
