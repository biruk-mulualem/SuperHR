// stores/itemService.ts
import api from './interceptor';

// ================================================================
// TYPES
// ================================================================

export interface Category {
  categoryId: number;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface UOM {
  uomId: number;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  itemId?: number;
  id?: number;
  code: string;
  name: string;
  standardName?: string;
  description?: string;
  brand?: string;
  model?: string;
  barcode?: string;
  categoryId?: number;
  category?: Category;
  uomId: number;
  uom?: UOM;
  conversionUomId?: number;
  conversionUom?: UOM;
  conversionValue: number;
  costPrice: number;
  status: 'Active' | 'Inactive' | 'Discontinued';
  specType: 'text' | 'pdf';
  specText?: string;
  specPdfName?: string;
  specPdfSize?: string;
  specPdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface ItemStats {
  total: number;
  active: number;
  inactive: number;
  discontinued: number;
  byCategory: Array<{
    categoryName: string;
    count: number;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
  error?: string;
}

export interface SingleItemResponse {
  success: boolean;
  data: Item;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data: ItemStats;
  message?: string;
  error?: string;
}

export interface ExportItemData {
  Code: string;
  Name: string;
  'Standard Name': string;
  Category: string;
  UOM: string;
  'Conversion UOM': string;
  'Conversion Value': number;
  'Cost Price': number;
  Status: string;
  Created: string;
}

export interface BulkCreateResponse {
  success: boolean;
  message: string;
  data: {
    created: Item[];
    failed: Array<{
      data: any;
      error: string;
    }>;
    total: number;
  };
}

export interface ImportResponse {
  success: boolean;
  message: string;
  data: {
    results: Array<{
      success: boolean;
      item?: Item;
      data?: any;
      error?: string;
    }>;
    total: number;
    success: number;
    failed: number;
  };
}

export interface GenerateCodeResponse {
  success: boolean;
  data: {
    code: string;
  };
  error?: string;
}

// ================================================================
// ITEM SERVICE
// ================================================================

class ItemService {
  private baseUrl = '/items';

  /**
   * Get all items with pagination and filtering
   */
  async getItems(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string | number;
    status?: string;
    uomId?: string | number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedResponse<Item>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.uomId) queryParams.append('uomId', params.uomId.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get items error:', error);
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        },
        error: error.response?.data?.error || 'Failed to fetch items'
      };
    }
  }

