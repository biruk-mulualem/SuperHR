<!-- pages/uom.vue -->
<template>
  <div class="section-card">
    <!-- Header -->
    <div class="card-header">
      <div class="header-title">
        <h2>📏 Units of Measure</h2>
        <span class="total-badge">{{ totalUOMs }} UOMs</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search UOMs..."
            @input="handleSearch"
          />
        </div>
        <button class="btn-add" @click="openAddUOMModal">
          ➕ Add UOM
        </button>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading UOMs...</p>
    </div>

    <div v-else class="table-container">
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
          <tr v-if="filteredUOMs.length === 0">
            <td colspan="5" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📏</span>
                <p>{{ searchQuery ? 'No UOMs match your search' : 'No UOMs found' }}</p>
                <button class="btn-primary" @click="openAddUOMModal">
                  Add First UOM
                </button>
              </div>
            </td>
          </tr>
          <tr
            v-for="(uom, index) in paginatedUOMs"
            :key="uom.uomId || uom.id"
          >
            <td class="text-center">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>
            <td>
              <span class="code-badge">{{ uom.code }}</span>
            </td>
            <td class="uom-name">{{ uom.name }}</td>
            <td>
              <span :class="['status-badge', (uom.status || 'active').toLowerCase()]">
                {{ uom.status || 'Active' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="icon-btn"
                  title="Edit"
                  @click="openEditUOMModal(uom)"
                >
                  ✏️
                </button>
                <button
                  class="icon-btn"
                  :title="uom.status === 'Active' ? 'Deactivate' : 'Activate'"
                  @click="toggleUOMStatus(uom)"
                >
                  {{ uom.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="filteredUOMs.length > 0">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        Next →
      </button>
      <select v-model="pageSize" @change="handlePageSizeChange" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>
  </div>

  <!-- ADD / EDIT MODAL -->
  <div
    v-if="showUOMModal"
    class="modal-overlay"
    @click.self="closeUOMModal"
  >
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
              <input
                v-model="uomForm.code"
                type="text"
                required
                placeholder="e.g., KG, L, Box"
                :readonly="!!editingUOM"
              />
              <span v-if="editingUOM" class="hint">Code cannot be changed</span>
            </div>
            <div class="form-group">
              <label>UOM Name *</label>
              <input
                v-model="uomForm.name"
                type="text"
                required
                placeholder="e.g., Kilogram, Liter, Box"
                @keyup.enter="saveUOM"
              />
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeUOMModal">Cancel</button>
        <button
          class="btn-primary"
          @click="saveUOM"
          :disabled="!uomForm.code || !uomForm.name || saving"
        >
          {{ saving ? 'Saving...' : editingUOM ? 'Update' : 'Add' }}
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
import { ref, computed, onMounted } from 'vue';
import itemService from '@/stores/itemService';

// ✅ ADDED: emit for parent notifications
const emit = defineEmits(['uom-updated']);

// ----------------------------------------------------------------
// STATE
// ----------------------------------------------------------------
const uomList = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const showUOMModal = ref(false);
const editingUOM = ref(null);
const uomForm = ref({ code: '', name: '', status: 'Active' });

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// ----------------------------------------------------------------
// COMPUTED
// ----------------------------------------------------------------
const totalUOMs = computed(() => uomList.value.length);

const filteredUOMs = computed(() => {
  let list = [...uomList.value];
  if (searchQuery.value.trim()) {
    const s = searchQuery.value.trim().toLowerCase();
    list = list.filter(u =>
      (u.code || '').toLowerCase().includes(s) ||
      (u.name || '').toLowerCase().includes(s)
    );
  }
  return list;
});

const totalPages = computed(
  () => Math.ceil(filteredUOMs.value.length / pageSize.value) || 1
);

const paginatedUOMs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUOMs.value.slice(start, start + pageSize.value);
});

// ----------------------------------------------------------------
// LOAD
// ----------------------------------------------------------------
const loadUOMs = async () => {
  loading.value = true;
  try {
    const response = await itemService.getUOMs();
    if (response.success) {
      uomList.value = response.data || [];
    } else {
      showToastMessage(response.error || 'Failed to load UOMs', 'error');
    }
  } catch (err) {
    console.error('Load UOMs error:', err);
    showToastMessage('Failed to load UOMs', 'error');
  } finally {
    loading.value = false;
  }
};

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 4000);
};

// ----------------------------------------------------------------
// PAGINATION
// ----------------------------------------------------------------
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

