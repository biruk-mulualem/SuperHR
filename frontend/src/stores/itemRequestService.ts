// stores/itemRequestService.ts
import api from "./interceptor";

// ================================================================
// TYPES
// ================================================================

export interface RequestItem {
  itemId: number;
  quantity: number;
  remark?: string;
  // ✅ UOM Fields
  selected_uom?: "base" | "conversion";
  uom_code?: string;
  is_base_uom?: boolean;
  // ✅ Spec Fields
  specification?: string;
  brand?: string;
  model?: string;
}

// ✅ NEW — Family search types
export interface FamilySearchResultUom {
  itemId: number;
  code: string;
  name: string;
  uomCode: string;
  uomName: string;
  stock: number | null;
}

export interface FamilySearchResult {
  familyId: string;
  displayName: string;
  code: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  uoms: FamilySearchResultUom[];
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

  Department?: {
    department_id: number;
    name: string;
    code: string;
    description?: string | null;
  };

  department?:
    | {
        department_id?: number;
        id?: number;
        name?: string;
        code?: string;
        description?: string | null;
      }
    | string;

  departmentName?: string;
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
  specText?: string;
  uomId?: number;
  uom?: {
    uomId: number;
    code: string;
    name: string;
  };
  conversionUomId?: number;
  conversionUom?: {
    uomId: number;
    code: string;
    name: string;
  };
  conversionValue?: number;
}

export interface Group {
  id: number;
  name: string;
  code: string;
  status: string;
}

export interface Department {
  department_id: number;
  id?: number;
  name: string;
  code: string;
  description?: string;
  status?: string;
}

export interface ApprovalDepartment {
  departmentId: number;
  name: string;
  code: string;
  description?: string | null;
  appliesTo?: string[];
}

// ================================================================
// PAGE SNAPSHOT TYPES (persisted in print_overrides)
// ================================================================

export interface SnapshotColumn {
  key: string;
  label: string;
  width: string;
  visible: boolean;
  custom?: boolean;
  locked?: boolean;
  editable?: boolean;
  kind?: "text" | "number";
  computed?: string;
  pairedKey?: string;
  align?: "left" | "center";
  bold?: boolean;
}

export interface SnapshotItem {
  itemId: number;
  code: string;
  name: string;
  quantity: number;
  selectedUom: "base" | "conversion";
  uomCode: string;
  isBaseUom: boolean;
  specification: string;
  brand: string;
  model: string;
  remark: string;
  extras: Record<string, string>;
}

export interface PageSnapshot {
  requestCode: string;
  askingStoreId: number | null;
  supplyingStoreId: number | null;

  header: string;
  department: string;
  requestedBy: string;
  approvedByName: string;
  requestedDate: string;
  overrideDate: string | null;

  sectionVisibility: {
    department: boolean;
    reason: boolean;
    comment: boolean;
    checkedBy: boolean;
  };

  columnsConfig: SnapshotColumn[];
  items: SnapshotItem[];
  customCells: Record<string, Record<string, string>>;
  mergeGroups: Array<{ start: number; size: number; text: string }>;

  isAsset: boolean;
  isTemelash: boolean;
  temelashFromDate: string | null;
  temelashToDate: string | null;
  remark: string;

  savedAt: string;
  savedByUserId: number | null;
}

export interface PrintOverride {
  id: number;
  requestId: number;
  userId?: number | null;
  updatedBy?: number | null;
  department?: string | null;
  approvedByName?: string | null;
  overrideDate?: string | null;
  customHeader?: string | null;
  sectionVisibility?: PageSnapshot["sectionVisibility"] | null;
  columnsConfig?: SnapshotColumn[] | null;
  customCells?: Record<string, Record<string, string>> | null;
  pageSnapshot?: PageSnapshot | null;
  createdAt?: string;
  updatedAt?: string;
}

// ================================================================
// NOTIFICATION TYPES
// ================================================================

export type NotificationStage = "asking_store" | "supplying_store";

export interface RequestNotification {
  id: number;
  request_id: number;
  group_id: number | null;
  department_id: number | null;
  store_id: number;
  approval_type?: "group" | "department";
  is_department_approval?: boolean;
  stage?: NotificationStage;
  status: "pending" | "accepted" | "rejected";
  rejected_reason: string | null;
  responded_by: number | null;
  responded_at: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
  group?: {
    id: number;
    name: string;
    code: string;
  };
  department?: {
    department_id: number;
    name: string;
    code: string;
  };
  respondedByUser?: {
    userId: number;
    username: string;
    fullName: string;
  };
}

