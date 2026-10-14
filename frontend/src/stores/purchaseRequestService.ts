// stores/purchaseRequestService.ts
import api from './interceptor';

// ================================================================
// API ORIGIN (derived from the axios instance's baseURL)
// ================================================================

const API_ORIGIN = (api.defaults.baseURL ?? '')
  .replace(/\/api(?:\/.*)?$/, '')
  .replace(/\/$/, '');

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
export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected';

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
  dateFrom?: string;
  dateTo?: string;
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
  preparedById?: string | null;
  createdById?: number | null;
  requestedDate: string;
  priority: Priority;
  status: RequestStatus;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;

  approvedDocFront?: string;
  approvedDocFrontName?: string;
  approvedDocBack?: string;
  approvedDocBackName?: string;

  // Approval workflow
  currentStageIndex?: number;
  currentStageId?: number | null;
  currentStage?: { id: number; label: string; orderIndex: number } | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  rejectedByStageIndex?: number | null;
  rejectedBySubgroupId?: number | null;
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
  back?: File;
}

export interface PurchaseRequestStats {
  total: number;
  drafts: number;
  pending: number;
  approved: number;
  rejected: number;
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
// APPROVAL WORKFLOW TYPES
// ================================================================

export interface SubgroupStatusRow {
  subgroupId: number;
  subgroupName: string;
  subgroupCode: string;
  groupId: number;
  groupName: string | null;
  decision: 'approve' | 'reject' | null;
  decidedByName: string | null;
  comment: string | null;
  actedAt: string | null;
}

export interface ApprovalStatus {
  stageId: number | null;
  stageIndex: number;
  stageLabel: string;
  totalSubgroups: number;
  approvedCount: number;
  decidedCount: number;
  subgroups: SubgroupStatusRow[];
  mySubgroupId: number | null;
  myDecision: 'approve' | 'reject' | null;
  futureStages: { id: number; label: string; orderIndex: number }[];
}

export type ApprovalDecision = 'approve' | 'reject';

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
        data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 },
        error:
          error.response?.data?.error || 'Failed to fetch purchase requests',
      };
    }
  }

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
        data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 },
        error:
          error.response?.data?.error ||
          'Failed to fetch approved purchase requests',
      };
    }
  }

  // ================================================================
  // PENDING FOR ME — GET /api/purchase-requests/pending-my-approval
  // ================================================================
  async getPendingApprovals(
    params: ListParams = {}
  ): Promise<PaginatedResponse<PurchaseRequest>> {
    try {
      const qp = new URLSearchParams();

      if (params.page) qp.append('page', String(params.page));
      if (params.limit) qp.append('limit', String(params.limit));
      if (params.search) qp.append('search', params.search);
      if (params.priority && params.priority !== 'all') {
        qp.append('priority', params.priority);
      }
      if (params.department) qp.append('department', params.department);
      if (params.dateFrom) qp.append('dateFrom', params.dateFrom);
      if (params.dateTo) qp.append('dateTo', params.dateTo);
      if (params.dateField) qp.append('dateField', params.dateField);
      if (params.sortBy) qp.append('sortBy', params.sortBy);
      if (params.sortOrder) qp.append('sortOrder', params.sortOrder);

      const url = qp.toString()
        ? `/purchase-requests/pending-my-approval?${qp.toString()}`
        : '/purchase-requests/pending-my-approval';

      const res = await api.get(url);
      return res.data;
    } catch (error: any) {
      console.error('Get pending approvals error:', error);
      return {
        success: false,
        data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 },
        error:
          error.response?.data?.error || 'Failed to fetch pending approvals',
      };
    }
  }

  async getStats(): Promise<StatsResponse> {
    try {
      const res = await api.get('/purchase-requests/stats');
      return res.data;
    } catch (error: any) {
      console.error('Get purchase request stats error:', error);
      return {
        success: false,
        data: { total: 0, drafts: 0, pending: 0, approved: 0, rejected: 0 },
        error: error.response?.data?.error || 'Failed to fetch statistics',
      };
    }
  }

  // ================================================================
  // SINGLE
  // ================================================================

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
  // SUBMIT FOR APPROVAL (submitter action)
  // POST /api/purchase-requests/submit  (multipart/form-data)
  // ================================================================

  async submitForApproval(
    prId: number | string,
    front: File,
    back?: File
  ): Promise<SingleResponse<PurchaseRequest>> {
    try {
      const formData = new FormData();
      formData.append('prId', String(prId));
      formData.append('approvedDocFront', front);
      if (back) formData.append('approvedDocBack', back);

      const res = await api.post('/purchase-requests/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error: any) {
      console.error('Submit for approval error:', error);
      return {
        success: false,
        data: {} as PurchaseRequest,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to submit purchase request',
      };
    }
  }

  /**
   * @deprecated Use submitForApproval instead.
   */
  async approveRequest(
    payload: ApprovePayload
  ): Promise<SingleResponse<PurchaseRequest>> {
    return this.submitForApproval(payload.prId, payload.front, payload.back);
  }

  // ================================================================
  // APPROVAL WORKFLOW — status + decision
  // ================================================================

  async getApprovalStatus(
    id: number | string
  ): Promise<SingleResponse<ApprovalStatus>> {
    try {
      const res = await api.get(`/purchase-requests/${id}/approval-status`);
      return res.data;
    } catch (error: any) {
      console.error('Get approval status error:', error);
      return {
        success: false,
        data: {
          stageId: null,
          stageIndex: 0,
          stageLabel: '',
          totalSubgroups: 0,
          approvedCount: 0,
          decidedCount: 0,
          subgroups: [],
          mySubgroupId: null,
          myDecision: null,
          futureStages: [],
        },
        error:
          error.response?.data?.error || 'Failed to fetch approval status',
      };
    }
  }

  async decide(
    id: number | string,
    decision: ApprovalDecision,
    comment?: string
  ): Promise<SingleResponse<PurchaseRequest>> {
    try {
      const res = await api.post(`/purchase-requests/${id}/decision`, {
        decision,
        comment: comment || undefined,
      });
      return res.data;
    } catch (error: any) {
      console.error('Decide error:', error);
      return {
        success: false,
        data: {} as PurchaseRequest,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          `Failed to ${decision} purchase request`,
      };
    }
  }

  // ================================================================
  // BALANCE CHECK
  // ================================================================

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
  // HELPER METHODS
  // ================================================================

  getItemNames(items: PurchaseItem[] | undefined): string {
    if (!items || items.length === 0) return '';
    return items.map((i) => i.name).join(', ');
  }

  getTotalQuantity(items: PurchaseItem[] | undefined): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(dateString?: string | null): string {
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

  getFileName(url?: string | null): string {
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

  getStatusDisplay(status: RequestStatus | string): string {
    const map: Record<string, string> = {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return map[status] || status;
  }

  getStatusIcon(status: RequestStatus | string): string {
    const map: Record<string, string> = {
      draft: '📝',
      pending: '⏳',
      approved: '✅',
      rejected: '❌',
    };
    return map[status] || '📦';
  }

  getStatusBadge(status: RequestStatus | string): string {
    const map: Record<string, string> = {
      draft: 'secondary',
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return map[status] || 'secondary';
  }

  getPriorityIcon(priority: Priority | string): string {
    const map: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴',
    };
    return map[priority] || '⚪';
  }

  validateFile(file: File): string | null {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  isEditable(request: PurchaseRequest | null): boolean {
    if (!request) return false;
    return request.status === 'draft' || request.status === 'rejected';
  }

  canSubmit(request: PurchaseRequest | null): boolean {
    if (!request) return false;
    return request.status === 'draft';
  }

  canApprove(request: PurchaseRequest | null): boolean {
    return this.canSubmit(request);
  }

  hasDocuments(request: PurchaseRequest | null): boolean {
    if (!request) return false;
    return !!request.approvedDocFront;
  }

  getStoreBalanceLabel(store: BalanceCheckStore): string {
    const parts: string[] = [store.storeName];
    if (store.storeCode) parts.push(`(${store.storeCode})`);
    parts.push(`— ${store.balance}${store.uom ? ' ' + store.uom : ''}`);
    return parts.join(' ');
  }
}

export default new PurchaseRequestService();