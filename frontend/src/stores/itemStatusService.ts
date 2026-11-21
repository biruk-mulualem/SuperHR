// stores/itemStatusService.ts
import api from "./interceptor";

// ================================================================
// TYPES
// ================================================================

export interface ItemStatusTake {
  id: number;
  date: string;
  quantity: number;
  uomCode: string;
  requestId: number | null;
  requestCode: string | null;
  requestStatus?: "pending" | "approved" | "rejected" | "finalized" | null;
  status: "pending" | "approved" | "rejected" | "finalized";
  takenBy: string | null;
}

export interface ItemStatusRule {
  id: number;
  storeId: number | null;
  departmentId: number | null;
  storeType: "store" | "department";
  storeName: string | null;
  storeCode: string | null;
  itemId: number;
  itemCode: string | null;
  itemName: string | null;
  uomId: number | null;
  uomCode: string | null;
  maxQuantity: number;
  frequencyDays: number;
  reason: string;
  status: "Active" | "Deleted";
  isBlocked: boolean;
  nextAllowedAt: string | null;
  lastTaken: ItemStatusTake | null;
  totalInWindow: number;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemStatusRuleWithHistory extends ItemStatusRule {
  history: ItemStatusTake[];
}

export interface CreateRuleData {
  storeId?: number | null;
  departmentId?: number | null;
  itemId: number;
  maxQuantity: number;
  frequencyDays: number;
  reason?: string;
}

export interface UpdateRuleData {
  storeId?: number | null;
  departmentId?: number | null;
  itemId?: number;
  maxQuantity?: number;
  frequencyDays?: number;
  reason?: string;
}

export interface RulePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RuleHistoryResponse {
  takes: ItemStatusTake[];
  pagination: RulePagination;
}

export interface RuleStats {
  totalRules: number;
  availableCount: number;
  blockedCount: number;
}

export interface StoreOption {
  id: number;
  name: string;
  code: string;
}

export interface ItemOption {
  itemId: number;
  code: string;
  name: string;
  standardName?: string | null;
  uomId?: number;
  uom?: {
    id: number;
    code: string;
    name: string;
  } | null;
}

export interface CheckBlockedResult {
  blocked: boolean;
  rule?: ItemStatusRule;
  reason?: string | null;
  nextAllowedAt?: string | null;
  lastTaken?: ItemStatusTake | null;
  totalInWindow?: number;
}

// ================================================================
// RESPONSE ENVELOPES
// ================================================================

export interface RuleListResponse {
  success: boolean;
  data: ItemStatusRule[];
  pagination?: RulePagination;
  error?: string;
}

export interface RuleResponse {
  success: boolean;
  data?: ItemStatusRule;
  error?: string;
}

export interface RuleWithHistoryResponse {
  success: boolean;
  data?: ItemStatusRuleWithHistory;
  error?: string;
}

export interface RuleHistoryResponseEnvelope {
  success: boolean;
  data?: RuleHistoryResponse;
  error?: string;
}

export interface SimpleResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface StoresResponse {
  success: boolean;
  data: StoreOption[];
  error?: string;
}

export interface ItemsResponse {
  success: boolean;
  data: ItemOption[];
  error?: string;
}

export interface CheckBlockedResponse {
  success: boolean;
  data?: CheckBlockedResult;
  error?: string;
}

// ================================================================
// QUERY PARAMS
// ================================================================

export interface GetRulesParams {
  storeId?: number;
  departmentId?: number;
  itemId?: number;
  status?: "Active" | "Deleted" | "all";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "maxQuantity"
    | "frequencyDays"
    | "id";
  sortOrder?: "ASC" | "DESC";
}

// ================================================================
// ITEM STATUS SERVICE
// ================================================================

class ItemStatusService {
  // ================================================================
  // RULES
  // ================================================================

  async getRules(params: GetRulesParams = {}): Promise<RuleListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.storeId) queryParams.append("storeId", params.storeId.toString());
      if (params.departmentId)
        queryParams.append("departmentId", params.departmentId.toString());
      if (params.itemId) queryParams.append("itemId", params.itemId.toString());
      if (params.status) queryParams.append("status", params.status);
      if (params.search && params.search.trim() !== "")
        queryParams.append("search", params.search.trim());
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = queryParams.toString()
        ? `/item-status/rules?${queryParams.toString()}`
        : "/item-status/rules";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get rules error:", error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch rules",
      };
    }
  }

  async getRuleById(id: number | string): Promise<RuleWithHistoryResponse> {
    try {
      const response = await api.get(`/item-status/rules/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get rule by ID error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch rule",
      };
    }
  }

  async getRuleHistory(
    id: number | string,
    params: { page?: number; limit?: number } = {}
  ): Promise<RuleHistoryResponseEnvelope> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      const url = queryParams.toString()
        ? `/item-status/rules/${id}/history?${queryParams.toString()}`
        : `/item-status/rules/${id}/history`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get rule history error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch rule history",
      };
    }
  }

  async createRule(data: CreateRuleData): Promise<RuleResponse> {
    try {
      const response = await api.post("/item-status/rules", data);
      return response.data;
    } catch (error: any) {
      console.error("Create rule error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create rule",
      };
    }
  }

  async updateRule(
    id: number | string,
    data: UpdateRuleData
  ): Promise<RuleResponse> {
    try {
      const response = await api.put(`/item-status/rules/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Update rule error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update rule",
      };
    }
  }

  async deleteRule(id: number | string): Promise<SimpleResponse> {
    try {
      const response = await api.delete(`/item-status/rules/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete rule error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete rule",
      };
    }
  }

  // ================================================================
  // CHECK
  // ================================================================

  async checkBlocked(
    storeId: number,
    itemId: number
  ): Promise<CheckBlockedResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("storeId", storeId.toString());
      queryParams.append("itemId", itemId.toString());

      const response = await api.get(
        `/item-status/check?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Check blocked error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to check blocked status",
      };
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  getStatsFromRules(rules: ItemStatusRule[]): RuleStats {
    const blocked = rules.filter((r) => r.isBlocked).length;
    return {
      totalRules: rules.length,
      availableCount: rules.length - blocked,
      blockedCount: blocked,
    };
  }

  formatDate(date: string | Date | null): string {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(date: string | Date | null): string {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getCountdown(nextAllowedAt: string | null): string {
    if (!nextAllowedAt) return "now";
    const ms = new Date(nextAllowedAt).getTime() - Date.now();
    if (ms <= 0) return "now";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return days === 1 ? "in 1 day" : `in ${days} days`;
    if (hours > 0) return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
    return "in under an hour";
  }

  formatQuantity(quantity: number, uomCode: string | null): string {
    const q = Number(quantity) || 0;
    return `${q.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${uomCode || ""}`.trim();
  }

  getStatusClass(isBlocked: boolean): "blocked" | "active" {
    return isBlocked ? "blocked" : "active";
  }

  getStatusLabel(isBlocked: boolean): string {
    return isBlocked ? "🔒 Limit Reached" : "✅ Ready to Take";
  }
}

export default new ItemStatusService();