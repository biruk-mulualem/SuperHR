<template>
  <div class="employees-page">
    <!-- Language Switcher -->
    <div class="language-switcher-container">
      <div class="lang-toggle">
        <button 
          @click="setLanguage('en')" 
          class="lang-option"
          :class="{ active: currentLanguage === 'en' }"
        >
          EN
        </button>
        <button 
          @click="setLanguage('am')" 
          class="lang-option"
          :class="{ active: currentLanguage === 'am' }"
        >
          አማ
        </button>
      </div>
    </div>

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('employee.title') || 'Employee Management' }}</h1>
        <p class="page-subtitle">{{ $t('employee.subtitle') || 'Manage system employees, roles, and permissions' }}</p>
      </div>
      <div class="header-buttons">
        <router-link to="/documents-letters" class="btn-guarantee">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16v16H4z" stroke="currentColor" fill="none"/>
            <path d="M8 8h8M8 12h6M8 16h4" stroke="currentColor" stroke-linecap="round"/>
            <path d="M16 4v16" stroke="currentColor"/>
            <path d="M4 8h2M4 12h2M4 16h2" stroke="currentColor"/>
          </svg>
          {{ $t('common.guaranteeLetters') || 'Guarantee & Letters' }}
        </router-link>
        
        <router-link to="/employees/create" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ $t('common.addEmployee') || 'Add Employee' }}
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
      <p>{{ $t('common.loading') || 'Loading employees...' }}</p>
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
        @terminate-employee="handleTerminate"
        @reactivate-employee="handleReactivation"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Modals Component -->
    <EmployeeModals 
      :show-delete-modal="showDeleteModal"
      :employee-to-delete="employeeToDelete"
      :deleting="deleting"
      :show-terminate-modal="showTerminateModal"
      :employee-to-terminate="employeeToTerminate"
      :terminating="terminating"
      :show-reactivate-modal="showReactivateModal"
      :employee-to-reactivate="employeeToReactivate"
      :reactivating="reactivating"
      :toasts="toasts"
      @close-delete-modal="closeDeleteModal"
      @delete-employee="deleteEmployee"
      @close-terminate-modal="closeTerminateModal"
      @confirm-terminate="confirmTerminate"
      @close-reactivate-modal="closeReactivateModal"
      @confirm-reactivate="confirmReactivate"
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import EmployeesService from '@/stores/employee'
import UsersService from '@/stores/users'
import EmployeeStatsCards from './components/employee/EmployeeStatsCards.vue'
import EmployeeFiltersBar from './components/employee/EmployeeFiltersBar.vue'
import EmployeeTable from './components/employee/EmployeeTable.vue'
import EmployeeModals from './components/employee/EmployeeModals.vue'

const router = useRouter()
const { t, locale } = useI18n()

// Language state
const currentLanguage = ref(locale.value)

// Toggle language function
const setLanguage = (lang) => {
  locale.value = lang
  currentLanguage.value = lang
  localStorage.setItem('language', lang)
  addToast(lang === 'en' ? 'Switched to English' : 'ወደ አማርኛ ተቀይሯል', 'success')
}

// ============================================================================
// STATE
// ============================================================================
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
const terminating = ref(false)
const reactivating = ref(false)

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

// ========== MODAL STATES ==========
// Delete Modal
const showDeleteModal = ref(false)
const employeeToDelete = ref(null)

// Terminate Modal
const showTerminateModal = ref(false)
const employeeToTerminate = ref(null)

// Reactivate Modal
const showReactivateModal = ref(false)
const employeeToReactivate = ref(null)

// Toast
const toasts = ref([])

// Debounce timeout
let searchTimeout = null

// ============================================================================
// MODAL HANDLERS
// ============================================================================

// ========== DELETE MODAL ==========
const confirmDelete = (employee) => {
  if (employee.status === 'terminated') {
    addToast(`${employee.fullName} is already terminated`, 'warning')
    return
  }
  employeeToDelete.value = employee
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  employeeToDelete.value = null
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
      addToast(result.error || t('messages.error') || 'Delete failed', 'error')
    }
  } catch (error) {
    console.error('Delete employee error:', error)
    addToast(t('messages.error') || 'Delete failed', 'error')
  } finally {
    deleting.value = false
  }
}

// ========== TERMINATE MODAL ==========
const handleTerminate = (employee) => {
  console.log('🔴 Terminate clicked for:', employee.fullName)
  employeeToTerminate.value = employee
  showTerminateModal.value = true
}

const closeTerminateModal = () => {
  showTerminateModal.value = false
  employeeToTerminate.value = null
}

