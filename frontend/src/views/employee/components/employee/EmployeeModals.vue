<template>
  <div>
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="$emit('close-delete-modal')">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h2>Delete Employee</h2>
          <button class="close-btn" @click="$emit('close-delete-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" />
            </svg>
            <p>Delete <strong>{{ employeeToDelete?.fullName }}</strong>?</p>
            <p class="delete-warning-text">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close-delete-modal')">Cancel</button>
          <button class="btn-delete" @click="$emit('delete-employee')" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="`toast toast-${toast.type}`">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
        <span>{{ toast.message }}</span>
        <button @click="$emit('remove-toast', toast.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showDeleteModal: Boolean,
  employeeToDelete: Object,
  deleting: Boolean,
  toasts: Array
})

defineEmits(['close-delete-modal', 'delete-employee', 'remove-toast'])
</script>

<style scoped>
/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.delete-warning {
  text-align: center;
  padding: 12px;
}

.warning-icon {
  width: 48px;
  height: 48px;
  color: #f59e0b;
  margin-bottom: 12px;
}

.delete-warning-text {
  font-size: 12px;
  color: #64748b;
}

.btn-cancel,
.btn-delete {
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-delete {
  background: #ef4444;
  border: none;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast */
.toast-container {
  position: fixed;
  top: 70px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 240px;
  animation: slideIn 0.3s ease;
}

.toast svg {
  width: 18px;
  height: 18px;
}

.toast-success {
  border-left: 3px solid #10b981;
  background: #f0fdf4;
}

.toast-success svg {
  color: #10b981;
}

.toast-error {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

.toast-error svg {
  color: #ef4444;
}

.toast button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  margin-left: auto;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .toast-container {
    top: 60px;
    right: 12px;
    left: 12px;
  }
  .toast {
    width: auto;
  }
}
</style>