import api from "./interceptor";
class AttendanceService {
    // ============================================
    // ATTENDANCE IMPORT SYSTEM
    // ============================================
    /**
     * Import attendance file (CSV/Excel)
     */
    async importAttendanceFile(file, period) {
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
    async getMonthlySummary(params) {
        const queryParams = new URLSearchParams();
        queryParams.append('year', params.year.toString());
        queryParams.append('month', params.month.toString());
        if (params.departmentId)
            queryParams.append('department_id', params.departmentId.toString());
        if (params.search)
            queryParams.append('search', params.search);
        if (params.page)
            queryParams.append('page', params.page.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        const response = await api.get(`/attendance/monthly-summary?${queryParams.toString()}`);
        return response.data;
    }
    /**
     * Get all import batches
     */
    async getImportBatches(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.page)
            queryParams.append('page', params.page.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        const response = await api.get(`/attendance/imports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }
    /**
     * Get import batch details
     */
    async getImportBatchDetails(batchId) {
        const response = await api.get(`/attendance/imports/${batchId}`);
        return response.data;
    }
    /**
     * Get import errors
     */
    async getImportErrors(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.batchId)
            queryParams.append('batch_id', params.batchId.toString());
        if (params.resolved !== undefined)
            queryParams.append('resolved', params.resolved.toString());
        if (params.page)
            queryParams.append('page', params.page.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        const response = await api.get(`/attendance/errors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }
    /**
     * Resolve an import error
     */
    async resolveImportError(errorId, resolutionNotes) {
        const response = await api.put(`/attendance/errors/${errorId}/resolve`, {
            resolution_notes: resolutionNotes
        });
        return response.data;
    }
    /**
     * Delete an attendance record
     */
    async deleteAttendanceRecord(recordId) {
        const response = await api.delete(`/attendance/records/${recordId}`);
        return response.data;
    }
    /**
     * Update an attendance record (Edit)
     */
    async updateAttendanceRecord(recordId, data) {
        const response = await api.put(`/attendance/records/${recordId}`, data);
        return response.data;
    }
    // ============================================
    // UTILITY METHODS
    // ============================================
    formatDate(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleDateString();
    }
    formatDateTime(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleString();
    }
    formatTime(minutes) {
        if (!minutes)
            return '0h';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
    formatFileSize(bytes) {
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    getAttendanceRateClass(rate) {
        const numRate = parseFloat(String(rate));
        if (numRate >= 90)
            return 'rate-excellent';
        if (numRate >= 75)
            return 'rate-good';
        if (numRate >= 60)
            return 'rate-average';
        return 'rate-poor';
    }
    getStatusClass(status) {
        const classes = {
            completed: 'status-success',
            processing: 'status-warning',
            failed: 'status-danger'
        };
        return classes[status] || 'status-info';
    }
    /**
     * Get current date in YYYY-MM-DD format
     */
    getToday() {
        const date = new Date().toISOString().split('T')[0];
        return date || '';
    }
    /**
     * Get first day of current month
     */
    getFirstDayOfMonth() {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        return firstDay || '';
    }
    /**
     * Get month name from month number
     */
    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1] || '';
    }
}
export default new AttendanceService();
