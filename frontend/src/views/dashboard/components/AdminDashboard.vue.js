import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
// State
const showUserDropdown = ref(false);
const currentUser = ref({
    name: 'Admin User',
    role: 'Administrator',
    email: 'admin@company.com'
});
// Stats data
const stats = ref({
    totalEmployees: 156,
    totalPayroll: 4850000,
    presentToday: 142,
    attendanceRate: 91,
    pendingLeaves: 8,
    leavesThisMonth: 23,
    newHires: 12,
    departments: 5,
    approvedLeaves: 45,
    rejectedLeaves: 6,
    totalLeaves: 59,
    averageSalary: 31090,
    totalDeductions: 485000,
    netPayroll: 4365000,
    nextPayDate: 'May 30, 2026'
});
// Attendance trend data
const attendanceTrend = ref([
    { month: 'Jan', rate: 88 },
    { month: 'Feb', rate: 89 },
    { month: 'Mar', rate: 87 },
    { month: 'Apr', rate: 90 },
    { month: 'May', rate: 91 },
    { month: 'Jun', rate: 92 }
]);
// Recent activities
const recentActivities = ref([
    { id: 1, icon: '👔', text: 'New employee Biruk Mulualem joined IT department', time: '2 hours ago' },
    { id: 2, icon: '🏖️', text: 'Leave request approved for Dagmawi Hadgu', time: '5 hours ago' },
    { id: 3, icon: '💰', text: 'Payroll for April 2026 processed', time: 'Yesterday' },
    { id: 4, icon: '📅', text: 'Attendance submitted for 15 employees', time: 'Yesterday' },
    { id: 5, icon: '👥', text: 'New user role created: Attendance Manager', time: '2 days ago' }
]);
// Recent employees
const recentEmployees = ref([
    { id: 9, fullName: 'Haymanot Abebaw', department: 'HR', joinDate: '2026-05-15' },
    { id: 8, fullName: 'Eshete Worke', department: 'IT', joinDate: '2026-05-10' },
    { id: 7, fullName: 'Tadese Jemberu', department: 'Operations', joinDate: '2026-05-01' },
    { id: 10, fullName: 'Zerihun Mekonnen', department: 'Finance', joinDate: '2026-04-28' }
]);
// Department statistics
const departmentStats = ref([
    { name: 'IT', count: 45, percentage: 29, color: '#3b82f6' },
    { name: 'Finance', count: 32, percentage: 21, color: '#10b981' },
    { name: 'Operations', count: 38, percentage: 24, color: '#f59e0b' },
    { name: 'HR', count: 15, percentage: 10, color: '#8b5cf6' },
    { name: 'Sales', count: 26, percentage: 16, color: '#ec4899' }
]);
// Methods
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount);
}
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}
function getInitials(name) {
    if (!name)
        return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function toggleUserDropdown() {
    showUserDropdown.value = !showUserDropdown.value;
}
function closeUserDropdown() {
    showUserDropdown.value = false;
}
function goToEmployee(id) {
    router.push(`/employees/${id}`);
}
function goToNotifications() {
    console.log('Notifications clicked');
}
function handleLogout() {
    authStore.logout();
    router.push('/login');
}
// Close dropdown when clicking outside
const handleClickOutside = (e) => {
    if (!e.target.closest('.user-menu')) {
        showUserDropdown.value = false;
    }
};
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['user-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['user-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['user-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-change']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-change']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-access']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-section']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-value']} */ ;
/** @type {__VLS_StyleScopedClasses['payroll-value']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-card']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-item']} */ ;
/** @type {__VLS_StyleScopedClasses['view-all']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-count']} */ ;
/** @type {__VLS_StyleScopedClasses['dept-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "admin-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['admin-dashboard']} */ ;
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
    ...{ class: "dashboard-content" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-grid" },
});
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
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
    ...{ class: "stat-change positive" },
});
/** @type {__VLS_StyleScopedClasses['stat-change']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.formatCurrency(__VLS_ctx.stats.totalPayroll));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-change positive" },
});
/** @type {__VLS_StyleScopedClasses['stat-change']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.presentToday);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-change" },
});
/** @type {__VLS_StyleScopedClasses['stat-change']} */ ;
(__VLS_ctx.stats.attendanceRate);
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-value" },
});
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
(__VLS_ctx.stats.pendingLeaves);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-change warning" },
});
/** @type {__VLS_StyleScopedClasses['stat-change']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
(__VLS_ctx.stats.leavesThisMonth);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-access" },
});
/** @type {__VLS_StyleScopedClasses['quick-access']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-grid" },
});
/** @type {__VLS_StyleScopedClasses['quick-grid']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/dashboard",
    ...{ class: "quick-card" },
}));
const __VLS_2 = __VLS_1({
    to: "/dashboard",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[stats, stats, stats, stats, stats, stats, formatCurrency,];
var __VLS_3;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    to: "/profile",
    ...{ class: "quick-card" },
}));
const __VLS_8 = __VLS_7({
    to: "/profile",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_9;
let __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    to: "/employees",
    ...{ class: "quick-card" },
}));
const __VLS_14 = __VLS_13({
    to: "/employees",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_17 } = __VLS_15.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_15;
let __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    to: "/users",
    ...{ class: "quick-card" },
}));
const __VLS_20 = __VLS_19({
    to: "/users",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_23 } = __VLS_21.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_21;
let __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    to: "/analytics",
    ...{ class: "quick-card" },
}));
const __VLS_26 = __VLS_25({
    to: "/analytics",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_29 } = __VLS_27.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_27;
let __VLS_30;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    to: "/attendance",
    ...{ class: "quick-card" },
}));
const __VLS_32 = __VLS_31({
    to: "/attendance",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_35 } = __VLS_33.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_33;
let __VLS_36;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
    to: "/leaves",
    ...{ class: "quick-card" },
}));
const __VLS_38 = __VLS_37({
    to: "/leaves",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_41 } = __VLS_39.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_39;
let __VLS_42;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
    to: "/payroll",
    ...{ class: "quick-card" },
}));
const __VLS_44 = __VLS_43({
    to: "/payroll",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_47 } = __VLS_45.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_45;
let __VLS_48;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
    to: "/settings",
    ...{ class: "quick-card" },
}));
const __VLS_50 = __VLS_49({
    to: "/settings",
    ...{ class: "quick-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
/** @type {__VLS_StyleScopedClasses['quick-card']} */ ;
const { default: __VLS_53 } = __VLS_51.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-icon" },
});
/** @type {__VLS_StyleScopedClasses['quick-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-title" },
});
/** @type {__VLS_StyleScopedClasses['quick-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "quick-desc" },
});
/** @type {__VLS_StyleScopedClasses['quick-desc']} */ ;
// @ts-ignore
[];
var __VLS_51;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "recent-section" },
});
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "trend-chart" },
});
/** @type {__VLS_StyleScopedClasses['trend-chart']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.attendanceTrend))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trend-bar" },
        key: (item.month),
    });
    /** @type {__VLS_StyleScopedClasses['trend-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bar-container" },
    });
    /** @type {__VLS_StyleScopedClasses['bar-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bar-fill" },
        ...{ style: ({ height: item.rate + '%' }) },
    });
    /** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bar-label" },
    });
    /** @type {__VLS_StyleScopedClasses['bar-label']} */ ;
    (item.month);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bar-value" },
    });
    /** @type {__VLS_StyleScopedClasses['bar-value']} */ ;
    (item.rate);
    // @ts-ignore
    [attendanceTrend,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "pie-chart" },
});
/** @type {__VLS_StyleScopedClasses['pie-chart']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.departmentStats))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "pie-segment-info" },
    });
    /** @type {__VLS_StyleScopedClasses['pie-segment-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pie-color" },
        ...{ style: ({ background: dept.color }) },
    });
    /** @type {__VLS_StyleScopedClasses['pie-color']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pie-label" },
    });
    /** @type {__VLS_StyleScopedClasses['pie-label']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pie-value" },
    });
    /** @type {__VLS_StyleScopedClasses['pie-value']} */ ;
    (dept.count);
    (dept.percentage);
    // @ts-ignore
    [departmentStats,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "recent-section" },
});
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-stats" },
});
/** @type {__VLS_StyleScopedClasses['leave-stats']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-stat-item" },
});
/** @type {__VLS_StyleScopedClasses['leave-stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-circle green" },
});
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-detail" },
});
/** @type {__VLS_StyleScopedClasses['stat-detail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.stats.approvedLeaves);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-stat-item" },
});
/** @type {__VLS_StyleScopedClasses['leave-stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-circle orange" },
});
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['orange']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-detail" },
});
/** @type {__VLS_StyleScopedClasses['stat-detail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.stats.pendingLeaves);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-stat-item" },
});
/** @type {__VLS_StyleScopedClasses['leave-stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-circle red" },
});
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['red']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-detail" },
});
/** @type {__VLS_StyleScopedClasses['stat-detail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.stats.rejectedLeaves);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "leave-stat-item" },
});
/** @type {__VLS_StyleScopedClasses['leave-stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-circle blue" },
});
/** @type {__VLS_StyleScopedClasses['stat-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['blue']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-detail" },
});
/** @type {__VLS_StyleScopedClasses['stat-detail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.stats.totalLeaves);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-label" },
});
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analytics-card" },
});
/** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "payroll-stats" },
});
/** @type {__VLS_StyleScopedClasses['payroll-stats']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "payroll-item" },
});
/** @type {__VLS_StyleScopedClasses['payroll-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-label" },
});
/** @type {__VLS_StyleScopedClasses['payroll-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-value" },
});
/** @type {__VLS_StyleScopedClasses['payroll-value']} */ ;
(__VLS_ctx.formatCurrency(__VLS_ctx.stats.averageSalary));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "payroll-item" },
});
/** @type {__VLS_StyleScopedClasses['payroll-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-label" },
});
/** @type {__VLS_StyleScopedClasses['payroll-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-value text-red" },
});
/** @type {__VLS_StyleScopedClasses['payroll-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red']} */ ;
(__VLS_ctx.formatCurrency(__VLS_ctx.stats.totalDeductions));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "payroll-item" },
});
/** @type {__VLS_StyleScopedClasses['payroll-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-label" },
});
/** @type {__VLS_StyleScopedClasses['payroll-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-value text-green" },
});
/** @type {__VLS_StyleScopedClasses['payroll-value']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green']} */ ;
(__VLS_ctx.formatCurrency(__VLS_ctx.stats.netPayroll));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "payroll-item" },
});
/** @type {__VLS_StyleScopedClasses['payroll-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-label" },
});
/** @type {__VLS_StyleScopedClasses['payroll-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "payroll-value" },
});
/** @type {__VLS_StyleScopedClasses['payroll-value']} */ ;
(__VLS_ctx.stats.nextPayDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "recent-section" },
});
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "recent-card" },
});
/** @type {__VLS_StyleScopedClasses['recent-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "recent-list" },
});
/** @type {__VLS_StyleScopedClasses['recent-list']} */ ;
for (const [emp] of __VLS_vFor((__VLS_ctx.recentEmployees))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.goToEmployee(emp.id);
                // @ts-ignore
                [stats, stats, stats, stats, stats, stats, stats, stats, formatCurrency, formatCurrency, formatCurrency, recentEmployees, goToEmployee,];
            } },
        key: (emp.id),
        ...{ class: "recent-item" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-avatar" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-avatar']} */ ;
    (__VLS_ctx.getInitials(emp.fullName));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-info" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-name" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-name']} */ ;
    (emp.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-dept" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-dept']} */ ;
    (emp.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "recent-date" },
    });
    /** @type {__VLS_StyleScopedClasses['recent-date']} */ ;
    (__VLS_ctx.formatDate(emp.joinDate));
    // @ts-ignore
    [getInitials, formatDate,];
}
let __VLS_54;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
    to: "/employees",
    ...{ class: "view-all" },
}));
const __VLS_56 = __VLS_55({
    to: "/employees",
    ...{ class: "view-all" },
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
/** @type {__VLS_StyleScopedClasses['view-all']} */ ;
const { default: __VLS_59 } = __VLS_57.slots;
// @ts-ignore
[];
var __VLS_57;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "recent-card" },
});
/** @type {__VLS_StyleScopedClasses['recent-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "activity-list" },
});
/** @type {__VLS_StyleScopedClasses['activity-list']} */ ;
for (const [activity] of __VLS_vFor((__VLS_ctx.recentActivities))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (activity.id),
        ...{ class: "activity-item" },
    });
    /** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "activity-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['activity-icon']} */ ;
    (activity.icon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "activity-info" },
    });
    /** @type {__VLS_StyleScopedClasses['activity-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "activity-text" },
    });
    /** @type {__VLS_StyleScopedClasses['activity-text']} */ ;
    (activity.text);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "activity-time" },
    });
    /** @type {__VLS_StyleScopedClasses['activity-time']} */ ;
    (activity.time);
    // @ts-ignore
    [recentActivities,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dept-section" },
});
/** @type {__VLS_StyleScopedClasses['dept-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dept-card" },
});
/** @type {__VLS_StyleScopedClasses['dept-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dept-list" },
});
/** @type {__VLS_StyleScopedClasses['dept-list']} */ ;
for (const [dept] of __VLS_vFor((__VLS_ctx.departmentStats))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (dept.name),
        ...{ class: "dept-item" },
    });
    /** @type {__VLS_StyleScopedClasses['dept-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dept-name" },
    });
    /** @type {__VLS_StyleScopedClasses['dept-name']} */ ;
    (dept.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dept-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['dept-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dept-fill" },
        ...{ style: ({ width: dept.percentage + '%', background: dept.color }) },
    });
    /** @type {__VLS_StyleScopedClasses['dept-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dept-count" },
    });
    /** @type {__VLS_StyleScopedClasses['dept-count']} */ ;
    (dept.count);
    // @ts-ignore
    [departmentStats,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
