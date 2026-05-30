<template>
  <div class="employee-detail">
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
        <router-link
          :to="`/employees/${employeeId}/edit`"
          class="action-btn primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
          </svg>
          Edit Employee
        </router-link>
      </div>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-left">
          <div class="employee-avatar-large">
            <img
              :src="employee.profilePicture || getAvatarUrl(employee.fullName)"
              :alt="employee.fullName"
              @error="handleImageError"
            />
            <div class="online-status" :class="employee.status"></div>
          </div>
          <div class="employee-basic">
            <h1>{{ employee.fullName }}</h1>
            <div class="employee-tags">
              <span class="tag">{{ employee.position || "N/A" }}</span>
              <span class="tag">{{ employee.departmentName || "N/A" }}</span>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <div class="employee-code">
            <span class="code-label">Employee ID</span>
            <strong class="code-value">{{ employee.employeeId }}</strong>
          </div>
          <div class="status-indicator" :class="employee.status">
            {{ getStatusLabel(employee.status) }}
          </div>
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
            ><span class="stat-number">{{
              employee.departmentName || "N/A"
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-label">Hire Date</span
            ><span class="stat-number">{{
              formatDate(employee.hireDate)
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
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-label">Employment Type</span
            ><span class="stat-number">{{
              getEmploymentTypeLabel(employee.employmentType)
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
              formatCurrency(employee.basicSalary)
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
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M4 4h16v16H4z" />
                    <circle cx="12" cy="9" r="2" />
                    <path
                      d="M16 17v-1a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3v1"
                    /></svg></span
                ><span class="info-label">Full Name</span
                ><span class="info-value">{{ employee.fullName }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 6L12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0-10 7L2 6"
                    /></svg></span
                ><span class="info-label">Work Email</span
                ><span class="info-value">{{ employee.email || "—" }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                    /></svg></span
                ><span class="info-label">Phone</span
                ><span class="info-value">{{ employee.phone || "—" }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" /></svg></span
                ><span class="info-label">Date of Birth</span
                ><span class="info-value">{{
                  formatDate(employee.dob) || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" /></svg></span
                ><span class="info-label">Gender</span
                ><span class="info-value">{{
                  employee.gender ? capitalize(employee.gender) : "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 12h2l4-8 4 8h2" />
                    <path d="M5 12h2l3-6 3 6h2" /></svg></span
                ><span class="info-label">Nationality</span
                ><span class="info-value">{{
                  employee.nationality || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    /></svg></span
                ><span class="info-label">Marital Status</span
                ><span class="info-value">{{
                  employee.maritalStatus
                    ? capitalize(employee.maritalStatus)
                    : "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 6L12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0-10 7L2 6"
                    /></svg></span
                ><span class="info-label">Personal Email</span
                ><span class="info-value">{{
                  employee.personalEmail || "—"
                }}</span>
              </div>
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
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                    /></svg></span
                ><span class="info-label">Bank Name</span
                ><span class="info-value">{{
                  employee.bankAccount?.bankName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 6L12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0-10 7L2 6"
                    /></svg></span
                ><span class="info-label">Account Number</span
                ><span class="info-value">{{
                  employee.bankAccount?.accountNumber || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M4 4h16v16H4z" />
                    <circle cx="12" cy="9" r="2" />
                    <path
                      d="M16 17v-1a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3v1"
                    /></svg></span
                ><span class="info-label">Account Holder</span
                ><span class="info-value">{{
                  employee.bankAccount?.accountHolderName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 12h4M18 12h4M12 3v4M12 18v4" /></svg></span
                ><span class="info-label">Branch</span
                ><span class="info-value">{{
                  employee.bankAccount?.branch || "—"
                }}</span>
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
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" /></svg></span
                ><span class="info-label">Contact Name</span
                ><span class="info-value">{{
                  employee.emergencyContact?.name || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                    /></svg></span
                ><span class="info-label">Phone</span
                ><span class="info-value">{{
                  employee.emergencyContact?.phone || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                    /></svg></span
                ><span class="info-label">Alternative Phone</span
                ><span class="info-value">{{
                  employee.emergencyContact?.alternatePhone || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 12h2l4-8 4 8h2" />
                    <path d="M5 12h2l3-6 3 6h2" /></svg></span
                ><span class="info-label">Relationship</span
                ><span class="info-value">{{
                  employee.emergencyContact?.relationship || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Address Card -->
          <div class="info-card address-card">
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
              <h3>Address Information</h3>
            </div>
            <div class="address-content">
              <div v-if="employee.address" class="address-display">
                <div class="address-icon">
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
                <div class="address-text">
                  <p>{{ employee.address }}</p>
                </div>
              </div>
              <div v-else class="address-empty">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z"
                  />
                  <circle cx="12" cy="10" r="3" /></svg
                ><span>No address provided</span>
              </div>
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
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M20 7h-4.18A3 3 0 0 0 16 5.18V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1.18A3 3 0 0 0 8.18 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
                    /></svg></span
                ><span class="info-label">Department</span
                ><span class="info-value">{{
                  employee.departmentName || "N/A"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
                    /></svg></span
                ><span class="info-label">Position</span
                ><span class="info-value">{{
                  employee.position || "N/A"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    /></svg></span
                ><span class="info-label">Employment Type</span
                ><span class="info-value">{{
                  getEmploymentTypeLabel(employee.employmentType)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
                    /></svg></span
                ><span class="info-label">Hire Date</span
                ><span class="info-value">{{
                  formatDate(employee.hireDate)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M16 7C16 4.79 14.21 3 12 3S8 4.79 8 7" />
                    <path d="M12 12v4" /></svg></span
                ><span class="info-label">Manager</span
                ><span class="info-value">{{
                  employee.managerName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 12h4M18 12h4M12 3v4M12 18v4" /></svg></span
                ><span class="info-label">Work Location</span
                ><span class="info-value">{{
                  employee.workLocation || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
                    /></svg></span
                ><span class="info-label">Confirmation Date</span
                ><span class="info-value">{{
                  formatDate(employee.confirmationDate) || "—"
                }}</span>
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
                <div class="allowance-label">Basic Salary</div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.basicSalary) }}
                </div>
              </div>
              <div class="allowance-divider"></div>
              <div class="allowance-item">
                <div class="allowance-label">Housing Allowance</div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.housingAllowance) }}
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">Position Allowance</div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.positionAllowance) }}
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">Transport Allowance</div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.transportAllowance) }}
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">Mobile Allowance</div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.mobileAllowance) }}
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

          <!-- Compensation History Card -->
          <!-- Compensation History Card - Redesigned -->
          <div class="info-card history-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
                  />
                </svg>
              </div>
              <h3>Compensation Change History</h3>
              <span
                class="history-count"
                v-if="compensationHistories.length > 0"
              >
                {{ compensationHistories.length }} changes
              </span>
            </div>

            <div class="history-timeline">
              <div v-if="loadingHistory" class="history-loading">
                <div class="spinner-small"></div>
                <span>Loading history...</span>
              </div>

              <div
                v-else-if="compensationHistories.length === 0"
                class="history-empty"
              >
                <div class="empty-icon">📋</div>
                <p>No compensation changes recorded</p>
                <span class="history-hint"
                  >When salary or allowances are updated, changes will appear
                  here</span
                >
              </div>

              <div v-else class="timeline-container">
                <div
                  v-for="(history, index) in compensationHistories"
                  :key="history.id"
                  class="timeline-item"
                >
                  <div
                    class="timeline-marker"
                    :class="
                      history.changeType === 'increase'
                        ? 'marker-increase'
                        : 'marker-decrease'
                    "
                  >
                    <span class="marker-icon">{{
                      history.changeType === "increase" ? "↑" : "↓"
                    }}</span>
                  </div>

                  <div class="timeline-content">
                    <div class="timeline-header">
                      <div class="timeline-date">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {{ formatDate(history.changeDate) }}
                      </div>
                      <div
                        class="timeline-badge"
                        :class="
                          history.changeType === 'increase'
                            ? 'badge-increase'
                            : 'badge-decrease'
                        "
                      >
                        {{ history.changeType === "increase" ? "+" : ""
                        }}{{ formatPercentage(history.percentageChange) }}%
                      </div>
                    </div>

                    <div class="timeline-component">
                      <div class="component-icon">
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
                      <span class="component-name">{{
                        history.component
                      }}</span>
                    </div>

                    <div class="timeline-values">
                      <div class="old-value-box">
                        <span class="value-label">From</span>
                        <span class="old-value">{{
                          formatCurrency(history.oldValue)
                        }}</span>
                      </div>
                      <div class="value-arrow">→</div>
                      <div
                        class="new-value-box"
                        :class="
                          history.changeType === 'increase'
                            ? 'increase'
                            : 'decrease'
                        "
                      >
                        <span class="value-label">To</span>
                        <span class="new-value">{{
                          formatCurrency(history.newValue)
                        }}</span>
                      </div>
                      <div
                        class="value-difference"
                        :class="
                          history.changeType === 'increase'
                            ? 'diff-increase'
                            : 'diff-decrease'
                        "
                      >
                        {{ history.changeType === "increase" ? "▲" : "▼" }}
                        {{ formatCurrency(history.difference) }}
                      </div>
                    </div>

                    <div v-if="history.reason" class="timeline-reason">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                        />
                      </svg>
                      <span>{{ history.reason }}</span>
                    </div>

                    <div class="timeline-footer">
                      <div class="submitted-by">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        {{ history.submittedBy }}
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="index < compensationHistories.length - 1"
                    class="timeline-connector"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Documents Card -->
          <div class="info-card documents-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                  />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
              </div>
              <h3>Documents</h3>
            </div>
            <div class="documents-list">
              <div class="document-row">
                <div class="document-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div class="document-info">
                  <span class="document-name">ID Card</span
                  ><span
                    class="document-status"
                    :class="documents.id_card ? 'uploaded' : 'missing'"
                    >{{ documents.id_card ? "Uploaded" : "Not provided" }}</span
                  >
                </div>
                <a
                  v-if="documents.id_card"
                  :href="documents.id_card.fileUrl"
                  target="_blank"
                  class="document-link"
                  :title="documents.id_card.fileName"
                  >View →</a
                >
              </div>
              <div class="document-row">
                <div class="document-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div class="document-info">
                  <span class="document-name">CV / Resume</span
                  ><span
                    class="document-status"
                    :class="documents.cv ? 'uploaded' : 'missing'"
                    >{{ documents.cv ? "Uploaded" : "Not provided" }}</span
                  >
                </div>
                <a
                  v-if="documents.cv"
                  :href="documents.cv.fileUrl"
                  target="_blank"
                  class="document-link"
                  :title="documents.cv.fileName"
                  >View →</a
                >
              </div>
              <div class="document-row">
                <div class="document-icon">
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
                <div class="document-info">
                  <span class="document-name">Degree / Certificate</span
                  ><span
                    class="document-status"
                    :class="documents.degree ? 'uploaded' : 'missing'"
                    >{{ documents.degree ? "Uploaded" : "Not provided" }}</span
                  >
                </div>
                <a
                  v-if="documents.degree"
                  :href="documents.degree.fileUrl"
                  target="_blank"
                  class="document-link"
                  :title="documents.degree.fileName"
                  >View →</a
                >
              </div>
              <div class="document-row guarantee-row">
                <div class="document-icon">
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
                <div class="document-info">
                  <span class="document-name">Guarantee Letters</span
                  ><span
                    class="document-status"
                    :class="
                      documents.guarantee_letters?.length
                        ? 'uploaded'
                        : 'missing'
                    "
                    >{{
                      documents.guarantee_letters?.length
                        ? `${documents.guarantee_letters.length} file(s)`
                        : "Not provided"
                    }}</span
                  >
                </div>
                <div
                  v-if="documents.guarantee_letters?.length"
                  class="document-links"
                >
                  <a
                    v-for="(doc, idx) in documents.guarantee_letters"
                    :key="idx"
                    :href="doc.fileUrl"
                    target="_blank"
                    :title="doc.fileName"
                    >Letter {{ idx + 1 }} →</a
                  >
                </div>
              </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import EmployeesService from "@/stores/employee";

const route = useRoute();
const employee = ref(null);
const documents = ref({
  id_card: null,
  cv: null,
  degree: null,
  guarantee_letters: [],
});
const compensationHistories = ref([]);
const loading = ref(true);
const loadingHistory = ref(false);

const employeeId = route.params.id;

// Computed properties for allowances
const totalAllowances = computed(() => {
  if (!employee.value) return 0;
  const housing = parseFloat(employee.value?.housingAllowance) || 0;
  const position = parseFloat(employee.value?.positionAllowance) || 0;
  const transport = parseFloat(employee.value?.transportAllowance) || 0;
  const mobile = parseFloat(employee.value?.mobileAllowance) || 0;
  return housing + position + transport + mobile;
});

const grossPay = computed(() => {
  if (!employee.value) return 0;
  const basic = parseFloat(employee.value?.basicSalary) || 0;
  return basic + totalAllowances.value;
});

// Safe formatting functions
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `ETB ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0.0";
  return Number(value).toFixed(1);
};

const getEmploymentTypeLabel = (type) => {
  const labels = {
    "full-time": "Full Time",
    "part-time": "Part Time",
    contract: "Contract",
    intern: "Intern",
  };
  return labels[type] || type || "—";
};

const getStatusLabel = (status) => {
  const labels = {
    active: "Active",
    "on-leave": "On Leave",
    terminated: "Terminated",
  };
  return labels[status] || status || "—";
};

const getAvatarUrl = (name) => {
  if (!name)
    return "https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=User";
  return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name)}`;
};

const formatDate = (date) => {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "—";
  }
};

const capitalize = (str) => {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const handleImageError = (e) => {
  e.target.src = getAvatarUrl(employee.value?.fullName || "Employee");
};

// Load compensation history
const loadCompensationHistory = async () => {
  loadingHistory.value = true;
  try {
    const response =
      await EmployeesService.getEmployeeCompensationHistory(employeeId);
    if (response.success) {
      compensationHistories.value = response.data || [];
    }
  } catch (error) {
    console.error("Failed to load compensation history:", error);
    compensationHistories.value = [];
  } finally {
    loadingHistory.value = false;
  }
};

// Load employee data
const loadEmployeeData = async () => {
  loading.value = true;
  try {
    const result = await EmployeesService.getEmployeeById(employeeId);

    if (result.success && result.data) {
      const empData = result.data;

      employee.value = {
        id: empData.id,
        employeeId: empData.employeeId,
        fullName: empData.fullName,
        firstName: empData.firstName,
        lastName: empData.lastName,
        middleName: empData.middleName,
        email: empData.email,
        personalEmail: empData.personalEmail,
        phone: empData.phone,
        dob: empData.dob,
        gender: empData.gender,
        maritalStatus: empData.maritalStatus,
        nationality: empData.nationality,
        departmentId: empData.departmentId,
        departmentName: empData.departmentName,
        position: empData.position,
        employmentType: empData.employmentType,
        status: empData.status,
        hireDate: empData.hireDate,
        confirmationDate: empData.confirmationDate,
        basicSalary: empData.basicSalary || empData.salary,
        housingAllowance: empData.housingAllowance || 0,
        positionAllowance: empData.positionAllowance || 0,
        transportAllowance: empData.transportAllowance || 0,
        mobileAllowance: empData.mobileAllowance || 0,
        address: empData.address?.street || empData.address,
        workLocation: empData.workLocation,
        managerName: empData.managerName,
        profilePicture: empData.profilePicture,
        emergencyContact: empData.emergencyContact,
        bankAccount: empData.bankAccount,
      };

      if (empData.documents) {
        documents.value = empData.documents;
      } else {
        const docsResult = await EmployeesService.getDocuments(employeeId);
        if (docsResult.success && docsResult.data) {
          documents.value = docsResult.data;
        }
      }
    }
  } catch (error) {
    console.error("Error loading employee:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadEmployeeData();
  loadCompensationHistory();
});
</script>

<style scoped>
/* Redesigned History Card Styles */
.history-card {
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

.history-count {
  margin-left: auto;
  font-size: 11px;
  background: #e2e8f0;
  padding: 2px 10px;
  border-radius: 20px;
  color: #475569;
}

/* Timeline Styles */
.history-timeline {
  padding: 20px 24px;
  max-height: 550px;
  overflow-y: auto;
}

.timeline-container {
  position: relative;
}

.timeline-item {
  display: flex;
  position: relative;
  margin-bottom: 24px;
}

.timeline-marker {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  z-index: 2;
  position: relative;
}

.marker-increase {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.marker-decrease {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.marker-icon {
  font-size: 16px;
  font-weight: bold;
  color: white;
}

.timeline-connector {
  position: absolute;
  left: 17px;
  top: 50px;
  width: 2px;
  height: calc(100% + 10px);
  background: linear-gradient(
    180deg,
    #e2e8f0 0%,
    #e2e8f0 70%,
    transparent 100%
  );
  z-index: 1;
}

.timeline-content {
  flex: 1;
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s;
  border: 1px solid #eef2ff;
}

.timeline-content:hover {
  background: white;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}

.timeline-date svg {
  width: 12px;
  height: 12px;
}

.timeline-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.badge-increase {
  background: #d1fae5;
  color: #059669;
}

.badge-decrease {
  background: #fee2e2;
  color: #dc2626;
}

.timeline-component {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.component-icon svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}

.component-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.timeline-values {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.old-value-box,
.new-value-box {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  background: white;
}

.old-value-box {
  border-left: 3px solid #94a3b8;
}

.new-value-box.increase {
  border-left: 3px solid #10b981;
}

.new-value-box.decrease {
  border-left: 3px solid #ef4444;
}

.value-label {
  display: block;
  font-size: 9px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.old-value {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-decoration: line-through;
}

.new-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.new-value-box.increase .new-value {
  color: #10b981;
}

.new-value-box.decrease .new-value {
  color: #ef4444;
}

.value-arrow {
  font-size: 16px;
  color: #94a3b8;
  font-weight: bold;
}

.value-difference {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  background: white;
}

.diff-increase {
  color: #10b981;
  background: #d1fae5;
}

.diff-decrease {
  color: #ef4444;
  background: #fee2e2;
}

.timeline-reason {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f1f5f9;
  padding: 10px 12px;
  border-radius: 10px;
  margin: 12px 0;
}

.timeline-reason svg {
  width: 14px;
  height: 14px;
  color: #6366f1;
  flex-shrink: 0;
  margin-top: 2px;
}

.timeline-reason span {
  font-size: 11px;
  color: #475569;
  line-height: 1.4;
}

.timeline-footer {
  display: flex;
  justify-content: flex-end;
}

.submitted-by {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #94a3b8;
}

.submitted-by svg {
  width: 12px;
  height: 12px;
}

/* Loading State */
.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #94a3b8;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Empty State */
.history-empty {
  text-align: center;
  padding: 50px 30px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.history-empty p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #64748b;
}

.history-hint {
  font-size: 11px;
  color: #94a3b8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* History Card Styles */
.history-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.history-list {
  padding: 20px 24px;
  max-height: 450px;
  overflow-y: auto;
}

.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #94a3b8;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.history-item {
  padding: 14px 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-size: 11px;
  color: #94a3b8;
  min-width: 90px;
}

.history-component {
  min-width: 130px;
}

.component-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

.history-values {
  display: flex;
  align-items: center;
  gap: 6px;
}

.old-value {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 12px;
}

.arrow {
  color: #94a3b8;
  font-size: 12px;
}

.new-value {
  font-weight: 600;
  color: #10b981;
  font-size: 13px;
}

.change-increase {
  color: #10b981;
  font-size: 12px;
  font-weight: 500;
  min-width: 70px;
}

.change-decrease {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
  min-width: 70px;
}

.history-difference {
  font-size: 12px;
  min-width: 80px;
  font-weight: 500;
  color: #64748b;
}

.history-reason {
  font-size: 11px;
  color: #64748b;
  flex: 1;
  min-width: 150px;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 6px;
}

.history-submitted {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #94a3b8;
  min-width: 100px;
}

.history-submitted svg {
  width: 12px;
  height: 12px;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.history-empty svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: #cbd5e1;
}

.history-empty p {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #64748b;
}

.history-hint {
  font-size: 11px;
  color: #94a3b8;
}

/* Rest of your existing styles remain the same */
/* ... all your existing CSS styles from the original EmployeeDetail.vue ... */

/* ============================================
   MAIN CONTAINER
   ============================================ */
.employee-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
}

/* ============================================
   LOADING STATE
   ============================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 16px;
}

.loading-state p {
  color: #64748b;
  font-size: 14px;
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

/* ============================================
   ACTION BAR
   ============================================ */
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

/* ============================================
   HERO SECTION
   ============================================ */
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
}

.employee-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.online-status {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;
}

.online-status.active {
  background: #10b981;
}
.online-status.on-leave {
  background: #f59e0b;
}
.online-status.terminated {
  background: #ef4444;
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

.status-indicator {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
}

.status-indicator.active {
  background: #10b98115;
  color: #10b981;
}
.status-indicator.on-leave {
  background: #f59e0b15;
  color: #f59e0b;
}
.status-indicator.terminated {
  background: #ef444415;
  color: #ef4444;
}

/* ============================================
   STATS CARDS
   ============================================ */
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

/* ============================================
   CONTENT GRID
   ============================================ */
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

/* ============================================
   INFO CARDS
   ============================================ */
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

/* ============================================
   INFO LIST
   ============================================ */
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

.info-icon {
  width: 28px;
  color: #94a3b8;
}

.info-icon svg {
  width: 16px;
  height: 16px;
}

.info-label {
  width: 110px;
  font-size: 13px;
  color: #64748b;
}

.info-value {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* ============================================
   ADDRESS CARD
   ============================================ */
.address-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.address-card .card-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.address-card .card-header-icon {
  background: rgba(255, 255, 255, 0.2);
}

.address-card .card-header-icon svg {
  color: white;
}

.address-card .card-header h3 {
  color: white;
}

.address-content {
  padding: 24px;
}

.address-display {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.address-icon svg {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.8);
}

.address-text p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
}

.address-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30px;
  text-align: center;
}

.address-empty svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.5);
}

.address-empty span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* ============================================
   ALLOWANCES CARD
   ============================================ */
.allowances-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.allowances-content {
  padding: 20px 24px;
}

.allowance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.allowance-item.basic {
  margin-bottom: 4px;
}

.allowance-label {
  font-size: 13px;
  color: #64748b;
}

.allowance-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.allowance-item.total .allowance-value {
  color: #f59e0b;
  font-size: 16px;
}

.allowance-item.gross {
  margin-top: 4px;
}

.allowance-item.gross .allowance-label {
  font-weight: 600;
  color: #1e293b;
}

.allowance-value.gross-amount {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
}

.allowance-divider {
  height: 1px;
  background: #eef2ff;
  margin: 8px 0;
}

/* ============================================
   DOCUMENTS CARD
   ============================================ */
.documents-list {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.document-row:last-child {
  border-bottom: none;
}

.guarantee-row {
  flex-wrap: wrap;
}

.document-icon {
  width: 36px;
  height: 36px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-icon svg {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.document-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.document-status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
}

.document-status.uploaded {
  background: #10b98115;
  color: #10b981;
}

.document-status.missing {
  background: #f1f5f9;
  color: #94a3b8;
}

.document-link {
  font-size: 13px;
  color: #6366f1;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.document-link:hover {
  background: #f1f5f9;
}

.document-links {
  display: flex;
  gap: 12px;
  margin-left: 52px;
}

.document-links a {
  font-size: 13px;
  color: #6366f1;
  text-decoration: none;
}

.document-links a:hover {
  text-decoration: underline;
}

/* ============================================
   EMPTY STATE
   ============================================ */
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

.empty-state a {
  color: #6366f1;
  text-decoration: none;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .employee-detail {
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

  .employee-tags {
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-wrap: wrap;
  }

  .info-label {
    width: 100%;
  }

  .document-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .guarantee-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .document-links {
    margin-left: 52px;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
