// stores/storeToStoreRelationshipService.ts
import api from './interceptor';

// ================================================================
// TYPES
// ================================================================

export interface Store {
  id: number;
  code: string;
  name: string;
  location?: string;
  status: string;
}

export interface StoreRelationship {
  id: number;
  code: string;
  sourceStoreId: number;
  sourceStore?: Store;
  targetStoreId: number;
  targetStore?: Store;
  description?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipStats {
  overview: {
    total: number;
    active: number;
    inactive: number;
  };
  bySourceStore: Array<{
    storeId: number;
    storeName: string;
    storeStatus: string;
    relationshipCount: number;
    activeCount: number;
  }>;
  byTargetStore: Array<{
    storeId: number;
    storeName: string;
    storeStatus: string;
    relationshipCount: number;
    activeCount: number;
  }>;
}

export interface PaginatedRelationshipResponse {
  success: boolean;
  data: {
    relationships: StoreRelationship[];
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

export interface SingleRelationshipResponse {
  success: boolean;
  data: StoreRelationship;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data: RelationshipStats;
  message?: string;
  error?: string;
}

export interface GenerateCodeResponse {
  success: boolean;
  data: {
    code: string;
  };
  error?: string;
}

export interface ExportResponse {
  success: boolean;
  data: Array<{
    '#': number;
    'Code': string;
    'Store Asking': string;
    'Store Supplying': string;
    'Description': string;
    'Status': string;
    'Created At': string;
  }>;
  total: number;
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  data?: { id: number; code: string; status: string };
  error?: string;
}

// ================================================================
// STORE-TO-STORE RELATIONSHIP SERVICE
// ================================================================

class StoreToStoreRelationshipService {
  // ================================================================
  // CRUD OPERATIONS
  // ================================================================

  /**
   * Get all relationships with pagination and filtering
   * GET /api/store-to-store-relationships
   */
  async getRelationships(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    storeId?: string | number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedRelationshipResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.storeId && params.storeId !== 'all') queryParams.append('storeId', params.storeId.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString() 
        ? `/store-to-store-relationships?${queryParams.toString()}`
        : '/store-to-store-relationships';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get relationships error:', error);
      return {
        success: false,
        data: {
          relationships: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        },
        error: error.response?.data?.error || 'Failed to fetch relationships'
      };
    }
  }

  /**
   * Get single relationship by ID
   * GET /api/store-to-store-relationships/:id
   */
  async getRelationshipById(id: number | string): Promise<SingleRelationshipResponse> {
    try {
      const response = await api.get(`/store-to-store-relationships/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get relationship by ID error:', error);
      return {
        success: false,
        data: {} as StoreRelationship,
        error: error.response?.data?.error || 'Failed to fetch relationship'
      };
    }
  }

  /**
   * Generate next relationship code
   * GET /api/store-to-store-relationships/generate-code
   */
  async generateRelationshipCode(): Promise<GenerateCodeResponse> {
    try {
      const response = await api.get('/store-to-store-relationships/generate-code');
      return response.data;
    } catch (error: any) {
      console.error('Generate relationship code error:', error);
      return {
        success: false,
        data: { code: '' },
        error: error.response?.data?.error || 'Failed to generate code'
      };
    }
  }

  /**
   * Create a new relationship
   * POST /api/store-to-store-relationships
   */
  async createRelationship(data: {
    sourceStoreId: number | string;
    targetStoreId: number | string;
    description?: string;
    status?: 'active' | 'inactive';
  }): Promise<SingleRelationshipResponse> {
    try {
      const response = await api.post('/store-to-store-relationships', data);
      return response.data;
    } catch (error: any) {
      console.error('Create relationship error:', error);
      return {
        success: false,
        data: {} as StoreRelationship,
        error: error.response?.data?.error || 'Failed to create relationship'
      };
    }
  }

  /**
   * Update a relationship
   * PUT /api/store-to-store-relationships/:id
   */
  async updateRelationship(
    id: number | string,
    data: {
      sourceStoreId?: number | string;
      targetStoreId?: number | string;
      description?: string;
      status?: 'active' | 'inactive';
    }
  ): Promise<SingleRelationshipResponse> {
    try {
      const response = await api.put(`/store-to-store-relationships/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update relationship error:', error);
      return {
        success: false,
        data: {} as StoreRelationship,
        error: error.response?.data?.error || 'Failed to update relationship'
      };
    }
  }

  /**
   * Update relationship status
   * PATCH /api/store-to-store-relationships/:id/status
   */
  async updateRelationshipStatus(
    id: number | string,
    status: 'active' | 'inactive'
  ): Promise<SingleRelationshipResponse> {
    try {
      const response = await api.patch(`/store-to-store-relationships/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Update relationship status error:', error);
      return {
        success: false,
        data: {} as StoreRelationship,
        error: error.response?.data?.error || 'Failed to update status'
      };
    }
  }

  /**
   * Soft delete a relationship (set status to inactive)
   * DELETE /api/store-to-store-relationships/:id
   */
  async deleteRelationship(id: number | string): Promise<DeleteResponse> {
    try {
      const response = await api.delete(`/store-to-store-relationships/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete relationship error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to delete relationship'
      };
    }
  }

  /**
   * Permanently delete a relationship
   * DELETE /api/store-to-store-relationships/:id/permanent
   */
  async permanentDeleteRelationship(id: number | string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/store-to-store-relationships/${id}/permanent`);
      return response.data;
    } catch (error: any) {
      console.error('Permanent delete relationship error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to permanently delete relationship'
      };
    }
  }

  // ================================================================
  // STATISTICS & EXPORT
  // ================================================================

  /**
   * Get relationship statistics
   * GET /api/store-to-store-relationships/statistics
   */
  async getRelationshipStatistics(): Promise<StatsResponse> {
    try {
      const response = await api.get('/store-to-store-relationships/statistics');
      return response.data;
    } catch (error: any) {
      console.error('Get relationship statistics error:', error);
      return {
        success: false,
        data: {
          overview: {
            total: 0,
            active: 0,
            inactive: 0
          },
          bySourceStore: [],
          byTargetStore: []
        },
        error: error.response?.data?.error || 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Export relationships as CSV data
   * GET /api/store-to-store-relationships/export
   */
  async exportRelationships(params?: {
    status?: string;
    storeId?: string | number;
  }): Promise<ExportResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params?.storeId && params.storeId !== 'all') queryParams.append('storeId', params.storeId.toString());

      const url = queryParams.toString() 
        ? `/store-to-store-relationships/export?${queryParams.toString()}`
        : '/store-to-store-relationships/export';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export relationships error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export relationships'
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Get status color for badges
   */
  getStatusColor(status: string): string {
    return status === 'active' ? 'green' : 'yellow';
  }

  /**
   * Check if relationship is active
   */
  isActive(relationship: StoreRelationship): boolean {
    return relationship.status === 'active';
  }

  /**
   * Get display name for relationship
   */
  getDisplayName(relationship: StoreRelationship): string {
    const source = relationship.sourceStore?.name || 'Unknown';
    const target = relationship.targetStore?.name || 'Unknown';
    return `${source} ➡️ ${target}`;
  }

  /**
   * Get full description with code
   */
  getFullDescription(relationship: StoreRelationship): string {
    return `${relationship.code}: ${relationship.description || 'No description'}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Get store name from relationship
   */
  getStoreName(relationship: StoreRelationship, type: 'source' | 'target'): string {
    if (type === 'source') {
      return relationship.sourceStore?.name || 'Unknown';
    }
    return relationship.targetStore?.name || 'Unknown';
  }
}

export default new StoreToStoreRelationshipService();