<!-- FILE: src/views/tabs/TaxRulesPage.vue -->
<template>
  <div class="settings-card">
    <div class="card-header">
      <h2>Tax Rules - Employment Income Tax (Schedule A)</h2>
      <button class="btn-save" @click="saveTaxRules" :disabled="savingTaxRules">
        {{ savingTaxRules ? 'Saving...' : 'Save Tax Rules' }}
      </button>
    </div>

    <div class="sub-tabs">
      <button
        v-for="subTab in taxSubTabs"
        :key="subTab.id"
        @click="taxSubTab = subTab.id"
        :class="{ active: taxSubTab === subTab.id }"
      >
        {{ subTab.name }}
      </button>
    </div>

    <div class="rules-container">
      <!-- Tax Brackets -->
      <div v-if="taxSubTab === 'brackets'" class="rule-section">
        <h3>📊 Employment Income Tax Brackets</h3>
        <div class="tax-info-card">
          <p><strong>Formula:</strong> {{ taxRules.employmentTax?.calculationFormula || 'Tax = (Income × Rate ÷ 100) - Deduction' }}</p>
          <p><strong>Rounding:</strong> {{ taxRules.employmentTax?.roundingMethod || 'floor' }}</p>
          <p><strong>Effective From:</strong> {{ taxRules.effectiveFrom || '2024-01-01' }}</p>
          <p><strong>Version:</strong> {{ taxRules.version || '1.0' }}</p>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Min Income (ETB)</th>
                <th>Max Income (ETB)</th>
                <th>Rate (%)</th>
                <th>Deduction (ETB)</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(bracket, index) in taxRules.employmentTax?.brackets" :key="index">
                <td>
                  <input type="number" v-model="bracket.min" class="tax-input" :disabled="index === 0">
                </td>
                <td>
                  <input type="number" v-model="bracket.max" class="tax-input" :disabled="bracket.max === null">
                </td>
                <td>
                  <input type="number" v-model="bracket.rate" class="tax-input" step="1">
                </td>
                <td>
                  <input type="number" v-model="bracket.deduction" class="tax-input" step="0.01">
                </td>
                <td>
                  <input type="text" v-model="bracket.description" class="tax-input">
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pension Rules -->
      <div v-if="taxSubTab === 'pension'" class="rule-section">
        <h3>🏦 Pension Contribution Rules</h3>
        <div class="tax-info-card">
          <p><strong>Legal Reference:</strong> {{ taxRules.legalReference?.pensionProclamation || 'No. 715/2011 as amended by No. 908/2015' }}</p>
        </div>
        <div class="rule-grid">
          <div class="rule-item">
            <label>Employee Contribution Rate (%)</label>
            <input type="number" v-model="taxRules.pension.employeeRate" step="0.5" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Employer Contribution Rate (%)</label>
            <input type="number" v-model="taxRules.pension.employerRate" step="0.5" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Monthly Salary Cap (ETB)</label>
            <input type="number" v-model="taxRules.pension.monthlyCap" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Max Employee Contribution (ETB)</label>
            <input type="number" :value="taxRules.pension.maxEmployeeContribution" class="tax-input" disabled>
            <small class="field-hint">Auto-calculated: {{ taxRules.pension.monthlyCap }} × {{ taxRules.pension.employeeRate }}%</small>
          </div>
          <div class="rule-item">
            <label>Max Employer Contribution (ETB)</label>
            <input type="number" :value="taxRules.pension.maxEmployerContribution" class="tax-input" disabled>
            <small class="field-hint">Auto-calculated: {{ taxRules.pension.monthlyCap }} × {{ taxRules.pension.employerRate }}%</small>
          </div>
          <div class="rule-item">
            <label>Calculation Base</label>
            <select v-model="taxRules.pension.calculationBase" class="tax-input">
              <option value="basic_salary_only">Basic Salary Only</option>
              <option value="gross_salary">Gross Salary</option>
            </select>
          </div>
        </div>
        <div class="info-note">
          <strong>Note:</strong> {{ taxRules.pension.notes }}
        </div>
      </div>

      <!-- Exemptions -->
      <div v-if="taxSubTab === 'exemptions'" class="rule-section">
        <h3>✅ Tax Exemptions (Schedule E)</h3>
        <div class="rule-subsection">
          <h4>🚗 Transport Allowance Exemption</h4>
          <div class="rule-grid">
            <div class="rule-item">
              <label>Is Exempt?</label>
              <select v-model="taxRules.exemptions.transportAllowance.isExempt" class="tax-input">
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </div>
            <div class="rule-item">
              <label>Max Exempt Amount (ETB)</label>
              <input type="number" v-model="taxRules.exemptions.transportAllowance.maxExemptAmount" class="tax-input">
            </div>
            <div class="rule-item">
              <label>Alternative Limit</label>
              <input type="text" :value="taxRules.exemptions.transportAllowance.alternativeLimit" class="tax-input" disabled>
            </div>
            <div class="rule-item">
              <label>Calculation Method</label>
              <input type="text" :value="taxRules.exemptions.transportAllowance.calculationMethod" class="tax-input" disabled>
            </div>
          </div>
        </div>
        <div class="rule-subsection">
          <h4>🏥 Medical Reimbursement</h4>
          <div class="rule-item">
            <label>Is Exempt?</label>
            <select v-model="taxRules.exemptions.medicalReimbursement.isExempt" class="tax-input">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
        </div>
        <div class="rule-subsection">
          <h4>⛰️ Hardship Allowance</h4>
          <div class="rule-item">
            <label>Is Exempt?</label>
            <select v-model="taxRules.exemptions.hardshipAllowance.isExempt" class="tax-input">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
        </div>
        <div class="rule-subsection">
          <h4>✈️ Travel Reimbursement</h4>
          <div class="rule-item">
            <label>Is Exempt?</label>
            <select v-model="taxRules.exemptions.travelReimbursement.isExempt" class="tax-input">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Withholding Tax & VAT -->
      <div v-if="taxSubTab === 'withholding'" class="rule-section">
        <h3>💰 Withholding Tax</h3>
        <div class="rule-grid">
          <div class="rule-item">
            <label>Standard Rate (%)</label>
            <input type="number" v-model="taxRules.withholdingTax.standardRate" step="0.5" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Goods Threshold (ETB)</label>
            <input type="number" v-model="taxRules.withholdingTax.goodsThreshold" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Services Threshold (ETB)</label>
            <input type="number" v-model="taxRules.withholdingTax.servicesThreshold" class="tax-input">
          </div>
          <div class="rule-item">
            <label>No TIN Rate (%)</label>
            <input type="number" v-model="taxRules.withholdingTax.noTinRate" step="0.5" class="tax-input">
          </div>
        </div>
        <h3 style="margin-top: 24px">📋 Applies To</h3>
        <div class="checkbox-group">
          <label v-for="type in ['service_fees', 'dividends', 'royalties', 'interest']" :key="type" class="checkbox-label">
            <input type="checkbox" :value="type" v-model="taxRules.withholdingTax.appliesTo">
            {{ type.replace('_', ' ').toUpperCase() }}
          </label>
        </div>
        <h3 style="margin-top: 24px">💰 VAT & Turnover Tax</h3>
        <div class="rule-grid">
          <div class="rule-item">
            <label>VAT Registration Threshold (ETB)</label>
            <input type="number" v-model="taxRules.vat.registrationThreshold" class="tax-input">
          </div>
          <div class="rule-item">
            <label>VAT Standard Rate (%)</label>
            <input type="number" v-model="taxRules.vat.standardRate" step="0.5" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Turnover Tax - Goods (%)</label>
            <input type="number" v-model="taxRules.turnoverTax.goodsRate" step="0.5" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Turnover Tax - Services Others (%)</label>
            <input type="number" v-model="taxRules.turnoverTax.servicesOthersRate" step="0.5" class="tax-input">
          </div>
        </div>
      </div>

      <!-- Tax Residency -->
      <div v-if="taxSubTab === 'residency'" class="rule-section">
        <h3>🌍 Tax Residency Rules (Foreigners)</h3>
        <div class="rule-grid">
          <div class="rule-item">
            <label>Days Threshold for Residency</label>
            <input type="number" v-model="taxRules.taxResidency.daysThreshold" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Permanent Residence Criteria?</label>
            <select v-model="taxRules.taxResidency.permanentResidenceCriteria" class="tax-input">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
        </div>
        <div class="info-note">
          <strong>Note:</strong> {{ taxRules.taxResidency.description }}
        </div>
        <h3 style="margin-top: 24px">📅 Filing Deadlines</h3>
        <div class="rule-grid">
          <div class="rule-item">
            <label>Tax Remittance Day (of month)</label>
            <input type="number" v-model="taxRules.deadlines.taxRemittanceDay" min="1" max="28" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Pension Remittance Day (of month)</label>
            <input type="number" v-model="taxRules.deadlines.pensionRemittanceDay" min="1" max="28" class="tax-input">
          </div>
        </div>
      </div>

      <!-- Legal Reference -->
      <div v-if="taxSubTab === 'legal'" class="rule-section">
        <h3>⚖️ Legal References</h3>
        <div class="rule-grid">
          <div class="rule-item full-width">
            <label>Income Tax Proclamation</label>
            <input type="text" v-model="taxRules.legalReference.incomeTaxProclamation" class="tax-input">
          </div>
          <div class="rule-item full-width">
            <label>Pension Proclamation</label>
            <input type="text" v-model="taxRules.legalReference.pensionProclamation" class="tax-input">
          </div>
        </div>
        <h3 style="margin-top: 24px">📝 Version Information</h3>
        <div class="rule-grid">
          <div class="rule-item">
            <label>Version</label>
            <input type="text" :value="taxRules.version" class="tax-input" disabled>
          </div>
          <div class="rule-item">
            <label>Effective From</label>
            <input type="date" v-model="taxRules.effectiveFrom" class="tax-input">
          </div>
          <div class="rule-item">
            <label>Last Updated</label>
            <input type="text" :value="formatDate(taxRules.lastUpdated)" class="tax-input" disabled>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, watch } from 'vue'
