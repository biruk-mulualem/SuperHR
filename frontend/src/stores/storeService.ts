// stores/storeService.js
import api from './interceptor';

// ================================================================
// TYPES
// ================================================================

export interface Group {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  users?: User[];
}

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

export interface Store {
  id: number;
  code: string;
  name: string;
  location?: string;
  status: 'Active' | 'Inactive' | 'Closed';
  groups: Group[];
  totalUsers: number;
  totalGroups: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreStats {
  stores: {
    total: number;
    active: number;
    inactive: number;
    closed: number;
  };
  groups: {
    total: number;
    active: number;
    inactive: number;
  };
  relations: {
    storeGroup: number;
    userGroup: number;
    usersInGroups: number;
  };
  topStores: Array<{
    id: number;
    code: string;
    name: string;
    groupCount: number;
  }>;
  locationStats: Array<{
    location: string;
    count: number;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    stores: T[];
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

export interface SingleStoreResponse {
  success: boolean;
  data: Store;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data: StoreStats;
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
    Code: string;
    Name: string;
    Location: string;
    Status: string;
    'Total Groups': number;
    'Total Users': number;
    Groups: string;
    'Created At': string;
  }>;
  total: number;
  error?: string;
}

export interface StoreGroupResponse {
  success: boolean;
  data: Store;
  message?: string;
  error?: string;
}

export interface AvailableGroupsResponse {
  success: boolean;
  data: Group[];
  message?: string;
  error?: string;
}

// ================================================================
// STORE SERVICE
// ================================================================

class StoreService {
  // ================================================================
  // STORE CRUD OPERATIONS
  // ================================================================

  /**
   * Get all stores with pagination and filtering
   * GET /api/stores
   */
  async getStores(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedResponse<Store>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.location) queryParams.append('location', params.location);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString() 
        ? `/stores?${queryParams.toString()}`
        : '/stores';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get stores error:', error);
      return {
        success: false,
        data: {
          stores: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        },
        error: error.response?.data?.error || 'Failed to fetch stores'
      };
    }
  }

