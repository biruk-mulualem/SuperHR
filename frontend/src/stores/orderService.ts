// stores/orderService.ts
import api from "./interceptor";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface OrderItem {
  id?: number;
  orderId?: number;
  itemName: string;
  description?: string;
  quantity: number;
  uom: string;
  packaging?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  productId: number;
  productName: string;
  productType: 'Paint' | 'Fiber';
  fgCode: string;
  quantity: number;
  uom: string;
  packaging: string;
  salesPersonId: number;
  salesPersonName: string;
  salesPersonPhone: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdDate: string;
  dueDate: string;
  sentAt?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  restoredFromCancelled?: boolean;
  restoredAt?: string;
  notes?: string;
  items: OrderItem[];
  storeId?: number;
  storeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  priority?: string;
  productType?: string;
  salesPersonId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrderStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: any;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface OrderActionResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber?: string;
    status: string;
    sentAt?: string;
    acceptedAt?: string;
    acceptedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    completedAt?: string;
    completedBy?: string;
    cancelledAt?: string;
    cancelledBy?: string;
    restoredAt?: string;
  };
}

export interface FinishedGood {
  id: number;
  fgCode: string;
  name: string;
  type: 'Paint' | 'Fiber';
  uomId?: number;
  uom?: {
    uomId: number;
    code: string;
    name: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UOM {
  uomId: number;
  id: number;
  code: string;
  name: string;
  category?: string;
  status?: string;
}

// ============================================
// ORDER NOTIFICATION TYPES
// ============================================

export interface OrderNotification {
  id: number;
  orderId: number;
  orderNumber: string;
  storeId: number;
  storeName: string;
  storeCode: string;
  productName: string;
  productType: string;
  fgCode: string;
  quantity: number;
  uom: string;
  packaging: string;
  salesPersonName: string;
  salesPersonPhone: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  dueDate: string;
  sentAt: string;
  respondedAt?: string;
  respondedBy?: string;
  rejectionReason?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderNotificationResponse {
  success: boolean;
  data: OrderNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// ORDER SERVICE CLASS
// ============================================

class OrderService {
  // ================================================================
  // PRODUCTS (Finished Goods)
  // ================================================================

  /**
   * Get all finished goods (products) for dropdown
   */
  async getFinishedGoods(filters: { type?: string; search?: string; limit?: number } = {}): Promise<{ success: boolean; data: FinishedGood[] }> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', String(filters.limit || 9999));
    
    const response = await api.get(`/finished-goods?${params.toString()}`);
    return response.data;
  }

  /**
   * Get finished good by ID
   */
  async getFinishedGoodById(id: number): Promise<{ success: boolean; data: FinishedGood }> {
    const response = await api.get(`/finished-goods/${id}`);
    return response.data;
  }

  // ================================================================
  // UOM (Unit of Measurement)
  // ================================================================

  /**
   * Get all UOMs for packaging dropdown
   */
  async getUOMs(filters: { category?: string; search?: string; limit?: number } = {}): Promise<{ success: boolean; data: UOM[] }> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', String(filters.limit || 9999));
    
    const response = await api.get(`/uom?${params.toString()}`);
    return response.data;
  }

  /**
   * Get UOM by ID
   */
  async getUOMById(id: number): Promise<{ success: boolean; data: UOM }> {
    const response = await api.get(`/uom/${id}`);
    return response.data;
  }

  // ================================================================
  // ORDER CRUD OPERATIONS
  // ================================================================

  /**
   * Get all orders with filters and pagination
   */
  async getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.productType) params.append('productType', filters.productType);
    if (filters.salesPersonId) params.append('salesPersonId', String(filters.salesPersonId));
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: number): Promise<{ success: boolean; data: Order }> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  }

  /**
   * Create a new order
   */
  async createOrder(payload: {
    productId: number;
    quantity: number;
    uom: string;
    packaging: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate: string;
    notes?: string;
    salesPersonName?: string;
    salesPersonPhone?: string;
    items?: Omit<OrderItem, 'id' | 'orderId'>[];
  }): Promise<OrderResponse> {
    const response = await api.post('/orders', payload);
    return response.data;
  }

  /**
   * Update an order
   */
  async updateOrder(id: number, payload: {
    productId?: number;
    quantity?: number;
    uom?: string;
    packaging?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    notes?: string;
    salesPersonName?: string;
    salesPersonPhone?: string;
    items?: Omit<OrderItem, 'id' | 'orderId'>[];
  }): Promise<OrderResponse> {
    const response = await api.put(`/orders/${id}`, payload);
    return response.data;
  }

  /**
   * Delete an order (only Draft)
   */
  async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  }

  // ================================================================
  // STATUS ACTIONS - Sales Person
  // ================================================================

  /**
   * Send order to production (Draft → Sent)
   */
  async sendOrder(id: number, storeId: number): Promise<OrderActionResponse> {
    const response = await api.post(`/orders/${id}/send`, { storeId });
    return response.data;
  }

  /**
   * Cancel order (Draft or Sent → Cancelled)
   */
  async cancelOrder(id: number): Promise<OrderActionResponse> {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  }

  /**
   * Restore order from cancelled (Cancelled → Draft)
   */
  async restoreOrder(id: number): Promise<OrderActionResponse> {
    const response = await api.post(`/orders/${id}/restore`);
    return response.data;
  }

  // ================================================================
  // ORDER NOTIFICATIONS - UPDATED ENDPOINTS
  // ================================================================

  /**
   * Get order notifications for a store
   * GET /api/orders/notifications/store/:storeId
   */
  async getOrderNotifications(storeId: number, filters: { status?: string; page?: number; limit?: number } = {}): Promise<OrderNotificationResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page || 1));
    if (filters.limit) params.append('limit', String(filters.limit || 10));
    
    // ✅ Updated endpoint to match orderRoutes.js
    const response = await api.get(`/orders/notifications/store/${storeId}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get my order notifications (for current user's store)
   * GET /api/orders/notifications/my
   */
  async getMyOrderNotifications(filters: { status?: string; page?: number; limit?: number } = {}): Promise<OrderNotificationResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page || 1));
    if (filters.limit) params.append('limit', String(filters.limit || 10));
    
    // ✅ Updated endpoint to match orderRoutes.js
    const response = await api.get(`/orders/notifications/my?${params.toString()}`);
    return response.data;
  }

  /**
   * Get notification count for badge
   * GET /api/orders/notifications/count
   */
  async getOrderNotificationCount(): Promise<{ success: boolean; data: { pending: number } }> {
    // ✅ Updated endpoint to match orderRoutes.js
    const response = await api.get('/orders/notifications/count');
    return response.data;
  }

  /**
   * Accept order notification
   * POST /api/orders/notifications/:id/accept
   */
  async acceptOrderNotification(notificationId: number): Promise<{ success: boolean; message: string; data: OrderNotification }> {
    // ✅ Updated endpoint to match orderRoutes.js
    const response = await api.post(`/orders/notifications/${notificationId}/accept`);
    return response.data;
  }

  /**
   * Reject order notification
   * POST /api/orders/notifications/:id/reject
   */
  async rejectOrderNotification(notificationId: number, reason: string): Promise<{ success: boolean; message: string; data: OrderNotification }> {
    // ✅ Updated endpoint to match orderRoutes.js
    const response = await api.post(`/orders/notifications/${notificationId}/reject`, { reason });
    return response.data;
  }

  /**
   * Complete order notification
   * POST /api/orders/notifications/:id/complete
   */
  async completeOrderNotification(notificationId: number): Promise<{ success: boolean; message: string; data: OrderNotification }> {
    // ✅ Updated endpoint to match orderRoutes.js
    const response = await api.post(`/orders/notifications/${notificationId}/complete`);
    return response.data;
  }

  // ================================================================
  // STATUS ACTIONS - Production (Admin Only)
  // ================================================================

  /**
   * Accept order (Sent → Accepted)
   */
  async acceptOrder(id: number): Promise<OrderActionResponse> {
    const response = await api.post(`/orders/${id}/accept`);
    return response.data;
  }

  /**
   * Reject order (Sent → Rejected)
   */
  async rejectOrder(id: number, reason: string): Promise<OrderActionResponse> {
    const response = await api.post(`/orders/${id}/reject`, { reason });
    return response.data;
  }

  /**
   * Complete order (Accepted → Completed)
   */
  async completeOrder(id: number): Promise<OrderActionResponse> {
    const response = await api.post(`/orders/${id}/complete`);
    return response.data;
  }

  // ================================================================
  // STATISTICS
  // ================================================================

  /**
   * Get order statistics
   */
  async getStats(): Promise<{ success: boolean; data: OrderStats }> {
    const response = await api.get('/orders/stats');
    return response.data;
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Get status label with icon
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': '📝 Draft',
      'sent': '📤 Sent',
      'accepted': '✅ Accepted',
      'rejected': '❌ Rejected',
      'completed': '🏁 Completed',
      'cancelled': '🗑️ Cancelled'
    };
    return labels[status] || status;
  }

  /**
   * Get status color for badge
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': '#64748b',
      'sent': '#3b82f6',
      'accepted': '#22c55e',
      'rejected': '#ef4444',
      'completed': '#059669',
      'cancelled': '#94a3b8'
    };
    return colors[status] || '#94a3b8';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'draft': 'badge-secondary',
      'sent': 'badge-primary',
      'accepted': 'badge-success',
      'rejected': 'badge-danger',
      'completed': 'badge-completed',
      'cancelled': 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': '🟢 Low',
      'medium': '🟡 Medium',
      'high': '🔴 High'
    };
    return labels[priority] || priority;
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': '#22c55e',
      'medium': '#f59e0b',
      'high': '#ef4444'
    };
    return colors[priority] || '#94a3b8';
  }

  /**
   * Format date
   */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format date time
   */
  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format quantity
   */
  formatQuantity(quantity: number): string {
    if (!quantity && quantity !== 0) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(quantity);
  }

  /**
   * Check if order is editable
   */
  isEditable(order: Order): boolean {
    return order.status === 'draft' || order.status === 'rejected' || order.status === 'cancelled';
  }

  /**
   * Check if order can be sent
   */
  canSend(order: Order): boolean {
    return order.status === 'draft';
  }

  /**
   * Check if order can be cancelled
   */
  canCancel(order: Order): boolean {
    return order.status === 'draft' || order.status === 'sent';
  }

  /**
   * Check if order can be restored
   */
  canRestore(order: Order): boolean {
    return order.status === 'cancelled';
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export default new OrderService();