<!-- views/storemanagement/localPurchase/components/GetApprovedPurchaseRequests.vue -->

<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <button class="btn-back" @click="goBack">← Back</button>
        <h2>📥 Approved Purchase Requests</h2>
        <span class="total-badge">{{ pendingDispatchCount }} Pending</span>
      </div>
      <div class="header-actions">
        <div class="header-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search..."
              @input="onSearchChange"
            />
          </div>
        </div>
        <div class="header-right">
          <button class="btn-dispatch-selected" @click="openDispatchModal" :disabled="selectedForDispatch.length === 0">
            📤 Dispatch Selected ({{ selectedForDispatch.length }})
          </button>
          <button class="btn-export" @click="exportData">📊 Export</button>
          <button class="btn-refresh" @click="refreshData">🔄</button>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterDepartment" class="filter-select" @change="onFilterChange">
        <option value="all">All Departments</option>
        <option v-for="dept in departments" :key="dept.id" :value="dept.id">
          {{ dept.name }}
        </option>
      </select>
      
      <select v-model="filterDateRange" class="filter-select" @change="onFilterChange">
        <option value="all">All Dates</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
      
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-number">{{ pendingDispatchCount }}</span>
        <span class="stat-label">Pending Dispatch</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ selectedForDispatch.length }}</span>
        <span class="stat-label">Selected</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ totalItemsCount }}</span>
        <span class="stat-label">Total Items</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ departmentsCount }}</span>
        <span class="stat-label">Departments</span>
      </div>
    </div>

    <!-- ==================== REQUESTS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading requests...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="requests-table">
        <thead>
          <tr>
            <th style="width: 40px;">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            </th>
            <th class="col-code">Request #</th>
            <th class="col-item">Items</th>
            <th class="col-requester">Requested By</th>
            <th class="col-dept">Department</th>
            <th class="col-qty">Total Qty</th>
            <th class="col-date">Request Date</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRequests.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📭</span>
                <p>No pending requests to dispatch</p>
                <p class="empty-hint">All approved requests have been dispatched</p>
              </div>
            </td>
          </tr>
          <tr v-for="req in paginatedRequests" :key="req.id">
            <td>
              <input type="checkbox" v-model="req.selected" />
            </td>
            <td class="code-cell">{{ req.requestNumber }}</td>
            <td>
              <div class="items-cell">
                <span class="item-count">{{ req.items.length }} item(s)</span>
                <span class="item-names">{{ getItemNames(req.items) }}</span>
              </div>
            </td>
            <td>{{ req.requestedBy }}</td>
            <td>{{ req.department }}</td>
            <td>{{ req.totalQuantity }} {{ req.uom }}</td>
            <td>{{ formatDate(req.requestDate) }}</td>
            <td>
              <span class="status-badge approved">Approved</span>
            </td>
            <td>
              <div class="action-cell">
                <button class="btn-view-items" @click="openDetailModal(req)" title="View Items">
                  👁️
                </button>
                <button 
                  v-if="req.signatureUrlFront || req.signatureUrlBack" 
                  class="btn-view-signature" 
                  @click="openSignatureModal(req)"
                  title="View Signed Documents"
                >
                  📄
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="totalItems > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- ==================== DISPATCH MODAL ==================== -->
    <div v-if="showDispatchModal" class="modal-overlay" @click.self="showDispatchModal = false">
      <div class="modal-container dispatch-modal">
        <div class="modal-header">
          <h3>📤 Dispatch Requests</h3>
          <button class="modal-close" @click="showDispatchModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="dispatch-info">
            <div class="dispatch-icon">📤</div>
            <p class="dispatch-title">Assign Purchaser(s) to Selected Requests</p>
            
            <!-- Selected Requests List -->
            <div class="selected-requests-list">
              <h4>Selected Requests ({{ selectedForDispatch.length }})</h4>
              <div class="request-items">
                <div v-for="req in selectedForDispatch" :key="req.id" class="request-item">
                  <span class="req-code">{{ req.requestNumber }}</span>
                  <span class="req-item">{{ req.items.length }} item(s)</span>
                  <span class="req-qty">{{ req.totalQuantity }} {{ req.uom }}</span>
                  <button class="btn-view-items-small" @click="openDetailModal(req)" title="View Items">
                    👁️
                  </button>
                </div>
              </div>
            </div>

            <!-- Search Purchaser -->
            <div class="form-group">
              <label>Search Purchaser</label>
              <div class="search-purchaser-wrapper">
                <span class="search-icon-small">🔍</span>
                <input
                  type="text"
                  v-model="purchaserSearch"
                  placeholder="Search by name or department..."
                  class="form-input search-purchaser-input"
                />
              </div>
              <span class="hint">Type to filter purchasers by name or department</span>
            </div>

            <!-- Multi-Select Purchaser Table -->
            <div class="form-group">
              <label>Select Purchaser(s) *</label>
              <div class="purchaser-table-wrapper">
                <table class="purchaser-table">
                  <thead>
                    <tr>
                      <th style="width: 40px;">
                        <input type="checkbox" v-model="selectAllPurchasers" @change="toggleSelectAllPurchasers" />
                      </th>
                      <th>Name</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredPurchasers.length === 0">
                      <td colspan="3" class="no-results">No purchasers found</td>
                    </tr>
                    <tr v-for="purchaser in filteredPurchasers" :key="purchaser.id" :class="{ 'selected-row': purchaser.selected }">
                      <td>
                        <input type="checkbox" v-model="purchaser.selected" />
                      </td>
                      <td>{{ purchaser.name }}</td>
                      <td>{{ purchaser.department }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <span class="hint">Select one or more purchasers to assign to all selected requests</span>
            </div>

            <!-- Selected Purchasers Summary -->
            <div class="selected-purchasers-summary" v-if="selectedPurchasersList.length > 0">
              <span class="summary-label">Selected Purchasers:</span>
              <div class="selected-purchaser-tags">
                <span v-for="purchaser in selectedPurchasersList" :key="purchaser" class="purchaser-tag">
                  {{ purchaser }}
                </span>
              </div>
            </div>

            <!-- Dispatch Summary -->
            <div class="dispatch-summary">
              <div class="summary-row">
                <span class="summary-label">Requests to Dispatch:</span>
                <span class="summary-value">{{ selectedForDispatch.length }}</span>
              </div>
              <div class="summary-row" v-if="selectedPurchasersList.length > 0">
                <span class="summary-label">Assigned to:</span>
                <span class="summary-value">{{ selectedPurchasersList.length }} purchaser(s)</span>
              </div>
            </div>

            <div class="form-group">
              <label>Remark (Optional)</label>
              <textarea v-model="dispatchRemark" class="form-textarea" rows="2" placeholder="Additional notes for the purchasers..." />
            </div>

            <p class="dispatch-confirm-text" v-if="selectedPurchasersList.length > 0">
              ✅ This will dispatch {{ selectedForDispatch.length }} request(s) to <strong>{{ selectedPurchasersList.length }}</strong> purchaser(s).
            </p>
            <p class="dispatch-warning-text" v-else>
              ⚠️ Please select at least one purchaser before dispatching.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDispatchModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmDispatch" :disabled="dispatching || selectedPurchasersList.length === 0">
            {{ dispatching ? 'Dispatching...' : '📤 Confirm Dispatch' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== ITEM DETAIL MODAL ==================== -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-container detail-modal-wide">
        <div class="modal-header">
          <h3>📦 Items - {{ detailRequest?.requestNumber }}</h3>
          <button class="modal-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body no-scroll">
          <!-- Request Summary -->
          <div class="detail-summary">
            <div class="detail-summary-item">
              <span class="label">Requested By:</span>
              <span class="value">{{ detailRequest?.requestedBy }}</span>
            </div>
            <div class="detail-summary-item">
              <span class="label">Department:</span>
              <span class="value">{{ detailRequest?.department }}</span>
            </div>
            <div class="detail-summary-item">
              <span class="label">Request Date:</span>
              <span class="value">{{ formatDate(detailRequest?.requestDate) }}</span>
            </div>
            <div class="detail-summary-item">
              <span class="label">Total Items:</span>
              <span class="value">{{ detailRequest?.items.length }}</span>
            </div>
            <div class="detail-summary-item" v-if="detailRequest?.description">
              <span class="label">Description:</span>
              <span class="value">{{ detailRequest?.description }}</span>
            </div>
          </div>

          <!-- Items Table - NO PRICES -->
          <div class="detail-items-table-wrapper">
            <h4>📋 Items List</h4>
            <div class="table-responsive">
              <table class="detail-items-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 120px;">Item Code</th>
                    <th style="min-width: 200px;">Item Name</th>
                    <th style="width: 100px;">Quantity</th>
                    <th style="width: 80px;">UOM</th>
                    <th style="min-width: 180px;">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in detailRequest?.items" :key="item.id">
                    <td>{{ index + 1 }}</td>
                    <td class="item-code">{{ item.code }}</td>
                    <td>{{ item.name }}</td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-center">{{ item.uom }}</td>
                    <td>
                      <span v-if="item.remark" class="remark-text">{{ item.remark }}</span>
                      <span v-else class="no-remark">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDetailModal = false">Close</button>
          <button class="btn-primary" @click="showDetailModal = false">✅ Done</button>
        </div>
      </div>
    </div>

    <!-- ==================== SIGNATURE VIEW MODAL - WITH FRONT & BACK ==================== -->
    <div v-if="showSignatureModal" class="modal-overlay" @click.self="showSignatureModal = false">
      <div class="modal-container signature-modal-wide">
        <div class="modal-header">
          <h3>📄 Signed Documents - {{ signatureRequest?.requestNumber }}</h3>
          <button class="modal-close" @click="closeSignatureModal">✕</button>
        </div>
        <div class="modal-body signature-body">
          <div class="signature-full-display">
            <!-- Front Image -->
            <div class="signature-section" v-if="signatureRequest?.signatureUrlFront">
              <div class="signature-section-header">
                <span class="section-label">📄 Front</span>
                <div class="section-actions">
                  <button class="btn-download-small" @click="downloadSignature(signatureRequest, 'front')">
                    📥 Download
                  </button>
                  <button class="btn-fullscreen-small" @click="openFullscreen(signatureRequest?.signatureUrlFront)">
                    ⛶ Fullscreen
                  </button>
                </div>
              </div>
              <div class="signature-image-container" @click="openFullscreen(signatureRequest?.signatureUrlFront)">
                <img 
                  :src="signatureRequest?.signatureUrlFront" 
                  alt="Signed Document Front" 
                  class="signature-full-image-large"
                  @load="onImageLoad"
                />
              </div>
            </div>

            <!-- Back Image -->
            <div class="signature-section" v-if="signatureRequest?.signatureUrlBack">
              <div class="signature-section-header">
                <span class="section-label">📄 Back</span>
                <div class="section-actions">
                  <button class="btn-download-small" @click="downloadSignature(signatureRequest, 'back')">
                    📥 Download
                  </button>
                  <button class="btn-fullscreen-small" @click="openFullscreen(signatureRequest?.signatureUrlBack)">
                    ⛶ Fullscreen
                  </button>
                </div>
              </div>
              <div class="signature-image-container" @click="openFullscreen(signatureRequest?.signatureUrlBack)">
                <img 
                  :src="signatureRequest?.signatureUrlBack" 
                  alt="Signed Document Back" 
                  class="signature-full-image-large"
                  @load="onImageLoad"
                />
              </div>
            </div>

            <!-- No Images Message -->
            <div v-if="!signatureRequest?.signatureUrlFront && !signatureRequest?.signatureUrlBack" class="no-signature-message">
              <span class="no-signature-icon">📭</span>
              <p>No signed documents available for this request</p>
            </div>

            <!-- Bottom Actions -->
            <div class="signature-actions-bottom">
              <button class="btn-download-all" @click="downloadAllSignatures(signatureRequest)" v-if="signatureRequest?.signatureUrlFront || signatureRequest?.signatureUrlBack">
                📥 Download All
              </button>
              <button class="btn-close-signature-large" @click="closeSignatureModal">
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== FULLSCREEN IMAGE MODAL ==================== -->
    <div v-if="showFullscreenModal" class="fullscreen-overlay" @click="closeFullscreen">
      <div class="fullscreen-content">
        <button class="fullscreen-close" @click="closeFullscreen">✕</button>
        <button class="fullscreen-download" @click="downloadFullscreenImage">📥</button>
        <img :src="fullscreenImage" alt="Fullscreen Document" class="fullscreen-image" />
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// ================================================================
// TYPES
// ================================================================

interface RequestItem {
  id: number
  name: string
  code: string
  quantity: number
  uom: string
  remark?: string
}

interface Purchaser {
  id: number
  name: string
  department: string
  selected?: boolean
}

interface PurchaseRequest {
  id: number
  requestNumber: string
  items: RequestItem[]
  totalQuantity: number
  uom: string
  requestedBy: string
  department: string
  departmentId: number
  requestDate: string
  status: 'pending_bids' | 'bidding' | 'purchased' | 'arrived'
  description?: string
  selected?: boolean
  signatureUrlFront?: string
  signatureUrlBack?: string
}

// ================================================================
// DEMO DATA
// ================================================================

const router = useRouter()

const departments = [
  { id: 1, name: 'Production' },
  { id: 2, name: 'Maintenance' },
  { id: 3, name: 'Quality Control' },
  { id: 4, name: 'Warehouse' },
  { id: 5, name: 'Administration' },
  { id: 6, name: 'Sales' },
  { id: 7, name: 'IT' }
]

const purchasersData: Purchaser[] = [
  { id: 1, name: 'Abebe Kebede', department: 'Purchasing', selected: false },
  { id: 2, name: 'Selam Tesfaye', department: 'Purchasing', selected: false },
  { id: 3, name: 'Mekonnen Alemu', department: 'Procurement', selected: false },
  { id: 4, name: 'Tigist Hailu', department: 'Purchasing', selected: false },
  { id: 5, name: 'Dawit Solomon', department: 'Procurement', selected: false },
  { id: 6, name: 'Meron Ayele', department: 'Supply Chain', selected: false },
  { id: 7, name: 'Fikru Tsegaye', department: 'Purchasing', selected: false }
]

const requesters = [
  { name: 'Abebe Kebede', dept: 1 },
  { name: 'Selam Tesfaye', dept: 2 },
  { name: 'Mekonnen Alemu', dept: 3 },
  { name: 'Tigist Hailu', dept: 4 },
  { name: 'Dawit Solomon', dept: 5 },
  { name: 'Meron Ayele', dept: 6 },
  { name: 'Fikru Tsegaye', dept: 7 }
]

const itemNames = [
  { name: 'Steel Pipe 2 inch', code: 'SP-002', uom: 'PCS' },
  { name: 'Industrial Paint', code: 'IP-100', uom: 'LTR' },
  { name: 'Conveyor Belt 10m', code: 'CB-010', uom: 'ROLL' },
  { name: 'Hydraulic Pump', code: 'HP-500', uom: 'SET' },
  { name: 'PVC Pipe 50mm', code: 'PVC-050', uom: 'PCS' },
  { name: 'Electrical Cable 100m', code: 'EC-100', uom: 'ROLL' },
  { name: 'Motor 5HP', code: 'M-5HP', uom: 'SET' },
  { name: 'Aluminum Sheet', code: 'AS-002', uom: 'KG' },
  { name: 'Bolts and Nuts Set', code: 'BN-001', uom: 'BOX' },
  { name: 'Lubricant Oil', code: 'LO-200', uom: 'LTR' }
]

const remarks = [
  'Urgent - needed for production',
  'Regular order',
  'Rush delivery requested',
  'For maintenance department',
  'Quality inspection required',
  'Express shipping needed',
  'Standard order',
  'For warehouse restock'
]

// Generate placeholder signature images (Front and Back)
const generateSignatureUrl = (requestId: number, side: 'front' | 'back'): string => {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 500
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 800, 500)
    
    // Border
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 780, 480)
    
    // Side label
    ctx.fillStyle = side === 'front' ? '#2563eb' : '#7c3aed'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(side === 'front' ? 'FRONT' : 'BACK', 730, 35)
    
    // Header
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('PURCHASE REQUEST APPROVAL', 200, 60)
    
    // Line
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 85)
    ctx.lineTo(750, 85)
    ctx.stroke()
    
    // Request number
    ctx.fillStyle = '#475569'
    ctx.font = '18px Arial'
    ctx.fillText(`Request #: PR-2026-${String(1000 + requestId).padStart(4, '0')}`, 50, 130)
    
    // Company info
    ctx.fillStyle = '#64748b'
    ctx.font = '14px Arial'
    ctx.fillText('SDT Trading PLC', 50, 165)
    ctx.fillText('Addis Ababa, Ethiopia', 50, 185)
    
    if (side === 'front') {
      // Front side - Signature area
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.strokeRect(50, 220, 700, 150)
      ctx.setLineDash([])
      
      // Signature
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(120, 290)
      ctx.bezierCurveTo(200, 240, 260, 340, 340, 280)
      ctx.bezierCurveTo(400, 240, 460, 330, 540, 270)
      ctx.bezierCurveTo(580, 240, 640, 310, 700, 265)
      ctx.stroke()
      
      // Signature label
      ctx.fillStyle = '#64748b'
      ctx.font = '16px Arial'
      ctx.fillText('Approved By: ___________________', 50, 410)
      ctx.fillText('Date: _________________________', 50, 445)
      
      // Stamp
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)'
      ctx.font = 'bold 40px Arial'
      ctx.fillText('APPROVED', 550, 190)
    } else {
      // Back side - Additional info / stamps
      ctx.fillStyle = '#64748b'
      ctx.font = '16px Arial'
      ctx.fillText('Additional Information:', 50, 240)
      
      // Stamps on back
      ctx.fillStyle = 'rgba(16, 185, 129, 0.10)'
      ctx.font = 'bold 30px Arial'
      ctx.fillText('RECEIVED', 300, 300)
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'
      ctx.font = 'bold 30px Arial'
      ctx.fillText('PROCESSED', 300, 370)
      
      // Back side info
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Arial'
      ctx.fillText('Document verified and approved', 50, 430)
      ctx.fillText(`Verification Date: ${new Date().toLocaleDateString()}`, 50, 460)
    }
    
    // Footer
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px Arial'
    ctx.fillText(`Generated: ${new Date().toLocaleDateString()} - ${side.toUpperCase()}`, 620, 480)
  }
  return canvas.toDataURL('image/png')
}

