// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from './interceptor'

// ==================== TYPES ====================
export type UserRole = string

export interface User {
  userId: number
  username: string
  fullName: string
  email: string
  role: UserRole
  roleId: number
  departmentId: number | null
  departmentName?: string
  isActive: boolean
  profilePicture?: string
  profilePictureUrl?: string
  lastLogin?: string
  employeeCode?: string
  firstName?: string
  lastName?: string
  fullEmployeeName?: string
  departmentCode?: string
  // 🔥 Store and Group fields
  storeId?: number | null
  groupId?: number | null
  storeName?: string | null
  groupName?: string | null
  assignedStore?: {
    id: number
    name: string
    code: string
    location?: string
  } | null
  assignedGroup?: {
    id: number
    name: string
    code: string
  } | null
  stores?: Array<{
    id: number
    name: string
    code: string
    groupId?: number
    groupName?: string
  }>
  groups?: Array<{
    id: number
    name: string
    code: string
  }>
  // 🔥 ADD THESE - From login response
  currentStore?: {
    id: number
    name: string
    code: string
    location?: string
  } | null
  currentGroup?: {
    id: number
    name: string
    code: string
  } | null
  groupsForStore?: Array<{
    id: number
    name: string
    code: string
    description?: string
    status?: string
  }>
  accessibleStores?: Array<{
    id: number
    name: string
    code: string
    location?: string
    status?: string
    groups: Array<{
      groupId: number
      groupName: string
      groupCode: string
    }>
  }>
  hasMultipleStores?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // ==================== STATE ====================
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoggedOut = ref(false)
  const availableRoles = ref<string[]>([])

  // ==================== GETTERS ====================
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  const userRole = computed(() => {
    return user.value?.role || 'employee'
  })
  
  const userFullName = computed(() => {
    if (!user.value) return 'User'
    return (
      user.value.fullEmployeeName ||
      user.value.fullName ||
      (user.value.firstName && user.value.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : 'User')
    )
  })
  
  const userAvatar = computed(() => user.value?.profilePicture || user.value?.profilePictureUrl || null)

  // 🔥 Get store and group IDs from user - Now with correct types
  const userStoreId = computed(() => {
    // Check multiple sources for store ID
    return user.value?.storeId || 
           user.value?.assignedStore?.id || 
           user.value?.currentStore?.id ||
           user.value?.stores?.[0]?.id ||
           null
  })

  const userGroupId = computed(() => {
    // Check multiple sources for group ID
    return user.value?.groupId || 
           user.value?.assignedGroup?.id || 
           user.value?.currentGroup?.id ||
           user.value?.groups?.[0]?.id ||
           null
  })

  // ==================== ACTIONS ====================
  const clearAuthData = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    availableRoles.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user')
    isLoggedOut.value = true
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles')
      if (response.data.success) {
        availableRoles.value = response.data.roles
      }
    } catch (error) {
      console.warn('Failed to fetch roles from backend', error)
      availableRoles.value = ['admin', 'hr', 'finance', 'employee', 'attendance', 'store', 'checker']
    }
  }

  const init = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (!parsedUser.role) {
          parsedUser.role = 'employee'
        }
        user.value = parsedUser
        token.value = storedToken
        refreshToken.value = storedRefreshToken
        isLoggedOut.value = false
        fetchRoles()
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        clearAuthData()
      }
    }
  }


