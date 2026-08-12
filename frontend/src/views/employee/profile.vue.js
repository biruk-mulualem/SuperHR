import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const user = computed(() => authStore.user || {});
const activeTab = ref('personal');
const showEditModal = ref(false);
const tabs = [
    { id: 'personal', name: 'Personal Info', icon: 'UserIcon' },
    { id: 'employment', name: 'Employment', icon: 'BriefcaseIcon' },
    { id: 'stats', name: 'Statistics', icon: 'ChartBarIcon' }
];
// Computed properties
const userDisplayName = computed(() => {
    return user.value.fullEmployeeName || user.value.fullName || 'User';
});
const userAvatar = computed(() => {
    return user.value.profilePicture || user.value.profilePictureUrl ||
        `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(userDisplayName.value)}`;
});
const coverPhoto = ref('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop');
const roleTitle = computed(() => {
    const titles = {
        admin: 'System Administrator',
        hr: 'HR Manager',
        finance: 'Finance Officer',
        employee: 'Employee'
    };
    return titles[user.value.role] || user.value.role || 'Employee';
});
const userDepartment = computed(() => {
    return user.value.departmentName || 'No Department Assigned';
});
const yearsOfService = computed(() => {
    if (!user.value.hireDate)
        return 'N/A';
    const hireDate = new Date(user.value.hireDate);
    const today = new Date();
    const years = today.getFullYear() - hireDate.getFullYear();
    return `${years} years`;
});
const editForm = ref({
    phoneNumber: '',
    personalEmail: '',
    currentAddress: ''
});
// Methods
const formatDate = (date) => {
    if (!date)
        return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
const formatCurrency = (amount) => {
    if (!amount)
        return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
    }).format(amount);
};
const formatAddress = (address) => {
    if (!address || typeof address !== 'object')
        return 'N/A';
    const parts = [];
    if (address.street)
        parts.push(address.street);
    if (address.city)
        parts.push(address.city);
    if (address.country)
        parts.push(address.country);
    return parts.length ? parts.join(', ') : 'N/A';
};
const formatBankAccount = (account) => {
    if (!account || typeof account !== 'object')
        return 'N/A';
    return account.bankName ? `${account.bankName} - ${account.accountNumber || 'N/A'}` : 'N/A';
};
const uploadProfilePicture = () => {
    // Implement profile picture upload
    alert('Profile picture upload feature coming soon');
};
const uploadCoverPhoto = () => {
    // Implement cover photo upload
    alert('Cover photo upload feature coming soon');
};
const openEditModal = () => {
    editForm.value = {
        phoneNumber: user.value.phoneNumber || '',
        personalEmail: user.value.personalEmail || '',
        currentAddress: typeof user.value.currentAddress === 'object'
            ? JSON.stringify(user.value.currentAddress, null, 2)
            : user.value.currentAddress || ''
    };
    showEditModal.value = true;
};
const closeModal = () => {
    showEditModal.value = false;
};
const saveProfile = async () => {
    // Implement save profile
    alert('Save profile feature coming soon');
    closeModal();
};
onMounted(() => {
    // Fetch latest user data if needed
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cover-photo']} */ ;
/** @type {__VLS_StyleScopedClasses['change-cover-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['change-avatar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-avatar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-content']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-name']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-page" },
});
/** @type {__VLS_StyleScopedClasses['profile-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-header" },
});
/** @type {__VLS_StyleScopedClasses['profile-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "cover-photo" },
});
/** @type {__VLS_StyleScopedClasses['cover-photo']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: (__VLS_ctx.coverPhoto),
    alt: "Cover",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.uploadCoverPhoto) },
    ...{ class: "change-cover-btn" },
});
/** @type {__VLS_StyleScopedClasses['change-cover-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "camera-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['camera-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "13",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-avatar-section" },
});
/** @type {__VLS_StyleScopedClasses['profile-avatar-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "avatar-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['avatar-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: (__VLS_ctx.userAvatar),
    ...{ class: "profile-avatar" },
    alt: "Profile",
});
/** @type {__VLS_StyleScopedClasses['profile-avatar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.uploadProfilePicture) },
    ...{ class: "change-avatar-btn" },
});
/** @type {__VLS_StyleScopedClasses['change-avatar-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "camera-icon-small" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['camera-icon-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "13",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-info" },
});
/** @type {__VLS_StyleScopedClasses['profile-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "profile-name" },
});
/** @type {__VLS_StyleScopedClasses['profile-name']} */ ;
(__VLS_ctx.userDisplayName);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "profile-role" },
});
/** @type {__VLS_StyleScopedClasses['profile-role']} */ ;
(__VLS_ctx.roleTitle);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "profile-department" },
});
/** @type {__VLS_StyleScopedClasses['profile-department']} */ ;
(__VLS_ctx.userDepartment);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-content" },
});
/** @type {__VLS_StyleScopedClasses['profile-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-tabs" },
});
/** @type {__VLS_StyleScopedClasses['profile-tabs']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeTab = tab.id;
                // @ts-ignore
                [coverPhoto, uploadCoverPhoto, userAvatar, uploadProfilePicture, userDisplayName, roleTitle, userDepartment, tabs, activeTab,];
            } },
        key: (tab.id),
        ...{ class: "tab-btn" },
        ...{ class: ({ active: __VLS_ctx.activeTab === tab.id }) },
    });
    /** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    const __VLS_0 = (tab.icon);
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ class: "tab-icon" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "tab-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['tab-icon']} */ ;
    (tab.name);
    // @ts-ignore
    [activeTab,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-content" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'personal') }, null, null);
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-grid" },
});
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "card-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "7",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.fullEmployeeName || __VLS_ctx.user.fullName);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.employeeCode || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.formatDate(__VLS_ctx.user.dateOfBirth));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value capitalize" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
(__VLS_ctx.user.gender || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value capitalize" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
(__VLS_ctx.user.maritalStatus || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.nationality || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "card-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.email || __VLS_ctx.user.workEmail || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.workEmail || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.personalEmail || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.phoneNumber || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "card-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "9 22 9 12 15 12 15 22",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.formatAddress(__VLS_ctx.user.currentAddress));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.formatAddress(__VLS_ctx.user.permanentAddress));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-content" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'employment') }, null, null);
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-grid" },
});
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "card-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.employeeCode || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.positionId || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.departmentName || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value capitalize" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
(__VLS_ctx.user.employmentType || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value capitalize" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: (`status-badge status-${__VLS_ctx.user.employmentStatus}`) },
});
(__VLS_ctx.user.employmentStatus || 'N/A');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.formatDate(__VLS_ctx.user.hireDate));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "card-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.user.workLocation || 'Main Office');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "card-icon" },
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "12",
    y1: "1",
    x2: "12",
    y2: "23",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.formatCurrency(__VLS_ctx.user.basicSalary));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-row" },
});
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-label" },
});
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-value" },
});
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
(__VLS_ctx.formatBankAccount(__VLS_ctx.user.bankAccount));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tab-content" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'stats') }, null, null);
/** @type {__VLS_StyleScopedClasses['tab-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-grid" },
});
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon attendance" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "12",
    r: "10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "12 6 12 12 16 14",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-trend positive" },
});
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon leaves" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['leaves']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.line)({
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-trend" },
});
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon performance" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['performance']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 20V10M18 20V4M6 20v-4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-trend positive" },
});
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-icon tenure" },
});
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tenure']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-info" },
});
/** @type {__VLS_StyleScopedClasses['stat-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "stat-number" },
});
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
(__VLS_ctx.yearsOfService);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-trend" },
});
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
if (__VLS_ctx.showEditModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.editForm.phoneNumber),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "email",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.editForm.personalEmail);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.editForm.currentAddress),
        ...{ class: "form-textarea" },
        rows: "3",
    });
    /** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveProfile) },
        ...{ class: "btn-save" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-save']} */ ;
}
// @ts-ignore
[activeTab, activeTab, activeTab, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, user, formatDate, formatDate, formatAddress, formatAddress, formatCurrency, formatBankAccount, yearsOfService, showEditModal, closeModal, closeModal, closeModal, editForm, editForm, editForm, saveProfile,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
