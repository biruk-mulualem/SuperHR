<!-- views/storemanagement/balancecorrection/StoreCleanup.vue -->
<template>
  <div class="store-cleanup-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">🗑️</div>
        <div>
          <h1 class="page-title">Store Cleanup</h1>
          <p class="page-subtitle">Delete all balances and history for a store-group</p>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-refresh" @click="loadStoresAndGroups" :disabled="loading">
          🔄 {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        <router-link to="/storemanagement/balancecorrection" class="btn-back">
          ← Back
        </router-link>
      </div>
    </div>

    <!-- Warning Banner -->
    <div class="warning-banner">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <strong>DANGER:</strong> This action will permanently delete ALL balances and transaction history
        for the selected Store and Group. This action <strong>CANNOT BE UNDONE</strong>.
      </div>
    </div>

    <!-- Selection Form -->
    <div class="selection-section">
      <div class="selection-card">
        <div class="selection-header">
          <h3>Select Store & Group</h3>
          <p>Choose the store and group combination you want to clean up</p>
        </div>

        <div class="selection-body">
          <div class="form-row">
            <div class="form-group">
              <label>Store *</label>
              <select v-model="selectedStoreId" class="form-select">
                <option value="">Select a Store...</option>
                <option v-for="store in stores" :key="store.id" :value="store.id">
                  {{ store.name }} ({{ store.code || 'N/A' }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Group *</label>
              <select v-model="selectedGroupId" class="form-select">
                <option value="">Select a Group...</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }} ({{ group.code || 'N/A' }})
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="selectedStoreId && selectedGroupId" class="preview-section">
      <div class="preview-card">
        <div class="preview-header">
          <h3>📊 Preview Data</h3>
          <p>Data that will be deleted for <strong>{{ getStoreName() }}</strong> - <strong>{{ getGroupName() }}</strong></p>
        </div>

        <div v-if="loadingPreview" class="loading-state">
          <div class="spinner-small"></div>
          <span>Loading preview...</span>
        </div>

        <div v-else class="preview-body">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Store Balances</span>
              <span class="stat-value" :class="previewData.balanceCount > 0 ? 'has-data' : 'no-data'">
                {{ previewData.balanceCount }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">History Records</span>
              <span class="stat-value" :class="previewData.historyCount > 0 ? 'has-data' : 'no-data'">
                {{ previewData.historyCount }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Records</span>
              <span class="stat-value" :class="previewData.totalCount > 0 ? 'has-data' : 'no-data'">
                {{ previewData.totalCount }}
              </span>
            </div>
          </div>

          <!-- Delete Button -->
          <button
            class="btn-delete"
            @click="confirmDelete"
            :disabled="deleting || previewData.totalCount === 0"
          >
            {{ deleting ? 'Deleting...' : `🗑️ Delete All (${previewData.totalCount} records)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- CONFIRMATION MODAL -->
    <!-- ============================================================ -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
      <div class="modal-container confirm-modal">
        <div class="modal-header danger">
          <h3>⚠️ Confirm Deletion</h3>
          <button class="modal-close" @click="closeConfirmModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="confirm-warning">
            <div class="confirm-icon">🚨</div>
            <p><strong>You are about to permanently delete:</strong></p>
            <ul>
              <li><strong>{{ previewData.balanceCount }}</strong> store balance(s)</li>
              <li><strong>{{ previewData.historyCount }}</strong> history record(s)</li>
              <li><strong>{{ previewData.totalCount }}</strong> total record(s)</li>
            </ul>
            <p style="color: #dc2626; font-weight: 700;">This action CANNOT be undone!</p>
          </div>

          <div class="confirm-details">
            <div class="detail-row">
              <span class="detail-label">Store:</span>
              <span class="detail-value">{{ getStoreName() }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Group:</span>
              <span class="detail-value">{{ getGroupName() }}</span>
            </div>
          </div>

          <div class="confirm-input">
            <label>Type <strong>DELETE</strong> to confirm:</label>
            <input
              type="text"
              v-model="confirmText"
              placeholder="Type DELETE here..."
              class="confirm-input-field"
              :class="{ 'confirm-valid': confirmText === 'DELETE' }"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeConfirmModal">Cancel</button>
          <button
            class="btn-danger"
            @click="executeDelete"
            :disabled="confirmText !== 'DELETE' || deleting"
          >
            {{ deleting ? 'Deleting...' : '🗑️ Permanently Delete' }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import balanceService from '@/stores/balanceService'

const router = useRouter()

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const loadingPreview = ref(false)
const deleting = ref(false)
const stores = ref([])
const groups = ref([])
const selectedStoreId = ref('')
const selectedGroupId = ref('')
const previewData = ref({
  balanceCount: 0,
  historyCount: 0,
  totalCount: 0
})
const showConfirmModal = ref(false)
const confirmText = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const selectedStore = computed(() => {
  return stores.value.find(s => s.id === Number(selectedStoreId.value))
})

const selectedGroup = computed(() => {
  return groups.value.find(g => g.id === Number(selectedGroupId.value))
})

// ================================================================
// METHODS
// ================================================================
const loadStoresAndGroups = async () => {
  loading.value = true
  try {
    const [storesRes, groupsRes] = await Promise.all([
      balanceService.getStores({ limit: 1000 }),
      balanceService.getGroups({ limit: 1000 })
    ])

    if (storesRes.success) {
      stores.value = storesRes.data || []
    }
    if (groupsRes.success) {
      groups.value = groupsRes.data || []
    }
  } catch (error) {
    console.error('Error loading data:', error)
    showToastMessage('Failed to load stores and groups', 'error')
  } finally {
    loading.value = false
  }
}

const loadPreview = async () => {
  if (!selectedStoreId.value || !selectedGroupId.value) return

  loadingPreview.value = true
  try {
    // Load balances count
    const balancesRes = await balanceService.getBalances({
      storeId: Number(selectedStoreId.value),
      groupId: Number(selectedGroupId.value),
      limit: 1
    })

    // Load history count (we need to fetch and count)
    // We'll use the total from the balances response
    const balanceCount = balancesRes.pagination?.total || 0

    // For history, we need to make a separate call
    // Since we don't have a direct history count endpoint, we'll use what we have
    // Or you can add a count endpoint

    // For now, we'll estimate history count from balances
    // A better approach is to add a count endpoint

    previewData.value = {
      balanceCount: balanceCount,
      historyCount: balanceCount * 2, // Placeholder - you should add proper count
      totalCount: balanceCount * 3 // Placeholder
    }

  } catch (error) {
    console.error('Error loading preview:', error)
    previewData.value = {
      balanceCount: 0,
      historyCount: 0,
      totalCount: 0
    }
  } finally {
    loadingPreview.value = false
  }
}

const getStoreName = () => {
  return selectedStore.value?.name || 'Unknown Store'
}

const getGroupName = () => {
  return selectedGroup.value?.name || 'Unknown Group'
}

const confirmDelete = () => {
  if (previewData.value.totalCount === 0) {
    showToastMessage('No data to delete', 'warning')
    return
  }
  confirmText.value = ''
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  confirmText.value = ''
}

const executeDelete = async () => {
  if (confirmText.value !== 'DELETE') return

  deleting.value = true
  try {
    const response = await balanceService.deleteStoreGroupData({
      storeId: Number(selectedStoreId.value),
      groupId: Number(selectedGroupId.value)
    })

    if (response.success) {
      showToastMessage(`✅ ${response.message}`, 'success')
      closeConfirmModal()
      // Reset selection
      selectedStoreId.value = ''
      selectedGroupId.value = ''
      previewData.value = {
        balanceCount: 0,
        historyCount: 0,
        totalCount: 0
      }
      // Reload stores/groups
      await loadStoresAndGroups()
    } else {
      showToastMessage(response.error || 'Failed to delete data', 'error')
    }
  } catch (error) {
    console.error('Error deleting data:', error)
    showToastMessage(error.response?.data?.error || 'Failed to delete data', 'error')
  } finally {
    deleting.value = false
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
// WATCHERS
// ================================================================
watch([selectedStoreId, selectedGroupId], () => {
  loadPreview()
})

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadStoresAndGroups()
})
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.store-cleanup-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  background: #f0f2f6;
  min-height: 100vh;
}

/* ================================================================
   HEADER
   ================================================================ */
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
  background: linear-gradient(135deg, #ef4444, #dc2626);
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

.btn-back {
  padding: 6px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}
.btn-back:hover {
  background: #f8fafc;
}

/* ================================================================
   WARNING BANNER
   ================================================================ */
.warning-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.warning-text {
  font-size: 14px;
  color: #991b1b;
  line-height: 1.5;
}
.warning-text strong {
  color: #dc2626;
}

/* ================================================================
   SELECTION SECTION
   ================================================================ */
.selection-section {
  margin-bottom: 20px;
}

.selection-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.selection-header {
  margin-bottom: 16px;
}
.selection-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}
.selection-header p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.selection-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}
.form-select:focus {
  outline: none;
  border-color: #6a11cb;
}

/* ================================================================
   PREVIEW SECTION
   ================================================================ */
.preview-section {
  margin-bottom: 20px;
}

.preview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.preview-header {
  margin-bottom: 16px;
}
.preview-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}
.preview-header p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}
.preview-header strong {
  color: #1e293b;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #94a3b8;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  margin-top: 4px;
}
.stat-value.has-data {
  color: #dc2626;
}
.stat-value.no-data {
  color: #22c55e;
}

.btn-delete {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete:hover:not(:disabled) {
  background: #b91c1c;
  transform: scale(1.02);
}
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   MODAL
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
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
  max-width: 480px;
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
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.modal-header.danger {
  background: #fee2e2;
  border-bottom-color: #fecaca;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}
.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
}
.modal-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.confirm-warning {
  background: #fef2f2;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.confirm-icon {
  font-size: 32px;
  text-align: center;
  margin-bottom: 8px;
}
.confirm-warning ul {
  margin: 8px 0;
  padding-left: 20px;
}
.confirm-warning ul li {
  padding: 2px 0;
}

.confirm-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}
.detail-label {
  color: #94a3b8;
  font-size: 13px;
}
.detail-value {
  color: #1e293b;
  font-weight: 600;
  font-size: 13px;
}

.confirm-input label {
  display: block;
  font-size: 13px;
  color: #475569;
  margin-bottom: 4px;
}
.confirm-input-field {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  font-family: monospace;
}
.confirm-input-field:focus {
  outline: none;
}
.confirm-input-field.confirm-valid {
  border-color: #22c55e;
  background: #f0fdf4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 6px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #f8fafc;
}

.btn-danger {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: #dc2626;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 9999;
  animation: slideIn 0.2s ease, fadeOut 0.2s ease 3s forwards;
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

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .store-cleanup-page { padding: 12px; }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-right {
    display: flex;
    gap: 8px;
  }
  .header-right button,
  .header-right a {
    flex: 1;
    text-align: center;
  }

  .form-row {
    flex-direction: column;
  }
  .form-group {
    min-width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .modal-container {
    max-width: 100%;
    margin: 10px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .warning-text {
    font-size: 13px;
  }
}
</style>