const generateDemoRequests = (): PurchaseRequest[] => {
  const requests: PurchaseRequest[] = []
  
  for (let i = 1; i <= 20; i++) {
    const requester = requesters[i % requesters.length]
    const dept = departments.find(d => d.id === requester.dept) || departments[0]
    const requestDate = new Date()
    requestDate.setDate(requestDate.getDate() - (i * 2) - (i % 5))
    
    const itemCount = 1 + (i % 4)
    const items: RequestItem[] = []
    let totalQty = 0
    
    for (let j = 0; j < itemCount; j++) {
      const item = itemNames[(i + j) % itemNames.length]
      const qty = 5 + (i * 2 % 20) + (j * 3)
      totalQty += qty
      items.push({
        id: i * 100 + j,
        name: item.name,
        code: item.code,
        quantity: qty,
        uom: item.uom,
        remark: i % 2 === 0 && j === 0 ? remarks[(i + j) % remarks.length] : undefined
      })
    }
    
    const mainUom = items.length > 0 ? items[0].uom : 'PCS'
    
    const request: PurchaseRequest = {
      id: i,
      requestNumber: `PR-2026-${String(1000 + i).padStart(4, '0')}`,
      items: items,
      totalQuantity: totalQty,
      uom: mainUom,
      requestedBy: requester.name,
      department: dept.name,
      departmentId: dept.id,
      requestDate: requestDate.toISOString().split('T')[0],
      status: 'pending_bids',
      description: i % 3 === 0 ? `Rush order - ${items.length} items` : '',
      selected: false,
      signatureUrlFront: i % 5 !== 0 ? generateSignatureUrl(i, 'front') : undefined,
      signatureUrlBack: i % 5 !== 0 ? generateSignatureUrl(i, 'back') : undefined
    }
    
    requests.push(request)
  }
  
  return requests
}

