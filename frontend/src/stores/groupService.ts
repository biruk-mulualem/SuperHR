// stores/groupService.js
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
  storeId?: number | null;
  storeName?: string | null;
  storeLocation?: string | null;
  users?: User[];
  totalMembers?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

export interface GroupStats {
  overview: {
    total: number;
    active: number;
    inactive: number;
  };
  byStore: Array<{
    storeName: string;
    groupCount: number;
  }>;
  topGroups: Array<{
    id: number;
    code: string;
    name: string;
    userCount: number;
  }>;
  totalUsersInGroups: number;
}

export interface PaginatedGroupResponse {
  success: boolean;
  data: {
    groups: Group[];
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

export interface SingleGroupResponse {
  success: boolean;
  data: Group;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data: GroupStats;
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
    'Group Code': string;
    'Group Name': string;
    Store: string;
    Status: string;
    'Members Count': number;
    Members: string;
    'Created At': string;
  }>;
  total: number;
  error?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  message?: string;
  error?: string;
}

// ================================================================
// GROUP SERVICE
// ================================================================

class GroupService {
  // ================================================================
  // GROUP CRUD OPERATIONS
  // ================================================================

  /**
   * Get all groups with pagination and filtering
   * GET /api/groups
   */
  async getGroups(params: {
    page?: number;
    limit?: number;
    search?: string;
    storeId?: string | number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedGroupResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString() 
        ? `/groups?${queryParams.toString()}`
        : '/groups';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get groups error:', error);
      return {
        success: false,
        data: {
          groups: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        },
        error: error.response?.data?.error || 'Failed to fetch groups'
      };
    }
  }

  /**
   * Get single group by ID
   * GET /api/groups/:id
   */
  async getGroupById(id: number | string): Promise<SingleGroupResponse> {
    try {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get group by ID error:', error);
      return {
        success: false,
        data: {} as Group,
        error: error.response?.data?.error || 'Failed to fetch group'
      };
    }
  }

  /**
   * Generate next group code
   * GET /api/groups/generate-code
   */
  async generateGroupCode(): Promise<GenerateCodeResponse> {
    try {
      const response = await api.get('/groups/generate-code');
      return response.data;
    } catch (error: any) {
      console.error('Generate group code error:', error);
      return {
        success: false,
        data: { code: '' },
        error: error.response?.data?.error || 'Failed to generate code'
      };
    }
  }

  /**
   * Create a new group
   * POST /api/groups
   */
  async createGroup(groupData: { 
    name: string; 
    storeId: number | string; 
    status?: string;
    description?: string;
  }): Promise<SingleGroupResponse> {
    try {
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error: any) {
      console.error('Create group error:', error);
      return {
        success: false,
        data: {} as Group,
        error: error.response?.data?.error || 'Failed to create group'
      };
    }
  }

  /**
   * Update a group
   * PUT /api/groups/:id
   */
  async updateGroup(
    id: number | string, 
    groupData: { 
      name?: string; 
      storeId?: number | string; 
      status?: string;
      description?: string;
    }
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.put(`/groups/${id}`, groupData);
      return response.data;
    } catch (error: any) {
      console.error('Update group error:', error);
      return {
        success: false,
        data: {} as Group,
        error: error.response?.data?.error || 'Failed to update group'
      };
    }
  }

  /**
   * Update group status
   * PATCH /api/groups/:id/status
   */
  async updateGroupStatus(
    id: number | string, 
    status: 'Active' | 'Inactive'
  ): Promise<{
    success: boolean;
    message: string;
    data?: Group;
    error?: string;
  }> {
    try {
      const response = await api.patch(`/groups/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Update group status error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to update status'
      };
    }
  }

  /**
   * Soft delete a group (set status to Inactive)
   * DELETE /api/groups/:id
   */
  async deleteGroup(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: { id: number; code: string; name: string; status: string };
    error?: string;
  }> {
    try {
      const response = await api.delete(`/groups/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete group error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to delete group'
      };
    }
  }

