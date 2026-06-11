<template>
  <div class="document-seamless">
    <!-- Document Header -->
    <div class="document-header" :style="headerStyle"></div>
    
    <!-- Document Body -->
    <div class="document-body">
      <div class="document-paper" :style="bodyStyle">
        <slot></slot>
      </div>
    </div>
    
    <!-- Document Footer -->
    <div class="document-footer" :style="footerStyle"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Try to import images with error handling
let documentHeaderImage = ''
let documentBodyImage = ''
let documentFooterImage = ''

try {
  documentHeaderImage = new URL('@/assets/documentHeader.png', import.meta.url).href
} catch(e) {
  console.warn('documentHeader.png not found')
}

try {
  documentBodyImage = new URL('@/assets/documentBody.png', import.meta.url).href
} catch(e) {
  console.warn('documentBody.png not found')
}

try {
  documentFooterImage = new URL('@/assets/documentFooter.png', import.meta.url).href
} catch(e) {
  console.warn('documentFooter.png not found')
}

const headerStyle = computed(() => ({
  backgroundImage: documentHeaderImage ? `url(${documentHeaderImage})` : 'none',
  backgroundColor: '#f0f0f0'
}))

const bodyStyle = computed(() => ({
  backgroundImage: documentBodyImage ? `url(${documentBodyImage})` : 'none',
  backgroundRepeat: 'repeat-y',
  backgroundPosition: 'center top',
  backgroundSize: 'contain',
  backgroundColor: '#fafafa'
}))

const footerStyle = computed(() => ({
  backgroundImage: documentFooterImage ? `url(${documentFooterImage})` : 'none',
  backgroundColor: '#f0f0f0'
}))
</script>

<style scoped>
.document-seamless {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  background: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.document-header {
  width: 100%;
  min-height: 180px;
  background-repeat: no-repeat;
  background-position: top center;
  background-size: contain;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.document-body {
  width: 100%;
  background: white;
  flex: 1;
}

.document-paper {
  padding: 40px 60px;
  font-family: 'Times New Roman', 'Ethiopic', 'Nyala', serif;
  line-height: 1.8;
  font-size: 14px;
  color: #1e293b;
  max-width: 1000px;
  margin: 0 auto;
  background-repeat: repeat-y;
  background-position: center top;
  background-size: contain;
  background-color: #fafafa;
  min-height: 400px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.document-footer {
  width: 84%;
  margin: 0 auto;
  min-height: 130px;
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: contain;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .document-paper {
    padding: 20px;
  }
  .document-header {
    min-height: 100px;
  }
  .document-footer {
    min-height: 80px;
  }
}

@media print {
  .document-header,
  .document-paper,
  .document-footer {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>