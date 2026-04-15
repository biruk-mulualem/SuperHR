<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <h3>Profile Picture</h3>
      <span class="optional-badge">Optional</span>
    </div>
    <div class="card-body">
      <div class="profile-upload" @click="triggerProfileInput">
        <div class="profile-preview" v-if="profilePreview">
          <img :src="profilePreview" alt="Profile preview">
          <div class="profile-overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
        </div>
        <div v-else class="profile-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Click to upload photo</span>
          <small>JPG, PNG (Max 2MB)</small>
        </div>
      </div>
      <input type="file" ref="profileInput" @change="handleProfileUpload" accept="image/jpeg,image/png" style="display: none">
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  profileFile: Object,
  profilePreview: String
})

const emit = defineEmits(['update:profileFile', 'update:profilePreview', 'file-selected'])

const profileInput = ref(null)

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

const validateFileType = (file, allowedTypes, typeName) => {
  if (!allowedTypes.includes(file.type)) {
    emit('file-selected', `Invalid file type for ${typeName}. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`, 'error')
    return false
  }
  return true
}

const validateFileSize = (file, maxSizeMB, typeName) => {
  if (file.size > maxSizeMB * 1024 * 1024) {
    emit('file-selected', `${typeName} size must be less than ${maxSizeMB}MB`, 'error')
    return false
  }
  return true
}

const triggerProfileInput = () => {
  profileInput.value?.click()
}

const handleProfileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES, 'Profile picture')) {
      event.target.value = ''
      return
    }
    if (!validateFileSize(file, 2, 'Profile picture')) {
      event.target.value = ''
      return
    }
    emit('update:profileFile', file)
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('update:profilePreview', e.target.result)
    }
    reader.readAsDataURL(file)
    emit('file-selected', `Profile picture "${file.name}" selected`, 'success')
  }
}
</script>

<style scoped>
.form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e9edf2;
  overflow: hidden;
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

.optional-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 20px;
}

.card-body {
  padding: 20px;
}

.profile-upload {
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.profile-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e2e8f0;
  transition: all 0.2s;
}

.profile-preview:hover .profile-overlay {
  opacity: 1;
}

.profile-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.profile-overlay svg {
  width: 24px;
  height: 24px;
  color: white;
}

.profile-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.profile-placeholder:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.profile-placeholder svg {
  width: 32px;
  height: 32px;
  color: #94a3b8;
}

.profile-placeholder span {
  font-size: 11px;
  color: #64748b;
}

.profile-placeholder small {
  font-size: 9px;
  color: #94a3b8;
}
</style>