<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <h3>{{ t('employee.basicInfo') || 'Basic Information' }}</h3>
    </div>

    <div class="card-body">
      <!-- Two-column layout: Profile Picture on the left, fields on the right -->
      <div class="two-column-layout">
        <!-- Left Column: Profile Picture -->
        <div class="profile-section">
          <div class="profile-upload" @click="triggerProfileInput">
            <div class="profile-preview" v-if="profilePreview">
              <img :src="profilePreview" alt="Profile preview" />
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
              <span>{{ t('employee.clickToUpload') || 'Click to upload photo' }}</span>
              <small>JPG, PNG (Max 2MB)</small>
            </div>
          </div>
          <input type="file" ref="profileInput" @change="handleProfileUpload" accept="image/jpeg,image/png" style="display: none" />
        </div>

        <!-- Right Column: All Form Fields -->
        <div class="fields-wrapper">
          <!-- Row 1: Name Fields -->
          <div class="form-row-three">
            <div class="form-field">
              <label>{{ t('employee.firstName') || 'First Name' }} <span class="required">*</span></label>
              <input type="text" :value="form.firstName" @input="updateField('firstName', $event.target.value)" :placeholder="t('employee.firstName') || 'First name'" />
              <span class="error" v-if="errors.firstName">{{ errors.firstName }}</span>
            </div>
            <div class="form-field">
              <label>{{ t('employee.lastName') || 'Last Name' }} <span class="required">*</span></label>
              <input type="text" :value="form.lastName" @input="updateField('lastName', $event.target.value)" :placeholder="t('employee.lastName') || 'Last name'" />
              <span class="error" v-if="errors.lastName">{{ errors.lastName }}</span>
            </div>
            <div class="form-field">
              <label>{{ t('employee.middleName') || 'Middle Name' }}</label>
              <input type="text" :value="form.middleName" @input="updateField('middleName', $event.target.value)" :placeholder="t('employee.middleName') || 'Middle name'" />
            </div>
          </div>

          <!-- Full Name in English Field - Only shows when language is Amharic -->
          <div v-if="currentLanguage === 'am'" class="form-row-full">
            <div class="form-field">
              <label>{{ t('employee.fullNameEnglish') || 'Full Name (English)' }}</label>
              <input 
                type="text" 
                :value="form.fullNameEnglish" 
                @input="updateField('fullNameEnglish', $event.target.value)" 
                :placeholder="t('employee.fullNameEnglishPlaceholder') || 'Enter your full name in English characters'"
              />
              <small class="field-hint">{{ t('employee.fullNameEnglishHint') || 'Please enter your full name in English (Latin) characters' }}</small>
            </div>
          </div>

          <!-- Row 2: Gender, Marital Status, Date of Birth -->
          <div class="form-row-three">
            <div class="form-field">
              <label>{{ t('employee.gender') || 'Gender' }}</label>
              <select :value="form.gender" @change="updateField('gender', $event.target.value)">
                <option value="">{{ t('common.select') || 'Select' }}</option>
                <option value="employee.male">{{ t('employee.male') || 'Male' }}</option>
                <option value="employee.female">{{ t('employee.female') || 'Female' }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>{{ t('employee.maritalStatus') || 'Marital Status' }}</label>
              <select :value="form.maritalStatus" @change="updateField('maritalStatus', $event.target.value)">
                <option value="">{{ t('common.select') || 'Select' }}</option>
                <option value="employee.single">{{ t('employee.single') || 'Single' }}</option>
                <option value="employee.married">{{ t('employee.married') || 'Married' }}</option>
                <option value="employee.divorced">{{ t('employee.divorced') || 'Divorced' }}</option>
                <option value="employee.widowed">{{ t('employee.widowed') || 'Widowed' }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>{{ t('employee.dateOfBirth') || 'Date of Birth' }}</label>
              <input type="date" :value="form.dob" @input="updateField('dob', $event.target.value)" />
            </div>
          </div>

          <!-- Row 3: Nationality, National ID -->
          <div class="form-row-two">
     <div class="form-field">
  <label>{{ t('employee.nationality') || 'Nationality' }}</label>
  <select :value="form.nationality" @change="updateField('nationality', $event.target.value)">
    <option value="">{{ t('common.select') || 'Select nationality' }}</option>
    <option value="Ethiopian">{{ t('employee.nationalityEthiopian') || 'Ethiopian' }}</option>
    <option value="Eritrean">{{ t('employee.nationalityEritrean') || 'Eritrean' }}</option>
    <option value="Kenyan">{{ t('employee.nationalityKenyan') || 'Kenyan' }}</option>
    <option value="Somali">{{ t('employee.nationalitySomali') || 'Somali' }}</option>
    <option value="Sudanese">{{ t('employee.nationalitySudanese') || 'Sudanese' }}</option>
    <option value="American">{{ t('employee.nationalityAmerican') || 'American' }}</option>
    <option value="Canadian">{{ t('employee.nationalityCanadian') || 'Canadian' }}</option>
    <option value="Chinese">{{ t('employee.nationalityChinese') || 'Chinese' }}</option>
    <option value="Other">{{ t('employee.nationalityOther') || 'Other' }}</option>
  </select>
</div>
            <div class="form-field">
              <label>{{ t('employee.nationalId') || 'National ID / FAN Number' }}</label>
              <div class="id-upload-group">
                <input type="text" :value="form.nationalId" @input="updateField('nationalId', $event.target.value)" placeholder="e.g., FAN-1234567890" class="id-input" />
                <button type="button" class="btn-upload" @click="triggerIdFileInput" :class="{ 'has-file': nationalIdFile }">
                  {{ nationalIdFile ? nationalIdFile.name : "📎 " + (t('common.upload') || 'Select File') }}
                </button>
              </div>
              <input type="file" ref="idFileInput" @change="handleIdFileSelect" accept=".pdf,.jpg,.jpeg,.png" style="display: none" />
              <small class="field-hint" v-if="!nationalIdFile">{{ t('employee.selectIdDocument') || 'Select scanned copy of National ID / FAN Card' }}</small>
              <small class="field-hint success" v-else>{{ t('employee.fileSelected') || 'File selected' }}: {{ nationalIdFile.name }} - {{ t('employee.readyToSave') || 'ready to save' }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Birth Place Section -->
      <div class="info-section">
        <div class="section-subtitle">{{ t('employee.birthPlace') || 'Birth Place' }}</div>
        <div class="form-row-four">
          <div class="form-field">
            <label>{{ t('address.region') || 'Region' }}</label>
            <input type="text" :value="form.birthPlace?.region" @input="updateBirthPlace('region', $event.target.value)" :placeholder="t('address.region') || 'Region'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.city') || 'City' }}</label>
            <input type="text" :value="form.birthPlace?.city" @input="updateBirthPlace('city', $event.target.value)" :placeholder="t('address.city') || 'City'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.subcity') || 'Subcity' }}</label>
            <input type="text" :value="form.birthPlace?.subcity" @input="updateBirthPlace('subcity', $event.target.value)" :placeholder="t('address.subcity') || 'Subcity'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.district') || 'District' }}</label>
            <input type="text" :value="form.birthPlace?.district" @input="updateBirthPlace('district', $event.target.value)" :placeholder="t('address.district') || 'District'" />
          </div>
        </div>
      </div>

      <!-- Current Address Section -->
      <div class="info-section">
        <div class="section-subtitle">{{ t('address.currentAddress') || 'Current Address' }}</div>
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ t('address.region') || 'Region' }}</label>
            <input type="text" :value="form.currentAddress?.region" @input="updateCurrentAddress('region', $event.target.value)" :placeholder="t('address.region') || 'Region'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.subcity') || 'Subcity' }}</label>
            <input type="text" :value="form.currentAddress?.subcity" @input="updateCurrentAddress('subcity', $event.target.value)" :placeholder="t('address.subcity') || 'Subcity'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.kebele') || 'Kebele' }}</label>
            <input type="text" :value="form.currentAddress?.kebele" @input="updateCurrentAddress('kebele', $event.target.value)" :placeholder="t('address.kebele') || 'Kebele'" />
          </div>
        </div>
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ t('address.district') || 'District' }}</label>
            <input type="text" :value="form.currentAddress?.district" @input="updateCurrentAddress('district', $event.target.value)" :placeholder="t('address.district') || 'District/Woreda'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.poBox') || 'PO Box' }}</label>
            <input type="text" :value="form.currentAddress?.poBox" @input="updateCurrentAddress('poBox', $event.target.value)" :placeholder="t('address.poBox') || 'PO Box'" />
          </div>
          <div class="form-field">
            <label>{{ t('address.houseNumber') || 'House Number' }}</label>
            <input type="text" :value="form.currentAddress?.houseNumber" @input="updateCurrentAddress('houseNumber', $event.target.value)" :placeholder="t('address.houseNumber') || 'House number'" />
          </div>
        </div>
      </div>

      <!-- Contact Section -->
      <div class="info-section">
        <div class="section-subtitle">{{ t('employee.contactInfo') || 'Contact Information' }}</div>
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ t('employee.workEmail') || 'Email' }} <span class="required">*</span></label>
            <input type="email" :value="form.email" @input="updateField('email', $event.target.value)" placeholder="employee@company.com" />
            <span class="error" v-if="errors.email">{{ errors.email }}</span>
          </div>
          <div class="form-field">
            <label>{{ t('employee.personalEmail') || 'Personal Email' }}</label>
            <input type="email" :value="form.personalEmail" @input="updateField('personalEmail', $event.target.value)" placeholder="personal@email.com" />
          </div>
          <div class="form-field">
            <label>{{ t('employee.phone') || 'Phone Number' }} <span class="required">*</span></label>
            <input type="tel" :value="form.phone" @input="updateField('phone', $event.target.value)" placeholder="+251 911 000 000" />
            <span class="error" v-if="errors.phone">{{ errors.phone }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const currentLanguage = computed(() => locale.value);

const props = defineProps({
  form: { type: Object, default: () => ({}) },
  errors: { type: Object, default: () => ({}) },
  countries: { type: Array, default: () => [] },
  profilePreview: { type: String, default: "" },
  t: { type: Function, default: (key) => key },
});

const emit = defineEmits(["update:form", "uploadDocument", "update:profileFile", "update:profilePreview", "file-selected", "update:nationalIdFile"]);

const profileInput = ref(null);
const idFileInput = ref(null);
const nationalIdFile = ref(null);

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_ID_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const validateFileType = (file, allowedTypes, typeName) => {
  if (!allowedTypes.includes(file.type)) {
    emit("file-selected", `Invalid file type for ${typeName}. Allowed: ${allowedTypes.map(t => t.split("/")[1]).join(", ")}`, "error");
    return false;
  }
  return true;
};

const validateFileSize = (file, maxSizeMB, typeName) => {
  if (file.size > maxSizeMB * 1024 * 1024) {
    emit("file-selected", `${typeName} size must be less than ${maxSizeMB}MB`, "error");
    return false;
  }
  return true;
};

const triggerProfileInput = () => profileInput.value?.click();

const handleProfileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES, "Profile picture") || !validateFileSize(file, 2, "Profile picture")) {
      event.target.value = "";
      return;
    }
    emit("update:profileFile", file);
    const reader = new FileReader();
    reader.onload = (e) => emit("update:profilePreview", e.target.result);
    reader.readAsDataURL(file);
    emit("file-selected", `Profile picture "${file.name}" selected`, "success");
  }
};

