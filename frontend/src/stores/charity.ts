// stores/charity.ts  — Strictly synchronized with Updated Backend Spec
import api from './interceptor'
import EmployeesService from './employee'

// ============================================================================
// TYPES
// ============================================================================

/** CharityTeam Model */
export interface CharityTeam {
  teamId: number
  name: string
  description?: string
  head?: number                 // employee_id
  vice?: number                 // employee_id
  members: number[]             // array of employee_ids
  isActive: boolean
  createdBy?: number
  updatedBy?: number
  deletedBy?: number
  created_at?: string
  updated_at?: string
  // Associations (populated by backend)
  headMember?: { employeeId: number; firstName: string; lastName: string }
  viceMember?: { employeeId: number; firstName: string; lastName: string }
  creator?: { userId: number; fullName: string }
  beneficiaries?: CharityBeneficiary[]
}

/** CharityBeneficiary Model */
export interface CharityBeneficiary {
  beneficiaryId: number
  fullname: string
  fullInfo: {
    location?: { region: string; city: string; woreda: string }
    contact?: { phone?: string; email?: string; contactPerson?: string }
    [key: string]: any
  }
  teamId: number
  isActive: boolean
  monthlyAllocation: number
  paymentMethod: 'cash' | 'bank'
  bankInfo?: { account_no: string; bank: string }
  isSpecialCase?: string | null
  deliveries: Array<{
    delivery_id: number
    distribution_release_id: number
    distribution_release_payment_for_indays: number
    amount: number
    is_delivered: boolean
    is_returned: null | { reason: string }
    recipt: string | null
    created_by: number
    created_at: string
    updated_by: number
    updated_at: string
    deleted_at?: string
    deleted_by?: number
  }>
  adjustments: Array<{
    adjustment_id: number
    type: 'Deduct' | 'increase'
    reason: string
    amount: number
    created_by: number
    created_at: string
    deleted_at?: string
    deleted_by?: number
  }>
  createdBy?: number
  updatedBy?: number
  deletedBy?: number
  created_at?: string
  updated_at?: string
  // Associations
  team?: CharityTeam
  creator?: { userId: number; fullName: string }
}

/** CharitySetting Model */
export interface CharitySetting {
  settingId: number
  settingKey: string            // 'main', etc.
  distributionRelease: Array<{
    distribution_release_id: number
    date: string
    payment_for_indays: number
    usageCount?: number
    is_completed?: boolean
  }>
  defaults: {
    monthly_allocation: number
    payment_method: 'cash' | 'bank'
    beneficiaries_special_cases: string[]
  }

  updatedBy?: number
  created_at?: string
  updated_at?: string
  lastUpdatedBy?: { userId: number; fullName: string }
}

/** CharityLog Model */
export interface CharityLog {
  logId: number
  action: string
  module: string
  targetId?: number
  details: any
  userId?: number
  created_at: string
  user?: { userId: number; fullName: string }
}

// ============================================================================
// SERVICE
// ============================================================================

class CharityService {

  // ── Teams ──────────────────────────────────────────────────────────────────
  async getTeams(params?: { search?: string; isActive?: boolean; page?: number; size?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search)   q.set('search', params.search)
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
      if (params?.page)     q.set('page', String(params.page))
      if (params?.size)     q.set('size', String(params.size))
      const r = await api.get(`/charity/teams${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getTeamById(id: number | string) {
    try { const r = await api.get(`/charity/teams/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createTeam(data: Partial<CharityTeam>) {
    try { const r = await api.post('/charity/teams', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateTeam(id: number, data: Partial<CharityTeam>) {
    try { const r = await api.put(`/charity/teams/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteTeam(id: number) {
    try { const r = await api.delete(`/charity/teams/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Beneficiaries ──────────────────────────────────────────────────────────
  async getBeneficiaries(params?: { search?: string; isActive?: boolean; teamId?: number; page?: number; size?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search)             q.set('search', params.search)
      if (params?.teamId)             q.set('teamId', String(params.teamId))
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
      if (params?.page)               q.set('page', String(params.page))
      if (params?.size)               q.set('size', String(params.size))
      const r = await api.get(`/charity/beneficiaries${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getBeneficiaryById(id: number | string) {
    try { const r = await api.get(`/charity/beneficiaries/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createBeneficiary(data: Partial<CharityBeneficiary>) {
    try { const r = await api.post('/charity/beneficiaries', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateBeneficiary(id: number | string, data: Partial<CharityBeneficiary>) {
    try { const r = await api.put(`/charity/beneficiaries/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteBeneficiary(id: number | string) {
    try { const r = await api.delete(`/charity/beneficiaries/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async transferBeneficiary(id: number | string, targetTeamId: number) {
    try { const r = await api.post(`/charity/beneficiaries/${id}/transfer`, { targetTeamId }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async addAdjustment(id: number | string, data: { type: 'Deduct' | 'increase'; amount: number; reason: string }) {
    try { const r = await api.post(`/charity/beneficiaries/${id}/adjustment`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async addDelivery(id: number | string, data: { distribution_release_id: number; is_delivered?: boolean; recipt?: string; is_returned?: { reason: string } }) {
    try { const r = await api.post(`/charity/beneficiaries/${id}/delivery`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateDelivery(benId: number | string, deliveryId: number | string, data: { is_delivered?: boolean; recipt?: string; is_returned?: { reason: string } | null }) {
    try { const r = await api.put(`/charity/beneficiaries/${benId}/delivery/${deliveryId}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  async bulkAddDelivery(data: { beneficiaryIds: number[]; distribution_release_id: number; is_delivered: boolean; recipt?: string }) {
    try { const r = await api.post('/charity/beneficiaries/bulk/delivery', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  async bulkAddAdjustment(data: { beneficiaryIds: number[]; type: 'Deduct' | 'increase'; amount: number; reason: string }) {
    try { const r = await api.post('/charity/beneficiaries/bulk/adjustment', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  async bulkUpdateBeneficiaries(data: { beneficiaryIds: number[]; updates: any }) {
    try { const r = await api.put('/charity/beneficiaries/bulk/update', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings() {
    try { const r = await api.get('/charity/settings'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateSettings(data: Partial<CharitySetting>) {
    try { const r = await api.put('/charity/settings', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardStats() {
    try { const r = await api.get('/charity/dashboard/stats'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  async getLogs(params?: { page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      const r = await api.get(`/charity/dashboard/logs${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Employees Dropdown ────────────────────────────────────────────────────
  async getEmployeesForDropdown() {
    try {
      const res = await EmployeesService.getEmployees({ limit: 500, employmentStatus: 'active' })
      if (res.success) {
        return { success: true, data: res.data.map((e: any) => ({ id: e.id, fullName: e.fullName })) }
      }
      return { success: false, data: [], error: 'Failed to fetch employees' }
    } catch (e: any) { return { success: false, data: [], error: e.message } }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })
  }
}

export default new CharityService()
