<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 8h10M9 4v4M11 12h8M15 8v4" />
        <path d="M2 2h20v20H2z" />
      </svg>
      <h3>{{ props.t('skills.title') || 'Skills' }}</h3>
    </div>
    <div class="card-body">
      
      <!-- Language Skills -->
      <div class="section-title">
        {{ props.t('skills.languageTitle') || 'Language Skills' }}
        <button type="button" class="btn-add" @click="addLanguage">+ {{ props.t('common.add') || 'Add Language' }}</button>
      </div>
      
      <div v-for="(lang, index) in languageSkills" :key="index" class="language-item">
        <div class="language-row">
          <div class="form-field" style="flex: 2;">
            <select 
              :value="lang.language" 
              @change="updateLanguage(index, 'language', $event.target.value)"
              class="language-select"
            >
              <option value="">{{ props.t('skills.selectLanguage') || 'Select language...' }}</option>
              <optgroup :label="props.t('skills.ethiopianLanguages') || '🇪🇹 Ethiopian Languages'">
                <option value="skills.amharic">{{ props.t('skills.amharic') || 'Amharic' }}</option>
                <option value="skills.oromo">{{ props.t('skills.oromo') || 'Oromo' }}</option>
                <option value="skills.tigrinya">{{ props.t('skills.tigrinya') || 'Tigrinya' }}</option>
                <option value="skills.somali">{{ props.t('skills.somali') || 'Somali' }}</option>
                <option value="skills.sidamo">{{ props.t('skills.sidamo') || 'Sidamo' }}</option>
                <option value="skills.wolaytta">{{ props.t('skills.wolaytta') || 'Wolaytta' }}</option>
                <option value="skills.afar">{{ props.t('skills.afar') || 'Afar' }}</option>
                <option value="skills.hadiyya">{{ props.t('skills.hadiyya') || 'Hadiyya' }}</option>
                <option value="skills.gamo">{{ props.t('skills.gamo') || 'Gamo' }}</option>
                <option value="skills.gurage">{{ props.t('skills.gurage') || 'Gurage' }}</option>
                <option value="skills.kembata">{{ props.t('skills.kembata') || 'Kembata' }}</option>
                <option value="skills.silte">{{ props.t('skills.silte') || "Silt'e" }}</option>
              </optgroup>
              <optgroup :label="props.t('skills.africanLanguages') || '🌍 African Languages'">
                <option value="skills.swahili">{{ props.t('skills.swahili') || 'Swahili' }}</option>
                <option value="skills.hausa">{{ props.t('skills.hausa') || 'Hausa' }}</option>
                <option value="skills.yoruba">{{ props.t('skills.yoruba') || 'Yoruba' }}</option>
                <option value="skills.zulu">{{ props.t('skills.zulu') || 'Zulu' }}</option>
              </optgroup>
              <optgroup :label="props.t('skills.europeanLanguages') || '🌎 European Languages'">
                <option value="skills.english">{{ props.t('skills.english') || 'English' }}</option>
                <option value="skills.french">{{ props.t('skills.french') || 'French' }}</option>
                <option value="skills.spanish">{{ props.t('skills.spanish') || 'Spanish' }}</option>
                <option value="skills.german">{{ props.t('skills.german') || 'German' }}</option>
                <option value="skills.italian">{{ props.t('skills.italian') || 'Italian' }}</option>
                <option value="skills.russian">{{ props.t('skills.russian') || 'Russian' }}</option>
              </optgroup>
              <optgroup :label="props.t('skills.asianLanguages') || '🌏 Asian Languages'">
                <option value="skills.chinese">{{ props.t('skills.chinese') || 'Chinese' }}</option>
                <option value="skills.japanese">{{ props.t('skills.japanese') || 'Japanese' }}</option>
                <option value="skills.korean">{{ props.t('skills.korean') || 'Korean' }}</option>
                <option value="skills.arabic">{{ props.t('skills.arabic') || 'Arabic' }}</option>
                <option value="skills.hindi">{{ props.t('skills.hindi') || 'Hindi' }}</option>
              </optgroup>
              <optgroup :label="props.t('skills.otherLanguages') || 'Other Languages'">
                <option value="skills.others">{{ props.t('skills.others') || 'Others' }}</option>
              </optgroup>
            </select>
          </div>
          <div class="form-field" style="flex: 1.5;">
            <select 
              :value="lang.proficiency" 
              @change="updateLanguage(index, 'proficiency', $event.target.value)"
            >
              <option value="">{{ props.t('skills.selectLevel') || 'Select level' }}</option>
              <option value="skills.basic">{{ props.t('skills.basic') || 'Basic' }}</option>
              <option value="skills.intermediate">{{ props.t('skills.intermediate') || 'Intermediate' }}</option>
              <option value="skills.advanced">{{ props.t('skills.advanced') || 'Advanced' }}</option>
              <option value="skills.fluent">{{ props.t('skills.fluent') || 'Fluent' }}</option>
              <option value="skills.native">{{ props.t('skills.native') || 'Native' }}</option>
            </select>
          </div>
          <button type="button" class="btn-remove-small" @click="removeLanguage(index)">×</button>
        </div>
      </div>
      
      <div v-if="languageSkills.length === 0" class="empty-state-small">
        {{ props.t('skills.noLanguages') || 'No languages added. Click "+ Add Language" to add language skills.' }}
      </div>
      
      <!-- Other Skills -->
      <div class="section-title" style="margin-top: 24px;">
        {{ props.t('skills.otherTitle') || 'Other Skills' }}
      </div>
      
      <div class="form-row">
        <div class="form-field full-width">
          <textarea 
            :value="otherSkills" 
            @input="$emit('update:otherSkills', $event.target.value)"
            rows="4" 
            :placeholder="props.t('skills.otherPlaceholder') || 'List any other skills, certifications, or qualifications...'"
          ></textarea>
          <small class="field-hint">{{ props.t('skills.otherHint') || 'e.g., Project Management, Leadership, Software Proficiency, Microsoft Office, Data Analysis, etc.' }}</small>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  languageSkills: {
    type: Array,
    default: () => []
  },
  otherSkills: {
    type: String,
    default: ''
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:languageSkills', 'update:otherSkills'])

const addLanguage = () => {
  const newLanguages = [...props.languageSkills, {
    language: '',
    proficiency: ''
  }]
  emit('update:languageSkills', newLanguages)
}

const updateLanguage = (index, field, value) => {
  const newLanguages = [...props.languageSkills]
  newLanguages[index] = { ...newLanguages[index], [field]: value }
  emit('update:languageSkills', newLanguages)
}

const removeLanguage = (index) => {
  const newLanguages = [...props.languageSkills]
  newLanguages.splice(index, 1)
  emit('update:languageSkills', newLanguages)
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

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9edf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.language-item {
  margin-bottom: 12px;
}

.language-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.full-width {
  width: 100%;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.btn-add {
  background: #6366f1;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-add:hover {
  background: #4f46e5;
}

.btn-remove-small {
  background: #ef4444;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-small:hover {
  background: #dc2626;
}

.empty-state-small {
  text-align: center;
  padding: 16px;
  color: #94a3b8;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .language-row {
    flex-direction: column;
  }
  .btn-remove-small {
    width: 100%;
  }
}
</style>