export interface RequestNotificationSummary {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  allAccepted: boolean;
  hasRejection: boolean;
  rejectionReasons: Array<{
    groupId: number;
    groupName: string;
    stage?: NotificationStage;
    reason: string;
    respondedBy: string;
    respondedAt: string;
  }>;
  askingStore?: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  supplyingStore?: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
}

export interface ItemRequest {
  notifications: any;
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
  status: "pending" | "approved" | "rejected" | "finalized";
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
  isAsset?: boolean;
  departmentId?: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  excludedDepartmentIds?: number[];
  isTemelash?: boolean;
  temelashFromDate?: string | null;
  temelashToDate?: string | null;

  // ✅ NEW: attached when the backend includes the PrintOverride
  printOverride?: PrintOverride | null;
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

export interface ValidationError {
  itemId: number;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  error: string;
  message: string;
  // ... existing properties
  blockingRequests?: Array<{
    requestId: number;
    requestCode: string;
    status: string;
    quantity: number;           // ✅ ADD: Remaining Qty (e.g., 3)
    requestedQuantity: number;  // ✅ ADD: Original Qty (e.g., 5)
    processedQuantity: number;  // ✅ ADD: Processed Qty (e.g., 2)
    uom: string;
    askingStoreName?: string;
    supplyingStoreName?: string;
    requestedByName?: string;
  }>;
  blockingTemelash?: Array<{
    temelashRecordId: number;
    requestId: number;
    requestCode: string;
    quantity: number;
    uom: string;
    fromDate: string;
    toDate: string;
  }>;
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
  errors?: ValidationError[];
  /** ✅ NEW — returned by createRequest/updateRequest when a snapshot is saved */
  printOverride?: PrintOverride | null;
}

export interface StatsResponse {
  success: boolean;
  data: ItemRequestStats;
  message?: string;
  error?: string;
}

// ================================================================
// PAYLOAD TYPES — now include the page snapshot fields
// ================================================================

export interface CreateRequestData {
  askingStoreId: number;
  supplyingStoreId: number;
  items: {
    itemId: number;
    quantity: number;
    remark?: string;
    selectedUom?: "base" | "conversion";
    uomCode?: string;
    isBaseUom?: boolean;
    specification?: string;
    brand?: string;
    model?: string;
  }[];
  requestedById?: number;
  requestedBy?: string;
  requestedDate: string;
  status?: "pending" | "approved" | "rejected";
  remark?: string;
  isAsset?: boolean;
  excludedDepartmentIds?: number[];
  isTemelash?: boolean;
  temelashFromDate?: string | null;
  temelashToDate?: string | null;

  // ✅ NEW — page snapshot fields (all optional)
  customHeader?: string | null;
  department?: string | null;
  approvedByName?: string | null;
  overrideDate?: string | null;
  sectionVisibility?: PageSnapshot["sectionVisibility"] | null;
  columnsConfig?: SnapshotColumn[] | null;
  customCells?: Record<string, Record<string, string>> | null;
  pageSnapshot?: PageSnapshot | null;
}

export interface UpdateRequestData {
  askingStoreId?: number;
  supplyingStoreId?: number;
  items?: {
    itemId: number;
    quantity: number;
    remark?: string;
    selectedUom?: "base" | "conversion";
    uomCode?: string;
    isBaseUom?: boolean;
    specification?: string;
    brand?: string;
    model?: string;
  }[];
  requestedById?: number;
  requestedBy?: string;
  requestedDate?: string;
  remark?: string;
  isAsset?: boolean;
  excludedDepartmentIds?: number[];
  isTemelash?: boolean;
  temelashFromDate?: string | null;
  temelashToDate?: string | null;

