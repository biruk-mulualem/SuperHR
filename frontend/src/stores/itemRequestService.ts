// stores/itemRequestService.ts
import api from './interceptor';

// ================================================================
// TYPES
// ================================================================

export interface RequestItem {
  itemId: number;
  quantity: number;
  remark?: string;
}

export interface User {
  userId: number;
  id?: number;
  username: string;
  fullName?: string;
  full_name?: string;
  email: string;
  roleId?: number;
  role?: string;
  departmentId?: number;
  department?: string;
}

export interface Store {
  storeId: number;
  id?: number;
  code: string;
  name: string;
  location?: string;
  status: string;
}

export interface Item {
  itemId: number;
  id?: number;
  code: string;
  name: string;
  standardName?: string;
  brand?: string;
  model?: string;
  uomId?: number;
  uom?: {
    uomId: number;
    code: string;
    name: string;
  };
  specText?: string;
}

export interface ItemRequest {
  requestId: number;
  id?: number;
  requestCode: string;
  askingStoreId: number;
  askingStore?: Store;
  supplyingStoreId: number;
  supplyingStore?: Store;
  requestedById?: number;
  requestedByUser?: User;
  requestedBy?: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'finalized';
  items: RequestItem[];
  remark?: string;
  approvedAt?: string;
  finalizedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  statusHistory?: {
    current: string;
    canEdit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canFinalize: boolean;
  };
  canEdit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canFinalize?: boolean;
}

export interface ItemRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  finalized: number;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

// ✅ Validation Error Types
export interface ValidationError {
  itemId: number;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  error: string;
  message: string;
  groupsWithoutBalance?: Array<{
    groupId: number;
    groupName: string;
  }>;
  balanceDetails?: Array<{
    groupName: string;
    balance: number;
  }>;
  shortage?: number;
  uomCode?: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  message: string;
  errors: ValidationError[];
  data?: {
    supplyingStoreId: number;
    supplyingStoreName: string;
    totalGroups: number;
    validatedItems: any[];
    failedItems: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    requests: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
  error?: string;
}

export interface SingleRequestResponse {
  success: boolean;
  data: ItemRequest;
  message?: string;
  error?: string;
  // ✅ ADD THIS - For validation errors
  errors?: ValidationError[];
}

export interface StatsResponse {
  success: boolean;
  data: ItemRequestStats;
  message?: string;
  error?: string;
}

export interface CreateRequestData {
  askingStoreId: number;
  supplyingStoreId: number;
  items: {
    itemId: number;
    quantity: number;
    remark?: string;
  }[];
  requestedById?: number;
  requestedDate: string;
  status?: 'pending' | 'approved' | 'rejected';
  remark?: string;
}

export interface UpdateRequestData {
  askingStoreId?: number;
  supplyingStoreId?: number;
  items?: {
    itemId: number;
    quantity: number;
    remark?: string;
  }[];
  requestedById?: number;
  requestedDate?: string;
  remark?: string;
}

export interface ExportItemData {
  'Request Code': string;
  'Asking Store': string;
  'Supplying Store': string;
  'Requested By': string;
  'Requested By Email': string;
  'Requested Date': string;
  'Status': string;
  'Items': string;
  'Remark': string;
}

// ================================================================
// ITEM REQUEST SERVICE
// ================================================================

class ItemRequestService {
  // ================================================================
  // STORE METHODS (for dropdowns)
  // ================================================================

  /**
   * Get active stores for dropdown
   * GET /api/item-requests/active-stores
   */
  async getActiveStores(): Promise<{
    success: boolean;
    data: Store[];
    error?: string;
  }> {
    try {
      const response = await api.get('/item-requests/active-stores');
      return response.data;
    } catch (error: any) {
      console.error('Get active stores error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch active stores'
      };
    }
  }

  /**
   * Get active items for dropdown
   * GET /api/item-requests/active-items
   */
  async getActiveItems(): Promise<{
    success: boolean;
    data: Item[];
    error?: string;
  }> {
    try {
      const response = await api.get('/item-requests/active-items');
      return response.data;
    } catch (error: any) {
      console.error('Get active items error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch active items'
      };
    }
  }

  // ================================================================
  // REQUEST METHODS
  // ================================================================

