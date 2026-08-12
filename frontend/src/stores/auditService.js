// services/auditService.ts
// Complete Audit Service - Updated: Removed Outlier concept
import api from "./interceptor";
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
    async getUserAccess() {
        const response = await api.get('/audit/user/access');
        return response.data;
    }
    // ================================================================
    // STORES & CATEGORIES (for filters)
    // ================================================================
    /**
     * Get all stores with their groups for the dropdown
     */
    async getStoresWithGroups() {
        const response = await api.get('/audit/stores');
        return response.data;
    }
    /**
     * Get all categories for the filter dropdown
     */
    async getCategories() {
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
    async getStoreAudit(storeId, options = { includeTransactions: true, transactionLimit: 10 }) {
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
    async getAuditSummary(storeId) {
        const response = await api.get(`/audit/store/${storeId}/summary`);
        return response.data;
    }
    /**
     * Get dashboard view with overview, group summaries, recent activity, and alerts
     */
    async getAuditDashboard(storeId) {
        const response = await api.get(`/audit/store/${storeId}/dashboard`);
        return response.data;
    }
    /**
     * Export audit data to CSV
     */
    async exportAuditData(storeId, options = { includeTransactions: true }) {
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
    async compareGroups(storeId) {
        const response = await api.get(`/audit/store/${storeId}/groups/compare`);
        return response.data;
    }
    /**
     * Get complete balance snapshot for a specific store-group combination
     */
    async getBalanceSnapshot(storeId, groupId) {
        const response = await api.get(`/audit/store/${storeId}/group/${groupId}/snapshot`);
        return response.data;
    }
    /**
     * Get transaction history for a specific store-group
     */
    async getGroupTransactions(storeId, groupId, options = { page: 1, limit: 10 }) {
        const params = new URLSearchParams();
        if (options.page)
            params.append('page', String(options.page));
        if (options.limit)
            params.append('limit', String(options.limit));
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
    async getItemTransactions(storeId, itemId, limit = 10) {
        const response = await api.get(`/audit/store/${storeId}/item/${itemId}/transactions?limit=${limit}`);
        return response.data;
    }
    // ================================================================
    // DATE MANAGEMENT
    // ================================================================
    /**
     * Update transaction dates for an item across groups
     */
    async updateItemTransactionDates(storeId, itemId, dateUpdates) {
        try {
            const storeIdNum = typeof storeId === 'string' ? parseInt(storeId, 10) : storeId;
            const itemIdNum = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
            if (!storeIdNum || isNaN(storeIdNum)) {
                return { success: false, error: 'Invalid store ID' };
            }
            if (!itemIdNum || isNaN(itemIdNum)) {
                return { success: false, error: 'Invalid item ID' };
            }
            if (!dateUpdates || typeof dateUpdates !== 'object' || Array.isArray(dateUpdates)) {
                return {
                    success: false,
                    error: 'Invalid date updates data - expected an object with groupId: date pairs'
                };
            }
            const validUpdates = {};
            for (const [groupId, date] of Object.entries(dateUpdates)) {
                const groupIdNum = parseInt(groupId, 10);
                if (isNaN(groupIdNum))
                    continue;
                if (!date)
                    continue;
                const dateObj = new Date(date);
                if (isNaN(dateObj.getTime()))
                    continue;
                validUpdates[groupId] = date;
            }
            if (Object.keys(validUpdates).length === 0) {
                return {
                    success: false,
                    error: 'No valid dates to update. Please provide valid dates for at least one group.'
                };
            }
            const response = await api.put(`/audit/items/${storeIdNum}/${itemIdNum}/dates`, {
                dates: validUpdates
            });
            return response.data;
        }
        catch (error) {
            console.error('Error updating transaction dates:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Failed to update dates'
            };
        }
    }
    // ================================================================
    // UTILITY METHODS - UPDATED (Removed Outlier)
    // ================================================================
    /**
     * Download exported file
     */
    downloadFile(blob, filename) {
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
    formatBalance(balance) {
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
    formatTransaction(transaction) {
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
     * Calculate summary from balances - UPDATED (Removed Outlier)
     */
    calculateSummary(balances) {
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
        // Calculate comparison stats - No Outlier
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
        let conflictItems = 0; // Combined (was outlier + conflict)
        let dateDiffItems = 0;
        itemMap.forEach((item) => {
            const values = item.balances;
            const uniqueValues = [...new Set(values)];
            // Check for date differences
            // This would need date data, simplified for now
            // In real implementation, this would come from the API
            if (uniqueValues.length === 1) {
                matchedItems++;
            }
            else {
                conflictItems++; // Any difference = Conflict
            }
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
            conflictItems,
            dateDiffItems,
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
    getBalanceStatusClass(balance, minStock) {
        if (balance === 0)
            return 'zero';
        if (balance <= minStock)
            return 'low';
        return 'normal';
    }
    /**
     * Get status label for UI - UPDATED (Removed Outlier)
     */
    getStatusLabel(status) {
        const labels = {
            'Active': '✅ Active',
            'Inactive': '⏸️ Inactive',
            'Matched': '✅ Matched',
            'Conflict': '🚨 Conflict', // Now covers all discrepancies
            'No Data': '📭 No Data'
        };
        return labels[status] || status;
    }
    /**
     * Get comparison status class - UPDATED (Removed Outlier)
     */
    getComparisonStatusClass(status) {
        const map = {
            'Matched': 'matched',
            'Conflict': 'conflict',
            'No Data': 'unknown'
        };
        return map[status] || 'unknown';
    }
    /**
     * Get transaction type label with icon
     */
    getTransactionTypeLabel(type) {
        const labels = {
            'Stock In': '📥 Stock In',
            'Stock Out': '📤 Stock Out',
            'ADJUSTMENT': '📊 Adjustment'
        };
        return labels[type] || type;
    }
    /**
     * Get transaction type CSS class
     */
    getTransactionTypeClass(type) {
        const map = {
            'Stock In': 'stock-in',
            'Stock Out': 'stock-out',
            'ADJUSTMENT': 'adjustment'
        };
        return map[type] || 'adjustment';
    }
    /**
     * Get reference type label
     */
    getReferenceTypeLabel(type) {
        const labels = {
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
    getBalanceValueClass(balance, minStock) {
        if (balance === 0)
            return 'text-danger';
        if (balance <= minStock)
            return 'text-warning';
        return 'text-success';
    }
    /**
     * Check if stock is low
     */
    isLowStock(balance, minStock) {
        return balance <= minStock && balance > 0;
    }
    /**
     * Check if stock is zero
     */
    isZeroStock(balance) {
        return balance === 0;
    }
    /**
     * Get low stock warning message
     */
    getLowStockMessage(balance, minStock, itemName) {
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
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr)
            return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Format datetime
     */
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
    /**
     * Calculate shortage amount
     */
    calculateShortage(balance, minStock) {
        if (balance >= minStock)
            return 0;
        return minStock - balance;
    }
    /**
     * Group balances by status
     */
    groupByStatus(balances) {
        return {
            active: balances.filter(b => b.status === 'Active'),
            inactive: balances.filter(b => b.status !== 'Active'),
        };
    }
    /**
     * Group comparison items by status - UPDATED (Removed Outlier)
     */
    groupComparisonByStatus(items) {
        return {
            matched: items.filter(i => i.status === 'Matched'),
            conflict: items.filter(i => i.status === 'Conflict'),
            noData: items.filter(i => i.status === 'No Data'),
        };
    }
    /**
     * Get top N low stock items
     */
    getTopLowStockItems(balances, limit = 10) {
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
    getTopZeroStockItems(balances, limit = 10) {
        return balances
            .filter(b => b.status === 'Active' && Number(b.balance) === 0)
            .slice(0, limit);
    }
    /**
     * Check if a store has any low stock items
     */
    hasLowStockItems(balances) {
        return balances.some(b => b.status === 'Active' &&
            Number(b.balance) <= Number(b.minStock) &&
            Number(b.balance) > 0);
    }
    /**
     * Check if a store has any zero stock items
     */
    hasZeroStockItems(balances) {
        return balances.some(b => b.status === 'Active' && Number(b.balance) === 0);
    }
    /**
     * Get store health status
     */
    getStoreHealthStatus(balances) {
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
     * Get comparison summary from audit data - UPDATED (Removed Outlier)
     */
    getComparisonSummary(comparison) {
        return {
            ...comparison.summary,
            items: comparison.items,
        };
    }
    /**
     * Get item comparison status based on balance values - UPDATED
     */
    getItemStatus(values) {
        const validValues = values.filter(v => v !== null && v !== undefined);
        if (validValues.length === 0) {
            return 'No Data';
        }
        const uniqueValues = [...new Set(validValues)];
        if (uniqueValues.length === 1) {
            return 'Matched';
        }
        else {
            return 'Conflict'; // Any difference = Conflict
        }
    }
    /**
     * Check if an item has date differences across groups
     */
    hasDateDifference(dates) {
        const validDates = dates.filter(d => d !== null && d !== undefined);
        if (validDates.length < 2)
            return false;
        const uniqueDateStrings = [...new Set(validDates.map(d => new Date(d).toDateString()))];
        return uniqueDateStrings.length > 1;
    }
    /**
     * Get date difference details
     */
    getDateDiffDetails(dates) {
        const validDates = dates.filter(d => d !== null && d !== undefined);
        if (validDates.length < 2)
            return null;
        const uniqueDateStrings = [...new Set(validDates.map(d => new Date(d).toDateString()))];
        if (uniqueDateStrings.length <= 1)
            return null;
        const dateObjects = validDates.map(d => new Date(d));
        const latestDate = new Date(Math.max(...dateObjects.map(d => d.getTime())));
        const earliestDate = new Date(Math.min(...dateObjects.map(d => d.getTime())));
        const diffMs = latestDate.getTime() - earliestDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return {
            hasDiff: true,
            diffDays,
            latestDate: latestDate.toISOString(),
            earliestDate: earliestDate.toISOString(),
            uniqueDates: uniqueDateStrings,
        };
    }
}
// ============================================
// EXPORT SERVICE INSTANCE
// ============================================
export default new AuditService();