  /**
   * Permanently delete a group
   * DELETE /api/groups/:id/permanent
   */
  async permanentDeleteGroup(id: number | string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/groups/${id}/permanent`);
      return response.data;
    } catch (error: any) {
      console.error('Permanent delete group error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to permanently delete group'
      };
    }
  }

  // ================================================================
  // USER MANAGEMENT IN GROUPS
  // ================================================================

  /**
   * Get all users (for dropdown)
   * GET /api/groups/users
   */
  async getAllUsers(): Promise<UsersResponse> {
    try {
      const response = await api.get('/groups/users');
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

  /**
   * Get users in a group
   * GET /api/groups/:groupId/users
   */
  async getGroupUsers(groupId: number | string): Promise<UsersResponse> {
    try {
      const response = await api.get(`/groups/${groupId}/users`);
      return response.data;
    } catch (error: any) {
      console.error('Get group users error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch group users'
      };
    }
  }

  /**
   * Add user to group
   * POST /api/groups/:groupId/users/:userId
   */
  async addUserToGroup(
    groupId: number | string, 
    userId: number | string
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.post(`/groups/${groupId}/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Add user to group error:', error);
      return {
        success: false,
        data: {} as Group,
        error: error.response?.data?.error || 'Failed to add user to group'
      };
    }
  }

  /**
   * Remove user from group
   * DELETE /api/groups/:groupId/users/:userId
   */
  async removeUserFromGroup(
    groupId: number | string, 
    userId: number | string
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.delete(`/groups/${groupId}/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Remove user from group error:', error);
      return {
        success: false,
        data: {} as Group,
        error: error.response?.data?.error || 'Failed to remove user from group'
      };
    }
  }

  // ================================================================
  // STATISTICS & EXPORT
  // ================================================================

  /**
   * Get group statistics
   * GET /api/groups/statistics
   */
  async getGroupStatistics(): Promise<StatsResponse> {
    try {
      const response = await api.get('/groups/statistics');
      return response.data;
    } catch (error: any) {
      console.error('Get group statistics error:', error);
      return {
        success: false,
        data: {
          overview: {
            total: 0,
            active: 0,
            inactive: 0
          },
          byStore: [],
          topGroups: [],
          totalUsersInGroups: 0
        },
        error: error.response?.data?.error || 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Export groups as CSV data
   * GET /api/groups/export
   */
  async exportGroups(params?: {
    status?: string;
    storeId?: string | number;
  }): Promise<ExportResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());

      const url = queryParams.toString() 
        ? `/groups/export?${queryParams.toString()}`
        : '/groups/export';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export groups error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export groups'
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
    switch (status) {
      case 'Active':
        return 'green';
      case 'Inactive':
        return 'yellow';
      default:
        return 'gray';
    }
  }

  /**
   * Check if group is active
   */
  isGroupActive(group: Group): boolean {
    return group.status === 'Active';
  }

  /**
   * Get member count display
   */
  getMemberCountDisplay(group: Group): string {
    const count = group.users?.length || 0;
    return count === 0 ? 'No members' : `${count} member${count > 1 ? 's' : ''}`;
  }

  /**
   * Get first 3 members for display
   */
  getDisplayMembers(group: Group, limit: number = 3): User[] {
    return group.users?.slice(0, limit) || [];
  }

  /**
   * Check if group has more members than display limit
   */
  hasMoreMembers(group: Group, limit: number = 3): boolean {
    return (group.users?.length || 0) > limit;
  }

  /**
   * Get remaining member count
   */
  getRemainingMemberCount(group: Group, limit: number = 3): number {
    return Math.max(0, (group.users?.length || 0) - limit);
  }

  /**
   * Format group name with code
   */
  getGroupDisplayName(group: Group): string {
    return `${group.name} (${group.code})`;
  }

  /**
   * Get store display name
   */
  getStoreDisplayName(group: Group): string {
    return group.storeName || '-';
  }
}

export default new GroupService();