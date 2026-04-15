import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from './interceptor'

export type UserRole = 'admin' | 'hr' | 'finance' | 'employee'

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
}

export const useAuthStore = defineStore('auth', () => {
  // ==================== STATE ====================
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoggedOut = ref(false)

  // ==================== GETTERS ====================
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role)
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
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user')
    isLoggedOut.value = true
  }

  const init = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
        refreshToken.value = storedRefreshToken
        isLoggedOut.value = false
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

        user.value = userData
        token.value = authToken
        refreshToken.value = authRefreshToken
        isLoggedOut.value = false

        localStorage.setItem('token', authToken)
        localStorage.setItem('refreshToken', authRefreshToken)
        localStorage.setItem('user', JSON.stringify(userData))

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
      // Try to call logout API
      await api.post('/users/logout').catch(() => {})
    } catch (error) {
      console.warn('Logout API failed', error)
    } finally {
      // Always clear local auth data
      clearAuthData()
      
      // Redirect to login page
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login')
      }
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return { success: true, user: response.data.user }
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
    login,
    logout,
    fetchProfile,
    changePassword,
    init,
    clearAuthData
  }
})