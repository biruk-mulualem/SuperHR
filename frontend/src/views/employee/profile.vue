<template>
  <div class="profile-page">
    <!-- Header Section with Cover Photo -->
    <div class="profile-header">
      <div class="cover-photo">
        <img :src="coverPhoto" alt="Cover">
        <button class="change-cover-btn" @click="uploadCoverPhoto">
          <svg class="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span>Change Cover</span>
        </button>
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
          <p class="profile-role">{{ roleTitle }}</p>
          <p class="profile-department">{{ userDepartment }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content Tabs -->
    <div class="profile-content">
      <div class="profile-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="tab-icon" />
          {{ tab.name }}
        </button>
      </div>

      <!-- Personal Information Tab -->
      <div v-show="activeTab === 'personal'" class="tab-content">
        <div class="info-grid">
          <div class="info-card">
            <h3 class="card-title">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Basic Information
            </h3>
            <div class="info-row">
              <span class="info-label">Full Name:</span>
              <span class="info-value">{{ user.fullEmployeeName || user.fullName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employee ID:</span>
              <span class="info-value">{{ user.employeeCode || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date of Birth:</span>
              <span class="info-value">{{ formatDate(user.dateOfBirth) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Gender:</span>
              <span class="info-value capitalize">{{ user.gender || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Marital Status:</span>
              <span class="info-value capitalize">{{ user.maritalStatus || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nationality:</span>
              <span class="info-value">{{ user.nationality || 'N/A' }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3 class="card-title">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Contact Information
            </h3>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">{{ user.email || user.workEmail || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Work Email:</span>
              <span class="info-value">{{ user.workEmail || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Personal Email:</span>
              <span class="info-value">{{ user.personalEmail || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">{{ user.phoneNumber || 'N/A' }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3 class="card-title">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Address Information
            </h3>
            <div class="info-row">
              <span class="info-label">Current Address:</span>
              <span class="info-value">{{ formatAddress(user.currentAddress) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Permanent Address:</span>
              <span class="info-value">{{ formatAddress(user.permanentAddress) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Employment Tab -->
      <div v-show="activeTab === 'employment'" class="tab-content">
        <div class="info-grid">
          <div class="info-card">
            <h3 class="card-title">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Employment Details
            </h3>
            <div class="info-row">
              <span class="info-label">Employee Code:</span>
              <span class="info-value">{{ user.employeeCode || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Position:</span>
              <span class="info-value">{{ user.positionId || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Department:</span>
              <span class="info-value">{{ user.departmentName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employment Type:</span>
              <span class="info-value capitalize">{{ user.employmentType || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employment Status:</span>
              <span class="info-value capitalize">
                <span :class="`status-badge status-${user.employmentStatus}`">
                  {{ user.employmentStatus || 'N/A' }}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Hire Date:</span>
              <span class="info-value">{{ formatDate(user.hireDate) }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3 class="card-title">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Work Location
            </h3>
            <div class="info-row">
              <span class="info-label">Work Location:</span>
              <span class="info-value">{{ user.workLocation || 'Main Office' }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3 class="card-title">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Compensation
            </h3>
            <div class="info-row">
              <span class="info-label">Basic Salary:</span>
              <span class="info-value">{{ formatCurrency(user.basicSalary) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bank Account:</span>
              <span class="info-value">{{ formatBankAccount(user.bankAccount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Tab -->
      <div v-show="activeTab === 'stats'" class="tab-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon attendance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Attendance Rate</h3>
              <p class="stat-number">96%</p>
              <span class="stat-trend positive">+2% from last month</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon leaves">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Leave Balance</h3>
              <p class="stat-number">15 days</p>
              <span class="stat-trend">Annual leave remaining</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon performance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20V10M18 20V4M6 20v-4"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Performance Rating</h3>
              <p class="stat-number">4.5/5</p>
              <span class="stat-trend positive">Excellent</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon tenure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Years of Service</h3>
              <p class="stat-number">{{ yearsOfService }}</p>
              <span class="stat-trend">With company</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Profile</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" v-model="editForm.phoneNumber" class="form-input">
          </div>
          <div class="form-group">
            <label>Personal Email</label>
            <input type="email" v-model="editForm.personalEmail" class="form-input">
          </div>
          <div class="form-group">
            <label>Current Address</label>
            <textarea v-model="editForm.currentAddress" class="form-textarea" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button class="btn-save" @click="saveProfile">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user || {})
const activeTab = ref('personal')
const showEditModal = ref(false)

const tabs = [
  { id: 'personal', name: 'Personal Info', icon: 'UserIcon' },
  { id: 'employment', name: 'Employment', icon: 'BriefcaseIcon' },
  { id: 'stats', name: 'Statistics', icon: 'ChartBarIcon' }
]

// Computed properties
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
    employee: 'Employee'
  }
  return titles[user.value.role] || user.value.role || 'Employee'
})

const userDepartment = computed(() => {
  return user.value.departmentName || 'No Department Assigned'
})

const yearsOfService = computed(() => {
  if (!user.value.hireDate) return 'N/A'
  const hireDate = new Date(user.value.hireDate)
  const today = new Date()
  const years = today.getFullYear() - hireDate.getFullYear()
  return `${years} years`
})

const editForm = ref({
  phoneNumber: '',
  personalEmail: '',
  currentAddress: ''
})

// Methods
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
  if (!address || typeof address !== 'object') return 'N/A'
  const parts = []
  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.country) parts.push(address.country)
  return parts.length ? parts.join(', ') : 'N/A'
}

const formatBankAccount = (account) => {
  if (!account || typeof account !== 'object') return 'N/A'
  return account.bankName ? `${account.bankName} - ${account.accountNumber || 'N/A'}` : 'N/A'
}

const uploadProfilePicture = () => {
  // Implement profile picture upload
  alert('Profile picture upload feature coming soon')
}

const uploadCoverPhoto = () => {
  // Implement cover photo upload
  alert('Cover photo upload feature coming soon')
}

const openEditModal = () => {
  editForm.value = {
    phoneNumber: user.value.phoneNumber || '',
    personalEmail: user.value.personalEmail || '',
    currentAddress: typeof user.value.currentAddress === 'object' 
      ? JSON.stringify(user.value.currentAddress, null, 2) 
      : user.value.currentAddress || ''
  }
  showEditModal.value = true
}

const closeModal = () => {
  showEditModal.value = false
}

const saveProfile = async () => {
  // Implement save profile
  alert('Save profile feature coming soon')
  closeModal()
}

onMounted(() => {
  // Fetch latest user data if needed
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fb;
}

/* Profile Header */
.profile-header {
  background: white;
  border-radius: 0 0 24px 24px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cover-photo {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.cover-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-cover-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.change-cover-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.profile-avatar-section {
  display: flex;
  align-items: flex-end;
  padding: 0 32px 24px;
  margin-top: -60px;
  gap: 24px;
}

.avatar-wrapper {
  position: relative;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.change-avatar-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #6a11cb;
  border: none;
  width: 32px;
  height: 32px;
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
  width: 16px;
  height: 16px;
  color: white;
}

.profile-info {
  margin-bottom: 12px;
}

.profile-name {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.profile-role {
  font-size: 16px;
  color: #6a11cb;
  font-weight: 600;
  margin-bottom: 4px;
}

.profile-department {
  font-size: 14px;
  color: #64748b;
}

/* Tabs */
.profile-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px;
}

.profile-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 32px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: none;
  border: none;
  font-size: 15px;
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
  width: 20px;
  height: 20px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.info-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.card-icon {
  width: 22px;
  height: 22px;
  color: #6a11cb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #64748b;
  font-size: 14px;
}

.info-value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

.capitalize {
  text-transform: capitalize;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #10b98120;
  color: #10b981;
}

.status-inactive {
  background: #ef444420;
  color: #ef4444;
}

.status-on-leave {
  background: #f59e0b20;
  color: #f59e0b;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 30px;
  height: 30px;
  color: white;
}

.stat-icon.attendance { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.leaves { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.performance { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-icon.tenure { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.stat-info h3 {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  color: #64748b;
}

.stat-trend.positive {
  color: #10b981;
}

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
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ef4444;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-save {
  background: #6a11cb;
  border: none;
  color: white;
}

.btn-save:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .profile-avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-content {
    padding: 16px;
  }
  
  .profile-name {
    font-size: 24px;
  }
  
  .info-row {
    flex-direction: column;
    gap: 4px;
  }
  
  .info-value {
    text-align: left;
  }
}
</style>