import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Period {
    startDate: string;
    endDate: string;
    type?: string;
}

export interface MonthlySummaryParams {
    year: number;
    month: number;
    departmentId?: number;
    search?: string;
    page?: number;
    limit?: number;
}

export interface MonthlySummaryRecord {
    id: number;
    employee_id: number;
    employee_code: string;
    employee_name: string;
    department_name: string;
    year: number;
    month: number;
    month_name: string;
    total_working_days: number;
    days_present: number;
    days_absent: string;
    late_minutes: number;
    weekend_ot_hours: string;
    holiday_ot_hours: string;
    attendance_rate: string;
}

export interface MonthInfo {
    year: number;
    month: number;
    month_name: string;
    total_working_days: number;
}

export interface MonthlySummaryResponse {
    success: boolean;
    data: MonthlySummaryRecord[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    month_info: MonthInfo;
}

export interface ImportBatchesParams {
    page?: number;
    limit?: number;
}

export interface ImportBatch {
    id: number;
    file_name: string;
    file_path: string;
    import_date: string;
    period_start: string;
    period_end: string;
    period_type: string;
    total_rows: number;
    success_rows: number;
    error_rows: number;
    status: string;
    imported_by: number;
    started_at: string;
    completed_at: string;
}

export interface ImportErrorsParams {
    batchId?: number;
    resolved?: boolean;
    page?: number;
    limit?: number;
}

export interface ImportError {
    id: number;
    import_batch_id: number;
    row_number: number;
    employee_id: number;
    error_type: string;
    error_message: string;
    raw_data: any;
    is_resolved: boolean;
    created_at: string;
}

export interface ImportResult {
    success: boolean;
    message: string;
    data?: {
        batch_id: number;
        total: number;
        success: number;
        failed: number;
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

export interface UpdateAttendancePayload {
    late_minutes?: number;
    absence_days?: number;
    weekend_ot_minutes?: number;
    holiday_ot_minutes?: number;
}

class AttendanceService {
    // ============================================
    // ATTENDANCE IMPORT SYSTEM
    // ============================================

    /**
     * Import attendance file (CSV/Excel)
     */
    async importAttendanceFile(file: File, period: Period): Promise<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('period_start', period.startDate);
        formData.append('period_end', period.endDate);
        formData.append('period_type', period.type || 'custom');
        
        const response = await api.post('/attendance/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    /**
     * Get monthly summary (for main attendance view)
     */
    async getMonthlySummary(params: MonthlySummaryParams): Promise<MonthlySummaryResponse> {
        const queryParams = new URLSearchParams();
        
        queryParams.append('year', params.year.toString());
        queryParams.append('month', params.month.toString());
        
        if (params.departmentId) queryParams.append('department_id', params.departmentId.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        const response = await api.get(`/attendance/monthly-summary?${queryParams.toString()}`);
        return response.data;
    }

    /**
     * Get all import batches
     */
    async getImportBatches(params: ImportBatchesParams = {}): Promise<PaginatedResponse<ImportBatch>> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        const response = await api.get(`/attendance/imports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }

    /**
     * Get import batch details
     */
    async getImportBatchDetails(batchId: number): Promise<any> {
        const response = await api.get(`/attendance/imports/${batchId}`);
        return response.data;
    }

    /**
     * Get import errors
     */
    async getImportErrors(params: ImportErrorsParams = {}): Promise<PaginatedResponse<ImportError>> {
        const queryParams = new URLSearchParams();
        if (params.batchId) queryParams.append('batch_id', params.batchId.toString());
        if (params.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        const response = await api.get(`/attendance/errors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }

    /**
     * Resolve an import error
     */
    async resolveImportError(errorId: number, resolutionNotes: string): Promise<any> {
        const response = await api.put(`/attendance/errors/${errorId}/resolve`, {
            resolution_notes: resolutionNotes
        });
        return response.data;
    }

    /**
     * Delete an attendance record
     */
    async deleteAttendanceRecord(recordId: number): Promise<any> {
        const response = await api.delete(`/attendance/records/${recordId}`);
        return response.data;
    }

    /**
     * Update an attendance record (Edit)
     */
    async updateAttendanceRecord(recordId: number, data: UpdateAttendancePayload): Promise<any> {
        const response = await api.put(`/attendance/records/${recordId}`, data);
        return response.data;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString();
    }

    formatDateTime(dateStr: string | null): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString();
    }

    formatTime(minutes: number): string {
        if (!minutes) return '0h';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getAttendanceRateClass(rate: string | number): string {
        const numRate = parseFloat(String(rate));
        if (numRate >= 90) return 'rate-excellent';
        if (numRate >= 75) return 'rate-good';
        if (numRate >= 60) return 'rate-average';
        return 'rate-poor';
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            completed: 'status-success',
            processing: 'status-warning',
            failed: 'status-danger'
        };
        return classes[status] || 'status-info';
    }

    /**
     * Get current date in YYYY-MM-DD format
     */
  /**
 * Get current date in YYYY-MM-DD format
 */
getToday(): string {
    const date = new Date().toISOString().split('T')[0];
    return date || '';
}

/**
 * Get first day of current month
 */
getFirstDayOfMonth(): string {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    return firstDay || '';
}

/**
 * Get month name from month number
 */
getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
}
}

export default new AttendanceService();