const confirmTerminate = async () => {
  // console.log('🔴 Confirming terminate for:', employeeToTerminate.value?.fullName)
  terminating.value = true
  try {
    const result = await EmployeesService.terminateEmployee(
      employeeToTerminate.value.id
    )
    if (result.success) {
      addToast(`${employeeToTerminate.value.fullName} has been terminated successfully`, 'success')
      closeTerminateModal()
      loadKpiStats()
      loadEmployees()
    } else {
      addToast(result.error || 'Failed to terminate employee', 'error')
    }
  } catch (error) {
    console.error('Terminate error:', error)
    addToast('Failed to terminate employee', 'error')
  } finally {
    terminating.value = false
  }
}

// ========== REACTIVATE MODAL ==========
const handleReactivation = (employee) => {
  // console.log('🟢 Reactivate clicked for:', employee.fullName)
  employeeToReactivate.value = employee
  showReactivateModal.value = true
}

const closeReactivateModal = () => {
  showReactivateModal.value = false
  employeeToReactivate.value = null
}

const confirmReactivate = async () => {
  // console.log('🟢 Confirming reactivate for:', employeeToReactivate.value?.fullName)
  reactivating.value = true
  try {
    const result = await EmployeesService.reactivateEmployee(
      employeeToReactivate.value.id
    )
    if (result.success) {
      addToast(`${employeeToReactivate.value.fullName} has been reactivated successfully`, 'success')
      closeReactivateModal()
      loadKpiStats()
      loadEmployees()
    } else {
      addToast(result.error || 'Failed to reactivate employee', 'error')
    }
  } catch (error) {
    console.error('Reactivation error:', error)
    addToast('Failed to reactivate employee', 'error')
  } finally {
    reactivating.value = false
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================
const navigateToAnalytics = () => {
  router.push('/analytics')
}

// ============================================================================
// TOAST
// ============================================================================
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 4000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// ============================================================================
// DATA LOADING
// ============================================================================
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
      addToast(result.error || t('messages.error') || 'Failed to load employees', 'error')
    }
  } catch (error) {
    console.error('Load employees error:', error)
    addToast(t('messages.error') || 'Failed to load employees', 'error')
  } finally {
    loading.value = false
  }
}

// ============================================================================
// EMPLOYEE ACTIONS
// ============================================================================
const toggleStatus = async (employee) => {
  // console.log('🔄 Toggle status for:', employee.fullName, 'Current:', employee.status)
  
  if (employee.status === 'terminated') {
    addToast('Cannot toggle terminated employees', 'warning')
    return
  }
  
  const newStatus = employee.status === 'active' ? 'on-leave' : 'active'
  try {
    const result = await EmployeesService.updateEmployee(employee.id, { status: newStatus })
    
    if (result.success) {
      employee.status = newStatus
      addToast(`${employee.fullName} status changed to ${getStatusLabel(newStatus)}`, 'success')
      loadKpiStats()
      loadEmployees()
    } else {
      addToast(result.error || t('messages.error') || 'Status update failed', 'error')
    }
  } catch (error) {
    console.error('Toggle status error:', error)
    addToast(t('messages.error') || 'Status update failed', 'error')
  }
}

// ============================================================================
// NAVIGATION ACTIONS
// ============================================================================
const editEmployee = (employee) => {
  router.push(`/employees/${employee.id}/edit`)
}

const viewEmployee = (employee) => {
  router.push(`/employees/${employee.id}`)
}

// ============================================================================
// FILTERS & PAGINATION
// ============================================================================
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

const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters }
}

const goToPage = (page) => {
  pagination.value.page = page
  loadEmployees()
}

// ============================================================================
// UTILITY
// ============================================================================
const getStatusLabel = (status) => {
  const labels = { 
    active: t('employee.active') || 'Active', 
    'on-leave': t('employee.onLeave') || 'On Leave', 
    terminated: t('employee.terminated') || 'Terminated' 
  }
  return labels[status] || status
}

// ============================================================================
// WATCHERS
// ============================================================================
watch(() => filters.value.search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadEmployees()
  }, 500)
})

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
/* Language Toggle - Modern Switch Style */
.language-switcher-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.lang-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 40px;
  padding: 4px;
  gap: 4px;
  border: 1px solid #e2e8f0;
}

.lang-option {
  padding: 8px 20px;
  border: none;
  border-radius: 32px;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.lang-option:hover {
  color: #1e293b;
}

.lang-option.active {
  background: rgb(132, 219, 123);
  color: #ededee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

* { 
  box-sizing: border-box; 
}

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

.btn-primary, .btn-guarantee {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
}

.btn-guarantee {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-primary:hover, .btn-guarantee:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #6a11cb);
}

.btn-guarantee:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
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
  .employees-page { 
    padding: 12px; 
  }
  .page-title { 
    font-size: 20px; 
  }
  .btn-primary, .btn-guarantee { 
    padding: 8px 16px; 
    font-size: 13px; 
  }
  .btn-guarantee svg, .btn-primary svg {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 640px) {
  .header-buttons {
    flex-wrap: wrap;
  }
  
  .btn-primary, .btn-guarantee {
    width: 100%;
    justify-content: center;
  }
}
</style>