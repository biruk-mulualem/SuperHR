<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      </svg>
      <h3>{{ props.t('healthLegal.title') || 'Health & Legal Information' }}</h3>
      <span class="optional-badge">{{ props.t('common.optional') || 'Optional' }}</span>
    </div>
    <div class="card-body">
      
      <!-- Health Section -->
      <div class="section-title">{{ props.t('healthLegal.healthTitle') || 'Health Information' }}</div>
      
      <div class="form-row">
        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" v-model="localHealthInfo.hasPhysicalInjury">
            {{ props.t('healthLegal.hasInjury') || 'Has any physical injury or disability?' }}
          </label>
        </div>
      </div>
      
      <div v-if="localHealthInfo.hasPhysicalInjury" class="form-row">
        <div class="form-field full-width">
          <label>{{ props.t('healthLegal.injuryDescription') || 'Injury/Disability Description' }}</label>
          <textarea 
            v-model="localHealthInfo.injuryDescription" 
            rows="3" 
            :placeholder="props.t('healthLegal.injuryPlaceholder') || 'Please describe the injury, disability, or medical condition...'"
          ></textarea>
        </div>
      </div>
      
      <!-- Legal Section -->
      <div class="section-title" style="margin-top: 24px;">{{ props.t('healthLegal.legalTitle') || 'Legal Information' }}</div>
      
      <div class="form-row">
        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" v-model="localLegalInfo.hasCriminalRecord">
            {{ props.t('healthLegal.hasCriminalRecord') || 'Has any criminal record?' }}
          </label>
        </div>
      </div>
      
      <div v-if="localLegalInfo.hasCriminalRecord" class="form-row">
        <div class="form-field full-width">
          <label>{{ props.t('healthLegal.criminalDescription') || 'Criminal Record Description' }}</label>
          <textarea 
            v-model="localLegalInfo.criminalRecordDescription" 
            rows="3" 
            :placeholder="props.t('healthLegal.criminalPlaceholder') || 'Please describe the criminal record...'"
          ></textarea>
          <small class="field-hint">{{ props.t('healthLegal.confidentialNote') || 'This information is kept confidential' }}</small>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  healthInfo: {
    type: Object,
    default: () => ({ hasPhysicalInjury: false, injuryDescription: '' })
  },
  legalInfo: {
    type: Object,
    default: () => ({ hasCriminalRecord: false, criminalRecordDescription: '' })
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:healthInfo', 'update:legalInfo'])

// Local reactive copies
const localHealthInfo = ref({ ...props.healthInfo })
const localLegalInfo = ref({ ...props.legalInfo })

// Flag to prevent recursive updates
let isUpdating = false

// Watch for changes from parent
watch(() => props.healthInfo, (newVal) => {
  if (!isUpdating) {
    localHealthInfo.value = { ...newVal }
  }
}, { deep: true })

watch(() => props.legalInfo, (newVal) => {
  if (!isUpdating) {
    localLegalInfo.value = { ...newVal }
  }
}, { deep: true })

// Watch local changes and emit to parent
watch(localHealthInfo, (newVal) => {
  isUpdating = true
  emit('update:healthInfo', newVal)
  isUpdating = false
}, { deep: true })

watch(localLegalInfo, (newVal) => {
  isUpdating = true
  emit('update:legalInfo', newVal)
  isUpdating = false
}, { deep: true })
</script>

<style scoped>
.form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e9edf2;
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}

.card-header svg {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.optional-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 20px;
}

.card-body {
  padding: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9edf2;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.form-field textarea {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
  resize: vertical;
}

.form-field textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input {
  width: auto;
  margin: 0;
}

.full-width {
  grid-column: span 2;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>