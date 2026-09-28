<template>
  <div class="employee-biography">
    <!-- Floating Buttons -->
    <div class="right-float-buttons">
      <button @click="goBack" class="float-btn back-float" title="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <button @click="openSettings" class="float-btn settings-float" title="Settings & Print Selection">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <button @click="printDocument" class="float-btn print-float" title="Print">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2z" />
        </svg>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>በመጫን ላይ...</p>
    </div>

    <div v-else-if="selectedEmployee" class="detail-wrapper">
      <!-- COMPANY HEADER -->
      <div class="company-header">
        <div class="company-logo-text">ሱፐር ደብል ‹‹ቲ›› ጄኔራል ትሬዲንግ ኃ/የተ/የግ/ማህበር</div>
        <div class="company-divider"></div>
        <div class="company-sub-text">የሰራተኛ የህይወት ታሪክ ቅጽ</div>
      </div>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-left">
          <div class="employee-basic">
            <h1>{{ selectedEmployee.fullName }}</h1>
            <div class="employee-tags">
              <span class="tag">{{ selectedEmployee.position || 'የለም' }}</span>
              <span class="tag">{{ selectedEmployee.departmentName || 'የለም' }}</span>
            </div>
          </div>
        </div>
        <div class="employee-avatar-large">
          <img :src="selectedEmployee.profilePictureUrl" :alt="selectedEmployee.fullName" @error="handleImageError" />
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">ክፍል</span><span class="stat-number">{{ selectedEmployee.departmentName || 'የለም' }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">የተቀጠሩበት ቀን</span><span class="stat-number">{{ formatDate(selectedEmployee.hireDateEC) }} ዓ.ም</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">የስራ ዓይነት</span><span class="stat-number">{{ getEmploymentTypeLabel(selectedEmployee.employmentType) }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-3.31 0-6 2.69-6 6 0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6 0-3.31-2.69-6-6-6z" /><path d="M12 2v2M22 12h-2M4 12H2M12 22v2" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">መሰረታዊ ደሞዝ</span><span class="stat-number">{{ formatCurrency(selectedEmployee.basicSalary) }}</span></div>
        </div>
      </div>

      <!-- SECTION 1: PRIMARY CARDS -->
      <div class="content-grid equal-height">
        <div class="left-column">
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>የግል መረጃ</h3>
            </div>
            <div class="grid-list">
              <div class="grid-item">
                <span class="g-label">ሙሉ ስም</span>
                <span class="g-value">{{ selectedEmployee.fullName }}</span>
              </div>
              <div class="grid-item">
                <span class="g-label">ብሔራዊ መታወቂያ (ፋን)</span>
                <span class="g-value">{{ selectedEmployee.nationalId || '—' }}</span>
              </div>
              
              <div class="grid-item">
                <span class="g-label">የስራ ኢሜይል</span>
                <span class="g-value">{{ selectedEmployee.workEmail || selectedEmployee.email || '—' }}</span>
              </div>
              <div class="grid-item">
                <span class="g-label">የግል ኢሜይል</span>
                <span class="g-value">{{ selectedEmployee.personalEmail || '—' }}</span>
              </div>

              <div class="grid-item">
                <span class="g-label">ስልክ ቁጥር</span>
                <span class="g-value">{{ selectedEmployee.phone || selectedEmployee.phoneNumber || '—' }}</span>
              </div>
              <div class="grid-item">
                <span class="g-label">የትውልድ ቀን</span>
                <span class="g-value">{{ formatDate(selectedEmployee.dateOfBirthEC) || '—' }}</span>
              </div>

              <div class="grid-item">
                <span class="g-label">ፆታ</span>
                <span class="g-value">{{ selectedEmployee.gender || '—' }}</span>
              </div>
              <div class="grid-item">
                <span class="g-label">የጋብቻ ሁኔታ</span>
                <span class="g-value">{{ selectedEmployee.maritalStatus || '—' }}</span>
              </div>

              <div class="grid-item full-width">
                <span class="g-label">ዜግነት</span>
                <span class="g-value">{{ selectedEmployee.nationality || '—' }}</span>
              </div>
            </div>
          </div>

          <div class="info-card" v-if="selectedEmployee.birthPlace && Object.keys(selectedEmployee.birthPlace).length">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div><h3>የትውልድ ቦታ</h3></div>
            <div class="grid-list">
              <div class="grid-item"><span class="g-label">ክልል</span><span class="g-value">{{ selectedEmployee.birthPlace.region || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ከተማ</span><span class="g-value">{{ selectedEmployee.birthPlace.city || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ንኡስ ከተማ</span><span class="g-value">{{ selectedEmployee.birthPlace.subcity || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ወረዳ</span><span class="g-value">{{ selectedEmployee.birthPlace.district || '—' }}</span></div>
            </div>
          </div>

          <div class="info-card" v-if="selectedEmployee.currentAddress && Object.keys(selectedEmployee.currentAddress).length">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z" /><circle cx="12" cy="10" r="3" /></svg></div><h3>ወቅታዊ አድራሻ</h3></div>
            <div class="grid-list">
              <div class="grid-item"><span class="g-label">ክልል</span><span class="g-value">{{ selectedEmployee.currentAddress.region || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ንኡስ ከተማ</span><span class="g-value">{{ selectedEmployee.currentAddress.subcity || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ቀበሌ</span><span class="g-value">{{ selectedEmployee.currentAddress.kebele || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ወረዳ</span><span class="g-value">{{ selectedEmployee.currentAddress.district || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ፖስታ ሳጥን</span><span class="g-value">{{ selectedEmployee.currentAddress.poBox || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">የቤት ቁጥር</span><span class="g-value">{{ selectedEmployee.currentAddress.houseNumber || '—' }}</span></div>
            </div>
          </div>
        </div>

        <div class="right-column">
          <div class="info-card">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></div><h3>የስራ መረጃ</h3></div>
            <div class="grid-list">
              <div class="grid-item"><span class="g-label">ክፍል</span><span class="g-value">{{ selectedEmployee.departmentName || 'የለም' }}</span></div>
              <div class="grid-item"><span class="g-label">የስራ መደብ</span><span class="g-value">{{ selectedEmployee.position || 'የለም' }}</span></div>
              <div class="grid-item"><span class="g-label">የስራ ዓይነት</span><span class="g-value">{{ getEmploymentTypeLabel(selectedEmployee.employmentType) }}</span></div>
              <div class="grid-item"><span class="g-label">የተቀጠሩበት ቀን</span><span class="g-value">{{ formatDate(selectedEmployee.hireDateEC) }} ዓ.ም</span></div>
              <div class="grid-item"><span class="g-label">አስተዳዳሪ</span><span class="g-value">{{ selectedEmployee.managerName || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">የስራ ቦታ</span><span class="g-value">{{ selectedEmployee.workLocation || '—' }}</span></div>
              <div class="grid-item full-width"><span class="g-label">የስራ ፈረቃ</span><span class="g-value">{{ selectedEmployee.shiftType || '—' }}</span></div>
            </div>
          </div>

          <div class="info-card" v-if="selectedEmployee.permanentAddress && Object.keys(selectedEmployee.permanentAddress).length">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z" /><circle cx="12" cy="10" r="3" /></svg></div><h3>ቋሚ አድራሻ</h3></div>
            <div class="grid-list">
              <div class="grid-item"><span class="g-label">ክልል</span><span class="g-value">{{ selectedEmployee.permanentAddress.region || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ንኡስ ከተማ</span><span class="g-value">{{ selectedEmployee.permanentAddress.subcity || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ቀበሌ</span><span class="g-value">{{ selectedEmployee.permanentAddress.kebele || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ወረዳ</span><span class="g-value">{{ selectedEmployee.permanentAddress.district || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ፖስታ ሳጥን</span><span class="g-value">{{ selectedEmployee.permanentAddress.poBox || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">የቤት ቁጥር</span><span class="g-value">{{ selectedEmployee.permanentAddress.houseNumber || '—' }}</span></div>
            </div>
          </div>

          <div class="info-card emergency-card" v-if="selectedEmployee.emergencyContact && Object.keys(selectedEmployee.emergencyContact).length">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></div><h3>የአደጋ ጊዜ መገናኛ</h3></div>
            <div class="grid-list">
              <div class="grid-item"><span class="g-label">የመገናኛ ስም</span><span class="g-value">{{ selectedEmployee.emergencyContact.name || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ዝምድና</span><span class="g-value">{{ selectedEmployee.emergencyContact.relationship || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ስልክ ቁጥር</span><span class="g-value">{{ selectedEmployee.emergencyContact.phone || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">ሌላ ስልክ</span><span class="g-value">{{ selectedEmployee.emergencyContact.alternatePhone || '—' }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: EXTRA CARDS -->
      <div class="content-grid equal-height">
        <div class="left-column">
          <div class="info-card" v-if="selectedEmployee.spouseInfo && Object.keys(selectedEmployee.spouseInfo).length">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div><h3>የትዳር አጋር መረጃ</h3></div>
            <div class="grid-list cols-auto">
              <div class="grid-item full-width spouse-name-item">
                <span class="g-label">ሙሉ ስም</span>
                <div class="spouse-name-display">
                  <img :src="selectedEmployee.spouseInfo.profilePictureUrl" alt="Spouse" class="spouse-avatar-small" @error="handleSpouseImageError" />
                  <span class="g-value big-name">{{ selectedEmployee.spouseInfo.fullName || '—' }}</span>
                </div>
              </div>
              <div class="grid-item"><span class="g-label">የቲን ቁጥር</span><span class="g-value">{{ selectedEmployee.spouseInfo.tinNumber || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">የትውልድ ቀን</span><span class="g-value">{{ formatDate(selectedEmployee.spouseInfo.dateOfBirth) || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">የስራ ሁኔታ</span><span class="g-value">{{ selectedEmployee.spouseInfo.jobStatus || '—' }}</span></div>
              <div class="grid-item"><span class="g-label">የኩባንያ ስም</span><span class="g-value">{{ selectedEmployee.spouseInfo.companyName || '—' }}</span></div>
              <div class="grid-item full-width"><span class="g-label">የኩባንያ አድራሻ</span><span class="g-value">{{ selectedEmployee.spouseInfo.companyAddress || '—' }}</span></div>
            </div>
          </div>
        </div>

        <div class="right-column">
          <div class="info-card" v-if="selectedEmployee.children && selectedEmployee.children.length">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg></div><h3>ልጆች ({{ selectedEmployee.children.length }})</h3></div>
            <div class="children-grid-list">
              <div v-for="(child, idx) in selectedEmployee.children" :key="idx" class="child-grid-item">
                <div class="child-grid-avatar"><img :src="child.profilePictureUrl" alt="Child" class="child-avatar-image" @error="handleChildImageError" /></div>
                <div class="child-grid-info">
                  <div class="child-grid-name">{{ child.name }} <span class="child-grid-age">({{ calculateAge(child.dateOfBirth) }} ዓመት)</span></div>
                  <div class="child-grid-detail"><span>የትውልድ ቀን:</span> {{ formatDate(child.dateOfBirth) || '—' }}</div>
                  <div class="child-grid-detail"><span>የጤና ችግር:</span> {{ child.hasMedicalCondition ? 'አለ' : 'የለም' }}</div>
                  <div class="child-grid-detail" v-if="child.medicalConditionNotes"><span>ማስታወሻ:</span> {{ child.medicalConditionNotes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid equal-height">
        <div class="left-column">
          <div class="info-card" v-if="selectedEmployee.parentsInfo && (selectedEmployee.parentsInfo.father || selectedEmployee.parentsInfo.mother)">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div><h3>የወላጆች መረጃ</h3></div>
            <div class="grid-list cols-auto">
              <div class="grid-item parent-grid-item">
                <span class="g-label">አባት</span>
                <div class="g-value">{{ selectedEmployee.parentsInfo.father?.fullName || '—' }}</div>
                <div class="g-sub-meta"><span>ስራ:</span> {{ selectedEmployee.parentsInfo.father?.job || '—' }} <span style="margin-left:15px;">ገቢ:</span> {{ formatCurrency(selectedEmployee.parentsInfo.father?.monthlyIncome) }}</div>
              </div>
              <div class="grid-item parent-grid-item">
                <span class="g-label">እናት</span>
                <div class="g-value">{{ selectedEmployee.parentsInfo.mother?.fullName || '—' }}</div>
                <div class="g-sub-meta"><span>ስራ:</span> {{ selectedEmployee.parentsInfo.mother?.job || '—' }} <span style="margin-left:15px;">ገቢ:</span> {{ formatCurrency(selectedEmployee.parentsInfo.mother?.monthlyIncome) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="right-column">
          <div class="info-card allowances-card">
            <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div><h3>ካሳ እና አበል</h3></div>
            <div class="grid-list cols-auto">
              <div class="grid-item"><span class="g-label">መሰረታዊ ደሞዝ</span><span class="g-value">{{ formatCurrency(selectedEmployee.basicSalary) }}</span></div>
              <div class="grid-item"><span class="g-label">የቤት አበል</span><span class="g-value">{{ formatCurrency(selectedEmployee.housingAllowance) }}</span></div>
              <div class="grid-item"><span class="g-label">የሹመት አበል</span><span class="g-value">{{ formatCurrency(selectedEmployee.positionAllowance) }}</span></div>
              <div class="grid-item"><span class="g-label">የትራንስፖርት አበል</span><span class="g-value">{{ formatCurrency(selectedEmployee.transportAllowance) }}</span></div>
              <div class="grid-item"><span class="g-label">የሞባይል አበል</span><span class="g-value">{{ formatCurrency(selectedEmployee.mobileAllowance) }}</span></div>
              <div class="grid-item highlight-total"><span class="g-label-bold">ጠቅላላ አበል</span><span class="g-value-bold highlight-orange">{{ formatCurrency(totalAllowances) }}</span></div>
              <div class="grid-item full-width highlight-gross"><span class="g-label-bold">ጠቅላላ ወርሃዊ ክፍያ</span><span class="g-value-bold highlight-green">{{ formatCurrency(grossPay) }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- SECTION 3: PAPER STYLE TABLES               -->
      <!-- ========================================== -->
      
      <!-- 1. Language Skills Table -->
      <div class="info-card table-card" v-if="selectedEmployee.languageSkills && selectedEmployee.languageSkills.length">
        <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h10M9 4v4M11 12h8M15 8v4" /><path d="M2 2h20v20H2z" /></svg></div><h3>የቋንቋ ክህሎት / የቋንቋውን ዓይነት በመፍ ✓ ምልክት ያድርጉ</h3></div>
        <div class="table-wrapper">
          <table class="paper-grid-table complex-header">
            <thead>
              <tr>
                <th rowspan="2" class="lang-main-header">ቋንቋው</th>
                <th colspan="3">ማንበብ</th>
                <th colspan="3">መፃፍ</th>
                <th colspan="3">መናገር</th>
                <th colspan="3">ማዳመጥ</th>
              </tr>
              <tr>
                <th>በጥሩ</th><th>ጥሩ</th><th>መካከለኛ</th>
                <th>በጥሩ</th><th>ጥሩ</th><th>መካከለኛ</th>
                <th>በጥሩ</th><th>ጥሩ</th><th>መካከለኛ</th>
                <th>በጥሩ</th><th>ጥሩ</th><th>መካከለኛ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lang, idx) in selectedEmployee.languageSkills" :key="idx">
                <td><strong>{{ lang.language || '—' }}</strong></td>
                <!-- Logic: If native/fluent -> "✓", if intermediate -> "✓" in middle, else empty -->
                <td class="center-text">{{ (lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '' }}</td>
                <td class="center-text">{{ (lang.proficiency === 'intermediate') ? '✓' : '' }}</td>
                <td class="center-text"></td>
                
                <td class="center-text">{{ (lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '' }}</td>
                <td class="center-text">{{ (lang.proficiency === 'intermediate') ? '✓' : '' }}</td>
                <td class="center-text"></td>
                
                <td class="center-text">{{ (lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '' }}</td>
                <td class="center-text">{{ (lang.proficiency === 'intermediate') ? '✓' : '' }}</td>
                <td class="center-text"></td>
                
                <td class="center-text">{{ (lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '' }}</td>
                <td class="center-text">{{ (lang.proficiency === 'intermediate') ? '✓' : '' }}</td>
                <td class="center-text"></td>
              </tr>
              <!-- REMOVED EMPTY FILLER ROWS -->
            </tbody>
          </table>
        </div>
        <div v-if="selectedEmployee.otherSkills" class="other-skills-section"><strong>ሌሎች ክህሎቶች:</strong> {{ selectedEmployee.otherSkills }}</div>
      </div>

      <!-- 2. Work Experience Table (Previous Jobs) -->
      <div class="info-card table-card" v-if="selectedEmployee.workExperience && selectedEmployee.workExperience.length">
        <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></div><h3>ከዚህ ቀደም ያለ የስራ ልምድ (ከዚህ ቀደም ማስረጃዎትን ያላቀረቡ ከሆነ ከሂውን ከዚህ ቅፅ ጋር ያያይዙ)</h3></div>
        <div class="table-wrapper">
          <table class="paper-grid-table">
            <thead>
              <tr>
                <th>የስራ መደብ</th>
                <th>የመስሪያ ቤት ስም</th>
                <th>ከዓ/ም. እስከ ዓ/ም</th>
                <th>ቦታ</th>
                <th>የተገኘ ማስረጃ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(work, idx) in selectedEmployee.workExperience" :key="idx">
                <td>{{ work.position || '—' }}</td>
                <td>{{ work.companyName || '—' }}</td>
                <td>{{ work.startDate || '—' }} - {{ work.endDate || 'እስካሁን' }}</td>
                <td>{{ work.companyAddress || '—' }}</td>
                <td>{{ work.providentFundSubmitted === 'yes' ? 'ቀርቧል' : '—' }}</td>
              </tr>
              <!-- REMOVED EMPTY FILLER ROWS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. Reference Table (Previous Jobs - using workExperience as substitute) -->
      <div class="info-card table-card" v-if="selectedEmployee.workExperience && selectedEmployee.workExperience.length">
        <div class="card-header"><div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div><h3>የወሰዱት ስልጠና (ከዚህ ቀደም ማስረጃዎትን ያላቀረቡ ከሆነ ከሂውን ከዚህ ቅፅ ጋር ያያይዙ)</h3></div>
        <div class="table-wrapper">
          <table class="paper-grid-table">
            <thead>
              <tr>
                <th>የተወሰደ ስልጠና</th>
                <th>የተቋሙ ስም</th>
                <th>የአገልግሎት ዘመን ከ ዓ/ም. እስከ ዓ/ም</th>
                <th>ቦታ</th>
                <th>የተገኘ ማስረጃ</th>
              </tr>
            </thead>
            <tbody>
              <!-- Mapping Education data to this table -->
              <tr v-for="(edu, idx) in selectedEmployee.education" :key="idx">
                <td>{{ edu.field || '—' }}</td>
                <td>{{ edu.institutionName || '—' }}</td>
                <td>{{ edu.startDate || '—' }} - {{ edu.endDate || '—' }}</td>
                <td>{{ edu.institutionAddress || '—' }}</td>
                <td>{{ edu.isCurrent ? 'በመማር ላይ' : 'ተጠናቋል' }}</td>
              </tr>
              <!-- REMOVED EMPTY FILLER ROWS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- SECTION 4: FINAL DECLARATION & ADMIN (LAST)  -->
      <!-- ========================================== -->
      <div class="page-break final-section">
        <!-- 1. Checkbox Row -->
        <div class="declaration-section">
          <h3 class="section-title">ማረጋገጫ</h3>
          <div class="check-row-block">
            <div class="check-row">
              <span class="q-text">የአካል ጉዳት አለብዎት?</span>
              <div class="check-opt">
                <span class="q-label">አዎን</span>
                <span class="square-box"></span>
                <span class="q-label">የለም</span>
                <span class="square-box checked">✓</span>
              </div>
            </div>
            <div class="check-row">
              <span class="q-text">ካለ ምን ዓይነት ነው?</span>
              <span class="input-line-large"></span>
            </div>
            <div class="check-row">
              <span class="q-text">በማንኛውም ዓይነት ወንጀል ተቀጥተው ያውቃሉ?</span>
              <div class="check-opt">
                <span class="q-label">አዎን</span>
                <span class="square-box"></span>
                <span class="q-label">የለም</span>
                <span class="square-box checked">✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Declaration & Signature Block -->
        <div class="declaration-block-border">
          <p class="declaration-text">
            እኔ ስሜ ከዚህ በታች የተገለጸው በዚህ የሰራተኛ መረጃ መጠየቂያ ቅጽ ላይ ያስፈረኩት መረጃ በሙሉ እውነትና ትክክለኛ መሆኑን እንዲሁም በድርጅቱ ወስጥ ለመቀጠር የመቀጠሪያ የትምህርት ማስረጃ፣ የስራ ልምድ ማስረጃና ሌሎች ማስረጃዎች ትክክለኛ መሆናቸውን ነገር ግን ስህተት ሆነው ቢገኙ በህግ የምንቀጣ መሆኔን በፊርሜ አረጋግጣለሁ።
          </p>
          <div class="sig-line-large">
            <span class="sig-label">የሰራተኛው ስም</span>
            <span class="sig-underline-large">{{ selectedEmployee.fullName }}</span>
          </div>
          <div class="sig-line-large split-sig">
            <div>
              <span class="sig-label">ፊርማ</span>
              <span class="sig-underline-large"></span>
            </div>
            <div>
              <span class="sig-label">ቀን</span>
              <span class="sig-underline-large"></span>
            </div>
          </div>
        </div>

        <!-- 3. Admin Block -->
        <div class="admin-block-border">
          <div class="admin-header-bar">በለውሀብት የሚሞላ</div>
          <div class="admin-body">
            <div class="admin-date-row">
              <span class="admin-label-wide">ሰራተኛው/ዋ በድርጅቱ የተቀጠረበት/ችበት ቀን :-</span>
              <div class="admin-date-parts">
                <span class="admin-date-underlined">25</span> ቀን 
                <span class="admin-date-underlined">04</span> ወር  
                <span class="admin-date-underlined">2018</span> ዓ.ም
              </div>
            </div>
            
            <div class="admin-fields-grid">
              <div class="admin-field-row"><span class="admin-label">የቅጥር ሁኔታ</span><span class="admin-field-under">በቋሚነት</span></div>
              <div class="admin-field-row"><span class="admin-label">የስራ መደብ</span><span class="admin-field-under">ኬሚስት</span></div>
              <div class="admin-field-row"><span class="admin-label">ወርሃዊ ደመወዝ</span><span class="admin-field-under">12000</span></div>
            </div>

            <div class="admin-sig-block">
              <div class="admin-sig-row">
                <span class="admin-label">የሀላፊ ስምና ፊርማ</span>
                <span class="admin-field-long"></span>
              </div>
              <div class="admin-sig-row">
                <span class="admin-label">ቀን</span>
                <span class="admin-field-long"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>

    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" /></svg>
      <h3>ምንም ሰራተኛ አልተመረጠም</h3>
      <p>እባክዎ የሰራተኛ መረጃ ለማየት ከቅንብሮች ውስጥ ሰራተኛ ይምረጡ።</p>
      <button @click="openSettings" class="action-btn primary">ቅንብሮች ክፈት</button>
    </div>

    <!-- Settings Modal with File Print Selection -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-container">
        <div class="modal-header"><h2>ቅንብሮች - የሰራተኛ የህይወት ታሪክ</h2><button @click="showSettings = false" class="close-btn">&times;</button></div>
        <div class="modal-body">
          <div class="field-group">
            <label>ሰራተኛ ምረጥ</label>
            <div class="searchable-select">
              <input type="text" v-model="employeeSearchTerm" @input="filterEmployees" @focus="showDropdown = true" @blur="handleBlur" placeholder="ሰራተኛ ፈልግ..." class="search-input" />
              <div v-if="showDropdown && filteredEmployees.length > 0" class="dropdown-list">
                <div v-for="emp in filteredEmployees" :key="emp.id" class="dropdown-item" @mousedown.prevent="selectEmployee(emp)">
                  <span class="emp-name">{{ emp.fullName }}</span><span class="emp-id">{{ emp.employeeId }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedEmployee" class="selected-display"><span>{{ selectedEmployee.fullName }}</span><button @click="clearSelection" class="clear-btn">✕</button></div>
          </div>

          <div class="field-divider">ለማተም የሚፈለጉ ፋይሎችን ይምረጡ</div>
          <div class="file-select-list">
            <label class="file-check-item"><input type="checkbox" v-model="printFiles.includeDeclaration" /><span>የማረጋገጫ እና የአስተዳደር ቅጽ (ገጽ 4)</span></label>
            <label class="file-check-item"><input type="checkbox" v-model="printFiles.includeTables" /><span>የትምህርት እና የስራ ልምድ ሰንጠረዦች (ገጽ 3)</span></label>
            <label class="file-check-item"><input type="checkbox" v-model="printFiles.includeSupporting" /><span>ደጋፊ ካርዶች (አድራሻ፣ ትዳር፣ ልጆች፣ ወላጆች) (ገጽ 2)</span></label>
            <label class="file-check-item"><input type="checkbox" v-model="printFiles.includeAllowances" /><span>የካሳ እና አበል ካርድ</span></label>
            <label class="file-check-item"><input type="checkbox" v-model="printFiles.includeBasicInfo" /><span>መሰረታዊ መረጃ (ስም፣ ስራ፣ ፎቶ) (ገጽ 1)</span></label>
          </div>

          <div class="field-divider">የታሪክ ቀን</div>
          <div class="field-group"><label>ቀን</label><input v-model="biographyDate" placeholder="__________" /></div>
        </div>
        <div class="modal-footer"><button @click="showSettings = false" class="cancel-btn">ሰርዝ</button><button @click="applyData" class="save-btn">አስቀምጥ እና አትም</button></div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// UI state
const showSettings = ref(false)
const toasts = ref([])
const loading = ref(false)
const biographyDate = ref('')

const printFiles = ref({
  includeDeclaration: true, includeTables: true, includeSupporting: true,
  includeAllowances: true, includeBasicInfo: true
})

const employees = ref([
  { 
    id: 1, fullName: 'አሸናፊ ንጉሱ ብዙአለም', employeeId: 'SDT-0012',
    position: 'ኬሚስት', departmentName: 'ላቦራቶሪ',
    basicSalary: 12000, housingAllowance: 800, positionAllowance: 500,
    transportAllowance: 400, mobileAllowance: 200,
    hireDateEC: '25/04/2018', dateOfBirthEC: '12/10/1978',
    gender: 'ወንድ', maritalStatus: 'ያገባ', nationality: 'ኢትዮጵያዊ',
    nationalId: '0003600429',
    workEmail: 'ashenafi@superdoublet.com', personalEmail: 'ashenafi.k@gmail.com',
    phone: '0911689799', status: 'active', employmentType: 'full-time',
    workLocation: 'ዋና መሥሪያ ቤት, አዲስ አበባ', shiftType: 'day',
    profilePictureUrl: 'https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=አሸናፊ+ንጉሱ',
    birthPlace: { region: 'አዲስ አበባ', city: 'አዲስ አበባ', subcity: 'ቦሌ', district: 'ወረዳ 08' },
    currentAddress: { region: 'አዲስ አበባ', subcity: 'ንፋስ ስልክ ላፍቶ', kebele: '12', district: 'ወረዳ 12', poBox: '1234', houseNumber: '1052' },
    permanentAddress: { region: 'አዲስ አበባ', subcity: 'ንፋስ ስልክ ላፍቶ', kebele: '12', district: 'ወረዳ 12', poBox: '1234', houseNumber: '1052' },
    emergencyContact: { name: 'ሰላም አሸናፊ', relationship: 'ሚስት', phone: '0912345678', alternatePhone: '0923456789' },
    spouseInfo: { fullName: 'ሰላም አሸናፊ', profilePictureUrl: 'https://ui-avatars.com/api/?background=FF5733&color=fff&bold=true&size=80&name=ሰላም+አሸናፊ', tinNumber: '123456789', dateOfBirth: '15/05/1980', jobStatus: 'government', companyName: 'ጤና ሚኒስቴር', companyAddress: 'አዲስ አበባ, ካሳንቺስ' },
    children: [
      { name: 'ሳምራ አሸናፊ', profilePictureUrl: 'https://ui-avatars.com/api/?background=FFC300&color=fff&bold=true&size=60&name=ሳምራ', dateOfBirth: '10/03/2010', hasMedicalCondition: false, isAdopted: false },
      { name: 'ሳሙኤል አሸናፊ', profilePictureUrl: 'https://ui-avatars.com/api/?background=33FF57&color=fff&bold=true&size=60&name=ሳሙኤል', dateOfBirth: '22/07/2013', hasMedicalCondition: false, isAdopted: false }
    ],
    parentsInfo: { father: { fullName: 'ንጉሱ ብዙአለም', job: 'ጡረተኛ', monthlyIncome: 5000 }, mother: { fullName: 'አለም ዘሪሁን', job: 'የቤት እመቤት', monthlyIncome: 0 } },
    education: [
      { level: 'ዲግሪ', institutionName: 'ጂማ ዩንቨርስቲ', startDate: '2016', endDate: '2019', isCurrent: false, field: 'ኬሚስትሪ' },
      { level: 'ዲፕሎማ', institutionName: 'አዲስ አበባ ቴክኒክ ኮሌጅ', startDate: '2012', endDate: '2014', isCurrent: false, field: 'ላቦራቶሪ ቴክኖሎጂ' }
    ],
    workExperience: [
      { position: 'ከፍተኛ ኬሚስት', companyName: 'ኢትዮጵያ ፋርማሲ', startDate: '2015', endDate: '2018', monthlySalary: 8000, providentFundSubmitted: 'yes' }
    ],
    languageSkills: [
      { language: 'አማርኛ', proficiency: 'native' }, { language: 'እንግሊዝኛ', proficiency: 'fluent' }, { language: 'ኦሮምኛ', proficiency: 'intermediate' }
    ],
    otherSkills: 'ፕሮጀክት አስተዳደር፣ የላቦራቶሪ አስተዳደር፣ የጥራት ቁጥጥር',
    bankAccount: { bankName: 'አዋሽ ባንክ', accountNumber: '1234567890', accountHolderName: 'አሸናፊ ንጉሱ', branch: 'ቦሌ' }
  }
])

const selectedEmployee = ref(null)
const employeeSearchTerm = ref('')
const filteredEmployees = ref([])
const showDropdown = ref(false)

const totalAllowances = computed(() => {
  if (!selectedEmployee.value) return 0
  const housing = parseFloat(selectedEmployee.value?.housingAllowance) || 0
  const position = parseFloat(selectedEmployee.value?.positionAllowance) || 0
  const transport = parseFloat(selectedEmployee.value?.transportAllowance) || 0
  const mobile = parseFloat(selectedEmployee.value?.mobileAllowance) || 0
  return housing + position + transport + mobile
})

const grossPay = computed(() => {
  if (!selectedEmployee.value) return 0
  const basic = parseFloat(selectedEmployee.value?.basicSalary) || 0
  return basic + totalAllowances.value
})

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—"
  const num = Number(value)
  if (isNaN(num)) return "—"
  return `ብር ${num.toLocaleString()}`
}

const formatDate = (date) => {
  if (!date) return "—"
  if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return date
  }
  return date
}

const getEmploymentTypeLabel = (type) => {
  const labels = { 'full-time': 'ሙሉ ጊዜ', 'part-time': 'የትርፍ ጊዜ', contract: 'ውል', intern: 'ተለማማጅ' }
  return labels[type] || type || '—'
}

const getProficiencyLabel = (proficiency) => {
  const labels = { native: 'የአፍ ቋንቋ', fluent: 'አቀላጥፎ', advanced: 'የላቀ', intermediate: 'መካከለኛ', basic: 'መሰረታዊ' }
  return labels[proficiency] || proficiency || '—'
}

const getProficiencyClass = (proficiency) => {
  const classes = { native: 'native', fluent: 'fluent', advanced: 'advanced', intermediate: 'intermediate', basic: 'basic' }
  return classes[proficiency] || ''
}

const getAvatarUrl = (name) => {
  if (!name) return "https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=User"
  return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name)}`
}

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "?"
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const handleImageError = (e) => { e.target.src = getAvatarUrl(selectedEmployee.value?.fullName || "Employee") }
const handleSpouseImageError = (e) => { e.target.src = getAvatarUrl(selectedEmployee.value?.spouseInfo?.fullName || "Spouse") }
const handleChildImageError = (e) => { e.target.src = "https://ui-avatars.com/api/?background=FFC300&color=fff&bold=true&size=60&name=C" }

const filterEmployees = () => {
  const term = employeeSearchTerm.value.toLowerCase().trim()
  if (!term) { filteredEmployees.value = []; return }
  filteredEmployees.value = employees.value.filter(emp => emp.fullName.toLowerCase().includes(term) || emp.employeeId.toLowerCase().includes(term))
}

const selectEmployee = (emp) => {
  selectedEmployee.value = emp
  employeeSearchTerm.value = emp.fullName
  showDropdown.value = false
  addToast(`ሰራተኛ ተመርጧል: ${emp.fullName}`, 'success')
}

const clearSelection = () => { selectedEmployee.value = null; employeeSearchTerm.value = '' }
const handleBlur = () => { setTimeout(() => { showDropdown.value = false }, 200) }

const goBack = () => router.push('/documents-letters')
const openSettings = () => (showSettings.value = true)

const applyData = () => {
  showSettings.value = false
  addToast('የህይወት ታሪክ በተሳካ ሁኔታ ተዘምኗል!', 'success')
  printDocument()
}

// Print document
const printDocument = () => {
  const printWindow = window.open('', '')
  const contentHtml = document.querySelector('.employee-biography .detail-wrapper')?.innerHTML || ''

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title></title> <!-- Empty title removes 'about:blank' -->
        <style>
          /* Removes browser header/footer "7/31/26..." etc */
          @page { size: A4; margin: 0; }
          
          html, body { 
            width: 100%; 
            min-height: 100vh; 
            margin: 0; 
            padding: 0; 
            background: white; 
            font-family: "Nyala", "Abyssinica SIL", serif; 
            box-sizing: border-box;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            box-sizing: border-box;
          }
          .right-float-buttons, .modal-overlay, .toast-container { display: none !important; }
          body * { visibility: hidden; }
          .employee-biography, .employee-biography * { visibility: visible; }
          .employee-biography { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            padding: 0; 
            background: white; 
          }
          .detail-wrapper { 
            max-width: 100%; 
            margin: 0 auto; 
            padding: 15mm 15mm; /* Uses padding to push content away from edges */
          }
          .hero-section { background: white; padding: 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .hero-left { display: flex; align-items: center; gap: 32px; }
          .employee-avatar-large { width: 120px; height: 150px; flex-shrink: 0; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
          .employee-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
          .employee-basic h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
          .employee-tags { display: flex; gap: 12px; flex-wrap: wrap; }
          .tag { padding: 5px 14px; background: #f1f5f9; border-radius: 20px; font-size: 13px; font-weight: 500; color: #475569; }
          .stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .stat-card { background: white; padding: 14px 16px; display: flex; align-items: center; gap: 14px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .stat-card-icon { width: 40px; height: 40px; background: #f1f5f9; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .stat-card-info { display: flex; flex-direction: column; gap: 2px; }
          .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-number { font-size: 14px; font-weight: 600; color: #1e293b; }
          .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .left-column, .right-column { display: flex; flex-direction: column; gap: 20px; }
          .info-card { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 20px; }
          .card-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #fafcfc; border-bottom: 1px solid #e9edf2; }
          .card-header-icon { width: 28px; height: 28px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
          .card-header h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }
          .grid-list { padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; row-gap: 14px; }
          .grid-list.cols-auto { grid-template-columns: 1fr 1fr; }
          .grid-item { display: flex; flex-direction: column; gap: 4px; }
          .grid-item.full-width { grid-column: 1 / -1; }
          .g-label { font-size: 12px; color: #64748b; font-weight: 500; }
          .g-value { font-size: 14px; font-weight: 500; color: #1e293b; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
          .g-sub-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .g-label-bold { font-size: 13px; color: #1e293b; font-weight: 700; }
          .g-value-bold { font-size: 15px; font-weight: 700; padding-bottom: 4px; }
          .highlight-orange { color: #f59e0b; }
          .highlight-green { color: #10b981; }
          .highlight-total { margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
          .highlight-gross { margin-top: 4px; padding-top: 10px; border-top: 2px solid #e2e8f0; }
          
          .spouse-name-display { display: flex; align-items: center; gap: 12px; }
          .spouse-avatar-small { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; }
          .g-value.big-name { font-size: 16px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; flex: 1; }
          
          .children-grid-list { padding: 16px 20px; display: grid; grid-template-columns: 1fr; gap: 14px; }
          .child-grid-item { display: flex; gap: 14px; background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #eef2ff; }
          .child-grid-avatar { width: 50px; height: 50px; flex-shrink: 0; border-radius: 50%; overflow: hidden; background: #f1f5f9; }
          .child-grid-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .child-grid-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .child-grid-name { font-size: 15px; font-weight: 600; color: #1e293b; }
          .child-grid-age { font-size: 12px; color: #10b981; background: #d1fae5; padding: 2px 10px; border-radius: 20px; margin-left: 8px; }
          .child-grid-detail { font-size: 13px; color: #475569; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
          .child-grid-detail span { font-weight: 500; color: #64748b; }
          
          .parent-grid-item .g-value { border-bottom: none; padding-bottom: 0; }

          /* NEW PAPER TABLE STYLES */
          .paper-grid-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: center; }
          .paper-grid-table th, .paper-grid-table td { border: 1px solid #000; padding: 8px 6px; }
          .paper-grid-table th { background: #f8fafc; font-weight: bold; }
          .paper-grid-table.complex-header th { vertical-align: middle; }
          .paper-grid-table .lang-main-header { width: 15%; }
          .center-text { text-align: center; }
          
          .other-skills-section { padding: 12px 20px; border-top: 1px solid #eef2ff; font-size: 13px; color: #475569; }

          /* Company Header Print CSS */
          .company-header { text-align: center; margin-bottom: 20px; border-bottom: 2px ; padding-bottom: 15px; }
          .company-logo-text { font-size: 20px; font-weight: bold; color: #000; }
          .company-divider { border-top: 1px solid #ccc; margin: 10px 0; }
          .company-sub-text { font-size: 16px; text-decoration: underline; }

          /* FINAL SECTION - PAPER FORM STYLES - PRINT OPTIMIZED */
          .final-section { max-width: 100%; margin: 20px auto 0; display: flex; flex-direction: column; gap: 30px; font-family: 'Nyala', 'Abyssinica SIL', serif; page-break-before: always; }
          .declaration-section { padding: 0 10px; }
          .section-title { text-decoration: underline; text-underline-offset: 4px; font-weight: bold; font-size: 18px; margin-bottom: 25px; }
          .check-row-block { display: flex; flex-direction: column; gap: 18px; }
          .check-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 30px; font-size: 16px; }
          .check-opt { display: flex; align-items: center; gap: 8px; }
          .q-label { font-size: 16px; }
          .square-box { display: inline-flex; align-items: center; justify-content: center; width: 35px; height: 30px; border: 1.5px solid #000; font-weight: bold; font-size: 18px; }
          .square-box.checked { color: #000; }
          .input-line-large { display: inline-block; border-bottom: 1px solid #000; flex: 1; min-width: 150px; height: 1px; margin-top: 5px; }
          
          .declaration-block-border { border: 2px solid #000; padding: 20px 25px; background: white; border-radius: 4px; }
          .declaration-text { font-size: 15px; line-height: 1.8; margin-bottom: 30px; text-align: justify; }
          .sig-line-large { display: flex; align-items: baseline; gap: 15px; margin-bottom: 20px; font-size: 16px; }
          .split-sig { justify-content: space-between; padding: 0 50px; }
          .sig-label { font-weight: bold; }
          .sig-underline-large { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; flex: 1; height: 20px; }
          
          .admin-block-border { border: 2px solid #000; background: white; border-radius: 4px; overflow: hidden; }
          .admin-header-bar { background: #9e9256; color: #000; font-weight: bold; font-size: 18px; padding: 8px 15px; border-bottom: 2px solid #000; }
          .admin-body { padding: 25px 30px; }
          .admin-date-row { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; font-size: 16px; flex-wrap: wrap; }
          .admin-date-parts { display: flex; align-items: center; gap: 6px; }
          .admin-date-underlined { display: inline-block; border-bottom: 1px solid #000; padding: 0 4px; min-width: 25px; text-align: center; }
          .admin-label-wide { font-weight: bold; }
          .admin-fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 35px; }
          .admin-field-row { display: flex; flex-direction: column; gap: 5px; }
          .admin-label { font-weight: bold; font-size: 15px; }
          .admin-field-under { display: inline-block; border-bottom: 1px solid #000; padding: 0 5px; width: 100%; font-weight: 600; font-size: 15px; }
          .admin-sig-block { display: flex; flex-direction: column; gap: 20px; padding-left: 200px; }
          .admin-sig-row { display: flex; align-items: baseline; gap: 15px; font-size: 15px; }
          .admin-field-long { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; width: 200px; height: 20px; }

          @media print {
            .right-float-buttons, .modal-overlay, .toast-container { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="employee-biography">
          <div class="detail-wrapper">
            ${contentHtml}
          </div>
        </div>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
  addToast('ወደ አታሚ ተልኳል!', 'success')
}

const addToast = (message, type) => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 3000)
}

onMounted(() => {
  if (employees.value.length > 0) {
    selectedEmployee.value = employees.value[0]
  }
})
</script>

<style scoped>
.employee-biography { min-height: 100vh; background: #f5f7fb; padding: 20px; }

/* ========== COMPANY HEADER ========== */
.company-header { text-align: center; margin-bottom: 28px; padding: 20px; background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); max-width: 1200px; margin-left: auto; margin-right: auto; border: 1px solid #e9edf2; }
.company-logo-text { font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 1px; }
.company-divider { border-bottom: 2px solid #d1d5db; width: 30%; margin: 10px auto; }
.company-sub-text { font-size: 16px; font-weight: 600; color: #475569; text-decoration: underline; }

/* ========== FLOATING BUTTONS ========== */
.right-float-buttons { position: fixed; right: 24px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 12px; z-index: 200; }
.float-btn { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; border: none; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.float-btn svg { width: 24px; height: 24px; }
.back-float { background: white; color: #333; }
.back-float:hover { background: #f0f0f0; transform: scale(1.05); }
.settings-float { background: #f59e0b; color: white; }
.settings-float:hover { background: #d97706; transform: scale(1.05); }
.print-float { background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; }
.print-float:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(106, 17, 203, 0.3); }

/* ========== HERO SECTION ========== */
.hero-section { background: white; border-radius: 24px; padding: 32px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); max-width: 1200px; margin-left: auto; margin-right: auto; }
.hero-left { display: flex; align-items: center; gap: 32px; flex: 1; }
.employee-basic h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
.employee-tags { display: flex; gap: 12px; flex-wrap: wrap; }
.tag { padding: 5px 14px; background: #f1f5f9; border-radius: 20px; font-size: 13px; font-weight: 500; color: #475569; }
.employee-avatar-large { width: 120px; height: 150px; flex-shrink: 0; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; background: #f1f5f9; }
.employee-avatar-large img { width: 100%; height: 100%; object-fit: cover; }

/* ========== STATS CARDS ========== */
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; max-width: 1200px; margin-left: auto; margin-right: auto; }
.stat-card { background: white; border-radius: 20px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
.stat-card-icon { width: 48px; height: 48px; background: #f1f5f9; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.stat-card-icon svg { width: 24px; height: 24px; color: #6366f1; }
.stat-card-info { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-number { font-size: 14px; font-weight: 600; color: #1e293b; }

/* ========== CONTENT GRID & EQUAL HEIGHTS ========== */
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1200px; margin-left: auto; margin-right: auto; margin-bottom: 24px; }
.left-column, .right-column { display: flex; flex-direction: column; gap: 24px; }
.content-grid.equal-height .left-column, .content-grid.equal-height .right-column { flex: 1; }

/* ========== INFO CARDS ========== */
.info-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
.card-header { display: flex; align-items: center; gap: 12px; padding: 18px 24px; background: #fafcfc; border-bottom: 1px solid #e9edf2; }
.card-header-icon { width: 32px; height: 32px; background: #f1f5f9; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.card-header-icon svg { width: 16px; height: 16px; color: #6366f1; }
.card-header h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }

/* ========== GRID LIST FOR COMPACT DATA ========== */
.grid-list {
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
  row-gap: 16px;
}
.grid-list.cols-auto { grid-template-columns: 1fr 1fr; }
.grid-item { display: flex; flex-direction: column; gap: 4px; }
.grid-item.full-width { grid-column: 1 / -1; }
.g-label { font-size: 12px; color: #64748b; font-weight: 500; }
.g-value { font-size: 14px; font-weight: 500; color: #1e293b; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
.g-sub-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
.g-label-bold { font-size: 13px; color: #1e293b; font-weight: 700; }
.g-value-bold { font-size: 15px; font-weight: 700; padding-bottom: 4px; }
.highlight-orange { color: #f59e0b; }
.highlight-green { color: #10b981; }
.highlight-total { margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
.highlight-gross { margin-top: 4px; padding-top: 10px; border-top: 2px solid #e2e8f0; }

.spouse-name-display { display: flex; align-items: center; gap: 12px; }
.spouse-avatar-small { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; }
.g-value.big-name { font-size: 16px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; flex: 1; }

.children-grid-list { padding: 16px 20px; display: grid; grid-template-columns: 1fr; gap: 14px; }
.child-grid-item { display: flex; gap: 14px; background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #eef2ff; }
.child-grid-avatar { width: 50px; height: 50px; flex-shrink: 0; border-radius: 50%; overflow: hidden; background: #f1f5f9; }
.child-grid-avatar img { width: 100%; height: 100%; object-fit: cover; }
.child-grid-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.child-grid-name { font-size: 15px; font-weight: 600; color: #1e293b; }
.child-grid-age { font-size: 12px; color: #10b981; background: #d1fae5; padding: 2px 10px; border-radius: 20px; margin-left: 8px; }
.child-grid-detail { font-size: 13px; color: #475569; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.child-grid-detail span { font-weight: 500; color: #64748b; }

.parent-grid-item .g-value { border-bottom: none; padding-bottom: 0; }

/* ========== PAPER TABLE STYLES ========== */
.paper-grid-table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: center; }
.paper-grid-table th, .paper-grid-table td { border: 1px solid #000; padding: 8px 6px; }
.paper-grid-table th { background: #f8fafc; font-weight: bold; }
.paper-grid-table.complex-header th { vertical-align: middle; }
.paper-grid-table .lang-main-header { width: 15%; }
.center-text { text-align: center; }

.table-card { max-width: 1200px; margin-left: auto; margin-right: auto; margin-bottom: 24px; }
.table-wrapper { padding: 16px 24px; overflow-x: auto; }
.other-skills-section { padding: 16px 24px; border-top: 1px solid #eef2ff; font-size: 13px; color: #475569; }

/* ========== FINAL SECTION - PAPER FORM STYLES ========== */
.final-section { max-width: 1200px; margin: 40px auto 0; display: flex; flex-direction: column; gap: 30px; font-family: 'Nyala', 'Abyssinica SIL', serif; }
.declaration-section { padding: 0 15px; }
.section-title { text-decoration: underline; text-underline-offset: 4px; font-weight: bold; font-size: 18px; margin-bottom: 25px; }
.check-row-block { display: flex; flex-direction: column; gap: 18px; }
.check-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 30px; font-size: 16px; }
.check-opt { display: flex; align-items: center; gap: 8px; }
.q-label { font-size: 16px; }
.square-box { display: inline-flex; align-items: center; justify-content: center; width: 35px; height: 30px; border: 1.5px solid #000; font-weight: bold; font-size: 18px; }
.square-box.checked { color: #000; }
.input-line-large { display: inline-block; border-bottom: 1px solid #000; flex: 1; min-width: 150px; height: 1px; margin-top: 5px; }

.declaration-block-border { border: 2px solid #000; padding: 20px 25px; background: white; border-radius: 4px; }
.declaration-text { font-size: 15px; line-height: 1.8; margin-bottom: 30px; text-align: justify; }
.sig-line-large { display: flex; align-items: baseline; gap: 15px; margin-bottom: 20px; font-size: 16px; }
.split-sig { justify-content: space-between; padding: 0 50px; }
.sig-label { font-weight: bold; }
.sig-underline-large { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; flex: 1; height: 20px; }

.admin-block-border { border: 2px solid #000; background: white; border-radius: 4px; overflow: hidden; }
.admin-header-bar { background: #9e9256; color: #000; font-weight: bold; font-size: 18px; padding: 8px 15px; border-bottom: 2px solid #000; }
.admin-body { padding: 25px 30px; }
.admin-date-row { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; font-size: 16px; flex-wrap: wrap; }
.admin-date-parts { display: flex; align-items: center; gap: 6px; }
.admin-date-underlined { display: inline-block; border-bottom: 1px solid #000; padding: 0 4px; min-width: 25px; text-align: center; }
.admin-label-wide { font-weight: bold; }
.admin-fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 35px; }
.admin-field-row { display: flex; flex-direction: column; gap: 5px; }
.admin-label { font-weight: bold; font-size: 15px; }
.admin-field-under { display: inline-block; border-bottom: 1px solid #000; padding: 0 5px; width: 100%; font-weight: 600; font-size: 15px; }
.admin-sig-block { display: flex; flex-direction: column; gap: 20px; padding-left: 200px; }
.admin-sig-row { display: flex; align-items: baseline; gap: 15px; font-size: 15px; }
.admin-field-long { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; width: 200px; height: 20px; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-container { background: white; border-radius: 16px; width: 90%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
.modal-body { flex: 1; overflow-y: auto; padding: 20px; }
.modal-footer { padding: 16px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; }
.field-group { margin-bottom: 16px; }
.field-group label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #666; }
.field-group input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.searchable-select { position: relative; width: 100%; }
.dropdown-list { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 8px; max-height: 200px; overflow-y: auto; z-index: 10; }
.dropdown-item { padding: 10px 12px; cursor: pointer; display: flex; justify-content: space-between; border-bottom: 1px solid #f5f5f5; }
.dropdown-item:hover { background: #f0f4f8; }
.file-select-list { margin-bottom: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.file-check-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 14px; cursor: pointer; }
.file-check-item:last-child { margin-bottom: 0; }
.file-check-item input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: #6366f1; }
.field-divider { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 12px 0; padding-top: 12px; border-top: 1px solid #eee; }
.cancel-btn { padding: 8px 20px; background: #e0e0e0; border: none; border-radius: 8px; cursor: pointer; }
.save-btn { padding: 8px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; }

.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 1100; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 10px 16px; border-radius: 8px; color: white; font-size: 13px; animation: slideIn 0.3s ease; }
.toast.success { background: #10b981; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.empty-state { text-align: center; padding: 60px; background: white; border-radius: 24px; max-width: 600px; margin: 40px auto; }
.loading-state { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px; gap: 16px; }
.loading-spinner { width: 48px; height: 48px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .content-grid { grid-template-columns: 1fr; }
  .grid-list, .grid-list.cols-auto { grid-template-columns: 1fr; }
  .admin-fields-grid { grid-template-columns: 1fr; }
  .admin-sig-block { padding-left: 0; }
}
@media (max-width: 768px) {
  .employee-biography { padding: 12px; }
  .right-float-buttons { right: 16px; }
  .float-btn { width: 44px; height: 44px; }
  .float-btn svg { width: 20px; height: 20px; }
  .hero-section { flex-direction: column; text-align: center; gap: 24px; }
  .hero-left { flex-direction: column; }
  .employee-tags { justify-content: center; }
  .employee-avatar-large { width: 100px; height: 130px; }
  .stats-cards { grid-template-columns: 1fr; }
}
@media print {
  .right-float-buttons, .modal-overlay, .toast-container { display: none !important; }
}
</style>