const setUserStoreAndGroup = (userData: any) => {
  if (!userData || !user.value) return

  console.log('🔧 setUserStoreAndGroup called with:', userData)

  // ✅ Try to get store ID from various sources
  let storeId = userData.storeId || 
                userData.assignedStoreId || 
                userData.assignedStore?.id || 
                userData.currentStore?.id ||
                userData.store?.id ||
                userData.stores?.[0]?.id ||
                null

  // ✅ If still no storeId, try to get it from the stores array by matching name
  if (!storeId && userData.stores && userData.stores.length > 0 && userData.assignedStore) {
    const matchingStore = userData.stores.find((s: any) => 
      s.name === userData.assignedStore.name || 
      s.code === userData.assignedStore.code
    );
    if (matchingStore) {
      storeId = matchingStore.id || matchingStore.storeId;
      console.log('✅ Found storeId from stores array:', storeId);
    }
  }

  // Try to get group ID from various sources
  const groupId = userData.groupId || 
                  userData.assignedGroupId || 
                  userData.assignedGroup?.id || 
                  userData.currentGroup?.id ||
                  userData.group?.id ||
                  userData.groups?.[0]?.id ||
                  null

  // Try to get store and group names
  const storeName = userData.storeName || 
                    userData.assignedStore?.name || 
                    userData.currentStore?.name ||
                    userData.store?.name ||
                    null

  const groupName = userData.groupName || 
                    userData.assignedGroup?.name || 
                    userData.currentGroup?.name ||
                    userData.group?.name ||
                    null

  console.log('📦 Extracted storeId:', storeId, 'groupId:', groupId)

  // Update the user object with the extracted data
  if (user.value) {
    // ✅ IMPORTANT: Set storeId on the user object
    user.value.storeId = storeId
    user.value.groupId = groupId
    user.value.storeName = storeName
    user.value.groupName = groupName
    
    // ✅ FIX: Prioritize currentStore over assignedStore (currentStore has the ID)
    const storeToUse = userData.currentStore || userData.assignedStore;
    
    // Set assignedStore if available
    if (!user.value.assignedStore && storeToUse) {
      // ✅ Make sure we include the ID
      user.value.assignedStore = {
        id: storeId || storeToUse.id || storeToUse.storeId,
        name: storeToUse.name,
        code: storeToUse.code,
        location: storeToUse.location || ''
      }
      console.log('✅ Set assignedStore with ID:', user.value.assignedStore)
    } else if (user.value.assignedStore && storeId) {
      // ✅ If assignedStore exists but has no ID, update it
      user.value.assignedStore.id = storeId;
      console.log('✅ Updated assignedStore with ID:', storeId)
    }
    
    // Set assignedGroup if available
    if (!user.value.assignedGroup && (userData.assignedGroup || userData.currentGroup)) {
      const groupToUse = userData.currentGroup || userData.assignedGroup;
      user.value.assignedGroup = {
        id: groupId || groupToUse.id || groupToUse.groupId,
        name: groupToUse.name,
        code: groupToUse.code
      }
    }
    
    // Set stores array if available
    if (!user.value.stores && userData.stores) {
      user.value.stores = userData.stores
    }
    
    // Set groups array if available
    if (!user.value.groups && userData.groups) {
      user.value.groups = userData.groups
    }

    // Also set groupsForStore if available
    if (userData.groupsForStore && !user.value.groups) {
      user.value.groups = userData.groupsForStore
    }

    // Save updated user
    localStorage.setItem('user', JSON.stringify(user.value))
    console.log('✅ Updated user with store/group:', user.value)
    console.log('✅ storeId in user:', user.value.storeId)
    console.log('✅ assignedStore.id in user:', user.value.assignedStore?.id)
  }

  return { storeId, groupId, storeName, groupName }
}

  // ==================== 🔥 STORE-BASED LOGIN METHODS ====================

  /**
   * Fetch stores for a user by username
   * POST /api/users/stores-by-username
   */
  const fetchStoresByUsername = async (username: string) => {
    try {
      const response = await api.post('/users/stores-by-username', { username })
      console.log('✅ fetchStoresByUsername response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Fetch stores error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch stores'
      }
    }
  }

  /**
   * Login with username, store selection, and password
   * POST /api/users/login-with-store
   */
  const loginWithStore = async (credentials: { username: string; password: string; storeId: number }) => {
    try {
      console.log('🔐 loginWithStore called with:', { 
        username: credentials.username, 
        storeId: credentials.storeId 
      })
      
      const response = await api.post('/users/login-with-store', credentials)
      console.log('✅ loginWithStore response:', response.data)

      if (response.data.success) {
        const { token: authToken, refreshToken: authRefreshToken, user: userData } = response.data

        if (!userData.role) {
          userData.role = 'employee'
        }

        // Set auth store state
        user.value = userData
        token.value = authToken
        refreshToken.value = authRefreshToken
        isLoggedOut.value = false

        // Store in localStorage
        localStorage.setItem('token', authToken)
        localStorage.setItem('refreshToken', authRefreshToken)
        localStorage.setItem('user', JSON.stringify(userData))

        // 🔥 Extract store and group info from user data
        setUserStoreAndGroup(userData)

        // Fetch roles
        await fetchRoles()

        return { success: true, user: userData }
      }

      return { success: false, error: response.data.error || 'Login failed' }
    } catch (error: any) {
      console.error('❌ Login with store error:', error)

      if (error.response?.status === 401) {
        return { success: false, error: 'Invalid username or password' }
      }
      if (error.response?.status === 403) {
        return { success: false, error: 'Account is deactivated. Please contact administrator.' }
      }

      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      }
    }
  }

  // ==================== LEGACY LOGIN ====================

 // stores/auth.ts - Update the login function

