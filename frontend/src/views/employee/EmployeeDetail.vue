<template>
  <div class="employee-detail">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ $t("common.loading") || "Loading employee information..." }}</p>
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
          {{ $t("common.backToList") || "Back to List" }}
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
          {{ $t("common.editEmployee") || "Edit Employee" }}
        </router-link>
      </div>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-left">
          <div class="employee-avatar-large">
            <img
              :src="
                employee.profilePictureUrl || getAvatarUrl(employee.fullName)
              "
              :alt="employee.fullName"
              @error="handleImageError"
            />
            <div class="online-status" :class="employee.status"></div>
          </div>
          <div class="employee-basic">
            <h1>{{ employee.fullName || employee.fullNameEnglish  }}</h1>
            <div class="employee-tags">
              <span class="tag">{{ employee.position || "N/A" }}</span>
              <span class="tag">{{ employee.departmentName || "N/A" }}</span>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <div class="employee-code">
            <span class="code-label">{{
              $t("employee.employeeId") || "Employee ID"
            }}</span>
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
            <span class="stat-label">{{
              $t("employee.department") || "Department"
            }}</span>
            <span class="stat-number">{{
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
            <span class="stat-label">{{
              $t("employee.hireDate") || "Hire Date"
            }}</span>
            <span class="stat-number">{{
              formatDate(employee.hireDateEC)
            }} {{ $t('calendar.ec') || 'E.C' }}</span>
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
            <span class="stat-label">{{
              $t("employee.employmentType") || "Employment Type"
            }}</span>
            <span class="stat-number">{{
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
            <span class="stat-label">{{
              $t("employee.basicSalary") || "Basic Salary"
            }}</span>
            <span class="stat-number">{{
              formatCurrency(employee.basicSalary)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
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
              <h3>
                {{ $t("employee.personalInfo") || "Personal Information" }}
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.fullName") || "Full Name"
                }}</span>
                <span class="info-value">{{employee.fullNameEnglish || employee.fullName  }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.workEmail") || "Work Email"
                }}</span>
                <span class="info-value">{{
                  employee.email || employee.workEmail || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.personalEmail") || "Personal Email"
                }}</span>
                <span class="info-value">{{
                  employee.personalEmail || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.phone") || "Phone"
                }}</span>
                <span class="info-value">{{
                  employee.phone || employee.phoneNumber || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.dateOfBirth") || "Date of Birth"
                }}</span>
                <span class="info-value">{{
                  formatDate(employee.dateOfBirthEC) || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.gender") || "Gender"
                }}</span>
                <span class="info-value">{{
                  getGenderLabel(employee.gender)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.maritalStatus") || "Marital Status"
                }}</span>
                <span class="info-value">{{
                  getMaritalStatusLabel(employee.maritalStatus)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.nationality") || "Nationality"
                }}</span>
                <span class="info-value">{{
                  getNationalityLabel(employee.nationality)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.nationalId") || "National ID (FAN)"
                }}</span>
                <span class="info-value">
                  {{ employee.nationalId || "—" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Birth Place Card -->
          <div
            class="info-card"
            v-if="
              employee.birthPlace && Object.keys(employee.birthPlace).length
            "
          >
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
              <h3>{{ $t("employee.birthPlace") || "Birth Place" }}</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.region") || "Region"
                }}</span>
                <span class="info-value">{{
                  employee.birthPlace.region || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.city") || "City"
                }}</span>
                <span class="info-value">{{
                  employee.birthPlace.city || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span>
                <span class="info-value">{{
                  employee.birthPlace.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span>
                <span class="info-value">{{
                  employee.birthPlace.district || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Current Company Card -->
          <div
            class="info-card"
            v-if="
              employee.currentCompany &&
              Object.keys(employee.currentCompany).length
            "
          >
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
              <h3>{{ $t("company.currentCompany") || "Current Company" }}</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.name") || "Company Name"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.companyName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.tin") || "TIN Number"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.companyTin || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.phone") || "Phone"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.companyPhone || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.email") || "Email"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.companyEmail || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.address") || "Address"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.companyAddress || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.poBox") || "PO Box"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.poBox || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.website") || "Website"
                }}</span>
                <span class="info-value">{{
                  employee.currentCompany.website || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Current Address Card -->
          <div
            class="info-card"
            v-if="
              employee.currentAddress &&
              Object.keys(employee.currentAddress).length
            "
          >
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
              <h3>{{ $t("address.currentAddress") || "Current Address" }}</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.region") || "Region"
                }}</span>
                <span class="info-value">{{
                  employee.currentAddress.region || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span>
                <span class="info-value">{{
                  employee.currentAddress.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.kebele") || "Kebele"
                }}</span>
                <span class="info-value">{{
                  employee.currentAddress.kebele || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span>
                <span class="info-value">{{
                  employee.currentAddress.district || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.poBox") || "PO Box"
                }}</span>
                <span class="info-value">{{
                  employee.currentAddress.poBox || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.houseNumber") || "House Number"
                }}</span>
                <span class="info-value">{{
                  employee.currentAddress.houseNumber || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Permanent Address Card -->
          <div
            class="info-card"
            v-if="
              employee.permanentAddress &&
              Object.keys(employee.permanentAddress).length
            "
          >
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
              <h3>
                {{ $t("address.permanentAddress") || "Permanent Address" }}
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.region") || "Region"
                }}</span>
                <span class="info-value">{{
                  employee.permanentAddress.region || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span>
                <span class="info-value">{{
                  employee.permanentAddress.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.kebele") || "Kebele"
                }}</span>
                <span class="info-value">{{
                  employee.permanentAddress.kebele || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span>
                <span class="info-value">{{
                  employee.permanentAddress.district || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.poBox") || "PO Box"
                }}</span>
                <span class="info-value">{{
                  employee.permanentAddress.poBox || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.houseNumber") || "House Number"
                }}</span>
                <span class="info-value">{{
                  employee.permanentAddress.houseNumber || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Emergency Contact Card -->
          <div
            class="info-card emergency-card"
            v-if="
              employee.emergencyContact &&
              Object.keys(employee.emergencyContact).length
            "
          >
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
              <h3>
                {{ $t("family.emergencyContact") || "Emergency Contact" }}
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("family.contactName") || "Contact Name"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContact.name || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("family.relationship") || "Relationship"
                }}</span>
                <span class="info-value">{{
                  getRelationshipLabel(employee.emergencyContact?.relationship)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("family.phoneNumber") || "Phone"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContact.phone || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("family.alternatePhone") || "Alternate Phone"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContact.alternatePhone || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Emergency Contact Address Card -->
          <div
            class="info-card"
            v-if="
              employee.emergencyContactAddress &&
              Object.keys(employee.emergencyContactAddress).length
            "
          >
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
              <h3>
                {{
                  $t("family.emergencyAddress") || "Emergency Contact Address"
                }}
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.city") || "City"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContactAddress.city || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContactAddress.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContactAddress.district || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.kebele") || "Kebele"
                }}</span>
                <span class="info-value">{{
                  employee.emergencyContactAddress.kebele || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Education Card -->
          <div
            class="info-card"
            v-if="employee.education && employee.education.length"
          >
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
              <h3>
                {{ $t("education.title") || "Education" }} ({{
                  employee.education.length
                }})
              </h3>
            </div>
            <div class="education-list">
              <div
                v-for="(edu, idx) in employee.education"
                :key="idx"
                class="education-item"
              >
                <div class="edu-header">
                  <strong>{{ getEducationLevelLabel(edu.level) }}</strong> - {{ edu.institutionName }}
                </div>
                <div class="edu-details">
                  {{ formatDate(edu.startDateEC) }} {{ $t("common.to") || "to" }}
                  {{ edu.isCurrent ? "Present" : formatDate(edu.endDateEC) }}
                </div>
                <div class="edu-address">{{ edu.institutionAddress }}</div>
              </div>
            </div>
          </div>

          <!-- Training Card -->
          <div
            class="info-card"
            v-if="employee.training && employee.training.length"
          >
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
              <h3>
                {{ $t("training.title") || "Training" }} ({{
                  employee.training.length
                }})
              </h3>
            </div>
            <div class="training-list">
              <div
                v-for="(train, idx) in employee.training"
                :key="idx"
                class="training-item"
              >
                <div class="training-header">
                  <strong>{{ train.trainingName }}</strong>
                </div>
                <div class="training-details">
                  {{ train.institutionName }} | {{ formatDate(train.startDateEC) }} {{ $t("common.to") || "to" }}
                  {{ formatDate(train.endDateEC) }}
                </div>
                <div class="training-address">
                  {{ train.institutionAddress }}
                </div>
              </div>
            </div>
          </div>

          <!-- Bank Account Card -->
          <div
            class="info-card bank-card"
            v-if="
              employee.bankAccount && Object.keys(employee.bankAccount).length
            "
          >
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
              <h3>{{ $t("bank.title") || "Bank Account" }}</h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.bankName") || "Bank Name"
                }}</span>
                <span class="info-value">{{
                  employee.bankAccount.bankName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.accountNumber") || "Account Number"
                }}</span>
                <span class="info-value">{{
                  employee.bankAccount.accountNumber || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.accountHolderName") || "Account Holder"
                }}</span>
                <span class="info-value">{{
                  employee.bankAccount.accountHolderName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.branch") || "Branch"
                }}</span>
                <span class="info-value">{{
                  employee.bankAccount.branch || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Nationality Acquisition Card -->
          <div class="info-card" v-if="employee.nationalityAcquisition">
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
              <h3>
                {{ $t("nationality.title") || "Nationality Acquisition" }}
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("nationality.type") || "Type"
                }}</span>
                <span class="info-value">{{
                  getNationalityTypeLabel(employee.nationalityAcquisition.type)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Health & Legal Card -->
          <div
            class="info-card"
            v-if="employee.healthInfo || employee.legalInfo"
          >
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
              <h3>{{ $t("healthLegal.title") || "Health & Legal" }}</h3>
            </div>
            <div class="health-legal-content">
              <div class="health-section" v-if="employee.healthInfo">
                <h4>
                  {{ $t("healthLegal.healthTitle") || "Health Information" }}
                </h4>
                <div>
                  {{
                    $t("healthLegal.physicalInjury") ||
                    "Physical Injury/Disability"
                  }}: {{ employee.healthInfo.hasPhysicalInjury ? $t("common.yes") || "Yes" : $t("common.no") || "No" }}
                </div>
                <div v-if="employee.healthInfo.injuryDescription">
                  {{ employee.healthInfo.injuryDescription }}
                </div>
              </div>
              <div class="legal-section" v-if="employee.legalInfo">
                <h4>
                  {{ $t("healthLegal.legalTitle") || "Legal Information" }}
                </h4>
                <div>
                  {{ $t("healthLegal.criminalRecord") || "Criminal Record" }}:
                  {{ employee.legalInfo.hasCriminalRecord ? $t("common.yes") || "Yes" : $t("common.no") || "No" }}
                </div>
                <div v-if="employee.legalInfo.criminalRecordDescription">
                  {{ employee.legalInfo.criminalRecordDescription }}
                </div>
              </div>
            </div>
          </div>

          <!-- Language Skills Card -->
          <div
            class="info-card"
            v-if="employee.languageSkills && employee.languageSkills.length"
          >
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
              <h3>{{ $t("skills.title") || "Language Skills" }}</h3>
            </div>
            <div class="skills-list">
              <div
                v-for="(lang, idx) in employee.languageSkills"
                :key="idx"
                class="skill-tag"
              >
                {{ getLanguageLabel(lang.language) }} - {{ getProficiencyLabel(lang.proficiency) }}
              </div>
            </div>
            <div v-if="employee.otherSkills" class="other-skills">
              <strong>{{ $t("skills.otherTitle") || "Other Skills" }}:</strong>
              {{ employee.otherSkills }}
            </div>
          </div>
        
          <!-- Guarantee Information Card -->
          <div
            class="info-card"
            v-if="employee.guaranteeInfo && employee.guaranteeInfo.length"
          >
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
              <h3>
                {{ $t("guarantee.title") || "Guarantors" }} ({{
                  employee.guaranteeInfo.length
                }})
              </h3>
            </div>
            <div class="guarantee-list">
              <div
                v-for="(guarantor, idx) in employee.guaranteeInfo"
                :key="idx"
                class="guarantor-card-item"
              >
                <div class="guarantor-header">
                  <strong>{{ guarantor.guarantorName }}</strong> -
                  {{ guarantor.guarantorJob }}
                </div>
                <div class="guarantor-details">
                  <div>
                    {{ $t("guarantee.guarantorOfficeName") || "Office" }}:
                    {{ guarantor.guarantorOfficeName }}
                  </div>
                  <div>
                    {{ $t("guarantee.guarantorOfficeAddress") || "Address" }}:
                    {{ guarantor.guarantorOfficeAddress }}
                  </div>
                  <div>
                    {{ $t("guarantee.letterNumber") || "Guarantee Letter" }}:
                    {{ guarantor.guaranteeLetterNo }} ({{
                      formatDate(guarantor.guaranteeLetterDateEC)
                    }}) {{ $t('calendar.ec') || 'E.C' }}
                  </div>
                  <div>
                    {{ $t("guarantee.sdtLetterNumber") || "SDT Letter" }}:
                    {{ guarantor.sdtLetterNo }} ({{
                      formatDate(guarantor.sdtLetterDateEC) }}) {{ $t('calendar.ec') || 'E.C' }}
                  </div>
                  <div>
                    {{ $t("guarantee.confirmedDateEC") || "guarentee Confrimation Date " }}:
                    {{ formatDate(guarantor.confirmedDateEC) }} {{ $t('calendar.ec') || 'E.C' }}
                  </div>
                </div>
              </div>
            </div>
         
          </div>
        
        </div>

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
              <h3>
                {{ $t("employee.employmentInfo") || "Employment Information" }}
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.department") || "Department"
                }}</span>
                <span class="info-value">{{
                  employee.departmentName || "N/A"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.position") || "Position"
                }}</span>
                <span class="info-value">{{
                  employee.position || "N/A"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.employmentType") || "Employment Type"
                }}</span>
                <span class="info-value">{{
                  getEmploymentTypeLabel(employee.employmentType)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.hireDate") || "Hire Date"
                }}</span>
                <span class="info-value">{{
                  formatDate(employee.hireDateEC)
                }} {{ $t('calendar.ec') || 'E.C' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.manager") || "Manager"
                }}</span>
                <span class="info-value">{{
                  employee.managerName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.workLocation") || "Work Location"
                }}</span>
                <span class="info-value">{{
                  employee.workLocation || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.shiftType") || "Shift Type"
                }}</span>
                <span class="info-value">{{
                  getShiftTypeLabel(employee.shiftType)
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
              <h3>
                {{
                  $t("employee.compensationAllowances") ||
                  "Compensation & Allowances"
                }}
              </h3>
            </div>
            <div class="allowances-content">
              <div class="allowance-item basic">
                <div class="allowance-label">
                  {{ $t("employee.basicSalary") || "Basic Salary" }}
                </div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.basicSalary) }}
                </div>
              </div>
              <div class="allowance-divider"></div>
              <div class="allowance-item">
                <div class="allowance-label">
                  {{ $t("employee.housingAllowance") || "Housing Allowance" }}
                </div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.housingAllowance) }}
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">
                  {{ $t("employee.positionAllowance") || "Position Allowance" }}
                </div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.positionAllowance) }}
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">
                  {{
                    $t("employee.transportAllowance") || "Transport Allowance"
                  }}
                </div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.transportAllowance) }}
                </div>
              </div>
              <div class="allowance-item">
                <div class="allowance-label">
                  {{ $t("employee.mobileAllowance") || "Mobile Allowance" }}
                </div>
                <div class="allowance-value">
                  {{ formatCurrency(employee.mobileAllowance) }}
                </div>
              </div>
              <div class="allowance-divider"></div>
              <div class="allowance-item total">
                <div class="allowance-label">
                  {{ $t("employee.totalAllowances") || "Total Allowances" }}
                </div>
                <div class="allowance-value">
                  {{ formatCurrency(totalAllowances) }}
                </div>
              </div>
              <div class="allowance-item gross">
                <div class="allowance-label">
                  {{ $t("employee.grossPay") || "Gross Monthly Pay" }}
                </div>
                <div class="allowance-value gross-amount">
                  {{ formatCurrency(grossPay) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Spouse Information Card -->
          <div
            class="info-card"
            v-if="
              employee.spouseInfo && Object.keys(employee.spouseInfo).length
            "
          >
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
              <h3>{{ $t("family.spouse") || "Spouse Information" }}</h3>
            </div>
            <div class="spouse-layout">
              <div class="spouse-avatar">
                <img
                  v-if="
                    getDocumentWithIndex('spouse_profile', 0) ||
                    getDocumentUrl('spouse_profile')
                  "
                  :src="
                    getDocumentWithIndex('spouse_profile', 0) ||
                    getDocumentUrl('spouse_profile')
                  "
                  :alt="employee.spouseInfo?.fullName || 'Spouse'"
                  @error="
                    (e) =>
                      (e.target.src = getAvatarUrl(
                        employee.spouseInfo?.fullName || 'Spouse',
                      ))
                  "
                />
                <div v-else class="spouse-avatar-placeholder">
                  {{ employee.spouseInfo?.fullName?.charAt(0) || "S" }}
                </div>
              </div>
              <div class="spouse-info">
                <div class="spouse-name">
                  {{ employee.spouseInfo.fullName || "—" }}
                </div>
                <div class="spouse-detail">
                  <span>{{ $t("family.tinNumber") || "TIN Number" }}:</span>
                  {{ employee.spouseInfo.tinNumber || "—" }}
                </div>
                <div class="spouse-detail">
                  <span
                    >{{ $t("family.dateOfBirth") || "Date of Birth" }}:</span
                  >
                  {{ formatDate(employee.spouseInfo.dateOfBirthEC) || "—" }} E.C
                </div>
                <div class="spouse-detail">
                  <span>{{ $t("family.jobStatus") || "Job Status" }}:</span>
                  {{ getJobStatusLabel(employee.spouseInfo.jobStatus) }}
                </div>
                <div class="spouse-detail">
                  <span>{{ $t("family.companyName") || "Company Name" }}:</span>
                  {{ employee.spouseInfo.companyName || "—" }}
                </div>
                <div class="spouse-detail">
                  <span
                    >{{
                      $t("family.companyAddress") || "Company Address"
                    }}:</span
                  >
                  {{ employee.spouseInfo.companyAddress || "—" }}
                </div>
              </div>
            </div>
          </div>

          <!-- Children Information Card -->
          <div
            class="info-card"
            v-if="employee.children && employee.children.length"
          >
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
                </svg>
              </div>
              <h3>
                {{ $t("family.children") || "Children" }} ({{
                  employee.children.length
                }})
              </h3>
            </div>
            <div class="children-list">
              <div
                v-for="(child, idx) in employee.children"
                :key="idx"
                class="child-card"
              >
                <div class="child-avatar">
                  <img
                    v-if="getDocumentWithIndex('child_profile', idx)"
                    :src="getDocumentWithIndex('child_profile', idx)"
                    :alt="child.name"
                    @error="(e) => (e.target.src = getAvatarUrl(child.name))"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ child.name?.charAt(0) || "C" }}
                  </div>
                </div>
                <div class="child-info">
                  <div class="child-header">
                    <span class="child-name">{{ child.name }}</span>
                    <span class="child-age">
                      {{ calculateAgeFromEC(child.dateOfBirthEC) }}
                      {{ $t("family.years") || "years" }}
                    </span>
                  </div>
                  <div class="child-details">
                    <div>
                      <span class="child-label"
                        >{{
                          $t("family.dateOfBirth") || "Date of Birth"
                        }}:</span
                      >
                      {{ formatDate(child.dateOfBirthEC) }}
                    </div>
                    <div>
                      <span class="child-label"
                        >{{
                          $t("family.medicalCondition") || "Medical Condition"
                        }}:</span
                      >
                      {{ child.hasMedicalCondition ? $t("common.yes") || "Yes" : $t("common.no") || "No" }}
                    </div>
                    <div v-if="child.medicalConditionNotes">
                      <span class="child-label"
                        >{{ $t("family.notes") || "Notes" }}:</span
                      >
                      {{ child.medicalConditionNotes }}
                    </div>
                    <div>
                      <span class="child-label"
                        >{{ $t("family.adopted") || "Adopted" }}:</span
                      >
                      {{ child.isAdopted ? $t("common.yes") || "Yes" : $t("common.no") || "No" }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Parents Information Card -->
          <div
            class="info-card"
            v-if="
              employee.parentsInfo &&
              (employee.parentsInfo.father || employee.parentsInfo.mother)
            "
          >
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
              <h3>{{ $t("family.parents") || "Parents Information" }}</h3>
            </div>
            <div class="parents-container">
              <div class="parent-card">
                <div class="parent-icon">👨</div>
                <div class="parent-details">
                  <div class="parent-name">
                    {{ employee.parentsInfo.father?.fullName || "—" }}
                  </div>
                  <div class="parent-meta">
                    <span class="parent-job">{{
                      employee.parentsInfo.father?.job || "—"
                    }}</span>
                    <span class="parent-income"
                      >{{ $t("family.monthlyIncome") || "Monthly Income" }}:
                      {{
                        formatCurrency(
                          employee.parentsInfo.father?.monthlyIncome,
                        )
                      }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="parent-card">
                <div class="parent-icon">👩</div>
                <div class="parent-details">
                  <div class="parent-name">
                    {{ employee.parentsInfo.mother?.fullName || "—" }}
                  </div>
                  <div class="parent-meta">
                    <span class="parent-job">{{
                      employee.parentsInfo.mother?.job || "—"
                    }}</span>
                    <span class="parent-income"
                      >{{ $t("family.monthlyIncome") || "Monthly Income" }}:
                      {{
                        formatCurrency(
                          employee.parentsInfo.mother?.monthlyIncome,
                        )
                      }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <div
              class="support-section"
              v-if="
                (employee.parentsInfo.financialSupport &&
                  employee.parentsInfo.financialSupport !== 'Monthly 0 ETB') ||
                (employee.parentsInfo.otherSupport &&
                  employee.parentsInfo.otherSupport !== '') ||
                (employee.parentSupport && employee.parentSupport.length)
              "
            >
              <div
                class="simple-support"
                v-if="
                  employee.parentsInfo.financialSupport ||
                  employee.parentsInfo.otherSupport
                "
              >
                <div class="support-title">
                  💝 {{ $t("family.supportProvided") || "Support Provided" }}
                </div>
                <div
                  v-if="
                    employee.parentsInfo.financialSupport &&
                    employee.parentsInfo.financialSupport !== 'Monthly 0 ETB'
                  "
                  class="support-row"
                >
                  <span class="support-icon">💰</span>
                  <span class="support-text"
                    >{{ $t("family.financialSupport") || "Financial Support" }}:
                    {{ employee.parentsInfo.financialSupport }}</span
                  >
                </div>
                <div
                  v-if="
                    employee.parentsInfo.otherSupport &&
                    employee.parentsInfo.otherSupport !== ''
                  "
                  class="support-row"
                >
                  <span class="support-icon">🎁</span>
                  <span class="support-text"
                    >{{ $t("family.otherSupport") || "Other Support" }}:
                    {{ employee.parentsInfo.otherSupport }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Work Experience Card -->
          <div
            class="info-card"
            v-if="employee.workExperience && employee.workExperience.length"
          >
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
              <h3>
                {{ $t("employee.workExperience") || "Work Experience" }} ({{
                  employee.workExperience.length
                }})
              </h3>
            </div>
            <div class="work-list">
              <div
                v-for="(work, idx) in employee.workExperience"
                :key="idx"
                class="work-item"
              >
                <div class="work-header">
                  <strong>{{ work.position }}</strong> {{ $t("common.at")}} {{ work.companyName }}
                </div>
                <div class="work-dates">
                  {{ formatDate(work.startDateEC) }} {{ $t("common.to")}} {{ formatDate(work.endDateEC) }}
                </div>
                <div class="work-details">
                  <div>
                    {{ $t("employee.salary") || "Salary" }}:
                    {{ formatCurrency(work.monthlySalary) }} →
                    {{ formatCurrency(work.salaryWhenLeft) }}
                  </div>
                  <div>
                    {{ $t("employee.providentFund") || "Provident Fund" }}:
                    {{ work.providentFundSubmitted === "yes" ? $t("common.yes") || "Yes" : $t("common.no") || "No" }}
                  </div>
                  <div v-if="work.terminationReason">
                    {{
                      $t("employee.reasonForLeaving") || "Reason for leaving"
                    }}: {{ work.terminationReason }}
                  </div>
                </div>
              </div>
            </div>
          </div>

       
        </div>
      </div>

      <!-- NEW: Centralized Documents Section -->
      <div class="info-card documents-card full-width">
        <div class="card-header">
          <div class="card-header-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h3>{{ $t("documents.title") || "Employee Documents" }}</h3>
          <span class="history-count">{{ totalDocuments }} {{ $t("documents.files") || "files" }}</span>
        </div>
        
        <div class="documents-content">
          <div v-if="allDocuments.length === 0" class="documents-empty">
            <div class="empty-icon">📄</div>
            <p>{{ $t("documents.noFiles") || "No documents uploaded" }}</p>
            <span class="documents-hint">{{ $t("documents.hint") || "Employee documents will appear here when uploaded" }}</span>
          </div>
          
          <div v-else class="documents-table-wrapper">
            <table class="documents-table">
              <thead>
                <tr>
                  <th class="doc-col-icon">{{ $t("documents.type") || "Type" }}</th>
                  <th class="doc-col-name">{{ $t("documents.document") || "Document" }}</th>
                  <th class="doc-col-section">{{ $t("documents.section") || "Section" }}</th>
                  <th class="doc-col-description">{{ $t("documents.description") || "Description" }}</th>
                  <th class="doc-col-action">{{ $t("documents.action") || "Action" }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(doc, idx) in allDocuments" :key="idx" class="document-row">
                  <td class="doc-col-icon">
                    <span class="doc-icon">{{ doc.icon }}</span>
                  </td>
                  <td class="doc-col-name">
                    <span class="doc-name">{{ doc.label }}</span>
                  </td>
                  <td class="doc-col-section">
                    <span class="section-badge" :class="doc.sectionClass">
                      {{ doc.section }}
                    </span>
                  </td>
                  <td class="doc-col-description">
                    <span class="doc-description">{{ doc.description }}</span>
                  </td>
                  <td class="doc-col-action">
                    <a 
                      :href="doc.url" 
                      target="_blank" 
                      class="doc-action-btn"
                      :class="{ 'doc-action-btn-view': doc.url, 'doc-action-btn-disabled': !doc.url }"
                    >
                      <svg v-if="doc.url" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span v-if="doc.url">{{ $t("common.view") || "View" }}</span>
                      <span v-else>{{ $t("common.noFile") || "No file" }}</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============================================
           DEPARTMENT TRANSFER HISTORY CARD
           ============================================ -->
      <div class="info-card transfer-history-card full-width">
        <div class="card-header">
          <div class="card-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 3h5v5" />
              <path d="M8 3H3v5" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
              <path d="M16 21h5v-5" />
              <path d="M8 21H3v-5" />
            </svg>
          </div>
          <h3>{{ $t("employee.departmentTransfers") || "Department Transfer History" }}</h3>
          <span class="history-count" v-if="departmentTransfers.length > 0">
            {{ departmentTransfers.length }} {{ $t("employee.transfers") || "transfers" }}
          </span>
        </div>
        
        <div class="transfer-content">
          <div v-if="loadingTransfers" class="transfer-loading">
            <div class="spinner-small"></div>
            <span>{{ $t("common.loading") || "Loading..." }}</span>
          </div>
          
          <div v-else-if="departmentTransfers.length === 0" class="transfer-empty">
            <div class="empty-icon">🔄</div>
            <p>{{ $t("employee.noTransfers") || "No department transfers recorded" }}</p>
            <span class="transfer-hint">{{ $t("employee.transferHint") || "When an employee changes departments, the transfer will be recorded here" }}</span>
          </div>
          
          <div v-else class="transfer-table-wrapper">
            <table class="transfer-table">
              <thead>
                <tr>
                  <th class="transfer-col-date">{{ $t("employee.transferDate") || "Transfer Date" }}</th>
                  <th class="transfer-col-from">{{ $t("employee.fromDepartment") || "From Department" }}</th>
                  <th class="transfer-col-to">{{ $t("employee.toDepartment") || "To Department" }}</th>
                  <th class="transfer-col-reason">{{ $t("employee.reason") || "Reason" }}</th>
                  <th class="transfer-col-status">{{ $t("employee.status") || "Status" }}</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(transfer, idx) in departmentTransfers" 
                  :key="idx" 
                  class="transfer-row"
                  :class="{ 
                    'current-transfer': transfer.isCurrent,
                    'historical-transfer': transfer.isHistorical && !transfer.isCurrent
                  }"
                >
                  <td class="transfer-col-date">
                    <div class="transfer-date-cell">
                      <span class="transfer-date-day">{{ getTransferDay(transfer.transferDateEC) }}</span>
                      <span class="transfer-date-month">{{ getEthiopianMonthName(transfer.transferDateEC) }}</span>
                      <span class="transfer-date-year">{{ getTransferYear(transfer.transferDateEC) }}</span>
                    </div>
                  </td>
                  <td class="transfer-col-from">
                    <span class="department-badge from-dept">{{ transfer.fromDepartment || 'Unknown' }}</span>
                    <span class="transfer-arrow"> → </span>
                  </td>
                  <td class="transfer-col-to">
                    <span class="department-badge to-dept">{{ transfer.toDepartment || 'Unknown' }}</span>
                  </td>
                  <td class="transfer-col-reason">
                    <span class="transfer-reason">{{ transfer.reason || '—' }}</span>
                  </td>
                  <td class="transfer-col-status">
                    <span v-if="transfer.isCurrent" class="status-badge-transfer current">
                      {{ $t("employee.current") || "Current" }}
                    </span>
                    <span v-else-if="transfer.isHistorical" class="status-badge-transfer historical">
                      {{ $t("employee.historical") || "Historical" }}
                    </span>
                    <span v-else class="status-badge-transfer" :class="transfer.status">
                      {{ transfer.statusLabel }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Compensation History Card - NO SCROLL -->
      <div class="info-card history-card full-width">
        <div class="card-header">
          <div class="card-header-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
            </svg>
          </div>
          <h3>
            {{ $t("compensation.history") || "Compensation Change History" }}
          </h3>
          <span class="history-count" v-if="compensationHistories.length > 0"
            >{{ compensationHistories.length }}
            {{ $t("compensation.changes") || "changes" }}</span
          >
        </div>
        <div class="history-content-full no-scroll">
          <div v-if="loadingHistory" class="history-loading-full">
            <div class="spinner"></div>
            <span>{{
              $t("common.loading") || "Loading compensation history..."
            }}</span>
          </div>
          <div
            v-else-if="compensationHistories.length === 0"
            class="history-empty-full"
          >
            <div class="empty-icon">📋</div>
            <p>
              {{
                $t("compensation.noHistory") ||
                "No compensation changes recorded"
              }}
            </p>
            <span class="history-hint">{{
              $t("compensation.historyHint") ||
              "When salary or allowances are updated, changes will appear here"
            }}</span>
          </div>
          <div v-else class="history-table-wrapper no-scroll">
            <table class="history-table">
              <thead>
                <tr>
                  <th class="col-date">{{ $t("compensation.date") || "Date" }}</th>
                  <th class="col-component">{{ $t("compensation.component") || "Component" }}</th>
                  <th class="col-old">{{ $t("compensation.previous") || "Previous" }}</th>
                  <th class="col-new">{{ $t("compensation.new") || "New" }}</th>
                  <th class="col-change">{{ $t("compensation.change") || "Change" }}</th>
                
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="history in compensationHistories" 
                  :key="history.id"
                  :class="history.changeType"
                >
                  <td class="col-date">
                    <div class="date-cell">
                      <span class="date-day">{{ history.changeDay || '--' }}</span>
                      <span class="date-month">{{ history.changeMonth || '---' }}</span>
                      <span class="date-year">{{ history.changeYear || '----' }}</span>
                    </div>
                  </td>
                  <td class="col-component">
                    <span class="component-badge" :class="history.changeType">
                      {{ getComponentLabel(history.componentKey || history.component) }}
                    </span>
                  </td>
                  <td class="col-old">
                    <span class="old-amount">{{ formatCurrency(history.oldValue) }}</span>
                  </td>
                  <td class="col-new">
                    <span class="new-amount" :class="history.changeType">
                      {{ formatCurrency(history.newValue) }}
                    </span>
                  </td>
                  <td class="col-change">
                    <div class="change-badge" :class="history.changeType">
                      <span class="change-icon">{{ history.changeType === "increase" ? "▲" : "▼" }}</span>
                      <span class="change-percent">{{ history.changeType === "increase" ? "+" : "" }}{{ formatPercentage(history.percentageChange) }}%</span>
                      <span class="change-diff">{{ formatCurrency(history.difference) }}</span>
                    </div>
                  </td>
                 
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
<br></br>
      <!-- Employment History Timeline Card - NO SCROLL -->
      <div class="info-card employment-history-card full-width">
        <div class="card-header">
          <div class="card-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
            </svg>
          </div>
          <h3>Employment History Timeline</h3>
          <span class="history-count" v-if="employmentHistory.length > 0">
            {{ employmentHistory.length }} {{ $t("compensation.changes") || "periods" }}
          </span>
        </div>
        
        <div class="history-content-full no-scroll">
          <div v-if="loadingTerminationHistory" class="history-loading-full">
            <div class="spinner"></div>
            <span>Loading employment history...</span>
          </div>

          <div v-else-if="employmentHistory.length === 0" class="history-empty-full">
            <div class="empty-icon">📋</div>
            <p>No employment history records found</p>
            <span class="history-hint">Employee has been continuously employed since {{ employee.hireDateEC }} E.C</span>
          </div>

          <div v-else class="employment-table-wrapper no-scroll">
            <table class="employment-table">
              <thead>
                <tr>
                  <th class="col-period">{{ $t("employment.period") || "Period" }}</th>
                  <th class="col-status">{{ $t("employment.status") || "Status" }}</th>
                  <th class="col-dates">{{ $t("employment.dates") || "Dates" }}</th>
                  <th class="col-duration">{{ $t("employment.duration") || "Duration" }}</th>
                  <th class="col-details">{{ $t("employment.details") || "Details" }}</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(event, index) in employmentHistory" 
                  :key="index"
                  :class="event.type"
                >
                  <td class="col-period">
                    <div class="period-badge" :class="event.type">
                      <span class="period-icon">{{ event.icon }}</span>
                      <span class="period-label">{{ event.label }}</span>
                    </div>
                  </td>
                  <td class="col-status">
                    <span class="status-badge" :class="event.type">
                      {{ event.title }}
                    </span>
                    <span class="status-subtitle">{{ event.subtitle }}</span>
                  </td>
                  <td class="col-dates">
                    <div class="date-range">
                      <span class="start-date">{{ event.startDate }}</span>
                      <span class="end-date">{{ event.endDate || 'Present' }}</span>
                      <span class="calendar-tag">E.C</span>
                    </div>
                  </td>
                  <td class="col-duration">
                    <span class="duration-badge" :class="event.type">
                      <span class="duration-icon">⏱</span>
                      <span class="duration-text">{{ event.duration || 'Ongoing' }}</span>
                    </span>
                  </td>
                  <td class="col-details">
                    <div class="details-cell">
                      <div v-if="event.details?.department" class="detail-row">
                        <span class="detail-label">Dept:</span>
                        <span class="detail-value">{{ event.details.department }}</span>
                      </div>
                      <div v-if="event.details?.position" class="detail-row">
                        <span class="detail-label">Pos:</span>
                        <span class="detail-value">{{ event.details.position }}</span>
                      </div>
                      <div v-if="event.details?.salary" class="detail-row">
                        <span class="detail-label">Salary:</span>
                        <span class="detail-value">{{ formatCurrency(event.details.salary) }}</span>
                      </div>
                      <div v-if="event.details?.reason" class="detail-row reason-row">
                        <span class="detail-label">Reason:</span>
                        <span class="detail-value reason-text">{{ event.details.reason }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Current Status Banner -->
            <div v-if="employee.status === 'active'" class="current-status-banner">
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">Currently Employed - </span>
                <span class="status-date">Since {{ employee.hireDateEC }} E.C</span>
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
      <h3>{{ $t("messages.employeeNotFound") || "Employee Not Found" }}</h3>
      <router-link to="/employees">{{
        $t("common.returnToEmployees") || "Return to Employees"
      }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import EmployeesService from "@/stores/employee";

const route = useRoute();
const { t } = useI18n();
const employee = ref(null);
const compensationHistories = ref([]);
const loading = ref(true);
const loadingHistory = ref(false);
const loadingTransfers = ref(false);
const departmentTransfers = ref([]);
const employeeId = route.params.id;

const employmentHistory = ref([]);
const loadingTerminationHistory = ref(false);

// Helper function to calculate duration
const calculateDuration = (startEC, endEC) => {
  if (!startEC) return 'Unknown';
  
  const startParts = startEC.split('/');
  const startYear = parseInt(startParts[2]);
  const startMonth = parseInt(startParts[1]);
  
  let endYear, endMonth;
  let isPresent = false;
  
  if (!endEC || endEC === 'Present') {
    const now = new Date();
    const ecYear = now.getFullYear() - 8;
    const ecMonth = now.getMonth() + 1;
    endYear = ecYear;
    endMonth = ecMonth;
    isPresent = true;
  } else {
    const endParts = endEC.split('/');
    endYear = parseInt(endParts[2]);
    endMonth = parseInt(endParts[1]);
  }
  
  let years = endYear - startYear;
  let months = endMonth - startMonth;
  
  if (months < 0) {
    years--;
    months += 13;
  }
  
  if (years < 0) {
    years = 0;
    months = 0;
  }
  
  if (isPresent) {
    return `${years} yrs ${months} mos (ongoing)`;
  }
  
  if (years === 0 && months === 0) return 'Less than 1 month';
  if (years === 0) return `${months} months`;
  if (months === 0) return `${years} years`;
  return `${years} yrs ${months} mos`;
};

// Build employment history from termination data
const buildEmploymentHistory = (employee, terminationRecords) => {
  const history = [];
  
  const hireDate = employee.originalHireDateEC || employee.hireDateEC;
  
  const firstTermination = terminationRecords.length > 0 ? terminationRecords[terminationRecords.length - 1] : null;
  
  history.push({
    type: 'hired',
    icon: '📋',
    label: 'Hired',
    title: 'First Employment',
    subtitle: 'Initial Hire',
    startDate: hireDate,
    endDate: firstTermination ? firstTermination.terminationDateEC : 'Present',
    duration: firstTermination ? calculateDuration(hireDate, firstTermination.terminationDateEC) : calculateDuration(hireDate, null),
    details: {
      department: employee.departmentName || 'N/A',
      position: employee.position || 'N/A',
      salary: employee.basicSalary || 0
    }
  });
  
  let currentStartDate = hireDate;
  
  terminationRecords.forEach((record, index) => {
    const nextRecord = index < terminationRecords.length - 1 ? terminationRecords[index + 1] : null;
    
    history.push({
      type: 'terminated',
      icon: '❌',
      label: 'Terminated',
      title: 'Employment Ended',
      subtitle: record.terminationReason || 'Not specified',
      startDate: record.terminationDateEC,
      endDate: record.rehireDateEC || 'Present',
      duration: record.rehireDateEC ? calculateDuration(record.terminationDateEC, record.rehireDateEC) : 'Terminated',
      details: {
        department: employee.departmentName || 'N/A',
        position: employee.position || 'N/A',
        reason: record.terminationReason || 'Not specified',
        notes: record.terminationNotes || null
      }
    });
    
    if (record.isRehired && record.rehireDateEC) {
      const nextTermination = index > 0 ? terminationRecords[index - 1] : null;
      const endDate = nextTermination ? nextTermination.terminationDateEC : 'Present';
      
      history.push({
        type: 'rehired',
        icon: '✅',
        label: 'Rehired',
        title: 'Re-employment',
        subtitle: record.rehireReason || 'Rehired',
        startDate: record.rehireDateEC,
        endDate: endDate,
        duration: calculateDuration(record.rehireDateEC, endDate),
        details: {
          department: employee.departmentName || 'N/A',
          position: employee.position || 'N/A',
          salary: employee.basicSalary || 0,
          reason: record.rehireReason || 'Rehired',
          notes: record.rehireNotes || null
        }
      });
      
      currentStartDate = record.rehireDateEC;
    }
  });
  
  return history.sort((a, b) => {
    const aDate = a.startDate.split('/').reverse().join('');
    const bDate = b.startDate.split('/').reverse().join('');
    return bDate.localeCompare(aDate);
  });
};

// Load termination history
const loadTerminationHistory = async () => {
  loadingTerminationHistory.value = true;
  try {
    const response = await EmployeesService.getTerminationHistory(employeeId);
    if (response.success) {
      const terminationData = response.data?.history || [];
      employmentHistory.value = buildEmploymentHistory(employee.value, terminationData);
    }
  } catch (error) {
    console.error('Failed to load termination history:', error);
    employmentHistory.value = [];
  } finally {
    loadingTerminationHistory.value = false;
  }
};


const loadDepartmentTransfers = async () => {
  loadingTransfers.value = true;
  try {
    const response = await EmployeesService.getEmployeeDepartmentTransfers(employeeId);
    if (response.success && response.data) {
      const transfers = response.data.transfers || [];
      
      // Find the latest active transfer (current)
      const activeTransfers = transfers.filter(t => t.status === 'active');
      let currentTransferId = null;
      
      if (activeTransfers.length > 0) {
        // Sort by transfer date (newest first), then by id (newest first)
        const sorted = [...activeTransfers].sort((a, b) => {
          // First compare by date
          const dateA = a.transferDateEC.split('/').reverse().join('');
          const dateB = b.transferDateEC.split('/').reverse().join('');
          const dateCompare = dateB.localeCompare(dateA);
          
          // If dates are equal, compare by id (newer id = newer transfer)
          if (dateCompare === 0) {
            return b.id - a.id;
          }
          return dateCompare;
        });
        currentTransferId = sorted[0]?.id;
      }
      
      // Add flags to each transfer
      departmentTransfers.value = transfers.map(transfer => ({
        ...transfer,
        isCurrent: transfer.id === currentTransferId,
        isHistorical: transfer.status === 'active' && transfer.id !== currentTransferId
      }));
    }
  } catch (error) {
    console.error('Failed to load department transfers:', error);
    departmentTransfers.value = [];
  } finally {
    loadingTransfers.value = false;
  }
};

// Transfer date helpers
const getTransferDay = (date) => {
  if (!date) return '--';
  const parts = date.split('/');
  return parts[0] || '--';
};

// Ethiopian month names
const getEthiopianMonthName = (date) => {
  if (!date) return '---';
  const parts = date.split('/');
  if (parts.length < 2) return '---';
  
  const month = parseInt(parts[1]);
  const monthNames = [
    'መስከረም',   // 1 - Meskerem
    'ጥቅምት',     // 2 - Tikimt
    'ህዳር',      // 3 - Hidar
    'ታህሳስ',    // 4 - Tahsas
    'ጥር',       // 5 - Tir
    'የካቲት',    // 6 - Yekatit
    'መጋቢት',    // 7 - Megabit
    'ሚያዝያ',    // 8 - Miazia
    'ግንቦት',    // 9 - Genbot
    'ሰኔ',       // 10 - Sene
    'ሐምሌ',     // 11 - Hamle
    'ነሐሴ',     // 12 - Nehase
    'ጳጉሜ'      // 13 - Pagume
  ];
  
  if (month >= 1 && month <= 13) {
    return monthNames[month - 1];
  }
  return '---';
};

const getTransferYear = (date) => {
  if (!date) return '----';
  const parts = date.split('/');
  return parts[2] || '----';
};

// Helper method to get document URL by type (for single documents or first of indexed)
const getDocumentUrl = (type) => {
  const docs = employee.value?.documents;
  if (!docs) return null;

  const indexedKey = `${type}_0`;
  if (docs[indexedKey]) {
    return docs[indexedKey]?.fileUrl || null;
  }

  if (docs[type]) {
    if (Array.isArray(docs[type])) {
      return docs[type][0]?.fileUrl || null;
    }
    return docs[type]?.fileUrl || null;
  }

  return null;
};

// NEW: Get all documents as a flat array with meaningful descriptions
const allDocuments = computed(() => {
  const docs = employee.value?.documents;
  if (!docs) return [];

  const documentMap = [];
  const employeeData = employee.value;

  // Helper to get education level name
  const getEducationLevelName = (level) => {
    const labels = {
      primary: 'Primary School',
      secondary: 'Secondary School',
      diploma: 'Diploma',
      bachelor: "Bachelor's Degree",
      master: "Master's Degree",
      phd: 'PhD/Doctorate',
      certificate: 'Certificate'
    };
    return labels[level] || level || 'Education';
  };

  // Helper to get child name by index
  const getChildName = (index) => {
    const children = employeeData?.children;
    if (!children || !children[index]) return `Child ${index + 1}`;
    return children[index].name || `Child ${index + 1}`;
  };

  // Helper to get guarantor name by index
  const getGuarantorName = (index) => {
    const guarantors = employeeData?.guaranteeInfo;
    if (!guarantors || !guarantors[index]) return `Guarantor ${index + 1}`;
    return guarantors[index].guarantorName || `Guarantor ${index + 1}`;
  };

  // Helper to get education description
  const getEducationDescription = (index) => {
    const education = employeeData?.education;
    if (!education || !education[index]) return `Entry ${index + 1}`;
    const edu = education[index];
    const level = getEducationLevelName(edu.level);
    return `${level} - ${edu.institutionName || 'Unknown Institution'}`;
  };

  // Helper to get training description
  const getTrainingDescription = (index) => {
    const training = employeeData?.training;
    if (!training || !training[index]) return `Entry ${index + 1}`;
    const train = training[index];
    return `${train.trainingName || 'Training'} - ${train.institutionName || 'Unknown Institution'}`;
  };

  // Helper to get work experience description
  const getWorkDescription = (index) => {
    const work = employeeData?.workExperience;
    if (!work || !work[index]) return `Entry ${index + 1}`;
    const exp = work[index];
    return `${exp.position || 'Position'} at ${exp.companyName || 'Unknown Company'}`;
  };

  // Document type configuration with description builders
 // In the allDocuments computed property, update the docTypes array:

const docTypes = [
  { 
    key: 'national_id', 
    label: 'National ID (FAN)', 
    section: 'Personal Information', 
    sectionClass: 'personal', 
    icon: '🪪',
    getDescription: () => 'National Identity Document'
  },
  { 
    key: 'education_certificate', 
    label: 'Education Certificate', 
    section: 'Education', 
    sectionClass: 'education', 
    icon: '🎓',
    getDescription: (index) => getEducationDescription(index)
  },
  { 
    key: 'training_certificate', 
    label: 'Training Certificate', 
    section: 'Training', 
    sectionClass: 'training', 
    icon: '📜',
    getDescription: (index) => getTrainingDescription(index)
  },
  { 
    key: 'naturalization_certificate', 
    label: 'Naturalization Certificate', 
    section: 'Nationality', 
    sectionClass: 'nationality', 
    icon: '🛂',
    getDescription: () => 'Naturalization Document'
  },
  { 
    key: 'health_document', 
    label: 'Health Document', 
    section: 'Health & Legal', 
    sectionClass: 'health', 
    icon: '🏥',
    getDescription: () => 'Health Information Record'
  },
  { 
    key: 'legal_document', 
    label: 'Legal Document', 
    section: 'Health & Legal', 
    sectionClass: 'legal', 
    icon: '⚖️',
    getDescription: () => 'Legal Information Record'
  },
  { 
    key: 'marriage_certificate', 
    label: 'Marriage Certificate', 
    section: 'Spouse', 
    sectionClass: 'spouse', 
    icon: '💍',
    getDescription: () => `Marriage Certificate - ${employeeData?.spouseInfo?.fullName || 'Spouse'}`
  },
  { 
    key: 'child_birth_certificate', 
    label: 'Child Birth Certificate', 
    section: 'Children', 
    sectionClass: 'children', 
    icon: '📄',
    getDescription: (index) => `Birth Certificate - ${getChildName(index)}`
  },
  { 
    key: 'child_adoption_certificate', 
    label: 'Child Adoption Certificate', 
    section: 'Children', 
    sectionClass: 'children', 
    icon: '📋',
    getDescription: (index) => `Adoption Certificate - ${getChildName(index)}`
  },
  { 
    key: 'child_medical_report', 
    label: 'Child Medical Report', 
    section: 'Children', 
    sectionClass: 'children', 
    icon: '🩺',
    getDescription: (index) => `Medical Report - ${getChildName(index)}`
  },
  { 
    key: 'experience_letter', 
    label: 'Experience Letter', 
    section: 'Work Experience', 
    sectionClass: 'work', 
    icon: '✉️',
    getDescription: (index) => getWorkDescription(index)
  },
  { 
    key: 'guarantee_letter', 
    label: 'Guarantee Letter', 
    section: 'Guarantee', 
    sectionClass: 'guarantee', 
    icon: '📑',
    getDescription: (index) => `Guarantee Letter - ${getGuarantorName(index)}`
  },
  { 
    key: 'sdt_letter', 
    label: 'SDT Letter', 
    section: 'Guarantee', 
    sectionClass: 'guarantee', 
    icon: '📝',
    getDescription: (index) => `SDT Letter - ${getGuarantorName(index)}`
  },
  { 
    key: 'guarantee_other', 
    label: 'Other Guarantee Document', 
    section: 'Guarantee', 
    sectionClass: 'guarantee', 
    icon: '📎',
    getDescription: (index) => `Other Document - ${getGuarantorName(index)}`
  },
  // ========== ADD THESE NEW DOCUMENT TYPES ==========
  { 
    key: 'employment_letter', 
    label: 'Employment Letter', 
    section: 'Employment', 
    sectionClass: 'employment', 
    icon: '📋',
    getDescription: () => 'Employment Contract/Letter'
  },
  { 
    key: 'other_document', 
    label: 'Other Document', 
    section: 'Other', 
    sectionClass: 'other', 
    icon: '📎',
    getDescription: () => 'Additional Document'
  },
  { 
    key: 'custom_document', 
    label: 'Custom Document', 
    section: 'Custom', 
    sectionClass: 'custom', 
    icon: '📄',
    getDescription: (index) => `Custom Document ${index + 1}`
  },
  // ================================================
];

  // Process each document type
  docTypes.forEach(docType => {
    const { key, label, section, sectionClass, icon, getDescription } = docType;

    // Check if there are indexed versions
    let hasIndexed = false;
    for (let i = 0; i < 20; i++) {
      const indexedKey = `${key}_${i}`;
      if (docs[indexedKey]?.fileUrl) {
        hasIndexed = true;
        documentMap.push({
          key: indexedKey,
          label: label,
          section: section,
          sectionClass: sectionClass,
          icon: icon,
          description: getDescription(i),
          url: docs[indexedKey].fileUrl
        });
      }
    }

    // If no indexed versions, check single document
    if (!hasIndexed && docs[key]?.fileUrl) {
      documentMap.push({
        key: key,
        label: label,
        section: section,
        sectionClass: sectionClass,
        icon: icon,
        description: getDescription(0),
        url: docs[key].fileUrl
      });
    }
  });

  return documentMap;
});

// Total documents count
const totalDocuments = computed(() => allDocuments.value.length);

const getComponentLabel = (componentKey) => {
  const labels = {
    basicSalary: t("employee.basicSalary") || "Basic Salary",
    housingAllowance: t("employee.housingAllowance") || "Housing Allowance",
    positionAllowance: t("employee.positionAllowance") || "Position Allowance",
    transportAllowance: t("employee.transportAllowance") || "Transport Allowance",
    mobileAllowance: t("employee.mobileAllowance") || "Mobile Allowance",
    totalAllowances: t("employee.totalAllowances") || "Total Allowances",
    grossPay: t("employee.grossPay") || "Gross Monthly Pay",
    basicsalary: t("employee.basicSalary") || "Basic Salary",
    housingallowance: t("employee.housingAllowance") || "Housing Allowance",
    positionallowance: t("employee.positionAllowance") || "Position Allowance",
    transportallowance: t("employee.transportAllowance") || "Transport Allowance",
    mobileallowance: t("employee.mobileAllowance") || "Mobile Allowance",
    totalallowances: t("employee.totalAllowances") || "Total Allowances",
    grosspay: t("employee.grossPay") || "Gross Monthly Pay",
  };
  return labels[componentKey] || componentKey || "—";
};

const getJobStatusLabel = (status) => {
  const labels = {
    government: t("family.government") || "Government",
    private: t("family.private") || "Private Company",
    unemployed: t("family.unemployed") || "Unemployed",
    business: t("family.business") || "Own Business",
    other: t("family.other") || "Other",
  };
  return labels[status] || status || "—";
};

// Helper method to get document URL by type with index (for array documents)
const getDocumentWithIndex = (type, index) => {
  const docs = employee.value?.documents;
  if (!docs) return null;

  const indexedKey = `${type}_${index}`;
  if (docs[indexedKey]) {
    return docs[indexedKey]?.fileUrl || null;
  }

  if (docs[type] && !Array.isArray(docs[type])) {
    return index === 0 ? docs[type]?.fileUrl : null;
  }

  if (docs[type] && Array.isArray(docs[type])) {
    const doc = docs[type].find((d) => d.index === index);
    return doc?.fileUrl || null;
  }

  return null;
};

const getLanguageLabel = (language) => {
  const labels = {
    amharic: t("skills.amharic") || "Amharic",
    oromo: t("skills.oromo") || "Oromo",
    tigrinya: t("skills.tigrinya") || "Tigrinya",
    somali: t("skills.somali") || "Somali",
    sidamo: t("skills.sidamo") || "Sidamo",
    wolaytta: t("skills.wolaytta") || "Wolaytta",
    afar: t("skills.afar") || "Afar",
    hadiyya: t("skills.hadiyya") || "Hadiyya",
    gamo: t("skills.gamo") || "Gamo",
    gurage: t("skills.gurage") || "Gurage",
    kembata: t("skills.kembata") || "Kembata",
    silte: t("skills.silte") || "Silt'e",
    swahili: t("skills.swahili") || "Swahili",
    hausa: t("skills.hausa") || "Hausa",
    yoruba: t("skills.yoruba") || "Yoruba",
    zulu: t("skills.zulu") || "Zulu",
    english: t("skills.english") || "English",
    french: t("skills.french") || "French",
    spanish: t("skills.spanish") || "Spanish",
    german: t("skills.german") || "German",
    italian: t("skills.italian") || "Italian",
    russian: t("skills.russian") || "Russian",
    chinese: t("skills.chinese") || "Chinese",
    japanese: t("skills.japanese") || "Japanese",
    korean: t("skills.korean") || "Korean",
    arabic: t("skills.arabic") || "Arabic",
    hindi: t("skills.hindi") || "Hindi",
  };
  return labels[language?.toLowerCase()] || language || "—";
};

const getProficiencyLabel = (proficiency) => {
  const labels = {
    basic: t("skills.basic") || "Basic",
    intermediate: t("skills.intermediate") || "Intermediate",
    advanced: t("skills.advanced") || "Advanced",
    fluent: t("skills.fluent") || "Fluent",
    native: t("skills.native") || "Native",
  };
  return labels[proficiency?.toLowerCase()] || proficiency || "—";
};

// ========== TRANSLATION HELPER FUNCTIONS ==========
const getGenderLabel = (gender) => {
  const labels = {
    male: t("employee.male") || "Male",
    female: t("employee.female") || "Female",
    other: t("employee.other") || "Other",
  };
  return labels[gender] || gender || "—";
};

const getMaritalStatusLabel = (status) => {
  const labels = {
    single: t("employee.single") || "Single",
    married: t("employee.married") || "Married",
    divorced: t("employee.divorced") || "Divorced",
    widowed: t("employee.widowed") || "Widowed",
  };
  return labels[status] || status || "—";
};

const getEmploymentTypeLabel = (type) => {
  const labels = {
    "full-time": t("employee.fullTime") || "Full Time",
    "part-time": t("employee.partTime") || "Part Time",
    contract: t("employee.contract") || "Contract",
    intern: t("employee.intern") || "Intern",
  };
  return labels[type] || type || "—";
};

const getNationalityLabel = (nationality) => {
  const labels = {
    Ethiopian: t("nationality.ethiopian") || "ኢትዮጵያዊ",
    American: t("nationality.american") || "አሜሪካዊ",
    British: t("nationality.british") || "ብሪቲሽ",
    Canadian: t("nationality.canadian") || "ካናዳዊ",
    Australian: t("nationality.australian") || "አውስትራሊያዊ",
    German: t("nationality.german") || "ጀርመናዊ",
    French: t("nationality.french") || "ፈረንሳዊ",
    Italian: t("nationality.italian") || "ጣሊያናዊ",
    Spanish: t("nationality.spanish") || "ስፓኒሽ",
    Kenyan: t("nationality.kenyan") || "ኬንያዊ",
    Eritrean: t("nationality.eritrean") || "ኤርትራዊ",
    Somali: t("nationality.somali") || "ሶማሊ",
    Sudanese: t("nationality.sudanese") || "ሱዳናዊ",
    Other: t("nationality.other") || "ሌላ",
  };
  return labels[nationality] || nationality || "—";
};

const getShiftTypeLabel = (shift) => {
  const labels = {
    day: t("employee.dayShift") || "Day Shift",
    night: t("employee.nightShift") || "Night Shift",
  };
  return labels[shift] || shift || "—";
};

const getStatusLabel = (status) => {
  const labels = {
    active: t("employee.active") || "Active",
    "on-leave": t("employee.onLeave") || "On Leave",
    terminated: t("employee.terminated") || "Terminated",
  };
  return labels[status] || status || "—";
};

const getNationalityTypeLabel = (type) => {
  const labels = {
    by_birth: t("nationality.byBirth") || "By Birth",
    by_law: t("nationality.byLaw") || "By Law (Naturalization)",
    ethiopian_birth: t("nationality.ethiopianBirth") || "Ethiopian by Birth",
  };
  return labels[type] || type || "—";
};

const getEducationLevelLabel = (level) => {
  const labels = {
    primary: t("education.primary") || "Primary School",
    secondary: t("education.secondary") || "Secondary School",
    diploma: t("education.diploma") || "Diploma",
    bachelor: t("education.bachelor") || "Bachelor's Degree",
    master: t("education.master") || "Master's Degree",
    phd: t("education.phd") || "PhD/Doctorate",
    certificate: t("education.certificate") || "Certificate",
  };
  return labels[level] || level || "—";
};

const getRelationshipLabel = (relationship) => {
  const labels = {
    Spouse: t("family.spouse") || "Spouse",
    Parent: t("family.parent") || "Parent",
    Child: t("family.child") || "Child",
    Sibling: t("family.sibling") || "Sibling",
    Relative: t("family.relative") || "Relative",
    Friend: t("family.friend") || "Friend",
  };
  return labels[relationship] || relationship || "—";
};

// ========== COMPUTED PROPERTIES ==========
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

// ========== FORMATTING FUNCTIONS ==========
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

// EC Date format: DD/MM/YYYY
const formatDate = (date) => {
  if (!date) return "—";
  
  if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return date;
  }
  
  if (typeof date === 'string') {
    const parts = date.split(/[/-]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}/${month}/${year}`;
    }
  }
  
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // ignore
  }
  
  return date;
};

// Calculate age from EC date (DD/MM/YYYY)
const calculateAgeFromEC = (dateOfBirthEC) => {
  if (!dateOfBirthEC) return "?";
  
  const parts = dateOfBirthEC.split('/');
  if (parts.length !== 3) return "?";
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  let age = currentYear - year - 8;
  
  if (month > currentMonth || (month === currentMonth && day > currentDay)) {
    age--;
  }
  
  return age < 0 ? "?" : age;
};

const getAvatarUrl = (name) => {
  if (!name)
    return "https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=User";
  return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name)}`;
};

const handleImageError = (e) => {
  e.target.src = getAvatarUrl(employee.value?.fullName || "Employee");
};

// ========== DATA LOADING ==========
const loadCompensationHistory = async () => {
  loadingHistory.value = true;
  try {
    const response = await EmployeesService.getEmployeeCompensationHistory(employeeId);
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

const loadEmployeeData = async () => {
  loading.value = true;
  try {
    const result = await EmployeesService.getEmployeeById(employeeId);
    if (result.success && result.data) employee.value = result.data;
  } catch (error) {
    console.error("Error loading employee:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadEmployeeData();
  loadCompensationHistory();
  loadTerminationHistory();
  loadDepartmentTransfers();
});
</script>

<style scoped>

/* Add to the section-badge styles */
.section-badge.employment {
  background: #dbeafe;
  color: #2563eb;
}

.section-badge.other {
  background: #e0e7ff;
  color: #4338ca;
}

.section-badge.custom {
  background: #f3e8ff;
  color: #7c3aed;
}

/* ============================================
   DOCUMENTS SECTION STYLES
   ============================================ */

.documents-card.full-width {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.documents-content {
  padding: 24px;
}

.documents-empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.documents-empty .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.documents-empty p {
  margin: 0 0 8px;
  font-size: 15px;
  color: #64748b;
}

.documents-hint {
  font-size: 12px;
  color: #94a3b8;
}

.documents-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.documents-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.documents-table thead th {
  text-align: left;
  padding: 12px 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9edf2;
  white-space: nowrap;
}

.documents-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.documents-table tbody tr {
  transition: background 0.2s;
}

.documents-table tbody tr:hover {
  background: #fafcfc;
}

/* Document column widths */
.doc-col-icon { width: 50px; }
.doc-col-name { min-width: 160px; }
.doc-col-section { width: 140px; }
.doc-col-description { min-width: 200px; }
.doc-col-action { width: 100px; }

.doc-icon {
  font-size: 20px;
  display: inline-block;
}

.doc-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.doc-description {
  font-size: 12px;
  color: #475569;
  display: block;
  line-height: 1.4;
}

.section-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.section-badge.personal {
  background: #eef2ff;
  color: #4f46e5;
}

.section-badge.education {
  background: #fef3c7;
  color: #d97706;
}

.section-badge.training {
  background: #dbeafe;
  color: #2563eb;
}

.section-badge.nationality {
  background: #ecfdf5;
  color: #059669;
}

.section-badge.health {
  background: #fce4ec;
  color: #dc2626;
}

.section-badge.legal {
  background: #f3e8ff;
  color: #7c3aed;
}

.section-badge.spouse {
  background: #fce7f3;
  color: #db2777;
}

.section-badge.children {
  background: #e0f2fe;
  color: #0284c7;
}

.section-badge.work {
  background: #fef2f2;
  color: #dc2626;
}

.section-badge.guarantee {
  background: #f0fdf4;
  color: #16a34a;
}

.doc-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.doc-action-btn-view {
  background: #eef2ff;
  color: #4f46e5;
}

.doc-action-btn-view:hover {
  background: #dbeafe;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.doc-action-btn-view svg {
  width: 14px;
  height: 14px;
}

.doc-action-btn-disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: default;
}

.doc-action-btn-disabled:hover {
  background: #f1f5f9;
  transform: none;
  box-shadow: none;
}

/* ============================================
   DEPARTMENT TRANSFER HISTORY STYLES
   ============================================ */

.transfer-history-card.full-width {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.transfer-content {
  padding: 24px;
}

.transfer-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #94a3b8;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.transfer-empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.transfer-empty .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.transfer-empty p {
  margin: 0 0 8px;
  font-size: 15px;
  color: #64748b;
}

.transfer-hint {
  font-size: 12px;
  color: #94a3b8;
}

.transfer-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.transfer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.transfer-table thead th {
  text-align: left;
  padding: 12px 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9edf2;
  white-space: nowrap;
}

.transfer-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.transfer-table tbody tr:hover {
  background: #fafcfc;
}

/* Transfer column widths */
.transfer-col-date { width: 100px; }
.transfer-col-from { width: 140px; }
.transfer-col-to { width: 140px; }
.transfer-col-reason { min-width: 150px; }
.transfer-col-status { width: 100px; }

/* Transfer date cell */
.transfer-date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.transfer-date-day {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.transfer-date-month {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.transfer-date-year {
  font-size: 10px;
  color: #94a3b8;
}

/* Department badges */
.department-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.department-badge.from-dept {
  background: #fef2f2;
  color: #dc2626;
}

.department-badge.to-dept {
  background: #d1fae5;
  color: #059669;
}

.transfer-arrow {
  margin: 0 6px;
  color: #94a3b8;
  font-weight: 300;
}

.transfer-reason {
  font-size: 12px;
  color: #475569;
  display: block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status badge for transfers */
.status-badge-transfer {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge-transfer.current {
  background: #10b981;
  color: white;
}

.status-badge-transfer.historical {
  background: #e2e8f0;
  color: #64748b;
}

.status-badge-transfer.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge-transfer.reversed {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge-transfer.completed {
  background: #dbeafe;
  color: #2563eb;
}

/* Current Transfer Row */
.transfer-row.current-transfer {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
}

.transfer-row.current-transfer:hover {
  background: #dcfce7;
}

.transfer-row.historical-transfer {
  opacity: 0.85;
}

.transfer-row.historical-transfer:hover {
  opacity: 1;
}

/* ============================================
   COMPENSATION HISTORY TABLE - NO SCROLL
   ============================================ */

.history-content-full.no-scroll {
  padding: 24px;
  overflow: visible;
  max-height: none;
}

.history-table-wrapper.no-scroll {
  overflow: visible;
  padding: 4px 0;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.history-table thead th {
  text-align: left;
  padding: 12px 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9edf2;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
}

.history-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.history-table tbody tr {
  transition: background 0.2s;
}

.history-table tbody tr:hover {
  background: #fafcfc;
}

.history-table tbody tr.increase {
  border-left: 3px solid #10b981;
}

.history-table tbody tr.decrease {
  border-left: 3px solid #ef4444;
}

/* Column widths */
.col-date { width: 100px; }
.col-component { width: 140px; }
.col-old { width: 120px; }
.col-new { width: 120px; }
.col-change { width: 140px; }
.col-reason { min-width: 180px; }

/* Date cell */
.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.date-day {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.date-month {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
}

.date-year {
  font-size: 10px;
  color: #94a3b8;
}

/* Component badge */
.component-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.component-badge.increase {
  background: #d1fae5;
  color: #059669;
}

.component-badge.decrease {
  background: #fee2e2;
  color: #dc2626;
}

/* Old amount */
.old-amount {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 12px;
}

/* New amount */
.new-amount {
  font-weight: 700;
  font-size: 14px;
}

.new-amount.increase {
  color: #10b981;
}

.new-amount.decrease {
  color: #ef4444;
}

/* Change badge */
.change-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.change-badge.increase {
  background: #d1fae5;
  color: #059669;
}

.change-badge.decrease {
  background: #fee2e2;
  color: #dc2626;
}

.change-icon {
  font-size: 10px;
}

.change-percent {
  font-weight: 700;
}

.change-diff {
  font-size: 11px;
  opacity: 0.7;
  font-weight: 400;
}

/* Reason cell */
.reason-text {
  display: block;
  font-size: 12px;
  color: #475569;
  line-height: 1.3;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.submitted-by {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ============================================
   EMPLOYMENT HISTORY TABLE - NO SCROLL
   ============================================ */

.employment-history-card .history-content-full.no-scroll {
  padding: 24px;
  overflow: visible;
  max-height: none;
}

.employment-table-wrapper.no-scroll {
  overflow: visible;
  padding: 4px 0;
}

.employment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.employment-table thead th {
  text-align: left;
  padding: 12px 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9edf2;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
}

.employment-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.employment-table tbody tr {
  transition: background 0.2s;
}

.employment-table tbody tr:hover {
  background: #fafcfc;
}

.employment-table tbody tr.hired {
  border-left: 3px solid #6366f1;
}

.employment-table tbody tr.terminated {
  border-left: 3px solid #ef4444;
}

.employment-table tbody tr.rehired {
  border-left: 3px solid #10b981;
}

/* Column widths */
.col-period { width: 100px; }
.col-status { width: 150px; }
.col-dates { width: 180px; }
.col-duration { width: 130px; }
.col-details { min-width: 200px; }

/* Period badge */
.period-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.period-badge.hired {
  background: #eef2ff;
  color: #4f46e5;
}

.period-badge.terminated {
  background: #fef2f2;
  color: #dc2626;
}

.period-badge.rehired {
  background: #d1fae5;
  color: #059669;
}

.period-icon {
  font-size: 14px;
}

/* Status cell */
.status-badge {
  display: block;
  font-weight: 600;
  font-size: 13px;
}

.status-badge.hired { color: #4f46e5; }
.status-badge.terminated { color: #dc2626; }
.status-badge.rehired { color: #059669; }

.status-subtitle {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 1px;
}

/* Date range */
.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.start-date,
.end-date {
  font-weight: 500;
  color: #1e293b;
  font-size: 12px;
}

.date-arrow {
  color: #94a3b8;
  font-size: 12px;
}

.calendar-tag {
  font-size: 9px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
}

/* Duration badge */
.duration-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.duration-badge.hired {
  background: #eef2ff;
  color: #4f46e5;
}

.duration-badge.terminated {
  background: #fef2f2;
  color: #dc2626;
}

.duration-badge.rehired {
  background: #d1fae5;
  color: #059669;
}

.duration-icon {
  font-size: 12px;
}

/* Details cell */
.details-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-row {
  display: flex;
  gap: 4px;
  font-size: 12px;
  align-items: baseline;
}

.detail-label {
  font-weight: 500;
  color: #94a3b8;
  min-width: 40px;
}

.detail-value {
  color: #475569;
}

.reason-row .detail-value {
  color: #64748b;
  font-style: italic;
  font-size: 11px;
}

.reason-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* ============================================
   RESPONSIVE - NO SCROLL (horizontal scroll on small screens only)
   ============================================ */

@media (max-width: 900px) {
  .history-table thead th,
  .employment-table thead th,
  .documents-table thead th,
  .transfer-table thead th {
    font-size: 10px;
    padding: 8px 10px;
  }

  .history-table tbody td,
  .employment-table tbody td,
  .documents-table tbody td,
  .transfer-table tbody td {
    padding: 10px 12px;
    font-size: 12px;
  }

  .col-date { width: 80px; }
  .col-component { width: 100px; }
  .col-old { width: 90px; }
  .col-new { width: 90px; }
  .col-change { width: 100px; }
  .col-period { width: 80px; }
  .col-status { width: 120px; }
  .col-dates { width: 140px; }
  .col-duration { width: 100px; }
  .doc-col-section { width: 110px; }
  .doc-col-description { min-width: 150px; }
  .transfer-col-date { width: 80px; }
  .transfer-col-from { width: 100px; }
  .transfer-col-to { width: 100px; }
  .transfer-col-reason { min-width: 120px; }
  .transfer-col-status { width: 80px; }
}

@media (max-width: 768px) {
  .history-table-wrapper.no-scroll,
  .employment-table-wrapper.no-scroll,
  .documents-table-wrapper,
  .transfer-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .history-table,
  .employment-table,
  .documents-table,
  .transfer-table {
    min-width: 700px;
  }

  .history-content-full.no-scroll,
  .documents-content,
  .transfer-content {
    padding: 12px 16px;
  }
}

/* ============================================
   CURRENT STATUS BANNER
   ============================================ */

.current-status-banner {
  margin-top: 20px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 12px;
  border: 1px solid #bbf7d0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #065f46;
}

.status-date {
  font-size: 12px;
  color: #059669;
  margin-left: auto;
}

@media (max-width: 768px) {
  .status-date {
    margin-left: 0;
    width: 100%;
  }
}

/* ============================================
   ORIGINAL STYLES (Keep everything below)
   ============================================ */

/* Main container */
.employee-detail {
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

.history-count {
  margin-left: auto;
  font-size: 11px;
  background: #e2e8f0;
  padding: 2px 10px;
  border-radius: 20px;
  color: #475569;
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

/* Allowances card */
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

.edu-details,
.training-details,
.work-details,
.guarantor-details {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.guarantor-documents {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  transition: all 0.2s;
}

.child-card:hover {
  background: white;
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.child-avatar {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* Parents */
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
  transition: all 0.2s;
}

.parent-card:hover {
  background: white;
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.parent-icon {
  font-size: 42px;
  flex-shrink: 0;
}

.parent-details {
  flex: 1;
}

.parent-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}

.parent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
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

.support-section {
  padding: 12px 20px 20px;
  border-top: 1px solid #eef2ff;
}

.support-title {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 10px;
}

.support-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 10px;
  margin-bottom: 8px;
}

.support-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.support-text {
  font-size: 13px;
  color: #475569;
}

/* Spouse */
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
  font-size: 32px;
  color: white;
  border: 3px solid #e2e8f0;
}

.spouse-info {
  flex: 1;
}

.spouse-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #eef2ff;
}

.spouse-detail {
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.spouse-detail span {
  font-weight: 600;
  color: #64748b;
  min-width: 130px;
  display: inline-block;
}

.spouse-document {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #eef2ff;
}

/* Skills */
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

/* History card base */
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

.history-loading-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.history-empty-full {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.history-empty-full p {
  margin: 0 0 8px;
  font-size: 15px;
  color: #64748b;
}

.history-hint {
  font-size: 12px;
  color: #94a3b8;
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

  .spouse-layout {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .spouse-detail {
    justify-content: center;
  }

  .spouse-detail span {
    min-width: auto;
    margin-right: 6px;
  }

  .child-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .parent-card {
    flex-direction: column;
    text-align: center;
  }

  .parent-meta {
    justify-content: center;
  }

  .history-content-full {
    padding: 12px 16px;
  }

  .history-table,
  .employment-table,
  .documents-table,
  .transfer-table {
    min-width: 700px;
  }

  .history-table-wrapper,
  .employment-table-wrapper,
  .documents-table-wrapper,
  .transfer-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .guarantor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .guarantor-documents {
    flex-direction: column;
    align-items: flex-start;
  }

  .child-documents {
    justify-content: center;
  }
}
</style>