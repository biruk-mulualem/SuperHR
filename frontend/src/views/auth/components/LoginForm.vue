<template>
  <div
    class="form-card"
    :style="{
      transform: `translateX(${errorShake}px)`,
    }"
  >
    <!-- General Error Message -->
    <div v-if="generalError" class="general-error-container">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          @input="onUsernameChange"
          @keyup.enter="handleLogin"
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          @keyup.enter="handleLogin"
        />
        <button
          type="button"
          class="eye-icon"
          @click="isPasswordVisible = !isPasswordVisible"
        >
          <svg
            v-if="!isPasswordVisible"
            width="20"
            height="20"
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
            width="20"
            height="20"
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

    <!-- Store Selection - With Dropdown ABOVE the input -->
    <div v-if="showStoreField" class="input-wrapper store-wrapper">
      <label
        class="input-label"
        :class="{
          'input-label-focused': showStoreDropdown || selectedStore,
          'input-label-error': errors.store,
        }"
      >
        Select Store
      </label>
      <div class="store-select-wrapper">
        <!-- Store Dropdown - Displayed ABOVE the input -->
        <div v-if="showStoreDropdown" class="store-dropdown">
          <div v-if="storesLoading" class="store-option loading">
            <span class="spinner-small"></span> Loading stores...
          </div>
          <div
            v-else-if="stores.length === 0"
            class="store-option empty"
          >
            <span>No stores available</span>
          </div>
          <div
            v-else
            v-for="store in stores"
            :key="store.storeId || store.id"
            class="store-option"
            :class="{ 'store-option-active': selectedStore?.storeId === (store.storeId || store.id) }"
            @click="selectStore(store)"
          >
            <span class="store-option-icon">🏪</span>
            <div class="store-option-info">
              <span class="store-option-name">{{ store.name }}</span>
              <span class="store-option-code">{{ store.code }}</span>
              <span v-if="store.group" class="store-option-group">
                👥 {{ store.group.groupName }}
              </span>
              <span v-else class="store-option-group">No group assigned</span>
            </div>
            <span v-if="selectedStore?.storeId === (store.storeId || store.id)" class="store-check">✓</span>
          </div>
        </div>

        <!-- Store Input Field -->
        <div
          class="store-select-container"
          :class="{
            'store-select-focused': showStoreDropdown,
            'store-select-error': errors.store,
            'store-select-active': selectedStore,
          }"
          @click="toggleStoreDropdown"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <div class="store-select-trigger">
            <span class="selected-store-text" :class="{ 'placeholder-text': !selectedStore }">
              <span v-if="storesLoading" class="loading-text">
                <span class="spinner-small"></span> Loading stores...
              </span>
              <span v-else>
                {{ selectedStore ? selectedStore.name : 'Select a store...' }}
              </span>
            </span>
            <span v-if="selectedStore && !storesLoading" class="selected-store-code">{{ selectedStore.code }}</span>
          </div>
          <svg class="dropdown-arrow" :class="{ 'dropdown-arrow-open': showStoreDropdown }" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <div v-if="errors.store" class="error-text">
        {{ errors.store }}
      </div>
      <div v-if="stores.length > 0 && !selectedStore" class="store-hint">
        Click to select a store
      </div>
    </div>

    <!-- Login Button -->
    <button
      class="login-button"
      :class="{ 'login-button-disabled': loading }"
      :disabled="loading || !username || !password || (showStoreField && !selectedStore)"
      @click="handleLogin"
    >
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <template v-else>
        <span class="login-button-text">Login</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </template>
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// ================================================================
// FORM STATE
// ================================================================
const username = ref('')
const password = ref('')
const loading = ref(false)
const isPasswordVisible = ref(false)
const focusedInput = ref(null)
const generalError = ref('')
const showStrength = ref(false)
const passwordStrength = ref(0)

// ================================================================
// STORE STATE
// ================================================================
const stores = ref([])
const selectedStore = ref(null)
const storesLoading = ref(false)
const showStoreDropdown = ref(false)
const hasStores = ref(false)
const isStoreUser = ref(false)

// ================================================================
// CACHE
// ================================================================
const storeCache = new Map()

// ================================================================
// COMPUTED
// ================================================================
const showStoreField = computed(() => {
  return hasStores.value && stores.value.length > 0
})

// ================================================================
// VALIDATION ERRORS
// ================================================================
const errors = reactive({
  username: '',
  password: '',
  store: ''
})

// ================================================================
// ANIMATION
// ================================================================
const errorShake = ref(0)

// ================================================================
// METHODS
// ================================================================

