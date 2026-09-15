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
  conversionUOM: string | null;
  conversionValue: number;
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
  // 📥 EXPORT ALL ITEMS (Working endpoint)
  // ================================================================

  async exportAllItems(params: Record<string, any> = {}): Promise<{
    success: boolean;
    data: any[];
    total: number;
    error?: string;
  }> {
    try {
      const queryString = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryString.append(key, value.toString());
        }
      });

      const url = `/item-costs/export-all${queryString.toString() ? '?' + queryString.toString() : ''}`;
      console.log('📤 Exporting all items from:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export all items error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error?.response?.data?.error || 'Failed to export items'
      };
    }
  }

  // ================================================================
  // 📥 EXPORT AS CSV (Using working exportAllItems)
  // ================================================================

  async exportAsCSV(params: Record<string, any> = {}): Promise<{ success: boolean; error?: string }> {
    try {
      // Use the working exportAllItems endpoint
      const response = await this.exportAllItems(params);
      
      if (!response.success || !response.data || response.data.length === 0) {
        return { 
          success: false, 
          error: response.error || 'No data to export' 
        };
      }

      const data = response.data;
      
      // Define columns for CSV
      const columns = [
        'Item Code', 'Item Name', 'Standard Name', 'Category', 'Brand', 'Model',
        'Base UOM', 'Conversion UOM', 'Conversion Value', 'Unit Cost (ETB)',
        'Total Quantity', 'Total Cost (ETB)', 'Status', 'Status Message',
        'Included Stores', 'Excluded Stores', 'Is Excluded', 'Exclusion Reason',
        'Has Missing Data', 'Missing Data'
      ];

      // Build CSV
      const csvRows = [];
      csvRows.push(columns.join(','));

      for (const item of data) {
        const row = columns.map(col => {
          const keyMap: Record<string, string> = {
            'Item Code': 'itemCode',
            'Item Name': 'itemName',
            'Standard Name': 'itemStandardName',
            'Category': 'categoryName',
            'Brand': 'brand',
            'Model': 'model',
            'Base UOM': 'baseUOM',
            'Conversion UOM': 'conversionUOM',
            'Conversion Value': 'conversionValue',
            'Unit Cost (ETB)': 'unitCost',
            'Total Quantity': 'totalQty',
            'Total Cost (ETB)': 'totalCost',
            'Status': 'status',
            'Status Message': 'statusMessage',
            'Included Stores': 'includedStoresCount',
            'Excluded Stores': 'excludedStoresCount',
            'Is Excluded': 'isExcluded',
            'Exclusion Reason': 'exclusionReason',
            'Has Missing Data': 'hasMissingData',
            'Missing Data': 'missingData'
          };
          
          const key = keyMap[col] || col;
          let value = item[key];
          
          // Handle special cases
          if (col === 'Is Excluded' || col === 'Has Missing Data') {
            value = value ? 'Yes' : 'No';
          }
          if (col === 'Missing Data' && Array.isArray(value)) {
            value = value.join(', ');
          }
          if (col === 'Unit Cost (ETB)' || col === 'Total Cost (ETB)') {
            value = typeof value === 'number' ? value.toFixed(2) : value;
          }
          if (value === null || value === undefined) {
            value = '';
          }
          
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(row.join(','));
      }

      const csv = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cost_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to export as CSV:', error);
      return {
        success: false,
        error: error.message || 'Failed to export as CSV'
      };
    }
  }

  // ================================================================
  // 🔥 COST EXCLUSION
  // ================================================================

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

  async getItemsWithCost(params?: {
    storeId?: number;
    groupId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ItemCostData>> {
    try {
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

  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return 'ETB 0.00';
    return `ETB ${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  formatNumber(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  hasConflict(item: ItemCostData): boolean {
    return item.status === 'Conflict' || item.status === 'Partial';
  }

  getTotalQuantity(item: ItemCostData): number {
    return item.storeBreakdown.reduce((sum, store) => sum + store.agreedQuantity, 0);
  }

  getTotalCost(item: ItemCostData): number {
    return this.getTotalQuantity(item) * item.unitCost;
  }

  getExcludedStoresCount(item: ItemCostData): number {
    return item.storeBreakdown.filter(s => s.isExcluded).length;
  }

  getIncludedStoresCount(item: ItemCostData): number {
    return item.storeBreakdown.filter(s => !s.isExcluded).length;
  }

  filterByStatus(items: ItemCostData[], status: string): ItemCostData[] {
    if (!status) return items;
    return items.filter(item => item.status === status);
  }

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

  filterByStore(items: ItemCostData[], storeId: number): ItemCostData[] {
    if (!storeId) return items;
    return items.map(item => ({
      ...item,
      storeBreakdown: item.storeBreakdown.filter(s => s.storeId === storeId),
      isFiltered: true,
    }));
  }

  getExcludedCount(items: ItemCostData[]): number {
    return items.filter(item => item.isExcluded).length;
  }

  getIncludedCount(items: ItemCostData[]): number {
    return items.filter(item => !item.isExcluded).length;
  }

  getTotalInventoryValue(items: ItemCostData[]): number {
    return items
      .filter(item => !item.isExcluded && (item.status === 'Active' || item.status === 'Partial'))
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }

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

  downloadCSV(data: any[], filename: string = 'export'): void {
    if (!data || data.length === 0) {
      console.warn('No data to download');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(key => {
          const value = row[key] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new ItemCostService();