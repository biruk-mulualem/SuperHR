<!-- views/storemanagement/storebalance/storebalance.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>💰 Store Balance</h2>
        <span class="total-badge">{{ filteredBalances.length }} Items</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search items..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openAddBalanceModal">📦 Initialize Balance</button>
       <button class="btn-process-requests" @click="processApprovedRequests">
  📋 Process Approved Requests
  <span v-if="pendingRequestsCount > 0" class="badge-count">
    {{ pendingRequestsCount }}
  </span>
</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStore" class="filter-select" @change="onFilterChange">
        <option value="">All Stores</option>
        <option v-for="store in availableStores" :key="store.id" :value="store.id">
          {{ store.name }}
        </option>
      </select>
      <select v-model="filterGroup" class="filter-select" @change="onFilterChange">
        <option value="">All Groups</option>
        <option v-for="group in availableGroups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-print" @click="printReport">🖨️ Print</button>
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStores }}</div>
          <div class="stat-label">Total Stores</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-number">{{ lowStockItems }}</div>
          <div class="stat-label">Low Stock Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-number">{{ pendingRequestsCount }}</div>
          <div class="stat-label">Pending Approved Requests</div>
        </div>
      </div>
    </div>

    <!-- ==================== STORE BALANCE TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <table class="balance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Store</th>
            <th>Group</th>
            <th>Item</th>
            <th>UOM</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="text-center">
              <div class="loading-spinner">Loading...</div>
            </td>
          </tr>
          <tr v-else-if="paginatedBalances.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">💰</span>
                <p>No balance records found</p>
                <button class="btn-secondary" @click="openAddBalanceModal">Initialize First Balance</button>
              </div>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedBalances" :key="item.id">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="store-name">{{ item.storeName || getStoreName(item.storeId) }}</td>
            <td>
              <span class="group-tag">{{ item.groupName || getGroupName(item.groupId) }}</span>
            </td>
            <td>
              <div class="item-name-wrapper">
                <div class="item-code">{{ item.itemCode || getItemCode(item.itemId) }}</div>
                <div class="standard-name">{{ item.itemName || getItemName(item.itemId) }}</div>
                <div class="common-name">{{ item.itemCommonName || getItemCommonName(item.itemId) }}</div>
              </div>
            </td>
            <td>
              <div class="uom-wrapper">
                <div class="uom-code">{{ item.uomCode || getItemUnit(item.itemId) }}</div>
                <div class="conversion-info" v-if="(item.conversionValue || getConversionValue(item.itemId)) > 1">
                 1 {{ item.uomCode || getItemUnit(item.itemId) }} = {{ item.conversionValue || getConversionValue(item.itemId) }} 
                  {{ item.conversionUomCode || getBaseUOM(item.itemId) }} 
                </div>
                <div class="conversion-info base" v-else>
                  1 {{ item.uomCode || getItemUnit(item.itemId) }} = 1 {{ item.uomCode || getItemUnit(item.itemId) }}
                </div>
              </div>
            </td>
            <td>
              <div class="balance-wrapper">
                <div class="balance-value" :class="item.statusClass || getBalanceClass(item)">
                  {{ formatNumber(item.balance) }}
                </div>
                <div class="base-balance">
                  = {{ formatNumber(item.baseBalance || getBaseBalance(item)) }} 
                  {{ item.conversionUomCode || getBaseUOM(item.itemId) }}
                </div>
              </div>
            </td>
            <td>
              <span :class="['status-badge', (item.status || 'inactive').toLowerCase()]">
                {{ item.status || 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <!-- <button class="icon-btn" @click="editBalance(item)" title="Edit">✏️</button> -->
                <button class="icon-btn" @click="toggleStatus(item)" :title="item.status === 'Active' ? 'Deactivate' : 'Activate'">
                  {{ item.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
                <button class="icon-btn delete-btn" @click="openDeleteModal(item)" title="Delete" v-if="item.status === 'Inactive'">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="filteredBalances.length > 0">
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

    <!-- ==================== INITIALIZE BALANCE MODAL WITH TABS ==================== -->
    <div v-if="showBalanceModal" class="modal-overlay" @click.self="closeBalanceModal">
      <div class="modal-container balance-modal">
        <div class="modal-header">
          <h3>{{ editingBalance ? '✏️ Edit Balance' : '📦 Initialize Balance' }}</h3>
          <button class="modal-close" @click="closeBalanceModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Tabs -->
          <div class="init-tabs" v-if="!editingBalance">
            <button class="init-tab" :class="{ active: initTab === 'manual' }" @click="initTab = 'manual'">
              ✍️ Manual
            </button>
            <button class="init-tab" :class="{ active: initTab === 'import' }" @click="initTab = 'import'">
              📥 Import
            </button>
          </div>

          <!-- Manual Tab -->
          <div v-if="initTab === 'manual' || editingBalance">
            <div v-if="!editingBalance" class="init-info">
              <span class="info-icon">ℹ️</span>
              <span>Set up initial stock balance for a specific item in a store.</span>
            </div>
            <form @submit.prevent="saveBalance" class="balance-form">
             <!-- In the modal body, update the store and group selects -->
<div class="form-row">
  <div class="form-group">
    <label>Store *</label>
    <select v-model="form.storeId" required :disabled="!isAdmin && userData?.assignedStore">
      <option value="">Select Store</option>
      <option v-for="store in availableStores" :key="store.id" :value="store.id">
        {{ store.name }}
      </option>
    </select>
    <span v-if="!isAdmin && userData?.assignedStore" class="hint pre-filled">
      📌 Pre-filled with your assigned store: <strong>{{ userData.assignedStore.name }}</strong>
    </span>
    <span v-else-if="!isAdmin && !userData?.assignedStore" class="hint warning">
      ⚠️ No store assigned. Please select a store.
    </span>
  </div>
  <div class="form-group">
    <label>Group *</label>
    <select v-model="form.groupId" required :disabled="!isAdmin && userData?.assignedGroup">
      <option value="">Select Group</option>
      <option v-for="group in availableGroups" :key="group.id" :value="group.id">
        {{ group.name }}
      </option>
    </select>
    <span v-if="!isAdmin && userData?.assignedGroup" class="hint pre-filled">
      📌 Pre-filled with your assigned group: <strong>{{ userData.assignedGroup.name }}</strong>
    </span>
    <span v-else-if="!isAdmin && !userData?.assignedGroup" class="hint warning">
      ⚠️ No group assigned. Please select a group.
    </span>
  </div>
</div>
              <div class="form-row">
                <div class="form-group">
                  <label>Item *</label>
                  <select v-model="form.itemId" required @change="onItemChange">
                    <option value="">Select Item</option>
                    <option v-for="item in inventoryItems" :key="item.id" :value="item.id">
                      {{ item.code }} - {{ item.standardName }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Balance ({{ getItemUnit(form.itemId) }}) *</label>
                  <input v-model.number="form.balance" type="number" required placeholder="0" min="0" step="1" @input="onBalanceChange" :readonly="!!editingBalance" />
                  <span class="hint" v-if="form.itemId && form.balance > 0 && !editingBalance">
                    = {{ formatNumber(form.balance * getConversionValue(Number(form.itemId))) }} {{ getBaseUOM(Number(form.itemId)) }}
                  </span>
                  <span class="hint" v-if="editingBalance">Balance cannot be changed after initialization</span>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="form.status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Minimum Stock Alert</label>
                  <input v-model.number="form.minStock" type="number" placeholder="Min stock level" min="0" step="1" />
                  <span class="hint">Warning when stock falls below this level</span>
                </div>
              </div>
            </form>
          </div>

          <!-- Import Tab -->
          <div v-if="initTab === 'import' && !editingBalance">
            <div class="import-info">
              <span class="info-icon">📄</span>
              <div>
                <p><strong>CSV Format Required:</strong></p>
                <p class="info-text">Your CSV should have the following columns:</p>
                <ul class="csv-format-list">
                  <li><strong>storeId</strong> - Store ID (required) <span class="hint-text">e.g., 1, 2, 3</span></li>
                  <li><strong>groupId</strong> - Group ID (required) <span class="hint-text">e.g., 1, 2, 3</span></li>
                  <li><strong>itemCode</strong> - Item Code (required) <span class="hint-text">e.g., SDT000001</span></li>
                  <li><strong>balance</strong> - Initial balance (required) <span class="hint-text">e.g., 100</span></li>
                  <li><strong>minStock</strong> - Minimum stock level (optional) <span class="hint-text">e.g., 10</span></li>
                  <li><strong>status</strong> - Status (optional, defaults to Active) <span class="hint-text">Active/Inactive</span></li>
                </ul>
                <p class="info-text" style="margin-top: 8px;">
                  💡 <strong>Note:</strong> Use <strong>itemCode</strong> (e.g., SDT000001) instead of numeric itemId for easier import.
                </p>
                <button class="btn-template" @click="downloadTemplate" :disabled="importing">
                  📄 Download CSV Template
                </button>
              </div>
            </div>

            <!-- File Upload -->
            <div class="file-upload-area import-upload" @click="!importing && triggerCsvUpload($event)" 
              :class="{ 'drag-over': isDragOver, 'disabled': importing }"
              @dragover.prevent="!importing && (isDragOver = true)" 
              @dragleave.prevent="!importing && (isDragOver = false)"
              @drop.prevent="!importing && handleCsvDrop($event)">
              <div v-if="csvFile" class="file-preview">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ csvFile.name }}</span>
                <span class="file-size">{{ formatFileSize(csvFile.size) }}</span>
                <button type="button" @click.stop="!importing && removeCsvFile()" class="remove-file" :disabled="importing">✕</button>
              </div>
              <div v-else class="upload-placeholder">
                <span class="upload-icon">📁</span>
                <span>Click to upload CSV file</span>
                <span class="upload-hint">or drag and drop</span>
                <span class="upload-hint">Supported formats: .csv</span>
              </div>
              <input type="file" ref="csvFileInput" accept=".csv" 
                     @change="handleCsvUpload" style="display:none" :disabled="importing" />
            </div>

            <!-- Import Progress -->
            <div v-if="importing" class="import-progress">
              <div class="progress-info">
                <span>Importing balances...</span>
                <span>{{ importProgress.processed }} / {{ importProgress.total }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: importProgress.percentage + '%' }"></div>
              </div>
              <div class="progress-status">
                <span class="status-success">✅ {{ importProgress.success }}</span>
                <span class="status-failed">❌ {{ importProgress.failed }}</span>
                <span class="status-remaining">⏳ {{ importProgress.remaining }} remaining</span>
              </div>
            </div>

            <!-- Preview imported data -->
            <div v-if="importPreviewData.length > 0 && !importing" class="import-preview">
              <h4>Preview ({{ importPreviewData.length }} items)</h4>
              <div class="preview-table-container">
                <table class="preview-table">
                  <thead>
                    <tr>
                      <th>Store</th>
                      <th>Group</th>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in importPreviewData.slice(0, 10)" :key="index">
                      <td>{{ getStoreName(Number(item.storeId)) || item.storeId }}</td>
                      <td>{{ getGroupName(Number(item.groupId)) || item.groupId }}</td>
                      <td><strong>{{ item.itemCode || item.itemId }}</strong></td>
                      <td>{{ getItemNameByCode(item.itemCode) || getItemName(Number(item.itemId)) || 'Unknown' }}</td>
                      <td>{{ item.balance }}</td>
                      <td>{{ item.status || 'Active' }}</td>
                    </tr>
                    <tr v-if="importPreviewData.length > 10">
                      <td colspan="6" class="preview-more">
                        ... and {{ importPreviewData.length - 10 }} more items
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Import results -->
            <div v-if="importResults && !importing" class="import-results">
              <div class="result-summary">
                <span class="result-success">✅ {{ importResults.success }} imported</span>
                <span class="result-failed">❌ {{ importResults.failed }} failed</span>
                <span class="result-total">📊 {{ importResults.total }} total</span>
              </div>
              <div v-if="importResults.errors && importResults.errors.length > 0" class="result-errors">
                <p><strong>Errors:</strong></p>
                <ul>
                  <li v-for="(err, idx) in importResults.errors.slice(0, 5)" :key="idx">{{ err }}</li>
                  <li v-if="importResults.errors.length > 5">... and {{ importResults.errors.length - 5 }} more errors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeBalanceModal" :disabled="importing">Cancel</button>
          <button 
            v-if="initTab === 'manual' || editingBalance"
            class="btn-primary" 
            @click="saveBalance" 
            :disabled="saving || (editingBalance && form.balance !== undefined)"
          >
            {{ saving ? 'Saving...' : (editingBalance ? 'Update' : 'Initialize') }}
          </button>
          <button 
            v-if="initTab === 'import' && !editingBalance"
            class="btn-primary" 
            @click="processImport" 
            :disabled="!csvFile || importing || importPreviewData.length === 0"
          >
            {{ importing ? 'Importing...' : 'Import Balances' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>🗑️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">⚠️</div>
          <p><strong>Item:</strong> {{ deleteTarget ? getItemName(deleteTarget.itemId) : '' }}</p>
          <p><strong>Store:</strong> {{ deleteTarget ? getStoreName(deleteTarget.storeId) : '' }}</p>
          <p><strong>Group:</strong> {{ deleteTarget ? getGroupName(deleteTarget.groupId) : '' }}</p>
          <p><strong>Balance:</strong> {{ deleteTarget ? deleteTarget.balance : 0 }} {{ deleteTarget ? getItemUnit(deleteTarget.itemId) : '' }}</p>
          <p class="delete-warning">⚠️ This action cannot be undone!</p>
          <p class="delete-question">Are you sure you want to delete this balance record?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- ==================== PROCESS REQUESTS MODAL ==================== -->
    <div v-if="showProcessModal" class="modal-overlay" @click.self="closeProcessModal">
      <div class="modal-container process-modal">
        <div class="modal-header">
          <h3>📋 Process Approved Requests</h3>
          <button class="modal-close" @click="closeProcessModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Info Box -->
          <div class="process-info">
            <div class="process-info-header">
              <span class="info-icon">ℹ️</span>
              <span class="info-title">How it works</span>
            </div>
            <ul class="process-rules">
              <li>1️⃣ Select a <strong>Store</strong> to see its approved requests</li>
              <li>2️⃣ Select the <strong>Requests</strong> you want to process</li>
              <li>3️⃣ Select the <strong>Group</strong> to apply the changes to</li>
              <li>4️⃣ Click <strong>"Process Selected"</strong> to apply changes</li>
              <li>✅ If your store is the <strong>asking store</strong> → Items will be <span class="text-success">added</span> to the group's balance</li>
              <li>✅ If your store is the <strong>supplying store</strong> → Items will be <span class="text-danger">removed</span> from the group's balance</li>
            </ul>
          </div>

          <!-- Step 1: Select Store - PRE-SELECTED FOR NON-ADMIN -->
          <div class="form-group">
            <label>1. Select Store *</label>
            <select v-model="selectedStoreId" required @change="onStoreSelect" :disabled="!isAdmin && userData?.assignedStore">
              <option value="">Select a store</option>
              <option v-for="store in availableStores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
            <span v-if="!isAdmin && userData?.assignedStore" class="hint" style="color: #2563eb;">
              📌 Using your assigned store: {{ userData?.assignedStore?.name }}
            </span>
          </div>

          <!-- Step 2: Select Requests -->
         <!-- In the process modal - Step 2: Select Requests -->
<div v-if="selectedStoreId && storeRequests.length > 0" class="form-group">
  <label>2. Select Requests to Process</label>
  <div class="select-all-container">
    <label class="select-all-label">
      <input type="checkbox" v-model="selectAllRequests" @change="toggleAllRequests" />
      Select All ({{ storeRequests.length }} requests)
    </label>
  </div>
  <div class="requests-checkbox-list">
    <label v-for="req in storeRequests" :key="req.id" class="request-checkbox">
      <input type="checkbox" v-model="selectedRequestIds" :value="req.id" @change="onRequestSelect" />
      <div class="request-info">
        <span class="req-code">{{ req.requestCode }}</span>
        <span class="req-date">{{ formatDate(req.requestedDate) }}</span>
        <span class="req-items-count">{{ req.items?.length || 0 }} items</span>
        <!-- ✅ Show action based on store role -->
        <span class="req-action" :class="getItemActionClass(req)">
          {{ getItemActionLabel(req) }}
        </span>
        <!-- ✅ Show processing status -->
        <span v-if="req.isProcessedByGroup" class="req-status processed">
          ✅ Processed
        </span>
        <span v-else class="req-status pending">
          ⏳ Pending
        </span>
      </div>
    </label>
  </div>
</div>

          <!-- Step 3: Select Group - PRE-SELECTED FOR NON-ADMIN -->
          <div class="form-group" v-if="selectedRequestIds.length > 0">
            <label>3. Select Group to Apply Changes *</label>
            <select v-model="selectedGroupId" required :disabled="!isAdmin && userData?.assignedGroup">
              <option value="">Select a group</option>
              <option v-for="group in availableGroups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
            <span v-if="!isAdmin && userData?.assignedGroup" class="hint" style="color: #2563eb;">
              📌 Using your assigned group: {{ userData?.assignedGroup?.name }}
            </span>
          </div>

          <!-- Preview Selected Requests -->
          <div v-if="selectedRequestIds.length > 0 && selectedGroupId" class="requests-preview">
            <div class="preview-header">
              <span>📋 {{ selectedRequestIds.length }} request(s) selected</span>
              <span class="badge-info">{{ getSelectedTotalItems() }} total items</span>
            </div>
            <div class="requests-list">
              <div v-for="req in selectedRequests" :key="req.id" class="request-item">
                <div class="request-header">
                  <span class="request-code">{{ req.requestCode }}</span>
                  <span class="request-date">{{ formatDate(req.requestedDate) }}</span>
                </div>
                <div class="request-items">
                  <div v-for="item in req.items" :key="item.itemId" class="request-item-detail">
                    <span>{{ getItemName(item.itemId) }}</span>
                    <span class="item-qty">× {{ item.quantity }}</span>
                    <span class="item-uom">{{ getItemUnit(item.itemId) }}</span>
                    <span class="item-action" :class="getItemActionClass(req)">
                      {{ getItemActionLabel(req) }}
                    </span>
                  </div>
                </div>
                <div class="request-remark" v-if="req.remark">
                  <span class="remark-label">Remark:</span> {{ req.remark }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedStoreId && storeRequests.length === 0" class="no-requests">
            <span class="no-requests-icon">✅</span>
            <p>No approved requests found for this store.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeProcessModal">Cancel</button>
          <button 
            class="btn-primary" 
            @click="confirmProcessRequests" 
            :disabled="!selectedStoreId || selectedRequestIds.length === 0 || !selectedGroupId || processing"
          >
            {{ processing ? 'Processing...' : `Process ${selectedRequestIds.length} Request(s)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOGGLE STATUS CONFIRMATION ==================== -->
    <div v-if="showToggleModal" class="modal-overlay" @click.self="closeToggleModal">
      <div class="modal-container toggle-modal">
        <div class="modal-header">
          <h3>{{ toggleItem?.status === 'Active' ? '⏸️' : '▶️' }} Confirm Status Change</h3>
          <button class="modal-close" @click="closeToggleModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="toggle-icon">🔄</div>
          <p><strong>Item:</strong> {{ toggleItem ? getItemName(toggleItem.itemId) : '' }}</p>
          <p><strong>Current Status:</strong> 
            <span :class="['status-badge', toggleItem?.status.toLowerCase()]">
              {{ toggleItem?.status }}
            </span>
          </p>
          <p><strong>New Status:</strong> 
            <span :class="['status-badge', toggleNewStatus?.toLowerCase()]">
              {{ toggleNewStatus }}
            </span>
          </p>
          <p class="warning-text">⚠️ Are you sure you want to change the status?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeToggleModal">Cancel</button>
          <button class="btn-primary" @click="confirmToggle">Confirm</button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Balance Data</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Balance Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary by Store
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button class="btn-primary" @click="exportSelectedReport" :disabled="exporting">
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import balanceService from '@/stores/balanceService'

// ================================================================
// USER DATA
// ================================================================

const getUserData = () => {
  try {
    const data = JSON.parse(localStorage.getItem('user') || '{}')
    console.log('👤 User data from localStorage:', data)
    return data
  } catch (error) {
    console.error('Error parsing user data:', error)
    return {}
  }
}

const userData = ref(getUserData())
const isAdmin = computed(() => userData.value?.isAdmin || false)

// ================================================================
// STORE DATA - Will be populated from API
// ================================================================
const stores = ref([])

// ================================================================
// GROUPS DATA - Will be populated from API
// ================================================================
const allGroups = ref([])

// ================================================================
// INVENTORY ITEMS - Will be populated from API
// ================================================================
const inventoryItems = ref([])

// ================================================================
// BALANCE DATA - Will be populated from API
// ================================================================
const balances = ref([])

// ================================================================
// ITEM REQUESTS - Will be populated from API
// ================================================================
const itemRequests = ref([])

// ================================================================
// LOADING STATES
// ================================================================
const isLoading = ref(false)
const isLoadingStores = ref(false)
const isLoadingGroups = ref(false)
const isLoadingItems = ref(false)
const isLoadingRequests = ref(false)

// ================================================================
// STATE
// ================================================================
const searchQuery = ref('')
const filterStore = ref('')
const filterGroup = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const showBalanceModal = ref(false)
const editingBalance = ref(null)
const showToggleModal = ref(false)
const toggleItem = ref(null)
const toggleNewStatus = ref('')
const exporting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)

// Balance Modal Tabs
const initTab = ref('manual')
const saving = ref(false)

// Import State
const csvFile = ref(null)
const csvFileInput = ref(null)
const isDragOver = ref(false)
const importPreviewData = ref([])
const importResults = ref(null)
const importing = ref(false)
const importProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  remaining: 0,
  percentage: 0
})

// Delete Modal State
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// Process Requests State
const showProcessModal = ref(false)
const selectedStoreId = ref('')
const selectedGroupId = ref('')
const selectedRequestIds = ref([])
const storeRequests = ref([])
const processing = ref(false)
const selectAllRequests = ref(false)

const form = ref({
  storeId: '',
  groupId: '',
  itemId: '',
  balance: 0,
  status: 'Active',
  minStock: 0,
})

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED - AVAILABLE DATA BASED ON USER ROLE
// ================================================================

const availableStores = computed(() => {
  if (isAdmin.value) {
    return stores.value
  }
  if (userData.value?.assignedStore) {
    return stores.value.filter(s => s.id === userData.value.assignedStore.id)
  }
  return []
})

const availableGroups = computed(() => {
  if (isAdmin.value) {
    return allGroups.value
  }
  if (userData.value?.assignedGroup) {
    return allGroups.value.filter(g => g.id === userData.value.assignedGroup.id)
  }
  return []
})

// ================================================================
// COMPUTED - FILTERED BALANCES
// ================================================================

const hasActiveFilters = computed(() => {
  return filterStore.value || filterGroup.value || filterStatus.value || searchQuery.value
})

const filteredBalances = computed(() => {
  console.log('🔄 Computing filtered balances...')
  console.log('📊 Raw balances:', balances.value.length)
  
  let result = [...balances.value]
  
  // 🔥 FIRST: Filter by user's assigned store/group if not admin
  if (!isAdmin.value && userData.value?.hasAccess) {
    const assignedStoreId = userData.value.assignedStore?.id
    const assignedGroupId = userData.value.assignedGroup?.id
    
    console.log('🔒 Filtering by assigned store ID:', assignedStoreId)
    console.log('🔒 Filtering by assigned group ID:', assignedGroupId)
    
    if (assignedStoreId) {
      result = result.filter(item => item.storeId === assignedStoreId)
      console.log('📊 After store filter:', result.length)
    }
    if (assignedGroupId) {
      result = result.filter(item => item.groupId === assignedGroupId)
      console.log('📊 After group filter:', result.length)
    }
  }
  
  // 🔥 THEN: Apply UI filters (search, store, group, status)
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      const itemName = (item.itemName || getItemName(item.itemId) || '').toLowerCase()
      const itemCode = (item.itemCode || getItemCode(item.itemId) || '').toLowerCase()
      const storeName = (item.storeName || getStoreName(item.storeId) || '').toLowerCase()
      return itemName.includes(s) || itemCode.includes(s) || storeName.includes(s)
    })
  }
  
  // 🔥 Apply store filter if filterStore has a valid value
  if (filterStore.value && filterStore.value !== '') {
    const storeId = Number(filterStore.value)
    if (!isNaN(storeId)) {
      result = result.filter(item => item.storeId === storeId)
    }
  }
  
  // 🔥 Apply group filter if filterGroup has a valid value
  if (filterGroup.value && filterGroup.value !== '') {
    const groupId = Number(filterGroup.value)
    if (!isNaN(groupId)) {
      result = result.filter(item => item.groupId === groupId)
    }
  }
  
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  console.log('✅ Final filtered count:', result.length)
  return result
})

// ================================================================
// COMPUTED - PAGINATED DATA (For display in table)
// ================================================================

const paginatedBalances = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  const paginated = filteredBalances.value.slice(start, end)
  console.log('📄 Paginated items:', paginated.length, 'Page:', currentPage.value)
  return paginated
})

const totalPages = computed(() => {
  return Math.ceil(filteredBalances.value.length / pageSize.value) || 1
})

// ================================================================
// COMPUTED - STATS
// ================================================================

const totalStores = computed(() => {
  const uniqueStores = new Set(filteredBalances.value.map(item => item.storeId))
  return uniqueStores.size
})

const totalItems = computed(() => {
  return filteredBalances.value.length
})

const lowStockItems = computed(() => {
  return filteredBalances.value.filter(item => 
    item.balance <= item.minStock && item.balance > 0
  ).length
})

const pendingRequestsCount = computed(() => {
  // Count requests that are approved and NOT yet processed by this group
  return itemRequests.value.filter(req => {
    if (req.status !== 'approved') return false
    // The backend already filters out processed requests via getApprovedRequests
    // So all requests in itemRequests are unprocessed for this group
    return true
  }).length
})

const selectedRequests = computed(() => {
  return storeRequests.value.filter(req => selectedRequestIds.value.includes(req.id))
})

// ================================================================
// HELPER METHODS
// ================================================================

const getItemName = (itemId) => {
  if (!itemId) return 'Unknown'
  const balance = balances.value.find(b => b.itemId === itemId)
  if (balance) return balance.itemName || 'Unknown'
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.standardName || item.name : 'Unknown'
}

const getItemCode = (itemId) => {
  if (!itemId) return 'N/A'
  const balance = balances.value.find(b => b.itemId === itemId)
  if (balance) return balance.itemCode || 'N/A'
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.code : 'N/A'
}

const getItemCommonName = (itemId) => {
  if (!itemId) return ''
  const balance = balances.value.find(b => b.itemId === itemId)
  if (balance) return balance.itemCommonName || ''
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.standardName || item.name : ''
}

const getItemUnit = (itemId) => {
  if (!itemId) return ''
  const balance = balances.value.find(b => b.itemId === itemId)
  if (balance) return balance.uomCode || ''
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.uomCode || '' : ''
}

const getBaseUOM = (itemId) => {
  if (!itemId) return ''
  const balance = balances.value.find(b => b.itemId === itemId)
  if (balance) return balance.conversionUomCode || balance.uomCode || ''
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.conversionUomCode || item.uomCode || '' : ''
}

const getConversionValue = (itemId) => {
  if (!itemId) return 1
  const balance = balances.value.find(b => b.itemId === itemId)
  if (balance) return balance.conversionValue || 1
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.conversionValue || 1 : 1
}

const getBaseBalance = (item) => {
  const conversionValue = getConversionValue(item.itemId)
  return item.balance * conversionValue
}

const getStoreName = (storeId) => {
  if (!storeId) return 'Unknown'
  const balance = balances.value.find(b => b.storeId === storeId)
  if (balance) return balance.storeName || 'Unknown'
  const store = availableStores.value.find(s => s.id === storeId)
  return store ? store.name : 'Unknown'
}

const getGroupName = (groupId) => {
  if (!groupId) return 'Unknown'
  const balance = balances.value.find(b => b.groupId === groupId)
  if (balance) return balance.groupName || 'Unknown'
  const group = availableGroups.value.find(g => g.id === groupId)
  return group ? group.name : 'Unknown'
}

const getItemNameByCode = (itemCode) => {
  if (!itemCode) return null
  const item = inventoryItems.value.find(i => i.code === itemCode)
  return item ? item.standardName || item.name : null
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const getBalanceClass = (item) => {
  if (item.balance === 0) return 'zero'
  if (item.balance <= item.minStock) return 'low'
  return 'normal'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getItemActionLabel = (req) => {
  if (selectedStoreId.value === String(req.askingStoreId)) {
    return '➕ ADD to balance'
  } else if (selectedStoreId.value === String(req.supplyingStoreId)) {
    return '➖ REMOVE from balance'
  }
  return ''
}

const getItemActionClass = (req) => {
  if (selectedStoreId.value === String(req.askingStoreId)) {
    return 'action-add'
  } else if (selectedStoreId.value === String(req.supplyingStoreId)) {
    return 'action-remove'
  }
  return ''
}

const getSelectedTotalItems = () => {
  let total = 0
  selectedRequests.value.forEach(req => {
    total += req.items.length
  })
  return total
}

// ================================================================
// UI HELPERS
// ================================================================

const onItemChange = () => {
  if (!editingBalance.value) {
    form.value.balance = 0
  }
}

const onBalanceChange = () => {}

// ================================================================
// API METHODS
// ================================================================

const fetchStores = async () => {
  isLoadingStores.value = true
  try {
    const response = await balanceService.getStores()
    stores.value = response.data || []
    console.log('🏪 Stores loaded:', stores.value.length)
  } catch (error) {
    console.error('Error fetching stores:', error)
    showToastMessage('Failed to load stores', 'error')
  } finally {
    isLoadingStores.value = false
  }
}

const fetchGroups = async () => {
  isLoadingGroups.value = true
  try {
    const response = await balanceService.getGroups()
    allGroups.value = response.data || []
    console.log('📋 Groups loaded:', allGroups.value.length)
  } catch (error) {
    console.error('Error fetching groups:', error)
    showToastMessage('Failed to load groups', 'error')
  } finally {
    isLoadingGroups.value = false
  }
}

const fetchItems = async () => {
  isLoadingItems.value = true
  try {
    const response = await balanceService.getActiveItems()
    inventoryItems.value = response.data || []
    console.log('📦 Items loaded:', inventoryItems.value.length)
  } catch (error) {
    console.error('Error fetching items:', error)
    showToastMessage('Failed to load items', 'error')
  } finally {
    isLoadingItems.value = false
  }
}

const fetchBalances = async () => {
  isLoading.value = true
  try {
    const filters = {}
    
    // 🔥 If not admin, filter by their assigned store and group
    if (!isAdmin.value && userData.value?.hasAccess) {
      if (userData.value.assignedStore) {
        filters.assignedStoreId = userData.value.assignedStore.id
        console.log('🔒 API Filtering by assigned store:', userData.value.assignedStore.id)
      }
      if (userData.value.assignedGroup) {
        filters.assignedGroupId = userData.value.assignedGroup.id
        console.log('🔒 API Filtering by assigned group:', userData.value.assignedGroup.id)
      }
    }
    
    // 🔥 Add UI filters if they have valid values
    if (filterStore.value && filterStore.value !== '') {
      const storeId = Number(filterStore.value)
      if (!isNaN(storeId)) {
        filters.storeId = storeId
        console.log('🔍 UI Store filter:', storeId)
      }
    }
    if (filterGroup.value && filterGroup.value !== '') {
      const groupId = Number(filterGroup.value)
      if (!isNaN(groupId)) {
        filters.groupId = groupId
        console.log('🔍 UI Group filter:', groupId)
      }
    }
    if (filterStatus.value) {
      filters.status = filterStatus.value
      console.log('🔍 UI Status filter:', filterStatus.value)
    }
    if (searchQuery.value) {
      filters.search = searchQuery.value
      console.log('🔍 UI Search filter:', searchQuery.value)
    }
    
    filters.page = currentPage.value
    filters.limit = 100
    
    console.log('📊 Fetching balances with filters:', filters)
    
    const response = await balanceService.getBalances(filters)
    balances.value = response.data || []
    console.log('✅ Balances loaded:', balances.value.length)
    if (balances.value.length > 0) {
      console.log('✅ First balance:', balances.value[0])
    }
    
    if (response.pagination) {
      currentPage.value = response.pagination.page
    }
    
  } catch (error) {
    console.error('Error fetching balances:', error)
    showToastMessage('Failed to load balances', 'error')
  } finally {
    isLoading.value = false
  }
}

// ================================================================
// 🔥 FETCH APPROVED REQUESTS - FIXED
// ================================================================

// ================================================================
// 🔥 FETCH APPROVED REQUESTS - FIXED
// ================================================================

const fetchApprovedRequests = async () => {
  isLoadingRequests.value = true
  try {
    let response
    
    if (!isAdmin.value && userData.value?.hasAccess && userData.value.assignedStore) {
      const storeId = userData.value.assignedStore.id
      const groupId = userData.value.assignedGroup?.id
      
      console.log('🔍 Fetching approved requests for store:', storeId, 'group:', groupId)
      
      // ✅ Pass both storeId and groupId to filter out already processed requests
      response = await balanceService.getApprovedRequests(storeId, groupId)
    } else if (isAdmin.value) {
      console.log('📋 Admin: Fetching all approved requests')
      response = await balanceService.getApprovedRequests(0)
    } else {
      console.log('⚠️ No store assigned, fetching all approved requests')
      response = await balanceService.getApprovedRequests(0)
    }
    
    // ✅ Store only unprocessed requests (backend already filters)
    itemRequests.value = response.data || []
    
    // ✅ Log the count for debugging
    console.log(`📋 ${itemRequests.value.length} unprocessed approved requests loaded`)
    
  } catch (error) {
    console.error('Error fetching approved requests:', error)
    showToastMessage('Failed to load approved requests', 'error')
  } finally {
    isLoadingRequests.value = false
  }
}

// ================================================================
// FILTERS & PAGINATION
// ================================================================

const onSearchChange = () => { 
  currentPage.value = 1
  fetchBalances()
}

const onFilterChange = () => { 
  currentPage.value = 1
  fetchBalances()
}

const clearFilters = () => {
  filterStore.value = ''
  filterGroup.value = ''
  filterStatus.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  fetchBalances()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
  fetchBalances()
}

// ================================================================
// BALANCE CRUD
// ================================================================

// ================================================================
// BALANCE CRUD - UPDATED WITH USER PREFILL
// ================================================================

// ================================================================
// BALANCE CRUD
// ================================================================

const openAddBalanceModal = () => {
  editingBalance.value = null
  initTab.value = 'manual'
  csvFile.value = null
  importPreviewData.value = []
  importResults.value = null
  importProgress.value = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: 0,
    percentage: 0
  }
  
  // 🔥 Pre-fill store and group for non-admin users
  if (!isAdmin.value && userData.value?.hasAccess) {
    // Get the assigned store and group from user data
    const assignedStoreId = userData.value.assignedStore?.id
    const assignedGroupId = userData.value.assignedGroup?.id
    const assignedStoreName = userData.value.assignedStore?.name
    const assignedGroupName = userData.value.assignedGroup?.name
    
    // Validate that the assigned store and group exist in the available lists
    const storeExists = assignedStoreId ? availableStores.value.some(s => s.id === assignedStoreId) : false
    const groupExists = assignedGroupId ? availableGroups.value.some(g => g.id === assignedGroupId) : false
    
    // Pre-fill the form with validated values
    form.value = {
      storeId: (assignedStoreId && storeExists) ? assignedStoreId : '',
      groupId: (assignedGroupId && groupExists) ? assignedGroupId : '',
      itemId: '',
      balance: 0,
      status: 'Active',
      minStock: 0,
    }
    
    console.log('📝 Form pre-filled with:', {
      storeId: form.value.storeId,
      storeName: assignedStoreName,
      groupId: form.value.groupId,
      groupName: assignedGroupName,
      storeExists,
      groupExists
    })
    
    // Show a toast with the pre-filled info
    if (form.value.storeId && form.value.groupId) {
      showToastMessage(`📌 Pre-filled with your assigned store: ${assignedStoreName} and group: ${assignedGroupName}`, 'info')
    } else if (form.value.storeId) {
      showToastMessage(`📌 Pre-filled with your assigned store: ${assignedStoreName}`, 'info')
    } else if (form.value.groupId) {
      showToastMessage(`📌 Pre-filled with your assigned group: ${assignedGroupName}`, 'info')
    } else {
      showToastMessage('⚠️ No assigned store or group found. Please select manually.', 'warning')
    }
  } else {
    // Admin or no assigned store/group - leave empty
    form.value = {
      storeId: '',
      groupId: '',
      itemId: '',
      balance: 0,
      status: 'Active',
      minStock: 0,
    }
  }
  
  showBalanceModal.value = true
}

const editBalance = (item) => {
  editingBalance.value = item
  initTab.value = 'manual'
  form.value = {
    storeId: item.storeId,
    groupId: item.groupId,
    itemId: item.itemId,
    balance: item.balance,
    status: item.status || 'Active',
    minStock: item.minStock || 0,
  }
  showBalanceModal.value = true
}

const closeBalanceModal = () => {
  if (importing.value) return
  showBalanceModal.value = false
  editingBalance.value = null
  csvFile.value = null
  importPreviewData.value = []
  importResults.value = null
  importProgress.value = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: 0,
    percentage: 0
  }
}

const saveBalance = async () => {
  if (!form.value.storeId) {
    showToastMessage('Please select a store', 'error')
    return
  }
  if (!form.value.groupId) {
    showToastMessage('Please select a group', 'error')
    return
  }
  if (!form.value.itemId) {
    showToastMessage('Please select an item', 'error')
    return
  }
  if (form.value.balance < 0) {
    showToastMessage('Balance cannot be negative', 'error')
    return
  }

  saving.value = true

  try {
    const payload = {
      storeId: Number(form.value.storeId),
      groupId: Number(form.value.groupId),
      itemId: Number(form.value.itemId),
      balance: Number(form.value.balance),
      minStock: Number(form.value.minStock) || 0,
      status: form.value.status || 'Active'
    }

    let response
    if (editingBalance.value) {
      response = await balanceService.updateBalance(editingBalance.value.id, payload)
      showToastMessage('Balance updated successfully!', 'success')
    } else {
      response = await balanceService.createBalance(payload)
      showToastMessage('Balance initialized successfully!', 'success')
    }

    await fetchBalances()
    closeBalanceModal()
  } catch (error) {
    console.error('Error saving balance:', error)
    if (error.response?.data?.error) {
      showToastMessage(error.response.data.error, 'error')
    } else {
      showToastMessage('Failed to save balance', 'error')
    }
  } finally {
    saving.value = false
  }
}

// ================================================================
// IMPORT FUNCTIONS
// ================================================================

const downloadTemplate = async () => {
  try {
    const blob = await balanceService.downloadTemplate()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `balance_import_template_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    showToastMessage('Template CSV downloaded successfully!', 'success')
  } catch (error) {
    console.error('Error downloading template:', error)
    showToastMessage('Failed to download template', 'error')
  }
}

const triggerCsvUpload = (event) => {
  if (importing.value) return
  if (csvFileInput.value) {
    csvFileInput.value.click()
  }
}

const handleCsvUpload = (event) => {
  const file = event.target.files[0]
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file
    parseCsvFile(file)
  } else {
    showToastMessage('Please upload a valid CSV file', 'error')
  }
  event.target.value = ''
}

const handleCsvDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file
    parseCsvFile(file)
  } else {
    showToastMessage('Please upload a valid CSV file', 'error')
  }
}

const removeCsvFile = () => {
  csvFile.value = null
  importPreviewData.value = []
  importResults.value = null
}

const parseCsvFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      const lines = text.split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#'))
      
      if (lines.length < 2) {
        showToastMessage('CSV file must contain headers and at least one data row', 'error')
        return
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      console.log('Headers:', headers)
      
      const requiredHeaders = ['storeid', 'groupid', 'balance']
      const hasItemId = headers.includes('itemid')
      const hasItemCode = headers.includes('itemcode')
      
      if (!hasItemId && !hasItemCode) {
        showToastMessage('CSV must contain either "itemId" or "itemCode" column', 'error')
        return
      }
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        showToastMessage(`Missing required headers: ${missingHeaders.join(', ')}`, 'error')
        return
      }
      
      const data = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj = {}
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || ''
        })
        
        const itemId = obj.itemid ? parseInt(obj.itemid) : null
        const itemCode = obj.itemcode || null
        
        if ((!itemId && !itemCode) || !obj.storeid || !obj.groupid || !obj.balance) {
          continue
        }
        
        const storeId = parseInt(obj.storeid)
        const groupId = parseInt(obj.groupid)
        const balance = parseFloat(obj.balance)
        
        if (isNaN(storeId) || isNaN(groupId) || isNaN(balance)) {
          console.warn(`Skipping row ${i + 1}: Invalid data`, obj)
          continue
        }
        
        data.push({
          storeId: storeId,
          groupId: groupId,
          itemId: itemId,
          itemCode: itemCode,
          balance: balance,
          minStock: parseInt(obj.minstock) || 0,
          status: obj.status || 'Active'
        })
      }
      
      console.log('Parsed data:', data)
      
      if (data.length === 0) {
        showToastMessage('No valid data found in CSV file. Please check the format.', 'error')
        importPreviewData.value = []
        return
      }
      
      importPreviewData.value = data
      showToastMessage(`Successfully parsed ${data.length} items from CSV`, 'success')
      
    } catch (error) {
      console.error('CSV parse error:', error)
      showToastMessage('Failed to parse CSV file. Please check the format.', 'error')
      importPreviewData.value = []
    }
  }
  reader.onerror = () => {
    showToastMessage('Failed to read file', 'error')
    importPreviewData.value = []
  }
  reader.readAsText(file)
}

