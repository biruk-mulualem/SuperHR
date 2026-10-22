// stores/itemRelationshipService.ts
import api from "./interceptor";

// ================================================================
// TYPES
// ================================================================

export interface RelationshipItemRef {
  itemId: number;
  code: string;
  name: string;
  uom: string | null;
}

export interface ItemRelationship {
  id: number;
  relationshipCode: string;
  remark: string | null;
  status: "Active" | "Inactive";
  itemAId: number;
  itemBId: number;
  itemA: RelationshipItemRef | null;
  itemB: RelationshipItemRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemSearchResult {
  itemId: number;
  code: string;
  name: string;
  uom: string;
}

export interface RelationshipPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ================================================================
// REQUEST / RESPONSE SHAPES
// ================================================================

export interface ListParams {
  search?: string;
  status?: "Active" | "Inactive" | "all";
  page?: number;
  limit?: number;
}

export interface ListResponse {
  success: boolean;
  data: ItemRelationship[];
  pagination?: RelationshipPagination;
  error?: string;
}

export interface SingleResponse {
  success: boolean;
  data?: ItemRelationship;
  message?: string;
  error?: string;
}

export interface CreatePayload {
  itemAId: number;
  itemBId: number;
  remark?: string | null;
}

export interface UpdatePayload {
  itemAId?: number;
  itemBId?: number;
  remark?: string | null;
  status?: "Active" | "Inactive";
}

export interface BulkDeleteResponse {
  success: boolean;
  data?: { deleted: number; requested: number };
  message?: string;
  error?: string;
}

export interface ImportRow {
  itemCodeA: string;
  itemCodeB: string;
  remark?: string | null;
}

export interface ImportRowResult {
  success: boolean;
  data: ImportRow;
  relationshipCode?: string;
  error?: string;
}

export interface ImportResponse {
  success: boolean;
  data?: {
    success: number;
    failed: number;
    total: number;
    results: ImportRowResult[];
  };
  message?: string;
  error?: string;
}

export interface SearchItemsResponse {
  success: boolean;
  data: ItemSearchResult[];
  error?: string;
}

// ================================================================
// SERVICE
// ================================================================

class ItemRelationshipService {
  // ================================================================
  // LIST
  // GET /api/item-relationships
  // ================================================================
  async getAll(params: ListParams = {}): Promise<ListResponse> {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.status && params.status !== "all") {
        query.append("status", params.status);
      }
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());

      const url = query.toString()
        ? `/item-relationships?${query.toString()}`
        : "/item-relationships";

