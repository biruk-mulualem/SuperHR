import { ref, onMounted } from 'vue';
const fadeAnim = ref(0);
const slideAnim = ref(30);
onMounted(() => {
    setTimeout(() => {
        fadeAnim.value = 1;
        slideAnim.value = 0;
    }, 100);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "particle-container" },
});
/** @type {__VLS_StyleScopedClasses['particle-container']} */ ;
for (const [i] of __VLS_vFor((5))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        key: (i),
        ...{ class: "particle" },
        ...{ style: ({
                opacity: __VLS_ctx.fadeAnim,
                transform: `translateY(${__VLS_ctx.slideAnim * (i * 15)}px)`,
                backgroundColor: `rgba(255, 255, 255, ${0.1 + i * 0.05})`,
                left: `${10 + i * 20}%`,
                top: `${20 + i * 15}%`,
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['particle']} */ ;
    // @ts-ignore
    [fadeAnim, slideAnim,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
