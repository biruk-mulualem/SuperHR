import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import EmployeesService from '@/stores/employee';
import UsersService from '@/stores/users';
import CreateHeader from './components/employeeCreate/CreateHeader.vue';
import { useI18n } from 'vue-i18n';
import BasicInfoForm from './components/employeeCreate/BasicInfoForm.vue';
import EmploymentForm from './components/employeeCreate/EmploymentForm.vue';
import FamilyInfoForm from './components/employeeCreate/FamilyInfoForm.vue';
import EducationForm from './components/employeeCreate/EducationForm.vue';
import TrainingForm from './components/employeeCreate/TrainingForm.vue';
import CurrentCompanyInfoForm from './components/employeeCreate/CurrentCompanyInfoForm.vue';
import LanguageSkillsForm from './components/employeeCreate/LanguageSkillsForm.vue';
import NationalityForm from './components/employeeCreate/NationalityForm.vue';
import HealthLegalForm from './components/employeeCreate/HealthLegalForm.vue';
import AdditionalInfoForm from './components/employeeCreate/AdditionalInfoForm.vue';
import ImportModal from './components/employeeCreate/ImportModal.vue';
import ToastContainer from './components/employeeCreate/ToastContainer.vue';
import DocumentUploadModal from './components/employeeCreate/DocumentUploadModal.vue';
import GuaranteeInfoForm from './components/employeeCreate/GuaranteeInfoForm.vue';
import ScannedDocumentsForm from './components/employeeCreate/ScannedDocumentsForm.vue';
const { t, locale } = useI18n();
// Scanned Documents Reference
const scannedDocsRef = ref(null);
// Scanned Documents State
const scannedDocuments = ref({
    guaranteeLetter: null,
    employmentLetter: null,
    other: null,
    custom: []
});
// Update scanned documents from child component
const updateScannedDocuments = (docs) => {
    // docs is an array of { type, name, file }
    scannedDocuments.value = docs;
};
// Language state
const currentLanguage = ref(locale.value);
const router = useRouter();
const route = useRoute();
const toasts = ref([]);
const showImportModal = ref(false);
const showDocumentModal = ref(false);
const documentUploadContext = ref({ type: null, index: null, field: null });
const isSubmitting = ref(false);
const profileFile = ref(null);
const profilePreview = ref(null);
const nationalIdFile = ref(null);
const departments = ref([]);
const positions = ref([]);
const employeeList = ref([]);
const emergencyContact = reactive({
    name: '',
    relationship: '',
    phone: '',
    alternatePhone: ''
});
const bankAccount = reactive({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branch: ''
});
// Form data
const form = ref({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    personalEmail: '',
    fullNameEnglish: '',
    phone: '',
    hireDateEC: '',
    dateOfBirthEC: '',
    confirmationDateEC: '',
    terminationDateEC: '',
    dob: '',
    hireDate: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    nationalId: '',
    departmentId: null,
    positionId: null,
    managerId: null,
    employmentType: '',
    salary: '',
    basicSalary: '',
    housingAllowance: '',
    positionAllowance: '',
    transportAllowance: '',
    mobileAllowance: '',
    address: '',
    workLocation: '',
    currentCompany: {
        companyName: '',
        companyTin: '',
        companyPhone: '',
        companyEmail: '',
        companyAddress: '',
        poBox: '',
        website: ''
    },
    birthPlace: {
        region: '',
        city: '',
        subcity: '',
        district: ''
    },
    currentAddress: {
        region: '',
        subcity: '',
        kebele: '',
        district: '',
        poBox: '',
        houseNumber: ''
    },
    mothersFullName: '',
    spouseInfo: {
        tinNumber: '',
        fullName: '',
        dateOfBirthEC: '',
        jobStatus: '',
        companyName: '',
        companyAddress: '',
        profilePictureFile: null,
        marriageCertificateFile: null
    },
    children: [],
    parentsInfo: {
        father: { fullName: '', monthlyIncome: null, job: '' },
        mother: { fullName: '', monthlyIncome: null, job: '' },
        financialSupport: '',
        otherSupport: ''
    },
    workExperience: [],
    education: [],
    training: [],
    languageSkills: [],
    otherSkills: '',
    parentSupport: [],
    nationalityAcquisition: {
        type: 'by_birth',
        documentId: null,
        documentUrl: null
    },
    healthInfo: {
        hasPhysicalInjury: false,
        injuryDescription: ''
    },
    legalInfo: {
        hasCriminalRecord: false,
        criminalRecordDescription: ''
    },
    guaranteeInfo: [],
    emergencyContactAddress: {
        city: '',
        subcity: '',
        district: '',
        kebele: ''
    }
});
const errors = ref({});
// Update methods
const updateForm = (newForm) => {
    form.value = newForm;
};
const updateCurrentCompany = (newCompany) => {
    form.value.currentCompany = newCompany;
};
const updateProfileFile = (file) => {
    profileFile.value = file;
};
const updateProfilePreview = (preview) => {
    profilePreview.value = preview;
};
const updateNationalIdFile = (file) => {
    nationalIdFile.value = file;
};
const updateWorkExperience = (newWorkExperience) => {
    form.value.workExperience = newWorkExperience;
};
const updateWorkDocument = ({ index, file }) => {
    if (form.value.workExperience[index]) {
        form.value.workExperience[index].experienceLetterFile = file;
    }
};
const updateSpouseInfo = (newSpouseInfo) => {
    form.value.spouseInfo = newSpouseInfo;
};
const updateChildren = (newChildren) => {
    form.value.children = newChildren;
};
const updateParentsInfo = (newParentsInfo) => {
    form.value.parentsInfo = newParentsInfo;
};
const updateGuaranteeInfo = (newGuaranteeInfo) => {
    form.value.guaranteeInfo = newGuaranteeInfo;
};
const updateEmergencyContact = (newEmergency) => {
    Object.assign(emergencyContact, newEmergency);
};
const updateEmergencyAddress = (newAddress) => {
    form.value.emergencyContactAddress = newAddress;
};
const updateBankAccount = (newBank) => {
    Object.assign(bankAccount, newBank);
};
const updateEducation = (newEducation) => {
    form.value.education = newEducation;
};
const updateTraining = (newTraining) => {
    form.value.training = newTraining;
};
const updateLanguageSkills = (newLanguages) => {
    form.value.languageSkills = newLanguages;
};
const updateOtherSkills = (newSkills) => {
    form.value.otherSkills = newSkills;
};
const updateNationalityAcquisition = (newData) => {
    form.value.nationalityAcquisition = newData;
};
const updateHealthInfo = (newHealth) => {
    form.value.healthInfo = newHealth;
};
const updateLegalInfo = (newLegal) => {
    form.value.legalInfo = newLegal;
};
// Save all data
const saveAllData = async () => {
    console.log('🔍 VALIDATION DEBUG - Form values:', {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        phone: form.value.phone,
        departmentId: form.value.departmentId,
        positionId: form.value.positionId,
        employmentType: form.value.employmentType,
        hireDateEC: form.value.hireDateEC,
        dateOfBirthEC: form.value.dateOfBirthEC
    });
    if (!validateForm()) {
        addToast('Please fix validation errors', 'error');
        return;
    }
    console.log('=== SAVING EMPLOYEE DATA ===');
    console.log('EC Dates - Hire:', form.value.hireDateEC);
    console.log('EC Dates - DOB:', form.value.dateOfBirthEC);
    isSubmitting.value = true;
    try {
        const employeeData = {
            firstName: form.value.firstName?.trim(),
            lastName: form.value.lastName?.trim(),
            middleName: form.value.middleName?.trim() || null,
            fullNameEnglish: form.value.fullNameEnglish?.trim() || null,
            email: form.value.email?.trim(),
            personalEmail: form.value.personalEmail?.trim() || null,
            phone: form.value.phone?.trim(),
            hireDateEC: form.value.hireDateEC || null,
            dateOfBirthEC: form.value.dateOfBirthEC || null,
            confirmationDateEC: form.value.confirmationDateEC || null,
            terminationDateEC: form.value.terminationDateEC || null,
            gender: form.value.gender || null,
            maritalStatus: form.value.maritalStatus || null,
            nationality: form.value.nationality || null,
            nationalId: form.value.nationalId || null,
            departmentId: form.value.departmentId ? parseInt(form.value.departmentId) : null,
            positionId: form.value.positionId ? parseInt(form.value.positionId) : null,
            managerId: form.value.managerId ? parseInt(form.value.managerId) : null,
            employmentType: form.value.employmentType,
            workLocation: form.value.workLocation?.trim() || null,
            basicSalary: form.value.basicSalary,
            housingAllowance: parseFloat(form.value.housingAllowance) || 0,
            positionAllowance: parseFloat(form.value.positionAllowance) || 0,
            transportAllowance: parseFloat(form.value.transportAllowance) || 0,
            mobileAllowance: parseFloat(form.value.mobileAllowance) || 0,
            currentCompany: form.value.currentCompany,
            birthPlace: form.value.birthPlace,
            currentAddress: form.value.currentAddress,
            mothersFullName: form.value.mothersFullName,
            spouseInfo: form.value.spouseInfo,
            children: form.value.children,
            parentsInfo: form.value.parentsInfo,
            workExperience: form.value.workExperience,
            education: form.value.education,
            training: form.value.training,
            languageSkills: form.value.languageSkills,
            otherSkills: form.value.otherSkills,
            parentSupport: form.value.parentSupport,
            nationalityAcquisition: form.value.nationalityAcquisition,
            healthInfo: form.value.healthInfo,
            legalInfo: form.value.legalInfo,
            guaranteeInfo: form.value.guaranteeInfo,
            emergencyContactAddress: form.value.emergencyContactAddress,
            emergencyContact: JSON.stringify(emergencyContact),
            bankAccount: JSON.stringify(bankAccount)
        };
        console.log('Sending EC Dates to backend:', {
            hireDateEC: employeeData.hireDateEC,
            dateOfBirthEC: employeeData.dateOfBirthEC
        });
        let employeeId;
        if (route.params.id) {
            const result = await EmployeesService.updateEmployee(route.params.id, employeeData);
            if (!result.success)
                throw new Error(result.error);
            employeeId = route.params.id;
            addToast('Employee updated successfully!', 'success');
        }
        else {
            const result = await EmployeesService.createEmployee(employeeData);
            console.log('Create result:', result);
            if (!result.success)
                throw new Error(result.error || 'Failed to create employee');
            employeeId = result.data.id;
            addToast('Employee created successfully!', 'success');
        }
        await uploadAllDocuments(employeeId);
        setTimeout(() => {
            router.push('/employees');
        }, 2000);
    }
    catch (error) {
        console.error('Save error:', error);
        addToast(error.message, 'error');
    }
    finally {
        isSubmitting.value = false;
    }
};
// Upload all documents
const uploadAllDocuments = async (employeeId) => {
    console.log('Uploading documents for employee:', employeeId);
    // 1. Profile Picture
    if (profileFile.value) {
        await EmployeesService.uploadEmployeeDocument(employeeId, profileFile.value, 'profile_picture');
    }
    // 2. National ID Document
    if (nationalIdFile.value) {
        await EmployeesService.uploadEmployeeDocument(employeeId, nationalIdFile.value, 'national_id');
    }
    // 3. Spouse Profile Picture
    if (form.value.spouseInfo?.profilePictureFile) {
        await EmployeesService.uploadEmployeeDocument(employeeId, form.value.spouseInfo.profilePictureFile, 'spouse_profile');
    }
    // 4. Marriage Certificate
    if (form.value.spouseInfo?.marriageCertificateFile) {
        await EmployeesService.uploadEmployeeDocument(employeeId, form.value.spouseInfo.marriageCertificateFile, 'marriage_certificate');
    }
    // 5. Children Documents
    for (let i = 0; i < form.value.children.length; i++) {
        const child = form.value.children[i];
        if (child.birthCertificateFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, child.birthCertificateFile, 'child_birth_certificate', { index: i });
        }
        if (child.medicalReportFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, child.medicalReportFile, 'child_medical_report', { index: i });
        }
        if (child.adoptionCertificateFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, child.adoptionCertificateFile, 'child_adoption_certificate', { index: i });
        }
        if (child.profilePictureFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, child.profilePictureFile, 'child_profile', { index: i });
        }
    }
    // 6. Work Experience Documents
    for (let i = 0; i < form.value.workExperience.length; i++) {
        const work = form.value.workExperience[i];
        if (work.experienceLetterFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, work.experienceLetterFile, 'experience_letter', { index: i });
        }
    }
    // 7. Guarantee Documents
    for (let i = 0; i < form.value.guaranteeInfo.length; i++) {
        const guarantee = form.value.guaranteeInfo[i];
        if (guarantee.guaranteeLetterFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, guarantee.guaranteeLetterFile, 'guarantee_letter', { index: i });
        }
        if (guarantee.sdtLetterFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, guarantee.sdtLetterFile, 'sdt_letter', { index: i });
        }
        if (guarantee.otherDocumentFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, guarantee.otherDocumentFile, 'guarantee_other', { index: i });
        }
    }
    // 8. Education Certificates
    for (let i = 0; i < form.value.education.length; i++) {
        const edu = form.value.education[i];
        if (edu.certificateFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, edu.certificateFile, 'education_certificate', { index: i });
        }
    }
    // 9. Training Certificates
    for (let i = 0; i < form.value.training.length; i++) {
        const train = form.value.training[i];
        if (train.certificateFile) {
            await EmployeesService.uploadEmployeeDocument(employeeId, train.certificateFile, 'training_certificate', { index: i });
        }
    }
    // 10. Naturalization Certificate
    if (form.value.nationalityAcquisition?.documentFile) {
        await EmployeesService.uploadEmployeeDocument(employeeId, form.value.nationalityAcquisition.documentFile, 'naturalization_certificate');
    }
    // 11. Health Document
    if (form.value.healthInfo?.documentFile) {
        await EmployeesService.uploadEmployeeDocument(employeeId, form.value.healthInfo.documentFile, 'health_document');
    }
    // 12. Legal Document
    if (form.value.legalInfo?.documentFile) {
        await EmployeesService.uploadEmployeeDocument(employeeId, form.value.legalInfo.documentFile, 'legal_document');
    }
    // ========== 13. SCANNED DOCUMENTS (NEW) ==========
    // Get documents from the ScannedDocumentsForm component
    if (scannedDocsRef.value) {
        const allDocs = scannedDocsRef.value.getAllDocuments();
        if (allDocs && allDocs.length > 0) {
            console.log('Uploading scanned documents:', allDocs.length);
            for (let i = 0; i < allDocs.length; i++) {
                const doc = allDocs[i];
                if (doc.file) {
                    try {
                        // Determine document type for upload
                        let docType = 'other_document';
                        // Map to specific types if available
                        if (doc.type === 'guaranteeLetter') {
                            docType = 'guarantee_letter';
                        }
                        else if (doc.type === 'employmentLetter') {
                            docType = 'employment_letter';
                        }
                        else if (doc.type === 'other') {
                            docType = 'other_document';
                        }
                        else if (doc.type === 'custom') {
                            docType = 'other_document';
                        }
                        await EmployeesService.uploadEmployeeDocument(employeeId, doc.file, docType, {
                            index: i,
                            description: doc.name || 'Other Document'
                        });
                        console.log(`✅ Uploaded: ${doc.name || doc.type} (${docType})`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to upload document: ${doc.name}`, error);
                    }
                }
            }
        }
    }
};
const openDocumentUpload = (context) => {
    documentUploadContext.value = context;
    showDocumentModal.value = true;
};
const handleDocumentUploaded = async (result) => {
    addToast('Document uploaded successfully', 'success');
    showDocumentModal.value = false;
};
const validateForm = () => {
    const newErrors = {};
    if (!form.value.firstName?.trim())
        newErrors.firstName = 'First name is required';
    if (!form.value.lastName?.trim())
        newErrors.lastName = 'Last name is required';
    if (!form.value.email?.trim())
        newErrors.email = 'Email is required';
    if (!form.value.phone?.trim())
        newErrors.phone = 'Phone is required';
    if (!form.value.departmentId)
        newErrors.departmentId = 'Department is required';
    if (!form.value.positionId)
        newErrors.positionId = 'Position is required';
    if (!form.value.employmentType)
        newErrors.employmentType = 'Employment type is required';
    if (!form.value.hireDateEC)
        newErrors.hireDateEC = 'Hire date is required';
    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
};
const addToast = (message, type = 'success') => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => removeToast(id), 5000);
};
const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
};
const openImportModal = () => {
    showImportModal.value = true;
};
const handleImport = async (csvData) => {
    addToast('Import completed!', 'success');
};
const loadDepartments = async () => {
    try {
        const result = await UsersService.getDepartments();
        if (result.success)
            departments.value = result.departments;
    }
    catch (error) {
        console.error('Error loading departments:', error);
    }
};
const loadPositions = async () => {
    try {
        const result = await UsersService.getPositions();
        if (result.success)
            positions.value = result.positions;
    }
    catch (error) {
        console.error('Error loading positions:', error);
    }
};
const loadManagers = async () => {
    try {
        const result = await EmployeesService.getEmployees({ employmentStatus: 'active', limit: 100 });
        if (result.success) {
            employeeList.value = result.data.map(emp => ({ id: emp.id, fullName: emp.fullName }));
        }
    }
    catch (error) {
        console.error('Error loading managers:', error);
    }
};
const countries = [
    { code: 'ET', name: 'Ethiopian' },
    { code: 'US', name: 'American' },
    { code: 'GB', name: 'British' },
    { code: 'CA', name: 'Canadian' },
    { code: 'AU', name: 'Australian' },
    { code: 'DE', name: 'German' },
    { code: 'FR', name: 'French' },
    { code: 'IT', name: 'Italian' },
    { code: 'ES', name: 'Spanish' }
];
const ethiopianBanks = [
    { code: 'CBE', name: 'Commercial Bank of Ethiopia' },
    { code: 'AWB', name: 'Awash Bank' },
    { code: 'DB', name: 'Dashen Bank' },
    { code: 'UB', name: 'United Bank' },
    { code: 'NIB', name: 'Nib International Bank' },
    { code: 'HB', name: 'Hibret Bank' },
    { code: 'WB', name: 'Wegagen Bank' }
];
onMounted(() => {
    loadDepartments();
    loadPositions();
    loadManagers();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['lang-toggle-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-toggle-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-form']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-field']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-field']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-field']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-field']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-field']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['gross']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "employee-create" },
});
/** @type {__VLS_StyleScopedClasses['employee-create']} */ ;
const __VLS_0 = CreateHeader;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onImportClick': {} },
    t: (__VLS_ctx.t),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onImportClick': {} },
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ importClick: {} },
    { onImportClick: (__VLS_ctx.openImportModal) });
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.saveAllData) },
    ...{ class: "employee-form" },
});
/** @type {__VLS_StyleScopedClasses['employee-form']} */ ;
const __VLS_7 = BasicInfoForm;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onUpdate:form': {} },
    ...{ 'onUpdate:profileFile': {} },
    ...{ 'onUpdate:profilePreview': {} },
    ...{ 'onUpdate:nationalIdFile': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    form: (__VLS_ctx.form),
    errors: (__VLS_ctx.errors),
    countries: (__VLS_ctx.countries),
    t: (__VLS_ctx.t),
    profilePreview: (__VLS_ctx.profilePreview),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onUpdate:form': {} },
    ...{ 'onUpdate:profileFile': {} },
    ...{ 'onUpdate:profilePreview': {} },
    ...{ 'onUpdate:nationalIdFile': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    form: (__VLS_ctx.form),
    errors: (__VLS_ctx.errors),
    countries: (__VLS_ctx.countries),
    t: (__VLS_ctx.t),
    profilePreview: (__VLS_ctx.profilePreview),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ 'update:form': {} },
    { 'onUpdate:form': (__VLS_ctx.updateForm) });
const __VLS_14 = ({ 'update:profileFile': {} },
    { 'onUpdate:profileFile': (__VLS_ctx.updateProfileFile) });
const __VLS_15 = ({ 'update:profilePreview': {} },
    { 'onUpdate:profilePreview': (__VLS_ctx.updateProfilePreview) });
const __VLS_16 = ({ 'update:nationalIdFile': {} },
    { 'onUpdate:nationalIdFile': (__VLS_ctx.updateNationalIdFile) });
const __VLS_17 = ({ fileSelected: {} },
    { onFileSelected: (__VLS_ctx.addToast) });
const __VLS_18 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_10;
var __VLS_11;
const __VLS_19 = CurrentCompanyInfoForm;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    ...{ 'onUpdate:currentCompany': {} },
    currentCompany: (__VLS_ctx.form.currentCompany),
    t: (__VLS_ctx.t),
}));
const __VLS_21 = __VLS_20({
    ...{ 'onUpdate:currentCompany': {} },
    currentCompany: (__VLS_ctx.form.currentCompany),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_24;
const __VLS_25 = ({ 'update:currentCompany': {} },
    { 'onUpdate:currentCompany': (__VLS_ctx.updateCurrentCompany) });
var __VLS_22;
var __VLS_23;
const __VLS_26 = EmploymentForm;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    ...{ 'onUpdate:form': {} },
    ...{ 'onUpdate:workExperience': {} },
    ...{ 'onUpdate:workDocument': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    form: (__VLS_ctx.form),
    workExperience: (__VLS_ctx.form.workExperience),
    errors: (__VLS_ctx.errors),
    t: (__VLS_ctx.t),
    departments: (__VLS_ctx.departments),
    positions: (__VLS_ctx.positions),
    employees: (__VLS_ctx.employeeList),
}));
const __VLS_28 = __VLS_27({
    ...{ 'onUpdate:form': {} },
    ...{ 'onUpdate:workExperience': {} },
    ...{ 'onUpdate:workDocument': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    form: (__VLS_ctx.form),
    workExperience: (__VLS_ctx.form.workExperience),
    errors: (__VLS_ctx.errors),
    t: (__VLS_ctx.t),
    departments: (__VLS_ctx.departments),
    positions: (__VLS_ctx.positions),
    employees: (__VLS_ctx.employeeList),
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
let __VLS_31;
const __VLS_32 = ({ 'update:form': {} },
    { 'onUpdate:form': (__VLS_ctx.updateForm) });
const __VLS_33 = ({ 'update:workExperience': {} },
    { 'onUpdate:workExperience': (__VLS_ctx.updateWorkExperience) });
const __VLS_34 = ({ 'update:workDocument': {} },
    { 'onUpdate:workDocument': (__VLS_ctx.updateWorkDocument) });
const __VLS_35 = ({ fileSelected: {} },
    { onFileSelected: (__VLS_ctx.addToast) });
const __VLS_36 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_29;
var __VLS_30;
const __VLS_37 = FamilyInfoForm;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    ...{ 'onUpdate:spouseInfo': {} },
    ...{ 'onUpdate:children': {} },
    ...{ 'onUpdate:parentsInfo': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    spouseInfo: (__VLS_ctx.form.spouseInfo),
    children: (__VLS_ctx.form.children),
    parentsInfo: (__VLS_ctx.form.parentsInfo),
    t: (__VLS_ctx.t),
}));
const __VLS_39 = __VLS_38({
    ...{ 'onUpdate:spouseInfo': {} },
    ...{ 'onUpdate:children': {} },
    ...{ 'onUpdate:parentsInfo': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    spouseInfo: (__VLS_ctx.form.spouseInfo),
    children: (__VLS_ctx.form.children),
    parentsInfo: (__VLS_ctx.form.parentsInfo),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
let __VLS_42;
const __VLS_43 = ({ 'update:spouseInfo': {} },
    { 'onUpdate:spouseInfo': (__VLS_ctx.updateSpouseInfo) });
const __VLS_44 = ({ 'update:children': {} },
    { 'onUpdate:children': (__VLS_ctx.updateChildren) });
const __VLS_45 = ({ 'update:parentsInfo': {} },
    { 'onUpdate:parentsInfo': (__VLS_ctx.updateParentsInfo) });
const __VLS_46 = ({ fileSelected: {} },
    { onFileSelected: (__VLS_ctx.addToast) });
const __VLS_47 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_40;
var __VLS_41;
const __VLS_48 = EducationForm;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
    ...{ 'onUpdate:education': {} },
    ...{ 'onUploadDocument': {} },
    education: (__VLS_ctx.form.education),
    t: (__VLS_ctx.t),
}));
const __VLS_50 = __VLS_49({
    ...{ 'onUpdate:education': {} },
    ...{ 'onUploadDocument': {} },
    education: (__VLS_ctx.form.education),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_53;
const __VLS_54 = ({ 'update:education': {} },
    { 'onUpdate:education': (__VLS_ctx.updateEducation) });
const __VLS_55 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_51;
var __VLS_52;
const __VLS_56 = TrainingForm;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
    ...{ 'onUpdate:training': {} },
    ...{ 'onUploadDocument': {} },
    training: (__VLS_ctx.form.training),
    t: (__VLS_ctx.t),
}));
const __VLS_58 = __VLS_57({
    ...{ 'onUpdate:training': {} },
    ...{ 'onUploadDocument': {} },
    training: (__VLS_ctx.form.training),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
let __VLS_61;
const __VLS_62 = ({ 'update:training': {} },
    { 'onUpdate:training': (__VLS_ctx.updateTraining) });
const __VLS_63 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_59;
var __VLS_60;
const __VLS_64 = LanguageSkillsForm;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
    ...{ 'onUpdate:languageSkills': {} },
    ...{ 'onUpdate:otherSkills': {} },
    languageSkills: (__VLS_ctx.form.languageSkills),
    otherSkills: (__VLS_ctx.form.otherSkills),
    t: (__VLS_ctx.t),
}));
const __VLS_66 = __VLS_65({
    ...{ 'onUpdate:languageSkills': {} },
    ...{ 'onUpdate:otherSkills': {} },
    languageSkills: (__VLS_ctx.form.languageSkills),
    otherSkills: (__VLS_ctx.form.otherSkills),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_69;
const __VLS_70 = ({ 'update:languageSkills': {} },
    { 'onUpdate:languageSkills': (__VLS_ctx.updateLanguageSkills) });
const __VLS_71 = ({ 'update:otherSkills': {} },
    { 'onUpdate:otherSkills': (__VLS_ctx.updateOtherSkills) });
var __VLS_67;
var __VLS_68;
const __VLS_72 = NationalityForm;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    ...{ 'onUpdate:nationalityAcquisition': {} },
    ...{ 'onUploadDocument': {} },
    nationalityAcquisition: (__VLS_ctx.form.nationalityAcquisition),
    t: (__VLS_ctx.t),
}));
const __VLS_74 = __VLS_73({
    ...{ 'onUpdate:nationalityAcquisition': {} },
    ...{ 'onUploadDocument': {} },
    nationalityAcquisition: (__VLS_ctx.form.nationalityAcquisition),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_77;
const __VLS_78 = ({ 'update:nationalityAcquisition': {} },
    { 'onUpdate:nationalityAcquisition': (__VLS_ctx.updateNationalityAcquisition) });
const __VLS_79 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_75;
var __VLS_76;
const __VLS_80 = HealthLegalForm;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
    ...{ 'onUpdate:healthInfo': {} },
    ...{ 'onUpdate:legalInfo': {} },
    healthInfo: (__VLS_ctx.form.healthInfo),
    legalInfo: (__VLS_ctx.form.legalInfo),
    t: (__VLS_ctx.t),
}));
const __VLS_82 = __VLS_81({
    ...{ 'onUpdate:healthInfo': {} },
    ...{ 'onUpdate:legalInfo': {} },
    healthInfo: (__VLS_ctx.form.healthInfo),
    legalInfo: (__VLS_ctx.form.legalInfo),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_85;
const __VLS_86 = ({ 'update:healthInfo': {} },
    { 'onUpdate:healthInfo': (__VLS_ctx.updateHealthInfo) });
const __VLS_87 = ({ 'update:legalInfo': {} },
    { 'onUpdate:legalInfo': (__VLS_ctx.updateLegalInfo) });
var __VLS_83;
var __VLS_84;
const __VLS_88 = GuaranteeInfoForm;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
    ...{ 'onUpdate:guaranteeInfo': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    guaranteeInfo: (__VLS_ctx.form.guaranteeInfo),
    t: (__VLS_ctx.t),
}));
const __VLS_90 = __VLS_89({
    ...{ 'onUpdate:guaranteeInfo': {} },
    ...{ 'onFileSelected': {} },
    ...{ 'onUploadDocument': {} },
    guaranteeInfo: (__VLS_ctx.form.guaranteeInfo),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
let __VLS_93;
const __VLS_94 = ({ 'update:guaranteeInfo': {} },
    { 'onUpdate:guaranteeInfo': (__VLS_ctx.updateGuaranteeInfo) });
const __VLS_95 = ({ fileSelected: {} },
    { onFileSelected: (__VLS_ctx.addToast) });
const __VLS_96 = ({ uploadDocument: {} },
    { onUploadDocument: (__VLS_ctx.openDocumentUpload) });
var __VLS_91;
var __VLS_92;
const __VLS_97 = AdditionalInfoForm;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({
    ...{ 'onUpdate:emergency': {} },
    ...{ 'onUpdate:emergencyAddress': {} },
    ...{ 'onUpdate:bank': {} },
    emergency: (__VLS_ctx.emergencyContact),
    emergencyAddress: (__VLS_ctx.form.emergencyContactAddress),
    bank: (__VLS_ctx.bankAccount),
    ethiopianBanks: (__VLS_ctx.ethiopianBanks),
    t: (__VLS_ctx.t),
}));
const __VLS_99 = __VLS_98({
    ...{ 'onUpdate:emergency': {} },
    ...{ 'onUpdate:emergencyAddress': {} },
    ...{ 'onUpdate:bank': {} },
    emergency: (__VLS_ctx.emergencyContact),
    emergencyAddress: (__VLS_ctx.form.emergencyContactAddress),
    bank: (__VLS_ctx.bankAccount),
    ethiopianBanks: (__VLS_ctx.ethiopianBanks),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_98));
let __VLS_102;
const __VLS_103 = ({ 'update:emergency': {} },
    { 'onUpdate:emergency': (__VLS_ctx.updateEmergencyContact) });
const __VLS_104 = ({ 'update:emergencyAddress': {} },
    { 'onUpdate:emergencyAddress': (__VLS_ctx.updateEmergencyAddress) });
const __VLS_105 = ({ 'update:bank': {} },
    { 'onUpdate:bank': (__VLS_ctx.updateBankAccount) });
var __VLS_100;
var __VLS_101;
const __VLS_106 = ScannedDocumentsForm;
// @ts-ignore
const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
    ...{ 'onFileSelected': {} },
    ...{ 'onUpdate:documents': {} },
    ref: "scannedDocsRef",
    t: (__VLS_ctx.t),
}));
const __VLS_108 = __VLS_107({
    ...{ 'onFileSelected': {} },
    ...{ 'onUpdate:documents': {} },
    ref: "scannedDocsRef",
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_107));
let __VLS_111;
const __VLS_112 = ({ fileSelected: {} },
    { onFileSelected: (__VLS_ctx.addToast) });
const __VLS_113 = ({ 'update:documents': {} },
    { 'onUpdate:documents': (__VLS_ctx.updateScannedDocuments) });
var __VLS_114 = {};
var __VLS_109;
var __VLS_110;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-actions" },
});
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
let __VLS_116;
/** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
routerLink;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
    to: "/employees",
    ...{ class: "btn-outline" },
}));
const __VLS_118 = __VLS_117({
    to: "/employees",
    ...{ class: "btn-outline" },
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
const { default: __VLS_121 } = __VLS_119.slots;
(__VLS_ctx.$t('common.cancel'));
// @ts-ignore
[t, t, t, t, t, t, t, t, t, t, t, t, t, openImportModal, saveAllData, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, errors, errors, countries, profilePreview, updateForm, updateForm, updateProfileFile, updateProfilePreview, updateNationalIdFile, addToast, addToast, addToast, addToast, addToast, openDocumentUpload, openDocumentUpload, openDocumentUpload, openDocumentUpload, openDocumentUpload, openDocumentUpload, openDocumentUpload, updateCurrentCompany, departments, positions, employeeList, updateWorkExperience, updateWorkDocument, updateSpouseInfo, updateChildren, updateParentsInfo, updateEducation, updateTraining, updateLanguageSkills, updateOtherSkills, updateNationalityAcquisition, updateHealthInfo, updateLegalInfo, updateGuaranteeInfo, emergencyContact, bankAccount, ethiopianBanks, updateEmergencyContact, updateEmergencyAddress, updateBankAccount, updateScannedDocuments, $t,];
var __VLS_119;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.isSubmitting),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
(__VLS_ctx.isSubmitting ? __VLS_ctx.$t('common.saving') : __VLS_ctx.$t('common.saveEmployee'));
if (__VLS_ctx.showDocumentModal) {
    const __VLS_122 = DocumentUploadModal;
    // @ts-ignore
    const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
        ...{ 'onClose': {} },
        ...{ 'onUploaded': {} },
        context: (__VLS_ctx.documentUploadContext),
        t: (__VLS_ctx.t),
    }));
    const __VLS_124 = __VLS_123({
        ...{ 'onClose': {} },
        ...{ 'onUploaded': {} },
        context: (__VLS_ctx.documentUploadContext),
        t: (__VLS_ctx.t),
    }, ...__VLS_functionalComponentArgsRest(__VLS_123));
    let __VLS_127;
    const __VLS_128 = ({ close: {} },
        { onClose: (...[$event]) => {
                if (!(__VLS_ctx.showDocumentModal))
                    return;
                __VLS_ctx.showDocumentModal = false;
                // @ts-ignore
                [t, $t, $t, isSubmitting, isSubmitting, showDocumentModal, showDocumentModal, documentUploadContext,];
            } });
    const __VLS_129 = ({ uploaded: {} },
        { onUploaded: (__VLS_ctx.handleDocumentUploaded) });
    var __VLS_125;
    var __VLS_126;
}
const __VLS_130 = ImportModal;
// @ts-ignore
const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
    ...{ 'onImport': {} },
    ...{ 'onToast': {} },
    show: (__VLS_ctx.showImportModal),
    t: (__VLS_ctx.t),
}));
const __VLS_132 = __VLS_131({
    ...{ 'onImport': {} },
    ...{ 'onToast': {} },
    show: (__VLS_ctx.showImportModal),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_131));
let __VLS_135;
const __VLS_136 = ({ import: {} },
    { onImport: (__VLS_ctx.handleImport) });
const __VLS_137 = ({ toast: {} },
    { onToast: (__VLS_ctx.addToast) });
var __VLS_133;
var __VLS_134;
const __VLS_138 = ToastContainer;
// @ts-ignore
const __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
    ...{ 'onRemoveToast': {} },
    toasts: (__VLS_ctx.toasts),
    t: (__VLS_ctx.t),
}));
const __VLS_140 = __VLS_139({
    ...{ 'onRemoveToast': {} },
    toasts: (__VLS_ctx.toasts),
    t: (__VLS_ctx.t),
}, ...__VLS_functionalComponentArgsRest(__VLS_139));
let __VLS_143;
const __VLS_144 = ({ removeToast: {} },
    { onRemoveToast: (__VLS_ctx.removeToast) });
var __VLS_141;
var __VLS_142;
// @ts-ignore
var __VLS_115 = __VLS_114;
// @ts-ignore
[t, t, addToast, handleDocumentUploaded, showImportModal, handleImport, toasts, removeToast,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
