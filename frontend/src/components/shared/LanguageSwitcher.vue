<template>
  <div class="language-switcher">
    <button 
      @click="setLanguage('en')" 
      class="lang-btn"
      :class="{ active: currentLanguage === 'en' }"
    >
      🇬🇧 English
    </button>
    <button 
      @click="setLanguage('am')" 
      class="lang-btn"
      :class="{ active: currentLanguage === 'am' }"
    >
      🇪🇹 አማርኛ
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLanguage = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLanguage.value = lang
  localStorage.setItem('language', lang)
  // Optional: reload page to refresh all components
  // window.location.reload()
}

onMounted(() => {
  currentLanguage.value = localStorage.getItem('language') || 'en'
  locale.value = currentLanguage.value
})
</script>

<style scoped>
.language-switcher {
  display: flex;
  gap: 8px;
  align-items: center;
}

.lang-btn {
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #e2e8f0;
}

.lang-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
</style>