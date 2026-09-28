// stores/purchaseRequestService.ts
import api from './interceptor';

// ================================================================
// API ORIGIN (derived from the axios instance's baseURL)
// ================================================================
//
// `api.defaults.baseURL` looks like: "http://localhost:4000/api"
// We strip "/api" (and anything after it) to get the domain root,
// so uploaded files served at /uploads/... resolve correctly.
//
const API_ORIGIN = (api.defaults.baseURL ?? '')
  .replace(/\/api(?:\/.*)?$/, '')
  .replace(/\/$/, '');

/**
 * Resolves a relative upload URL (returned by the backend) into
 * a fully-qualified URL that <img src=""> can display.
 *
 *   resolveDocUrl('/uploads/purchase-requests/approved/foo.png')
 *   → 'http://localhost:4000/uploads/purchase-requests/approved/foo.png'
 */
export function resolveDocUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

// ================================================================
// TYPES
// ================================================================

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RequestStatus = 'draft' | 'approved';

export interface PurchaseItem {
  id?: number;
  name: string;
  code: string;
  brand?: string;
  model?: string;
  uom: string;
  baseUom?: string;
  conversionUom?: string;
  quantity: number;
  specification?: string;
  remark?: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | RequestStatus;
  priority?: 'all' | Priority;
  department?: string;
  // ✅ Date range filters
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string;   // "YYYY-MM-DD"
  dateField?: 'created_at' | 'updated_at' | 'approved_at' | 'requested_date';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PurchaseRequest {
  id: number;
  prNumber: string;
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedDate: string;
  priority: Priority;
  status: RequestStatus;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;

  // ✅ Approved documents
  approvedDocFront?: string;
  approvedDocFrontName?: string;
  approvedDocBack?: string;
  approvedDocBackName?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApprovePayload {
  prId: number | string;
  prNumber: string;
  front: File;
  back: File;
}

export interface PurchaseRequestStats {
  total: number;
  drafts: number;
  approved: number;
}

export interface StatsResponse {
  success: boolean;
  data: PurchaseRequestStats;
  error?: string;
}

export interface CreatePurchaseRequestData {
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedDate?: string;
  priority?: Priority;
  items: PurchaseItem[];
}

export interface UpdatePurchaseRequestData {
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedDate?: string;
  priority?: Priority;
  items?: PurchaseItem[];
}

// ================================================================
// BALANCE CHECK TYPES
// ================================================================

export interface BalanceCheckStore {
  storeId: number;
  storeName: string;
  storeCode: string;
  groupId: number;
  groupName: string;
  balance: number;
  uom: string | null;
}

export interface BalanceCheckItem {
  code: string;
  name: string;
  requestedQuantity: number;
  hasBalance: boolean;
  stores: BalanceCheckStore[];
  reason?: string;
}

export interface BalanceCheckPayloadItem {
  code: string;
  quantity: number;
}

export interface BalanceCheckResponse {
  success: boolean;
  data?: {
    hasAnyBalance: boolean;
    itemsWithBalance: BalanceCheckItem[];
    allResults: BalanceCheckItem[];
  };
  error?: string;
}

// ================================================================
// PURCHASE REQUEST SERVICE
// ================================================================

class PurchaseRequestService {
  // ================================================================
  // LIST + STATS
  // ================================================================

  /**
   * Get paginated list of purchase requests
   * GET /api/purchase-requests
   */
  async getRequests(
    params: ListParams = {}
  ): Promise<PaginatedResponse<PurchaseRequest>> {
    try {
      const qp = new URLSearchParams();

      if (params.page) qp.append('page', String(params.page));
      if (params.limit) qp.append('limit', String(params.limit));
      if (params.search) qp.append('search', params.search);
      if (params.status) qp.append('status', params.status);
      if (params.priority) qp.append('priority', params.priority);
      if (params.department) qp.append('department', params.department);
      if (params.dateFrom) qp.append('dateFrom', params.dateFrom);
      if (params.dateTo) qp.append('dateTo', params.dateTo);
      if (params.dateField) qp.append('dateField', params.dateField);
      if (params.sortBy) qp.append('sortBy', params.sortBy);
      if (params.sortOrder) qp.append('sortOrder', params.sortOrder);

      const url = qp.toString()
        ? `/purchase-requests?${qp.toString()}`
        : '/purchase-requests';

      const res = await api.get(url);
      return res.data;
    } catch (error: any) {
      console.error('Get purchase requests error:', error);
      return {
        success: false,
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
        error:
          error.response?.data?.error || 'Failed to fetch purchase requests',
      };
    }
  }

  /**
   * Get paginated list of APPROVED purchase requests
   * GET /api/purchase-requests/approved
   */
  async getApprovedRequests(
    params: Omit<ListParams, 'status'> = {}
  ): Promise<PaginatedResponse<PurchaseRequest>> {
    try {
      const qp = new URLSearchParams();

      if (params.page) qp.append('page', String(params.page));
      if (params.limit) qp.append('limit', String(params.limit));
      if (params.search) qp.append('search', params.search);
      if (params.priority) qp.append('priority', params.priority);
      if (params.department) qp.append('department', params.department);
      if (params.dateFrom) qp.append('dateFrom', params.dateFrom);
      if (params.dateTo) qp.append('dateTo', params.dateTo);
      if (params.dateField) qp.append('dateField', params.dateField);
      if (params.sortBy) qp.append('sortBy', params.sortBy);
      if (params.sortOrder) qp.append('sortOrder', params.sortOrder);

      const url = qp.toString()
        ? `/purchase-requests/approved?${qp.toString()}`
        : '/purchase-requests/approved';

      const res = await api.get(url);
      return res.data;
    } catch (error: any) {
      console.error('Get approved purchase requests error:', error);
      return {
        success: false,
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
        error:
          error.response?.data?.error ||
          'Failed to fetch approved purchase requests',
      };
    }
  }

  /**
   * Get statistics
   * GET /api/purchase-requests/stats
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const res = await api.get('/purchase-requests/stats');
      return res.data;
    } catch (error: any) {
      console.error('Get purchase request stats error:', error);
      return {
        success: false,
        data: { total: 0, drafts: 0, approved: 0 },
        error: error.response?.data?.error || 'Failed to fetch statistics',
      };
    }
  }

  // ================================================================
  // SINGLE
  // ================================================================

  /**
   * Get single purchase request by ID
   * GET /api/purchase-requests/:id
   */
  async getRequestById(
    id: number | string
  ): Promise<SingleResponse<PurchaseRequest>> {
    try {
      const res = await api.get(`/purchase-requests/${id}`);
      return res.data;
    } catch (error: any) {
      console.error('Get purchase request error:', error);
      return {
        success: false,
        data: {} as PurchaseRequest,
        error:
          error.response?.data?.error || 'Failed to fetch purchase request',
      };
    }
  }

  // ================================================================
  // CREATE / UPDATE / DELETE
  // ================================================================

  /**
   * Create a new purchase request
   * POST /api/purchase-requests
   */
  async createRequest(
    data: CreatePurchaseRequestData
  ): Promise<SingleResponse<PurchaseRequest>> {
    try {
      const res = await api.post('/purchase-requests', data);
      return res.data;
    } catch (error: any) {
      console.error('Create purchase request error:', error);
      return {
        success: false,
        data: {} as PurchaseRequest,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to create purchase request',
      };
    }
  }

  /**
   * Update an existing purchase request (drafts only)
   * PUT /api/purchase-requests/:id
   */
  async updateRequest(
    id: number | string,
    data: UpdatePurchaseRequestData
  ): Promise<SingleResponse<PurchaseRequest>> {
    try {
      const res = await api.put(`/purchase-requests/${id}`, data);
      return res.data;
    } catch (error: any) {
      console.error('Update purchase request error:', error);
      return {
        success: false,
        data: {} as PurchaseRequest,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to update purchase request',
      };
    }
  }

  /**
   * Delete a purchase request (drafts only)
   * DELETE /api/purchase-requests/:id
   */
  async deleteRequest(
    id: number | string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await api.delete(`/purchase-requests/${id}`);
      return res.data;
    } catch (error: any) {
      console.error('Delete purchase request error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to delete purchase request',
      };
    }
  }

  // ================================================================
  // APPROVE (with front & back documents)
  // ================================================================

  /**
   * Approve a purchase request with front & back documents
   * POST /api/purchase-requests/approve  (multipart/form-data)
   */
  async approveRequest(
    payload: ApprovePayload
  ): Promise<SingleResponse<PurchaseRequest>> {
    try {
      const formData = new FormData();
      formData.append('prId', String(payload.prId));
      formData.append('prNumber', payload.prNumber);
      formData.append('status', 'approved');
      formData.append('approvedDocFront', payload.front);
      formData.append('approvedDocBack', payload.back);

      const res = await api.post('/purchase-requests/approve', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error: any) {
      console.error('Approve purchase request error:', error);
      return {
        success: false,
        data: {} as PurchaseRequest,
        error:
          error.response?.data?.error || 'Failed to approve purchase request',
      };
    }
  }

  // ================================================================
  // BALANCE CHECK
  // ================================================================

  /**
   * Check if any of the requested items already have balance in a store.
   * POST /api/purchase-requests/check-balance
   */
  async checkBalance(
    items: BalanceCheckPayloadItem[]
  ): Promise<BalanceCheckResponse> {
    try {
      const res = await api.post('/purchase-requests/check-balance', {
        items,
      });
      return res.data;
    } catch (error: any) {
      console.error('Check balance error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to check balance',
      };
    }
  }

  // ================================================================
  // HELPER METHODS (for the template)
  // ================================================================

  /** Join item names for the summary column */
  getItemNames(items: PurchaseItem[] | undefined): string {
    if (!items || items.length === 0) return '';
    return items.map((i) => i.name).join(', ');
  }

  /** Sum of quantities */
  getTotalQuantity(items: PurchaseItem[] | undefined): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  }

  /** Short date: "Sep 12, 2026" */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /** Full date-time: "Sep 12, 2026, 10:30 AM" */
  formatDateTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Extract file name from any URL (data:, blob:, relative, absolute) */
  getFileName(url?: string): string {
    if (!url) return 'document';
    if (url.startsWith('data:')) return 'approved-document';
    if (url.startsWith('blob:')) return 'approved-document';
    try {
      const cleanUrl = url.split('?')[0] || '';
      const parts = cleanUrl.split('/');
      return parts[parts.length - 1] || 'document';
    } catch {
      return 'document';
    }
  }

  /** Friendly status display */
  getStatusDisplay(status: RequestStatus | string): string {
    const map: Record<string, string> = {
      draft: 'Draft',
      approved: 'Approved',
    };
    return map[status] || status;
  }

  /** Status icon */
  getStatusIcon(status: RequestStatus | string): string {
    const map: Record<string, string> = {
      draft: '📝',
      approved: '✅',
    };
    return map[status] || '📦';
  }

  /** Status badge color (for `<Badge :variant="">`) */
  getStatusBadge(status: RequestStatus | string): string {
    const map: Record<string, string> = {
      draft: 'secondary',
      approved: 'success',
    };
    return map[status] || 'secondary';
  }

  /** Priority icon */
  getPriorityIcon(priority: Priority | string): string {
    const map: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴',
    };
    return map[priority] || '⚪';
  }

  /** Client-side file validation (mirrors backend) */
  validateFile(file: File): string | null {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'application/pdf',
    ];
    if (!allowed.includes(file.type)) {
      return 'Only JPG, PNG, WEBP, or PDF files are allowed.';
    }
    return null;
  }

  /** Convert File → base64 data URL for local preview */
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** Check if a request is editable */
  isEditable(request: PurchaseRequest | null): boolean {
    return request?.status === 'draft';
  }

  /** Check if a request can be approved */
  canApprove(request: PurchaseRequest | null): boolean {
    return request?.status === 'draft';
  }

  /** Check if a request has both documents */
  hasDocuments(request: PurchaseRequest | null): boolean {
    if (!request) return false;
    return !!(request.approvedDocFront && request.approvedDocBack);
  }

  /** Friendly label for balance check store entry */
  getStoreBalanceLabel(store: BalanceCheckStore): string {
    const parts: string[] = [store.storeName];
    if (store.storeCode) parts.push(`(${store.storeCode})`);
    parts.push(`— ${store.balance}${store.uom ? ' ' + store.uom : ''}`);
    return parts.join(' ');
  }
}

// ================================================================
// EXPORT SINGLETON
// ================================================================
export default new PurchaseRequestService();