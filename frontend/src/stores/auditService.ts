// services/auditService.ts
// Complete Audit Service - Updated with new endpoints

import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

// ============================================
// BASE TYPES
// ============================================

export interface Store {
    id: number;
    name: string;
    code: string;
    location?: string;
    status: 'Active' | 'Inactive' | 'Closed';
    createdAt?: string;
    updatedAt?: string;
    groups?: StoreGroup[];
}

export interface StoreGroup {
    groupId: number;
    name: string;
    code: string;
    description?: string;
    status: 'Active' | 'Inactive';
}

export interface Group {
    groupId: number;
    id?: number;
    name: string;
    code: string;
    description?: string;
    status: 'Active' | 'Inactive';
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    status: 'Active' | 'Inactive';
}

export interface Item {
    itemId: number;
    id?: number;
    code: string;
    name: string;
    standardName?: string;
    uomCode?: string;
    uomName?: string;
    conversionUomCode?: string;
    conversionUomName?: string;
    conversionValue: number;
    status: 'Active' | 'Inactive';
}

export interface User {
    userId: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
}

// ============================================
// BALANCE TYPES
// ============================================

export interface AuditBalance {
    id: number;
    storeId: number;
    storeName: string | null;
    groupId: number;
    groupName: string | null;
    itemId: number;
    itemCode: string | null;
    itemName: string | null;
    itemCommonName: string | null;
    category: string | null;
    uomCode: string | null;
    uomName: string | null;
    conversionUomCode: string | null;
    conversionValue: number;
    balance: number;
    minStock: number;
    baseBalance: number;
    status: 'Active' | 'Inactive';
    statusClass: 'zero' | 'low' | 'normal';
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export interface AuditTransaction {
    id: number;
    balanceId: number;
    storeName: string | null;
    groupName: string | null;
    itemName: string | null;
    itemCode: string | null;
    uomCode: string | null;
    previousBalance: number;
    newBalance: number;
    changeAmount: number;
    transactionType: 'Stock In' | 'Stock Out' | 'ADJUSTMENT';
    sourceStore: string | null;
    destinationStore: string | null;
    referenceType: string | null;
    referenceId: number | null;
    changedBy: string | null;
    remark: string | null;
    createdAt: string;
}

// ============================================
// SUMMARY TYPES
// ============================================

export interface AuditGroupSummary {
    totalItems: number;
    totalBalance: number;
    totalBaseBalance: number;
    activeItems: number;
    inactiveItems: number;
    lowStockItems: number;
    zeroStockItems: number;
    averageBalance: number;
    lowStockPercentage: number;
    zeroStockPercentage: number;
}

export interface AuditStoreSummary {
    totalGroups: number;
    totalItems: number;
    totalBalance: number;
    totalBaseBalance: number;
    activeItems: number;
    inactiveItems: number;
    matchedItems: number;
    outlierItems: number;
    conflictItems: number;
    totalProducts: number;
    lowStockItems: number;
    zeroStockItems: number;
    healthyItems: number;
    averageBalance: number;
    lowStockPercentage: number;
    zeroStockPercentage: number;
}

// ============================================
// USER ACCESS TYPES
// ============================================

export interface UserAccessData {
    userId: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    isAdmin: boolean;
    hasAssignments: boolean;
    assignedStoreId: number | null;
    assignedGroupId: number | null;
    assignedStore: {
        id: number;
        name: string;
        code: string;
        location: string;
        status: string;
    } | null;
    assignedGroup: {
        id: number;
        name: string;
        code: string;
        description: string;
        status: string;
    } | null;
    allGroups: Array<{
        id: number;
        name: string;
        code: string;
        description: string | null;
        status: string;
        stores: Store[];
        storeId: number | null;
        storeName: string | null;
    }>;
    allStoreGroupRelations: Array<{
        id: number;
        storeId: number;
        storeName: string | null;
        storeCode: string | null;
        groupId: number;
        groupName: string | null;
        groupCode: string | null;
    }>;
}

// ============================================
// AUDIT RESPONSE TYPES
// ============================================

export interface ComparisonItem {
    itemId: number;
    code: string | null;
    itemName: string | null;
    commonName: string | null;
    standardName: string | null;
    category: string | null;
    uomCode: string | null;
    uomName: string | null;
    conversionValue: number;
    groupBalances: Record<number, number>;
    status: 'Matched' | 'Outlier' | 'Conflict' | 'No Data';
    statusClass: 'matched' | 'outlier' | 'conflict' | 'unknown';
    values: number[];
}

export interface GroupAuditData {
    groupId: number;
    name: string;
    code: string;
    description?: string;
    status: 'Active' | 'Inactive';
    balanceCount: number;
    summary: AuditGroupSummary;
    balances: AuditBalance[];
    transactions: AuditTransaction[];
}

export interface StoreAuditResponse {
    store: Store;
    groups: GroupAuditData[];
    summary: AuditStoreSummary;
    comparison: {
        items: ComparisonItem[];
        summary: {
            total: number;
            matched: number;
            outlier: number;
            conflict: number;
            matchedPercentage: string;
            outlierPercentage: string;
            conflictPercentage: string;
        };
    };
}

export interface DashboardResponse {
    store: Store;
    overview: {
        totalGroups: number;
        totalItems: number;
        totalBalance: number;
        totalBaseBalance: number;
        activeItems: number;
        inactiveItems: number;
        zeroStockItems: number;
        lowStockItems: number;
        matchedItems: number;
        outlierItems: number;
        conflictItems: number;
    };
    groups: Array<{
        groupId: number;
        name: string;
        totalItems: number;
        totalBalance: number;
        lowStockItems: number;
        zeroStockItems: number;
        lowStockPercentage: number;
        zeroStockPercentage: number;
    }>;
    recentActivity: AuditTransaction[];
    lowStockAlerts: Array<{
        id: number;
        itemName: string | null;
        itemCode: string | null;
        balance: number;
        minStock: number;
        groupName: string | null;
        uomCode: string | null;
        statusClass: 'critical' | 'warning';
    }>;
    comparisonSummary: {
        total: number;
        matched: number;
        outlier: number;
        conflict: number;
        matchedPercentage: string;
        outlierPercentage: string;
        conflictPercentage: string;
    };
    lastUpdated: string;
}

export interface GroupComparisonResponse {
    store: Store;
    groups: Array<{
        groupId: number;
        name: string;
        code: string;
        status: string;
    }>;
    items: Array<{
        itemId: number;
        itemCode: string | null;
        itemName: string | null;
        uomCode: string | null;
        conversionValue: number;
        groups: Record<string, {
            groupName: string | null;
            balance: number;
            minStock: number;
            status: string;
            baseBalance: number;
        }>;
        status: string;
        statusClass: string;
        totalBalance: number;
        averageBalance: number;
        groupCount: number;
        minBalance: number;
        maxBalance: number;
    }>;
    summary: {
        totalItems: number;
        totalGroups: number;
        totalBalance: number;
        matchedItems: number;
        outlierItems: number;
        conflictItems: number;
    };
}

export interface BalanceSnapshotResponse {
    store: Store;
    group: Group;
    summary: AuditGroupSummary;
    balances: AuditBalance[];
    recentTransactions: AuditTransaction[];
    generatedAt: string;
}

export interface TransactionsResponse {
    summary: {
        storeId: number;
        storeName: string;
        groupId: number;
        groupName: string;
        totalTransactions: number;
        totalPages: number;
        currentPage: number;
        transactionTypes: {
            'Stock In': number;
            'Stock Out': number;
        };
        dateRange: {
            oldest: string | null;
            newest: string | null;
        };
    };
    transactions: AuditTransaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ItemTransactionsResponse {
    store: Store;
    item: {
        id: number;
        code: string;
        name: string;
        standardName: string | null;
        uomCode: string | null;
    };
    currentBalances: Record<number, {
        balance: number;
        minStock: number;
        status: string;
    }>;
    groupTransactions: Record<number, {
        group: {
            id: number;
            name: string;
            code: string;
        };
        transactions: AuditTransaction[];
        count: number;
    }>;
    summary: {
        totalGroups: number;
        totalTransactions: number;
    };
}

// ============================================
// STORES & CATEGORIES RESPONSE
// ============================================

export interface StoresWithGroupsResponse {
    success: boolean;
    data: Array<{
        id: number;
        name: string;
        code: string;
        location?: string;
        status: string;
        groups: Array<{
            groupId: number;
            name: string;
            code: string;
            description?: string;
            status: string;
        }>;
    }>;
}

export interface CategoriesResponse {
    success: boolean;
    data: Array<{
        id: number;
        name: string;
        description?: string;
        status: string;
    }>;
}

// ============================================
// PAGINATION TYPES
// ============================================

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

// ============================================
// REQUEST/OPTIONS TYPES
// ============================================

export interface AuditOptions {
    includeTransactions?: boolean;
    transactionLimit?: number;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
}

export interface ExportOptions {
    includeTransactions?: boolean;
}

// ============================================
// AUDIT SERVICE CLASS
// ============================================

class AuditService {
    // ================================================================
    // USER ACCESS
    // ================================================================