  /**
   * Get single store by ID
   * GET /api/stores/:id
   */
  async getStoreById(id: number | string): Promise<SingleStoreResponse> {
    try {
      const response = await api.get(`/stores/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get store by ID error:', error);
      return {
        success: false,
        data: {} as Store,
        error: error.response?.data?.error || 'Failed to fetch store'
      };
    }
  }

  /**
   * Get store by code
   * GET /api/stores/code/:code
   */
  async getStoreByCode(code: string): Promise<SingleStoreResponse> {
    try {
      const response = await api.get(`/stores/code/${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Get store by code error:', error);
      return {
        success: false,
        data: {} as Store,
        error: error.response?.data?.error || 'Failed to fetch store'
      };
    }
  }

  /**
   * Generate next store code
   * GET /api/stores/generate-code
   */
  async generateStoreCode(): Promise<GenerateCodeResponse> {
    try {
      const response = await api.get('/stores/generate-code');
      return response.data;
    } catch (error: any) {
      console.error('Generate store code error:', error);
      return {
        success: false,
        data: { code: '' },
        error: error.response?.data?.error || 'Failed to generate code'
      };
    }
  }

  /**
   * Create a new store
   * POST /api/stores
   */
  async createStore(storeData: { 
    name: string; 
    location?: string; 
    status?: string 
  }): Promise<SingleStoreResponse> {
    try {
      const response = await api.post('/stores', storeData);
      return response.data;
    } catch (error: any) {
      console.error('Create store error:', error);
      return {
        success: false,
        data: {} as Store,
        error: error.response?.data?.error || 'Failed to create store'
      };
    }
  }

  /**
   * Update a store
   * PUT /api/stores/:id
   */
  async updateStore(
    id: number | string, 
    storeData: { 
      name?: string; 
      location?: string; 
      status?: string 
    }
  ): Promise<SingleStoreResponse> {
    try {
      const response = await api.put(`/stores/${id}`, storeData);
      return response.data;
    } catch (error: any) {
      console.error('Update store error:', error);
      return {
        success: false,
        data: {} as Store,
        error: error.response?.data?.error || 'Failed to update store'
      };
    }
  }

  /**
   * Update store status
   * PATCH /api/stores/:id/status
   */
  async updateStoreStatus(
    id: number | string, 
    status: 'Active' | 'Inactive' | 'Closed'
  ): Promise<{
    success: boolean;
    message: string;
    data?: Store;
    error?: string;
  }> {
    try {
      const response = await api.patch(`/stores/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Update store status error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to update status'
      };
    }
  }

  /**
   * Soft delete a store (set status to Closed)
   * DELETE /api/stores/:id
   */
  async deleteStore(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: { id: number; code: string; name: string; status: string };
    error?: string;
  }> {
    try {
      const response = await api.delete(`/stores/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete store error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to delete store'
      };
    }
  }

  /**
   * Permanently delete a store
   * DELETE /api/stores/:id/permanent
   */
  async permanentDeleteStore(id: number | string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/stores/${id}/permanent`);
      return response.data;
    } catch (error: any) {
      console.error('Permanent delete store error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to permanently delete store'
      };
    }
  }

  // ================================================================
  // STORE-GROUP RELATIONSHIP OPERATIONS
  // ================================================================

  /**
   * Get available groups for a store (for dropdown)
   * GET /api/stores/:storeId/available-groups
   */
  async getAvailableGroupsForStore(storeId: number | string): Promise<AvailableGroupsResponse> {
    try {
      const id = storeId || 0;
      const response = await api.get(`/stores/${id}/available-groups`);
      return response.data;
    } catch (error: any) {
      console.error('Get available groups error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch available groups'
      };
    }
  }

  /**
   * Get all groups (for dropdown)
   * GET /api/stores/groups
   */
  async getAllGroups(): Promise<AvailableGroupsResponse> {
    try {
      const response = await api.get('/stores/groups');
      return response.data;
    } catch (error: any) {
      console.error('Get all groups error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch groups'
      };
    }
  }

  /**
   * Get all groups assigned to a store
   * GET /api/stores/:storeId/groups
   */
  async getStoreGroups(storeId: number | string): Promise<{
    success: boolean;
    data: Group[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/stores/${storeId}/groups`);
      return response.data;
    } catch (error: any) {
      console.error('Get store groups error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch store groups'
      };
    }
  }

  /**
   * Add group to store
   * POST /api/stores/:storeId/groups/:groupId
   */
  async addGroupToStore(
    storeId: number | string, 
    groupId: number | string
  ): Promise<StoreGroupResponse> {
    try {
      const response = await api.post(`/stores/${storeId}/groups/${groupId}`);
      return response.data;
    } catch (error: any) {
      console.error('Add group to store error:', error);
      return {
        success: false,
        data: {} as Store,
        error: error.response?.data?.error || 'Failed to add group to store'
      };
    }
  }

  /**
   * Remove group from store
   * DELETE /api/stores/:storeId/groups/:groupId
   */
  async removeGroupFromStore(
    storeId: number | string, 
    groupId: number | string
  ): Promise<StoreGroupResponse> {
    try {
      const response = await api.delete(`/stores/${storeId}/groups/${groupId}`);
      return response.data;
    } catch (error: any) {
      console.error('Remove group from store error:', error);
      return {
        success: false,
        data: {} as Store,
        error: error.response?.data?.error || 'Failed to remove group from store'
      };
    }
  }

  

  // ================================================================
  // USER OPERATIONS (FOR DROPDOWN)
  // ================================================================

