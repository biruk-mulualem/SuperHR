<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🧪 Formulation</h2>
        <span class="total-badge">{{ formulations.length }} Formulations</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="filters.search"
            placeholder="Search formulations..."
            @input="applyFilters"
          />
        </div>
        <button class="btn-add" @click="openCreateModal">
          ✚ Add Formulation
        </button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select
        v-model="filters.productType"
        class="filter-select"
        @change="applyFilters"
      >
        <option value="">All Types</option>
        <option value="Paint">Paint</option>
        <option value="Fiber">Fiber</option>
      </select>

      <select
        v-model="filters.status"
        class="filter-select"
        @change="applyFilters"
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Draft">Draft</option>
        <option value="Inactive">Inactive</option>
      </select>

      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Paint</span>
        <span class="stat-value">{{ stats.paintCount || stats.paint || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Fiber</span>
        <span class="stat-value">{{ stats.fiberCount || stats.fiber || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Raw Materials</span>
        <span class="stat-value">{{ stats.uniqueMaterials || 0 }}</span>
      </div>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading formulations...</p>
    </div>

    <!-- ==================== TABLE ==================== -->
    <div v-else class="table-container">
      <table class="formulation-table">
        <thead>
          <tr>
            <th style="width:35px"></th>
            <th>FG Code</th>
            <th>Product Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Version</th>
            <th>Materials</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="formulations.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🧪</span>
                <p>No formulations found</p>
                <button class="btn-secondary" @click="openCreateModal">
                  Add First Formulation
                </button>
              </div>
            </td>
          </tr>
          <template v-for="item in formulations" :key="item.id">
            <tr
              :class="{
                'expanded-row': expandedRow === item.id,
                'inactive-row': item.status === 'Inactive',
                'draft-row': item.status === 'Draft'
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(item.id)">
                  {{ expandedRow === item.id ? "▼" : "▶" }}
                </button>
              </td>
              <td><span class="fg-code">{{ item.fgCode }}</span></td>
              <td>
                <div class="product-info">
                  <span class="product-name">{{ item.productName }}</span>
                </div>
              </td>
              <td>
                <span :class="['type-badge', item.productType.toLowerCase()]">
                  {{ item.productType }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', item.status.toLowerCase()]">
                  {{ item.status }}
                </span>
              </td>
              <td>
                <span class="version-badge">v{{ item.version }}</span>
              </td>
              <td>
                <div class="materials-count">
                  <span class="count-badge">{{ item.rawMaterials?.length || 0 }}</span>
                  <span class="count-label">materials</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="action-btn edit" 
                    @click="editFormulation(item)" 
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    class="action-btn delete" 
                    @click="deleteFormulation(item)" 
                    title="Delete"
                    :disabled="!isDeletable(item)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW - STACKED VERTICALLY ==================== -->
            <tr v-if="expandedRow === item.id" class="detail-expand-row">
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Formulation Details</h4>
                        <div><span>FG Code</span><span class="value">{{ item.fgCode }}</span></div>
                        <div><span>Product Name</span><span class="value">{{ item.productName }}</span></div>
                        <div><span>Type</span><span class="value">{{ item.productType }}</span></div>
                        <div><span>Status</span><span class="value">{{ item.status }}</span></div>
                        <div><span>Version</span><span class="value">v{{ item.version }}</span></div>
                        <div><span>Description</span><span class="value">{{ item.description || 'No description' }}</span></div>
                        <div><span>Created</span><span class="value">{{ formatDate(item.createdAt) }}</span></div>
                        <div><span>Updated</span><span class="value">{{ formatDate(item.updatedAt) }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>📦 Raw Materials</h4>
                        <div v-if="!item.rawMaterials || item.rawMaterials.length === 0" class="no-materials">
                          No raw materials assigned
                        </div>
                        <div v-else class="materials-stacked">
                          <div v-for="(material, index) in item.rawMaterials" :key="index" class="material-stacked-item">
                            <span class="material-stacked-name">{{ material.itemName || material.item?.name || 'Unknown' }}</span>
                            <span class="material-stacked-qty">
                              {{ formatQuantity(material.quantity) }}
                              <span class="material-stacked-uom">{{ getConversionUomCode(material) }}</span>
                            </span>
                          </div>
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

    <!-- ==================== CREATE/EDIT MODAL ==================== -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container formulation-modal">
        <div class="modal-header">
          <h3>{{ modalMode === 'create' ? '✚ Add Formulation' : '✏️ Edit Formulation' }}</h3>
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
            <form @submit.prevent="saveFormulation">
              <div class="form-grid">
                <div class="form-group">
                  <label>Finished Good *</label>
                  <select v-model="form.finishedGoodId" required @change="onFinishedGoodChange">
                    <option value="">🔍 Select finished good...</option>
                    <option 
                      v-for="product in finishedGoods" 
                      :key="product.id" 
                      :value="product.id"
                    >
                      {{ product.name }} ({{ product.fgCode }}) - {{ product.type }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="form.status">
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div class="form-group full-width">
                <label>Description</label>
                <textarea v-model="form.description" rows="2" placeholder="Formulation description..."></textarea>
              </div>

              <!-- Raw Materials Section - Similar to Item Requests -->
              <div class="section-divider">
                <h4>📦 Raw Materials</h4>
                <button type="button" class="btn-add-row" @click="addRawMaterialRow">
                  + Add Material
                </button>
              </div>

              <div class="raw-materials-table-wrapper">
                <table class="raw-materials-table">
                  <thead>
                    <tr>
                      <th style="width:30px">#</th>
                      <th>Material</th>
                      <th style="width:120px">Quantity</th>
                      <th style="width:120px">UOM</th>
                      <th style="width:50px">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.rawMaterials.length === 0">
                      <td colspan="5" class="empty-row">
                        <span class="empty-icon-small">📭</span>
                        No raw materials added yet
                      </td>
                    </tr>
                    <tr v-for="(material, index) in form.rawMaterials" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>
                        <div class="material-select-wrapper">
                          <select 
                            :value="material.itemId" 
                            @change="onMaterialSelect(index, $event)"
                            class="material-select"
                            :class="{ 'duplicate-error': isDuplicateMaterial(index) }"
                          >
                            <option value="">🔍 Select material...</option>
                            <option 
                              v-for="item in getAvailableMaterials(index)" 
                              :key="item.itemId || item.id" 
                              :value="item.itemId || item.id"
                              :disabled="isMaterialUsed(item.itemId || item.id, index)"
                            >
                              {{ item.name }} - {{ item.code }}
                            </option>
                          </select>
                          <span v-if="isDuplicateMaterial(index)" class="error-text">
                            ⚠️ Material already added
                          </span>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          v-model.number="material.quantity" 
                          step="0.01" 
                          min="0.01" 
                          placeholder="0.00"
                          @input="onQuantityChange(index)"
                        />
                      </td>
                      <td>
                        <span class="uom-display">{{ getMaterialConversionUomCode(material) }}</span>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          class="btn-remove-row" 
                          @click="removeRawMaterialRow(index)"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                    <strong>finishedGoodCode</strong> - FG Code of the finished good (required)
                    <span class="hint-text">e.g., FG-001</span>
                  </li>
                  <li>
                    <strong>materialCode</strong> - Material Item Code (required)
                    <span class="hint-text">e.g., SDT000004</span>
                  </li>
                  <li>
                    <strong>quantity</strong> - Quantity required (required)
                    <span class="hint-text">e.g., 50</span>
                  </li>
                  <li>
                    <strong>status</strong> - Status (optional, defaults to Draft)
                    <span class="hint-text">Active/Draft/Inactive</span>
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
                <span>Importing formulations...</span>
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
                      <th>FG Code</th>
                      <th>Product Name</th>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>UOM</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in importPreviewData.slice(0, 10)"
                      :key="index"
                    >
                      <td>{{ item.fgCode }}</td>
                      <td>{{ item.productName }}</td>
                      <td>{{ item.materialName }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.conversionUomCode || '-' }}</td>
                      <td>{{ item.status || 'Draft' }}</td>
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
            @click="saveFormulation"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : (modalMode === 'create' ? 'Create' : 'Update') }}
          </button>
          <button
            v-if="activeTab === 'import' && modalMode === 'create'"
            class="btn-save"
            @click="processImport"
            :disabled="!csvFile || importing || importPreviewData.length === 0"
          >
            {{ importing ? 'Importing...' : 'Import Formulations' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header delete-header">
          <div class="header-icon-wrapper">
            <span class="header-icon">🗑️</span>
          </div>
          <div>
            <h3>Confirm Delete</h3>
            <p class="header-subtitle">Are you sure you want to delete this formulation?</p>
          </div>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="delete-item-info" v-if="itemToDelete">
            <div class="delete-row">
              <span class="delete-label">FG Code</span>
              <span class="delete-value">{{ itemToDelete.fgCode }}</span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Product Name</span>
              <span class="delete-value">{{ itemToDelete.productName }}</span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Type</span>
              <span class="delete-value">{{ itemToDelete.productType }}</span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Status</span>
              <span class="delete-value">
                <span :class="['status-badge', itemToDelete.status.toLowerCase()]">
                  {{ itemToDelete.status }}
                </span>
              </span>
            </div>
            <div class="delete-row">
              <span class="delete-label">Version</span>
              <span class="delete-value">v{{ itemToDelete.version }}</span>
            </div>
          </div>

          <div class="delete-warning">
            <span class="warning-icon">⚠️</span>
            <span>This action cannot be undone. The formulation will be permanently deleted.</span>
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

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import formulationService from '@/stores/formulationService';
import finishedGoodService from '@/stores/finishedGoodService';
import itemService from '@/stores/itemService';
import type { Formulation } from '@/stores/formulationService';
import type { FinishedGood } from '@/stores/finishedGoodService';
import type { Item } from '@/stores/itemService';

// ================================================================
// STATE
// ================================================================
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showModal = ref(false);
const showDeleteModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const activeTab = ref<'manual' | 'import'>('manual');
const expandedRow = ref<number | null>(null);
const itemToDelete = ref<Formulation | null>(null);
const originalStatus = ref<string>('');

// Data
const formulations = ref<Formulation[]>([]);
const finishedGoods = ref<FinishedGood[]>([]);
const availableItems = ref<Item[]>([]);

// Filters
const filters = ref({
  search: '',
  status: '',
  productType: '',
  finishedGoodId: ''
});

// Stats
const stats = ref({
  total: 0,
  active: 0,
  draft: 0,
  inactive: 0,
  uniqueMaterials: 0,
  paint: 0,
  fiber: 0,
  paintCount: 0,
  fiberCount: 0,
  totalCost: 0,
  totalMaterialsUsed: 0
});

// Import state
const csvFile = ref<File | null>(null);
const csvFileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const importPreviewData = ref<any[]>([]);
const importResults = ref<{
  total: number;
  success: number;
  failed: number;
  errors: string[];
} | null>(null);
const importing = ref(false);
const importProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  remaining: 0,
  percentage: 0
});

// Form state
const form = ref({
  id: null as number | null,
  finishedGoodId: null as number | null,
  status: 'Draft' as 'Draft' | 'Active' | 'Inactive',
  description: '',
  rawMaterials: [] as {
    itemId: number | null;
    itemName: string;
    quantity: number;
    conversionUomId: number | null;
    conversionUomCode: string;
  }[]
});

// Toast state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

// ================================================================
// COMPUTED
// ================================================================

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status || filters.value.productType || filters.value.finishedGoodId;
});

// ================================================================
// HELPERS
// ================================================================

const extractItemsArray = (data: any): Item[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  if (data.results && Array.isArray(data.results)) return data.results;
  return [];
};

// ================================================================
// UOM HELPER METHODS
// ================================================================

const getConversionUomCode = (material: any): string => {
  return material.conversionUomCode || 
         material.uom?.code ||
         material.item?.conversionUom?.code || 
         material.item?.conversionUomCode || 
         material.uomCode ||
         '-';
};

const getMaterialConversionUomCode = (material: any): string => {
  return material.conversionUomCode || 
         material.uom?.code ||
         material.item?.conversionUom?.code || 
         '-';
};

// ================================================================
// METHODS - FETCH DATA
// ================================================================

const fetchAllFormulations = async () => {
  loading.value = true;

  try {
    const response = await formulationService.getFormulations({
      ...filters.value,
      status: (filters.value.status as 'Draft' | 'Active' | 'Inactive' | undefined) || undefined,
      productType: (filters.value.productType as 'Paint' | 'Fiber' | undefined) || undefined,
      page: 1,
      limit: 99999
    });

    if (response.success) {
      const rawData = response.data || [];
      formulations.value = rawData.map((item: any) => {
        if (item.details && !item.rawMaterials) {
          item.rawMaterials = item.details;
        }
        if (item.finishedGood?.details && !item.rawMaterials) {
          item.rawMaterials = item.finishedGood.details;
        }
        return formulationService.formatFormulation(item);
      });
      console.log('✅ Loaded formulations:', formulations.value.length);
    } else {
      showToastMessage(response.message || 'Failed to fetch formulations', 'error');
    }
  } catch (error: any) {
    console.error('Error fetching formulations:', error);
    showToastMessage(error.message || 'Failed to fetch formulations', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchAllFinishedGoods = async () => {
  try {
    const response = await finishedGoodService.getFinishedGoods({ 
      limit: 99999
    });
    if (response.success) {
      finishedGoods.value = Array.isArray(response.data) ? response.data : [];
      console.log('✅ Loaded finished goods:', finishedGoods.value.length);
    }
  } catch (error) {
    console.error('Error fetching finished goods:', error);
    finishedGoods.value = [];
  }
};

const fetchAllAvailableItems = async () => {
  try {
    const response = await itemService.getItems({ 
      limit: 99999
    });
    if (response.success) {
      const items = extractItemsArray(response.data);
      availableItems.value = items.map((item: any) => ({
        ...item,
        itemId: item.itemId ?? item.id,
        conversionUomCode: item.conversionUomCode || item.conversionUom?.code || item.uom?.code || '',
        conversionUomId: item.conversionUomId || item.conversionUom?.uomId || item.uomId || null
      }));
      console.log('✅ Loaded items:', availableItems.value.length);
    } else {
      availableItems.value = [];
      console.warn('Failed to fetch items:', response.message);
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    availableItems.value = [];
    showToastMessage('Failed to load materials', 'error');
  }
};

const fetchStats = async () => {
  try {
    const response = await formulationService.getStats();
    if (response.success) {
      stats.value = {
        ...stats.value,
        ...response.data
      };
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

// ================================================================
// METHODS - FILTERS
// ================================================================

const applyFilters = () => {
  fetchAllFormulations();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    productType: '',
    finishedGoodId: ''
  };
  fetchAllFormulations();
  showToastMessage('Filters cleared', 'info');
};

// ================================================================
// METHODS - TABLE ACTIONS
// ================================================================

const toggleExpand = (id: number) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const isDeletable = (item: Formulation | null): boolean => {
  if (!item) return false;
  return item.status === 'Draft';
};

// ================================================================
// METHODS - CRUD OPERATIONS
// ================================================================

const openCreateModal = () => {
  modalMode.value = 'create';
  activeTab.value = 'manual';
  originalStatus.value = '';
  resetForm();
  showModal.value = true;
  
  if (finishedGoods.value.length === 0) {
    fetchAllFinishedGoods();
  }
  if (availableItems.value.length === 0) {
    fetchAllAvailableItems();
  }
};

const editFormulation = (item: Formulation) => {
  modalMode.value = 'edit';
  activeTab.value = 'manual';
  
  originalStatus.value = item.status;
  
  const rawMaterials = (item.rawMaterials || []).map((m: any) => ({
    itemId: m.itemId,
    itemName: m.itemName || m.item?.name || '',
    quantity: m.quantity,
    conversionUomId: m.conversionUomId || m.item?.conversionUomId || m.uomId || null,
    conversionUomCode: m.conversionUomCode || m.item?.conversionUom?.code || m.uom?.code || ''
  }));
  
  form.value = {
    id: item.id,
    finishedGoodId: item.finishedGoodId,
    status: item.status,
    description: item.description || '',
    rawMaterials: rawMaterials
  };
  showModal.value = true;
  
  if (item.status === 'Inactive') {
    showToastMessage('⚠️ This formulation is Inactive. Change status to Draft to modify materials.', 'warning');
  }
};

const closeModal = () => {
  showModal.value = false;
  originalStatus.value = '';
  resetForm();
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
};

const resetForm = () => {
  form.value = {
    id: null,
    finishedGoodId: null,
    status: 'Draft',
    description: '',
    rawMaterials: []
  };
};

const saveFormulation = async () => {
  if (!form.value.finishedGoodId) {
    showToastMessage('Please select a finished good', 'error');
    return;
  }

  const validMaterials = form.value.rawMaterials.filter(m => m.itemId && m.quantity > 0);
  if (validMaterials.length === 0) {
    showToastMessage('At least one raw material with quantity > 0 is required', 'error');
    return;
  }

  const itemIds = validMaterials.map(m => m.itemId);
  if (new Set(itemIds).size !== itemIds.length) {
    showToastMessage('Duplicate materials found. Please remove duplicates.', 'error');
    return;
  }

  saving.value = true;

  try {
    const payload = {
      finishedGoodId: form.value.finishedGoodId,
      status: form.value.status,
      description: form.value.description,
      rawMaterials: validMaterials.map(m => ({
        itemId: m.itemId!,
        quantity: m.quantity,
        uomId: m.conversionUomId!
      }))
    };

    console.log('📤 Sending payload:', payload);

    let response;
    if (modalMode.value === 'create') {
      response = await formulationService.createFormulation(payload);
    } else {
      response = await formulationService.updateFormulation(form.value.id!, payload);
    }

    if (response.success) {
      showToastMessage(response.message || 'Formulation saved successfully', 'success');
      closeModal();
      await fetchAllFormulations();
      await fetchStats();
    } else {
      showToastMessage(response.message || 'Failed to save formulation', 'error');
    }
  } catch (error: any) {
    console.error('Error saving formulation:', error);
    
    const errorMessage = error.message || error.response?.data?.message || '';
    if (errorMessage.includes('Inactive') || errorMessage.includes('inactive')) {
      showToastMessage('Cannot modify an Inactive formulation. Please change status to Draft first.', 'warning');
    } else {
      showToastMessage(error.message || 'Failed to save formulation', 'error');
    }
  } finally {
    saving.value = false;
  }
};

const deleteFormulation = (item: Formulation) => {
  if (!isDeletable(item)) {
    showToastMessage('Only Draft formulations can be deleted', 'warning');
    return;
  }
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  itemToDelete.value = null;
  deleting.value = false;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;

  deleting.value = true;
  try {
    const response = await formulationService.deleteFormulation(itemToDelete.value.id);
    if (response.success) {
      showToastMessage('Formulation deleted successfully', 'success');
      closeDeleteModal();
      await fetchAllFormulations();
      await fetchStats();
    } else {
      showToastMessage(response.message || 'Failed to delete formulation', 'error');
    }
  } catch (error: any) {
    console.error('Error deleting formulation:', error);
    showToastMessage(error.message || 'Failed to delete formulation', 'error');
  } finally {
    deleting.value = false;
  }
};

// ================================================================
// METHODS - RAW MATERIALS FORM
// ================================================================

const onFinishedGoodChange = () => {};

const getAvailableMaterials = (currentIndex: number) => {
  const items = Array.isArray(availableItems.value) ? availableItems.value : [];
  
  const selectedIds = form.value.rawMaterials
    .filter((m, idx) => idx !== currentIndex && m.itemId)
    .map(m => m.itemId ?? 0)
    .filter((id): id is number => id !== 0);

  return items.filter(item => {
    const itemId = (item.itemId ?? item.id) as number;
    return !selectedIds.includes(itemId);
  });
};

const isMaterialUsed = (itemId: number | undefined | null, currentIndex: number) => {
  if (!itemId) return false;
  return form.value.rawMaterials.some((m, idx) =>
    idx !== currentIndex && m.itemId === itemId
  );
};

const isDuplicateMaterial = (index: number) => {
  const material = form.value.rawMaterials[index];
  if (!material || !material.itemId) return false;
  return isMaterialUsed(material.itemId, index);
};

const onMaterialSelect = (index: number, event: Event) => {
  const select = event.target as HTMLSelectElement;
  const selectedId = parseInt(select.value);
  const material = form.value.rawMaterials[index];

  if (!material) {
    return;
  }

  if (!selectedId) {
    material.itemId = null;
    material.itemName = '';
    material.conversionUomCode = '';
    material.conversionUomId = null;
    return;
  }

  if (isMaterialUsed(selectedId, index)) {
    showToastMessage('This material is already added. Please select a different one.', 'warning');
    if (material) {
      material.itemId = null;
      material.itemName = '';
      material.conversionUomCode = '';
      material.conversionUomId = null;
    }
    return;
  }

  if (!material) {
    return;
  }

  material.itemId = selectedId;

  const item = availableItems.value.find(i => (i.itemId ?? i.id) === selectedId);
  if (item && material) {
    material.itemName = item.name || '';
    material.conversionUomCode = item.conversionUom?.code || 
                                 item.uom?.code ||
                                 '';
    material.conversionUomId = item.conversionUomId || 
                               item.conversionUom?.uomId || 
                               item.uomId ||
                               item.uom?.uomId ||
                               null;
    
    console.log('Material selected:', {
      itemId: selectedId,
      name: material.itemName,
      conversionUomCode: material.conversionUomCode,
      conversionUomId: material.conversionUomId
    });
    
    if (!material.conversionUomId) {
      showToastMessage(`Warning: No UOM found for ${material.itemName}`, 'warning');
    }
  }
};

const onQuantityChange = (index: number) => {};

const addRawMaterialRow = () => {
  form.value.rawMaterials.push({
    itemId: null,
    itemName: '',
    quantity: 0,
    conversionUomId: null,
    conversionUomCode: ''
  });
};

const removeRawMaterialRow = (index: number) => {
  form.value.rawMaterials.splice(index, 1);
};

// ================================================================
// METHODS - IMPORT
// ================================================================

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const downloadTemplate = () => {
  formulationService.downloadTemplate();
  showToastMessage('Template downloaded successfully', 'success');
};

const triggerCsvUpload = ($event: PointerEvent) => {
  if (importing.value) return;
  if (csvFileInput.value) {
    csvFileInput.value.click();
  }
};

const handleCsvUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMessage('Please upload a valid CSV file', 'error');
  }
  input.value = '';
};

const handleCsvDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMessage('Please upload a valid CSV file', 'error');
  }
};

const removeCsvFile = () => {
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
};

const parseCsvFile = async (file: File) => {
  try {
    const text = await file.text();
    const parsedData = formulationService.parseCsvContent(text);

    const enrichedData = [];
    const goods = Array.isArray(finishedGoods.value) ? finishedGoods.value : [];
    const items = Array.isArray(availableItems.value) ? availableItems.value : [];
    
    for (const item of parsedData) {
      const finishedGood = goods.find(f => f.fgCode === item.finishedGoodCode);
      const material = items.find(m => (m.code === item.materialCode));

      if (finishedGood && material) {
        const conversionUomCode = material.conversionUomId || 
                                  material.conversionUom?.code || 
                                  material.uom?.code ||
                                  '';
        const conversionUomId = material.conversionUomId || 
                                material.conversionUom?.uomId || 
                                material.uomId ||
                                material.uom?.uomId ||
                                1;
        
        enrichedData.push({
          finishedGoodId: finishedGood.id,
          fgCode: finishedGood.fgCode,
          productName: finishedGood.name,
          productType: finishedGood.type,
          materialId: material.itemId ?? material.id,
          materialName: material.name,
          materialCode: material.code,
          conversionUomCode: conversionUomCode,
          conversionUomId: conversionUomId,
          quantity: item.quantity,
          status: item.status
        });
      }
    }

    if (enrichedData.length === 0) {
      showToastMessage('No valid data found in CSV file. Please check that the codes match existing records.', 'error');
      importPreviewData.value = [];
      return;
    }

    importPreviewData.value = enrichedData;
    showToastMessage(`Parsed ${enrichedData.length} items from CSV`, 'success');
  } catch (error: any) {
    console.error('CSV parse error:', error);
    showToastMessage(error.message || 'Failed to parse CSV file', 'error');
    importPreviewData.value = [];
  }
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
    const grouped: Record<number, any> = {};
    importPreviewData.value.forEach(item => {
      if (!grouped[item.finishedGoodId]) {
        grouped[item.finishedGoodId] = {
          finishedGoodId: item.finishedGoodId,
          status: item.status || 'Draft',
          description: `Imported formulation for ${item.productName}`,
          rawMaterials: []
        };
      }
      grouped[item.finishedGoodId].rawMaterials.push({
        itemId: item.materialId,
        quantity: item.quantity,
        uomId: item.conversionUomId || 1
      });
    });

    const payload = {
      formulations: Object.values(grouped)
    };

    console.log('📤 Import payload:', payload);

    const response = await formulationService.bulkImport(payload);

    if (response.success) {
      importResults.value = response.data;
      if (response.data.failed === 0) {
        showToastMessage(`✅ Successfully imported ${response.data.success} formulations!`, 'success');
        setTimeout(() => {
          closeModal();
          fetchAllFormulations();
          fetchStats();
        }, 1500);
      } else {
        showToastMessage(`⚠️ Imported ${response.data.success} formulations with ${response.data.failed} errors`, 'warning');
      }
    } else {
      showToastMessage(response.message || 'Failed to import formulations', 'error');
    }
  } catch (error: any) {
    console.error('Import error:', error);
    showToastMessage(error.message || 'Failed to import formulations', 'error');
  } finally {
    importing.value = false;
  }
};

// ================================================================
// METHODS - TOAST
// ================================================================

const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  toastTimeout = setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// METHODS - FORMATTING
// ================================================================

const formatQuantity = (quantity: number): string => {
  return formulationService.formatQuantity(quantity);
};

const formatDate = (date: string): string => {
  return formulationService.formatDate(date);
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  loading.value = true;
  try {
    finishedGoods.value = [];
    availableItems.value = [];
    formulations.value = [];
    
    await Promise.all([
      fetchAllFinishedGoods(),
      fetchAllAvailableItems()
    ]);
    await fetchAllFormulations();
    await fetchStats();
  } catch (error) {
    console.error('Error initializing component:', error);
  } finally {
    loading.value = false;
  }
});

watch(
  () => filters.value,
  () => {
    applyFilters();
  },
  { deep: true }
);

onUnmounted(() => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
});
</script>

<style scoped>
/* ================================================================ */
/* SECTION CARD */
/* ================================================================ */
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
  border-color: #8b5cf6;
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
  background: #22c55e;
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
  background: #16a34a;
}

