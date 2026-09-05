// stores/convertedBalanceService.ts
// COMPLETE SERVICE WITH AUTH STORE INTEGRATION - NO MIDDLEWARE CHANGES

import api from "./interceptor";
import { useAuthStore } from '@/stores/auth';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ConvertedBalanceFilters {
    storeId?: number;
    groupId?: number;
    categoryId?: number;
    uomId?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface ConvertedBalanceRecord {
    id: number;
    storeId: number;
    groupId: number;
    itemId: number;
    itemCode: string;
    itemName: string;
    categoryName: string;
    uomCode: string;
    convertedBalance: number;
    storeName: string;
    groupName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConvertedBalanceStats {
    totalItems: number;
    totalBalance: number;
    convertibleItems: number;
    zeroStock: number;
}

export interface AvailableItem {
    id: number;
    balanceId: number;
    storeId: number;
    groupId: number;
    itemCode: string;
    itemName: string;
    categoryName: string;
    uomCode: string;
    balance: number;
    convertToUom: string;
    conversionRate: number;
    canConvert: boolean;
    isConverted: boolean;
    sourceUomId: number;
    targetUomId: number;
}

export interface ConversionItem {
    balanceId: number;
    itemId: number;
    quantity: number;
    conversionRate: number;
    sourceUomId: number;
    targetUomId: number;
    itemCode: string;
    itemName: string;
    uomCode: string;
    convertToUom: string;
}

export interface ConversionResult {
    itemCode: string;
    itemName: string;
    sourceUom: string;
    targetUom: string;
    quantityConverted: number;
    convertedAmount: number;
    sourceBalanceBefore: number;
    sourceBalanceAfter: number;
    convertedBalanceBefore: number;
    convertedBalanceAfter: number;
    status: string;
}

export interface ConversionResponse {
    success: boolean;
    message: string;
    data: {
        conversions: ConversionResult[];
        errors?: {
            itemCode: string;
            error: string;
        }[];
    };
}

export interface ConversionPreview {
    itemCode: string;
    itemName: string;
    sourceUom: string;
    targetUom: string;
    currentBalance: number;
    quantityToConvert: number;
    convertedAmount: number;
    balanceAfter: number;
    currentConvertedBalance: number;
    convertedBalanceAfter: number;
    hasExistingConverted: boolean;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    };
}

// ============================================
// CONVERTED BALANCE SERVICE CLASS
// ============================================

class ConvertedBalanceService {
    /**
     * ================================================================
     * GET CONVERTED BALANCES (Main Table)
     * ================================================================
     */
    async getConvertedBalances(filters: ConvertedBalanceFilters = {}): Promise<PaginatedResponse<ConvertedBalanceRecord>> {
        // 🔥 Get store/group from auth store
        const authStore = useAuthStore();
        const storeId = filters.storeId || authStore.userStoreId;
        const groupId = filters.groupId || authStore.userGroupId;

        const params = new URLSearchParams();
        
        if (storeId) params.append('storeId', storeId.toString());
        if (groupId) params.append('groupId', groupId.toString());
        if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters.uomId) params.append('uomId', filters.uomId.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        
        const response = await api.get(`/converted-balances?${params.toString()}`);
        return response.data;
    }

    /**
     * ================================================================
     * GET AVAILABLE ITEMS FOR CONVERSION (Dropdown)
     * ================================================================
     */
    async getAvailableItems(filters: {
        storeId?: number;
        groupId?: number;
        categoryId?: number;
        uomId?: number;
        search?: string;
    } = {}): Promise<{ success: boolean; data: AvailableItem[] }> {
        // 🔥 Get store/group from auth store
        const authStore = useAuthStore();
        const storeId = filters.storeId || authStore.userStoreId;
        const groupId = filters.groupId || authStore.userGroupId;

        const params = new URLSearchParams();
        
        if (storeId) params.append('storeId', storeId.toString());
        if (groupId) params.append('groupId', groupId.toString());
        if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters.uomId) params.append('uomId', filters.uomId.toString());
        if (filters.search) params.append('search', filters.search);
        
        const response = await api.get(`/converted-balances/available?${params.toString()}`);
        return response.data;
    }


// stores/convertedBalanceService.ts

/**
 * ================================================================
 * CREATE/INITIALIZE CONVERTED BALANCE
 * ================================================================
 */
async createBalance(data: {
    storeId: number;
    groupId: number;
    itemId: number;
    convertedBalance: number;
}): Promise<{ 
    success: boolean; 
    data?: ConvertedBalanceRecord; 
    error?: string;
    message?: string;
    alreadyExists?: boolean;
}> {
    try {
        const authStore = useAuthStore();
        
        console.log('📦 Creating converted balance:', {
            storeId: data.storeId,
            groupId: data.groupId,
            itemId: data.itemId,
            convertedBalance: data.convertedBalance,
            user: authStore.user?.username
        });

        const response = await api.post('/converted-balances', {
            storeId: data.storeId,
            groupId: data.groupId,
            itemId: data.itemId,
            convertedBalance: data.convertedBalance
        });

        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message || 'Converted balance initialized successfully'
        };
    } catch (error: any) {
        console.error('❌ Create converted balance error:', error);
        
        // 🔥 Handle 409 Conflict - Already exists
        if (error.response?.status === 409) {
            return {
                success: false,
                error: error.response?.data?.error || 'Converted balance already exists',
                message: error.response?.data?.message || 'This item already has a converted balance record.',
                alreadyExists: true,
                data: error.response?.data?.data
            };
        }
        
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to create converted balance'
        };
    }
}
    /**
     * ================================================================
     * GET STATISTICS
     * ================================================================
     */
    async getStats(filters: {
        storeId?: number;
        groupId?: number;
    } = {}): Promise<{ success: boolean; data: ConvertedBalanceStats }> {
        // 🔥 Get store/group from auth store
        const authStore = useAuthStore();
        const storeId = filters.storeId || authStore.userStoreId;
        const groupId = filters.groupId || authStore.userGroupId;

        const params = new URLSearchParams();
        
        if (storeId) params.append('storeId', storeId.toString());
        if (groupId) params.append('groupId', groupId.toString());
        
        const response = await api.get(`/converted-balances/stats?${params.toString()}`);
        return response.data;
    }

    /**
     * ================================================================
     * GET SINGLE CONVERTED BALANCE
     * ================================================================
     */
    async getById(id: number): Promise<{ success: boolean; data: ConvertedBalanceRecord }> {
        const response = await api.get(`/converted-balances/${id}`);
        return response.data;
    }

    /**
     * ================================================================
     * PERFORM CONVERSION - 🔥 SEND storeId/groupId IN BODY
     * ================================================================
     */
    async convert(items: ConversionItem[]): Promise<ConversionResponse> {
        // 🔥 Get store/group from auth store
        const authStore = useAuthStore();
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;

        // 🔥 Log for debugging
        console.log('🔐 Conversion request:', {
            storeId,
            groupId,
            itemCount: items.length,
            isAuthenticated: authStore.isAuthenticated,
            user: authStore.user?.username
        });

        // 🔥 Validate we have store/group
        if (!storeId || !groupId) {
            console.error('❌ Missing store or group for conversion');
            throw new Error('User store or group not found. Please re-login.');
        }

        // 🔥 Send EVERYTHING in the request body
        // The backend will use these values directly
        const response = await api.post('/converted-balances/convert', { 
            items,
            storeId: Number(storeId),
            groupId: Number(groupId),
            userId: authStore.user?.userId,
            username: authStore.user?.username
        });
        
        return response.data;
    }

    /**
     * ================================================================
     * PREVIEW CONVERSION (Dry Run)
     * ================================================================
     */
    async previewConversion(items: Partial<ConversionItem>[]): Promise<{
        success: boolean;
        data: ConversionPreview[];
    }> {
        const response = await api.post('/converted-balances/preview', { items });
        return response.data;
    }

    /**
     * ================================================================
     * DELETE CONVERTED BALANCE
     * ================================================================
     */

