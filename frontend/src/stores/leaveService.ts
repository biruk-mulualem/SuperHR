// stores/leave.ts
import api from './interceptor'

// ============================================================================
// TYPES
// ============================================================================

export interface LeaveType {
  leaveTypeId: number
  name: string
  code: string
  description?: string
  defaultDays?: number
  isPaid: boolean
  hasFixedLimit: boolean
  isOneTime: boolean
  requiresApproval: boolean
  minNoticeDays: number
  maxConsecutiveDays?: number
  requiresDocumentation: boolean
  genderRestriction: 'male' | 'female' | 'none'
  carryOverLimit: number
  carryOverExpiryYears: number
  isActive: boolean
  sortOrder: number
}

export interface LeaveExtension {
  extensionId: number
  leaveRequestId: number
  requestedDate: string
  originalEndDate: string
  additionalDays: number
  requestedNewEndDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedDate?: string
  rejectionReason?: string
  rejectedBy?: number
  rejectedDate?: string
  newEndDate?: string
}

export interface LeaveRequest {
  leaveRequestId: number
  employeeId: number
  departmentId?: number
  leaveTypeId: number
  leaveTypeName: string
  startDate: string
  endDate: string
  returnDate: string
  totalDays: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requestedDate: string
  approvedBy?: number
  approvedDate?: string
  approvalNotes?: string
  rejectionReason?: string
  rejectedBy?: number
  rejectedDate?: string
  hrNotes?: string
  returnStatus: 'on_leave' | 'returned' | 'returned_late' | 'overdue'
  actualReturnDate?: string
  daysLate: number
  returnConfirmedBy?: number
  returnConfirmedDate?: string
  extensionCount: number
  totalExtensionDays: number
  lastExtendedDate?: string
  createdAt: string
  updatedAt: string
  extensions?: LeaveExtension[]
  employee?: {
    employeeId: number
    firstName: string
    lastName: string
    employeeCode: string
  }
  department?: {
    departmentId: number
    name: string
  }
  leaveType?: LeaveType
}

export interface LeaveBalance {
  leaveBalanceId: number
  employeeId: number
  year: number
  yearsOfService: number
  yearlyEntitlement: number
  carriedOver: number
  carriedOverFromYear?: number
  carriedOverExpiryDate?: string
  totalAllocation: number
  usedThisYear: number
  pendingDays: number
  availableDays: number
  sickUsedThisYear: number
  sickAlertSent: boolean
  maternityUsed: boolean
  maternityUsedDate?: string
  paternityUsed: boolean
  paternityUsedDate?: string
  bereavementUsedThisYear: number
  unpaidUsedThisYear: number
  expiringDays?: number
  willExpire?: boolean
}

export interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  employeesOnLeaveToday: number
  totalDaysRequested: number
  departmentsWithLeave: number
  overdueReturns: number
}

export interface DepartmentStat {
  departmentId: number
  department?: {
    name: string
  }
  totalRequests: number
  totalDays: number
}

export interface CalendarLeave {
  leaveRequestId: number
  employeeId: number
  startDate: string
  endDate: string
  returnDate: string
  totalDays: number
  leaveTypeName: string
  employee: {
    employeeId: number
    firstName: string
    lastName: string
    employeeCode: string
  }
  leaveType: {
    name: string
    code: string
  }
}

export interface OverdueReturn {
  leaveRequestId: number
  employeeId: number
  employeeName: string
  employeeCode: string
  departmentName: string
  leaveTypeName: string
  endDate: string
  returnDate: string
  daysOverdue: number
}

export interface GetLeaveRequestsParams {
  status?: string
  departmentId?: number | string
  leaveTypeId?: number | string
  employeeId?: number | string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedLeaveResponse {
  success: boolean
  data: LeaveRequest[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ============================================================================
// LEAVE SERVICE
// ============================================================================

class LeaveService {
  // ============================================================================
  // LEAVE REQUESTS CRUD
  // ============================================================================

  /**
   * Get all leave requests with pagination and filters
   */
  async getLeaveRequests(params: GetLeaveRequestsParams = {}): Promise<PaginatedLeaveResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.status) queryParams.append('status', params.status)
      if (params.departmentId && params.departmentId !== 'all') queryParams.append('departmentId', params.departmentId.toString())
      if (params.leaveTypeId && params.leaveTypeId !== 'all') queryParams.append('leaveTypeId', params.leaveTypeId.toString())
      if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString())
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)
      
