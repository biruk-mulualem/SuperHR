// stores/employee.ts
import api from './interceptor'

// ============================================================================
// TYPES
// ============================================================================


export interface Employee {
  id: number
  employeeId: string
  fullName: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  personalEmail?: string
  phone: string
  dob?: string
  gender?: 'male' | 'female' | 'other'
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  nationality?: string
  departmentId: number
  departmentName?: string
  departmentCode?: string
  positionId?: number
  position?: string
  positionLevel?: string
  managerId?: number
  managerName?: string
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern'
  status: 'active' | 'on-leave' | 'terminated'
  hireDate: string
  confirmationDate?: string
  terminationDate?: string
  salary?: number
  basicSalary?: number
  // NEW: Allowance fields
  housingAllowance?: number
  positionAllowance?: number
  transportAllowance?: number
  totalAllowances?: number
  grossPay?: number
  workLocation?: string
  address?: any
  permanentAddress?: any
  emergencyContact?: any
  bankAccount?: any
  profilePicture?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}


// ============================================================================
// SEPARATE STATS TYPES
// ============================================================================

export interface KpiStats {
  total: number
  active: number
  onLeave: number
  terminated: number
  fullyCompliant: number
  missingDocs: number
  complianceRate: string
}

export interface HiringTrend {
  month: string
  hired: number
}

export interface HiringTrendsData {
  trends: HiringTrend[]
  totalHired: number
  peakMonth: string
  avgPerMonth: number
}

export interface DepartmentData {
  departmentId: number
  departmentName: string
  count: number
  percentage: string
}

export interface DepartmentEmployee {
  id: number
  employeeId: string
  fullName: string
  email: string
}

export interface DepartmentDistributionData {
  departments: DepartmentData[]
  employeesByDepartment: Record<string, DepartmentEmployee[]>
}

export interface EmploymentTypeData {
  type: string
  count: number
  percentage: string
}

export interface EmploymentTypeEmployee {
  id: number
  employeeId: string
  fullName: string
  email: string
}

export interface EmploymentTypeDistributionData {
  types: EmploymentTypeData[]
  employeesByType: Record<string, EmploymentTypeEmployee[]>
}

export interface RecentHire {
  id: number
  employeeId: string
  fullName: string
  email: string
  department: string
  position: string
  hireDate: string
  daysSinceHire: number
  salary: number
}

export interface RecentHiresData {
  hires: RecentHire[]
  daysRange: number
  count: number
}

export interface SalaryOverview {
  total_employees: number
  min_salary: number
  max_salary: number
  avg_salary: number
  total_salary_pool: number
}

export interface SalaryByDept {
  department_name: string
  employee_count: number
  avg_salary: number
  min_salary: number
  max_salary: number
}

export interface SalaryDistribution {
  salary_range: string
  employee_count: number
}

export interface HighestPaid {
  employee_id: number
  employee_code: string
  full_name: string
  department_name: string
  basic_salary: number
}

export interface SalaryAnalysisData {
  overview: SalaryOverview
  byDepartment: SalaryByDept[]
  distribution: SalaryDistribution[]
  highestPaid: HighestPaid[]
}

export interface DocumentTypeCompliance {
  submitted: number
  pending: number
  submissionRate: string
}

export interface EmployeeMissingDoc {
  id: number
  employeeId: string
  fullName: string
  email: string
  department: string
  missingList: string
}

export interface OldGuaranteeAlert {
  employee_id: number
  employee_code: string
  first_name: string
  last_name: string
  department_name: string
  submitted_date: string
  months_old: number
  urgency_level: string
}

export interface DocumentComplianceData {
  summary: {
    activeEmployees: number
    fullyCompliant: number
    missingDocuments: number
    complianceRate: string
  }
  byDocumentType: {
    guarantee_letter: DocumentTypeCompliance
    id_card: DocumentTypeCompliance
    cv: DocumentTypeCompliance
    degree: DocumentTypeCompliance
  }
  employeesWithMissingDocs: EmployeeMissingDoc[]
  oldGuaranteeAlerts: OldGuaranteeAlert[]
}

export interface Document {
  id: number
  type: 'id_card' | 'cv' | 'degree' | 'guarantee_letter'
  fileName: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
}

