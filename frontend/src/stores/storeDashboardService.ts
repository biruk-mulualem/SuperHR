// stores/storeDashboardService.ts
// Store Dashboard Service - Complete with store/group parameters

import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Store {
    id: number;
    name: string;
    code: string;
    location?: string;
    status?: string;
}

export interface Group {
    id: number;
    name: string;
    code: string;
    description?: string;
    status?: string;
}

export interface StockSummary {
    totalItems: number;
    totalStockIn: number;
    totalStockOut: number;
    zeroStock: number;
    zeroStockPercentage: number;
    minStockAlert: number;
    pendingRequests: number;
}

export interface StockHealth {
    healthy: number;
    lowStock: number;
    zeroStock: number;
    healthyPercent: number;
    lowStockPercent: number;
    zeroStockPercent: number;
}

export interface LowStockAlert {
    id: number;
    name: string;
    code: string;
    category: string;
    currentStock: number;
    minStock: number;
    uom: string;
    shortage: number;
    store?: string;
    group?: string;
    status: 'zero' | 'low';
}

export interface PendingRequest {
    id: number;
    requestCode: string;
    askingStore: string | null;
    supplyingStore: string | null;
    requestedBy: string;
    requestedDate: string;
    status: string;
    items: {
        itemId: number;
        itemName: string;
        itemCode: string;
        quantity: number;
        uom: string;
    }[];
    totalItems: number;
}

export interface RecentTransaction {
    id: number;
    itemName: string;
    itemCode: string;
    storeId: number;
    storeName: string | null;
    type: 'Stock In' | 'Stock Out';
    quantity: number;
    previousBalance: number;
    newBalance: number;
    uom: string;
    referenceType: string;
    referenceId: number | null;
    remark: string | null;
    createdBy: string;
    createdAt: string;
}

export interface MovingItem {
    id: number;
    code: string;
    name: string;
    uom: string;
    transactions: number;
    totalIn: number;
    totalOut: number;
    netMovement: number;
}

export interface TransactionStats {
    total: number;
    stockIn: number;
    stockOut: number;
}

export interface AlertSummary {
    critical: number;
    warning: number;
    total: number;
}

export interface DashboardFilters {
    stores: Store[];
    groups: Group[];
    selectedStore: number | string;
    selectedGroup: number | string;
    dateRange: string;
}

export interface UserAccess {
    isAdmin: boolean;
    role: string;
    storeId: number | null;
    groupId: number | null;
    storeName: string | null;
    groupName: string | null;
    hasAssignments: boolean;
}

export interface FilterOptionsUserAccess {
    isAdmin: boolean;
    storeId: number | null;
    groupId: number | null;
    storeName: string | null;
    groupName: string | null;
    role?: string;
}

export interface FilterOptionsResponse {
    success: boolean;
    data: {
        stores: Store[];
        groups: Group[];
        userAccess: FilterOptionsUserAccess;
    };
}

export interface DashboardData {
    stockSummary: StockSummary;
    stockHealth: StockHealth;
    lowStockAlerts: LowStockAlert[];
    pendingRequests: PendingRequest[];
    recentTransactions: RecentTransaction[];
    transactionStats: TransactionStats;
    movingItems: {
        highMoving: MovingItem[];
        lowMoving: MovingItem[];
    };
    alerts: AlertSummary;
    filters: DashboardFilters;
    userAccess: UserAccess;
}

export interface DashboardResponse {
    success: boolean;
    data: DashboardData;
}

// ============================================
// STORE DASHBOARD SERVICE CLASS
// ============================================

class StoreDashboardService {
    private baseUrl = '/store-dashboard';
    
    // Store user context from login
    private userStoreId: number | null = null;
    private userGroupId: number | null = null;

