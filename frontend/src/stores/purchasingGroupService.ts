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
  subgroups: PurchasingSubgroup[];
  createdAt?: string;
  updatedAt?: string;
}

// ================================================================
// SUBGROUP TYPES
// ================================================================

export interface PurchasingSubgroupMember {
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

export interface PurchasingSubgroup {
  id: number;
  code: string;
  groupId: number;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive';
  members: PurchasingSubgroupMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubgroupData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateSubgroupData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface SingleSubgroupResponse {
  success: boolean;
  data: PurchasingSubgroup;
  message?: string;
  error?: string;
  details?: {
    conflicts?: Array<{ userId: number; subgroup: string | null }>;
  };
}

// ================================================================
// SEQUENCE TYPES  (NEW)
// ================================================================

export interface SequenceGroup {
  id: number;
  name: string;
  code: string;
  subgroupCount: number;
  memberCount: number;
  subgroupNames: string[];
}

export interface SequenceStage {
  id: number;
  label: string;
  orderIndex: number;
  groups: SequenceGroup[];
}

export interface SequenceResponse {
  success: boolean;
  data: {
    items: SequenceStage[];
  };
  message?: string;
  error?: string;
}

// ================================================================
// EXISTING TYPES
// ================================================================

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
  totalSubgroups?: number;
  totalSubgroupMembers?: number;
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
          totalSubgroups: 0,
          totalSubgroupMembers: 0,
        },
        error: error.response?.data?.error || 'Failed to fetch group statistics',
      };
    }
  }

  // ================================================================
  // SINGLE GROUP
  // ================================================================

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
  // CREATE / UPDATE / DELETE (group)
  // ================================================================

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
  // GROUP-LEVEL MEMBERS
  // ================================================================

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
  // SUBGROUPS
  // ================================================================

  async createSubgroup(
    groupId: number | string,
    data: CreateSubgroupData
  ): Promise<SingleSubgroupResponse> {
    try {
      const response = await api.post(
        `/purchasing-groups/${groupId}/subgroups`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Create subgroup error:', error);
      return {
        success: false,
        data: {} as PurchasingSubgroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to create subgroup',
      };
    }
  }

  async updateSubgroup(
    groupId: number | string,
    subgroupId: number | string,
    data: UpdateSubgroupData
  ): Promise<SingleSubgroupResponse> {
    try {
      const response = await api.put(
        `/purchasing-groups/${groupId}/subgroups/${subgroupId}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Update subgroup error:', error);
      return {
        success: false,
        data: {} as PurchasingSubgroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to update subgroup',
      };
    }
  }

  async deleteSubgroup(
    groupId: number | string,
    subgroupId: number | string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.delete(
        `/purchasing-groups/${groupId}/subgroups/${subgroupId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Delete subgroup error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete subgroup',
      };
    }
  }

  // ================================================================
  // SUBGROUP MEMBERS
  // ================================================================

  async getAvailableSubgroupUsers(
    groupId: number | string,
    subgroupId: number | string,
    search = ''
  ): Promise<AvailableUsersResponse> {
    try {
      const url = search
        ? `/purchasing-groups/${groupId}/subgroups/${subgroupId}/available-users?search=${encodeURIComponent(search)}`
        : `/purchasing-groups/${groupId}/subgroups/${subgroupId}/available-users`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get available subgroup users error:', error);
      return {
        success: false,
        data: { items: [] },
        error:
          error.response?.data?.error || 'Failed to fetch available users',
      };
    }
  }

  async addSubgroupMembers(
    groupId: number | string,
    subgroupId: number | string,
    userIds: number[]
  ): Promise<SingleSubgroupResponse> {
    try {
      const response = await api.post(
        `/purchasing-groups/${groupId}/subgroups/${subgroupId}/members`,
        { userIds }
      );
      return response.data;
    } catch (error: any) {
      console.error('Add subgroup members error:', error);
      return {
        success: false,
        data: {} as PurchasingSubgroup,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to add members',
        details: error.response?.data?.details,
      };
    }
  }

  async removeSubgroupMember(
    groupId: number | string,
    subgroupId: number | string,
    userId: number | string
  ): Promise<SingleSubgroupResponse> {
    try {
      const response = await api.delete(
        `/purchasing-groups/${groupId}/subgroups/${subgroupId}/members/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Remove subgroup member error:', error);
      return {
        success: false,
        data: {} as PurchasingSubgroup,
        error: error.response?.data?.error || 'Failed to remove member',
      };
    }
  }

  // ================================================================
  // APPROVAL SEQUENCE  (NEW)
  // ================================================================

  /**
   * Get the current approval sequence (ordered stages with their groups)
   * GET /api/purchasing-groups/sequence
   */
  async getSequence(): Promise<SequenceResponse> {
    try {
      const response = await api.get('/purchasing-groups/sequence');
      return response.data;
    } catch (error: any) {
      console.error('Get sequence error:', error);
      return {
        success: false,
        data: { items: [] },
        error: error.response?.data?.error || 'Failed to load sequence',
      };
    }
  }

  /**
   * Replace the entire approval sequence with a new set of stages
   * PUT /api/purchasing-groups/sequence
   *
   * Note: only `id` and `name` fields matter on each group; the backend
   * ignores the rest and reconstructs full group info from the DB.
   */
  async saveSequence(stages: SequenceStage[]): Promise<SequenceResponse> {
    try {
      const payload = {
        stages: stages.map((s, i) => ({
          label: s.label || '',
          orderIndex: i + 1,
          groups: (s.groups || []).map((g) => ({
            id: g.id,
            name: g.name,
          })),
        })),
      };

      const response = await api.put('/purchasing-groups/sequence', payload);
      return response.data;
    } catch (error: any) {
      console.error('Save sequence error:', error);
      return {
        success: false,
        data: { items: [] },
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to save sequence',
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  getMemberInitials(
    member: PurchasingGroupMember | PurchasingSubgroupMember | AvailableUser | null
  ): string {
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

  getMemberDisplayName(
    member: PurchasingGroupMember | PurchasingSubgroupMember | AvailableUser | null
  ): string {
    if (!member) return 'Unknown User';
    return (
      member.fullName ||
      member.full_name ||
      member.username ||
      'Unknown User'
    );
  }

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

  getMemberCountLabel(group: PurchasingGroup | null): string {
    const count = group?.members?.length || 0;
    return `${count} member${count === 1 ? '' : 's'}`;
  }

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

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      active: 'success',
      inactive: 'secondary',
    };
    return map[status] || 'secondary';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      active: '✅',
      inactive: '⏸️',
    };
    return map[status] || '📦';
  }

  getStatusDisplay(status: string): string {
    const map: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
    };
    return map[status] || status;
  }

  isActive(group: PurchasingGroup | null): boolean {
    return group?.status === 'active';
  }

  isMember(group: PurchasingGroup | null, userId: number): boolean {
    if (!group?.members) return false;
    return group.members.some((m) => m.userId === userId);
  }

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

  validateSubgroupForm(data: { name?: string }): string[] {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) {
      errors.push('Subgroup name is required');
    } else if (data.name.trim().length < 2) {
      errors.push('Subgroup name must be at least 2 characters');
    } else if (data.name.trim().length > 120) {
      errors.push('Subgroup name must be at most 120 characters');
    }
    return errors;
  }

  // ================================================================
  // SUBGROUP HELPERS
  // ================================================================

  countGroupSubgroupMembers(group: PurchasingGroup | null): number {
    if (!group?.subgroups) return 0;
    return group.subgroups.reduce((sum, sg) => sum + (sg.members?.length || 0), 0);
  }

  findSubgroupOfUser(
    group: PurchasingGroup | null,
    userId: number
  ): PurchasingSubgroup | null {
    if (!group?.subgroups) return null;
    return (
      group.subgroups.find((sg) =>
        sg.members.some((m) => m.userId === userId)
      ) || null
    );
  }

  isUserInAnySubgroup(group: PurchasingGroup | null, userId: number): boolean {
    return this.findSubgroupOfUser(group, userId) !== null;
  }

  getSubgroupMemberCountLabel(subgroup: PurchasingSubgroup | null): string {
    const count = subgroup?.members?.length || 0;
    return `${count} member${count === 1 ? '' : 's'}`;
  }

  getSubgroupMemberNames(subgroup: PurchasingSubgroup | null, max = 3): string {
    const members = subgroup?.members || [];
    if (members.length === 0) return 'No members';

    const names = members
      .slice(0, max)
      .map((m) => this.getMemberDisplayName(m))
      .join(', ');

    return members.length > max
      ? `${names} +${members.length - max} more`
      : names;
  }
}

export default new PurchasingGroupService();