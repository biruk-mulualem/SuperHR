// stores/purchasingGroupService.ts
import api from './interceptor';

// ================================================================
// TYPES
// ================================================================

export interface PurchasingGroupMember {
  id: number;
  userId: number;
  username: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  department?: string | null;
  role?: string;
  isActive?: boolean;
  joinedAt?: string;
}

export interface PurchasingGroup {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive';
  members: PurchasingGroupMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableUser {
  userId: number;
  username: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  department?: string | null;
  role?: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface GroupListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedGroupsResponse {
  success: boolean;
  data: {
    items: PurchasingGroup[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface SingleGroupResponse {
  success: boolean;
  data: PurchasingGroup;
  message?: string;
  error?: string;
  details?: {
    missing?: number[];
  };
}

export interface AvailableUsersResponse {
  success: boolean;
  data: {
    items: AvailableUser[];
  };
  error?: string;
}

export interface GroupStats {
  total: number;
  active: number;
  inactive: number;
  totalMembers: number;
}

export interface GroupStatsResponse {
  success: boolean;
  data: GroupStats;
  error?: string;
}

// ================================================================
// PURCHASING GROUP SERVICE
// ================================================================

class PurchasingGroupService {
  // ================================================================
  // LIST + STATS
  // ================================================================

  /**
   * Get paginated list of purchasing groups
   * GET /api/purchasing-groups
   */
  async getGroups(params: GroupListParams = {}): Promise<PaginatedGroupsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString()
        ? `/purchasing-groups?${queryParams.toString()}`
        : '/purchasing-groups';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get purchasing groups error:', error);
      return {
        success: false,
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
        error: error.response?.data?.error || 'Failed to fetch purchasing groups',
      };
    }
  }

  /**
   * Get statistics (counts by status + total members)
   * GET /api/purchasing-groups/stats
   */
  async getStats(): Promise<GroupStatsResponse> {
    try {
      const response = await api.get('/purchasing-groups/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get purchasing group stats error:', error);
      return {
        success: false,
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          totalMembers: 0,
        },
        error: error.response?.data?.error || 'Failed to fetch group statistics',
      };
    }
  }

  // ================================================================
  // SINGLE GROUP
  // ================================================================

  /**
   * Get single group by ID (includes members)
   * GET /api/purchasing-groups/:id
   */
  async getGroupById(id: number | string): Promise<SingleGroupResponse> {
    try {
      const response = await api.get(`/purchasing-groups/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get purchasing group by ID error:', error);
      return {
        success: false,
        data: {} as PurchasingGroup,
        error: error.response?.data?.error || 'Failed to fetch purchasing group',
      };
    }
  }

  // ================================================================
  // CREATE / UPDATE / DELETE
  // ================================================================

  /**
   * Create a new purchasing group
   * POST /api/purchasing-groups
   */
  async createGroup(data: CreateGroupData): Promise<SingleGroupResponse> {
    try {
      const response = await api.post('/purchasing-groups', data);
      return response.data;
    } catch (error: any) {
      console.error('Create purchasing group error:', error);
      return {
        success: false,
        data: {} as PurchasingGroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to create purchasing group',
      };
    }
  }

  /**
   * Update an existing purchasing group
   * PUT /api/purchasing-groups/:id
   */
  async updateGroup(
    id: number | string,
    data: UpdateGroupData
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.put(`/purchasing-groups/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update purchasing group error:', error);
      return {
        success: false,
        data: {} as PurchasingGroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to update purchasing group',
      };
    }
  }

  /**
   * Delete a purchasing group
   * DELETE /api/purchasing-groups/:id
   */
  async deleteGroup(id: number | string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/purchasing-groups/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete purchasing group error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete purchasing group',
      };
    }
  }

  // ================================================================
  // MEMBERS
  // ================================================================

  /**
   * Get users not yet in the group (for Add-Members panel)
   * GET /api/purchasing-groups/:id/available-users?search=
   */
  async getAvailableUsers(
    groupId: number | string,
    search = ''
  ): Promise<AvailableUsersResponse> {
    try {
      const url = search
        ? `/purchasing-groups/${groupId}/available-users?search=${encodeURIComponent(search)}`
        : `/purchasing-groups/${groupId}/available-users`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get available users error:', error);
      return {
        success: false,
        data: { items: [] },
        error: error.response?.data?.error || 'Failed to fetch available users',
      };
    }
  }

  /**
   * Replace the full set of members (used by "Save Changes")
   * PUT /api/purchasing-groups/:id/members
   */
  async setMembers(
    groupId: number | string,
    userIds: number[]
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.put(`/purchasing-groups/${groupId}/members`, {
        userIds,
      });
      return response.data;
    } catch (error: any) {
      console.error('Set members error:', error);
      return {
        success: false,
        data: {} as PurchasingGroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to save members',
        details: error.response?.data?.details,
      };
    }
  }

