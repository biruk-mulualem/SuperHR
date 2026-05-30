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
  // Handle null/undefined/empty input
  if (!monthStr || typeof monthStr !== 'string') return 'N/A';
  
  // Check if the string contains a dash
  if (!monthStr.includes('-')) return 'N/A';
  
  const parts = monthStr.split('-');
  
  // Ensure we have exactly 2 parts
  if (parts.length !== 2) return 'N/A';
  
  const year = parts[0];
  const month = parts[1];
  
  // Validate year and month exist
  if (!year || !month) return 'N/A';
  
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  
  // Validate numbers
  if (isNaN(yearNum) || isNaN(monthNum)) return 'N/A';
  
  // Validate month range (1-12)
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
}

export default new PayrollService();