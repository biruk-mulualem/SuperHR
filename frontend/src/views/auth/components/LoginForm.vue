<template>
  <div
    class="form-card"
    :style="{
      transform: `translateX(${errorShake}px)`,
    }"
  >
    <!-- General Error Message -->
    <div v-if="generalError" class="general-error-container">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span class="general-error-text">{{ generalError }}</span>
    </div>

    <!-- Username Input -->
    <div class="input-wrapper">
      <label
        class="input-label"
        :class="{
          'input-label-focused': focusedInput === 'username',
          'input-label-error': errors.username,
        }"
      >
        Username
      </label>
      <div
        class="input-container"
        :class="{
          'input-container-focused': focusedInput === 'username',
          'input-container-error': errors.username,
        }"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <input
          v-model="username"
          type="text"
          class="input-field"
          placeholder="Enter your username"
          @focus="focusedInput = 'username'"
          @blur="focusedInput = null"
          @input="clearUsernameError"
        />
      </div>
      <div v-if="errors.username" class="error-text">
        {{ errors.username }}
      </div>
    </div>

    <!-- Password Input -->
    <div class="input-wrapper">
      <label
        class="input-label"
        :class="{
          'input-label-focused': focusedInput === 'password',
          'input-label-error': errors.password,
        }"
      >
        Password
      </label>
      <div
        class="input-container"
        :class="{
          'input-container-focused': focusedInput === 'password',
          'input-container-error': errors.password,
        }"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <input
          v-model="password"
          :type="isPasswordVisible ? 'text' : 'password'"
          class="input-field"
          placeholder="Enter your password"
          @focus="focusedInput = 'password'"
          @blur="focusedInput = null"
          @input="handlePasswordInput"
        />
        <button
          type="button"
          class="eye-icon"
          @click="isPasswordVisible = !isPasswordVisible"
        >
          <svg
            v-if="!isPasswordVisible"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg
            v-else
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>
      </div>
      <div v-if="errors.password" class="error-text">
        {{ errors.password }}
      </div>

      <!-- Password Strength Indicator -->
      <div v-if="showStrength && password.length > 0 && !errors.password" class="strength-container">
        <div class="strength-bar-container">
          <div
            v-for="i in 5"
            :key="i"
            class="strength-bar"
            :style="{
              backgroundColor: i <= passwordStrength ? getStrengthColor() : '#e0e0e0',
            }"
          />
        </div>
        <span class="strength-text" :style="{ color: getStrengthColor() }">
          {{ getStrengthText() }}
        </span>
      </div>
    </div>

   

    <!-- Login Button -->
    <button
      class="login-button"
      :class="{ 'login-button-disabled': loading }"
      :disabled="loading"
      @click="handleLogin"
    >
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <template v-else>
        <span class="login-button-text">Login</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </template>
    </button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const username = ref('')
const password = ref('')
const loading = ref(false)
const isPasswordVisible = ref(false)
const focusedInput = ref(null)
const generalError = ref('')
const showStrength = ref(false)
const passwordStrength = ref(0)

// Validation errors
const errors = reactive({
  username: '',
  password: ''
})

// Animation values
const errorShake = ref(0)

// Clear errors when typing
const clearUsernameError = () => {
  if (username.value && errors.username) {
    errors.username = ''
  }
  if (generalError.value) generalError.value = ''
}

// Password strength checker
const checkPasswordStrength = (pwd) => {
  let strength = 0
  if (pwd.length > 0) showStrength.value = true
  if (pwd.length >= 8) strength += 1
  if (pwd.match(/[a-z]/)) strength += 1
  if (pwd.match(/[A-Z]/)) strength += 1
  if (pwd.match(/[0-9]/)) strength += 1
  if (pwd.match(/[^a-zA-Z0-9]/)) strength += 1
  passwordStrength.value = strength
  
  if (errors.password) {
    errors.password = ''
  }
}

const handlePasswordInput = (e) => {
  password.value = e.target.value
  checkPasswordStrength(password.value)
}

const getStrengthColor = () => {
  const colors = ['#ff4d4d', '#ffa64d', '#ffff4d', '#4dff4d', '#00cc66']
  return colors[passwordStrength.value - 1] || '#ff4d4d'
}