      const response = await api.get(url);
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination,
      };
    } catch (error: any) {
      console.error("Get all relationships error:", error);
      return {
        success: false,
        data: [],
        error:
          error.response?.data?.error || "Failed to fetch relationships",
      };
    }
  }

  // ================================================================
  // GET ONE
  // GET /api/item-relationships/:id
  // ================================================================
  async getById(id: number | string): Promise<SingleResponse> {
    try {
      const response = await api.get(`/item-relationships/${id}`);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error("Get relationship by ID error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch relationship",
      };
    }
  }

  // ================================================================
  // CREATE
  // POST /api/item-relationships
  // NOTE: relationshipCode is generated server-side — never sent.
  // ================================================================
  async create(payload: CreatePayload): Promise<SingleResponse> {
    try {
      const response = await api.post("/item-relationships", {
        itemAId: payload.itemAId,
        itemBId: payload.itemBId,
        remark: payload.remark ?? null,
      });
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error("Create relationship error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to create relationship",
      };
    }
  }

  // ================================================================
  // UPDATE
  // PUT /api/item-relationships/:id
  // NOTE: relationshipCode is immutable — never sent.
  // ================================================================
  async update(
    id: number | string,
    patch: UpdatePayload,
  ): Promise<SingleResponse> {
    try {
      const body: Record<string, any> = {};
      if (patch.itemAId !== undefined) body.itemAId = patch.itemAId;
      if (patch.itemBId !== undefined) body.itemBId = patch.itemBId;
      if (patch.remark !== undefined) body.remark = patch.remark;
      if (patch.status !== undefined) body.status = patch.status;

      const response = await api.put(`/item-relationships/${id}`, body);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error("Update relationship error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to update relationship",
      };
    }
  }

  // ================================================================
  // DELETE ONE
  // DELETE /api/item-relationships/:id
  // ================================================================
  async remove(id: number | string): Promise<BulkDeleteResponse> {
    try {
      const response = await api.delete(`/item-relationships/${id}`);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error("Delete relationship error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to delete relationship",
      };
    }
  }

  // ================================================================
  // BULK DELETE
  // POST /api/item-relationships/bulk-delete
  // ================================================================
  async bulkRemove(ids: number[]): Promise<BulkDeleteResponse> {
    try {
      const response = await api.post("/item-relationships/bulk-delete", {
        ids,
      });
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error("Bulk delete relationships error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to delete selected relationships",
      };
    }
  }

  // ================================================================
  // IMPORT
  // POST /api/item-relationships/import
  // ================================================================
  async importBulk(rows: ImportRow[]): Promise<ImportResponse> {
    try {
      const response = await api.post("/item-relationships/import", { rows });
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error("Import relationships error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to import relationships",
      };
    }
  }

  // ================================================================
  // ITEM SEARCH (lazy picker in the add/edit modal)
  // GET /api/items/search?q=...&excludeId=...&limit=...
  // ================================================================
 async searchItems(
  query: string,
  options: { excludeId?: number | null; limit?: number } = {},
): Promise<SearchItemsResponse> {
  try {
    const trimmed = String(query || "").trim();
    if (trimmed.length < 2) {
      return { success: true, data: [] };
    }

    const { excludeId = null, limit = 20 } = options;

    const params = new URLSearchParams();
    params.append("q", trimmed);
    params.append("limit", limit.toString());
    if (excludeId) params.append("excludeId", excludeId.toString());

    const response = await api.get(`/items/search?${params.toString()}`);

    // ---- Unwrap BOTH response shapes ----
    //   { data: [...] }                          ← flat
    //   { data: { items: [...], total, ... } }   ← wrapped
    const raw = response.data?.data;
    const list: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

    // ---- Normalize each row to the shape the picker needs ----
    const normalized: ItemSearchResult[] = list.map((it) => ({
      itemId: it.itemId ?? it.id ?? 0,
      code: it.code ?? "",
      name: it.standardName || it.name || "",
      // uom can be a string ("DRUM") or an object ({ uomId, code, name })
      uom:
        typeof it.uom === "string"
          ? it.uom
          : it.uom?.code || it.uom?.name || "—",
    }));

    return { success: true, data: normalized };
  } catch (error: any) {
    console.error("Search items error:", error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.error || "Failed to search items",
    };
  }
}

  // ================================================================
  // HELPER METHODS (mirror the pattern used in itemRequestService)
  // ================================================================

  /**
   * Display label for a relationship, e.g. "REL0001 — OIL-DRUM ↔ OIL-KG".
   */
  getDisplayLabel(rel: ItemRelationship | null | undefined): string {
    if (!rel) return "N/A";
    const a = rel.itemA?.code || "?";
    const b = rel.itemB?.code || "?";
    return `${rel.relationshipCode} — ${a} ↔ ${b}`;
  }

  /**
   * Human-friendly summary, e.g. "SDT0001 (Cooking Oil) [DRUM] ↔ SDT0002 (Cooking Oil Bulk) [KG]".
   */
  getSummary(rel: ItemRelationship | null | undefined): string {
    if (!rel) return "N/A";
    const side = (item: RelationshipItemRef | null): string => {
      if (!item) return "?";
      return `${item.code} (${item.name}) [${item.uom || "—"}]`;
    };
    return `${side(rel.itemA)} ↔ ${side(rel.itemB)}`;
  }

  isActive(rel: ItemRelationship | null | undefined): boolean {
    return rel?.status === "Active";
  }

  /**
   * True if the two given item IDs already form a relationship,
   * either direction. Uses a loaded list to avoid an extra API call.
   */
  isPairAlreadyRelated(
    list: ItemRelationship[],
    itemAId: number,
    itemBId: number,
    excludeId?: number,
  ): ItemRelationship | null {
    const a = Number(itemAId);
    const b = Number(itemBId);
    return (
      list.find((r) => {
        if (excludeId && r.id === excludeId) return false;
        const sameDir = r.itemAId === a && r.itemBId === b;
        const reverseDir = r.itemAId === b && r.itemBId === a;
        return sameDir || reverseDir;
      }) || null
    );
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default new ItemRelationshipService();