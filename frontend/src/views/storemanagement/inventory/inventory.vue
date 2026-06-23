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
      </button>
    </div>

    <!-- ==================== TAB CONTENT ==================== -->
    <div class="tab-content">

      <!-- ============================================================ -->
      <!-- TAB 1: PRODUCT LIST (Master Catalog)                          -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'products'" class="products-tab">
        <!-- Filters -->
        <div class="filter-bar">
          <select v-model="filterCategory" class="filter-select" @change="onFilterChange">
            <option value="">All Categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discontinued">Discontinued</option>
          </select>
          <select v-model="filterUOM" class="filter-select" @change="onFilterChange">
            <option value="">All UOM</option>
            <option v-for="uom in uomList" :key="uom" :value="uom">{{ uom }}</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading products...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <div class="empty-icon">🧪</div>
          <h3>No products found</h3>
          <p>Add your first product to the master catalog</p>
          <button @click="openAddProduct" class="btn-primary">Add Product</button>
        </div>

        <!-- Table -->
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

                <!-- Expanded Detail Row -->
                <tr v-if="expandedRow === product.id" class="detail-expand-row">
                  <td colspan="7">
                    <div class="expand-details">
                      <div class="detail-container">
                        <!-- Row 1: Basic Info + Pricing -->
                        <div class="detail-row-two-cols">
                          <!-- Basic Info -->
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

                          <!-- Pricing & UOM -->
                          <div class="detail-card">
                            <h4>💰 Pricing & Unit</h4>
                            <div><span>Unit of Measure</span><span class="value">{{ product.uom }}</span></div>
                            <div><span>Cost Price</span><span class="value">${{ formatCurrency(product.costPrice) }}</span></div>
                          </div>
                        </div>

                        <!-- Specifications (Full Width) -->
                        <div class="detail-card full-width">
                          <h4>📄 Specifications</h4>
                          
                          <!-- Text Specifications (only if exists) -->
                          <div v-if="product.specType === 'text' && product.specText" class="spec-text-section">
                            <div class="spec-text-content">{{ product.specText }}</div>
                          </div>

                          <!-- PDF Specifications (only if exists) -->
                          <div v-if="product.specType === 'pdf' && product.specPdf" class="spec-pdf-section">
                            <div class="spec-pdf-content">
                              <span class="pdf-icon">📎</span>
                              <span class="pdf-name">{{ product.specPdfName || 'Specification Document.pdf' }}</span>
                              <span class="pdf-size">{{ product.specPdfSize || '250 KB' }}</span>
                              <button @click="openPdfNewTab(product)" class="btn-pdf-open">📖 Open PDF</button>
                            </div>
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

        <!-- Pagination -->
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
        <div class="categories-header">
          <h2>📁 Product Categories</h2>
          <button class="btn-add" @click="openAddCategoryModal">➕ Add Category</button>
        </div>

        <div class="categories-grid">
          <div v-for="cat in categoryStats" :key="cat.name" class="category-card">
            <div class="category-icon">📁</div>
            <div class="category-info">
              <h3>{{ cat.name }}</h3>
              <p>{{ cat.count }} products</p>
            </div>
          </div>
          <div v-if="categoryStats.length === 0" class="empty-state">
            <div class="empty-icon">📁</div>
            <h3>No categories</h3>
            <p>Add categories to organize your products</p>
          </div>
        </div>
      </div>

    </div><!-- /tab-content -->
  </div>

  <!-- ================================================================ -->
  <!-- MODALS                                                           -->
  <!-- ================================================================ -->

  <!-- ==================== PRODUCT MODAL ==================== -->
  <div v-if="showProductModal" class="modal-overlay" @click.self="closeProductModal">
    <div class="modal-container product-modal">
      <div class="modal-header">
        <h3>{{ editingProduct ? '✏️ Edit Product' : '➕ Add New Product' }}</h3>
        <button class="modal-close" @click="closeProductModal">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveProduct" class="product-form">
          <!-- Basic Info -->
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

          <!-- Category & UOM -->
          <div class="form-section-title">Category & Unit</div>
          <div class="form-row">
            <div class="form-group">
              <label>Category *</label>
              <select v-model="productForm.category" required class="category-select">
                <option value="">Select Category...</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <span class="hint">New categories can be added from the Categories tab</span>
            </div>
            <div class="form-group">
              <label>Unit of Measure (UOM) *</label>
              <select v-model="productForm.uom" required>
                <option value="KG">KG (Kilogram)</option>
                <option value="G">G (Gram)</option>
                <option value="L">L (Liter)</option>
                <option value="ML">ML (Milliliter)</option>
                <option value="Each">Each</option>
                <option value="Box">Box</option>
                <option value="Pallet">Pallet</option>
                <option value="Drum">Drum</option>
                <option value="Bag">Bag</option>
                <option value="Roll">Roll</option>
                <option value="Set">Set</option>
                <option value="Pair">Pair</option>
              </select>
            </div>
          </div>

          <!-- Pricing -->
          <div class="form-section-title">Pricing</div>
          <div class="form-row">
            <div class="form-group">
              <label>Cost Price ($)</label>
              <input v-model.number="productForm.costPrice" type="number" step="0.01" min="0" />
            </div>
          </div>

          <!-- Specifications -->
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
          
          <!-- Text Specifications -->
          <div v-if="specType === 'text'" class="form-row">
            <div class="form-group full-width">
              <label>Written Specifications</label>
              <textarea v-model="productForm.specText" rows="6" 
                placeholder="Enter detailed specifications here..."></textarea>
            </div>
          </div>

          <!-- PDF Upload -->
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

  <!-- ==================== CATEGORY MODAL ==================== -->
  <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
    <div class="modal-container category-modal">
      <div class="modal-header">
        <h3>📁 Add New Category</h3>
        <button class="modal-close" @click="closeCategoryModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Category Name *</label>
          <input v-model="newCategoryName" type="text" placeholder="Enter category name..." 
                 @keyup.enter="confirmAddCategory" />
          <span class="hint">Examples: Fiber Raw Material, Paint Raw Material, Electronics, Electric, Machinery, Stationery</span>
        </div>
        <div v-if="categoryExists" class="form-error">
          ⚠️ Category "{{ newCategoryName }}" already exists
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeCategoryModal">Cancel</button>
        <button class="btn-primary" @click="confirmAddCategory" :disabled="!newCategoryName.trim()">
          Add Category
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== EXPORT MODAL ==================== -->
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
            <input type="radio" v-model="exportType" value="summary" /> Summary (Code, Name, Category, Status)
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

