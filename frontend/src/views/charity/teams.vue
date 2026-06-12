<template>
  <div class="teams-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Charity Teams</h1>
        <p class="page-subtitle">Manage distribution teams, heads, and members</p>
      </div>
      <router-link to="/charity/teams/create" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        New Team
      </router-link>
    </div>

    <div v-if="error" class="error-alert">
      {{ error }}
      <button @click="fetchTeams">Retry</button>
    </div>

    <StatsCards :cards="statsCards" />

    <FilterBar
      v-model:search="filters.search"
      search-placeholder="Search teams..."
      @clear="clearFilters"
    >
      <template #actions>
        <button class="btn-outline" :disabled="loading" @click="fetchTeams">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </template>
    </FilterBar>

    <ListTable
      :columns="teamColumns"
      :rows="teams"
      row-key="teamId"
      :pagination="pagination"
      :loading="loading"
      @page-change="onPageChange"
      @sort-change="onSort"
    >
      <template #cell-members="{ value }">
        <span class="members-badge">{{ value?.length || 0 }} members</span>
      </template>
      <template #cell-beneficiaries="{ row }">
        <span class="beneficiaries-badge">{{ row.beneficiaryCount || 0 }} beneficiaries</span>
      </template>
      <template #cell-headMember="{ row }">
        {{ row.headMember ? `${row.headMember.firstName} ${row.headMember.lastName}` : 'Not assigned' }}
      </template>
      <template #cell-viceMember="{ row }">
        {{ row.viceMember ? `${row.viceMember.firstName} ${row.viceMember.lastName}` : 'Not assigned' }}
      </template>
      <template #cell-isActive="{ row }">
        <span
          :class="['lt-badge', row.isActive ? 'lt-badge--active' : 'lt-badge--inactive']"
          style="cursor:pointer; user-select:none"
          @click.stop="toggleActive(row)"
          :title="row.isActive ? 'Click to deactivate' : 'Click to activate'"
        >
          {{ row.isActive ? 'Active' : 'Inactive' }}
        </span>
      </template>
      <!-- Actions – Edit and Delete -->
      <template #actions="{ row }">
        <div class="actions-group">
          <router-link :to="`/charity/teams/${row.teamId}/edit`" class="action-btn edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </router-link>
          <button class="action-btn delete" title="Delete" @click="confirmDelete(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </template>
    </ListTable>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="confirm.show"
      :title="confirm.title"
      :message="confirm.message"
      :type="confirm.type"
      :loading="confirm.loading"
      @close="confirm.show = false"
      @confirm="confirm.action === 'toggleStatus' ? processToggleActive() : processDelete()"
    />

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import CharityService from '@/stores/charity'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar   from './components/common/FilterBar.vue'
import ListTable   from './components/common/ListTable.vue'
import ConfirmationModal from './components/modals/ConfirmationModal.vue'

const teams = ref([])
const loading = ref(false)
const error = ref(null)
const filters = ref({ search: '' })
const toasts = ref([])

const confirm = reactive({
  show: false,
  title: '',
  message: '',
  type: 'danger',
  loading: false,
  targetId: null
})

const pagination = ref({ 
  currentPage: 1, 
  totalPages: 1, 
  totalItems: 0, 
  pageSize: 10 
})

const fetchTeams = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await CharityService.getTeams({
      page: pagination.value.currentPage,
      size: pagination.value.pageSize,
      search: filters.value.search
    })
    if (res.success) {
      teams.value = res.data
      pagination.value.totalItems = res.pagination.totalItems
      pagination.value.totalPages = res.pagination.totalPages
    } else {
      error.value = res.error
    }
  } catch (err) {
    error.value = 'Failed to fetch teams'
  } finally {
    loading.value = false
  }
}

const clearFilters = () => { 
  filters.value.search = ''
  pagination.value.currentPage = 1
  fetchTeams()
}

const onPageChange = (page) => { 
  pagination.value.currentPage = page 
  fetchTeams()
}

