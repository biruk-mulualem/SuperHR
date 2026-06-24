<!-- pages/ProductMaster.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📦 Product Master Data</h2>
        <span class="total-badge">{{ products.length }} Products</span>
      </div>

      <div class="header-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search products..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-export" @click="openExportModal" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
        <button class="btn-add" @click="openAddProduct">➕ Add Product</button>
      </div>
    </div>

    <!-- ==================== TABS ==================== -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'categories' && categories.length > 0" class="tab-badge">
          {{ categories.length }}
        </span>
        <span v-if="tab.key === 'uom' && uomList.length > 0" class="tab-badge">
          {{ uomList.length }}
        </span>
      </button>
    </div>

    <!-- ==================== TAB CONTENT ==================== -->
    <div class="tab-content">

      <!-- ============================================================ -->
      <!-- TAB 1: PRODUCT LIST                                          -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'products'" class="products-tab">
        <div class="filter-bar">
          <select v-model="filterCategory" class="filter-select" @change="onFilterChange">
            <option value="">All Categories</option>
            <option v-for="cat in getActiveCategories()" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discontinued">Discontinued</option>
          </select>
          <select v-model="filterUOM" class="filter-select" @change="onFilterChange">
            <option value="">All UOM</option>
            <option v-for="uom in getActiveUOMs()" :key="uom.code" :value="uom.code">{{ uom.code }}</option>
          </select>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading products...</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <div class="empty-icon">🧪</div>
          <h3>No products found</h3>
          <p>Add your first product to the master catalog</p>
          <button @click="openAddProduct" class="btn-primary">Add Product</button>
        </div>

        <div v-else class="table-container">
          <table class="product-table">
            <thead>
              <tr>
                <th style="width:35px"></th>
                <th>Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>UOM</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="product in paginatedProducts" :key="product.id">
                <tr
                  :class="{
                    'expanded-row': expandedRow === product.id,
                    'inactive-row': product.status === 'Inactive',
                    'discontinued-row': product.status === 'Discontinued'
                  }"
                >
                  <td class="text-center">
                    <button class="expand-btn" @click="toggleExpand(product.id)">
                      {{ expandedRow === product.id ? "▼" : "▶" }}
                    </button>
                  </td>
                  <td class="sku">{{ product.code }}</td>
                  <td>
                    <div class="product-info">
                      <span class="common-name">{{ product.name }}</span>
                      <span class="standard-name">{{ product.standardName }}</span>
                    </div>
                  </td>
                  <td>{{ product.category || '-' }}</td>
                  <td>{{ product.uom }}</td>
                  <td>
                    <span :class="['status-badge', product.status.toLowerCase()]">
                      {{ product.status }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button @click="openEditProduct(product)" class="icon-btn" title="Edit">✏️</button>
                    </div>
                  </td>
                </tr>

                <tr v-if="expandedRow === product.id" class="detail-expand-row">
                  <td colspan="7">
                    <div class="expand-details">
                      <div class="detail-container">
                        <div class="detail-row-two-cols">
                          <div class="detail-card">
                            <h4>📋 Basic Information</h4>
                            <div><span>Product Code</span><span class="value">{{ product.code }}</span></div>
                            <div><span>Product Name</span><span class="value">{{ product.name }}</span></div>
                            <div><span>Standard Name</span><span class="value">{{ product.standardName || '-' }}</span></div>
                            <div><span>Description</span><span class="value">{{ product.description || '-' }}</span></div>
                            <div><span>Brand</span><span class="value">{{ product.brand || '-' }}</span></div>
                            <div><span>Model</span><span class="value">{{ product.model || '-' }}</span></div>
                            <div><span>Barcode</span><span class="value">{{ product.barcode || '-' }}</span></div>
                          </div>

                          <div class="detail-card">
                            <h4>💰 Pricing & Unit</h4>
                            <div><span>Unit of Measure</span><span class="value">{{ product.uom }}</span></div>
                            
                            <!-- Conversion Display -->
                            <div v-if="product.conversionUom">
                              <span>Conversion</span>
                              <span class="value">{{ product.conversionValue }} {{ product.conversionUom }} = 1 {{ product.uom }}</span>
                            </div>
                            <div v-if="product.conversionUom">
                              <span>Conversion Unit</span>
                              <span class="value">{{ product.conversionUom }}</span>
                            </div>
                            <div v-if="product.conversionUom">
                              <span>Conversion Value</span>
                              <span class="value">{{ product.conversionValue }}</span>
                            </div>
                            <div v-else>
                              <span>Conversion</span>
                              <span class="value">Base Unit</span>
                            </div>
                            <div><span>Cost Price</span><span class="value">${{ formatCurrency(product.costPrice) }}</span></div>
                          </div>
                        </div>

                        <div class="detail-card full-width">
                          <h4>📄 Specifications</h4>
                          <div v-if="product.specType === 'text' && product.specText" class="spec-text-content">
                            {{ product.specText }}
                          </div>
                          <div v-if="product.specType === 'pdf' && product.specPdf" class="spec-pdf-content">
                            <span class="pdf-icon">📎</span>
                            <span class="pdf-name">{{ product.specPdfName || 'Specification Document.pdf' }}</span>
                            <span class="pdf-size">{{ product.specPdfSize || '250 KB' }}</span>
                            <button @click="openPdfNewTab(product)" class="btn-pdf-open">📖 Open PDF</button>
                          </div>
                          <div v-if="!product.specText && !product.specPdf" class="no-specs">
                            No specifications entered
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

        <div class="pagination" v-if="filteredProducts.length > 0">
          <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
            ← Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
            Next →
          </button>
          <select v-model="pageSize" @change="changePageSize" class="limit-select">
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- TAB 2: CATEGORIES                                             -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'categories'" class="categories-tab">
        <div class="section-header">
          <h2>📁 Product Categories</h2>
          <button class="btn-add" @click="openAddCategoryModal">➕ Add Category</button>
        </div>

        <div class="table-container">
          <table class="category-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="categories.length === 0">
                <td colspan="4" class="empty-state">
                  <div class="empty-content">
                    <span class="empty-icon">📁</span>
                    <p>No categories found</p>
                    <button class="btn-secondary" @click="openAddCategoryModal">Add First Category</button>
                  </div>
                </td>
              </tr>
              <tr v-for="(cat, index) in paginatedCategories" :key="cat.name">
                <td class="text-center">{{ (categoryPage - 1) * categoryPageSize + index + 1 }}</td>
                <td>{{ cat.name }}</td>
                <td>
                  <span :class="['status-badge', cat.status?.toLowerCase() || 'active']">
                    {{ cat.status || 'Active' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click="openEditCategoryModal(cat)" class="icon-btn" title="Edit">✏️</button>
                    <button @click="toggleCategoryStatus(cat)" class="icon-btn" :title="cat.status === 'Active' ? 'Deactivate' : 'Activate'">
                      {{ cat.status === 'Active' ? '⏸️' : '▶️' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="categories.length > 0">
          <button class="page-btn" :disabled="categoryPage === 1" @click="categoryPage--">←</button>
          <span class="page-info">{{ categoryPage }} / {{ categoryTotalPages }}</span>
          <button class="page-btn" :disabled="categoryPage === categoryTotalPages" @click="categoryPage++">→</button>
          <select v-model="categoryPageSize" class="limit-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- TAB 3: UOM                                                    -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'uom'" class="uom-tab">
        <div class="section-header">
          <h2>📏 Units of Measure</h2>
          <button class="btn-add" @click="openAddUOMModal">➕ Add UOM</button>
        </div>

        <div class="table-container">
          <table class="uom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="uomList.length === 0">
                <td colspan="5" class="empty-state">
                  <div class="empty-content">
                    <span class="empty-icon">📏</span>
                    <p>No UOMs found</p>
                    <button class="btn-secondary" @click="openAddUOMModal">Add First UOM</button>
                  </div>
                </td>
              </tr>
              <tr v-for="(uom, index) in paginatedUOMs" :key="uom.code">
                <td class="text-center">{{ (uomPage - 1) * uomPageSize + index + 1 }}</td>
                <td class="code">{{ uom.code }}</td>
                <td>{{ uom.name }}</td>
                <td>
                  <span :class="['status-badge', uom.status?.toLowerCase() || 'active']">
                    {{ uom.status || 'Active' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click="openEditUOMModal(uom)" class="icon-btn" title="Edit">✏️</button>
                    <button @click="toggleUOMStatus(uom)" class="icon-btn" :title="uom.status === 'Active' ? 'Deactivate' : 'Activate'">
                      {{ uom.status === 'Active' ? '⏸️' : '▶️' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="uomList.length > 0">
          <button class="page-btn" :disabled="uomPage === 1" @click="uomPage--">←</button>
          <span class="page-info">{{ uomPage }} / {{ uomTotalPages }}</span>
          <button class="page-btn" :disabled="uomPage === uomTotalPages" @click="uomPage++">→</button>
          <select v-model="uomPageSize" class="limit-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>

    </div>
  </div>

  <!-- ================================================================ -->
  <!-- MODALS                                                           -->
  <!-- ================================================================ -->

  <!-- PRODUCT MODAL -->
  <div v-if="showProductModal" class="modal-overlay" @click.self="closeProductModal">
    <div class="modal-container product-modal">
      <div class="modal-header">
        <h3>{{ editingProduct ? '✏️ Edit Product' : '➕ Add New Product' }}</h3>
        <button class="modal-close" @click="closeProductModal">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveProduct" class="product-form">
          <div class="form-section-title">Basic Information</div>
          <div class="form-row">
            <div class="form-group">
              <label>Product Name *</label>
              <input v-model="productForm.name" type="text" required />
            </div>
            <div class="form-group">
              <label>Standard Name</label>
              <input v-model="productForm.standardName" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="productForm.description" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Brand</label>
              <input v-model="productForm.brand" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Model</label>
              <input v-model="productForm.model" type="text" />
            </div>
            <div class="form-group">
              <label>Barcode</label>
              <input v-model="productForm.barcode" type="text" />
            </div>
          </div>

          <div class="form-section-title">Category & Unit</div>
          <div class="form-row">
            <div class="form-group">
              <label>Category *</label>
              <select v-model="productForm.category" required>
                <option value="">Select Category...</option>
                <option v-for="cat in getActiveCategories()" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Unit of Measure (UOM) *</label>
              <select v-model="productForm.uom" required @change="onUOMChange">
                <option value="">Select UOM...</option>
                <option v-for="uom in getActiveUOMs()" :key="uom.code" :value="uom.code">
                  {{ uom.code }} - {{ uom.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Conversion Section -->
          <div class="form-section-title">Conversion</div>
          <div class="form-row">
            <div class="form-group">
              <label>Conversion Unit</label>
              <input v-model="productForm.conversionUom" type="text" readonly class="readonly-field" />
              <span class="hint">Auto-filled from UOM settings</span>
            </div>
            <div class="form-group">
              <label>Conversion Value</label>
              <input v-model.number="productForm.conversionValue" type="number" readonly class="readonly-field" />
              <span class="hint" v-if="productForm.conversionUom && productForm.conversionValue">
                {{ productForm.conversionValue }} {{ productForm.conversionUom }} = 1 {{ productForm.uom }}
              </span>
              <span class="hint" v-else-if="productForm.uom">Base Unit (no conversion)</span>
            </div>
          </div>

          <div class="form-section-title">Pricing</div>
          <div class="form-row">
            <div class="form-group">
              <label>Cost Price ($)</label>
              <input v-model.number="productForm.costPrice" type="number" step="0.01" min="0" />
            </div>
          </div>

          <div class="form-section-title">Specifications</div>
          <div class="spec-type-selector">
            <label class="spec-option">
              <input type="radio" value="text" v-model="specType" /> 
              📝 Written Specifications
            </label>
            <label class="spec-option">
              <input type="radio" value="pdf" v-model="specType" /> 
              📄 PDF Document
            </label>
          </div>
          
          <div v-if="specType === 'text'" class="form-row">
            <div class="form-group full-width">
              <label>Written Specifications</label>
              <textarea v-model="productForm.specText" rows="6" 
                placeholder="Enter detailed specifications here..."></textarea>
            </div>
          </div>

          <div v-if="specType === 'pdf'" class="form-row">
            <div class="form-group full-width">
              <label>PDF Specification Document</label>
              <div class="file-upload-area" @click="triggerFileUpload">
                <div v-if="productForm.specPdfFile" class="file-preview">
                  <span class="file-icon">📄</span>
                  <span class="file-name">{{ productForm.specPdfFile.name }}</span>
                  <span class="file-size">{{ formatFileSize(productForm.specPdfFile.size) }}</span>
                  <button type="button" @click.stop="removePdfFile" class="remove-file">✕</button>
                </div>
                <div v-else class="upload-placeholder">
                  <span class="upload-icon">📎</span>
                  <span>Click to upload PDF</span>
                  <span class="upload-hint">or drag and drop</span>
                </div>
                <input type="file" ref="pdfFileInput" accept=".pdf" 
                       @change="handlePdfUpload" style="display:none" />
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeProductModal">Cancel</button>
        <button class="btn-primary" @click="saveProduct" :disabled="savingProduct">
          {{ savingProduct ? 'Saving...' : (editingProduct ? 'Update' : 'Add') }}
        </button>
      </div>
    </div>
  </div>

  <!-- CATEGORY MODAL -->
  <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
    <div class="modal-container category-modal">
      <div class="modal-header">
        <h3>{{ editingCategory ? '✏️ Edit Category' : '📁 Add New Category' }}</h3>
        <button class="modal-close" @click="closeCategoryModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Category Name *</label>
          <input v-model="categoryForm.name" type="text" required placeholder="Enter category name..." />
          <span class="hint">Examples: Fiber Raw Material, Paint Raw Material, Electronics</span>
        </div>
        <div v-if="categoryExists" class="form-error">
          ⚠️ Category "{{ categoryForm.name }}" already exists
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeCategoryModal">Cancel</button>
        <button class="btn-primary" @click="confirmSaveCategory" :disabled="!categoryForm.name.trim()">
          {{ editingCategory ? 'Update' : 'Add' }}
        </button>
      </div>
    </div>
  </div>

  <!-- UOM MODAL -->
  <div v-if="showUOMModal" class="modal-overlay" @click.self="closeUOMModal">
    <div class="modal-container uom-modal">
      <div class="modal-header">
        <h3>{{ editingUOM ? '✏️ Edit UOM' : '📏 Add New UOM' }}</h3>
        <button class="modal-close" @click="closeUOMModal">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveUOM" class="uom-form">
          <div class="form-row">
            <div class="form-group">
              <label>UOM Code *</label>
              <input v-model="uomForm.code" type="text" required placeholder="e.g., KG, L, Box" 
                     :readonly="!!editingUOM" />
              <span v-if="editingUOM" class="hint">Code cannot be changed</span>
            </div>
            <div class="form-group">
              <label>UOM Name *</label>
              <input v-model="uomForm.name" type="text" required placeholder="e.g., Kilogram, Liter, Box" />
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeUOMModal">Cancel</button>
        <button class="btn-primary" @click="saveUOM" :disabled="!uomForm.code || !uomForm.name">
          {{ editingUOM ? 'Update' : 'Add' }}
        </button>
      </div>
    </div>
  </div>

  <!-- EXPORT MODAL -->
  <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
    <div class="modal-container export-modal">
      <div class="modal-header">
        <h3>📊 Export Product Data</h3>
        <button class="modal-close" @click="closeExportModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="export-options">
          <div class="export-option" @click="exportType = 'full'">
            <input type="radio" v-model="exportType" value="full" /> Full Product Catalog
          </div>
          <div class="export-option" @click="exportType = 'summary'">
            <input type="radio" v-model="exportType" value="summary" /> Summary
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

  <!-- TOAST -->
  <div v-if="showToast" class="toast" :class="toastType">
    <span>{{ toastMessage }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// ================================================================
// STATE
// ================================================================
const products = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const filterUOM = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const activeTab = ref('products');
const expandedRow = ref(null);
const specType = ref('text');

// Product Modals
const showProductModal = ref(false);
const editingProduct = ref(null);
const savingProduct = ref(false);

// Category Modals
const showCategoryModal = ref(false);
const editingCategory = ref(null);
const categoryExists = ref(false);
const categoryForm = ref({ name: '', status: 'Active' });
const categoryPage = ref(1);
const categoryPageSize = ref(5);

// UOM Modals
const showUOMModal = ref(false);
const editingUOM = ref(null);
const uomForm = ref({ code: '', name: '', status: 'Active' });
const uomPage = ref(1);
const uomPageSize = ref(5);

const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref('full');

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const pdfFileInput = ref(null);

const productForm = ref({
  name: '',
  standardName: '',
  description: '',
  brand: '',
  model: '',
  category: '',
  uom: '',
  barcode: '',
  costPrice: 0,
  conversionUom: '',
  conversionValue: 0,
  specType: 'text',
  specText: '',
  specPdfFile: null,
  specPdfName: '',
  specPdfSize: ''
});

// ================================================================
// UOM LIST
// ================================================================
const uomList = ref([
  { code: 'KG', name: 'Kilogram', status: 'Active' },
  { code: 'G', name: 'Gram', status: 'Active' },
  { code: 'L', name: 'Liter', status: 'Active' },
  { code: 'ML', name: 'Milliliter', status: 'Active' },
  { code: 'Each', name: 'Each', status: 'Active' },
  { code: 'Drum', name: 'Drum', status: 'Active' },
  { code: 'Bag', name: 'Bag', status: 'Active' },
  { code: 'Box', name: 'Box', status: 'Active' },
  { code: 'Pallet', name: 'Pallet', status: 'Active' },
  { code: 'Dozen', name: 'Dozen', status: 'Active' },
  { code: 'Packet', name: 'Packet', status: 'Active' },
  { code: 'Set', name: 'Set', status: 'Active' },
  { code: 'Pair', name: 'Pair', status: 'Active' },
  { code: 'Roll', name: 'Roll', status: 'Active' },
]);

// ================================================================
// CATEGORIES
// ================================================================
const categories = ref([
  { name: 'Fiber Raw Material', status: 'Active' },
  { name: 'Paint Raw Material', status: 'Active' },
  { name: 'Electronics', status: 'Active' },
  { name: 'Electric', status: 'Active' },
  { name: 'Machinery', status: 'Active' },
  { name: 'Stationery', status: 'Active' },
  { name: 'Chemicals', status: 'Active' },
  { name: 'Packaging', status: 'Active' },
  { name: 'Metals', status: 'Active' },
  { name: 'Finishing', status: 'Active' },
  { name: 'Spare Parts', status: 'Active' },
  { name: 'Consumables', status: 'Active' },
  { name: 'Hardeners', status: 'Active' },
  { name: 'Pigments', status: 'Active' },
  { name: 'Solvents', status: 'Active' },
  { name: 'Resins', status: 'Active' },
]);

// ================================================================
// COMPUTED
// ================================================================
const tabs = [
  { key: 'products', label: '📦 Products' },
  { key: 'categories', label: '📁 Categories' },
  { key: 'uom', label: '📏 UOM' }
];

const getActiveCategories = () => {
  return categories.value.filter(c => c.status === 'Active').map(c => c.name);
};

const getActiveUOMs = () => {
  return uomList.value.filter(u => u.status === 'Active');
};

// Category Computed
const categoryStats = computed(() => {
  return categories.value.sort((a, b) => a.name.localeCompare(b.name));
});

const paginatedCategories = computed(() => {
  const start = (categoryPage.value - 1) * categoryPageSize.value;
  return categoryStats.value.slice(start, start + categoryPageSize.value);
});

const categoryTotalPages = computed(() => {
  return Math.ceil(categoryStats.value.length / categoryPageSize.value) || 1;
});

// UOM Computed
const paginatedUOMs = computed(() => {
  const start = (uomPage.value - 1) * uomPageSize.value;
  return uomList.value.slice(start, start + uomPageSize.value);
});

const uomTotalPages = computed(() => {
  return Math.ceil(uomList.value.length / uomPageSize.value) || 1;
});

// Product Computed
const filteredProducts = computed(() => {
  let result = products.value;
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.code.toLowerCase().includes(s) ||
      p.name.toLowerCase().includes(s) ||
      p.standardName?.toLowerCase().includes(s) ||
      p.brand?.toLowerCase().includes(s)
    );
  }
  
  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value);
  }
  
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value);
  }
  
  if (filterUOM.value) {
    result = result.filter(p => p.uom === filterUOM.value);
  }
  
  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / pageSize.value) || 1;
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredProducts.value.slice(start, start + pageSize.value);
});

watch(specType, (newVal) => {
  if (newVal === 'text') {
    productForm.value.specPdfFile = null;
    productForm.value.specPdfName = '';
    productForm.value.specPdfSize = '';
  } else {
    productForm.value.specText = '';
  }
});

// ================================================================
// METHODS
// ================================================================

const onUOMChange = () => {
  // UOM selection auto-fills conversion info
};

const generateProductCode = () => {
  const maxNumber = products.value.reduce((max, p) => {
    const num = parseInt(p.code.replace('SDT', ''));
    return num > max ? num : max;
  }, 0);
  const nextNumber = String(maxNumber + 1).padStart(6, '0');
  return 'SDT' + nextNumber;
};

const loadProducts = () => {
  loading.value = true;
  setTimeout(() => {
    products.value = getMockProducts();
    loading.value = false;
  }, 300);
};

const getMockProducts = () => {
  return [
    { 
      id: 'p1', 
      code: 'SDT000001', 
      name: 'Dulatin Chemical', 
      standardName: 'Dulatin Industrial Chemical',
      description: 'High-performance industrial chemical',
      brand: 'ChemTech', 
      model: 'DT-2000', 
      category: 'Chemicals', 
      uom: 'Drum', 
      conversionUom: 'KG',
      conversionValue: 165,
      status: 'Active', 
      barcode: '1234567890123', 
      costPrice: 245.00,
      specType: 'text',
      specText: 'High-performance industrial chemical.\n\nKey Properties:\n- Density: 1.2 g/cm³\n- Flash Point: 35°C',
      specPdf: null,
      specPdfName: '',
      specPdfSize: '',
      specPdfUrl: ''
    },
    { 
      id: 'p2', 
      code: 'SDT000002', 
      name: 'Titanium Dioxide Pigment', 
      standardName: 'Titanium Dioxide White Pigment',
      description: 'High-quality titanium dioxide pigment',
      brand: 'ColorMaster', 
      model: 'TiO2-5000', 
      category: 'Paint Raw Material', 
      uom: 'KG', 
      conversionUom: '',
      conversionValue: 0,
      status: 'Active', 
      barcode: '9876543210987', 
      costPrice: 8.00,
      specType: 'text',
      specText: 'High-quality titanium dioxide pigment.\n\nKey Properties:\n- Purity: 99.5%',
      specPdf: null,
      specPdfName: '',
      specPdfSize: '',
      specPdfUrl: ''
    },
    { 
      id: 'p3', 
      code: 'SDT000003', 
      name: 'Steel Sheets', 
      standardName: 'Industrial Steel Sheets 2mm',
      description: 'High-grade steel sheets',
      brand: 'SteelPro', 
      model: 'SP-2mm', 
      category: 'Metals', 
      uom: 'Box', 
      conversionUom: 'Each',
      conversionValue: 12,
      status: 'Active', 
      barcode: '4567890123456', 
      costPrice: 15.00,
      specType: 'text',
      specText: 'High-grade steel sheets.\n\nKey Properties:\n- Thickness: 2mm\n- Grade: A36',
      specPdf: null,
      specPdfName: '',
      specPdfSize: '',
      specPdfUrl: ''
    },
  ];
};

// -- Products CRUD --
const openAddProduct = () => {
  editingProduct.value = null;
  specType.value = 'text';
  productForm.value = {
    name: '',
    standardName: '',
    description: '',
    brand: '',
    model: '',
    category: '',
    uom: '',
    barcode: '',
    costPrice: 0,
    conversionUom: '',
    conversionValue: 0,
    specType: 'text',
    specText: '',
    specPdfFile: null,
    specPdfName: '',
    specPdfSize: ''
  };
  showProductModal.value = true;
};

const openEditProduct = (product) => {
  editingProduct.value = product;
  if (product.specType === 'pdf' && product.specPdf) {
    specType.value = 'pdf';
  } else {
    specType.value = 'text';
  }
  productForm.value = { 
    name: product.name,
    standardName: product.standardName || '',
    description: product.description || '',
    brand: product.brand || '',
    model: product.model || '',
    category: product.category || '',
    uom: product.uom || '',
    barcode: product.barcode || '',
    costPrice: product.costPrice || 0,
    conversionUom: product.conversionUom || '',
    conversionValue: product.conversionValue || 0,
    specType: product.specType || 'text',
    specText: product.specText || '',
    specPdfFile: null,
    specPdfName: product.specPdfName || '',
    specPdfSize: product.specPdfSize || ''
  };
  showProductModal.value = true;
};

const closeProductModal = () => {
  showProductModal.value = false;
  editingProduct.value = null;
};

const saveProduct = () => {
  savingProduct.value = true;
  setTimeout(() => {
    const formData = { 
      ...productForm.value,
      status: 'Active'
    };
    
    if (specType.value === 'text') {
      formData.specType = 'text';
      formData.specPdf = null;
      formData.specPdfName = '';
      formData.specPdfSize = '';
      formData.specPdfUrl = '';
    } else {
      formData.specType = 'pdf';
      formData.specText = '';
      if (productForm.value.specPdfFile) {
        formData.specPdf = true;
        formData.specPdfName = productForm.value.specPdfFile.name;
        formData.specPdfSize = formatFileSize(productForm.value.specPdfFile.size);
        formData.specPdfUrl = URL.createObjectURL(productForm.value.specPdfFile);
      }
    }
    
    if (editingProduct.value) {
      const idx = products.value.findIndex(p => p.id === editingProduct.value.id);
      if (idx !== -1) {
        products.value[idx] = { 
          ...formData, 
          id: editingProduct.value.id,
          code: editingProduct.value.code
        };
      }
      showToastMessage('Product updated successfully!', 'success');
    } else {
      const newProduct = {
        ...formData,
        id: 'p' + Date.now(),
        code: generateProductCode()
      };
      products.value.push(newProduct);
      showToastMessage('Product added successfully!', 'success');
    }
    closeProductModal();
    loadProducts();
    savingProduct.value = false;
  }, 500);
};

// -- Category CRUD --
const openAddCategoryModal = () => {
  editingCategory.value = null;
  categoryForm.value = { name: '', status: 'Active' };
  categoryExists.value = false;
  showCategoryModal.value = true;
};

const openEditCategoryModal = (cat) => {
  editingCategory.value = cat;
  categoryForm.value = { name: cat.name, status: cat.status || 'Active' };
  categoryExists.value = false;
  showCategoryModal.value = true;
};

const closeCategoryModal = () => {
  showCategoryModal.value = false;
  editingCategory.value = null;
  categoryForm.value = { name: '', status: 'Active' };
  categoryExists.value = false;
};

const confirmSaveCategory = () => {
  const catName = categoryForm.value.name.trim();
  if (!catName) return;
  
  if (!editingCategory.value) {
    const exists = categories.value.some(c => c.name === catName);
    if (exists) {
      categoryExists.value = true;
      return;
    }
    categories.value.push({ name: catName, status: 'Active' });
    categories.value.sort((a, b) => a.name.localeCompare(b.name));
    showToastMessage(`Category "${catName}" added!`, 'success');
  } else {
    const exists = categories.value.some(c => c.name === catName && c.name !== editingCategory.value.name);
    if (exists) {
      categoryExists.value = true;
      return;
    }
    const idx = categories.value.findIndex(c => c.name === editingCategory.value.name);
    if (idx !== -1) {
      categories.value[idx].name = catName;
    }
    showToastMessage(`Category updated!`, 'success');
  }
  closeCategoryModal();
};

const toggleCategoryStatus = (cat) => {
  const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
  const idx = categories.value.findIndex(c => c.name === cat.name);
  if (idx !== -1) {
    categories.value[idx].status = newStatus;
    showToastMessage(`Category "${cat.name}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
  }
};

// -- UOM CRUD --
const openAddUOMModal = () => {
  editingUOM.value = null;
  uomForm.value = { code: '', name: '', status: 'Active' };
  showUOMModal.value = true;
};

const openEditUOMModal = (uom) => {
  editingUOM.value = uom;
  uomForm.value = { code: uom.code, name: uom.name, status: uom.status || 'Active' };
  showUOMModal.value = true;
};

const closeUOMModal = () => {
  showUOMModal.value = false;
  editingUOM.value = null;
};

const saveUOM = () => {
  const code = uomForm.value.code.trim();
  const name = uomForm.value.name.trim();
  
  if (!code || !name) {
    showToastMessage('Please enter both code and name', 'error');
    return;
  }
  
  if (!editingUOM.value) {
    const exists = uomList.value.some(u => u.code === code);
    if (exists) {
      showToastMessage(`UOM "${code}" already exists`, 'error');
      return;
    }
    uomList.value.push({ code, name, status: 'Active' });
    uomList.value.sort((a, b) => a.code.localeCompare(b.code));
    showToastMessage(`UOM "${code}" added!`, 'success');
  } else {
    const idx = uomList.value.findIndex(u => u.code === editingUOM.value.code);
    if (idx !== -1) {
      uomList.value[idx].name = name;
    }
    showToastMessage(`UOM updated!`, 'success');
  }
  closeUOMModal();
};

const toggleUOMStatus = (uom) => {
  const newStatus = uom.status === 'Active' ? 'Inactive' : 'Active';
  const idx = uomList.value.findIndex(u => u.code === uom.code);
  if (idx !== -1) {
    uomList.value[idx].status = newStatus;
    showToastMessage(`UOM "${uom.code}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
  }
};

// -- PDF Functions --
const openPdfNewTab = (product) => {
  if (product.specPdfUrl) {
    window.open(product.specPdfUrl, '_blank');
  } else {
    showToastMessage(`Opening ${product.specPdfName}...`, 'success');
  }
};

const triggerFileUpload = () => {
  pdfFileInput.value.click();
};

const handlePdfUpload = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    productForm.value.specPdfFile = file;
    productForm.value.specPdfName = file.name;
    productForm.value.specPdfSize = formatFileSize(file.size);
    showToastMessage('PDF uploaded successfully!', 'success');
  } else {
    showToastMessage('Please upload a valid PDF file', 'error');
  }
  event.target.value = '';
};

const removePdfFile = () => {
  productForm.value.specPdfFile = null;
  productForm.value.specPdfName = '';
  productForm.value.specPdfSize = '';
};

// -- Export --
const openExportModal = () => {
  showExportModal.value = true;
};

const closeExportModal = () => {
  showExportModal.value = false;
};

const exportSelectedReport = () => {
  exporting.value = true;
  setTimeout(() => {
    let headers = [], rows = [];
    const data = filteredProducts.value;
    
    if (exportType.value === 'full') {
      headers = ['Code', 'Name', 'Category', 'UOM', 'Conversion', 'Conversion Unit', 'Conversion Value', 'Status', 'Cost Price'];
      rows = data.map(p => [
        p.code, p.name, p.category || '', p.uom, 
        p.conversionUom ? `${p.conversionValue} ${p.conversionUom} = 1 ${p.uom}` : 'Base Unit',
        p.conversionUom || '',
        p.conversionValue || 0,
        p.status, p.costPrice || 0
      ]);
    } else {
      headers = ['Code', 'Name', 'Category', 'UOM', 'Status'];
      rows = data.map(p => [
        p.code, p.name, p.category || '', p.uom, p.status
      ]);
    }
    
    downloadCSV([headers, ...rows], `product_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    exporting.value = false;
    closeExportModal();
    showToastMessage('Export completed!', 'success');
  }, 500);
};

const downloadCSV = (data, filename) => {
  const csv = data.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// -- Pagination --
const changePage = (page) => { currentPage.value = page; };
const changePageSize = () => { currentPage.value = 1; };
const onSearchChange = () => { currentPage.value = 1; };
const onFilterChange = () => { currentPage.value = 1; };
const toggleExpand = (id) => { expandedRow.value = expandedRow.value === id ? null : id; };

// -- Toast --
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

// -- Formatting --
const formatCurrency = (amt) => {
  if (!amt && amt !== 0) return '0.00';
  return amt.toFixed(2);
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
/* ================================================================
   SECTION CARD
   ================================================================ */
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

/* ================================================================
   HEADER FILTERS
   ================================================================ */
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

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-export {
  background: #10b981;
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
.btn-export:hover:not(:disabled) { background: #059669; }

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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }

.btn-pdf-open {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.btn-pdf-open:hover { background: #2563eb; }

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
.delete-btn:hover { color: #ef4444; background: #fee2e2; }

/* ================================================================
   TABS
   ================================================================ */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
}

.tab {
  padding: 8px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
  position: relative;
}
.tab:hover { background: #f1f5f9; }
.tab.active { color: #3b82f6; background: #eff6ff; }
.tab-badge {
  display: inline-block;
  background: #3b82f6;
  color: white;
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 12px;
  margin-left: 6px;
}

/* ================================================================
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* ================================================================
   TABLES
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.product-table, .category-table, .uom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px;
}

.product-table th, .product-table td,
.category-table th, .category-table td,
.uom-table th, .uom-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.product-table th, .category-table th, .uom-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center { text-align: center; }
.sku, .code { font-weight: 600; color: #2563eb; font-size: 12px; }

.product-info {
  display: flex;
  flex-direction: column;
}
.common-name { font-weight: 500; color: #1e293b; }
.standard-name { font-size: 11px; color: #94a3b8; }

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.inactive { background: #fef3c7; color: #92400e; }
.status-badge.discontinued { background: #fee2e2; color: #991b1b; }

.action-buttons { display: flex; gap: 4px; }

.category-table, .uom-table { min-width: 400px; }

/* ================================================================
   SECTION HEADER
   ================================================================ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h2 { margin: 0; font-size: 18px; color: #1e293b; }

/* ================================================================
   EXPAND ROW
   ================================================================ */
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
.detail-expand-row td { padding: 0 !important; }

.expand-details {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container { display: flex; flex-direction: column; gap: 16px; }
.detail-row-two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
}
.detail-card.full-width { grid-column: 1 / -1; }
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
.detail-card .value { font-weight: 500; color: #1e293b; }

.spec-text-content {
  background: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
  border: 1px solid #e2e8f0;
  white-space: pre-wrap;
}

.spec-pdf-content {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.pdf-icon { font-size: 20px; }
.pdf-name { font-weight: 500; color: #1e293b; }
.pdf-size { font-size: 11px; color: #94a3b8; }
.no-specs { color: #94a3b8; font-size: 13px; padding: 12px; text-align: center; }

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
}

.product-modal { max-width: 750px; }
.uom-modal { max-width: 450px; }
.category-modal { max-width: 450px; }
.export-modal { max-width: 400px; }

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

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 16px 0 12px 0;
  padding-bottom: 4px;
  border-bottom: 2px solid #e2e8f0;
}

.product-form .form-row, .uom-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}
.product-form .form-group, .uom-form .form-group {
  flex: 1;
  min-width: 120px;
}
.product-form .form-group.full-width { flex: 1 1 100%; }

.product-form .form-group label, .uom-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.product-form .form-group input,
.product-form .form-group select,
.product-form .form-group textarea,
.uom-form .form-group input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.product-form .form-group input:focus,
.product-form .form-group select:focus,
.product-form .form-group textarea:focus,
.uom-form .form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.product-form .hint, .uom-form .hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.spec-type-selector {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.spec-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
}
.spec-option input[type="radio"] { width: 16px; height: 16px; cursor: pointer; }

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}
.file-upload-area:hover { border-color: #3b82f6; background: #f8fafc; }

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

.form-error { color: #ef4444; font-size: 13px; margin-top: 8px; }

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
}
.export-option:hover { background: #f8fafc; border-color: #3b82f6; }

/* ================================================================
   LOADING & EMPTY STATES
   ================================================================ */
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
.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state h3 { color: #1e293b; margin-bottom: 8px; }
.empty-state p { color: #94a3b8; }

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}
.page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #3b82f6; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 12px; color: #64748b; }
.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}
.toast.error { border-left-color: #ef4444; }
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .detail-row-two-cols { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: stretch; }
  .header-filters { flex-direction: column; align-items: stretch; }
  .search-box input { width: 100%; }
  .filter-bar { flex-direction: column; }
  .filter-bar select { width: 100%; }
  .spec-type-selector { flex-direction: column; gap: 8px; }
  .product-form .form-row, .uom-form .form-row { flex-direction: column; gap: 8px; }
}

@media (max-width: 600px) {
  .section-card { padding: 12px; }
  .tabs { flex-wrap: wrap; }
  .tab { flex: 1; text-align: center; padding: 6px 10px; font-size: 11px; }
  .pagination { flex-wrap: wrap; }
  .product-table, .category-table, .uom-table { min-width: 500px; }
  .modal-container { margin: 10px; max-height: 95vh; }
}
</style>