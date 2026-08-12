import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
// Form data
const username = ref('');
const password = ref('');
const loading = ref(false);
const isPasswordVisible = ref(false);
const focusedInput = ref(null);
const generalError = ref('');
const showStrength = ref(false);
const passwordStrength = ref(0);
// Validation errors
const errors = reactive({
    username: '',
    password: ''
});
// Animation values
const errorShake = ref(0);
// Clear errors when typing
const clearUsernameError = () => {
    if (username.value && errors.username) {
        errors.username = '';
    }
    if (generalError.value)
        generalError.value = '';
};
// Password strength checker
const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length > 0)
        showStrength.value = true;
    if (pwd.length >= 8)
        strength += 1;
    if (pwd.match(/[a-z]/))
        strength += 1;
    if (pwd.match(/[A-Z]/))
        strength += 1;
    if (pwd.match(/[0-9]/))
        strength += 1;
    if (pwd.match(/[^a-zA-Z0-9]/))
        strength += 1;
    passwordStrength.value = strength;
    if (errors.password) {
        errors.password = '';
    }
};
const handlePasswordInput = (e) => {
    password.value = e.target.value;
    checkPasswordStrength(password.value);
};
const getStrengthColor = () => {
    const colors = ['#ff4d4d', '#ffa64d', '#ffff4d', '#4dff4d', '#00cc66'];
    return colors[passwordStrength.value - 1] || '#ff4d4d';
};
const getStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return texts[passwordStrength.value - 1] || 'Enter password';
};
// Shake animation for errors
const shakeError = () => {
    let start = 0;
    const interval = setInterval(() => {
        if (start === 0)
            errorShake.value = 10;
        else if (start === 1)
            errorShake.value = -10;
        else if (start === 2)
            errorShake.value = 0;
        else
            clearInterval(interval);
        start++;
    }, 100);
};
// Validate form
const validateForm = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;
    if (!username.value.trim()) {
        newErrors.username = 'Username is required';
        isValid = false;
    }
    else if (username.value.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
        isValid = false;
    }
    if (!password.value) {
        newErrors.password = 'Password is required';
        isValid = false;
    }
    else if (password.value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        isValid = false;
    }
    errors.username = newErrors.username;
    errors.password = newErrors.password;
    if (!isValid) {
        shakeError();
    }
    return isValid;
};
// Handle forgot password
const handleForgotPassword = () => {
    alert('Please contact your administrator to reset your password.');
};
// Handle login - Using auth store
const handleLogin = async () => {
    generalError.value = '';
    if (!validateForm()) {
        return;
    }
    loading.value = true;
    const result = await authStore.login(username.value, password.value);
    if (result.success) {
        loading.value = false;
        router.push('/dashboard');
    }
    else {
        errors.username = 'Invalid credentials';
        errors.password = 'Invalid credentials';
        generalError.value = result.error || 'Login failed';
        shakeError();
        loading.value = false;
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['input-container']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container-focused']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container-error']} */ ;
/** @type {__VLS_StyleScopedClasses['input-field']} */ ;
/** @type {__VLS_StyleScopedClasses['eye-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['forgot-text']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button-disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['general-error-container']} */ ;
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-card" },
    ...{ style: ({
            transform: `translateX(${__VLS_ctx.errorShake}px)`,
        }) },
});
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
if (__VLS_ctx.generalError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "general-error-container" },
    });
    /** @type {__VLS_StyleScopedClasses['general-error-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "20",
        height: "20",
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "8",
        x2: "12",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "16",
        x2: "12.01",
        y2: "16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "general-error-text" },
    });
    /** @type {__VLS_StyleScopedClasses['general-error-text']} */ ;
    (__VLS_ctx.generalError);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['input-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "input-label" },
    ...{ class: ({
            'input-label-focused': __VLS_ctx.focusedInput === 'username',
            'input-label-error': __VLS_ctx.errors.username,
        }) },
});
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label-focused']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label-error']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-container" },
    ...{ class: ({
            'input-container-focused': __VLS_ctx.focusedInput === 'username',
            'input-container-error': __VLS_ctx.errors.username,
        }) },
});
/** @type {__VLS_StyleScopedClasses['input-container']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container-focused']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container-error']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "7",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onFocus: (...[$event]) => {
            __VLS_ctx.focusedInput = 'username';
            // @ts-ignore
            [errorShake, generalError, generalError, focusedInput, focusedInput, focusedInput, errors, errors,];
        } },
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.focusedInput = null;
            // @ts-ignore
            [focusedInput,];
        } },
    ...{ onInput: (__VLS_ctx.clearUsernameError) },
    value: (__VLS_ctx.username),
    type: "text",
    ...{ class: "input-field" },
    placeholder: "Enter your username",
});
/** @type {__VLS_StyleScopedClasses['input-field']} */ ;
if (__VLS_ctx.errors.username) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-text" },
    });
    /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
    (__VLS_ctx.errors.username);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['input-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "input-label" },
    ...{ class: ({
            'input-label-focused': __VLS_ctx.focusedInput === 'password',
            'input-label-error': __VLS_ctx.errors.password,
        }) },
});
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label-focused']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label-error']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-container" },
    ...{ class: ({
            'input-container-focused': __VLS_ctx.focusedInput === 'password',
            'input-container-error': __VLS_ctx.errors.password,
        }) },
});
/** @type {__VLS_StyleScopedClasses['input-container']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container-focused']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container-error']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
    x: "3",
    y: "11",
    width: "18",
    height: "11",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M7 11V7a5 5 0 0 1 10 0v4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onFocus: (...[$event]) => {
            __VLS_ctx.focusedInput = 'password';
            // @ts-ignore
            [focusedInput, focusedInput, focusedInput, errors, errors, errors, errors, clearUsernameError, username,];
        } },
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.focusedInput = null;
            // @ts-ignore
            [focusedInput,];
        } },
    ...{ onInput: (__VLS_ctx.handlePasswordInput) },
    type: (__VLS_ctx.isPasswordVisible ? 'text' : 'password'),
    ...{ class: "input-field" },
    placeholder: "Enter your password",
});
(__VLS_ctx.password);
/** @type {__VLS_StyleScopedClasses['input-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.isPasswordVisible = !__VLS_ctx.isPasswordVisible;
            // @ts-ignore
            [handlePasswordInput, isPasswordVisible, isPasswordVisible, isPasswordVisible, password,];
        } },
    type: "button",
    ...{ class: "eye-icon" },
});
/** @type {__VLS_StyleScopedClasses['eye-icon']} */ ;
if (!__VLS_ctx.isPasswordVisible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "22",
        height: "22",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "3",
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "22",
        height: "22",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "1",
        y1: "1",
        x2: "23",
        y2: "23",
    });
}
if (__VLS_ctx.errors.password) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-text" },
    });
    /** @type {__VLS_StyleScopedClasses['error-text']} */ ;
    (__VLS_ctx.errors.password);
}
if (__VLS_ctx.showStrength && __VLS_ctx.password.length > 0 && !__VLS_ctx.errors.password) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "strength-container" },
    });
    /** @type {__VLS_StyleScopedClasses['strength-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "strength-bar-container" },
    });
    /** @type {__VLS_StyleScopedClasses['strength-bar-container']} */ ;
    for (const [i] of __VLS_vFor((5))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            key: (i),
            ...{ class: "strength-bar" },
            ...{ style: ({
                    backgroundColor: i <= __VLS_ctx.passwordStrength ? __VLS_ctx.getStrengthColor() : '#e0e0e0',
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['strength-bar']} */ ;
        // @ts-ignore
        [errors, errors, errors, isPasswordVisible, password, showStrength, passwordStrength, getStrengthColor,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "strength-text" },
        ...{ style: ({ color: __VLS_ctx.getStrengthColor() }) },
    });
    /** @type {__VLS_StyleScopedClasses['strength-text']} */ ;
    (__VLS_ctx.getStrengthText());
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleLogin) },
    ...{ class: "login-button" },
    ...{ class: ({ 'login-button-disabled': __VLS_ctx.loading }) },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button-disabled']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "login-button-text" },
    });
    /** @type {__VLS_StyleScopedClasses['login-button-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "5",
        y1: "12",
        x2: "19",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "12 5 19 12 12 19",
    });
}
// @ts-ignore
[getStrengthColor, getStrengthText, handleLogin, loading, loading, loading,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