const processImport = async () => {
  if (!csvFile.value || importPreviewData.value.length === 0) {
    showToastMessage('No data to import. Please upload a valid CSV file.', 'error')
    return
  }

  importing.value = true
  importResults.value = null
  
  const totalItems = importPreviewData.value.length
  importProgress.value = {
    total: totalItems,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: totalItems,
    percentage: 0
  }

  try {
    const response = await balanceService.importBalances(csvFile.value)
    
    importResults.value = response.data
    showToastMessage(`Import completed: ${response.data.success} imported, ${response.data.failed} failed`, response.data.failed > 0 ? 'warning' : 'success')
    
    await fetchBalances()
    
    if (response.data.failed === 0) {
      setTimeout(() => {
        closeBalanceModal()
      }, 1500)
    }
    
  } catch (error) {
    console.error('Import error:', error)
    showToastMessage('Failed to import balances', 'error')
  } finally {
    importing.value = false
  }
}

// ================================================================
// DELETE BALANCE
// ================================================================

const openDeleteModal = (item) => {
  if (item.status === 'Active') {
    showToastMessage('Cannot delete active balance. Please deactivate it first.', 'error')
    return
  }
  deleteTarget.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
}

const confirmDelete = async () => {
  if (deleteTarget.value) {
    try {
      await balanceService.deleteBalance(deleteTarget.value.id)
      showToastMessage(`Balance record for ${getItemName(deleteTarget.value.itemId)} deleted successfully!`, 'success')
      await fetchBalances()
    } catch (error) {
      console.error('Error deleting balance:', error)
      showToastMessage('Failed to delete balance', 'error')
    }
    closeDeleteModal()
  }
}

