import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'

// Import translations
import en from './locales/en.json'
import am from './locales/am.json'

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en'

// Create i18n instance
const i18n = createI18n({
  locale: savedLanguage,
  fallbackLocale: 'en',
  messages: { en, am },
  legacy: false,
  globalInjection: true, // Makes $t available globally
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')