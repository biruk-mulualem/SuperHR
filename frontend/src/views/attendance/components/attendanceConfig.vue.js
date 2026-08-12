import { ref } from 'vue';
import HolidaysConfig from './components/HolidaysConfig.vue';
import AttendanceHeader from './components/AttendanceHeader.vue';
import ShiftTabs from './components/ShiftTabs.vue';
import LiveDashboard from './components/LiveDashboard.vue';
import CompanyDefaults from './components/CompanyDefaults.vue';
import DepartmentOverrides from './components/DepartmentOverrides.vue';
import EmployeeOverrides from './components/EmployeeOverrides.vue';
import LunchTracking from './components/LunchTracking.vue';
import DinnerTracking from './components/DinnerTracking.vue';
import OvertimeRules from './components/OvertimeRules.vue';
import LateNightAdjustments from './components/LateNightAdjustments.vue';
import FieldWorkRegistration from './components/FieldWorkRegistration.vue';
import Toast from '@/components/shared/Toast.vue';
const activeShift = ref('day');
const globalLoading = ref(false);
const toasts = ref([]);
const refreshAll = () => {
    // Optional: You can use an event bus or just let each component refresh itself
    window.location.reload(); // Simple refresh
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "attendance-config" },
});
/** @type {__VLS_StyleScopedClasses['attendance-config']} */ ;
const __VLS_0 = AttendanceHeader;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onRefresh': {} },
    loading: (__VLS_ctx.globalLoading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onRefresh': {} },
    loading: (__VLS_ctx.globalLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ refresh: {} },
    { onRefresh: (__VLS_ctx.refreshAll) });
var __VLS_3;
var __VLS_4;
const __VLS_7 = ShiftTabs;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    modelValue: (__VLS_ctx.activeShift),
}));
const __VLS_9 = __VLS_8({
    modelValue: (__VLS_ctx.activeShift),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const __VLS_12 = LiveDashboard;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
if (__VLS_ctx.activeShift === 'day') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_17 = CompanyDefaults;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        shiftType: "day",
    }));
    const __VLS_19 = __VLS_18({
        shiftType: "day",
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    const __VLS_22 = DepartmentOverrides;
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({}));
    const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
    const __VLS_27 = EmployeeOverrides;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
    const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
    const __VLS_32 = LunchTracking;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
    const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
    const __VLS_37 = OvertimeRules;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({}));
    const __VLS_39 = __VLS_38({}, ...__VLS_functionalComponentArgsRest(__VLS_38));
    const __VLS_42 = LateNightAdjustments;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
    const __VLS_44 = __VLS_43({}, ...__VLS_functionalComponentArgsRest(__VLS_43));
    const __VLS_47 = FieldWorkRegistration;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({}));
    const __VLS_49 = __VLS_48({}, ...__VLS_functionalComponentArgsRest(__VLS_48));
}
if (__VLS_ctx.activeShift === 'night') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_52 = CompanyDefaults;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
        shiftType: "night",
    }));
    const __VLS_54 = __VLS_53({
        shiftType: "night",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    const __VLS_57 = DinnerTracking;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({}));
    const __VLS_59 = __VLS_58({}, ...__VLS_functionalComponentArgsRest(__VLS_58));
}
if (__VLS_ctx.activeShift === 'holidays') {
    const __VLS_62 = HolidaysConfig;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({}));
    const __VLS_64 = __VLS_63({}, ...__VLS_functionalComponentArgsRest(__VLS_63));
}
const __VLS_67 = Toast;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    toasts: (__VLS_ctx.toasts),
}));
const __VLS_69 = __VLS_68({
    toasts: (__VLS_ctx.toasts),
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
// @ts-ignore
[globalLoading, refreshAll, activeShift, activeShift, activeShift, activeShift, toasts,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
