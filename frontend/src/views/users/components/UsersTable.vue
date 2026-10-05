<template>
  <div class="table-container">
    <!-- Export bar -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-count" v-if="users.length > 0">
          {{ users.length }} user{{ users.length === 1 ? '' : 's' }}
        </span>
      </div>
      <div class="toolbar-right">
        <div class="export-dropdown" ref="exportDropdownRef">
          <button
            class="export-btn"
            @click="toggleExportMenu"
            :disabled="exporting || users.length === 0"
          >
            <span v-if="exporting" class="spinner"></span>
            {{ exporting ? 'Exporting...' : 'Export' }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div v-if="showExportMenu" class="export-menu">
            <button class="export-menu-item" @click="handleExport('csv')">
              <span class="export-icon csv">CSV</span>
              <div class="export-info">
                <span class="export-label">Export as CSV</span>
                <span class="export-desc">Best for Excel / spreadsheets</span>
              </div>
            </button>
            <button class="export-menu-item" @click="handleExport('json')">
              <span class="export-icon json">JSON</span>
              <div class="export-info">
                <span class="export-label">Export as JSON</span>
                <span class="export-desc">Best for backups / APIs</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th><input type="checkbox" :checked="selectAll" @change="$emit('toggle-select-all')" /></th>
            <th>User</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Created At</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.userId">
            <td>
              <input type="checkbox" :value="user.userId" :checked="selectedUsers.includes(user.userId)" @change="$emit('toggle-user-select', user.userId)" />
            </td>
            <td class="user-cell">
              <div class="avatar-placeholder" :style="{ background: getAvatarColor(user.fullName) }">
                {{ getInitials(user.fullName) }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ user.fullName }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
            </td>
            <td><span :class="`role-badge role-${user.role}`">{{ formatRole(user.role) }}</span></td>
            <td class="nowrap">{{ user.departmentName || 'N/A' }}</td>
            <td>
              <button class="status-toggle" :class="user.isActive ? 'status-active' : 'status-inactive'" @click="$emit('toggle-status', user)">
                <span class="status-dot"></span>
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="nowrap">{{ formatDate(user.lastLogin) }}</td>
            <td class="nowrap">{{ formatDateTime(user.createdAt) }}</td>
            <td class="nowrap">
              <span v-if="user.createdByName" class="created-by">{{ user.createdByName }}</span>
              <span v-else class="created-by-muted">System</span>
            </td>
            <td class="actions-cell">
              <button class="action-btn edit" @click="$emit('edit-user', user)" title="Edit User">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" />
                </svg>
              </button>
              <button class="action-btn reset" @click="$emit('reset-password', user)" title="Reset Password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 2L15 8M3 12h4M12 3v4M5.5 5.5l3 3M18.5 18.5l-3-3M21 22l-6-6M12 21v-4" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-state-content">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <h3 class="empty-state-title">No users found</h3>
                <p class="empty-state-message">Try adjusting your search or filter criteria</p>
                <button class="empty-state-btn" @click="$emit('clear-filters')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedUsers.length > 0" class="bulk-actions">
      <span>{{ selectedUsers.length }} user(s) selected</span>
      <div class="bulk-buttons">
        <button class="bulk-btn" @click="$emit('bulk-update', true)">Activate All</button>
        <button class="bulk-btn danger" @click="$emit('bulk-update', false)">Deactivate All</button>
      </div>
    </div>

    <div class="pagination" v-if="pagination.totalPages > 1">
      <button class="page-btn" :disabled="pagination.page === 1" @click="$emit('go-to-page', pagination.page - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.page === pagination.totalPages" @click="$emit('go-to-page', pagination.page + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  users: { type: Array, default: () => [] },
  selectedUsers: { type: Array, default: () => [] },
  selectAll: { type: Boolean, default: false },
  pagination: { type: Object, default: () => ({ page: 1, totalPages: 1 }) },
  exportFilters: { type: Object, default: () => ({}) }
})

const emit = defineEmits([
  'toggle-select-all', 'toggle-user-select', 'edit-user', 'reset-password',
  'toggle-status', 'go-to-page', 'bulk-update', 'clear-filters'
])

// ============================================================
// EXPORT STATE
// ============================================================
const showExportMenu = ref(false)
const exporting = ref(false)
const exportDropdownRef = ref(null)

const toggleExportMenu = () => {
  console.log('[EXPORT] toggle menu, current:', showExportMenu.value)
  showExportMenu.value = !showExportMenu.value
}

const closeExportMenu = () => {
  showExportMenu.value = false
}