export interface GroupedDocuments {
  id_card: Document | null
  cv: Document | null
  degree: Document | null
  guarantee_letters: Document[]
}

export interface GetEmployeesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
  searchFields?: string
  departmentId?: number | string
  employmentStatus?: string
  employmentType?: string
  positionId?: number | string
}

export interface PaginatedResponse {
  success: boolean
  data: Employee[]
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
// EMPLOYEE SERVICE
// ============================================================================

class EmployeesService {
  // ============================================================================
  // EMPLOYEE CRUD
  // ============================================================================

  /**
   * Get all employees with pagination and filters
   */
  async getEmployees(params: GetEmployeesParams = {}): Promise<PaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params.search) queryParams.append('search', params.search)
      if (params.searchFields) queryParams.append('searchFields', params.searchFields)
      if (params.departmentId && params.departmentId !== 'all') queryParams.append('departmentId', params.departmentId.toString())
      if (params.employmentStatus && params.employmentStatus !== 'all') queryParams.append('employmentStatus', params.employmentStatus)
      if (params.employmentType && params.employmentType !== 'all') queryParams.append('employmentType', params.employmentType)
      if (params.positionId && params.positionId !== 'all') queryParams.append('positionId', params.positionId.toString())
      
      const url = `/employees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
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
        sorting: response.data.sorting || { field: '', order: '' }
      }
    } catch (error: any) {
      console.error('Get employees error:', error)
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
        sorting: { field: '', order: '' }
      }
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number) {
    try {
      const response = await api.get(`/employees/${id}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get employee error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch employee'
      }
    }
  }


  /**
 * Create new employee (WITH ALLOWANCES)
 */
async createEmployee(employeeData: any) {
  try {
    const payload = {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      middleName: employeeData.middleName,
      email: employeeData.email,
      personalEmail: employeeData.personalEmail,
      phone: employeeData.phone,
      dob: employeeData.dob,
      gender: employeeData.gender,
      maritalStatus: employeeData.maritalStatus,
      nationality: employeeData.nationality,
      departmentId: employeeData.departmentId,
      positionId: employeeData.positionId,
      managerId: employeeData.managerId,
      employmentType: employeeData.employmentType,
      hireDate: employeeData.hireDate,
      salary: employeeData.basicSalary || employeeData.salary,
      basicSalary: employeeData.basicSalary || employeeData.salary,
      housingAllowance: employeeData.housingAllowance || 0,
      positionAllowance: employeeData.positionAllowance || 0,
      transportAllowance: employeeData.transportAllowance || 0,
      address: employeeData.address,
      workLocation: employeeData.workLocation,
      emergencyContact: employeeData.emergencyContact,
      bankAccount: employeeData.bankAccount
    }
    
    const response = await api.post('/employees', payload)
    return {
      success: true,
      message: response.data.message,
      data: response.data.data
    }
  } catch (error: any) {
    console.error('Create employee error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create employee'
    }
  }
}

/**
 * Update employee (WITH ALLOWANCES)
 */
async updateEmployee(id: number, employeeData: any) {
  try {
    const payload = {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      middleName: employeeData.middleName,
      email: employeeData.email,
      personalEmail: employeeData.personalEmail,
      phone: employeeData.phone,
      dob: employeeData.dob,
      gender: employeeData.gender,
      maritalStatus: employeeData.maritalStatus,
      nationality: employeeData.nationality,
      departmentId: employeeData.departmentId,
      positionId: employeeData.positionId,
      managerId: employeeData.managerId,
      employmentType: employeeData.employmentType,
      status: employeeData.status,
      hireDate: employeeData.hireDate,
      confirmationDate: employeeData.confirmationDate,
      terminationDate: employeeData.terminationDate,
      basicSalary: employeeData.basicSalary || employeeData.salary,
      housingAllowance: employeeData.housingAllowance || 0,
      positionAllowance: employeeData.positionAllowance || 0,
      transportAllowance: employeeData.transportAllowance || 0,
      workLocation: employeeData.workLocation,
      address: employeeData.address,
      permanentAddress: employeeData.permanentAddress,
      bankAccount: employeeData.bankAccount,
      emergencyContact: employeeData.emergencyContact
    }
    
    const response = await api.put(`/employees/${id}`, payload)
    return {
      success: true,
      message: response.data.message,
      data: response.data.data
    }
  } catch (error: any) {
    console.error('Update employee error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update employee'
    }
  }
}

  /**
   * Delete employee (soft delete - terminate)
   */
  async deleteEmployee(id: number) {
    try {
      const response = await api.delete(`/employees/${id}`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Delete employee error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete employee'
      }
    }
  }

  // In employee.ts - Add this method after deleteEmployee

  // ============================================================================
  // BULK IMPORT
  // ============================================================================

 /**
 * Import employees in bulk (WITH ALLOWANCES)
 * Supports allowance fields: housingAllowance, positionAllowance, transportAllowance
 * If allowances not provided, they are auto-calculated as 20%, 15%, 10% of basic salary
 */
