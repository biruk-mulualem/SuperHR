// super-app/src/stores/mobilePostsGroupService.js
import api from './interceptor';

export const mobilePostsGroupService = {
  // ==========================================================================
  // GROUPS
  // ==========================================================================

  /**
   * List groups the current user can see.
   * GET {API_BASE}/mobile/groups
   */
  listGroups: async (opts = {}) => {
    const { filter = 'active', search = '', page = 1, limit = 20 } = opts;
    const response = await api.get('/mobile/groups', {
      params: { filter, search, page, limit },
    });
    return response.data;
  },

  /**
   * Get a single group.
   * GET {API_BASE}/mobile/groups/:id
   */
  getGroup: async (groupId) => {
    const response = await api.get(`/mobile/groups/${groupId}`);
    return response.data;
  },

  /**
   * Create a group.
   * POST {API_BASE}/mobile/groups
   */
  createGroup: async (payload) => {
    const response = await api.post('/mobile/groups', payload);
    return response.data;
  },

  /**
   * Update group fields (owner only).
   * PATCH {API_BASE}/mobile/groups/:id
   */
  updateGroup: async (groupId, payload) => {
    const response = await api.patch(`/mobile/groups/${groupId}`, payload);
    return response.data;
  },

  /**
   * Delete a group (owner only). `confirm` must equal the exact group name.
   * DELETE {API_BASE}/mobile/groups/:id
   */
  deleteGroup: async (groupId, confirm) => {
    const response = await api.delete(`/mobile/groups/${groupId}`, {
      data: { confirm },
    });
    return response.data;
  },

  /**
   * Activate a group (owner only).
   * POST {API_BASE}/mobile/groups/:id/activate
   */
  activateGroup: async (groupId) => {
    const response = await api.post(`/mobile/groups/${groupId}/activate`);
    return response.data;
  },

  /**
   * Deactivate a group (owner only).
   * POST {API_BASE}/mobile/groups/:id/deactivate
   */
  deactivateGroup: async (groupId) => {
    const response = await api.post(`/mobile/groups/${groupId}/deactivate`);
    return response.data;
  },

  /**
   * Leave a group.
   * POST {API_BASE}/mobile/groups/:id/leave
   * If the caller is the owner, `transferTo` is required.
   */
  leaveGroup: async (groupId, opts = {}) => {
    const body = opts.transferTo ? { transferTo: opts.transferTo } : {};
    const response = await api.post(`/mobile/groups/${groupId}/leave`, body);
    return response.data;
  },

  // ==========================================================================
  // MEMBERS
  // ==========================================================================

  /**
   * List members of a group.
   * GET {API_BASE}/mobile/groups/:id/members
   */
  listMembers: async (groupId, status) => {
    const response = await api.get(`/mobile/groups/${groupId}/members`, {
      params: status ? { status } : {},
    });
    return response.data;
  },

  /**
   * Invite a user to the group (owner only).
   * POST {API_BASE}/mobile/groups/:id/members
   */
  addMember: async (groupId, userId) => {
    const response = await api.post(`/mobile/groups/${groupId}/members`, {
      userId,
    });
    return response.data;
  },

  /**
   * Remove a member (owner only).
   * DELETE {API_BASE}/mobile/groups/:id/members/:userId
   */
  removeMember: async (groupId, userId) => {
    const response = await api.delete(
      `/mobile/groups/${groupId}/members/${userId}`
    );
    return response.data;
  },

  // ==========================================================================
  // USER DIRECTORY — for the invite picker
  // ==========================================================================

  /**
   * List all active users (id + name + initials only).
   * GET {API_BASE}/mobile/groups/users/directory
   */
  listUsersDirectory: async () => {
    const response = await api.get('/mobile/groups/users/directory');
    return response.data;
  },
};

export default mobilePostsGroupService;