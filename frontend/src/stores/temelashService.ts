// stores/temelashService.ts
import api from "./interceptor";

// ================================================================
// TYPES
// ================================================================

export interface TemelashSnapshotItem {
  itemId: number;
  code: string;
  name: string;
  quantity: number;
  uom: string;
  remark?: string;
  specification?: string;
  brand?: string;
  model?: string;
}

export interface TemelashStore {
  storeId: number;
  id?: number;
  code: string;
  name: string;
  location?: string;
  status?: string;
}

export interface TemelashUser {
  userId: number;
  username: string;
  fullName?: string;
  full_name?: string;
  email?: string;
}

export interface TemelashRecord {
  id: number;
  requestId: number;
  requestCode: string;

  askingStoreId: number;
  supplyingStoreId: number;
  askingStore?: TemelashStore;
  supplyingStore?: TemelashStore;

  requestedById?: number | null;
  requestedBy?: string | null;
  requestedByUser?: TemelashUser;

  items: TemelashSnapshotItem[];
  remark?: string | null;

  status: "out" | "returned";
  issuedAt: string;
  returnedAt?: string | null;

  returnedById?: number | null;
  returnedByUser?: TemelashUser;
  returnRemark?: string | null;

  fromDate?: string | null;
  toDate?: string | null;
  returnedLate?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

// ================================================================
// REQUEST / RESPONSE SHAPES
// ================================================================

export interface GetTemelashRecordsParams {
  page?: number;
  limit?: number;
  status?: "out" | "returned" | "all";
  storeId?: number;
  search?: string;
}

export interface TemelashSummary {
  total: number;
  out: number;
  returned: number;
  overdue: number;
}

export interface TemelashPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetTemelashRecordsResponse {
  success: boolean;
  data?: {
    records: TemelashRecord[];
    pagination: TemelashPagination;
    summary: TemelashSummary;
  };
  error?: string;
}

export interface GetTemelashRecordResponse {
  success: boolean;
  data?: TemelashRecord;
  error?: string;
}

export interface UpdateTemelashPayload {
  fromDate?: string | null;
  toDate?: string | null;
  remark?: string | null;
}

export interface UpdateTemelashResponse {
  success: boolean;
  message?: string;
  data?: TemelashRecord;
  error?: string;
}

export interface ReturnTemelashResponse {
  success: boolean;
  message?: string;
  data?: TemelashRecord;
  error?: string;
}

// ================================================================
// SERVICE
// ================================================================

class TemelashService {
  // ================================================================
  // LIST — GET /api/temelash
  // ================================================================
  async getTemelashRecords(
    params?: GetTemelashRecordsParams,
  ): Promise<GetTemelashRecordsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", String(params.page));
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.status && params.status !== "all") {
        queryParams.append("status", params.status);
      }
      if (params?.storeId) {
        queryParams.append("storeId", String(params.storeId));
      }
      if (params?.search) queryParams.append("search", params.search);

      const url = queryParams.toString()
        ? `/temelash?${queryParams.toString()}`
        : "/temelash";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get temelash records error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch temelash records",
      };
    }
  }

  // ================================================================
  // SINGLE — GET /api/temelash/:recordId
  // ================================================================
  async getTemelashRecordById(
    recordId: number,
  ): Promise<GetTemelashRecordResponse> {
    try {
      const response = await api.get(`/temelash/${recordId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get temelash record by ID error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch temelash record",
      };
    }
  }

  // ================================================================
  // UPDATE — PUT /api/temelash/:recordId
  // ================================================================
  async updateTemelash(
    recordId: number,
    payload: UpdateTemelashPayload,
  ): Promise<UpdateTemelashResponse> {
    try {
      const response = await api.put(`/temelash/${recordId}`, payload);
      return response.data;
    } catch (error: any) {
      console.error("Update temelash error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update temelash",
      };
    }
  }

  // ================================================================
  // RETURN — POST /api/temelash/:recordId/return
  // ================================================================
  async returnTemelash(
    recordId: number,
    remark?: string,
  ): Promise<ReturnTemelashResponse> {
    try {
      const response = await api.post(`/temelash/${recordId}/return`, {
        remark: remark || "",
      });
      return response.data;
    } catch (error: any) {
      console.error("Return temelash error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to return temelash",
      };
    }
  }

  // ================================================================
  // HELPERS (pure functions — no API calls)
  // ================================================================

  /**
   * Check if a Temelash record is currently overdue.
   * A record is overdue if it's still OUT and its toDate is in the past.
   */
  isOverdue(record: TemelashRecord | null | undefined): boolean {
    if (!record || record.status !== "out" || !record.toDate) return false;
    return new Date() > new Date(record.toDate);
  }

  /**
   * Check if a Temelash record was returned late.
   */
  wasReturnedLate(record: TemelashRecord | null | undefined): boolean {
    return record?.returnedLate === true;
  }

  /**
   * Human-readable loan window: "Oct 15, 2026 → Oct 20, 2026"
   */
  formatLoanWindow(record: TemelashRecord | null | undefined): string {
    if (!record) return "—";
    const fmt = (d?: string | null): string => {
      if (!d) return "—";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };
    const from = record.fromDate;
    const to = record.toDate;
    if (!from && !to) return "—";
    return `${fmt(from)} → ${fmt(to)}`;
  }

  /**
   * Days remaining until return (negative if overdue). Null if no toDate.
   */
  daysUntilDue(record: TemelashRecord | null | undefined): number | null {
    if (!record?.toDate) return null;
    const now = new Date();
    const due = new Date(record.toDate);
    if (isNaN(due.getTime())) return null;
    const ms = due.getTime() - now.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /**
   * Total quantity of items on the loan.
   */
  getTotalQuantity(record: TemelashRecord | null | undefined): number {
    if (!record?.items) return 0;
    return record.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  }

  /**
   * Total distinct item count.
   */
  getTotalItems(record: TemelashRecord | null | undefined): number {
    return record?.items?.length ?? 0;
  }

  /**
   * Which store is involved in the loan for the given user's storeId?
   * Useful for showing "You are the LENDER" vs "You are the BORROWER".
   */
  getRoleForStore(
    record: TemelashRecord | null | undefined,
    storeId: number | null | undefined,
  ): "asking" | "supplying" | "none" {
    if (!record || !storeId) return "none";
    if (record.askingStoreId === storeId) return "asking";
    if (record.supplyingStoreId === storeId) return "supplying";
    return "none";
  }

  /**
   * Short status label for UI badges.
   */
  getStatusLabel(record: TemelashRecord | null | undefined): string {
    if (!record) return "Unknown";
    if (record.status === "returned") {
      return this.wasReturnedLate(record) ? "Returned Late" : "Returned";
    }
    return this.isOverdue(record) ? "Overdue" : "On Loan";
  }

  /**
   * Emoji badge for status.
   */
  getStatusIcon(record: TemelashRecord | null | undefined): string {
    if (!record) return "❔";
    if (record.status === "returned") {
      return this.wasReturnedLate(record) ? "⚠️" : "✅";
    }
    return this.isOverdue(record) ? "🔴" : "🔄";
  }
}

export default new TemelashService();