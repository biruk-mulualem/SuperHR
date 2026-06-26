<template>
  <div 
    ref="documentWrapper" 
    class="dynamic-document-container"
    @dblclick="toggleEditing"
  >
    <BaseDocumentLayout
      :includeHeader="template?.meta?.includeHeader"
      :includeFooter="template?.meta?.includeFooter"
      :includeBackground="template?.meta?.includeBackground"
    >
      <div 
        class="editable-document-wrapper" 
        :class="{ 'is-editing': isEditing }"
        title="Double-click to toggle editing mode"
      >
        <QuillEditor 
          :key="isEditing ? 'editing' : 'readonly'"
          theme="snow" 
          v-model:content="localContent" 
          contentType="html" 
          :readOnly="!isEditing"
          :toolbar="isEditing ? 'full' : 'none'"
          :placeholder="isEditing && isContentEmpty ? 'ደብዳቤውን እዚህ ላይ ማስተካከል ይችላሉ... (Type your letter content here)' : ''" 
        />
        
        <!-- Inline Save Button -->
        <div v-if="isEditing" class="inline-save-container">
          <button @click.stop="handleSave" class="inline-save-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="save-icon">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            ለውጦችን አስቀምጥ (Save Changes)
          </button>
        </div>
      </div>
    </BaseDocumentLayout>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import BaseDocumentLayout from './BaseDocumentLayout.vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.bubble.css'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  template: {
    type: Object,
    required: true
  },
  employee: {
    type: Object,
    default: () => ({})
  },
  formData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['save'])

const localContent = ref('')
const isEditing = ref(false)
const isManualEdit = ref(false)
const documentWrapper = ref(null)

const isContentEmpty = computed(() => {
  if (!localContent.value) return true
  // Strip HTML tags and check if anything remains
  const stripped = localContent.value.replace(/<[^>]*>/g, '').trim()
  return stripped.length === 0
})

const generateContent = () => {
  let content = props.template?.content || ''
  if (!content) return

  // Helper to get nested properties safely
  const getNestedProp = (obj, path) => {
    if (!obj || !path) return null
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  // Replace employee fields
  content = content.replace(/\{\{\s*employee\.([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    const value = getNestedProp(props.employee, key)
    return value !== undefined && value !== null ? value : '________'
  })
  
  // Replace formData fields
  content = content.replace(/\{\{\s*formData\.([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    const value = getNestedProp(props.formData, key)
    return value !== undefined && value !== null ? value : '________'
  })
  
  localContent.value = content
}

// Apply only formData replacements on top of whatever is currently showing
// so inline edits to the structure are preserved but values update live
const applyFormDataOnly = () => {
  // Start from the template source (not the edited localContent)
  // so values always reflect the latest formData correctly
  generateContent()
}

const toggleEditing = (e) => {
  e.stopPropagation()
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    isManualEdit.value = true
  }
}

const handleSave = () => {
  emit('save', localContent.value)
  disableEditing()
}

const disableEditing = () => {
  isEditing.value = false
}

const handleClickOutside = (event) => {
  if (isEditing.value && documentWrapper.value && !documentWrapper.value.contains(event.target)) {
    disableEditing()
  }
}

// Watch template & employee — only regenerate if user is NOT manually editing
watch([() => props.template, () => props.employee], () => {
  if (!isManualEdit.value) {
    generateContent()
  }
}, { deep: true })

// Watch formData separately — ALWAYS re-render so adjustment values show live
// This re-generates from the original template so values are always accurate
watch(() => props.formData, () => {
  generateContent()
}, { deep: true })

// Reset manual edit if template ID changes (switched to a different letter)
watch(() => props.template?.id, () => {
  isManualEdit.value = false
  generateContent()
})

onMounted(() => {
  generateContent()
  window.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.dynamic-document-container {
  width: 100%;
  height: 100%;
}

.editable-document-wrapper {
  min-height: 500px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  background: transparent !important;
}

.editable-document-wrapper :deep(.ql-editor) {
  font-family: 'Times New Roman', 'Ethiopic', 'Nyala', serif;
  font-size: 14px;
  line-height: 1.8;
  color: #1e293b;
  padding: 0;
  overflow-y: auto !important; /* Enable vertical internal scroll */
  overflow-x: hidden !important; /* Disable horizontal scroll */
  flex: 1;
}

/* Custom Thin Scrollbar */
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar {
  width: 2px;
}
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar-track {
  background: transparent;
}
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar-thumb:hover {
  background: #3b82f6;
}

.editable-document-wrapper :deep(.ql-container) {
  border: none !important;
  height: 902px; /* Precise height for A4 content (1123px - 155px header - 66px footer) */
  display: flex;
  flex-direction: column;
}

/* Show toolbar only when editing */
.editable-document-wrapper:not(.is-editing) :deep(.ql-toolbar) {
  display: none;
}

.editable-document-wrapper.is-editing {
  outline: 2px dashed #3b82f6;
  outline-offset: 10px;
  background: #fff;
  cursor: text;
  padding-bottom: 20px;
}

/* Page Marker for Editor - Updated for exactly 902px content area */
.editable-document-wrapper.is-editing :deep(.ql-editor) {
  background-image: url("data:image/svg+xml,%3Csvg width='800' height='902' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='901' x2='800' y2='901' stroke='%233b82f6' stroke-dasharray='10,10' stroke-width='2'/%3E%3Crect x='300' y='885' width='200' height='30' fill='white'/%3E%3Ctext x='400' y='905' font-family='Nyala, Arial' font-size='12' fill='%233b82f6' text-anchor='middle' font-weight='bold'%3E--------- NEXT PAGE ---------%3C/text%3E%3C/svg%3E");
  background-size: 100% 902px;
  background-repeat: repeat-y;
  background-position: center top;
}

.inline-save-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  pointer-events: none; /* Allow clicking through the container */
}

.inline-save-btn {
  pointer-events: auto; /* Re-enable clicks for the button */
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255,255,255,0.2);
}

.inline-save-btn:hover {
  background: #059669;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 30px rgba(16, 185, 129, 0.5);
}

.save-icon {
  width: 18px;
  height: 18px;
}

.editable-document-wrapper :deep(.ref-date) {
  text-align: right;
  margin-bottom: 30px;
}
.editable-document-wrapper :deep(.letter-address),
.editable-document-wrapper :deep(.letter-subject) {
  margin: 20px 0;
}
.editable-document-wrapper :deep(p) {
  margin-bottom: 14px;
  text-align: justify;
}
.editable-document-wrapper :deep(.signature-section) {
  margin-top: 50px;
  text-align: right;
}
</style>
