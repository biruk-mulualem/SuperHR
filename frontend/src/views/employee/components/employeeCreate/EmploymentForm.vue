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
      <div class="form-row">
        <div class="form-field">
          <label>Basic Salary (ETB)</label>
          <input type="number" v-model="form.salary" placeholder="0.00">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: Object,
  errors: Object,
  departments: Array,
  positions: Array,
  employees: Array
})
</script>

<style scoped>
.form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e9edf2;
  overflow: hidden;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>