// ================================================================
// STATE
// ================================================================

const allRequests = ref<PurchaseRequest[]>(generateDemoRequests())
const purchasers = ref<Purchaser[]>(purchasersData.map(p => ({ ...p, selected: false })))
const loading = ref(false)
const searchQuery = ref('')
const purchaserSearch = ref('')
const filterDepartment = ref('all')
const filterDateRange = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const selectAll = ref(false)
const selectAllPurchasers = ref(false)
const showDispatchModal = ref(false)
const showDetailModal = ref(false)
const showSignatureModal = ref(false)
const showFullscreenModal = ref(false)
const fullscreenImage = ref('')
const fullscreenImageName = ref('')
const detailRequest = ref<PurchaseRequest | null>(null)
const signatureRequest = ref<PurchaseRequest | null>(null)
const dispatching = ref(false)
const dispatchRemark = ref('')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('success')

// ================================================================
// COMPUTED
// ================================================================

const pendingRequests = computed(() => {
  return allRequests.value
})

const pendingDispatchCount = computed(() => {
  return pendingRequests.value.length
})

const selectedForDispatch = computed(() => {
  return pendingRequests.value.filter(r => r.selected)
})

const totalItemsCount = computed(() => {
  return selectedForDispatch.value.reduce((sum, r) => sum + r.items.length, 0)
})