  // ✅ NEW — page snapshot fields (all optional)
  customHeader?: string | null;
  department?: string | null;
  approvedByName?: string | null;
  overrideDate?: string | null;
  sectionVisibility?: PageSnapshot["sectionVisibility"] | null;
  columnsConfig?: SnapshotColumn[] | null;
  customCells?: Record<string, Record<string, string>> | null;
  pageSnapshot?: PageSnapshot | null;
}

export interface ExportItemData {
  "Request Code": string;
  "Asking Store": string;
  "Supplying Store": string;
  "Requested By": string;
  "Requested By Email": string;
  "Requested Date": string;
  Status: string;
  "Is Asset": string;
  Items: string;
  Remark: string;
}

// ================================================================
// ✅ TEMELASH TYPES
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

export interface TemelashRecord {
  id: number;
  request_id: number;
  request_code: string;
  askingStoreId: number;
  supplyingStoreId: number;
  askingStore?: Store;
  supplyingStore?: Store;
  requestedById?: number | null;
  requestedBy?: string | null;
  requestedByUser?: User;
  items: TemelashSnapshotItem[];
  remark?: string | null;
  status: "out" | "returned";
  issued_at: string;
  returned_at: string | null;
  returnedById?: number | null;
  returnedByUser?: User;
  returnRemark?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  returnedLate?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ================================================================
// GROUP NOTIFICATION RESPONSE TYPES
// ================================================================

export interface GroupNotificationsResponse {
  success: boolean;
  data?: {
    notifications: Array<{
      id: number;
      request_id: number;
      group_id: number | null;
      department_id: number | null;
      store_id: number;
      stage?: NotificationStage;
      status: "pending" | "accepted" | "rejected";
      rejected_reason: string | null;
      responded_by: number | null;
      responded_at: string | null;
      created_at: string;
      updated_at: string;
      request: ItemRequest;
      group?: Group;
      department?: {
        department_id: number;
        name: string;
        code: string;
      };
      store: Store;
      respondedByUser?: User;
    }>;
    summary: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    store: {
      id: number;
      group: { id: number };
    };
  };
  error?: string;
}

// ================================================================
// ITEM REQUEST SERVICE
// ================================================================

class ItemRequestService {
  // ================================================================
  // STORE METHODS (for dropdowns)
  // ================================================================

  async getActiveStores(): Promise<{
    success: boolean;
    data: Store[];
    error?: string;
  }> {
    try {
      const response = await api.get("/item-requests/active-stores");
      return response.data;
    } catch (error: any) {
      console.error("Get active stores error:", error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch active stores",
      };
    }
  }

  // ✅ UPDATED — returns FAMILIES (one row per product, multiple UOMs per row)
  async getActiveItems(params?: {
    search?: string;
    page?: number;
    limit?: number;
    storeId?: number;
    groupId?: number;
  }): Promise<{
    success: boolean;
    data: FamilySearchResult[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.storeId) queryParams.append("storeId", params.storeId.toString());
      if (params?.groupId) queryParams.append("groupId", params.groupId.toString());

      const url = queryParams.toString()
        ? `/item-requests/active-items?${queryParams.toString()}`
        : "/item-requests/active-items";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get active items error:", error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch active items",
      };
    }
  }

  // ================================================================
  // STORE GROUPS METHOD
  // ================================================================

