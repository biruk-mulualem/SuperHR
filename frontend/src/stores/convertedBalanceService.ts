// stores/convertedBalanceService.ts
// COMPLETE SERVICE WITH AUTH STORE INTEGRATION

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
    remark?: string;
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

export interface StockInData {
    storeId: number;
    groupId: number;
    itemId: number;
    itemCode: string;
    itemName: string;
    uomCode: string;
    quantity: number;
    conversionRate?: number;
    sourceUomId?: number;
    targetUomId?: number;
    reason?: string | null;
}

export interface StockOutData {
    storeId: number;
    groupId: number;
    itemId: number;
    itemCode: string;
    itemName: string;
    uomCode: string;
    quantity: number;
    conversionRate?: number;
    sourceUomId?: number;
    targetUomId?: number;
    reason?: string | null;
}

export interface StockResponse {
    success: boolean;
    message?: string;
    data?: {
        id: number;
        itemCode: string;
        itemName: string;
        uomCode: string;
        previousBalance: number;
        newBalance: number;
        changeAmount: number;
        operation: string;
        reason: string | null;
        storeId: number;
        groupId: number;
    };
    error?: string;
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

    /**
     * ================================================================
     * ✅ STOCK IN - Add stock to converted balance (creates if not exists)
     * ================================================================
     */
    async stockIn(data: StockInData): Promise<StockResponse> {
        try {
            const authStore = useAuthStore();
            
            console.log('📥 Stock In:', {
                itemCode: data.itemCode,
                quantity: data.quantity,
                uomCode: data.uomCode,
                storeId: data.storeId,
                groupId: data.groupId,
                reason: data.reason,
                user: authStore.user?.username
            });

            if (!data.storeId || !data.groupId || !data.itemId || !data.quantity) {
                return {
                    success: false,
                    error: 'Missing required fields: storeId, groupId, itemId, quantity'
                };
            }

            const response = await api.post('/converted-balances/stock-in', {
                storeId: data.storeId,
                groupId: data.groupId,
                itemId: data.itemId,
                itemCode: data.itemCode,
                itemName: data.itemName,
                uomCode: data.uomCode,
                quantity: data.quantity,
                conversionRate: data.conversionRate || 1,
                sourceUomId: data.sourceUomId || null,
                targetUomId: data.targetUomId || null,
                reason: data.reason || null
            });
            
            return {
                success: true,
                message: response.data?.message || 'Stock added successfully',
                data: response.data?.data
            };
        } catch (error: any) {
            console.error('❌ Stock In error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to add stock'
            };
        }
    }

