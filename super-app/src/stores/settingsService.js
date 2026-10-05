// stores/settingsService.js
import api from './interceptor';

// ============================================================================
// SETTINGS SERVICE
// ----------------------------------------------------------------------------
// Backed by /api/settings/* (routes/settingRoutes.js →
// controllers/settingsController.js)
// ============================================================================
class SettingsService {
  // ============================================================================
  // DEPARTMENTS
  // ============================================================================

  /**
   * Get all departments.
   * GET /settings/departments
   */
  async getDepartments(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.includeInactive) query.append('includeInactive', 'true');

      const url = `/settings/departments${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await api.get(url);

      return {
        success: true,
        departments: response.data.data || [],
        pagination: response.data.pagination || null,
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

  /**
   * Get a single department by ID.
   * GET /settings/departments/:id
   */
  async getDepartmentById(departmentId) {
    try {
      const response = await api.get(`/settings/departments/${departmentId}`);
      return {
        success: true,
        department: response.data.data || null,
      };
    } catch (error) {
      console.error('Get department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch department',
      };
    }
  }

  /**
   * Create a new department.
   * POST /settings/departments
   */
  async createDepartment(payload) {
    try {
      const response = await api.post('/settings/departments', payload);
      return {
        success: true,
        message: response.data.message || 'Department created successfully',
        department: response.data.data || null,
      };
    } catch (error) {
      console.error('Create department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create department',
      };
    }
  }

  /**
   * Update an existing department.
   * PUT /settings/departments/:id
   */
  async updateDepartment(departmentId, payload) {
    try {
      const response = await api.put(`/settings/departments/${departmentId}`, payload);
      return {
        success: true,
        message: response.data.message || 'Department updated successfully',
        department: response.data.data || null,
      };
    } catch (error) {
      console.error('Update department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update department',
      };
    }
  }

  /**
   * Toggle department active status.
   * PATCH /settings/departments/:id/status
   */
  async toggleDepartmentStatus(departmentId, isActive) {
    try {
      const response = await api.patch(
        `/settings/departments/${departmentId}/status`,
        { isActive }
      );
      return {
        success: true,
        message:
          response.data.message ||
          `Department ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Toggle department status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle department status',
      };
    }
  }

  /**
   * Delete a department.
   * DELETE /settings/departments/:id
   */
  async deleteDepartment(departmentId) {
    try {
      const response = await api.delete(`/settings/departments/${departmentId}`);
      return {
        success: true,
        message: response.data.message || 'Department deleted successfully',
      };
    } catch (error) {
      console.error('Delete department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete department',
      };
    }
  }

  /**
   * Get the department hierarchy as a tree.
   * GET /settings/departments/tree
   */
  async getDepartmentTree() {
    try {
      const response = await api.get('/settings/departments/tree');
      return {
        success: true,
        tree: response.data.data || [],
      };
    } catch (error) {
      console.error('Get department tree error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch department tree',
        tree: [],
      };
    }
  }

  /**
   * Get department statistics.
   * GET /settings/departments/stats
   */
  async getDepartmentStats() {
    try {
      const response = await api.get('/settings/departments/stats');
      return {
        success: true,
        data: response.data.data || null,
      };
    } catch (error) {
      console.error('Get department stats error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch department stats',
      };
    }
  }

  // ============================================================================
  // POSITIONS
  // ============================================================================

  async getPositions(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.departmentId) query.append('departmentId', params.departmentId.toString());
      if (params.includeInactive) query.append('includeInactive', 'true');

      const url = `/settings/positions${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await api.get(url);

      return {
        success: true,
        positions: response.data.data || [],
        pagination: response.data.pagination || null,
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

  async getPositionById(positionId) {
    try {
      const response = await api.get(`/settings/positions/${positionId}`);
      return {
        success: true,
        position: response.data.data || null,
      };
    } catch (error) {
      console.error('Get position error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch position',
      };
    }
  }

  async createPosition(payload) {
    try {
      const response = await api.post('/settings/positions', payload);
      return {
        success: true,
        message: response.data.message || 'Position created successfully',
        position: response.data.data || null,
      };
    } catch (error) {
      console.error('Create position error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create position',
      };
    }
  }

  async updatePosition(positionId, payload) {
    try {
      const response = await api.put(`/settings/positions/${positionId}`, payload);
      return {
        success: true,
        message: response.data.message || 'Position updated successfully',
        position: response.data.data || null,
      };
    } catch (error) {
      console.error('Update position error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update position',
      };
    }
  }

  async togglePositionStatus(positionId, isActive) {
    try {
      const response = await api.patch(
        `/settings/positions/${positionId}/status`,
        { isActive }
      );
      return {
        success: true,
        message:
          response.data.message ||
          `Position ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Toggle position status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle position status',
      };
    }
  }

  async deletePosition(positionId) {
    try {
      const response = await api.delete(`/settings/positions/${positionId}`);
      return {
        success: true,
        message: response.data.message || 'Position deleted successfully',
      };
    } catch (error) {
      console.error('Delete position error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete position',
      };
    }
  }

  // ============================================================================
  // ROLES
  // ============================================================================

  async getRoles(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.includeInactive) query.append('includeInactive', 'true');

      const url = `/settings/roles${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await api.get(url);

      return {
        success: true,
        roles: response.data.data || [],
        pagination: response.data.pagination || null,
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

  async getRoleById(roleId) {
    try {
      const response = await api.get(`/settings/roles/${roleId}`);
      return {
        success: true,
        role: response.data.data || null,
      };
    } catch (error) {
      console.error('Get role error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch role',
      };
    }
  }

  async createRole(payload) {
    try {
      const response = await api.post('/settings/roles', payload);
      return {
        success: true,
        message: response.data.message || 'Role created successfully',
        role: response.data.data || null,
      };
    } catch (error) {
      console.error('Create role error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create role',
      };
    }
  }

  async updateRole(roleId, payload) {
    try {
      const response = await api.put(`/settings/roles/${roleId}`, payload);
      return {
        success: true,
        message: response.data.message || 'Role updated successfully',
        role: response.data.data || null,
      };
    } catch (error) {
      console.error('Update role error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update role',
      };
    }
  }

  async toggleRoleStatus(roleId, isActive) {
    try {
      const response = await api.patch(
        `/settings/roles/${roleId}/status`,
        { isActive }
      );
      return {
        success: true,
        message:
          response.data.message ||
          `Role ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Toggle role status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle role status',
      };
    }
  }

  async deleteRole(roleId) {
    try {
      const response = await api.delete(`/settings/roles/${roleId}`);
      return {
        success: true,
        message: response.data.message || 'Role deleted successfully',
      };
    } catch (error) {
      console.error('Delete role error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete role',
      };
    }
  }

  // ============================================================================
  // SYSTEM SETTINGS
  // ============================================================================

  async getAllSettings() {
    try {
      const response = await api.get('/settings/settings');
      return {
        success: true,
        settings: response.data.data || [],
        grouped: response.data.grouped || {},
      };
    } catch (error) {
      console.error('Get settings error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch settings',
        settings: [],
        grouped: {},
      };
    }
  }

  async getSettingByKey(key) {
    try {
      const response = await api.get(`/settings/settings/${key}`);
      return {
        success: true,
        setting: response.data.data || null,
      };
    } catch (error) {
      console.error('Get setting error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch setting',
      };
    }
  }

  async upsertSetting(payload) {
    try {
      const response = await api.post('/settings/settings', payload);
      return {
        success: true,
        message: response.data.message || 'Setting saved successfully',
        setting: response.data.data || null,
      };
    } catch (error) {
      console.error('Save setting error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save setting',
      };
    }
  }

  async batchUpdateSettings(settings) {
    try {
      const response = await api.put('/settings/settings/batch', { settings });
      return {
        success: true,
        message: response.data.message || 'Settings updated',
        results: response.data.results || [],
        errors: response.data.errors || [],
      };
    } catch (error) {
      console.error('Batch update settings error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update settings',
      };
    }
  }

  async deleteSetting(key) {
    try {
      const response = await api.delete(`/settings/settings/${key}`);
      return {
        success: true,
        message: response.data.message || 'Setting deleted',
      };
    } catch (error) {
      console.error('Delete setting error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete setting',
      };
    }
  }

  // ============================================================================
  // ATTENDANCE RULES
  // ============================================================================

  async getAttendanceRules() {
    try {
      const response = await api.get('/settings/attendance/rules');
      return {
        success: true,
        rules: response.data.data || null,
        isDefault: response.data.isDefault || false,
        version: response.data.version,
        lastUpdated: response.data.lastUpdated,
      };
    } catch (error) {
      console.error('Get attendance rules error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch attendance rules',
      };
    }
  }

  async updateAttendanceRules(rules) {
    try {
      const response = await api.put('/settings/attendance/rules', rules);
      return {
        success: true,
        message: response.data.message || 'Attendance rules updated successfully',
        data: response.data.data,
        version: response.data.version,
      };
    } catch (error) {
      console.error('Update attendance rules error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update attendance rules',
      };
    }
  }

  // ============================================================================
  // 🔥 ASK-STORE APPROVAL TOGGLE
  // ============================================================================

  /**
   * Get whether the asking-store group approval flow is enabled.
   *
   * When ENABLED  → asking store groups approve first, then supplying store.
   * When DISABLED → request goes straight to supplying store (original flow).
   *
   * Default: true (enabled).
   *
   * GET /settings/approval/ask-store-enabled
   */
  async getAskStoreApprovalEnabled() {
    try {
      const response = await api.get('/settings/approval/ask-store-enabled');
      return {
        success: true,
        data: response.data.data || { enabled: true, settingExists: false },
      };
    } catch (error) {
      console.error('Get ask-store approval error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Failed to fetch ask-store approval status',
        data: { enabled: true, settingExists: false },
      };
    }
  }

  /**
   * Enable or disable the asking-store group approval flow.
   *
   * POST /settings/approval/ask-store-enabled
   * Body: { enabled: boolean }
   */
  async setAskStoreApprovalEnabled(enabled) {
    try {
      const response = await api.post('/settings/approval/ask-store-enabled', {
        enabled: Boolean(enabled),
      });
      return {
        success: true,
        message:
          response.data.message ||
          `Asking-store approval ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: response.data.data || { enabled: Boolean(enabled) },
      };
    } catch (error) {
      console.error('Set ask-store approval error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Failed to update ask-store approval status',
      };
    }
  }

  // ============================================================================
  // APPROVAL DEPARTMENT CONFIG
  // ============================================================================

  async getApprovalDepartment() {
    try {
      const response = await api.get('/settings/approval/department');
      return {
        success: true,
        data: response.data.data || null,
      };
    } catch (error) {
      console.error('Get approval department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch approval config',
      };
    }
  }

  async setApprovalDepartment(payload) {
    try {
      const response = await api.post('/settings/approval/department', payload);
      return {
        success: true,
        message: response.data.message || 'Approval settings saved',
        data: response.data.data || null,
      };
    } catch (error) {
      console.error('Set approval department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save approval config',
      };
    }
  }

  async removeApprovalDepartment() {
    try {
      const response = await api.delete('/settings/approval/department');
      return {
        success: true,
        message: response.data.message || 'Approval requirement disabled',
      };
    } catch (error) {
      console.error('Remove approval department error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to disable approval requirement',
      };
    }
  }

  async getDepartmentsForApproval() {
    try {
      const response = await api.get('/settings/approval/departments');
      return {
        success: true,
        departments: response.data.data || [],
      };
    } catch (error) {
      console.error('Get departments for approval error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch departments',
        departments: [],
      };
    }
  }

  async getStoresForApproval() {
    try {
      const response = await api.get('/settings/approval/stores');
      return {
        success: true,
        stores: response.data.data || [],
        selected: response.data.selected || [],
      };
    } catch (error) {
      console.error('Get stores for approval error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch stores',
        stores: [],
      };
    }
  }
}

export default new SettingsService();