// services/attendanceService.ts
import api from '../stores/interceptor';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface Employee {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  department?: string;
  shiftType: 'day' | 'night';
}

export interface EffectiveSchedule {
  employeeId: number;
  employeeName: string;
  department: string;
  shiftType: string;
  effectiveDate: string;
  checkInTime: string;
  checkOutTime: string;
  lunchDuration: number;
  dinnerDuration: number;
  priority: string;
}

export interface BreakTicket {
  id: number;
  employeeId: number;
  employeeName?: string;
  department?: string;
  breakType: 'lunch' | 'dinner';
  breakOutTime: string;
  expectedReturnTime: string;
  actualReturnTime: string | null;
  durationMinutes: number;
  status: 'active' | 'completed' | 'late' | 'absent';
  reason: string | null;
  lateMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// ✅ Add new interface for Lunch History items
export interface LunchHistoryItem {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  durationMinutes: number;
  prioritySource: string;
  breakOutTime: string;
  expectedReturnTime: string;
  actualReturnTime: string | null;
  status: string;
  displayStatus: 'active' | 'late' | 'absent' | 'completed' | 'on-time';
  lateMinutes: number;
}

export interface AttendanceLog {
  id: number;
  employeeId: number;
  attendanceDate: string;
  shiftType: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  isLate: boolean;
  lateMinutes: number;
  isAbsent: boolean;
  isHalfDay: boolean;
  isHoliday: boolean;
  isFieldWork: boolean;
  isOnLeave: boolean;
  totalHours: number;
  overtimeMinutes: number;
  overtimeRateApplied: number | null;
  notes: string | null;
}

export interface OvertimeResult {
  overtimeMinutes: number;
  rate: number;
}

export interface OvertimeRate {
  id: number;
  shiftType: 'day' | 'night';
  dayType: 'weekday' | 'weekend' | 'holiday';
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface FieldWorkAssignment {
  id: number;
  employeeId: number;
  employeeName?: string;
  departmentName?: string;
  assignmentType: 'today' | 'range' | 'permanent';
  startDate: string;
  endDate: string | null;
  noOfficeCheckin: boolean;
  status: 'active' | 'completed' | 'cancelled';
  location: string | null;
  notes: string | null;
  completedAt: string | null;
}

export interface Holiday {
  id: number;
  name: string;
  holidayDate: string;
  ethiopianDate: string | null;
  holidayType: 'public' | 'religious' | 'company';
  overtimeRate: number;
  isRecurring: boolean;
  year: number | null;
}

// ✅ Update LateNightAdjustment interface to include departmentName
export interface LateNightAdjustment {
  id: number;
  employeeId: number;
  employeeName?: string;
  departmentName?: string;  // ✅ Added departmentName
  workDate: string;
  workedUntilTime: string;
  adjustedCheckInTime: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CompanyShiftDefault {
  id: number;
  shiftType: 'day' | 'night';
  checkInTime: string;
  checkOutTime: string;
  checkOutDayOffset: number;
  lateThresholdMinutes: number;
  absentAfterMinutes: number;
  lunchDurationMinutes: number;
  dinnerDurationMinutes: number;
  dinnerStartTime: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

export interface DepartmentOverride {
  id: number;
  departmentId: number;
  departmentName?: string;
  shiftType: 'day' | 'night';
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchDurationMinutes: number | null;
  dinnerDurationMinutes: number | null;
  dinnerStartTime: string | null;
  overtimeAfterTime: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface EmployeeOverride {
  id: number;
  employeeId: number;
  employeeName?: string;
  departmentName?: string;
  shiftType: 'day' | 'night';
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchDurationMinutes: number | null;
  dinnerDurationMinutes: number | null;
  dinnerStartTime: string | null;
  overtimeAfterTime: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface WorkingDaysConfig {
  id: number;
  shiftType: 'day' | 'night';
  dayOfWeek: string;
  isWorkingDay: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface AttendanceReportResponse {
  success: boolean;
  data: AttendanceLog[];
  summary?: AttendanceSummary;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  count?: number;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  totalHours?: string;
  year?: number;
  month?: number;
}

export interface MyAttendanceResponse {
  success: boolean;
  data: AttendanceLog[];
  summary: AttendanceSummary;
  count: number;
}

export interface DashboardStats {
  activeBreaks: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  activeFieldWork: number;
  upcomingHolidays?: Array<{ name: string; date: string; type: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =============================================
// ATTENDANCE SERVICE CLASS
// =============================================

class AttendanceService {
  
  // =============================================
  // 1. EFFECTIVE SCHEDULE
  // =============================================
  
  async getEffectiveSchedule(employeeId: number, date?: string): Promise<EffectiveSchedule> {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/attendance/schedule/${employeeId}${params}`);
    return response.data.data;
  }
  
  async getEffectiveWorkingHours(employeeId: number, date?: string): Promise<{
    employeeId: number;
    date: string;
    checkInTime: string;
    checkOutTime: string;
    totalHours: number;
    totalMinutes: number;
  }> {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/attendance/working-hours/${employeeId}${params}`);
    return response.data.data;
  }
  
  // =============================================
  // 2. COMPANY SHIFT DEFAULTS
  // =============================================
  
  async getCompanyDefaults(): Promise<CompanyShiftDefault[]> {
    const response = await api.get('/attendance/company-defaults');
    return response.data.data;
  }
  
  async getCompanyDefaultById(id: number): Promise<CompanyShiftDefault> {
    const response = await api.get(`/attendance/company-defaults/${id}`);
    return response.data.data;
  }
  
  async createCompanyDefault(data: Partial<CompanyShiftDefault>): Promise<CompanyShiftDefault> {
    const response = await api.post('/attendance/company-defaults', data);
    return response.data.data;
  }
  
  async updateCompanyDefault(id: number, data: Partial<CompanyShiftDefault>): Promise<CompanyShiftDefault> {
    const response = await api.put(`/attendance/company-defaults/${id}`, data);
    return response.data.data;
  }
  
  async deleteCompanyDefault(id: number): Promise<void> {
    await api.delete(`/attendance/company-defaults/${id}`);
  }
  
  // =============================================
  // 3. DEPARTMENT OVERRIDES
  // =============================================
  
  async getDepartmentOverrides(departmentId?: number, shiftType?: string): Promise<DepartmentOverride[]> {
    const params = new URLSearchParams();
    if (departmentId && departmentId.toString() !== 'undefined') {
      params.append('departmentId', departmentId.toString());
    }
    if (shiftType && shiftType !== 'undefined') {
      params.append('shiftType', shiftType);
    }
    const queryString = params.toString();
    const url = queryString ? `/attendance/department-overrides?${queryString}` : '/attendance/department-overrides';
    const response = await api.get(url);
    return response.data.data;
  }
  
  async getDepartmentOverrideById(id: number): Promise<DepartmentOverride> {
    const response = await api.get(`/attendance/department-overrides/${id}`);
    return response.data.data;
  }
  
  async createDepartmentOverride(data: Partial<DepartmentOverride>): Promise<DepartmentOverride> {
    const response = await api.post('/attendance/department-overrides', data);
    return response.data.data;
  }
  
  async updateDepartmentOverride(id: number, data: Partial<DepartmentOverride>): Promise<DepartmentOverride> {
    const response = await api.put(`/attendance/department-overrides/${id}`, data);
    return response.data.data;
  }
  
  async deleteDepartmentOverride(id: number): Promise<void> {
    await api.delete(`/attendance/department-overrides/${id}`);
  }
  
  // =============================================
  // 4. EMPLOYEE OVERRIDES
  // =============================================
  
  async getEmployeeOverrides(employeeId?: number, shiftType?: string): Promise<EmployeeOverride[]> {
    const params = new URLSearchParams();
    if (employeeId && employeeId.toString() !== 'undefined') {
      params.append('employeeId', employeeId.toString());
    }
    if (shiftType && shiftType !== 'undefined') {
      params.append('shiftType', shiftType);
    }
    const queryString = params.toString();
    const url = queryString ? `/attendance/employee-overrides?${queryString}` : '/attendance/employee-overrides';
    const response = await api.get(url);
    return response.data.data;
  }
  
  async getEmployeeOverrideById(id: number): Promise<EmployeeOverride> {
    const response = await api.get(`/attendance/employee-overrides/${id}`);
    return response.data.data;
  }
  
  async createEmployeeOverride(data: Partial<EmployeeOverride>): Promise<EmployeeOverride> {
    const response = await api.post('/attendance/employee-overrides', data);
    return response.data.data;
  }
  
  async updateEmployeeOverride(id: number, data: Partial<EmployeeOverride>): Promise<EmployeeOverride> {
    const response = await api.put(`/attendance/employee-overrides/${id}`, data);
    return response.data.data;
  }
  
  async deleteEmployeeOverride(id: number): Promise<void> {
    await api.delete(`/attendance/employee-overrides/${id}`);
  }

  



  

async getLunchHistory(params?: {
  employeeId?: number;
  page?: number;
  limit?: number;
  search?: string;
  statusFilter?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  
  if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.statusFilter && params.statusFilter !== 'all') {
    queryParams.append('statusFilter', params.statusFilter);
  }
  
  const queryString = queryParams.toString();
  const url = queryString ? `/attendance/lunch-history?${queryString}` : '/attendance/lunch-history';
  const response = await api.get(url);
  return response.data;
}
  
  // =============================================
  // 5. BREAK TICKETS
  // =============================================
  
  async issueBreakTicket(employeeId: number, breakType: 'lunch' | 'dinner', reason?: string): Promise<BreakTicket> {
    const response = await api.post('/attendance/breaks/issue', { employeeId, breakType, reason });
    return response.data.data;
  }
  
  async returnFromBreak(ticketId: number): Promise<BreakTicket> {
    const response = await api.put(`/attendance/breaks/${ticketId}/return`);
    return response.data.data;
  }
  
  async getActiveBreaks(employeeId?: number): Promise<BreakTicket[]> {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await api.get(`/attendance/breaks/active${params}`);
    // Ensure department field is consistent
    const breaks = response.data.data || [];
    return breaks.map((b: any) => ({
      ...b,
      department: b.department || b.Department?.name || 'N/A'
    }));
  }
  
  async getBreakHistory(employeeId: number, page: number = 1, limit: number = 20, status?: string): Promise<PaginatedResponse<BreakTicket>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    const response = await api.get(`/attendance/breaks/history/${employeeId}?${params.toString()}`);
    return response.data;
  }
  
 async getDinnerHistory(params?: {
  employeeId?: number;
  page?: number;
  limit?: number;
  search?: string;
  statusFilter?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  
  if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.statusFilter && params.statusFilter !== 'all') {
    queryParams.append('statusFilter', params.statusFilter);
  }
  
  const queryString = queryParams.toString();
  const url = queryString ? `/attendance/dinner-history?${queryString}` : '/attendance/dinner-history';
  const response = await api.get(url);
  return response.data;
}
  // =============================================
  // 6. ATTENDANCE LOGS
  // =============================================
  
  async recordCheckIn(employeeId: number, checkInTime?: Date, location?: { latitude: number; longitude: number }): Promise<AttendanceLog> {
    const payload: any = {};
    if (checkInTime) payload.checkInTime = checkInTime.toISOString();
    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
    }
    const response = await api.post(`/attendance/attendance/${employeeId}/check-in`, payload);
    return response.data.data;
  }
  
  async recordCheckOut(employeeId: number, checkOutTime?: Date): Promise<{ attendance: AttendanceLog; overtime: OvertimeResult }> {
    const payload: any = {};
    if (checkOutTime) payload.checkOutTime = checkOutTime.toISOString();
    const response = await api.put(`/attendance/attendance/${employeeId}/check-out`, payload);
    return {
      attendance: response.data.data,
      overtime: response.data.overtime
    };
  }
  
  async getAttendanceReport(employeeId: number, startDate: string, endDate: string, page: number = 1, limit: number = 50): Promise<AttendanceReportResponse> {
    const response = await api.get(`/attendance/attendance/${employeeId}/report`, {
      params: { startDate, endDate, page, limit }
    });
    return response.data;
  }
  
  async getMyAttendance(startDate: string, endDate: string): Promise<MyAttendanceResponse> {
    const response = await api.get('/attendance/attendance/me/report', {
      params: { startDate, endDate }
    });
    return response.data;
  }
  
  async getAttendanceSummary(employeeId: number, year?: number, month?: number): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const response = await api.get(`/attendance/attendance/summary/${employeeId}?${params.toString()}`);
    return response.data.data;
  }
  
  // =============================================
  // 7. OVERTIME
  // =============================================
  
  async calculateOvertime(employeeId: number, date?: string): Promise<OvertimeResult> {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/attendance/overtime/${employeeId}/calculate${params}`);
    return response.data.data;
  }
  
  async getOvertimeRates(): Promise<OvertimeRate[]> {
    const response = await api.get('/attendance/overtime/rates');
    return response.data.data;
  }
  
  async createOvertimeRate(data: Partial<OvertimeRate>): Promise<OvertimeRate> {
    const response = await api.post('/attendance/overtime/rates', data);
    return response.data.data;
  }
  
  async updateOvertimeRate(id: number, data: Partial<OvertimeRate>): Promise<OvertimeRate> {
    const response = await api.put(`/attendance/overtime/rates/${id}`, data);
    return response.data.data;
  }
  
  async deleteOvertimeRate(id: number): Promise<void> {
    await api.delete(`/attendance/overtime/rates/${id}`);
  }
  
  // =============================================
  // 8. FIELD WORK
  // =============================================
  
  async registerFieldWork(
    employeeId: number,
    assignmentType: 'today' | 'range' | 'permanent',
    startDate: string,
    endDate?: string,
    location?: string,
    notes?: string
  ): Promise<FieldWorkAssignment> {
    const response = await api.post('/attendance/field-work', {
      employeeId,
      assignmentType,
      startDate,
      endDate,
      location,
      notes
    });
    return response.data.data;
  }
  
  async completeFieldWork(assignmentId: number): Promise<FieldWorkAssignment> {
    const response = await api.put(`/attendance/field-work/${assignmentId}/complete`);
    return response.data.data;
  }
  
  async getActiveFieldWork(employeeId: number): Promise<FieldWorkAssignment | null> {
    const response = await api.get(`/attendance/field-work/${employeeId}/active`);
    return response.data.data;
  }
  
  async getAllFieldWork(): Promise<FieldWorkAssignment[]> {
    const response = await api.get('/attendance/field-work/all');
    return response.data.data;
  }
  
  async updateFieldWork(id: number, data: Partial<FieldWorkAssignment>): Promise<FieldWorkAssignment> {
    const response = await api.put(`/attendance/field-work/${id}`, data);
    return response.data.data;
  }
  
  async deleteFieldWork(id: number): Promise<void> {
    await api.delete(`/attendance/field-work/${id}`);
  }
  
  async getFieldWorkHistory(employeeId: number, page: number = 1, limit: number = 20): Promise<PaginatedResponse<FieldWorkAssignment>> {
    const params = `?page=${page}&limit=${limit}`;
    const response = await api.get(`/attendance/field-work/history/${employeeId}${params}`);
    return response.data;
  }
  
  // =============================================
  // 9. HOLIDAYS
  // =============================================
  
  async getHolidays(year?: number): Promise<Holiday[]> {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/attendance/holidays${params}`);
    return response.data.data;
  }
  
  async checkHoliday(date: string): Promise<{ isHoliday: boolean; overtimeRate: number; holidayName?: string }> {
    const response = await api.get('/attendance/holidays/check', { params: { date } });
    return response.data;
  }
  
  async createHoliday(data: Partial<Holiday>): Promise<Holiday> {
    const response = await api.post('/attendance/holidays', data);
    return response.data.data;
  }
  
  async updateHoliday(id: number, data: Partial<Holiday>): Promise<Holiday> {
    const response = await api.put(`/attendance/holidays/${id}`, data);
    return response.data.data;
  }
  
  async deleteHoliday(id: number): Promise<void> {
    await api.delete(`/attendance/holidays/${id}`);
  }
  
  // =============================================
  // 10. LATE NIGHT ADJUSTMENTS
  // =============================================
  
  async addLateNightAdjustment(
    employeeId: number,
    workDate: string,
    workedUntilTime: string,
    adjustedCheckInTime: string,
    reason?: string
  ): Promise<LateNightAdjustment> {
    const response = await api.post('/attendance/late-night-adjustments', {
      employeeId,
      workDate,
      workedUntilTime,
      adjustedCheckInTime,
      reason
    });
    return response.data.data;
  }
  
 // In attendanceService.ts

async getAllLateNightAdjustments(): Promise<LateNightAdjustment[]> {
  try {
    const response = await api.get('/attendance/late-night-adjustments/all');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching late night adjustments:', error);
    return [];
  }
}

async getLateNightAdjustments(employeeId?: number): Promise<LateNightAdjustment[]> {
  try {
    if (!employeeId || employeeId.toString() === 'undefined') {
      // This will hit the /all endpoint if no employeeId provided
      return await this.getAllLateNightAdjustments();
    }
    const response = await api.get(`/attendance/late-night-adjustments/${employeeId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching late night adjustments:', error);
    return [];
    
  }
}
  
  async updateLateNightAdjustment(adjustmentId: number, data: Partial<LateNightAdjustment>): Promise<LateNightAdjustment> {
    const response = await api.put(`/attendance/late-night-adjustments/${adjustmentId}`, data);
    return response.data.data;
  }
  
  async deleteLateNightAdjustment(adjustmentId: number): Promise<void> {
    await api.delete(`/attendance/late-night-adjustments/${adjustmentId}`);
  }
  
  // =============================================
  // 11. WORKING DAYS
  // =============================================
  
  async checkWorkingDay(employeeId: number, date: string): Promise<{ isWorkingDay: boolean; dayOfWeek?: string; shiftType?: string }> {
    const response = await api.get(`/attendance/working-days/${employeeId}/check`, { params: { date } });
    return response.data;
  }
  
  async getWorkingDaysConfig(): Promise<WorkingDaysConfig[]> {
    const response = await api.get('/attendance/working-days-config');
    return response.data.data;
  }
  
  async updateWorkingDaysConfig(id: number, data: Partial<WorkingDaysConfig>): Promise<WorkingDaysConfig> {
    const response = await api.put(`/attendance/working-days-config/${id}`, data);
    return response.data.data;
  }
  
  // =============================================
  // 12. ADMIN DASHBOARD & STATISTICS
  // =============================================
  
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/attendance/admin/dashboard/stats');
    return response.data.data;
  }
  
  async getAdminAttendanceSummary(startDate: string, endDate: string, departmentId?: string): Promise<{
    summary: Array<{
      departmentName: string;
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      totalLateMinutes: number;
      totalOvertimeMinutes: number;
    }>;
    totalRecords: number;
  }> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (departmentId) params.append('departmentId', departmentId);
    const response = await api.get(`/attendance/admin/attendance/summary?${params.toString()}`);
    return response.data.data;
  }
  
  async exportAttendanceReport(startDate: string, endDate: string, departmentId?: string): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (departmentId) params.append('departmentId', departmentId);
    const response = await api.get(`/attendance/admin/attendance/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
  
  // =============================================
  // 13. BULK OPERATIONS
  // =============================================
  
  async completeAllExpiredBreaks(): Promise<{ completedCount: number }> {
    const response = await api.post('/attendance/bulk/breaks/complete');
    return response.data.data;
  }
  
  async processDailyAttendance(date?: string): Promise<{ processed: number; created: number }> {
    const response = await api.post('/attendance/bulk/attendance/process', { date });
    return response.data.data;
  }
  
  // =============================================
  // UTILITY METHODS
  // =============================================
  
  formatTimeDisplay(time: string | null): string {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours ?? '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge badge-warning',
      late: 'badge badge-danger',
      absent: 'badge badge-dark',
      completed: 'badge badge-success',
      'on-time': 'badge badge-success'
    };
    return classes[status] || 'badge badge-secondary';
  }
  
  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      active: 'On Break',
      late: 'Late',
      absent: 'Absent',
      completed: 'Completed',
      'on-time': 'On Time'
    };
    return texts[status] || status;
  }
  
  downloadCSV(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default new AttendanceService();



























