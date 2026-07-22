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
  // 🔥 NEW: Store and Group fields
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

  // 🔥 NEW: Get store and group IDs from user
  const userStoreId = computed(() => {
    return user.value?.storeId || user.value?.assignedStore?.id || null
  })

  const userGroupId = computed(() => {
    return user.value?.groupId || user.value?.assignedGroup?.id || null
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

  // 🔥 NEW: Helper to set store and group from login data
  const setUserStoreAndGroup = (userData: any) => {
    if (!userData) return

    // Try to get store ID from various sources
    const storeId = userData.storeId || 
                    userData.assignedStoreId || 
                    userData.assignedStore?.id || 
                    userData.store?.id ||
                    userData.stores?.[0]?.id ||
                    null

    // Try to get group ID from various sources
    const groupId = userData.groupId || 
                    userData.assignedGroupId || 
                    userData.assignedGroup?.id || 
                    userData.group?.id ||
                    userData.groups?.[0]?.id ||
                    null

    // Try to get store and group names
    const storeName = userData.storeName || 
                      userData.assignedStore?.name || 
                      userData.store?.name ||
                      null

    const groupName = userData.groupName || 
                      userData.assignedGroup?.name || 
                      userData.group?.name ||
                      null

    // Update the user object with the extracted data
    if (user.value) {
      user.value.storeId = storeId
      user.value.groupId = groupId
      user.value.storeName = storeName
      user.value.groupName = groupName
      
      if (!user.value.assignedStore && userData.assignedStore) {
        user.value.assignedStore = userData.assignedStore
      }
      if (!user.value.assignedGroup && userData.assignedGroup) {
        user.value.assignedGroup = userData.assignedGroup
      }
      if (!user.value.stores && userData.stores) {
        user.value.stores = userData.stores
      }
      if (!user.value.groups && userData.groups) {
        user.value.groups = userData.groups
      }

      // Save updated user
      localStorage.setItem('user', JSON.stringify(user.value))
    }

    return { storeId, groupId, storeName, groupName }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/users/login', { username, password })

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

        // 🔥 Extract store and group info from user data
        setUserStoreAndGroup(userData)

        await fetchRoles()

        return { success: true, user: userData }
      }

      return { success: false, error: response.data.error || 'Login failed' }
    } catch (error: any) {
      console.error('Login error:', error)

      if (error.response?.status === 401) {
        return { success: false, error: 'Invalid username or password' }
      }
      if (error.response?.status === 403) {
        return { success: false, error: 'Account is deactivated. Please contact administrator.' }
      }

      return { success: false, error: error.response?.data?.error || 'Login failed. Please try again.' }
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
        
        // 🔥 Extract store and group info from profile data
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
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoggedOut,
    userRole,
    userFullName,
    userAvatar,
    availableRoles,
    userStoreId,
    userGroupId,
    login,
    logout,
    fetchProfile,
    changePassword,
    hasRole,
    init,
    clearAuthData,
    setUserStoreAndGroup
  }
})