import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface BalanceFilters {
    storeId?: number;
    groupId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface BalanceRecord {
    id: number;
    storeId: number;
    storeName: string;
    storeCode: string;
    groupId: number;
    groupName: string;
    groupCode: string;
    itemId: number;
    itemCode: string;
    itemName: string;
    itemCommonName: string;
    uomCode: string;
    uomName: string;
    conversionUomCode: string;
    conversionUomName: string;
    conversionValue: number;
    balance: number;
    minStock: number;
    baseBalance: number;
    status: 'Active' | 'Inactive';
    statusClass: 'normal' | 'low' | 'zero';
    isLowStock: boolean;
    isZeroStock: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BalanceStats {
    totalStores: number;
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
    lowStockItems: number;
    zeroStockItems: number;
    pendingRequestsCount: number;
    totalBalance: number;
}

export interface BalanceHistoryRecord {
    id: number;
    balanceId: number;
    storeName: string;
    groupName: string;
    itemName: string;
    itemCode: string;
    uomCode: string;
    previousBalance: number;
    newBalance: number;
    changeAmount: number;
    transactionType: 'Stock In' | 'Stock Out';
    sourceStore: string | null;
    destinationStore: string | null;
    referenceType: string;
    referenceId: number | null;
    changedBy: string;
    remark: string;
    createdAt: string;
}

export interface BalanceHistoryResponse {
    success: boolean;
    data: BalanceHistoryRecord[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface LowStockItem {
    id: number;
    storeId: number;
    storeName: string;
    groupId: number;
    groupName: string;
    itemId: number;
    itemName: string;
    itemCode: string;
    uomCode: string;
    balance: number;
    minStockAlert: number;
    shortage: number;
}

export interface SummaryByStore {
    storeId: number;
    storeName: string;
    storeCode: string;
    totalItems: number;
    totalBalance: string;
    totalBaseBalance: string;
    activeItems: number;
    inactiveItems: number;
    lowStockItems: number;
    zeroStockItems: number;
    lowStockPercentage: string;
    zeroStockPercentage: string;
}

export interface SummaryByGroup {
    groupId: number;
    groupName: string;
    groupCode: string;
    totalItems: number;
    totalBalance: string;
    totalBaseBalance: string;
    activeItems: number;
    inactiveItems: number;
    lowStockItems: number;
    zeroStockItems: number;
    lowStockPercentage: string;
    zeroStockPercentage: string;
}

export interface SummaryByItem {
    itemId: number;
    itemCode: string;
    itemName: string;
    itemCommonName: string;
    uomCode: string;
    conversionValue: number;
    totalStores: number;
    totalBalance: string;
    totalBaseBalance: string;
    averageBalance: string;
    averageBaseBalance: string;
    minBalance: number;
    maxBalance: number;
    stores: {
        storeId: number;
        storeName: string;
        balance: number;
        baseBalance: number;
        status: string;
    }[];
}

export interface CreateBalancePayload {
    storeId: number;
    groupId: number;
    itemId: number;
    balance: number;
    minStock?: number;
    status?: 'Active' | 'Inactive';
}

export interface UpdateBalancePayload {
    storeId?: number;
    groupId?: number;
    itemId?: number;
    minStock?: number;
    status?: 'Active' | 'Inactive';
}

export interface ProcessRequestsPayload {
    storeId: number;
    groupId: number;
    requestIds: number[];
}

export interface ProcessRequestsResult {
    processed: number;
    failed: number;
    logs: string[];
}

export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

export interface ItemRequest {
    id: number;
    requestCode: string;
    askingStoreId: number;
    askingStoreName: string;
    supplyingStoreId: number;
    supplyingStoreName: string;
    requestedDate: string;
    status: string;
    remark: string;
    items: {
        itemId: number;
        itemName: string;
        itemCode: string;
        quantity: number;
        uomCode: string;
    }[];
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

// ============================================
// STORE TYPES
// ============================================

export interface Store {
    id: number;
    name: string;
    code: string;
    location?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// GROUP TYPES
// ============================================

export interface Group {
    id: number;
    name: string;
    code: string;
    description?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// ITEM TYPES
// ============================================

export interface Item {
    id: number;
    code: string;
    name: string;
    standardName: string;
    commonName?: string;
    description?: string;
    brand?: string;
    model?: string;
    barcode?: string;
    categoryId?: number;
    uomId?: number;
    uomCode?: string;
    uomName?: string;
    conversionUomId?: number;
    conversionUomCode?: string;
    conversionUomName?: string;
    conversionValue: number;
    costPrice?: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
}

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
    async getBalances(filters: BalanceFilters = {}): Promise<PaginatedResponse<BalanceRecord>> {
        const params = new URLSearchParams();
        
        if (filters.storeId) params.append('storeId', filters.storeId.toString());
        if (filters.groupId) params.append('groupId', filters.groupId.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        
        const response = await api.get(`/balances?${params.toString()}`);
        return response.data;
    }

    /**
     * Get balance statistics (dashboard stats)
     */
    async getStats(): Promise<{ success: boolean; data: BalanceStats }> {
        const response = await api.get('/balances/stats');
        return response.data;
    }

    /**
     * Get low stock items
     */
    async getLowStockItems(): Promise<{ success: boolean; data: LowStockItem[] }> {
        const response = await api.get('/balances/low-stock');
        return response.data;
    }

    /**
     * Get balance by ID
     */
    async getBalanceById(id: number): Promise<{ success: boolean; data: BalanceRecord }> {
        const response = await api.get(`/balances/${id}`);
        return response.data;
    }

    /**
     * Create new balance (Initialize)
     */
    async createBalance(payload: CreateBalancePayload): Promise<{ success: boolean; message: string; data: BalanceRecord }> {
        const response = await api.post('/balances', payload);
        return response.data;
    }

    /**
     * Update balance
     */
    async updateBalance(id: number, payload: UpdateBalancePayload): Promise<{ success: boolean; message: string; data: BalanceRecord }> {
        const response = await api.put(`/balances/${id}`, payload);
        return response.data;
    }

    /**
     * Toggle balance status (Active/Inactive)
     */
    async toggleStatus(id: number): Promise<{ success: boolean; message: string; data: { id: number; status: string } }> {
        const response = await api.patch(`/balances/${id}/toggle-status`);
        return response.data;
    }

    /**
     * Delete balance (only if inactive)
     */
    async deleteBalance(id: number): Promise<{ success: boolean; message: string }> {
        const response = await api.delete(`/balances/${id}`);
        return response.data;
    }

    // ================================================================
    // CSV IMPORT / EXPORT
    // ================================================================

    /**
     * Download CSV template for import
     */
    async downloadTemplate(): Promise<Blob> {
        const response = await api.get('/balances/template/download', {
            responseType: 'blob'
        });
        return response.data;
    }

    /**
     * Import balances from CSV file
     */
    async importBalances(file: File): Promise<{ success: boolean; message: string; data: ImportResult }> {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/balances/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    /**
     * Export balances as CSV
     */
    async exportBalances(type: 'full' | 'summary' = 'full'): Promise<Blob> {
        const response = await api.get(`/balances/export?type=${type}`, {
            responseType: 'blob'
        });
        return response.data;
    }

    // ================================================================
    // REQUEST PROCESSING
    // ================================================================

    /**
     * Get approved requests for a store
     */
    async getApprovedRequests(storeId: number): Promise<{ success: boolean; data: ItemRequest[] }> {
        const response = await api.get(`/balances/requests/approved/${storeId}`);
        return response.data;
    }

    /**
     * Process approved requests
     */
    async processRequests(payload: ProcessRequestsPayload): Promise<{ 
        success: boolean; 
        message: string; 
        data: ProcessRequestsResult 
    }> {
        const response = await api.post('/balances/requests/process', payload);
        return response.data;
    }

    // ================================================================
    // HISTORY & SUMMARY
    // ================================================================

    /**
     * Get balance history
     */
    async getBalanceHistory(balanceId: number, page: number = 1, limit: number = 20): Promise<BalanceHistoryResponse> {
        const response = await api.get(`/balances/${balanceId}/history?page=${page}&limit=${limit}`);
        return response.data;
    }

    /**
     * Get summary by store
     */
    async getSummaryByStore(): Promise<{ success: boolean; data: SummaryByStore[] }> {
        const response = await api.get('/balances/summary/by-store');
        return response.data;
    }

    /**
     * Get summary by group
     */
    async getSummaryByGroup(): Promise<{ success: boolean; data: SummaryByGroup[] }> {
        const response = await api.get('/balances/summary/by-group');
        return response.data;
    }

    /**
     * Get summary by item
     */
    async getSummaryByItem(): Promise<{ success: boolean; data: SummaryByItem[] }> {
        const response = await api.get('/balances/summary/by-item');
        return response.data;
    }

    // ================================================================
    // STORE ENDPOINTS
    // ================================================================

    /**
     * Get all stores
     */
    async getStores(params?: { page?: number; limit?: number; search?: string }): Promise<{ success: boolean; data: Store[]; pagination?: any }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await api.get(`/balances/stores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }

    /**
     * Get store by ID
     */
    async getStoreById(id: number): Promise<{ success: boolean; data: Store }> {
        const response = await api.get(`/balances/stores/${id}`);
        return response.data;
    }

    // ================================================================
    // GROUP ENDPOINTS
    // ================================================================

    /**
     * Get all groups
     */
    async getGroups(params?: { page?: number; limit?: number; search?: string }): Promise<{ success: boolean; data: Group[]; pagination?: any }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await api.get(`/balances/groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }

    /**
     * Get group by ID
     */
    async getGroupById(id: number): Promise<{ success: boolean; data: Group }> {
        const response = await api.get(`/balances/groups/${id}`);
        return response.data;
    }

    // ================================================================
    // ITEM ENDPOINTS
    // ================================================================

    /**
     * Get all items
     */
    async getItems(params?: { page?: number; limit?: number; search?: string; categoryId?: number; status?: string }): Promise<PaginatedResponse<Item>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.categoryId) queryParams.append('categoryId', params.categoryId.toString());
        if (params?.status) queryParams.append('status', params.status);
        
        const response = await api.get(`/balances/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }

    /**
     * Get active items (for dropdowns)
     */
    async getActiveItems(): Promise<{ success: boolean; data: Item[] }> {
        const response = await api.get('/balances/items/active');
        return response.data;
    }

    /**
     * Get item by ID
     */
    async getItemById(id: number): Promise<{ success: boolean; data: Item }> {
        const response = await api.get(`/balances/items/${id}`);
        return response.data;
    }

    // ================================================================
    // USER ENDPOINTS
    // ================================================================

    /**
     * Get all users
     */
    async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<{ success: boolean; data: User[]; pagination?: any }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.role) queryParams.append('role', params.role);
        
        const response = await api.get(`/balances/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        return response.data;
    }

    /**
     * Get user by ID
     */
    async getUserById(id: number): Promise<{ success: boolean; data: User }> {
        const response = await api.get(`/balances/users/${id}`);
        return response.data;
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
     * Get balance status class for UI
     */
    getBalanceStatusClass(balance: number, minStock: number): string {
        if (balance === 0) return 'zero';
        if (balance <= minStock) return 'low';
        return 'normal';
    }

    /**
     * Get status label
     */
    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive'
        };
        return labels[status] || status;
    }

    /**
     * Get transaction type label with icon
     */
    getTransactionTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'Stock In': '📥 Stock In',
            'Stock Out': '📤 Stock Out'
        };
        return labels[type] || type;
    }

    /**
     * Get transaction type class for styling
     */
    getTransactionTypeClass(type: string): string {
        return type === 'Stock In' ? 'stock-in' : 'stock-out';
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
            'request': '📋 Request'
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
 * Get groups for a store (or all store-group relations)
 */

    async getStoreGroupRelations(storeId?: number): Promise<{ success: boolean; data: any[] }> {
    const params = new URLSearchParams();
    if (storeId) params.append('storeId', storeId.toString());
    
    const response = await api.get(`/balances/store-group-relations${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
}

    /**
     * Calculate base balance (balance * conversion value)
     */
    calculateBaseBalance(balance: number, conversionValue: number): number {
        return balance * conversionValue;
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
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new BalanceService();