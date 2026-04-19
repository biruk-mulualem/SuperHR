<template>
  <div class="config-card">
    <div class="card-header">
      <div class="header-left">
        <span class="header-icon">🍲</span>
        <div class="header-info">
          <h3>Today's Dinner Tracking</h3>
          <p class="header-subtitle">Track employee dinner breaks for night shift</p>
        </div>
        <span class="badge" :class="{ live: tickets.length > 0 }">{{ totalCount }} total</span>
      </div>
      <button class="btn-primary-small" @click="openIssueModal">
        🎫 Issue Ticket
      </button>
    </div>
    
    <div class="card-body">
      <div v-if="initialLoading" class="loading-state">
        <div class="loader"></div>
        <p>Loading dinner records...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Try Again</button>
      </div>
      
      <div v-else>
        <!-- Search and Filter Bar -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by employee name or department..."
              class="search-input"
              @input="handleSearch"
            />
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">×</button>
          </div>
          
          <div class="filter-group">
            <select v-model="statusFilter" class="filter-select" @change="handleFilterChange">
              <option value="all">All Status</option>
              <option value="active">On Break</option>
              <option value="late">Late</option>
              <option value="on-time">On Time</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>
        
        <!-- Table -->
        <div v-if="tickets.length > 0" class="table-container">
          <table class="data-table compact">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Allowed Time</th>
                <th>Break-Out</th>
                <th>Expected</th>
                <th>Returned</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ticket in tickets" :key="ticket.id">
                <td class="employee-cell">
                  <div class="employee-info">
                    <span class="employee-name">{{ ticket.employeeName }}</span>
                  </div>
                </td>
                <td>
                  <span class="dept-badge">{{ ticket.department || 'N/A' }}</span>
                </td>
                <td>
                  <span class="allowed-time">{{ ticket.durationMinutes || 0 }} min</span>
                </td>
                <td>{{ formatTime(ticket.breakOutTime) }}</td>
                <td>{{ formatTime(ticket.expectedReturnTime) }}</td>
                <td>{{ ticket.actualReturnTime ? formatTime(ticket.actualReturnTime) : '—' }}</td>
                <td>
                  <div class="status-container">
                    <span :class="['status-badge', getStatusClass(ticket.displayStatus)]">
                      {{ getStatusText(ticket.displayStatus) }}
                    </span>
                    <span v-if="ticket.displayStatus === 'late'" class="late-minutes">
                      ({{ ticket.lateMinutes }} min)
                    </span>
                    <span v-else-if="ticket.displayStatus === 'absent'" class="absent-text">
                      ❌
                    </span>
                    <span v-else-if="ticket.displayStatus === 'on-time'" class="on-time-text">
                      ✓
                    </span>
                  </div>
                </td>
                <td class="action-buttons">
                  <button 
                    v-if="ticket.status === 'active'" 
                    class="btn-icon return" 
                    @click="returnFromBreak(ticket.id)" 
                    :disabled="returningTicketId === ticket.id"
                    title="Return from break"
                  >
                    <span v-if="returningTicketId === ticket.id" class="spinner"></span>
                    <span v-else>✅</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1" 
            @click="goToPage(currentPage - 1)"
          >
            ← Previous
          </button>
          <div class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalCount }} records)
          </div>
          <button 
            class="pagination-btn" 
            :disabled="currentPage === totalPages" 
            @click="goToPage(currentPage + 1)"
          >
            Next →
          </button>
        </div>
        
        <!-- Items per page -->
        <div class="items-per-page">
          <span>Show:</span>
          <select v-model="itemsPerPage" @change="handleItemsPerPageChange" class="per-page-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span>entries</span>
        </div>
      </div>
      
      <div v-if="!initialLoading && tickets.length === 0 && !error" class="empty-state">
        <span class="empty-icon">🍲</span>
        <p>No dinner records found</p>
        <button class="btn-primary-small" @click="openIssueModal">Issue First Ticket</button>
      </div>
    </div>

    <!-- Issue Ticket Modal -->
    <div v-if="showIssueModal" class="modal-overlay" @click="closeIssueModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="modal-icon">🎫</span>
            <h3>Issue Dinner Ticket</h3>
          </div>
          <button class="modal-close" @click="closeIssueModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalError" class="modal-error">
            <span class="modal-error-icon">⚠️</span>
            <span>{{ modalError }}</span>
          </div>
          
          <div class="form-field">
            <label>Employee <span class="required">*</span></label>
            <div class="select-wrapper">
              <select v-model="selectedEmployeeId" class="input">
                <option value="">Select an employee</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                  {{ emp.fullName || emp.firstName + ' ' + emp.lastName }} ({{ emp.departmentName || 'N/A' }})
                </option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>
          <div class="info-box">
            <span class="info-icon">⏰</span>
            Break-out time: <strong>{{ currentTime }}</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-modal cancel" @click="closeIssueModal">Cancel</button>
          <button class="btn-modal confirm" @click="issueTicket" :disabled="issuing">
            {{ issuing ? 'Issuing...' : 'Issue Ticket' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import attendanceService from '@/stores/attendanceService'
import employeesService from '@/stores/employee'

const tickets = ref([])
const employees = ref([])
const initialLoading = ref(true)
const issuing = ref(false)
const error = ref(null)
const showIssueModal = ref(false)
const selectedEmployeeId = ref(null)
const currentTime = ref('')
const returningTicketId = ref(null)
const modalError = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalCount = ref(0)
const totalPages = ref(1)

// Filters
const searchQuery = ref('')
const statusFilter = ref('all')

let refreshInterval = null
let timeInterval = null
let searchTimeout = null

const formatTime = (time) => {
  if (!time) return null
  try {
    const date = new Date(time)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return null
  }
}

const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const showToast = (message, type = 'success') => {
  const toast = document.createElement('div')
  toast.className = `success-toast ${type}`
  toast.innerHTML = type === 'success' ? `✓ ${message}` : type === 'error' ? `⚠️ ${message}` : `ℹ️ ${message}`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

const getStatusClass = (status) => {
  const classes = {
    'active': 'status-badge active',
    'late': 'status-badge late',
    'absent': 'status-badge absent',
    'on-time': 'status-badge on-time',
    'completed': 'status-badge completed'
  }
  return classes[status] || 'status-badge'
}

const getStatusText = (status) => {
  const texts = {
    'active': 'On Break',
    'late': 'Late',
    'absent': 'Absent',
    'on-time': 'On Time',
    'completed': 'Completed'
  }
  return texts[status] || status
}

const fetchEmployees = async () => {
  try {
    const result = await employeesService.getEmployees({ limit: 100 })
    if (result.success && result.data) employees.value = result.data
  } catch (err) {
    console.error('Failed to fetch employees:', err)
  }
}

const fetchData = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    if (statusFilter.value !== 'all') {
      params.statusFilter = statusFilter.value
    }
    
    const response = await attendanceService.getDinnerHistory(params)
    
    if (response && response.success === true && Array.isArray(response.data)) {
      tickets.value = response.data
        .filter(item => item !== null && item !== undefined)
        .map(item => ({
          id: item?.id || Math.random(),
          employeeId: item?.employeeId,
          employeeName: item?.employeeName || 'Unknown',
          department: item?.department || 'N/A',
          breakOutTime: item?.breakOutTime,
          expectedReturnTime: item?.expectedReturnTime,
          actualReturnTime: item?.actualReturnTime,
          durationMinutes: item?.durationMinutes || 0,
          status: item?.status || 'active',
          displayStatus: item?.displayStatus || item?.status || 'active',
          lateMinutes: item?.lateMinutes || 0
        }))
      
      if (response.pagination) {
        totalCount.value = response.pagination.total
        totalPages.value = response.pagination.totalPages
        currentPage.value = response.pagination.page
      } else {
        totalCount.value = response.count || tickets.value.length
        totalPages.value = Math.ceil(totalCount.value / itemsPerPage.value)
      }
    }
  } catch (err) {
    console.error('Failed to load dinner tickets:', err)
    error.value = err.response?.data?.error || 'Failed to load dinner tickets'
  }
}

const initialFetch = async () => {
  initialLoading.value = true
  await fetchEmployees()
  await fetchData()
  initialLoading.value = false
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 500)
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  fetchData()
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchData()
}

