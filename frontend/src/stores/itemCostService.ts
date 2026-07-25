// stores/itemCostService.ts
import api from './interceptor';

// ================================================================
// TYPES
// ================================================================

export interface ItemCostData {
  id: number;
  itemCode: string;
  itemName: string;
  itemStandardName: string;
  categoryName: string;
  brand: string;
  model: string;
  baseUOM: string;
  conversionUOM: string | null; // ← ADD THIS
  conversionValue: number; // ← ADD THIS
  unitCost: number;
  totalQty: number;
  totalCost: number;
  status: 'Active' | 'Partial' | 'Inactive' | 'Conflict' | 'Error' | 'Incomplete';
  statusMessage: string;
  userStatus: 'Active' | 'Inactive';
  storeBreakdown: StoreBreakdown[];
  excludedStores: string[];
  costHistory: CostHistory[];
  includedStoresCount: number;
  excludedStoresCount: number;
  isFiltered: boolean;
  hasMissingData: boolean;
  missingData: string[];
  requiresSetup: boolean;
  isExcluded: boolean;
  exclusionReason: string | null;
}
export interface StoreBreakdown {
  storeId: number;
  storeName: string;
  hasConflict: boolean;
  isExcluded: boolean;
  agreedQuantity: number;
  groups: GroupBreakdown[];
}

export interface GroupBreakdown {
  groupId: number;
  groupName: string;
  quantity: number;
  originalQuantity: number;
  originalUOM: string;
  conversionRate: number;
  baseQuantity: number;
  balanceId: number;
}

export interface CostHistory {
  id: number;
  previousCost: number;
  newCost: number;
  reason: string;
  changedBy: string;
  createdAt: string;
}

export interface Store {
  id: number;
  name: string;
  code: string;
}

export interface Group {
  id: number;
  name: string;
  code: string;
}

export interface CostSummary {
  totalItems: number;
  totalValue: number;
  partialItems: number;
  storeCount: number;
  activeItems: number;
  incompleteItems: number;
  errorItems: number;
  excludedItems: number;
}

export interface ExportItem {
  'Item Code': string;
  'Item Name': string;
  'Standard Name': string;
  'Category': string;
  'Brand': string;
  'Model': string;
  'Base UOM': string;
  'Unit Cost': string;
  'Total Quantity': number;
  'Total Cost': string;
  'Status': string;
  'Status Message': string;
  'Excluded Stores': string;
  'Is Excluded'?: string;
  'Exclusion Reason'?: string;
}

export interface ExcludedItem {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  reason: string;
  excludedBy: string;
  excludedAt: string;
  createdAt: string;
  itemStatus: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  error?: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateCostResponse {
  success: boolean;
  message?: string;
  data?: ItemCostData;
  error?: string;
}

export interface ToggleStatusResponse {
  success: boolean;
  message: string;
  data: {
    item: ItemCostData;
    isExcluded: boolean;
    exclusionReason: string | null;
    exclusionRecord?: {
      id: number;
      itemId: number;
      reason: string;
      excludedAt: string;
      excludedBy: number;
    } | null;
  };
  error?: string;
}

export interface BulkExclusionResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    success: number;
    failed: number;
    results: Array<{
      itemId: number;
      success: boolean;
      error?: string;
    }>;
  };
  error?: string;
}

// ================================================================
// ITEM COST SERVICE
// ================================================================

class ItemCostService {
  // ================================================================
  // 📊 DROPDOWN DATA
  // ================================================================

  /**
   * Get stores for dropdown filter
   * GET /api/item-costs/stores
   */
  async getStores(): Promise<{
    success: boolean;
    data: Store[];
    error?: string;
  }> {
    try {
      const response = await api.get('/item-costs/stores');
      return response.data;
    } catch (error: any) {
      console.error('Get stores error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to get stores',
      };
    }
  }

  /**
   * Get groups for dropdown filter
   * GET /api/item-costs/groups
   */
  async getGroups(): Promise<{
    success: boolean;
    data: Group[];
    error?: string;
  }> {
    try {
      const response = await api.get('/item-costs/groups');
      return response.data;
    } catch (error: any) {
      console.error('Get groups error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to get groups',
      };
    }
  }

  // ================================================================
  // 📈 COST SUMMARY
  // ================================================================

  /**
   * Get cost summary statistics
   * GET /api/item-costs/summary
   */
  async getCostSummary(params?: {
    storeId?: number;
    groupId?: number;
  }): Promise<{
    success: boolean;
    data?: CostSummary;
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params?.groupId) queryParams.append('groupId', params.groupId.toString());

