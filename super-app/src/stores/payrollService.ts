// stores/payrollService.ts
import api from './interceptor';

export interface PayrollItem {
  id: number;
  employeeId: number;
  employeeCode: string;
  fullName: string;
  department: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  positionAllowance: number;
  mobileAllowance: number;
  allowancesTotal: number;
  allowancesTotalDisplay: number;
  overtimeHours: number;
  overtimePay: number;
  grossPay: number;
  tax: number;
  pension7: number;
  pension11: number;
  governmentNet: number;
  absentDays: number;
  absentPenalty: number;
  lateMinutes: number;
  latePenalty: number;
  totalPenalties: number;
  deductions: any[];
  otherDeductionsTotal: number;
  totalDeductions: number;
  finalNetPay: number;
  isOnHold: boolean;
  holdDetails?: {
    reason: string;
    startDate: string;
    duration: number;
    startMonth: string;
    holdId: number;
  };
  penaltySummary: number;
  internalNet: number;
}

export interface PayrollTotals {
  totalGrossPay: number;
  totalTax: number;
  totalPension7: number;
  totalPension11: number;
  totalNetPay: number;
  activeHolds: number;
}

export interface PayrollResponse {
  success: boolean;
  data: PayrollItem[];
  totals: PayrollTotals;
  count: number;
  message?: string;
  error?: string;
}

export interface StatsData {
  employees: number;
  grossPay: number;
  tax: number;
  pension7: number;
  pension11: number;
  activeHolds: number;
}

export interface StatsResponse {
  success: boolean;
  data: StatsData;
  timestamp: string;
  error?: string;
}

class PayrollService {
  async getPayrollData(params: {
    year: number;
    month: number;
    department?: string;
    search?: string;
  }): Promise<PayrollResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('year', params.year.toString());
      queryParams.append('month', params.month.toString());
      if (params.department && params.department !== 'all') {
        queryParams.append('department', params.department);
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      const response = await api.get(`/payroll?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get payroll data error:', error);
      return {
        success: false,
        data: [],
        totals: {
          totalGrossPay: 0,
          totalTax: 0,
          totalPension7: 0,
          totalPension11: 0,
          totalNetPay: 0,
          activeHolds: 0
        },
        count: 0,
        error: error.response?.data?.error || 'Failed to fetch payroll data'
      };
    }
  }

  async getStats(): Promise<StatsResponse> {
    try {
      const response = await api.get('/payroll/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get stats error:', error);
      return {
        success: false,
        data: {
          employees: 0,
          grossPay: 0,
          tax: 0,
          pension7: 0,
          pension11: 0,
          activeHolds: 0
        },
        timestamp: new Date().toISOString(),
        error: error.response?.data?.error || 'Failed to fetch stats'
      };
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  formatDate(date: string | Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatMonth(monthStr: string | null | undefined): string {
    if (!monthStr || typeof monthStr !== 'string') return 'N/A';
    if (!monthStr.includes('-')) return 'N/A';
    
    const parts = monthStr.split('-');
    if (parts.length !== 2) return 'N/A';
    
    const year = parts[0];
    const month = parts[1];
    if (!year || !month) return 'N/A';
    
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum)) return 'N/A';
    if (monthNum < 1 || monthNum > 12) return 'N/A';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[monthNum - 1]} ${yearNum}`;
  }

  getAvailableMonths(): string[] {
    const months: string[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  }

  getPreviousMonth(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }

  getMonthEnd(monthStr: string): string {
    if (!monthStr || !monthStr.includes('-')) return 'N/A';
    const [year, month] = monthStr.split('-');
    const yearNum = Number(year);
    const monthNum = Number(month);
    if (isNaN(yearNum) || isNaN(monthNum)) return 'N/A';
    const lastDay = new Date(yearNum, monthNum, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  isMonthEnded(monthStr: string): boolean {
    return new Date() >= new Date(this.getMonthEnd(monthStr));
  }

  async processPayroll(data: {
    month: string;
    paymentDate: string;
    unclaimedEmployeeCodes: string[];
  }): Promise<any> {
    try {
      const response = await api.post('/payroll/process', {
        month: data.month,
        paymentDate: data.paymentDate,
        unclaimedEmployeeCodes: data.unclaimedEmployeeCodes
      });
      return response.data;
    } catch (error: any) {
      console.error('Process payroll error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to process payroll'
      };
    }
  }

  async isMonthProcessed(monthYear: string): Promise<{ isProcessed: boolean; data?: any }> {
    try {
      const response = await api.get(`/payroll/processing/check/${monthYear}`);
      return response.data;
    } catch (error) {
      console.error('Check month processed error:', error);
      return { isProcessed: false };
    }
  }

  async getActiveEmployees(): Promise<any> {
    try {
      const response = await api.get('/payroll/employees/active');
      return response.data;
    } catch (error: any) {
      console.error('Get active employees error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch employees'
      };
    }
  }

  async getPaymentHistory(filters?: { month?: string; year?: string; department?: string; source?: string }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.source) params.append('source', filters.source);
      
      const response = await api.get(`/payroll/payment-history?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get payment history error:', error);
      return { success: false, data: [], error: error.response?.data?.error };
    }
  }

  // ==================== UNCLAIMED PAYROLL METHODS ====================
  
  async getUnclaimedPayroll(filters?: { 
    month?: string; 
    year?: string; 
    department?: string; 
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);
      if (filters?.department && filters.department !== 'all') params.append('department', filters.department);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/payroll/unclaimed-payroll?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get unclaimed payroll error:', error);
      return { 
        success: false, 
        data: [], 
        pagination: { currentPage: 1, totalPages: 0, totalRecords: 0, recordsPerPage: 10 },
        summary: { totalUnclaimedAmount: 0, totalRecords: 0 },
        error: error.response?.data?.error || 'Failed to fetch unclaimed payroll'
      };
    }
  }

  async payUnclaimedSalary(unclaimedId: number, paymentData: {
    paymentDate: string;
    method: string;
    notes: string;
  }): Promise<any> {
    try {
      const response = await api.post(`/payroll/unclaimed-pay/${unclaimedId}`, paymentData);
      return response.data;
    } catch (error: any) {
      console.error('Pay unclaimed salary error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to process payment'
      };
    }
  }

  async bulkReturnUnclaimed(unclaimedIds: number[], reason: string): Promise<any> {
    try {
      const response = await api.post('/payroll/unclaimed-bulk-return', {
        unclaimedIds,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Bulk return unclaimed error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to process bulk return'
      };
    }
  }




  
}

export default new PayrollService();