// Spec type: 'text' or 'pdf'
const specType = ref('text');

// Modals
const showProductModal = ref(false);
const editingProduct = ref(null);
const savingProduct = ref(false);

const showCategoryModal = ref(false);
const newCategoryName = ref('');
const categoryExists = ref(false);

const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref('full');

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// File upload
const pdfFileInput = ref(null);

// Product Form
const productForm = ref({
  name: '',
  standardName: '',
  description: '',
  brand: '',
  model: '',
  category: '',
  uom: 'KG',
  barcode: '',
  costPrice: 0,
  specType: 'text',
  specText: '',
  specPdfFile: null,
  specPdfName: '',
  specPdfSize: ''
});

// ================================================================
// COMPUTED
// ================================================================
const tabs = [
  { key: 'products', label: '📦 Products' },
  { key: 'categories', label: '📁 Categories' }
];

const categories = ref([
  'Fiber Raw Material',
  'Paint Raw Material',
  'Electronics',
  'Electric',
  'Machinery',
  'Stationery',
  'Chemicals',
  'Packaging',
  'Metals',
  'Finishing',
  'Spare Parts',
  'Consumables',
  'Hardeners',
  'Pigments',
  'Solvents',
  'Resins'
]);

const uomList = computed(() => {
  const uoms = new Set();
  products.value.forEach(p => {
    if (p.uom) uoms.add(p.uom);
  });
  return Array.from(uoms);
});

const categoryStats = computed(() => {
  const stats = {};
  products.value.forEach(p => {
    if (p.category) {
      if (!stats[p.category]) {
        stats[p.category] = { name: p.category, count: 0 };
      }
      stats[p.category].count++;
    }
  });
  return Object.values(stats).sort((a, b) => a.name.localeCompare(b.name));
});

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

// Watch specType to clear the other field
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

// -- Generate Product Code --
const generateProductCode = () => {
  const maxNumber = products.value.reduce((max, p) => {
    const num = parseInt(p.code.replace('SDT', ''));
    return num > max ? num : max;
  }, 0);
  
  const nextNumber = String(maxNumber + 1).padStart(6, '0');
  return 'SDT' + nextNumber;
};