/**
 * ================================================================
 * DELETE CONVERTED BALANCE
 * ================================================================
 */
async delete(id: number): Promise<{ success: boolean; message: string }> {
    // 🔥 Get store/group from auth store
    const authStore = useAuthStore();
    const storeId = authStore.userStoreId;
    const groupId = authStore.userGroupId;

    if (!storeId || !groupId) {
        throw new Error('User store or group not found. Please re-login.');
    }

    // 🔥 Pass storeId and groupId as query parameters
    const response = await api.delete(`/converted-balances/${id}?storeId=${storeId}&groupId=${groupId}`);
    return response.data;
}

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }

    formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

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

    getBalanceStatusClass(balance: number): string {
        if (balance === 0) return 'zero';
        if (balance < 100) return 'low';
        if (balance < 500) return 'medium';
        return 'normal';
    }

    getBalanceValueClass(balance: number): string {
        if (balance === 0) return 'text-danger';
        if (balance < 100) return 'text-warning';
        return 'text-success';
    }

    isZeroStock(balance: number): boolean {
        return balance === 0;
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive',
            'Completed': '✅ Completed',
            'Pending': '⏳ Pending',
            'Failed': '❌ Failed'
        };
        return labels[status] || status;
    }

    getConversionStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'success': 'status-success',
            'failed': 'status-failed',
            'pending': 'status-pending'
        };
        return classes[status] || '';
    }
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new ConvertedBalanceService();