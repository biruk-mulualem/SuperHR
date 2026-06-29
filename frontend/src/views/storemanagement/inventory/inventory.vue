<!-- pages/inventory.vue - FULLY UPDATED WITH RICH TEXT EDITOR -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📦 Item Master Data</h2>
       
      </div>

      <div class="header-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search items..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-import" @click="openImportModal" :disabled="importing">
          <span v-if="importing" class="spinner-small"></span>
          <span v-else>📥</span>
          {{ importing ? "Importing..." : "Import" }}
        </button>
        <button class="btn-export" @click="openExportModal" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
        <button class="btn-add" @click="openAddItem">➕ Add Item</button>
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
      <!-- TAB 1: ITEM LIST                                             -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'items'" class="items-tab">
        <div class="filter-bar">
          <select v-model="filterCategory" class="filter-select" @change="onFilterChange">
            <option value="">All Categories</option>
            <option v-for="cat in activeCategoryNames" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discontinued">Discontinued</option>
          </select>
          <select v-model="filterUOM" class="filter-select" @change="onFilterChange">
            <option value="">All UOM</option>
            <option v-for="uom in activeUOMs" :key="uom.code" :value="uom.code">{{ uom.code }}</option>
          </select>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading items...</p>
        </div>

        <div v-else-if="filteredItems.length === 0" class="empty-state">
          <div class="empty-icon">🧪</div>
          <h3>No items found</h3>
          <p>Add your first item to the master catalog</p>
          <button @click="openAddItem" class="btn-primary">Add Item</button>
        </div>

        <div v-else class="table-container">
          <table class="item-table">
            <thead>
              <tr>
                <th style="width:35px"></th>
                <th>Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>UOM</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in paginatedItems" :key="item.itemId || item.id">
                <tr
                  :class="{
                    'expanded-row': expandedRow === (item.itemId || item.id),
                    'inactive-row': item.status === 'Inactive',
                    'discontinued-row': item.status === 'Discontinued'
                  }"
                >
                  <td class="text-center">
                    <button class="expand-btn" @click="toggleExpand(item.itemId || item.id)">
                      {{ expandedRow === (item.itemId || item.id) ? "▼" : "▶" }}
                    </button>
                  </td>
                  <td class="sku">{{ item.code }}</td>
                  <td>
                    <div class="item-info">
                      <span class="common-name">{{ item.name }}</span>
                      <span class="standard-name">{{ item.standardName }}</span>
                    </div>
                  </td>
                  <td>{{ item.category?.name || '-' }}</td>
                  <td>{{ item.uom?.code || '-' }}</td>
                  <td>
                    <span :class="['status-badge', item.status.toLowerCase()]">
                      {{ item.status }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button @click="openEditItem(item)" class="icon-btn" title="Edit">✏️</button>
                      <button @click="openDeactivateModal(item)" class="icon-btn" :title="item.status === 'Active' ? 'Deactivate' : 'Activate'">
                        {{ item.status === 'Active' ? '⏸️' : '▶️' }}
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="expandedRow === (item.itemId || item.id)" class="detail-expand-row">
                  <td colspan="7">
                    <div class="expand-details">
                      <div class="detail-container">
                        <div class="detail-row-two-cols">
                          <div class="detail-card">
                            <h4>📋 Basic Information</h4>
                            <div><span>Item Code</span><span class="value">{{ item.code }}</span></div>
                            <div><span>Item Name</span><span class="value">{{ item.name }}</span></div>
                            <div><span>Standard Name</span><span class="value">{{ item.standardName || '-' }}</span></div>
                            <div><span>Description</span><span class="value">{{ item.description || '-' }}</span></div>
                            <div><span>Brand</span><span class="value">{{ item.brand || '-' }}</span></div>
                            <div><span>Model</span><span class="value">{{ item.model || '-' }}</span></div>
                            <div><span>Barcode</span><span class="value">{{ item.barcode || '-' }}</span></div>
                          </div>

                          <div class="detail-card">
                            <h4>💰 Pricing & Unit</h4>
                            <div><span>Unit of Measure</span><span class="value">{{ item.uom?.code || item.uom }}</span></div>
                            
                            <!-- Conversion Display -->
                            <div>
                              <span>Conversion</span>
                              <span class="value">{{ getConversionDisplay(item) }}</span>
                            </div>
                            <div>
                              <span>Conversion Unit</span>
                              <span class="value">{{ item.conversionUom?.code || item.conversionUom || item.uom }}</span>
                            </div>
                            <div>
                              <span>Conversion Value</span>
                              <span class="value">{{ item.conversionValue || 1 }}</span>
                            </div>
                            <div><span>Cost Price</span><span class="value">${{ formatCurrency(item.costPrice) }}</span></div>
                          </div>
                        </div>

                        <div class="detail-card full-width">
                          <h4>📄 Specifications</h4>
                          <div v-if="item.specType === 'text' && item.specText" class="spec-text-content" v-html="item.specText"></div>
                          <div v-if="item.specType === 'pdf' && item.specPdfUrl" class="spec-pdf-content">
                            <span class="pdf-icon">📎</span>
                            <span class="pdf-name">{{ item.specPdfName || 'Specification Document.pdf' }}</span>
                            <span class="pdf-size">{{ item.specPdfSize || '250 KB' }}</span>
                            <button @click="openPdfNewTab(item)" class="btn-pdf-open">📖 Open PDF</button>
                          </div>
                          <div v-if="!item.specText && !item.specPdfUrl" class="no-specs">
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

    <div class="pagination" v-if="filteredItems.length > 0">
  <button 
    class="page-btn" 
    :disabled="!canGoPrev" 
    @click="changePage(currentPage - 1)"
  >
    ← Previous
  </button>
  <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
  <button 
    class="page-btn" 
    :disabled="!canGoNext" 
    @click="changePage(currentPage + 1)"
  >
    Next →
  </button>
  <select v-model="pageSize" @change="changePageSize" class="limit-select">
    <option :value="5">5 per page</option>
    <option :value="10">10 per page</option>
    <option :value="20">20 per page</option>
    <option :value="50">50 per page</option>
  </select>
  <span class="total-items">Total: {{ filteredItems.length }} items</span>
</div>
      </div>

      <!-- ============================================================ -->
      <!-- TAB 2: CATEGORIES                                             -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'categories'" class="categories-tab">
        <div class="section-header">
          <h2>📁 Item Categories</h2>
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
              <tr v-for="(cat, index) in paginatedCategories" :key="cat.categoryId || cat.id">
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
              <tr v-for="(uom, index) in paginatedUOMs" :key="uom.uomId || uom.id">
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

  <!-- ITEM MODAL -->
  <div v-if="showItemModal" class="modal-overlay" @click.self="closeItemModal">
    <div class="modal-container item-modal">
      <div class="modal-header">
        <h3>{{ editingItem ? '✏️ Edit Item' : '➕ Add New Item' }}</h3>
        <button class="modal-close" @click="closeItemModal">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveItem" class="item-form">
          <div class="form-section-title">Basic Information</div>
          <div class="form-row">
            <div class="form-group">
              <label>Item Name *</label>
              <input v-model="itemForm.name" type="text" required />
            </div>
            <div class="form-group">
              <label>Standard Name</label>
              <input v-model="itemForm.standardName" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="itemForm.description" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Brand</label>
              <input v-model="itemForm.brand" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Model</label>
              <input v-model="itemForm.model" type="text" />
            </div>
            <div class="form-group">
              <label>Barcode</label>
              <input v-model="itemForm.barcode" type="text" />
            </div>
          </div>

          <div class="form-section-title">Category & Unit</div>
          <div class="form-row">
            <div class="form-group">
              <label>Category *</label>
              <select v-model="itemForm.categoryId" required>
                <option value="">Select Category...</option>
                <option v-for="cat in activeCategories" :key="cat.categoryId" :value="cat.categoryId">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Unit of Measure (UOM) *</label>
              <select v-model="itemForm.uomId" required @change="onUOMChange">
                <option value="">Select UOM...</option>
                <option v-for="uom in activeUOMs" :key="uom.uomId" :value="uom.uomId">
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
              <select v-model="itemForm.conversionUomId" @change="onConversionUnitChange">
                <option value="">Select Conversion Unit...</option>
                <option v-for="uom in activeUOMs" :key="uom.uomId" :value="uom.uomId">
                  {{ uom.code }} - {{ uom.name }}
                </option>
              </select>
              <span class="hint">Select the unit this converts to</span>
            </div>
            <div class="form-group">
              <label>Conversion Value</label>
              <input v-model.number="itemForm.conversionValue" type="number" step="0.01" min="0" placeholder="e.g., 165" />
              <span class="hint" v-if="itemForm.conversionUomId && itemForm.conversionValue">
                {{ itemForm.conversionValue }} {{ getUOMCode(itemForm.conversionUomId) }} = 1 {{ getUOMCode(itemForm.uomId) }}
              </span>
              <span class="hint" v-else-if="itemForm.uomId && !itemForm.conversionUomId">Base Unit (no conversion)</span>
            </div>
          </div>

          <div class="form-section-title">Pricing</div>
          <div class="form-row">
            <div class="form-group">
              <label>Cost Price ($)</label>
              <input v-model.number="itemForm.costPrice" type="number" step="0.01" min="0" />
            </div>
          </div>

          <div class="form-section-title">Specifications</div>
          <div class="spec-type-selector">
            <label class="spec-option">
              <input type="radio" value="text" v-model="specType" /> 
              📝 Rich Text Specifications
            </label>
            <label class="spec-option">
              <input type="radio" value="pdf" v-model="specType" /> 
              📄 PDF Document
            </label>
          </div>
          
          <div v-if="specType === 'text'" class="form-row">
            <div class="form-group full-width">
              <label>Rich Text Specifications</label>
              <ClientOnly>
                <QuillEditor 
                  v-model:content="itemForm.specText" 
                  content-type="html"
                  theme="snow"
                  :toolbar="quillToolbar"
                  class="quill-editor"
                  @update:content="onQuillUpdate"
                />
              </ClientOnly>
            </div>
          </div>

          <div v-if="specType === 'pdf'" class="form-row">
            <div class="form-group full-width">
              <label>PDF Specification Document</label>
              <div class="file-upload-area" @click="triggerFileUpload">
                <div v-if="itemForm.specPdfFile" class="file-preview">
                  <span class="file-icon">📄</span>
                  <span class="file-name">{{ itemForm.specPdfFile.name }}</span>
                  <span class="file-size">{{ formatFileSize(itemForm.specPdfFile.size) }}</span>
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
        <button class="btn-secondary" @click="closeItemModal">Cancel</button>
        <button class="btn-primary" @click="saveItem" :disabled="savingItem">
          {{ savingItem ? 'Saving...' : (editingItem ? 'Update' : 'Add') }}
        </button>
      </div>
    </div>
  </div>

  <!-- DEACTIVATE/CONFIRMATION MODAL -->
  <div v-if="showDeactivateModal" class="modal-overlay" @click.self="closeDeactivateModal">
    <div class="modal-container deactivate-modal">
      <div class="modal-header">
        <h3>{{ deactivateItem?.status === 'Active' ? '⏸️ Confirm Deactivate' : '▶️ Confirm Activate' }}</h3>
        <button class="modal-close" @click="closeDeactivateModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="confirmation-icon">🔄</div>
        <p class="confirmation-title">Are you sure you want to change the status?</p>
        <div class="confirmation-details">
          <div class="detail-row">
            <span class="detail-label">Item:</span>
            <span class="detail-value">{{ deactivateItem?.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Code:</span>
            <span class="detail-value">{{ deactivateItem?.code }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Current Status:</span>
            <span :class="['status-badge', deactivateItem?.status?.toLowerCase() || 'active']">
              {{ deactivateItem?.status || 'Active' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">New Status:</span>
            <span :class="['status-badge', getNewStatus(deactivateItem?.status)?.toLowerCase() || 'inactive']">
              {{ getNewStatus(deactivateItem?.status) }}
            </span>
          </div>
        </div>
        <p class="warning-text">⚠️ This action will {{ deactivateItem?.status === 'Active' ? 'deactivate' : 'activate' }} this item.</p>
        <p class="warning-subtext" v-if="deactivateItem?.status === 'Active'">
          Deactivated items will not appear in dropdown selections.
        </p>
        <p class="warning-subtext" v-else>
          Activated items will appear in dropdown selections.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeDeactivateModal">Cancel</button>
        <button class="btn-primary" @click="confirmDeactivate">
          {{ deactivateItem?.status === 'Active' ? 'Deactivate' : 'Activate' }}
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
        <h3>📊 Export Item Data</h3>
        <button class="modal-close" @click="closeExportModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="export-options">
          <div class="export-option" @click="exportType = 'full'">
            <input type="radio" v-model="exportType" value="full" /> Full Item Catalog
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

  <!-- ================================================================ -->
  <!-- IMPORT MODAL - UPDATED WITH PROGRESS                           -->
  <!-- ================================================================ -->
  <div v-if="showImportModal" class="modal-overlay" @click.self="!importing && closeImportModal()">
    <div class="modal-container import-modal">
      <div class="modal-header">
        <h3>📥 Import Items from CSV</h3>
        <button class="modal-close" @click="!importing && closeImportModal()" :disabled="importing">✕</button>
      </div>
      <div class="modal-body">
        <!-- Import Info -->
        <div class="import-info">
          <div class="info-box">
            <span class="info-icon">ℹ️</span>
            <div>
              <p><strong>CSV Format Required:</strong></p>
              <p class="info-text">Your CSV should have the following columns:</p>
              <ul class="csv-format-list">
                <li><strong>name</strong> - Item name (required)</li>
                <li><strong>standardName</strong> - Standard name</li>
                <li><strong>description</strong> - Item description</li>
                <li><strong>brand</strong> - Brand name</li>
                <li><strong>model</strong> - Model number</li>
                <li><strong>barcode</strong> - Barcode</li>
                <li><strong>categoryName</strong> - Category name (will be created if not exists)</li>
                <li><strong>uomCode</strong> - UOM code (will be created if not exists)</li>
                <li><strong>conversionUomCode</strong> - Conversion UOM code (e.g., KG, L)</li>
                <li><strong>conversionValue</strong> - Conversion value (e.g., 165)</li>
                <li><strong>costPrice</strong> - Cost price</li>
                <li><strong>specText</strong> - Specification text</li>
              </ul>
              <button class="btn-template" @click="downloadTemplate" :disabled="importing">
                📄 Download CSV Template
              </button>
            </div>
          </div>
        </div>

        <!-- File Upload -->
        <div class="file-upload-area import-upload" @click="!importing && triggerCsvUpload()" 
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

        <!-- Progress Bar -->
        <div v-if="importing" class="import-progress">
          <div class="progress-info">
            <span>Importing items...</span>
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
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>UOM</th>
                  <th>Conversion UOM</th>
                  <th>Cost Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in importPreviewData.slice(0, 10)" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.name || 'N/A' }}</td>
                  <td>{{ item.categoryName || 'N/A' }}</td>
                  <td>{{ item.uomCode || 'N/A' }}</td>
                  <td>{{ item.conversionUomCode || 'N/A' }}</td>
                  <td>${{ formatCurrency(item.costPrice) }}</td>
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
      <div class="modal-footer">
        <button class="btn-secondary" @click="!importing && closeImportModal()" :disabled="importing">Close</button>
        <button class="btn-primary" @click="processImport" :disabled="!csvFile || importing">
          {{ importing ? 'Importing...' : 'Import Items' }}
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
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue';
import itemService from '@/stores/itemService';

// Import Quill editor dynamically
const QuillEditor = defineAsyncComponent(() => 
  import('@vueup/vue-quill').then(m => m.QuillEditor)
);

// ================================================================
// STATE
// ================================================================
const items = ref([]);
const categories = ref([]);
const uomList = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const filterUOM = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const activeTab = ref('items');
const expandedRow = ref(null);
const specType = ref('text');

// Item Modals
const showItemModal = ref(false);
const editingItem = ref(null);
const savingItem = ref(false);

// Deactivate Modal
const showDeactivateModal = ref(false);
const deactivateItem = ref(null);

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

// Export
const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref('full');

// Import
const showImportModal = ref(false);
const importing = ref(false);
const csvFile = ref(null);
const csvFileInput = ref(null);
const isDragOver = ref(false);
const importPreviewData = ref([]);
const importResults = ref(null);
const importProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  remaining: 0,
  percentage: 0
});

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const pdfFileInput = ref(null);

// Quill Editor Toolbar
const quillToolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'header': 1 }, { 'header': 2 }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  [{ 'direction': 'rtl' }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'font': [] }],
  [{ 'align': [] }],
  ['clean']
];

// ================================================================
// TABS DEFINITION
// ================================================================
const tabs = [
  { key: 'items', label: '📦 Items' },
  { key: 'categories', label: '📁 Categories' },
  { key: 'uom', label: '📏 UOM' }
];

const itemForm = ref({
  name: '',
  standardName: '',
  description: '',
  brand: '',
  model: '',
  barcode: '',
  categoryId: '',
  uomId: '',
  conversionUomId: '',
  conversionValue: 0,
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

const activeCategories = computed(() => {
  return categories.value.filter(c => c.status === 'Active');
});

const activeUOMs = computed(() => {
  return uomList.value.filter(u => u.status === 'Active');
});

const activeCategoryNames = computed(() => {
  return categories.value.filter(c => c.status === 'Active').map(c => c.name);
});

const filteredItems = computed(() => {
  return items.value || [];
});

// ✅ FIXED: Total pages with proper validation
const totalPages = computed(() => {
  const total = filteredItems.value.length;
  const perPage = pageSize.value;
  if (total === 0) return 1;
  return Math.ceil(total / perPage);
});

// ✅ FIXED: Paginated items with proper slicing
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredItems.value.slice(start, end);
});

// ✅ FIXED: Pagination helper computed properties
const canGoPrev = computed(() => currentPage.value > 1);
const canGoNext = computed(() => currentPage.value < totalPages.value);

const paginatedCategories = computed(() => {
  const start = (categoryPage.value - 1) * categoryPageSize.value;
  return categories.value.slice(start, start + categoryPageSize.value);
});

const categoryTotalPages = computed(() => {
  return Math.ceil(categories.value.length / categoryPageSize.value) || 1;
});

const paginatedUOMs = computed(() => {
  const start = (uomPage.value - 1) * uomPageSize.value;
  return uomList.value.slice(start, start + uomPageSize.value);
});

const uomTotalPages = computed(() => {
  return Math.ceil(uomList.value.length / uomPageSize.value) || 1;
});

// ================================================================
// HELPER METHODS
// ================================================================

const getUOMCode = (id) => {
  const uom = uomList.value.find(u => (u.uomId || u.id) === id);
  return uom?.code || '';
};

const getConversionDisplay = (item) => {
  if (!item) return '';
  const uomCode = item.uom?.code || item.uom;
  const convUnit = item.conversionUom?.code || item.conversionUom;
  const convValue = item.conversionValue;
  
  if (convUnit && convValue && convValue > 0) {
    return `${convValue} ${convUnit} = 1 ${uomCode}`;
  }
  return `1 ${uomCode} = 1 ${uomCode}`;
};

const getNewStatus = (currentStatus) => {
  return currentStatus === 'Active' ? 'Inactive' : 'Active';
};

const formatCurrency = (amt) => {
  if (!amt && amt !== 0) return '0.00';
  const num = parseFloat(amt);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ================================================================
// ✅ FIXED: PAGINATION METHODS
// ================================================================

const changePage = (page) => {
  // Validate page number
  if (page < 1) {
    currentPage.value = 1;
    return;
  }
  if (page > totalPages.value) {
    currentPage.value = totalPages.value;
    return;
  }
  currentPage.value = page;
  loadItems();
};

const changePageSize = () => {
  currentPage.value = 1;
  loadItems();
};

const onSearchChange = () => {
  currentPage.value = 1;
  loadItems();
};

const onFilterChange = () => {
  currentPage.value = 1;
  loadItems();
};

const toggleExpand = (id) => { 
  expandedRow.value = expandedRow.value === id ? null : id; 
};

// ================================================================
// DOWNLOAD TEMPLATE CSV
// ================================================================

const downloadTemplate = () => {
  const headers = [
    'name',
    'standardName',
    'description',
    'brand',
    'model',
    'barcode',
    'categoryName',
    'uomCode',
    'conversionUomCode',
    'conversionValue',
    'costPrice',
    'specText'
  ];

  const sampleData = [
    {
      name: 'Sample Item 1',
      standardName: 'Standard Name 1',
      description: 'This is a sample description for the item',
      brand: 'BrandX',
      model: 'Model-100',
      barcode: '1234567890123',
      categoryName: 'Electronics',
      uomCode: 'Each',
      conversionUomCode: 'Dozen',
      conversionValue: '12',
      costPrice: '25.50',
      specText: '<p><strong>Sample specifications</strong></p><ul><li>Feature 1</li><li>Feature 2</li></ul>'
    },
    {
      name: 'Sample Item 2',
      standardName: 'Standard Name 2',
      description: 'Another sample item description',
      brand: 'BrandY',
      model: 'Model-200',
      barcode: '9876543210987',
      categoryName: 'Chemicals',
      uomCode: 'KG',
      conversionUomCode: 'L',
      conversionValue: '1.5',
      costPrice: '45.75',
      specText: '<p><strong>Chemical specifications</strong></p><p>Purity: 99%</p>'
    }
  ];

  let csvContent = headers.join(',') + '\n';
  
  sampleData.forEach(row => {
    const values = headers.map(header => {
      let value = row[header] || '';
      if (header === 'barcode') {
        value = `="${value}"`;
      }
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `item_import_template_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToastMessage('Template CSV downloaded successfully!', 'success');
};

// ================================================================
// LOAD DATA
// ================================================================

const loadCategories = async () => {
  try {
    const response = await itemService.getCategories();
    if (response.success) {
      categories.value = response.data;
    } else {
      showToastMessage(response.error || 'Failed to load categories', 'error');
    }
  } catch (error) {
    console.error('Load categories error:', error);
    showToastMessage('Failed to load categories', 'error');
  }
};

const loadUOMs = async () => {
  try {
    const response = await itemService.getUOMs();
    if (response.success) {
      uomList.value = response.data;
    } else {
      showToastMessage(response.error || 'Failed to load UOMs', 'error');
    }
  } catch (error) {
    console.error('Load UOMs error:', error);
    showToastMessage('Failed to load UOMs', 'error');
  }
};

const loadItems = async () => {
  loading.value = true;
  try {
    let categoryId = undefined;
    if (filterCategory.value) {
      const category = categories.value.find(c => c.name === filterCategory.value);
      categoryId = category?.categoryId || category?.id;
    }
    
    let uomId = undefined;
    if (filterUOM.value) {
      const uom = uomList.value.find(u => u.code === filterUOM.value);
      uomId = uom?.uomId || uom?.id;
    }

    const response = await itemService.getItems({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      categoryId: categoryId,
      status: filterStatus.value || undefined,
      uomId: uomId
    });
    
    if (response.success) {
      items.value = response.data.items;
      
      // ✅ FIXED: Ensure current page is valid after loading
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    } else {
      showToastMessage(response.error || 'Failed to load items', 'error');
    }
  } catch (error) {
    console.error('Load items error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to load items', 'error');
  } finally {
    loading.value = false;
  }
};

// ================================================================
// SAVE ITEM
// ================================================================
const saveItem = async () => {
  savingItem.value = true;
  try {
    const formData = {
      name: itemForm.value.name,
      standardName: itemForm.value.standardName || null,
      description: itemForm.value.description || null,
      brand: itemForm.value.brand || null,
      model: itemForm.value.model || null,
      barcode: itemForm.value.barcode || null,
      categoryId: itemForm.value.categoryId ? parseInt(itemForm.value.categoryId) : null,
      uomId: parseInt(itemForm.value.uomId),
      conversionUomId: itemForm.value.conversionUomId ? parseInt(itemForm.value.conversionUomId) : null,
      conversionValue: itemForm.value.conversionValue || 0,
      costPrice: itemForm.value.costPrice || 0,
      specType: specType.value,
    };

    if (specType.value === 'text') {
      formData.specText = itemForm.value.specText || null;
      formData.specPdfName = null;
      formData.specPdfSize = null;
      formData.specPdfUrl = null;
    } else {
      formData.specText = null;
      if (itemForm.value.specPdfFile) {
        formData.specPdfName = itemForm.value.specPdfFile.name;
        formData.specPdfSize = formatFileSize(itemForm.value.specPdfFile.size);
      }
    }

    let response;
    const itemId = editingItem.value?.itemId;

    if (editingItem.value) {
      response = await itemService.updateItem(itemId, formData);
      if (response.success) {
        showToastMessage('Item updated successfully!', 'success');
        if (itemForm.value.specPdfFile && specType.value === 'pdf') {
          await uploadSpecificationFile(itemId, itemForm.value.specPdfFile);
        }
        await loadItems();
        closeItemModal();
      } else {
        showToastMessage(response.error || 'Failed to update item', 'error');
      }
    } else {
      response = await itemService.createItem(formData);
      if (response.success) {
        showToastMessage('Item added successfully!', 'success');
        const newItemId = response.data.itemId || response.data.id;
        if (itemForm.value.specPdfFile && specType.value === 'pdf') {
          await uploadSpecificationFile(newItemId, itemForm.value.specPdfFile);
        }
        await loadItems();
        closeItemModal();
      } else {
        showToastMessage(response.error || 'Failed to create item', 'error');
      }
    }
  } catch (error) {
    console.error('Save item error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to save item', 'error');
  } finally {
    savingItem.value = false;
  }
};

const uploadSpecificationFile = async (itemId, file) => {
  try {
    const response = await itemService.uploadSpecification(itemId, file);
    if (!response.success) {
      showToastMessage(response.error || 'Failed to upload specification', 'error');
    }
  } catch (error) {
    console.error('Upload specification error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to upload specification', 'error');
  }
};

// ================================================================
// DEACTIVATE ITEM
// ================================================================
const confirmDeactivate = async () => {
  if (deactivateItem.value) {
    try {
      const newStatus = deactivateItem.value.status === 'Active' ? 'Inactive' : 'Active';
      const itemId = deactivateItem.value.itemId;
      let response;
      
      if (newStatus === 'Active') {
        response = await itemService.activateItem(itemId);
      } else {
        response = await itemService.deactivateItem(itemId);
      }
      
      if (response.success) {
        showToastMessage(`Item "${deactivateItem.value.name}" ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`, 'success');
        await loadItems();
        closeDeactivateModal();
      } else {
        showToastMessage(response.error || 'Failed to change status', 'error');
      }
    } catch (error) {
      console.error('Status change error:', error);
      showToastMessage(error.response?.data?.error || 'Failed to change status', 'error');
    }
  }
};

// ================================================================
// CATEGORY CRUD
// ================================================================
const confirmSaveCategory = async () => {
  const catName = categoryForm.value.name.trim();
  if (!catName) return;
  
  try {
    if (editingCategory.value) {
      const response = await itemService.updateCategory(editingCategory.value.categoryId, {
        name: catName,
        status: categoryForm.value.status
      });
      if (response.success) {
        showToastMessage('Category updated!', 'success');
        await loadCategories();
        await loadItems();
        closeCategoryModal();
      } else {
        showToastMessage(response.error || 'Failed to update category', 'error');
      }
    } else {
      const exists = categories.value.some(c => c.name === catName);
      if (exists) {
        categoryExists.value = true;
        return;
      }
      const response = await itemService.createCategory({ name: catName });
      if (response.success) {
        showToastMessage(`Category "${catName}" added!`, 'success');
        await loadCategories();
        await loadItems();
        closeCategoryModal();
      } else {
        showToastMessage(response.error || 'Failed to add category', 'error');
      }
    }
  } catch (error) {
    console.error('Category save error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to save category', 'error');
  }
};

const toggleCategoryStatus = async (cat) => {
  try {
    const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    const response = await itemService.updateCategory(cat.categoryId, { status: newStatus });
    if (response.success) {
      showToastMessage(`Category "${cat.name}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
      await loadCategories();
      await loadItems();
    } else {
      showToastMessage(response.error || 'Failed to change status', 'error');
    }
  } catch (error) {
    console.error('Category status error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to change status', 'error');
  }
};

// ================================================================
// UOM CRUD
// ================================================================
const saveUOM = async () => {
  const code = uomForm.value.code.trim();
  const name = uomForm.value.name.trim();
  
  if (!code || !name) {
    showToastMessage('Please enter both code and name', 'error');
    return;
  }
  
  try {
    if (editingUOM.value) {
      const response = await itemService.updateUOM(editingUOM.value.uomId, { name });
      if (response.success) {
        showToastMessage('UOM updated!', 'success');
        await loadUOMs();
        await loadItems();
        closeUOMModal();
      } else {
        showToastMessage(response.error || 'Failed to update UOM', 'error');
      }
    } else {
      const exists = uomList.value.some(u => u.code === code);
      if (exists) {
        showToastMessage(`UOM "${code}" already exists`, 'error');
        return;
      }
      const response = await itemService.createUOM({ code, name });
      if (response.success) {
        showToastMessage(`UOM "${code}" added!`, 'success');
        await loadUOMs();
        await loadItems();
        closeUOMModal();
      } else {
        showToastMessage(response.error || 'Failed to add UOM', 'error');
      }
    }
  } catch (error) {
    console.error('UOM save error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to save UOM', 'error');
  }
};

const toggleUOMStatus = async (uom) => {
  try {
    const newStatus = uom.status === 'Active' ? 'Inactive' : 'Active';
    const response = await itemService.updateUOM(uom.uomId, { status: newStatus });
    if (response.success) {
      showToastMessage(`UOM "${uom.code}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
      await loadUOMs();
      await loadItems();
    } else {
      showToastMessage(response.error || 'Failed to change status', 'error');
    }
  } catch (error) {
    console.error('UOM status error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to change status', 'error');
  }
};

// ================================================================
// EXPORT
// ================================================================
const exportSelectedReport = async () => {
  exporting.value = true;
  try {
    let categoryId = undefined;
    if (filterCategory.value) {
      const category = categories.value.find(c => c.name === filterCategory.value);
      categoryId = category?.categoryId || category?.id;
    }
    
    const response = await itemService.exportItems({
      categoryId: categoryId,
      status: filterStatus.value || undefined
    });
    
    if (response.success && response.data.length > 0) {
      const headers = Object.keys(response.data[0]);
      const rows = response.data.map(item => headers.map(key => item[key]));
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `item_catalog_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToastMessage('Export completed!', 'success');
    } else {
      showToastMessage(response.error || 'No data to export', 'error');
    }
  } catch (error) {
    console.error('Export error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to export', 'error');
  } finally {
    exporting.value = false;
    closeExportModal();
  }
};

// ================================================================
// IMPORT
// ================================================================

const openImportModal = () => {
  showImportModal.value = true;
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
  importProgress.value = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: 0,
    percentage: 0
  };
};

const closeImportModal = () => {
  showImportModal.value = false;
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
  importing.value = false;
  importProgress.value = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: 0,
    percentage: 0
  };
};

const triggerCsvUpload = () => {
  csvFileInput.value.click();
};

const handleCsvUpload = (event) => {
  const file = event.target.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMessage('Please upload a valid CSV file', 'error');
  }
  event.target.value = '';
};

const handleCsvDrop = (event) => {
  isDragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMessage('Please upload a valid CSV file', 'error');
  }
};

const parseCsvFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        showToastMessage('CSV file must contain headers and at least one data row', 'error');
        return;
      }
      
      const headers = parseCSVLine(lines[0]);
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => {
          let value = values[idx] || '';
          value = value.trim();
          if (h === 'barcode' && value) {
            value = value.replace(/[^0-9]/g, '');
          }
          if (['conversionValue', 'costPrice'].includes(h) && value) {
            value = parseFloat(value) || 0;
          }
          obj[h] = value;
        });
        if (obj.name) {
          data.push(obj);
        }
      }
      
      importPreviewData.value = data;
      showToastMessage(`Successfully parsed ${data.length} items from CSV`, 'success');
    } catch (error) {
      console.error('CSV parse error:', error);
      showToastMessage('Failed to parse CSV file. Please check the format.', 'error');
    }
  };
  reader.readAsText(file);
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const processImport = async () => {
  if (!csvFile.value || importPreviewData.value.length === 0) {
    showToastMessage('No data to import', 'error');
    return;
  }

  importing.value = true;
  importResults.value = null;
  
  const totalItems = importPreviewData.value.length;
  importProgress.value = {
    total: totalItems,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: totalItems,
    percentage: 0
  };

  try {
    const response = await itemService.importItems(importPreviewData.value);
    
    if (response.success) {
      importResults.value = {
        success: response.data.success,
        failed: response.data.failed,
        total: response.data.total,
        errors: response.data.results
          .filter(r => !r.success)
          .map(r => `${r.data?.name || 'Unknown'}: ${r.error}`)
      };
      
      importProgress.value = {
        total: response.data.total,
        processed: response.data.total,
        success: response.data.success,
        failed: response.data.failed,
        remaining: 0,
        percentage: 100
      };
      
      showToastMessage(response.message, 'success');
      await loadItems();
      await loadCategories();
      await loadUOMs();
      
      setTimeout(() => {
        closeImportModal();
      }, 2000);
      
    } else {
      showToastMessage(response.error || 'Failed to import items', 'error');
      importResults.value = {
        success: 0,
        failed: totalItems,
        total: totalItems,
        errors: [response.error || 'Import failed']
      };
      importing.value = false;
    }
  } catch (error) {
    console.error('Import error:', error);
    showToastMessage(error.response?.data?.error || 'Failed to import items', 'error');
    importResults.value = {
      success: 0,
      failed: importPreviewData.value.length,
      total: importPreviewData.value.length,
      errors: [error.message || 'Unknown error occurred']
    };
    importing.value = false;
  }
};

