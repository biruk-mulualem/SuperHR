<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <h3>Basic Information</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-field">
          <label>First Name <span class="required">*</span></label>
          <input type="text" v-model="form.firstName" placeholder="First name">
          <span class="error" v-if="errors.firstName">{{ errors.firstName }}</span>
        </div>
        <div class="form-field">
          <label>Last Name <span class="required">*</span></label>
          <input type="text" v-model="form.lastName" placeholder="Last name">
          <span class="error" v-if="errors.lastName">{{ errors.lastName }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Middle Name</label>
          <input type="text" v-model="form.middleName" placeholder="Middle name">
        </div>
        <div class="form-field">
          <label>Date of Birth</label>
          <input type="date" v-model="form.dob">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Gender</label>
          <select v-model="form.gender">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div class="form-field">
          <label>Marital Status</label>
          <select v-model="form.maritalStatus">
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Nationality</label>
          <select v-model="form.nationality">
            <option value="">Select nationality</option>
            <option v-for="country in countries" :key="country.code" :value="country.name">
              {{ country.name }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>Email <span class="required">*</span></label>
          <input type="email" v-model="form.email" placeholder="employee@company.com">
          <span class="error" v-if="errors.email">{{ errors.email }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Personal Email</label>
          <input type="email" v-model="form.personalEmail" placeholder="personal@email.com">
        </div>
        <div class="form-field">
          <label>Phone Number <span class="required">*</span></label>
          <input type="tel" v-model="form.phone" placeholder="+251 911 000 000">
          <span class="error" v-if="errors.phone">{{ errors.phone }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  form: Object,
  errors: Object,
  countries: Array
})

const emit = defineEmits(['update:form'])
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