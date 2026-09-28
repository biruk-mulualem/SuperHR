<template>
  <div class="ethiopian-date-selector">
    <div class="selector-group">
      <select 
        v-model="selectedDay"
        @change="emitEthiopianDate"
        :class="{ 'error-input': error }"
        class="date-select"
      >
        <option value="">Day</option>
        <option v-for="day in maxDays" :key="day" :value="day">
          {{ day }}
        </option>
      </select>
      
      <select 
        v-model="selectedMonth"
        @change="onMonthChange"
        :class="{ 'error-input': error }"
        class="date-select"
      >
        <option value="">Month</option>
        <option 
          v-for="month in currentMonths" 
          :key="month.value" 
          :value="month.value"
        >
          {{ month.name }}
        </option>
      </select>
      
      <select 
        v-model="selectedYear"
        @change="emitEthiopianDate"
        :class="{ 'error-input': error }"
        class="date-select"
      >
        <option value="">Year</option>
        <option v-for="year in yearRange" :key="year" :value="year">
          {{ year }}
        </option>
      </select>
    </div>
    
    <div v-if="gregorianHint && !error" class="gregorian-hint">
      <small>📅 {{ gregorianHint }}</small>
    </div>
    <span v-if="error" class="error-text">{{ error }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Kenat from 'kenat'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, default: '' },
  error: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const { locale } = useI18n()
const selectedDay = ref('')
const selectedMonth = ref('')
const selectedYear = ref('')
const gregorianHint = ref('')
const isInternalUpdate = ref(false)

// Ethiopian months with proper names
const ethiopianMonths = {
  en: [
    { value: 1, name: 'Meskerem' },
    { value: 2, name: 'Tikimt' },
    { value: 3, name: 'Hidar' },
    { value: 4, name: 'Tahsas' },
    { value: 5, name: 'Tir' },
    { value: 6, name: 'Yekatit' },
    { value: 7, name: 'Megabit' },
    { value: 8, name: 'Miazia' },
    { value: 9, name: 'Ginbot' },
    { value: 10, name: 'Sene' },
    { value: 11, name: 'Hamle' },
    { value: 12, name: 'Nehase' },
    { value: 13, name: 'Pagume' }
  ],
  am: [
    { value: 1, name: 'መስከረም' },
    { value: 2, name: 'ጥቅምት' },
    { value: 3, name: 'ህዳር' },
    { value: 4, name: 'ታህሳስ' },
    { value: 5, name: 'ጥር' },
    { value: 6, name: 'የካቲት' },
    { value: 7, name: 'መጋቢት' },
    { value: 8, name: 'ሚያዚያ' },
    { value: 9, name: 'ግንቦት' },
    { value: 10, name: 'ሰኔ' },
    { value: 11, name: 'ሐምሌ' },
    { value: 12, name: 'ነሃሴ' },
    { value: 13, name: 'ጳጉሜ' }
  ]
}

const currentMonths = computed(() => {
  return ethiopianMonths[locale.value] || ethiopianMonths.en
})

const yearRange = computed(() => {
  const currentYear = new Kenat().getEthiopian().year
  const years = []
  for (let i = currentYear - 60; i <= currentYear + 18; i++) {
    years.push(i)
  }
  return years
})

const maxDays = computed(() => {
  if (!selectedMonth.value || !selectedYear.value) return 30
  const month = parseInt(selectedMonth.value)
  const year = parseInt(selectedYear.value)
  if (month === 13) {
    return year % 4 === 0 ? 6 : 5
  }
  return 30
})

const onMonthChange = () => {
  if (selectedDay.value && parseInt(selectedDay.value) > maxDays.value) {
    selectedDay.value = ''
  }
  emitEthiopianDate()
}

// ========== FIXED: Emit Ethiopian Date, NOT Gregorian ==========
const emitEthiopianDate = () => {
  if (selectedDay.value && selectedMonth.value && selectedYear.value) {
    const day = selectedDay.value.toString().padStart(2, '0')
    const month = selectedMonth.value.toString().padStart(2, '0')
    const year = selectedYear.value
    
    // Format: DD/MM/YYYY (Ethiopian calendar)
    const ethiopianDate = `${day}/${month}/${year}`
    
    console.log('Emitting Ethiopian date:', ethiopianDate)
    
    isInternalUpdate.value = true
    emit('update:modelValue', ethiopianDate)
    
    // Show Gregorian equivalent as hint only (for reference)
    try {
      const kenat = new Kenat(parseInt(year), parseInt(selectedMonth.value) - 1, parseInt(day))
      const gregorianDate = kenat.toGregorian()
      const gregorianDateStr = gregorianDate.toISOString().split('T')[0]
      const date = new Date(gregorianDateStr)
      gregorianHint.value = `Gregorian equivalent: ${date.toLocaleDateString(locale.value === 'am' ? 'am-ET' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`
    } catch (error) {
      gregorianHint.value = ''
    }
    
    setTimeout(() => {
      isInternalUpdate.value = false
    }, 0)
  } else {
    if (!isInternalUpdate.value) {
      emit('update:modelValue', '')
      gregorianHint.value = ''
    }
  }
}

// Watch for external changes - expects Ethiopian date format "DD/MM/YYYY"
watch(() => props.modelValue, (newValue) => {
  if (!isInternalUpdate.value && newValue) {
    // Check if it's Ethiopian format (contains '/')
    if (newValue.includes('/')) {
      const parts = newValue.split('/')
      if (parts.length === 3) {
        selectedDay.value = parseInt(parts[0])
        selectedMonth.value = parseInt(parts[1])
        selectedYear.value = parseInt(parts[2])
        
        // Show Gregorian hint
        try {
          const kenat = new Kenat(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          const gregorianDate = kenat.toGregorian()
          const gregorianDateStr = gregorianDate.toISOString().split('T')[0]
          const date = new Date(gregorianDateStr)
          gregorianHint.value = `Gregorian equivalent: ${date.toLocaleDateString(locale.value === 'am' ? 'am-ET' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`
        } catch (error) {
          gregorianHint.value = ''
        }
      }
    }
  } else if (!newValue) {
    selectedDay.value = ''
    selectedMonth.value = ''
    selectedYear.value = ''
    gregorianHint.value = ''
  }
}, { immediate: true })
</script>

<style scoped>
.ethiopian-date-selector {
  width: 100%;
}

.selector-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.date-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.date-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.date-select:hover {
  border-color: #cbd5e1;
}

.gregorian-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  padding-left: 4px;
}

.error-input {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

.error-text {
  color: #ef4444;
  font-size: 11px;
  margin-top: 4px;
  display: block;
}
</style>