// services/settingService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Role {
  roleId: number;
  name: string;
  description: string;
  isActive: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  departmentId: number;
  code: string;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  manager?: {
    userId: number;
    fullName: string;
    email: string;
  };
  parentDepartmentId?: number;
  parent?: {
    departmentId: number;
    name: string;
    code: string;
  };
  budget: number;
  location?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  positionId: number;
  code: string;
  title: string;
  departmentId?: number;
  departmentName?: string;
  department?: {
    departmentId: number;
    name: string;
    code: string;
  };
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  requirements?: string[];
  responsibilities?: string[];
  isActive: boolean;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSetting {
  settingId: number;
  settingKey: string;
  settingValue: any;
  category: string;
  description?: string;
  dataType: 'json' | 'string' | 'number' | 'boolean' | 'array';
  isEditable: boolean;
  version: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRules {
  workSchedule: {
    expectedCheckIn: string;
    expectedCheckOut: string;
    lateThreshold: number;
    gracePeriod: number;
    earlyDepartureThreshold: number;
    minWorkHours: number;
    workingDays: string[];
  };
  breakRules: {
    lunchStart: string;
    lunchEnd: string;
    lunchDuration: number;
    isLunchPaid: boolean;
    morningBreak: number;
    afternoonBreak: number;
    flexibleBreaks: boolean;
  };
  overtimeRules: {
    threshold: number;
    weekdayRate: number;
    weekendRate: number;
    holidayRate: number;
    maxPerDay: number;
    maxPerWeek: number;
    approvalRequired: boolean;
    eligiblePositions: number[];
  };
  leaveRules: {
    annual: number;
    sick: number;
    maternity: number;
    paternity: number;
    bereavement: number;
    unpaid: boolean;
    maxConsecutive: number;
    noticeDays: number;
    carryover: boolean;
    maxCarryover: number;
  };
  holidayRules: {
    holidays: Array<{
      date: string;
      name: string;
      type: 'public' | 'religious' | 'company';
    }>;
    holidayOvertimeRate: number;
  };
  fieldWorkRules: {
    consideredPresent: boolean;
    defaultHours: number;
    requireCheckin: boolean;
    eligiblePositions: number[];
  };
  remoteWorkRules: {
    allowed: boolean;
    maxDaysPerWeek: number;
    approvalRequired: boolean;
    eligiblePositions: number[];
  };
  notificationRules: {
    sendLateAlert: boolean;
    lateAlertMinutes: number;
    sendAbsentAlert: boolean;
    absentAlertHour: number;
    notifyManagers: boolean;
  };
  reportRules: {
    autoGenerateWeekly: boolean;
    autoGenerateMonthly: boolean;
    weeklyReportDay: string;
    monthlyReportDay: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class SettingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  // ==================== ROLES API ====================
  
  async getRoles(page: number = 1, limit: number = 20, includeInactive: boolean = false): Promise<PaginatedResponse<Role>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/settings/roles?page=${page}&limit=${limit}&includeInactive=${includeInactive}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch roles' };
    }
  }

  async getRoleById(id: number): Promise<ApiResponse<Role>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/roles/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch role' };
    }
  }

  async createRole(data: Partial<Role>): Promise<ApiResponse<Role>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/roles`, data, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to create role' };
    }
  }

  async updateRole(id: number, data: Partial<Role>): Promise<ApiResponse<Role>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/settings/roles/${id}`, data, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to update role' };
    }
  }

  async toggleRoleStatus(id: number, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/settings/roles/${id}/status`, { isActive }, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to toggle role status' };
    }
  }

  async deleteRole(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/settings/roles/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to delete role' };
    }
  }

  // ==================== DEPARTMENTS API ====================
  
  async getDepartments(page: number = 1, limit: number = 20, includeInactive: boolean = false): Promise<PaginatedResponse<Department>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/settings/departments?page=${page}&limit=${limit}&includeInactive=${includeInactive}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch departments' };
    }
  }

  async getAllDepartments(): Promise<ApiResponse<Department[]>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/departments/all`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch all departments' };
    }
  }

  async getDepartmentById(id: number): Promise<ApiResponse<Department>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/departments/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch department' };
    }
  }

  async getDepartmentTree(): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/departments/tree`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch department tree' };
    }
  }

  async getDepartmentStatistics(): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/departments/stats`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch department statistics' };
    }
  }

  async createDepartment(data: Partial<Department>): Promise<ApiResponse<Department>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/departments`, data, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to create department' };
    }
  }

  async updateDepartment(id: number, data: Partial<Department>): Promise<ApiResponse<Department>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/settings/departments/${id}`, data, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to update department' };
    }
  }

  async toggleDepartmentStatus(id: number, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/settings/departments/${id}/status`, { isActive }, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to toggle department status' };
    }
  }

  async deleteDepartment(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/settings/departments/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to delete department' };
    }
  }

  // ==================== POSITIONS API ====================
  
  async getPositions(page: number = 1, limit: number = 20, includeInactive: boolean = false, departmentId?: number): Promise<PaginatedResponse<Position>> {
    try {
      let url = `${API_BASE_URL}/settings/positions?page=${page}&limit=${limit}&includeInactive=${includeInactive}`;
      if (departmentId) url += `&departmentId=${departmentId}`;
      const response = await axios.get(url, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch positions' };
    }
  }

  async getAllPositions(): Promise<ApiResponse<Position[]>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/positions/all`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch all positions' };
    }
  }

  async getPositionById(id: number): Promise<ApiResponse<Position>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/positions/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch position' };
    }
  }

  async createPosition(data: Partial<Position>): Promise<ApiResponse<Position>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/positions`, data, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to create position' };
    }
  }

  async updatePosition(id: number, data: Partial<Position>): Promise<ApiResponse<Position>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/settings/positions/${id}`, data, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to update position' };
    }
  }

  async togglePositionStatus(id: number, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/settings/positions/${id}/status`, { isActive }, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to toggle position status' };
    }
  }

  async deletePosition(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/settings/positions/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to delete position' };
    }
  }

  // ==================== SYSTEM SETTINGS API ====================
  
  async getAllSettings(): Promise<ApiResponse<SystemSetting[]>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/settings`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch settings' };
    }
  }

  async getSettingByKey(key: string): Promise<ApiResponse<SystemSetting>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/settings/${key}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch setting' };
    }
  }

  async upsertSetting(key: string, value: any, category?: string, description?: string, dataType?: string): Promise<ApiResponse<SystemSetting>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/settings`, {
        key,
        value,
        category,
        description,
        dataType
      }, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to save setting' };
    }
  }

  async batchUpdateSettings(settings: Record<string, any>): Promise<ApiResponse<any>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/settings/settings/batch`, { settings }, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to batch update settings' };
    }
  }

  async deleteSetting(key: string): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/settings/settings/${key}`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to delete setting' };
    }
  }

  // ==================== ATTENDANCE RULES API ====================
  
  async getAttendanceRules(): Promise<ApiResponse<AttendanceRules>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/attendance/rules`, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch attendance rules' };
    }
  }

  async updateAttendanceRules(rules: Partial<AttendanceRules>): Promise<ApiResponse<SystemSetting>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/settings/attendance/rules`, rules, this.getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to update attendance rules' };
    }
  }

  // ==================== UTILITY METHODS ====================
  
  // Get default attendance rules
  getDefaultAttendanceRules(): AttendanceRules {
    return {
      workSchedule: {
        expectedCheckIn: '06:20',
        expectedCheckOut: '18:00',
        lateThreshold: 5,
        gracePeriod: 15,
        earlyDepartureThreshold: 30,
        minWorkHours: 4,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      breakRules: {
        lunchStart: '12:00',
        lunchEnd: '13:00',
        lunchDuration: 60,
        isLunchPaid: false,
        morningBreak: 15,
        afternoonBreak: 15,
        flexibleBreaks: false
      },
      overtimeRules: {
        threshold: 8,
        weekdayRate: 1.5,
        weekendRate: 2.0,
        holidayRate: 2.5,
        maxPerDay: 4,
        maxPerWeek: 20,
        approvalRequired: true,
        eligiblePositions: []
      },
      leaveRules: {
        annual: 20,
        sick: 10,
        maternity: 90,
        paternity: 10,
        bereavement: 5,
        unpaid: true,
        maxConsecutive: 30,
        noticeDays: 3,
        carryover: true,
        maxCarryover: 30
      },
      holidayRules: {
        holidays: [
          { date: '2026-01-01', name: 'New Year', type: 'public' },
          { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
          { date: '2026-01-19', name: 'Timkat', type: 'religious' },
          { date: '2026-03-02', name: 'Adwa Victory Day', type: 'public' },
          { date: '2026-04-18', name: 'Good Friday', type: 'religious' },
          { date: '2026-04-20', name: 'Easter Monday', type: 'religious' },
          { date: '2026-05-01', name: 'Labour Day', type: 'public' },
          { date: '2026-05-05', name: 'Patriots Day', type: 'public' },
          { date: '2026-05-28', name: 'Derg Downfall Day', type: 'public' },
          { date: '2026-09-11', name: 'Ethiopian New Year', type: 'public' },
          { date: '2026-09-27', name: 'Meskel', type: 'religious' }
        ],
        holidayOvertimeRate: 2.5
      },
      fieldWorkRules: {
        consideredPresent: true,
        defaultHours: 8,
        requireCheckin: false,
        eligiblePositions: []
      },
      remoteWorkRules: {
        allowed: true,
        maxDaysPerWeek: 2,
        approvalRequired: true,
        eligiblePositions: []
      },
      notificationRules: {
        sendLateAlert: true,
        lateAlertMinutes: 30,
        sendAbsentAlert: true,
        absentAlertHour: 10,
        notifyManagers: true
      },
      reportRules: {
        autoGenerateWeekly: true,
        autoGenerateMonthly: true,
        weeklyReportDay: 'friday',
        monthlyReportDay: 25
      }
    };
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export default new SettingService();