      const url = queryParams.toString() 
        ? `/item-costs/summary?${queryParams.toString()}`
        : '/item-costs/summary';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get cost summary error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get cost summary',
      };
    }
  }

  /**
   * Export cost report
   * GET /api/item-costs/export
   */
  async exportCostReport(params?: {
    storeId?: number;
    groupId?: number;
  }): Promise<{
    success: boolean;
    data: ExportItem[];
    total: number;
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params?.groupId) queryParams.append('groupId', params.groupId.toString());

      const url = queryParams.toString() 
        ? `/item-costs/export?${queryParams.toString()}`
        : '/item-costs/export';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export cost report error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export cost report',
      };
    }
  }

  // ================================================================
  // 🔥 COST EXCLUSION
  // ================================================================

  /**
   * Toggle item cost exclusion
   * PATCH /api/item-costs/:itemId/status
   * Inactive → Excludes from cost calculations
   * Active → Includes in cost calculations
   */
  async toggleItemStatus(
    itemId: number,
    status: 'Active' | 'Inactive'
  ): Promise<ToggleStatusResponse> {
    try {
      const response = await api.patch(`/item-costs/${itemId}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Toggle item status error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to toggle status',
        data: {
          item: {} as ItemCostData,
          isExcluded: false,
          exclusionReason: null,
        },
        error: error.response?.data?.error || 'Failed to toggle status',
      };
    }
  }

  /**
   * Get all excluded items
   * GET /api/item-costs/excluded
   */
  async getExcludedItems(): Promise<{
    success: boolean;
    data: ExcludedItem[];
    total: number;
    error?: string;
  }> {
    try {
      const response = await api.get('/item-costs/excluded');
      return response.data;
    } catch (error: any) {
      console.error('Get excluded items error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to get excluded items',
      };
    }
  }

  /**
   * Bulk exclude items from cost calculations
   * POST /api/item-costs/bulk-exclude
   */
  async bulkExcludeItems(
    itemIds: number[],
    reason: string = 'Bulk exclusion'
  ): Promise<BulkExclusionResponse> {
    try {
      const response = await api.post('/item-costs/bulk-exclude', {
        itemIds,
        reason,
      });
      return response.data;
    } catch (error: any) {
      console.error('Bulk exclude error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to bulk exclude items',
        data: {
          total: itemIds.length,
          success: 0,
          failed: itemIds.length,
          results: [],
        },
        error: error.response?.data?.error || 'Failed to bulk exclude items',
      };
    }
  }

  /**
   * Bulk include items (remove from exclusion)
   * POST /api/item-costs/bulk-include
   */
  async bulkIncludeItems(itemIds: number[]): Promise<BulkExclusionResponse> {
    try {
      const response = await api.post('/item-costs/bulk-include', {
        itemIds,
      });
      return response.data;
    } catch (error: any) {
      console.error('Bulk include error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to bulk include items',
        data: {
          total: itemIds.length,
          success: 0,
          failed: itemIds.length,
          results: [],
        },
        error: error.response?.data?.error || 'Failed to bulk include items',
      };
    }
  }

  /**
   * Check if an item is excluded from cost calculations
   */
  async isItemExcluded(itemId: number): Promise<boolean> {
    try {
      const response = await this.getExcludedItems();
      if (response.success) {
        return response.data.some(item => item.itemId === itemId);
      }
      return false;
    } catch (error) {
      console.error('Check item exclusion error:', error);
      return false;
    }
  }

  // ================================================================
  // 📦 MAIN CRUD
  // ================================================================

  /**
   * Get all items with cost calculations
   * GET /api/item-costs
   */
  async getItemsWithCost(params?: {
    storeId?: number;
    groupId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ItemCostData>> {
    try {
      // 🔥 Limit to 100 for performance
      const safeLimit = params?.limit ? Math.min(params.limit, 100) : 10;
      
      const queryParams = new URLSearchParams();
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params?.groupId) queryParams.append('groupId', params.groupId.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      queryParams.append('limit', safeLimit.toString());

      const url = queryParams.toString() 
        ? `/item-costs?${queryParams.toString()}`
        : '/item-costs';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get items with cost error:', error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
        error: error.response?.data?.error || 'Failed to get items with cost',
      };
    }
  }

  /**
   * Get single item with cost calculation
   * GET /api/item-costs/:itemId
   */
  async getItemCost(
    itemId: number,
    params?: {
      storeId?: number;
      groupId?: number;
    }
  ): Promise<SingleResponse<ItemCostData>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params?.groupId) queryParams.append('groupId', params.groupId.toString());

      const url = queryParams.toString() 
        ? `/item-costs/${itemId}?${queryParams.toString()}`
        : `/item-costs/${itemId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get item cost error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get item cost',
      };
    }
  }

  /**
   * Get item cost history
   * GET /api/item-costs/:itemId/history
   */
  async getItemCostHistory(
    itemId: number,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data: CostHistory[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-costs/${itemId}/history`, {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get item cost history error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to get item cost history',
      };
    }
  }

  /**
   * Update item cost
   * POST /api/item-costs/:itemId
   */
  async updateItemCost(
    itemId: number,
    data: {
      unitCost: number;
      reason?: string;
    }
  ): Promise<UpdateCostResponse> {
    try {
      const response = await api.post(`/item-costs/${itemId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update item cost error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update item cost',
      };
    }
  }

  // ================================================================
  // 🛠️ HELPER METHODS
  // ================================================================

  /**
   * Get status badge color
   */
  getStatusBadge(status: string): string {
    const badgeMap: Record<string, string> = {
      Active: 'success',
      Partial: 'warning',
      Inactive: 'secondary',
      Conflict: 'warning',
      Error: 'danger',
      Incomplete: 'warning',
    };
    return badgeMap[status] || 'secondary';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      Active: '✅',
      Partial: '⚠️',
      Inactive: '⛔',
      Conflict: '⚡',
      Error: '❌',
      Incomplete: '🔴',
    };
    return iconMap[status] || '📦';
  }

  /**
   * Get status description
   */
  getStatusDescription(status: string): string {
    const descMap: Record<string, string> = {
      Active: 'All data complete - included in total cost',
      Partial: 'Some stores excluded due to conflicts',
      Inactive: 'Excluded from cost calculations',
      Conflict: 'All stores have conflicts',
      Error: 'Error calculating cost',
      Incomplete: 'Missing required data (UOM, conversion, or cost)',
    };
    return descMap[status] || 'Unknown status';
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return 'ETB 0.00';
    return `ETB ${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /**
   * Format number
   */
  formatNumber(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Check if item has conflicts
   */
  hasConflict(item: ItemCostData): boolean {
    return item.status === 'Conflict' || item.status === 'Partial';
  }

  /**
   * Get total quantity from store breakdown
   */
  getTotalQuantity(item: ItemCostData): number {
    return item.storeBreakdown.reduce((sum, store) => sum + store.agreedQuantity, 0);
  }

  /**
   * Get total cost from store breakdown
   */
  getTotalCost(item: ItemCostData): number {
    return this.getTotalQuantity(item) * item.unitCost;
  }

  /**
   * Get excluded stores count
   */
  getExcludedStoresCount(item: ItemCostData): number {
    return item.storeBreakdown.filter(s => s.isExcluded).length;
  }

  /**
   * Get included stores count
   */
  getIncludedStoresCount(item: ItemCostData): number {
    return item.storeBreakdown.filter(s => !s.isExcluded).length;
  }

  /**
   * Filter items by status
   */
  filterByStatus(items: ItemCostData[], status: string): ItemCostData[] {
    if (!status) return items;
    return items.filter(item => item.status === status);
  }

  /**
   * Filter items by search query
   */
  filterBySearch(items: ItemCostData[], query: string): ItemCostData[] {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item =>
      item.itemCode?.toLowerCase().includes(q) ||
      item.itemName?.toLowerCase().includes(q) ||
      item.itemStandardName?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.model?.toLowerCase().includes(q)
    );
  }

  /**
   * Filter items by store
   */
  filterByStore(items: ItemCostData[], storeId: number): ItemCostData[] {
    if (!storeId) return items;
    return items.map(item => ({
      ...item,
      storeBreakdown: item.storeBreakdown.filter(s => s.storeId === storeId),
      isFiltered: true,
    }));
  }

  /**
   * Get excluded items count from a list
   */
  getExcludedCount(items: ItemCostData[]): number {
    return items.filter(item => item.isExcluded).length;
  }

  /**
   * Get included items count from a list
   */
  getIncludedCount(items: ItemCostData[]): number {
    return items.filter(item => !item.isExcluded).length;
  }

  /**
   * Calculate total value of included items
   */
  getTotalInventoryValue(items: ItemCostData[]): number {
    return items
      .filter(item => !item.isExcluded && (item.status === 'Active' || item.status === 'Partial'))
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }

  /**
   * Get stores from item breakdown
   */
  getStoresFromItems(items: ItemCostData[]): Store[] {
    const storeMap = new Map<number, Store>();
    items.forEach(item => {
      item.storeBreakdown.forEach(store => {
        if (!storeMap.has(store.storeId)) {
          storeMap.set(store.storeId, {
            id: store.storeId,
            name: store.storeName,
            code: store.storeName,
          });
        }
      });
    });
    return Array.from(storeMap.values());
  }
}

export default new ItemCostService();