const onSort = ({ key, dir }) => { 
  console.log('Sort:', key, dir) 
}

const statsCards = computed(() => [
  { key: 'total', label: 'Total Teams', value: pagination.value.totalItems },
  { key: 'active', label: 'Active Teams', value: teams.value.filter(t => t.isActive).length, color: '#10b981' },
  { key: 'members', label: 'Total Members', value: teams.value.reduce((s, t) => s + (t.members?.length || 0), 0), color: '#3b82f6' },
])

const teamColumns = [
  { key: 'teamId', label: 'ID', width: '60px' },
  { key: 'name', label: 'Name' },
  { key: 'headMember', label: 'Team Head' },
  { key: 'viceMember', label: 'Vice Head' },
  { key: 'members', label: 'Members' },
  { key: 'beneficiaries', label: 'Beneficiaries' },
  { key: 'isActive', label: 'Active' },
]

const toggleActive = (team) => {
  confirm.show = true
  confirm.action = 'toggleStatus'
  confirm.targetId = team.teamId
  confirm.title = team.isActive ? 'Deactivate Team' : 'Activate Team'
  confirm.message = team.isActive 
    ? `When you deactivate a team, all the beneficiaries that belong to this team will be deactivated too. This will affect ${team.beneficiaryCount || 0} beneficiaries that belong to this team.`
    : `Are you sure you want to activate the team "${team.name}"?`
  confirm.type = team.isActive ? 'warning' : 'primary'
  confirm.tempRow = team
}

const processToggleActive = async () => {
  const team = confirm.tempRow
  confirm.loading = true
  try {
    const res = await CharityService.updateTeam(team.teamId, { isActive: !team.isActive })
    if (res.success) {
      team.isActive = res.data.isActive
      addToast(`Team ${team.isActive ? 'activated' : 'deactivated'} successfully`)
      confirm.show = false
    } else {
      addToast(res.error, 'error')
    }
  } catch (err) {
    addToast('Failed to toggle status', 'error')
  } finally {
    confirm.loading = false
  }
}

const confirmDelete = (team) => {
  confirm.show = true
  confirm.title = 'Delete Team'
  confirm.message = `Are you sure you want to delete the team "${team.name}"? This action will archive the team record.`
  confirm.type = 'danger'
  confirm.targetId = team.teamId
}

const processDelete = async () => {
  confirm.loading = true
  try {
    const res = await CharityService.deleteTeam(confirm.targetId)
    if (res.success) {
      addToast('Team deleted successfully')
      confirm.show = false
      fetchTeams()
    } else {
      addToast(res.error, 'error')
    }
  } catch (err) {
    addToast('Failed to delete team', 'error')
  } finally {
    confirm.loading = false
  }
}

const addToast = (msg, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

// Debounce search
let searchTimeout
watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.currentPage = 1
    fetchTeams()
  }, 500)
})

onMounted(() => {
  fetchTeams()
})
</script>

<style scoped>
.teams-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn-icon { width: 18px; height: 18px; }
.btn-icon-small { width: 16px; height: 16px; margin-right: 4px; }
.members-badge { background: #e0e7ff; color: #3730a3; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.beneficiaries-badge { background: #f0fdf4; color: #166534; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid #b7e4cf; }
.actions-group { display: flex; gap: 8px; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
.btn-outline { display: inline-flex; align-items: center; padding: 8px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; color: #475569; }
.btn-outline:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.export-btn { background: #f8fafc; border-color: #cbd5e1; }
.export-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #6366f1; }
.lt-badge--active { background: #e6f7ee; color: #0d6b36; border: 1px solid #b7e4cf; padding: 2px 8px; border-radius: 20px; font-size: 11px; padding: 2px 8px;}
.lt-badge--inactive { background: #fef1f1; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 20px; font-size: 11px; padding: 2px 8px;}
.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.error-alert button { background: #b91c1c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
</style>