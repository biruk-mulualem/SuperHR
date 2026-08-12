// stores/storeDashboardService.ts
// Store Dashboard Service - Complete with store/group parameters
import api from "./interceptor";
// ============================================
// STORE DASHBOARD SERVICE CLASS
// ============================================
class StoreDashboardService {
    baseUrl = '/store-dashboard';
    // Store user context from login
    userStoreId = null;
    userGroupId = null;
    /**
     * Set user's store and group from login response
     * Call this after login in the main app or dashboard
     */
    setUserContext(storeId, groupId) {
        this.userStoreId = storeId;
        this.userGroupId = groupId;
        console.log('📍 User context set:', { storeId, groupId });
    }
    /**
     * Get user context
     */
    getUserContext() {
        return {
            storeId: this.userStoreId,
            groupId: this.userGroupId
        };
    }
    /**
     * Check if user has store and group context
     */
    hasUserContext() {
        return !!(this.userStoreId && this.userGroupId);
    }
    /**
     * Build query parameters with store and group
     */
    buildParams(extraParams) {
        const params = new URLSearchParams();
        // Always include store and group from user context
        if (this.userStoreId) {
            params.append('storeId', this.userStoreId.toString());
        }
        if (this.userGroupId) {
            params.append('groupId', this.userGroupId.toString());
        }
        // Add any extra parameters
        if (extraParams) {
            Object.entries(extraParams).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    params.append(key, value.toString());
                }
            });
        }
        return params.toString();
    }
    // ================================================================
    // 1. GET STOCK SUMMARY
    // ================================================================
    async getStockSummary() {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/stock-summary${params ? '?' + params : ''}`;
            console.log('📤 Fetching stock summary from:', url);
            const response = await api.get(url);
            console.log('✅ Stock summary loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load stock summary:', error);
            return {
                success: false,
                data: this.getDefaultStockSummary()
            };
        }
    }
    // ================================================================
    // 2. GET STOCK HEALTH
    // ================================================================
    async getStockHealth() {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/stock-health${params ? '?' + params : ''}`;
            console.log('📤 Fetching stock health from:', url);
            const response = await api.get(url);
            console.log('✅ Stock health loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load stock health:', error);
            return {
                success: false,
                data: this.getDefaultStockHealth()
            };
        }
    }
    // ================================================================
    // 3. GET LOW STOCK ALERTS WITH PAGINATION
    // ================================================================
    async getLowStockAlerts(limit = 20, page = 1) {
        try {
            const params = this.buildParams({ limit, page });
            const url = `${this.baseUrl}/low-stock-alerts?${params}`;
            console.log('📤 Fetching low stock alerts from:', url);
            const response = await api.get(url);
            console.log('✅ Low stock alerts loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load low stock alerts:', error);
            return {
                success: false,
                data: {
                    alerts: [],
                    summary: { critical: 0, warning: 0, total: 0 },
                    pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
                }
            };
        }
    }
    // ================================================================
    // 4. GET APPROVED REQUESTS
    // ================================================================
    async getApprovedRequests(limit = 10) {
        try {
            const params = this.buildParams({ limit });
            const url = `${this.baseUrl}/approved-requests?${params}`;
            console.log('📤 Fetching approved requests from:', url);
            const response = await api.get(url);
            console.log('✅ Approved requests loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load approved requests:', error);
            return { success: false, data: [], total: 0 };
        }
    }
    // ================================================================
    // 5. GET RECENT TRANSACTIONS
    // ================================================================
    async getRecentTransactions(limit = 10) {
        try {
            const params = this.buildParams({ limit });
            const url = `${this.baseUrl}/recent-transactions?${params}`;
            console.log('📤 Fetching recent transactions from:', url);
            const response = await api.get(url);
            console.log('✅ Recent transactions loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load recent transactions:', error);
            return { success: false, data: [] };
        }
    }
    // ================================================================
    // 6. GET HIGH MOVING ITEMS
    // ================================================================
    async getHighMovingItems(dateRange = 'week', limit = 10) {
        try {
            const params = this.buildParams({ dateRange, limit });
            const url = `${this.baseUrl}/high-moving-items?${params}`;
            console.log('📤 Fetching high moving items from:', url);
            const response = await api.get(url);
            console.log('✅ High moving items loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load high moving items:', error);
            return {
                success: false,
                data: []
            };
        }
    }
    // ================================================================
    // 7. GET LOW MOVING ITEMS
    // ================================================================
    async getLowMovingItems(dateRange = 'week', limit = 10) {
        try {
            const params = this.buildParams({ dateRange, limit });
            const url = `${this.baseUrl}/low-moving-items?${params}`;
            console.log('📤 Fetching low moving items from:', url);
            const response = await api.get(url);
            console.log('✅ Low moving items loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load low moving items:', error);
            return {
                success: false,
                data: []
            };
        }
    }
    // ================================================================
    // 8. GET TRANSACTION STATISTICS
    // ================================================================
    async getTransactionStats() {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/transaction-stats${params ? '?' + params : ''}`;
            console.log('📤 Fetching transaction stats from:', url);
            const response = await api.get(url);
            console.log('✅ Transaction stats loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load transaction stats:', error);
            return {
                success: false,
                data: { total: 0, stockIn: 0, stockOut: 0 }
            };
        }
    }
    // ================================================================
    // 9. GET FILTER OPTIONS
    // ================================================================
    async getFilterOptions() {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/filter-options${params ? '?' + params : ''}`;
            console.log('📤 Fetching filter options from:', url);
            const response = await api.get(url);
            console.log('✅ Filter options loaded:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to load filter options:', error);
            return {
                success: false,
                data: {
                    stores: [],
                    groups: [],
                    userAccess: {
                        isAdmin: false,
                        storeId: null,
                        groupId: null,
                        storeName: null,
                        groupName: null,
                        role: ''
                    }
                }
            };
        }
    }
    // ================================================================
    // 10. GET COMPLETE DASHBOARD (ALL IN ONE)
    // ================================================================
    async getDashboardData() {
        try {
            // Fetch all data in parallel
            const [stockSummary, stockHealth, lowStockAlerts, pendingRequests, recentTransactions, highMovingItems, lowMovingItems, transactionStats, filterOptions] = await Promise.all([
                this.getStockSummary(),
                this.getStockHealth(),
                this.getLowStockAlerts(20),
                this.getApprovedRequests(10),
                this.getRecentTransactions(10),
                this.getHighMovingItems('week', 10),
                this.getLowMovingItems('week', 10),
                this.getTransactionStats(),
                this.getFilterOptions()
            ]);
            // Combine all data
            const dashboardData = {
                stockSummary: stockSummary.success ? stockSummary.data : this.getDefaultStockSummary(),
                stockHealth: stockHealth.success ? stockHealth.data : this.getDefaultStockHealth(),
                lowStockAlerts: lowStockAlerts.success ? lowStockAlerts.data.alerts : [],
                pendingRequests: pendingRequests.success ? pendingRequests.data : [],
                recentTransactions: recentTransactions.success ? recentTransactions.data : [],
                transactionStats: transactionStats.success ? transactionStats.data : { total: 0, stockIn: 0, stockOut: 0 },
                movingItems: {
                    highMoving: highMovingItems.success ? highMovingItems.data : [],
                    lowMoving: lowMovingItems.success ? lowMovingItems.data : []
                },
                alerts: lowStockAlerts.success ? lowStockAlerts.data.summary : { critical: 0, warning: 0, total: 0 },
                filters: {
                    stores: filterOptions.success ? filterOptions.data.stores : [],
                    groups: filterOptions.success ? filterOptions.data.groups : [],
                    selectedStore: this.userStoreId || 'all',
                    selectedGroup: this.userGroupId || 'all',
                    dateRange: 'week'
                },
                userAccess: {
                    isAdmin: filterOptions.success ? filterOptions.data.userAccess.isAdmin : false,
                    role: filterOptions.success ? (filterOptions.data.userAccess.role || '') : '',
                    storeId: this.userStoreId,
                    groupId: this.userGroupId,
                    storeName: filterOptions.success ? filterOptions.data.userAccess.storeName : null,
                    groupName: filterOptions.success ? filterOptions.data.userAccess.groupName : null,
                    hasAssignments: !!(this.userStoreId && this.userGroupId)
                }
            };
            console.log('✅ Complete dashboard data assembled');
            return {
                success: true,
                data: dashboardData
            };
        }
        catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            return {
                success: false,
                data: this.getDefaultDashboardData()
            };
        }
    }
    // ================================================================
    // 11. GET MOVING ITEMS (Combined)
    // ================================================================
    async getMovingItems(dateRange = 'week') {
        try {
            const [high, low] = await Promise.all([
                this.getHighMovingItems(dateRange, 10),
                this.getLowMovingItems(dateRange, 10)
            ]);
            return {
                success: high.success && low.success,
                data: {
                    highMoving: high.success ? high.data : [],
                    lowMoving: low.success ? low.data : []
                }
            };
        }
        catch (error) {
            console.error('❌ Failed to load moving items:', error);
            return {
                success: false,
                data: { highMoving: [], lowMoving: [] }
            };
        }
    }
    // ================================================================
    // 12. EXPORT DASHBOARD
    // ================================================================
    async exportDashboard(dateRange = 'week') {
        try {
            const params = this.buildParams({ dateRange });
            const url = `${this.baseUrl}/export?${params}`;
            console.log('📤 Exporting dashboard from:', url);
            const response = await api.get(url);
            console.log('✅ Dashboard exported:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to export dashboard:', error);
            return { success: false, message: 'Export failed', data: null };
        }
    }
    // ================================================================
    // 13. GET STORE DETAILS BY ID
    // ================================================================
    async getStoreDetails(storeId) {
        try {
            const response = await api.get(`/stores/${storeId}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        }
        catch (error) {
            console.error('❌ Failed to get store details:', error);
            return null;
        }
    }
    // ================================================================
    // 14. GET GROUP DETAILS BY ID
    // ================================================================
    async getGroupDetails(groupId) {
        try {
            const response = await api.get(`/groups/${groupId}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        }
        catch (error) {
            console.error('❌ Failed to get group details:', error);
            return null;
        }
    }
    // ================================================================
    // DEFAULT DATA (for fallback when API fails)
    // ================================================================
    getDefaultStockSummary() {
        return {
            totalItems: 0,
            totalStockIn: 0,
            totalStockOut: 0,
            zeroStock: 0,
            zeroStockPercentage: 0,
            minStockAlert: 0,
            pendingRequests: 0
        };
    }
    getDefaultStockHealth() {
        return {
            healthy: 0,
            lowStock: 0,
            zeroStock: 0,
            healthyPercent: 0,
            lowStockPercent: 0,
            zeroStockPercent: 0
        };
    }
    getDefaultDashboardData() {
        return {
            stockSummary: this.getDefaultStockSummary(),
            stockHealth: this.getDefaultStockHealth(),
            lowStockAlerts: [],
            pendingRequests: [],
            recentTransactions: [],
            transactionStats: { total: 0, stockIn: 0, stockOut: 0 },
            movingItems: { highMoving: [], lowMoving: [] },
            alerts: { critical: 0, warning: 0, total: 0 },
            filters: {
                stores: [],
                groups: [],
                selectedStore: 'all',
                selectedGroup: 'all',
                dateRange: 'week'
            },
            userAccess: {
                isAdmin: false,
                role: '',
                storeId: null,
                groupId: null,
                storeName: null,
                groupName: null,
                hasAssignments: false
            }
        };
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
            return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime()))
                return 'N/A';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        catch {
            return 'N/A';
        }
    }
    /**
     * Format date short (for transactions)
     */
    formatDateShort(dateStr) {
        if (!dateStr)
            return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime()))
                return '';
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        catch {
            return '';
        }
    }
    /**
     * Get initials from name
     */
    getInitials(name) {
        if (!name)
            return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    /**
     * Get store name by ID
     */
    getStoreName(stores, storeId) {
        const store = stores.find(s => s.id === storeId);
        return store ? store.name : 'Unknown Store';
    }
    /**
     * Get group name by ID
     */
    getGroupName(groups, groupId) {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : 'Unknown Group';
    }
    /**
     * Get date range label
     */
    getDateRangeLabel(range) {
        const labels = {
            'today': 'Today',
            'week': 'This Week',
            'month': 'This Month',
            '3months': 'Last 3 Months',
            '6months': 'Last 6 Months',
            'all': 'All Time'
        };
        return labels[range] || range;
    }
    /**
     * Get balance status class
     */
    getBalanceStatusClass(balance, minStock) {
        if (balance === 0)
            return 'zero';
        if (balance <= minStock)
            return 'low';
        return 'normal';
    }
    /**
     * Get bar width for charts
     */
    getBarWidth(value, max) {
        if (max === 0)
            return 0;
        return Math.max((value / max) * 100, 5);
    }
}
// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new StoreDashboardService();