    /**
     * Get current user's store and group access for audit
     */
    async getUserAccess(): Promise<{ success: boolean; data: UserAccessData }> {
        const response = await api.get('/audit/user/access');
        return response.data;
    }

    // ================================================================
    // STORES & CATEGORIES (for filters)
    // ================================================================

    /**
     * Get all stores with their groups for the dropdown
     */
    async getStoresWithGroups(): Promise<StoresWithGroupsResponse> {
        const response = await api.get('/audit/stores');
        return response.data;
    }

    /**
     * Get all categories for the filter dropdown
     */
    async getCategories(): Promise<CategoriesResponse> {
        const response = await api.get('/audit/categories');
        return response.data;
    }

    // ================================================================
    // STORE AUDIT
    // ================================================================

    /**
     * Get complete audit data for a store
     * This returns data structured for the comparison table
     */
    async getStoreAudit(
        storeId: number,
        options: AuditOptions = { includeTransactions: true, transactionLimit: 10 }
    ): Promise<{ success: boolean; data: StoreAuditResponse }> {
        const params = new URLSearchParams();
        if (options.includeTransactions !== undefined) {
            params.append('includeTransactions', String(options.includeTransactions));
        }
        if (options.transactionLimit) {
            params.append('transactionLimit', String(options.transactionLimit));
        }

        const url = `/audit/store/${storeId}${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    }

    /**
     * Get high-level audit summary for a store
     */
    async getAuditSummary(storeId: number): Promise<{ success: boolean; data: any }> {
        const response = await api.get(`/audit/store/${storeId}/summary`);
        return response.data;
    }

    /**
     * Get dashboard view with overview, group summaries, recent activity, and alerts
     */
    async getAuditDashboard(storeId: number): Promise<{ success: boolean; data: DashboardResponse }> {
        const response = await api.get(`/audit/store/${storeId}/dashboard`);
        return response.data;
    }

    /**
     * Export audit data to CSV
     */
    async exportAuditData(
        storeId: number,
        options: ExportOptions = { includeTransactions: true }
    ): Promise<Blob> {
        const params = new URLSearchParams();
        params.append('format', 'csv');
        if (options.includeTransactions !== undefined) {
            params.append('includeTransactions', String(options.includeTransactions));
        }

        const response = await api.get(`/audit/store/${storeId}/export?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    }

