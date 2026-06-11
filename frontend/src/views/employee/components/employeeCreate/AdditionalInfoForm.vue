<template>
  <div>
    <!-- Emergency Contact -->
    <div class="form-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <h3>{{ t('family.emergencyContact') || 'Emergency Contact' }}</h3>
        <span class="optional-badge">{{ t('common.optional') || 'Optional' }}</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('family.contactName') || 'Contact Name' }}</label>
            <input 
              type="text" 
              :value="emergency?.name" 
              @input="$emit('update:emergency', { ...emergency, name: $event.target.value })"
              :placeholder="t('family.contactNamePlaceholder') || 'Emergency contact name'"
            >
          </div>
          <div class="form-field">
            <label>{{ t('family.relationship') || 'Relationship' }}</label>
            <select 
              :value="emergency?.relationship" 
              @change="$emit('update:emergency', { ...emergency, relationship: $event.target.value })"
            >
              <option value="">{{ t('common.select') || 'Select relationship' }}</option>
              <option value="Spouse">{{ t('family.spouse') || 'Spouse' }}</option>
              <option value="Parent">{{ t('family.parent') || 'Parent' }}</option>
              <option value="Child">{{ t('family.child') || 'Child' }}</option>
              <option value="Sibling">{{ t('family.sibling') || 'Sibling' }}</option>
              <option value="Relative">{{ t('family.relative') || 'Relative' }}</option>
              <option value="Friend">{{ t('family.friend') || 'Friend' }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('family.phoneNumber') || 'Phone Number' }}</label>
            <input 
              type="tel" 
              :value="emergency?.phone" 
              @input="$emit('update:emergency', { ...emergency, phone: $event.target.value })"
              placeholder="+251 912 000 000"
            >
          </div>
          <div class="form-field">
            <label>{{ t('family.alternatePhone') || 'Alternative Phone' }}</label>
            <input 
              type="tel" 
              :value="emergency?.alternatePhone" 
              @input="$emit('update:emergency', { ...emergency, alternatePhone: $event.target.value })"
              :placeholder="t('family.alternatePhonePlaceholder') || 'Alternative contact'"
            >
          </div>
        </div>
        
        <!-- Emergency Contact Address Section -->
        <div class="address-section">
          <div class="section-subtitle">{{ t('family.emergencyAddress') || 'Emergency Contact Address' }}</div>
          <div class="form-row">
            <div class="form-field">
              <label>{{ t('address.city') || 'City' }}</label>
              <input 
                type="text" 
                :value="emergencyAddress?.city" 
                @input="$emit('update:emergencyAddress', { ...emergencyAddress, city: $event.target.value })"
                :placeholder="t('address.city') || 'City'"
              >
            </div>
            <div class="form-field">
              <label>{{ t('address.subcity') || 'Subcity' }}</label>
              <input 
                type="text" 
                :value="emergencyAddress?.subcity" 
                @input="$emit('update:emergencyAddress', { ...emergencyAddress, subcity: $event.target.value })"
                :placeholder="t('address.subcity') || 'Subcity'"
              >
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>{{ t('address.district') || 'District' }}</label>
              <input 
                type="text" 
                :value="emergencyAddress?.district" 
                @input="$emit('update:emergencyAddress', { ...emergencyAddress, district: $event.target.value })"
                :placeholder="t('address.district') || 'District'"
              >
            </div>
            <div class="form-field">
              <label>{{ t('address.kebele') || 'Kebele' }}</label>
              <input 
                type="text" 
                :value="emergencyAddress?.kebele" 
                @input="$emit('update:emergencyAddress', { ...emergencyAddress, kebele: $event.target.value })"
                :placeholder="t('address.kebele') || 'Kebele'"
              >
            </div>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Bank Account -->
    <div class="form-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
        <h3>{{ t('bank.title') || 'Bank Account' }}</h3>
        <span class="optional-badge">{{ t('common.optional') || 'Optional' }}</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('bank.bankName') || 'Bank Name' }}</label>
            <select 
              :value="bank?.bankName" 
              @change="$emit('update:bank', { ...bank, bankName: $event.target.value })"
            >
              <option value="">{{ t('common.selectBank') || 'Select bank' }}</option>
              <option v-for="bankOption in ethiopianBanks" :key="bankOption.code" :value="bankOption.name">
                {{ bankOption.name }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ t('bank.accountNumber') || 'Account Number' }}</label>
            <input 
              type="text" 
              :value="bank?.accountNumber" 
              @input="$emit('update:bank', { ...bank, accountNumber: $event.target.value })"
              placeholder="1000xxxxxxxx"
            >
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('bank.accountHolderName') || 'Account Holder Name' }}</label>
            <input 
              type="text" 
              :value="bank?.accountHolderName" 
              @input="$emit('update:bank', { ...bank, accountHolderName: $event.target.value })"
              :placeholder="t('bank.accountHolderPlaceholder') || 'Name on account'"
            >
          </div>
          <div class="form-field">
            <label>{{ t('bank.branch') || 'Branch' }}</label>
            <input 
              type="text" 
              :value="bank?.branch" 
              @input="$emit('update:bank', { ...bank, branch: $event.target.value })"
              :placeholder="t('bank.branchPlaceholder') || 'Branch name'"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  emergency: {
    type: Object,
    default: () => ({ name: '', relationship: '', phone: '', alternatePhone: '' })
  },
  emergencyAddress: {
    type: Object,
    default: () => ({ city: '', subcity: '', district: '', kebele: '' })
  },
  bank: {
    type: Object,
    default: () => ({ bankName: '', accountNumber: '', accountHolderName: '', branch: '' })
  },
  ethiopianBanks: {
    type: Array,
    default: () => []
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:emergency', 'update:emergencyAddress', 'update:bank'])
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
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

.form-field input,
.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.address-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9edf2;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>