import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { locale } = useI18n();
const currentLanguage = ref(locale.value);
const setLanguage = (lang) => {
    locale.value = lang;
    currentLanguage.value = lang;
    localStorage.setItem('language', lang);
    // Optional: reload page to refresh all components
    // window.location.reload()
};
onMounted(() => {
    currentLanguage.value = localStorage.getItem('language') || 'en';
    locale.value = currentLanguage.value;
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['lang-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "language-switcher" },
});
/** @type {__VLS_StyleScopedClasses['language-switcher']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setLanguage('en');
            // @ts-ignore
            [setLanguage,];
        } },
    ...{ class: "lang-btn" },
    ...{ class: ({ active: __VLS_ctx.currentLanguage === 'en' }) },
});
/** @type {__VLS_StyleScopedClasses['lang-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setLanguage('am');
            // @ts-ignore
            [setLanguage, currentLanguage,];
        } },
    ...{ class: "lang-btn" },
    ...{ class: ({ active: __VLS_ctx.currentLanguage === 'am' }) },
});
/** @type {__VLS_StyleScopedClasses['lang-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
// @ts-ignore
[currentLanguage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
