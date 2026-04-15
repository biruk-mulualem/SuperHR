<template>
  <div>
    <!-- User Modal (Add/Edit) -->
    <div v-if="showModal" class="modal-overlay" @click="$emit('close-modal')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit User' : 'Add User' }}</h2>
          <button class="close-btn" @click="$emit('close-modal')">×</button>
        </div>
        
        <form @submit.prevent="$emit('save-user')" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" v-model="userForm.fullName" class="form-input" :class="{ error: errors.fullName }">
              <span class="error-text" v-if="errors.fullName">{{ errors.fullName }}</span>
            </div>
            <div class="form-group">
              <label>Username *</label>
              <input type="text" v-model="userForm.username" :disabled="isEditing" class="form-input" :class="{ error: errors.username }">
              <span class="error-text" v-if="errors.username">{{ errors.username }}</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Email *</label>
              <input type="email" v-model="userForm.email" class="form-input" :class="{ error: errors.email }">
              <span class="error-text" v-if="errors.email">{{ errors.email }}</span>
            </div>
            <div class="form-group">
              <label>Role *</label>
              <select v-model="userForm.roleId" class="form-select" :class="{ error: errors.roleId }">
                <option :value="null">Select Role</option>
                <option v-for="role in roles" :key="role.roleId" :value="role.roleId">
                  {{ capitalize(role.name) }}
                </option>
              </select>
              <span class="error-text" v-if="errors.roleId">{{ errors.roleId }}</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Department</label>
              <select v-model="userForm.departmentId" class="form-select">
                <option :value="null">Select Department</option>
                <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
                  {{ dept.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <div class="toggle-switch">
                <label class="switch">
                  <input type="checkbox" v-model="userForm.isActive">
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ userForm.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="!isEditing" class="form-group">
            <label>Password *</label>
            <input type="password" v-model="userForm.password" class="form-input" :class="{ error: errors.password }">
            <span class="error-text" v-if="errors.password">{{ errors.password }}</span>
            <small class="form-hint">Minimum 6 characters</small>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="$emit('close-modal')">Cancel</button>
            <button type="submit" class="btn-save" :disabled="saving">{{ saving ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetModal" class="modal-overlay" @click="$emit('close-reset-modal')">
      <div class="modal-content reset-modal" @click.stop>
        <div class="modal-header">
          <h2>Reset Password</h2>
          <button class="close-btn" @click="$emit('close-reset-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="reset-info">
            <img :src="getAvatarUrl(resetUser?.fullName || 'User')" class="reset-avatar-img">
            <div>
              <h3>{{ resetUser?.fullName }}</h3>
              <p>{{ resetUser?.email }}</p>
            </div>
          </div>
          <div class="form-group">
            <label>New Password *</label>
            <input type="password" v-model="resetPasswordData.newPassword" class="form-input" :class="{ error: errors.resetPassword }">
            <span class="error-text" v-if="errors.resetPassword">{{ errors.resetPassword }}</span>
          </div>
          <div class="form-group">
            <label>Confirm Password *</label>
            <input type="password" v-model="resetPasswordData.confirmPassword" class="form-input" :class="{ error: errors.confirmPassword }">
            <span class="error-text" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close-reset-modal')">Cancel</button>
          <button class="btn-save" @click="$emit('reset-password')" :disabled="resetting">{{ resetting ? 'Resetting...' : 'Reset' }}</button>
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
  showModal: Boolean,
  showResetModal: Boolean,
  isEditing: Boolean,
  userForm: Object,
  resetUser: Object,
  resetPasswordData: Object,
  roles: Array,
  departments: Array,
  errors: Object,
  saving: Boolean,
  resetting: Boolean,
  toasts: Array
})

defineEmits(['close-modal', 'close-reset-modal', 'save-user', 'reset-password', 'remove-toast'])

const capitalize = (value) => {
  if (!value) return ''
  if (value.toLowerCase() === 'hr') return 'HR'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(name)}`
}
</script>

<style scoped>
/* Modals */
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
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.reset-modal { max-width: 400px; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}
.modal-header h2 { font-size: 18px; font-weight: 600; color: #1e293b; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
.close-btn:hover { background: #f1f5f9; color: #ef4444; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #e2e8f0; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: #1e293b; margin-bottom: 4px; }
.form-input, .form-select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; transition: all 0.2s; }
.form-input:focus, .form-select:focus { outline: none; border-color: #6a11cb; box-shadow: 0 0 0 2px rgba(106,17,203,0.1); }
.form-input.error, .form-select.error { border-color: #ef4444; }
.error-text { font-size: 10px; color: #ef4444; margin-top: 4px; display: block; }
.form-hint { font-size: 10px; color: #94a3b8; margin-top: 4px; display: block; }

.toggle-switch { display: flex; align-items: center; gap: 10px; }
.switch { position: relative; display: inline-block; width: 44px; height: 22px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: 0.3s; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; }
input:checked + .slider { background-color: #6a11cb; }
input:checked + .slider:before { transform: translateX(22px); }
.slider.round { border-radius: 22px; }
.slider.round:before { border-radius: 50%; }
.toggle-label { font-size: 13px; font-weight: 500; color: #1e293b; }

.reset-info { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 16px; }
.reset-avatar-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.reset-info h3 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.reset-info p { font-size: 11px; color: #64748b; }

.btn-cancel, .btn-save { padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-cancel { background: white; border: 1px solid #e2e8f0; color: #64748b; }
.btn-cancel:hover { background: #f8fafc; }
.btn-save { background: #6a11cb; border: none; color: white; }
.btn-save:hover:not(:disabled) { background: #7c3aed; transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* Toast */
.toast-container { position: fixed; top: 70px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
.toast { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 240px; animation: slideIn 0.3s ease; }
.toast svg { width: 18px; height: 18px; flex-shrink: 0; }
.toast-success { border-left: 3px solid #10b981; background: #f0fdf4; }
.toast-success svg { color: #10b981; }
.toast-error { border-left: 3px solid #ef4444; background: #fef2f2; }
.toast-error svg { color: #ef4444; }
.toast button { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; margin-left: auto; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

@media (max-width: 768px) {
  .modal-content { max-width: calc(100% - 32px); margin: 0 16px; }
  .form-row { grid-template-columns: 1fr; gap: 0; }
  .toast-container { top: 60px; right: 12px; left: 12px; }
  .toast { width: auto; }
}
</style>