// ================================================================
// PROCESS REQUESTS
// ================================================================

const processApprovedRequests = async () => {
  // Clear previous selections
  selectedStoreId.value = ''
  selectedGroupId.value = ''
  selectedRequestIds.value = []
  storeRequests.value = []
  selectAllRequests.value = false
  
  // Show the modal
  showProcessModal.value = true
  
  // Auto-select for non-admin users
  if (!isAdmin.value && userData.value?.hasAccess) {
    if (userData.value.assignedStore) {
      selectedStoreId.value = String(userData.value.assignedStore.id)
      await onStoreSelect()
    }
    if (userData.value.assignedGroup) {
      selectedGroupId.value = String(userData.value.assignedGroup.id)
    }
  }
  
  // ✅ Refresh the pending count
  await fetchApprovedRequests()
}
const closeProcessModal = () => {
  showProcessModal.value = false
  selectedStoreId.value = ''
  selectedGroupId.value = ''
  selectedRequestIds.value = []
  storeRequests.value = []
  selectAllRequests.value = false
}

const onStoreSelect = async () => {
  selectedRequestIds.value = []
  storeRequests.value = []
  selectAllRequests.value = false
  selectedGroupId.value = ''
  
  if (!selectedStoreId.value) {
    console.log('⚠️ No store selected')
    return
  }
  
  if (!isAdmin.value && userData.value?.assignedStore) {
    if (Number(selectedStoreId.value) !== userData.value.assignedStore.id) {
      showToastMessage('You do not have access to this store', 'error')
      selectedStoreId.value = ''
      return
    }
  }
  
  try {
    const storeId = Number(selectedStoreId.value)
    const groupId = userData.value?.assignedGroup?.id
    
    console.log('🔍 Fetching approved requests for store ID:', storeId, 'group ID:', groupId)
    
    const response = await balanceService.getApprovedRequests(storeId, groupId)
    storeRequests.value = response.data || []
    
    console.log(`✅ Found ${storeRequests.value.length} unprocessed approved requests for store ${storeId}`)
    
    if (storeRequests.value.length > 0) {
      // ✅ Show each request with its status
      storeRequests.value.forEach(req => {
        console.log(`  📋 ${req.requestCode} - ${req.items?.length || 0} items`)
      })
      
      selectAllRequests.value = true
      selectedRequestIds.value = storeRequests.value.map(req => req.id)
    } else {
      selectAllRequests.value = false
      selectedRequestIds.value = []
      showToastMessage('✅ No pending requests for this store', 'info')
    }
  } catch (error) {
    console.error('Error fetching approved requests:', error)
    showToastMessage('Failed to fetch approved requests', 'error')
  }
}

