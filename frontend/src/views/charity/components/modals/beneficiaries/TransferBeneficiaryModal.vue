<template>
  <div v-if="isOpen && beneficiary" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Transfer Beneficiary</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Beneficiary Preview -->
        <div class="ben-card">
          <div class="ben-avatar">{{ beneficiary.fullname[0] }}</div>
          <div class="ben-details">
            <strong>{{ beneficiary.fullname }}</strong>
            <p>Currently in: {{ currentTeamName }}</p>
          </div>
        </div>

        <!-- Target Team Selection -->
        <div class="form-group">
          <label>Target Charity Team <span class="req">*</span></label>
          <select v-model="targetTeamId" :disabled="loadingTeams">
            <option value="">Select target team...</option>
            <option v-for="team in otherTeams" :key="team.teamId" :value="team.teamId">
              {{ team.name }}
            </option>
          </select>
          <p v-if="loadingTeams" class="hint">Loading teams...</p>
          <p v-else-if="otherTeams.length === 0" class="error-text">No other teams available for transfer.</p>
        </div>

        <!-- Optional Reason -->
        <div class="form-group" style="margin-top: 16px;">
          <label>Reason for Transfer</label>
          <textarea 
            v-model="reason" 
            rows="3" 
            placeholder="Describe why this beneficiary is being moved..."
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-outline" @click="$emit('close')" :disabled="saving">Cancel</button>
        <button 
          class="btn-primary" 
          @click="handleTransfer" 
          :disabled="!targetTeamId || saving"
        >
          {{ saving ? 'Transferring...' : 'Confirm Transfer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CharityService, { type CharityBeneficiary, type CharityTeam } from '@/stores/charity'

const props = defineProps<{
  isOpen: boolean
  beneficiary: CharityBeneficiary | null
  currentTeamName: string
}>()

const emit = defineEmits(['close', 'success'])

const targetTeamId = ref<number | ''>('')
const reason = ref('')
const saving = ref(false)
const teams = ref<CharityTeam[]>([])
const loadingTeams = ref(false)

const otherTeams = computed(() => {
  if (!props.beneficiary) return []
  return teams.value.filter(t => t.teamId !== props.beneficiary?.teamId)
})

const loadTeams = async () => {
  loadingTeams.value = true
  const res = await CharityService.getTeams({ size: 200, isActive: true })
  if (res.success) teams.value = res.data
  loadingTeams.value = false
}

const handleTransfer = async () => {
  if (!props.beneficiary || !targetTeamId.value) return
  
  saving.value = true
  const res = await CharityService.transferBeneficiary(props.beneficiary.beneficiaryId, Number(targetTeamId.value))

  if (res.success) {
    emit('success', {
      beneficiary: res.data,
      targetTeamName: teams.value.find(t => t.teamId === targetTeamId.value)?.name
    })
    emit('close')
  } else {
    alert(res.error || 'Failed to transfer beneficiary')
  }
  saving.value = false
}

// Watch for modal opening
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    targetTeamId.value = ''
    reason.value = ''
    loadTeams()
  }
})
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 24px; width: 450px; max-width: 95%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.modal-body { padding: 24px; }

.ben-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px; }
.ben-avatar { width: 44px; height: 44px; background: #6a11cb; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; }
.ben-details strong { block-size: auto; display: block; font-size: 15px; color: #1e293b; }
.ben-details p { font-size: 12px; color: #64748b; margin: 2px 0 0; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #ef4444; }

select, textarea { padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; }
select:focus, textarea:focus { border-color: #6a11cb; box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1); }

.hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.error-text { font-size: 11px; color: #ef4444; margin-top: 4px; font-weight: 500; }

.modal-footer { padding: 16px 24px; background: #fafcfd; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }
.btn-outline { padding: 10px 24px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; cursor: pointer; }
.btn-primary { padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
