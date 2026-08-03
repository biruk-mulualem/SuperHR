<template>
  <div class="documents-main">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16v16H4z" />
            <path d="M8 8h8M8 12h6M8 16h4" />
            <path d="M16 4v16" />
          </svg>
        </div>
        <div>
          <h1 class="page-title">Documents & Letters</h1>
          <p class="page-subtitle">Select a document type to generate</p>
        </div>
      </div>
      <div class="header-right">
        <span class="total-count">{{ totalDocuments }} Templates</span>
      </div>
    </div>

    <div class="cards-grid">
      <!-- Type 1 - Standard Guarantee Letter -->
      <div class="doc-card" @click="navigateTo('type1')">
        <div class="card-header-section">
          <div class="card-icon guarantee">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="card-type">Letter</span>
        </div>
        <div class="card-body">
          <h3>Standard Guarantee</h3>
          <p>Verify guarantee authenticity with employee and guarantor details</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Guarantee</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>

      <!-- Type 2 - Employee Verification Letter -->
      <div class="doc-card" @click="navigateTo('type2')">
        <div class="card-header-section">
          <div class="card-icon verification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <span class="card-type">Letter</span>
        </div>
        <div class="card-body">
          <h3>Employee Verification</h3>
          <p>Verify employee current employment status</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Verification</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>

      <!-- Type 3 - Guarantee Re-verification -->
      <div class="doc-card" @click="navigateTo('type3')">
        <div class="card-header-section">
          <div class="card-icon reverification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span class="card-type">Letter</span>
        </div>
        <div class="card-body">
          <h3>Guarantee Re-verification</h3>
          <p>Double-check guarantee authenticity with two-step verification</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Verification</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>

      <!-- Type 4 - Police Station Guarantee -->
      <div class="doc-card" @click="navigateTo('type4')">
        <div class="card-header-section">
          <div class="card-icon police">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
              <circle cx="12" cy="12" r="8" />
            </svg>
          </div>
          <span class="card-type">Letter</span>
        </div>
        <div class="card-body">
          <h3>Police Station Guarantee</h3>
          <p>Guarantee letter for police station verification</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Police</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>

      <!-- Type 5 - Police Re-verification -->
      <div class="doc-card" @click="navigateTo('type5')">
        <div class="card-header-section">
          <div class="card-icon police-re">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2l-5 5m0 0l5 5m-5-5h10" />
            </svg>
          </div>
          <span class="card-type">Letter</span>
        </div>
        <div class="card-body">
          <h3>Police Re-verification</h3>
          <p>Double verification for police station guarantees</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Police</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>

      <!-- Type 6 - Employment Letter -->
      <div class="doc-card" @click="navigateTo('type6')">
        <div class="card-header-section">
          <div class="card-icon employment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <span class="card-type">Letter</span>
        </div>
        <div class="card-body">
          <h3>Employment Letter</h3>
          <p>Confirm employment with salary and position details</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Employment</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>

      <!-- Type 7 - biography Form -->
      <div class="doc-card" @click="navigateTo('type7')">
        <div class="card-header-section">
          <div class="card-icon form">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16v16H4z" />
              <path d="M8 8h8M8 12h6M8 16h4" />
              <path d="M16 4v16" />
            </svg>
          </div>
          <span class="card-type">Form</span>
        </div>
        <div class="card-body">
          <h3>Employee Biography Form</h3>
          <p>Complete Biography form with employee details</p>
        </div>
        <div class="card-footer">
          <span class="card-tag">Form</span>
          <span class="card-action">Generate →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()

const totalDocuments = computed(() => 7)

const navigateTo = (type) => {
  router.push(`/documents-letters/${type}`)
}
</script>

<style scoped>
.documents-main {
  min-height: 100vh;
  background: #f0f4f8;
  padding: 32px 24px;
}

/* ========== HEADER ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.total-count {
  background: white;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* ========== CARDS GRID ========== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.doc-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #eef2ff;
  position: relative;
  overflow: hidden;
}

.doc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.doc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: #c7d2fe;
}

.doc-card:hover::before {
  opacity: 1;
}

/* Card Header Section */
.card-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.card-icon.guarantee { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.card-icon.verification { background: linear-gradient(135deg, #10b981, #059669); }
.card-icon.reverification { background: linear-gradient(135deg, #f59e0b, #d97706); }
.card-icon.police { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.card-icon.police-re { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.card-icon.employment { background: linear-gradient(135deg, #06b6d4, #0891b2); }
.card-icon.form { background: linear-gradient(135deg, #ef4444, #dc2626); }

.card-type {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Card Body */
.card-body {
  margin-bottom: 20px;
}

.card-body h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.card-body p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.card-tag {
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 14px;
  border-radius: 20px;
}

.card-action {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  transition: all 0.3s ease;
}

.doc-card:hover .card-action {
  color: #6366f1;
  transform: translateX(4px);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .documents-main {
    padding: 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .header-left {
    gap: 12px;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .header-icon svg {
    width: 20px;
    height: 20px;
  }
}
</style>