import settingService from '@/stores/settingService'

const addToast = inject('addToast')

const taxSubTab = ref('brackets')
const savingTaxRules = ref(false)

const taxSubTabs = [
  { id: 'brackets', name: '📊 Tax Brackets' },
  { id: 'pension', name: '🏦 Pension' },
  { id: 'exemptions', name: '✅ Exemptions' },
  { id: 'withholding', name: '💰 Withholding & VAT' },
  { id: 'residency', name: '🌍 Residency & Deadlines' },
  { id: 'legal', name: '⚖️ Legal & Version' }
]

const taxRules = ref({
  version: '1.0',
  effectiveFrom: '2024-01-01',
  lastUpdated: new Date().toISOString(),
  legalReference: {
    incomeTaxProclamation: 'No. 286/2002 as amended',
    pensionProclamation: 'No. 715/2011 as amended by No. 908/2015'
  },
  employmentTax: {
    brackets: [
      { min: 0, max: 2000, rate: 0, deduction: 0, description: 'Exempt' },
      { min: 2001, max: 4000, rate: 15, deduction: 0, description: '15% on amount over 2,000' },
      { min: 4001, max: 7000, rate: 20, deduction: 200, description: '20% minus 200' },
      { min: 7001, max: 10000, rate: 25, deduction: 550, description: '25% minus 550' },
      { min: 10001, max: 14000, rate: 30, deduction: 1050, description: '30% minus 1,050' },
      { min: 14001, max: null, rate: 35, deduction: 1750, description: '35% minus 1,750' }
    ],
    calculationFormula: 'Tax = (Income * Rate / 100) - Deduction',
    roundingMethod: 'floor'
  },
  pension: {
    employeeRate: 7,
    employerRate: 11,
    monthlyCap: 15000,
    maxEmployeeContribution: 1050,
    maxEmployerContribution: 1650,
    calculationBase: 'basic_salary_only',
    notes: 'Any salary above 15,000 ETB is not subject to pension contribution'
  },
  exemptions: {
    transportAllowance: {
      isExempt: true,
      maxExemptAmount: 2200,
      alternativeLimit: '25_percent_of_salary',
      calculationMethod: 'min_of_fixed_or_percentage'
    },
    medicalReimbursement: { isExempt: true },
    hardshipAllowance: { isExempt: true },
    travelReimbursement: { isExempt: true }
  },
  taxResidency: {
    daysThreshold: 183,
    permanentResidenceCriteria: true,
    description: 'Foreigners become tax residents after 183 days or if they have permanent residence'
  },
  withholdingTax: {
    standardRate: 15,
    goodsThreshold: 10000,
    servicesThreshold: 3000,
    noTinRate: 30,
    appliesTo: ['service_fees', 'dividends', 'royalties', 'interest']
  },
  deadlines: {
    taxRemittanceDay: 8,
    pensionRemittanceDay: 10
  },
  vat: {
    registrationThreshold: 1000000,
    standardRate: 15,
    notes: 'Businesses exceeding threshold must register for VAT'
  },
  turnoverTax: {
    goodsRate: 2,
    servicesContractorsRate: 2,
    servicesOthersRate: 10
  }
})