    /**
     * Set user's store and group from login response
     * Call this after login in the main app or dashboard
     */
    setUserContext(storeId: number | null, groupId: number | null) {
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
    hasUserContext(): boolean {
        return !!(this.userStoreId && this.userGroupId);
    }

    /**
     * Build query parameters with store and group
     */
    private buildParams(extraParams?: Record<string, any>): string {
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
    async getStockSummary(): Promise<{
        success: boolean;
        data: StockSummary;
    }> {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/stock-summary${params ? '?' + params : ''}`;
            console.log('📤 Fetching stock summary from:', url);
            
            const response = await api.get(url);
            console.log('✅ Stock summary loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getStockHealth(): Promise<{
        success: boolean;
        data: StockHealth;
    }> {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/stock-health${params ? '?' + params : ''}`;
            console.log('📤 Fetching stock health from:', url);
            
            const response = await api.get(url);
            console.log('✅ Stock health loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getLowStockAlerts(limit: number = 20, page: number = 1): Promise<{
        success: boolean;
        data: {
            alerts: LowStockAlert[];
            summary: AlertSummary;
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
                hasMore: boolean;
            };
        };
    }> {
        try {
            const params = this.buildParams({ limit, page });
            const url = `${this.baseUrl}/low-stock-alerts?${params}`;
            console.log('📤 Fetching low stock alerts from:', url);
            
            const response = await api.get(url);
            console.log('✅ Low stock alerts loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getApprovedRequests(limit: number = 10): Promise<{
        success: boolean;
        data: PendingRequest[];
        total: number;
    }> {
        try {
            const params = this.buildParams({ limit });
            const url = `${this.baseUrl}/approved-requests?${params}`;
            console.log('📤 Fetching approved requests from:', url);
            
            const response = await api.get(url);
            console.log('✅ Approved requests loaded:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to load approved requests:', error);
            return { success: false, data: [], total: 0 };
        }
    }

    // ================================================================
    // 5. GET RECENT TRANSACTIONS
    // ================================================================
    async getRecentTransactions(limit: number = 10): Promise<{
        success: boolean;
        data: RecentTransaction[];
    }> {
        try {
            const params = this.buildParams({ limit });
            const url = `${this.baseUrl}/recent-transactions?${params}`;
            console.log('📤 Fetching recent transactions from:', url);
            
            const response = await api.get(url);
            console.log('✅ Recent transactions loaded:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to load recent transactions:', error);
            return { success: false, data: [] };
        }
    }

    // ================================================================
    // 6. GET HIGH MOVING ITEMS
    // ================================================================
    async getHighMovingItems(dateRange: string = 'week', limit: number = 10): Promise<{
        success: boolean;
        data: MovingItem[];
    }> {
        try {
            const params = this.buildParams({ dateRange, limit });
            const url = `${this.baseUrl}/high-moving-items?${params}`;
            console.log('📤 Fetching high moving items from:', url);
            
            const response = await api.get(url);
            console.log('✅ High moving items loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getLowMovingItems(dateRange: string = 'week', limit: number = 10): Promise<{
        success: boolean;
        data: MovingItem[];
    }> {
        try {
            const params = this.buildParams({ dateRange, limit });
            const url = `${this.baseUrl}/low-moving-items?${params}`;
            console.log('📤 Fetching low moving items from:', url);
            
            const response = await api.get(url);
            console.log('✅ Low moving items loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getTransactionStats(): Promise<{
        success: boolean;
        data: TransactionStats;
    }> {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/transaction-stats${params ? '?' + params : ''}`;
            console.log('📤 Fetching transaction stats from:', url);
            
            const response = await api.get(url);
            console.log('✅ Transaction stats loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getFilterOptions(): Promise<FilterOptionsResponse> {
        try {
            const params = this.buildParams();
            const url = `${this.baseUrl}/filter-options${params ? '?' + params : ''}`;
            console.log('📤 Fetching filter options from:', url);
            
            const response = await api.get(url);
            console.log('✅ Filter options loaded:', response.data);
            return response.data;
        } catch (error: any) {
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
    async getDashboardData(): Promise<DashboardResponse> {
        try {
            // Fetch all data in parallel
            const [
                stockSummary,
                stockHealth,
                lowStockAlerts,
                pendingRequests,
                recentTransactions,
                highMovingItems,
                lowMovingItems,
                transactionStats,
                filterOptions
            ] = await Promise.all([
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
            const dashboardData: DashboardData = {
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
        } catch (error: any) {
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
    async getMovingItems(dateRange: string = 'week'): Promise<{
        success: boolean;
        data: { highMoving: MovingItem[]; lowMoving: MovingItem[] };
    }> {
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
        } catch (error) {
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
    async exportDashboard(dateRange: string = 'week'): Promise<{
        success: boolean;
        message: string;
        data: any;
    }> {
        try {
            const params = this.buildParams({ dateRange });
            const url = `${this.baseUrl}/export?${params}`;
            console.log('📤 Exporting dashboard from:', url);
            
            const response = await api.get(url);
            console.log('✅ Dashboard exported:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to export dashboard:', error);
            return { success: false, message: 'Export failed', data: null };
        }
    }

    // ================================================================
    // 13. GET STORE DETAILS BY ID
    // ================================================================
    async getStoreDetails(storeId: number): Promise<Store | null> {
        try {
            const response = await api.get(`/stores/${storeId}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to get store details:', error);
            return null;
        }
    }

    // ================================================================
    // 14. GET GROUP DETAILS BY ID
    // ================================================================
    async getGroupDetails(groupId: number): Promise<Group | null> {
        try {
            const response = await api.get(`/groups/${groupId}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to get group details:', error);
            return null;
        }
    }

    // ================================================================
    // DEFAULT DATA (for fallback when API fails)
    // ================================================================

    private getDefaultStockSummary(): StockSummary {
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

    private getDefaultStockHealth(): StockHealth {
        return {
            healthy: 0,
            lowStock: 0,
            zeroStock: 0,
            healthyPercent: 0,
            lowStockPercent: 0,
            zeroStockPercent: 0
        };
    }

    private getDefaultDashboardData(): DashboardData {
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
    formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }

    /**
     * Format date
     */
    formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    }

    /**
     * Format date short (for transactions)
     */
    formatDateShort(dateStr: string | null): string {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }

    /**
     * Get initials from name
     */
    getInitials(name: string): string {
        if (!name) return '?';
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
    getStoreName(stores: Store[], storeId: number): string {
        const store = stores.find(s => s.id === storeId);
        return store ? store.name : 'Unknown Store';
    }

    /**
     * Get group name by ID
     */
    getGroupName(groups: Group[], groupId: number): string {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : 'Unknown Group';
    }

    /**
     * Get date range label
     */
    getDateRangeLabel(range: string): string {
        const labels: Record<string, string> = {
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
    getBalanceStatusClass(balance: number, minStock: number): 'normal' | 'low' | 'zero' {
        if (balance === 0) return 'zero';
        if (balance <= minStock) return 'low';
        return 'normal';
    }

    /**
     * Get bar width for charts
     */
    getBarWidth(value: number, max: number): number {
        if (max === 0) return 0;
        return Math.max((value / max) * 100, 5);
    }
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new StoreDashboardService();