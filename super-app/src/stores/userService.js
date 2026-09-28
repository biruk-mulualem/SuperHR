// stores/userService.js
import { Platform } from 'react-native';
import api from './interceptor';

// ============================================================================
// USER SERVICE
// ============================================================================
class UsersService {
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users with advanced pagination, filters, and search.
   * Used for the Sales-Person dropdown on the price modal.
   */
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.search) queryParams.append('search', params.search);
      if (params.searchFields) queryParams.append('searchFields', params.searchFields);
      if (params.role && params.role !== 'all') queryParams.append('role', params.role.toString());
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.department && params.department !== 'all') queryParams.append('department', params.department.toString());
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.lastLoginFrom) queryParams.append('lastLoginFrom', params.lastLoginFrom);
      if (params.lastLoginTo) queryParams.append('lastLoginTo', params.lastLoginTo);
      if (params.employeeStatus && params.employeeStatus !== 'all') queryParams.append('employeeStatus', params.employeeStatus);

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);

      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
          startOffset: 0,
          endOffset: 0,
        },
        filters: response.data.filters || {},
        sorting: response.data.sorting || {},
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
          startOffset: 0,
          endOffset: 0,
        },
        filters: {},
        sorting: { field: '', order: '' },
      };
    }
  }

  /**
   * Advanced search users with exact/match options.
   */
  async advancedSearchUsers({ q, fields, exactMatch, page, limit }) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', q);
      if (fields) queryParams.append('fields', fields);
      if (exactMatch !== undefined) queryParams.append('exactMatch', exactMatch.toString());
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());

      const response = await api.get(`/users/advanced-search?${queryParams.toString()}`);

      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination,
        searchInfo: response.data.searchInfo,
      };
    } catch (error) {
      console.error('Advanced search error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search users',
        data: [],
      };
    }
  }

  /**
   * Get single user by ID (with full employee data + resolved avatar).
   */
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return {
        success: true,
        user: response.data.data,
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user',
      };
    }
  }

  // ============================================================================
  // PROFILE (mobile — logged-in user)
  // ============================================================================

  /**
   * Get the logged-in user's own profile.
   * Backed by GET /api/users/profile
   */
  async getMyProfile() {
    try {
      const response = await api.get('/users/profile');
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      console.error('Get my profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch profile',
      };
    }
  }

  /**
   * Update the logged-in user's own profile.
   * Backed by PUT /api/users/:id — the id is the logged-in userId.
   */
  async updateMyProfile(userId, payload) {
    try {
      const response = await api.put(`/users/${userId}`, payload);
      return {
        success: true,
        message: response.data.message || 'Profile updated successfully',
        user: response.data.user,
      };
    } catch (error) {
      console.error('Update my profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
      };
    }
  }

  // ============================================================================
  // PROFILE PICTURE UPLOAD (mobile — logged-in user)
  // ============================================================================

  /**
   * Upload profile picture for the logged-in user.
   *
   * Uses the existing backend route:
   *   POST /api/employees/:employeeId/documents/upload/profile_picture
   *   field name: "file"
   *   auth: any authenticated user (no admin/hr restriction)
   *
   * @param {string|number} employeeId  the logged-in user's employeeId
   * @param {object} asset              the picked asset from expo-image-picker
   *                                    { uri, fileName?, mimeType? }
   * @returns {Promise<{success: boolean, fileUrl?: string, message?: string, error?: string}>}
   */
  async uploadProfilePicture(employeeId, asset) {
    try {
      if (!employeeId) {
        return { success: false, error: 'Missing employeeId' };
      }
      if (!asset || !asset.uri) {
        return { success: false, error: 'No image selected' };
      }

      // Build FormData in a way that works on iOS, Android AND web.
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, fetch the blob: URI to get a real Blob
        const blob = await (await fetch(asset.uri)).blob();
        formData.append('file', blob, asset.fileName || 'photo.jpg');
      } else {
        // On native, React Native understands this shape
        const uri = asset.uri;
        const name =
          asset.fileName ||
          uri.split('/').pop() ||
          `photo_${Date.now()}.jpg`;
        const type =
          asset.mimeType ||
          (name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

        formData.append('file', { uri, name, type });
      }

      const response = await api.post(
        `/employees/${employeeId}/documents/upload/profile_picture`,
        formData,
        {
          // ⚠️ Override the default JSON Content-Type for this request.
          // axios will set the multipart boundary automatically when it sees FormData.
          headers: { 'Content-Type': 'multipart/form-data' },
          // Prevent axios from JSON-stringifying the FormData.
          transformRequest: (data) => data,
        }
      );

      const payload = response.data || {};
      const fileUrl =
        payload?.data?.fileUrl ||
        payload?.profilePictureUrl ||
        null;

      return {
        success: true,
        message: payload.message || 'Profile picture uploaded',
        fileUrl,
      };
    } catch (error) {
      console.error('Upload profile picture error:', error);

      const serverError = error.response?.data?.error;
      return {
        success: false,
        error:
          serverError ||
          error.message ||
          'Failed to upload profile picture',
      };
    }
  }

  // ============================================================================
  // USER CRUD (admin / manager)
  // ============================================================================

  async createUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return {
        success: true,
        message: response.data.message || 'User created successfully',
        user: response.data.user,
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create user',
      };
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return {
        success: true,
        message: response.data.message || 'User updated successfully',
        user: response.data.user,
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update user',
      };
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkUpdateUsers(userIds, updates) {
    try {
      const response = await api.post('/users/bulk-update', { userIds, updates });
      return {
        success: true,
        message: response.data.message,
        updatedCount: response.data.updatedCount,
        updates: response.data.updates,
      };
    } catch (error) {
      console.error('Bulk update error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update users',
      };
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  async activateUser(userId) {
    try {
      const response = await api.put(`/users/${userId}/activate`);
      return {
        success: true,
        message: response.data.message || 'User activated successfully',
        isActive: true,
      };
    } catch (error) {
      console.error('Activate user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to activate user',
      };
    }
  }

  async deactivateUser(userId) {
    try {
      const response = await api.put(`/users/${userId}/deactivate`);
      return {
        success: true,
        message: response.data.message || 'User deactivated successfully',
        isActive: false,
      };
    } catch (error) {
      console.error('Deactivate user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to deactivate user',
      };
    }
  }

  async toggleUserStatus(userId) {
    try {
      const response = await api.put(`/users/${userId}/toggle-status`);
      return {
        success: true,
        message: response.data.message,
        isActive: response.data.isActive,
      };
    } catch (error) {
      console.error('Toggle user status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle user status',
      };
    }
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  async resetUserPassword(userId, newPassword) {
    try {
      const response = await api.post(`/users/${userId}/reset-password`, { newPassword });
      return {
        success: true,
        message: response.data.message || 'Password reset successfully',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reset password',
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/users/change-password', { currentPassword, newPassword });
      return {
        success: true,
        message: response.data.message || 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change password',
      };
    }
  }

  // ============================================================================
  // STATISTICS & EXPORT
  // ============================================================================

  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      return {
        success: true,
        stats: response.data.stats,
        lastUpdated: response.data.lastUpdated,
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch statistics',
      };
    }
  }

  async getFilterOptions() {
    try {
      const response = await api.get('/users/filter-options');
      return {
        success: true,
        filters: response.data.filters,
      };
    } catch (error) {
      console.error('Get filter options error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch filter options',
      };
    }
  }

  async exportUsers(format = 'json', filters) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);

      if (filters?.role && filters.role !== 'all') queryParams.append('role', filters.role);
      if (filters?.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters?.department) queryParams.append('department', filters.department.toString());
      if (filters?.search) queryParams.append('search', filters.search);

      const response = await api.get(`/users/export?${queryParams.toString()}`);

      if (format === 'csv') {
        return {
          success: true,
          csv: response.data,
          format: 'csv',
        };
      }

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        exportDate: response.data.exportDate,
        filters: response.data.filters,
      };
    } catch (error) {
      console.error('Export users error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to export users',
      };
    }
  }

  // ============================================================================
  // LOOKUPS — ROLES, DEPARTMENTS, POSITIONS
  // ============================================================================

  async getRoles() {
    try {
      const response = await api.get('/users/roles');
      return {
        success: true,
        roles: response.data.data || [],
      };
    } catch (error) {
      console.error('Get roles error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch roles',
        roles: [],
      };
    }
  }

  async getDepartments() {
    try {
      const response = await api.get('/users/departments');
      return {
        success: true,
        departments: response.data.data || [],
      };
    } catch (error) {
      console.error('Get departments error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch departments',
        departments: [],
      };
    }
  }

  async getPositions() {
    try {
      const response = await api.get('/users/positions');
      return {
        success: true,
        positions: response.data.data || [],
      };
    } catch (error) {
      console.error('Get positions error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch positions',
        positions: [],
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS (no network — pure formatting)
  // ============================================================================

  /**
   * Get display name — employee name wins, then fullName, then username.
   */
  getUserDisplayName(user) {
    if (!user) return 'User';
    if (user.employee?.firstName && user.employee?.lastName) {
      return `${user.employee.firstName} ${user.employee.lastName}`;
    }
    return user.fullName || user.username || 'User';
  }

  /**
   * Format a role key into a display label.
   */
  formatRole(role) {
    const titles = {
      admin: 'Administrator',
      superadmin: 'Superadmin',
      hr: 'HR Manager',
      finance: 'Finance Officer',
      employee: 'Employee',
      manager: 'Manager',
      checker: 'Checker',
      purchase_organizer: 'Purchase Organizer',
      purchaser: 'Purchaser',
      storekeeper: 'Storekeeper',
      store_it: 'Store IT',
      attendance: 'Attendance Officer',
    };
    return titles[role] || role || 'User';
  }

  /**
   * Format a date as "Sep 20, 2026".
   */
  formatDate(date) {
    if (!date) return 'Never';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format a date+time as "Sep 20, 2026, 10:30 AM".
   */
  formatDateTime(date) {
    if (!date) return 'Never';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Fallback avatar URL from a name (used when the user has no picture).
   */
  getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(name || 'User')}`;
  }

  /**
   * Build initials for a name.
   */
  getInitials(name) {
    if (!name) return '?';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Get the avatar URI for a user — custom picture or fallback.
   * Always returns a string the <Image source={{ uri }} /> can consume.
   */
  getAvatarSource(user) {
    const custom =
      user?.employee?.profilePicture ||
      user?.profilePicture ||
      null;

    if (custom && /^https?:\/\//i.test(custom)) return custom;
    if (custom) return custom; // already resolved by the backend
    return this.getAvatarUrl(this.getUserDisplayName(user));
  }

  getStatusColor(isActive) {
    return isActive ? 'success' : 'error';
  }

  getStatusText(isActive) {
    return isActive ? 'Active' : 'Inactive';
  }

  /**
   * Build a query string (used internally, exposed for flexibility).
   */
  buildQueryString(params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all' && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    return queryParams.toString();
  }
}

export default new UsersService();