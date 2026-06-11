<template>
  <div class="table-container">
    <table class="employees-table">
      <thead>
        <tr>
          <th>{{ $t('employee.employee') || 'Employee' }}</th>
          <th>{{ $t('employee.id') || 'ID' }}</th>
          <th>{{ $t('employee.dept') || 'Dept' }}</th>
          <th>{{ $t('employee.position') || 'Position' }}</th>
          <th>{{ $t('employee.type') || 'Type' }}</th>
          <th>{{ $t('employee.status') || 'Status' }}</th>
          <th>{{ $t('employee.hireDate') || 'Hire Date' }}</th>
          <th>{{ $t('actions.actions') || 'Actions' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="emp in employees" :key="emp.id">
          <td class="employee-cell">
            <!-- Try to load image first, fallback to colored avatar -->
            <img 
              v-if="emp.profilePictureUrl" 
              :src="emp.profilePictureUrl" 
              class="employee-avatar" 
              @error="handleImageError($event, emp.fullName)"
              :alt="emp.fullName"
            />
            <div 
              v-else 
              class="avatar-placeholder" 
              :style="{ background: getAvatarColor(emp.fullName) }"
            >
              {{ getInitials(emp.fullName) }}
            </div>
            <div class="employee-info">
              <span class="employee-name">{{ emp.fullName }}</span>
              <span class="employee-email">{{ emp.fullNameEnglish || emp.email }}</span>
            </div>
           </td>
          <td class="employee-id">{{ emp.employeeId }} </td>
           <td>{{ emp.departmentName || 'N/A' }} </td>
          <td class="position-cell">{{ emp.position || 'N/A' }} </td>
           <td>
            <span :class="`type-badge type-${emp.employmentType}`">
              {{ getEmploymentTypeLabel(emp.employmentType) }}
            </span>
           </td>
           <td>
            <button class="status-toggle" :class="`status-${emp.status}`" @click="$emit('toggle-status', emp)">
              <span class="status-dot"></span>
              {{ getStatusLabel(emp.status) }}
            </button>
           </td>
          <td class="date-cell">{{ formatDate(emp.hireDate) }} </td>
          <td class="actions-cell">
            <button class="action-btn view" @click="$emit('view-employee', emp)" :title="$t('actions.viewDetails') || 'View Details'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button class="action-btn edit" @click="$emit('edit-employee', emp)" :title="$t('actions.editEmployee') || 'Edit Employee'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3l4 4-7 7H10v-4l7-7z" />
              </svg>
            </button>
            <button v-if="emp.status !== 'terminated'" class="action-btn delete" @click="$emit('delete-employee', emp)" :title="$t('actions.delete') || 'Delete'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
           </td>
         </tr>
        <tr v-if="employees.length === 0">
          <td colspan="8" class="empty-state">
            <div class="empty-state-content">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3 class="empty-state-title">{{ $t('messages.noData') || 'No Employee found' }}</h3>
              <p class="empty-state-message">{{ $t('messages.adjustFilters') || 'Try adjusting your search or filter criteria' }}</p>
              <button class="empty-state-btn" @click="$emit('clear-filters')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                {{ $t('common.clearFilters') || 'Clear Filters' }}
              </button>
            </div>
           </td>
         </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button class="page-btn" :disabled="pagination.page === 1" @click="$emit('go-to-page', pagination.page - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <span>{{ $t('common.page') || 'Page' }} {{ pagination.page }} {{ $t('common.of') || 'of' }} {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.page === pagination.totalPages" @click="$emit('go-to-page', pagination.page + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  employees: {
    type: Array,
    default: () => []
  },
  pagination: {
    type: Object,
    default: () => ({ page: 1, totalPages: 1 })
  }
})

defineEmits(['edit-employee', 'view-employee', 'delete-employee', 'toggle-status', 'go-to-page', 'clear-filters'])

// Utility functions
const getInitials = (name) => {
  if (!name) return 'E'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getAvatarColor = (name) => {
  const colors = ['#6a11cb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const index = (name?.length || 0) % colors.length
  return colors[index]
}

const getEmploymentTypeLabel = (type) => {
  const labels = { 
    'full-time': 'Full Time', 
    'part-time': 'Part Time', 
    contract: 'Contract', 
    intern: 'Intern' 
  }
  return labels[type] || type || 'N/A'
}

const getStatusLabel = (status) => {
  const labels = { 
    active: 'Active', 
    'on-leave': 'On Leave', 
    terminated: 'Terminated' 
  }
  return labels[status] || status || 'N/A'
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'N/A'
}

// Handle image loading error - replace with colored avatar
const handleImageError = (event, fullName) => {
  const img = event.target
  const parent = img.parentElement
  
  // Create fallback div
  const fallback = document.createElement('div')
  fallback.className = 'avatar-placeholder'
  fallback.style.background = getAvatarColor(fullName)
  fallback.textContent = getInitials(fullName)
  
  // Replace img with fallback
  parent.replaceChild(fallback, img)
}
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.employees-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.employees-table th,
.employees-table td {
  padding: 12px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.employees-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
}

.employees-table td {
  font-size: 13px;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

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

.employee-info {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.employee-email {
  font-size: 11px;
  color: #64748b;
}

.employee-id {
  font-family: monospace;
  font-size: 12px;
  color: #64748b;
}

.position-cell {
  max-width: 180px;
  white-space: normal;
  word-break: break-word;
}

.date-cell {
  white-space: nowrap;
}

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.type-full-time {
  background: #10b98120;
  color: #10b981;
}

.type-part-time {
  background: #3b82f620;
  color: #3b82f6;
}

.type-contract {
  background: #f59e0b20;
  color: #f59e0b;
}

.type-intern {
  background: #8b5cf620;
  color: #8b5cf6;
}

.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

.status-active {
  background: #10b98120;
  color: #10b981;
}

.status-on-leave {
  background: #f59e0b20;
  color: #f59e0b;
}

.status-terminated {
  background: #ef444420;
  color: #ef4444;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.actions-cell {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn.view {
  background: #10b98120;
  color: #10b981;
}

.action-btn.edit {
  background: #3b82f620;
  color: #3b82f6;
}

.action-btn.delete {
  background: #ef444420;
  color: #ef4444;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
}

.page-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.page-btn svg {
  width: 16px;
  height: 16px;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px !important;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  color: #94a3b8;
  opacity: 0.6;
  margin-bottom: 8px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.empty-state-message {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

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
  transition: all 0.2s ease;
}

.empty-state-btn svg {
  width: 16px;
  height: 16px;
}

.empty-state-btn:hover {
  background: #6a11cb;
  border-color: #6a11cb;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(106, 17, 203, 0.2);
}

@media (max-width: 768px) {
  .employees-table {
    min-width: 650px;
  }
  .employees-table th,
  .employees-table td {
    padding: 10px 12px;
  }
}
</style>