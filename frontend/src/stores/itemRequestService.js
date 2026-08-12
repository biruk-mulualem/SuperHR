// stores/itemRequestService.ts
import api from './interceptor';
// ================================================================
// ITEM REQUEST SERVICE
// ================================================================
class ItemRequestService {
    // ================================================================
    // STORE METHODS (for dropdowns)
    // ================================================================
    /**
     * Get active stores for dropdown
     * GET /api/item-requests/active-stores
     */
    async getActiveStores() {
        try {
            const response = await api.get('/item-requests/active-stores');
            return response.data;
        }
        catch (error) {
            console.error('Get active stores error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch active stores'
            };
        }
    }
    /**
     * Get active items for dropdown
     * GET /api/item-requests/active-items
     */
    async getActiveItems() {
        try {
            const response = await api.get('/item-requests/active-items');
            return response.data;
        }
        catch (error) {
            console.error('Get active items error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch active items'
            };
        }
    }
    // ================================================================
    // REQUEST METHODS
    // ================================================================
    /**
     * Get all item requests with pagination and filters
     * GET /api/item-requests
     */
    async getRequests(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.search)
                queryParams.append('search', params.search);
            if (params.status)
                queryParams.append('status', params.status);
            if (params.storeId)
                queryParams.append('storeId', params.storeId.toString());
            if (params.userId)
                queryParams.append('userId', params.userId.toString());
            if (params.sortBy)
                queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder)
                queryParams.append('sortOrder', params.sortOrder);
            const url = queryParams.toString()
                ? `/item-requests?${queryParams.toString()}`
                : '/item-requests';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get requests error:', error);
            return {
                success: false,
                data: {
                    requests: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        pages: 0
                    }
                },
                error: error.response?.data?.error || 'Failed to fetch requests'
            };
        }
    }
    /**
     * Get single item request by ID
     * GET /api/item-requests/:id
     */
    async getRequestById(id) {
        try {
            const response = await api.get(`/item-requests/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Get request by ID error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch request'
            };
        }
    }
    /**
     * Get current user's requests
     * GET /api/item-requests/my-requests
     */
    async getMyRequests(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page)
                queryParams.append('page', params.page.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.status)
                queryParams.append('status', params.status);
            const url = queryParams.toString()
                ? `/item-requests/my-requests?${queryParams.toString()}`
                : '/item-requests/my-requests';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get my requests error:', error);
            return {
                success: false,
                data: {
                    requests: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        pages: 0
                    }
                },
                error: error.response?.data?.error || 'Failed to fetch your requests'
            };
        }
    }
    /**
     * Get requests by user ID
     * GET /api/item-requests/user/:userId
     */
    async getRequestsByUser(userId) {
        try {
            const response = await api.get(`/item-requests/user/${userId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get requests by user error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch requests for user'
            };
        }
    }
    /**
     * Get requests by status
     * GET /api/item-requests/status/:status
     */
    async getRequestsByStatus(status) {
        try {
            const response = await api.get(`/item-requests/status/${status}`);
            return response.data;
        }
        catch (error) {
            console.error('Get requests by status error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch requests by status'
            };
        }
    }
    /**
     * Get requests by date range
     * GET /api/item-requests/date-range
     */
    async getRequestsByDateRange(startDate, endDate) {
        try {
            const response = await api.get(`/item-requests/date-range?startDate=${startDate}&endDate=${endDate}`);
            return response.data;
        }
        catch (error) {
            console.error('Get requests by date range error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch requests by date range'
            };
        }
    }
    /**
     * Get request statistics
     * GET /api/item-requests/stats
     */
    async getStats() {
        try {
            const response = await api.get('/item-requests/stats');
            return response.data;
        }
        catch (error) {
            console.error('Get stats error:', error);
            return {
                success: false,
                data: {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    finalized: 0,
                    byStatus: []
                },
                error: error.response?.data?.error || 'Failed to fetch statistics'
            };
        }
    }
    /**
     * Create a new item request
     * POST /api/item-requests
     */
    async createRequest(data) {
        try {
            const response = await api.post('/item-requests', data);
            return response.data;
        }
        catch (error) {
            console.error('Create request error:', error);
            // 🔥 FIX: Check if the error response contains validation errors
            const errorData = error.response?.data;
            // If this is a validation error response with errors array
            if (errorData && errorData.errors && errorData.errors.length > 0) {
                // Return the full validation error response
                return errorData;
            }
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || error.response?.data?.message || 'Failed to create request'
            };
        }
    }
    /**
     * Update an existing item request
     * PUT /api/item-requests/:id
     */
    async updateRequest(id, data) {
        try {
            const response = await api.put(`/item-requests/${id}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update request error:', error);
            // 🔥 Check if the error response contains validation errors
            const errorData = error.response?.data;
            // If this is a validation error response with errors array
            if (errorData && errorData.errors && errorData.errors.length > 0) {
                // Return the full validation error response
                return errorData;
            }
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || error.response?.data?.message || 'Failed to update request'
            };
        }
    }
    /**
     * Update request status
     * PATCH /api/item-requests/:id/status
     */
    async updateStatus(id, status) {
        try {
            const response = await api.patch(`/item-requests/${id}/status`, { status });
            return response.data;
        }
        catch (error) {
            console.error('Update status error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to update status'
            };
        }
    }
    /**
     * Approve a request
     * PATCH /api/item-requests/:id/status
     */
    async approveRequest(id) {
        return this.updateStatus(id, 'approved');
    }
    /**
     * Reject a request
     * PATCH /api/item-requests/:id/status
     */
    async rejectRequest(id) {
        return this.updateStatus(id, 'rejected');
    }
    /**
     * Finalize a request
     * PATCH /api/item-requests/:id/status
     */
    async finalizeRequest(id) {
        return this.updateStatus(id, 'finalized');
    }
    /**
     * Delete a request (only pending or rejected)
     * DELETE /api/item-requests/:id
     */
    async deleteRequest(id) {
        try {
            const response = await api.delete(`/item-requests/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete request error:', error);
            return {
                success: false,
                message: '',
                error: error.response?.data?.error || 'Failed to delete request'
            };
        }
    }
    /**
     * Export requests to CSV data
     * GET /api/item-requests/export
     */
    async exportRequests(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.status)
                queryParams.append('status', params.status);
            if (params?.storeId)
                queryParams.append('storeId', params.storeId.toString());
            if (params?.userId)
                queryParams.append('userId', params.userId.toString());
            const url = queryParams.toString()
                ? `/item-requests/export?${queryParams.toString()}`
                : '/item-requests/export';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Export requests error:', error);
            return {
                success: false,
                data: [],
                total: 0,
                error: error.response?.data?.error || 'Failed to export requests'
            };
        }
    }
    // ================================================================
    // NOTIFICATION METHODS - NEW
    // ================================================================
    // stores/itemRequestService.ts
    /**
     * Get notifications for a specific group in a specific store
     * GET /api/item-requests/notifications/:storeId/:groupId
     */
    async getGroupNotifications(storeId, groupId, params) {
        try {
            // Build query string
            const queryParams = new URLSearchParams();
            if (params?.page)
                queryParams.append('page', params.page.toString());
            if (params?.limit)
                queryParams.append('limit', params.limit.toString());
            if (params?.status)
                queryParams.append('status', params.status);
            const url = queryParams.toString()
                ? `/item-requests/notifications/${storeId}/${groupId}?${queryParams.toString()}`
                : `/item-requests/notifications/${storeId}/${groupId}`;
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get group notifications error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get group notifications'
            };
        }
    }
    /**
     * Get request with notification status and group responses
     * GET /api/item-requests/:id/notifications
     */
    async getRequestWithNotifications(id) {
        try {
            const response = await api.get(`/item-requests/${id}/notifications`);
            return response.data;
        }
        catch (error) {
            console.error('Get request with notifications error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch request notifications'
            };
        }
    }
    /**
     * Check if all groups have accepted/rejected the request
     * GET /api/item-requests/:id/notifications/status
     */
    async checkRequestNotificationStatus(requestId) {
        try {
            const response = await api.get(`/item-requests/${requestId}/notifications/status`);
            return response.data;
        }
        catch (error) {
            console.error('Check notification status error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to check notification status'
            };
        }
    }
    /**
     * Get all rejection reasons for a request
     * GET /api/item-requests/notifications/requests/:requestId/rejections
     */
    async getRejectionReasons(requestId) {
        try {
            const response = await api.get(`/item-requests/notifications/requests/${requestId}/rejections`);
            return response.data;
        }
        catch (error) {
            console.error('Get rejection reasons error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get rejection reasons'
            };
        }
    }
    /**
     * Accept a notification (group accepts the request)
     * POST /api/item-requests/notifications/:notificationId/accept
     */
    async acceptNotification(notificationId) {
        try {
            const response = await api.post(`/item-requests/notifications/${notificationId}/accept`);
            return response.data;
        }
        catch (error) {
            console.error('Accept notification error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to accept notification'
            };
        }
    }
    /**
     * Reject a notification with reason
     * POST /api/item-requests/notifications/:notificationId/reject
     */
    async rejectNotification(notificationId, reason) {
        try {
            const response = await api.post(`/item-requests/notifications/${notificationId}/reject`, { reason });
            return response.data;
        }
        catch (error) {
            console.error('Reject notification error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reject notification'
            };
        }
    }
    // ================================================================
    // NOTIFICATION HELPER METHODS
    // ================================================================
    /**
     * Check if a request can be approved (all groups accepted)
     */
    canApproveRequest(request) {
        if (!request || request.status !== 'pending')
            return false;
        // Check if request has notifications
        const notifications = request.notifications || [];
        if (notifications.length === 0)
            return false;
        // Check if all groups accepted and none rejected
        const allAccepted = notifications.every((n) => n.status === 'accepted');
        const hasRejection = notifications.some((n) => n.status === 'rejected');
        return allAccepted && !hasRejection;
    }
    /**
     * Check if a request can be printed (all groups accepted)
     */
    canPrintRequest(request) {
        return this.canApproveRequest(request);
    }
    /**
     * Get acceptance summary for display
     */
    getAcceptanceSummary(request) {
        const notifications = request.notifications || [];
        if (notifications.length === 0)
            return 'No groups';
        const total = notifications.length;
        const accepted = notifications.filter((n) => n.status === 'accepted').length;
        const rejected = notifications.filter((n) => n.status === 'rejected').length;
        const pending = notifications.filter((n) => n.status === 'pending').length;
        if (rejected > 0)
            return `❌ ${rejected} group(s) rejected`;
        if (accepted === total)
            return `✅ All ${total} groups accepted`;
        return `⏳ ${accepted}/${total} groups accepted`;
    }
    /**
     * Get tooltip for approve button
     */
    getApproveTooltip(request) {
        if (!request || request.status !== 'pending')
            return 'Request is not pending';
        const notifications = request.notifications || [];
        const hasRejection = notifications.some((n) => n.status === 'rejected');
        if (hasRejection)
            return 'Some groups have rejected this request. Edit and resubmit.';
        const allAccepted = notifications.every((n) => n.status === 'accepted');
        if (!allAccepted)
            return 'Waiting for all groups to accept the request';
        return 'All groups accepted - Click to approve';
    }
    // ================================================================
    // HELPER METHODS
    // ================================================================
    /**
     * Get user display name from request
     */
    getRequesterName(request) {
        if (request?.requestedByUser) {
            return request.requestedByUser.fullName ||
                request.requestedByUser.full_name ||
                request.requestedByUser.username ||
                'Unknown User';
        }
        return request?.requestedBy || 'Unknown User';
    }
    /**
     * Get user email from request
     */
    getRequesterEmail(request) {
        return request?.requestedByUser?.email || 'N/A';
    }
    /**
     * Check if user can perform action on request
     */
    canPerformAction(request, action) {
        if (!request)
            return false;
        const actions = {
            edit: request.status !== 'finalized',
            approve: request.status === 'pending',
            reject: request.status === 'pending',
            finalize: request.status === 'approved',
        };
        return actions[action] || false;
    }
    /**
     * Get available status options for a request
     */
    getAvailableStatuses(request) {
        if (!request)
            return [];
        const statuses = [];
        if (request.status === 'pending') {
            statuses.push('approved', 'rejected');
        }
        else if (request.status === 'approved') {
            statuses.push('finalized');
        }
        return statuses;
    }
    /**
     * Get status badge color
     */
    getStatusBadge(status) {
        const badgeMap = {
            pending: 'warning',
            approved: 'success',
            rejected: 'danger',
            finalized: 'info',
        };
        return badgeMap[status] || 'secondary';
    }
    /**
     * Get status display name
     */
    getStatusDisplay(status) {
        const displayMap = {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            finalized: 'Finalized',
        };
        return displayMap[status] || status;
    }
    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const iconMap = {
            pending: '⏳',
            approved: '✅',
            rejected: '❌',
            finalized: '📋',
        };
        return iconMap[status] || '📦';
    }
    /**
     * Format date
     */
    formatDate(date) {
        if (!date)
            return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime()))
            return 'N/A';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Format date time
     */
    formatDateTime(date) {
        if (!date)
            return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime()))
            return 'N/A';
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    /**
     * Get total quantity of items in request
     */
    getTotalQuantity(request) {
        if (!request || !request.items)
            return 0;
        return request.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    /**
     * Get total number of items in request
     */
    getTotalItems(request) {
        return request?.items?.length || 0;
    }
    /**
     * Check if request is editable
     */
    isEditable(request) {
        return request?.status !== 'finalized';
    }
    /**
     * Check if request is pending
     */
    isPending(request) {
        return request?.status === 'pending';
    }
    /**
     * Check if request is approved
     */
    isApproved(request) {
        return request?.status === 'approved';
    }
    /**
     * Check if request is rejected
     */
    isRejected(request) {
        return request?.status === 'rejected';
    }
    /**
     * Check if request is finalized
     */
    isFinalized(request) {
        return request?.status === 'finalized';
    }
}
export default new ItemRequestService();