const getStrengthText = () => {
  const texts = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  return texts[passwordStrength.value - 1] || 'Enter password'
}

// Shake animation for errors
const shakeError = () => {
  let start = 0
  const interval = setInterval(() => {
    if (start === 0) errorShake.value = 10
    else if (start === 1) errorShake.value = -10
    else if (start === 2) errorShake.value = 0
    else clearInterval(interval)
    start++
  }, 100)
}

// Validate form
const validateForm = () => {
  const newErrors = { username: '', password: '' }
  let isValid = true

  if (!username.value.trim()) {
    newErrors.username = 'Username is required'
    isValid = false
  } else if (username.value.length < 3) {
    newErrors.username = 'Username must be at least 3 characters'
    isValid = false
  }

  if (!password.value) {
    newErrors.password = 'Password is required'
    isValid = false
  } else if (password.value.length < 6) {
    newErrors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  errors.username = newErrors.username
  errors.password = newErrors.password

  if (!isValid) {
    shakeError()
  }

  return isValid
}

// Handle forgot password
const handleForgotPassword = () => {
  alert('Please contact your administrator to reset your password.')
}

// Handle login - Using auth store
const handleLogin = async () => {
  generalError.value = ''
  
  if (!validateForm()) {
    return
  }

  loading.value = true

  const result = await authStore.login(username.value, password.value)
  
  if (result.success) {
    loading.value = false
    router.push('/dashboard')
  } else {
    errors.username = 'Invalid credentials'
    errors.password = 'Invalid credentials'
    generalError.value = result.error || 'Login failed'
    shakeError()
    loading.value = false
  }
}
</script>

<style scoped>
/* Form Card */
.form-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  padding: 40px 32px;
  width: 100%;
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

/* Input Wrapper */
.input-wrapper {
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  display: block;
  transition: color 0.2s ease;
}

.input-label-focused {
  color: #d4b012;
}

.input-label-error {
  color: #ff4444;
}

.input-container {
  display: flex;
  align-items: center;
  border: 1.5px solid #e0e0e0;
  border-radius: 15px;
  background: #f8f9fa;
  padding: 0 15px;
  height: 55px;
  transition: all 0.2s ease;
}

.input-container svg {
  margin-right: 10px;
  color: #999;
  flex-shrink: 0;
}

.input-container-focused {
  border-color: #d4b012;
  background: white;
  box-shadow: 0 4px 8px rgba(106, 17, 203, 0.1);
}

.input-container-focused svg {
  color: #d4b012;
}

.input-container-error {
  border-color: #ff4444;
  background: #fff5f5;
}

.input-container-error svg {
  color: #ff4444;
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #333;
  outline: none;
  height: 100%;
  font-family: inherit;
}

.input-field::placeholder {
  color: #999;
}

/* Eye Icon */
.eye-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: color 0.2s ease;
}

.eye-icon:hover {
  color: #d4b012;
}

/* Error Text */
.error-text {
  color: #ff4444;
  font-size: 12px;
  margin-top: 4px;
  margin-left: 5px;
}

/* Strength Indicator */
.strength-container {
  margin-top: 8px;
  padding: 0 5px;
}

.strength-bar-container {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
}

.strength-bar {
  height: 4px;
  border-radius: 2px;
  flex: 1;
  transition: background-color 0.2s ease;
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
}

/* Forgot Password */
.forgot-container {
  text-align: right;
  margin-bottom: 24px;
}

.forgot-text {
  background: none;
  border: none;
  color: #d4b012;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 5px;
}

.forgot-text:hover {
  text-decoration: underline;
}

/* Login Button */
.login-button {
  width: 100%;
  height: 55px;
  border-radius: 15px;
  background: linear-gradient(135deg, #d4b012 0%, #d4b012 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 8px 15px rgba(226, 172, 9, 0.3);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(226, 172, 9, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.login-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-button-disabled:hover {
  transform: none;
}

.login-button-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.login-button svg {
  color: white;
}

/* Loading Spinner */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* General Error */
.general-error-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffebee;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}

.general-error-container svg {
  color: #ff4444;
  flex-shrink: 0;
}

.general-error-text {
  flex: 1;
  color: #ff4444;
  font-size: 13px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 480px) {
  .form-card {
    padding: 30px 24px;
  }
}
</style>