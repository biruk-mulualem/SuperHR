// stores/costDashboardService.ts
import api from './interceptor';

// ================================================================
// TYPES - Matches Backend Response Structure
// ================================================================

export interface CostSummary {
  totalItems: number;
  zeroCostItems: number;
  totalCost: number;
  excludedByConflict: number;
  excludedByData: number;
  itemsWithCost?: number;
}

export interface CostByStore {
  id: number;
  name: string;
  code: string;
  totalCost: number;
  itemCount: number;
  color: string;
  percent: number;
}

export interface TopCostItem {
  id: number;
  itemCode: string;
  itemName: string;
  itemStandardName: string;
  categoryName: string;
  baseUOM: string;
  totalQty: number;
  unitCost: number;
  totalCost: number;
  status: string;
  percent: number;
}

export interface ZeroCostItem {
  id: number;
  itemCode: string;
  itemName: string;
  itemStandardName: string;
  categoryName: string;
  baseUOM: string;
  status: string;
  balance: number;
  storeName: string | null;
  groupName: string | null;
}

export interface ZeroCostPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ZeroCostResponse {
  success: boolean;
  data: ZeroCostItem[];
  pagination: ZeroCostPagination;
  error?: string;
}

export interface ExportResponse {
  success: boolean;
  data: any[];
  total: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  totalCost?: number;
  totalInventoryCost?: number;
  error?: string;
}

export interface DashboardData {
  summary: CostSummary;
  costByStore: CostByStore[];
  topCostItems: TopCostItem[];
  zeroCostItems: ZeroCostItem[];
  zeroCostPagination: ZeroCostPagination;
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

// ================================================================
// COST DASHBOARD SERVICE
// ================================================================

class CostDashboardService {
  // Store user context
  private userStoreId: number | null = null;
  private userGroupId: number | null = null;

  /**
   * Set user's store and group context
   */
  setUserContext(storeId: number | null, groupId: number | null) {
    this.userStoreId = storeId;
    this.userGroupId = groupId;
    console.log('📍 Cost Dashboard context set:', { storeId, groupId });
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
   * Build query parameters with store and group
   */
  private buildParams(extraParams?: Record<string, any>): string {
    const params = new URLSearchParams();
    
    // ✅ Always add storeId and groupId if available
    if (this.userStoreId) {
      params.append('storeId', this.userStoreId.toString());
    }
    if (this.userGroupId) {
      params.append('groupId', this.userGroupId.toString());
    }
    
    // Add extra params
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    console.log('📤 BuildParams result:', queryString);
    return queryString;
  }

  // ================================================================
  // 1. GET COST SUMMARY
  // ================================================================

  async getCostSummary(): Promise<{
    success: boolean;
    data?: CostSummary;
    error?: string;
  }> {
    try {
      const params = this.buildParams();
      const url = `/cost-dashboard/cost-summary${params ? '?' + params : ''}`;
      console.log('📤 Fetching cost summary from:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to load cost summary:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get cost summary'
      };
    }
  }

  // ================================================================
  // 2. GET COST BY STORE
  // ================================================================

  async getCostByStore(): Promise<{
    success: boolean;
    data?: CostByStore[];
    error?: string;
  }> {
    try {
      const params = this.buildParams();
      const url = `/cost-dashboard/cost-by-store${params ? '?' + params : ''}`;
      console.log('📤 Fetching cost by store from:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to load cost by store:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get cost by store'
      };
    }
  }

  // ================================================================
  // 3. GET TOP COST ITEMS
  // ================================================================

  async getTopCostItems(limit: number = 10): Promise<{
    success: boolean;
    data?: TopCostItem[];
    error?: string;
  }> {
    try {
      const params = this.buildParams({ limit });
      const url = `/cost-dashboard/top-cost-items${params ? '?' + params : ''}`;
      console.log('📤 Fetching top cost items from:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to load top cost items:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get top cost items'
      };
    }
  }

  // ================================================================
  // 4. GET ZERO COST ITEMS (with pagination)
  // ================================================================

  async getZeroCostItems(page: number = 1, limit: number = 10): Promise<ZeroCostResponse> {
    try {
      const params = this.buildParams({ page, limit });
      const url = `/cost-dashboard/zero-cost-items${params ? '?' + params : ''}`;
      console.log('📤 Fetching zero cost items from:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to load zero cost items:', error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0
        },
        error: error.response?.data?.error || 'Failed to get zero cost items'
      };
    }
  }

