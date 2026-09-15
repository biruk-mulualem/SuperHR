// stores/purchaseFollowUpService.ts
import api from './interceptor';

// ================================================================
// API ORIGIN (for resolving uploaded document URLs)
// ================================================================

const API_ORIGIN = (api.defaults.baseURL ?? '')
  .replace(/\/api(?:\/.*)?$/, '')
  .replace(/\/$/, '');

/**
 * Resolves a relative upload URL into a fully-qualified URL.
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
export type FollowUpStatus = 'pending_bids' | 'bidding' | 'submitted';
export type PriceStatus = 'pending' | 'accepted' | 'rejected';

export interface FollowUpPrice {
  id: number;
  employee: string;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  matchesRequirement?: boolean | null;
  remark?: string | null;
  notes?: string | null;
  status: PriceStatus;
  isWinner: boolean;
  winnerManuallySelected: boolean;
  submittedDate?: string | null;
  submittedById?: number | null;
}

export interface FollowUpItem {
  id: number;
  requestId: number;
  requestNumber: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  uom: string;
  baseUom?: string | null;
  conversionUom?: string | null;
  brand?: string | null;
  model?: string | null;
  specification?: string | null;
  remark?: string | null;
  status: 'pending_bids' | 'bidding';
  hasWinner: boolean;
  winnerManuallySelected: boolean;
  bids: FollowUpPrice[];
}

export interface DispatchedPerson {
  id: number;
  userId?: number | null;
  name: string;
  department?: string | null;
  role?: string | null;
  isBoss: boolean;
  message?: string | null;
}

export interface FollowUpSummary {
  totalItems: number;
  itemsWithWinner: number;
  itemsPending: number;
  totalBids: number;
  totalWinningAmount: number;
}

export interface FollowUp {
  requestId: number;
  requestNumber: string;
  requestedBy?: string | null;
  department?: string | null;
  departmentId?: number | null;
  requestDate: string;
  priority: Priority;
  status: FollowUpStatus;
  expertName?: string | null;
  preparedBy?: string | null;
  approvedDate?: string | null;
  approvedDocFront?: string | null;
  approvedDocFrontName?: string | null;
  approvedDocBack?: string | null;
  approvedDocBackName?: string | null;
  dispatchedTo: DispatchedPerson[];
  items: FollowUpItem[];
  summary: FollowUpSummary;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | FollowUpStatus;
  department?: string;
  priority?: 'all' | Priority;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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

export interface StatsResponse {
  success: boolean;
  data: {
    totalRequests: number;
    totalItems: number;
    biddingItems: number;
    winnerItems: number;
  };
  error?: string;
}

export interface SubmitPricePayload {
  employee: string;
  unitPrice: number;
  discount?: number;
  matchesRequirement?: boolean;
  remark?: string | null;
  notes?: string | null;
}

export interface UpdatePricePayload {
  unitPrice: number;
  discount?: number;
  matchesRequirement?: boolean;
  remark?: string | null;
  notes?: string | null;
}

export interface SelectWinnerPayload {
  priceId: number;
  reason?: string | null;
}

export interface DispatchPayloadEntry {
  userId?: number | null;
  name: string;
  department?: string | null;
  role?: string | null;
  isBoss?: boolean;
  message?: string | null;
}

// ================================================================
// SERVICE
// ================================================================

const BASE = '/purchase-follow-ups';

class PurchaseFollowUpService {
  // ================================================================
  // LIST + STATS
  // ================================================================

  /**
   * GET /api/purchase-follow-ups
   */
  async list(params: ListParams = {}): Promise<PaginatedResponse<FollowUp>> {
    try {
      const qp = new URLSearchParams();
      if (params.page) qp.append('page', String(params.page));
      if (params.limit) qp.append('limit', String(params.limit));
      if (params.search) qp.append('search', params.search);
      if (params.status) qp.append('status', params.status);
      if (params.department) qp.append('department', params.department);
      if (params.priority) qp.append('priority', params.priority);
      if (params.sortBy) qp.append('sortBy', params.sortBy);
      if (params.sortOrder) qp.append('sortOrder', params.sortOrder);

      const url = qp.toString() ? `${BASE}?${qp.toString()}` : BASE;
      const res = await api.get(url);
      return res.data;
    } catch (error: any) {
      console.error('List follow-ups error:', error);
      return {
        success: false,
        data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 },
        error: error.response?.data?.error || 'Failed to load follow-ups',
      };
    }
  }

  /**
   * GET /api/purchase-follow-ups/stats
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const res = await api.get(`${BASE}/stats`);
      return res.data;
    } catch (error: any) {
      console.error('Follow-up stats error:', error);
      return {
        success: false,
        data: { totalRequests: 0, totalItems: 0, biddingItems: 0, winnerItems: 0 },
        error: error.response?.data?.error || 'Failed to load stats',
      };
    }
  }

  // ================================================================
  // GET ONE
  // ================================================================

  /**
   * GET /api/purchase-follow-ups/:prId
   */
  async getById(prId: number | string): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.get(`${BASE}/${prId}`);
      return res.data;
    } catch (error: any) {
      console.error('Get follow-up error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error: error.response?.data?.error || 'Failed to load follow-up',
      };
    }
  }

  // ================================================================
  // PRICE — SUBMIT / EDIT / REMOVE
  // ================================================================

  /**
   * POST /api/purchase-follow-ups/items/:itemId/prices
   */
  async submitPrice(
    itemId: number | string,
    payload: SubmitPricePayload
  ): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.post(`${BASE}/items/${itemId}/prices`, payload);
      return res.data;
    } catch (error: any) {
      console.error('Submit price error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to submit price',
      };
    }
  }

  /**
   * PUT /api/purchase-follow-ups/prices/:priceId
   */
  async updatePrice(
    priceId: number | string,
    payload: UpdatePricePayload
  ): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.put(`${BASE}/prices/${priceId}`, payload);
      return res.data;
    } catch (error: any) {
      console.error('Update price error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to update price',
      };
    }
  }

  /**
   * DELETE /api/purchase-follow-ups/prices/:priceId
   */
  async removePrice(
    priceId: number | string,
    remark?: string | null
  ): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.delete(`${BASE}/prices/${priceId}`, {
        data: { remark: remark ?? null },
      });
      return res.data;
    } catch (error: any) {
      console.error('Remove price error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error: error.response?.data?.error || 'Failed to remove price',
      };
    }
  }

  // ================================================================
  // WINNER SELECTION
  // ================================================================

  /**
   * PUT /api/purchase-follow-ups/items/:itemId/winner
   */
  async selectWinner(
    itemId: number | string,
    payload: SelectWinnerPayload
  ): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.put(`${BASE}/items/${itemId}/winner`, payload);
      return res.data;
    } catch (error: any) {
      console.error('Select winner error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error: error.response?.data?.error || 'Failed to select winner',
      };
    }
  }

  // ================================================================
  // DISPATCH
  // ================================================================

  /**
   * PUT /api/purchase-follow-ups/:prId/dispatches
   * Replaces the whole dispatch list for a PR.
   */
  async setDispatches(
    prId: number | string,
    dispatchedTo: DispatchPayloadEntry[]
  ): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.put(`${BASE}/${prId}/dispatches`, { dispatchedTo });
      return res.data;
    } catch (error: any) {
      console.error('Set dispatches error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error: error.response?.data?.error || 'Failed to update dispatch list',
      };
    }
  }

  /**
   * DELETE /api/purchase-follow-ups/dispatches/:id
   */
  async removeDispatch(id: number | string): Promise<SingleResponse<FollowUp>> {
    try {
      const res = await api.delete(`${BASE}/dispatches/${id}`);
      return res.data;
    } catch (error: any) {
      console.error('Remove dispatch error:', error);
      return {
        success: false,
        data: {} as FollowUp,
        error: error.response?.data?.error || 'Failed to remove recipient',
      };
    }
  }

  // ================================================================
  // HELPERS
  // ================================================================

  /** Get the winner bid on an item (or null) */
  getWinnerBid(item: FollowUpItem): FollowUpPrice | null {
    return item.bids?.find((b) => b.isWinner) || null;
  }

  /** Bids sorted winner-first, then by lowest final price */
  getSortedBids(item: FollowUpItem): FollowUpPrice[] {
    if (!item.bids || item.bids.length === 0) return [];
    const winner = item.bids.find((b) => b.isWinner);
    const others = item.bids
      .filter((b) => !b.isWinner)
      .sort((a, b) => a.finalPrice - b.finalPrice);
    return winner ? [winner, ...others] : others;
  }

  /** Count of items with a winner on a follow-up */
  countWinners(followUp: FollowUp): number {
    return followUp.items.filter((i) => i.hasWinner).length;
  }

  /** Count of items without a winner on a follow-up */
  countPending(followUp: FollowUp): number {
    return followUp.items.filter((i) => !i.hasWinner).length;
  }

  /** True if any item has a winner */
  hasAnyWinner(followUp: FollowUp): boolean {
    return followUp.items.some((i) => i.hasWinner);
  }

  /** Sum of winning final prices on a follow-up */
  getTotalWinningAmount(followUp: FollowUp): number {
    return followUp.items.reduce(
      (sum, item) => sum + (this.getWinnerBid(item)?.finalPrice || 0),
      0
    );
  }

  /** Status label for the follow-up header */
  getStatusLabel(status: FollowUpStatus | string): string {
    const map: Record<string, string> = {
      pending_bids: 'Pending',
      bidding: 'Price Collection',
      submitted: 'Submitted',
    };
    return map[status] || status;
  }

  /** Format a date as "Sep 12, 2026" */
  formatDate(dateString?: string | null): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /** Format a date+time as "Sep 12, 2026, 10:30 AM" */
  formatDateTime(dateString?: string | null): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Extract a file name from any URL */
  getFileName(url?: string | null): string {
    if (!url) return 'document';
    if (url.startsWith('data:')) return 'approved-document';
    try {
      const clean = url.split('?')[0] || '';
      const parts = clean.split('/');
      return parts[parts.length - 1] || 'document';
    } catch {
      return 'document';
    }
  }

  /** Initials from a full name ("Selam Tesfaye" → "ST") */
  getInitials(name?: string | null): string {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /** Friendly label for a price status */
  getPriceStatusLabel(status: PriceStatus | string): string {
    const map: Record<string, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
    };
    return map[status] || status;
  }
}

// ================================================================
// EXPORT SINGLETON
// ================================================================
export default new PurchaseFollowUpService();