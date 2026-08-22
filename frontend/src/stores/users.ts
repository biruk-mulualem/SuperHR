import api from '@/stores/interceptor'

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  userId: number
  username: string
  fullName: string
  email: string
  role: string
  roleId: number
  departmentId: number | null
  departmentName?: string
  departmentCode?: string
  isActive: boolean
  lastLogin?: string
  profilePicture?: string
  employeeCode?: string
  createdAt?: string
  employee?: {
    employeeId: number
    employeeCode: string
    firstName: string
    lastName: string
    employmentStatus: string
  }
}

export interface Role {
  roleId: number
  name: string
  description: string
  isActive: boolean
}

export interface Department {
  departmentId: number
  name: string
  code: string
  description: string
  isActive: boolean
}

export interface UserStats {
  overview: {
    total: number
    active: number
    inactive: number
    activePercentage: number
    inactivePercentage: number
  }
  trends: {
    last7Days: number
    last30Days: number
    percentageGrowth: number
  }
  byRole: Array<{ roleId: number; roleName: string; count: number; percentage: number }>
  byDepartment: Array<{ departmentId: number; departmentName: string; count: number; percentage: number }>
  byEmployeeStatus: Array<{ status: string; count: number }>
}

export interface FilterOption {
  value: string | number
  label: string
  id?: number
}

export interface FilterOptions {
  roles: FilterOption[]
  departments: FilterOption[]
  statuses: FilterOption[]
  dateRange: {
    min: string | null
    max: string | null
  }
  sortFields: string[]
  sortOrders: string[]
  defaultLimit: number
  maxLimit: number
}

export interface GetUsersParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
  searchFields?: string
  role?: string | number
  status?: string
  department?: number | string
  dateFrom?: string
  dateTo?: string
  lastLoginFrom?: string
  lastLoginTo?: string
  employeeStatus?: string
}

export interface PaginatedResponse {
  success: boolean
  data: User[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage: number | null
    prevPage: number | null
    startOffset: number
    endOffset: number
  }
  filters: any
  sorting: {
    field: string
    order: string
  }
}

// ============================================================================
// USER SERVICE
// ============================================================================

class UsersService {
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users with advanced pagination, filters, and search
   */
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // Pagination
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      
      // Sorting
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      
      // Search
      if (params.search) queryParams.append('search', params.search)
      if (params.searchFields) queryParams.append('searchFields', params.searchFields)
      
