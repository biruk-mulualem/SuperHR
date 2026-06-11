<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
      <h3>{{ props.t('company.title') || 'Current Company Information' }}</h3>
    </div>
    <div class="card-body">
      <!-- Row 1: Company Name, TIN Number, Phone Number -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('company.name') || 'Company Name' }}</label>
          <input 
            type="text" 
            :value="currentCompany.companyName" 
            @input="updateCompany('companyName', $event.target.value)"
            :placeholder="props.t('company.namePlaceholder') || 'Company name'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('company.tin') || 'Company TIN Number' }}</label>
          <input 
            type="text" 
            :value="currentCompany.companyTin" 
            @input="updateCompany('companyTin', $event.target.value)"
            :placeholder="props.t('company.tinPlaceholder') || 'Tax Identification Number'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('company.phone') || 'Company Phone Number' }}</label>
          <input 
            type="tel" 
            :value="currentCompany.companyPhone" 
            @input="updateCompany('companyPhone', $event.target.value)"
            placeholder="+251 911 000 000"
          >
        </div>
      </div>
      
      <!-- Row 2: Company Email, PO Box, Website -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('company.email') || 'Company Email' }}</label>
          <input 
            type="email" 
            :value="currentCompany.companyEmail" 
            @input="updateCompany('companyEmail', $event.target.value)"
            placeholder="info@company.com"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('company.poBox') || 'PO Box' }}</label>
          <input 
            type="text" 
            :value="currentCompany.poBox" 
            @input="updateCompany('poBox', $event.target.value)"
            :placeholder="props.t('company.poBoxPlaceholder') || 'PO Box'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('company.website') || 'Website' }}</label>
          <input 
            type="text" 
            :value="currentCompany.website" 
            @input="updateCompany('website', $event.target.value)"
            placeholder="www.company.com"
          >
        </div>
      </div>
      
      <!-- Row 3: Company Address (full width) -->
      <div class="form-row-full">
        <div class="form-field">
          <label>{{ props.t('company.address') || 'Company Address' }}</label>
          <textarea 
            :value="currentCompany.companyAddress" 
            @input="updateCompany('companyAddress', $event.target.value)"
            rows="3" 
            :placeholder="props.t('company.addressPlaceholder') || 'Company physical address'"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentCompany: {
    type: Object,
    default: () => ({
      companyName: 'SUPER DOUBLE T GENERAL TRADING PLC',
      companyTin: '000360429',
      companyPhone: '0113662218',
      companyEmail: 'supertt2012@gmail.com',
      companyAddress: 'Alemgena',
      poBox: '',
      website: 'rodaspaint.com'
    })
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:currentCompany'])

const updateCompany = (field, value) => {
  const newCompany = { ...props.currentCompany, [field]: value }
  emit('update:currentCompany', newCompany)
}
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

.card-body {
  padding: 20px;
}

/* Three column layout */
.form-row-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

/* Full width row for textarea */
.form-row-full {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
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
.form-field textarea {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.form-field textarea {
  resize: vertical;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row-three {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>