// -- Load Products --
const loadProducts = () => {
  loading.value = true;
  setTimeout(() => {
    products.value = getMockProducts();
    loading.value = false;
  }, 300);
};

// -- Get Mock Products --
const getMockProducts = () => {
  return [
    { 
      id: 'p1', 
      code: 'SDT000001', 
      name: 'Fiberglass Resin', 
      standardName: 'Fiberglass Reinforced Polyester Resin',
      description: 'High-strength polyester resin for fiberglass applications',
      brand: 'ResinTech', 
      model: 'FR-2000', 
      category: 'Fiber Raw Material', 
      uom: 'KG', 
      status: 'Active', 
      barcode: '1234567890123', 
      costPrice: 45.00,
      specType: 'text',
      specText: 'High-strength polyester resin for fiberglass applications.\n\nKey Properties:\n- Density: 1.2 g/cm³\n- Flash Point: 35°C\n- Viscosity: 150 cP\n- Tensile Strength: 45 MPa',
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
      description: 'High-quality titanium dioxide pigment for paint applications',
      brand: 'ColorMaster', 
      model: 'TiO2-5000', 
      category: 'Paint Raw Material', 
      uom: 'KG', 
      status: 'Active', 
      barcode: '9876543210987', 
      costPrice: 8.00,
      specType: 'text',
      specText: 'High-quality titanium dioxide pigment for paint applications.\n\nKey Properties:\n- Purity: 99.5%\n- Particle Size: 0.3 microns\n- Whiteness: 98%',
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
      description: 'High-grade steel sheets for industrial fabrication',
      brand: 'SteelPro', 
      model: 'SP-2mm', 
      category: 'Metals', 
      uom: 'Each', 
      status: 'Active', 
      barcode: '4567890123456', 
      costPrice: 15.00,
      specType: 'text',
      specText: 'High-grade steel sheets for industrial fabrication.\n\nKey Properties:\n- Thickness: 2mm\n- Grade: A36\n- Tensile Strength: 400 MPa',
      specPdf: null,
      specPdfName: '',
      specPdfSize: '',
      specPdfUrl: ''
    },
    { 
      id: 'p4', 
      code: 'SDT000004', 
      name: 'Industrial Solvent', 
      standardName: 'Industrial Solvent 99% Purity',
      description: 'High-purity industrial solvent for cleaning and thinning',
      brand: 'ChemPure', 
      model: 'CP-99', 
      category: 'Chemicals', 
      uom: 'L', 
      status: 'Active', 
      barcode: '5678901234567', 
      costPrice: 6.00,
      specType: 'pdf',
      specText: '',
      specPdf: true,
      specPdfName: 'Industrial_Solvent_SDS.pdf',
      specPdfSize: '850 KB',
      specPdfUrl: '#'
    },
    { 
      id: 'p5', 
      code: 'SDT000005', 
      name: 'Epoxy Hardener', 
      standardName: 'Epoxy Resin Hardener Type II',
      description: 'High-performance epoxy hardener for industrial applications',
      brand: 'EpoxyPro', 
      model: 'EP-200', 
      category: 'Hardeners', 
      uom: 'KG', 
      status: 'Active', 
      barcode: '6789012345678', 
      costPrice: 25.00,
      specType: 'text',
      specText: 'High-performance epoxy hardener for industrial applications.\n\nKey Properties:\n- Density: 1.1 g/cm³\n- Flash Point: 150°C\n- Mix Ratio: 1:2',
      specPdf: null,
      specPdfName: '',
      specPdfSize: '',
      specPdfUrl: ''
    }
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
    uom: 'KG',
    barcode: '',
    costPrice: 0,
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
    uom: product.uom || 'KG',
    barcode: product.barcode || '',
    costPrice: product.costPrice || 0,
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
      status: 'Active' // Always Active by default
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

// -- Category --
const openAddCategoryModal = () => {
  newCategoryName.value = '';
  categoryExists.value = false;
  showCategoryModal.value = true;
};

const closeCategoryModal = () => {
  showCategoryModal.value = false;
  newCategoryName.value = '';
  categoryExists.value = false;
};

const confirmAddCategory = () => {
  const cat = newCategoryName.value.trim();
  if (!cat) return;
  
  if (categories.value.includes(cat)) {
    categoryExists.value = true;
    return;
  }
  
  categories.value.push(cat);
  categories.value.sort();
  
  closeCategoryModal();
  showToastMessage(`Category "${cat}" added successfully!`, 'success');
};

// -- PDF Functions --
const openPdfNewTab = (product) => {
  if (product.specPdfUrl) {
    window.open(product.specPdfUrl, '_blank');
  } else {
    showToastMessage(`Opening ${product.specPdfName}...`, 'success');
    setTimeout(() => {
      window.open('#', '_blank');
    }, 500);
  }
};

// -- File Upload --
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
      headers = ['Code', 'Name', 'Standard Name', 'Category', 'UOM', 'Status', 'Cost Price'];
      rows = data.map(p => [
        p.code, p.name, p.standardName || '', p.category || '', p.uom, p.status,
        p.costPrice || 0
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
const changePage = (page) => {
  currentPage.value = page;
};

const changePageSize = () => {
  currentPage.value = 1;
};

// -- Filters --
const onSearchChange = () => {
  currentPage.value = 1;
};

const onFilterChange = () => {
  currentPage.value = 1;
};

// -- UI --
const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

// -- Toast --
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
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

.btn-export:hover:not(:disabled) {
  background: #059669;
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
}

.btn-add:hover {
  background: #2563eb;
}

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
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-pdf-open {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-pdf-open:hover {
  background: #2563eb;
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

.icon-btn:hover {
  background: #f1f5f9;
}

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

.tab:hover {
  background: #f1f5f9;
}

.tab.active {
  color: #3b82f6;
  background: #eff6ff;
}

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

.product-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px;
}

.product-table th,
.product-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.product-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.inactive-row {
  opacity: 0.6;
}

.discontinued-row {
  opacity: 0.4;
  text-decoration: line-through;
}

.text-center {
  text-align: center;
}

.sku {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.common-name {
  font-weight: 500;
  color: #1e293b;
}

.standard-name {
  font-size: 11px;
  color: #94a3b8;
}

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.discontinued {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

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

.expand-btn:hover {
  background: #e0e7ff;
}

.expanded-row {
  background: #f8fafc;
}

.detail-expand-row td {
  padding: 0 !important;
}

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

.detail-card.full-width {
  grid-column: 1 / -1;
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

.detail-card > div:last-child {
  border-bottom: none;
}

.detail-card .value {
  font-weight: 500;
  color: #1e293b;
}

/* ================================================================
   SPECIFICATIONS
   ================================================================ */
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

.pdf-icon {
  font-size: 20px;
}

.pdf-name {
  font-weight: 500;
  color: #1e293b;
}

.pdf-size {
  font-size: 11px;
  color: #94a3b8;
}

.no-specs {
  color: #94a3b8;
  font-size: 13px;
  padding: 12px;
  text-align: center;
}

/* ================================================================
   CATEGORIES TAB
   ================================================================ */
.categories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.categories-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.category-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.category-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.category-icon {
  font-size: 32px;
}

.category-info h3 {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
}

.category-info p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #64748b;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

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
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* Product Form */
.product-modal {
  max-width: 750px;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 16px 0 12px 0;
  padding-bottom: 4px;
  border-bottom: 2px solid #e2e8f0;
}

.product-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.product-form .form-group {
  flex: 1;
  min-width: 120px;
}

.product-form .form-group.full-width {
  flex: 1 1 100%;
}

.product-form .form-group label {
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
.product-form .form-group textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.product-form .form-group input:focus,
.product-form .form-group select:focus,
.product-form .form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.product-form .hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.category-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: white;
}

/* Spec Type Selector */
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

.spec-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* File Upload */
.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background: #f8fafc;
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

/* Category Modal */
.category-modal {
  max-width: 400px;
}

.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
}

/* Export Modal */
.export-modal {
  max-width: 400px;
}

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
  transition: all 0.2s;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

/* ================================================================
   LOADING & EMPTY STATES
   ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-state p {
  color: #94a3b8;
}

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
  transition: all 0.2s;
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
}

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

.toast.error {
  border-left-color: #ef4444;
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
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-bar select {
    width: 100%;
  }
  
  .spec-type-selector {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 600px) {
  .section-card {
    padding: 12px;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab {
    flex: 1;
    text-align: center;
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .product-table {
    min-width: 500px;
  }
  
  .modal-container {
    margin: 10px;
    max-height: 95vh;
  }
  
  .product-form .form-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>