      // Filters
      if (params.role && params.role !== 'all') queryParams.append('role', params.role.toString())
      if (params.status && params.status !== 'all') queryParams.append('status', params.status)
      if (params.department && params.department !== 'all') queryParams.append('department', params.department.toString())
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params.dateTo) queryParams.append('dateTo', params.dateTo)
      if (params.lastLoginFrom) queryParams.append('lastLoginFrom', params.lastLoginFrom)
      if (params.lastLoginTo) queryParams.append('lastLoginTo', params.lastLoginTo)
      if (params.employeeStatus && params.employeeStatus !== 'all') queryParams.append('employeeStatus', params.employeeStatus)
      
      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await api.get(url)
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
          startOffset: 0,
          endOffset: 0
        },
        filters: response.data.filters || {},
        sorting: response.data.sorting || {}
      }
    } catch (error: any) {
      console.error('Get users error:', error)
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
          startOffset: 0,
          endOffset: 0
        },
        filters: {},
        sorting: {
          field: '',
          order: ''
        }
      }
    }
  }

  /**
   * Advanced search users with exact/match options
   */
  async advancedSearchUsers(params: {
    q: string
    fields?: string
    exactMatch?: boolean
    page?: number
    limit?: number
  }) {
    try {
      const queryParams = new URLSearchParams()
      
      queryParams.append('q', params.q)
      if (params.fields) queryParams.append('fields', params.fields)
      if (params.exactMatch !== undefined) queryParams.append('exactMatch', params.exactMatch.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      
      const response = await api.get(`/users/advanced-search?${queryParams.toString()}`)
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination,
        searchInfo: response.data.searchInfo
      }
    } catch (error: any) {
      console.error('Advanced search error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search users',
        data: []
      }
    }
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId: number) {
    try {
      const response = await api.get(`/users/${userId}`)
      return {
        success: true,
        user: response.data.data
      }
    } catch (error: any) {
      console.error('Get user by ID error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user'
      }
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    username: string
    email: string
    fullName: string
    roleId: number
    departmentId?: number | null
    password?: string
  }) {
    try {
      const response = await api.post('/users', userData)
      return {
        success: true,
        message: response.data.message || 'User created successfully',
        user: response.data.user
      }
    } catch (error: any) {
      console.error('Create user error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create user'
      }
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: number, userData: {
    fullName?: string
    email?: string
    roleId?: number
    departmentId?: number | null
    isActive?: boolean
  }) {
    try {
      const response = await api.put(`/users/${userId}`, userData)
      return {
        success: true,
        message: response.data.message || 'User updated successfully',
        user: response.data.user
      }
    } catch (error: any) {
      console.error('Update user error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update user'
      }
    }
  }

  

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(userIds: number[], updates: { departmentId?: number; isActive?: boolean }) {
    try {
      const response = await api.post('/users/bulk-update', { userIds, updates })
      return {
        success: true,
        message: response.data.message,
        updatedCount: response.data.updatedCount,
        updates: response.data.updates
      }
    } catch (error: any) {
      console.error('Bulk update error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update users'
      }
    }
  }



  // ============================================================================
  // USER STATUS MANAGEMENT
  // ============================================================================

  /**
   * Activate user
   */
  async activateUser(userId: number) {
    try {
      const response = await api.put(`/users/${userId}/activate`)
      return {
        success: true,
        message: response.data.message || 'User activated successfully',
        isActive: true
      }
    } catch (error: any) {
      console.error('Activate user error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to activate user'
      }
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: number) {
    try {
      const response = await api.put(`/users/${userId}/deactivate`)
      return {
        success: true,
        message: response.data.message || 'User deactivated successfully',
        isActive: false
      }
    } catch (error: any) {
      console.error('Deactivate user error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to deactivate user'
      }
    }
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleUserStatus(userId: number) {
    try {
      const response = await api.put(`/users/${userId}/toggle-status`)
      return {
        success: true,
        message: response.data.message,
        isActive: response.data.isActive
      }
    } catch (error: any) {
      console.error('Toggle user status error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle user status'
      }
    }
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  /**
   * Reset user password (Admin only)
   */
  async resetUserPassword(userId: number, newPassword: string) {
    try {
      const response = await api.post(`/users/${userId}/reset-password`, { newPassword })
      return {
        success: true,
        message: response.data.message || 'Password reset successfully'
      }
    } catch (error: any) {
      console.error('Reset password error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reset password'
      }
    }
  }

  /**
   * Change own password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await api.post('/users/change-password', { currentPassword, newPassword })
      return {
        success: true,
        message: response.data.message || 'Password changed successfully'
      }
    } catch (error: any) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change password'
      }
    }
  }

  // ============================================================================
  // USER STATISTICS & EXPORT
  // ============================================================================

  /**
   * Get user statistics with detailed breakdown
   */
  async getUserStats() {
    try {
      const response = await api.get('/users/stats')
      return {
        success: true,
        stats: response.data.stats as UserStats,
        lastUpdated: response.data.lastUpdated
      }
    } catch (error: any) {
      console.error('Get user stats error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch statistics'
      }
    }
  }

  /**
   * Get filter options for UI dropdowns
   */
  async getFilterOptions() {
    try {
      const response = await api.get('/users/filter-options')
      return {
        success: true,
        filters: response.data.filters as FilterOptions
      }
    } catch (error: any) {
      console.error('Get filter options error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch filter options'
      }
    }
  }

  /**
   * Export users to JSON or CSV
   */
  async exportUsers(format: 'json' | 'csv' = 'json', filters?: {
    role?: string
    status?: string
    department?: number
    search?: string
  }) {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('format', format)
      
      if (filters?.role && filters.role !== 'all') queryParams.append('role', filters.role)
      if (filters?.status && filters.status !== 'all') queryParams.append('status', filters.status)
      if (filters?.department) queryParams.append('department', filters.department.toString())
      if (filters?.search) queryParams.append('search', filters.search)
      
      const response = await api.get(`/users/export?${queryParams.toString()}`)
      
      if (format === 'csv') {
        // For CSV, response is text
        return {
          success: true,
          csv: response.data,
          format: 'csv'
        }
      }
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        exportDate: response.data.exportDate,
        filters: response.data.filters
      }
    } catch (error: any) {
      console.error('Export users error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to export users'
      }
    }
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get all roles
   */
  async getRoles() {
    try {
      const response = await api.get('/users/roles')
      return {
        success: true,
        roles: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get roles error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch roles',
        roles: []
      }
    }
  }

  // ============================================================================
  // DEPARTMENT MANAGEMENT
  // ============================================================================

  /**
   * Get all departments
   */
  async getDepartments() {
    try {
      const response = await api.get('/users/departments')
      return {
        success: true,
        departments: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get departments error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch departments',
        departments: []
      }
    }
  }

    // ============================================================================
  // POSITION MANAGEMENT
  // ============================================================================

  /**
   * Get all positions
   */
  async getPositions() {
    try {
      const response = await api.get('/users/positions')
      return {
        success: true,
        positions: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get positions error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch positions',
        positions: []
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get user display name
   */
  getUserDisplayName(user: User | null): string {
    if (!user) return 'User'
    if (user.employee?.firstName && user.employee?.lastName) {
      return `${user.employee.firstName} ${user.employee.lastName}`
    }
    return user.fullName || user.username || 'User'
  }

  /**
   * Format user role for display
   */
  formatRole(role: string): string {
    const titles: Record<string, string> = {
      admin: 'Administrator',
      hr: 'HR Manager',
      finance: 'Finance Officer',
      employee: 'Employee',
      manager: 'Manager'
    }
    return titles[role] || role || 'User'
  }

  /**
   * Format date for display
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Format datetime for display
   */
  formatDateTime(date: string | undefined): string {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get avatar URL from name
   */
  getAvatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(name)}`
  }

  /**
   * Get status badge color
   */
  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'error'
  }

  /**
   * Get status text
   */
  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive'
  }

  /**
   * Build query string for API calls
   */
  buildQueryString(params: GetUsersParams): string {
    const queryParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all' && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
    
    return queryParams.toString()
  }
}

export default new UsersService()