const departmentsCount = computed(() => {
  const depts = new Set(selectedForDispatch.value.map(r => r.department))
  return depts.size
})

const selectedPurchasersList = computed(() => {
  return purchasers.value.filter(p => p.selected).map(p => p.name)
})

const filteredPurchasers = computed(() => {
  if (!purchaserSearch.value) {
    return purchasers.value
  }
  const search = purchaserSearch.value.toLowerCase()
  return purchasers.value.filter(p => 
    p.name.toLowerCase().includes(search) || 
    p.department.toLowerCase().includes(search)
  )
})

const hasActiveFilters = computed(() => {
  return filterDepartment.value !== 'all' || filterDateRange.value !== 'all' || searchQuery.value
})

const filteredRequests = computed(() => {
  return pendingRequests.value.filter(req => {
    const matchSearch = !searchQuery.value ||
      req.requestNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      req.items.some(item => item.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchDepartment = filterDepartment.value === 'all' || req.departmentId === Number(filterDepartment.value)
    
    let matchDate = true
    if (filterDateRange.value === 'today') {
      const today = new Date().toISOString().split('T')[0]
      matchDate = req.requestDate === today
    } else if (filterDateRange.value === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchDate = new Date(req.requestDate) >= weekAgo
    } else if (filterDateRange.value === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchDate = new Date(req.requestDate) >= monthAgo
    }
    
    return matchSearch && matchDepartment && matchDate
  })
})

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  const items = filteredRequests.value.slice(start, end)
  totalItems.value = filteredRequests.value.length
  return items
})

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value) || 1)