  async getStoreGroups(storeId: number): Promise<{
    success: boolean;
    data: Group[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/stores/${storeId}/groups`);
      return response.data;
    } catch (error: any) {
      console.error("Get store groups error:", error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch store groups",
      };
    }
  }

  // ================================================================
  // 🔥 APPROVAL DEPARTMENTS
  // ================================================================

  async getApprovalDepartmentsForStore(storeCode: string): Promise<{
    success: boolean;
    data?: {
      storeCode: string;
      storeName: string;
      requiresApproval: boolean;
      departments: ApprovalDepartment[];
    };
    error?: string;
  }> {
    try {
      if (!storeCode || storeCode === "N/A") {
        return {
          success: false,
          error: "Invalid store code",
        };
      }

      const response = await api.get(
        `/item-requests/approval-departments/${encodeURIComponent(storeCode)}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Get approval departments error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch approval departments",
      };
    }
  }

  // ================================================================
  // REQUEST METHODS
  // ================================================================

  async getRequests(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: "pending" | "approved" | "rejected" | "finalized" | "all";
      storeId?: number;
      userId?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {},
  ): Promise<PaginatedResponse<ItemRequest>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.storeId)
        queryParams.append("storeId", params.storeId.toString());
      if (params.userId) queryParams.append("userId", params.userId.toString());
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = queryParams.toString()
        ? `/item-requests?${queryParams.toString()}`
        : "/item-requests";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get requests error:", error);
      return {
        success: false,
        data: {
          requests: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        },
        error: error.response?.data?.error || "Failed to fetch requests",
      };
    }
  }

  async getRequestById(id: number | string): Promise<SingleRequestResponse> {
    try {
      const response = await api.get(`/item-requests/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get request by ID error:", error);
      return {
        success: false,
        data: {} as ItemRequest,
        error: error.response?.data?.error || "Failed to fetch request",
      };
    }
  }

  async getMyRequests(
    params: {
      page?: number;
      limit?: number;
      status?: "pending" | "approved" | "rejected" | "finalized" | "all";
    } = {},
  ): Promise<PaginatedResponse<ItemRequest>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.status) queryParams.append("status", params.status);

      const url = queryParams.toString()
        ? `/item-requests/my-requests?${queryParams.toString()}`
        : "/item-requests/my-requests";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get my requests error:", error);
      return {
        success: false,
        data: {
          requests: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        },
        error: error.response?.data?.error || "Failed to fetch your requests",
      };
    }
  }

  async getRequestsByUser(userId: number | string): Promise<{
    success: boolean;
    data: ItemRequest[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get requests by user error:", error);
      return {
        success: false,
        data: [],
        error:
          error.response?.data?.error || "Failed to fetch requests for user",
      };
    }
  }

  async getRequestsByStatus(
    status: "pending" | "approved" | "rejected" | "finalized",
  ): Promise<{
    success: boolean;
    data: ItemRequest[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/status/${status}`);
      return response.data;
    } catch (error: any) {
      console.error("Get requests by status error:", error);
      return {
        success: false,
        data: [],
        error:
          error.response?.data?.error || "Failed to fetch requests by status",
      };
    }
  }

  async getRequestsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<{
    success: boolean;
    data: ItemRequest[];
    error?: string;
  }> {
    try {
      const response = await api.get(
        `/item-requests/date-range?startDate=${startDate}&endDate=${endDate}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Get requests by date range error:", error);
      return {
        success: false,
        data: [],
        error:
          error.response?.data?.error ||
          "Failed to fetch requests by date range",
      };
    }
  }

  async getStats(): Promise<StatsResponse> {
    try {
      const response = await api.get("/item-requests/stats");
      return response.data;
    } catch (error: any) {
      console.error("Get stats error:", error);
      return {
        success: false,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          finalized: 0,
          byStatus: [],
        },
        error: error.response?.data?.error || "Failed to fetch statistics",
      };
    }
  }

  /**
   * Create a new item request.
   * The payload now also carries the page snapshot fields; the backend
   * persists them into `print_overrides` inside the same transaction.
   */
  async createRequest(data: CreateRequestData): Promise<SingleRequestResponse> {
    try {
      const response = await api.post("/item-requests", data);
      return response.data;
    } catch (error: any) {
      console.error("Create request error:", error);

      const errorData = error.response?.data;

      if (errorData && errorData.errors && errorData.errors.length > 0) {
        return errorData as SingleRequestResponse;
      }

      return {
        success: false,
        data: {} as ItemRequest,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create request",
      };
    }
  }

  /**
   * Update an existing item request.
   * Same as create — the payload can carry the snapshot fields.
   */
  async updateRequest(
    id: number | string,
    data: UpdateRequestData,
  ): Promise<SingleRequestResponse> {
    try {
      const response = await api.put(`/item-requests/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Update request error:", error);

      const errorData = error.response?.data;

      if (errorData && errorData.errors && errorData.errors.length > 0) {
        return errorData as SingleRequestResponse;
      }

      return {
        success: false,
        data: {} as ItemRequest,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update request",
      };
    }
  }

  async updateStatus(
    id: number | string,
    status: "pending" | "approved" | "rejected" | "finalized",
  ): Promise<{
    success: boolean;
    message: string;
    data?: ItemRequest;
    error?: string;
  }> {
    try {
      const response = await api.patch(`/item-requests/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      console.error("Update status error:", error);
      return {
        success: false,
        message: "",
        error: error.response?.data?.error || "Failed to update status",
      };
    }
  }

  async approveRequest(id: number | string) {
    return this.updateStatus(id, "approved");
  }

  async rejectRequest(id: number | string) {
    return this.updateStatus(id, "rejected");
  }

  async finalizeRequest(id: number | string) {
    return this.updateStatus(id, "finalized");
  }

  async deleteRequest(id: number | string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/item-requests/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete request error:", error);
      return {
        success: false,
        message: "",
        error: error.response?.data?.error || "Failed to delete request",
      };
    }
  }

  async exportRequests(params?: {
    status?: "pending" | "approved" | "rejected" | "finalized" | "all";
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
      if (params?.status) queryParams.append("status", params.status);
      if (params?.storeId)
        queryParams.append("storeId", params.storeId.toString());
      if (params?.userId)
        queryParams.append("userId", params.userId.toString());

      const url = queryParams.toString()
        ? `/item-requests/export?${queryParams.toString()}`
        : "/item-requests/export";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Export requests error:", error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.response?.data?.error || "Failed to export requests",
      };
    }
  }

  // ================================================================
  // ✅ TEMELASH METHODS
  // ================================================================

  async getTemelashRecords(params?: {
    page?: number;
    limit?: number;
    status?: "out" | "returned" | "all";
    storeId?: number;
    search?: string;
  }): Promise<{
    success: boolean;
    data?: {
      records: TemelashRecord[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      summary: {
        out: number;
        returned: number;
        total: number;
        overdue?: number;
      };
    };
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status && params.status !== "all") {
        queryParams.append("status", params.status);
      }
      if (params?.storeId)
        queryParams.append("storeId", params.storeId.toString());
      if (params?.search) queryParams.append("search", params.search);

      const url = queryParams.toString()
        ? `/item-requests/temelash?${queryParams.toString()}`
        : "/item-requests/temelash";

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

  async returnTemelash(
    recordId: number,
    remark?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    data?: TemelashRecord;
    error?: string;
  }> {
    try {
      const response = await api.post(
        `/item-requests/temelash/${recordId}/return`,
        { remark: remark || "" },
      );
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
  // ✅ PAGE SNAPSHOT METHODS (print_overrides)
  // ================================================================

  /**
   * Get the persisted page snapshot for a request.
   * GET /api/item-requests/:id/print-override
   */
  async getPageSnapshot(requestId: number | string): Promise<{
    success: boolean;
    data?: PrintOverride | null;
    error?: string;
  }> {
    try {
      const response = await api.get(
        `/item-requests/${requestId}/print-override`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Get page snapshot error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch page snapshot",
      };
    }
  }

  /**
   * Save (or update) only the page snapshot for a request.
   * POST /api/item-requests/:id/print-override
   */
  async savePageSnapshot(
    requestId: number | string,
    patch: Partial<{
      customHeader: string | null;
      department: string | null;
      approvedByName: string | null;
      overrideDate: string | null;
      sectionVisibility: PageSnapshot["sectionVisibility"] | null;
      columnsConfig: SnapshotColumn[] | null;
      customCells: Record<string, Record<string, string>> | null;
      pageSnapshot: PageSnapshot | null;
    }>,
  ): Promise<{ success: boolean; data?: PrintOverride; error?: string }> {
    try {
      const response = await api.post(
        `/item-requests/${requestId}/print-override`,
        patch,
      );
      return response.data;
    } catch (error: any) {
      console.error("Save page snapshot error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save page snapshot",
      };
    }
  }

  // ================================================================
  // GROUP NOTIFICATION METHODS
  // ================================================================

  async getGroupNotifications(
    storeId: number,
    groupId: number,
    params?: {
      page?: number;
      limit?: number;
      status?: "pending" | "accepted" | "rejected" | "all";
    },
  ): Promise<GroupNotificationsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);

      const url = queryParams.toString()
        ? `/item-requests/notifications/${storeId}/${groupId}?${queryParams.toString()}`
        : `/item-requests/notifications/${storeId}/${groupId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get group notifications error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to get group notifications",
      };
    }
  }

  // ================================================================
  // DEPARTMENT NOTIFICATIONS (for ASSET requests)
  // ================================================================

  async getDepartmentNotifications(
    departmentId: number,
    params?: {
      page?: number;
      limit?: number;
      status?: "pending" | "accepted" | "rejected" | "all";
    },
  ): Promise<{
    success: boolean;
    data?: {
      notifications: Array<{
        id: number;
        request_id: number;
        department_id: number;
        store_id: number;
        stage?: NotificationStage;
        status: "pending" | "accepted" | "rejected";
        rejected_reason: string | null;
        responded_by: number | null;
        responded_at: string | null;
        created_at: string;
        updated_at: string;
        request: ItemRequest;
        department: {
          department_id: number;
          name: string;
          code: string;
          description?: string;
        };
        respondedByUser?: User;
      }>;
      summary: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      department: {
        id: number;
        name: string;
        code: string;
      };
    };
    error?: string;
  }> {
    try {
      if (!departmentId || isNaN(departmentId) || departmentId <= 0) {
        return {
          success: false,
          error: "Invalid department ID",
        };
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);

      const url = queryParams.toString()
        ? `/item-requests/notifications/department/${departmentId}?${queryParams.toString()}`
        : `/item-requests/notifications/department/${departmentId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("❌ Get department notifications error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to get department notifications",
      };
    }
  }

  // ================================================================
  // PENDING NOTIFICATIONS (Combined)
  // ================================================================

  async getPendingNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data?: {
      notifications: Array<{
        id: number;
        request_id: number;
        group_id: number | null;
        department_id: number | null;
        store_id: number;
        approval_type: "group" | "department";
        is_department_approval: boolean;
        stage?: NotificationStage;
        status: "pending" | "accepted" | "rejected";
        rejected_reason: string | null;
        responded_by: number | null;
        responded_at: string | null;
        viewed_at: string | null;
        created_at: string;
        updated_at: string;
        request: ItemRequest;
        group?: { id: number; name: string; code: string };
        department?: { department_id: number; name: string; code: string };
        store?: Store;
        respondedByUser?: User;
        _type?: "group" | "department";
        _typeLabel?: string;
      }>;
      summary: {
        total: number;
        group: number;
        department: number;
        page: number;
        limit: number;
        pages: number;
      };
      user: {
        userId: number;
        role: string;
        storeId: number | null;
        groupId: number | null;
        departmentId: number | null;
      };
    };
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const url = queryParams.toString()
        ? `/item-requests/notifications/pending?${queryParams.toString()}`
        : "/item-requests/notifications/pending";

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("❌ Get pending notifications error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to get pending notifications",
      };
    }
  }

  // ================================================================
  // OTHER NOTIFICATION METHODS
  // ================================================================

  async getRequestWithNotifications(id: number | string): Promise<{
    success: boolean;
    data?: {
      request: ItemRequest;
      notificationSummary: RequestNotificationSummary;
    };
    error?: string;
  }> {
    try {
      const response = await api.get(`/item-requests/${id}/notifications`);
      return response.data;
    } catch (error: any) {
      console.error("Get request with notifications error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch request notifications",
      };
    }
  }

  async checkRequestNotificationStatus(requestId: number): Promise<{
    success: boolean;
    data?: {
      allAccepted: boolean;
      hasRejection: boolean;
      total: number;
      acceptedCount: number;
      rejectedCount: number;
      pendingCount: number;
      askingStore?: {
        total: number;
        accepted: number;
        rejected: number;
        pending: number;
        allAccepted: boolean;
      };
      supplyingStore?: {
        total: number;
        accepted: number;
        rejected: number;
        pending: number;
        allAccepted: boolean;
      };
    };
    error?: string;
  }> {
    try {
      const response = await api.get(
        `/item-requests/${requestId}/notifications/status`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Check notification status error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to check notification status",
      };
    }
  }

  async getRejectionReasons(requestId: number): Promise<{
    success: boolean;
    data?: Array<{
      groupId: number;
      groupName: string;
      stage?: NotificationStage;
      reason: string;
      respondedBy: string;
      respondedAt: string;
    }>;
    error?: string;
  }> {
    try {
      const response = await api.get(
        `/item-requests/notifications/requests/${requestId}/rejections`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Get rejection reasons error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get rejection reasons",
      };
    }
  }

  async acceptNotification(notificationId: number): Promise<{
    success: boolean;
    message?: string;
    data?: RequestNotification;
    stageAdvanced?: boolean;
    advancementReason?: string;
    error?: string;
  }> {
    try {
      const response = await api.post(
        `/item-requests/notifications/${notificationId}/accept`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Accept notification error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to accept notification",
      };
    }
  }

  async rejectNotification(
    notificationId: number,
    reason: string,
  ): Promise<{
    success: boolean;
    message?: string;
    data?: RequestNotification;
    error?: string;
  }> {
    try {
      const response = await api.post(
        `/item-requests/notifications/${notificationId}/reject`,
        { reason },
      );
      return response.data;
    } catch (error: any) {
      console.error("Reject notification error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reject notification",
      };
    }
  }

  async changeNotificationDecision(
    notificationId: number,
    status: "accepted" | "rejected",
    reason?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    data?: RequestNotification;
    error?: string;
  }> {
    try {
      const response = await api.post(
        `/item-requests/notifications/${notificationId}/change`,
        {
          status,
          reason: status === "rejected" ? reason : undefined,
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("Change notification decision error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to change decision",
      };
    }
  }

  // ================================================================
  // NOTIFICATION HELPER METHODS (Stage-aware)
  // ================================================================

  canApproveRequest(request: ItemRequest): boolean {
    if (!request || request.status !== "pending") return false;

    const notifications = (request as any).notifications || [];
    if (notifications.length === 0) return false;

    const allAccepted = notifications.every(
      (n: any) => n.status === "accepted",
    );
    const hasRejection = notifications.some(
      (n: any) => n.status === "rejected",
    );

    return allAccepted && !hasRejection;
  }

  canPrintRequest(request: ItemRequest): boolean {
    return this.canApproveRequest(request);
  }



  // ================================================================
  // AWAITING MY APPROVAL
  // ----------------------------------------------------------------
  // Returns requests where every supplying-stage notification
  // (groups + departments) has accepted, and the request is still
  // pending your final approval.
  // ================================================================
  async getAwaitingMyApproval(params: {
    page?: number;
    limit?: number;
    search?: string;
    storeId?: number | "all";
    departmentId?: number | "all";
    requesterId?: number | "all";
  } = {}): Promise<{
    success: boolean;
    data: {
      requests: ItemRequest[];
      pagination: { total: number; page: number; limit: number; pages: number };
    };
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();

      queryParams.append("page", String(params.page ?? 1));
      queryParams.append("limit", String(params.limit ?? 10));

      if (params.search && params.search.trim() !== "") {
        queryParams.append("search", params.search.trim());
      }
      if (params.storeId !== undefined && params.storeId !== "all") {
        queryParams.append("storeId", String(params.storeId));
      }
      if (params.departmentId !== undefined && params.departmentId !== "all") {
        queryParams.append("departmentId", String(params.departmentId));
      }
      if (params.requesterId !== undefined && params.requesterId !== "all") {
        queryParams.append("requesterId", String(params.requesterId));
      }

      const url = `/item-requests/awaiting-my-approval?${queryParams.toString()}`;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Get awaiting-my-approval error:", error);
      return {
        success: false,
        data: {
          requests: [],
          pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        },
        error:
          error.response?.data?.error ||
          "Failed to fetch awaiting-my-approval requests",
      };
    }
  }

  
  getAcceptanceSummary(request: ItemRequest): string {
    const notifications = (request as any).notifications || [];
    if (notifications.length === 0) return "No approvals";

    const askingNotifs = notifications.filter(
      (n: any) => n.stage === "asking_store",
    );
    const supplyingNotifs = notifications.filter(
      (n: any) => n.stage === "supplying_store",
    );

    const summarize = (notifs: any[]) => {
      const total = notifs.length;
      const accepted = notifs.filter((n: any) => n.status === "accepted").length;
      const rejected = notifs.filter((n: any) => n.status === "rejected").length;
      const pending = notifs.filter((n: any) => n.status === "pending").length;
      return { total, accepted, rejected, pending };
    };

    const asking = summarize(askingNotifs);
    const supplying = summarize(supplyingNotifs);

    if (asking.total > 0) {
      if (asking.rejected > 0) {
        return `❌ Asking: ${asking.rejected} rejected`;
      }
      if (asking.accepted < asking.total) {
        return `⏳ Asking: ${asking.accepted}/${asking.total} accepted`;
      }
    }

    if (supplying.total > 0) {
      if (supplying.rejected > 0) {
        return `❌ Supplying: ${supplying.rejected} rejected`;
      }
      if (supplying.accepted < supplying.total) {
        return `⏳ Supplying: ${supplying.accepted}/${supplying.total} accepted`;
      }
    }

    if (
      asking.total > 0 &&
      asking.accepted === asking.total &&
      supplying.total === 0
    ) {
      return `✅ Asking done — sending to supplying...`;
    }

    return `✅ All ${notifications.length} accepted`;
  }

  getApproveTooltip(request: ItemRequest): string {
    if (!request || request.status !== "pending")
      return "Request is not pending";

    const notifications = (request as any).notifications || [];
    const hasRejection = notifications.some(
      (n: any) => n.status === "rejected",
    );
    if (hasRejection)
      return "Some have rejected this request. Edit and resubmit.";

    const allAccepted = notifications.every(
      (n: any) => n.status === "accepted",
    );
    if (!allAccepted) return "Waiting for all approvals";

    return "All approved - Click to proceed";
  }

  getGroupStatusDisplay(request: ItemRequest): {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    allAccepted: boolean;
    hasRejection: boolean;
    progress: number;
    askingStore: {
      total: number;
      accepted: number;
      rejected: number;
      pending: number;
      allAccepted: boolean;
    };
    supplyingStore: {
      total: number;
      accepted: number;
      rejected: number;
      pending: number;
      allAccepted: boolean;
    };
  } {
    const notifications = (request as any).notifications || [];
    const total = notifications.length;
    const accepted = notifications.filter(
      (n: any) => n.status === "accepted",
    ).length;
    const rejected = notifications.filter(
      (n: any) => n.status === "rejected",
    ).length;
    const pending = notifications.filter(
      (n: any) => n.status === "pending",
    ).length;
    const allAccepted = total > 0 && accepted === total;
    const hasRejection = rejected > 0;
    const progress = total > 0 ? (accepted / total) * 100 : 0;

    const askingNotifs = notifications.filter(
      (n: any) => n.stage === "asking_store",
    );
    const supplyingNotifs = notifications.filter(
      (n: any) => n.stage === "supplying_store",
    );

    const summarize = (notifs: any[]) => {
      const t = notifs.length;
      const a = notifs.filter((n: any) => n.status === "accepted").length;
      const r = notifs.filter((n: any) => n.status === "rejected").length;
      const p = notifs.filter((n: any) => n.status === "pending").length;
      return {
        total: t,
        accepted: a,
        rejected: r,
        pending: p,
        allAccepted: t > 0 && a === t,
      };
    };

    return {
      total,
      accepted,
      rejected,
      pending,
      allAccepted,
      hasRejection,
      progress,
      askingStore: summarize(askingNotifs),
      supplyingStore: summarize(supplyingNotifs),
    };
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  getRequesterName(request: ItemRequest): string {
    if (request?.requestedByUser) {
      return (
        request.requestedByUser.fullName ||
        request.requestedByUser.full_name ||
        request.requestedByUser.username ||
        "Unknown User"
      );
    }
    return request?.requestedBy || "Unknown User";
  }

  getRequesterEmail(request: ItemRequest): string {
    return request?.requestedByUser?.email || "N/A";
  }

  canPerformAction(
    request: ItemRequest,
    action: "edit" | "approve" | "reject" | "finalize",
  ): boolean {
    if (!request) return false;

    const actions = {
      edit: request.status !== "finalized",
      approve: request.status === "pending",
      reject: request.status === "pending",
      finalize: request.status === "approved",
    };

    return actions[action] || false;
  }

  getAvailableStatuses(
    request: ItemRequest,
  ): Array<"pending" | "approved" | "rejected" | "finalized"> {
    if (!request) return [];

    const statuses: Array<"pending" | "approved" | "rejected" | "finalized"> =
      [];
    if (request.status === "pending") {
      statuses.push("approved", "rejected");
    } else if (request.status === "approved") {
      statuses.push("finalized");
    }
    return statuses;
  }

  getStatusBadge(status: string): string {
    const badgeMap: Record<string, string> = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      finalized: "info",
    };
    return badgeMap[status] || "secondary";
  }

  getStatusDisplay(status: string): string {
    const displayMap: Record<string, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      finalized: "Finalized",
    };
    return displayMap[status] || status;
  }

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      pending: "⏳",
      approved: "✅",
      rejected: "❌",
      finalized: "📋",
    };
    return iconMap[status] || "📦";
  }

  formatDate(date: string | Date | null): string {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(date: string | Date | null): string {
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

  getTotalQuantity(request: ItemRequest): number {
    if (!request || !request.items) return 0;
    return request.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getTotalItems(request: ItemRequest): number {
    return request?.items?.length || 0;
  }

  isEditable(request: ItemRequest): boolean {
    return request?.status !== "finalized";
  }

  isPending(request: ItemRequest): boolean {
    return request?.status === "pending";
  }

  isApproved(request: ItemRequest): boolean {
    return request?.status === "approved";
  }

  isRejected(request: ItemRequest): boolean {
    return request?.status === "rejected";
  }

  isFinalized(request: ItemRequest): boolean {
    return request?.status === "finalized";
  }

  hasAllGroupsAccepted(request: ItemRequest): boolean {
    const notifications = (request as any).notifications || [];
    if (notifications.length === 0) return false;
    return notifications.every((n: any) => n.status === "accepted");
  }

  hasAnyRejection(request: ItemRequest): boolean {
    const notifications = (request as any).notifications || [];
    return notifications.some((n: any) => n.status === "rejected");
  }

  getPendingGroupsCount(request: ItemRequest): number {
    const notifications = (request as any).notifications || [];
    return notifications.filter((n: any) => n.status === "pending").length;
  }

  isAssetRequest(request: ItemRequest): boolean {
    return (request as any).isAsset === true;
  }

  getAssetDepartment(request: ItemRequest): string {
    const dept = (request as any).department;
    if (dept) {
      return dept.name || dept.code || "N/A";
    }
    return "N/A";
  }

  isTemelashRequest(request: ItemRequest): boolean {
    return (request as any).isTemelash === true;
  }

  hasTemelashWindow(request: ItemRequest): boolean {
    return !!(
      (request as any).temelashFromDate || (request as any).temelashToDate
    );
  }

  formatTemelashWindow(request: ItemRequest): string {
    const from = (request as any).temelashFromDate;
    const to = (request as any).temelashToDate;
    if (!from && !to) return "N/A";

    const fmt = (d: string | null | undefined): string => {
      if (!d) return "—";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    return `${fmt(from)} → ${fmt(to)}`;
  }

  isTemelashOverdue(record: TemelashRecord): boolean {
    if (!record?.toDate || record.status !== "out") return false;
    return new Date() > new Date(record.toDate);
  }
}

export default new ItemRequestService();