      const url = `/leaves${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await api.get(url)
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    } catch (error: any) {
      console.error('Get leave requests error:', error)
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    }
  }

  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(id: number): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
    try {
      const response = await api.get(`/leaves/${id}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get leave request error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch leave request'
      }
    }
  }

  /**
   * Create new leave request
   */
  async createLeaveRequest(leaveData: {
    employeeId: number
    leaveTypeId: number
    startDate: string
    endDate: string
    reason: string
    status?: 'pending' | 'approved'
  }): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
    try {
      const response = await api.post('/leaves', leaveData)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Create leave request error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create leave request'
      }
    }
  }

  /**
   * Update leave request
   */
  async updateLeaveRequest(id: number, updateData: Partial<LeaveRequest>): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
    try {
      const response = await api.put(`/leaves/${id}`, updateData)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Update leave request error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update leave request'
      }
    }
  }

  /**
   * Approve leave request
   */
  async approveLeave(id: number, approvalNotes?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.put(`/leaves/${id}/approve`, { approvalNotes })
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Approve leave error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to approve leave request'
      }
    }
  }

  /**
   * Reject leave request
   */
  async rejectLeave(id: number, rejectionReason: string, hrNotes?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.put(`/leaves/${id}/reject`, { rejectionReason, hrNotes })
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Reject leave error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reject leave request'
      }
    }
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.put(`/leaves/${id}/cancel`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Cancel leave error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to cancel leave request'
      }
    }
  }

  /**
   * Delete leave request
   */
  async deleteLeave(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.delete(`/leaves/${id}`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Delete leave error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete leave request'
      }
    }
  }

  // ============================================================================
  // LEAVE EXTENSIONS
  // ============================================================================

  /**
   * Request extension for a leave
   */
  async requestExtension(leaveId: number, additionalDays: number, reason: string): Promise<{ success: boolean; data?: LeaveExtension; error?: string }> {
    try {
      const response = await api.post(`/leaves/${leaveId}/extensions`, { additionalDays, reason })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Request extension error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to request extension'
      }
    }
  }


  
  /**
   * Approve extension (HR/Admin only)
   */
  async approveExtension(extensionId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.put(`/leaves/extensions/${extensionId}/approve`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Approve extension error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to approve extension'
      }
    }
  }

  /**
   * Reject extension (HR/Admin only)
   */
  async rejectExtension(extensionId: number, rejectionReason: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.put(`/leaves/extensions/${extensionId}/reject`, { rejectionReason })
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Reject extension error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reject extension'
      }
    }
  }

  // ============================================================================
  // RETURN TRACKING
  // ============================================================================

  /**
   * Confirm employee return
   */
  async confirmReturn(leaveId: number, actualReturnDate: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.put(`/leaves/${leaveId}/return`, { actualReturnDate })
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Confirm return error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to confirm return'
      }
    }
  }

  /**
   * Get overdue returns
   */
  async getOverdueReturns(): Promise<{ success: boolean; data?: OverdueReturn[]; error?: string }> {
    try {
      const response = await api.get('/leaves/overdue/returns')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get overdue returns error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch overdue returns'
      }
    }
  }

  // ============================================================================
  // LEAVE BALANCES
  // ============================================================================

  /**
   * Get employee leave balance
   */
  async getEmployeeBalance(employeeId: number, year?: number): Promise<{ success: boolean; data?: LeaveBalance; error?: string }> {
    try {
      const params = year ? { year } : {}
      const response = await api.get(`/leaves/balance/${employeeId}`, { params })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get employee balance error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch leave balance'
      }
    }
  }

  /**
   * Get current logged-in employee's balance
   */
  async getMyBalance(): Promise<{ success: boolean; data?: LeaveBalance; error?: string }> {
    try {
      const response = await api.get('/leaves/balance/me/current')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get my balance error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch your leave balance'
      }
    }
  }

  // ============================================================================
  // STATISTICS & REPORTS
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      const response = await api.get('/leaves/stats/summary')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get dashboard stats error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch dashboard statistics'
      }
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<{ success: boolean; data?: DepartmentStat[]; error?: string }> {
    try {
      const response = await api.get('/leaves/stats/department')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get department stats error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch department statistics'
      }
    }
  }

  /**
   * Get calendar data for a specific month
   */
  async getCalendarData(year: number, month: number): Promise<{ success: boolean; data?: CalendarLeave[]; error?: string }> {
    try {
      const response = await api.get(`/leaves/calendar/${year}/${month}`)
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get calendar data error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch calendar data'
      }
    }
  }

  /**
   * Export all leaves to CSV
   */
  async exportToCSV(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await api.get('/leaves/export/csv')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Export to CSV error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to export data'
      }
    }
  }

  // ============================================================================
  // LEAVE TYPES
  // ============================================================================

  /**
   * Get all leave types
   */
  async getLeaveTypes(): Promise<{ success: boolean; data?: LeaveType[]; error?: string }> {
    try {
      const response = await api.get('/leaves/types')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get leave types error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch leave types'
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    }
    return labels[status] || status
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'cancelled': 'default'
    }
    return colors[status] || 'default'
  }

  /**
   * Get return status label
   */
  getReturnStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'on_leave': 'On Leave',
      'returned': 'Returned',
      'returned_late': 'Returned Late',
      'overdue': 'Overdue'
    }
    return labels[status] || status
  }

  /**
   * Get return status color
   */
  getReturnStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'on_leave': 'info',
      'returned': 'success',
      'returned_late': 'warning',
      'overdue': 'error'
    }
    return colors[status] || 'default'
  }

  /**
   * Format date
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Calculate days between two dates
   */
  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }
}

export default new LeaveService()