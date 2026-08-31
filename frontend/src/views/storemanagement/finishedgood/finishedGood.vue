<template>
  <div class="finished-goods-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">📦</div>
        <div>
          <h1 class="page-title">Finished Goods</h1>
          <p class="page-subtitle">Manage paint and fiber products</p>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-refresh" @click="loadData" :disabled="loading">
          🔄 {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        <button class="btn-add" @click="openCreateModal">
          ✚ Add Product
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-section">
      <div class="filter-bar">
        <div class="filter-group">
          <label>Product Type</label>
          <select v-model="filters.productType" @change="applyFilters">
            <option value="">All Types</option>
            <option value="Paint">Paint</option>
            <option value="Fiber">Fiber</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Status</label>
          <select v-model="filters.status" @change="applyFilters">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discontinued">Discontinued</option>
          </select>
        </div>
        <div class="filter-group search-group">
          <label>Search</label>
          <div class="search-wrapper">
            <input
              type="text"
              v-model="filters.search"
              placeholder="Search..."
              @input="applyFiltersDebounced"
            />
            <button v-if="filters.search" class="clear-search" @click="clearSearch">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">Total Products</span>
        <span class="stat-value">{{ stats.totalProducts }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Paint</span>
        <span class="stat-value">{{ stats.paintProducts }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Fiber</span>
        <span class="stat-value">{{ stats.fiberProducts }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Active</span>
        <span class="stat-value">{{ stats.activeProducts }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>FG Code</th>
            <th>Product Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedProducts.length === 0">
            <td colspan="6" class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No products found</p>
            </td>
          </tr>
          <tr v-for="(product, index) in paginatedProducts" :key="product.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td><span class="fg-code">{{ product.fgCode }}</span></td>
            <td>
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
              </div>
            </td>
            <td>
              <span :class="['type-badge', product.type.toLowerCase()]">
                {{ product.type }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', product.status.toLowerCase()]">
                {{ product.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn edit" @click="editProduct(product)" title="Edit">
                  ✏️
                </button>
                <button class="action-btn delete" @click="openDeleteModal(product)" title="Delete">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total > 0" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ←
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
      </select>
    </div>

    <!-- Create/Edit Modal with Tabs -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ modalMode === 'create' ? '✚ Add Product' : '✏️ Edit Product' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Tabs -->
          <div class="modal-tabs" v-if="modalMode === 'create'">
            <button
              class="modal-tab"
              :class="{ active: activeTab === 'manual' }"
              @click="activeTab = 'manual'"
            >
              ✍️ Manual Add
            </button>
            <button
              class="modal-tab"
              :class="{ active: activeTab === 'import' }"
              @click="activeTab = 'import'"
            >
              📥 Import
            </button>
          </div>

          <!-- Manual Tab -->
          <div v-if="activeTab === 'manual' || modalMode === 'edit'">
            <form @submit.prevent="saveProduct">
              <div class="form-grid">
                <div class="form-group">
                  <label>Product Name *</label>
                  <input type="text" v-model="form.name" required />
                </div>
                <div class="form-group">
                  <label>Product Type *</label>
                  <select v-model="form.type" required>
                    <option value="Paint">Paint</option>
                    <option value="Fiber">Fiber</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Status</label>
                  <select v-model="form.status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <!-- Import Tab -->
          <div v-if="activeTab === 'import' && modalMode === 'create'">
            <div class="import-info">
              <span class="info-icon">📄</span>
              <div>
                <p><strong>CSV Format Required:</strong></p>
                <p class="info-text">
                  Your CSV should have the following columns:
                </p>
                <ul class="csv-format-list">
                  <li>
                    <strong>productName</strong> - Product Name (required)
                    <span class="hint-text">e.g., Gloss White Paint</span>
                  </li>
                  <li>
                    <strong>productType</strong> - Product Type (required)
                    <span class="hint-text">Paint or Fiber</span>
                  </li>
                  <li>
                    <strong>status</strong> - Status (optional, defaults to Active)
                    <span class="hint-text">Active/Inactive/Discontinued</span>
                  </li>
                </ul>
                <button
                  class="btn-template"
                  @click="downloadTemplate"
                  :disabled="importing"
                >
                  📄 Download CSV Template
                </button>
              </div>
            </div>

            <!-- File Upload -->
            <div
              class="file-upload-area"
              @click="!importing && triggerCsvUpload($event)"
              :class="{ 'drag-over': isDragOver, disabled: importing }"
              @dragover.prevent="!importing && (isDragOver = true)"
              @dragleave.prevent="!importing && (isDragOver = false)"
              @drop.prevent="!importing && handleCsvDrop($event)"
            >
              <div v-if="csvFile" class="file-preview">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ csvFile.name }}</span>
                <span class="file-size">{{ formatFileSize(csvFile.size) }}</span>
                <button
                  type="button"
                  @click.stop="!importing && removeCsvFile()"
                  class="remove-file"
                  :disabled="importing"
                >
                  ✕
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <span class="upload-icon">📁</span>
                <span>Click to upload CSV file</span>
                <span class="upload-hint">or drag and drop</span>
                <span class="upload-hint">Supported formats: .csv</span>
              </div>
              <input
                type="file"
                ref="csvFileInput"
                accept=".csv"
                @change="handleCsvUpload"
                style="display: none"
                :disabled="importing"
              />
            </div>

            <!-- Import Progress -->
            <div v-if="importing" class="import-progress">
              <div class="progress-info">
                <span>Importing products...</span>
                <span>{{ importProgress.processed }} / {{ importProgress.total }}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: importProgress.percentage + '%' }"
                ></div>
              </div>
              <div class="progress-status">
                <span class="status-success">✅ {{ importProgress.success }}</span>
                <span class="status-failed">❌ {{ importProgress.failed }}</span>
                <span class="status-remaining">⏳ {{ importProgress.remaining }} remaining</span>
              </div>
            </div>

            <!-- Preview imported data -->
            <div
              v-if="importPreviewData.length > 0 && !importing"
              class="import-preview"
            >
              <h4>Preview ({{ importPreviewData.length }} items)</h4>
              <div class="preview-table-container">
                <table class="preview-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in importPreviewData.slice(0, 10)"
                      :key="index"
                    >
                      <td>{{ item.productName }}</td>
                      <td>{{ item.productType }}</td>
                      <td>{{ item.status || 'Active' }}</td>
                    </tr>
                    <tr v-if="importPreviewData.length > 10">
                      <td colspan="3" class="preview-more">
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
              <div
                v-if="importResults.errors && importResults.errors.length > 0"
                class="result-errors"
              >
                <p><strong>Errors:</strong></p>
                <ul>
                  <li
                    v-for="(err, idx) in importResults.errors.slice(0, 5)"
                    :key="idx"
                  >
                    {{ err }}
                  </li>
                  <li v-if="importResults.errors.length > 5">
                    ... and {{ importResults.errors.length - 5 }} more errors
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button
            v-if="activeTab === 'manual' || modalMode === 'edit'"
            class="btn-save"
            @click="saveProduct"
          >
            {{ modalMode === 'create' ? 'Create' : 'Update' }}
          </button>
          <button
            v-if="activeTab === 'import' && modalMode === 'create'"
            class="btn-save"
            @click="processImport"
            :disabled="!csvFile || importing || importPreviewData.length === 0"
          >
            {{ importing ? 'Importing...' : 'Import Products' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header delete-header">
          <div class="header-icon-wrapper">
            <span class="header-icon">🗑️</span>
          </div>
          <div>
            <h3>Confirm Delete</h3>
            <p class="header-subtitle">Are you sure you want to delete this product?</p>
          </div>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="delete-item-info" v-if="productToDelete">
            <div class="delete-row">
              <span class="delete-label">FG Code</span>
              <span class="delete-value">{{ productToDelete.fgCode }}</span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Product Name</span>
              <span class="delete-value">{{ productToDelete.name }}</span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Type</span>
              <span class="delete-value">{{ productToDelete.type }}</span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Status</span>
              <span class="delete-value">
                <span :class="['status-badge', productToDelete.status.toLowerCase()]">
                  {{ productToDelete.status }}
                </span>
              </span>
            </div>
          </div>

          <div class="delete-warning">
            <span class="warning-icon">⚠️</span>
            <span>This action cannot be undone. The product will be permanently deleted.</span>
          </div>
        </div>

        <div class="modal-footer delete-footer">
          <button class="btn-cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import finishedGoodService from '@/stores/finishedGoodService'

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref('create')
const activeTab = ref('manual')
const currentPage = ref(1)
const pageSize = ref(10)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const productToDelete = ref(null)
const deleting = ref(false)

// Data state
const products = ref([])
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
})

// Stats state
const statsData = ref({
  total: 0,
  paint: 0,
  fiber: 0,
  active: 0,
  inactive: 0,
  discontinued: 0
})

// Import state
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

const filters = ref({
  productType: '',
  status: '',
  search: ''
})

let searchTimeout = null

// ================================================================
// COMPUTED
// ================================================================
const stats = computed(() => ({
  totalProducts: statsData.value.total,
  paintProducts: statsData.value.paint,
  fiberProducts: statsData.value.fiber,
  activeProducts: statsData.value.active
}))

const filteredProducts = computed(() => {
  return products.value
})

const paginatedProducts = computed(() => {
  return products.value
})

const totalPages = computed(() => {
  return pagination.value.totalPages || 1
})

// ================================================================
// FORM
// ================================================================
const form = ref({
  id: null,
  name: '',
  type: 'Paint',
  status: 'Active'
})

// ================================================================
// METHODS
// ================================================================

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadProducts(), loadStats()])
  } catch (error) {
    console.error('Error loading data:', error)
    showToastMessage('Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

const loadProducts = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }

    if (filters.value.productType) params.type = filters.value.productType
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.search) params.search = filters.value.search

    const response = await finishedGoodService.getFinishedGoods(params)

    if (response.success) {
      products.value = response.data
      pagination.value = response.pagination
    }
  } catch (error) {
    console.error('Error loading products:', error)
    throw error
  }
}