.btn-add-row {
  padding: 4px 14px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}
.btn-add-row:hover {
  background: #7c3aed;
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
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.btn-save:hover {
  background: #7c3aed;
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
/* STATS */
/* ================================================================ */
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.stat-item {
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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
  overflow-x: auto;
  min-height: 200px;
}

.formulation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.formulation-table th,
.formulation-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.formulation-table th {
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

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #8b5cf6;
  padding: 4px 8px;
  border-radius: 6px;
}
.expand-btn:hover {
  background: #ede9fe;
}

.expanded-row {
  background: #f8fafc;
}

.inactive-row {
  opacity: 0.7;
}

.draft-row {
  background: #fffbeb;
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

.version-badge {
  display: inline-block;
  padding: 1px 8px;
  background: #e2e8f0;
  color: #475569;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
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
.status-badge.draft {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.materials-count {
  display: flex;
  align-items: center;
  gap: 4px;
}
.count-badge {
  display: inline-block;
  padding: 1px 8px;
  background: #ede9fe;
  color: #6d28d9;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}
.count-label {
  font-size: 11px;
  color: #94a3b8;
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
  transition: all 0.2s;
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.action-btn.edit {
  background: #fef3c7;
  color: #d97706;
}
.action-btn.edit:hover:not(:disabled) {
  background: #fde68a;
}
.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}
.action-btn.delete:hover:not(:disabled) {
  background: #fecaca;
}

/* ================================================================ */
/* EXPAND DETAILS - STACKED VERTICALLY */
/* ================================================================ */
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

.detail-card h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #8b5cf6;
  padding-left: 10px;
  color: #1e293b;
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

.no-materials {
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 0;
  text-align: center;
}

/* ================================================================ */
/* STACKED MATERIALS - VERTICAL DISPLAY */
/* ================================================================ */
.materials-stacked {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.material-stacked-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.material-stacked-item:hover {
  border-color: #e2e8f0;
  background: #fafbfc;
}

.material-stacked-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.material-stacked-qty {
  color: #6d28d9;
  font-weight: 600;
  font-size: 13px;
}

.material-stacked-uom {
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 500;
  margin-left: 4px;
}

/* ================================================================ */
/* MATERIAL SELECT */
/* ================================================================ */
.material-select-wrapper {
  width: 100%;
}

.material-select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  background: white;
  cursor: pointer;
}
.material-select:focus {
  outline: none;
  border-color: #8b5cf6;
}

.material-select.duplicate-error {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
}

.error-text {
  display: block;
  font-size: 10px;
  color: #ef4444;
  margin-top: 2px;
}

.uom-display {
  display: inline-block;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  min-width: 40px;
  text-align: center;
}

/* ================================================================ */
/* MODAL TABS */
/* ================================================================ */
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
  background: #ede9fe;
  color: #6d28d9;
}

/* ================================================================ */
/* LOADING STATE */
/* ================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #64748b;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ================================================================ */
/* EMPTY STATE */
/* ================================================================ */
.empty-state {
  text-align: center;
  padding: 40px !important;
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
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease;
}

.formulation-modal .modal-container {
  max-width: 900px;
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
  border-color: #8b5cf6;
}
.form-group textarea {
  resize: vertical;
  min-height: 40px;
}

.full-width {
  grid-column: 1 / -1;
}

.section-divider {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 10px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}
.section-divider h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* ================================================================ */
/* RAW MATERIALS TABLE */
/* ================================================================ */
.raw-materials-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.raw-materials-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.raw-materials-table th {
  background: #f8fafc;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
}
.raw-materials-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.raw-materials-table select,
.raw-materials-table input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}
.raw-materials-table select:focus,
.raw-materials-table input:focus {
  outline: none;
  border-color: #8b5cf6;
}
.raw-materials-table .empty-row {
  text-align: center;
  padding: 20px !important;
  color: #94a3b8;
}
.raw-materials-table .empty-icon-small {
  font-size: 20px;
  display: block;
  margin-bottom: 4px;
}

.btn-remove-row {
  background: #fee2e2;
  border: none;
  border-radius: 4px;
  color: #dc2626;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}
.btn-remove-row:hover {
  background: #fecaca;
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
  border-color: #8b5cf6;
  background: #f8fafc;
}
.file-upload-area.drag-over {
  border-color: #8b5cf6;
  background: #ede9fe;
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
  max-width: 500px;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  animation: slideIn 0.2s ease, fadeOut 0.2s ease 2s forwards;
}
.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }
.toast.info { background: #3b82f6; }

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
  .section-card {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
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

  .stats-row {
    flex-wrap: wrap;
  }
  .stat-item {
    min-width: calc(50% - 6px);
    flex: 1 0 calc(50% - 6px);
  }

  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-container {
    max-width: 100%;
    margin: 10px;
  }

  .delete-modal .modal-container {
    max-width: 100%;
    margin: 10px;
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
  .formulation-table {
    font-size: 12px;
    min-width: 700px;
  }
  .formulation-table th,
  .formulation-table td {
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

/* ================================================================ */
/* PRINT STYLES */
/* ================================================================ */
@media print {
  .btn-add,
  .btn-add-row,
  .btn-remove-row,
  .action-buttons,
  .search-box,
  .filter-bar {
    display: none !important;
  }
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .formulation-table th,
  .formulation-table td {
    border: 1px solid #ddd !important;
  }
  .stats-row {
    display: none !important;
  }
  .loading-state {
    display: none !important;
  }
  .detail-expand-row {
    display: table-row !important;
  }
}
</style>