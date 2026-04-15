<template>
  <div>
    <!-- Address -->
    <div class="form-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <h3>Address</h3>
        <span class="optional-badge">Optional</span>
      </div>
      <div class="card-body">
        <div class="form-field">
          <label>Current Address</label>
          <textarea v-model="form.address" rows="3" placeholder="Street, City, State, Zip Code, Country"></textarea>
        </div>
      </div>
    </div>

    <!-- Emergency Contact -->
    <div class="form-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <h3>Emergency Contact</h3>
        <span class="optional-badge">Optional</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-field">
            <label>Contact Name</label>
            <input type="text" v-model="emergency.name" placeholder="Emergency contact name">
          </div>
          <div class="form-field">
            <label>Relationship</label>
            <select v-model="emergency.relationship">
              <option value="">Select relationship</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Child">Child</option>
              <option value="Sibling">Sibling</option>
              <option value="Relative">Relative</option>
              <option value="Friend">Friend</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Phone Number</label>
            <input type="tel" v-model="emergency.phone" placeholder="+251 912 000 000">
          </div>
          <div class="form-field">
            <label>Alternative Phone</label>
            <input type="tel" v-model="emergency.alternatePhone" placeholder="Alternative contact">
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
        <h3>Bank Account</h3>
        <span class="optional-badge">Optional</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-field">
            <label>Bank Name</label>
            <select v-model="bank.bankName">
              <option value="">Select bank</option>
              <option v-for="bankOption in ethiopianBanks" :key="bankOption.code" :value="bankOption.name">
                {{ bankOption.name }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label>Account Number</label>
            <input type="text" v-model="bank.accountNumber" placeholder="1000xxxxxxxx">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Account Holder Name</label>
            <input type="text" v-model="bank.accountHolderName" placeholder="Name on account">
          </div>
          <div class="form-field">
            <label>Branch</label>
            <input type="text" v-model="bank.branch" placeholder="Branch name">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: Object,
  emergency: Object,
  bank: Object,
  ethiopianBanks: Array
})
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
.form-field select,
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
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.form-field textarea {
  resize: vertical;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>