// ================================================================
// METHODS
// ================================================================

const goBack = () => {
  router.push('/local-purchase')
}

const getItemNames = (items: RequestItem[]): string => {
  return items.map(item => item.name).join(', ')
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const onSearchChange = (): void => { currentPage.value = 1 }
const onFilterChange = (): void => { currentPage.value = 1 }
const changePage = (page: number): void => { if (page >= 1 && page <= totalPages.value) currentPage.value = page }
const changePageSize = (): void => { currentPage.value = 1 }

const clearFilters = (): void => {
  filterDepartment.value = 'all'
  filterDateRange.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
}

const refreshData = () => {
  allRequests.value = generateDemoRequests()
  purchasers.value = purchasersData.map(p => ({ ...p, selected: false }))
  selectAllPurchasers.value = false
  purchaserSearch.value = ''
  showToastMessage('Data refreshed', 'success')
}

const toggleSelectAll = () => {
  paginatedRequests.value.forEach(r => { r.selected = selectAll.value })
}

const toggleSelectAllPurchasers = () => {
  purchasers.value.forEach(p => { p.selected = selectAllPurchasers.value })
}

const openDetailModal = (request: PurchaseRequest) => {
  detailRequest.value = request
  showDetailModal.value = true
}

// ================================================================
// SIGNATURE METHODS
// ================================================================

const openSignatureModal = (request: PurchaseRequest) => {
  signatureRequest.value = request
  showSignatureModal.value = true
}

const closeSignatureModal = () => {
  showSignatureModal.value = false
  signatureRequest.value = null
}

const downloadSignature = (request: PurchaseRequest | null, side: 'front' | 'back') => {
  if (!request) return
  
  const imageUrl = side === 'front' ? request.signatureUrlFront : request.signatureUrlBack
  if (!imageUrl) {
    showToastMessage(`No ${side} image available to download`, 'warning')
    return
  }
  
  try {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `signed_document_${request.requestNumber}_${side}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToastMessage(`📥 Downloaded ${side}: ${request.requestNumber}`, 'success')
  } catch (error) {
    showToastMessage('❌ Failed to download document', 'error')
  }
}

const downloadAllSignatures = (request: PurchaseRequest | null) => {
  if (!request) return
  
  let downloaded = 0
  if (request.signatureUrlFront) {
    downloadSignature(request, 'front')
    downloaded++
  }
  if (request.signatureUrlBack) {
    setTimeout(() => downloadSignature(request, 'back'), 300)
    downloaded++
  }
  if (downloaded === 0) {
    showToastMessage('No documents to download', 'warning')
  }
}

// ================================================================
// FULLSCREEN METHODS
// ================================================================

const openFullscreen = (imageUrl: string | undefined) => {
  if (!imageUrl) return
  fullscreenImage.value = imageUrl
  fullscreenImageName.value = 'Document'
  showFullscreenModal.value = true
}

const closeFullscreen = () => {
  showFullscreenModal.value = false
  fullscreenImage.value = ''
}

const downloadFullscreenImage = () => {
  if (!fullscreenImage.value) return
  
  try {
    const link = document.createElement('a')
    link.href = fullscreenImage.value
    link.download = `document_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToastMessage('📥 Document downloaded', 'success')
  } catch (error) {
    showToastMessage('❌ Failed to download', 'error')
  }
}

const onImageLoad = () => {
  // Image loaded successfully
}

// ================================================================
// DISPATCH METHODS
// ================================================================

const openDispatchModal = () => {
  if (selectedForDispatch.value.length === 0) {
    showToastMessage('Please select at least one request to dispatch', 'warning')
    return
  }
  
  purchasers.value = purchasersData.map(p => ({ ...p, selected: false }))
  selectAllPurchasers.value = false
  purchaserSearch.value = ''
  dispatchRemark.value = ''
  showDispatchModal.value = true
}

const confirmDispatch = async () => {
  if (selectedForDispatch.value.length === 0) {
    showToastMessage('No requests selected', 'warning')
    return
  }
  
  const selectedPurchasers = purchasers.value.filter(p => p.selected)
  if (selectedPurchasers.length === 0) {
    showToastMessage('Please select at least one purchaser', 'warning')
    return
  }
  
  dispatching.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const dispatchedIds = selectedForDispatch.value.map(r => r.id)
    allRequests.value = allRequests.value.filter(r => !dispatchedIds.includes(r.id))
    
    showDispatchModal.value = false
    selectAll.value = false
    selectAllPurchasers.value = false
    purchaserSearch.value = ''
    
    showToastMessage(`✅ ${dispatchedIds.length} request(s) dispatched to ${selectedPurchasers.length} purchaser(s)!`, 'success')
    
  } catch (error) {
    showToastMessage('❌ Failed to dispatch requests', 'error')
  } finally {
    dispatching.value = false
  }
}

