// stores/transactionService.ts - COMPLETE WITH CATEGORY SUPPORT

import api from "./interceptor";

// ================================================================
// TYPES & INTERFACES
// ================================================================

export interface TransactionFilters {
  storeId?: number;
  groupId?: number;
  categoryId?: number;
  itemId?: number;
  transactionType?: "Stock In" | "Stock Out";
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Transaction {
  id: number;
  balanceId: number;
  storeId: number;
  storeName: string;
  storeCode: string;
  groupId: number;
  groupName: string;
  groupCode: string;
  itemId: number;
  itemCode: string;
  // ✅ ONLY TWO NAME FIELDS
  itemStandardName: string | null;
  itemCommonName: string;
  // ✅ CATEGORY FIELDS
  categoryId: number | null;
  categoryName: string | null;
  uomCode: string;
  uomName: string;
  type: "Stock In" | "Stock Out";
  quantity: number;
  previousBalance: number;
  newBalance: number;
  sourceStoreId: number | null;
  sourceStore: string | null;
  destinationStoreId: number | null;
  destinationStore: string | null;
  referenceType: string;
  referenceId: number | null;
  updatedBy: string | null;
  remark: string | null;
  createdAt: string;
}

export interface TransactionStats {
  totalTransactions: number;
  stockIn: {
    count: number;
    totalQuantity: number;
  };
  stockOut: {
    count: number;
    totalQuantity: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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
  async getTransactions(
    filters: TransactionFilters = {},
  ): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();

    if (filters.storeId) params.append("storeId", filters.storeId.toString());
    if (filters.groupId) params.append("groupId", filters.groupId.toString());
    if (filters.categoryId)
      params.append("categoryId", filters.categoryId.toString());
    if (filters.itemId) params.append("itemId", filters.itemId.toString());
    if (filters.transactionType)
      params.append("transactionType", filters.transactionType);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  }

  // ================================================================
  // GET TRANSACTION STATISTICS
  // ================================================================

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    filters: {
      storeId?: number;
      groupId?: number;
      categoryId?: number;
      itemId?: number;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<{ success: boolean; data: TransactionStats }> {
    const params = new URLSearchParams();

    if (filters.storeId) params.append("storeId", filters.storeId.toString());
    if (filters.groupId) params.append("groupId", filters.groupId.toString());
    if (filters.categoryId)
      params.append("categoryId", filters.categoryId.toString());
    if (filters.itemId) params.append("itemId", filters.itemId.toString());
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(`/transactions/stats?${params.toString()}`);
    return response.data;
  }

  // ================================================================
  // GET RECENT TRANSACTIONS
  // ================================================================

  /**
   * Get recent transactions (for dashboard)
   */
  async getRecentTransactions(
    limit: number = 10,
  ): Promise<{ success: boolean; data: Transaction[] }> {
    const response = await api.get(`/transactions/recent?limit=${limit}`);
    return response.data;
  }

  // ================================================================
  // GET TRANSACTIONS BY BALANCE ID
  // ================================================================

  /**
   * Get transactions by balance ID
   */
  async getTransactionsByBalance(
    balanceId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<Transaction>> {
    const response = await api.get(
      `/transactions/balance/${balanceId}?page=${page}&limit=${limit}`,
    );
    return response.data;
  }

  // ================================================================
  // GET TRANSACTION BY ID
  // ================================================================

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    id: number,
  ): Promise<{ success: boolean; data: Transaction }> {
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
async exportTransactions(filters: {
    storeId?: number;
    groupId?: number;
    categoryId?: number;
    itemId?: number;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    type?: 'full' | 'summary';
} = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.storeId) params.append('storeId', filters.storeId.toString());
    if (filters.groupId) params.append('groupId', filters.groupId.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters.itemId) params.append('itemId', filters.itemId.toString());
    if (filters.transactionType) params.append('transactionType', filters.transactionType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    
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
  formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
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
  formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  /**
   * Get transaction type label with icon
   */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      "Stock In": "📥 Stock In",
      "Stock Out": "📤 Stock Out",
    };
    return labels[type] || type;
  }

  /**
   * Get transaction type class for styling
   */
  getTypeClass(type: string): string {
    return type === "Stock In" ? "stock-in" : "stock-out";
  }

  /**
   * Get reference type label
   */
  getReferenceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
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
