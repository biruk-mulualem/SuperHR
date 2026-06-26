<template>
  <div class="document-layout-container">
    <!-- Screen View -->
    <div class="document-screen-view">
      <div class="a4-page">
        <div class="page-header" v-if="includeHeader">
          <img :src="headerImage" alt="Header" class="header-img" />
        </div>
        <div class="page-body" :style="backgroundStyle">
          <div class="page-content">
            <slot></slot>
          </div>
        </div>
        <div class="page-footer" v-if="includeFooter">
          <img :src="footerImage" alt="Footer" class="footer-img" />
        </div>
      </div>
    </div>

    <!-- Print View -->
    <div class="document-print-view">
      <table class="print-table">
        <thead v-if="includeHeader">
          <tr>
            <td>
              <div class="print-header">
                <img :src="headerImage" class="header-img-print" />
              </div>
            </td>
          </tr>
        </thead>
        
        <tbody>
          <tr>
            <td :style="backgroundStyle">
              <div class="print-content">
                <slot></slot>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="includeFooter">
          <tr>
            <td>
              <div class="print-footer">
                <img :src="footerImage" class="footer-img-print" />
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import headerImage from '@/assets/documentHeader.png'
import footerImage from '@/assets/documentFooter.png'
import backgroundImage from '@/assets/documentBody.png'

const props = defineProps({
  includeHeader: {
    type: Boolean,
    default: true
  },
  includeFooter: {
    type: Boolean,
    default: true
  },
  includeBackground: {
    type: Boolean,
    default: false
  }
})

const backgroundStyle = computed(() => {
  if (!props.includeBackground) return {}
  return {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat'
  }
})
</script>

<style scoped>
/* SCREEN STYLES */
.document-layout-container {
  width: 100%;
}

.a4-page {
  width: 210mm;
  min-height: 297mm;
  background-color: white;
  margin: 40px auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}

.page-header {
  width: 100%;
  height: 155px;
  overflow: hidden;
}

.header-img {
  width: 100%;
  height: 155px;
  object-fit: fill;
}

.page-body {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.page-content {
  padding: 20px 80px;
  font-family: 'Times New Roman', 'Ethiopic', 'Nyala', serif;
  line-height: 1.8;
  font-size: 14px;
  color: #1e293b;
  flex: 1;
}

.page-footer {
  width: 100%;
  height: 66px;
  overflow: hidden;
}

.footer-img {
  width: 100%;
  height: 66px;
  object-fit: fill;
}

/* PRINT STYLES */
.document-print-view {
  display: none;
}

@media print {
  @page {
    margin: 0;
    size: A4;
  }

  .document-screen-view {
    display: none !important;
  }

  .document-print-view {
    display: block !important;
    width: 100%;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
  }

  /* Thead and Tfoot content repeats on every page in Chrome/Firefox/Safari */
  .print-header {
    height: 155px;
    width: 100%;
  }

  .header-img-print {
    width: 210mm;
    height: 155px;
    display: block;
    object-fit: fill;
  }

  .print-footer {
    height: 66px;
    width: 100%;
  }

  .footer-img-print {
    width: 210mm;
    height: 66px;
    display: block;
    object-fit: fill;
  }

  .print-content {
    padding: 0 80px;
    font-family: 'Times New Roman', 'Ethiopic', 'Nyala', serif;
    font-size: 14px;
    line-height: 1.8;
    color: #000;
  }
}

@media (max-width: 850px) {
  .a4-page {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    box-shadow: none;
  }
}
</style>
