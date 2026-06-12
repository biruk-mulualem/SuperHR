<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container" :class="`type-${type}`">
      <div class="modal-header">
        <div class="header-icon">
          <svg v-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3>{{ title }}</h3>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')" :disabled="loading">
          {{ cancelText }}
        </button>
        <button class="btn-confirm" @click="$emit('confirm')" :disabled="loading">
          {{ loading ? 'Processing...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  type: { type: String, default: 'primary' }, // primary, danger, warning
  loading: Boolean
})

defineEmits(['close', 'confirm'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 24px 24px 12px;
  text-align: center;
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.type-primary .header-icon { background: #eef2ff; color: #6366f1; }
.type-danger .header-icon { background: #fee2e2; color: #ef4444; }
.type-warning .header-icon { background: #fffbeb; color: #f59e0b; }

.header-icon svg { width: 28px; height: 28px; }

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.modal-body {
  padding: 0 24px 24px;
  text-align: center;
}

.modal-body p {
  margin: 0;
  font-size: 15px;
  color: #64748b;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-cancel, .btn-confirm {
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover { background: #e2e8f0; }

.btn-confirm {
  color: white;
}

.type-primary .btn-confirm { background: #6366f1; }
.type-primary .btn-confirm:hover { background: #4f46e5; }

.type-danger .btn-confirm { background: #ef4444; }
.type-danger .btn-confirm:hover { background: #dc2626; }

.type-warning .btn-confirm { background: #f59e0b; }
.type-warning .btn-confirm:hover { background: #d97706; }

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