// ================================================================
// UI HELPERS
// ================================================================

const onUOMChange = () => {
  if (itemForm.value.uomId) {
    const selectedUOM = uomList.value.find(u => (u.uomId || u.id) === parseInt(itemForm.value.uomId));
    if (selectedUOM && !itemForm.value.conversionUomId) {
      itemForm.value.conversionUomId = itemForm.value.uomId;
      itemForm.value.conversionValue = 1;
    }
  }
};

const onConversionUnitChange = () => {
  if (!itemForm.value.conversionUomId || itemForm.value.conversionUomId === itemForm.value.uomId) {
    itemForm.value.conversionValue = 1;
  }
};

const onQuillUpdate = (content) => {
  itemForm.value.specText = content;
};

const openAddItem = () => {
  editingItem.value = null;
  specType.value = 'text';
  itemForm.value = {
    name: '',
    standardName: '',
    description: '',
    brand: '',
    model: '',
    barcode: '',
    categoryId: '',
    uomId: '',
    conversionUomId: '',
    conversionValue: 0,
    costPrice: 0,
    specType: 'text',
    specText: '',
    specPdfFile: null,
    specPdfName: '',
    specPdfSize: ''
  };
  showItemModal.value = true;
};

const openEditItem = (item) => {
  editingItem.value = item;
  
  if (item.specType === 'pdf' && item.specPdfUrl) {
    specType.value = 'pdf';
  } else {
    specType.value = 'text';
  }
  
  itemForm.value = {
    name: item.name,
    standardName: item.standardName || '',
    description: item.description || '',
    brand: item.brand || '',
    model: item.model || '',
    barcode: item.barcode || '',
    categoryId: item.categoryId || '',
    uomId: item.uomId || '',
    conversionUomId: item.conversionUomId || '',
    conversionValue: item.conversionValue || 0,
    costPrice: item.costPrice || 0,
    specType: item.specType || 'text',
    specText: item.specText || '',
    specPdfFile: null,
    specPdfName: item.specPdfName || '',
    specPdfSize: item.specPdfSize || ''
  };
  showItemModal.value = true;
};