  /**
   * Get single item by ID
   */
  async getItemById(id: number | string): Promise<SingleItemResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get item by ID error:', error);
      return {
        success: false,
        data: {} as Item,
        error: error.response?.data?.error || 'Failed to fetch item'
      };
    }
  }

  /**
   * Get item by code
   */
  async getItemByCode(code: string): Promise<SingleItemResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/code/${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Get item by code error:', error);
      return {
        success: false,
        data: {} as Item,
        error: error.response?.data?.error || 'Failed to fetch item'
      };
    }
  }

  /**
   * Get active items only
   */
  async getActiveItems(): Promise<{
    success: boolean;
    data: { items: Item[]; total: number };
    error?: string;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error: any) {
      console.error('Get active items error:', error);
      return {
        success: false,
        data: { items: [], total: 0 },
        error: error.response?.data?.error || 'Failed to fetch active items'
      };
    }
  }

  /**
   * Get items by category
   */
  async getItemsByCategory(categoryId: number | string): Promise<{
    success: boolean;
    data: { category: Category; items: Item[]; total: number };
    error?: string;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/category/${categoryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get items by category error:', error);
      return {
        success: false,
        data: { category: {} as Category, items: [], total: 0 },
        error: error.response?.data?.error || 'Failed to fetch items by category'
      };
    }
  }

  /**
   * Search items
   */
  async searchItems(query: string): Promise<{
    success: boolean;
    data: { items: Item[]; total: number; searchTerm: string };
    error?: string;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      console.error('Search items error:', error);
      return {
        success: false,
        data: { items: [], total: 0, searchTerm: query },
        error: error.response?.data?.error || 'Failed to search items'
      };
    }
  }

  /**
   * Get item statistics
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error: any) {
      console.error('Get item stats error:', error);
      return {
        success: false,
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          discontinued: 0,
          byCategory: []
        },
        error: error.response?.data?.error || 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Generate next item code
   */
  async generateItemCode(): Promise<GenerateCodeResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/generate-code`);
      return response.data;
    } catch (error: any) {
      console.error('Generate item code error:', error);
      return {
        success: false,
        data: { code: '' },
        error: error.response?.data?.error || 'Failed to generate code'
      };
    }
  }

  /**
   * Create a new item
   */
  async createItem(itemData: Partial<Item>): Promise<SingleItemResponse> {
    try {
      const response = await api.post(this.baseUrl, itemData);
      return response.data;
    } catch (error: any) {
      console.error('Create item error:', error);
      return {
        success: false,
        data: {} as Item,
        error: error.response?.data?.error || 'Failed to create item'
      };
    }
  }

  /**
   * Update an item
   */
  async updateItem(id: number | string, itemData: Partial<Item>): Promise<SingleItemResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, itemData);
      return response.data;
    } catch (error: any) {
      console.error('Update item error:', error);
      return {
        success: false,
        data: {} as Item,
        error: error.response?.data?.error || 'Failed to update item'
      };
    }
  }

  /**
   * Update item status
   */
  async updateItemStatus(id: number | string, status: 'Active' | 'Inactive' | 'Discontinued'): Promise<{
    success: boolean;
    message: string;
    data?: { id: number; code: string; name: string; status: string; updatedAt: string };
    error?: string;
  }> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Update item status error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to update status'
      };
    }
  }

  /**
   * Activate an item
   */
  async activateItem(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: { id: number; code: string; name: string; status: string };
    error?: string;
  }> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/activate`);
      return response.data;
    } catch (error: any) {
      console.error('Activate item error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to activate item'
      };
    }
  }

  /**
   * Deactivate an item
   */
  async deactivateItem(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: { id: number; code: string; name: string; status: string };
    error?: string;
  }> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/deactivate`);
      return response.data;
    } catch (error: any) {
      console.error('Deactivate item error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to deactivate item'
      };
    }
  }

  /**
   * Soft delete an item (set status to Discontinued)
   */
  async deleteItem(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: { id: number; code: string; name: string; status: string };
    error?: string;
  }> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete item error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to delete item'
      };
    }
  }

  /**
   * Permanently delete an item
   */
  async permanentDeleteItem(id: number | string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/permanent`);
      return response.data;
    } catch (error: any) {
      console.error('Permanent delete item error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to permanently delete item'
      };
    }
  }

  /**
   * Upload item specification PDF
   */
  async uploadSpecification(id: number | string, file: File): Promise<{
    success: boolean;
    message: string;
    data?: {
      item: Item;
      file: {
        name: string;
        size: number;
        filename: string;
        url: string;
      };
    };
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('specification', file);

      const response = await api.post(
        `${this.baseUrl}/${id}/upload-specification`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Upload specification error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to upload specification'
      };
    }
  }

  /**
   * Remove item specification PDF
   */
  async removeSpecification(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: Item;
    error?: string;
  }> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/remove-specification`);
      return response.data;
    } catch (error: any) {
      console.error('Remove specification error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to remove specification'
      };
    }
  }

  /**
   * Bulk create items
   */
  async bulkCreateItems(itemsData: Partial<Item>[]): Promise<BulkCreateResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk`, { items: itemsData });
      return response.data;
    } catch (error: any) {
      console.error('Bulk create items error:', error);
      return {
        success: false,
        message: 'Failed to create items',
        data: {
          created: [],
          failed: [],
          total: 0
        }
      };
    }
  }

  /**
   * Import items from CSV data
   */
  async importItems(itemsData: any[]): Promise<ImportResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/import`, { items: itemsData });
      return response.data;
    } catch (error: any) {
      console.error('Import items error:', error);
      return {
        success: false,
        message: 'Failed to import items',
        data: {
          results: [],
          total: 0,
          success: 0,
          failed: 0
        }
      };
    }
  }

  /**
   * Export items as CSV data
   */
  async exportItems(params?: {
    categoryId?: number | string;
    status?: string;
  }): Promise<{
    success: boolean;
    data: ExportItemData[];
    total: number;
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId.toString());
      if (params?.status) queryParams.append('status', params.status);

      const url = queryParams.toString() 
        ? `${this.baseUrl}/export?${queryParams.toString()}`
        : `${this.baseUrl}/export`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export items error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export items'
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Format date
   */
  formatDate(date: string | Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get conversion display
   */
  getConversionDisplay(item: Item): string {
    if (!item) return '';
    if (item.conversionUom && item.conversionValue > 0) {
      return `${item.conversionValue} ${item.conversionUom.code} = 1 ${item.uom?.code || ''}`;
    }
    return `1 ${item.uom?.code || ''} = 1 ${item.uom?.code || ''}`;
  }

  /**
   * Check if item is active
   */
  isItemActive(item: Item): boolean {
    return item.status === 'Active';
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Inactive':
        return 'yellow';
      case 'Discontinued':
        return 'red';
      default:
        return 'gray';
    }
  }
}

export default new ItemService();