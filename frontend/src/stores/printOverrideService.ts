// stores/printOverrideService.ts
// Dedicated service for the PrintOverride module.
// Talks to /api/print-overrides/*

import api from "./interceptor";

// ================================================================
// TYPES
// ================================================================

export interface SectionVisibility {
  reason: boolean;
  comment: boolean;
  checkedBy: boolean;
}

export interface ColumnSnapshot {
  key: string;
  label?: string;
  width?: string;
  visible: boolean;
  custom?: boolean;
  locked?: boolean;
  editable?: boolean;
  kind?: 'text' | 'number';
  computed?: string;
  pairedKey?: string;
  align?: 'left' | 'center';
  bold?: boolean;
}

export interface PrintOverride {
  id: number;
  requestId: number;
  userId: number | null;

  department: string | null;
  approvedByName: string | null;
  overrideDate: string | null;      // "YYYY-MM-DD"
  customHeader: string | null;

  sectionVisibility: SectionVisibility | null;
  columnsConfig: ColumnSnapshot[] | null;
  customCells: Record<string, Record<string, string>> | null;

  updatedBy: number | null;

  createdAt: string;
  updatedAt: string;

  // Optional eager-loaded relations
  request?: {
    requestId: number;
    requestCode: string;
  };
  user?: {
    userId: number;
    username: string;
    fullName?: string;
  };
  updatedByUser?: {
    userId: number;
    username: string;
    fullName?: string;
  };
}

// Payload accepted by create/update/upsert
export interface PrintOverridePayload {
  department?: string | null;
  approvedByName?: string | null;
  overrideDate?: string | null;
  customHeader?: string | null;
  sectionVisibility?: SectionVisibility | null;
  columnsConfig?: ColumnSnapshot[] | null;
  customCells?: Record<string, Record<string, string>> | null;
}

// ================================================================
// SERVICE
// ================================================================

class PrintOverrideService {
  /**
   * Fetch the print override for a specific request.
   * Falls back to the shared row (user_id IS NULL) if no user-specific one exists.
   * Returns `data: null` when nothing is saved yet.
   *
   * GET /api/print-overrides/request/:requestId
   */
  async getByRequest(requestId: number | string): Promise<{
    success: boolean;
    data?: PrintOverride | null;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.get(
        `/print-overrides/request/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Get print override error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to fetch print override',
      };
    }
  }

  /**
   * Create a print override for a request.
   * Fails with 409 if one already exists for the current user.
   *
   * POST /api/print-overrides/request/:requestId
   */
  async create(
    requestId: number | string,
    payload: PrintOverridePayload
  ): Promise<{
    success: boolean;
    data?: PrintOverride;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.post(
        `/print-overrides/request/${requestId}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Create print override error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to create print override',
        data: error.response?.data?.data,
      };
    }
  }

  /**
   * Update the print override for a request.
   * Fails with 404 if no override exists yet.
   *
   * PUT /api/print-overrides/request/:requestId
   */
  async update(
    requestId: number | string,
    payload: PrintOverridePayload
  ): Promise<{
    success: boolean;
    data?: PrintOverride;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.put(
        `/print-overrides/request/${requestId}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Update print override error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to update print override',
      };
    }
  }

  /**
   * Upsert the print override for a request (create-or-update in one call).
   * This is the PRIMARY method the print forms use.
   *
   * POST /api/print-overrides/request/:requestId/upsert
   */
  async save(
    requestId: number | string,
    payload: PrintOverridePayload
  ): Promise<{
    success: boolean;
    data?: PrintOverride;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.post(
        `/print-overrides/request/${requestId}/upsert`,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Save print override error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to save print override',
      };
    }
  }

  /**
   * Delete the print override for a request (reset to defaults).
   *
   * DELETE /api/print-overrides/request/:requestId
   */
  async remove(requestId: number | string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(
        `/print-overrides/request/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Delete print override error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to delete print override',
      };
    }
  }

  /**
   * List all print overrides (admin / reporting).
   *
   * GET /api/print-overrides?page=&limit=&requestId=&userId=
   */
  async list(params?: {
    page?: number;
    limit?: number;
    requestId?: number;
    userId?: number;
  }): Promise<{
    success: boolean;
    data?: {
      overrides: PrintOverride[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.requestId)
        queryParams.append('requestId', params.requestId.toString());
      if (params?.userId)
        queryParams.append('userId', params.userId.toString());

      const url = queryParams.toString()
        ? `/print-overrides?${queryParams.toString()}`
        : '/print-overrides';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('List print overrides error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to list print overrides',
      };
    }
  }

  /**
   * Get a single print override by its own id (admin).
   *
   * GET /api/print-overrides/:id
   */
  async getById(id: number | string): Promise<{
    success: boolean;
    data?: PrintOverride;
    error?: string;
  }> {
    try {
      const response = await api.get(`/print-overrides/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get print override by id error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Failed to fetch print override',
      };
    }
  }
}

export default new PrintOverrideService();