const closeItemModal = () => {
  showItemModal.value = false;
  editingItem.value = null;
};

const openDeactivateModal = (item) => {
  deactivateItem.value = item;
  showDeactivateModal.value = true;
};

const closeDeactivateModal = () => {
  showDeactivateModal.value = false;
  deactivateItem.value = null;
};

const openPdfNewTab = (item) => {
  if (item.specPdfUrl) {
    window.open(item.specPdfUrl, '_blank');
  } else {
    showToastMessage(`Opening ${item.specPdfName}...`, 'success');
  }
};

const triggerFileUpload = () => {
  pdfFileInput.value.click();
};

const handlePdfUpload = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    itemForm.value.specPdfFile = file;
    itemForm.value.specPdfName = file.name;
    itemForm.value.specPdfSize = formatFileSize(file.size);
    showToastMessage('PDF uploaded successfully!', 'success');
  } else {
    showToastMessage('Please upload a valid PDF file', 'error');
  }
  event.target.value = '';
};

const removePdfFile = () => {
  itemForm.value.specPdfFile = null;
  itemForm.value.specPdfName = '';
  itemForm.value.specPdfSize = '';
};

// -- Category Modal --
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

// -- UOM Modal --
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

// -- Export --
const openExportModal = () => {
  showExportModal.value = true;
};

