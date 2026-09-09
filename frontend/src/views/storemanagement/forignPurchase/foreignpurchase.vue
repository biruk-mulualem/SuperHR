<template>
  <div class="foreign-purchase-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">🌍 Foreign Purchase Orders</h1>
      <button class="btn-add" @click="showAddModal = true">➕ New Order</button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-number">{{ orders.length }}</span>
        <span class="stat-label">Total Orders</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ pendingCount }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ transitCount }}</span>
        <span class="stat-label">In Transit</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ deliveredCount }}</span>
        <span class="stat-label">Delivered</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input v-model="search" placeholder="🔍 Search orders..." class="search-input" />
      <select v-model="filterStatus" class="filter-select">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="in_transit">In Transit</option>
        <option value="delivered">Delivered</option>
        <option value="delayed">Delayed</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Supplier</th>
            <th>Items</th>
            <th>Total</th>
            <th>Order Date</th>
            <th>ETA</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="8" class="empty">No orders found</td>
          </tr>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td class="order-code">{{ order.orderNumber }}</td>
            <td>
              <div class="supplier">
                <span class="flag">{{ order.supplier.flag }}</span>
                {{ order.supplier.name }}
              </div>
            </td>
            <td>{{ order.items }} items</td>
            <td class="amount">${{ order.total.toFixed(2) }}</td>
            <td>{{ formatDate(order.orderDate) }}</td>
            <td>
              <span :class="['eta', getEtaClass(order)]">
                {{ formatDate(order.eta) }}
              </span>
            </td>
            <td>
              <span :class="['status', order.status]">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td>
              <button class="btn-view" @click="viewOrder(order)">👁️ View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedOrder.orderNumber }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="label">Supplier:</span>
            <span>{{ selectedOrder.supplier.flag }} {{ selectedOrder.supplier.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Country:</span>
            <span>{{ selectedOrder.supplier.country }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Items:</span>
            <span>{{ selectedOrder.items }} items</span>
          </div>
          <div class="detail-row">
            <span class="label">Total:</span>
            <span class="amount">${{ selectedOrder.total.toFixed(2) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Order Date:</span>
            <span>{{ formatDate(selectedOrder.orderDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">ETA:</span>
            <span>{{ formatDate(selectedOrder.eta) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span :class="['status', selectedOrder.status]">
              {{ getStatusLabel(selectedOrder.status) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Progress:</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: selectedOrder.progress + '%' }"></div>
            </div>
            <span>{{ selectedOrder.progress }}%</span>
          </div>
          <div v-if="selectedOrder.tracking" class="tracking">
            <h4>🚢 Tracking</h4>
            <div class="detail-row">
              <span class="label">Company:</span>
              <span>{{ selectedOrder.tracking.company }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Number:</span>
              <span class="tracking-number">{{ selectedOrder.tracking.number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span>{{ selectedOrder.tracking.status }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-close" @click="closeModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal small">
        <div class="modal-header">
          <h3>➕ New Foreign Order</h3>
          <button class="close-btn" @click="showAddModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Supplier</label>
            <select v-model="newOrder.supplierId" class="form-input">
              <option v-for="s in suppliers" :key="s.id" :value="s.id">
                {{ s.flag }} {{ s.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Items</label>
            <input type="number" v-model="newOrder.items" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Total ($)</label>
            <input type="number" v-model="newOrder.total" class="form-input" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>ETA (days)</label>
            <input type="number" v-model="newOrder.etaDays" class="form-input" min="1" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddModal = false">Cancel</button>
          <button class="btn-primary" @click="addOrder">Create Order</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ================================================================
// TYPES
// ================================================================

interface Order {
  id: number
  orderNumber: string
  supplier: { id: number; name: string; country: string; flag: string }
  items: number
  total: number
  orderDate: string
  eta: string
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed'
  progress: number
  tracking?: { company: string; number: string; status: string }
}

// ================================================================
// DEMO DATA
// ================================================================

const suppliers = [
  { id: 1, name: 'Tianjin Steel', country: 'China', flag: '🇨🇳' },
  { id: 2, name: 'Mumbai Textiles', country: 'India', flag: '🇮🇳' },
  { id: 3, name: 'Dubai Chemicals', country: 'UAE', flag: '🇦🇪' },
  { id: 4, name: 'Singapore Electronics', country: 'Singapore', flag: '🇸🇬' },
  { id: 5, name: 'Frankfurt Machinery', country: 'Germany', flag: '🇩🇪' }
]

const demoOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'PO-2026-1001',
    supplier: { id: 1, name: 'Tianjin Steel', country: 'China', flag: '🇨🇳' },
    items: 3,
    total: 12500.00,
    orderDate: '2026-08-15',
    eta: '2026-09-20',
    status: 'in_transit',
    progress: 65,
    tracking: { company: 'Maersk', number: 'TRK-1001-001', status: 'In Transit' }
  },
  {
    id: 2,
    orderNumber: 'PO-2026-1002',
    supplier: { id: 2, name: 'Mumbai Textiles', country: 'India', flag: '🇮🇳' },
    items: 5,
    total: 8750.00,
    orderDate: '2026-08-20',
    eta: '2026-09-10',
    status: 'pending',
    progress: 0
  },
  {
    id: 3,
    orderNumber: 'PO-2026-1003',
    supplier: { id: 3, name: 'Dubai Chemicals', country: 'UAE', flag: '🇦🇪' },
    items: 2,
    total: 3400.00,
    orderDate: '2026-07-10',
    eta: '2026-08-05',
    status: 'delivered',
    progress: 100,
    tracking: { company: 'MSC', number: 'TRK-1003-002', status: 'Delivered' }
  },
  {
    id: 4,
    orderNumber: 'PO-2026-1004',
    supplier: { id: 4, name: 'Singapore Electronics', country: 'Singapore', flag: '🇸🇬' },
    items: 8,
    total: 22300.00,
    orderDate: '2026-08-25',
    eta: '2026-09-30',
    status: 'in_transit',
    progress: 40,
    tracking: { company: 'CMA CGM', number: 'TRK-1004-003', status: 'At Port' }
  },
  {
    id: 5,
    orderNumber: 'PO-2026-1005',
    supplier: { id: 5, name: 'Frankfurt Machinery', country: 'Germany', flag: '🇩🇪' },
    items: 1,
    total: 45000.00,
    orderDate: '2026-08-01',
    eta: '2026-09-15',
    status: 'delayed',
    progress: 30,
    tracking: { company: 'Evergreen', number: 'TRK-1005-004', status: 'Customs Delay' }
  },
  {
    id: 6,
    orderNumber: 'PO-2026-1006',
    supplier: { id: 1, name: 'Tianjin Steel', country: 'China', flag: '🇨🇳' },
    items: 4,
    total: 18900.00,
    orderDate: '2026-07-25',
    eta: '2026-08-25',
    status: 'delivered',
    progress: 100
  },
  {
    id: 7,
    orderNumber: 'PO-2026-1007',
    supplier: { id: 3, name: 'Dubai Chemicals', country: 'UAE', flag: '🇦🇪' },
    items: 3,
    total: 5600.00,
    orderDate: '2026-08-28',
    eta: '2026-09-25',
    status: 'pending',
    progress: 0
  },
  {
    id: 8,
    orderNumber: 'PO-2026-1008',
    supplier: { id: 2, name: 'Mumbai Textiles', country: 'India', flag: '🇮🇳' },
    items: 6,
    total: 12100.00,
    orderDate: '2026-08-10',
    eta: '2026-09-05',
    status: 'delayed',
    progress: 45,
    tracking: { company: 'MSC', number: 'TRK-1008-005', status: 'Production Delay' }
  }
]

// ================================================================
// STATE
// ================================================================

const orders = ref<Order[]>(demoOrders)
const search = ref('')
const filterStatus = ref('all')
const selectedOrder = ref<Order | null>(null)
const showAddModal = ref(false)

const newOrder = ref({
  supplierId: 1,
  items: 1,
  total: 0,
  etaDays: 30
})

// ================================================================
// COMPUTED
// ================================================================

const pendingCount = computed(() => orders.value.filter(o => o.status === 'pending').length)
const transitCount = computed(() => orders.value.filter(o => o.status === 'in_transit').length)
const deliveredCount = computed(() => orders.value.filter(o => o.status === 'delivered').length)

const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    const matchSearch = !search.value || 
      order.orderNumber.toLowerCase().includes(search.value.toLowerCase()) ||
      order.supplier.name.toLowerCase().includes(search.value.toLowerCase())
    
    const matchStatus = filterStatus.value === 'all' || order.status === filterStatus.value
    
    return matchSearch && matchStatus
  })
})

// ================================================================
// METHODS
// ================================================================

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    delayed: 'Delayed'
  }
  return labels[status] || status
}

const getEtaClass = (order: Order): string => {
  const today = new Date()
  const eta = new Date(order.eta)
  const days = Math.ceil((eta.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (order.status === 'delivered') return 'delivered'
  if (days < 0) return 'overdue'
  if (days < 7) return 'urgent'
  return 'on-track'
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const viewOrder = (order: Order) => {
  selectedOrder.value = order
}

const closeModal = () => {
  selectedOrder.value = null
}

const addOrder = () => {
  const supplier = suppliers.find(s => s.id === newOrder.value.supplierId)
  if (!supplier) return

  const now = new Date()
  const eta = new Date()
  eta.setDate(eta.getDate() + newOrder.value.etaDays)

  const newId = orders.value.length + 1

  orders.value.push({
    id: newId,
    orderNumber: `PO-2026-${String(1000 + newId).padStart(4, '0')}`,
    supplier: { ...supplier },
    items: newOrder.value.items,
    total: newOrder.value.total,
    orderDate: now.toISOString().split('T')[0],
    eta: eta.toISOString().split('T')[0],
    status: 'pending',
    progress: 0
  })

  showAddModal.value = false
  newOrder.value = { supplierId: 1, items: 1, total: 0, etaDays: 30 }
}
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.foreign-purchase-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-add:hover {
  background: #2563eb;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box {
  background: white;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-number {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

/* Filters */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-select {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  min-width: 140px;
}

/* Table */
.table-wrap {
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.orders-table th {
  background: #f8fafc;
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

.orders-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.orders-table tr:hover {
  background: #f8fafc;
}

.orders-table .empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.order-code {
  font-weight: 600;
  font-family: monospace;
  color: #0f172a;
}

.supplier {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flag {
  font-size: 18px;
}

.amount {
  font-weight: 600;
  color: #0f172a;
}

/* Status */
.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.status.pending { background: #fef3c7; color: #92400e; }
.status.in_transit { background: #dbeafe; color: #1e40af; }
.status.delivered { background: #d1fae5; color: #065f46; }
.status.delayed { background: #fee2e2; color: #991b1b; }

/* ETA */
.eta {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
}

.eta.on-track { background: #d1fae5; color: #065f46; }
.eta.urgent { background: #fef3c7; color: #92400e; }
.eta.overdue { background: #fee2e2; color: #991b1b; }
.eta.delivered { background: #e2e8f0; color: #475569; }

.btn-view {
  background: #f1f5f9;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-view:hover {
  background: #e2e8f0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
}

.modal.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
}

.close-btn:hover {
  color: #0f172a;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  font-weight: 500;
  color: #64748b;
  width: 100px;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  background: #3b82f6;
  transition: width 0.4s ease;
}

.tracking {
  margin-top: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.tracking h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
}

.tracking-number {
  font-family: monospace;
  color: #2563eb;
  font-weight: 500;
}

/* Form */
.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-close {
  background: #f1f5f9;
  color: #1e293b;
  border: none;
  padding: 6px 20px;
  border-radius: 6px;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .orders-table {
    font-size: 12px;
  }
  
  .orders-table th,
  .orders-table td {
    padding: 6px 8px;
  }
  
  .modal {
    max-width: 95%;
  }
}
</style>