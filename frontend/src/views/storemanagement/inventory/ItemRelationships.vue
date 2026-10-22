<!-- inventory/ItemRelationships.vue -->
<template>
  <div class="relationships-tab">
    <!-- Header -->
    <div class="rel-header">
      <div>
        <h3>🔗 Item Relationships</h3>
        <p class="rel-subtitle">
          Link item codes that refer to the same physical item in different units.
          For example, <code>SDT0001</code> (DRUM) and <code>SDT0002</code> (KG)
          both represent the same Cooking Oil.
        </p>
      </div>
      <div class="rel-header-actions">
        <button class="btn-import" @click="openImportModal" :disabled="importing">
          <span v-if="importing" class="spinner-tiny spinner-white"></span>
          <span v-else>📥</span>
          {{ importing ? 'Importing...' : 'Import' }}
        </button>
        <button class="btn-add" @click="openAdd">
          ➕ Add Relationship
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="rel-filters">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by relationship code, item code, name, or UOM..."
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- Bulk action bar -->
    <div v-if="selectedIds.length > 0" class="bulk-bar">
      <div class="bulk-bar-left">
        <span class="bulk-count">{{ selectedIds.length }}</span>
        <span class="bulk-text">
          relationship{{ selectedIds.length !== 1 ? 's' : '' }} selected
        </span>
      </div>
      <div class="bulk-bar-right">
        <button class="btn-secondary btn-sm" @click="clearSelection">
          Clear selection
        </button>
        <button class="btn-danger btn-sm" @click="confirmBulkDelete" :disabled="saving">
          🗑️ Delete Selected ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading relationships...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="relationships.length === 0" class="empty-state">
      <div class="empty-icon">🔗</div>
      <h3>No relationships yet</h3>
      <p>Add a relationship between two item codes.</p>
      <button class="btn-primary" @click="openAdd">Add First Relationship</button>
    </div>

    <!-- Table -->
    <template v-else>
      <table class="rel-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isPartiallySelected"
                @change="toggleSelectAll"
                title="Select all on this page"
              />
            </th>
            <th>Relationship Code</th>
            <th>Item Code A</th>
            <th>Item Code B</th>
            <th>Remark</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rel in paginatedRelationships"
            :key="rel.id"
            :class="{ 'row-selected': selectedIds.includes(rel.id) }"
          >
            <td class="checkbox-col">
              <input
                type="checkbox"
                :checked="selectedIds.includes(rel.id)"
                @change="toggleRow(rel.id)"
              />
            </td>
            <td>
              <span class="rel-code">{{ rel.relationshipCode }}</span>
            </td>
            <td>
              <div class="item-cell">
                <strong class="item-code">{{ rel.itemA?.code || '—' }}</strong>
                <span class="item-name">{{ rel.itemA?.name || '' }}</span>
                <span class="uom-pill">{{ rel.itemA?.uom || '—' }}</span>
              </div>
            </td>
            <td>
              <div class="item-cell">
                <strong class="item-code">{{ rel.itemB?.code || '—' }}</strong>
                <span class="item-name">{{ rel.itemB?.name || '' }}</span>
                <span class="uom-pill">{{ rel.itemB?.uom || '—' }}</span>
              </div>
            </td>
            <td class="cell-remark">{{ rel.remark || '—' }}</td>
            <td>
              <div class="action-buttons">
                <button class="icon-btn" title="Edit" @click="openEdit(rel)">✏️</button>
                <button class="icon-btn delete-btn" title="Delete" @click="confirmDelete(rel)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty search result -->
      <div v-if="filteredRelationships.length === 0" class="empty-state small">
        <div class="empty-icon">🔍</div>
        <h3>No matches</h3>
        <p>No relationships match your search.</p>
      </div>

      <!-- Pagination -->
      <div v-if="filteredRelationships.length > 0" class="pagination-container">
        <div class="pagination-info">
          <span>
            Showing
            {{ (currentPage - 1) * itemsPerPage + 1 }}–{{
              Math.min(currentPage * itemsPerPage, filteredRelationships.length)
            }}
            of {{ filteredRelationships.length }} relationships
          </span>
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

          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next →
          </button>

          <select v-model.number="itemsPerPage" @change="handlePageSizeChange" class="limit-select">
            <option :value="5">5 per page</option>
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- ADD / EDIT MODAL                                             -->
    <!-- ============================================================ -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container rel-modal">
        <div class="modal-header">
          <h3>{{ editingRel ? '✏️ Edit Relationship' : '➕ Add Relationship' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Relationship Code</label>
            <div v-if="editingRel" class="code-display">
              {{ editingRel.relationshipCode }}
            </div>
            <div v-else class="code-display code-auto">
              <span class="auto-icon">⚙️</span>
              <span>Will be generated automatically</span>
            </div>
            <span class="hint" v-if="editingRel">System-generated, cannot be changed.</span>
            <span class="hint" v-else>The backend assigns this code when you save.</span>
          </div>

          <p class="modal-hint">
            Type at least 2 characters in each field to search for an item.
          </p>

          <!-- Item A -->
          <div class="form-group">
            <label>Item Code A</label>

            <div v-if="selectedItemA" class="selected-item">
              <div class="item-cell">
                <strong class="item-code">{{ selectedItemA.code }}</strong>
                <span class="item-name">{{ selectedItemA.name }}</span>
                <span class="uom-pill">{{ selectedItemA.uom }}</span>
              </div>
              <button
                type="button"
                class="clear-item-btn"
                @click="clearItem('A')"
                title="Change item"
              >
                ✕
              </button>
            </div>

            <div v-else class="item-search">
              <input
                v-model="searchA"
                type="text"
                class="form-input"
                placeholder="Type to search items by code or name..."
                @input="onSearchAInput"
              />
              <div v-if="searchA.length > 0 && searchA.length < 2" class="search-hint">
                Type at least 2 characters
              </div>
              <div v-if="searchingA" class="search-loading">
                <span class="spinner-tiny"></span> Searching...
              </div>
              <div
                v-else-if="searchA.length >= 2 && itemOptionsA.length === 0"
                class="search-hint"
              >
                No items found
              </div>
              <ul v-else-if="itemOptionsA.length > 0" class="search-results">
                <li
                  v-for="item in itemOptionsA"
                  :key="item.itemId"
                  @click="selectItem('A', item)"
                >
                  <div class="item-cell">
                    <strong class="item-code">{{ item.code }}</strong>
                    <span class="item-name">{{ item.name }}</span>
                    <span class="uom-pill">{{ item.uom }}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Item B -->
          <div class="form-group">
            <label>Item Code B</label>

            <div v-if="selectedItemB" class="selected-item">
              <div class="item-cell">
                <strong class="item-code">{{ selectedItemB.code }}</strong>
                <span class="item-name">{{ selectedItemB.name }}</span>
                <span class="uom-pill">{{ selectedItemB.uom }}</span>
              </div>
              <button
                type="button"
                class="clear-item-btn"
                @click="clearItem('B')"
                title="Change item"
              >
                ✕
              </button>
            </div>

            <div v-else class="item-search">
              <input
                v-model="searchB"
                type="text"
                class="form-input"
                placeholder="Type to search items by code or name..."
                :disabled="!selectedItemA"
                @input="onSearchBInput"
              />
              <div v-if="!selectedItemA" class="search-hint">
                Select Item A first
              </div>
              <template v-else>
                <div v-if="searchB.length > 0 && searchB.length < 2" class="search-hint">
                  Type at least 2 characters
                </div>
                <div v-if="searchingB" class="search-loading">
                  <span class="spinner-tiny"></span> Searching...
                </div>
                <div
                  v-else-if="searchB.length >= 2 && itemOptionsB.length === 0"
                  class="search-hint"
                >
                  No items found
                </div>
                <ul v-else-if="itemOptionsB.length > 0" class="search-results">
                  <li
                    v-for="item in itemOptionsB"
                    :key="item.itemId"
                    @click="selectItem('B', item)"
                  >
                    <div class="item-cell">
                      <strong class="item-code">{{ item.code }}</strong>
                      <span class="item-name">{{ item.name }}</span>
                      <span class="uom-pill">{{ item.uom }}</span>
                    </div>
                  </li>
                </ul>
              </template>
            </div>
          </div>

          <div class="form-group">
            <label>Remark (optional)</label>
            <input
              v-model="form.remark"
              type="text"
              class="form-input"
              placeholder="e.g. Same oil, sold by drum and by kg"
            />
          </div>

          <div v-if="formErrors.length > 0" class="form-errors">
            <p v-for="(err, i) in formErrors" :key="i">⚠️ {{ err }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button
            class="btn-primary"
            :disabled="saving || !selectedItemA || !selectedItemB"
            @click="save"
          >
            {{ saving ? 'Saving...' : (editingRel ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- SINGLE DELETE CONFIRMATION                                   -->
    <!-- ============================================================ -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container rel-modal-small">
        <div class="modal-header">
          <h3>🗑️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <span class="danger-icon">⚠️</span>
            <p>
              Delete relationship <strong>{{ deleteTarget?.relationshipCode }}</strong>
              ({{ deleteTarget?.itemA?.code }} {{ deleteTarget?.itemA?.uom }} ↔
              {{ deleteTarget?.itemB?.code }} {{ deleteTarget?.itemB?.uom }})?
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" :disabled="saving" @click="doDelete">
            {{ saving ? 'Deleting...' : '🗑️ Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BULK DELETE CONFIRMATION                                     -->
    <!-- ============================================================ -->
    <div v-if="showBulkDeleteModal" class="modal-overlay" @click.self="closeBulkDeleteModal">
      <div class="modal-container rel-modal-small">
        <div class="modal-header">
          <h3>🗑️ Delete {{ selectedIds.length }} Relationships</h3>
          <button class="modal-close" @click="closeBulkDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <span class="danger-icon">⚠️</span>
            <p>
              You are about to delete <strong>{{ selectedIds.length }}</strong>
              relationship{{ selectedIds.length !== 1 ? 's' : '' }}. This action
              cannot be undone.
            </p>
          </div>

          <div class="bulk-list">
            <p class="bulk-list-title">Relationships to be deleted:</p>
            <ul class="bulk-list-items">
              <li v-for="rel in selectedRelationships" :key="rel.id">
                <span class="rel-code">{{ rel.relationshipCode }}</span>
                <span class="bulk-list-desc">
                  {{ rel.itemA?.code }} ↔ {{ rel.itemB?.code }}
                </span>
              </li>
            </ul>
          </div>

          <div v-if="bulkErrors.length > 0" class="form-errors">
            <p v-for="(err, i) in bulkErrors" :key="i">⚠️ {{ err }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeBulkDeleteModal" :disabled="saving">
            Cancel
          </button>
          <button class="btn-danger" :disabled="saving" @click="doBulkDelete">
            {{ saving ? 'Deleting...' : `🗑️ Delete ${selectedIds.length}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- IMPORT MODAL                                                 -->
    <!-- ============================================================ -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="!importing && closeImportModal()">
      <div class="modal-container rel-modal">
        <div class="modal-header">
          <h3>📥 Import Relationships from CSV</h3>
          <button class="modal-close" @click="!importing && closeImportModal()" :disabled="importing">✕</button>
        </div>

        <div class="modal-body">
          <div class="import-info">
            <div class="info-box">
              <span class="info-icon">ℹ️</span>
              <div>
                <p><strong>CSV Format Required:</strong></p>
                <p class="info-text">
                  Each row pairs two item codes. The relationship code is generated
                  automatically by the system.
                </p>
                <ul class="csv-format-list">
                  <li><strong>itemCodeA</strong> - Item code A (required)</li>
                  <li><strong>itemCodeB</strong> - Item code B (required)</li>
                  <li><strong>remark</strong> - Optional note</li>
                </ul>
                <button class="btn-template" @click="downloadTemplate" :disabled="importing">
                  📄 Download CSV Template
                </button>
              </div>
            </div>
          </div>

          <div
            class="file-upload-area import-upload"
            @click="!importing && triggerCsvUpload()"
            :class="{ 'drag-over': isDragOver, 'disabled': importing }"
            @dragover.prevent="!importing && (isDragOver = true)"
            @dragleave.prevent="!importing && (isDragOver = false)"
            @drop.prevent="!importing && handleCsvDrop($event)"
          >
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
            <input
              type="file"
              ref="csvFileInput"
              accept=".csv"
              @change="handleCsvUpload"
              style="display:none"
              :disabled="importing"
            />
          </div>

          <div v-if="importing" class="import-progress">
            <div class="progress-info">
              <span>Importing relationships...</span>
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

          <div v-if="importPreviewData.length > 0 && !importing" class="import-preview">
            <h4>Preview ({{ importPreviewData.length }} row{{ importPreviewData.length !== 1 ? 's' : '' }})</h4>
            <div class="preview-table-container">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Code A</th>
                    <th>Item Code B</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in importPreviewData.slice(0, 10)" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td><code>{{ row.itemCodeA || '—' }}</code></td>
                    <td><code>{{ row.itemCodeB || '—' }}</code></td>
                    <td>{{ row.remark || '—' }}</td>
                  </tr>
                  <tr v-if="importPreviewData.length > 10">
                    <td colspan="4" class="preview-more">
                      ... and {{ importPreviewData.length - 10 }} more rows
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="importResults && !importing" class="import-results">
            <div class="result-summary">
              <span class="result-success">✅ {{ importResults.success }} imported</span>
              <span class="result-failed">❌ {{ importResults.failed }} failed</span>
              <span class="result-total">📊 {{ importResults.total }} total</span>
            </div>
            <div v-if="importResults.errors && importResults.errors.length > 0" class="result-errors">
              <p><strong>Errors:</strong></p>
              <ul>
                <li v-for="(err, idx) in importResults.errors.slice(0, 8)" :key="idx">{{ err }}</li>
                <li v-if="importResults.errors.length > 8">... and {{ importResults.errors.length - 8 }} more errors</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="!importing && closeImportModal()" :disabled="importing">Close</button>
          <button
            class="btn-primary"
            @click="processImport"
            :disabled="!csvFile || importing || importPreviewData.length === 0"
          >
            {{ importing ? 'Importing...' : 'Import Relationships' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="showToast" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import itemRelationshipService from '@/stores/itemRelationshipService';

// ================================================================
// STATE — list + pagination
// ================================================================
const loading = ref(true);
const saving = ref(false);
const relationships = ref([]);
const searchQuery = ref('');
const selectedIds = ref([]);

const currentPage = ref(1);
const itemsPerPage = ref(10);

// ================================================================
// STATE — add/edit modal
// ================================================================
const showModal = ref(false);
const editingRel = ref(null);
const form = ref({ itemAId: null, itemBId: null, remark: '' });
const formErrors = ref([]);

const searchA = ref('');
const searchB = ref('');
const itemOptionsA = ref([]);
const itemOptionsB = ref([]);
const searchingA = ref(false);
const searchingB = ref(false);
const selectedItemA = ref(null);
const selectedItemB = ref(null);
let searchTimerA = null;
let searchTimerB = null;

// ================================================================
// STATE — delete
// ================================================================
const showDeleteModal = ref(false);
const deleteTarget = ref(null);
const showBulkDeleteModal = ref(false);
const bulkErrors = ref([]);

// ================================================================
// STATE — import
// ================================================================
const showImportModal = ref(false);
const importing = ref(false);
const csvFile = ref(null);
const csvFileInput = ref(null);
const isDragOver = ref(false);
const importPreviewData = ref([]);
const importResults = ref(null);
const importProgress = ref({
  total: 0, processed: 0, success: 0, failed: 0, remaining: 0, percentage: 0,
});

// ================================================================
// STATE — toast
// ================================================================
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// ================================================================
// COMPUTED — filtering + pagination
// ================================================================
const filteredRelationships = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return relationships.value;
  return relationships.value.filter(r => {
    const a = r.itemA || {};
    const b = r.itemB || {};
    return (
      (r.relationshipCode || '').toLowerCase().includes(q) ||
      (a.code || '').toLowerCase().includes(q) ||
      (a.name || '').toLowerCase().includes(q) ||
      (a.uom || '').toLowerCase().includes(q) ||
      (b.code || '').toLowerCase().includes(q) ||
      (b.name || '').toLowerCase().includes(q) ||
      (b.uom || '').toLowerCase().includes(q)
    );
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRelationships.value.length / itemsPerPage.value));
});

const paginatedRelationships = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredRelationships.value.slice(start, start + itemsPerPage.value);
});

// ================================================================
// COMPUTED — selection
// ================================================================
const isAllSelected = computed(() => {
  if (paginatedRelationships.value.length === 0) return false;
  return paginatedRelationships.value.every(r => selectedIds.value.includes(r.id));
});

const isPartiallySelected = computed(() => {
  const inView = paginatedRelationships.value.filter(r => selectedIds.value.includes(r.id));
  return inView.length > 0 && inView.length < paginatedRelationships.value.length;
});

const selectedRelationships = computed(() => {
  const idSet = new Set(selectedIds.value);
  return relationships.value.filter(r => idSet.has(r.id));
});

// ================================================================
// SEARCH
// ================================================================
const onSearchInput = () => {
  currentPage.value = 1;
};

// ================================================================
// PAGINATION
// ================================================================
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

watch(filteredRelationships, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
});

// ================================================================
// SELECTION
// ================================================================
const toggleRow = (id) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const visibleIds = new Set(paginatedRelationships.value.map(r => r.id));
    selectedIds.value = selectedIds.value.filter(id => !visibleIds.has(id));
  } else {
    const existing = new Set(selectedIds.value);
    paginatedRelationships.value.forEach(r => {
      if (!existing.has(r.id)) {
        selectedIds.value.push(r.id);
        existing.add(r.id);
      }
    });
  }
};

const clearSelection = () => {
  selectedIds.value = [];
};

// ================================================================
// LAZY ITEM SEARCH
// ================================================================
const onSearchAInput = () => {
  if (searchTimerA) clearTimeout(searchTimerA);
  const q = searchA.value;
  if (q.length < 2) {
    itemOptionsA.value = [];
    searchingA.value = false;
    return;
  }
  searchingA.value = true;
  searchTimerA = setTimeout(async () => {
    try {
      const response = await itemRelationshipService.searchItems(q, {
        excludeId: selectedItemB.value?.itemId ?? null,
      });
      itemOptionsA.value = response.success ? response.data : [];
    } finally {
      searchingA.value = false;
    }
  }, 300);
};

const onSearchBInput = () => {
  if (searchTimerB) clearTimeout(searchTimerB);
  const q = searchB.value;
  if (q.length < 2) {
    itemOptionsB.value = [];
    searchingB.value = false;
    return;
  }
  searchingB.value = true;
  searchTimerB = setTimeout(async () => {
    try {
      const response = await itemRelationshipService.searchItems(q, {
        excludeId: selectedItemA.value?.itemId ?? null,
      });
      itemOptionsB.value = response.success ? response.data : [];
    } finally {
      searchingB.value = false;
    }
  }, 300);
};

const selectItem = (slot, item) => {
  if (slot === 'A') {
    selectedItemA.value = item;
    form.value.itemAId = item.itemId;
    searchA.value = '';
    itemOptionsA.value = [];
  } else {
    selectedItemB.value = item;
    form.value.itemBId = item.itemId;
    searchB.value = '';
    itemOptionsB.value = [];
  }
};

const clearItem = (slot) => {
  if (slot === 'A') {
    selectedItemA.value = null;
    form.value.itemAId = null;
    searchA.value = '';
    itemOptionsA.value = [];
  } else {
    selectedItemB.value = null;
    form.value.itemBId = null;
    searchB.value = '';
    itemOptionsB.value = [];
  }
};

// ================================================================
// ADD / EDIT
// ================================================================
const openAdd = () => {
  editingRel.value = null;
  form.value = { itemAId: null, itemBId: null, remark: '' };
  formErrors.value = [];
  resetItemSearch();
  showModal.value = true;
};

const openEdit = (rel) => {
  editingRel.value = rel;
  form.value = {
    itemAId: rel.itemAId,
    itemBId: rel.itemBId,
    remark: rel.remark || '',
  };
  formErrors.value = [];
  resetItemSearch();
  showModal.value = true;
  selectedItemA.value = rel.itemA ? { ...rel.itemA } : null;
  selectedItemB.value = rel.itemB ? { ...rel.itemB } : null;
};

const resetItemSearch = () => {
  searchA.value = '';
  searchB.value = '';
  itemOptionsA.value = [];
  itemOptionsB.value = [];
  searchingA.value = false;
  searchingB.value = false;
  selectedItemA.value = null;
  selectedItemB.value = null;
  if (searchTimerA) clearTimeout(searchTimerA);
  if (searchTimerB) clearTimeout(searchTimerB);
};

const closeModal = () => {
  showModal.value = false;
  editingRel.value = null;
  formErrors.value = [];
  resetItemSearch();
};

const validate = () => {
  formErrors.value = [];
  if (!form.value.itemAId) formErrors.value.push('Select Item Code A.');
  if (!form.value.itemBId) formErrors.value.push('Select Item Code B.');
  if (form.value.itemAId && form.value.itemBId &&
      form.value.itemAId === form.value.itemBId) {
    formErrors.value.push('Item Code A and Item Code B cannot be the same.');
  }

  const dup = relationships.value.find(r => {
    if (editingRel.value && r.id === editingRel.value.id) return false;
    const same1 = r.itemAId === form.value.itemAId && r.itemBId === form.value.itemBId;
    const same2 = r.itemAId === form.value.itemBId && r.itemBId === form.value.itemAId;
    return same1 || same2;
  });
  if (dup) {
    formErrors.value.push(
      `These items already have a relationship (${dup.relationshipCode}: ${dup.itemA?.code} ↔ ${dup.itemB?.code}).`
    );
  }

  return formErrors.value.length === 0;
};

const save = async () => {
  if (!validate()) return;
  saving.value = true;
  try {
    const payload = {
      itemAId: Number(form.value.itemAId),
      itemBId: Number(form.value.itemBId),
      remark: form.value.remark || null,
    };

    const response = editingRel.value
      ? await itemRelationshipService.update(editingRel.value.id, payload)
      : await itemRelationshipService.create(payload);

    if (!response.success) {
      formErrors.value.push(response.error || 'Failed to save.');
      return;
    }

    if (editingRel.value) {
      showToastMsg(
        `Relationship ${editingRel.value.relationshipCode} updated.`,
        'success'
      );
    } else {
      showToastMsg(
        `Relationship ${response.data?.relationshipCode} created.`,
        'success'
      );
    }

    await reload();
    closeModal();
  } finally {
    saving.value = false;
  }
};

// ================================================================
// SINGLE DELETE
// ================================================================
const confirmDelete = (rel) => {
  deleteTarget.value = rel;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
};

const doDelete = async () => {
  if (!deleteTarget.value) return;
  saving.value = true;
  try {
    const response = await itemRelationshipService.remove(deleteTarget.value.id);
    if (!response.success) {
      showToastMsg(response.error || 'Failed to delete.', 'error');
      return;
    }

    const idx = selectedIds.value.indexOf(deleteTarget.value.id);
    if (idx >= 0) selectedIds.value.splice(idx, 1);

    showToastMsg(
      `Relationship ${deleteTarget.value.relationshipCode} deleted.`,
      'success'
    );
    await reload();
    closeDeleteModal();
  } finally {
    saving.value = false;
  }
};

// ================================================================
// BULK DELETE
// ================================================================
const confirmBulkDelete = () => {
  if (selectedIds.value.length === 0) return;
  bulkErrors.value = [];
  showBulkDeleteModal.value = true;
};

const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false;
  bulkErrors.value = [];
};

const doBulkDelete = async () => {
  if (selectedIds.value.length === 0) return;
  saving.value = true;
  bulkErrors.value = [];
  try {
    const idsToDelete = [...selectedIds.value];
    const response = await itemRelationshipService.bulkRemove(idsToDelete);

    if (!response.success) {
      bulkErrors.value.push(response.error || 'Bulk delete failed.');
      return;
    }

    showToastMsg(
      `${idsToDelete.length} relationship${idsToDelete.length !== 1 ? 's' : ''} deleted.`,
      'success'
    );
    selectedIds.value = [];
    await reload();
    closeBulkDeleteModal();
  } finally {
    saving.value = false;
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
    total: 0, processed: 0, success: 0, failed: 0, remaining: 0, percentage: 0,
  };
};

const closeImportModal = () => {
  showImportModal.value = false;
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
  importing.value = false;
};

const triggerCsvUpload = () => {
  csvFileInput.value?.click();
};

const handleCsvUpload = (event) => {
  const file = event.target.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMsg('Please upload a valid CSV file.', 'error');
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
    showToastMsg('Please upload a valid CSV file.', 'error');
  }
};

const removeCsvFile = () => {
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
};

const parseCsvFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        showToastMsg('CSV must contain a header row and at least one data row.', 'error');
        return;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim());
      const headerMap = {};
      headers.forEach((h, idx) => {
        const key = h.toLowerCase().replace(/[\s_-]/g, '');
        if (['itemcodea', 'itema', 'a', 'codea', 'item1', 'firstitem'].includes(key)) headerMap.itemCodeA = idx;
        else if (['itemcodeb', 'itemb', 'b', 'codeb', 'item2', 'seconditem'].includes(key)) headerMap.itemCodeB = idx;
        else if (['remark', 'remarks', 'note', 'notes'].includes(key)) headerMap.remark = idx;
      });

      if (headerMap.itemCodeA === undefined || headerMap.itemCodeB === undefined) {
        showToastMsg('CSV must contain itemCodeA and itemCodeB columns.', 'error');
        return;
      }

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {
          itemCodeA: (values[headerMap.itemCodeA] || '').trim(),
          itemCodeB: (values[headerMap.itemCodeB] || '').trim(),
          remark: headerMap.remark !== undefined
            ? (values[headerMap.remark] || '').trim() || null
            : null,
        };
        if (row.itemCodeA || row.itemCodeB) data.push(row);
      }

      importPreviewData.value = data;
      showToastMsg(`Parsed ${data.length} row${data.length !== 1 ? 's' : ''} from CSV.`, 'success');
    } catch (err) {
      console.error('CSV parse error:', err);
      showToastMsg('Failed to parse CSV. Please check the format.', 'error');
    }
  };
  reader.readAsText(file);
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

const processImport = async () => {
  if (!csvFile.value || importPreviewData.value.length === 0) {
    showToastMsg('No data to import.', 'error');
    return;
  }

  importing.value = true;
  importResults.value = null;
  const total = importPreviewData.value.length;
  importProgress.value = {
    total, processed: 0, success: 0, failed: 0, remaining: total, percentage: 0,
  };

  try {
    const response = await itemRelationshipService.importBulk(importPreviewData.value);

    if (!response.success || !response.data) {
      importResults.value = {
        success: 0, failed: total, total,
        errors: [response.error || 'Import failed'],
      };
      showToastMsg(response.error || 'Import failed.', 'error');
      return;
    }

    const { success, failed, results } = response.data;
    importProgress.value = {
      total, processed: total, success, failed, remaining: 0, percentage: 100,
    };

    importResults.value = {
      success, failed, total,
      errors: results
        .filter(r => !r.success)
        .map(r => `${r.data?.itemCodeA || '?'} ↔ ${r.data?.itemCodeB || '?'}: ${r.error}`),
    };

    showToastMsg(
      `Import complete: ${success} imported, ${failed} failed.`,
      failed === 0 ? 'success' : 'error'
    );

    await reload();
    if (failed === 0) {
      setTimeout(() => closeImportModal(), 1500);
    }
  } catch (err) {
    console.error('Import error:', err);
    importResults.value = {
      success: 0, failed: total, total,
      errors: [err.message || 'Import failed'],
    };
    showToastMsg(err.message || 'Import failed.', 'error');
  } finally {
    importing.value = false;
  }
};

const downloadTemplate = () => {
  const sample = [
    'itemCodeA,itemCodeB,remark',
    'SDT0001,SDT0002,Same oil - drum vs kg',
    'SDT0003,SDT0004,Same sugar - sack vs kg',
    'SDT0005,SDT0006,Same cement - bag vs ton',
  ].join('\n');

  const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `relationship_import_template_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToastMsg('Template downloaded.', 'success');
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ================================================================
// LOAD
// ================================================================
const reload = async () => {
  loading.value = true;
  try {
    const response = await itemRelationshipService.getAll();
    if (response.success) {
      relationships.value = response.data;
    } else {
      relationships.value = [];
      showToastMsg(response.error || 'Failed to load relationships', 'error');
    }

    const validIds = new Set(relationships.value.map(r => r.id));
    selectedIds.value = selectedIds.value.filter(id => validIds.has(id));
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  } finally {
    loading.value = false;
  }
};

const showToastMsg = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

onMounted(reload);
</script>

<style scoped>
.relationships-tab { padding: 4px 0; }

/* Header */
.rel-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
}
.rel-header h3 { margin: 0 0 4px 0; font-size: 16px; color: #1e293b; }
.rel-subtitle {
  margin: 0; font-size: 13px; color: #64748b;
  max-width: 640px; line-height: 1.5;
}
.rel-subtitle code {
  background: #f1f5f9; padding: 1px 6px; border-radius: 4px;
  font-family: monospace; font-size: 12px;
}
.rel-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Filters */
.rel-filters { display: flex; gap: 10px; margin-bottom: 16px; }
.search-box { position: relative; flex: 1; max-width: 480px; }
.search-box input {
  width: 100%; padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 13px; background: #f8fafc;
}
.search-box input:focus { outline: none; border-color: #3b82f6; background: white; }
.search-icon {
  position: absolute; left: 10px; top: 50%;
  transform: translateY(-50%); font-size: 12px; color: #94a3b8;
}

/* Bulk bar */
.bulk-bar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; padding: 10px 14px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 10px; margin-bottom: 12px;
  flex-wrap: wrap; animation: slideDown 0.2s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.bulk-bar-left { display: flex; align-items: center; gap: 8px; }
.bulk-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 24px; height: 24px; padding: 0 8px;
  background: #3b82f6; color: white; border-radius: 12px;
  font-size: 12px; font-weight: 700;
}
.bulk-text { font-size: 13px; color: #1e40af; font-weight: 500; }
.bulk-bar-right { display: flex; gap: 8px; flex-wrap: wrap; }

/* Table */
.rel-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  background: white; border-radius: 10px; overflow: hidden;
  border: 1px solid #e2e8f0;
}
.rel-table th {
  background: #f8fafc; padding: 10px 12px; text-align: left;
  font-size: 11px; font-weight: 600; color: #475569;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.rel-table td {
  padding: 10px 12px; border-top: 1px solid #f1f5f9;
  vertical-align: middle;
}
.rel-table tr.row-selected td { background: #eff6ff; }
.rel-table tr.row-selected:hover td { background: #dbeafe; }

.checkbox-col {
  width: 40px; text-align: center;
  padding-left: 12px !important; padding-right: 4px !important;
}
.checkbox-col input[type="checkbox"] {
  width: 16px; height: 16px; cursor: pointer; accent-color: #3b82f6;
}

.rel-code {
  display: inline-block; padding: 3px 10px;
  background: #f0f9ff; color: #0369a1;
  font-family: monospace; font-weight: 700; font-size: 12px;
  border-radius: 6px; border: 1px solid #bae6fd;
}

.item-cell {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.item-code { font-family: monospace; font-size: 13px; color: #1e40af; }
.item-name { font-size: 12px; color: #64748b; }
.uom-pill {
  display: inline-block; padding: 2px 8px;
  background: #eff6ff; color: #1e40af;
  font-size: 10px; font-weight: 700; border-radius: 10px;
  letter-spacing: 0.3px;
}
.cell-remark { font-size: 12px; color: #64748b; max-width: 240px; }
.action-buttons { display: flex; gap: 2px; }

/* Buttons */
.btn-primary {
  background: #3b82f6; color: white; border: none;
  padding: 8px 16px; border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 500;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9; border: 1px solid #e2e8f0;
  padding: 8px 16px; border-radius: 10px; cursor: pointer;
  font-size: 13px;
}
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-danger {
  background: #ef4444; color: white; border: none;
  padding: 8px 16px; border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 500;
}
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-add {
  background: #3b82f6; color: white; border: none;
  padding: 8px 16px; border-radius: 10px; cursor: pointer;
  font-size: 13px;
}
.btn-add:hover { background: #2563eb; }

.btn-import {
  background: #8b5cf6; color: white; border: none;
  padding: 8px 16px; border-radius: 10px; cursor: pointer;
  font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.2s;
}
.btn-import:hover:not(:disabled) { background: #7c3aed; }
.btn-import:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-sm { padding: 6px 12px; font-size: 12px; }

.btn-template {
  background: #f59e0b; color: white; border: none;
  padding: 6px 14px; border-radius: 8px; cursor: pointer;
  font-size: 12px; font-weight: 500; margin-top: 8px;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-template:hover:not(:disabled) { background: #d97706; }
.btn-template:disabled { opacity: 0.5; cursor: not-allowed; }

.icon-btn {
  background: none; border: none; cursor: pointer;
  font-size: 14px; padding: 4px 6px; border-radius: 6px;
}
.icon-btn:hover { background: #f1f5f9; }
.delete-btn { color: #ef4444; }
.delete-btn:hover { background: #fee2e2; }

/* Pagination */
.pagination-container {
  margin-top: 20px; padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex; flex-direction: column; gap: 12px;
}
.pagination-info {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: #64748b; flex-wrap: wrap; gap: 8px;
}
.pagination-info .page-info { font-weight: 500; color: #1e293b; }
.pagination-controls {
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap; justify-content: center;
}
.page-btn {
  padding: 6px 14px; background: white;
  border: 1px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; font-size: 13px; color: #1e293b;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: #f1f5f9; border-color: #94a3b8;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.limit-select {
  padding: 6px 10px; border: 1px solid #e2e8f0;
  border-radius: 8px; background: white;
  font-size: 13px; cursor: pointer; color: #1e293b;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; z-index: 1000;
}
.modal-container {
  background: white; border-radius: 16px; width: 100%;
  max-height: 90vh; display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}
.rel-modal { max-width: 560px; }
.rel-modal-small { max-width: 460px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 { margin: 0; font-size: 16px; color: #1e293b; }
.modal-close {
  background: none; border: none; font-size: 18px;
  cursor: pointer; color: #94a3b8;
  width: 30px; height: 30px; border-radius: 50%;
}
.modal-close:hover { background: #f1f5f9; }
.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 16px 24px; border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.modal-hint {
  margin: 0 0 16px 0; font-size: 12px;
  color: #64748b; line-height: 1.5;
}

/* Form */
.form-group { margin-bottom: 14px; }
.form-group label {
  display: block; font-size: 11px; font-weight: 600;
  color: #475569; margin-bottom: 4px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.form-input {
  width: 100%; padding: 8px 10px;
  border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 13px; font-family: inherit;
}
.form-input:focus {
  outline: none; border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-input:disabled { background: #f8fafc; cursor: not-allowed; }

.code-display {
  padding: 8px 12px; background: #f0f9ff;
  border: 1px solid #bae6fd; border-radius: 6px;
  font-family: monospace; font-size: 14px; font-weight: 700;
  color: #0369a1; letter-spacing: 0.5px;
}
.code-display.code-auto {
  display: flex; align-items: center; gap: 8px;
  background: #f8fafc; border-style: dashed; border-color: #cbd5e1;
  color: #64748b; font-family: sans-serif; font-size: 12px;
  font-weight: 500; font-style: italic; letter-spacing: 0;
}
.auto-icon { font-size: 14px; font-style: normal; }
.hint {
  display: block; font-size: 11px; color: #94a3b8; margin-top: 4px;
}

/* Lazy search */
.item-search { position: relative; }
.search-hint {
  margin-top: 6px; font-size: 11px;
  color: #94a3b8; font-style: italic;
}
.search-loading {
  display: flex; align-items: center; gap: 6px;
  margin-top: 6px; font-size: 11px; color: #64748b;
}
.spinner-tiny {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid #e2e8f0; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
.spinner-white {
  border-color: rgba(255,255,255,0.4);
  border-top-color: white;
}
@keyframes spin { to { transform: rotate(360deg); } }

.search-results {
  list-style: none; margin: 6px 0 0 0; padding: 0;
  border: 1px solid #e2e8f0; border-radius: 8px;
  max-height: 220px; overflow-y: auto;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.search-results li {
  padding: 8px 12px; cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.search-results li:last-child { border-bottom: none; }
.search-results li:hover { background: #f0f9ff; }

.selected-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: #f0f9ff;
  border: 1px solid #bae6fd; border-radius: 8px;
  gap: 8px;
}
.clear-item-btn {
  background: #f1f5f9; border: 1px solid #e2e8f0;
  color: #64748b; width: 26px; height: 26px;
  border-radius: 50%; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.clear-item-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }

/* Errors */
.form-errors {
  margin-top: 10px; padding: 10px 12px;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 8px;
}
.form-errors p { margin: 2px 0; font-size: 12px; color: #991b1b; }

/* Delete */
.delete-warning {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 12px 14px; background: #fef3c7;
  border: 1px solid #fde68a; border-radius: 8px;
}
.danger-icon { font-size: 22px; flex-shrink: 0; }
.delete-warning p {
  margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;
}

.bulk-list {
  margin-top: 14px; padding: 10px 14px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 8px; max-height: 240px; overflow-y: auto;
}
.bulk-list-title {
  margin: 0 0 8px 0; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.3px; color: #64748b;
}
.bulk-list-items {
  margin: 0; padding: 0; list-style: none;
  display: flex; flex-direction: column; gap: 6px;
}
.bulk-list-items li {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #1e293b;
}
.bulk-list-desc { font-family: monospace; color: #64748b; }

/* Import */
.import-info { margin-bottom: 16px; }
.info-box {
  display: flex; gap: 12px;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 8px; padding: 12px 16px;
}
.info-icon { font-size: 20px; flex-shrink: 0; }
.info-text { font-size: 13px; color: #475569; margin: 4px 0; }
.csv-format-list {
  margin: 8px 0 0 0; padding-left: 20px;
  font-size: 12px; color: #475569;
}
.csv-format-list li { margin: 2px 0; }

.file-upload-area {
  border: 2px dashed #d1d5db; border-radius: 8px;
  padding: 20px; text-align: center; cursor: pointer;
}
.file-upload-area:hover { border-color: #8b5cf6; background: #faf5ff; }
.import-upload {
  border-color: #8b5cf6; background: #faf5ff;
  min-height: 120px; display: flex;
  align-items: center; justify-content: center;
  transition: all 0.3s;
}
.import-upload.drag-over { border-color: #7c3aed; background: #ede9fe; }
.import-upload.disabled { opacity: 0.6; cursor: not-allowed; }

.file-preview {
  display: flex; align-items: center;
  gap: 10px; justify-content: center;
}
.file-icon { font-size: 24px; }
.file-name { font-weight: 500; }
.file-size { font-size: 12px; color: #94a3b8; }
.remove-file {
  background: none; border: none; cursor: pointer;
  color: #ef4444; font-size: 16px; padding: 0 4px;
}
.upload-placeholder {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
}
.upload-icon { font-size: 32px; }
.upload-hint { font-size: 11px; color: #94a3b8; }

.import-progress {
  margin: 16px 0; padding: 16px;
  background: #f8fafc; border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.progress-info {
  display: flex; justify-content: space-between;
  font-size: 13px; color: #475569; margin-bottom: 8px;
}
.progress-bar {
  width: 100%; height: 8px; background: #e2e8f0;
  border-radius: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  border-radius: 4px; transition: width 0.3s ease;
}
.progress-status {
  display: flex; gap: 16px; margin-top: 8px; font-size: 12px;
}
.status-success { color: #16a34a; }
.status-failed { color: #dc2626; }
.status-remaining { color: #475569; }

.import-preview { margin-top: 16px; }
.import-preview h4 {
  font-size: 14px; font-weight: 600;
  color: #1e293b; margin-bottom: 8px;
}
.preview-table-container {
  max-height: 220px; overflow-y: auto;
  border: 1px solid #e2e8f0; border-radius: 8px;
}
.preview-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
}
.preview-table th {
  background: #f8fafc; padding: 8px 12px;
  text-align: left; font-weight: 600;
  color: #475569; position: sticky; top: 0; z-index: 1;
}
.preview-table td {
  padding: 6px 12px; border-top: 1px solid #f1f5f9;
}
.preview-table code {
  font-family: monospace; font-size: 11px;
  color: #1e40af; background: #eff6ff;
  padding: 1px 6px; border-radius: 4px;
}
.preview-more {
  text-align: center; color: #94a3b8;
  font-style: italic; padding: 8px;
}

.import-results {
  margin-top: 16px; padding: 12px 16px;
  background: #f8fafc; border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.result-summary {
  display: flex; gap: 16px;
  font-size: 14px; font-weight: 500;
}
.result-success { color: #16a34a; }
.result-failed { color: #dc2626; }
.result-total { color: #475569; }
.result-errors {
  margin-top: 8px; padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}
.result-errors ul {
  margin: 4px 0 0 0; padding-left: 20px;
  font-size: 12px; color: #dc2626;
}
.result-errors li { margin: 2px 0; }

/* Loading / empty */
.loading-state { text-align: center; padding: 60px 20px; }
.spinner {
  border: 4px solid #f1f5f9; border-top: 4px solid #3b82f6;
  border-radius: 50%; width: 40px; height: 40px;
  animation: spin 1s linear infinite; margin: 0 auto 16px;
}
.empty-state { text-align: center; padding: 60px 20px; }
.empty-state.small { padding: 30px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state h3 { color: #1e293b; margin-bottom: 8px; font-size: 16px; }
.empty-state p { color: #94a3b8; margin-bottom: 16px; font-size: 13px; }

/* Toast */
.toast {
  position: fixed; bottom: 24px; right: 24px;
  padding: 12px 20px; border-radius: 12px;
  background: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100; border-left: 4px solid #10b981; font-size: 13px;
}
.toast.error { border-left-color: #ef4444; }

@media (max-width: 700px) {
  .rel-table { font-size: 12px; }
  .rel-table th, .rel-table td { padding: 8px 6px; }
  .item-cell { gap: 4px; }
  .bulk-bar { flex-direction: column; align-items: stretch; }
  .bulk-bar-right { justify-content: stretch; }
  .bulk-bar-right button { flex: 1; }
  .pagination-controls { gap: 6px; }
}
</style>