watch(() => [taxRules.value.pension.monthlyCap, taxRules.value.pension.employeeRate, taxRules.value.pension.employerRate], () => {
  taxRules.value.pension.maxEmployeeContribution = Math.floor(taxRules.value.pension.monthlyCap * taxRules.value.pension.employeeRate / 100)
  taxRules.value.pension.maxEmployerContribution = Math.floor(taxRules.value.pension.monthlyCap * taxRules.value.pension.employerRate / 100)
}, { deep: true })

const loadTaxRules = async () => {
  try {
    const response = await settingService.getAttendanceRules()
    if (response.success && response.data && response.data['tax.rules']) {
      taxRules.value = JSON.parse(JSON.stringify(response.data['tax.rules']))
    }
  } catch (error) {
    console.error('Error loading tax rules:', error)
    addToast('Failed to load tax rules', 'error')
  }
}

const saveTaxRules = async () => {
  savingTaxRules.value = true
  try {
    const currentSettings = await settingService.getAttendanceRules()
    const updatedSettings = {
      ...currentSettings.data,
      'tax.rules': taxRules.value
    }
    const response = await settingService.updateAttendanceRules(updatedSettings)
    if (response.success) {
      addToast('Tax rules saved successfully', 'success')
      taxRules.value.lastUpdated = new Date().toISOString()
      taxRules.value.version = (parseInt(taxRules.value.version) + 1).toString()
    } else {
      addToast(response.error || 'Failed to save tax rules', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save tax rules', 'error')
  } finally {
    savingTaxRules.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

onMounted(loadTaxRules)
</script>

<style scoped>
.settings-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}
.btn-save {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #10b981;
  color: white;
}
.btn-save:hover {
  background: #059669;
}
.sub-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.sub-tabs button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}
.sub-tabs button:hover {
  background: #e2e8f0;
  color: #1e293b;
}
.sub-tabs button.active {
  background: #6366f1;
  color: white;
}
.rules-container {
  padding: 20px;
}
.rule-section {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}
.rule-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.rule-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}
.rule-subsection {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}
.rule-subsection:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.rule-subsection h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #10b981;
}
.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.rule-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rule-item.full-width {
  grid-column: 1 / -1;
}
.rule-item label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.rule-item input,
.rule-item select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.data-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
}
.data-table td {
  font-size: 14px;
  color: #334155;
}
.tax-info-card {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.tax-info-card p {
  margin: 6px 0;
  font-size: 13px;
  color: #166534;
}
.tax-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
}
.tax-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
.tax-input:disabled {
  background: #f1f5f9;
  color: #64748b;
}
.info-note {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 20px;
  font-size: 13px;
  color: #92400e;
}
.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  display: block;
}
@media (max-width: 768px) {
  .rule-grid {
    grid-template-columns: 1fr;
  }
  .sub-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
}
</style>