  /**
   * Get all item requests with pagination and filters
   * GET /api/item-requests
   */
  async getRequests(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'finalized' | 'all';
    storeId?: number;
    userId?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedResponse<ItemRequest>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params.userId) queryParams.append('userId', params.userId.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString() 
        ? `/item-requests?${queryParams.toString()}`
        : '/item-requests';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get requests error:', error);
      return {
        success: false,
        data: {
          requests: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        },
        error: error.response?.data?.error || 'Failed to fetch requests'
      };
    }
  }

  /**
   * Get single item request by ID
   * GET /api/item-requests/:id
   */
  async getRequestById(id: number | string): Promise<SingleRequestResponse> {
    try {
      const response = await api.get(`/item-requests/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get request by ID error:', error);
      return {
        success: false,
        data: {} as ItemRequest,
        error: error.response?.data?.error || 'Failed to fetch request'
      };
    }
  }

  /**
   * Get current user's requests
   * GET /api/item-requests/my-requests
   */
  async getMyRequests(params: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'finalized' | 'all';
  } = {}): Promise<PaginatedResponse<ItemRequest>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);

      const url = queryParams.toString() 
        ? `/item-requests/my-requests?${queryParams.toString()}`
        : '/item-requests/my-requests';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get my requests error:', error);
      return {
        success: false,
        data: {
          requests: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        },
        error: error.response?.data?.error || 'Failed to fetch your requests'
      };
    }
  }

  /**
   * Get requests by user ID
   * GET /api/item-requests/user/:userId
   */
  async getRequestsByUser(userId: number | string): Promise<{
    success: boolean;
    data: ItemRequest[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get requests by user error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch requests for user'
      };
    }
  }

  /**
   * Get requests by status
   * GET /api/item-requests/status/:status
   */
  async getRequestsByStatus(status: 'pending' | 'approved' | 'rejected' | 'finalized'): Promise<{
    success: boolean;
    data: ItemRequest[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/status/${status}`);
      return response.data;
    } catch (error: any) {
      console.error('Get requests by status error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch requests by status'
      };
    }
  }

  /**
   * Get requests by date range
   * GET /api/item-requests/date-range
   */
  async getRequestsByDateRange(startDate: string, endDate: string): Promise<{
    success: boolean;
    data: ItemRequest[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/date-range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error: any) {
      console.error('Get requests by date range error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to fetch requests by date range'
      };
    }
  }

  /**
   * Get request statistics
   * GET /api/item-requests/stats
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await api.get('/item-requests/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get stats error:', error);
      return {
        success: false,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          finalized: 0,
          byStatus: []
        },
        error: error.response?.data?.error || 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Create a new item request
   * POST /api/item-requests
   */
  async createRequest(data: CreateRequestData): Promise<SingleRequestResponse> {
    try {
      const response = await api.post('/item-requests', data);
      return response.data;
    } catch (error: any) {
      console.error('Create request error:', error);
      
      // 🔥 FIX: Check if the error response contains validation errors
      const errorData = error.response?.data;
      
      // If this is a validation error response with errors array
      if (errorData && errorData.errors && errorData.errors.length > 0) {
        // Return the full validation error response
        return errorData as SingleRequestResponse;
      }
      
      return {
        success: false,
        data: {} as ItemRequest,
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to create request'
      };
    }
  }

  /**
   * Update an existing item request
   * PUT /api/item-requests/:id
   */
  async updateRequest(id: number | string, data: UpdateRequestData): Promise<SingleRequestResponse> {
    try {
      const response = await api.put(`/item-requests/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update request error:', error);
      
      // 🔥 Check if the error response contains validation errors
      const errorData = error.response?.data;
      
      // If this is a validation error response with errors array
      if (errorData && errorData.errors && errorData.errors.length > 0) {
        // Return the full validation error response
        return errorData as SingleRequestResponse;
      }
      
      return {
        success: false,
        data: {} as ItemRequest,
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to update request'
      };
    }
  }

  /**
   * Update request status
   * PATCH /api/item-requests/:id/status
   */
  async updateStatus(id: number | string, status: 'pending' | 'approved' | 'rejected' | 'finalized'): Promise<{
    success: boolean;
    message: string;
    data?: ItemRequest;
    error?: string;
  }> {
    try {
      const response = await api.patch(`/item-requests/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Update status error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to update status'
      };
    }
  }

  /**
   * Approve a request
   * PATCH /api/item-requests/:id/status
   */
  async approveRequest(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: ItemRequest;
    error?: string;
  }> {
    return this.updateStatus(id, 'approved');
  }