const triggerIdFileInput = () => {
  idFileInput.value?.click();
};

const handleIdFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!validateFileType(file, ALLOWED_ID_TYPES, "ID document") || !validateFileSize(file, 5, "ID document")) {
      event.target.value = "";
      return;
    }
    nationalIdFile.value = file;
    emit("update:nationalIdFile", file);
    emit("file-selected", `ID document "${file.name}" selected - ready to save`, "success");
  }
};

const updateField = (field, value) => {
  emit("update:form", { ...props.form, [field]: value });
};

const updateBirthPlace = (field, value) => {
  const newBirthPlace = { ...(props.form.birthPlace || {}), [field]: value };
  emit("update:form", { ...props.form, birthPlace: newBirthPlace });
};

const updateCurrentAddress = (field, value) => {
  const newAddress = { ...(props.form.currentAddress || {}), [field]: value };
  emit("update:form", { ...props.form, currentAddress: newAddress });
};
</script>

<style scoped>

.form-row-two {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-full {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 16px;
}

/* Card Styles */
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

.card-body {
  padding: 20px;
}

/* Two Column Layout */
.two-column-layout {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9edf2;
}

/* Profile Section - Larger Square/Rectangular Image */
.profile-section {
  flex-shrink: 0;
  width: 160px;
}

.profile-upload {
  cursor: pointer;
}

.profile-preview {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
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
  width: 140px;
  height: 140px;
  border-radius: 16px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.profile-placeholder:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.profile-placeholder svg {
  width: 36px;
  height: 36px;
  color: #94a3b8;
}

.profile-placeholder span {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  padding: 0 8px;
}

.profile-placeholder small {
  font-size: 9px;
  color: #94a3b8;
}

/* Fields Wrapper */
.fields-wrapper {
  flex: 1;
  min-width: 0;
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-field input,
.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.error {
  font-size: 11px;
  color: #ef4444;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.field-hint.success {
  color: #10b981;
}

/* ID Upload Group */
.id-upload-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.id-input {
  flex: 2;
}

.btn-upload {
  padding: 10px 16px;
  background: #e2e8f0;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.btn-upload:hover {
  background: #cbd5e1;
}

.btn-upload.has-file {
  background: #10b981;
  color: white;
}

/* Info Sections */
.info-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9edf2;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .profile-section {
    width: auto;
  }

  .form-row-two,
  .form-row-three,
  .form-row-four,
  .form-row-full {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .id-upload-group {
    flex-direction: column;
  }

  .btn-upload {
    width: 100%;
    max-width: none;
  }
}

.form-row-two {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

/* Card Styles */
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

.card-body {
  padding: 20px;
}

/* Two Column Layout */
.two-column-layout {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9edf2;
}

/* Profile Section - Larger Square/Rectangular Image */
.profile-section {
  flex-shrink: 0;
  width: 160px;
}

.profile-upload {
  cursor: pointer;
}

.profile-preview {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
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
  width: 140px;
  height: 140px;
  border-radius: 16px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.profile-placeholder:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.profile-placeholder svg {
  width: 36px;
  height: 36px;
  color: #94a3b8;
}

.profile-placeholder span {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  padding: 0 8px;
}

.profile-placeholder small {
  font-size: 9px;
  color: #94a3b8;
}

/* Fields Wrapper */
.fields-wrapper {
  flex: 1;
  min-width: 0;
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-field input,
.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.error {
  font-size: 11px;
  color: #ef4444;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.field-hint.success {
  color: #10b981;
}

/* ID Upload Group */
.id-upload-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.id-input {
  flex: 2;
}

.btn-upload {
  padding: 10px 16px;
  background: #e2e8f0;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.btn-upload:hover {
  background: #cbd5e1;
}

.btn-upload.has-file {
  background: #10b981;
  color: white;
}

/* Info Sections */
.info-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9edf2;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .profile-section {
    width: auto;
  }

  .form-row-two,
  .form-row-three,
  .form-row-four {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .id-upload-group {
    flex-direction: column;
  }

  .btn-upload {
    width: 100%;
    max-width: none;
  }
}

.form-row-two {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

/* Card Styles */
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

.card-body {
  padding: 20px;
}

/* Two Column Layout */
.two-column-layout {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9edf2;
}

/* Profile Section - Larger Square/Rectangular Image */
.profile-section {
  flex-shrink: 0;
  width: 160px;
}

.profile-upload {
  cursor: pointer;
}

.profile-preview {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
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
  width: 140px;
  height: 140px;
  border-radius: 16px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.profile-placeholder:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.profile-placeholder svg {
  width: 36px;
  height: 36px;
  color: #94a3b8;
}

.profile-placeholder span {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  padding: 0 8px;
}

.profile-placeholder small {
  font-size: 9px;
  color: #94a3b8;
}

/* Fields Wrapper */
.fields-wrapper {
  flex: 1;
  min-width: 0;
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-field input,
.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.error {
  font-size: 11px;
  color: #ef4444;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.field-hint.success {
  color: #10b981;
}

/* ID Upload Group */
.id-upload-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.id-input {
  flex: 2;
}

.btn-upload {
  padding: 10px 16px;
  background: #e2e8f0;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.btn-upload:hover {
  background: #cbd5e1;
}

.btn-upload.has-file {
  background: #10b981;
  color: white;
}

/* Info Sections */
.info-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9edf2;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .profile-section {
    width: auto;
  }

  .form-row-two,
  .form-row-three,
  .form-row-four {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .id-upload-group {
    flex-direction: column;
  }

  .btn-upload {
    width: 100%;
    max-width: none;
  }
}
</style>