// ----------------------------------------------------------------
// MODAL — OPEN / CLOSE
// ----------------------------------------------------------------
const openAddUOMModal = () => {
  editingUOM.value = null;
  uomForm.value = { code: '', name: '', status: 'Active' };
  showUOMModal.value = true;
};

const openEditUOMModal = (uom) => {
  editingUOM.value = uom;
  uomForm.value = {
    code: uom.code,
    name: uom.name,
    status: uom.status || 'Active',
  };
  showUOMModal.value = true;
};

const closeUOMModal = () => {
  showUOMModal.value = false;
  editingUOM.value = null;
  uomForm.value = { code: '', name: '', status: 'Active' };
};

// ----------------------------------------------------------------
// SAVE
// ----------------------------------------------------------------
const saveUOM = async () => {
  const code = uomForm.value.code.trim();
  const name = uomForm.value.name.trim();

  if (!code || !name) {
    showToastMessage('Please enter both code and name', 'error');
    return;
  }

  saving.value = true;
  try {
    if (editingUOM.value) {
      const uomId = editingUOM.value.uomId || editingUOM.value.id;
      const response = await itemService.updateUOM(uomId, { name });
      if (response.success) {
        showToastMessage('UOM updated successfully', 'success');
        await loadUOMs();
        closeUOMModal();
        emit('uom-updated'); // ✅ ADDED
      } else {
        showToastMessage(response.error || 'Failed to update UOM', 'error');
      }
    } else {
      const exists = uomList.value.some(
        u => (u.code || '').toLowerCase() === code.toLowerCase()
      );
      if (exists) {
        showToastMessage(`UOM "${code}" already exists`, 'error');
        return;
      }
      const response = await itemService.createUOM({ code, name });
      if (response.success) {
        showToastMessage(`UOM "${code}" added`, 'success');
        await loadUOMs();
        closeUOMModal();
        emit('uom-updated'); // ✅ ADDED
      } else {
        showToastMessage(response.error || 'Failed to add UOM', 'error');
      }
    }
  } catch (err) {
    console.error('Save UOM error:', err);
    showToastMessage(
      err.response?.data?.error || 'Failed to save UOM',
      'error'
    );
  } finally {
    saving.value = false;
  }
};

// ----------------------------------------------------------------
// TOGGLE STATUS
// ----------------------------------------------------------------
const toggleUOMStatus = async (uom) => {
  try {
    const newStatus = uom.status === 'Active' ? 'Inactive' : 'Active';
    const uomId = uom.uomId || uom.id;
    const response = await itemService.updateUOM(uomId, { status: newStatus });
    if (response.success) {
      showToastMessage(
        `UOM "${uom.code}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`,
        'success'
      );
      await loadUOMs();
      emit('uom-updated'); // ✅ ADDED
    } else {
      showToastMessage(response.error || 'Failed to change status', 'error');
    }
  } catch (err) {
    console.error('Toggle UOM error:', err);
    showToastMessage(
      err.response?.data?.error || 'Failed to change status',
      'error'
    );
  }
};

// ----------------------------------------------------------------
// LIFECYCLE
// ----------------------------------------------------------------
onMounted(loadUOMs);
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

.header-actions {
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

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-container { overflow-x: auto; }

.uom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 500px;
}

.uom-table th,
.uom-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.uom-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center { text-align: center; }

.code-badge {
  display: inline-block;
  background: #eff6ff;
  color: #1e40af;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.uom-name {
  font-weight: 500;
  color: #1e293b;
}

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.inactive { background: #fef3c7; color: #92400e; }

.action-buttons { display: flex; gap: 4px; }

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
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
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.page-info { font-size: 13px; color: #475569; }

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
/* LOADING & EMPTY */
/* ================================================================ */
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
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
.empty-content p { color: #94a3b8; margin: 0; }

/* ================================================================ */
/* MODAL */
/* ================================================================ */
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
  max-width: 450px;
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

.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.uom-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.uom-form .form-group {
  flex: 1;
  min-width: 120px;
}

.uom-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.uom-form .form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}
.uom-form .form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}
.uom-form .form-group input[readonly] {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.uom-form .hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
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
.toast.info { border-left-color: #3b82f6; }
.toast.warning { border-left-color: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 600px) {
  .section-card { padding: 12px; }
  .card-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-direction: column; align-items: stretch; }
  .search-box input { width: 100%; }
  .uom-form .form-row { flex-direction: column; gap: 8px; }
  .modal-container { margin: 10px; max-height: 95vh; }
}
</style>