// ================================================================
// EXPORT
// ================================================================

const exportData = () => {
  const headers = ['Request #', 'Items', 'Total Quantity', 'Requested By', 'Department', 'Request Date', 'Has Front Image', 'Has Back Image']
  const rows = filteredRequests.value.map(req => [
    req.requestNumber,
    req.items.map(item => `${item.name} (${item.quantity} ${item.uom})`).join('; '),
    req.totalQuantity,
    req.requestedBy,
    req.department,
    formatDate(req.requestDate),
    req.signatureUrlFront ? 'Yes' : 'No',
    req.signatureUrlBack ? 'Yes' : 'No'
  ])
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pending_requests_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const showToastMessage = (
  msg: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
): void => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// WATCHERS
// ================================================================

watch([filterDepartment, filterDateRange, searchQuery], () => {
  currentPage.value = 1
})

watch(pageSize, () => { currentPage.value = 1 })

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {})
</script>

<style scoped>
/* ================================================================
   SECTION CARD & HEADER
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
  white-space: nowrap;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.btn-back {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-back:hover {
  background: #e2e8f0;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  position: relative;
  width: 200px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.btn-dispatch-selected {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-dispatch-selected:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-dispatch-selected:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-export:hover {
  background: #059669;
}

.btn-refresh {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #e2e8f0;
}

/* ================================================================
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
}

.btn-clear-filters:hover {
  background: #e2e8f0;
}

/* ================================================================
   STATS
   ================================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-box {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-wrapper {
  overflow-x: auto;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 850px;
}

.requests-table th,
.requests-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.requests-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.requests-table tr:hover {
  background: #f8fafc;
}

.requests-table .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 13px;
  color: #b0b8c4;
}

.col-code { min-width: 120px; }
.col-item { min-width: 200px; }
.col-requester { min-width: 120px; }
.col-dept { min-width: 120px; }
.col-qty { min-width: 80px; }
.col-date { min-width: 100px; }
.col-status { min-width: 100px; }
.col-actions { min-width: 80px; }

.text-center { text-align: center; }

.code-cell {
  font-weight: 600;
  color: #0f172a;
  font-family: "Courier New", monospace;
  font-size: 12px;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.items-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-count {
  font-weight: 500;
  color: #1e293b;
  font-size: 12px;
}

.item-names {
  font-size: 11px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* ================================================================
   ACTION CELL
   ================================================================ */
