<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal wide">
      <div class="modal-header">
        <h3>Assign Available Beneficiaries</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body no-padding">
        <FilterBar
          v-model:search="filters.search"
          search-placeholder="Search name..."
          @clear="filters.search = ''; filters.location = ''"
        >
          <template #filters>
             <input 
               type="text" 
               v-model="filters.location" 
               placeholder="Filter by location..." 
               class="location-filter-input"
             />
          </template>
        </FilterBar>

        <ListTable
          :columns="modalColumns"
          :rows="filteredAvailable"
          row-key="beneficiaryId"
          :selectable="true"
          @selection-change="selectedIds = $event"
          :loading="loading"
        >
          <template #cell-location="{ row }">
            <span class="location-text">
              {{ row.fullInfo?.location?.city || '—' }}{{ row.fullInfo?.location?.region ? `, ${row.fullInfo.location.region}` : '' }}
            </span>
          </template>
        </ListTable>
      </div>

      <div class="modal-footer">
        <div class="selection-info" v-if="selectedIds.length > 0">
          {{ selectedIds.length }} selected
        </div>
        <button class="btn-outline" @click="$emit('close')" :disabled="saving">Cancel</button>
        <button 
          class="btn-primary" 
          @click="handleAssign" 
          :disabled="selectedIds.length === 0 || saving"
        >
          {{ saving ? 'Assigning...' : `Assign Selected` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FilterBar from '../../common/FilterBar.vue'
import ListTable from '../../common/ListTable.vue'
import CharityService, { type CharityBeneficiary } from '@/stores/charity'

const props = defineProps<{
  isOpen: boolean
  teamId: number
}>()

const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const saving = ref(false)
const availableBeneficiaries = ref<CharityBeneficiary[]>([])
const selectedIds = ref<number[]>([])
const filters = ref({ search: '', location: '' })

const modalColumns = [
  { key: 'fullname', label: 'Beneficiary', sortable: true },
  { key: 'location', label: 'Location' },
  { key: 'monthlyAllocation', label: 'Allocation', format: 'currency' }
]

const loadAvailable = async () => {
  loading.value = true
  // Fetch beneficiaries not assigned to this team
  const res = await CharityService.getBeneficiaries({ size: 1000 })
  if (res.success) {
    availableBeneficiaries.value = res.data.filter((b: CharityBeneficiary) => b.teamId !== props.teamId)
  }
  loading.value = false
}

const filteredAvailable = computed(() => {
  let result = availableBeneficiaries.value
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    result = result.filter(b => b.fullname.toLowerCase().includes(q))
  }
  if (filters.value.location) {
    const q = filters.value.location.toLowerCase()
    result = result.filter(b => {
      const loc = b.fullInfo?.location
      return loc?.city?.toLowerCase().includes(q) || loc?.region?.toLowerCase().includes(q)
    })
  }
  return result
})

const handleAssign = async () => {
  if (selectedIds.value.length === 0) return
  saving.value = true
  
  let successCount = 0
  for (const id of selectedIds.value) {
    const res = await CharityService.updateBeneficiary(id, { teamId: props.teamId })
    if (res.success) successCount++
  }

  if (successCount > 0) {
    emit('success', successCount)
    emit('close')
  } else {
    alert('Failed to assign beneficiaries.')
  }
  saving.value = false
}

// Watch for modal opening to reset and load data
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedIds.value = []
    filters.value = { search: '', location: '' }
    loadAvailable()
  }
})
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 24px; width: 600px; max-width: 95%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
.modal.wide { width: 900px; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.modal-body { overflow-y: auto; flex: 1; }
.modal-body.no-padding { padding: 0; }

.location-filter-input {
  padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 13px; color: #475569; width: 200px; outline: none;
}
.location-filter-input:focus { border-color: #6a11cb; }

.modal-footer { padding: 16px 24px; background: #fafcfd; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
.selection-info { font-size: 13px; font-weight: 600; color: #6a11cb; margin-right: auto; }

.btn-outline { padding: 10px 20px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; cursor: pointer; }
.btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.location-text { font-size: 13px; color: #475569; }
</style>
