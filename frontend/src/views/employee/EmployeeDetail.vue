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
            <h1>{{ employee.fullName }}</h1>
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
            }}</span
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
            <span class="stat-label">{{
              $t("employee.hireDate") || "Hire Date"
            }}</span
            ><span class="stat-number">{{
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
            }}</span
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
            <span class="stat-label">{{
              $t("employee.basicSalary") || "Basic Salary"
            }}</span
            ><span class="stat-number">{{
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
                <span class="info-value">{{ employee.fullName }}</span>
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
                  formatDate(employee.dob || employee.dateOfBirth) || "—"
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
                  <a
                    v-if="getDocumentUrl('national_id')"
                    :href="getDocumentUrl('national_id')"
                    target="_blank"
                    class="file-link-inline"
                  >
                    📄 {{ $t("common.view") || "View" }}
                  </a>
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
                }}</span
                ><span class="info-value">{{
                  employee.birthPlace.region || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.city") || "City"
                }}</span
                ><span class="info-value">{{
                  employee.birthPlace.city || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span
                ><span class="info-value">{{
                  employee.birthPlace.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
                  employee.currentCompany.companyName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.tin") || "TIN Number"
                }}</span
                ><span class="info-value">{{
                  employee.currentCompany.companyTin || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.phone") || "Phone"
                }}</span
                ><span class="info-value">{{
                  employee.currentCompany.companyPhone || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.email") || "Email"
                }}</span
                ><span class="info-value">{{
                  employee.currentCompany.companyEmail || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.address") || "Address"
                }}</span
                ><span class="info-value">{{
                  employee.currentCompany.companyAddress || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.poBox") || "PO Box"
                }}</span
                ><span class="info-value">{{
                  employee.currentCompany.poBox || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("company.website") || "Website"
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
                  employee.currentAddress.region || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span
                ><span class="info-value">{{
                  employee.currentAddress.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.kebele") || "Kebele"
                }}</span
                ><span class="info-value">{{
                  employee.currentAddress.kebele || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span
                ><span class="info-value">{{
                  employee.currentAddress.district || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.poBox") || "PO Box"
                }}</span
                ><span class="info-value">{{
                  employee.currentAddress.poBox || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.houseNumber") || "House Number"
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
                  employee.permanentAddress.region || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span
                ><span class="info-value">{{
                  employee.permanentAddress.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.kebele") || "Kebele"
                }}</span
                ><span class="info-value">{{
                  employee.permanentAddress.kebele || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span
                ><span class="info-value">{{
                  employee.permanentAddress.district || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.poBox") || "PO Box"
                }}</span
                ><span class="info-value">{{
                  employee.permanentAddress.poBox || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.houseNumber") || "House Number"
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
                  employee.emergencyContact.phone || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("family.alternatePhone") || "Alternate Phone"
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
                  employee.emergencyContactAddress.city || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.subcity") || "Subcity"
                }}</span
                ><span class="info-value">{{
                  employee.emergencyContactAddress.subcity || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.district") || "District"
                }}</span
                ><span class="info-value">{{
                  employee.emergencyContactAddress.district || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("address.kebele") || "Kebele"
                }}</span
                ><span class="info-value">{{
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
                  <strong>{{ edu.level }}</strong> - {{ edu.institutionName }}
                </div>
                <div class="edu-details">
                  {{ edu.startDate }} to
                  {{ edu.isCurrent ? "Present" : edu.endDate }}
                </div>
                <div class="edu-address">{{ edu.institutionAddress }}</div>
                <a
                  v-if="getDocumentUrl('education_certificate')"
                  :href="getDocumentUrl('education_certificate')"
                  target="_blank"
                  class="file-link"
                  >📄 {{ $t("common.view") || "View" }} </a
                >
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
                  {{ train.institutionName }} | {{ train.startDate }} to
                  {{ train.endDate }}
                </div>
                <div class="training-address">
                  {{ train.institutionAddress }}
                </div>
                <a
                  v-if="getDocumentUrl('training_certificate')"
                  :href="getDocumentUrl('training_certificate')"
                  target="_blank"
                  class="file-link"
                  >📄 {{ $t("common.view") || "View" }} </a
                >
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
                }}</span
                ><span class="info-value">{{
                  employee.bankAccount.bankName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.accountNumber") || "Account Number"
                }}</span
                ><span class="info-value">{{
                  employee.bankAccount.accountNumber || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.accountHolderName") || "Account Holder"
                }}</span
                ><span class="info-value">{{
                  employee.bankAccount.accountHolderName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("bank.branch") || "Branch"
                }}</span
                ><span class="info-value">{{
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
                }}</span
                ><span class="info-value">{{
                  getNationalityTypeLabel(employee.nationalityAcquisition.type)
                }}</span>
              </div>
              <div
                class="info-item"
                v-if="getDocumentUrl('naturalization_certificate')"
              >
                <span class="info-label">{{
                  $t("nationality.certificate") || "Certificate"
                }}</span
                ><span class="info-value"
                  ><a
                    :href="getDocumentUrl('naturalization_certificate')"
                    target="_blank"
                    class="file-link"
                    >📄 {{ $t("common.view") || "View" }}</a
                  ></span
                >
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
        <a
          v-if="getDocumentUrl('health_document')"
          :href="getDocumentUrl('health_document')"
          target="_blank"
          class="file-link"
          >📄 {{ $t("common.view") || "View" }}</a
        >
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
        <a
          v-if="getDocumentUrl('legal_document')"
          :href="getDocumentUrl('legal_document')"
          target="_blank"
          class="file-link"
          >📄 {{ $t("common.view") || "View" }}</a
        >
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
                }}</span
                ><span class="info-value">{{
                  employee.departmentName || "N/A"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.position") || "Position"
                }}</span
                ><span class="info-value">{{
                  employee.position || "N/A"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.employmentType") || "Employment Type"
                }}</span
                ><span class="info-value">{{
                  getEmploymentTypeLabel(employee.employmentType)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.hireDate") || "Hire Date"
                }}</span
                ><span class="info-value">{{
                  formatDate(employee.hireDateEC)
                }} {{ $t('calendar.ec') || 'E.C' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.manager") || "Manager"
                }}</span
                ><span class="info-value">{{
                  employee.managerName || "—"
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{
                  $t("employee.workLocation") || "Work Location"
                }}</span
                ><span class="info-value">{{
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
                  {{ formatDate(employee.spouseInfo.dateOfBirth) || "—" }}
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
                <div
                  class="spouse-document"
                  v-if="
                    getDocumentWithIndex('marriage_certificate', 0) ||
                    getDocumentUrl('marriage_certificate')
                  "
                >
                  <a
                    :href="
                      getDocumentWithIndex('marriage_certificate', 0) ||
                      getDocumentUrl('marriage_certificate')
                    "
                    target="_blank"
                    class="file-link"
                    >📄 {{ $t("common.viewMarriageCertificate") || "View" }}
                  </a>
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
                    <span class="child-name">{{ child.name }}</span
                    ><span class="child-age"
                      >{{ calculateAge(child.dateOfBirth) }}
                      {{ $t("family.years") || "years" }}</span
                    >
                  </div>
                 <div class="child-details">
  <div>
    <span class="child-label"
      >{{
        $t("family.dateOfBirth") || "Date of Birth"
      }}:</span
    >
    {{ formatDate(child.dateOfBirth) }}
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
  <div class="child-documents">
    <a
      v-if="
        getDocumentWithIndex('child_birth_certificate', idx)
      "
      :href="
        getDocumentWithIndex('child_birth_certificate', idx)
      "
      target="_blank"
      class="file-link"
      >📄 {{ $t("common.viewBirthCertificate") || "" }}</a
    >
    <a
      v-if="
        getDocumentWithIndex(
          'child_adoption_certificate',
          idx,
        )
      "
      :href="
        getDocumentWithIndex(
          'child_adoption_certificate',
          idx,
        )
      "
      target="_blank"
      class="file-link"
      >📄
      {{
        $t("common.viewAdoptionCertificate") ||
        "Adoption Certificate"
      }}</a
    >
    <a
      v-if="getDocumentWithIndex('child_medical_report', idx)"
      :href="
        getDocumentWithIndex('child_medical_report', idx)
      "
      target="_blank"
      class="file-link"
      >📄
      {{
        $t("common.viewMedicalReport") || "Medical Report"
      }}</a
    >
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
                    }}</span
                    ><span class="parent-income"
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
                    }}</span
                    ><span class="parent-income"
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
                  <span class="support-icon">💰</span
                  ><span class="support-text"
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
                  <span class="support-icon">🎁</span
                  ><span class="support-text"
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
                  <strong>{{ work.position }}</strong> at {{ work.companyName }}
                </div>
                <div class="work-dates">
                  {{ work.startDate }} to {{ work.endDate }}
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
                <a
                  v-if="getDocumentWithIndex('experience_letter', idx)"
                  :href="getDocumentWithIndex('experience_letter', idx)"
                  target="_blank"
                  class="file-link"
                  >📄 {{ $t("common.view") || "View" }} Experience Letter</a
                >
              </div>
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
                    }}){{ $t('calendar.ec') || 'E.C' }}
                  </div>
                  <div>
                    {{ $t("guarantee.sdtLetterNumber") || "SDT Letter" }}:
                    {{ guarantor.sdtLetterNo }} ({{
                      formatDate(guarantor.sdtLetterDateEC) }}){{ $t('calendar.ec') || 'E.C' }}
                  </div>
                  <div class="guarantor-documents">
                    <a
                      v-if="getDocumentWithIndex('guarantee_letter', idx)"
                      :href="getDocumentWithIndex('guarantee_letter', idx)"
                      target="_blank"
                      class="file-link"
                      >📄
                      {{
                        $t("guarantee.guaranteeLetter") || "Guarantee Letter"
                      }}</a
                    >
                    <a
                      v-if="getDocumentWithIndex('sdt_letter', idx)"
                      :href="getDocumentWithIndex('sdt_letter', idx)"
                      target="_blank"
                      class="file-link"
                      >📄 {{ $t("guarantee.sdtLetter") || "SDT Letter" }}</a
                    >
                    <a
                      v-if="getDocumentWithIndex('guarantee_other', idx)"
                      :href="getDocumentWithIndex('guarantee_other', idx)"
                      target="_blank"
                      class="file-link"
                      >📄
                      {{ $t("guarantee.otherDocument") || "Other Document" }}</a
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Compensation History Card -->
   <!-- Compensation History Card -->
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
  <div class="history-content-full">
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
    <div v-else class="history-timeline-full">
      <div
        v-for="(history, index) in compensationHistories"
        :key="history.id"
        class="timeline-entry"
      >
        <div class="timeline-left">
          <div class="timeline-date-badge">
            <div class="timeline-date-day">
              {{ history.changeDay || '--' }}
            </div>
            <div class="timeline-date-month">
              {{ history.changeMonth || '---' }}
            </div>
            <div class="timeline-date-year">
              {{ history.changeYear || '----' }}
            </div>
          </div>
          <div class="timeline-arrow" :class="history.changeType">
            <span class="arrow-icon">{{
              history.changeType === "increase" ? "↑" : "↓"
            }}</span>
          </div>
        </div>
        <div class="timeline-body">
          <div class="timeline-header-full">
            <div class="timeline-title">
              <span class="component-badge" :class="history.changeType">{{
                getComponentLabel(history.componentKey || history.component)
              }}</span>
              <span class="change-percent" :class="history.changeType"
                >{{ history.changeType === "increase" ? "+" : ""
                }}{{ formatPercentage(history.percentageChange) }}%</span
              >
            </div>
            <div class="timeline-submitted">
              <span class="submitted-icon">👤</span>
              <span>{{ history.submittedBy || $t("common.system") || "System" }}</span>
            </div>
          </div>
          <div class="timeline-values-full">
            <div class="value-card old">
              <div class="value-label">
                {{
                  $t("compensation.previousAmount") || "Previous Amount"
                }}
              </div>
              <div class="value-amount">
                {{ formatCurrency(history.oldValue) }}
              </div>
            </div>
            <div class="value-arrow-full">→</div>
            <div class="value-card new" :class="history.changeType">
              <div class="value-label">
                {{ $t("compensation.newAmount") || "New Amount" }}
              </div>
              <div class="value-amount">
                {{ formatCurrency(history.newValue) }}
              </div>
            </div>
            <div class="value-diff" :class="history.changeType">
              <span class="diff-icon">{{
                history.changeType === "increase" ? "▲" : "▼"
              }}</span>
              <span class="diff-amount">{{
                formatCurrency(history.difference)
              }}</span>
            </div>
          </div>
          <div v-if="history.reason" class="timeline-reason-full">
            <span class="reason-icon">💬</span>
            <span class="reason-text">{{ history.reason }}</span>
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
const employeeId = route.params.id;

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

const getComponentLabel = (componentKey) => {
  const labels = {
    basicSalary: t("employee.basicSalary") || "Basic Salary",
    housingAllowance: t("employee.housingAllowance") || "Housing Allowance",
    positionAllowance: t("employee.positionAllowance") || "Position Allowance",
    transportAllowance: t("employee.transportAllowance") || "Transport Allowance",
    mobileAllowance: t("employee.mobileAllowance") || "Mobile Allowance",
    totalAllowances: t("employee.totalAllowances") || "Total Allowances",
    grossPay: t("employee.grossPay") || "Gross Monthly Pay",
    // Fallback for any other component names
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
    // Ethiopian Languages
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
    // African Languages
    swahili: t("skills.swahili") || "Swahili",
    hausa: t("skills.hausa") || "Hausa",
    yoruba: t("skills.yoruba") || "Yoruba",
    zulu: t("skills.zulu") || "Zulu",
    // European Languages
    english: t("skills.english") || "English",
    french: t("skills.french") || "French",
    spanish: t("skills.spanish") || "Spanish",
    german: t("skills.german") || "German",
    italian: t("skills.italian") || "Italian",
    russian: t("skills.russian") || "Russian",
    // Asian Languages
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



const getYesNoLabel = (value) => {
  return value ? t("common.yes") || "Yes" : t("common.no") || "No";
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

const formatDateDay = (date) => {
  if (!date) return "--";
  // If date is a string in DD/MM/YYYY format, extract day
  if (typeof date === 'string' && date.includes('/')) {
    return date.split('/')[0];
  }
  // Fallback for Gregorian dates
  return new Date(date).getDate();
};
const formatDateMonth = (date) => {
  if (!date) return "---";
  // If date is a string in DD/MM/YYYY format, extract month and get name
  if (typeof date === 'string' && date.includes('/')) {
    const monthNum = parseInt(date.split('/')[1]);
    // Get month name based on current language
    const monthNames = {
      am: ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 
           'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሀሴ', 'ጳጉሜ'],
      en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
           'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume']
    };
    const lang = $i18n?.locale || 'en';
    const names = monthNames[lang] || monthNames.en;
    return names[monthNum - 1] || '---';
  }
  // Fallback for Gregorian dates
  return new Date(date).toLocaleString("default", { month: "short" });
};

const formatDateYear = (date) => {
  if (!date) return "----";
  // If date is a string in DD/MM/YYYY format, extract year
  if (typeof date === 'string' && date.includes('/')) {
    return date.split('/')[2];
  }
  // Fallback for Gregorian dates
  return new Date(date).getFullYear();
};
const formatDate = (date) => {
  if (!date) return "—";
  
  // If it's already in DD/MM/YYYY format (Ethiopian Calendar), return as is
  if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return date;
  }
  
  // If it's in another format, try to parse it
  if (typeof date === 'string') {
    const parts = date.split(/[/-]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}/${month}/${year}`;
    }
  }
  
  // If it's a Date object or ISO string
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

const getAvatarUrl = (name) => {
  if (!name)
    return "https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=User";
  return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name)}`;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "?";
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  )
    age--;
  return age;
};

const capitalize = (str) => {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
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
      // The backend now sends EC dates directly
      compensationHistories.value = response.data || [];
    }
  } catch (error) {
    console.error("Failed to load compensation history:", error);
    compensationHistories.value = [];
  } finally {
    loadingHistory.value = false;
  }
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
});
</script>

<style scoped>
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

/* Loading State */
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
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

/* Timeline Container */
.history-timeline-full {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Timeline Entry */
.timeline-entry {
  display: flex;
  gap: 20px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
  border: 1px solid #eef2ff;
}

.timeline-entry:hover {
  background: white;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateX(4px);
}

/* Left Side - Date & Arrow */
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
  line-height: 1.2;
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
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.timeline-arrow.decrease {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.arrow-icon {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

/* Right Side - Content */
.timeline-body {
  flex: 1;
}

.timeline-header-full {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.component-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
}

.component-badge.increase {
  background: #d1fae5;
  color: #059669;
}

.component-badge.decrease {
  background: #fee2e2;
  color: #dc2626;
}

.change-percent {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.change-percent.increase {
  background: #d1fae5;
  color: #059669;
}

.change-percent.decrease {
  background: #fee2e2;
  color: #dc2626;
}

.timeline-submitted {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.submitted-icon {
  font-size: 12px;
}

/* Values Section */
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

.value-arrow-full {
  font-size: 20px;
  color: #cbd5e1;
  font-weight: bold;
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

.diff-icon {
  font-size: 14px;
}

/* Reason Section */
.timeline-reason-full {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f1f5f9;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
}

.reason-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.reason-text {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .history-content-full {
    padding: 16px;
  }

  .timeline-entry {
    flex-direction: column;
    align-items: flex-start;
  }

  .timeline-left {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }

  .timeline-values-full {
    flex-direction: column;
    align-items: stretch;
  }

  .value-arrow-full {
    text-align: center;
  }

  .value-card {
    text-align: center;
  }

  .timeline-header-full {
    flex-direction: column;
    align-items: flex-start;
  }
}

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

.simple-support {
  margin-bottom: 16px;
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

.support-record {
  background: #f8fafc;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #eef2ff;
}

.support-record:last-child {
  margin-bottom: 0;
}

.support-record-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.support-amount {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
}

.support-frequency {
  font-size: 11px;
  color: #64748b;
}

.support-type {
  font-size: 12px;
  color: #6366f1;
  margin-bottom: 6px;
}

.support-notes {
  font-size: 12px;
  color: #475569;
  margin: 8px 0;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 8px;
  line-height: 1.4;
}

.file-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.file-link:hover {
  text-decoration: underline;
}
.parent-support-section {
  padding: 12px 20px 20px;
  border-top: 1px solid #eef2ff;
}

.support-title {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 12px;
}

.support-record {
  background: #f8fafc;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #eef2ff;
}

.support-record:last-child {
  margin-bottom: 0;
}

.support-record-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.support-amount {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
}

.support-frequency {
  font-size: 11px;
  color: #64748b;
}

.support-type {
  font-size: 12px;
  color: #6366f1;
  margin-bottom: 6px;
}

.support-notes {
  font-size: 12px;
  color: #475569;
  margin: 8px 0;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 8px;
  line-height: 1.4;
}
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

.support-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.support-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 10px;
  font-size: 12px;
}

.support-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.support-text {
  color: #475569;
  line-height: 1.4;
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

.file-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #eef2ff;
  border-radius: 16px;
}

.file-link:hover {
  background: #e0e7ff;
  text-decoration: underline;
}

@media (max-width: 600px) {
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
}

.spouse-info {
  flex: 1;
}

.spouse-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.spouse-detail {
  font-size: 12px;
  color: #475569;
  margin-bottom: 4px;
}

.spouse-detail span {
  font-weight: 500;
  color: #64748b;
  min-width: 65px;
  display: inline-block;
}

@media (max-width: 600px) {
  .spouse-layout {
    flex-direction: column;
    text-align: center;
  }
}
.file-link-inline {
  color: #6366f1;
  text-decoration: none;
  font-size: 11px;
  margin-left: 12px;
  padding: 2px 8px;
  background: #eef2ff;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.file-link-inline:hover {
  background: #e0e7ff;
  text-decoration: underline;
}
.file-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.file-link:hover {
  text-decoration: underline;
}
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

.file-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 11px;
  padding: 2px 8px;
  background: #eef2ff;
  border-radius: 12px;
}

.file-link:hover {
  background: #e0e7ff;
  text-decoration: underline;
}
/* Add any additional styles needed for the new sections */
.children-list,
.education-list,
.training-list,
.work-list,
.guarantee-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.child-card,
.education-item,
.training-item,
.work-item,
.guarantor-card-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #eef2ff;
}

.child-header,
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

.child-name,
.guarantor-header strong {
  font-size: 15px;
  color: #1e293b;
}

.child-age {
  font-size: 12px;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 12px;
}

.child-details,
.edu-details,
.training-details,
.work-details,
.guarantor-details {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.child-label {
  font-weight: 500;
  color: #64748b;
  min-width: 120px;
  display: inline-block;
}

.child-documents {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.parents-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 20px;
}

.parent-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
}

.parent-box h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6366f1;
}

.support-info {
  padding: 12px 20px 20px;
  border-top: 1px solid #eef2ff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.support-card-item,
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

.file-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
}

.file-link:hover {
  text-decoration: underline;
}

.guarantor-documents {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .parents-grid {
    grid-template-columns: 1fr;
  }
}

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
