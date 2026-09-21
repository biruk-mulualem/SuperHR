<!-- pages/categories.vue -->
<template>
  <div class="section-card">
    <!-- Header -->
    <div class="card-header">
      <div class="header-title">
        <h2>📁 Item Categories</h2>
        <span class="total-badge">{{ totalCategories }} Categories</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search categories..."
            @input="handleSearch"
          />
        </div>
        <button class="btn-add" @click="openAddCategoryModal">
          ➕ Add Category
        </button>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading categories...</p>
    </div>

    <div v-else class="table-container">
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
          <tr v-if="filteredCategories.length === 0">
            <td colspan="5" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📁</span>
                <p>{{ searchQuery ? 'No categories match your search' : 'No categories found' }}</p>
                <button class="btn-primary" @click="openAddCategoryModal">
                  Add First Category
                </button>
              </div>
            </td>
          </tr>
          <tr
            v-for="(cat, index) in paginatedCategories"
            :key="cat.categoryId || cat.id"
          >
            <td class="text-center">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>
            <td>
              <div class="category-name">
                <span class="category-icon">📁</span>
                <span>{{ cat.name }}</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', (cat.status || 'active').toLowerCase()]">
                {{ cat.status || 'Active' }}
              </span>
            </td>
            
            <td>
              <div class="action-buttons">
                <button
                  class="icon-btn"
                  title="Edit"
                  @click="openEditCategoryModal(cat)"
                >
                  ✏️
                </button>
                <button
                  class="icon-btn"
                  :title="cat.status === 'Active' ? 'Deactivate' : 'Activate'"
                  @click="toggleCategoryStatus(cat)"
                >
                  {{ cat.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="filteredCategories.length > 0">
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
    v-if="showCategoryModal"
    class="modal-overlay"
    @click.self="closeCategoryModal"
  >
    <div class="modal-container category-modal">
      <div class="modal-header">
        <h3>{{ editingCategory ? '✏️ Edit Category' : '📁 Add New Category' }}</h3>
        <button class="modal-close" @click="closeCategoryModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Category Name *</label>
          <input
            v-model="categoryForm.name"
            type="text"
            required
            placeholder="Enter category name..."
            @keyup.enter="confirmSaveCategory"
          />
          <span class="hint">
            Examples: Fiber Raw Material, Paint Raw Material, Electronics
          </span>
        </div>
        <div v-if="categoryExists" class="form-error">
          ⚠️ Category "{{ categoryForm.name }}" already exists
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeCategoryModal">Cancel</button>
        <button
          class="btn-primary"
          @click="confirmSaveCategory"
          :disabled="!categoryForm.name.trim() || saving"
        >
          {{ saving ? 'Saving...' : editingCategory ? 'Update' : 'Add' }}
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
const emit = defineEmits(['category-updated']);

// ----------------------------------------------------------------
// STATE
// ----------------------------------------------------------------
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const showCategoryModal = ref(false);
const editingCategory = ref(null);
const categoryExists = ref(false);
const categoryForm = ref({ name: '', status: 'Active' });

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// ----------------------------------------------------------------
// COMPUTED
// ----------------------------------------------------------------
const totalCategories = computed(() => categories.value.length);

const filteredCategories = computed(() => {
  let list = [...categories.value];
  if (searchQuery.value.trim()) {
    const s = searchQuery.value.trim().toLowerCase();
    list = list.filter(c => (c.name || '').toLowerCase().includes(s));
  }
  return list;
});

const totalPages = computed(
  () => Math.ceil(filteredCategories.value.length / pageSize.value) || 1
);

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredCategories.value.slice(start, start + pageSize.value);
});

// ----------------------------------------------------------------
// LOAD
// ----------------------------------------------------------------
const loadCategories = async () => {
  loading.value = true;
  try {
    const response = await itemService.getCategories();
    if (response.success) {
      categories.value = response.data || [];
    } else {
      showToastMessage(response.error || 'Failed to load categories', 'error');
    }
  } catch (err) {
    console.error('Load categories error:', err);
    showToastMessage('Failed to load categories', 'error');
  } finally {
    loading.value = false;
  }
};

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------
const getItemCount = (cat) => {
  if (cat.itemCount !== undefined && cat.itemCount !== null) return cat.itemCount;
  if (cat.itemsCount !== undefined && cat.itemsCount !== null) return cat.itemsCount;
  return '—';
};

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

// ----------------------------------------------------------------
// SAVE
// ----------------------------------------------------------------
const confirmSaveCategory = async () => {
  const name = categoryForm.value.name.trim();
  if (!name) return;

  saving.value = true;
  try {
    if (editingCategory.value) {
      const categoryId =
        editingCategory.value.categoryId || editingCategory.value.id;
      const response = await itemService.updateCategory(categoryId, {
        name,
        status: categoryForm.value.status,
      });
      if (response.success) {
        showToastMessage('Category updated successfully', 'success');
        await loadCategories();
        closeCategoryModal();
        emit('category-updated'); // ✅ ADDED
      } else {
        showToastMessage(response.error || 'Failed to update category', 'error');
      }
    } else {
      const exists = categories.value.some(
        c => (c.name || '').toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        categoryExists.value = true;
        return;
      }
      const response = await itemService.createCategory({ name });
      if (response.success) {
        showToastMessage(`Category "${name}" added`, 'success');
        await loadCategories();
        closeCategoryModal();
        emit('category-updated'); // ✅ ADDED
      } else {
        showToastMessage(response.error || 'Failed to add category', 'error');
      }
    }
  } catch (err) {
    console.error('Save category error:', err);
    showToastMessage(
      err.response?.data?.error || 'Failed to save category',
      'error'
    );
  } finally {
    saving.value = false;
  }
};

// ----------------------------------------------------------------
// TOGGLE STATUS
// ----------------------------------------------------------------
const toggleCategoryStatus = async (cat) => {
  try {
    const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    const categoryId = cat.categoryId || cat.id;
    const response = await itemService.updateCategory(categoryId, {
      status: newStatus,
    });
    if (response.success) {
      showToastMessage(
        `Category "${cat.name}" ${newStatus === 'Active' ? 'activated' : 'deactivated'}`,
        'success'
      );
      await loadCategories();
      emit('category-updated'); // ✅ ADDED
    } else {
      showToastMessage(response.error || 'Failed to change status', 'error');
    }
  } catch (err) {
    console.error('Toggle category error:', err);
    showToastMessage(
      err.response?.data?.error || 'Failed to change status',
      'error'
    );
  }
};

// ----------------------------------------------------------------
// LIFECYCLE
// ----------------------------------------------------------------
onMounted(loadCategories);
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

.category-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px;
}

.category-table th,
.category-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.category-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center { text-align: center; }

.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1e293b;
}

.category-icon { font-size: 16px; }

.item-count {
  display: inline-block;
  background: #eff6ff;
  color: #1e40af;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

.form-group { margin-bottom: 8px; }
.form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}
.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}
.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
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
  .category-table { min-width: 500px; }
  .modal-container { margin: 10px; max-height: 95vh; }
}
</style>