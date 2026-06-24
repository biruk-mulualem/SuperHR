// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from './interceptor'

// ==================== TYPES ====================
// Remove the hardcoded type definition
// export type UserRole = 'admin' | 'hr' | 'finance' | 'employee' | 'attendance' | 'store'

// Instead, use a generic string type (roles come from backend)
export type UserRole = string

export interface User {
  userId: number
  username: string
  fullName: string
  email: string
  role: UserRole  // Now accepts any role from backend
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
}

export const useAuthStore = defineStore('auth', () => {
  // ==================== STATE ====================
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoggedOut = ref(false)
  const availableRoles = ref<string[]>([]) // Store all roles from backend

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

  // Fetch roles from backend
  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles') // Adjust endpoint as needed
      if (response.data.success) {
        availableRoles.value = response.data.roles
      }
    } catch (error) {
      console.warn('Failed to fetch roles from backend', error)
      // Fallback - but ideally you want backend to always provide this
      availableRoles.value = ['admin', 'hr', 'finance', 'employee', 'attendance', 'store']
    }
  }

  const init = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Ensure role exists, default to 'employee'
        if (!parsedUser.role) {
          parsedUser.role = 'employee'
        }
        user.value = parsedUser
        token.value = storedToken
        refreshToken.value = storedRefreshToken
        isLoggedOut.value = false
        
        // Fetch available roles from backend
        fetchRoles()
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        clearAuthData()
      }
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/users/login', { username, password })

      if (response.data.success) {
        const { token: authToken, refreshToken: authRefreshToken, user: userData } = response.data

        // Ensure role exists
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

        // Fetch available roles after login
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

  // Helper to check if user has a specific role
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
    login,
    logout,
    fetchProfile,
    changePassword,
    hasRole,
    init,
    clearAuthData
  }
})