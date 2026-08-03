<template>
  <div>
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="$emit('close-delete-modal')">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('common.deleteEmployee') || 'Delete Employee' }}</h2>
          <button class="close-btn" @click="$emit('close-delete-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" />
            </svg>
            <p>{{ $t('messages.deleteConfirm') || 'Delete' }} <strong>{{ employeeToDelete?.fullName }}</strong>?</p>
            <p class="delete-warning-text">{{ $t('messages.deleteWarning') || 'This action cannot be undone.' }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close-delete-modal')">{{ $t('common.cancel') || 'Cancel' }}</button>
          <button class="btn-delete" @click="$emit('delete-employee')" :disabled="deleting">
            {{ deleting ? ($t('common.deleting') || 'Deleting...') : ($t('common.delete') || 'Delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Terminate Confirmation Modal (NO REASON) -->
    <div v-if="showTerminateModal" class="modal-overlay" @click="$emit('close-terminate-modal')">
      <div class="modal-content terminate-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('common.terminateEmployee') || 'Terminate Employee' }}</h2>
          <button class="close-btn" @click="$emit('close-terminate-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="terminate-warning">
            <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="16" y1="8" x2="8" y2="16" />
            </svg>
            <p class="terminate-title">{{ $t('messages.terminateConfirm') || 'Are you sure you want to terminate' }} <strong>{{ employeeToTerminate?.fullName }}</strong>?</p>
            <div class="terminate-details">
              <p>{{ $t('messages.terminateWarning') || 'This action will:' }}</p>
              <ul>
                <li>{{ $t('messages.terminateStatus') || 'Set status to "Terminated"' }}</li>
                <li>{{ $t('messages.terminateDate') || 'Record termination date' }}</li>
                <li>{{ $t('messages.terminateAccount') || 'Deactivate the account' }}</li>
                <li class="text-danger">{{ $t('messages.terminateIrreversible') || '⚠️ This action cannot be undone!' }}</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close-terminate-modal')">{{ $t('common.cancel') || 'Cancel' }}</button>
          <button class="btn-terminate" @click="$emit('confirm-terminate')" :disabled="terminating">
            {{ terminating ? ($t('common.terminating') || 'Terminating...') : ($t('common.terminate') || 'Terminate') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reactivate Confirmation Modal -->
    <div v-if="showReactivateModal" class="modal-overlay" @click="$emit('close-reactivate-modal')">
      <div class="modal-content reactivate-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('common.reactivateEmployee') || 'Reactivate Employee' }}</h2>
          <button class="close-btn" @click="$emit('close-reactivate-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="reactivate-warning">
            <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <polyline points="12 8 12 12 15 14" />
            </svg>
            <p class="reactivate-title">{{ $t('messages.reactivateConfirm') || 'Reactivate' }} <strong>{{ employeeToReactivate?.fullName }}</strong>?</p>
            <div class="reactivate-details">
              <p>{{ $t('messages.reactivateInfo') || 'This action will:' }}</p>
              <ul>
                <li>{{ $t('messages.reactivateStatus') || 'Set status back to "Active"' }}</li>
                <li>{{ $t('messages.reactivateDate') || 'Clear termination dates' }}</li>
                <li>{{ $t('messages.reactivateAccount') || 'Reactivate the account' }}</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close-reactivate-modal')">{{ $t('common.cancel') || 'Cancel' }}</button>
          <button class="btn-reactivate" @click="$emit('confirm-reactivate')" :disabled="reactivating">
            {{ reactivating ? ($t('common.reactivating') || 'Reactivating...') : ($t('common.reactivate') || 'Reactivate') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Modal -->
    <div v-if="showToastModal" class="modal-overlay toast-modal-overlay" @click="closeToastModal">
      <div class="modal-content toast-modal" @click.stop>
        <div class="modal-header toast-header" :class="toastModalType">
          <h2>{{ toastModalTitle }}</h2>
          <button class="close-btn" @click="closeToastModal">×</button>
        </div>
        <div class="modal-body toast-body">
          <div class="toast-icon-wrapper">
            <svg v-if="toastModalType === 'success'" class="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l3 3 5-6" />
            </svg>
            <svg v-else-if="toastModalType === 'error'" class="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <svg v-else-if="toastModalType === 'warning'" class="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
            <svg v-else class="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <p class="toast-message">{{ toastModalMessage }}</p>
          <button class="toast-action-btn" @click="closeToastModal">
            {{ $t('common.ok') || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  showDeleteModal: Boolean,
  employeeToDelete: Object,
  deleting: Boolean,
  showTerminateModal: Boolean,
  employeeToTerminate: Object,
  terminating: Boolean,
  showReactivateModal: Boolean,
  employeeToReactivate: Object,
  reactivating: Boolean,
  toasts: Array
})

const emit = defineEmits([
  'close-delete-modal', 
  'delete-employee', 
  'remove-toast',
  'close-terminate-modal',
  'confirm-terminate',
  'close-reactivate-modal',
  'confirm-reactivate'
])

// Toast Modal state
const showToastModal = ref(false)
const toastModalMessage = ref('')
const toastModalType = ref('success')
const toastModalTitle = ref('')
let toastTimeout = null

// Watch for toasts and show as modal
watch(() => props.toasts, (newToasts) => {
  if (newToasts && newToasts.length > 0) {
    const latestToast = newToasts[newToasts.length - 1]
    
    showToastModal.value = true
    toastModalMessage.value = latestToast.message
    toastModalType.value = latestToast.type || 'success'
    
    const titles = {
      success: '✅ Success',
      error: '❌ Error',
      warning: '⚠️ Warning',
      info: 'ℹ️ Information'
    }
    toastModalTitle.value = titles[latestToast.type] || 'ℹ️ Information'
    
    if (toastTimeout) {
      clearTimeout(toastTimeout)
    }
    
    toastTimeout = setTimeout(() => {
      closeToastModal()
    }, 4000)
  }
}, { deep: true })

const closeToastModal = () => {
  showToastModal.value = false
  if (toastTimeout) {
    clearTimeout(toastTimeout)
    toastTimeout = null
  }
  if (props.toasts && props.toasts.length > 0) {
    const lastToast = props.toasts[props.toasts.length - 1]
    emit('remove-toast', lastToast.id)
  }
}
</script>

<style scoped>
/* Modal Overlay */
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

.toast-modal-overlay {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
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
  margin: 0;
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
  transition: all 0.2s;
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

/* Toast Modal */
.toast-modal {
  max-width: 420px;
}

.toast-header {
  border-bottom: none;
  padding-bottom: 0;
}

.toast-header.success h2 { color: #10b981; }
.toast-header.error h2 { color: #ef4444; }
.toast-header.warning h2 { color: #f59e0b; }
.toast-header.info h2 { color: #3b82f6; }

.toast-body {
  text-align: center;
  padding: 24px 24px 32px;
}

.toast-icon-wrapper {
  margin-bottom: 16px;
}

.toast-icon {
  width: 64px;
  height: 64px;
}

.toast-icon.success { color: #10b981; stroke-width: 2; }
.toast-icon.error { color: #ef4444; stroke-width: 2; }
.toast-icon.warning { color: #f59e0b; stroke-width: 2; }
.toast-icon.info { color: #3b82f6; stroke-width: 2; }

.toast-message {
  font-size: 16px;
  color: #1e293b;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.toast-action-btn {
  padding: 10px 40px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toast-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 17, 203, 0.3);
}

/* Delete Modal */
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

/* Terminate Modal */
.terminate-warning {
  padding: 4px;
}

.terminate-title {
  font-size: 15px;
  margin-bottom: 16px;
  text-align: center;
}

.terminate-details {
  background: #fef2f2;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #fee2e2;
}

.terminate-details p {
  font-size: 13px;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.terminate-details ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #7f1d1d;
}

.terminate-details ul li {
  margin-bottom: 4px;
}

.text-danger {
  color: #dc2626 !important;
  font-weight: 600 !important;
}

.btn-terminate {
  background: #ef4444;
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-terminate:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-terminate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Reactivate Modal */
.reactivate-warning {
  text-align: center;
  padding: 12px;
}

.success-icon {
  width: 48px;
  height: 48px;
  color: #10b981;
  margin-bottom: 12px;
}

.reactivate-title {
  font-size: 15px;
  margin-bottom: 16px;
}

.reactivate-details {
  background: #f0fdf4;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #dcfce7;
  text-align: left;
}

.reactivate-details p {
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 8px 0;
}

.reactivate-details ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #065f46;
}

.reactivate-details ul li {
  margin-bottom: 4px;
}

.btn-reactivate {
  background: #10b981;
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reactivate:hover:not(:disabled) {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-reactivate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Common Buttons */
.btn-cancel {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-delete {
  background: #ef4444;
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
  }
  .toast-modal {
    max-width: 90%;
  }
  .toast-message {
    font-size: 14px;
  }
}
</style>