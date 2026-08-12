// stores/leave.ts
import api from './interceptor';
// ============================================================================
// LEAVE SERVICE
// ============================================================================
class LeaveService {
    // ============================================================================
    // LEAVE REQUESTS CRUD
    // ============================================================================
    /**
     * Get all leave requests with pagination and filters
     */
    async getLeaveRequests(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.status)
                queryParams.append('status', params.status);
            if (params.departmentId && params.departmentId !== 'all')
                queryParams.append('departmentId', params.departmentId.toString());
            if (params.leaveTypeId && params.leaveTypeId !== 'all')
                queryParams.append('leaveTypeId', params.leaveTypeId.toString());
            if (params.employeeId)
                queryParams.append('employeeId', params.employeeId.toString());
            if (params.startDate)
                queryParams.append('startDate', params.startDate);
            if (params.endDate)
                queryParams.append('endDate', params.endDate);
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.search)
                queryParams.append('search', params.search);
            const url = `/leaves${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await api.get(url);
            return {
                success: true,
                data: response.data.data || [],
                pagination: response.data.pagination || {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            };
        }
        catch (error) {
            console.error('Get leave requests error:', error);
            return {
                success: false,
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            };
        }
    }
    /**
     * Get leave request by ID
     */
    async getLeaveRequestById(id) {
        try {
            const response = await api.get(`/leaves/${id}`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get leave request error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch leave request'
            };
        }
    }
    /**
     * Create new leave request
     */
    async createLeaveRequest(leaveData) {
        try {
            const response = await api.post('/leaves', leaveData);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Create leave request error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create leave request'
            };
        }
    }
    /**
     * Update leave request
     */
    async updateLeaveRequest(id, updateData) {
        try {
            const response = await api.put(`/leaves/${id}`, updateData);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Update leave request error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update leave request'
            };
        }
    }
    /**
     * Approve leave request
     */
    async approveLeave(id, approvalNotes) {
        try {
            const response = await api.put(`/leaves/${id}/approve`, { approvalNotes });
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Approve leave error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to approve leave request'
            };
        }
    }
    /**
     * Reject leave request
     */
    async rejectLeave(id, rejectionReason, hrNotes) {
        try {
            const response = await api.put(`/leaves/${id}/reject`, { rejectionReason, hrNotes });
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Reject leave error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reject leave request'
            };
        }
    }
    /**
     * Cancel leave request
     */
    async cancelLeave(id) {
        try {
            const response = await api.put(`/leaves/${id}/cancel`);
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Cancel leave error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to cancel leave request'
            };
        }
    }
    /**
     * Delete leave request
     */
    async deleteLeave(id) {
        try {
            const response = await api.delete(`/leaves/${id}`);
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Delete leave error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete leave request'
            };
        }
    }
    // ============================================================================
    // LEAVE EXTENSIONS
    // ============================================================================
    /**
     * Request extension for a leave
     */
    async requestExtension(leaveId, additionalDays, reason) {
        try {
            const response = await api.post(`/leaves/${leaveId}/extensions`, { additionalDays, reason });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Request extension error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to request extension'
            };
        }
    }
    /**
     * Approve extension (HR/Admin only)
     */
    async approveExtension(extensionId) {
        try {
            const response = await api.put(`/leaves/extensions/${extensionId}/approve`);
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Approve extension error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to approve extension'
            };
        }
    }
    /**
     * Reject extension (HR/Admin only)
     */
    async rejectExtension(extensionId, rejectionReason) {
        try {
            const response = await api.put(`/leaves/extensions/${extensionId}/reject`, { rejectionReason });
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Reject extension error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reject extension'
            };
        }
    }
    // ============================================================================
    // RETURN TRACKING
    // ============================================================================
    /**
     * Confirm employee return
     */
    async confirmReturn(leaveId, actualReturnDate) {
        try {
            const response = await api.put(`/leaves/${leaveId}/return`, { actualReturnDate });
            return {
                success: true,
                message: response.data.message
            };
        }
        catch (error) {
            console.error('Confirm return error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to confirm return'
            };
        }
    }
    /**
     * Get overdue returns
     */
    async getOverdueReturns() {
        try {
            const response = await api.get('/leaves/overdue/returns');
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Get overdue returns error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch overdue returns'
            };
        }
    }
    // ============================================================================
    // LEAVE BALANCES
    // ============================================================================
    /**
     * Get employee leave balance
     */
    async getEmployeeBalance(employeeId, year) {
        try {
            const params = year ? { year } : {};
            const response = await api.get(`/leaves/balance/${employeeId}`, { params });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get employee balance error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch leave balance'
            };
        }
    }
    /**
     * Get current logged-in employee's balance
     */
    async getMyBalance() {
        try {
            const response = await api.get('/leaves/balance/me/current');
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get my balance error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch your leave balance'
            };
        }
    }
    // ============================================================================
    // STATISTICS & REPORTS
    // ============================================================================
    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        try {
            const response = await api.get('/leaves/stats/summary');
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch dashboard statistics'
            };
        }
    }
    /**
     * Get department statistics
     */
    async getDepartmentStats() {
        try {
            const response = await api.get('/leaves/stats/department');
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Get department stats error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch department statistics'
            };
        }
    }
    /**
     * Get calendar data for a specific month
     */
    async getCalendarData(year, month) {
        try {
            const response = await api.get(`/leaves/calendar/${year}/${month}`);
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Get calendar data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch calendar data'
            };
        }
    }
    /**
     * Export all leaves to CSV
     */
    async exportToCSV() {
        try {
            const response = await api.get('/leaves/export/csv');
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Export to CSV error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to export data'
            };
        }
    }
    // ============================================================================
    // LEAVE TYPES
    // ============================================================================
    /**
     * Get all leave types
     */
    async getLeaveTypes() {
        try {
            const response = await api.get('/leaves/types');
            return {
                success: true,
                data: response.data.data || []
            };
        }
        catch (error) {
            console.error('Get leave types error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch leave types'
            };
        }
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Get status label
     */
    getStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'cancelled': 'Cancelled'
        };
        return labels[status] || status;
    }
    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'error',
            'cancelled': 'default'
        };
        return colors[status] || 'default';
    }
    /**
     * Get return status label
     */
    getReturnStatusLabel(status) {
        const labels = {
            'on_leave': 'On Leave',
            'returned': 'Returned',
            'returned_late': 'Returned Late',
            'overdue': 'Overdue'
        };
        return labels[status] || status;
    }
    /**
     * Get return status color
     */
    getReturnStatusColor(status) {
        const colors = {
            'on_leave': 'info',
            'returned': 'success',
            'returned_late': 'warning',
            'overdue': 'error'
        };
        return colors[status] || 'default';
    }
    /**
     * Format date
     */
    formatDate(date) {
        if (!date)
            return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Calculate days between two dates
     */
    calculateDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
}
export default new LeaveService();