const handleItemsPerPageChange = () => {
  currentPage.value = 1
  fetchData()
}

const goToPage = (page) => {
  currentPage.value = page
  fetchData()
}

const openIssueModal = () => {
  modalError.value = null
  selectedEmployeeId.value = null
  showIssueModal.value = true
}

const closeIssueModal = () => {
  showIssueModal.value = false
  modalError.value = null
  selectedEmployeeId.value = null
}

const issueTicket = async () => {
  if (!selectedEmployeeId.value) {
    modalError.value = 'Please select an employee'
    return
  }
  
  issuing.value = true
  modalError.value = null
  
  try {
    await attendanceService.issueBreakTicket(selectedEmployeeId.value, 'dinner')
    await fetchData()
    closeIssueModal()
    showToast('Dinner ticket issued successfully', 'success')
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message || 'Failed to issue ticket'
    modalError.value = errorMsg
  } finally {
    issuing.value = false
  }
}

const returnFromBreak = async (ticketId) => {
  returningTicketId.value = ticketId
  
  const ticketIndex = tickets.value.findIndex(t => t.id === ticketId)
  let originalStatus = null
  if (ticketIndex !== -1) {
    originalStatus = tickets.value[ticketIndex].status
    tickets.value[ticketIndex].status = 'returning'
  }
  
  try {
    await attendanceService.returnFromBreak(ticketId)
    await fetchData()
    showToast('Returned from break successfully', 'success')
  } catch (err) {
    if (ticketIndex !== -1 && originalStatus) {
      tickets.value[ticketIndex].status = originalStatus
    }
    const errorMsg = err.response?.data?.error || 'Failed to return from break'
    showToast(errorMsg, 'error')
    
    if (errorMsg.includes('already completed')) {
      await fetchData()
    }
  } finally {
    returningTicketId.value = null
  }
}

