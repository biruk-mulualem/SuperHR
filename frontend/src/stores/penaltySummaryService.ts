import api from './interceptor';

// ==================== TYPE DEFINITIONS ====================

export interface PenaltySummary {
  summary_id: number;
  employee_id: number;
  penalty_id: number;
  period_start_date: string;
  period_end_date: string;
  period_label: string;
  penalty_type: 'percent' | 'asset' | 'other';
  penalty_name: string;
  penalty_category?: string;
  original_amount: number;
  current_amount: number;
  total_deducted_amount: number;
  original_percentage?: number;
  current_percentage?: number;
  status: 'active' | 'partially_deducted' | 'fully_deducted' | 'cancelled';
  reference_document?: string;
  submitted_by?: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PenaltyDeduction {
  deduction_id: number;
  employee_id: number;
  summary_id: number;
  penalty_id: number;
  deduction_date: string;
  period_start_date: string;
  period_end_date: string;
  deduction_type: 'percent_reduction' | 'amount_reduction' | 'full_reduction';
  deduction_amount: number;
  deduction_percentage?: number;
  previous_amount: number;
  new_amount: number;
  previous_percentage?: number;
  new_percentage?: number;
  reason: string;
  processed_by: string;
  processed_by_id?: number;
  approved_by?: string;
  is_batch: boolean;
  batch_id?: string;
  batch_rule_applied?: any;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface PenaltySummaryResponse {
  success: boolean;
  data: any[]; // Aggregated employee penalty data
  totals?: {
    totalAssetPenalty: number;
    totalOtherPenalty: number;
    totalPercentPenalty: number;
    totalPenaltyAmount: number;
    totalEmployees: number;
    totalPenaltyCount: number;
  };
  periodRange?: {
    fromDate: string | null;
    toDate: string | null;
    label: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count: number;
  error?: string;
}

export interface GetPenaltySummaryParams {
  fromDate?: string;
  toDate?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApplyReductionParams {
  deductionAmount?: number;
  deductionPercentage?: number;
  reason: string;
  processedBy: string;
  periodStartDate: string;
  periodEndDate: string;
  reference?: string;
  penaltyType?: 'asset' | 'other';
}

export interface ReductionHistoryItem {
  id: number;
  type: string;
  amount: number;
  isPercent: boolean;
  reason: string;
  processedBy: string;
  date: string;
  originalAmount?: number;
  currentAmount?: number;
}

// ==================== SERVICE CLASS ====================

class PenaltySummaryService {
  
  // ==================== PENALTY SUMMARY ====================
  
  async getPenaltySummary(params: GetPenaltySummaryParams): Promise<PenaltySummaryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.department && params.department !== 'all') queryParams.append('department', params.department);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await api.get(`/penalty-summary/summary?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get penalty summary error:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.response?.data?.error || 'Failed to fetch penalty summary'
      };
    }
  }
  
  // ==================== PENALTY REDUCTION ====================
  
  async applyPenaltyReduction(
    employeeId: number,
    data: ApplyReductionParams
  ): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      if (!employeeId || isNaN(employeeId)) {
        return { success: false, error: 'Invalid employee ID' };
      }
      
      const response = await api.post(`/penalty-summary/reduce/employee/${employeeId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Apply penalty reduction error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to apply reduction'
      };
    }
  }
  
  // ==================== REDUCTION HISTORY ====================
  
  async getReductionHistory(
    employeeId: number,
    params?: { fromDate?: string; toDate?: string }
  ): Promise<{ success: boolean; data?: ReductionHistoryItem[]; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params?.toDate) queryParams.append('toDate', params.toDate);
      
      const response = await api.get(`/penalty-summary/reductions/${employeeId}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get reduction history error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch reduction history'
      };
    }
  }
  
  // ==================== UPDATE REDUCTION ====================
  
  async updateReduction(
    employeeId: number,
    reductionId: number,
    data: { amount: number; reason: string; type?: string }
  ): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      const response = await api.put(`/penalty-summary/reduction/${employeeId}/${reductionId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update reduction error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update reduction'
      };
    }
  }
  
  // ==================== DELETE REDUCTION ====================
  
  async deleteReduction(
    employeeId: number,
    reductionId: number
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.delete(`/penalty-summary/reduction/${employeeId}/${reductionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete reduction error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete reduction'
      };
    }
  }
  
  // ==================== EMPLOYEE PENALTY SUMMARY ====================
  
  async getEmployeePenaltySummary(employeeId: number): Promise<{ 
    success: boolean; 
    data?: any;
    error?: string 
  }> {
    try {
      const response = await api.get(`/penalty-summary/employees/${employeeId}/summary`);
      return response.data;
    } catch (error: any) {
      console.error('Get employee penalty summary error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch employee penalty summary'
      };
    }
  }
  
  // ==================== EXPORT ====================
  
  async exportPenaltySummary(params: {
    fromDate?: string;
    toDate?: string;
    department?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob | null> {
    try {
      const queryParams = new URLSearchParams();
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.department) queryParams.append('department', params.department);
      if (params.format) queryParams.append('format', params.format);
      
      const response = await api.get(`/penalty-summary/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Export penalty summary error:', error);
      return null;
    }
  }
  
  // ==================== BATCH REDUCTION (DEPRECATED - kept for compatibility) ====================
  
  async applyBatchPenaltyReduction(data: any): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      const response = await api.post('/penalty-summary/batch-reduce', data);
      return response.data;
    } catch (error: any) {
      console.error('Apply batch penalty reduction error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to apply batch reduction'
      };
    }
  }
  
  // ==================== DEDUCTION REPORTS (DEPRECATED) ====================
  
  async getDeductionReport(params: any): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.department) queryParams.append('department', params.department);
      if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString());
      
      const response = await api.get(`/penalty-summary/deductions?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get deduction report error:', error);
      return { success: false, data: [], count: 0 };
    }
  }
  
  async getEmployeeDeductions(employeeId: number, params?: { fromDate?: string; toDate?: string }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params?.toDate) queryParams.append('toDate', params.toDate);
      
      const response = await api.get(`/penalty-summary/employees/${employeeId}/deductions?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get employee deductions error:', error);
      return { success: false, data: [] };
    }
  }
  
  // ==================== RULES MANAGEMENT (DEPRECATED) ====================
  
  async getReductionRules(): Promise<any> {
    try {
      const response = await api.get('/penalty-summary/rules');
      return response.data;
    } catch (error: any) {
      console.error('Get reduction rules error:', error);
      return { success: false, data: {} };
    }
  }
  
  async saveReductionRules(rules: any[]): Promise<any> {
    try {
      const response = await api.post('/penalty-summary/rules', { rules });
      return response.data;
    } catch (error: any) {
      console.error('Save reduction rules error:', error);
      return { success: false };
    }
  }
  
  // ==================== STATISTICS (DEPRECATED) ====================
  
  async getPenaltyStatistics(params: { year?: number; month?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.year) queryParams.append('year', params.year.toString());
      if (params.month) queryParams.append('month', params.month.toString());
      
      const response = await api.get(`/penalty-summary/statistics?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get penalty statistics error:', error);
      return { success: false, data: {} };
    }
  }
  
  async createPenaltySummary(data: any): Promise<any> {
    try {
      const response = await api.post('/penalty-summary/summary', data);
      return response.data;
    } catch (error: any) {
      console.error('Create penalty summary error:', error);
      return { success: false, error: error.response?.data?.error };
    }
  }
  
  async getPenaltySummaryById(summaryId: number): Promise<any> {
    try {
      const response = await api.get(`/penalty-summary/summary/${summaryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get penalty summary by ID error:', error);
      return { success: false, error: error.response?.data?.error };
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  formatPeriodLabel(startDate: Date | string | null, endDate: Date | string | null): string {
    if (!startDate || !endDate) return 'Custom Range';
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid Date Range';
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const lastDayOfEndMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    
    if (startDay === 1 && endDay === lastDayOfEndMonth) {
      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return start.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      if (start.getFullYear() === end.getFullYear()) {
        return `${start.toLocaleString('default', { month: 'short' })} - ${end.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
      }
      return `${start.toLocaleString('default', { month: 'short', year: 'numeric' })} - ${end.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
    }
    
    const quarters: [number, number][] = [[0, 2], [3, 5], [6, 8], [9, 11]];
    const startQuarterIndex = quarters.findIndex(([min, max]) => start.getMonth() >= min && start.getMonth() <= max);
    const endQuarterIndex = quarters.findIndex(([min, max]) => end.getMonth() >= min && end.getMonth() <= max);
    
    if (startQuarterIndex !== -1 && endQuarterIndex !== -1 && startQuarterIndex === endQuarterIndex && startDay === 1 && endDay === lastDayOfEndMonth) {
      return `Q${startQuarterIndex + 1} ${start.getFullYear()}`;
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }
  
  getPenaltyTypeLabel(type: string): string {
    const labels: Record<string, string> = { 'asset': 'Asset Penalty', 'other': 'Other Penalty', 'percent': 'Percent Penalty' };
    return labels[type] || type;
  }
  
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'active': 'Active', 'partially_deducted': 'Partially Deducted', 'fully_deducted': 'Fully Deducted', 'cancelled': 'Cancelled' };
    return labels[status] || status;
  }
  
  getStatusColor(status: string): string {
    const colors: Record<string, string> = { 'active': 'warning', 'partially_deducted': 'info', 'fully_deducted': 'success', 'cancelled': 'error' };
    return colors[status] || 'default';
  }
  
  formatDateForApi(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0] ?? '';
  }
  
  getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { startDate: this.formatDateForApi(start), endDate: this.formatDateForApi(end) };
  }
  
  getCurrentMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    return this.getMonthRange(now.getFullYear(), now.getMonth() + 1);
  }
  
  getPreviousMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return this.getMonthRange(prevMonth.getFullYear(), prevMonth.getMonth() + 1);
  }
}

export default new PenaltySummaryService();