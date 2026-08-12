import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import * as icons from '@heroicons/vue/24/outline';
const props = defineProps({
    collapsed: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['update:collapsed']);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const userRole = computed(() => authStore.user?.role || 'employee');
const isCollapsed = ref(props.collapsed);
const userDisplayName = computed(() => {
    return authStore.user?.fullEmployeeName || authStore.user?.fullName || 'User';
});
const userAvatar = computed(() => {
    return authStore.user?.profilePicture ||
        authStore.user?.profilePictureUrl ||
        `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(userDisplayName.value)}`;
});
const roleTitle = computed(() => {
    const titles = {
        admin: 'Administrator',
        hr: 'HR Manager',
        finance: 'Finance Officer',
        employee: 'Employee',
        attendance: 'Attendance Manager',
        storekeeper: 'StoreKeeper',
        store_it: 'Store IT',
        checker: 'checker',
        cost: "Cost analyst",
        nebret: 'Asset Manager'
    };
    return titles[userRole.value] || 'User';
});
const roleMenus = {
    admin: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'Users', path: '/users', icon: 'UsersIcon', badge: null },
        { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null },
        { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
        { name: 'Leave Requests', path: '/leaves', icon: 'CalendarIcon', badge: null },
        { name: 'payroll', path: '/payroll', icon: 'CurrencyDollarIcon', badge: null },
        { name: 'inventory', path: '/inventory', icon: 'ChartBarIcon', badge: null },
        { name: 'stores List', path: '/store-management', icon: 'ClockIcon', badge: null },
        { name: 'store groups', path: '/group-management', icon: 'UserIcon', badge: null },
        { name: 'store-to-store ', path: '/store-to-store', icon: 'UserIcon', badge: null },
        { name: 'store-balance ', path: '/store-balance', icon: 'UserIcon', badge: null },
        { name: 'store-transaction ', path: '/store-transaction', icon: 'UserIcon', badge: null },
        { name: 'item-requests ', path: '/item-requests', icon: 'UserIcon', badge: null },
        { name: 'audit', path: '/audit', icon: 'ClockIcon', badge: null },
        { name: 'item-cost', path: '/item-cost', icon: 'CogIcon', badge: null },
        { name: 'Settings', path: '/settings', icon: 'CogIcon', badge: null },
        { name: 'Asset Management', path: '/Asset-Management', icon: 'CogIcon', badge: null }, // ← Primary menu for Asset Manager
    ],
    hr: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null },
        { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
        { name: 'Leave Requests', path: '/leaves', icon: 'CalendarIcon', badge: null },
    ],
    finance: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null },
        { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
        { name: 'payroll', path: '/payroll', icon: 'CurrencyDollarIcon', badge: null },
    ],
    employee: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        // { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
        // { name: 'My Attendance', path: '/my-attendance', icon: 'ClockIcon', badge: null },
        // { name: 'My Leaves', path: '/my-leaves', icon: 'CalendarIcon', badge: null },
        // { name: 'My payroll', path: '/my-payroll', icon: 'CurrencyDollarIcon', badge: null },
        { name: 'item-requests ', path: '/item-requests', icon: 'UserIcon', badge: null }
    ],
    attendance: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
        { name: 'Leave List', path: '/approved-leaves-list', icon: 'CalendarIcon', badge: null },
        { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
    ],
    storekeeper: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        // { name: 'stores List', path: '/store-management', icon: 'ClockIcon', badge: null },
        // { name: 'store groups', path: '/group-management', icon: 'UserIcon', badge: null },
        // { name: 'store-to-store ', path: '/store-to-store', icon: 'UserIcon', badge: null },
        { name: 'store-balance ', path: '/store-balance', icon: 'UserIcon', badge: null },
        { name: 'store-transaction ', path: '/store-transaction', icon: 'UserIcon', badge: null },
        { name: 'item-requests ', path: '/item-requests', icon: 'UserIcon', badge: null },
        //  { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
        // { name: 'audit', path: '/audit', icon: 'ClockIcon', badge: null },
    ],
    store_it: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        // { name: 'stores List', path: '/store-management', icon: 'ClockIcon', badge: null },
        // { name: 'store groups', path: '/group-management', icon: 'UserIcon', badge: null },
        // { name: 'store-to-store ', path: '/store-to-store', icon: 'UserIcon', badge: null },
        { name: 'store-balance ', path: '/store-balance', icon: 'UserIcon', badge: null },
        { name: 'store-transaction ', path: '/store-transaction', icon: 'UserIcon', badge: null },
        { name: 'item-requests ', path: '/item-requests', icon: 'UserIcon', badge: null },
        // { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
        // { name: 'audit', path: '/audit', icon: 'ClockIcon', badge: null },
    ],
    checker: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'inventory', path: '/inventory', icon: 'ChartBarIcon', badge: null },
        // { name: 'stores List', path: '/store-management', icon: 'ClockIcon', badge: null },
        // { name: 'store groups', path: '/group-management', icon: 'UserIcon', badge: null },
        //  { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
        // { name: 'store-to-store ', path: '/store-to-store', icon: 'UserIcon', badge: null },
        { name: 'audit', path: '/audit', icon: 'ClockIcon', badge: null },
    ],
    cost: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'item-cost', path: '/item-cost', icon: 'CogIcon', badge: null },
    ],
    nebret: [
        { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
        { name: 'Asset Management', path: '/Asset-Management', icon: 'CogIcon', badge: null }, // ← Primary menu for Asset Manager
        { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null }, // ← Added for reference
        { name: 'Inventory', path: '/inventory', icon: 'ChartBarIcon', badge: null }, // ← Added for reference
    ]
};
const menuItems = computed(() => {
    return roleMenus[userRole.value] || roleMenus.employee;
});
const getIcon = (iconName) => {
    return icons[iconName] || icons.HomeIcon;
};
const isActiveRoute = (path) => {
    const currentPath = route.path;
    if (path === '/dashboard') {
        return currentPath === '/dashboard';
    }
    return currentPath === path || currentPath.startsWith(path + '/');
};
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    emit('update:collapsed', isCollapsed.value);
    localStorage.setItem('sidebarCollapsed', isCollapsed.value);
};
const handleLogout = async () => {
    await authStore.logout();
    router.push('/login');
};
// Load saved state
const savedState = localStorage.getItem('sidebarCollapsed');
if (savedState !== null) {
    isCollapsed.value = savedState === 'true';
    emit('update:collapsed', isCollapsed.value);
}
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
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['user-info']} */ ;
/** @type {__VLS_StyleScopedClasses['user-info']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-menu-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-menu-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-menu-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-menu-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['user-info']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "sidebar" },
    ...{ class: ({ collapsed: __VLS_ctx.isCollapsed }) },
});
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "user-section" },
    ...{ class: ({ 'collapsed-user': __VLS_ctx.isCollapsed }) },
});
/** @type {__VLS_StyleScopedClasses['user-section']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed-user']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "user-avatar" },
});
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: (__VLS_ctx.userAvatar),
    alt: "User",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "online-dot" },
});
/** @type {__VLS_StyleScopedClasses['online-dot']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "user-info" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.isCollapsed) }, null, null);
/** @type {__VLS_StyleScopedClasses['user-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
(__VLS_ctx.userDisplayName);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.roleTitle);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "nav-menu-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['nav-menu-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "nav-menu" },
});
/** @type {__VLS_StyleScopedClasses['nav-menu']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.menuItems))) {
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        key: (item.path),
        to: (item.path),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveRoute(item.path) }) },
    }));
    const __VLS_2 = __VLS_1({
        key: (item.path),
        to: (item.path),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveRoute(item.path) }) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    const { default: __VLS_5 } = __VLS_3.slots;
    const __VLS_6 = (__VLS_ctx.getIcon(item.icon));
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ class: "nav-icon" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "nav-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['nav-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "nav-text" },
    });
    /** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
    (item.name);
    if (item.badge) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "nav-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['nav-badge']} */ ;
        (item.badge);
    }
    // @ts-ignore
    [isCollapsed, isCollapsed, isCollapsed, userAvatar, userDisplayName, roleTitle, menuItems, isActiveRoute, getIcon,];
    var __VLS_3;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-footer" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleLogout) },
    ...{ class: "logout-btn" },
});
/** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    'stroke-width': "1.5",
    stroke: "currentColor",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    d: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.isCollapsed) }, null, null);
// @ts-ignore
[isCollapsed, handleLogout,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        collapsed: {
            type: Boolean,
            default: false
        }
    },
});
export default {};
