// services/checkerDashboardService.ts
import api from "./interceptor";
class CheckerDashboardService {
    // ================================================================
    // MAIN DASHBOARD ENDPOINTS
    // ================================================================
    /**
     * Get complete dashboard summary data
     * GET /api/checker-dashboard/summary
     */
    async getDashboardSummary(storeId) {
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
    async getStoreConflictData(storeId) {
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
    async getTopIssues(storeId, limit = 10) {
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
    async getDashboardStats(storeId) {
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
    async getRecentActivity(storeId, limit = 10) {
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
    async getLowStockAlerts(storeId, limit = 10) {
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
    async getStoreSummary(storeId) {
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
    async refreshDashboard(storeId) {
        const response = await api.post('/checker-dashboard/refresh', {
            storeId: storeId || null
        });
        return response.data;
    }
    // ================================================================
    // UTILITY METHODS
    // ================================================================
    getStatusLabel(status) {
        const labels = {
            'Matched': '✅ Matched',
            'Conflict': '🚨 Conflict',
            'No Data': '📭 No Data'
        };
        return labels[status] || status;
    }
    getStatusClass(status) {
        const map = {
            'Matched': 'matched',
            'Conflict': 'conflict',
            'No Data': 'unknown'
        };
        return map[status] || 'unknown';
    }
    formatNumber(value) {
        return new Intl.NumberFormat().format(value);
    }
    formatPercent(value, total) {
        if (total === 0)
            return '0%';
        return `${Math.round((value / total) * 100)}%`;
    }
    getConflictColor(conflicts) {
        if (conflicts === 0)
            return '#94a3b8';
        if (conflicts <= 5)
            return '#f59e0b';
        if (conflicts <= 20)
            return '#f97316';
        if (conflicts <= 50)
            return '#ef4444';
        return '#dc2626';
    }
    getHealthColor(score) {
        if (score >= 80)
            return '#10b981';
        if (score >= 60)
            return '#f59e0b';
        if (score >= 40)
            return '#f97316';
        return '#ef4444';
    }
    getConflictPercentage(conflicts, maxConflicts) {
        if (maxConflicts === 0)
            return 0;
        return Math.round((conflicts / maxConflicts) * 100);
    }
    formatDate(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    formatDateTime(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    getTransactionTypeLabel(type) {
        const labels = {
            'Stock In': '📥 Stock In',
            'Stock Out': '📤 Stock Out',
            'ADJUSTMENT': '📊 Adjustment'
        };
        return labels[type] || type;
    }
    getTransactionTypeClass(type) {
        const map = {
            'Stock In': 'stock-in',
            'Stock Out': 'stock-out',
            'ADJUSTMENT': 'adjustment'
        };
        return map[type] || 'adjustment';
    }
    getLowStockStatusClass(status) {
        return status === 'critical' ? 'critical' : 'warning';
    }
}
export default new CheckerDashboardService();
