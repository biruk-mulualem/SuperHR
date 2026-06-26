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
        :style="editorCssVars"
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

const contentHeight = computed(() => {
  // A4 Height = 1123px, Header ~ 155px, Footer ~ 66px
  return props.template?.meta?.includeFooter ? 902 : 968
})

const editorCssVars = computed(() => {
  const height = contentHeight.value;
  
  const vars = {
    '--page-content-height': `${height}px`
  };

  if (!isEditing.value) return vars;
  
  const maxPages = 30; // 30 pages limit for editing
  const totalHeight = height * maxPages;
  
  let svgLines = '';
  for (let i = 1; i < maxPages; i++) {
    const yPos = height * i;
    svgLines += `
      <line x1='0' y1='${yPos}' x2='800' y2='${yPos}' stroke='#3b82f6' stroke-dasharray='10,10' stroke-width='2'/>
      <rect x='300' y='${yPos - 15}' width='200' height='30' fill='white'/>
      <text x='400' y='${yPos + 4}' font-family='Nyala, Arial' font-size='12' fill='#3b82f6' text-anchor='middle' font-weight='bold'>--------- ገጽ (PAGE) ${i + 1} ---------</text>
    `;
  }
  
  const svg = `<svg width='800' height='${totalHeight}' xmlns='http://www.w3.org/2000/svg'>${svgLines}</svg>`;
  // Safely encode to data URI format
  const encodedSvg = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  
  vars['--page-bg-image'] = encodedSvg;
  vars['--page-bg-size'] = `100% ${totalHeight}px`;
  
  return vars;
})

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
  if (!isEditing.value) {
    // Entering edit mode: Load the raw template so {{ }} tags are preserved!
    isEditing.value = true
    isManualEdit.value = true
    localContent.value = props.template?.content || ''
  } else {
    // Cancelling edit mode
    disableEditing()
  }
}

const handleSave = () => {
  // Emits the raw template with {{ }} intact
  emit('save', localContent.value)
  disableEditing()
}

const disableEditing = () => {
  isEditing.value = false
  isManualEdit.value = false
  // Re-render the compiled version to show actual data
  generateContent()
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

// Watch formData separately
watch(() => props.formData, () => {
  if (!isManualEdit.value) {
    generateContent()
  }
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
  margin: 0 -80px; /* Pull container to the absolute edge of the page */
}

.editable-document-wrapper :deep(.ql-editor) {
  font-family: 'Times New Roman', 'Ethiopic', 'Nyala', serif;
  font-size: 14px;
  line-height: 1.8;
  color: #1e293b;
  padding: 0 80px; /* Restore the text padding so it aligns perfectly */
  overflow-y: auto !important; /* Enable vertical internal scroll */
  overflow-x: hidden !important; /* Disable horizontal scroll */
  flex: 1;
}

/* Custom Modern Scrollbar */
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar {
  width: 8px; /* Much wider and easier to click */
}
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar-track {
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
}
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.editable-document-wrapper :deep(.ql-editor)::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.editable-document-wrapper :deep(.ql-container) {
  border: none !important;
  height: var(--page-content-height, 902px); /* Dynamic height based on footer */
  display: flex;
  flex-direction: column;
}

/* Show toolbar only when editing */
.editable-document-wrapper:not(.is-editing) :deep(.ql-toolbar) {
  display: none;
}

.editable-document-wrapper.is-editing {
  outline: 2px dashed #3b82f6;
  outline-offset: -2px; /* Bring the outline inward so it doesn't bleed outside the A4 page */
  background: #fff;
  cursor: text;
  padding-bottom: 20px;
}

/* Page Marker for Editor - Updated for dynamic pages */
.editable-document-wrapper.is-editing :deep(.ql-editor) {
  background-image: var(--page-bg-image);
  background-size: var(--page-bg-size);
  background-repeat: no-repeat;
  background-position: center top;
  background-attachment: local; /* Essential for marker to scroll exactly with text */
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

@media print {
  .editable-document-wrapper {
    min-height: auto !important;
    padding-bottom: 0 !important;
  }
  
  .editable-document-wrapper :deep(.ql-container) {
    height: auto !important;
    overflow: visible !important;
    display: block !important;
  }

  .editable-document-wrapper :deep(.ql-editor) {
    overflow: visible !important;
    height: auto !important;
    background-image: none !important; /* Hide dashed page markers in actual print */
  }
}
</style>