.action-cell {
  display: flex;
  gap: 4px;
  align-items: center;
}

.btn-view-items {
  background: transparent;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #64748b;
}

.btn-view-items:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-view-signature {
  background: transparent;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #2563eb;
}

.btn-view-signature:hover {
  background: #dbeafe;
  color: #1e40af;
}

.btn-view-items-small {
  background: transparent;
  border: none;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  color: #64748b;
}

.btn-view-items-small:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.status-badge.approved {
  background: #dbeafe;
  color: #1e40af;
}

/* ================================================================
   SEARCH PURCHASER
   ================================================================ */
.search-purchaser-wrapper {
  position: relative;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94a3b8;
}

.search-purchaser-input {
  padding-left: 34px !important;
}

/* ================================================================
   PURCHASER TABLE
   ================================================================ */
.purchaser-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}

.purchaser-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.purchaser-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.purchaser-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.purchaser-table tr:hover {
  background: #f8fafc;
}

.purchaser-table tr.selected-row {
  background: #ede9fe;
}

.purchaser-table tr.selected-row:hover {
  background: #ddd6fe;
}

.purchaser-table .no-results {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-style: italic;
}

/* ================================================================
   SELECTED PURCHASERS SUMMARY
   ================================================================ */
.selected-purchasers-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin: 8px 0 12px 0;
  flex-wrap: wrap;
}

.selected-purchasers-summary .summary-label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.selected-purchaser-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.purchaser-tag {
  background: #ede9fe;
  color: #5b21b6;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* ================================================================
   DISPATCH MODAL
   ================================================================ */
.dispatch-modal .modal-container {
  max-width: 650px;
}

.dispatch-info {
  padding: 8px 0;
}

.dispatch-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.dispatch-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 16px;
}