async importEmployees(employees: any[]): Promise<{ 
  success: boolean; 
  data?: any; 
  message?: string; 
  error?: string 
}> {
  try {
    const formattedEmployees = employees.map(emp => ({
      ...emp,
      housingAllowance: emp.housingAllowance,
      positionAllowance: emp.positionAllowance,
      transportAllowance: emp.transportAllowance
    }))
    
    const response = await api.post('/employees/import', { employees: formattedEmployees })
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Import employees error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to import employees'
    }
  }
}
  // ============================================================================
  // SEPARATE ANALYTICS STATS METHODS
  // ============================================================================

  /**
   * 1. Get KPI Stats (Total, Active, On Leave, Compliance Rate)
   */
  async getKpiStats(params?: { departmentId?: string }): Promise<{ success: boolean; data?: KpiStats; error?: string }> {
    try {
      const response = await api.get('/employees/stats/kpi', { params })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get KPI stats error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch KPI stats'
      }
    }
  }

  /**
   * 2. Get Hiring Trends
   */
// In employee.ts
async getHiringTrends(params?: { departmentId?: string; months?: string }) {
  try {
    const response = await api.get('/employees/stats/hiring-trends', { params })
    return {
      success: true,
      data: response.data.data
    }
  } catch (error: any) {
    console.error('Get hiring trends error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch hiring trends'
    }
  }
}

  /**
   * 3. Get Department Distribution
   */
  async getDepartmentDistribution(): Promise<{ success: boolean; data?: DepartmentDistributionData; error?: string }> {
    try {
      const response = await api.get('/employees/stats/departments')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get department distribution error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch department distribution'
      }
    }
  }

  /**
   * 4. Get Employment Type Distribution
   */
  async getEmploymentTypeDistribution(): Promise<{ success: boolean; data?: EmploymentTypeDistributionData; error?: string }> {
    try {
      const response = await api.get('/employees/stats/employment-types')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get employment type distribution error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch employment type distribution'
      }
    }
  }

  /**
   * 5. Get Recent Hires
   */
  async getRecentHires(params?: { days?: number; departmentId?: string }): Promise<{ success: boolean; data?: RecentHiresData; error?: string }> {
    try {
      const response = await api.get('/employees/stats/recent-hires', { params })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get recent hires error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch recent hires'
      }
    }
  }

  /**
   * 6. Get Salary Analysis
   */
  async getSalaryAnalysis(params?: { departmentId?: string }): Promise<{ success: boolean; data?: SalaryAnalysisData; error?: string }> {
    try {
      const response = await api.get('/employees/stats/salary', { params })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get salary analysis error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch salary analysis'
      }
    }
  }

  /**
   * 7. Get Document Compliance
   */
  async getDocumentCompliance(params?: { documentType?: string; departmentId?: string; guaranteeMonths?: number }): Promise<{ success: boolean; data?: DocumentComplianceData; error?: string }> {
    try {
      const response = await api.get('/employees/stats/compliance', { params })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Get document compliance error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch document compliance'
      }
    }
  }

  // ============================================================================
  // PROFILE PICTURE
  // ============================================================================

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(id: number, file: File) {
    console.log('uploadProfilePicture called with:', { id, file })
    console.log('File type:', file?.type)
    console.log('File size:', file?.size)
    console.log('File name:', file?.name)
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)
      
      const response = await api.post(`/employees/${id}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return {
        success: true,
        message: response.data.message,
        profilePicture: response.data.data?.profilePicture,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Upload profile picture error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload profile picture'
      }
    }
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(id: number) {
    try {
      const response = await api.delete(`/employees/${id}/profile-picture`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Delete profile picture error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete profile picture'
      }
    }
  }

  // ============================================================================
  // DOCUMENTS
  // ============================================================================

  /**
   * Upload ID card
   */
  async uploadIdCard(id: number, file: File) {
    try {
      const formData = new FormData()
      formData.append('document', file)
      
      const response = await api.post(`/employees/${id}/id-card`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Upload ID card error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload ID card'
      }
    }
  }

  /**
   * Upload CV/Resume
   */
  async uploadCv(id: number, file: File) {
    try {
      const formData = new FormData()
      formData.append('document', file)
      
      const response = await api.post(`/employees/${id}/cv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Upload CV error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload CV'
      }
    }
  }

  /**
   * Upload degree/certificate
   */
  async uploadDegree(id: number, file: File) {
    try {
      const formData = new FormData()
      formData.append('document', file)
      
      const response = await api.post(`/employees/${id}/degree`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Upload degree error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload degree'
      }
    }
  }

  /**
   * Upload guarantee letter
   */
  async uploadGuaranteeLetter(id: number, file: File) {
    try {
      const formData = new FormData()
      formData.append('document', file)
      
      const response = await api.post(`/employees/${id}/guarantee-letter`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Upload guarantee letter error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload guarantee letter'
      }
    }
  }

  /**
   * Get all documents grouped by type
   */
  async getDocuments(id: number) {
    try {
      const response = await api.get(`/employees/${id}/documents`)
      return {
        success: true,
        data: response.data.data as GroupedDocuments
      }
    } catch (error: any) {
      console.error('Get documents error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch documents'
      }
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: number, documentId: number) {
    try {
      const response = await api.delete(`/employees/${id}/documents/${documentId}`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Delete document error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete document'
      }
    }
  }

  // ============================================================================
  // DEPARTMENT & POSITION
  // ============================================================================

  /**
   * Get all departments
   */
  async getDepartments() {
    try {
      const response = await api.get('users/departments')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get departments error:', error)
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch departments'
      }
    }
  }

  /**
   * Get all positions
   */
  async getPositions() {
    try {
      const response = await api.get('users/positions')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error: any) {
      console.error('Get positions error:', error)
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch positions'
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get employee display name
   */
  getDisplayName(employee: Employee | null): string {
    if (!employee) return 'Employee'
    return employee.fullName || `${employee.firstName} ${employee.lastName}`
  }

  /**
   * Get employment type label
   */
  getEmploymentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'intern': 'Intern'
    }
    return labels[type] || type
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Active',
      'on-leave': 'On Leave',
      'terminated': 'Terminated'
    }
    return labels[status] || status
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'success',
      'on-leave': 'warning',
      'terminated': 'error'
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
   * Get avatar URL
   */
  getAvatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&name=${encodeURIComponent(name)}`
  }

  /**
   * Get document type label
   */
  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'guarantee_letter': 'Guarantee Letter',
      'id_card': 'ID Card',
      'cv': 'CV/Resume',
      'degree': 'Degree/Certificate'
    }
    return labels[type] || type
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get urgency level color for old guarantees
   */
  getUrgencyColor(urgencyLevel: string): string {
    const colors: Record<string, string> = {
      'critical': 'error',
      'warning': 'warning',
      'attention': 'info',
      'ok': 'success'
    }
    return colors[urgencyLevel] || 'default'
  }

  /**
   * Get urgency level label
   */
  getUrgencyLabel(urgencyLevel: string): string {
    const labels: Record<string, string> = {
      'critical': 'Critical - Over 12 months',
      'warning': 'Warning - Over 9 months',
      'attention': 'Attention - Over 6 months',
      'ok': 'OK - Less than 6 months'
    }
    return labels[urgencyLevel] || urgencyLevel
  }
}

export default new EmployeesService()