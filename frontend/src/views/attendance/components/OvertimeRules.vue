<template>
  <div class="config-card">
    <div class="card-header">
      <div class="header-left">
        <span class="header-icon">⏰</span>
        <div class="header-info">
          <h3>Overtime Rules</h3>
          <p class="header-subtitle">Configure overtime pay rates for different day types</p>
        </div>
      </div>
      <button class="btn-save-small" @click="saveData" :disabled="saving">
        <span class="btn-icon">💾</span> {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
    
    <div class="card-body">
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading overtime rates...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Try Again</button>
      </div>
      
      <div v-else class="rates-container">
        <div class="form-grid">
          <div class="rate-card weekday">
            <div class="rate-header">
              <span class="rate-icon">📅</span>
              <div class="rate-info">
                <h4>Weekday</h4>
                <p>Monday to Friday</p>
              </div>
            </div>
            <div class="rate-input-wrapper">
              <input 
                type="number" 
                step="0.1" 
                v-model="rates.weekday" 
                class="rate-input"
                min="0"
              />
              <span class="rate-unit">x</span>
            </div>
            <div class="rate-example">
              Base pay × {{ rates.weekday }}
            </div>
          </div>

          <div class="rate-card weekend">
            <div class="rate-header">
              <span class="rate-icon">🎉</span>
              <div class="rate-info">
                <h4>Weekend</h4>
                <p>Saturday & Sunday</p>
              </div>
            </div>
            <div class="rate-input-wrapper">
              <input 
                type="number" 
                step="0.1" 
                v-model="rates.weekend" 
                class="rate-input"
                min="0"
              />
              <span class="rate-unit">x</span>
            </div>
            <div class="rate-example">
              Base pay × {{ rates.weekend }}
            </div>
          </div>

          <div class="rate-card holiday">
            <div class="rate-header">
              <span class="rate-icon">🎊</span>
              <div class="rate-info">
                <h4>Holiday</h4>
                <p>Public & Company Holidays</p>
              </div>
            </div>
            <div class="rate-input-wrapper">
              <input 
                type="number" 
                step="0.1" 
                v-model="rates.holiday" 
                class="rate-input"
                min="0"
              />
              <span class="rate-unit">x</span>
            </div>
            <div class="rate-example">
              Base pay × {{ rates.holiday }}
            </div>
          </div>
        </div>

        <div class="info-banner">
          <span class="info-icon">ℹ️</span>
          <div class="info-content">
            <strong>How overtime rates work:</strong>
            <p>Overtime rate multiplies the employee's hourly wage. For example, a rate of 1.5x means time-and-a-half pay.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import attendanceService from '@/stores/attendanceService'

const rates = ref({ weekday: 1.5, weekend: 2.0, holiday: 2.5 })
const loading = ref(false)
const saving = ref(false)
const error = ref(null)

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await attendanceService.getOvertimeRates()
    if (data && data.length) {
      const weekday = data.find(r => r.dayType === 'weekday')
      const weekend = data.find(r => r.dayType === 'weekend')
      const holiday = data.find(r => r.dayType === 'holiday')
      
      rates.value = {
        weekday: weekday?.rate || 1.5,
        weekend: weekend?.rate || 2.0,
        holiday: holiday?.rate || 2.5
      }
    }
  } catch (err) {
    error.value = 'Failed to load overtime rates'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const saveData = async () => {
  saving.value = true
  error.value = null
  try {
    await attendanceService.updateOvertimeRate(1, { dayType: 'weekday', rate: rates.value.weekday })
    await attendanceService.updateOvertimeRate(2, { dayType: 'weekend', rate: rates.value.weekend })
    await attendanceService.updateOvertimeRate(3, { dayType: 'holiday', rate: rates.value.holiday })
    
    // Show success message
    const successMsg = document.createElement('div')
    successMsg.className = 'success-toast'
    successMsg.innerHTML = '✓ Overtime rates saved successfully'
    document.body.appendChild(successMsg)
    setTimeout(() => successMsg.remove(), 3000)
  } catch (err) {
    error.value = 'Failed to save overtime rates'
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.config-card {
  background: white;
  border-radius: 20px;
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}

.config-card:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 28px;
}

.header-info h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.header-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.btn-save-small {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-save-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245,158,11,0.3);
  background: linear-gradient(135deg, #f59e0b, #ea580c);
}

.btn-save-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 14px;
}

.card-body {
  padding: 24px;
}

.rates-container {
  max-width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.rate-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.rate-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.rate-card.weekday::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.rate-card.weekend::before {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.rate-card.holiday::before {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.rate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15);
}

.rate-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.rate-icon {
  font-size: 32px;
}

.rate-info h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.rate-info p {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.rate-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
}

.rate-input {
  width: 100px;
  padding: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  background: white;
  transition: all 0.2s;
}

.rate-input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.rate-unit {
  font-size: 20px;
  font-weight: 700;
  color: #64748b;
}

.rate-example {
  text-align: center;
  font-size: 12px;
  color: #64748b;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #64748b;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.error-state {
  text-align: center;
  padding: 60px;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 12px;
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  background: #f59e0b;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.info-banner {
  background: #fef3c7;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.info-icon {
  font-size: 20px;
}

.info-content strong {
  display: block;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 4px;
}

.info-content p {
  font-size: 12px;
  color: #78350f;
  margin: 0;
}

.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #10b981;
  color: white;
  padding: 12px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .rate-input {
    width: 80px;
    font-size: 20px;
  }
  
  .rate-icon {
    font-size: 24px;
  }
  
  .rate-info h4 {
    font-size: 14px;
  }
}
</style>