  /**
   * Get all users (for dropdown)
   * GET /api/stores/users
   */
  async getAllUsers(): Promise<{
    success: boolean;
    data: User[];
    error?: string;
  }> {
    try {
      const response = await api.get('/stores/users');
      return response.data;
    } catch (error: any) {
      console.error('Get all users error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  }

  // ================================================================
  // STATISTICS & EXPORT
  // ================================================================

  /**
   * Get store statistics
   * GET /api/stores/statistics
   */
  async getStoreStatistics(): Promise<StatsResponse> {
    try {
      const response = await api.get('/stores/statistics');
      return response.data;
    } catch (error: any) {
      console.error('Get store statistics error:', error);
      return {
        success: false,
        data: {
          stores: {
            total: 0,
            active: 0,
            inactive: 0,
            closed: 0
          },
          groups: {
            total: 0,
            active: 0,
            inactive: 0
          },
          relations: {
            storeGroup: 0,
            userGroup: 0,
            usersInGroups: 0
          },
          topStores: [],
          locationStats: []
        },
        error: error.response?.data?.error || 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Export stores as CSV data
   * GET /api/stores/export
   */
  async exportStores(params?: {
    status?: string;
    location?: string;
  }): Promise<ExportResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.location) queryParams.append('location', params.location);

      const url = queryParams.toString() 
        ? `/stores/export?${queryParams.toString()}`
        : '/stores/export';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export stores error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export stores'
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Get total users across all groups in a store
   */
  getTotalUsers(store: Store): number {
    let count = 0;
    store.groups?.forEach(group => {
      count += group.users?.length || 0;
    });
    return count;
  }

  /**
   * Get store status color for badges
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Inactive':
        return 'yellow';
      case 'Closed':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Format store location display
   */
  formatLocation(store: Store): string {
    return store.location || '-';
  }

  /**
   * Check if store has groups
   */
  hasGroups(store: Store): boolean {
    return store.groups && store.groups.length > 0;
  }

  /**
   * Get group names as comma-separated string
   */
  getGroupNames(store: Store): string {
    if (!store.groups || store.groups.length === 0) {
      return 'No groups';
    }
    return store.groups.map(g => g.name).join(', ');
  }

  /**
   * Get group count
   */
  getGroupCount(store: Store): number {
    return store.groups?.length || 0;
  }

  /**
   * Check if store is active
   */
  isStoreActive(store: Store): boolean {
    return store.status === 'Active';
  }

  /**
   * Format store code with styling
   */
  formatStoreCode(store: Store): string {
    return store.code || '';
  }

  /**
   * Get store display name with location
   */
  getStoreDisplayName(store: Store): string {
    if (store.location) {
      return `${store.name} (${store.location})`;
    }
    return store.name;
  }

  /**
   * Get user count for a specific group
   */
  getGroupUserCount(group: Group): number {
    return group.users?.length || 0;
  }

  /**
   * Check if a group is assigned to a store
   */
  isGroupAssignedToStore(store: Store, groupId: number | string): boolean {
    return store.groups?.some(g => g.id === groupId) || false;
  }

  /**
   * Get available groups for a store (not yet assigned)
   */
  getAvailableGroupsForStoreFromList(store: Store, allGroups: Group[]): Group[] {
    const assignedGroupIds = store.groups?.map(g => g.id) || [];
    return allGroups.filter(g => !assignedGroupIds.includes(g.id));
  }

  /**
   * Sort stores by name
   */
  sortStoresByName(stores: Store[], ascending: boolean = true): Store[] {
    return [...stores].sort((a, b) => {
      if (ascending) {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });
  }

  /**
   * Filter stores by status
   */
  filterStoresByStatus(stores: Store[], status: string): Store[] {
    if (!status) return stores;
    return stores.filter(store => store.status === status);
  }

  /**
   * Filter stores by location
   */
  filterStoresByLocation(stores: Store[], location: string): Store[] {
    if (!location) return stores;
    return stores.filter(store => store.location === location);
  }

  /**
   * Search stores by term
   */
  searchStores(stores: Store[], term: string): Store[] {
    if (!term) return stores;
    const lowerTerm = term.toLowerCase();
    return stores.filter(store =>
      store.name.toLowerCase().includes(lowerTerm) ||
      store.code.toLowerCase().includes(lowerTerm) ||
      store.location?.toLowerCase().includes(lowerTerm)
    );
  }

  /**
   * Get unique locations from stores
   */
  getUniqueLocations(stores: Store[]): string[] {
    const locations = new Set<string>();
    stores.forEach(store => {
      if (store.location) {
        locations.add(store.location);
      }
    });
    return Array.from(locations).sort();
  }

  /**
   * Get status distribution
   */
  getStatusDistribution(stores: Store[]): { status: string; count: number }[] {
    const distribution = new Map<string, number>();
    stores.forEach(store => {
      const status = store.status || 'Active';
      distribution.set(status, (distribution.get(status) || 0) + 1);
    });
    return Array.from(distribution.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }
}

export default new StoreService();