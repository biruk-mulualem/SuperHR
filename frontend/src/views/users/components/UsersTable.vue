<template>
  <div class="table-container">
    <div class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" :checked="selectAll" @change="$emit('toggle-select-all')" />
            </th>
            <th>User</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Last Login</th>
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
            <td>
              <span :class="`role-badge role-${user.role}`">{{ formatRole(user.role) }}</span>
            </td>
            <td class="nowrap">{{ user.departmentName || 'N/A' }}</td>
            <td>
              <button class="status-toggle" :class="user.isActive ? 'status-active' : 'status-inactive'" @click="$emit('toggle-status', user)">
                <span class="status-dot"></span>
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="nowrap">{{ formatDate(user.lastLogin) }}</td>
            <td class="actions-cell">
              <button class="action-btn edit" @click="$emit('edit-user', user)" title="Edit User">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                  <path d="M4 20h16" />
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
            <td colspan="7" class="empty-state">
              <div class="empty-state-content">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

    <!-- Bulk Actions -->
    <div v-if="selectedUsers.length > 0" class="bulk-actions">
      <span>{{ selectedUsers.length }} user(s) selected</span>
      <div class="bulk-buttons">
        <button class="bulk-btn" @click="$emit('bulk-update', true)">Activate All</button>
        <button class="bulk-btn danger" @click="$emit('bulk-update', false)">Deactivate All</button>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button class="page-btn" :disabled="pagination.page === 1" @click="$emit('go-to-page', pagination.page - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.page === pagination.totalPages" @click="$emit('go-to-page', pagination.page + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  users: {
    type: Array,
    default: () => []
  },
  selectedUsers: {
    type: Array,
    default: () => []
  },
  selectAll: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({ page: 1, totalPages: 1 })
  }
})

defineEmits(['toggle-select-all', 'toggle-user-select', 'edit-user', 'reset-password', 'toggle-status', 'go-to-page', 'bulk-update', 'clear-filters'])

const formatRole = (role) => {
  if (!role) return 'User'
  if (role.toLowerCase() === 'hr') return 'HR'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// Local avatar functions - no external API needed
const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getAvatarColor = (name) => {
  const colors = ['#6a11cb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const index = name.length % colors.length
  return colors[index]
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'Never'
}
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.table-wrapper { min-width: 800px; }
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
  .table-wrapper { min-width: 650px; }
  .users-table th, .users-table td { padding: 10px 12px; }
  .bulk-actions { flex-direction: column; align-items: stretch; }
  .bulk-buttons { justify-content: stretch; }
  .bulk-btn { flex: 1; }
}
</style>