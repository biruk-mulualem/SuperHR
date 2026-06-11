<template>
  <div class="employee-edit">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading employee information...</p>
    </div>

    <div v-else-if="employee" class="detail-wrapper">
      <!-- Header Actions -->
      <div class="action-bar">
        <router-link to="/employees" class="action-btn">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to List
        </router-link>
        <div class="action-buttons">
          <button @click="cancelEdit" class="action-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Cancel
          </button>
          <button
            @click="saveEmployee"
            class="action-btn primary"
            :disabled="saving"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
              />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {{ saving ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </div>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-left">
          <div class="employee-avatar-large" @click="triggerProfileInput">
            <img
              :src="
                profilePreview ||
                employee.profilePictureUrl ||
                getAvatarUrl(employee.fullName)
              "
              :alt="employee.fullName"
              @error="handleImageError"
            />
            <div class="avatar-overlay">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </div>
          <input
            type="file"
            ref="profileInput"
            @change="handleProfileUpload"
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            style="display: none"
          />
          <div class="employee-basic">
            <div class="edit-name-container">
              <input
                type="text"
                v-model="form.firstName"
                placeholder="First Name"
                class="name-input"
                title="First Name"
              />
              <input
                type="text"
                v-model="form.middleName"
                placeholder="Middle Name"
                class="name-input"
                title="Middle Name"
              />
              <input
                type="text"
                v-model="form.lastName"
                placeholder="Last Name"
                class="name-input"
                title="Last Name"
              />
            </div>
            <div class="employee-tags">
              <span class="tag">{{ getPositionName }}</span>
              <span class="tag">{{ getDepartmentName }}</span>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <div class="employee-code">
            <span class="code-label">Employee ID</span>
            <strong class="code-value">{{ employee.employeeId }}</strong>
          </div>
          <select
            v-model="form.status"
            class="status-select"
            :class="form.status"
          >
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-label">Department</span
            ><span class="stat-number">{{ getDepartmentName }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-label">Hire Date</span
            ><span class="stat-number">{{ formatDate(form.hireDate) }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-label">Employment Type</span
            ><span class="stat-number">{{
              getEmploymentTypeLabel(form.employmentType)
            }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 8c-3.31 0-6 2.69-6 6 0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6 0-3.31-2.69-6-6-6z"
              />
              <path d="M12 2v2M22 12h-2M4 12H2M12 22v2" />
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-label">Basic Salary</span
            ><span class="stat-number">{{
              form.basicSalary
                ? `ETB ${Number(form.basicSalary).toLocaleString()}`
                : "—"
            }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Personal Info Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Personal Information</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Full Name</span
                ><span class="info-value">{{ employee.fullName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Work Email</span>
                <div class="info-value">
                  <input
                    type="email"
                    v-model="form.email"
                    placeholder="work@company.com"
                    title="Work Email"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Personal Email</span>
                <div class="info-value">
                  <input
                    type="email"
                    v-model="form.personalEmail"
                    placeholder="personal@email.com"
                    title="Personal Email"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Phone Number</span>
                <div class="info-value">
                  <input
                    type="tel"
                    v-model="form.phone"
                    placeholder="+251 9XX XXX XXX"
                    title="Phone Number"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Date of Birth</span>
                <div class="info-value">
                  <input type="date" v-model="form.dob" title="Date of Birth" />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Gender</span>
                <div class="info-value">
                  <select v-model="form.gender" title="Gender">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Marital Status</span>
                <div class="info-value">
                  <select v-model="form.maritalStatus" title="Marital Status">
                    <option value="">Select Marital Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Nationality</span>
                <div class="info-value">
                  <select v-model="form.nationality" title="Nationality">
                    <option value="">Select Nationality</option>
                    <option value="Ethiopian">Ethiopian</option>
                    <option value="American">American</option>
                    <option value="British">British</option>
                    <option value="Canadian">Canadian</option>
                    <option value="Australian">Australian</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                    <option value="Italian">Italian</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">National ID (FAN)</span>
                <div class="info-value">
                  <div style="display: flex; gap: 8px; align-items: center">
                    <input
                      type="text"
                      v-model="form.nationalId"
                      placeholder="Enter National ID Number"
                      title="National ID Number"
                      style="flex: 2"
                    />
                    <button
                      type="button"
                      class="upload-small-btn"
                      @click="triggerNationalIdUpload"
                      title="Upload National ID Document"
                    >
                      {{ nationalIdFile ? "Change File" : "Upload Document" }}
                    </button>
                    <a
                      v-if="getDocumentUrl('national_id')"
                      :href="getDocumentUrl('national_id')"
                      target="_blank"
                      class="file-link-inline"
                      >📄 View</a
                    >
                  </div>
                  <input
                    type="file"
                    ref="nationalIdInput"
                    @change="handleNationalIdSelect"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style="display: none"
                  />
                  <small v-if="nationalIdFile" class="field-hint success"
                    >File selected: {{ nationalIdFile.name }}</small
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Birth Place Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>Birth Place</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Region/State</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.birthPlace.region"
                    placeholder="e.g., Addis Ababa, Oromia"
                    title="Birth Region"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">City/Town</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.birthPlace.city"
                    placeholder="e.g., Addis Ababa"
                    title="Birth City"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Subcity</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.birthPlace.subcity"
                    placeholder="e.g., Bole, Kirkos"
                    title="Birth Subcity"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">District/Woreda</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.birthPlace.district"
                    placeholder="e.g., Woreda 03"
                    title="Birth District"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Current Company Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Current Company</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Company Name</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentCompany.companyName"
                    placeholder="Company Name"
                    title="Company Name"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">TIN Number</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentCompany.companyTin"
                    placeholder="Tax Identification Number"
                    title="TIN Number"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Company Phone</span>
                <div class="info-value">
                  <input
                    type="tel"
                    v-model="form.currentCompany.companyPhone"
                    placeholder="Company Phone"
                    title="Company Phone"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Company Email</span>
                <div class="info-value">
                  <input
                    type="email"
                    v-model="form.currentCompany.companyEmail"
                    placeholder="company@email.com"
                    title="Company Email"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Company Address</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentCompany.companyAddress"
                    placeholder="Street Address"
                    title="Company Address"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">PO Box</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentCompany.poBox"
                    placeholder="PO Box Number"
                    title="PO Box"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Website</span>
                <div class="info-value">
                  <input
                    type="url"
                    v-model="form.currentCompany.website"
                    placeholder="https://www.company.com"
                    title="Company Website"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Current Address Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z"
                  />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>Current Address</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Region/State</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentAddress.region"
                    placeholder="e.g., Addis Ababa"
                    title="Region"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Subcity</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentAddress.subcity"
                    placeholder="e.g., Bole"
                    title="Subcity"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Kebele</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentAddress.kebele"
                    placeholder="Kebele Number"
                    title="Kebele"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">District/Woreda</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentAddress.district"
                    placeholder="District Name"
                    title="District"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">PO Box</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentAddress.poBox"
                    placeholder="PO Box Number"
                    title="PO Box"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">House Number</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.currentAddress.houseNumber"
                    placeholder="House/Apartment Number"
                    title="House Number"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Permanent Address Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z"
                  />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>Permanent Address</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Region/State</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.permanentAddress.region"
                    placeholder="e.g., Addis Ababa"
                    title="Region"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Subcity</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.permanentAddress.subcity"
                    placeholder="e.g., Bole"
                    title="Subcity"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Kebele</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.permanentAddress.kebele"
                    placeholder="Kebele Number"
                    title="Kebele"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">District/Woreda</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.permanentAddress.district"
                    placeholder="District Name"
                    title="District"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">PO Box</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.permanentAddress.poBox"
                    placeholder="PO Box Number"
                    title="PO Box"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">House Number</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.permanentAddress.houseNumber"
                    placeholder="House/Apartment Number"
                    title="House Number"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Emergency Contact Card -->
          <div class="info-card emergency-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3>Emergency Contact</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Contact Name</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.emergencyContact.name"
                    placeholder="Full Name of Emergency Contact"
                    title="Emergency Contact Name"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Relationship</span>
                <div class="info-value">
                  <select
                    v-model="form.emergencyContact.relationship"
                    title="Relationship"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Phone Number</span>
                <div class="info-value">
                  <input
                    type="tel"
                    v-model="form.emergencyContact.phone"
                    placeholder="Primary Contact Number"
                    title="Emergency Phone"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Alternate Phone</span>
                <div class="info-value">
                  <input
                    type="tel"
                    v-model="form.emergencyContact.alternatePhone"
                    placeholder="Secondary Contact Number"
                    title="Alternate Phone"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Emergency Contact Address Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z"
                  />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>Emergency Contact Address</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">City/Town</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.emergencyContactAddress.city"
                    placeholder="City Name"
                    title="City"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Subcity</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.emergencyContactAddress.subcity"
                    placeholder="Subcity Name"
                    title="Subcity"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">District/Woreda</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.emergencyContactAddress.district"
                    placeholder="District Name"
                    title="District"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Kebele</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.emergencyContactAddress.kebele"
                    placeholder="Kebele Number"
                    title="Kebele"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Education Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M22 10v6M2 10l10-5 10-5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3>Education ({{ form.education.length }})</h3>
            </div>
            <div class="education-list-edit">
              <div
                v-for="(edu, idx) in form.education"
                :key="idx"
                class="education-edit-item"
              >
                <div class="edit-header">
                  <strong>Education {{ idx + 1 }}</strong
                  ><button class="remove-btn" @click="removeEducation(idx)">
                    Remove
                  </button>
                </div>
                <div class="edit-fields">
                  <select v-model="edu.level" title="Education Level">
                    <option value="">Select Level</option>
                    <option value="primary">Primary School</option>
                    <option value="secondary">Secondary School</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="phd">PhD/Doctorate</option>
                    <option value="certificate">Certificate</option>
                  </select>
                  <input
                    type="text"
                    v-model="edu.institutionName"
                    placeholder="Institution/University Name"
                    title="Institution Name"
                  />
                  <input
                    type="text"
                    v-model="edu.institutionAddress"
                    placeholder="Institution Address"
                    title="Institution Address"
                  />
                  <div class="date-group">
                    <input
                      type="date"
                      v-model="edu.startDate"
                      placeholder="Start Date"
                      title="Start Date"
                    /><input
                      type="date"
                      v-model="edu.endDate"
                      placeholder="End Date"
                      title="End Date"
                    />
                  </div>
                  <label
                    ><input type="checkbox" v-model="edu.isCurrent" /> Currently
                    Studying</label
                  >
                </div>
                <div class="edit-actions">
                  <button
                    class="upload-small-btn"
                    @click="triggerEducationUpload(idx)"
                    title="Upload Certificate"
                  >
                    📄 Upload Certificate
                  </button>
                </div>
              </div>
              <button class="add-btn" @click="addEducation">
                + Add Education
              </button>
            </div>
          </div>

          <!-- Training Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Training ({{ form.training.length }})</h3>
            </div>
            <div class="training-list-edit">
              <div
                v-for="(train, idx) in form.training"
                :key="idx"
                class="training-edit-item"
              >
                <div class="edit-header">
                  <strong>Training {{ idx + 1 }}</strong
                  ><button class="remove-btn" @click="removeTraining(idx)">
                    Remove
                  </button>
                </div>
                <div class="edit-fields">
                  <input
                    type="text"
                    v-model="train.trainingName"
                    placeholder="Training/Course Name"
                    title="Training Name"
                  />
                  <input
                    type="text"
                    v-model="train.institutionName"
                    placeholder="Training Institution"
                    title="Institution Name"
                  />
                  <input
                    type="text"
                    v-model="train.institutionAddress"
                    placeholder="Institution Address"
                    title="Institution Address"
                  />
                  <div class="date-group">
                    <input
                      type="date"
                      v-model="train.startDate"
                      placeholder="Start Date"
                      title="Start Date"
                    /><input
                      type="date"
                      v-model="train.endDate"
                      placeholder="End Date"
                      title="End Date"
                    />
                  </div>
                </div>
                <div class="edit-actions">
                  <button
                    class="upload-small-btn"
                    @click="triggerTrainingUpload(idx)"
                    title="Upload Certificate"
                  >
                    📄 Upload Certificate
                  </button>
                </div>
              </div>
              <button class="add-btn" @click="addTraining">
                + Add Training
              </button>
            </div>
          </div>

          <!-- Bank Account Card -->
          <div class="info-card bank-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                  />
                </svg>
              </div>
              <h3>Bank Account</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Bank Name</span>
                <div class="info-value">
                  <select v-model="form.bankAccount.bankName" title="Bank Name">
                    <option value="">Select Bank</option>
                    <option value="Commercial Bank of Ethiopia">
                      Commercial Bank of Ethiopia (CBE)
                    </option>
                    <option value="Awash Bank">Awash Bank</option>
                    <option value="Dashen Bank">Dashen Bank</option>
                    <option value="United Bank">United Bank</option>
                    <option value="Nib International Bank">
                      Nib International Bank
                    </option>
                    <option value="Hibret Bank">Hibret Bank</option>
                    <option value="Wegagen Bank">Wegagen Bank</option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Account Number</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.bankAccount.accountNumber"
                    placeholder="Bank Account Number"
                    title="Account Number"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Account Holder Name</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.bankAccount.accountHolderName"
                    placeholder="Full Name as on Account"
                    title="Account Holder Name"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Branch</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.bankAccount.branch"
                    placeholder="Bank Branch Name/Location"
                    title="Branch"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Nationality Acquisition Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 21h18M3 10h18M5 6h14M8 3l-2 3h12l-2-3" />
                </svg>
              </div>
              <h3>Nationality Acquisition</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Acquisition Type</span>
                <div class="info-value">
                  <select
                    v-model="form.nationalityAcquisition.type"
                    title="Acquisition Type"
                  >
                    <option value="by_birth">By Birth (Natural Born)</option>
                    <option value="by_law">By Law (Naturalization)</option>
                    <option value="ethiopian_birth">Ethiopian by Birth</option>
                  </select>
                </div>
              </div>
              <div
                class="info-item"
                v-if="form.nationalityAcquisition.type === 'by_law'"
              >
                <span class="info-label">Naturalization Certificate</span>
                <div class="info-value">
                  <div style="display: flex; gap: 8px">
                    <button
                      type="button"
                      class="upload-small-btn"
                      @click="triggerNaturalizationUpload"
                      title="Upload Naturalization Certificate"
                    >
                      {{
                        nationalityDocFile
                          ? "Change File"
                          : "Upload Certificate"
                      }}
                    </button>
                    <a
                      v-if="getDocumentUrl('naturalization_certificate')"
                      :href="getDocumentUrl('naturalization_certificate')"
                      target="_blank"
                      class="file-link-inline"
                      >📄 View</a
                    >
                  </div>
                  <input
                    type="file"
                    ref="naturalizationInput"
                    @change="handleNaturalizationSelect"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style="display: none"
                  />
                  <small v-if="nationalityDocFile" class="field-hint success"
                    >File selected: {{ nationalityDocFile.name }}</small
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Health & Legal Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  />
                  <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                </svg>
              </div>
              <h3>Health & Legal Information</h3>
            </div>
            <div class="health-legal-content">
              <div class="health-section">
                <h4>Health Information</h4>
                <label
                  ><input
                    type="checkbox"
                    v-model="form.healthInfo.hasPhysicalInjury"
                  />
                  Has Physical Injury or Disability</label
                ><textarea
                  v-if="form.healthInfo.hasPhysicalInjury"
                  v-model="form.healthInfo.injuryDescription"
                  placeholder="Please describe the injury or disability"
                  rows="2"
                  title="Injury/Disability Description"
                ></textarea>
              </div>
              <div class="legal-section">
                <h4>Legal Information</h4>
                <label
                  ><input
                    type="checkbox"
                    v-model="form.legalInfo.hasCriminalRecord"
                  />
                  Has Criminal Record</label
                ><textarea
                  v-if="form.legalInfo.hasCriminalRecord"
                  v-model="form.legalInfo.criminalRecordDescription"
                  placeholder="Please provide details of criminal record"
                  rows="2"
                  title="Criminal Record Details"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Language Skills Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 8h10M9 4v4M11 12h8M15 8v4" />
                  <path d="M2 2h20v20H2z" />
                </svg>
              </div>
              <h3>Language Skills</h3>
            </div>
            <div class="skills-list">
              <div
                v-for="(lang, idx) in form.languageSkills"
                :key="idx"
                class="skill-tag"
                style="
                  display: flex;
                  gap: 8px;
                  align-items: center;
                  flex-wrap: wrap;
                "
              >
                <select
                  v-model="lang.language"
                  style="width: 160px"
                  title="Language"
                >
                  <option value="">Select Language</option>
                  <optgroup label="🇪🇹 Ethiopian Languages">
                    <option value="Amharic">Amharic</option>
                    <option value="Oromo">Oromo</option>
                    <option value="Tigrinya">Tigrinya</option>
                    <option value="Somali">Somali</option>
                    <option value="Sidamo">Sidamo</option>
                    <option value="Wolaytta">Wolaytta</option>
                    <option value="Afar">Afar</option>
                    <option value="Hadiyya">Hadiyya</option>
                    <option value="Gamo">Gamo</option>
                    <option value="Gurage">Gurage</option>
                    <option value="Kembata">Kembata</option>
                    <option value="Silt'e">Silt'e</option>
                  </optgroup>
                  <optgroup label="🌍 African Languages">
                    <option value="Swahili">Swahili</option>
                    <option value="Hausa">Hausa</option>
                    <option value="Yoruba">Yoruba</option>
                    <option value="Zulu">Zulu</option>
                  </optgroup>
                  <optgroup label="🌎 European Languages">
                    <option value="English">English</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Russian">Russian</option>
                  </optgroup>
                  <optgroup label="🌏 Asian Languages">
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Hindi">Hindi</option>
                  </optgroup>
                </select>
                <select
                  v-model="lang.proficiency"
                  style="width: 120px"
                  title="Proficiency Level"
                >
                  <option value="">Select Level</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="fluent">Fluent</option>
                  <option value="native">Native</option>
                </select>
                <button
                  class="remove-small-btn"
                  @click="removeLanguage(idx)"
                  title="Remove Language"
                >
                  ×
                </button>
              </div>
              <button class="add-btn" @click="addLanguage">
                + Add Language
              </button>
            </div>
            <div class="other-skills">
              <strong>Other Skills:</strong>
              <textarea
                v-model="form.otherSkills"
                placeholder="List any other relevant skills, certifications, or qualifications"
                rows="3"
                title="Other Skills"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Employment Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Employment Information</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Department</span>
                <div class="info-value">
                  <select v-model="form.departmentId" title="Department">
                    <option :value="null">Select Department</option>
                    <option
                      v-for="dept in departments"
                      :key="dept.departmentId"
                      :value="dept.departmentId"
                    >
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Position/Job Title</span>
                <div class="info-value">
                  <select v-model="form.positionId" title="Position">
                    <option :value="null">Select Position</option>
                    <option
                      v-for="pos in positions"
                      :key="pos.positionId"
                      :value="pos.positionId"
                    >
                      {{ pos.title }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Employment Type</span>
                <div class="info-value">
                  <select v-model="form.employmentType" title="Employment Type">
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Hire Date</span>
                <div class="info-value">
                  <input
                    type="date"
                    v-model="form.hireDate"
                    title="Date of Hire"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Manager/Supervisor</span>
                <div class="info-value">
                  <select v-model="form.managerId" title="Manager">
                    <option :value="null">No Manager Assigned</option>
                    <option
                      v-for="mgr in managers"
                      :key="mgr.id"
                      :value="mgr.id"
                    >
                      {{ mgr.fullName }} ({{ mgr.employeeId }})
                    </option>
                  </select>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Work Location</span>
                <div class="info-value">
                  <input
                    type="text"
                    v-model="form.workLocation"
                    placeholder="Office/Branch Location"
                    title="Work Location"
                  />
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Shift Type</span>
                <div class="info-value">
                  <select v-model="form.shiftType" title="Shift Type">
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Compensation & Allowances Card -->
          <div class="info-card allowances-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Compensation & Allowances</h3>
            </div>
            <div class="allowances-content">
              <div class="allowance-item basic">
                <div class="allowance-label">Basic Salary (ETB)</div>
                <div class="allowance-value">
                  <input
                    type="number"
                    v-model="form.basicSalary"
                    step="100"
                    placeholder="Monthly Basic Salary"
                    title="Basic Salary"
                  />
                </div>
              </div>
              <div class="allowance-divider"></div>
              <div class="allowance-item">
                <div class="allowance-label">Housing Allowance (ETB)</div>
                <div class="allowance-value">
                  <input
                    type="number"
                    v-model="form.housingAllowance"
                    step="100"
                    placeholder="Housing Allowance"
                    title="Housing Allowance"
                  />
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">Position Allowance (ETB)</div>
                <div class="allowance-value">
                  <input
                    type="number"
                    v-model="form.positionAllowance"
                    step="100"
                    placeholder="Position Allowance"
                    title="Position Allowance"
                  />
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">Transport Allowance (ETB)</div>
                <div class="allowance-value">
                  <input
                    type="number"
                    v-model="form.transportAllowance"
                    step="100"
                    placeholder="Transport Allowance"
                    title="Transport Allowance"
                  />
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">Mobile Allowance (ETB)</div>
                <div class="allowance-value">
                  <input
                    type="number"
                    v-model="form.mobileAllowance"
                    step="100"
                    placeholder="Mobile/Communication Allowance"
                    title="Mobile Allowance"
                  />
                </div>
              </div>
              <div class="allowance-divider"></div>
              <div class="allowance-item total">
                <div class="allowance-label">Total Allowances</div>
                <div class="allowance-value">
                  {{ formatCurrency(totalAllowances) }}
                </div>
              </div>
              <div class="allowance-item gross">
                <div class="allowance-label">Gross Monthly Pay</div>
                <div class="allowance-value gross-amount">
                  {{ formatCurrency(grossPay) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Spouse Information Card -->
         <!-- Spouse Information Card -->
<div class="info-card">
  <div class="card-header">
    <div class="card-header-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
    <h3>Spouse Information</h3>
  </div>
  <div class="spouse-layout">
    <div
      class="spouse-avatar"
      @click="triggerSpouseProfileInput"
      title="Upload Spouse Photo"
    >
      <img
        v-if="spouseProfilePreview || getDocumentWithIndex('spouse_profile', 0)"
        :src="spouseProfilePreview || getDocumentWithIndex('spouse_profile', 0)"
        :alt="form.spouseInfo.fullName"
        @error="(e) => { e.target.src = getAvatarUrl(form.spouseInfo.fullName || 'Spouse') }"
      />
      <div v-else class="spouse-avatar-placeholder">
        {{ form.spouseInfo.fullName?.charAt(0) || "S" }}
      </div>
      <div class="avatar-upload-icon">📷</div>
    </div>
    <input
      type="file"
      ref="spouseProfileInput"
      @change="handleSpouseProfileUpload"
      style="display: none"
      accept="image/*"
    />
    <!-- Rest of spouse info remains the same -->
    <div class="spouse-info">
      <div class="spouse-name">
        <input
          type="text"
          v-model="form.spouseInfo.fullName"
          placeholder="Spouse Full Name"
          title="Spouse Full Name"
        />
      </div>
      <div class="spouse-detail">
        <span>TIN Number:</span>
        <input
          type="text"
          v-model="form.spouseInfo.tinNumber"
          placeholder="Tax Identification Number"
          title="Spouse TIN"
        />
      </div>
      <div class="spouse-detail">
        <span>Date of Birth:</span>
        <input
          type="date"
          v-model="form.spouseInfo.dateOfBirth"
          title="Spouse Date of Birth"
        />
      </div>
      <div class="spouse-detail">
        <span>Employment Status:</span>
        <select
          v-model="form.spouseInfo.jobStatus"
          title="Spouse Job Status"
        >
          <option value="">Select Status</option>
          <option value="government">Government Employee</option>
          <option value="private">Private Sector</option>
          <option value="self-employed">Self Employed</option>
          <option value="unemployed">Unemployed</option>
        </select>
      </div>
      <div class="spouse-detail">
        <span>Company Name:</span>
        <input
          type="text"
          v-model="form.spouseInfo.companyName"
          placeholder="Employer Company Name"
          title="Spouse Company"
        />
      </div>
      <div class="spouse-detail">
        <span>Company Address:</span>
        <input
          type="text"
          v-model="form.spouseInfo.companyAddress"
          placeholder="Employer Address"
          title="Spouse Company Address"
        />
      </div>
      <div class="spouse-document">
        <button
          class="upload-small-btn"
          @click="triggerMarriageCertUpload"
          title="Upload Marriage Certificate"
        >
          📄 Marriage Certificate
        </button>
        <a
          v-if="getDocumentWithIndex('marriage_certificate', 0)"
          :href="getDocumentWithIndex('marriage_certificate', 0)"
          target="_blank"
          class="file-link-inline"
        >View</a>
        <input
          type="file"
          ref="marriageCertInput"
          @change="handleMarriageCertUpload"
          style="display: none"
        />
      </div>
    </div>
  </div>
</div>

          <!-- Children Information Card -->
         <!-- Children Information Card -->
<div class="info-card">
  <div class="card-header">
    <div class="card-header-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    </div>
    <h3>Children ({{ form.children.length }})</h3>
  </div>
  <div class="children-list-edit">
    <div v-for="(child, idx) in form.children" :key="idx" class="child-edit-item">
      <div class="edit-header">
        <strong>Child {{ idx + 1 }}: {{ child.name || 'Unnamed' }}</strong>
        <button class="remove-btn" @click="removeChild(idx)">Remove</button>
      </div>
      <div class="child-edit-content">
        <!-- Child Avatar - Click to upload -->
        <div class="child-avatar-edit" @click="triggerChildProfileUpload(idx)" title="Click to upload/change photo">
          <img 
            v-if="childProfilePreviews[idx] || getDocumentWithIndex('child_profile', idx)" 
            :src="childProfilePreviews[idx] || getDocumentWithIndex('child_profile', idx)" 
            :alt="child.name || 'Child'"
            @error="(e) => { e.target.src = getAvatarUrl(child.name || 'Child') }"
          >
          <div v-else class="child-avatar-placeholder-edit">
            {{ child.name?.charAt(0) || '👶' }}
          </div>
          <div class="avatar-upload-overlay">
            <span>📷</span>
          </div>
        </div>
        
        <div class="child-info-edit">
          <div class="child-name-row">
            <input type="text" v-model="child.name" placeholder="Child's Full Name" class="child-name-input" title="Child Name">
            <input type="date" v-model="child.dateOfBirth" placeholder="Date of Birth" class="child-dob-input" title="Child Date of Birth">
          </div>
          <div class="checkbox-group">
            <label><input type="checkbox" v-model="child.hasMedicalCondition"> Has Medical Condition</label>
            <label><input type="checkbox" v-model="child.isAdopted"> Is Adopted</label>
          </div>
          <textarea v-if="child.hasMedicalCondition" v-model="child.medicalConditionNotes" placeholder="Describe medical condition or special needs" rows="2" class="child-notes" title="Medical Condition Details"></textarea>
          
          <!-- Document Status and Upload Buttons -->
          <div class="child-documents-section">
            <div class="documents-status">
              <div class="doc-status-item">
                <span class="status-label">Birth Certificate:</span>
                <span v-if="getDocumentWithIndex('child_birth_certificate', idx)" class="status-uploaded">✅ Uploaded</span>
                <span v-else class="status-missing">❌ Not uploaded</span>
              </div>
              <div v-if="child.hasMedicalCondition" class="doc-status-item">
                <span class="status-label">Medical Report:</span>
                <span v-if="getDocumentWithIndex('child_medical_report', idx)" class="status-uploaded">✅ Uploaded</span>
                <span v-else class="status-missing">❌ Not uploaded</span>
              </div>
              <div v-if="child.isAdopted" class="doc-status-item">
                <span class="status-label">Adoption Certificate:</span>
                <span v-if="getDocumentWithIndex('child_adoption_certificate', idx)" class="status-uploaded">✅ Uploaded</span>
                <span v-else class="status-missing">❌ Not uploaded</span>
              </div>
            </div>
            
            <div class="child-documents-buttons">
              <button class="upload-small-btn" @click="triggerChildDocUpload(idx, 'birth')" title="Upload Birth Certificate">
                📄 {{ getDocumentWithIndex('child_birth_certificate', idx) ? 'Change' : 'Upload' }} Birth Certificate
              </button>
              <button v-if="child.hasMedicalCondition" class="upload-small-btn" @click="triggerChildDocUpload(idx, 'medical')" title="Upload Medical Report">
                📋 {{ getDocumentWithIndex('child_medical_report', idx) ? 'Change' : 'Upload' }} Medical Report
              </button>
              <button v-if="child.isAdopted" class="upload-small-btn" @click="triggerChildDocUpload(idx, 'adoption')" title="Upload Adoption Certificate">
                📜 {{ getDocumentWithIndex('child_adoption_certificate', idx) ? 'Change' : 'Upload' }} Adoption Certificate
              </button>
            </div>
            
            <!-- View uploaded documents -->
            <div class="view-documents" v-if="getDocumentWithIndex('child_birth_certificate', idx) || getDocumentWithIndex('child_medical_report', idx) || getDocumentWithIndex('child_adoption_certificate', idx) || getDocumentWithIndex('child_profile', idx)">
              <span class="view-label">View Documents:</span>
              <a v-if="getDocumentWithIndex('child_birth_certificate', idx)" :href="getDocumentWithIndex('child_birth_certificate', idx)" target="_blank" class="file-link">Birth Certificate</a>
              <a v-if="getDocumentWithIndex('child_medical_report', idx)" :href="getDocumentWithIndex('child_medical_report', idx)" target="_blank" class="file-link">Medical Report</a>
              <a v-if="getDocumentWithIndex('child_adoption_certificate', idx)" :href="getDocumentWithIndex('child_adoption_certificate', idx)" target="_blank" class="file-link">Adoption Certificate</a>
              <a v-if="getDocumentWithIndex('child_profile', idx)" :href="getDocumentWithIndex('child_profile', idx)" target="_blank" class="file-link">Profile Picture</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button class="add-btn" @click="addChild">+ Add Child</button>
  </div>
</div>

          <!-- Parents Information Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Parents Information</h3>
            </div>
            <div class="parents-edit-grid">
              <div class="parent-edit-section">
                <h4>👨 Father's Information</h4>
                <input
                  type="text"
                  v-model="form.parentsInfo.father.fullName"
                  placeholder="Father's Full Name"
                  title="Father's Name"
                />
                <input
                  type="text"
                  v-model="form.parentsInfo.father.job"
                  placeholder="Occupation/Job Title"
                  title="Father's Occupation"
                />
                <input
                  type="number"
                  v-model="form.parentsInfo.father.monthlyIncome"
                  placeholder="Monthly Income (ETB)"
                  title="Father's Monthly Income"
                />
              </div>
              <div class="parent-edit-section">
                <h4>👩 Mother's Information</h4>
                <input
                  type="text"
                  v-model="form.parentsInfo.mother.fullName"
                  placeholder="Mother's Full Name"
                  title="Mother's Name"
                />
                <input
                  type="text"
                  v-model="form.parentsInfo.mother.job"
                  placeholder="Occupation/Job Title"
                  title="Mother's Occupation"
                />
                <input
                  type="number"
                  v-model="form.parentsInfo.mother.monthlyIncome"
                  placeholder="Monthly Income (ETB)"
                  title="Mother's Monthly Income"
                />
              </div>
            </div>
            <div class="support-section">
              <div class="support-title">💝 Support Provided to Parents</div>
              <input
                type="text"
                v-model="form.parentsInfo.financialSupport"
                placeholder="Financial Support (e.g., Monthly 5000 ETB)"
                style="width: 100%; margin-bottom: 8px"
                title="Financial Support"
              /><input
                type="text"
                v-model="form.parentsInfo.otherSupport"
                placeholder="Other Support (e.g., Medical insurance, Housing, Transportation)"
                style="width: 100%"
                title="Other Support"
              />
            </div>
          </div>

          <!-- Work Experience Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Work Experience ({{ form.workExperience.length }})</h3>
            </div>
            <div class="work-list-edit">
              <div
                v-for="(work, idx) in form.workExperience"
                :key="idx"
                class="work-edit-item"
              >
                <div class="edit-header">
                  <strong>Experience {{ idx + 1 }}</strong
                  ><button class="remove-btn" @click="removeWork(idx)">
                    Remove
                  </button>
                </div>
                <div class="edit-fields">
                  <input
                    type="text"
                    v-model="work.position"
                    placeholder="Job Title/Position"
                    title="Position"
                  />
                  <input
                    type="text"
                    v-model="work.companyName"
                    placeholder="Company/Organization Name"
                    title="Company Name"
                  />
                  <input
                    type="text"
                    v-model="work.companyAddress"
                    placeholder="Company Address"
                    title="Company Address"
                  />
                  <div class="date-group">
                    <input
                      type="date"
                      v-model="work.startDate"
                      placeholder="Start Date"
                      title="Start Date"
                    /><input
                      type="date"
                      v-model="work.endDate"
                      placeholder="End Date"
                      title="End Date"
                    />
                  </div>
                  <div class="salary-group">
                    <input
                      type="number"
                      v-model="work.monthlySalary"
                      placeholder="Monthly Salary (ETB)"
                      title="Monthly Salary"
                    /><input
                      type="number"
                      v-model="work.salaryWhenLeft"
                      placeholder="Final Salary (ETB)"
                      title="Salary When Left"
                    />
                  </div>
                  <textarea
                    v-model="work.terminationReason"
                    placeholder="Reason for leaving the position"
                    rows="2"
                    title="Termination/Exit Reason"
                  ></textarea>
                  <div class="provident-group">
                    <label
                      ><input
                        type="checkbox"
                        v-model="work.providentFundSubmitted"
                        true-value="yes"
                        false-value="no"
                      />
                      Provident Fund Submitted</label
                    ><input
                      v-if="work.providentFundSubmitted === 'yes'"
                      type="date"
                      v-model="work.providentFundStartDate"
                      placeholder="Provident Fund Start Date"
                      title="Provident Fund Start Date"
                    />
                  </div>
                </div>
                <div class="edit-actions">
                  <button
                    class="upload-small-btn"
                    @click="triggerWorkUpload(idx)"
                    title="Upload Experience Letter"
                  >
                    📄 Upload Experience Letter
                  </button>
                </div>
              </div>
              <button class="add-btn" @click="addWork">
                + Add Work Experience
              </button>
            </div>
          </div>

          <!-- Guarantee Information Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Guarantors ({{ form.guaranteeInfo.length }})</h3>
            </div>
            <div class="guarantee-list-edit">
              <div
                v-for="(guarantor, idx) in form.guaranteeInfo"
                :key="idx"
                class="guarantor-edit-item"
              >
                <div class="edit-header">
                  <strong>Guarantor {{ idx + 1 }}</strong
                  ><button class="remove-btn" @click="removeGuarantor(idx)">
                    Remove
                  </button>
                </div>
                <div class="edit-fields">
                  <div class="form-row-two">
                    <input
                      type="text"
                      v-model="guarantor.guarantorName"
                      placeholder="Guarantor Full Name"
                      title="Guarantor Name"
                    /><input
                      type="text"
                      v-model="guarantor.guarantorJob"
                      placeholder="Guarantor Job/Position"
                      title="Guarantor Job"
                    />
                  </div>
                  <div class="form-row-two">
                    <input
                      type="text"
                      v-model="guarantor.guarantorOfficeName"
                      placeholder="Office/Company Name"
                      title="Office Name"
                    /><input
                      type="text"
                      v-model="guarantor.guarantorOfficeAddress"
                      placeholder="Office Address"
                      title="Office Address"
                    />
                  </div>
                  <div class="form-row-two">
                    <input
                      type="text"
                      v-model="guarantor.guaranteeLetterNo"
                      placeholder="Guarantee Letter Number"
                      title="Guarantee Letter No"
                    /><input
                      type="date"
                      v-model="guarantor.guaranteeLetterDate"
                      placeholder="Letter Date"
                      title="Letter Date"
                    />
                  </div>
                  <div class="form-row-two">
                    <input
                      type="text"
                      v-model="guarantor.sdtLetterNo"
                      placeholder="SDT Letter Number"
                      title="SDT Letter No"
                    /><input
                      type="date"
                      v-model="guarantor.sdtLetterDate"
                      placeholder="SDT Date"
                      title="SDT Date"
                    />
                  </div>
                  <input
                    type="date"
                    v-model="guarantor.confirmedDate"
                    placeholder="Confirmation Date"
                    title="Confirmed Date"
                  />
                </div>
                <div class="edit-actions">
                  <button
                    class="upload-small-btn"
                    @click="triggerGuaranteeUpload(idx, 'guarantee')"
                    title="Upload Guarantee Letter"
                  >
                    📄 Guarantee Letter</button
                  ><button
                    class="upload-small-btn"
                    @click="triggerGuaranteeUpload(idx, 'sdt')"
                    title="Upload SDT Letter"
                  >
                    📄 SDT Letter
                  </button>
                </div>
              </div>
              <button class="add-btn" @click="addGuarantor">
                + Add Guarantor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="12" cy="16" r="0.5" />
      </svg>
      <h3>Employee Not Found</h3>
      <router-link to="/employees">Return to Employees</router-link>
    </div>

    <!-- Hidden File Inputs -->
    <input
      type="file"
      ref="educationInput"
      @change="handleEducationUpload"
      style="display: none"
      accept=".pdf,.jpg,.jpeg,.png"
    />
    <input
      type="file"
      ref="trainingInput"
      @change="handleTrainingUpload"
      style="display: none"
      accept=".pdf,.jpg,.jpeg,.png"
    />
    <input
      type="file"
      ref="workInput"
      @change="handleWorkUpload"
      style="display: none"
      accept=".pdf,.jpg,.jpeg,.png"
    />
    <input
      type="file"
      ref="guaranteeInput"
      @change="handleGuaranteeDocUpload"
      style="display: none"
      accept=".pdf,.jpg,.jpeg,.png"
    />
    <input
      type="file"
      ref="childDocInput"
      @change="handleChildDocUpload"
      style="display: none"
      accept=".pdf,.jpg,.jpeg,.png"
    />
    <input
      type="file"
      ref="childProfileInput"
      @change="handleChildProfileUpload"
      style="display: none"
      accept="image/*"
    />

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="`toast toast-${toast.type}`"
      >
        <span>{{ toast.message }}</span
        ><button @click="removeToast(toast.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import EmployeesService from "@/stores/employee";

const route = useRoute();
const router = useRouter();
const employeeId = route.params.id;

// State
const employee = ref(null);
const loading = ref(true);
const saving = ref(false);
const toasts = ref([]);
const profilePreview = ref(null);
const spouseProfilePreview = ref(null);
const childProfilePreviews = ref({});
const departments = ref([]);
const positions = ref([]);
const managers = ref([]);
const nationalIdFile = ref(null);
const nationalityDocFile = ref(null);

// File upload state
let currentEducationIndex = null;
let currentTrainingIndex = null;
let currentWorkIndex = null;
let currentGuaranteeData = null;
let currentChildData = null;

// Form data
const form = ref({
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  personalEmail: "",
  phone: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  nationalId: "",
  departmentId: null,
  positionId: null,
  managerId: null,
  employmentType: "",
  status: "active",
  hireDate: "",
  confirmationDate: "",
  terminationDate: "",
  workLocation: "",
  shiftType: "day",
  basicSalary: null,
  housingAllowance: 0,
  positionAllowance: 0,
  transportAllowance: 0,
  mobileAllowance: 0,
  birthPlace: { region: "", city: "", subcity: "", district: "" },
  currentCompany: {
    companyName: "",
    companyTin: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
    poBox: "",
    website: "",
  },
  currentAddress: {
    region: "",
    subcity: "",
    kebele: "",
    district: "",
    poBox: "",
    houseNumber: "",
  },
  permanentAddress: {
    region: "",
    subcity: "",
    kebele: "",
    district: "",
    poBox: "",
    houseNumber: "",
  },
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
    alternatePhone: "",
  },
  emergencyContactAddress: { city: "", subcity: "", district: "", kebele: "" },
  bankAccount: {
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    branch: "",
  },
  spouseInfo: {
    fullName: "",
    tinNumber: "",
    dateOfBirth: "",
    jobStatus: "",
    companyName: "",
    companyAddress: "",
  },
  children: [],
  parentsInfo: {
    father: { fullName: "", monthlyIncome: null, job: "" },
    mother: { fullName: "", monthlyIncome: null, job: "" },
    financialSupport: "",
    otherSupport: "",
  },
  education: [],
  training: [],
  workExperience: [],
  guaranteeInfo: [],
  languageSkills: [],
  otherSkills: "",
  nationalityAcquisition: { type: "by_birth" },
  healthInfo: { hasPhysicalInjury: false, injuryDescription: "" },
  legalInfo: { hasCriminalRecord: false, criminalRecordDescription: "" },
});

// Computed
const totalAllowances = computed(
  () =>
    (parseFloat(form.value.housingAllowance) || 0) +
    (parseFloat(form.value.positionAllowance) || 0) +
    (parseFloat(form.value.transportAllowance) || 0) +
    (parseFloat(form.value.mobileAllowance) || 0),
);
const grossPay = computed(
  () => (parseFloat(form.value.basicSalary) || 0) + totalAllowances.value,
);
const getDepartmentName = computed(() => {
  const dept = departments.value.find(
    (d) => d.departmentId === form.value.departmentId,
  );
  return dept?.name || employee.value?.departmentName || "—";
});
const getPositionName = computed(() => {
  const pos = positions.value.find(
    (p) => p.positionId === form.value.positionId,
  );
  return pos?.title || employee.value?.position || "—";
});
const getEmploymentTypeLabel = (type) =>
  ({
    "full-time": "Full Time",
    "part-time": "Part Time",
    contract: "Contract",
    intern: "Intern",
  })[type] || type;
const getAvatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name || "User")}`;
const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");
const formatCurrency = (val) =>
  val ? `ETB ${Number(val).toLocaleString()}` : "—";

const getDocumentUrl = (type) =>
  employee.value?.documents?.[type]?.fileUrl || null;

// Replace the existing getDocumentWithIndex function
const getDocumentWithIndex = (type, index) => {
  const docs = employee.value?.documents;
  if (!docs) return null;

  // Check for indexed key format (e.g., 'child_profile_0', 'child_birth_certificate_0')
  const indexedKey = `${type}_${index}`;
  if (docs[indexedKey]) {
    return docs[indexedKey]?.fileUrl || null;
  }

  // For non-indexed documents (like national_id, cv, degree)
  if (docs[type] && !Array.isArray(docs[type])) {
    return docs[type]?.fileUrl || null;
  }

  // For array documents (like guarantee_letters)
  if (docs[type] && Array.isArray(docs[type])) {
    const doc = docs[type].find((d) => d.index === index);
    return doc?.fileUrl || null;
  }

  return null;
};

// Toast
const addToast = (message, type = "success") => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 3000);
};
const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

// Cancel
const cancelEdit = () => router.push(`/employees/${employeeId}`);

// Load data
const loadEmployeeData = async () => {
  try {
    loading.value = true;
    const result = await EmployeesService.getEmployeeById(employeeId);
    if (result.success && result.data) {
      employee.value = result.data;
      const emp = result.data;
      form.value = {
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        middleName: emp.middleName || "",
        email: emp.email || "",
        personalEmail: emp.personalEmail || "",
        phone: emp.phone || "",
        dob: emp.dob ? emp.dob.split("T")[0] : "",
        gender: emp.gender || "",
        maritalStatus: emp.maritalStatus || "",
        nationality: emp.nationality || "",
        nationalId: emp.nationalId || "",
        departmentId: emp.departmentId || null,
        positionId: emp.positionId || null,
        managerId: emp.managerId || null,
        employmentType: emp.employmentType || "",
        status: emp.status || "active",
        hireDate: emp.hireDate ? emp.hireDate.split("T")[0] : "",
        confirmationDate: emp.confirmationDate
          ? emp.confirmationDate.split("T")[0]
          : "",
        terminationDate: emp.terminationDate
          ? emp.terminationDate.split("T")[0]
          : "",
        workLocation: emp.workLocation || "",
        shiftType: emp.shiftType || "day",
        basicSalary: emp.basicSalary || null,
        housingAllowance: emp.housingAllowance || 0,
        positionAllowance: emp.positionAllowance || 0,
        transportAllowance: emp.transportAllowance || 0,
        mobileAllowance: emp.mobileAllowance || 0,
        birthPlace: emp.birthPlace || {
          region: "",
          city: "",
          subcity: "",
          district: "",
        },
        currentCompany: emp.currentCompany || {
          companyName: "",
          companyTin: "",
          companyPhone: "",
          companyEmail: "",
          companyAddress: "",
          poBox: "",
          website: "",
        },
        currentAddress: emp.currentAddress || {
          region: "",
          subcity: "",
          kebele: "",
          district: "",
          poBox: "",
          houseNumber: "",
        },
        permanentAddress: emp.permanentAddress || {
          region: "",
          subcity: "",
          kebele: "",
          district: "",
          poBox: "",
          houseNumber: "",
        },
        emergencyContact: emp.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
          alternatePhone: "",
        },
        emergencyContactAddress: emp.emergencyContactAddress || {
          city: "",
          subcity: "",
          district: "",
          kebele: "",
        },
        bankAccount: emp.bankAccount || {
          bankName: "",
          accountNumber: "",
          accountHolderName: "",
          branch: "",
        },
        spouseInfo: emp.spouseInfo || {
          fullName: "",
          tinNumber: "",
          dateOfBirth: "",
          jobStatus: "",
          companyName: "",
          companyAddress: "",
        },
        children: emp.children || [],
        parentsInfo: emp.parentsInfo || {
          father: { fullName: "", monthlyIncome: null, job: "" },
          mother: { fullName: "", monthlyIncome: null, job: "" },
          financialSupport: "",
          otherSupport: "",
        },
        education: emp.education || [],
        training: emp.training || [],
        workExperience: emp.workExperience || [],
        guaranteeInfo: emp.guaranteeInfo || [],
        languageSkills: emp.languageSkills || [],
        otherSkills: emp.otherSkills || "",
        nationalityAcquisition: emp.nationalityAcquisition || {
          type: "by_birth",
        },
        healthInfo: emp.healthInfo || {
          hasPhysicalInjury: false,
          injuryDescription: "",
        },
        legalInfo: emp.legalInfo || {
          hasCriminalRecord: false,
          criminalRecordDescription: "",
        },
      };
    }
  } catch (error) {
    console.error(error);
    addToast("Failed to load employee", "error");
  } finally {
    loading.value = false;
  }
};

const loadDropdowns = async () => {
  try {
    const deptRes = await EmployeesService.getDepartments();
    if (deptRes.success) departments.value = deptRes.data;
    const posRes = await EmployeesService.getPositions();
    if (posRes.success) positions.value = posRes.data;
    const empRes = await EmployeesService.getEmployees({ limit: 100 });
    if (empRes.success)
      managers.value = empRes.data.filter((e) => e.id != employeeId);
  } catch (error) {
    console.error("Error loading dropdowns:", error);
  }
};

// Profile picture
const profileInput = ref(null);
const triggerProfileInput = () => profileInput.value.click();
const handleProfileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => (profilePreview.value = ev.target.result);
  reader.readAsDataURL(file);
  const res = await EmployeesService.uploadProfilePicture(employeeId, file);
  if (res.success) addToast("Profile picture updated", "success");
  else addToast("Upload failed", "error");
};

// National ID
const nationalIdInput = ref(null);
const triggerNationalIdUpload = () => nationalIdInput.value?.click();
const handleNationalIdSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    nationalIdFile.value = file;
    addToast(`National ID file selected: ${file.name}`, "success");
  }
};

// Naturalization document
const naturalizationInput = ref(null);
const triggerNaturalizationUpload = () => naturalizationInput.value?.click();
const handleNaturalizationSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    nationalityDocFile.value = file;
    addToast(`Naturalization certificate selected: ${file.name}`, "success");
  }
};

// Spouse
const spouseProfileInput = ref(null);
const marriageCertInput = ref(null);
const triggerSpouseProfileInput = () => spouseProfileInput.value.click();
const handleSpouseProfileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => (spouseProfilePreview.value = ev.target.result);
  reader.readAsDataURL(file);
  // Upload with index 0 for spouse profile
  const res = await EmployeesService.uploadEmployeeDocument(
    employeeId,
    file,
    "spouse_profile",
    { index: 0 }  // Add index parameter
  );
  if (res.success) {
    addToast("Spouse profile updated", "success");
    await refreshEmployeeData(); // Refresh to get the new URL
  }
};
const triggerMarriageCertUpload = () => marriageCertInput.value.click();
const handleMarriageCertUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const res = await EmployeesService.uploadEmployeeDocument(
    employeeId,
    file,
    "marriage_certificate",
    { index: 0 }  // Add index parameter
  );
  if (res.success) {
    addToast("Marriage certificate uploaded", "success");
    await refreshEmployeeData();
  }
};

// Children
const addChild = () =>
  form.value.children.push({
    name: "",
    dateOfBirth: "",
    hasMedicalCondition: false,
    isAdopted: false,
    medicalConditionNotes: "",
  });
const removeChild = (idx) => form.value.children.splice(idx, 1);
const childDocInput = ref(null);
const childProfileInput = ref(null);
// Update triggerChildProfileUpload
const triggerChildProfileUpload = (idx) => {
  const inputId = `child-profile-input-${idx}`
  let input = document.getElementById(inputId)
  
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.id = inputId
    input.accept = 'image/jpeg,image/png,image/jpg,image/webp'
    input.style.display = 'none'
    input.onchange = (e) => handleChildProfileUpload(e, idx)
    document.body.appendChild(input)
  }
  
  input.click()
}

// Update handleChildProfileUpload
const handleChildProfileUpload = async (e, idx) => {
  const file = e.target.files[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    addToast('Please select an image file (JPEG, PNG, GIF, WEBP)', 'error')
    return
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    addToast('Image size should be less than 5MB', 'error')
    return
  }
  
  // Show preview immediately
  const reader = new FileReader()
  reader.onload = (ev) => {
    childProfilePreviews.value[idx] = ev.target.result
  }
  reader.readAsDataURL(file)
  
  // Upload with index - this will create child_profile_0, child_profile_1, etc.
  const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, 'child_profile', { index: idx })
  if (res.success) {
    addToast(`Profile picture for ${form.value.children[idx]?.name || `Child ${idx + 1}`} updated`, 'success')
    // Refresh to get the new document URL
    await refreshEmployeeData()
    // Update the preview with the new URL from the refreshed data
    const newUrl = getDocumentWithIndex('child_profile', idx)
    if (newUrl) {
      childProfilePreviews.value[idx] = newUrl
    }
    e.target.value = '' // Clear the file input
  } else {
    addToast('Upload failed', 'error')
    delete childProfilePreviews.value[idx]
  }
}

// Update triggerChildDocUpload
const triggerChildDocUpload = (idx, type) => {
  currentChildData = { idx, type }
  const inputId = `child-doc-input-${idx}-${type}`
  let input = document.getElementById(inputId)
  
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.id = inputId
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.style.display = 'none'
    input.onchange = handleChildDocUpload
    document.body.appendChild(input)
  }
  
  input.click()
}

// Update handleChildDocUpload
const handleChildDocUpload = async (e) => {
  const file = e.target.files[0]
  if (!file || !currentChildData) return
  
  const { idx, type } = currentChildData
  let documentType = ''
  
  switch(type) {
    case 'birth':
      documentType = 'child_birth_certificate'
      break
    case 'medical':
      documentType = 'child_medical_report'
      break
    case 'adoption':
      documentType = 'child_adoption_certificate'
      break
    default:
      return
  }
  
  // Upload with index to create indexed documents
  const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, documentType, { index: idx })
  if (res.success) {
    const childName = form.value.children[idx]?.name || `Child ${idx + 1}`
    addToast(`${documentType.replace(/_/g, ' ')} for ${childName} uploaded`, 'success')
    await refreshEmployeeData()
  } else {
    addToast('Upload failed', 'error')
  }
  e.target.value = ''
  currentChildData = null
}

// Add refreshEmployeeData function
const refreshEmployeeData = async () => {
  try {
    const result = await EmployeesService.getEmployeeById(employeeId)
    if (result.success && result.data) {
      employee.value = result.data
      // Clear previews that are now loaded from the refreshed data
      Object.keys(childProfilePreviews.value).forEach(key => {
        const newUrl = getDocumentWithIndex('child_profile', parseInt(key))
        if (newUrl && childProfilePreviews.value[key] !== newUrl) {
          // Preview will be updated when needed
        }
      })
    }
  } catch (error) {
    console.error('Error refreshing employee data:', error)
  }
}

// Education
const educationInput = ref(null);
const addEducation = () =>
  form.value.education.push({
    level: "",
    institutionName: "",
    institutionAddress: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });
const removeEducation = (idx) => form.value.education.splice(idx, 1);
const triggerEducationUpload = (idx) => {
  currentEducationIndex = idx;
  educationInput.value.click();
};
const handleEducationUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || currentEducationIndex === null) return;
  const res = await EmployeesService.uploadEmployeeDocument(
    employeeId,
    file,
    "education_certificate",
    { index: currentEducationIndex },
  );
  if (res.success) addToast("Education certificate uploaded", "success");
  currentEducationIndex = null;
};

// Training
const trainingInput = ref(null);
const addTraining = () =>
  form.value.training.push({
    trainingName: "",
    institutionName: "",
    institutionAddress: "",
    startDate: "",
    endDate: "",
  });
const removeTraining = (idx) => form.value.training.splice(idx, 1);
const triggerTrainingUpload = (idx) => {
  currentTrainingIndex = idx;
  trainingInput.value.click();
};
const handleTrainingUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || currentTrainingIndex === null) return;
  const res = await EmployeesService.uploadEmployeeDocument(
    employeeId,
    file,
    "training_certificate",
    { index: currentTrainingIndex },
  );
  if (res.success) addToast("Training certificate uploaded", "success");
  currentTrainingIndex = null;
};

// Work Experience
const workInput = ref(null);
const addWork = () =>
  form.value.workExperience.push({
    position: "",
    companyName: "",
    companyAddress: "",
    startDate: "",
    endDate: "",
    monthlySalary: "",
    salaryWhenLeft: "",
    terminationReason: "",
    providentFundSubmitted: "no",
    providentFundStartDate: "",
  });
const removeWork = (idx) => form.value.workExperience.splice(idx, 1);
const triggerWorkUpload = (idx) => {
  currentWorkIndex = idx;
  workInput.value.click();
};
const handleWorkUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || currentWorkIndex === null) return;
  const res = await EmployeesService.uploadEmployeeDocument(
    employeeId,
    file,
    "experience_letter",
    { index: currentWorkIndex },
  );
  if (res.success) addToast("Experience letter uploaded", "success");
  currentWorkIndex = null;
};

// Guarantee
const guaranteeInput = ref(null);
const addGuarantor = () =>
  form.value.guaranteeInfo.push({
    guarantorName: "",
    guarantorJob: "",
    guarantorOfficeName: "",
    guarantorOfficeAddress: "",
    guaranteeLetterNo: "",
    guaranteeLetterDate: "",
    sdtLetterNo: "",
    sdtLetterDate: "",
    confirmedDate: "",
  });
const removeGuarantor = (idx) => form.value.guaranteeInfo.splice(idx, 1);
const triggerGuaranteeUpload = (idx, type) => {
  currentGuaranteeData = { idx, type };
  guaranteeInput.value.click();
};
const handleGuaranteeDocUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || !currentGuaranteeData) return;
  const types = { guarantee: "guarantee_letter", sdt: "sdt_letter" };
  const res = await EmployeesService.uploadEmployeeDocument(
    employeeId,
    file,
    types[currentGuaranteeData.type],
    { index: currentGuaranteeData.idx },
  );
  if (res.success) addToast("Guarantee document uploaded", "success");
  currentGuaranteeData = null;
};

// Language
const addLanguage = () =>
  form.value.languageSkills.push({ language: "", proficiency: "" });
const removeLanguage = (idx) => form.value.languageSkills.splice(idx, 1);

// Clean data function - removes empty strings and nulls
const cleanData = (data) => {
  if (data === null || data === undefined) return null;
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanData(item)).filter((item) => item !== null);
  }
  if (typeof data === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanData(value);
      if (cleanedValue !== null && cleanedValue !== undefined) {
        // Don't include empty objects
        if (
          typeof cleanedValue === "object" &&
          Object.keys(cleanedValue).length === 0
        )
          continue;
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }
  return data;
};

// Save
const saveEmployee = async () => {
  saving.value = true;
  try {
    // Upload files first if any
    if (nationalIdFile.value) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId,
        nationalIdFile.value,
        "national_id",
      );
    }
    if (nationalityDocFile.value) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId,
        nationalityDocFile.value,
        "naturalization_certificate",
      );
    }

    // Prepare update data - only include fields that have values
    const updateData = {
      firstName: form.value.firstName || undefined,
      lastName: form.value.lastName || undefined,
      middleName: form.value.middleName || undefined,
      email: form.value.email || undefined,
      personalEmail: form.value.personalEmail || undefined,
      phone: form.value.phone || undefined,
      dob: form.value.dob || undefined,
      gender: form.value.gender || undefined,
      maritalStatus: form.value.maritalStatus || undefined,
      nationality: form.value.nationality || undefined,
      nationalId: form.value.nationalId || undefined,
      departmentId: form.value.departmentId,
      positionId: form.value.positionId,
      managerId: form.value.managerId,
      employmentType: form.value.employmentType || undefined,
      status: form.value.status,
      hireDate: form.value.hireDate || undefined,
      confirmationDate: form.value.confirmationDate || undefined,
      terminationDate: form.value.terminationDate || undefined,
      workLocation: form.value.workLocation || undefined,
      shiftType: form.value.shiftType,
      basicSalary: form.value.basicSalary
        ? Number(form.value.basicSalary)
        : undefined,
      housingAllowance: form.value.housingAllowance
        ? Number(form.value.housingAllowance)
        : 0,
      positionAllowance: form.value.positionAllowance
        ? Number(form.value.positionAllowance)
        : 0,
      transportAllowance: form.value.transportAllowance
        ? Number(form.value.transportAllowance)
        : 0,
      mobileAllowance: form.value.mobileAllowance
        ? Number(form.value.mobileAllowance)
        : 0,
    };

    // Add nested objects only if they have content
    if (
      form.value.birthPlace &&
      Object.values(form.value.birthPlace).some((v) => v)
    ) {
      updateData.birthPlace = cleanData(form.value.birthPlace);
    }
    if (
      form.value.currentCompany &&
      Object.values(form.value.currentCompany).some((v) => v)
    ) {
      updateData.currentCompany = cleanData(form.value.currentCompany);
    }
    if (
      form.value.currentAddress &&
      Object.values(form.value.currentAddress).some((v) => v)
    ) {
      updateData.currentAddress = cleanData(form.value.currentAddress);
    }
    if (
      form.value.permanentAddress &&
      Object.values(form.value.permanentAddress).some((v) => v)
    ) {
      updateData.permanentAddress = cleanData(form.value.permanentAddress);
    }
    if (
      form.value.emergencyContact &&
      Object.values(form.value.emergencyContact).some((v) => v)
    ) {
      updateData.emergencyContact = cleanData(form.value.emergencyContact);
    }
    if (
      form.value.emergencyContactAddress &&
      Object.values(form.value.emergencyContactAddress).some((v) => v)
    ) {
      updateData.emergencyContactAddress = cleanData(
        form.value.emergencyContactAddress,
      );
    }
    if (
      form.value.bankAccount &&
      Object.values(form.value.bankAccount).some((v) => v)
    ) {
      updateData.bankAccount = cleanData(form.value.bankAccount);
    }
    if (
      form.value.spouseInfo &&
      Object.values(form.value.spouseInfo).some((v) => v)
    ) {
      updateData.spouseInfo = cleanData(form.value.spouseInfo);
    }

    // Arrays - only include if they have items
    if (form.value.children && form.value.children.length > 0) {
      updateData.children = form.value.children
        .map((child) => cleanData(child))
        .filter((c) => c && c.name);
    }
    if (
      form.value.parentsInfo &&
      (form.value.parentsInfo.father?.fullName ||
        form.value.parentsInfo.mother?.fullName)
    ) {
      updateData.parentsInfo = cleanData(form.value.parentsInfo);
    }
    if (form.value.education && form.value.education.length > 0) {
      updateData.education = form.value.education
        .map((edu) => cleanData(edu))
        .filter((e) => e && e.level);
    }
    if (form.value.training && form.value.training.length > 0) {
      updateData.training = form.value.training
        .map((train) => cleanData(train))
        .filter((t) => t && t.trainingName);
    }
    if (form.value.workExperience && form.value.workExperience.length > 0) {
      updateData.workExperience = form.value.workExperience
        .map((work) => cleanData(work))
        .filter((w) => w && w.position);
    }
    if (form.value.guaranteeInfo && form.value.guaranteeInfo.length > 0) {
      updateData.guaranteeInfo = form.value.guaranteeInfo
        .map((guar) => cleanData(guar))
        .filter((g) => g && g.guarantorName);
    }
    if (form.value.languageSkills && form.value.languageSkills.length > 0) {
      updateData.languageSkills = form.value.languageSkills
        .map((lang) => cleanData(lang))
        .filter((l) => l && l.language);
    }

    if (form.value.otherSkills) {
      updateData.otherSkills = form.value.otherSkills;
    }
    if (form.value.nationalityAcquisition) {
      updateData.nationalityAcquisition = cleanData(
        form.value.nationalityAcquisition,
      );
    }
    if (form.value.healthInfo && form.value.healthInfo.hasPhysicalInjury) {
      updateData.healthInfo = cleanData(form.value.healthInfo);
    }
    if (form.value.legalInfo && form.value.legalInfo.hasCriminalRecord) {
      updateData.legalInfo = cleanData(form.value.legalInfo);
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    console.log("Sending update data:", updateData);

    const response = await EmployeesService.updateEmployee(
      employeeId,
      updateData,
    );
    if (response.success) {
      addToast("Employee updated successfully!", "success");
      setTimeout(() => router.push(`/employees/${employeeId}`), 1500);
    } else {
      addToast(response.error || "Update failed", "error");
    }
  } catch (error) {
    console.error("Save error:", error);
    const errorMessage =
      error.response?.data?.message || error.message || "Update failed";
    addToast(errorMessage, "error");
  } finally {
    saving.value = false;
  }
};

// Error handler
const handleImageError = (e) => {
  e.target.src = getAvatarUrl(employee.value?.fullName || "Employee");
};

onMounted(async () => {
  await Promise.all([loadEmployeeData(), loadDropdowns()]);
});
</script>

<style scoped>
/* Add to your existing styles */
.child-documents-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eef2ff;
}

.documents-status {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doc-status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.status-label {
  font-weight: 500;
  color: #64748b;
  min-width: 120px;
}

.status-uploaded {
  color: #10b981;
}

.status-missing {
  color: #ef4444;
}

.view-documents {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.view-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.file-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
  padding: 2px 8px;
  background: #eef2ff;
  border-radius: 12px;
}

.file-link:hover {
  background: #e0e7ff;
  text-decoration: underline;
}

.child-avatar-edit {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.child-avatar-edit:hover {
  transform: scale(1.05);
}

.child-avatar-edit img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-avatar-placeholder-edit {
  font-size: 32px;
  font-weight: 600;
  color: #6366f1;
}

.avatar-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.child-avatar-edit:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-overlay span {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
.children-list-edit {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.child-edit-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #eef2ff;
}

.child-edit-content {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.child-avatar-edit {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.child-avatar-edit img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-avatar-placeholder-edit {
  font-size: 32px;
}

.child-info-edit {
  flex: 1;
  min-width: 200px;
}

.child-name-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.child-name-input {
  flex: 2;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.child-dob-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.child-notes {
  width: 100%;
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
}

.child-documents-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.checkbox-group {
  display: flex;
  gap: 20px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
}

@media (max-width: 768px) {
  .child-edit-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .child-name-row {
    flex-direction: column;
  }

  .child-name-input,
  .child-dob-input {
    width: 100%;
  }

  .child-documents-buttons {
    justify-content: center;
  }
}
.edit-name-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.name-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 600;
  width: 200px;
}
.name-input:focus {
  outline: none;
  border-color: #6366f1;
}
.action-buttons {
  display: flex;
  gap: 12px;
}
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}
.employee-avatar-large:hover .avatar-overlay {
  opacity: 1;
}
.avatar-overlay svg {
  width: 32px;
  height: 32px;
  color: white;
}
.upload-small-btn {
  background: #eef2ff;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: #6366f1;
  margin: 4px;
}
.upload-small-btn:hover {
  background: #e0e7ff;
}
.add-btn {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #6366f1;
  width: 100%;
  margin-top: 8px;
}
.add-btn:hover {
  background: #eef2ff;
  border-color: #6366f1;
}
.remove-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.remove-small-btn {
  background: #ef4444;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}
.spouse-avatar {
  position: relative;
  cursor: pointer;
}
.spouse-avatar .avatar-upload-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}
.spouse-avatar:hover .avatar-upload-icon {
  opacity: 1;
}
.child-avatar-edit {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}
.child-avatar-placeholder-edit {
  font-size: 24px;
}
.checkbox-group {
  display: flex;
  gap: 16px;
  margin: 8px 0;
}
.date-group,
.salary-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
}
.form-row-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
}
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.edit-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.edit-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.education-edit-item,
.training-edit-item,
.work-edit-item,
.guarantor-edit-item,
.child-edit-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid #eef2ff;
}
.parents-edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px 24px;
}
.parent-edit-section h4 {
  font-size: 14px;
  color: #6366f1;
  margin-bottom: 12px;
}
.parent-edit-section input {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.guarantee-list-edit,
.education-list-edit,
.training-list-edit,
.work-list-edit,
.children-list-edit {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skills-list {
  padding: 12px 20px;
}
.field-hint.success {
  color: #10b981;
}
.file-link-inline {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
  margin-left: 10px;
  padding: 2px 8px;
  background: #eef2ff;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Main container styles */
.employee-edit {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
}
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 16px;
}
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn svg {
  width: 16px;
  height: 16px;
}
.action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.action-btn.primary {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}
.action-btn.primary:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.hero-section {
  background: white;
  border-radius: 24px;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
.hero-left {
  display: flex;
  align-items: center;
  gap: 32px;
}
.employee-avatar-large {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  cursor: pointer;
}
.employee-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.employee-basic h1 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
}
.employee-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.tag {
  padding: 5px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.hero-right {
  text-align: right;
}
.employee-code {
  margin-bottom: 12px;
}
.code-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}
.code-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}
.status-select {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.status-select.active {
  background: #10b98115;
  color: #10b981;
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.stat-card-icon {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-card-icon svg {
  width: 24px;
  height: 24px;
  color: #6366f1;
}
.stat-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-number {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.info-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}
.card-header-icon {
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-header-icon svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}
.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.info-list {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 14px;
}
.info-label {
  width: 140px;
  font-size: 13px;
  color: #64748b;
}
.info-value {
  flex: 1;
}
.info-value input,
.info-value select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}
.allowances-card .allowances-content {
  padding: 20px 24px;
}
.allowance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.allowance-item input {
  width: 150px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: right;
}
.allowance-divider {
  height: 1px;
  background: #eef2ff;
  margin: 8px 0;
}
.allowance-item.total .allowance-value {
  color: #f59e0b;
  font-size: 16px;
  font-weight: 700;
}
.allowance-item.gross .allowance-value {
  color: #10b981;
  font-size: 18px;
  font-weight: 700;
}
.spouse-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
  align-items: flex-start;
}
.spouse-avatar {
  flex-shrink: 0;
  width: 90px;
  height: 90px;
  position: relative;
}
.spouse-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e2e8f0;
}
.spouse-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: white;
}
.spouse-info {
  flex: 1;
}
.spouse-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.spouse-detail {
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}
.spouse-detail span {
  font-weight: 600;
  color: #64748b;
  min-width: 130px;
}
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.2s ease;
}
.toast-success {
  border-left: 3px solid #10b981;
  background: #f0fdf4;
}
.toast-error {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
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
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
  .parents-edit-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .employee-edit {
    padding: 20px 16px;
  }
  .hero-section {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  .hero-left {
    flex-direction: column;
  }
  .hero-right {
    text-align: center;
  }
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .info-label {
    width: 100%;
  }
  .edit-name-container {
    flex-direction: column;
  }
  .name-input {
    width: 100%;
  }
  .spouse-layout {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .spouse-detail {
    justify-content: center;
  }
  .date-group,
  .salary-group {
    grid-template-columns: 1fr;
  }
}

.edit-name-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.name-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 600;
  width: 200px;
}
.name-input:focus {
  outline: none;
  border-color: #6366f1;
}
.tag-select {
  padding: 5px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  border: none;
  cursor: pointer;
}
.action-buttons {
  display: flex;
  gap: 12px;
}
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}
.employee-avatar-large:hover .avatar-overlay {
  opacity: 1;
}
.avatar-overlay svg {
  width: 32px;
  height: 32px;
  color: white;
}
.upload-small-btn {
  background: #eef2ff;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: #6366f1;
  margin: 4px;
}
.upload-small-btn:hover {
  background: #e0e7ff;
}
.add-btn {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #6366f1;
  width: 100%;
  margin-top: 8px;
}
.add-btn:hover {
  background: #eef2ff;
  border-color: #6366f1;
}
.remove-child-btn {
  background: #ef4444;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  align-self: center;
}
.remove-child-btn:hover {
  background: #dc2626;
}
.remove-small-btn {
  background: #ef4444;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}
.education-item,
.training-item,
.work-item,
.guarantor-card-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #eef2ff;
}
input,
select,
textarea {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
.spouse-avatar {
  cursor: pointer;
}
.child-avatar {
  cursor: pointer;
}
.file-link-inline {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
  margin-left: 10px;
  padding: 2px 8px;
  background: #eef2ff;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.file-link-inline:hover {
  background: #e0e7ff;
  text-decoration: underline;
}
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.2s ease;
}
.toast-success {
  border-left: 3px solid #10b981;
  background: #f0fdf4;
}
.toast-error {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
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
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Main container styles */
.employee-edit {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 16px;
}
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Action bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn svg {
  width: 16px;
  height: 16px;
}
.action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.action-btn.primary {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}
.action-btn.primary:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Hero section */
.hero-section {
  background: white;
  border-radius: 24px;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
.hero-left {
  display: flex;
  align-items: center;
  gap: 32px;
}
.employee-avatar-large {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  cursor: pointer;
}
.employee-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.employee-basic h1 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
}
.employee-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.tag {
  padding: 5px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.hero-right {
  text-align: right;
}
.employee-code {
  margin-bottom: 12px;
}
.code-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}
.code-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}
.status-select {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.status-select.active {
  background: #10b98115;
  color: #10b981;
}
.status-select.on-leave {
  background: #f59e0b15;
  color: #f59e0b;
}
.status-select.terminated {
  background: #ef444415;
  color: #ef4444;
}

/* Stats cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.stat-card-icon {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-card-icon svg {
  width: 24px;
  height: 24px;
  color: #6366f1;
}
.stat-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-number {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* Content grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Info cards */
.info-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}
.card-header-icon {
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-header-icon svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}
.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.info-list {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 14px;
}
.info-label {
  width: 130px;
  font-size: 13px;
  color: #64748b;
}
.info-value {
  flex: 1;
}
.info-value input,
.info-value select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}
.info-value input:focus,
.info-value select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

/* Allowances card */
.allowances-card .allowances-content {
  padding: 20px 24px;
}
.allowance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.allowance-item input {
  width: 150px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: right;
}
.allowance-divider {
  height: 1px;
  background: #eef2ff;
  margin: 8px 0;
}
.allowance-item.total .allowance-value {
  color: #f59e0b;
  font-size: 16px;
  font-weight: 700;
}
.allowance-item.gross .allowance-value {
  color: #10b981;
  font-size: 18px;
  font-weight: 700;
}

/* Spouse layout */
.spouse-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
  align-items: flex-start;
}
.spouse-avatar {
  flex-shrink: 0;
  width: 90px;
  height: 90px;
  cursor: pointer;
}
.spouse-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.spouse-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: white;
  border: 3px solid #e2e8f0;
}
.spouse-info {
  flex: 1;
}
.spouse-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.spouse-detail {
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}
.spouse-detail span {
  font-weight: 600;
  color: #64748b;
  min-width: 130px;
}

/* Children list */
.children-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.child-card {
  display: flex;
  gap: 16px;
  background: #f8fafc;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #eef2ff;
  position: relative;
}
.child-avatar {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  cursor: pointer;
}
.child-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: white;
  border: 3px solid white;
}
.child-info {
  flex: 1;
}
.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}
.child-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
.child-age {
  font-size: 12px;
  color: #10b981;
  background: #d1fae5;
  padding: 2px 10px;
  border-radius: 20px;
}
.child-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.child-label {
  font-weight: 500;
  color: #64748b;
  min-width: 110px;
  display: inline-block;
  font-size: 12px;
}
.child-documents {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

/* Parents container */
.parents-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
}
.parent-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #eef2ff;
}
.parent-icon {
  font-size: 42px;
  flex-shrink: 0;
}
.parent-details {
  flex: 1;
}
.parent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 6px;
}
.parent-job {
  font-size: 12px;
  color: #6366f1;
  background: #eef2ff;
  padding: 3px 10px;
  border-radius: 20px;
}
.parent-income {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
}

/* Support section */
.support-section {
  padding: 12px 20px 20px;
  border-top: 1px solid #eef2ff;
}
.support-title {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 12px;
}

/* Education, Training, Work, Guarantee lists */
.education-list,
.training-list,
.work-list,
.guarantee-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.education-item,
.training-item,
.work-item,
.guarantor-card-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #eef2ff;
}
.edu-header,
.training-header,
.work-header,
.guarantor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

/* Health & Legal */
.health-legal-content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.health-section h4,
.legal-section h4 {
  font-size: 13px;
  color: #6366f1;
  margin: 0 0 8px 0;
}

/* Language skills */
.skills-list {
  padding: 12px 20px;
}
.skill-tag {
  display: inline-block;
  background: #eef2ff;
  color: #6366f1;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  margin: 4px;
}
.other-skills {
  padding: 12px 20px 20px;
  border-top: 1px solid #eef2ff;
  font-size: 13px;
}

/* Compensation history */
.history-card.full-width {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.history-content-full {
  padding: 24px;
}
.history-timeline-full {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.timeline-entry {
  display: flex;
  gap: 20px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #eef2ff;
}
.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 80px;
}
.timeline-date-badge {
  text-align: center;
  background: white;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  min-width: 70px;
}
.timeline-date-day {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}
.timeline-date-month {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
}
.timeline-date-year {
  font-size: 10px;
  color: #94a3b8;
}
.timeline-arrow {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.timeline-arrow.increase {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.timeline-arrow.decrease {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
.arrow-icon {
  font-size: 18px;
  font-weight: bold;
  color: white;
}
.timeline-body {
  flex: 1;
}
.timeline-values-full {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: white;
  padding: 14px 18px;
  border-radius: 14px;
  margin-bottom: 12px;
}
.value-card {
  flex: 1;
  min-width: 120px;
}
.value-label {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  display: block;
}
.value-amount {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}
.value-card.old .value-amount {
  color: #64748b;
  text-decoration: line-through;
}
.value-card.new.increase .value-amount {
  color: #10b981;
}
.value-card.new.decrease .value-amount {
  color: #ef4444;
}
.value-diff {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
}
.value-diff.increase {
  background: #d1fae5;
  color: #059669;
}
.value-diff.decrease {
  background: #fee2e2;
  color: #dc2626;
}
.timeline-reason-full {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f1f5f9;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #475569;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 24px;
}
.empty-state svg {
  width: 64px;
  height: 64px;
  color: #cbd5e1;
  margin-bottom: 20px;
}
.empty-state h3 {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 12px;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .employee-edit {
    padding: 20px 16px;
  }
  .hero-section {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  .hero-left {
    flex-direction: column;
  }
  .hero-right {
    text-align: center;
  }
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .info-label {
    width: 100%;
  }
  .spouse-layout {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .child-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .timeline-entry {
    flex-direction: column;
  }
  .timeline-left {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }
  .timeline-values-full {
    flex-direction: column;
  }
  .edit-name-container {
    flex-direction: column;
  }
  .name-input {
    width: 100%;
  }
}
</style>
