// stores/stockCardService.ts

import api from './interceptor';

export interface StockCardRow {
  date: string;
  grn: string;
  siv: string;
  particulars: string;
  quantityIn: number;
  quantityOut: number;
  unitCost: number;
  runningQuantityBalance: number;
  runningCostBalance: number;
  previousBalance: number;
  newBalance: number;
  storeName: string | null;
  groupName: string | null;
  updatedBy: string | null;
  transactionType: string | null;
  referenceType: string | null;
}

export interface StockCardResponse {
  success: boolean;
  data: {
    form: {
      maximumStockLevel: string;
      merchandise: string;
      unitOfMeasurement: string;
      codeNo: string;
    };
    rows: StockCardRow[];
    currentBalance: number;
    currentBalanceContext: {
      balance: number;
      minStockAlert: number;
      status: string;
      store?: { id: number; name: string; code: string };
      group?: { id: number; name: string; code: string };
    } | null;
    item: {
      id: number;
      code: string;
      name: string;
      standardName: string | null;
      uomCode: string;
      uomName: string;
      categoryName: string | null;
      costPrice: number;
    };
    summary: {
      totalTransactions: number;
      totalQuantityIn: number;
      totalQuantityOut: number;
      totalCostIn: number;
      totalCostOut: number;
      currentBalance: number;
      currentCostBalance: number;
      unitCost: number;
    };
    filters: {
      storeId: number | null;
      groupId: number | null;
      startDate: string | null;
      endDate: string | null;
      limit: number;
    };
  };
}

class StockCardService {
  /**
   * Get stock card for an item
   */
  async getStockCard(
    itemId: number,
    filters: {
      storeId?: number;
      groupId?: number;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<StockCardResponse> {
    const params = new URLSearchParams();
    if (filters.storeId) params.append('storeId', filters.storeId.toString());
    if (filters.groupId) params.append('groupId', filters.groupId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit?.toString() || '100');

    const response = await api.get(
      `/stock-card/${itemId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get optimized stock card with SQL window functions
   */
  async getStockCardOptimized(
    itemId: number,
    filters: {
      storeId?: number;
      groupId?: number;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<StockCardResponse> {
    const params = new URLSearchParams();
    if (filters.storeId) params.append('storeId', filters.storeId.toString());
    if (filters.groupId) params.append('groupId', filters.groupId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit?.toString() || '100');

    const response = await api.get(
      `/stock-card/${itemId}/optimized?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get stock card summary for dashboard
   */
  async getStockCardSummary(filters: {
    storeId?: number;
    groupId?: number;
    categoryId?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (filters.storeId) params.append('storeId', filters.storeId.toString());
    if (filters.groupId) params.append('groupId', filters.groupId.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());

    const response = await api.get(
      `/stock-card/summary?${params.toString()}`
    );
    return response.data;
  }
}

export default new StockCardService();