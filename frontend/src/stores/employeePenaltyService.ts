// stores/employeePenaltyService.ts
import api from './interceptor';

export interface EmployeePenalty {
  penalty_id: number;
  employee_id: number;
  period_id?: number;
  penalty_type: string;
  calculation_type: 'fixed' | 'percent';
  value: number;
  calculated_amount?: number;
  reference?: string;
  submitted_by?: string;
  contact?: string;
  reason?: string;
  month: string;
  status: 'active' | 'applied' | 'cancelled' | 'reduced';
  original_value?: number;
  reduction_reason?: string;
  reduced_by?: string;
  reduced_at?: string;
  created_at: string;
  updated_at: string;
  penalty_date?: string;  // Add this field
  date?: string;          // Add this field for frontend compatibility
}

export interface CreatePenaltyParams {
  penalty_type: string;
  calculation_type: 'fixed' | 'percent';
  value: number;
  reference?: string;
  submitted_by?: string;
  contact?: string;
  reason?: string;
  month: string;
  penalty_date: string;  // ADD THIS - required field
}

export interface PenaltyResponse {
  success: boolean;
  data: EmployeePenalty[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
  error?: string;
}

class EmployeePenaltyService {
  private readonly baseUrl = '/penalties';

  async getEmployeePenalties(employeeId: number, params?: {
    month?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PenaltyResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.month) queryParams.append('month', params.month);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const response = await api.get(`/penalties/employees/${employeeId}/penalties?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get employee penalties error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch penalties'
      };
    }
  }

  async getCurrentMonthPenalties(employeeId: number): Promise<PenaltyResponse> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.getEmployeePenalties(employeeId, { month: currentMonth, status: 'active' });
  }

  async createPenalty(employeeId: number, data: CreatePenaltyParams): Promise<{
    success: boolean;
    message?: string;
    data?: EmployeePenalty;
    error?: string;
  }> {
    try {
      const response = await api.post(`/penalties/employees/${employeeId}/penalties`, data);
      return response.data;
    } catch (error: any) {
      console.error('Create penalty error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create penalty'
      };
    }
  }

  async deletePenalty(penaltyId: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/penalties/penalties/${penaltyId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete penalty error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete penalty'
      };
    }
  }

  async reducePenalty(penaltyId: number, reductionValue: number, reductionReason: string): Promise<{
    success: boolean;
    message?: string;
    data?: EmployeePenalty;
    error?: string;
  }> {
    try {
      const response = await api.put(`/penalties/penalties/${penaltyId}/reduce`, {
        reductionValue,
        reductionReason
      });
      return response.data;
    } catch (error: any) {
      console.error('Reduce penalty error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reduce penalty'
      };
    }
  }

  async bulkCreatePenalties(penalties: Array<{
    employee_id: number;
    penalty_type: string;
    calculation_type: 'fixed' | 'percent';
    value: number;
    month: string;
    reason?: string;
    penalty_date: string;
  }>): Promise<{
    success: boolean;
    message?: string;
    data?: EmployeePenalty[];
    error?: string;
  }> {
    try {
      const response = await api.post('/penalties/bulk', { penalties });
      return response.data;
    } catch (error: any) {
      console.error('Bulk create penalties error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create penalties'
      };
    }
  }

  async applyPenaltiesForPeriod(periodId: number, penaltyIds: number[]): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.post(`/penalties/periods/${periodId}/apply`, { penaltyIds });
      return response.data;
    } catch (error: any) {
      console.error('Apply penalties error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to apply penalties'
      };
    }
  }

  // ==================== HELPER METHODS ====================

  getPenaltyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Excessive Absenteeism': 'Excessive Absenteeism',
      'Chronic Lateness': 'Chronic Lateness',
      'Early Departure': 'Early Departure',
      'Unauthorized Leave': 'Unauthorized Leave',
      'Poor Performance': 'Poor Performance',
      'Missed Deadline': 'Missed Deadline',
      'Quality Issue': 'Quality Issue',
      'Target Shortfall': 'Target Shortfall',
      'Work Error': 'Work Error',
      'Negligence': 'Negligence',
      'Insubordination': 'Insubordination',
      'Workplace Conflict': 'Workplace Conflict',
      'Harassment': 'Harassment',
      'Policy Violation': 'Policy Violation',
      'Safety Violation': 'Safety Violation',
      'Confidentiality Breach': 'Confidentiality Breach',
      'Code of Conduct Violation': 'Code of Conduct Violation',
      'Equipment Damage': 'Equipment Damage',
      'Asset Loss': 'Asset Loss',
      'Property Damage': 'Property Damage',
      'Theft': 'Theft',
      'Fraud': 'Fraud',
      'Time Theft': 'Time Theft',
      'Breach of Trust': 'Breach of Trust',
      'Conflict of Interest': 'Conflict of Interest',
      'Social Media Misconduct': 'Social Media Misconduct',
      'Document Falsification': 'Document Falsification',
      'Written Warning': 'Written Warning',
      'Final Warning': 'Final Warning',
      'Suspension': 'Suspension',
      'Probation Violation': 'Probation Violation'
    };
    return labels[type] || type;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'warning',
      'applied': 'success',
      'cancelled': 'error',
      'reduced': 'info'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Active',
      'applied': 'Applied',
      'cancelled': 'Cancelled',
      'reduced': 'Reduced'
    };
    return labels[status] || status;
  }

  calculatePenaltyAmount(penalty: EmployeePenalty, salary: number): number {
    if (penalty.calculation_type === 'percent') {
      return Math.floor(salary * (penalty.value / 100));
    }
    return penalty.value;
  }

  getPenaltyTypes(): string[] {
    return [
      'Excessive Absenteeism',
      'Chronic Lateness',
      'Early Departure',
      'Unauthorized Leave',
      'Poor Performance',
      'Missed Deadline',
      'Quality Issue',
      'Target Shortfall',
      'Work Error',
      'Negligence',
      'Insubordination',
      'Workplace Conflict',
      'Harassment',
      'Policy Violation',
      'Safety Violation',
      'Confidentiality Breach',
      'Code of Conduct Violation',
      'Equipment Damage',
      'Asset Loss',
      'Property Damage',
      'Theft',
      'Fraud',
      'Time Theft',
      'Breach of Trust',
      'Conflict of Interest',
      'Social Media Misconduct',
      'Document Falsification',
      'Written Warning',
      'Final Warning',
      'Suspension',
      'Probation Violation'
    ];
  }
}

export default new EmployeePenaltyService();