<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
      <h3>Employment Details</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-field">
          <label>Department <span class="required">*</span></label>
          <select v-model="form.departmentId">
            <option :value="null">Select department</option>
            <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
              {{ dept.name }}
            </option>
          </select>
          <span class="error" v-if="errors.departmentId">{{ errors.departmentId }}</span>
        </div>
        <div class="form-field">
          <label>Position <span class="required">*</span></label>
          <select v-model="form.positionId">
            <option :value="null">Select position</option>
            <option v-for="pos in positions" :key="pos.positionId" :value="pos.positionId">
              {{ pos.title }}
            </option>
          </select>
          <span class="error" v-if="errors.positionId">{{ errors.positionId }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Manager</label>
          <select v-model="form.managerId">
            <option :value="null">Select manager</option>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.fullName }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>Work Location</label>
          <input type="text" v-model="form.workLocation" placeholder="Head Office, Addis Ababa">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Employment Type <span class="required">*</span></label>
          <select v-model="form.employmentType">
            <option value="">Select type</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
          <span class="error" v-if="errors.employmentType">{{ errors.employmentType }}</span>
        </div>
        <div class="form-field">
          <label>Hire Date <span class="required">*</span></label>
          <input type="date" v-model="form.hireDate">
          <span class="error" v-if="errors.hireDate">{{ errors.hireDate }}</span>
        </div>
      </div>

      <!-- ========== ALLOWANCES SECTION ========== -->
      <div class="allowances-card">
        <div class="allowances-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div>
            <h4>💰 Compensation & Allowances</h4>
            <p>Basic salary and allowance details (auto-calculates based on salary)</p>
          </div>
        </div>
        
        <div class="allowances-body">
          <div class="salary-field">
            <div class="form-field full-width">
              <label>Basic Salary (ETB) <span class="required">*</span></label>
              <input 
                type="number" 
                v-model="form.basicSalary"
                @input="calculateAllowances"
                placeholder="0.00"
                step="100"
              />
              <small class="field-hint">Monthly basic salary before allowances</small>
            </div>
          </div>
          
          <div class="allowances-grid">
            <div class="form-field">
              <label>Housing Allowance (ETB)</label>
              <input 
                type="number" 
                v-model="form.housingAllowance"
                placeholder="Auto (20%)"
                step="100"
              />
              <small class="field-hint">Typically 20% of basic salary</small>
            </div>
            
            <div class="form-field">
              <label>Position Allowance (ETB)</label>
              <input 
                type="number" 
                v-model="form.positionAllowance"
                placeholder="Auto (15%)"
                step="100"
              />
              <small class="field-hint">Typically 15% of basic salary</small>
            </div>
            
            <div class="form-field">
              <label>Transport Allowance (ETB)</label>
              <input 
                type="number" 
                v-model="form.transportAllowance"
                placeholder="Auto (10%)"
                step="100"
              />
              <small class="field-hint">Typically 10% of basic salary</small>
            </div>
          </div>
          
          <!-- Allowance Summary -->
          <div class="allowance-summary" v-if="totalAllowances > 0 || basicSalaryAmount > 0">
            <div class="summary-title">Summary</div>
            <div class="summary-row">
              <span>Basic Salary:</span>
              <strong>{{ formatCurrency(basicSalaryAmount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Housing Allowance:</span>
              <strong>{{ formatCurrency(housingAllowanceAmount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Position Allowance:</span>
              <strong>{{ formatCurrency(positionAllowanceAmount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Transport Allowance:</span>
              <strong>{{ formatCurrency(transportAllowanceAmount) }}</strong>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
              <span>Total Allowances:</span>
              <strong>{{ formatCurrency(totalAllowances) }}</strong>
            </div>
            <div class="summary-row gross">
              <span>Gross Monthly Pay:</span>
              <strong>{{ formatCurrency(grossPay) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  departments: {
    type: Array,
    default: () => []
  },
  positions: {
    type: Array,
    default: () => []
  },
  employees: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:form', 'calculate'])

// Computed properties for allowance calculations
const basicSalaryAmount = computed(() => parseFloat(props.form.basicSalary) || 0)
const housingAllowanceAmount = computed(() => parseFloat(props.form.housingAllowance) || 0)
const positionAllowanceAmount = computed(() => parseFloat(props.form.positionAllowance) || 0)
const transportAllowanceAmount = computed(() => parseFloat(props.form.transportAllowance) || 0)
const totalAllowances = computed(() => housingAllowanceAmount.value + positionAllowanceAmount.value + transportAllowanceAmount.value)
const grossPay = computed(() => basicSalaryAmount.value + totalAllowances.value)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

const calculateAllowances = () => {
  emit('calculate')
}
</script>

<style scoped>
.form-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #eef2ff;
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #eef2ff;
}

.card-header svg {
  width: 20px;
  height: 20px;
  color: #6366f1;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
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

.required {
  color: #ef4444;
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

.error {
  font-size: 11px;
  color: #ef4444;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ========== ALLOWANCES SECTION STYLES ========== */
.allowances-card {
  margin-top: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #eef2ff;
  overflow: hidden;
}

.allowances-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-bottom: 1px solid #bbf7d0;
}

.allowances-header svg {
  width: 24px;
  height: 24px;
  color: #10b981;
  flex-shrink: 0;
  margin-top: 2px;
}

.allowances-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 4px 0;
}

.allowances-header p {
  font-size: 11px;
  color: #047857;
  margin: 0;
}

.allowances-body {
  padding: 20px;
}

.salary-field {
  margin-bottom: 20px;
}

.full-width {
  width: 100%;
}

.allowances-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

/* Allowance Summary */
.allowance-summary {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  margin-top: 8px;
}

.summary-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  color: #475569;
}

.summary-row strong {
  font-weight: 600;
  color: #1e293b;
}

.summary-row.total {
  font-weight: 600;
  color: #1e293b;
}

.summary-row.total strong {
  color: #1e293b;
  font-size: 14px;
}

.summary-row.gross {
  font-weight: 700;
  color: #10b981;
  font-size: 14px;
}

.summary-row.gross strong {
  color: #059669;
  font-size: 16px;
}

.summary-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .allowances-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .allowances-header {
    padding: 12px 16px;
  }
  
  .allowances-body {
    padding: 16px;
  }
}
</style>