const toggleAllRequests = () => {
  if (selectAllRequests.value) {
    selectedRequestIds.value = storeRequests.value.map(req => req.id)
  } else {
    selectedRequestIds.value = []
  }
}

const onRequestSelect = () => {
  if (selectedRequestIds.value.length === storeRequests.value.length) {
    selectAllRequests.value = true
  } else {
    selectAllRequests.value = false
  }
}

const confirmProcessRequests = async () => {
  if (!selectedStoreId.value || selectedRequestIds.value.length === 0 || !selectedGroupId.value) {
    showToastMessage('Please select a store, requests, and a group', 'warning')
    return
  }
  
  if (!isAdmin.value && userData.value?.assignedGroup) {
    if (Number(selectedGroupId.value) !== userData.value.assignedGroup.id) {
      showToastMessage('You do not have access to this group', 'error')
      return
    }
  }
  
  processing.value = true

  try {
    const response = await balanceService.processRequests({
      storeId: Number(selectedStoreId.value),
      groupId: Number(selectedGroupId.value),
      requestIds: selectedRequestIds.value.map(id => Number(id))
    })

    if (response.success) {
      const { 
        processed, 
        failed, 
        missingItems, 
        processedItems, 
        autoInitializedItems, 
        partialRequests,
        logs,
        processedRequestIds,
        totalRequests
      } = response.data || {}
      
      // ✅ Get the IDs that were processed (or already processed)
      const processedIds = processedRequestIds || []
      
      // ✅ Remove ALL processed requests from the list
      // This includes both newly processed and already processed ones
      storeRequests.value = storeRequests.value.filter(
        req => !processedIds.includes(req.id)
      )
      
      // ✅ Update selected request IDs
      selectedRequestIds.value = storeRequests.value.map(req => req.id)
      
      // ✅ Build a clear message
      let message = ''
      let hasErrors = false
      
      // Check if any items were actually processed
      if (processed > 0 || processedItems?.length > 0) {
        message += `✅ Processed ${processed || processedItems?.length || 0} items successfully. `
      }
      
      // Check for auto-initialized items
      if (autoInitializedItems && autoInitializedItems.length > 0) {
        message += `\n📦 Auto-initialized ${autoInitializedItems.length} item(s): `
        autoInitializedItems.slice(0, 3).forEach(item => {
          message += `${item.itemCode || item.itemName}, `
        })
        if (autoInitializedItems.length > 3) {
          message += `+${autoInitializedItems.length - 3} more. `
        }
      }
      
      // Check for missing items
      if (missingItems && missingItems.length > 0) {
        hasErrors = true
        message += `\n⚠️ ${missingItems.length} item(s) need initialization: `
        missingItems.slice(0, 3).forEach(item => {
          message += `${item.itemCode || 'Unknown'}, `
        })
        if (missingItems.length > 3) {
          message += `+${missingItems.length - 3} more. `
        }
        message += `\n💡 Please initialize these items first.`
      }
      
      // ✅ Check if requests were already processed by this group
      const alreadyProcessedCount = processedIds.length - (processedItems?.length || 0)
      
      if (alreadyProcessedCount > 0 && processed === 0) {
        message += `\n⏭️ ${alreadyProcessedCount} request(s) were already processed by your group and have been removed from your list.`
      }
      
      // ✅ Show partial request status
      if (partialRequests && partialRequests.length > 0) {
        message += `\n\n⏳ ${partialRequests.length} request(s) partially processed:`
        partialRequests.forEach(req => {
          const remainingNames = req.remainingGroups.join(', ')
          message += `\n   • ${req.requestCode}: ${req.remainingCount} group(s) remaining (${remainingNames})`
        })
        message += `\n\n💡 The request will be finalized when ALL groups have processed it.`
      }
      
      // ✅ If no message was built, use a default
      if (!message) {
        message = response.message || 'Requests processed!'
      }
      
      // ✅ Check if any requests are still pending
      const remainingCount = storeRequests.value.length
      
      if (remainingCount === 0) {
        message += `\n\n🎉 All requests have been processed by your group!`
        
        // Close the modal after a delay
        setTimeout(() => {
          closeProcessModal()
          showToastMessage('🎉 All requests processed by your group!', 'success')
        }, 2000)
      } else {
        message += `\n\n📋 ${remainingCount} request(s) remaining in your list.`
      }
      
      showToastMessage(message, hasErrors ? 'warning' : 'success')
      
      // ✅ Refresh data
      await Promise.all([
        fetchBalances(),
        fetchApprovedRequests()
      ])
      
    } else {
      showToastMessage(response.error || 'Failed to process requests', 'error')
    }
  } catch (error) {
    console.error('Error processing requests:', error)
    showToastMessage(error.response?.data?.error || 'Error processing requests', 'error')
  } finally {
    processing.value = false
  }
}