const fetchStores = async () => {
  if (!username.value.trim()) {
    stores.value = []
    selectedStore.value = null
    hasStores.value = false
    isStoreUser.value = false
    return
  }

  const cacheKey = username.value.trim()

  // ✅ Check cache first for instant response
  if (storeCache.has(cacheKey)) {
    console.log('📦 Using cached stores for:', cacheKey)
    const cachedData = storeCache.get(cacheKey)
    stores.value = cachedData.stores
    hasStores.value = cachedData.hasStores
    isStoreUser.value = cachedData.isStoreUser
    
    if (stores.value.length > 0) {
      selectedStore.value = stores.value[0]
      errors.store = ''
    }
    return
  }

  storesLoading.value = true
  generalError.value = ''

  try {
    const response = await authStore.fetchStoresByUsername(username.value.trim())
    console.log('📥 Stores response:', response)

    if (response.success && response.data) {
      if (response.data.hasAccess && response.data.stores && response.data.stores.length > 0) {
        const mappedStores = response.data.stores.map(store => ({
          storeId: store.storeId || store.id,
          name: store.name,
          code: store.code,
          location: store.location || 'N/A',
          status: store.status || 'Active',
          group: store.groups && store.groups.length > 0 ? store.groups[0] : null
        }))
        
        stores.value = mappedStores
        hasStores.value = true
        isStoreUser.value = true
        
        // ✅ Store in cache
        storeCache.set(cacheKey, {
          stores: mappedStores,
          hasStores: true,
          isStoreUser: true
        })
        
        if (stores.value.length > 0) {
          selectedStore.value = stores.value[0]
          errors.store = ''
          console.log('🎯 Auto-selected store:', selectedStore.value.name)
          if (selectedStore.value.group) {
            console.log('👥 Group:', selectedStore.value.group.groupName)
          }
        }
      } else {
        stores.value = []
        selectedStore.value = null
        hasStores.value = false
        isStoreUser.value = false
        
        // ✅ Cache empty result too
        storeCache.set(cacheKey, {
          stores: [],
          hasStores: false,
          isStoreUser: false
        })
        console.log('👤 Legacy user (no stores)')
      }
    } else {
      stores.value = []
      selectedStore.value = null
      hasStores.value = false
      isStoreUser.value = false
      console.log('👤 Treating as legacy user')
    }
  } catch (err) {
    console.error('❌ Fetch stores error:', err)
    stores.value = []
    selectedStore.value = null
    hasStores.value = false
    isStoreUser.value = false
  } finally {
    storesLoading.value = false
  }
}

// ✅ Faster debounce - 200ms instead of 500ms
const onUsernameChange = () => {
  selectedStore.value = null
  stores.value = []
  errors.store = ''
  generalError.value = ''
  hasStores.value = false
  isStoreUser.value = false
  
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  
  const usernameTrimmed = username.value.trim()
  if (!usernameTrimmed) return
  
  // ✅ Check cache immediately before debounce
  if (storeCache.has(usernameTrimmed)) {
    const cachedData = storeCache.get(usernameTrimmed)
    stores.value = cachedData.stores
    hasStores.value = cachedData.hasStores
    isStoreUser.value = cachedData.isStoreUser
    if (stores.value.length > 0) {
      selectedStore.value = stores.value[0]
      errors.store = ''
    }
    return
  }
  
  debounceTimeout = setTimeout(() => {
    if (username.value.trim()) {
      fetchStores()
    }
  }, 200) // ✅ Reduced from 500ms to 200ms
}

const toggleStoreDropdown = () => {
  if (!loading.value && stores.value.length > 0) {
    showStoreDropdown.value = !showStoreDropdown.value
  }
}

const selectStore = (store) => {
  selectedStore.value = store
  showStoreDropdown.value = false
  errors.store = ''
  generalError.value = ''
  console.log('🏪 Store selected:', store.name, 'ID:', store.storeId)
  if (store.group) {
    console.log('👥 Group:', store.group.groupName)
  }
}

const clearUsernameError = () => {
  if (username.value && errors.username) {
    errors.username = ''
  }
  if (generalError.value) generalError.value = ''
}

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

const validateForm = () => {
  const newErrors = { username: '', password: '', store: '' }
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

  if (isStoreUser.value && !selectedStore.value) {
    newErrors.store = 'Please select a store'
    isValid = false
  }

  errors.username = newErrors.username
  errors.password = newErrors.password
  errors.store = newErrors.store

  if (!isValid) {
    shakeError()
  }

  return isValid
}

const handleClickOutside = (event) => {
  const wrapper = document.querySelector('.store-select-wrapper')
  if (wrapper && !wrapper.contains(event.target)) {
    showStoreDropdown.value = false
  }
}

const handleLogin = async () => {
  generalError.value = ''
  
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const trimmedUsername = username.value.trim()
    const trimmedPassword = password.value.trim()

    console.log('🔐 Login attempt:', {
      username: trimmedUsername,
      selectedStore: selectedStore.value?.name || 'None',
      hasGroup: !!selectedStore.value?.group
    })

    let response

    if (isStoreUser.value && selectedStore.value) {
      const storeId = selectedStore.value.storeId
      const groupId = selectedStore.value.group?.groupId || selectedStore.value.group?.id
      
      if (!storeId) {
        generalError.value = 'Invalid store selection. Please try again.'
        loading.value = false
        shakeError()
        return
      }

      if (!groupId) {
        console.error('❌ No group found for store:', selectedStore.value)
        generalError.value = 'No group assigned for this store. Please contact administrator.'
        loading.value = false
        shakeError()
        return
      }

      const loginPayload = {
        username: trimmedUsername,
        password: trimmedPassword,
        storeId: storeId,
        groupId: groupId
      }
      
      console.log('🔐 Store login:', { storeId, groupId })
      
      response = await authStore.loginWithStore(loginPayload)
    } else {
      console.log('🔐 Legacy login')
      response = await authStore.login(trimmedUsername, trimmedPassword)
    }

    console.log('📥 Login response:', response)

    if (response && response.success) {
      loading.value = false
      router.push('/dashboard')
    } else {
      const errorMsg = response?.error || 'Login failed. Please check your credentials.'
      generalError.value = errorMsg
      loading.value = false
      shakeError()
    }
  } catch (err) {
    console.error('❌ Login error:', err)
    generalError.value = err.response?.data?.error || err.message || 'Login failed. Please try again.'
    loading.value = false
    shakeError()
  }
}

