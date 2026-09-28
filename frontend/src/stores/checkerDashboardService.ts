// services/checkerDashboardService.ts

import api from "./interceptor";

// ================================================================
// TYPES & INTERFACES
// ================================================================

export interface InventoryStats {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  missingConversion: number;
  missingCost: number;
  healthyItems: number;
}

export interface AuditStats {
  totalStores: number;
  totalItems: number;
  matched: number;
  conflicts: number;
  dateDiffs: number;
}

export interface StoreConflictData {
  id?: number;
  name: string;
  code: string;
  total: number;
  matched: number;
  conflicts: number;
  dateDiffs: number;
  health: number;
}

export interface TopConflictItem {
  code: string;
  name: string;
  store: string;
  diff: number;
  itemId?: number;
}

export interface TopDateDiffItem {
  code: string;
  name: string;
  store: string;
  days: number;
  itemId?: number;
}

export interface TopIssuesResponse {
  conflicts: TopConflictItem[];
  dateDiffs: TopDateDiffItem[];
  total: {
    conflicts: number;
    dateDiffs: number;
  };
}

export interface DashboardSummaryResponse {
  inventoryStats: InventoryStats;
  auditStats: AuditStats;
  storeConflictData: StoreConflictData[];
  topConflicts: TopConflictItem[];
  topDateDiffs: TopDateDiffItem[];
  summary: {
    totalGroups: number;
    totalProducts: number;
    lastUpdated: string;
  };
}

export interface RecentTransaction {
  id: number;
  itemName: string | null;
  itemCode: string | null;
  uomCode: string | null;
  storeName: string | null;
  groupName: string | null;
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  transactionType: string;
  changedBy: string | null;
  createdAt: string;
}

export interface RecentActivityResponse {
  transactions: RecentTransaction[];
  total: number;
}

export interface LowStockItem {
  id: number;
  itemName: string | null;
  itemCode: string | null;
  balance: number;
  minStock: number;
  groupName: string | null;
  storeName: string | null;
  uomCode: string | null;
  statusClass: 'warning' | 'critical';
  shortage: number;
}

export interface LowStockResponse {
  lowStock: LowStockItem[];
  zeroStock: LowStockItem[];
  totalLowStock: number;
  totalZeroStock: number;
}

export interface StoreSummary {
  storeId: number;
  name: string;
  code: string;
  location: string;
  totalItems: number;
  totalBalance: number;
  activeItems: number;
  zeroStockItems: number;
  lowStockItems: number;
  groupCount: number;
  health: number;
}

export interface DashboardStats {
  inventory: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
    missingConversion: number;
    missingCost: number;
  };
  audit: {
    totalStores: number;
    totalBalances: number;
    uniqueItems: number;
    uniqueStores: number;
  };
  lastUpdated: string;
}

class CheckerDashboardService {
  // ================================================================
  // MAIN DASHBOARD ENDPOINTS
  // ================================================================

  /**
   * Get complete dashboard summary data
   * GET /api/checker-dashboard/summary
   */
  async getDashboardSummary(
    storeId?: number | string
  ): Promise<{ success: boolean; data: DashboardSummaryResponse }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }

    // ✅ FIX: Use checker-dashboard (with hyphen) not checker
    const url = `/checker-dashboard/summary${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get store conflict data for the horizontal bar chart
   * GET /api/checker-dashboard/store-conflicts
   */
  async getStoreConflictData(
    storeId?: number | string
  ): Promise<{ success: boolean; data: StoreConflictData[] }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }

    const url = `/checker-dashboard/store-conflicts${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get top issues (conflicts and date differences)
   * GET /api/checker-dashboard/top-issues
   */
  async getTopIssues(
    storeId?: number | string,
    limit: number = 10
  ): Promise<{ success: boolean; data: TopIssuesResponse }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }
    params.append('limit', String(limit));

    const url = `/checker-dashboard/top-issues${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get lightweight dashboard stats for quick loading
   * GET /api/checker-dashboard/stats
   */
  async getDashboardStats(
    storeId?: number | string
  ): Promise<{ success: boolean; data: DashboardStats }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }

    const url = `/checker-dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  // ================================================================
  // RECENT ACTIVITY
  // ================================================================

  /**
   * Get recent activity for the dashboard
   * GET /api/checker-dashboard/recent-activity
   */
  async getRecentActivity(
    storeId?: number | string,
    limit: number = 10
  ): Promise<{ success: boolean; data: RecentActivityResponse }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }
    params.append('limit', String(limit));

    const url = `/checker-dashboard/recent-activity${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  // ================================================================
  // LOW STOCK ALERTS
  // ================================================================

  /**
   * Get low stock alerts for the dashboard
   * GET /api/checker-dashboard/low-stock
   */
  async getLowStockAlerts(
    storeId?: number | string,
    limit: number = 10
  ): Promise<{ success: boolean; data: LowStockResponse }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }
    params.append('limit', String(limit));

    const url = `/checker-dashboard/low-stock${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  // ================================================================
  // STORE SUMMARY
  // ================================================================

  /**
   * Get store summary data
   * GET /api/checker-dashboard/store-summary
   */
  async getStoreSummary(
    storeId?: number | string
  ): Promise<{ success: boolean; data: StoreSummary[] }> {
    const params = new URLSearchParams();
    if (storeId) {
      params.append('storeId', String(storeId));
    }

    const url = `/checker-dashboard/store-summary${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  // ================================================================
  // REFRESH
  // ================================================================

  /**
   * Refresh dashboard data
   * POST /api/checker-dashboard/refresh
   */
  async refreshDashboard(
    storeId?: number | string
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: { refreshedAt: string; storeId: string } 
  }> {
    const response = await api.post('/checker-dashboard/refresh', {
      storeId: storeId || null
    });
    return response.data;
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Matched': '✅ Matched',
      'Conflict': '🚨 Conflict',
      'No Data': '📭 No Data'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Matched': 'matched',
      'Conflict': 'conflict',
      'No Data': 'unknown'
    };
    return map[status] || 'unknown';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat().format(value);
  }

  formatPercent(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  }

  getConflictColor(conflicts: number): string {
    if (conflicts === 0) return '#94a3b8';
    if (conflicts <= 5) return '#f59e0b';
    if (conflicts <= 20) return '#f97316';
    if (conflicts <= 50) return '#ef4444';
    return '#dc2626';
  }

  getHealthColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  getConflictPercentage(conflicts: number, maxConflicts: number): number {
    if (maxConflicts === 0) return 0;
    return Math.round((conflicts / maxConflicts) * 100);
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

  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Stock In': '📥 Stock In',
      'Stock Out': '📤 Stock Out',
      'ADJUSTMENT': '📊 Adjustment'
    };
    return labels[type] || type;
  }

  getTransactionTypeClass(type: string): string {
    const map: Record<string, string> = {
      'Stock In': 'stock-in',
      'Stock Out': 'stock-out',
      'ADJUSTMENT': 'adjustment'
    };
    return map[type] || 'adjustment';
  }

  getLowStockStatusClass(status: string): 'warning' | 'critical' {
    return status === 'critical' ? 'critical' : 'warning';
  }
}

export default new CheckerDashboardService();