    /**
     * ================================================================
     * ✅ STOCK OUT - Remove stock from converted balance
     * ================================================================
     */
    async stockOut(data: StockOutData): Promise<StockResponse> {
        try {
            const authStore = useAuthStore();
            
            console.log('📤 Stock Out:', {
                itemCode: data.itemCode,
                quantity: data.quantity,
                uomCode: data.uomCode,
                storeId: data.storeId,
                groupId: data.groupId,
                reason: data.reason,
                user: authStore.user?.username
            });

            if (!data.storeId || !data.groupId || !data.itemId || !data.quantity) {
                return {
                    success: false,
                    error: 'Missing required fields: storeId, groupId, itemId, quantity'
                };
            }

            const response = await api.post('/converted-balances/stock-out', {
                storeId: data.storeId,
                groupId: data.groupId,
                itemId: data.itemId,
                itemCode: data.itemCode,
                itemName: data.itemName,
                uomCode: data.uomCode,
                quantity: data.quantity,
                conversionRate: data.conversionRate || 1,
                sourceUomId: data.sourceUomId || null,
                targetUomId: data.targetUomId || null,
                reason: data.reason || null
            });
            
            return {
                success: true,
                message: response.data?.message || 'Stock removed successfully',
                data: response.data?.data
            };
        } catch (error: any) {
            console.error('❌ Stock Out error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to remove stock'
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
     * PERFORM CONVERSION
     * ================================================================
     */
    async convert(items: ConversionItem[]): Promise<ConversionResponse> {
        const authStore = useAuthStore();
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;

        console.log('🔐 Conversion request:', {
            storeId,
            groupId,
            itemCount: items.length,
            isAuthenticated: authStore.isAuthenticated,
            user: authStore.user?.username
        });

        if (!storeId || !groupId) {
            console.error('❌ Missing store or group for conversion');
            throw new Error('User store or group not found. Please re-login.');
        }

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
    async delete(id: number): Promise<{ success: boolean; message: string }> {
        const authStore = useAuthStore();
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;

        if (!storeId || !groupId) {
            throw new Error('User store or group not found. Please re-login.');
        }

        const response = await api.delete(`/converted-balances/${id}?storeId=${storeId}&groupId=${groupId}`);
        return response.data;
    }

    /**
     * ================================================================
     * BULK DELETE CONVERTED BALANCES
     * ================================================================
     */
    async bulkDelete(ids: number[]): Promise<{ success: boolean; message: string; data?: any }> {
        const authStore = useAuthStore();
        const storeId = authStore.userStoreId;
        const groupId = authStore.userGroupId;

        if (!storeId || !groupId) {
            throw new Error('User store or group not found. Please re-login.');
        }

        const response = await api.delete(`/converted-balances/bulk`, {
            data: { ids, storeId, groupId }
        });
        return response.data;
    }

    /**
     * ================================================================
     * GET CONVERTED BALANCE BY ITEM
     * ================================================================
     */
    async getByItemId(itemId: number, filters: {
        storeId?: number;
        groupId?: number;
    } = {}): Promise<{ success: boolean; data: ConvertedBalanceRecord | null }> {
        const authStore = useAuthStore();
        const storeId = filters.storeId || authStore.userStoreId;
        const groupId = filters.groupId || authStore.userGroupId;

        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId.toString());
        if (groupId) params.append('groupId', groupId.toString());

        const response = await api.get(`/converted-balances/item/${itemId}?${params.toString()}`);
        return response.data;
    }

    /**
     * ================================================================
     * UPDATE CONVERTED BALANCE
     * ================================================================
     */
    async update(id: number, data: {
        convertedBalance?: number;
    }): Promise<{ success: boolean; data?: ConvertedBalanceRecord; error?: string }> {
        try {
            const response = await api.put(`/converted-balances/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Update converted balance error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update converted balance'
            };
        }
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

    /**
     * ================================================================
     * VALIDATION HELPERS
     * ================================================================
     */

    validateBalance(balance: number): boolean {
        return balance !== undefined && balance !== null && balance >= 0;
    }

    validateQuantity(quantity: number): boolean {
        return quantity !== undefined && quantity !== null && quantity > 0;
    }

    validateStoreGroup(storeId: number, groupId: number): boolean {
        return storeId !== undefined && storeId !== null && 
               groupId !== undefined && groupId !== null;
    }

    /**
     * ================================================================
     * CALCULATION HELPERS
     * ================================================================
     */

    calculateConvertedAmount(quantity: number, conversionRate: number): number {
        return quantity * conversionRate;
    }

    calculateNewBalance(currentBalance: number, changeAmount: number, operation: 'add' | 'subtract'): number {
        if (operation === 'add') {
            return currentBalance + changeAmount;
        } else {
            return Math.max(0, currentBalance - changeAmount);
        }
    }

    /**
     * ================================================================
     * DISPLAY HELPERS
     * ================================================================
     */

    getUomDisplay(uomCode: string | null): string {
        return uomCode || 'N/A';
    }

    getItemDisplay(itemCode: string, itemName: string): string {
        return `${itemCode} - ${itemName}`;
    }

    getBalanceDisplay(balance: number, uomCode: string): string {
        return `${this.formatNumber(balance)} ${this.getUomDisplay(uomCode)}`;
    }

    getOperationDisplay(operation: 'add' | 'subtract' | 'in' | 'out'): string {
        const map: Record<string, string> = {
            'add': '📥 Stock In',
            'in': '📥 Stock In',
            'subtract': '📤 Stock Out',
            'out': '📤 Stock Out'
        };
        return map[operation] || operation;
    }

    getOperationEmoji(operation: 'add' | 'subtract' | 'in' | 'out'): string {
        const map: Record<string, string> = {
            'add': '📥',
            'in': '📥',
            'subtract': '📤',
            'out': '📤'
        };
        return map[operation] || '🔄';
    }
}

// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new ConvertedBalanceService();