onMounted(() => {
  initialFetch()
  refreshInterval = setInterval(fetchData, 30000)
  timeInterval = setInterval(updateCurrentTime, 1000)
  updateCurrentTime()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (timeInterval) clearInterval(timeInterval)
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<style scoped>
.config-card {
  background: white;
  border-radius: 20px;
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 28px;
}

.header-info h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.header-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 30px;
}

.badge.live {
  background: #ef4444;
  color: white;
  animation: pulse 2s infinite;
}

.btn-primary-small {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59,130,246,0.3);
}

.card-body {
  padding: 24px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 30px 10px 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  padding: 0 4px;
}

.clear-search:hover {
  color: #ef4444;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:hover {
  background: #f8fafc;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.dept-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e0e7ff;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: #4f46e5;
}

.allowed-time {
  background: #e0e7ff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #4f46e5;
  display: inline-block;
}

.status-container {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.active {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.late {
  background: #fed7aa;
  color: #ea580c;
}

.status-badge.absent {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.on-time, .status-badge.completed {
  background: #d1fae5;
  color: #059669;
}

.late-minutes {
  font-size: 10px;
  font-weight: 600;
  color: #ea580c;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon.return {
  background: #dcfce7;
  color: #059669;
}

.btn-icon.return:hover:not(:disabled) {
  background: #059669;
  color: white;
  transform: scale(1.05);
}

.btn-icon.return:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #059669;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.pagination-btn {
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
}

.items-per-page {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
}

.per-page-select {
  padding: 6px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #64748b;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.error-state {
  text-align: center;
  padding: 60px;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 12px;
}

.retry-btn {
  margin-top: 16px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
  display: block;
  margin-bottom: 16px;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 14px;
}

.info-box {
  background: #fef3c7;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #d97706;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 28px;
  width: 90%;
  max-width: 520px;
  max-height: 85vh;
  overflow: hidden;
  animation: slideIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #ef4444;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.modal-error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #dc2626;
  font-size: 13px;
}

.modal-error-icon {
  font-size: 16px;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

.input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  padding-right: 32px;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #94a3b8;
  pointer-events: none;
}

.btn-modal {
  padding: 10px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-modal.cancel {
  background: white;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
}

.btn-modal.cancel:hover {
  background: #f8fafc;
}

.btn-modal.confirm {
  background: #3b82f6;
  color: white;
}

.btn-modal.confirm:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-modal.confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.success-toast.success {
  background: #10b981;
  color: white;
}

.success-toast.error {
  background: #ef4444;
  color: white;
}

.success-toast.info {
  background: #3b82f6;
  color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .status-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>