.selected-requests-list {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.selected-requests-list h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.request-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.request-item {
  background: white;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.req-code {
  font-weight: 600;
  color: #0f172a;
  font-family: monospace;
}

.req-item {
  color: #475569;
}

.req-qty {
  color: #64748b;
  font-size: 11px;
}

.dispatch-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 12px 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 13px;
}

.summary-label {
  color: #64748b;
}

.summary-value {
  font-weight: 500;
  color: #0f172a;
}

.dispatch-confirm-text {
  background: #d1fae5;
  color: #065f46;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

.dispatch-warning-text {
  background: #fef3c7;
  color: #92400e;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

/* ================================================================
   ITEM DETAIL MODAL
   ================================================================ */
.detail-modal-wide .modal-container {
  max-width: 950px;
  width: 95%;
  max-height: 95vh;
  overflow: visible;
}

.detail-modal-wide .modal-body.no-scroll {
  padding: 20px 24px;
  max-height: none !important;
  overflow: visible !important;
  height: auto;
}

.detail-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
}

.detail-summary-item {
  display: flex;
  flex-direction: column;
}

.detail-summary-item .label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.detail-summary-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.table-responsive {
  overflow-x: auto;
  overflow-y: visible;
}

.detail-items-table-wrapper h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.detail-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 600px;
}

.detail-items-table th {
  background: #e2e8f0;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #cbd5e1;
  white-space: nowrap;
}

.detail-items-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.detail-items-table tr:hover {
  background: #f8fafc;
}

.detail-items-table .item-code {
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  font-size: 11px;
}

.detail-items-table .text-center {
  text-align: center;
}

.detail-items-table .text-right {
  text-align: right;
}

.remark-text {
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}

.no-remark {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================
   SIGNATURE MODAL
   ================================================================ */
.signature-modal-wide .modal-container {
  max-width: 950px;
  width: 95%;
}

.signature-body {
  padding: 20px 24px;
  max-height: calc(90vh - 130px);
  overflow-y: auto;
}

.signature-full-display {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.signature-section {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  background: #fafbfc;
}

.signature-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.btn-download-small {
  background: #2563eb;
  color: white;
  border: none;
  padding: 4px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-download-small:hover {
  background: #1d4ed8;
}

.btn-fullscreen-small {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 4px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-fullscreen-small:hover {
  background: #e2e8f0;
}

.signature-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
}

.signature-image-container:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
}

.signature-full-image-large {
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  border-radius: 4px;
  object-fit: contain;
}

.no-signature-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed #e2e8f0;
}

.no-signature-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-signature-message p {
  color: #94a3b8;
  font-size: 16px;
}

.signature-actions-bottom {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.btn-download-all {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-download-all:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-close-signature-large {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-close-signature-large:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* ================================================================
   FULLSCREEN OVERLAY
   ================================================================ */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.fullscreen-content {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
}

.fullscreen-image {
  max-width: 95vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.fullscreen-close {
  position: absolute;
  top: -50px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.fullscreen-close:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.fullscreen-download {
  position: absolute;
  top: -50px;
  right: 60px;
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.fullscreen-download:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

/* ================================================================
   MODALS
   ================================================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
  flex-shrink: 0;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #475569;
}

.limit-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  max-width: 400px;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-10px); }
}

.toast.success { background: #22c55e; }
.toast.error { background: #ef4444; }
.toast.info { background: #3b82f6; }
.toast.warning { background: #f59e0b; }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .section-card { padding: 12px; }
  
  .card-header { flex-direction: column; align-items: stretch; }
  .header-title { flex-wrap: wrap; }
  .header-actions { flex-direction: column; width: 100%; }
  .header-left { flex-direction: column; width: 100%; }
  .header-right { flex-direction: column; width: 100%; }
  .search-box { width: 100%; }
  .search-box input { width: 100%; }
  .btn-back, .btn-dispatch-selected, .btn-export, .btn-refresh { width: 100%; justify-content: center; }
  
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-select { width: 100%; }
  
  .requests-table { font-size: 12px; min-width: 700px; }
  .requests-table th, .requests-table td { padding: 6px 8px; }
  
  .modal-container { width: 98%; max-height: 95vh; }
  .modal-body { padding: 16px; }
  
  .pagination { gap: 8px; }
  .page-btn { padding: 4px 12px; font-size: 12px; }
  
  .detail-summary {
    grid-template-columns: 1fr 1fr;
  }
  
  .detail-modal-wide .modal-container {
    max-width: 95%;
  }
  
  .detail-items-table {
    min-width: 500px;
  }
  
  .signature-modal-wide .modal-container {
    max-width: 98%;
  }
  
  .signature-full-image-large {
    max-height: 250px;
  }
  
  .section-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .section-actions button {
    width: 100%;
    justify-content: center;
  }
  
  .signature-actions-bottom {
    flex-direction: column;
  }
  
  .signature-actions-bottom button {
    width: 100%;
    justify-content: center;
  }
  
  .fullscreen-image {
    max-height: 80vh;
  }
  
  .fullscreen-close {
    top: 10px;
    right: 10px;
    font-size: 24px;
  }
  
  .fullscreen-download {
    top: 10px;
    right: 60px;
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .requests-table { min-width: 600px; }
  .requests-table th, .requests-table td { padding: 4px 6px; font-size: 10px; }
  .status-badge { padding: 2px 8px; font-size: 9px; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stat-number { font-size: 18px; }
  .detail-summary {
    grid-template-columns: 1fr;
  }
  
  .signature-full-image-large {
    max-height: 180px;
  }
}
</style>