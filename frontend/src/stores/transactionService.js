// stores/transactionService.ts - COMPLETE WITH CATEGORY SUPPORT
import api from "./interceptor";
// ================================================================
// TRANSACTION SERVICE CLASS
// ================================================================
class TransactionService {
    // ================================================================
    // GET TRANSACTIONS WITH FILTERS
    // ================================================================
    /**
     * Get all transactions with filters and pagination
     */
    async getTransactions(filters = {}) {
        const params = new URLSearchParams();
        if (filters.storeId)
            params.append("storeId", filters.storeId.toString());
        if (filters.groupId)
            params.append("groupId", filters.groupId.toString());
        if (filters.categoryId)
            params.append("categoryId", filters.categoryId.toString());
        if (filters.itemId)
            params.append("itemId", filters.itemId.toString());
        if (filters.transactionType)
            params.append("transactionType", filters.transactionType);
        if (filters.startDate)
            params.append("startDate", filters.startDate);
        if (filters.endDate)
            params.append("endDate", filters.endDate);
        if (filters.search)
            params.append("search", filters.search);
        if (filters.page)
            params.append("page", filters.page.toString());
        if (filters.limit)
            params.append("limit", filters.limit.toString());
        const response = await api.get(`/transactions?${params.toString()}`);
        return response.data;
    }
    // ================================================================
    // GET TRANSACTION STATISTICS
    // ================================================================
    /**
     * Get transaction statistics
     */
    async getTransactionStats(filters = {}) {
        const params = new URLSearchParams();
        if (filters.storeId)
            params.append("storeId", filters.storeId.toString());
        if (filters.groupId)
            params.append("groupId", filters.groupId.toString());
        if (filters.categoryId)
            params.append("categoryId", filters.categoryId.toString());
        if (filters.itemId)
            params.append("itemId", filters.itemId.toString());
        if (filters.startDate)
            params.append("startDate", filters.startDate);
        if (filters.endDate)
            params.append("endDate", filters.endDate);
        const response = await api.get(`/transactions/stats?${params.toString()}`);
        return response.data;
    }
    // ================================================================
    // GET RECENT TRANSACTIONS
    // ================================================================
    /**
     * Get recent transactions (for dashboard)
     */
    async getRecentTransactions(limit = 10) {
        const response = await api.get(`/transactions/recent?limit=${limit}`);
        return response.data;
    }
    // ================================================================
    // GET TRANSACTIONS BY BALANCE ID
    // ================================================================
    /**
     * Get transactions by balance ID
     */
    async getTransactionsByBalance(balanceId, page = 1, limit = 20) {
        const response = await api.get(`/transactions/balance/${balanceId}?page=${page}&limit=${limit}`);
        return response.data;
    }
    // ================================================================
    // GET TRANSACTION BY ID
    // ================================================================
    /**
     * Get transaction by ID
     */
    async getTransactionById(id) {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    }
    // ================================================================
    // EXPORT TRANSACTIONS
    // ================================================================
    // stores/transactionService.ts
    /**
     * Export transactions as Excel (.xlsx)
     */
    async exportTransactions(filters = {}) {
        const params = new URLSearchParams();
        if (filters.storeId)
            params.append('storeId', filters.storeId.toString());
        if (filters.groupId)
            params.append('groupId', filters.groupId.toString());
        if (filters.categoryId)
            params.append('categoryId', filters.categoryId.toString());
        if (filters.itemId)
            params.append('itemId', filters.itemId.toString());
        if (filters.transactionType)
            params.append('transactionType', filters.transactionType);
        if (filters.startDate)
            params.append('startDate', filters.startDate);
        if (filters.endDate)
            params.append('endDate', filters.endDate);
        if (filters.search)
            params.append('search', filters.search);
        if (filters.type)
            params.append('type', filters.type);
        console.log('📊 Export URL:', `/transactions/export?${params.toString()}`);
        const response = await api.get(`/transactions/export?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    }
    // ================================================================
    // UTILITY METHODS
    // ================================================================
    /**
     * Format date for display
     */
    formatDate(dateStr) {
        if (!dateStr)
            return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    /**
     * Format number with commas
     */
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    /**
     * Get transaction type label with icon
     */
    getTypeLabel(type) {
        const labels = {
            "Stock In": "📥 Stock In",
            "Stock Out": "📤 Stock Out",
        };
        return labels[type] || type;
    }
    /**
     * Get transaction type class for styling
     */
    getTypeClass(type) {
        return type === "Stock In" ? "stock-in" : "stock-out";
    }
    /**
     * Get reference type label
     */
    getReferenceTypeLabel(type) {
        const labels = {
            initialization: "📦 Initialization",
            purchase: "🛒 Purchase",
            transfer: "🔄 Transfer",
            adjustment: "📊 Adjustment",
            return: "↩️ Return",
            sale: "💰 Sale",
            request: "📋 Request",
        };
        return labels[type] || type;
    }
}
// ================================================================
// EXPORT SERVICE INSTANCE
// ================================================================
export default new TransactionService();