// ================================================================
// WATCHERS
// ================================================================

let debounceTimeout = null

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
})
</script>

<style scoped>
/* Form Card */
.form-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 28px 24px 20px;
  width: 100%;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  border: 2px solid rgba(212, 176, 18, 0.3);
}

/* Input Wrapper */
.input-wrapper {
  margin-bottom: 14px;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 5px;
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
  border-radius: 10px;
  background: #f8f9fa;
  padding: 0 12px;
  height: 44px;
  transition: all 0.2s ease;
}

.input-container svg {
  margin-right: 8px;
  color: #999;
  flex-shrink: 0;
}

.input-container-focused {
  border-color: #d4b012;
  background: white;
  box-shadow: 0 2px 8px rgba(212, 176, 18, 0.1);
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
  font-size: 14px;
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
  padding: 4px;
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
  font-size: 11px;
  margin-top: 3px;
  margin-left: 4px;
}

/* Strength Indicator */
.strength-container {
  margin-top: 6px;
  padding: 0 4px;
}

.strength-bar-container {
  display: flex;
  gap: 4px;
  margin-bottom: 3px;
}

.strength-bar {
  height: 3px;
  border-radius: 2px;
  flex: 1;
  transition: background-color 0.2s ease;
}

.strength-text {
  font-size: 11px;
  font-weight: 600;
}

/* ================================================================
   STORE SELECTION - WITH DROPDOWN ABOVE
   ================================================================ */
.store-wrapper {
  position: relative;
}

.store-select-wrapper {
  position: relative;
}

.store-select-container {
  display: flex;
  align-items: center;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  background: #f8f9fa;
  padding: 0 12px;
  height: 44px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.store-select-container svg:first-child {
  margin-right: 8px;
  color: #999;
  flex-shrink: 0;
}

.store-select-focused {
  border-color: #d4b012;
  background: white;
  box-shadow: 0 2px 8px rgba(212, 176, 18, 0.1);
}

.store-select-focused svg:first-child {
  color: #d4b012;
}

.store-select-error {
  border-color: #ff4444;
  background: #fff5f5;
}

.store-select-error svg:first-child {
  color: #ff4444;
}

.store-select-active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.store-select-active svg:first-child {
  color: #22c55e;
}

.store-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  height: 100%;
  cursor: pointer;
  gap: 8px;
}

.selected-store-text {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
}

.placeholder-text {
  color: #999;
}

.selected-store-code {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.store-select-active .selected-store-code {
  background: #dcfce7;
  color: #22c55e;
}

.dropdown-arrow {
  color: #999;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-left: 8px;
}

.dropdown-arrow-open {
  transform: rotate(180deg);
  color: #d4b012;
}

/* Store Dropdown - Displayed ABOVE the input */
.store-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
  max-height: 220px;
  overflow-y: auto;
  z-index: 100;
  padding: 6px 0;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.store-dropdown::-webkit-scrollbar {
  width: 4px;
}

.store-dropdown::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.store-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.store-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.store-option:hover {
  background: #f8fafc;
}

.store-option-active {
  background: #fffbeb;
}

.store-option.loading {
  justify-content: center;
  color: #94a3b8;
  gap: 8px;
  padding: 12px;
}

.store-option.empty {
  justify-content: center;
  color: #94a3b8;
  padding: 12px;
  cursor: default;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #d4b012;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.store-option-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.store-option-info {
  flex: 1;
  min-width: 0;
}

.store-option-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.store-option-code {
  display: inline-block;
  font-size: 10px;
  color: #94a3b8;
  font-family: monospace;
  background: #f1f5f9;
  padding: 0 8px;
  border-radius: 10px;
  margin-top: 1px;
}

.store-option-group {
  display: block;
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.store-check {
  color: #22c55e;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.store-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  padding-left: 4px;
}

/* Login Button */
.login-button {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #d4b012 0%, #b8940e 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(212, 176, 18, 0.3);
  margin-top: 6px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(212, 176, 18, 0.35);
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
  font-size: 15px;
  font-weight: 600;
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
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* General Error */
.general-error-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffebee;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.general-error-container svg {
  color: #ff4444;
  flex-shrink: 0;
}

.general-error-text {
  flex: 1;
  color: #ff4444;
  font-size: 12px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 480px) {
  .form-card {
    padding: 20px 16px;
  }
}
</style>