const loadStats = async () => {
  try {
    const response = await finishedGoodService.getStats()
    if (response.success) {
      statsData.value = response.data
    }
  } catch (error) {
    console.error('Error loading stats:', error)
    throw error
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadProducts()
}

const applyFiltersDebounced = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadProducts()
  }, 300)
}

const clearSearch = () => {
  filters.value.search = ''
  currentPage.value = 1
  loadProducts()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadProducts()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  loadProducts()
}

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    type: 'Paint',
    status: 'Active'
  }
}

const openCreateModal = () => {
  modalMode.value = 'create'
  activeTab.value = 'manual'
  csvFile.value = null
  importPreviewData.value = []
  importResults.value = null
  
  resetForm()
  showModal.value = true
}

const editProduct = (product) => {
  modalMode.value = 'edit'
  activeTab.value = 'manual'
  form.value = { 
    id: product.id,
    name: product.name,
    type: product.type,
    status: product.status
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  csvFile.value = null
  importPreviewData.value = []
  importResults.value = null
}

const saveProduct = async () => {
  try {
    let response
    if (modalMode.value === 'create') {
      // FG Code will be auto-generated by backend
      response = await finishedGoodService.createFinishedGood({
        name: form.value.name,
        type: form.value.type,
        status: form.value.status
      })
    } else {
      response = await finishedGoodService.updateFinishedGood(form.value.id, {
        name: form.value.name,
        type: form.value.type,
        status: form.value.status
      })
    }

    if (response.success) {
      showToastMessage(response.message, 'success')
      closeModal()
      await loadData()
    }
  } catch (error) {
    console.error('Error saving product:', error)
    showToastMessage(error.error || 'Failed to save product', 'error')
  }
}

// ================================================================
// DELETE MODAL
// ================================================================

const openDeleteModal = (product) => {
  productToDelete.value = product
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  productToDelete.value = null
  deleting.value = false
}

const confirmDelete = async () => {
  if (productToDelete.value) {
    deleting.value = true
    try {
      const response = await finishedGoodService.deleteFinishedGood(productToDelete.value.id)
      if (response.success) {
        showToastMessage('✅ Product deleted successfully!', 'success')
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      showToastMessage(error.error || 'Failed to delete product', 'error')
    } finally {
      closeDeleteModal()
      deleting.value = false
    }
  }
}

// ================================================================
// IMPORT METHODS
// ================================================================

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const downloadTemplate = () => {
  finishedGoodService.downloadTemplate()
  showToastMessage('✅ Template downloaded successfully!', 'success')
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
      const parsed = finishedGoodService.parseCsvContent(text)
      importPreviewData.value = parsed
      showToastMessage(`Successfully parsed ${parsed.length} items from CSV`, 'success')
    } catch (error) {
      console.error('CSV parse error:', error)
      showToastMessage(error.message || 'Failed to parse CSV file', 'error')
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
    const response = await finishedGoodService.importFinishedGoods(csvFile.value)

    if (response.success) {
      importResults.value = response.data
      showToastMessage(response.message, response.data.failed > 0 ? 'warning' : 'success')
      await loadData()
      
      if (response.data.failed === 0) {
        setTimeout(() => {
          closeModal()
        }, 1500)
      }
    }
  } catch (error) {
    console.error('Import error:', error)
    showToastMessage(error.error || 'Failed to import products', 'error')
  } finally {
    importing.value = false
  }
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ================================================================ */
/* PAGE - MATCHES BALANCE CORRECTION STYLE */
/* ================================================================ */
.finished-goods-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f0f2f6;
  min-height: 100vh;
}

/* ================================================================ */
/* HEADER */
/* ================================================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 8px;
}

.btn-refresh {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
}
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: #22c55e;
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.btn-add:hover {
  background: #16a34a;
}

/* ================================================================ */
/* FILTERS */
/* ================================================================ */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.filter-group label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.filter-group select,
.filter-group input {
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}
.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-group {
  flex: 1;
  min-width: 150px;
}
.search-wrapper {
  position: relative;
}
.search-wrapper input {
  width: 100%;
  padding-right: 30px;
}
.clear-search {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
}

/* ================================================================ */
/* STATS */
/* ================================================================ */
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 80px;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 7px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.data-table tbody tr:hover {
  background: #f8fafc;
}

.fg-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  font-family: monospace;
}