  /**
   * Add members (append, does not replace)
   * POST /api/purchasing-groups/:id/members
   */
  async addMembers(
    groupId: number | string,
    userIds: number[]
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.post(`/purchasing-groups/${groupId}/members`, {
        userIds,
      });
      return response.data;
    } catch (error: any) {
      console.error('Add members error:', error);
      return {
        success: false,
        data: {} as PurchasingGroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to add members',
        details: error.response?.data?.details,
      };
    }
  }

  /**
   * Remove a single member
   * DELETE /api/purchasing-groups/:id/members/:userId
   */
  async removeMember(
    groupId: number | string,
    userId: number | string
  ): Promise<SingleGroupResponse> {
    try {
      const response = await api.delete(
        `/purchasing-groups/${groupId}/members/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Remove member error:', error);
      return {
        success: false,
        data: {} as PurchasingGroup,
        error: error.response?.data?.error || 'Failed to remove member',
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Get initials from a member's name
   */
  getMemberInitials(member: PurchasingGroupMember | AvailableUser | null): string {
    const name = member?.fullName || member?.full_name || member?.username || '';
    if (!name.trim()) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return (parts[0] ?? '').substring(0, 2).toUpperCase();
    }

    const firstInitial = parts[0]?.[0] ?? '';
    const lastInitial = parts[parts.length - 1]?.[0] ?? '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  /**
   * Get display name for a member
   */
  getMemberDisplayName(member: PurchasingGroupMember | AvailableUser | null): string {
    if (!member) return 'Unknown User';
    return (
      member.fullName ||
      member.full_name ||
      member.username ||
      'Unknown User'
    );
  }

  /**
   * Format date
   */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format date-time
   */
  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get member count label
   */
  getMemberCountLabel(group: PurchasingGroup | null): string {
    const count = group?.members?.length || 0;
    return `${count} member${count === 1 ? '' : 's'}`;
  }

  /**
   * Get member names for a group (comma separated, truncated)
   */
  getMemberNames(group: PurchasingGroup | null, max = 3): string {
    const members = group?.members || [];
    if (members.length === 0) return 'No members';

    const names = members
      .slice(0, max)
      .map((m) => this.getMemberDisplayName(m))
      .join(', ');

    return members.length > max
      ? `${names} +${members.length - max} more`
      : names;
  }

  /**
   * Get status badge class
   */
  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      active: 'success',
      inactive: 'secondary',
    };
    return map[status] || 'secondary';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      active: '✅',
      inactive: '⏸️',
    };
    return map[status] || '📦';
  }

  /**
   * Get status display name
   */
  getStatusDisplay(status: string): string {
    const map: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
    };
    return map[status] || status;
  }

  /**
   * Check if group is active
   */
  isActive(group: PurchasingGroup | null): boolean {
    return group?.status === 'active';
  }

  /**
   * Check if a user is already a member of the group
   */
  isMember(group: PurchasingGroup | null, userId: number): boolean {
    if (!group?.members) return false;
    return group.members.some((m) => m.userId === userId);
  }

  /**
   * Compute diff of members to know what changed
   * Useful for optimistic UI or "unsaved changes" badge
   */
  diffMembers(
    original: PurchasingGroupMember[],
    next: PurchasingGroupMember[]
  ): { added: number[]; removed: number[]; unchanged: number[] } {
    const origIds = new Set(original.map((m) => m.userId));
    const nextIds = new Set(next.map((m) => m.userId));

    const added = [...nextIds].filter((id) => !origIds.has(id));
    const removed = [...origIds].filter((id) => !nextIds.has(id));
    const unchanged = [...origIds].filter((id) => nextIds.has(id));

    return { added, removed, unchanged };
  }

  /**
   * Validate group form data
   */
  validateGroupForm(data: { name?: string }): string[] {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) {
      errors.push('Group name is required');
    } else if (data.name.trim().length < 2) {
      errors.push('Group name must be at least 2 characters');
    } else if (data.name.trim().length > 120) {
      errors.push('Group name must be at most 120 characters');
    }
    return errors;
  }
}

export default new PurchasingGroupService();