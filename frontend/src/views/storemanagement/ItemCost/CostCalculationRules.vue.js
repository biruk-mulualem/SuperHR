import { computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const currentDate = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});
const goBack = () => {
    router.push('/cost-dashboard');
};
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
/** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
/** @type {__VLS_StyleScopedClasses['important-note']} */ ;
/** @type {__VLS_StyleScopedClasses['important-note']} */ ;
/** @type {__VLS_StyleScopedClasses['important-note']} */ ;
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
/** @type {__VLS_StyleScopedClasses['formula-box']} */ ;
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
/** @type {__VLS_StyleScopedClasses['example-box']} */ ;
/** @type {__VLS_StyleScopedClasses['example-good']} */ ;
/** @type {__VLS_StyleScopedClasses['example-bad']} */ ;
/** @type {__VLS_StyleScopedClasses['example-good']} */ ;
/** @type {__VLS_StyleScopedClasses['example-label']} */ ;
/** @type {__VLS_StyleScopedClasses['example-bad']} */ ;
/** @type {__VLS_StyleScopedClasses['example-label']} */ ;
/** @type {__VLS_StyleScopedClasses['example-data']} */ ;
/** @type {__VLS_StyleScopedClasses['example-good']} */ ;
/** @type {__VLS_StyleScopedClasses['example-result']} */ ;
/** @type {__VLS_StyleScopedClasses['example-bad']} */ ;
/** @type {__VLS_StyleScopedClasses['example-result']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['partial']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['incomplete']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['inactive']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
/** @type {__VLS_StyleScopedClasses['result-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['result-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-note']} */ ;
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['example-calculation']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-store']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-group-result']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['example-content']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-details']} */ ;
/** @type {__VLS_StyleScopedClasses['calc-stores']} */ ;
/** @type {__VLS_StyleScopedClasses['requirements-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['status-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-page']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
/** @type {__VLS_StyleScopedClasses['formula-box']} */ ;
/** @type {__VLS_StyleScopedClasses['formula']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-page" },
});
/** @type {__VLS_StyleScopedClasses['rules-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "rules-header" },
});
/** @type {__VLS_StyleScopedClasses['rules-header']} */ ;
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
    d: "M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "2",
    y: "7",
    width: "20",
    height: "10",
    rx: "1",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-right" },
});
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "btn-back" },
});
/** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-content" },
});
/** @type {__VLS_StyleScopedClasses['rules-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "formula-box" },
});
/** @type {__VLS_StyleScopedClasses['formula-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "formula" },
});
/** @type {__VLS_StyleScopedClasses['formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "important-note" },
});
/** @type {__VLS_StyleScopedClasses['important-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "note-icon" },
});
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "note-text" },
});
/** @type {__VLS_StyleScopedClasses['note-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirements-grid" },
});
/** @type {__VLS_StyleScopedClasses['requirements-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirement-card pass" },
});
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pass']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-icon" },
});
/** @type {__VLS_StyleScopedClasses['req-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-content" },
});
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "req-desc" },
});
/** @type {__VLS_StyleScopedClasses['req-desc']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirement-card pass" },
});
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pass']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-icon" },
});
/** @type {__VLS_StyleScopedClasses['req-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-content" },
});
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "req-desc" },
});
/** @type {__VLS_StyleScopedClasses['req-desc']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirement-card pass" },
});
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pass']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-icon" },
});
/** @type {__VLS_StyleScopedClasses['req-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-content" },
});
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "req-desc" },
});
/** @type {__VLS_StyleScopedClasses['req-desc']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirement-card pass" },
});
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pass']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-icon" },
});
/** @type {__VLS_StyleScopedClasses['req-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-content" },
});
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "req-desc" },
});
/** @type {__VLS_StyleScopedClasses['req-desc']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirement-card pass" },
});
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pass']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-icon" },
});
/** @type {__VLS_StyleScopedClasses['req-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-content" },
});
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "req-desc" },
});
/** @type {__VLS_StyleScopedClasses['req-desc']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "requirement-card pass" },
});
/** @type {__VLS_StyleScopedClasses['requirement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pass']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-icon" },
});
/** @type {__VLS_StyleScopedClasses['req-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "req-content" },
});
/** @type {__VLS_StyleScopedClasses['req-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "req-desc" },
});
/** @type {__VLS_StyleScopedClasses['req-desc']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-box" },
});
/** @type {__VLS_StyleScopedClasses['example-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-content" },
});
/** @type {__VLS_StyleScopedClasses['example-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-good" },
});
/** @type {__VLS_StyleScopedClasses['example-good']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "example-label" },
});
/** @type {__VLS_StyleScopedClasses['example-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-data" },
});
/** @type {__VLS_StyleScopedClasses['example-data']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-result" },
});
/** @type {__VLS_StyleScopedClasses['example-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-bad" },
});
/** @type {__VLS_StyleScopedClasses['example-bad']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "example-label" },
});
/** @type {__VLS_StyleScopedClasses['example-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-data" },
});
/** @type {__VLS_StyleScopedClasses['example-data']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-result" },
});
/** @type {__VLS_StyleScopedClasses['example-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "conflict-rules" },
});
/** @type {__VLS_StyleScopedClasses['conflict-rules']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rule-item" },
});
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "rule-icon" },
});
/** @type {__VLS_StyleScopedClasses['rule-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rule-item" },
});
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "rule-icon" },
});
/** @type {__VLS_StyleScopedClasses['rule-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rule-item" },
});
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "rule-icon" },
});
/** @type {__VLS_StyleScopedClasses['rule-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rule-item" },
});
/** @type {__VLS_StyleScopedClasses['rule-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "rule-icon" },
});
/** @type {__VLS_StyleScopedClasses['rule-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-grid" },
});
/** @type {__VLS_StyleScopedClasses['status-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-card active" },
});
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-header" },
});
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-icon" },
});
/** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-body" },
});
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-result" },
});
/** @type {__VLS_StyleScopedClasses['status-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "result-badge included" },
});
/** @type {__VLS_StyleScopedClasses['result-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['included']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-card partial" },
});
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['partial']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-header" },
});
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-icon" },
});
/** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-body" },
});
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-result" },
});
/** @type {__VLS_StyleScopedClasses['status-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "result-badge excluded" },
});
/** @type {__VLS_StyleScopedClasses['result-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['excluded']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-reason" },
});
/** @type {__VLS_StyleScopedClasses['status-reason']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-card incomplete" },
});
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['incomplete']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-header" },
});
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-icon" },
});
/** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-body" },
});
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-result" },
});
/** @type {__VLS_StyleScopedClasses['status-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "result-badge excluded" },
});
/** @type {__VLS_StyleScopedClasses['result-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['excluded']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-reason" },
});
/** @type {__VLS_StyleScopedClasses['status-reason']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-card inactive" },
});
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['inactive']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-header" },
});
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-icon" },
});
/** @type {__VLS_StyleScopedClasses['status-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-body" },
});
/** @type {__VLS_StyleScopedClasses['status-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-result" },
});
/** @type {__VLS_StyleScopedClasses['status-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "result-badge excluded" },
});
/** @type {__VLS_StyleScopedClasses['result-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['excluded']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "status-reason" },
});
/** @type {__VLS_StyleScopedClasses['status-reason']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metrics-grid" },
});
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-card" },
});
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-header" },
});
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "metric-icon" },
});
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-body" },
});
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-formula" },
});
/** @type {__VLS_StyleScopedClasses['metric-formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-example" },
});
/** @type {__VLS_StyleScopedClasses['metric-example']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-card" },
});
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-header" },
});
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "metric-icon" },
});
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-body" },
});
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-formula" },
});
/** @type {__VLS_StyleScopedClasses['metric-formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-example" },
});
/** @type {__VLS_StyleScopedClasses['metric-example']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-card" },
});
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-header" },
});
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "metric-icon" },
});
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-body" },
});
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-formula" },
});
/** @type {__VLS_StyleScopedClasses['metric-formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-example" },
});
/** @type {__VLS_StyleScopedClasses['metric-example']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-note" },
});
/** @type {__VLS_StyleScopedClasses['metric-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "note-icon" },
});
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-card" },
});
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-header" },
});
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "metric-icon" },
});
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-body" },
});
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-formula" },
});
/** @type {__VLS_StyleScopedClasses['metric-formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-example" },
});
/** @type {__VLS_StyleScopedClasses['metric-example']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-note" },
});
/** @type {__VLS_StyleScopedClasses['metric-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "note-icon" },
});
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-card" },
});
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-header" },
});
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "metric-icon" },
});
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-body" },
});
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-formula" },
});
/** @type {__VLS_StyleScopedClasses['metric-formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-example" },
});
/** @type {__VLS_StyleScopedClasses['metric-example']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-note" },
});
/** @type {__VLS_StyleScopedClasses['metric-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "note-icon" },
});
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-card" },
});
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-header" },
});
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "metric-icon" },
});
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-body" },
});
/** @type {__VLS_StyleScopedClasses['metric-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-formula" },
});
/** @type {__VLS_StyleScopedClasses['metric-formula']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-example" },
});
/** @type {__VLS_StyleScopedClasses['metric-example']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "metric-note" },
});
/** @type {__VLS_StyleScopedClasses['metric-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "note-icon" },
});
/** @type {__VLS_StyleScopedClasses['note-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flowchart" },
});
/** @type {__VLS_StyleScopedClasses['flowchart']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-step start" },
});
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['start']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-icon" },
});
/** @type {__VLS_StyleScopedClasses['step-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-label" },
});
/** @type {__VLS_StyleScopedClasses['step-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-arrow" },
});
/** @type {__VLS_StyleScopedClasses['flow-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-step check" },
});
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['check']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-icon" },
});
/** @type {__VLS_StyleScopedClasses['step-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-label" },
});
/** @type {__VLS_StyleScopedClasses['step-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-result fail" },
});
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['fail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-arrow" },
});
/** @type {__VLS_StyleScopedClasses['flow-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-step check" },
});
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['check']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-icon" },
});
/** @type {__VLS_StyleScopedClasses['step-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-label" },
});
/** @type {__VLS_StyleScopedClasses['step-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-result fail" },
});
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['fail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-arrow" },
});
/** @type {__VLS_StyleScopedClasses['flow-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-step check" },
});
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['check']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-icon" },
});
/** @type {__VLS_StyleScopedClasses['step-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-label" },
});
/** @type {__VLS_StyleScopedClasses['step-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-result fail" },
});
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['fail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-arrow" },
});
/** @type {__VLS_StyleScopedClasses['flow-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-step check" },
});
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['check']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-icon" },
});
/** @type {__VLS_StyleScopedClasses['step-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-label" },
});
/** @type {__VLS_StyleScopedClasses['step-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-result fail" },
});
/** @type {__VLS_StyleScopedClasses['step-result']} */ ;
/** @type {__VLS_StyleScopedClasses['fail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-arrow" },
});
/** @type {__VLS_StyleScopedClasses['flow-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flow-step success" },
});
/** @type {__VLS_StyleScopedClasses['flow-step']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-icon" },
});
/** @type {__VLS_StyleScopedClasses['step-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "step-label" },
});
/** @type {__VLS_StyleScopedClasses['step-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "example-calculation" },
});
/** @type {__VLS_StyleScopedClasses['example-calculation']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-details" },
});
/** @type {__VLS_StyleScopedClasses['calc-details']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value status-partial-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-partial-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-stores" },
});
/** @type {__VLS_StyleScopedClasses['calc-stores']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-store" },
});
/** @type {__VLS_StyleScopedClasses['calc-store']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group" },
});
/** @type {__VLS_StyleScopedClasses['calc-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group" },
});
/** @type {__VLS_StyleScopedClasses['calc-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group-result" },
});
/** @type {__VLS_StyleScopedClasses['calc-group-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-store" },
});
/** @type {__VLS_StyleScopedClasses['calc-store']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group" },
});
/** @type {__VLS_StyleScopedClasses['calc-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group" },
});
/** @type {__VLS_StyleScopedClasses['calc-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group-result conflict" },
});
/** @type {__VLS_StyleScopedClasses['calc-group-result']} */ ;
/** @type {__VLS_StyleScopedClasses['conflict']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-store" },
});
/** @type {__VLS_StyleScopedClasses['calc-store']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group" },
});
/** @type {__VLS_StyleScopedClasses['calc-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group" },
});
/** @type {__VLS_StyleScopedClasses['calc-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-group-result" },
});
/** @type {__VLS_StyleScopedClasses['calc-group-result']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-final" },
});
/** @type {__VLS_StyleScopedClasses['calc-final']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row final" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['final']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row final" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['final']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row final" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['final']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calc-row final" },
});
/** @type {__VLS_StyleScopedClasses['calc-row']} */ ;
/** @type {__VLS_StyleScopedClasses['final']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-label" },
});
/** @type {__VLS_StyleScopedClasses['calc-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "calc-value highlight" },
});
/** @type {__VLS_StyleScopedClasses['calc-value']} */ ;
/** @type {__VLS_StyleScopedClasses['highlight']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-section" },
});
/** @type {__VLS_StyleScopedClasses['rules-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "reference-table" },
});
/** @type {__VLS_StyleScopedClasses['reference-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
    ...{ class: "text-muted" },
});
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
    ...{ class: "text-danger" },
});
/** @type {__VLS_StyleScopedClasses['text-danger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
    ...{ class: "text-danger" },
});
/** @type {__VLS_StyleScopedClasses['text-danger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
    ...{ class: "text-danger" },
});
/** @type {__VLS_StyleScopedClasses['text-danger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
    ...{ class: "text-danger" },
});
/** @type {__VLS_StyleScopedClasses['text-danger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
    ...{ class: "text-success" },
});
/** @type {__VLS_StyleScopedClasses['text-success']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rules-footer" },
});
/** @type {__VLS_StyleScopedClasses['rules-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.currentDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "note" },
});
/** @type {__VLS_StyleScopedClasses['note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
// @ts-ignore
[goBack, currentDate,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
