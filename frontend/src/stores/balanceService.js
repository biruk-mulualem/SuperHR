// stores/balanceService.ts - COMPLETE FILE WITH CATEGORY SUPPORT
import api from "./interceptor";
// ============================================
// BALANCE SERVICE CLASS
// ============================================
class BalanceService {
    // ================================================================
    // BALANCE CRUD OPERATIONS
    // ================================================================
    /**
     * Get all balances with filters and pagination
     */
    async getBalances(filters = {}) {
        const params = new URLSearchParams();
        if (filters.storeId)
            params.append('storeId', filters.storeId.toString());
        if (filters.groupId)
            params.append('groupId', filters.groupId.toString());
        if (filters.categoryId)
            params.append('categoryId', filters.categoryId.toString()); // ✅ ADDED
        if (filters.status)
            params.append('status', filters.status);
        if (filters.search)
            params.append('search', filters.search);
        if (filters.page)
            params.append('page', filters.page.toString());
        if (filters.limit)
            params.append('limit', filters.limit.toString());
        const response = await api.get(`/balances?${params.toString()}`);
        return response.data;
    }
    /**
     * Get balance statistics (dashboard stats)
     */
    async getStats() {
        const response = await api.get('/balances/stats');
        return response.data;
    }
    /**
     * Get low stock items
     */
    async getLowStockItems() {
        const response = await api.get('/balances/low-stock');
        return response.data;
    }
    /**
     * Get balance by ID
     */
    async getBalanceById(id) {
        const response = await api.get(`/balances/${id}`);
        return response.data;
    }
    /**
     * Create new balance (Initialize)
     */
    async createBalance(payload) {
        const response = await api.post('/balances', payload);
        return response.data;
    }
    /**
     * Update balance
     */
    async updateBalance(id, payload) {
        const response = await api.put(`/balances/${id}`, payload);
        return response.data;
    }
    /**
     * Toggle balance status (Active/Inactive)
     */
    async toggleStatus(id) {
        const response = await api.patch(`/balances/${id}/toggle-status`);
        return response.data;
    }
    /**
     * Delete balance (only if inactive)
     */
    async deleteBalance(id) {
        const response = await api.delete(`/balances/${id}`);
        return response.data;
    }
    // ================================================================
    // CATEGORY METHODS - ✅ NEW
    // ================================================================
    /**
     * Get all categories with pagination and filtering
     */
    async getCategories(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.page)
                queryParams.append('page', params.page.toString());
            if (params?.limit)
                queryParams.append('limit', params.limit.toString());
            if (params?.search)
                queryParams.append('search', params.search);
            if (params?.status)
                queryParams.append('status', params.status);
            const url = queryParams.toString()
                ? `/balances/categories?${queryParams.toString()}`
                : '/balances/categories';
            const response = await api.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get categories error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch categories'
            };
        }
    }
    /**
     * Get active categories only (for dropdowns)
     */
    async getActiveCategories() {
        try {
            const response = await api.get('/balances/categories/active');
            return response.data;
        }
        catch (error) {
            console.error('Get active categories error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch active categories'
            };
        }
    }
    /**
     * Get category by ID
     */
    async getCategoryById(id) {
        try {
            const response = await api.get(`/balances/categories/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Get category by ID error:', error);
            return {
                success: false,
                data: {},
                error: error.response?.data?.error || 'Failed to fetch category'
            };
        }
    }
    /**
     * Get items by category
     */
    async getItemsByCategory(categoryId) {
        try {
            const response = await api.get(`/balances/categories/${categoryId}/items`);
            return response.data;
        }
        catch (error) {
            console.error('Get items by category error:', error);
            return {
                success: false,
                data: [],
                error: error.response?.data?.error || 'Failed to fetch items by category'
            };
        }
    }
    // ================================================================
    // CSV IMPORT / EXPORT
    // ================================================================
    /**
     * Download CSV template for import
     */
    async downloadTemplate() {
        const response = await api.get('/balances/template/download', {
            responseType: 'blob'
        });
        return response.data;
    }
    /**
     * Import balances from CSV file
     */
    async importBalances(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/balances/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 120000 // 👈 ADD THIS - 120 seconds (2 minutes)
        });
        return response.data;
    }
    /**
     * Export balances as CSV
     */
    // ================================================================
    // CSV IMPORT / EXPORT
    // ================================================================
    // balanceService.ts
    /**
     * Export balances as Excel (.xlsx)
     */
    async exportBalances(type = 'full', storeId, groupId, categoryId, status) {
        let url = `/balances/export?type=${type}`;
        if (storeId)
            url += `&storeId=${storeId}`;
        if (groupId)
            url += `&groupId=${groupId}`;
        if (categoryId)
            url += `&categoryId=${categoryId}`;
        if (status)
            url += `&status=${status}`;
        console.log('📊 Export URL:', url);
        const response = await api.get(url, {
            responseType: 'blob'
        });
        return response.data;
    }
    // ================================================================
    // REQUEST PROCESSING
    // ================================================================
    /**
     * Get approved requests for a store
     * If groupId is provided, only returns requests not yet processed by that group
     */
    async getApprovedRequests(storeId, groupId) {
        let url = `/balances/requests/approved/${storeId}`;
        if (groupId) {
            url += `?groupId=${groupId}`;
        }
        const response = await api.get(url);
        return response.data;
    }
    /**
     * Process approved requests for a specific group
     */
    async processRequests(payload) {
        const response = await api.post('/balances/requests/process', payload);
        return response.data;
    }
    /**
     * Process a single request for a specific group
     */
    async processRequestForGroup(requestId, payload) {
        const response = await api.post(`/balances/requests/${requestId}/process-group`, payload);
        return response.data;
    }
    /**
     * Get processing status for a request
     */
    async getRequestProcessingStatus(requestId) {
        const response = await api.get(`/balances/requests/${requestId}/group-status`);
        return response.data;
    }
    /**
     * Get all request processing statuses
     */
    async getAllRequestProcessingStatus(storeId) {
        let url = '/balances/requests/processing-status';
        if (storeId) {
            url += `?storeId=${storeId}`;
        }
        const response = await api.get(url);
        return response.data;
    }
    /**
     * Skip group processing (Admin only)
     */
    async skipGroupProcessing(requestId, payload) {
        const response = await api.post(`/balances/requests/${requestId}/skip-group`, payload);
        return response.data;
    }
    /**
     * Check if items are initialized for a group
     */
    async checkGroupInitialization(requestId, groupId, storeId) {
        const response = await api.get(`/balances/requests/check-initialization?requestId=${requestId}&groupId=${groupId}&storeId=${storeId}`);
        return response.data;
    }
    // ================================================================
    // HISTORY & SUMMARY
    // ================================================================
    /**
     * Get balance history
     */
    async getBalanceHistory(balanceId, page = 1, limit = 20) {
        const response = await api.get(`/balances/${balanceId}/history?page=${page}&limit=${limit}`);
        return response.data;
    }
    /**
     * Get summary by store
     */
    async getSummaryByStore() {
        const response = await api.get('/balances/summary/by-store');
        return response.data;
    }
    /**
     * Get summary by group
     */
    async getSummaryByGroup() {
        const response = await api.get('/balances/summary/by-group');
        return response.data;
    }
    /**
     * Get summary by item
     */
    async getSummaryByItem() {
        const response = await api.get('/balances/summary/by-item');
        return response.data;
    }
    // ================================================================
    // STORE ENDPOINTS
    // ================================================================
    /**
     * Get all stores
     */
    async getStores(params) {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append('page', params.page.toString());
        if (params?.limit)
            queryParams.append('limit', params.limit.toString());
        if (params?.search)
            queryParams.append('search', params.search);
        const response = await api.get(`/balances/stores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }
    /**
     * Get store by ID
     */
    async getStoreById(id) {
        const response = await api.get(`/balances/stores/${id}`);
        return response.data;
    }
    // ================================================================
    // GROUP ENDPOINTS
    // ================================================================
    /**
     * Get all groups
     */
    async getGroups(params) {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append('page', params.page.toString());
        if (params?.limit)
            queryParams.append('limit', params.limit.toString());
        if (params?.search)
            queryParams.append('search', params.search);
        const response = await api.get(`/balances/groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }
    /**
     * Get group by ID
     */
    async getGroupById(id) {
        const response = await api.get(`/balances/groups/${id}`);
        return response.data;
    }
    // ================================================================
    // ITEM ENDPOINTS - UPDATED WITH CATEGORY
    // ================================================================
    /**
     * Get all items with pagination and filtering
     */
    async getItems(params) {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append('page', params.page.toString());
        if (params?.limit)
            queryParams.append('limit', params.limit.toString());
        if (params?.search)
            queryParams.append('search', params.search);
        if (params?.categoryId)
            queryParams.append('categoryId', params.categoryId.toString());
        if (params?.status)
            queryParams.append('status', params.status);
        const response = await api.get(`/balances/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }
    /**
     * Get active items (for dropdowns)
     */
    async getActiveItems() {
        const response = await api.get('/balances/items/active');
        return response.data;
    }
    /**
     * Get item by ID
     */
    async getItemById(id) {
        const response = await api.get(`/balances/items/${id}`);
        return response.data;
    }
    // ================================================================
    // USER ENDPOINTS
    // ================================================================
    /**
     * Get all users
     */
    async getUsers(params) {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append('page', params.page.toString());
        if (params?.limit)
            queryParams.append('limit', params.limit.toString());
        if (params?.search)
            queryParams.append('search', params.search);
        if (params?.role)
            queryParams.append('role', params.role);
        const response = await api.get(`/balances/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        const response = await api.get(`/balances/users/${id}`);
        return response.data;
    }
    // ================================================================
    // STORE-GROUP RELATIONS
    // ================================================================
    /**
     * Get store-group relations
     */
    async getStoreGroupRelations(storeId) {
        let url = '/balances/store-group-relations';
        if (storeId) {
            url += `?storeId=${storeId}`;
        }
        const response = await api.get(url);
        return response.data;
    }
    // ================================================================
    // GET USER STORE AND GROUP ACCESS
    // ================================================================
    async getUserStoreAndGroup() {
        const response = await api.get('/balances/user/store-group');
        return response.data;
    }
    // ================================================================
    // CATEGORY UTILITY METHODS
    // ================================================================
    /**
     * Get category display color
     */
    getCategoryColor(categoryName) {
        if (!categoryName)
            return '#94a3b8';
        const colors = {
            'Raw Material': '#8b5cf6',
            'Finished Good': '#10b981',
            'Packaging': '#3b82f6',
            'Chemicals': '#ef4444',
            'Electronics': '#f59e0b',
            'Hardware': '#64748b',
            'Software': '#06b6d4',
            'Office Supplies': '#8b5cf6',
            'Safety Equipment': '#22c55e',
            'Spare Parts': '#f97316',
            'Consumables': '#ec4899',
        };
        return colors[categoryName] || '#94a3b8';
    }
    /**
     * Get category display class
     */
    getCategoryClass(categoryName) {
        if (!categoryName)
            return 'no-category';
        return 'has-category';
    }
    /**
     * Get category display badge
     */
    getCategoryBadge(categoryName) {
        if (!categoryName)
            return '📂 Uncategorized';
        return `📁 ${categoryName}`;
    }
    // ================================================================
    // UTILITY METHODS
    // ================================================================
    /**
     * Format number with commas
     */
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Format datetime
     */
    formatDateTime(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    /**
     * Get balance status class for UI
     */
    getBalanceStatusClass(balance, minStock) {
        if (balance === 0)
            return 'zero';
        if (balance <= minStock)
            return 'low';
        return 'normal';
    }
    /**
     * Get status label
     */
    getStatusLabel(status) {
        const labels = {
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive'
        };
        return labels[status] || status;
    }
    /**
     * Get transaction type label with icon
     */
    getTransactionTypeLabel(type) {
        const labels = {
            'Stock In': '📥 Stock In',
            'Stock Out': '📤 Stock Out'
        };
        return labels[type] || type;
    }
    /**
     * Get transaction type class for styling
     */
    getTransactionTypeClass(type) {
        return type === 'Stock In' ? 'stock-in' : 'stock-out';
    }
    /**
     * Get reference type label
     */
    getReferenceTypeLabel(type) {
        const labels = {
            'initialization': '📦 Initialization',
            'purchase': '🛒 Purchase',
            'transfer': '🔄 Transfer',
            'adjustment': '📊 Adjustment',
            'return': '↩️ Return',
            'sale': '💰 Sale',
            'request': '📋 Request',
            'auto_initialization': '🤖 Auto-Initialization'
        };
        return labels[type] || type;
    }
    /**
     * Get CSS class for balance value
     */
    getBalanceValueClass(balance, minStock) {
        if (balance === 0)
            return 'text-danger';
        if (balance <= minStock)
            return 'text-warning';
        return 'text-success';
    }
    /**
     * Calculate base balance (balance * conversion value)
     */
    calculateBaseBalance(balance, conversionValue) {
        return balance * conversionValue;
    }
    /**
     * Check if stock is low
     */
    isLowStock(balance, minStock) {
        return balance <= minStock && balance > 0;
    }
    /**
     * Check if stock is zero
     */
    isZeroStock(balance) {
        return balance === 0;
    }
    /**
     * Get low stock warning message
     */
    getLowStockMessage(balance, minStock, itemName) {
        if (balance === 0) {
            return `⚠️ ${itemName} is out of stock!`;
        }
        if (balance <= minStock) {
            return `⚠️ ${itemName} is low on stock (${balance} remaining, minimum ${minStock})`;
        }
        return '';
    }
    /**
     * Get processing status label for a request
     */
    getRequestProcessingStatusLabel(status) {
        const labels = {
            'pending': '⏳ Pending',
            'partial': '🔄 Partially Processed',
            'completed': '✅ Completed',
            'finalized': '✅ Finalized'
        };
        return labels[status] || status;
    }
    /**
     * Check if a request can be processed by the current group
     */
    canProcessRequest(request, groupId) {
        if (request.status === 'finalized')
            return false;
        if (request.isProcessedByGroup)
            return false;
        if (request.isFullyProcessed)
            return false;
        return true;
    }
}
// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new BalanceService();
