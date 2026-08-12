const props = defineProps({
    languageSkills: {
        type: Array,
        default: () => []
    },
    otherSkills: {
        type: String,
        default: ''
    },
    t: { type: Function, default: (key) => key } // ← ADD THIS
});
const emit = defineEmits(['update:languageSkills', 'update:otherSkills']);
const addLanguage = () => {
    const newLanguages = [...props.languageSkills, {
            language: '',
            proficiency: ''
        }];
    emit('update:languageSkills', newLanguages);
};
const updateLanguage = (index, field, value) => {
    const newLanguages = [...props.languageSkills];
    newLanguages[index] = { ...newLanguages[index], [field]: value };
    emit('update:languageSkills', newLanguages);
};
const removeLanguage = (index) => {
    const newLanguages = [...props.languageSkills];
    newLanguages.splice(index, 1);
    emit('update:languageSkills', newLanguages);
};
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
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-remove-small']} */ ;
/** @type {__VLS_StyleScopedClasses['language-row']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-remove-small']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-card" },
});
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M5 8h10M9 4v4M11 12h8M15 8v4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M2 2h20v20H2z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(props.t('skills.title') || 'Skills');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-body" },
});
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('skills.languageTitle') || 'Language Skills');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addLanguage) },
    type: "button",
    ...{ class: "btn-add" },
});
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
(props.t('common.add') || 'Add Language');
for (const [lang, index] of __VLS_vFor((__VLS_ctx.languageSkills))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (index),
        ...{ class: "language-item" },
    });
    /** @type {__VLS_StyleScopedClasses['language-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "language-row" },
    });
    /** @type {__VLS_StyleScopedClasses['language-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.updateLanguage(index, 'language', $event.target.value);
                // @ts-ignore
                [addLanguage, languageSkills, updateLanguage,];
            } },
        value: (lang.language),
        ...{ class: "language-select" },
    });
    /** @type {__VLS_StyleScopedClasses['language-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (props.t('skills.selectLanguage') || 'Select language...');
    __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
        label: (props.t('skills.ethiopianLanguages') || '🇪🇹 Ethiopian Languages'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "amharic",
    });
    (props.t('skills.amharic') || 'Amharic');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "oromo",
    });
    (props.t('skills.oromo') || 'Oromo');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "tigrinya",
    });
    (props.t('skills.tigrinya') || 'Tigrinya');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "somali",
    });
    (props.t('skills.somali') || 'Somali');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "sidamo",
    });
    (props.t('skills.sidamo') || 'Sidamo');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "wolaytta",
    });
    (props.t('skills.wolaytta') || 'Wolaytta');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "afar",
    });
    (props.t('skills.afar') || 'Afar');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "hadiyya",
    });
    (props.t('skills.hadiyya') || 'Hadiyya');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "gamo",
    });
    (props.t('skills.gamo') || 'Gamo');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "gurage",
    });
    (props.t('skills.gurage') || 'Gurage');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "kembata",
    });
    (props.t('skills.kembata') || 'Kembata');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "silte",
    });
    (props.t('skills.silte') || "Silt'e");
    __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
        label: (props.t('skills.africanLanguages') || '🌍 African Languages'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "swahili",
    });
    (props.t('skills.swahili') || 'Swahili');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "hausa",
    });
    (props.t('skills.hausa') || 'Hausa');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "yoruba",
    });
    (props.t('skills.yoruba') || 'Yoruba');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "zulu",
    });
    (props.t('skills.zulu') || 'Zulu');
    __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
        label: (props.t('skills.europeanLanguages') || '🌎 European Languages'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "english",
    });
    (props.t('skills.english') || 'English');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "french",
    });
    (props.t('skills.french') || 'French');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "spanish",
    });
    (props.t('skills.spanish') || 'Spanish');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "german",
    });
    (props.t('skills.german') || 'German');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "italian",
    });
    (props.t('skills.italian') || 'Italian');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "russian",
    });
    (props.t('skills.russian') || 'Russian');
    __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
        label: (props.t('skills.asianLanguages') || '🌏 Asian Languages'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "chinese",
    });
    (props.t('skills.chinese') || 'Chinese');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "japanese",
    });
    (props.t('skills.japanese') || 'Japanese');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "korean",
    });
    (props.t('skills.korean') || 'Korean');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "arabic",
    });
    (props.t('skills.arabic') || 'Arabic');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "hindi",
    });
    (props.t('skills.hindi') || 'Hindi');
    __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
        label: (props.t('skills.otherLanguages') || 'Other Languages'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "others",
    });
    (props.t('skills.others') || 'Others');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.updateLanguage(index, 'proficiency', $event.target.value);
                // @ts-ignore
                [updateLanguage,];
            } },
        value: (lang.proficiency),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (props.t('skills.selectLevel') || 'Select level');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "basic",
    });
    (props.t('skills.basic') || 'Basic');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "intermediate",
    });
    (props.t('skills.intermediate') || 'Intermediate');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "advanced",
    });
    (props.t('skills.advanced') || 'Advanced');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "fluent",
    });
    (props.t('skills.fluent') || 'Fluent');
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "native",
    });
    (props.t('skills.native') || 'Native');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeLanguage(index);
                // @ts-ignore
                [removeLanguage,];
            } },
        type: "button",
        ...{ class: "btn-remove-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-remove-small']} */ ;
    // @ts-ignore
    [];
}
if (__VLS_ctx.languageSkills.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state-small" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
    (props.t('skills.noLanguages') || 'No languages added. Click "+ Add Language" to add language skills.');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
(props.t('skills.otherTitle') || 'Other Skills');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-field full-width" },
});
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.$emit('update:otherSkills', $event.target.value);
            // @ts-ignore
            [languageSkills, $emit,];
        } },
    value: (__VLS_ctx.otherSkills),
    rows: "4",
    placeholder: (props.t('skills.otherPlaceholder') || 'List any other skills, certifications, or qualifications...'),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
    ...{ class: "field-hint" },
});
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
(props.t('skills.otherHint') || 'e.g., Project Management, Leadership, Software Proficiency, Microsoft Office, Data Analysis, etc.');
// @ts-ignore
[otherSkills,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        languageSkills: {
            type: Array,
            default: () => []
        },
        otherSkills: {
            type: String,
            default: ''
        },
        t: { type: Function, default: (key) => key } // ← ADD THIS
    },
});
export default {};