const closeExportModal = () => {
  showExportModal.value = false;
};

// -- Toast --
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 4000);
};

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadUOMs(),
    loadItems()
  ]);
});
</script>
<style scoped>
/* ================================================================
   ALL EXISTING STYLES REMAIN THE SAME
   ================================================================ */

.btn-template {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
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

/* ================================================================
   IMPORT STYLES
   ================================================================ */

.btn-import {
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
}
.btn-import:hover:not(:disabled) { background: #7c3aed; }
.btn-import:disabled { opacity: 0.6; cursor: not-allowed; }

.import-modal {
  max-width: 850px;
}

.import-info {
  margin-bottom: 16px;
}

.info-box {
  display: flex;
  gap: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
}

.info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-text {
  font-size: 13px;
  color: #475569;
  margin: 4px 0;
}

.csv-format-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: #475569;
}

.csv-format-list li {
  margin: 2px 0;
}

.import-upload {
  border-color: #8b5cf6;
  background: #faf5ff;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.import-upload.drag-over {
  border-color: #7c3aed;
  background: #ede9fe;
}

.import-upload.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.import-upload.disabled:hover {
  border-color: #8b5cf6;
  background: #faf5ff;
}

/* Progress Bar */
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
   QUILL EDITOR STYLES
   ================================================================ */

.quill-editor {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.quill-editor :deep(.ql-toolbar) {
  border-radius: 8px 8px 0 0;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.quill-editor :deep(.ql-container) {
  border-radius: 0 0 8px 8px;
  border: none;
  min-height: 150px;
  font-size: 14px;
}

.quill-editor :deep(.ql-editor) {
  min-height: 150px;
}

.quill-editor :deep(.ql-editor p) {
  margin-bottom: 8px;
}

.quill-editor :deep(.ql-editor ul),
.quill-editor :deep(.ql-editor ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

/* ================================================================
   SPECIFICATION DISPLAY
   ================================================================ */

.spec-text-content {
  background: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
  border: 1px solid #e2e8f0;
}

.spec-text-content :deep(p) {
  margin-bottom: 8px;
}

.spec-text-content :deep(ul),
.spec-text-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

.spec-text-content :deep(strong) {
  font-weight: 600;
}

.spec-text-content :deep(em) {
  font-style: italic;
}

.spec-text-content :deep(blockquote) {
  border-left: 3px solid #3b82f6;
  padding-left: 12px;
  margin: 8px 0;
  color: #475569;
}

.spec-text-content :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* ================================================================
   ALL EXISTING STYLES CONTINUE BELOW
   ================================================================ */


.btn-template {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-template:hover {
  background: #d97706;
}
/* ================================================================
   ADD THESE NEW STYLES FOR IMPORT
   ================================================================ */

.btn-import {
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
}
.btn-import:hover:not(:disabled) { background: #7c3aed; }

.import-modal {
  max-width: 750px;
}

.import-info {
  margin-bottom: 16px;
}

.info-box {
  display: flex;
  gap: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
}

.info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-text {
  font-size: 13px;
  color: #475569;
  margin: 4px 0;
}

.csv-format-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: #475569;
}

.csv-format-list li {
  margin: 2px 0;
}

.import-upload {
  border-color: #8b5cf6;
  background: #faf5ff;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-upload.drag-over {
  border-color: #7c3aed;
  background: #ede9fe;
}

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

.result-errors li {
  margin: 2px 0;
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

.item-table, .category-table, .uom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px;
}

.item-table th, .item-table td,
.category-table th, .category-table td,
.uom-table th, .uom-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.item-table th, .category-table th, .uom-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center { text-align: center; }
.sku, .code { font-weight: 600; color: #2563eb; font-size: 12px; }

.item-info {
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
   DEACTIVATE MODAL
   ================================================================ */
.deactivate-modal {
  max-width: 450px;
}

.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.confirmation-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 16px;
}

.confirmation-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
  font-size: 13px;
}

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  text-align: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
  font-size: 13px;
}

.warning-subtext {
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  margin-top: 6px;
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

.item-modal { max-width: 750px; }
.uom-modal { max-width: 450px; }
.category-modal { max-width: 450px; }
.export-modal { max-width: 400px; }
.deactivate-modal { max-width: 450px; }

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

.item-form .form-row, .uom-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}
.item-form .form-group, .uom-form .form-group {
  flex: 1;
  min-width: 120px;
}
.item-form .form-group.full-width { flex: 1 1 100%; }

.item-form .form-group label, .uom-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.item-form .form-group input,
.item-form .form-group select,
.item-form .form-group textarea,
.uom-form .form-group input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.item-form .form-group input:focus,
.item-form .form-group select:focus,
.item-form .form-group textarea:focus,
.uom-form .form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-form .hint, .uom-form .hint {
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
  .item-form .form-row, .uom-form .form-row { flex-direction: column; gap: 8px; }
}

@media (max-width: 600px) {
  .section-card { padding: 12px; }
  .tabs { flex-wrap: wrap; }
  .tab { flex: 1; text-align: center; padding: 6px 10px; font-size: 11px; }
  .pagination { flex-wrap: wrap; }
  .item-table, .category-table, .uom-table { min-width: 500px; }
  .modal-container { margin: 10px; max-height: 95vh; }
}
</style>