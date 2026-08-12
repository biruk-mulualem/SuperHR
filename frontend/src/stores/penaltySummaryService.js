import api from './interceptor';
// ==================== SERVICE CLASS ====================
class PenaltySummaryService {
    // ==================== PENALTY SUMMARY ====================
    async getPenaltySummary(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.fromDate)
                queryParams.append('fromDate', params.fromDate);
            if (params.toDate)
                queryParams.append('toDate', params.toDate);
            if (params.department && params.department !== 'all')
                queryParams.append('department', params.department);
            if (params.search)
                queryParams.append('search', params.search);
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            const response = await api.get(`/penalty-summary/summary?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
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
    async applyPenaltyReduction(employeeId, data) {
        try {
            if (!employeeId || isNaN(employeeId)) {
                return { success: false, error: 'Invalid employee ID' };
            }
            const response = await api.post(`/penalty-summary/reduce/employee/${employeeId}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Apply penalty reduction error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to apply reduction'
            };
        }
    }
    // ==================== REDUCTION HISTORY ====================
    async getReductionHistory(employeeId, params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.fromDate)
                queryParams.append('fromDate', params.fromDate);
            if (params?.toDate)
                queryParams.append('toDate', params.toDate);
            const response = await api.get(`/penalty-summary/reductions/${employeeId}?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get reduction history error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch reduction history'
            };
        }
    }
    // ==================== UPDATE REDUCTION ====================
    async updateReduction(employeeId, reductionId, data) {
        try {
            const response = await api.put(`/penalty-summary/reduction/${employeeId}/${reductionId}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update reduction error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update reduction'
            };
        }
    }
    // ==================== DELETE REDUCTION ====================
    async deleteReduction(employeeId, reductionId) {
        try {
            const response = await api.delete(`/penalty-summary/reduction/${employeeId}/${reductionId}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete reduction error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete reduction'
            };
        }
    }
    // ==================== EMPLOYEE PENALTY SUMMARY ====================
    async getEmployeePenaltySummary(employeeId) {
        try {
            const response = await api.get(`/penalty-summary/employees/${employeeId}/summary`);
            return response.data;
        }
        catch (error) {
            console.error('Get employee penalty summary error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch employee penalty summary'
            };
        }
    }
    // ==================== EXPORT ====================
    async exportPenaltySummary(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.fromDate)
                queryParams.append('fromDate', params.fromDate);
            if (params.toDate)
                queryParams.append('toDate', params.toDate);
            if (params.department)
                queryParams.append('department', params.department);
            if (params.format)
                queryParams.append('format', params.format);
            const response = await api.get(`/penalty-summary/export?${queryParams.toString()}`, {
                responseType: 'blob'
            });
            return response.data;
        }
        catch (error) {
            console.error('Export penalty summary error:', error);
            return null;
        }
    }
    // ==================== BATCH REDUCTION (DEPRECATED - kept for compatibility) ====================
    async applyBatchPenaltyReduction(data) {
        try {
            const response = await api.post('/penalty-summary/batch-reduce', data);
            return response.data;
        }
        catch (error) {
            console.error('Apply batch penalty reduction error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to apply batch reduction'
            };
        }
    }
    // ==================== DEDUCTION REPORTS (DEPRECATED) ====================
    async getDeductionReport(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.fromDate)
                queryParams.append('fromDate', params.fromDate);
            if (params.toDate)
                queryParams.append('toDate', params.toDate);
            if (params.department)
                queryParams.append('department', params.department);
            if (params.employeeId)
                queryParams.append('employeeId', params.employeeId.toString());
            const response = await api.get(`/penalty-summary/deductions?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get deduction report error:', error);
            return { success: false, data: [], count: 0 };
        }
    }
    async getEmployeeDeductions(employeeId, params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.fromDate)
                queryParams.append('fromDate', params.fromDate);
            if (params?.toDate)
                queryParams.append('toDate', params.toDate);
            const response = await api.get(`/penalty-summary/employees/${employeeId}/deductions?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get employee deductions error:', error);
            return { success: false, data: [] };
        }
    }
    // ==================== RULES MANAGEMENT (DEPRECATED) ====================
    async getReductionRules() {
        try {
            const response = await api.get('/penalty-summary/rules');
            return response.data;
        }
        catch (error) {
            console.error('Get reduction rules error:', error);
            return { success: false, data: {} };
        }
    }
    async saveReductionRules(rules) {
        try {
            const response = await api.post('/penalty-summary/rules', { rules });
            return response.data;
        }
        catch (error) {
            console.error('Save reduction rules error:', error);
            return { success: false };
        }
    }
    // ==================== STATISTICS (DEPRECATED) ====================
    async getPenaltyStatistics(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.year)
                queryParams.append('year', params.year.toString());
            if (params.month)
                queryParams.append('month', params.month.toString());
            const response = await api.get(`/penalty-summary/statistics?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('Get penalty statistics error:', error);
            return { success: false, data: {} };
        }
    }
    async createPenaltySummary(data) {
        try {
            const response = await api.post('/penalty-summary/summary', data);
            return response.data;
        }
        catch (error) {
            console.error('Create penalty summary error:', error);
            return { success: false, error: error.response?.data?.error };
        }
    }
    async getPenaltySummaryById(summaryId) {
        try {
            const response = await api.get(`/penalty-summary/summary/${summaryId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get penalty summary by ID error:', error);
            return { success: false, error: error.response?.data?.error };
        }
    }
    // ==================== HELPER METHODS ====================
    formatPeriodLabel(startDate, endDate) {
        if (!startDate || !endDate)
            return 'Custom Range';
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        if (isNaN(start.getTime()) || isNaN(end.getTime()))
            return 'Invalid Date Range';
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
        const quarters = [[0, 2], [3, 5], [6, 8], [9, 11]];
        const startQuarterIndex = quarters.findIndex(([min, max]) => start.getMonth() >= min && start.getMonth() <= max);
        const endQuarterIndex = quarters.findIndex(([min, max]) => end.getMonth() >= min && end.getMonth() <= max);
        if (startQuarterIndex !== -1 && endQuarterIndex !== -1 && startQuarterIndex === endQuarterIndex && startDay === 1 && endDay === lastDayOfEndMonth) {
            return `Q${startQuarterIndex + 1} ${start.getFullYear()}`;
        }
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    getPenaltyTypeLabel(type) {
        const labels = { 'asset': 'Asset Penalty', 'other': 'Other Penalty', 'percent': 'Percent Penalty' };
        return labels[type] || type;
    }
    getStatusLabel(status) {
        const labels = { 'active': 'Active', 'partially_deducted': 'Partially Deducted', 'fully_deducted': 'Fully Deducted', 'cancelled': 'Cancelled' };
        return labels[status] || status;
    }
    getStatusColor(status) {
        const colors = { 'active': 'warning', 'partially_deducted': 'info', 'fully_deducted': 'success', 'cancelled': 'error' };
        return colors[status] || 'default';
    }
    formatDateForApi(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0] ?? '';
    }
    getMonthRange(year, month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        return { startDate: this.formatDateForApi(start), endDate: this.formatDateForApi(end) };
    }
    getCurrentMonthRange() {
        const now = new Date();
        return this.getMonthRange(now.getFullYear(), now.getMonth() + 1);
    }
    getPreviousMonthRange() {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return this.getMonthRange(prevMonth.getFullYear(), prevMonth.getMonth() + 1);
    }
}
export default new PenaltySummaryService();
