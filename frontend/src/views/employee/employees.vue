<template>
  <div class="employees-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Employee Management</h1>
        <p class="page-subtitle">Manage system employees, roles, and permissions</p>
      </div>
      <div class="header-buttons">
        <router-link to="/analytics" class="btn-analytics">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
            <path d="M12 3v18" />
          </svg>
          Analytics
        </router-link>
        <router-link to="/employees/create" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Employee
        </router-link>
      </div>
    </div>

    <!-- Stats Cards Component -->
    <EmployeeStatsCards 
      :stats="kpiStats" 
      :departments="departments"
      @navigate-to-analytics="navigateToAnalytics"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading employees...</p>
    </div>

    <div v-else>
      <!-- Filters Bar Component -->
      <EmployeeFiltersBar 
        :filters="filters"
        :departments="departments"
        @update:filters="updateFilters"
        @clear-filters="clearFilters"
        @load-employees="loadEmployees"
      />

      <!-- Employees Table Component -->
      <EmployeeTable 
        :employees="employees"
        :pagination="pagination"
        @edit-employee="editEmployee"
        @view-employee="viewEmployee"
        @delete-employee="confirmDelete"
        @toggle-status="toggleStatus"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Modals Component -->
    <EmployeeModals 
      :show-delete-modal="showDeleteModal"
      :employee-to-delete="employeeToDelete"
      :deleting="deleting"
      :toasts="toasts"
      @close-delete-modal="closeDeleteModal"
      @delete-employee="deleteEmployee"
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmployeesService from '@/stores/employee'
import UsersService from '@/stores/users'
import EmployeeStatsCards from './components/employee/EmployeeStatsCards.vue'
import EmployeeFiltersBar from './components/employee/EmployeeFiltersBar.vue'
import EmployeeTable from './components/employee/EmployeeTable.vue'
import EmployeeModals from './components/employee/EmployeeModals.vue'

const router = useRouter()

// State
const employees = ref([])
const departments = ref([])
const kpiStats = ref({
  total: 0,
  active: 0,
  onLeave: 0,
  terminated: 0,
  fullyCompliant: 0,
  missingDocs: 0,
  complianceRate: '0'
})
const loading = ref(false)
const deleting = ref(false)

// Pagination
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1
})

// Filters
const filters = ref({
  search: '',
  departmentId: '',
  employmentStatus: '',
  employmentType: ''
})

// Delete Modal
const showDeleteModal = ref(false)
const employeeToDelete = ref(null)

// Toast
const toasts = ref([])

// Debounce timeout
let searchTimeout = null

// ============================================================================
// METHODS
// ============================================================================

// Navigate to analytics page
const navigateToAnalytics = () => {
  router.push('/analytics')
}

// Toast functions
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 3000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Load departments
const loadDepartments = async () => {
  try {
    const result = await UsersService.getDepartments()
    if (result.success) {
      departments.value = result.departments
    }
  } catch (error) {
    console.error('Load departments error:', error)
  }
}

// Load KPI Stats
const loadKpiStats = async () => {
  try {
    const result = await EmployeesService.getKpiStats()
    if (result.success && result.data) {
      kpiStats.value = result.data
    }
  } catch (error) {
    console.error('Load KPI stats error:', error)
  }
}

// Load employees
const loadEmployees = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: filters.value.search,
      departmentId: filters.value.departmentId,
      employmentStatus: filters.value.employmentStatus,
      employmentType: filters.value.employmentType
    }
    
    const result = await EmployeesService.getEmployees(params)
    
    if (result.success) {
      employees.value = result.data
      pagination.value = result.pagination
    } else {
      addToast(result.error || 'Failed to load employees', 'error')
    }
  } catch (error) {
    console.error('Load employees error:', error)
    addToast('Failed to load employees', 'error')
  } finally {
    loading.value = false
  }
}

// Toggle employee status
const toggleStatus = async (employee) => {
  const newStatus = employee.status === 'active' ? 'on-leave' : 'active'
  try {
    const result = await EmployeesService.updateEmployee(employee.id, { status: newStatus })
    
    if (result.success) {
      employee.status = newStatus
      addToast(`${employee.fullName} status changed to ${getStatusLabel(newStatus)}`, 'success')
      loadKpiStats()
    } else {
      addToast(result.error || 'Status update failed', 'error')
    }
  } catch (error) {
    console.error('Toggle status error:', error)
    addToast('Status update failed', 'error')
  }
}

// Delete employee
const confirmDelete = (employee) => {
  employeeToDelete.value = employee
  showDeleteModal.value = true
}

const deleteEmployee = async () => {
  deleting.value = true
  try {
    const result = await EmployeesService.deleteEmployee(employeeToDelete.value.id)
    
    if (result.success) {
      addToast(result.message, 'success')
      closeDeleteModal()
      loadEmployees()
      loadKpiStats()
    } else {
      addToast(result.error || 'Delete failed', 'error')
    }
  } catch (error) {
    console.error('Delete employee error:', error)
    addToast('Delete failed', 'error')
  } finally {
    deleting.value = false
  }
}

// Edit employee
const editEmployee = (employee) => {
  router.push(`/employees/${employee.id}/edit`)
}

// View employee
const viewEmployee = (employee) => {
  router.push(`/employees/${employee.id}`)
}

// Clear filters
const clearFilters = () => {
  filters.value = {
    search: '',
    departmentId: '',
    employmentStatus: '',
    employmentType: ''
  }
  pagination.value.page = 1
  loadEmployees()
}

// Update filters
const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters }
}

// Pagination
const goToPage = (page) => {
  pagination.value.page = page
  loadEmployees()
}

// Close delete modal
const closeDeleteModal = () => {
  showDeleteModal.value = false
  employeeToDelete.value = null
}

// Utility functions
const getStatusLabel = (status) => {
  const labels = { active: 'Active', 'on-leave': 'On Leave', terminated: 'Terminated' }
  return labels[status] || status
}

// Watch for search with debounce
watch(() => filters.value.search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadEmployees()
  }, 500)
})

// Watch for filter changes
watch([() => filters.value.departmentId, () => filters.value.employmentStatus, () => filters.value.employmentType], () => {
  pagination.value.page = 1
  loadEmployees()
})

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
  await Promise.all([
    loadDepartments(),
    loadKpiStats(),
    loadEmployees()
  ])
})
</script>

<style scoped>
* { box-sizing: border-box; }

.employees-page {
  padding: 16px;
  min-height: 100vh;
  background: #f5f7fb;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
}

.btn-primary, .btn-analytics {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
}

.btn-analytics {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-primary:hover, .btn-analytics:hover {
  transform: translateY(-2px);
}

.header-buttons {
  display: flex;
  gap: 12px;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .employees-page { padding: 12px; }
  .page-title { font-size: 20px; }
  .btn-primary, .btn-analytics { padding: 8px 16px; font-size: 13px; }
}
</style>