// ============================================================
// EXPORT LOGIC — completely self-contained, no parent wiring
// ============================================================
const handleExport = async (format) => {
  console.log('[EXPORT] clicked, format =', format)
  closeExportMenu()
  exporting.value = true

  try {
    // 🔍 Build the query string manually so we can log it
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)

    const filters = props.exportFilters || {}
    if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role)
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status)
    if (filters.department && filters.department !== 'all') {
      queryParams.append('department', filters.department)
    }
    if (filters.search) queryParams.append('search', filters.search)

    const url = `/users/export?${queryParams.toString()}`
    console.log('[EXPORT] URL =', url)

    // 🔍 Lazy-load the axios instance so this component doesn't
    //    need the service or a parent import
    const { default: api } = await import('@/stores/interceptor')

    const response = await api.get(url, {
      // 🔑 Force text for CSV so axios doesn't try to JSON-parse it
      responseType: format === 'csv' ? 'text' : 'json'
    })

    console.log('[EXPORT] response status:', response.status)
    console.log('[EXPORT] response data type:', typeof response.data)
    console.log('[EXPORT] response data preview:',
      typeof response.data === 'string'
        ? response.data.slice(0, 200)
        : JSON.stringify(response.data).slice(0, 200)
    )

    const filename = `users_export_${new Date().toISOString().split('T')[0]}`

    let blob
    if (format === 'csv') {
      // Backend sends CSV as raw text
      const csvText = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data)   // fallback
      blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    } else {
      // Backend sends { success, data: [...], count, ... }
      const payload = response.data?.data ?? response.data
      blob = new Blob(
        [JSON.stringify(payload, null, 2)],
        { type: 'application/json' }
      )
    }

    // 🔑 Trigger the download
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `${filename}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(blobUrl)

    console.log('[EXPORT] ✅ download triggered:', `${filename}.${format}`)
  } catch (err) {
    console.error('[EXPORT] ❌ failed:', err)
    console.error('[EXPORT] error response:', err?.response?.data)
    console.error('[EXPORT] error status:', err?.response?.status)
    alert(`Export failed: ${err?.response?.data?.error || err.message || 'Unknown error'}`)
  } finally {
    exporting.value = false
  }
}

// Click-outside to close the menu
const handleClickOutside = (event) => {
  if (
    showExportMenu.value &&
    exportDropdownRef.value &&
    !exportDropdownRef.value.contains(event.target)
  ) {
    closeExportMenu()
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// ============================================================
// FORMATTERS
// ============================================================
const formatRole = (role) => {
  if (!role) return 'User'
  if (role.toLowerCase() === 'hr') return 'HR'
  return role.charAt(0).toUpperCase() + role.slice(1)
}
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
const getAvatarColor = (name) => {
  const colors = ['#6a11cb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  return colors[(name || '').length % colors.length]
}
const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'Never'
const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>
<style scoped>
.table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* ============================================================
   TOOLBAR
   ============================================================ */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 10px;
}
.toolbar-left { display: flex; align-items: center; gap: 10px; }
.toolbar-count { font-size: 13px; color: #64748b; font-weight: 500; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }

/* ============================================================
   EXPORT DROPDOWN
   ============================================================ */
.export-dropdown { position: relative; }

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.export-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}
.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #cbd5e1;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.export-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 240px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 50;
  animation: menuFadeIn 0.12s ease-out;
}
@keyframes menuFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.export-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.export-menu-item:hover { background: #f8fafc; }

.export-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.export-icon.csv  { background: #dcfce7; color: #166534; }
.export-icon.json { background: #dbeafe; color: #1e40af; }

.export-info { display: flex; flex-direction: column; line-height: 1.3; }
.export-label { font-size: 13px; font-weight: 600; color: #1e293b; }
.export-desc  { font-size: 11px; color: #94a3b8; }

/* ============================================================
   TABLE
   ============================================================ */
.table-wrapper { min-width: 1050px; }
.users-table { width: 100%; border-collapse: collapse; }
.users-table th, .users-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; }
.users-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; white-space: nowrap; }
.users-table td { font-size: 13px; white-space: nowrap; }
.nowrap { white-space: nowrap; }

.user-cell { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; color: #1e293b; }
.user-email { font-size: 11px; color: #64748b; }

.role-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.role-admin { background: #dc262620; color: #dc2626; }
.role-hr { background: #3b82f620; color: #3b82f6; }
.role-finance { background: #10b98120; color: #10b981; }
.role-employee { background: #8b5cf620; color: #8b5cf6; }

.status-toggle { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: none; white-space: nowrap; }
.status-active { background: #10b98120; color: #10b981; }
.status-inactive { background: #ef444420; color: #ef4444; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.created-by { font-weight: 500; color: #1e293b; font-size: 13px; }
.created-by-muted { color: #94a3b8; font-style: italic; font-size: 12px; }

.actions-cell { display: flex; gap: 6px; white-space: nowrap; }
.action-btn { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
.action-btn svg { width: 14px; height: 14px; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.reset { background: #f59e0b20; color: #f59e0b; }

/* Bulk Actions */
.bulk-actions {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.bulk-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.bulk-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: #3b82f6; color: white; }
.bulk-btn.danger { background: #ef4444; }

/* Pagination */
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin: 20px; }
.page-btn { padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; display: flex; align-items: center; }
.page-btn svg { width: 16px; height: 16px; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination span { font-size: 13px; color: #64748b; }

/* Empty State */
.empty-state { text-align: center; padding: 40px !important; color: #64748b; }
.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.empty-state-icon { width: 80px; height: 80px; color: #94a3b8; opacity: 0.6; margin-bottom: 8px; }
.empty-state-title { font-size: 18px; font-weight: 600; color: #475569; margin: 0; }
.empty-state-message { font-size: 14px; color: #64748b; margin: 0; }
.empty-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  margin-top: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #6a11cb;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.empty-state-btn svg { width: 16px; height: 16px; }
.empty-state-btn:hover {
  background: #6a11cb;
  border-color: #6a11cb;
  color: white;
}

@media (max-width: 768px) {
  .table-wrapper { min-width: 850px; }
  .users-table th, .users-table td { padding: 10px 12px; }
  .bulk-actions { flex-direction: column; align-items: stretch; }
  .bulk-buttons { justify-content: stretch; }
  .bulk-btn { flex: 1; }
  .export-menu { right: auto; left: 0; }
}
</style>