  /**
   * Reject a request
   * PATCH /api/item-requests/:id/status
   */
  async rejectRequest(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: ItemRequest;
    error?: string;
  }> {
    return this.updateStatus(id, 'rejected');
  }

  /**
   * Finalize a request
   * PATCH /api/item-requests/:id/status
   */
  async finalizeRequest(id: number | string): Promise<{
    success: boolean;
    message: string;
    data?: ItemRequest;
    error?: string;
  }> {
    return this.updateStatus(id, 'finalized');
  }

  /**
   * Delete a request (only pending or rejected)
   * DELETE /api/item-requests/:id
   */
  async deleteRequest(id: number | string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/item-requests/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete request error:', error);
      return {
        success: false,
        message: '',
        error: error.response?.data?.error || 'Failed to delete request'
      };
    }
  }

  /**
   * Export requests to CSV data
   * GET /api/item-requests/export
   */
  async exportRequests(params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'finalized' | 'all';
    storeId?: number;
    userId?: number;
  }): Promise<{
    success: boolean;
    data: ExportItemData[];
    total: number;
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.storeId) queryParams.append('storeId', params.storeId.toString());
      if (params?.userId) queryParams.append('userId', params.userId.toString());

      const url = queryParams.toString() 
        ? `/item-requests/export?${queryParams.toString()}`
        : '/item-requests/export';

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Export requests error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || 'Failed to export requests'
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Get user display name from request
   */
  getRequesterName(request: ItemRequest): string {
    if (request?.requestedByUser) {
      return request.requestedByUser.fullName || 
             request.requestedByUser.full_name || 
             request.requestedByUser.username || 
             'Unknown User';
    }
    return request?.requestedBy || 'Unknown User';
  }

  /**
   * Get user email from request
   */
  getRequesterEmail(request: ItemRequest): string {
    return request?.requestedByUser?.email || 'N/A';
  }

  /**
   * Check if user can perform action on request
   */
  canPerformAction(request: ItemRequest, action: 'edit' | 'approve' | 'reject' | 'finalize'): boolean {
    if (!request) return false;
    
    const actions = {
      edit: request.status !== 'finalized',
      approve: request.status === 'pending',
      reject: request.status === 'pending',
      finalize: request.status === 'approved',
    };
    
    return actions[action] || false;
  }

  /**
   * Get available status options for a request
   */
  getAvailableStatuses(request: ItemRequest): Array<'pending' | 'approved' | 'rejected' | 'finalized'> {
    if (!request) return [];
    
    const statuses: Array<'pending' | 'approved' | 'rejected' | 'finalized'> = [];
    if (request.status === 'pending') {
      statuses.push('approved', 'rejected');
    } else if (request.status === 'approved') {
      statuses.push('finalized');
    }
    return statuses;
  }

  /**
   * Get status badge color
   */
  getStatusBadge(status: string): string {
    const badgeMap: Record<string, string> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      finalized: 'info',
    };
    return badgeMap[status] || 'secondary';
  }

  /**
   * Get status display name
   */
  getStatusDisplay(status: string): string {
    const displayMap: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      finalized: 'Finalized',
    };
    return displayMap[status] || status;
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌',
      finalized: '📋',
    };
    return iconMap[status] || '📦';
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
   * Format date time
   */
  formatDateTime(date: string | Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get total quantity of items in request
   */
  getTotalQuantity(request: ItemRequest): number {
    if (!request || !request.items) return 0;
    return request.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  /**
   * Get total number of items in request
   */
  getTotalItems(request: ItemRequest): number {
    return request?.items?.length || 0;
  }

  /**
   * Check if request is editable
   */
  isEditable(request: ItemRequest): boolean {
    return request?.status !== 'finalized';
  }

  /**
   * Check if request is pending
   */
  isPending(request: ItemRequest): boolean {
    return request?.status === 'pending';
  }

  /**
   * Check if request is approved
   */
  isApproved(request: ItemRequest): boolean {
    return request?.status === 'approved';
  }

  /**
   * Check if request is rejected
   */
  isRejected(request: ItemRequest): boolean {
    return request?.status === 'rejected';
  }

  /**
   * Check if request is finalized
   */
  isFinalized(request: ItemRequest): boolean {
    return request?.status === 'finalized';
  }
}

export default new ItemRequestService();