.product-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.product-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.type-badge {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}
.type-badge.paint {
  background: #dbeafe;
  color: #1e40af;
}
.type-badge.fiber {
  background: #fef3c7;
  color: #92400e;
}

.status-badge {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}
.status-badge.active {
  background: #dcfce7;
  color: #166534;
}
.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.discontinued {
  background: #f1f5f9;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 4px;
}
.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-btn.edit {
  background: #fef3c7;
  color: #d97706;
}
.action-btn.edit:hover {
  background: #fde68a;
}
.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}
.action-btn.delete:hover {
  background: #fecaca;
}

/* ================================================================ */
/* LOADING */
/* ================================================================ */
.loading-state {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}
.empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.page-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}
.page-btn:hover:not(:disabled) {
  background: #f8fafc;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}

/* ================================================================ */
/* MODAL */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.modal-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}
.modal-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 14px 16px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 10px 16px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

/* Modal Tabs */
.modal-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.modal-tab {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s;
}
.modal-tab:hover {
  background: #f1f5f9;
}
.modal-tab.active {
  background: #dbeafe;
  color: #1e40af;
}

.btn-cancel {
  padding: 4px 14px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #cbd5e1;
}

.btn-save {
  padding: 4px 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.btn-save:hover {
  background: #2563eb;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.form-group label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
}
.form-group textarea {
  resize: vertical;
  min-height: 40px;
}

.full-width {
  grid-column: 1 / -1;
}

/* ================================================================ */
/* IMPORT STYLES */
/* ================================================================ */
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
.file-icon { font-size: 24px; }
.file-name { font-weight: 500; }
.file-size { font-size: 12px; color: #94a3b8; }

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
.upload-icon { font-size: 32px; }
.upload-hint { font-size: 11px; color: #94a3b8; }

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
  background: linear-gradient(90deg, #3b82f6, #2563eb);
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
.result-errors li { margin: 2px 0; }

/* ================================================================ */
/* DELETE MODAL */
/* ================================================================ */
.delete-modal .modal-container {
  max-width: 450px;
}

.delete-header {
  background: linear-gradient(135deg, #fee2e2, #fecaca) !important;
  border-bottom: 2px solid #ef4444 !important;
  padding: 16px 20px !important;
}

.delete-header .header-icon-wrapper {
  width: 44px;
  height: 44px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.delete-header .header-icon {
  font-size: 20px;
  color: white;
}

.delete-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

.delete-header .header-subtitle {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.delete-header .modal-close {
  margin-left: auto;
}

.delete-item-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 14px;
}

.delete-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
.delete-row:last-child {
  border-bottom: none;
}

.delete-label {
  color: #64748b;
  font-weight: 500;
}

.delete-value {
  color: #1e293b;
  font-weight: 600;
}

.delete-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  font-size: 13px;
  color: #991b1b;
}

.delete-warning .warning-icon {
  font-size: 18px;
}

.delete-footer {
  background: #fafbfc !important;
  padding: 12px 20px !important;
}

.btn-danger {
  padding: 6px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 9999;
  animation: slideIn 0.2s ease, fadeOut 0.2s ease 2s forwards;
}
.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-10px); }
}

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 768px) {
  .finished-goods-page { padding: 12px; }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-right {
    display: flex;
    flex-wrap: wrap;
  }
  .header-right button {
    flex: 1;
  }

  .filter-bar {
    flex-direction: column;
    gap: 8px;
  }
  .filter-group {
    min-width: 100%;
  }
  .search-group {
    min-width: 100%;
  }

  .stats-row {
    flex-wrap: wrap;
  }
  .stat-item {
    min-width: calc(50% - 6px);
    flex: 1 0 calc(50% - 6px);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-container {
    max-width: 100%;
    margin: 10px;
  }

  .delete-row {
    flex-direction: column;
    gap: 2px;
  }

  .delete-header {
    flex-wrap: wrap;
  }
  .delete-header .header-icon-wrapper {
    width: 36px;
    height: 36px;
  }
  .delete-header .header-icon {
    font-size: 16px;
  }
  .delete-header h3 {
    font-size: 15px;
  }

  .modal-tabs {
    flex-wrap: wrap;
  }
  .modal-tab {
    flex: 1;
    text-align: center;
  }

  .import-info {
    flex-direction: column;
  }
  .preview-table-container {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .data-table {
    font-size: 12px;
  }
  .data-table th,
  .data-table td {
    padding: 5px 8px;
  }
  .fg-code {
    font-size: 10px;
  }
  .product-name {
    font-size: 12px;
  }
  .stat-item {
    min-width: 100%;
    flex: 1;
  }
  .delete-modal .modal-container {
    max-width: 100%;
    margin: 10px;
  }
  .delete-footer {
    flex-direction: column;
  }
  .delete-footer button {
    width: 100%;
    justify-content: center;
  }
  .result-summary {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>