// ================================================================
// TOGGLE STATUS
// ================================================================

const toggleStatus = (item) => {
  toggleItem.value = item
  toggleNewStatus.value = item.status === 'Active' ? 'Inactive' : 'Active'
  showToggleModal.value = true
}

const closeToggleModal = () => {
  showToggleModal.value = false
  toggleItem.value = null
  toggleNewStatus.value = ''
}

const confirmToggle = async () => {
  if (toggleItem.value) {
    try {
      await balanceService.toggleStatus(toggleItem.value.id)
      showToastMessage(`Status changed to ${toggleNewStatus.value}`, 'success')
      await fetchBalances()
    } catch (error) {
      console.error('Error toggling status:', error)
      showToastMessage('Failed to change status', 'error')
    }
    closeToggleModal()
  }
}

// ================================================================
// PRINT & EXPORT
// ================================================================

const printReport = () => {
  const printContents = document.getElementById('printable-area').innerHTML
  const originalContents = document.body.innerHTML
  
  document.body.innerHTML = `
    <html>
      <head>
        <title>Store Balance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <h2>💰 Store Balance Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        ${printContents}
        <div class="print-footer">Printed from Store Management System</div>
      </body>
    </html>
  `
  
  window.print()
  document.body.innerHTML = originalContents
  window.location.reload()
}

