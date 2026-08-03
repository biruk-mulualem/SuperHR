<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📦 Asset Management</h2>
        <span class="total-badge">{{ totalItems }} Assets</span>
      </div>

      <div class="header-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by name, code, serial..."
            @input="handleSearch"
          />
        </div>
        <button class="btn-add" @click="openAddAsset">➕ Add Asset</button>
      </div>
    </div>

    <!-- ==================== STATS CARDS ==================== -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-icon" :style="{ background: stat.color }">
          <span>{{ stat.icon }}</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterCategory" class="filter-select" @change="handleFilterChange">
        <option value="">All Categories</option>
        <option v-for="cat in activeCategoryNames" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="filterAssignmentType" class="filter-select" @change="handleFilterChange">
        <option value="">All Assignment Types</option>
        <option value="assigned">✅ Assigned</option>
        <option value="unassigned">⭕ Unassigned</option>
      </select>
      <select v-model="filterStatus" class="filter-select" @change="handleFilterChange">
        <option value="">All Status</option>
        <option value="available">✅ Available</option>
        <option value="assigned">📌 Assigned</option>
        <option value="maintenance">🔧 Maintenance</option>
        <option value="retired">📦 Retired</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== ASSETS TABLE ==================== -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading assets...</p>
      </div>

      <div v-else-if="assets.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No assets found</h3>
        <p>Add your first asset to the catalog</p>
        <button @click="openAddAsset" class="btn-primary">Add Asset</button>
      </div>

      <table v-else class="asset-table">
        <thead>
          <tr>
            <th style="width:35px"></th>
            <th>Asset</th>
            <th>Category</th>
            <th>Serial / Model</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Assignment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="asset in paginatedAssets" :key="asset.id">
            <tr
              :class="{
                'expanded-row': expandedRow === asset.id,
                'inactive-row': asset.status === 'retired'
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(asset.id)">
                  {{ expandedRow === asset.id ? "▼" : "▶" }}
                </button>
              </td>
              <td>
                <div class="asset-info">
                  <div class="asset-icon" :style="{ background: getCategoryColor(asset.category) }">
                    {{ getCategoryIcon(asset.category) }}
                  </div>
                  <div>
                    <div class="asset-name">{{ asset.name }}</div>
                    <div class="asset-code">{{ asset.code }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="category-badge">{{ asset.category }}</span>
              </td>
              <td>
                <div class="serial-info">
                  <div class="serial">{{ asset.serial || 'N/A' }}</div>
                  <div class="model">{{ asset.model || '' }}</div>
                </div>
              </td>
              <td>
                <span class="quantity-badge">{{ asset.quantity || 1 }}</span>
              </td>
              <td>
                <span class="status-badge" :class="asset.status">
                  {{ getStatusLabel(asset.status) }}
                </span>
              </td>
              <td>
                <div class="assignment-info">
                  <span v-if="asset.assignments && asset.assignments.length > 0" class="assignment-badge">
                    {{ asset.assignments.length }} assignment{{ asset.assignments.length > 1 ? 's' : '' }}
                  </span>
                  <span v-else class="unassigned-badge">Unassigned</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewAsset(asset)" class="icon-btn" title="View Details">👁</button>
                  <button @click="openAssignModal(asset)" class="icon-btn" title="Assign">📌</button>
                  <button @click="openEditAsset(asset)" class="icon-btn" title="Edit">✏️</button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAILS ==================== -->
            <tr v-if="expandedRow === asset.id" class="detail-expand-row">
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Row 1: Basic Info & Specifications -->
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Basic Information</h4>
                        <div><span>Asset Code</span><span class="value">{{ asset.code }}</span></div>
                        <div><span>Name</span><span class="value">{{ asset.name }}</span></div>
                        <div><span>Category</span><span class="value">{{ asset.category }}</span></div>
                        <div><span>Brand</span><span class="value">{{ asset.brand || '-' }}</span></div>
                        <div><span>Model</span><span class="value">{{ asset.model || '-' }}</span></div>
                        <div><span>Serial Number</span><span class="value serial-number">{{ asset.serial || '-' }}</span></div>
                        <div><span>Location</span><span class="value">{{ asset.location || '-' }}</span></div>
                        <div><span>Quantity</span><span class="value">{{ asset.quantity || 1 }}</span></div>
                        <div><span>Status</span><span class="value">
                          <span class="status-badge" :class="asset.status">{{ getStatusLabel(asset.status) }}</span>
                        </span></div>
                        <div><span>Condition</span><span class="value">
                          <span class="condition-badge" :class="asset.condition">{{ getConditionLabel(asset.condition) }}</span>
                        </span></div>
                      </div>

                      <div class="detail-card">
                        <h4>⚙️ Specifications</h4>
                        <div v-if="asset.specifications && Object.keys(asset.specifications).length > 0">
                          <div v-for="(value, key) in asset.specifications" :key="key" class="spec-row">
                            <span>{{ key }}</span>
                            <span class="value">{{ value }}</span>
                          </div>
                        </div>
                        <div v-else class="no-specs">
                          No specifications available
                        </div>
                      </div>
                    </div>

                    <!-- Row 2: Financial & Assignments -->
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>💰 Financial Information</h4>
                        <div><span>Purchase Price</span><span class="value purchase-price">{{ formatCurrency(asset.purchasePrice) }}</span></div>
                        <div><span>Current Value</span><span class="value current-price">{{ formatCurrency(asset.currentValue) }}</span></div>
                        <div><span>Purchase Date</span><span class="value">{{ formatDate(asset.purchaseDate) || '-' }}</span></div>
                        <div>
                          <span>Depreciation</span>
                          <span class="value depreciation">
                            {{ formatCurrency((asset.purchasePrice || 0) - (asset.currentValue || 0)) }}
                            ({{ asset.purchasePrice ? (((asset.purchasePrice - asset.currentValue) / asset.purchasePrice * 100).toFixed(1)) : 0 }}%)
                          </span>
                        </div>
                        <div v-if="asset.notes">
                          <span>Notes</span>
                          <span class="value notes-text">{{ asset.notes }}</span>
                        </div>
                      </div>

                      <div class="detail-card">
                        <h4>📌 Assignments</h4>
                        <div v-if="asset.assignments && asset.assignments.length > 0">
                          <div v-for="(assignment, idx) in asset.assignments" :key="idx" class="assignment-row">
                            <div class="assignment-detail">
                              <span class="assignment-type" :class="assignment.type">
                                {{ assignment.type === 'individual' ? '👤' : '🏢' }}
                                {{ assignment.name }}
                              </span>
                              <span class="assignment-qty">× {{ assignment.quantity || 1 }}</span>
                              <span class="assignment-date">{{ formatDate(assignment.date) }}</span>
                            </div>
                            <div v-if="assignment.notes" class="assignment-notes">{{ assignment.notes }}</div>
                          </div>
                        </div>
                        <div v-else class="no-specs">
                          No assignments yet
                        </div>
                      </div>
                    </div>

                    <!-- Row 3: Documents & History -->
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📄 Reference Documents</h4>
                        <div v-if="asset.documents && asset.documents.length > 0">
                          <div v-for="doc in asset.documents" :key="doc.id" class="doc-row">
                            <span class="doc-icon">📎</span>
                            <a :href="doc.url" target="_blank" class="doc-link">{{ doc.name }}</a>
                            <span class="doc-date">{{ formatDate(doc.uploadDate) }}</span>
                          </div>
                        </div>
                        <div v-else class="no-specs">
                          No documents attached
                        </div>
                      </div>

                      <div class="detail-card">
                        <h4>📜 Transaction History</h4>
                        <div v-if="asset.transactions && asset.transactions.length > 0">
                          <div v-for="tx in asset.transactions" :key="tx.id" class="tx-row">
                            <span class="tx-badge" :class="tx.action">
                              {{ getActionLabel(tx.action) }}
                            </span>
                            <span class="tx-date">{{ formatDate(tx.date) }}</span>
                            <span class="tx-detail">
                              <span v-if="tx.from">From: {{ tx.from }}</span>
                              <span v-if="tx.to">→ To: {{ tx.to }}</span>
                            </span>
                            <span v-if="tx.notes" class="tx-notes">{{ tx.notes }}</span>
                          </div>
                        </div>
                        <div v-else class="no-specs">
                          No history available
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div v-if="totalItems > 0" class="pagination-container">
      <div class="pagination-info">
        <span>Showing {{ paginatedAssets.length }} of {{ totalItems }} assets</span>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      </div>
      
      <div class="pagination-controls">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1" 
          @click="goToPage(currentPage - 1)"
        >
          ← Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in displayedPages" 
            :key="page"
            class="page-number"
            :class="{ active: page === currentPage }"
            :disabled="page === '...'"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages" 
          @click="goToPage(currentPage + 1)"
        >
          Next →
        </button>
        
        <select v-model="itemsPerPage" @change="handlePageSizeChange" class="limit-select">
          <option :value="5">5 per page</option>
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>
      </div>
    </div>

    <!-- ==================== VIEW ASSET MODAL ==================== -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal-container view-modal" @click.stop>
        <div class="modal-header">
          <h3>📋 Asset Details</h3>
          <button class="modal-close" @click="showViewModal = false">✕</button>
        </div>
        <div class="modal-body" v-if="viewingAsset">
          <div class="asset-detail-header">
            <div class="asset-detail-icon" :style="{ background: getCategoryColor(viewingAsset.category) }">
              {{ getCategoryIcon(viewingAsset.category) }}
            </div>
            <div>
              <h2>{{ viewingAsset.name }}</h2>
              <div class="asset-detail-code">Code: {{ viewingAsset.code }}</div>
            </div>
            <span class="status-badge" :class="viewingAsset.status">
              {{ getStatusLabel(viewingAsset.status) }}
            </span>
          </div>

          <div class="asset-detail-grid">
            <div class="detail-item">
              <label>Category</label>
              <span>{{ viewingAsset.category }}</span>
            </div>
            <div class="detail-item">
              <label>Brand</label>
              <span>{{ viewingAsset.brand || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>Model</label>
              <span>{{ viewingAsset.model || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>Serial Number</label>
              <span class="serial-number">{{ viewingAsset.serial || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>Condition</label>
              <span class="condition-badge" :class="viewingAsset.condition">
                {{ getConditionLabel(viewingAsset.condition) }}
              </span>
            </div>
            <div class="detail-item">
              <label>Location</label>
              <span>{{ viewingAsset.location || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>Quantity</label>
              <span>{{ viewingAsset.quantity || 1 }}</span>
            </div>
            <div class="detail-item">
              <label>Purchase Price</label>
              <span class="purchase-price">{{ formatCurrency(viewingAsset.purchasePrice) }}</span>
            </div>
            <div class="detail-item">
              <label>Current Value</label>
              <span class="current-price">{{ formatCurrency(viewingAsset.currentValue) }}</span>
            </div>
          </div>

          <!-- Assignments Section -->
          <div class="assignments-section" v-if="viewingAsset.assignments && viewingAsset.assignments.length > 0">
            <h4>📌 Assignments</h4>
            <div class="assignments-list">
              <div v-for="(assignment, idx) in viewingAsset.assignments" :key="idx" class="assignment-item">
                <div class="assignment-icon">
                  <span v-if="assignment.type === 'individual'">👤</span>
                  <span v-else>🏢</span>
                </div>
                <div class="assignment-content">
                  <div class="assignment-header">
                    <span class="assignment-name">{{ assignment.name }}</span>
                    <span class="assignment-qty-badge">× {{ assignment.quantity || 1 }}</span>
                    <span class="assignment-date">{{ formatDate(assignment.date) }}</span>
                  </div>
                  <div class="assignment-notes" v-if="assignment.notes">{{ assignment.notes }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="asset-notes" v-if="viewingAsset.notes">
            <label>Notes</label>
            <p>{{ viewingAsset.notes }}</p>
          </div>

          <div class="spec-section" v-if="viewingAsset.specifications && Object.keys(viewingAsset.specifications).length > 0">
            <h4>⚙️ Specifications</h4>
            <div class="spec-grid">
              <div class="spec-item" v-for="(value, key) in viewingAsset.specifications" :key="key">
                <span class="spec-key">{{ key }}</span>
                <span class="spec-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <div class="transaction-history" v-if="viewingAsset.transactions?.length">
            <h4>📋 Transaction History</h4>
            <div class="transaction-list">
              <div v-for="tx in viewingAsset.transactions" :key="tx.id" class="transaction-item">
                <div class="tx-date">{{ formatDate(tx.date) }}</div>
                <div class="tx-action">
                  <span class="tx-badge" :class="tx.action">
                    {{ getActionLabel(tx.action) }}
                  </span>
                </div>
                <div class="tx-details">
                  <span v-if="tx.from">From: {{ tx.from }}</span>
                  <span v-if="tx.to">→ To: {{ tx.to }}</span>
                  <span v-if="tx.notes" class="tx-notes">{{ tx.notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-close" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- ==================== ASSIGN MODAL ==================== -->
    <div v-if="showAssignModal" class="modal-overlay" @click="showAssignModal = false">
      <div class="modal-container assign-modal" @click.stop>
        <div class="modal-header">
          <h3>📌 Assign Asset</h3>
          <button class="modal-close" @click="showAssignModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Assign <strong>{{ selectedAsset?.name }}</strong> (Qty: {{ selectedAsset?.quantity || 1 }})</p>
          
          <!-- Assignment Type -->
          <div class="form-group">
            <label>Assignment Type</label>
            <div class="assignment-type-selector">
              <label class="type-option" @click="assignmentType = 'individual'">
                <input type="radio" v-model="assignmentType" value="individual" /> 
                👤 Individual Person
              </label>
              <label class="type-option" @click="assignmentType = 'department'">
                <input type="radio" v-model="assignmentType" value="department" /> 
                🏢 Department / Group
              </label>
            </div>
          </div>

          <!-- Select Person / Department -->
          <div class="form-group">
            <label>{{ assignmentType === 'individual' ? 'Select Person' : 'Select Department' }}</label>
            <select v-model="assignTo" class="form-control">
              <option value="">Select {{ assignmentType === 'individual' ? 'person' : 'department' }}...</option>
              <option v-for="item in assignmentOptions" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <label>Quantity to Assign</label>
            <input 
              type="number" 
              v-model="assignQuantity" 
              class="form-control" 
              min="1" 
              :max="selectedAsset?.quantity || 1"
            />
            <span class="hint">Available: {{ selectedAsset?.quantity || 0 }} units</span>
          </div>

          <div class="form-group">
            <label>Assignment Date</label>
            <input type="date" v-model="assignDate" class="form-control" />
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="assignNotes" class="form-control" rows="2" placeholder="Assignment notes..."></textarea>
          </div>

          <div class="warning-box">
            <span>⚠️</span>
            <span>This will assign <strong>{{ assignQuantity || 0 }}</strong> unit(s) of this asset to the selected {{ assignmentType === 'individual' ? 'person' : 'department' }}.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showAssignModal = false">Cancel</button>
          <button class="btn-confirm" @click="confirmAssign" :disabled="!assignTo || !assignQuantity">Assign Asset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ============================================
// DEMO DATA - FLEXIBLE ASSIGNMENTS
// ============================================

const employees = [
  { id: 1, name: 'Brook Umeta', department: 'ICT' },
  { id: 2, name: 'Habtamu Tesfaye', department: 'ICT' },
  { id: 3, name: 'Meti Shafe', department: 'Finance' },
  { id: 4, name: 'Yerusalam Medelcho', department: 'HR' },
  { id: 5, name: 'Daniel Abebe', department: 'Operations' },
  { id: 6, name: 'Sara G/Mariam', department: 'Marketing' },
  { id: 7, name: 'Tigist Ayele', department: 'Sales' },
  { id: 8, name: 'Solomon Hailu', department: 'Engineering' },
]

const departments = [
  { id: 1, name: 'ICT Department' },
  { id: 2, name: 'Finance Department' },
  { id: 3, name: 'HR Department' },
  { id: 4, name: 'Marketing Department' },
  { id: 5, name: 'Sales Department' },
  { id: 6, name: 'Engineering Department' },
  { id: 7, name: 'Operations Department' },
]

const demoAssets = [
  // ==================== SINGLE ITEM - ASSIGNED TO ONE PERSON ====================
  {
    id: 1,
    code: 'LAP-001',
    name: 'MacBook Pro 16"',
    category: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro 16" M3',
    serial: 'SN-MBP-2023-001',
    status: 'assigned',
    condition: 'good',
    quantity: 1,
    purchasePrice: 250000,
    currentValue: 220000,
    purchaseDate: '2024-01-15',
    location: 'ICT Department',
    notes: 'High-end development laptop',
    specifications: {
      'Processor': 'Apple M3 Pro',
      'RAM': '16GB',
      'Storage': '512GB SSD',
      'Screen': '16" Retina'
    },
    assignments: [
      { type: 'individual', name: 'Brook Umeta', quantity: 1, date: '2024-01-20', notes: 'Primary developer' }
    ],
    documents: [],
    transactions: [
      { id: 1, date: '2024-01-20', action: 'assigned', to: 'Brook Umeta', notes: 'Assigned to developer' }
    ]
  },

  // ==================== SINGLE ITEM - ASSIGNED TO MULTIPLE PEOPLE (Shared) ====================
  {
    id: 2,
    code: 'PRJ-001',
    name: 'Projector - Epson 4K',
    category: 'Electronics',
    brand: 'Epson',
    model: 'Epson 4K Pro',
    serial: 'SN-EPS-PRJ-001',
    status: 'assigned',
    condition: 'good',
    quantity: 1,
    purchasePrice: 80000,
    currentValue: 65000,
    purchaseDate: '2024-02-01',
    location: 'Meeting Room A',
    notes: 'Shared projector for presentations',
    specifications: {
      'Resolution': '4K UHD',
      'Brightness': '4000 lumens',
      'Connectivity': 'HDMI, USB-C, Wireless'
    },
    assignments: [
      { type: 'individual', name: 'Brook Umeta', quantity: 1, date: '2024-02-10', notes: 'Main user' },
      { type: 'individual', name: 'Habtamu Tesfaye', quantity: 1, date: '2024-02-10', notes: 'Secondary user' },
      { type: 'individual', name: 'Sara G/Mariam', quantity: 1, date: '2024-02-15', notes: 'Marketing presentations' }
    ],
    documents: [],
    transactions: [
      { id: 2, date: '2024-02-10', action: 'assigned', to: 'Brook Umeta, Habtamu Tesfaye', notes: 'Shared projector assigned to team' },
      { id: 3, date: '2024-02-15', action: 'assigned', to: 'Sara G/Mariam', notes: 'Added for marketing' }
    ]
  },

  // ==================== MULTIPLE ITEMS - ASSIGNED TO ONE PERSON ====================
  {
    id: 3,
    code: 'MON-001',
    name: 'Dell 27" Monitors',
    category: 'Monitor',
    brand: 'Dell',
    model: 'UltraSharp U2723QE',
    serial: 'BULK-MON-001',
    status: 'assigned',
    condition: 'good',
    quantity: 3,
    purchasePrice: 45000,
    currentValue: 40000,
    purchaseDate: '2024-01-20',
    location: 'ICT Department',
    notes: '3 monitors for developer setup',
    specifications: {
      'Screen': '27" 4K UHD',
      'Brightness': '400 cd/m²',
      'Connectivity': 'USB-C, HDMI'
    },
    assignments: [
      { type: 'individual', name: 'Brook Umeta', quantity: 3, date: '2024-01-25', notes: 'Multi-monitor setup for development' }
    ],
    documents: [],
    transactions: [
      { id: 4, date: '2024-01-25', action: 'assigned', to: 'Brook Umeta', notes: '3 monitors for developer' }
    ]
  },

  // ==================== MULTIPLE ITEMS - ASSIGNED TO A DEPARTMENT ====================
  {
    id: 4,
    code: 'PHN-001',
    name: 'iPhone 15 Pro',
    category: 'Phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    serial: 'BULK-PHN-001',
    status: 'assigned',
    condition: 'good',
    quantity: 10,
    purchasePrice: 130000,
    currentValue: 120000,
    purchaseDate: '2024-04-01',
    location: 'Sales Office',
    notes: '10 phones for sales team',
    specifications: {
      'Storage': '256GB',
      'Camera': '48MP Main',
      'Battery': '3274 mAh'
    },
    assignments: [
      { type: 'department', name: 'Sales Department', quantity: 10, date: '2024-04-15', notes: '5 for field agents, 5 for office staff' }
    ],
    documents: [],
    transactions: [
      { id: 5, date: '2024-04-15', action: 'assigned', to: 'Sales Department', notes: '10 phones assigned to sales team' }
    ]
  },

  // ==================== MULTIPLE ITEMS - ASSIGNED TO MULTIPLE PEOPLE ====================
  {
    id: 5,
    code: 'TAB-001',
    name: 'iPad Pro Tablets',
    category: 'Tablet',
    brand: 'Apple',
    model: 'iPad Pro 12.9" M2',
    serial: 'BULK-TAB-001',
    status: 'assigned',
    condition: 'good',
    quantity: 8,
    purchasePrice: 140000,
    currentValue: 130000,
    purchaseDate: '2024-05-01',
    location: 'Design Studio',
    notes: '8 tablets for designers and content creators',
    specifications: {
      'Storage': '256GB',
      'Display': '12.9" Liquid Retina XDR',
      'Processor': 'M2'
    },
    assignments: [
      { type: 'individual', name: 'Tigist Ayele', quantity: 2, date: '2024-05-10', notes: 'For design team lead' },
      { type: 'individual', name: 'Solomon Hailu', quantity: 2, date: '2024-05-10', notes: 'For content creation' },
      { type: 'individual', name: 'Sara G/Mariam', quantity: 2, date: '2024-05-15', notes: 'For marketing design' },
      { type: 'department', name: 'Engineering Department', quantity: 2, date: '2024-06-01', notes: 'For engineering team' }
    ],
    documents: [],
    transactions: [
      { id: 6, date: '2024-05-10', action: 'assigned', to: 'Tigist Ayele, Solomon Hailu', notes: 'Tablets assigned to designers' },
      { id: 7, date: '2024-05-15', action: 'assigned', to: 'Sara G/Mariam', notes: 'Tablets assigned to marketing' },
      { id: 8, date: '2024-06-01', action: 'assigned', to: 'Engineering Department', notes: 'Tablets assigned to engineering' }
    ]
  },

  // ==================== AVAILABLE ASSETS ====================
  {
    id: 6,
    code: 'PRN-001',
    name: 'HP LaserJet Pro Printers',
    category: 'Printer',
    brand: 'HP',
    model: 'LaserJet Pro MFP M428',
    serial: 'BULK-PRN-001',
    status: 'available',
    condition: 'good',
    quantity: 5,
    purchasePrice: 35000,
    currentValue: 30000,
    purchaseDate: '2024-02-01',
    location: 'Store Room',
    notes: '5 printers in storage',
    specifications: {
      'Type': 'Laser Printer',
      'Speed': '30 pages/min',
      'Connectivity': 'USB, Ethernet'
    },
    assignments: [],
    documents: [],
    transactions: [
      { id: 9, date: '2024-02-01', action: 'received', to: 'Store Room', notes: '5 printers received' }
    ]
  },
  {
    id: 7,
    code: 'KIT-001',
    name: 'Office Desk Kits',
    category: 'Furniture',
    brand: 'IKEA',
    model: 'Office Pro Set',
    serial: 'BULK-KIT-001',
    status: 'available',
    condition: 'good',
    quantity: 20,
    purchasePrice: 15000,
    currentValue: 12000,
    purchaseDate: '2024-03-01',
    location: 'Store Room C',
    notes: '20 complete desk sets available',
    specifications: {
      'Set Includes': 'Desk, Chair, Filing Cabinet',
      'Color': 'Black/Walnut'
    },
    assignments: [],
    documents: [],
    transactions: [
      { id: 10, date: '2024-03-01', action: 'received', to: 'Store Room C', notes: '20 desk sets received' }
    ]
  },
  {
    id: 8,
    code: 'VEH-001',
    name: 'Toyota Hilux',
    category: 'Vehicle',
    brand: 'Toyota',
    model: 'Hilux 4x4',
    serial: 'SN-TOY-VEH-001',
    status: 'available',
    condition: 'good',
    quantity: 1,
    purchasePrice: 4500000,
    currentValue: 4000000,
    purchaseDate: '2023-10-01',
    location: 'Garage',
    notes: 'Field work vehicle available',
    specifications: {
      'Engine': '2.8L Turbo Diesel',
      'Drive': '4x4'
    },
    assignments: [],
    documents: [],
    transactions: [
      { id: 11, date: '2023-10-01', action: 'received', to: 'Garage', notes: 'Vehicle received' }
    ]
  },
  {
    id: 9,
    code: 'MON-002',
    name: 'LG 24" Monitors',
    category: 'Monitor',
    brand: 'LG',
    model: '24MK600M',
    serial: 'BULK-MON-002',
    status: 'available',
    condition: 'good',
    quantity: 15,
    purchasePrice: 25000,
    currentValue: 22000,
    purchaseDate: '2024-02-15',
    location: 'ICT Lab',
    notes: '15 monitors for lab upgrade',
    specifications: {
      'Screen': '24" Full HD',
      'Aspect Ratio': '16:9'
    },
    assignments: [],
    documents: [],
    transactions: [
      { id: 12, date: '2024-02-15', action: 'received', to: 'ICT Lab', notes: '15 monitors received' }
    ]
  }
]

// ============================================
// STATE
// ============================================

const assets = ref([...demoAssets])
const loading = ref(false)
const searchQuery = ref('')
const filterCategory = ref('')
const filterAssignmentType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5)
const expandedRow = ref(null)

const showViewModal = ref(false)
const showAssignModal = ref(false)
const viewingAsset = ref(null)
const selectedAsset = ref(null)

const assignmentType = ref('individual')
const assignTo = ref('')
const assignQuantity = ref(1)
const assignDate = ref('')
const assignNotes = ref('')

// ============================================
// COMPUTED
// ============================================

const totalItems = computed(() => assets.value.length)

const activeCategoryNames = computed(() => {
  const cats = new Set(assets.value.map(a => a.category))
  return Array.from(cats)
})

const stats = computed(() => {
  const total = assets.value.length
  const available = assets.value.filter(a => a.status === 'available').length
  const assigned = assets.value.filter(a => a.status === 'assigned').length
  const maintenance = assets.value.filter(a => a.status === 'maintenance').length
  const totalAssignments = assets.value.reduce((sum, a) => sum + (a.assignments?.length || 0), 0)

  return [
    { icon: '📦', label: 'Total Assets', value: total, color: '#6366f1' },
    { icon: '✅', label: 'Available', value: available, color: '#10b981' },
    { icon: '📌', label: 'Assigned', value: assigned, color: '#f59e0b' },
    { icon: '👥', label: 'Total Assignments', value: totalAssignments, color: '#8b5cf6' }
  ]
})

const assignmentOptions = computed(() => {
  if (assignmentType.value === 'individual') {
    return employees
  } else {
    return departments
  }
})

const filteredAssets = computed(() => {
  let result = [...assets.value]

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter(a => 
      a.name.toLowerCase().includes(search) ||
      a.code.toLowerCase().includes(search) ||
      a.serial?.toLowerCase().includes(search) ||
      a.model?.toLowerCase().includes(search)
    )
  }

  if (filterCategory.value) {
    result = result.filter(a => a.category === filterCategory.value)
  }

  if (filterAssignmentType.value === 'assigned') {
    result = result.filter(a => a.assignments && a.assignments.length > 0)
  } else if (filterAssignmentType.value === 'unassigned') {
    result = result.filter(a => !a.assignments || a.assignments.length === 0)
  }

  if (filterStatus.value) {
    result = result.filter(a => a.status === filterStatus.value)
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredAssets.value.length / itemsPerPage.value) || 1)

const paginatedAssets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAssets.value.slice(start, end)
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || filterCategory.value || filterAssignmentType.value || filterStatus.value
})

const displayedPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

// ============================================
// METHODS
// ============================================

const getCategoryIcon = (category) => {
  const icons = {
    'Laptop': '💻',
    'Desktop': '🖥',
    'Monitor': '🖥',
    'Keyboard': '⌨️',
    'Mouse': '🖱',
    'Phone': '📱',
    'Tablet': '📱',
    'Printer': '🖨',
    'Vehicle': '🚗',
    'Furniture': '🪑',
    'Electronics': '📡'
  }
  return icons[category] || '📦'
}

const getCategoryColor = (category) => {
  const colors = {
    'Laptop': '#eef2ff',
    'Desktop': '#e0f2fe',
    'Monitor': '#d1fae5',
    'Keyboard': '#fef3c7',
    'Mouse': '#fce7f3',
    'Phone': '#dbeafe',
    'Tablet': '#ede9fe',
    'Printer': '#ffedd5',
    'Vehicle': '#d1fae5',
    'Furniture': '#fef3c7',
    'Electronics': '#e0f2fe'
  }
  return colors[category] || '#f1f5f9'
}

const getStatusLabel = (status) => {
  const labels = {
    available: 'Available',
    assigned: 'Assigned',
    maintenance: 'Maintenance',
    retired: 'Retired'
  }
  return labels[status] || status
}

const getConditionLabel = (condition) => {
  const labels = {
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    damaged: 'Damaged',
    retired: 'Retired'
  }
  return labels[condition] || condition
}

const getActionLabel = (action) => {
  const labels = {
    received: 'Received',
    assigned: 'Assigned',
    returned: 'Returned',
    transferred: 'Transferred',
    maintenance: 'Maintenance',
    repaired: 'Repaired'
  }
  return labels[action] || action
}

const formatCurrency = (value) => {
  if (!value) return 'ETB 0.00'
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

const handleSearch = () => { currentPage.value = 1 }
const handleFilterChange = () => { currentPage.value = 1 }
const handlePageSizeChange = () => { currentPage.value = 1 }

const clearFilters = () => {
  searchQuery.value = ''
  filterCategory.value = ''
  filterAssignmentType.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page === '...') return
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const openAddAsset = () => {
  alert('Open Add Asset form')
}

const openEditAsset = (asset) => {
  alert(`Edit asset: ${asset.name}`)
}

const viewAsset = (asset) => {
  viewingAsset.value = asset
  showViewModal.value = true
}

const openAssignModal = (asset) => {
  selectedAsset.value = asset
  assignmentType.value = 'individual'
  assignTo.value = ''
  assignQuantity.value = 1
  assignDate.value = new Date().toISOString().split('T')[0]
  assignNotes.value = ''
  showAssignModal.value = true
}

const confirmAssign = () => {
  if (!assignTo.value || !assignQuantity.value) {
    alert('Please select a person/department and quantity')
    return
  }

  const item = assignmentType.value === 'individual' 
    ? employees.find(e => e.id === parseInt(assignTo.value))
    : departments.find(d => d.id === parseInt(assignTo.value))

  if (!item) return

  const asset = selectedAsset.value
  
  // Add assignment
  if (!asset.assignments) asset.assignments = []
  asset.assignments.push({
    type: assignmentType.value,
    name: item.name,
    quantity: parseInt(assignQuantity.value),
    date: assignDate.value || new Date().toISOString().split('T')[0],
    notes: assignNotes.value || ''
  })

  // Update asset status
  asset.status = 'assigned'

  // Add transaction
  if (!asset.transactions) asset.transactions = []
  asset.transactions.unshift({
    id: Date.now(),
    date: assignDate.value || new Date().toISOString().split('T')[0],
    action: 'assigned',
    to: item.name,
    notes: assignNotes.value || `${assignQuantity.value} unit(s) assigned`
  })

  showAssignModal.value = false
  selectedAsset.value = null
  alert(`✅ ${assignQuantity.value} unit(s) of ${asset.name} assigned to ${item.name}`)
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  assignDate.value = new Date().toISOString().split('T')[0]
})
</script>

<style scoped>
/* ================================================================ */
/* MAIN CONTAINER */
/* ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 220px;
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

/* ================================================================ */
/* BUTTONS */
/* ================================================================ */
.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-add:hover { background: #2563eb; }

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-primary:hover { background: #2563eb; }

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.btn-cancel:hover { background: #e2e8f0; }

.btn-confirm {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-confirm:hover { background: #2563eb; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-close {
  padding: 8px 24px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}
.icon-btn:hover { background: #f1f5f9; }

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
.btn-clear-filters:hover { background: #e2e8f0; }

/* ================================================================ */
/* STATS GRID */
/* ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #eef2ff;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

/* ================================================================ */
/* FILTER BAR */
/* ================================================================ */
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

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-container {
  overflow-x: auto;
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.asset-table th,
.asset-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.asset-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center { text-align: center; }

/* Asset Info */
.asset-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.asset-name {
  font-weight: 500;
  color: #1e293b;
}

.asset-code {
  font-size: 11px;
  color: #94a3b8;
}

.category-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #f1f5f9;
  border-radius: 16px;
  font-size: 12px;
  color: #475569;
}

/* Serial Info */
.serial-info .serial {
  font-size: 12px;
  color: #1e293b;
}

.serial-info .model {
  font-size: 11px;
  color: #94a3b8;
}

/* Quantity Badge */
.quantity-badge {
  display: inline-block;
  padding: 2px 10px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.available {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.assigned {
  background: #d1fae5;
  color: #059669;
}

.status-badge.maintenance {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.retired {
  background: #f1f5f9;
  color: #64748b;
}

/* Condition Badge */
.condition-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.condition-badge.good {
  background: #d1fae5;
  color: #059669;
}

.condition-badge.fair {
  background: #fef3c7;
  color: #d97706;
}

.condition-badge.poor {
  background: #fee2e2;
  color: #dc2626;
}

.condition-badge.damaged {
  background: #fee2e2;
  color: #dc2626;
}

/* Assignment Info */
.assignment-info {
  display: flex;
  align-items: center;
}

.assignment-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.unassigned-badge {
  color: #94a3b8;
  font-size: 12px;
}

/* Actions */
.action-buttons {
  display: flex;
  gap: 4px;
}

/* Expand Button */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}
.expand-btn:hover { background: #e0e7ff; }

.expanded-row { background: #f8fafc; }
.inactive-row { opacity: 0.6; }

/* ================================================================ */
/* EXPANDED DETAILS */
/* ================================================================ */
.detail-expand-row td { padding: 0 !important; }

.expand-details {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
}

.detail-card h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}

.detail-card > div:last-child { border-bottom: none; }

.detail-card .value {
  font-weight: 500;
  color: #1e293b;
}

.serial-number { color: #6366f1 !important; font-family: monospace; }
.purchase-price { color: #f59e0b !important; }
.current-price { color: #10b981 !important; font-weight: 600; }
.depreciation { color: #ef4444 !important; }
.notes-text { font-style: italic; color: #64748b; }

/* Assignment Rows */
.assignment-row {
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.assignment-row:last-child { border-bottom: none; }

.assignment-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.assignment-type {
  font-weight: 500;
  font-size: 13px;
}

.assignment-type.individual { color: #2563eb; }
.assignment-type.department { color: #7c3aed; }

.assignment-qty {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
}

.assignment-date {
  font-size: 11px;
  color: #94a3b8;
}

.assignment-notes {
  font-size: 11px;
  color: #64748b;
  font-style: italic;
  margin-top: 2px;
  padding-left: 4px;
}

/* Spec Row */
.spec-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}
.spec-row:last-child { border-bottom: none; }

.no-specs {
  color: #94a3b8;
  font-size: 12px;
  padding: 8px 0;
  text-align: center;
}

/* Documents */
.doc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}
.doc-row:last-child { border-bottom: none; }
.doc-icon { font-size: 14px; }
.doc-link {
  color: #3b82f6;
  text-decoration: none;
  flex: 1;
}
.doc-link:hover { text-decoration: underline; }
.doc-date { font-size: 11px; color: #94a3b8; }

/* Transaction History */
.tx-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
  flex-wrap: wrap;
}
.tx-row:last-child { border-bottom: none; }

.tx-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.tx-badge.received { background: #dbeafe; color: #2563eb; }
.tx-badge.assigned { background: #d1fae5; color: #059669; }
.tx-badge.returned { background: #fef3c7; color: #d97706; }
.tx-badge.maintenance { background: #fee2e2; color: #dc2626; }
.tx-badge.repaired { background: #d1fae5; color: #059669; }

.tx-date { font-size: 11px; color: #94a3b8; }
.tx-detail { color: #475569; }
.tx-notes { font-style: italic; color: #94a3b8; font-size: 11px; }

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
.pagination-container {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #64748b;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-info .page-info {
  font-weight: 500;
  color: #1e293b;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-number {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover:not(.active):not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.page-number.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  font-weight: 600;
}

.page-number:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.limit-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  color: #1e293b;
}

/* ================================================================ */
/* MODALS */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 750px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease;
}

.view-modal { max-width: 850px; }
.assign-modal { max-width: 550px; }

@keyframes modalSlideIn {
  from { transform: translateY(-20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }

.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover { background: #f1f5f9; color: #1e293b; }

/* ================================================================ */
/* VIEW MODAL DETAILS */
/* ================================================================ */
.asset-detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #eef2ff;
}

.asset-detail-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.asset-detail-code {
  font-size: 13px;
  color: #94a3b8;
}

.asset-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.detail-item label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  font-size: 14px;
  color: #1e293b;
}

/* Assignments Section */
.assignments-section {
  margin-top: 16px;
}

.assignments-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assignment-item {
  display: flex;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.assignment-item .assignment-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.assignment-content {
  flex: 1;
}

.assignment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.assignment-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.assignment-qty-badge {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #475569;
}

.assignment-date {
  font-size: 12px;
  color: #94a3b8;
}

.assignment-notes {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  margin-top: 4px;
}

/* Spec Section */
.spec-section { margin-top: 16px; }
.spec-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.spec-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.spec-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 13px;
}

.spec-key {
  font-weight: 500;
  color: #64748b;
  min-width: 80px;
}

.spec-value {
  color: #1e293b;
}

.asset-notes {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.asset-notes label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  display: block;
  margin-bottom: 4px;
}

.asset-notes p {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
}

/* Transaction History */
.transaction-history { margin-top: 16px; }
.transaction-history h4 {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  font-size: 13px;
}

.tx-date {
  font-weight: 500;
  color: #64748b;
  min-width: 80px;
}

.tx-action .tx-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.tx-details {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #475569;
}

.tx-notes {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

/* ================================================================ */
/* ASSIGN MODAL */
/* ================================================================ */
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea.form-control { resize: vertical; }

.hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.assignment-type-selector {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
}

.type-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #fef3c7;
  border-radius: 10px;
  font-size: 13px;
  color: #92400e;
  margin-top: 8px;
}

/* ================================================================ */
/* LOADING & EMPTY STATES */
/* ================================================================ */
.loading-state { text-align: center; padding: 60px 20px; }

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state h3 { color: #1e293b; margin-bottom: 8px; }
.empty-state p { color: #94a3b8; }

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 900px) {
  .detail-row-two-cols { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: stretch; }
  .header-filters { flex-direction: column; align-items: stretch; }
  .search-box input { width: 100%; }
  .filter-bar { flex-direction: column; }
  .filter-bar select { width: 100%; }
  .asset-detail-grid { grid-template-columns: 1fr; }
  .spec-grid { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .section-card { padding: 12px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .asset-table { min-width: 650px; }
  .modal-container { margin: 10px; max-height: 95vh; }
}
</style>