    // ================================================================
    // GROUP COMPARISON
    // ================================================================

    /**
     * Compare all groups in a store side by side
     */
    async compareGroups(storeId: number): Promise<{ success: boolean; data: GroupComparisonResponse }> {
        const response = await api.get(`/audit/store/${storeId}/groups/compare`);
        return response.data;
    }

    /**
     * Get complete balance snapshot for a specific store-group combination
     */
    async getBalanceSnapshot(
        storeId: number,
        groupId: number
    ): Promise<{ success: boolean; data: BalanceSnapshotResponse }> {
        const response = await api.get(`/audit/store/${storeId}/group/${groupId}/snapshot`);
        return response.data;
    }

    /**
     * Get transaction history for a specific store-group
     */
    async getGroupTransactions(
        storeId: number,
        groupId: number,
        options: PaginationOptions = { page: 1, limit: 10 }
    ): Promise<{ success: boolean; data: TransactionsResponse }> {
        const params = new URLSearchParams();
        if (options.page) params.append('page', String(options.page));
        if (options.limit) params.append('limit', String(options.limit));

        const url = `/audit/store/${storeId}/group/${groupId}/transactions${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    }

    // ================================================================
    // ITEM TRANSACTIONS
    // ================================================================

    /**
     * Get transaction history for a specific item across all groups
     */
    async getItemTransactions(
        storeId: number,
        itemId: number,
        limit: number = 10
    ): Promise<{ success: boolean; data: ItemTransactionsResponse }> {
        const response = await api.get(`/audit/store/${storeId}/item/${itemId}/transactions?limit=${limit}`);
        return response.data;
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    /**
     * Download exported file
     */
    downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Format balance for display
     */
    formatBalance(balance: AuditBalance): AuditBalance & {
        formattedBalance: string;
        formattedMinStock: string;
        formattedBaseBalance: string;
    } {
        return {
            ...balance,
            balance: Number(balance.balance) || 0,
            minStock: Number(balance.minStock) || 0,
            baseBalance: Number(balance.baseBalance) || 0,
            statusClass: balance.statusClass || 'normal',
            formattedBalance: (Number(balance.balance) || 0).toFixed(2),
            formattedMinStock: (Number(balance.minStock) || 0).toFixed(2),
            formattedBaseBalance: (Number(balance.baseBalance) || 0).toFixed(2),
        };
    }

    /**
     * Format transaction for display
     */
    formatTransaction(transaction: AuditTransaction): AuditTransaction & {
        formattedChange: string;
        formattedPrevious: string;
        formattedNew: string;
        isStockIn: boolean;
        isStockOut: boolean;
        date: string;
        time: string;
        formattedDate: string;
    } {
        return {
            ...transaction,
            changeAmount: Number(transaction.changeAmount) || 0,
            previousBalance: Number(transaction.previousBalance) || 0,
            newBalance: Number(transaction.newBalance) || 0,
            formattedChange: (Number(transaction.changeAmount) || 0).toFixed(2),
            formattedPrevious: (Number(transaction.previousBalance) || 0).toFixed(2),
            formattedNew: (Number(transaction.newBalance) || 0).toFixed(2),
            isStockIn: transaction.transactionType === 'Stock In',
            isStockOut: transaction.transactionType === 'Stock Out',
            date: new Date(transaction.createdAt).toLocaleDateString(),
            time: new Date(transaction.createdAt).toLocaleTimeString(),
            formattedDate: new Date(transaction.createdAt).toLocaleString(),
        };
    }

    /**
     * Calculate summary from balances
     */
    calculateSummary(balances: AuditBalance[]): AuditStoreSummary {
        const totalItems = balances.length;
        const totalBalance = balances.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
        const activeItems = balances.filter(b => b.status === 'Active').length;
        const inactiveItems = balances.filter(b => b.status !== 'Active').length;
        const zeroStockItems = balances.filter(b => Number(b.balance) === 0).length;
        const lowStockItems = balances.filter(b => {
            const balance = Number(b.balance);
            const minStock = Number(b.minStock || 0);
            return balance > 0 && balance <= minStock;
        }).length;

        // Calculate comparison stats
        const itemMap = new Map();
        balances.forEach(b => {
            if (!itemMap.has(b.itemId)) {
                itemMap.set(b.itemId, {
                    itemId: b.itemId,
                    balances: []
                });
            }
            itemMap.get(b.itemId).balances.push(Number(b.balance));
        });

        let matchedItems = 0;
        let outlierItems = 0;
        let conflictItems = 0;

        itemMap.forEach((item) => {
            const values = item.balances;
            const uniqueValues = [...new Set(values)];
            if (uniqueValues.length === 1) matchedItems++;
            else if (uniqueValues.length === 2) outlierItems++;
            else if (uniqueValues.length > 2) conflictItems++;
        });

        return {
            totalItems,
            totalBalance,
            totalBaseBalance: balances.reduce((sum, b) => sum + (Number(b.baseBalance) || 0), 0),
            activeItems,
            inactiveItems,
            zeroStockItems,
            lowStockItems,
            matchedItems,
            outlierItems,
            conflictItems,
            totalProducts: itemMap.size,
            healthyItems: activeItems - zeroStockItems - lowStockItems,
            averageBalance: totalItems > 0 ? totalBalance / totalItems : 0,
            lowStockPercentage: activeItems > 0 ? ((lowStockItems / activeItems) * 100) : 0,
            zeroStockPercentage: activeItems > 0 ? ((zeroStockItems / activeItems) * 100) : 0,
            totalGroups: 0,
        };
    }

    /**
     * Get status class for balance
     */
    getBalanceStatusClass(balance: number, minStock: number): 'zero' | 'low' | 'normal' {
        if (balance === 0) return 'zero';
        if (balance <= minStock) return 'low';
        return 'normal';
    }

    /**
     * Get status label for UI
     */
    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive',
            'Matched': '✅ Matched',
            'Outlier': '⚠️ Outlier',
            'Conflict': '🚨 Conflict',
            'No Data': '📭 No Data'
        };
        return labels[status] || status;
    }

    /**
     * Get comparison status class
     */
    getComparisonStatusClass(status: string): string {
        const map: Record<string, string> = {
            'Matched': 'matched',
            'Outlier': 'outlier',
            'Conflict': 'conflict',
            'No Data': 'unknown'
        };
        return map[status] || 'unknown';
    }

    /**
     * Get transaction type label with icon
     */
    getTransactionTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'Stock In': '📥 Stock In',
            'Stock Out': '📤 Stock Out',
            'ADJUSTMENT': '📊 Adjustment'
        };
        return labels[type] || type;
    }

    /**
     * Get transaction type CSS class
     */
    getTransactionTypeClass(type: string): string {
        const map: Record<string, string> = {
            'Stock In': 'stock-in',
            'Stock Out': 'stock-out',
            'ADJUSTMENT': 'adjustment'
        };
        return map[type] || 'adjustment';
    }

    /**
     * Get reference type label
     */
    getReferenceTypeLabel(type: string): string {
        const labels: Record<string, string> = {
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
    getBalanceValueClass(balance: number, minStock: number): string {
        if (balance === 0) return 'text-danger';
        if (balance <= minStock) return 'text-warning';
        return 'text-success';
    }

    /**
     * Check if stock is low
     */
    isLowStock(balance: number, minStock: number): boolean {
        return balance <= minStock && balance > 0;
    }

    /**
     * Check if stock is zero
     */
    isZeroStock(balance: number): boolean {
        return balance === 0;
    }

    /**
     * Get low stock warning message
     */
    getLowStockMessage(balance: number, minStock: number, itemName: string): string {
        if (balance === 0) {
            return `⚠️ ${itemName} is out of stock!`;
        }
        if (balance <= minStock) {
            return `⚠️ ${itemName} is low on stock (${balance} remaining, minimum ${minStock})`;
        }
        return '';
    }

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
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format datetime
     */
    formatDateTime(dateStr: string | null): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Calculate shortage amount
     */
    calculateShortage(balance: number, minStock: number): number {
        if (balance >= minStock) return 0;
        return minStock - balance;
    }

    /**
     * Group balances by status
     */
    groupByStatus(balances: AuditBalance[]): {
        active: AuditBalance[];
        inactive: AuditBalance[];
    } {
        return {
            active: balances.filter(b => b.status === 'Active'),
            inactive: balances.filter(b => b.status !== 'Active'),
        };
    }

    /**
     * Group comparison items by status
     */
    groupComparisonByStatus(items: ComparisonItem[]): {
        matched: ComparisonItem[];
        outlier: ComparisonItem[];
        conflict: ComparisonItem[];
        noData: ComparisonItem[];
    } {
        return {
            matched: items.filter(i => i.status === 'Matched'),
            outlier: items.filter(i => i.status === 'Outlier'),
            conflict: items.filter(i => i.status === 'Conflict'),
            noData: items.filter(i => i.status === 'No Data'),
        };
    }

    /**
     * Get top N low stock items
     */
    getTopLowStockItems(balances: AuditBalance[], limit: number = 10): AuditBalance[] {
        return balances
            .filter(b => b.status === 'Active' && Number(b.balance) <= Number(b.minStock) && Number(b.balance) > 0)
            .sort((a, b) => {
                const shortageA = Number(a.minStock) - Number(a.balance);
                const shortageB = Number(b.minStock) - Number(b.balance);
                return shortageB - shortageA;
            })
            .slice(0, limit);
    }

    /**
     * Get top N zero stock items
     */
    getTopZeroStockItems(balances: AuditBalance[], limit: number = 10): AuditBalance[] {
        return balances
            .filter(b => b.status === 'Active' && Number(b.balance) === 0)
            .slice(0, limit);
    }

    /**
     * Check if a store has any low stock items
     */
    hasLowStockItems(balances: AuditBalance[]): boolean {
        return balances.some(b => 
            b.status === 'Active' && 
            Number(b.balance) <= Number(b.minStock) && 
            Number(b.balance) > 0
        );
    }

    /**
     * Check if a store has any zero stock items
     */
    hasZeroStockItems(balances: AuditBalance[]): boolean {
        return balances.some(b => b.status === 'Active' && Number(b.balance) === 0);
    }

    /**
     * Get store health status
     */
    getStoreHealthStatus(balances: AuditBalance[]): {
        status: 'healthy' | 'warning' | 'critical';
        message: string;
    } {
        const activeBalances = balances.filter(b => b.status === 'Active');
        const zeroCount = activeBalances.filter(b => Number(b.balance) === 0).length;
        const lowCount = activeBalances.filter(b => {
            const balance = Number(b.balance);
            const minStock = Number(b.minStock || 0);
            return balance > 0 && balance <= minStock;
        }).length;

        if (zeroCount > 0) {
            return {
                status: 'critical',
                message: `${zeroCount} item(s) out of stock`
            };
        }
        if (lowCount > 0) {
            return {
                status: 'warning',
                message: `${lowCount} item(s) low on stock`
            };
        }
        return {
            status: 'healthy',
            message: 'All items are in stock'
        };
    }

    /**
     * Get comparison summary from audit data
     */
    getComparisonSummary(comparison: { items: ComparisonItem[]; summary: any }) {
        return {
            ...comparison.summary,
            items: comparison.items,
        };
    }
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================

export default new AuditService();