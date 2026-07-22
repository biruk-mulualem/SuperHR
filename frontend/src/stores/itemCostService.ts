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
  unitCost: number;
  totalQty: number;
  totalCost: number;
  status: 'Active' | 'Partial' | 'Inactive' | 'Conflict' | 'Error';
  userStatus: 'Active' | 'Inactive';
  storeBreakdown: StoreBreakdown[];
  excludedStores: string[];
  costHistory: CostHistory[];
  includedStoresCount: number;
  excludedStoresCount: number;
  isFiltered: boolean;
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
  'Excluded Stores': string;
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
  data?: {
    costHistory: CostHistory;
    updatedItem: ItemCostData;
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
  // 📈 SUMMARY & EXPORT
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
      const queryParams = new URLSearchParams();
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params?.groupId) queryParams.append('groupId', params.groupId.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

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

  /**
   * Toggle item status (Active/Inactive)
   * PATCH /api/item-costs/:itemId/status
   */
  async toggleItemStatus(
    itemId: number,
    status: 'Active' | 'Inactive'
  ): Promise<{
    success: boolean;
    message?: string;
    data?: ItemCostData;
    error?: string;
  }> {
    try {
      const response = await api.patch(`/item-costs/${itemId}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Toggle item status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle item status',
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
      Inactive: 'danger',
      Conflict: 'warning',
      Error: 'danger',
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
      Conflict: '⚠️',
      Error: '❌',
    };
    return iconMap[status] || '📦';
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '$0.00';
    return `$${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /**
   * Format number
   */
  formatNumber(value: number): string {
    if (value === null || value === undefined) return '0';
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
      item.itemStandardName?.toLowerCase().includes(q)
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
}

export default new ItemCostService();