  // ================================================================
  // 5. GET ALL DASHBOARD DATA (Combined)
  // ================================================================

  async getDashboardData(): Promise<DashboardResponse> {
    try {
      // Ensure we have storeId and groupId before making requests
      if (!this.userStoreId || !this.userGroupId) {
        console.warn('⚠️ No storeId or groupId set for cost dashboard');
      }

      const [summary, costByStore, topCostItems, zeroCostItems] = await Promise.all([
        this.getCostSummary(),
        this.getCostByStore(),
        this.getTopCostItems(10),
        this.getZeroCostItems(1, 10)
      ]);

      return {
        success: true,
        data: {
          summary: summary.success && summary.data ? summary.data : {
            totalItems: 0,
            zeroCostItems: 0,
            totalCost: 0,
            excludedByConflict: 0,
            excludedByData: 0,
            itemsWithCost: 0
          },
          costByStore: costByStore.success && costByStore.data ? costByStore.data : [],
          topCostItems: topCostItems.success && topCostItems.data ? topCostItems.data : [],
          zeroCostItems: zeroCostItems.success ? zeroCostItems.data : [],
          zeroCostPagination: zeroCostItems.success ? zeroCostItems.pagination : {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        }
      };
    } catch (error: any) {
      console.error('❌ Failed to load dashboard data:', error);
      return {
        success: false,
        error: error.message || 'Failed to get dashboard data'
      };
    }
  }

  // ================================================================
  // 6. EXPORT COST BY STORE (with pagination)
  // ================================================================

  async exportCostByStore(page: number = 1, limit: number = 100): Promise<ExportResponse> {
    try {
      // ✅ Ensure we have storeId and groupId
      if (!this.userStoreId || !this.userGroupId) {
        console.warn('⚠️ No storeId or groupId for export, using default');
      }
      
      const params = this.buildParams({ page, limit });
      const url = `/cost-dashboard/export/cost-by-store${params ? '?' + params : ''}`;
      console.log('📤 Exporting cost by store from:', url);
      
      const response = await api.get(url);
      console.log('✅ Export cost by store response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to export cost by store:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export cost by store'
      };
    }
  }

  // ================================================================
  // 7. EXPORT TOP COST ITEMS (with pagination)
  // ================================================================

  async exportTopCostItems(page: number = 1, limit: number = 10): Promise<ExportResponse> {
    try {
      const params = this.buildParams({ page, limit });
      const url = `/cost-dashboard/export/top-cost-items${params ? '?' + params : ''}`;
      console.log('📤 Exporting top cost items from:', url);
      
      const response = await api.get(url);
      console.log('✅ Export top cost items response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to export top cost items:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export top cost items'
      };
    }
  }

  // ================================================================
  // 8. EXPORT ZERO COST ITEMS (with pagination)
  // ================================================================

  async exportZeroCostItems(page: number = 1, limit: number = 10): Promise<ExportResponse> {
    try {
      const params = this.buildParams({ page, limit });
      const url = `/cost-dashboard/export/zero-cost-items${params ? '?' + params : ''}`;
      console.log('📤 Exporting zero cost items from:', url);
      
      const response = await api.get(url);
      console.log('✅ Export zero cost items response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to export zero cost items:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export zero cost items'
      };
    }
  }

  // ================================================================
  // 9. CLEAR CACHE
  // ================================================================

  async clearCache(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.post('/cost-dashboard/clear-cache');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to clear cache:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to clear cache'
      };
    }
  }

  // ================================================================
  // 10. DOWNLOAD CSV
  // ================================================================

  downloadCSV(data: any[], filename: string): void {
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

  // ================================================================
  // HELPER METHODS
  // ================================================================

  getStoreColor(storeId: number): string {
    const colors: string[] = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'
    ];
    const index = storeId % colors.length;
    return colors[index] ?? '#3b82f6';
  }

  getPercentColor(percent: number): string {
    if (percent >= 30) return '#ef4444';
    if (percent >= 15) return '#f59e0b';
    return '#3b82f6';
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatNumber(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

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

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

export default new CostDashboardService();