const login = async (username: string, password: string) => {
  try {
    console.log('🔐 Legacy login called with:', { username, password: '***' })
    
    // ✅ Make sure we're sending the data correctly
    const response = await api.post('/users/login', { 
      username: username.trim(), 
      password: password.trim() 
    })
    
    console.log('✅ Legacy login response:', response.data)

    if (response.data.success) {
      const { token: authToken, refreshToken: authRefreshToken, user: userData } = response.data

      if (!userData.role) {
        userData.role = 'employee'
      }

      user.value = userData
      token.value = authToken
      refreshToken.value = authRefreshToken
      isLoggedOut.value = false

      localStorage.setItem('token', authToken)
      localStorage.setItem('refreshToken', authRefreshToken)
      localStorage.setItem('user', JSON.stringify(userData))

      setUserStoreAndGroup(userData)
      await fetchRoles()

      return { success: true, user: userData }
    }

    return { success: false, error: response.data.error || 'Login failed' }
  } catch (error: any) {
    console.error('❌ Legacy login error:', error)
    
    // Log the full error response for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error status:', error.response.status)
      console.error('Error headers:', error.response.headers)
    }

    if (error.response?.status === 401) {
      return { success: false, error: 'Invalid username or password' }
    }
    if (error.response?.status === 403) {
      return { success: false, error: 'Account is deactivated. Please contact administrator.' }
    }

    return { 
      success: false, 
      error: error.response?.data?.error || 'Login failed. Please try again.' 
    }
  }
}

  const logout = async () => {
    try {
      await api.post('/users/logout').catch(() => {})
    } catch (error) {
      console.warn('Logout API failed', error)
    } finally {
      clearAuthData()
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login')
      }
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        const userData = response.data.user
        if (!userData.role) {
          userData.role = 'employee'
        }
        user.value = userData
        localStorage.setItem('user', JSON.stringify(userData))
        
        setUserStoreAndGroup(userData)
        
        return { success: true, user: userData }
      }
      return { success: false, error: response.data.error }
    } catch (error: any) {
      console.error('Fetch profile error:', error)
      return { success: false, error: error.response?.data?.error }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/users/change-password', { currentPassword, newPassword })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Change password error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to change password' }
    }
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user.value) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.value.role)
  }

  // Initialize the store
  init()

  return {
    // State
    user,
    token,
    refreshToken,
    isLoggedOut,
    availableRoles,
    
    // Getters
    isAuthenticated,
    userRole,
    userFullName,
    userAvatar,
    userStoreId,
    userGroupId,
    
    // Actions - Legacy
    login,
    logout,
    fetchProfile,
    changePassword,
    hasRole,
    init,
    clearAuthData,
    setUserStoreAndGroup,
    fetchRoles,
    
    // 🔥 Store-based login actions
    fetchStoresByUsername,
    loginWithStore
  }
})