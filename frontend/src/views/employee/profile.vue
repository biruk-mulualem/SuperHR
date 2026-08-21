<template>
  <div class="profile-page">
    <!-- ============================================================ -->
    <!-- HEADER SECTION -->
    <!-- ============================================================ -->
    <div class="profile-header">
      <div class="cover-photo">
        <img :src="coverPhoto" alt="Cover">
      </div>
      
      <div class="profile-avatar-section">
        <div class="avatar-wrapper">
          <img :src="userAvatar" class="profile-avatar" alt="Profile">
          <button class="change-avatar-btn" @click="uploadProfilePicture">
            <svg class="camera-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </div>
        <div class="profile-info">
          <h1 class="profile-name">{{ userDisplayName }}</h1>
          <div class="profile-role-wrapper">
            <span class="profile-role">{{ roleTitle }}</span>
          </div>
          <div class="profile-badges">
            <span class="badge">{{ user.employeeCode || 'No Code' }}</span>
            <span class="badge status" :class="user.isActive ? 'active' : 'inactive'">
              {{ user.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="profile-department">
            <span class="dept-icon">🏢</span>
            {{ userDepartment }}
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TABS -->
    <!-- ============================================================ -->
    <div class="profile-content">
      <div class="profile-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.name }}
        </button>
      </div>

      <!-- ============================================================ -->
      <!-- PERSONAL INFORMATION TAB -->
      <!-- ============================================================ -->
      <div v-show="activeTab === 'personal'" class="tab-content">
        <div class="info-grid">
          <!-- Personal Details -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">👤</span>
              <h3 class="card-title">Personal Information</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Full Name</span>
              <span class="info-value">{{ user.fullEmployeeName || user.fullName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Username</span>
              <span class="info-value username">{{ user.username || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employee ID</span>
              <span class="info-value">{{ user.employeeCode || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">First Name</span>
              <span class="info-value">{{ user.firstName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Last Name</span>
              <span class="info-value">{{ user.lastName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Middle Name</span>
              <span class="info-value">{{ user.middleName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date of Birth (EC)</span>
              <span class="info-value">{{ user.dateOfBirthEC || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date of Birth (GC)</span>
              <span class="info-value">{{ formatDate(user.dateOfBirthGC) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Gender</span>
              <span class="info-value capitalize">{{ user.gender || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Marital Status</span>
              <span class="info-value capitalize">{{ user.maritalStatus || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nationality</span>
              <span class="info-value">{{ user.nationality || 'N/A' }}</span>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">📞</span>
              <h3 class="card-title">Contact Information</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user.email || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Work Email</span>
              <span class="info-value">{{ user.workEmail || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Personal Email</span>
              <span class="info-value">{{ user.personalEmail || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone Number</span>
              <span class="info-value">{{ user.phoneNumber || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Emergency Contact</span>
              <span class="info-value">{{ formatEmergencyContact(user.emergencyContact) }}</span>
            </div>
          </div>

          <!-- Address Information -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">📍</span>
              <h3 class="card-title">Address Information</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Current Address</span>
              <span class="info-value">{{ formatAddress(user.currentAddress) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Permanent Address</span>
              <span class="info-value">{{ formatAddress(user.permanentAddress) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Work Location</span>
              <span class="info-value">{{ user.workLocation || 'Main Office' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- EMPLOYMENT TAB -->
      <!-- ============================================================ -->
      <div v-show="activeTab === 'employment'" class="tab-content">
        <div class="info-grid">
          <!-- Employment Details -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">💼</span>
              <h3 class="card-title">Employment Details</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Employee Code</span>
              <span class="info-value">{{ user.employeeCode || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Position ID</span>
              <span class="info-value">{{ user.positionId || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Department</span>
              <span class="info-value">{{ user.departmentName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Department Code</span>
              <span class="info-value">{{ user.departmentCode || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Manager ID</span>
              <span class="info-value">{{ user.managerId || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employment Type</span>
              <span class="info-value capitalize">{{ user.employmentType || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employment Status</span>
              <span class="info-value">
                <span :class="`status-badge status-${user.employmentStatus?.toLowerCase() || 'unknown'}`">
                  {{ user.employmentStatus || 'N/A' }}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Hire Date (EC)</span>
              <span class="info-value">{{ user.hireDateEC || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hire Date (GC)</span>
              <span class="info-value">{{ formatDate(user.hireDateGC) }}</span>
            </div>
          </div>

          <!-- Compensation -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">💰</span>
              <h3 class="card-title">Compensation</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Basic Salary</span>
              <span class="info-value">{{ formatCurrency(user.basicSalary) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bank Account</span>
              <span class="info-value">{{ user.bankAccount || 'N/A' }}</span>
            </div>
          </div>

          <!-- Statistics -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">📊</span>
              <h3 class="card-title">Statistics</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Last Login</span>
              <span class="info-value">{{ formatDateTime(user.lastLogin) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Status</span>
              <span class="info-value">
                <span :class="`status-badge status-${user.isActive ? 'active' : 'inactive'}`">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Years of Service</span>
              <span class="info-value">{{ yearsOfService }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role</span>
              <span class="info-value">{{ roleTitle }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role ID</span>
              <span class="info-value">{{ user.roleId || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- ACCOUNT SETTINGS TAB -->
      <!-- ============================================================ -->
      <div v-show="activeTab === 'settings'" class="tab-content">
        <div class="settings-grid">
          <!-- Change Username -->
          <div class="settings-card">
            <div class="settings-header">
              <span class="settings-icon">👤</span>
              <div>
                <h3 class="settings-title">Change Username</h3>
                <p class="settings-subtitle">Update your username</p>
              </div>
            </div>
            <div class="settings-body">
              <div class="form-group">
                <label>Current Username</label>
                <input type="text" class="form-input" :value="user.username" disabled>
              </div>
              <div class="form-group">
                <label>New Username</label>
                <input type="text" v-model="usernameForm.newUsername" class="form-input" placeholder="Enter new username">
                <span class="hint">Minimum 3 characters, alphanumeric</span>
              </div>
              <div class="form-group">
                <label>Confirm New Username</label>
                <input type="text" v-model="usernameForm.confirmUsername" class="form-input" placeholder="Confirm new username">
              </div>
              <div v-if="usernameError" class="error-message">{{ usernameError }}</div>
              <div v-if="usernameSuccess" class="success-message">{{ usernameSuccess }}</div>
              <button class="settings-btn primary" @click="updateUsername" :disabled="updatingUsername">
                {{ updatingUsername ? 'Updating...' : 'Update Username' }}
              </button>
            </div>
          </div>

          <!-- Change Password -->
          <div class="settings-card">
            <div class="settings-header">
              <span class="settings-icon">🔒</span>
              <div>
                <h3 class="settings-title">Change Password</h3>
                <p class="settings-subtitle">Update your password</p>
              </div>
            </div>
            <div class="settings-body">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" v-model="passwordForm.currentPassword" class="form-input" placeholder="Enter current password">
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" v-model="passwordForm.newPassword" class="form-input" placeholder="Enter new password">
                <span class="hint">Minimum 6 characters</span>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" v-model="passwordForm.confirmPassword" class="form-input" placeholder="Confirm new password">
              </div>
              <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
              <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>
              <button class="settings-btn primary" @click="updatePassword" :disabled="updatingPassword">
                {{ updatingPassword ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TOAST -->
    <!-- ============================================================ -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import userService from '@/stores/users'

const authStore = useAuthStore()
const user = computed(() => authStore.user || {})
const activeTab = ref('personal')
const updatingPassword = ref(false)
const updatingUsername = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const passwordError = ref('')
const passwordSuccess = ref('')
const usernameError = ref('')
const usernameSuccess = ref('')

const tabs = [
  { id: 'personal', name: 'Personal Info', icon: '👤' },
  { id: 'employment', name: 'Employment', icon: '💼' },
  { id: 'settings', name: 'Account Settings', icon: '⚙️' }
]

// ================================================================
// COMPUTED PROPERTIES
// ================================================================

const userDisplayName = computed(() => {
  return user.value.fullEmployeeName || user.value.fullName || 'User'
})

const userAvatar = computed(() => {
  return user.value.profilePicture || user.value.profilePictureUrl || 
         `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(userDisplayName.value)}`
})

const coverPhoto = ref('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop')

const roleTitle = computed(() => {
  const titles = {
    admin: 'System Administrator',
    hr: 'HR Manager',
    finance: 'Finance Officer',
    employee: 'Employee',
    manager: 'Manager',
    supervisor: 'Supervisor',
    store_it: 'Store IT',
    storekeeper: 'Storekeeper'
  }
  return titles[user.value.role] || user.value.role || user.value.roleTitle || 'Employee'
})

const userDepartment = computed(() => {
  return user.value.departmentName || 'No Department Assigned'
})

const yearsOfService = computed(() => {
  if (!user.value.hireDateGC && !user.value.hireDateEC) return 'N/A'
  const hireDate = new Date(user.value.hireDateGC || user.value.hireDateEC)
  if (isNaN(hireDate.getTime())) return 'N/A'
  const today = new Date()
  const years = today.getFullYear() - hireDate.getFullYear()
  const months = today.getMonth() - hireDate.getMonth()
  if (months < 0) {
    return `${years - 1} years`
  }
  return `${years} years`
})

// ================================================================
// FORM STATE
// ================================================================

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const usernameForm = ref({
  newUsername: '',
  confirmUsername: ''
})

// ================================================================
// METHODS
// ================================================================

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (date) => {
  if (!date) return 'Never'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Never'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB'
  }).format(amount)
}

const formatAddress = (address) => {
  if (!address) return 'N/A'
  if (typeof address === 'string') return address
  if (typeof address === 'object') {
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.country) parts.push(address.country)
    if (address.zipCode) parts.push(address.zipCode)
    return parts.length ? parts.join(', ') : 'N/A'
  }
  return 'N/A'
}

const formatEmergencyContact = (contact) => {
  if (!contact) return 'N/A'
  if (typeof contact === 'string') return contact
  if (typeof contact === 'object') {
    const parts = []
    if (contact.name) parts.push(contact.name)
    if (contact.phone) parts.push(contact.phone)
    if (contact.relationship) parts.push(`(${contact.relationship})`)
    return parts.length ? parts.join(' ') : 'N/A'
  }
  return 'N/A'
}

// ================================================================
// PROFILE PICTURE
// ================================================================

const uploadProfilePicture = () => {
  showToastMessage('Profile picture upload feature coming soon', 'info')
}

// ================================================================
// CHANGE USERNAME - INTEGRATED WITH BACKEND
// ================================================================

const updateUsername = async () => {
  usernameError.value = ''
  usernameSuccess.value = ''
  
  // Validation
  if (!usernameForm.value.newUsername || usernameForm.value.newUsername.length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
    return
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(usernameForm.value.newUsername)) {
    usernameError.value = 'Username can only contain letters, numbers, and underscores'
    return
  }
  
  if (usernameForm.value.newUsername !== usernameForm.value.confirmUsername) {
    usernameError.value = 'Usernames do not match'
    return
  }
  
  if (usernameForm.value.newUsername === user.value.username) {
    usernameError.value = 'New username is the same as current'
    return
  }

  updatingUsername.value = true
  try {
    // ✅ Call the API to update username
    const response = await userService.updateUser(authStore.user.userId, {
      username: usernameForm.value.newUsername
    })
    
    if (response.success) {
      usernameSuccess.value = '✅ Username updated successfully!'
      showToastMessage('✅ Username updated successfully!', 'success')
      
      // ✅ Refresh user data
      await authStore.fetchUser()
      
      // Clear form
      setTimeout(() => {
        usernameSuccess.value = ''
        usernameForm.value = { newUsername: '', confirmUsername: '' }
      }, 3000)
    } else {
      usernameError.value = response.error || 'Failed to update username'
    }
  } catch (error) {
    console.error('Error updating username:', error)
    usernameError.value = error.response?.data?.error || 'Failed to update username'
  } finally {
    updatingUsername.value = false
  }
}

// ================================================================
// CHANGE PASSWORD - INTEGRATED WITH BACKEND
// ================================================================

const updatePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  
  // Validation
  if (!passwordForm.value.currentPassword) {
    passwordError.value = 'Please enter your current password'
    return
  }
  
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters'
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }

  updatingPassword.value = true
  try {
    // ✅ Call the API to change password
    const response = await userService.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    )
    
    if (response.success) {
      passwordSuccess.value = '✅ Password updated successfully!'
      showToastMessage('✅ Password updated successfully!', 'success')
      
      // Clear form
      setTimeout(() => {
        passwordSuccess.value = ''
        passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
      }, 3000)
    } else {
      passwordError.value = response.error || 'Failed to update password'
    }
  } catch (error) {
    console.error('Error updating password:', error)
    passwordError.value = error.response?.data?.error || 'Failed to update password'
  } finally {
    updatingPassword.value = false
  }
}

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  // ✅ Fetch user data from backend
  await authStore.fetchUser()
})
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.profile-page {
  min-height: 100vh;
  background: #f0f2f6;
}

/* ================================================================
   HEADER - FIXED COVER AND ROLE VISIBILITY
   ================================================================ */
.profile-header {
  background: white;
  border-radius: 0 0 24px 24px;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.cover-photo {
  position: relative;
  height: 180px;
  overflow: hidden;
}
.cover-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-section {
  display: flex;
  align-items: flex-end;
  padding: 0 32px 20px;
  margin-top: -50px;
  gap: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}
.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.change-avatar-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: #6a11cb;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.change-avatar-btn:hover {
  transform: scale(1.1);
  background: #7c3aed;
}
.camera-icon-small {
  width: 14px;
  height: 14px;
  color: white;
}

.profile-info {
  flex: 1;
  min-width: 200px;
  padding-bottom: 4px;
}
.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px 0;
}

.profile-role-wrapper {
  display: block;
  margin-bottom: 4px;
}
.profile-role {
  font-size: 15px;
  color: #6a11cb;
  font-weight: 600;
  display: inline-block;
  background: #f3e8ff;
  padding: 2px 14px;
  border-radius: 12px;
}

.profile-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: #f1f5f9;
  color: #475569;
}
.badge.status.active {
  background: #dcfce7;
  color: #166534;
}
.badge.status.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.profile-department {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.dept-icon {
  margin-right: 4px;
}

/* ================================================================
   TABS
   ================================================================ */
.profile-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 32px;
}

.profile-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.tab-btn:hover {
  color: #6a11cb;
}
.tab-btn.active {
  color: #6a11cb;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #6a11cb;
}
.tab-icon {
  font-size: 16px;
}

/* ================================================================
   INFO GRID
   ================================================================ */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 16px;
}
.card-icon {
  font-size: 20px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}
.info-value {
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}
.info-value.username {
  color: #2563eb;
  font-family: monospace;
}
.capitalize {
  text-transform: capitalize;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.status-active {
  background: #dcfce7;
  color: #166534;
}
.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}
.status-on-leave {
  background: #fef3c7;
  color: #92400e;
}
.status-terminated {
  background: #fee2e2;
  color: #991b1b;
}
.status-unknown {
  background: #f1f5f9;
  color: #475569;
}

/* ================================================================
   SETTINGS GRID
   ================================================================ */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 24px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 16px;
}
.settings-icon {
  font-size: 28px;
}
.settings-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.settings-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-body .form-group {
  margin-bottom: 0;
}
.settings-body .form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
  display: block;
}
.settings-body .form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  transition: all 0.2s;
}
.settings-body .form-input:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}
.settings-body .form-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
}
.settings-body .hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 8px;
}
.success-message {
  color: #10b981;
  font-size: 13px;
  padding: 8px 12px;
  background: #dcfce7;
  border-radius: 8px;
}

.settings-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}
.settings-btn.primary {
  background: #6a11cb;
  color: white;
}
.settings-btn.primary:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-1px);
}
.settings-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
}
.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }
.toast.info { background: #3b82f6; }

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-10px); }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .profile-avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 16px 16px;
  }
  .profile-name {
    font-size: 20px;
  }
  .profile-role {
    font-size: 14px;
  }
  .profile-badges {
    justify-content: center;
  }
  .profile-department {
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  .info-row {
    flex-direction: column;
    gap: 2px;
  }
  .info-value {
    text-align: left;
    max-width: 100%;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-content {
    padding: 12px 16px;
  }
  .profile-tabs {
    overflow-x: auto;
  }
  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }
  
  .settings-btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .cover-photo {
    height: 120px;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
  }
  .profile-avatar-section {
    margin-top: -40px;
  }
  .profile-role {
    font-size: 13px;
    padding: 1px 10px;
  }
}
</style>