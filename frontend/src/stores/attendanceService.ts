// services/attendanceService.ts
import api from "../stores/interceptor";

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
  shiftType: "day" | "night";
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
  breakType: "lunch" | "dinner";
  breakOutTime: string;
  expectedReturnTime: string;
  actualReturnTime: string | null;
  durationMinutes: number;
  status: "active" | "completed" | "late" | "absent";
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
  displayStatus: "active" | "late" | "absent" | "completed" | "on-time";
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
  shiftType: "day" | "night";
  dayType: "weekday" | "weekend" | "holiday";
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface FieldWorkAssignment {
  id: number;
  employeeId: number;
  employeeName?: string;
  departmentName?: string;
  assignmentType: "today" | "range" | "permanent";
  startDate: string;
  endDate: string | null;
  noOfficeCheckin: boolean;
  status: "active" | "completed" | "cancelled";
  location: string | null;
  notes: string | null;
  completedAt: string | null;
}

export interface Holiday {
  id: number;
  name: string;
  holidayDate: string;
  ethiopianDate: string | null;
  holidayType: "public" | "religious" | "company";
  overtimeRate: number;
  isRecurring: boolean;
  year: number | null;
}

// ✅ Update LateNightAdjustment interface to include departmentName
export interface LateNightAdjustment {
  id: number;
  employeeId: number;
  employeeName?: string;
  departmentName?: string; // ✅ Added departmentName
  workDate: string;
  workedUntilTime: string;
  adjustedCheckInTime: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface CompanyShiftDefault {
  id: number;
  shiftType: "day" | "night";
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
  shiftType: "day" | "night";
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
  shiftType: "day" | "night";
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
  shiftType: "day" | "night";
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

// Add to your interfaces section (around line 100)

export interface TodayStatus {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  isLate: boolean;
  lateMinutes: number;
  totalHours: number;
  overtimeMinutes: number;
  isFieldWork: boolean;
  isHoliday: boolean;
}

export interface TodaySchedule {
  checkInTime: string;
  checkOutTime: string;
  shiftType: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
}

export interface CurrentEmployee {
  employeeId: number;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  department?: string;
}

export interface AttendanceRecordWithDetails {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  departmentId: number | null;
  shiftType: "day" | "night";
  isWorkingDay: boolean;
  isHoliday: boolean;
  isFieldWork: boolean;
  isOnLeave: boolean;
  isHalfDay: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  effectiveCheckInTime: string | null;
  effectiveCheckOutTime: string | null;
  isLate: boolean;
  lateMinutes: number;
  isAbsent: boolean;
  totalHours: string;
  overtimeMinutes: number;
  overtimeRateApplied: number | null;
  checkInLocation: string | null;
  notes: string | null;
}

export interface PaginatedAttendanceResponse {
  success: boolean;
  data: AttendanceRecordWithDetails[];
  summary: {
    present: number;
    late: number;
    absent: number;
    total: number;
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
// =============================================
// ATTENDANCE SERVICE CLASS
// =============================================

class AttendanceService {
  // =============================================
  // 1. EFFECTIVE SCHEDULE
  // =============================================

  async getEffectiveSchedule(
    employeeId: number,
    date?: string,
  ): Promise<EffectiveSchedule> {
    const params = date ? `?date=${date}` : "";
    const response = await api.get(
      `/attendance/schedule/${employeeId}${params}`,
    );
    return response.data.data;
  }

  async getEffectiveWorkingHours(
    employeeId: number,
    date?: string,
  ): Promise<{
    employeeId: number;
    date: string;
    checkInTime: string;
    checkOutTime: string;
    totalHours: number;
    totalMinutes: number;
  }> {
    const params = date ? `?date=${date}` : "";
    const response = await api.get(
      `/attendance/working-hours/${employeeId}${params}`,
    );
    return response.data.data;
  }

  // =============================================
  // 2. COMPANY SHIFT DEFAULTS
  // =============================================

  async getCompanyDefaults(): Promise<CompanyShiftDefault[]> {
    const response = await api.get("/attendance/company-defaults");
    return response.data.data;
  }

  async getCompanyDefaultById(id: number): Promise<CompanyShiftDefault> {
    const response = await api.get(`/attendance/company-defaults/${id}`);
    return response.data.data;
  }

  async createCompanyDefault(
    data: Partial<CompanyShiftDefault>,
  ): Promise<CompanyShiftDefault> {
    const response = await api.post("/attendance/company-defaults", data);
    return response.data.data;
  }

  async updateCompanyDefault(
    id: number,
    data: Partial<CompanyShiftDefault>,
  ): Promise<CompanyShiftDefault> {
    const response = await api.put(`/attendance/company-defaults/${id}`, data);
    return response.data.data;
  }

  async deleteCompanyDefault(id: number): Promise<void> {
    await api.delete(`/attendance/company-defaults/${id}`);
  }

  // =============================================
  // 3. DEPARTMENT OVERRIDES
  // =============================================

  async getDepartmentOverrides(
    departmentId?: number,
    shiftType?: string,
  ): Promise<DepartmentOverride[]> {
    const params = new URLSearchParams();
    if (departmentId && departmentId.toString() !== "undefined") {
      params.append("departmentId", departmentId.toString());
    }
    if (shiftType && shiftType !== "undefined") {
      params.append("shiftType", shiftType);
    }
    const queryString = params.toString();
    const url = queryString
      ? `/attendance/department-overrides?${queryString}`
      : "/attendance/department-overrides";
    const response = await api.get(url);
    return response.data.data;
  }

  async getDepartmentOverrideById(id: number): Promise<DepartmentOverride> {
    const response = await api.get(`/attendance/department-overrides/${id}`);
    return response.data.data;
  }

  async createDepartmentOverride(
    data: Partial<DepartmentOverride>,
  ): Promise<DepartmentOverride> {
    const response = await api.post("/attendance/department-overrides", data);
    return response.data.data;
  }

  async updateDepartmentOverride(
    id: number,
    data: Partial<DepartmentOverride>,
  ): Promise<DepartmentOverride> {
    const response = await api.put(
      `/attendance/department-overrides/${id}`,
      data,
    );
    return response.data.data;
  }

  async deleteDepartmentOverride(id: number): Promise<void> {
    await api.delete(`/attendance/department-overrides/${id}`);
  }

  // =============================================
  // 4. EMPLOYEE OVERRIDES
  // =============================================

  async getEmployeeOverrides(
    employeeId?: number,
    shiftType?: string,
  ): Promise<EmployeeOverride[]> {
    const params = new URLSearchParams();
    if (employeeId && employeeId.toString() !== "undefined") {
      params.append("employeeId", employeeId.toString());
    }
    if (shiftType && shiftType !== "undefined") {
      params.append("shiftType", shiftType);
    }
    const queryString = params.toString();
    const url = queryString
      ? `/attendance/employee-overrides?${queryString}`
      : "/attendance/employee-overrides";
    const response = await api.get(url);
    return response.data.data;
  }

  async getEmployeeOverrideById(id: number): Promise<EmployeeOverride> {
    const response = await api.get(`/attendance/employee-overrides/${id}`);
    return response.data.data;
  }

  async createEmployeeOverride(
    data: Partial<EmployeeOverride>,
  ): Promise<EmployeeOverride> {
    const response = await api.post("/attendance/employee-overrides", data);
    return response.data.data;
  }

  async updateEmployeeOverride(
    id: number,
    data: Partial<EmployeeOverride>,
  ): Promise<EmployeeOverride> {
    const response = await api.put(
      `/attendance/employee-overrides/${id}`,
      data,
    );
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

    if (params?.employeeId)
      queryParams.append("employeeId", params.employeeId.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.statusFilter && params.statusFilter !== "all") {
      queryParams.append("statusFilter", params.statusFilter);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/attendance/lunch-history?${queryString}`
      : "/attendance/lunch-history";
    const response = await api.get(url);
    return response.data;
  }

  // =============================================
  // 5. BREAK TICKETS
  // =============================================

  async issueBreakTicket(
    employeeId: number,
    breakType: "lunch" | "dinner",
    reason?: string,
  ): Promise<BreakTicket> {
    const response = await api.post("/attendance/breaks/issue", {
      employeeId,
      breakType,
      reason,
    });
    return response.data.data;
  }

  async returnFromBreak(ticketId: number): Promise<BreakTicket> {
    const response = await api.put(`/attendance/breaks/${ticketId}/return`);
    return response.data.data;
  }

  async getActiveBreaks(employeeId?: number): Promise<BreakTicket[]> {
    const params = employeeId ? `?employeeId=${employeeId}` : "";
    const response = await api.get(`/attendance/breaks/active${params}`);
    // Ensure department field is consistent
    const breaks = response.data.data || [];
    return breaks.map((b: any) => ({
      ...b,
      department: b.department || b.Department?.name || "N/A",
    }));
  }

  async getBreakHistory(
    employeeId: number,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<PaginatedResponse<BreakTicket>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    const response = await api.get(
      `/attendance/breaks/history/${employeeId}?${params.toString()}`,
    );
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

    if (params?.employeeId)
      queryParams.append("employeeId", params.employeeId.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.statusFilter && params.statusFilter !== "all") {
      queryParams.append("statusFilter", params.statusFilter);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/attendance/dinner-history?${queryString}`
      : "/attendance/dinner-history";
    const response = await api.get(url);
    return response.data;
  }
  // =============================================
  // 6. ATTENDANCE LOGS
  // =============================================

  async recordCheckIn(
    employeeId: number,
    checkInTime?: Date,
    location?: { latitude: number; longitude: number },
  ): Promise<AttendanceLog> {
    const payload: any = {};
    if (checkInTime) payload.checkInTime = checkInTime.toISOString();
    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
    }
    const response = await api.post(
      `/attendance/${employeeId}/check-in`,
      payload,
    );
    return response.data.data;
  }

  async recordCheckOut(
    employeeId: number,
    checkOutTime?: Date,
  ): Promise<{ attendance: AttendanceLog; overtime: OvertimeResult }> {
    const payload: any = {};
    if (checkOutTime) payload.checkOutTime = checkOutTime.toISOString();
    const response = await api.put(
      `/attendance/${employeeId}/check-out`,
      payload,
    );
    return {
      attendance: response.data.data,
      overtime: response.data.overtime,
    };
  }

  async getAttendanceReport(
    employeeId: number,
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<AttendanceReportResponse> {
    const response = await api.get(`/attendance/${employeeId}/report`, {
      params: { startDate, endDate, page, limit },
    });
    return response.data;
  }

  async getMyAttendance(
    startDate: string,
    endDate: string,
  ): Promise<MyAttendanceResponse> {
    const response = await api.get("/attendance/me/report", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getAttendanceSummary(
    employeeId: number,
    year?: number,
    month?: number,
  ): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    if (month) params.append("month", month.toString());
    const response = await api.get(
      `/attendance/summary/${employeeId}?${params.toString()}`,
    );
    return response.data.data;
  }

  // =============================================
  // 6. ATTENDANCE LOGS (Add these missing methods)
  // =============================================

  async getAllTodayAttendance(
    date: string,
    filters?: {
      search?: string;
      status?: string;
      departmentId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedAttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append("date", date);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.departmentId)
        params.append("departmentId", filters.departmentId);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(`/attendance/all?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all attendance:", error);
      return {
        success: true,
        data: [],
        summary: { present: 0, late: 0, absent: 0, total: 0 },
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }
  }

  async getTodayAttendance(employeeId: number): Promise<AttendanceLog | null> {
    try {
      const response = await api.get(`/attendance/${employeeId}/today`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      return null;
    }
  }

  async getCompanyShiftDefaultsByType(
    shiftType: "day" | "night",
  ): Promise<CompanyShiftDefault | null> {
    try {
      const response = await api.get(
        `/attendance/company-defaults/${shiftType}`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching company shift defaults:", error);
      return null;
    }
  }

  async getTodayStats(date?: string): Promise<{
    present: number;
    late: number;
    absent: number;
    total: number;
  }> {
    try {
      const today = date || new Date().toISOString().split("T")[0];
      const response = await api.get(`/attendance/stats/today?date=${today}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching today stats:", error);
      return { present: 0, late: 0, absent: 0, total: 0 };
    }
  }

  async getTodayStatus(employeeId: number): Promise<{
    isCheckedIn: boolean;
    isCheckedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    isLate: boolean;
    lateMinutes: number;
    totalHours: number;
    overtimeMinutes: number;
    isFieldWork: boolean;
    isHoliday: boolean;
    shiftType?: "day" | "night";
    isWorkingDay?: boolean;
    effectiveCheckInTime?: string | null;
    effectiveCheckOutTime?: string | null;
  }> {
    try {
      const response = await api.get(`/attendance/${employeeId}/status`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      return {
        isCheckedIn: false,
        isCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        isLate: false,
        lateMinutes: 0,
        totalHours: 0,
        overtimeMinutes: 0,
        isFieldWork: false,
        isHoliday: false,
        shiftType: "day",
        isWorkingDay: true,
        effectiveCheckInTime: null,
        effectiveCheckOutTime: null,
      };
    }
  }

  // Add this method to get current employee info (you may need to adjust the endpoint)
  async getCurrentEmployee(): Promise<{
    employeeId: number;
    firstName: string;
    lastName: string;
    role: string;
  } | null> {
    try {
      const response = await api.get("/users/me");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching current employee:", error);
      return null;
    }
  }

  // Add this method to get attendance by date range with better filtering
  async getAttendanceByDateRange(
    employeeId: number,
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<AttendanceReportResponse> {
    const response = await api.get(`/attendance/${employeeId}/report`, {
      params: { startDate, endDate, page, limit },
    });
    return response.data;
  }

  // Add this method to check if employee is on field work today
  async isOnFieldWorkToday(employeeId: number): Promise<boolean> {
    try {
      const response = await api.get(
        `/attendance/field-work/${employeeId}/active`,
      );
      return !!response.data.data;
    } catch (error) {
      console.error("Error checking field work:", error);
      return false;
    }
  }

  // Add this method to get today's schedule with effective times
  async getTodaySchedule(employeeId: number): Promise<{
    checkInTime: string;
    checkOutTime: string;
    shiftType: string;
    isWorkingDay: boolean;
    isHoliday: boolean;
  } | null> {
    try {
      const [schedule, workingDay, holiday] = await Promise.all([
        this.getEffectiveSchedule(employeeId),
        this.checkWorkingDay(
          employeeId,
          new Date().toISOString().split("T")[0]!,
        ),
        this.checkHoliday(new Date().toISOString().split("T")[0]!),
      ]);

      return {
        checkInTime: schedule.checkInTime,
        checkOutTime: schedule.checkOutTime,
        shiftType: schedule.shiftType,
        isWorkingDay: workingDay.isWorkingDay,
        isHoliday: holiday.isHoliday,
      };
    } catch (error) {
      console.error("Error getting today's schedule:", error);
      return null;
    }
  }

  // =============================================
  // 7. OVERTIME
  // =============================================

  async calculateOvertime(
    employeeId: number,
    date?: string,
  ): Promise<OvertimeResult> {
    const params = date ? `?date=${date}` : "";
    const response = await api.get(
      `/attendance/overtime/${employeeId}/calculate${params}`,
    );
    return response.data.data;
  }

  async getOvertimeRates(): Promise<OvertimeRate[]> {
    const response = await api.get("/attendance/overtime/rates");
    return response.data.data;
  }

  async createOvertimeRate(data: Partial<OvertimeRate>): Promise<OvertimeRate> {
    const response = await api.post("/attendance/overtime/rates", data);
    return response.data.data;
  }

  async updateOvertimeRate(
    id: number,
    data: Partial<OvertimeRate>,
  ): Promise<OvertimeRate> {
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
    assignmentType: "today" | "range" | "permanent",
    startDate: string,
    endDate?: string,
    location?: string,
    notes?: string,
  ): Promise<FieldWorkAssignment> {
    const response = await api.post("/attendance/field-work", {
      employeeId,
      assignmentType,
      startDate,
      endDate,
      location,
      notes,
    });
    return response.data.data;
  }

  async completeFieldWork(assignmentId: number): Promise<FieldWorkAssignment> {
    const response = await api.put(
      `/attendance/field-work/${assignmentId}/complete`,
    );
    return response.data.data;
  }

  async getActiveFieldWork(
    employeeId: number,
  ): Promise<FieldWorkAssignment | null> {
    const response = await api.get(
      `/attendance/field-work/${employeeId}/active`,
    );
    return response.data.data;
  }

  async getAllFieldWork(): Promise<FieldWorkAssignment[]> {
    const response = await api.get("/attendance/field-work/all");
    return response.data.data;
  }

  async updateFieldWork(
    id: number,
    data: Partial<FieldWorkAssignment>,
  ): Promise<FieldWorkAssignment> {
    const response = await api.put(`/attendance/field-work/${id}`, data);
    return response.data.data;
  }

  async deleteFieldWork(id: number): Promise<void> {
    await api.delete(`/attendance/field-work/${id}`);
  }

  async getFieldWorkHistory(
    employeeId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<FieldWorkAssignment>> {
    const params = `?page=${page}&limit=${limit}`;
    const response = await api.get(
      `/attendance/field-work/history/${employeeId}${params}`,
    );
    return response.data;
  }

  // =============================================
  // 9. HOLIDAYS
  // =============================================

  async getHolidays(year?: number): Promise<Holiday[]> {
    const params = year ? `?year=${year}` : "";
    const response = await api.get(`/attendance/holidays${params}`);
    return response.data.data;
  }

  async checkHoliday(
    date: string,
  ): Promise<{
    isHoliday: boolean;
    overtimeRate: number;
    holidayName?: string;
  }> {
    const response = await api.get("/attendance/holidays/check", {
      params: { date },
    });
    return response.data;
  }

  async createHoliday(data: Partial<Holiday>): Promise<Holiday> {
    const response = await api.post("/attendance/holidays", data);
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
    reason?: string,
  ): Promise<LateNightAdjustment> {
    const response = await api.post("/attendance/late-night-adjustments", {
      employeeId,
      workDate,
      workedUntilTime,
      adjustedCheckInTime,
      reason,
    });
    return response.data.data;
  }

  // In attendanceService.ts

  async getAllLateNightAdjustments(): Promise<LateNightAdjustment[]> {
    try {
      const response = await api.get("/attendance/late-night-adjustments/all");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching late night adjustments:", error);
      return [];
    }
  }

  async getLateNightAdjustments(
    employeeId?: number,
  ): Promise<LateNightAdjustment[]> {
    try {
      if (!employeeId || employeeId.toString() === "undefined") {
        // This will hit the /all endpoint if no employeeId provided
        return await this.getAllLateNightAdjustments();
      }
      const response = await api.get(
        `/attendance/late-night-adjustments/${employeeId}`,
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching late night adjustments:", error);
      return [];
    }
  }

  async updateLateNightAdjustment(
    adjustmentId: number,
    data: Partial<LateNightAdjustment>,
  ): Promise<LateNightAdjustment> {
    const response = await api.put(
      `/attendance/late-night-adjustments/${adjustmentId}`,
      data,
    );
    return response.data.data;
  }

  async deleteLateNightAdjustment(adjustmentId: number): Promise<void> {
    await api.delete(`/attendance/late-night-adjustments/${adjustmentId}`);
  }

  // =============================================
  // 11. WORKING DAYS
  // =============================================

  async checkWorkingDay(
    employeeId: number,
    date: string,
  ): Promise<{
    isWorkingDay: boolean;
    dayOfWeek?: string;
    shiftType?: string;
  }> {
    const response = await api.get(
      `/attendance/working-days/${employeeId}/check`,
      { params: { date } },
    );
    return response.data;
  }

  async getWorkingDaysConfig(): Promise<WorkingDaysConfig[]> {
    const response = await api.get("/attendance/working-days-config");
    return response.data.data;
  }

  async updateWorkingDaysConfig(
    id: number,
    data: Partial<WorkingDaysConfig>,
  ): Promise<WorkingDaysConfig> {
    const response = await api.put(
      `/attendance/working-days-config/${id}`,
      data,
    );
    return response.data.data;
  }

  // =============================================
  // 12. ADMIN DASHBOARD & STATISTICS
  // =============================================

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get("/attendance/admin/dashboard/stats");
    return response.data.data;
  }

  async getAdminAttendanceSummary(
    startDate: string,
    endDate: string,
    departmentId?: string,
  ): Promise<{
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
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    if (departmentId) params.append("departmentId", departmentId);
    const response = await api.get(
      `/attendance/admin/attendance/summary?${params.toString()}`,
    );
    return response.data.data;
  }

  async exportAttendanceReport(
    startDate: string,
    endDate: string,
    departmentId?: string,
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    if (departmentId) params.append("departmentId", departmentId);
    const response = await api.get(
      `/attendance/admin/attendance/export?${params.toString()}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  }

  // =============================================
  // 13. BULK OPERATIONS
  // =============================================

  async completeAllExpiredBreaks(): Promise<{ completedCount: number }> {
    const response = await api.post("/attendance/bulk/breaks/complete");
    return response.data.data;
  }

  async processDailyAttendance(
    date?: string,
  ): Promise<{ processed: number; created: number }> {
    const response = await api.post("/attendance/bulk/attendance/process", {
      date,
    });
    return response.data.data;
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  formatTimeDisplay(time: string | null): string {
    if (!time) return "—";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours ?? "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: "badge badge-warning",
      late: "badge badge-danger",
      absent: "badge badge-dark",
      completed: "badge badge-success",
      "on-time": "badge badge-success",
    };
    return classes[status] || "badge badge-secondary";
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      active: "On Break",
      late: "Late",
      absent: "Absent",
      completed: "Completed",
      "on-time": "On Time",
    };
    return texts[status] || status;
  }

  downloadCSV(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // attendanceService.ts - Fix the two methods at the bottom

  // Fetch expired pending late records
  async getExpiredPendingLate() {
    try {
      const response = await api.get("/attendance/expired-pending-late");
      return response.data;
    } catch (error) {
      console.error("Get expired pending late error:", error);
      throw error;
    }
  }

  // Mark expired records as absent (POST request)
  async markExpiredAsAbsent(recordIds: number[]) {
    try {
      const response = await api.post("/attendance/mark-expired-as-absent", {
        recordIds,
      });
      return response.data;
    } catch (error) {
      console.error("Mark expired as absent error:", error);
      throw error;
    }
  }

  // =============================================
  // 14. PENDING ATTENDANCE REVIEW (MASS ACTIONS)
  // =============================================

  async getPendingAbsentees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.departmentId)
        queryParams.append("departmentId", params.departmentId);
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `/attendance/pending-absentees${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log("Fetching pending absentees from:", url);

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching pending absentees:", error);
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        filters: {},
      };
    }
  }

  /**
   * Mass update attendance for multiple employees
   * @param employeeIds - Array of employee IDs
   * @param action - 'absent', 'allow_late', 'leave', 'sick'
   * @param allowUntilTime - Optional time for 'allow_late' action
   */
  async massUpdateAttendance(
    employeeIds: number[],
    action: "absent" | "allow_late" | "leave" | "sick",
    allowUntilTime?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      employeeId: number;
      success: boolean;
      action: string;
      note: string;
    }>;
  }> {
    try {
      const payload: any = {
        employeeIds: employeeIds,
        action: action,
      };

      if (action === "allow_late" && allowUntilTime) {
        payload.allowUntilTime = allowUntilTime;
      }

      const response = await api.post("/attendance/mass-update", payload);
      return response.data;
    } catch (error) {
      console.error("Error in mass update:", error);
      return {
        success: false,
        message: "Failed to update attendance",
        data: [],
      };
    }
  }

  // Add this method to attendanceService.ts

  async revertAttendanceUpdate(
    employeeIds: number[],
    action: string,
  ): Promise<any> {
    try {
      const response = await api.post("/attendance/revert-update", {
        employeeIds: employeeIds,
        action: action,
      });
      return response.data;
    } catch (error) {
      console.error("Error reverting attendance update:", error);
      return {
        success: false,
        message: "Failed to revert",
      };
    }
  }











































  // =============================================
// IMPORT ATTENDANCE METHODS
// =============================================

/**
 * Import attendance from machine export file
 * @param file - The CSV/Excel file to import
 * @param importType - 'daily', 'weekly', 'monthly'
 * @returns Import results
 */
async importAttendanceFile(file: File, importType: string = 'daily'): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('import_type', importType);
        
        const response = await api.post('/attendance/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Import attendance error:', error);
        throw error;
    }
}

/**
 * Get import status by batch ID
 * @param batchId - The import batch ID
 * @returns Import status
 */
async getImportStatus(batchId: number): Promise<any> {
    try {
        const response = await api.get(`/import/status/${batchId}`);
        return response.data;
    } catch (error) {
        console.error('Get import status error:', error);
        throw error;
    }
}

/**
 * Reprocess failed rows from an import batch
 * @param batchId - The import batch ID
 * @returns Reprocess results
 */
async reprocessFailedRows(batchId: number): Promise<any> {
    try {
        const response = await api.post(`/import/reprocess/${batchId}`);
        return response.data;
    } catch (error) {
        console.error('Reprocess failed rows error:', error);
        throw error;
    }
}

/**
 * Get daily attendance records
 * @param params - Query parameters (startDate, endDate, employeeId)
 * @returns Daily attendance records
 */
async getDailyAttendance(params: { 
    startDate?: string; 
    endDate?: string; 
    employeeId?: number;
    search?: string;
    departmentId?: number | null;
    status?: string;
    page?: number;
    limit?: number;
} = {}): Promise<any> {
    try {
        const queryParams = new URLSearchParams();
        
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString());
        if (params.search) queryParams.append('search', params.search);
        
        // Only append if departmentId is a valid number
        if (params.departmentId !== null && params.departmentId !== undefined && params.departmentId > 0) {
            queryParams.append('departmentId', params.departmentId.toString());
            console.log('Service sending departmentId:', params.departmentId);
        }
        
        if (params.status && params.status !== '') {
            queryParams.append('status', params.status);
        }
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        const url = `/attendance/import/daily-attendance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log('Final URL:', url);
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Get daily attendance error:', error);
        throw error;
    }
}

/**
 * Get weekly attendance summary
 * @param params - Query parameters (startDate, endDate, employeeId, departmentId, search, page, limit)
 * @returns Weekly summary with pagination
 */
async getWeeklyAttendance(params: { 
    startDate?: string; 
    endDate?: string; 
    employeeId?: number;
    departmentId?: number | null;
    search?: string;
    page?: number;
    limit?: number;
} = {}): Promise<any> {
    try {
        const queryParams = new URLSearchParams();
        
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString());
        if (params.search) queryParams.append('search', params.search);
        
        // Only append departmentId if it's a valid number
        if (params.departmentId !== null && params.departmentId !== undefined && params.departmentId > 0) {
            queryParams.append('departmentId', params.departmentId.toString());
        }
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        const url = `/attendance/import/weekly-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log('Weekly summary URL:', url);
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Get weekly attendance error:', error);
        throw error;
    }
}

/**
 * Get monthly attendance summary
 * @param params - Query parameters (year, month, employeeId, departmentId, search, page, limit)
 * @returns Monthly summary with pagination
 */
async getMonthlyAttendance(params: { 
    year?: number; 
    month?: number; 
    employeeId?: number;
    departmentId?: number | null;
    search?: string;
    page?: number;
    limit?: number;
} = {}): Promise<any> {
    try {
        const queryParams = new URLSearchParams();
        
        if (params.year) queryParams.append('year', params.year.toString());
        if (params.month) queryParams.append('month', params.month.toString());
        if (params.employeeId) queryParams.append('employeeId', params.employeeId.toString());
        if (params.search) queryParams.append('search', params.search);
        
        // Only append departmentId if it's a valid number
        if (params.departmentId !== null && params.departmentId !== undefined && params.departmentId > 0) {
            queryParams.append('departmentId', params.departmentId.toString());
        }
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        const url = `/attendance/import/monthly-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log('Monthly summary URL:', url);
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Get monthly attendance error:', error);
        throw error;
    }
}

/**
 * Get employee weekly summary (single employee)
 * @param employeeId - Employee ID
 * @param year - Year
 * @returns Weekly summary for employee
 */
async getEmployeeWeeklySummary(employeeId: number, year: number): Promise<any> {
    try {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        const response = await this.getWeeklyAttendance({
            employeeId,
            startDate,
            endDate,
            limit: 100 // Get all weeks for the year
        });
        
        return response;
    } catch (error) {
        console.error('Get employee weekly summary error:', error);
        throw error;
    }
}

/**
 * Get employee monthly summary (single employee)
 * @param employeeId - Employee ID
 * @param year - Year
 * @returns Monthly summary for employee
 */
async getEmployeeMonthlySummary(employeeId: number, year: number): Promise<any> {
    try {
        const response = await this.getMonthlyAttendance({
            employeeId,
            year,
            limit: 12 // Get all months of the year
        });
        
        return response;
    } catch (error) {
        console.error('Get employee monthly summary error:', error);
        throw error;
    }
}

/**
 * Get department summary
 * @param params - Query parameters (startDate, endDate, departmentId)
 * @returns Department summary statistics
 */
async getDepartmentSummary(params: {
    startDate: string;
    endDate: string;
    departmentId: number;
}): Promise<any> {
    try {
        const response = await this.getWeeklyAttendance({
            startDate: params.startDate,
            endDate: params.endDate,
            departmentId: params.departmentId,
            limit: 1000
        });
        
        const records = response.data || [];
        
        // Calculate department totals
        const departmentSummary = {
            department_id: params.departmentId,
            total_employees: records.length,
            total_hours: records.reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0),
            total_late_minutes: records.reduce((sum: number, r: any) => sum + (r.total_late_minutes || 0), 0),
            avg_attendance_rate: records.length > 0 
                ? (records.reduce((sum: number, r: any) => sum + parseFloat(r.attendance_rate || 0), 0) / records.length).toFixed(1)
                : 0,
            total_present_days: records.reduce((sum: number, r: any) => sum + (r.days_present || 0), 0),
            total_absent_days: records.reduce((sum: number, r: any) => sum + (r.absent_days || 0), 0)
        };
        
        return departmentSummary;
    } catch (error) {
        console.error('Get department summary error:', error);
        throw error;
    }
}

/**
 * Get yearly summary
 * @param year - Year
 * @param departmentId - Optional department ID filter
 * @returns Yearly summary statistics
 */
async getYearlySummary(year: number, departmentId?: number | null): Promise<any> {
    try {
        const response = await this.getMonthlyAttendance({
            year,
            departmentId,
            limit: 100
        });
        
        const records = response.data || [];
        
        // Calculate yearly totals
        const yearlySummary = {
            year,
            total_employees: records.length,
            total_hours: records.reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0),
            total_late_minutes: records.reduce((sum: number, r: any) => sum + (r.total_late_minutes || 0), 0),
            avg_attendance_rate: records.length > 0
                ? (records.reduce((sum: number, r: any) => sum + parseFloat(r.attendance_rate || 0), 0) / records.length).toFixed(1)
                : 0,
            total_present_days: records.reduce((sum: number, r: any) => sum + (r.days_present || 0), 0),
            total_absent_days: records.reduce((sum: number, r: any) => sum + (r.absent_days || 0), 0),
            best_month: records.reduce((best: any, current: any) => 
                parseFloat(current.attendance_rate || 0) > parseFloat(best?.attendance_rate || 0) ? current : best, null
            ),
            worst_month: records.reduce((worst: any, current: any) => 
                parseFloat(current.attendance_rate || 0) < parseFloat(worst?.attendance_rate || 100) ? current : worst, null
            )
        };
        
        return yearlySummary;
    } catch (error) {
        console.error('Get yearly summary error:', error);
        throw error;
    }
}

/**
 * Download import template
 * @returns Template file blob
 */
async downloadImportTemplate(): Promise<Blob> {
    try {
        const response = await api.get('/import/template', {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Download template error:', error);
        throw error;
    }
}

/**
 * Check if there's already an import today
 * @returns Today's import status
 */
async checkTodayImport(): Promise<any> {
    try {
        const response = await api.get('/attendance/check-today-import');
        return response.data;
    } catch (error) {
        console.error('Check today import error:', error);
        return { has_import: false };
    }
}

/**
 * Export attendance data to CSV/Excel
 * @param params - Export parameters
 * @returns Blob for download
 */
async exportAttendance(params: {
    startDate: string;
    endDate: string;
    departmentId?: number | null;
    format?: 'csv' | 'excel';
}): Promise<Blob> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', params.startDate);
        queryParams.append('endDate', params.endDate);
        queryParams.append('format', params.format || 'csv');
        
        if (params.departmentId && params.departmentId > 0) {
            queryParams.append('departmentId', params.departmentId.toString());
        }
        
        const response = await api.get(`/attendance/export?${queryParams.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Export attendance error:', error);
        throw error;
    }
}

}


























export default new AttendanceService();