const openExportModal = () => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportSelectedReport = async () => {
  exporting.value = true
  try {
    const blob = await balanceService.exportBalances(exportType.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `store_balance_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showToastMessage('Export completed successfully!', 'success')
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export data', 'error')
  } finally {
    exporting.value = false
    closeExportModal()
  }
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE HOOKS
// ================================================================

onMounted(async () => {
  userData.value = getUserData()
  console.log('👤 User data loaded:', userData.value)
  console.log('👑 Is Admin:', isAdmin.value)
  console.log('🏪 Assigned Store:', userData.value.assignedStore)
  console.log('📋 Assigned Group:', userData.value.assignedGroup)
  
  // Fetch all data
  await Promise.all([
    fetchStores(),
    fetchGroups(),
    fetchItems(),
    fetchBalances()
  ])
  
  // 🔥 FIX: Set filter values for non-admin users
  if (!isAdmin.value && userData.value?.hasAccess) {
    if (userData.value.assignedStore) {
      filterStore.value = String(userData.value.assignedStore.id)
      console.log('🔒 Auto-selected store filter:', userData.value.assignedStore.name, 'ID:', userData.value.assignedStore.id)
    }
    if (userData.value.assignedGroup) {
      filterGroup.value = String(userData.value.assignedGroup.id)
      console.log('🔒 Auto-selected group filter:', userData.value.assignedGroup.name, 'ID:', userData.value.assignedGroup.id)
    }
    
    // Refresh balances with filters applied
    await fetchBalances()
  }
  
  // 🔥 FIX: Fetch approved requests after user data is loaded
  await fetchApprovedRequests()
})

// Watch for user data changes
watch(() => localStorage.getItem('user'), (newVal) => {
  if (newVal) {
    userData.value = getUserData()
    console.log('👤 User data updated:', userData.value)
    // Refresh data when user changes
    fetchBalances()
    fetchApprovedRequests()
  }
})
</script>

<style scoped>

.req-status {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 4px;
}

.req-status.processed {
  color: #16a34a;
  background: #dcfce7;
}

.req-status.pending {
  color: #f59e0b;
  background: #fef3c7;
}
.badge-count {
  display: inline-block;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 12px;
  margin-left: 4px;
}
/* In the style section, add these */
.hint.pre-filled {
  color: #2563eb;
  font-weight: 500;
}

.hint.warning {
  color: #f59e0b;
  font-weight: 500;
}

.hint.info {
  color: #3b82f6;
}

select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

select:disabled + .hint {
  margin-top: 4px;
}
/* ================================================================
   SECTION CARD
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
  gap: 16px;
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

.header-actions {
  display: flex;
  gap: 10px;
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
  width: 200px;
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
  white-space: nowrap;
}

.btn-add:hover {
  background: #2563eb;
}

.btn-process-requests {
  background: #8b5cf6;
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
  white-space: nowrap;
}

.btn-process-requests:hover {
  background: #7c3aed;
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

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-print {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-print:hover {
  background: #7c3aed;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #059669;
}

/* ================================================================
   STATS
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.stat-card:hover {
  background: #f1f5f9;
}

.stat-icon {
  font-size: 24px;
  background: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.balance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 700px;
}

.balance-table th,
.balance-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.balance-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center {
  text-align: center;
}

.store-name {
  font-weight: 500;
  font-size: 12px;
}

.item-name-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
}

.standard-name {
  font-size: 12px;
  color: #1e293b;
}

.common-name {
  font-size: 10px;
  color: #94a3b8;
}

.group-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.uom-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.uom-code {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.conversion-info {
  font-size: 9px;
  color: #64748b;
}

.conversion-info.base {
  color: #94a3b8;
  font-style: italic;
}

.balance-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.balance-value {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 3px;
}

.balance-value.normal {
  color: #166534;
}

.balance-value.low {
  color: #f59e0b;
}

.balance-value.zero {
  color: #ef4444;
}

.base-balance {
  font-size: 10px;
  color: #94a3b8;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* ================================================================
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  flex-wrap: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 3px 5px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fee2e2;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.limit-select {
  padding: 3px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
}

/* ================================================================
   MODALS
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.process-modal .modal-container {
  max-width: 650px;
}

.toggle-modal .modal-container {
  max-width: 380px;
}

.export-modal .modal-container {
  max-width: 380px;
}

.delete-modal .modal-container {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* ================================================================
   FORMS
   ================================================================ */
.balance-form .form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.balance-form .form-group {
  flex: 1;
  min-width: 120px;
}

.balance-form .form-group label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.balance-form .form-group input,
.balance-form .form-group select {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
}

.balance-form .form-group input:focus,
.balance-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.balance-form .form-group input:read-only {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.balance-form .hint {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.process-modal .form-group {
  margin-bottom: 12px;
}

.process-modal .form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.process-modal .form-group select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.process-modal .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* ================================================================
   INITIALIZE BALANCE TABS
   ================================================================ */
.init-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
}

.init-tab {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  background: transparent;
  color: #64748b;
  transition: all 0.2s;
  font-weight: 500;
}

.init-tab.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.init-tab:hover:not(.active) {
  background: #e2e8f0;
}

/* ================================================================
   IMPORT STYLES
   ================================================================ */
.import-info {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  margin-bottom: 16px;
}

.import-info .info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-text {
  font-size: 13px;
  color: #475569;
  margin: 4px 0;
}

.csv-format-list {
  margin: 8px 0 12px 0;
  padding-left: 20px;
  font-size: 12px;
  color: #475569;
}

.csv-format-list li {
  margin: 3px 0;
}

.hint-text {
  color: #94a3b8;
  font-size: 11px;
}

.btn-template {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-template:hover:not(:disabled) {
  background: #d97706;
}

.btn-template:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.file-upload-area:hover:not(.disabled) {
  border-color: #3b82f6;
  background: #f8fafc;
}

.file-upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-upload-area.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.file-icon {
  font-size: 24px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #94a3b8;
}

.remove-file {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 16px;
  padding: 0 4px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-icon {
  font-size: 32px;
}

.upload-hint {
  font-size: 11px;
  color: #94a3b8;
}

/* Import Progress */
.import-progress {
  margin: 16px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-status {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
}

.status-success { color: #16a34a; }
.status-failed { color: #dc2626; }
.status-remaining { color: #475569; }

/* Import Preview */
.import-preview {
  margin-top: 16px;
}

.import-preview h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.preview-table-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table td {
  padding: 6px 12px;
  border-top: 1px solid #f1f5f9;
}

.preview-more {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  padding: 8px;
}

/* Import Results */
.import-results {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.result-summary {
  display: flex;
  gap: 16px;
  font-size: 14px;
  font-weight: 500;
}

.result-success { color: #16a34a; }
.result-failed { color: #dc2626; }
.result-total { color: #475569; }

.result-errors {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.result-errors ul {
  margin: 4px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: #dc2626;
}

.result-errors li {
  margin: 2px 0;
}

/* ================================================================
   PROCESS REQUESTS MODAL
   ================================================================ */
.process-info {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.process-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.process-info .info-icon {
  font-size: 16px;
}

.info-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.process-rules {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #475569;
}

.process-rules li {
  margin: 4px 0;
}

.text-success {
  color: #22c55e;
  font-weight: 600;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}

.requests-checkbox-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px;
}

.request-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.request-checkbox:hover {
  background: #f8fafc;
}

.request-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
}

.req-code {
  font-weight: 600;
  color: #2563eb;
}

.req-date {
  color: #94a3b8;
}

.req-items-count {
  color: #475569;
  font-size: 11px;
}

.req-action {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 4px;
}

.req-action.action-add {
  color: #22c55e;
  background: #dcfce7;
}

.req-action.action-remove {
  color: #ef4444;
  background: #fee2e2;
}

.select-all-container {
  margin-bottom: 8px;
  padding: 6px 0;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
}

.no-requests {
  text-align: center;
  padding: 30px 20px;
  color: #94a3b8;
}

.no-requests-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.requests-preview {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 500;
}

.badge-info {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
}

.requests-list {
  max-height: 250px;
  overflow-y: auto;
}

.request-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.request-item:last-child {
  border-bottom: none;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.request-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.request-date {
  font-size: 11px;
  color: #94a3b8;
}

.request-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.request-item-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1e293b;
}

.item-qty {
  font-weight: 600;
  color: #475569;
}

.item-uom {
  color: #94a3b8;
  font-size: 10px;
}

.item-action {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.item-action.action-add {
  color: #22c55e;
  background: #dcfce7;
}

.item-action.action-remove {
  color: #ef4444;
  background: #fee2e2;
}

.request-remark {
  margin-top: 4px;
  font-size: 11px;
  color: #64748b;
}

.remark-label {
  font-weight: 500;
  color: #94a3b8;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 3px solid #10b981;
  white-space: nowrap;
  max-width: 90vw;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

.toast.warning {
  border-left-color: #f59e0b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 30px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.3;
}

.empty-content p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

/* ================================================================
   DELETE MODAL
   ================================================================ */
.delete-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.delete-warning {
  color: #dc2626;
  font-weight: 600;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 13px;
  text-align: center;
}

.delete-question {
  font-size: 14px;
  color: #475569;
  text-align: center;
  margin-top: 8px;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

/* ================================================================
   TOGGLE MODAL
   ================================================================ */
.toggle-icon {
  font-size: 32px;
  text-align: center;
  margin-bottom: 6px;
}

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  margin-top: 10px;
  padding: 6px 10px;
  background: #fffbeb;
  border-radius: 4px;
  border: 1px solid #fef3c7;
  font-size: 13px;
}

/* ================================================================
   EXPORT MODAL
   ================================================================ */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

.init-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  margin-bottom: 14px;
  font-size: 13px;
  color: #1e293b;
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-add, .btn-print, .btn-export, .btn-process-requests, .search-box, .filter-bar, .pagination, .action-buttons, .icon-btn {
    display: none !important;
  }
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .balance-table th, .balance-table td {
    border: 1px solid #ddd !important;
  }
  .stats-grid {
    display: none !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .card-header { flex-wrap: wrap; }
  .header-actions { width: 100%; flex-wrap: wrap; }
  .search-box input { width: 100%; }
  .filter-bar { flex-direction: column; }
  .filter-bar select { width: 100%; }
  .filter-actions { width: 100%; margin-left: 0; justify-content: flex-start; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .pagination { flex-wrap: wrap; }
  .balance-form .form-row { flex-direction: column; }
  .modal-container { margin: 10px; max-width: 100% !important; }
  .process-modal .modal-container { max-width: 100% !important; }
  .request-header { flex-direction: column; align-items: flex-start; gap: 4px; }
  .request-items { flex-direction: column; gap: 2px; }
  .preview-header { flex-direction: column; gap: 4px; align-items: flex-start; }
  .request-info { flex-wrap: wrap; }
  .init-tabs { flex-direction: column; }
  .import-info { flex-direction: column; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .balance-table { font-size: 11px; min-width: 600px; }
  .requests-checkbox-list { max-height: 150px; }
  .requests-list { max-height: 150px; }
}
</style>