import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from 'vue-i18n';
import EmployeesService from "@/stores/employee";
const { t } = useI18n();
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
// ========== SCANNED DOCUMENTS STATE ==========
const scannedDocs = ref({
    guaranteeLetter: null,
    guaranteeLetterUrl: null,
    employmentLetter: null,
    employmentLetterUrl: null,
    other: null,
    otherName: '',
    otherUrl: null,
    custom: []
});
const scannedInputRefs = ref({});
// Scanned document file input refs
const guaranteeLetterInput = ref(null);
const employmentLetterInput = ref(null);
const otherInput = ref(null);
// Form data
const form = ref({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    personalEmail: "",
    phone: "",
    // EC dates (for display and editing)
    hireDateEC: "",
    dateOfBirthEC: "",
    confirmationDateEC: "",
    terminationDateEC: "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    nationalId: "",
    departmentId: null,
    positionId: null,
    managerId: null,
    employmentType: "",
    status: "active",
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
        dateOfBirthEC: "",
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
const totalAllowances = computed(() => (parseFloat(form.value.housingAllowance) || 0) +
    (parseFloat(form.value.positionAllowance) || 0) +
    (parseFloat(form.value.transportAllowance) || 0) +
    (parseFloat(form.value.mobileAllowance) || 0));
const grossPay = computed(() => (parseFloat(form.value.basicSalary) || 0) + totalAllowances.value);
const getDepartmentName = computed(() => {
    const dept = departments.value.find((d) => d.departmentId === form.value.departmentId);
    return dept?.name || employee.value?.departmentName || "—";
});
const getPositionName = computed(() => {
    const pos = positions.value.find((p) => p.positionId === form.value.positionId);
    return pos?.title || employee.value?.position || "—";
});
const getEmploymentTypeLabel = (type) => {
    const labels = {
        "full-time": t('employee.fullTime'),
        "part-time": t('employee.partTime'),
        contract: t('employee.contract'),
        intern: t('employee.intern'),
    };
    return labels[type] || type;
};
const getAvatarUrl = (name) => `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name || "User")}`;
const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");
const formatCurrency = (val) => val ? `ETB ${Number(val).toLocaleString()}` : "—";
const getDocumentUrl = (type, index) => {
    const docs = employee.value?.documents;
    if (!docs)
        return null;
    if (index !== undefined && index !== null) {
        const indexedKey = `${type}_${index}`;
        if (docs[indexedKey]) {
            return docs[indexedKey]?.fileUrl || null;
        }
    }
    if (docs[type]) {
        if (Array.isArray(docs[type])) {
            return docs[type][0]?.fileUrl || null;
        }
        return docs[type]?.fileUrl || null;
    }
    return null;
};
const getDocumentWithIndex = (type, index) => {
    const docs = employee.value?.documents;
    if (!docs)
        return null;
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
// ========== SCANNED DOCUMENTS COMPUTED ==========
const scannedDocumentCount = computed(() => {
    let count = 0;
    if (scannedDocs.value.guaranteeLetter)
        count++;
    if (scannedDocs.value.employmentLetter)
        count++;
    if (scannedDocs.value.other)
        count++;
    scannedDocs.value.custom.forEach(doc => {
        if (doc.file)
            count++;
    });
    return count;
});
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
            // Helper function to safely get parentsInfo
            const getParentsInfo = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        father: { fullName: "", monthlyIncome: null, job: "" },
                        mother: { fullName: "", monthlyIncome: null, job: "" },
                        financialSupport: "",
                        otherSupport: ""
                    };
                }
                return {
                    father: {
                        fullName: data.father?.fullName || "",
                        monthlyIncome: data.father?.monthlyIncome || null,
                        job: data.father?.job || ""
                    },
                    mother: {
                        fullName: data.mother?.fullName || "",
                        monthlyIncome: data.mother?.monthlyIncome || null,
                        job: data.mother?.job || ""
                    },
                    financialSupport: data.financialSupport || "",
                    otherSupport: data.otherSupport || ""
                };
            };
            // Helper function for spouseInfo
            const getSpouseInfo = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        fullName: "",
                        tinNumber: "",
                        dateOfBirthEC: "",
                        jobStatus: "",
                        companyName: "",
                        companyAddress: "",
                    };
                }
                return {
                    fullName: data.fullName || "",
                    tinNumber: data.tinNumber || "",
                    dateOfBirthEC: data.dateOfBirthEC || "",
                    jobStatus: data.jobStatus || "",
                    companyName: data.companyName || "",
                    companyAddress: data.companyAddress || "",
                };
            };
            // Helper function for bankAccount
            const getBankAccount = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        bankName: "",
                        accountNumber: "",
                        accountHolderName: "",
                        branch: "",
                    };
                }
                return {
                    bankName: data.bankName || "",
                    accountNumber: data.accountNumber || "",
                    accountHolderName: data.accountHolderName || "",
                    branch: data.branch || "",
                };
            };
            // Helper function for emergencyContact
            const getEmergencyContact = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        name: "",
                        relationship: "",
                        phone: "",
                        alternatePhone: "",
                    };
                }
                return {
                    name: data.name || "",
                    relationship: data.relationship || "",
                    phone: data.phone || "",
                    alternatePhone: data.alternatePhone || "",
                };
            };
            // Helper function for emergencyContactAddress
            const getEmergencyContactAddress = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        city: "",
                        subcity: "",
                        district: "",
                        kebele: "",
                    };
                }
                return {
                    city: data.city || "",
                    subcity: data.subcity || "",
                    district: data.district || "",
                    kebele: data.kebele || "",
                };
            };
            // Helper function for currentAddress
            const getCurrentAddress = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        region: "",
                        subcity: "",
                        kebele: "",
                        district: "",
                        poBox: "",
                        houseNumber: "",
                    };
                }
                return {
                    region: data.region || "",
                    subcity: data.subcity || "",
                    kebele: data.kebele || "",
                    district: data.district || "",
                    poBox: data.poBox || "",
                    houseNumber: data.houseNumber || "",
                };
            };
            // Helper function for permanentAddress
            const getPermanentAddress = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        region: "",
                        subcity: "",
                        kebele: "",
                        district: "",
                        poBox: "",
                        houseNumber: "",
                    };
                }
                return {
                    region: data.region || "",
                    subcity: data.subcity || "",
                    kebele: data.kebele || "",
                    district: data.district || "",
                    poBox: data.poBox || "",
                    houseNumber: data.houseNumber || "",
                };
            };
            // Helper function for birthPlace
            const getBirthPlace = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        region: "",
                        city: "",
                        subcity: "",
                        district: "",
                    };
                }
                return {
                    region: data.region || "",
                    city: data.city || "",
                    subcity: data.subcity || "",
                    district: data.district || "",
                };
            };
            // Helper function for currentCompany
            const getCurrentCompany = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return {
                        companyName: "",
                        companyTin: "",
                        companyPhone: "",
                        companyEmail: "",
                        companyAddress: "",
                        poBox: "",
                        website: "",
                    };
                }
                return {
                    companyName: data.companyName || "",
                    companyTin: data.companyTin || "",
                    companyPhone: data.companyPhone || "",
                    companyEmail: data.companyEmail || "",
                    companyAddress: data.companyAddress || "",
                    poBox: data.poBox || "",
                    website: data.website || "",
                };
            };
            // Helper function for nationalityAcquisition
            const getNationalityAcquisition = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return { type: "by_birth" };
                }
                return {
                    type: data.type || "by_birth",
                };
            };
            // Helper function for healthInfo
            const getHealthInfo = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return { hasPhysicalInjury: false, injuryDescription: "" };
                }
                return {
                    hasPhysicalInjury: data.hasPhysicalInjury || false,
                    injuryDescription: data.injuryDescription || "",
                };
            };
            // Helper function for legalInfo
            const getLegalInfo = (data) => {
                if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                    return { hasCriminalRecord: false, criminalRecordDescription: "" };
                }
                return {
                    hasCriminalRecord: data.hasCriminalRecord || false,
                    criminalRecordDescription: data.criminalRecordDescription || "",
                };
            };
            // Helper function for children
            const getChildren = (data) => {
                if (!data || !Array.isArray(data) || data.length === 0) {
                    return [];
                }
                return data.map(child => ({
                    name: child.name || "",
                    dateOfBirthEC: child.dateOfBirthEC || "",
                    hasMedicalCondition: child.hasMedicalCondition || false,
                    isAdopted: child.isAdopted || false,
                    medicalConditionNotes: child.medicalConditionNotes || "",
                }));
            };
            // Helper function for education
            const getEducation = (data) => {
                if (!data || !Array.isArray(data) || data.length === 0) {
                    return [];
                }
                return data.map(edu => ({
                    level: edu.level || "",
                    institutionName: edu.institutionName || "",
                    institutionAddress: edu.institutionAddress || "",
                    startDateEC: edu.startDateEC || "",
                    endDateEC: edu.endDateEC || "",
                    isCurrent: edu.isCurrent || false,
                }));
            };
            // Helper function for training
            const getTraining = (data) => {
                if (!data || !Array.isArray(data) || data.length === 0) {
                    return [];
                }
                return data.map(train => ({
                    trainingName: train.trainingName || "",
                    institutionName: train.institutionName || "",
                    institutionAddress: train.institutionAddress || "",
                    startDateEC: train.startDateEC || "",
                    endDateEC: train.endDateEC || "",
                }));
            };
            // Helper function for workExperience
            const getWorkExperience = (data) => {
                if (!data || !Array.isArray(data) || data.length === 0) {
                    return [];
                }
                return data.map(work => ({
                    position: work.position || "",
                    companyName: work.companyName || "",
                    companyAddress: work.companyAddress || "",
                    startDateEC: work.startDateEC || "",
                    endDateEC: work.endDateEC || "",
                    monthlySalary: work.monthlySalary || "",
                    salaryWhenLeft: work.salaryWhenLeft || "",
                    terminationReason: work.terminationReason || "",
                    providentFundSubmitted: work.providentFundSubmitted || "no",
                    providentFundStartDateEC: work.providentFundStartDateEC || "",
                }));
            };
            // Helper function for guaranteeInfo
            const getGuaranteeInfo = (data) => {
                if (!data || !Array.isArray(data) || data.length === 0) {
                    return [];
                }
                return data.map(guar => ({
                    guarantorName: guar.guarantorName || "",
                    guarantorJob: guar.guarantorJob || "",
                    guarantorOfficeName: guar.guarantorOfficeName || "",
                    guarantorOfficeAddress: guar.guarantorOfficeAddress || "",
                    guaranteeLetterNo: guar.guaranteeLetterNo || "",
                    guaranteeLetterDateEC: guar.guaranteeLetterDateEC || "",
                    sdtLetterNo: guar.sdtLetterNo || "",
                    sdtLetterDateEC: guar.sdtLetterDateEC || "",
                    confirmedDateEC: guar.confirmedDateEC || "",
                }));
            };
            form.value = {
                // Basic Info
                firstName: emp.firstName || "",
                lastName: emp.lastName || "",
                middleName: emp.middleName || "",
                email: emp.email || emp.workEmail || "",
                personalEmail: emp.personalEmail || "",
                phone: emp.phone || emp.phoneNumber || "",
                fullNameEnglish: emp.fullNameEnglish || "",
                // ========== EC DATES ONLY ==========
                hireDateEC: emp.hireDateEC || "",
                dateOfBirthEC: emp.dateOfBirthEC || "",
                confirmationDateEC: emp.confirmationDateEC || "",
                terminationDateEC: emp.terminationDateEC || "",
                // Personal Details
                gender: emp.gender || "",
                maritalStatus: emp.maritalStatus || "",
                nationality: emp.nationality || "",
                nationalId: emp.nationalId || "",
                // Employment
                departmentId: emp.departmentId || null,
                positionId: emp.positionId || null,
                managerId: emp.managerId || null,
                employmentType: emp.employmentType || "",
                status: emp.status || "active",
                workLocation: emp.workLocation || "",
                shiftType: emp.shiftType || "day",
                // Salary & Allowances
                basicSalary: emp.basicSalary || emp.salary || null,
                housingAllowance: emp.housingAllowance || 0,
                positionAllowance: emp.positionAllowance || 0,
                transportAllowance: emp.transportAllowance || 0,
                mobileAllowance: emp.mobileAllowance || 0,
                // Addresses
                birthPlace: getBirthPlace(emp.birthPlace),
                currentCompany: getCurrentCompany(emp.currentCompany),
                currentAddress: getCurrentAddress(emp.currentAddress),
                permanentAddress: getPermanentAddress(emp.permanentAddress),
                emergencyContact: getEmergencyContact(emp.emergencyContact),
                emergencyContactAddress: getEmergencyContactAddress(emp.emergencyContactAddress),
                bankAccount: getBankAccount(emp.bankAccount),
                // Family
                spouseInfo: getSpouseInfo(emp.spouseInfo),
                children: getChildren(emp.children),
                parentsInfo: getParentsInfo(emp.parentsInfo),
                // Education & Training
                education: getEducation(emp.education),
                training: getTraining(emp.training),
                workExperience: getWorkExperience(emp.workExperience),
                guaranteeInfo: getGuaranteeInfo(emp.guaranteeInfo),
                // Skills
                languageSkills: emp.languageSkills || [],
                otherSkills: emp.otherSkills || "",
                // Other
                nationalityAcquisition: getNationalityAcquisition(emp.nationalityAcquisition),
                healthInfo: getHealthInfo(emp.healthInfo),
                legalInfo: getLegalInfo(emp.legalInfo),
            };
            // Load scanned documents from employee data
            loadScannedDocuments();
        }
        else {
            addToast(t('messages.loadError'), "error");
        }
    }
    catch (error) {
        console.error('Error loading employee:', error);
        addToast(t('messages.loadError'), "error");
    }
    finally {
        loading.value = false;
    }
};
const loadDropdowns = async () => {
    try {
        const deptRes = await EmployeesService.getDepartments();
        if (deptRes.success)
            departments.value = deptRes.data;
        const posRes = await EmployeesService.getPositions();
        if (posRes.success)
            positions.value = posRes.data;
        const empRes = await EmployeesService.getEmployees({ limit: 100 });
        if (empRes.success)
            managers.value = empRes.data.filter((e) => e.id != employeeId);
    }
    catch (error) {
        console.error("Error loading dropdowns:", error);
    }
};
// ========== LOAD SCANNED DOCUMENTS ==========
const loadScannedDocuments = () => {
    if (!employee.value)
        return;
    const docs = employee.value.documents || {};
    // Check for guarantee letter
    if (docs.guarantee_letter?.fileUrl) {
        scannedDocs.value.guaranteeLetterUrl = docs.guarantee_letter.fileUrl;
    }
    // Check for employment letter
    if (docs.employment_letter?.fileUrl) {
        scannedDocs.value.employmentLetterUrl = docs.employment_letter.fileUrl;
    }
    // Check for other document
    if (docs.other_document?.fileUrl) {
        scannedDocs.value.otherUrl = docs.other_document.fileUrl;
        scannedDocs.value.otherName = docs.other_document.fileName || 'Other Document';
    }
    // Check for custom documents
    if (docs.custom_document) {
        const customDocs = Array.isArray(docs.custom_document) ? docs.custom_document : [docs.custom_document];
        customDocs.forEach((doc, index) => {
            if (doc.fileUrl) {
                scannedDocs.value.custom.push({
                    id: Date.now() + index,
                    name: doc.fileName || 'Custom Document',
                    file: null,
                    url: doc.fileUrl
                });
            }
        });
    }
};
// Profile picture
const profileInput = ref(null);
const triggerProfileInput = () => profileInput.value.click();
const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = (ev) => (profilePreview.value = ev.target.result);
    reader.readAsDataURL(file);
    const res = await EmployeesService.uploadProfilePicture(employeeId, file);
    if (res.success)
        addToast(t('messages.uploadSuccess'), "success");
    else
        addToast(t('messages.uploadError'), "error");
};
// National ID
const nationalIdInput = ref(null);
const triggerNationalIdUpload = () => nationalIdInput.value?.click();
const handleNationalIdSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        nationalIdFile.value = file;
        addToast(t('employee.fileSelected') + `: ${file.name}`, "success");
    }
};
// Naturalization document
const naturalizationInput = ref(null);
const triggerNaturalizationUpload = () => naturalizationInput.value?.click();
const handleNaturalizationSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        nationalityDocFile.value = file;
        addToast(t('employee.fileSelected') + `: ${file.name}`, "success");
    }
};
// Spouse
const spouseProfileInput = ref(null);
const marriageCertInput = ref(null);
const triggerSpouseProfileInput = () => spouseProfileInput.value.click();
const handleSpouseProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = (ev) => (spouseProfilePreview.value = ev.target.result);
    reader.readAsDataURL(file);
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, "spouse_profile", { index: 0 });
    if (res.success) {
        addToast(t('messages.uploadSuccess'), "success");
        await refreshEmployeeData();
    }
};
const triggerMarriageCertUpload = () => marriageCertInput.value.click();
const handleMarriageCertUpload = async (e) => {
    const file = e.target.files[0];
    if (!file)
        return;
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, "marriage_certificate", { index: 0 });
    if (res.success) {
        addToast(t('messages.uploadSuccess'), "success");
        await refreshEmployeeData();
    }
};
// Children
const addChild = () => form.value.children.push({
    name: "",
    dateOfBirthEC: "",
    hasMedicalCondition: false,
    isAdopted: false,
    medicalConditionNotes: "",
});
const removeChild = (idx) => form.value.children.splice(idx, 1);
const triggerChildProfileUpload = (idx) => {
    const inputId = `child-profile-input-${idx}`;
    let input = document.getElementById(inputId);
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = inputId;
        input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
        input.style.display = 'none';
        input.onchange = (e) => handleChildProfileUpload(e, idx);
        document.body.appendChild(input);
    }
    input.click();
};
const handleChildProfileUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file)
        return;
    if (!file.type.startsWith('image/')) {
        addToast(t('upload.error'), 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        addToast(t('upload.error'), 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        childProfilePreviews.value[idx] = ev.target.result;
    };
    reader.readAsDataURL(file);
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, 'child_profile', { index: idx });
    if (res.success) {
        addToast(t('messages.uploadSuccess'), 'success');
        await refreshEmployeeData();
        const newUrl = getDocumentWithIndex('child_profile', idx);
        if (newUrl) {
            childProfilePreviews.value[idx] = newUrl;
        }
        e.target.value = '';
    }
    else {
        addToast(t('messages.uploadError'), 'error');
        delete childProfilePreviews.value[idx];
    }
};
const triggerChildDocUpload = (idx, type) => {
    currentChildData = { idx, type };
    const inputId = `child-doc-input-${idx}-${type}`;
    let input = document.getElementById(inputId);
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = inputId;
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.style.display = 'none';
        input.onchange = handleChildDocUpload;
        document.body.appendChild(input);
    }
    input.click();
};
const handleChildDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentChildData)
        return;
    const { idx, type } = currentChildData;
    let documentType = '';
    switch (type) {
        case 'birth':
            documentType = 'child_birth_certificate';
            break;
        case 'medical':
            documentType = 'child_medical_report';
            break;
        case 'adoption':
            documentType = 'child_adoption_certificate';
            break;
        default:
            return;
    }
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, documentType, { index: idx });
    if (res.success) {
        addToast(t('messages.uploadSuccess'), 'success');
        await refreshEmployeeData();
    }
    else {
        addToast(t('messages.uploadError'), 'error');
    }
    e.target.value = '';
    currentChildData = null;
};
const refreshEmployeeData = async () => {
    try {
        const result = await EmployeesService.getEmployeeById(employeeId);
        if (result.success && result.data) {
            employee.value = result.data;
        }
    }
    catch (error) {
        console.error('Error refreshing employee data:', error);
    }
};
// Education
const educationInput = ref(null);
const addEducation = () => form.value.education.push({
    level: "",
    institutionName: "",
    institutionAddress: "",
    startDateEC: "",
    endDateEC: "",
    isCurrent: false,
});
const removeEducation = (idx) => form.value.education.splice(idx, 1);
const triggerEducationUpload = (idx) => {
    currentEducationIndex = idx;
    educationInput.value.click();
};
const handleEducationUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || currentEducationIndex === null)
        return;
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, "education_certificate", { index: currentEducationIndex });
    if (res.success)
        addToast(t('messages.uploadSuccess'), "success");
    currentEducationIndex = null;
};
// Training
const trainingInput = ref(null);
const addTraining = () => form.value.training.push({
    trainingName: "",
    institutionName: "",
    institutionAddress: "",
    startDateEC: "",
    endDateEC: "",
});
const removeTraining = (idx) => form.value.training.splice(idx, 1);
const triggerTrainingUpload = (idx) => {
    currentTrainingIndex = idx;
    trainingInput.value.click();
};
const handleTrainingUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || currentTrainingIndex === null)
        return;
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, "training_certificate", { index: currentTrainingIndex });
    if (res.success)
        addToast(t('messages.uploadSuccess'), "success");
    currentTrainingIndex = null;
};
// Work Experience
const workInput = ref(null);
const addWork = () => form.value.workExperience.push({
    position: "",
    companyName: "",
    companyAddress: "",
    startDateEC: "",
    endDateEC: "",
    monthlySalary: "",
    salaryWhenLeft: "",
    terminationReason: "",
    providentFundSubmitted: "no",
    providentFundStartDateEC: "",
});
const removeWork = (idx) => form.value.workExperience.splice(idx, 1);
const triggerWorkUpload = (idx) => {
    currentWorkIndex = idx;
    workInput.value.click();
};
const handleWorkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || currentWorkIndex === null)
        return;
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, "experience_letter", { index: currentWorkIndex });
    if (res.success)
        addToast(t('messages.uploadSuccess'), "success");
    currentWorkIndex = null;
};
// Guarantee
const guaranteeInput = ref(null);
const addGuarantor = () => form.value.guaranteeInfo.push({
    guarantorName: "",
    guarantorJob: "",
    guarantorOfficeName: "",
    guarantorOfficeAddress: "",
    guaranteeLetterNo: "",
    guaranteeLetterDateEC: "",
    sdtLetterNo: "",
    sdtLetterDateEC: "",
    confirmedDateEC: "",
});
const removeGuarantor = (idx) => form.value.guaranteeInfo.splice(idx, 1);
const triggerGuaranteeUpload = (idx, type) => {
    currentGuaranteeData = { idx, type };
    guaranteeInput.value.click();
};
const handleGuaranteeDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentGuaranteeData)
        return;
    const types = { guarantee: "guarantee_letter", sdt: "sdt_letter" };
    const res = await EmployeesService.uploadEmployeeDocument(employeeId, file, types[currentGuaranteeData.type], { index: currentGuaranteeData.idx });
    if (res.success)
        addToast(t('messages.uploadSuccess'), "success");
    currentGuaranteeData = null;
};
// Language
const addLanguage = () => form.value.languageSkills.push({ language: "", proficiency: "" });
const removeLanguage = (idx) => form.value.languageSkills.splice(idx, 1);
// ========== SCANNED DOCUMENTS METHODS ==========
const triggerScannedDocUpload = (type) => {
    const inputMap = {
        guaranteeLetter: guaranteeLetterInput,
        employmentLetter: employmentLetterInput,
        other: otherInput
    };
    const input = inputMap[type];
    if (input && input.value) {
        input.value.click();
    }
};
const handleScannedDocUpload = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file)
        return;
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) &&
        !file.name.endsWith('.pdf') &&
        !file.name.endsWith('.doc') &&
        !file.name.endsWith('.docx')) {
        addToast('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.', 'error');
        event.target.value = '';
        return;
    }
    // Map to the correct ref
    const typeMap = {
        guaranteeLetter: { file: 'guaranteeLetter', url: 'guaranteeLetterUrl' },
        employmentLetter: { file: 'employmentLetter', url: 'employmentLetterUrl' },
        other: { file: 'other', url: 'otherUrl' }
    };
    const mapped = typeMap[type];
    if (mapped) {
        scannedDocs.value[mapped.file] = file;
        scannedDocs.value[mapped.url] = URL.createObjectURL(file);
    }
    addToast(`${file.name} selected`, 'success');
    event.target.value = '';
};
const clearScannedDoc = (type) => {
    const typeMap = {
        other: { file: 'other', name: 'otherName', url: 'otherUrl' }
    };
    const mapped = typeMap[type];
    if (mapped) {
        scannedDocs.value[mapped.file] = null;
        scannedDocs.value[mapped.name] = '';
        scannedDocs.value[mapped.url] = null;
    }
};
const addScannedCustomDocument = () => {
    scannedDocs.value.custom.push({
        id: Date.now(),
        name: '',
        file: null,
        url: null
    });
};
const removeScannedCustomDocument = (index) => {
    scannedDocs.value.custom.splice(index, 1);
};
const setScannedCustomInputRef = (el, index) => {
    if (el) {
        scannedInputRefs.value[index] = el;
    }
};
const triggerScannedCustomUpload = (index) => {
    const input = scannedInputRefs.value[index];
    if (input) {
        input.click();
    }
};
const handleScannedCustomUpload = (event, index) => {
    const file = event.target.files?.[0];
    if (!file)
        return;
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) &&
        !file.name.endsWith('.pdf') &&
        !file.name.endsWith('.doc') &&
        !file.name.endsWith('.docx')) {
        addToast('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.', 'error');
        event.target.value = '';
        return;
    }
    scannedDocs.value.custom[index].file = file;
    scannedDocs.value.custom[index].url = URL.createObjectURL(file);
    addToast(`${file.name} selected`, 'success');
    event.target.value = '';
};
// Clean data function
const cleanData = (data) => {
    if (data === null || data === undefined)
        return null;
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
                if (typeof cleanedValue === "object" &&
                    Object.keys(cleanedValue).length === 0)
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
        if (nationalIdFile.value) {
            await EmployeesService.uploadEmployeeDocument(employeeId, nationalIdFile.value, "national_id");
        }
        if (nationalityDocFile.value) {
            await EmployeesService.uploadEmployeeDocument(employeeId, nationalityDocFile.value, "naturalization_certificate");
        }
        // ========== UPLOAD SCANNED DOCUMENTS ==========
        // 1. Guarantee Letter
        if (scannedDocs.value.guaranteeLetter) {
            await EmployeesService.uploadEmployeeDocument(employeeId, scannedDocs.value.guaranteeLetter, 'guarantee_letter');
        }
        // 2. Employment Letter
        if (scannedDocs.value.employmentLetter) {
            await EmployeesService.uploadEmployeeDocument(employeeId, scannedDocs.value.employmentLetter, 'employment_letter');
        }
        // 3. Other Document
        if (scannedDocs.value.other) {
            await EmployeesService.uploadEmployeeDocument(employeeId, scannedDocs.value.other, 'other_document', { description: scannedDocs.value.otherName || 'Other Document' });
        }
        // 4. Custom Documents
        for (let i = 0; i < scannedDocs.value.custom.length; i++) {
            const doc = scannedDocs.value.custom[i];
            if (doc.file) {
                await EmployeesService.uploadEmployeeDocument(employeeId, doc.file, 'custom_document', {
                    index: i,
                    description: doc.name || 'Custom Document'
                });
            }
        }
        const updateData = {
            firstName: form.value.firstName || undefined,
            lastName: form.value.lastName || undefined,
            middleName: form.value.middleName || undefined,
            fullNameEnglish: form.value.fullNameEnglish || undefined,
            email: form.value.email || undefined,
            personalEmail: form.value.personalEmail || undefined,
            phone: form.value.phone || undefined,
            gender: form.value.gender || undefined,
            maritalStatus: form.value.maritalStatus || undefined,
            nationality: form.value.nationality || undefined,
            nationalId: form.value.nationalId || undefined,
            departmentId: form.value.departmentId,
            positionId: form.value.positionId,
            managerId: form.value.managerId,
            employmentType: form.value.employmentType || undefined,
            status: form.value.status,
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
            // ========== EC DATES ==========
            hireDateEC: form.value.hireDateEC || undefined,
            dateOfBirthEC: form.value.dateOfBirthEC || undefined,
            confirmationDateEC: form.value.confirmationDateEC || undefined,
            terminationDateEC: form.value.terminationDateEC || undefined,
        };
        if (form.value.birthPlace &&
            Object.values(form.value.birthPlace).some((v) => v)) {
            updateData.birthPlace = cleanData(form.value.birthPlace);
        }
        if (form.value.currentCompany &&
            Object.values(form.value.currentCompany).some((v) => v)) {
            updateData.currentCompany = cleanData(form.value.currentCompany);
        }
        if (form.value.currentAddress &&
            Object.values(form.value.currentAddress).some((v) => v)) {
            updateData.currentAddress = cleanData(form.value.currentAddress);
        }
        if (form.value.permanentAddress &&
            Object.values(form.value.permanentAddress).some((v) => v)) {
            updateData.permanentAddress = cleanData(form.value.permanentAddress);
        }
        if (form.value.emergencyContact &&
            Object.values(form.value.emergencyContact).some((v) => v)) {
            updateData.emergencyContact = cleanData(form.value.emergencyContact);
        }
        if (form.value.emergencyContactAddress &&
            Object.values(form.value.emergencyContactAddress).some((v) => v)) {
            updateData.emergencyContactAddress = cleanData(form.value.emergencyContactAddress);
        }
        if (form.value.bankAccount &&
            Object.values(form.value.bankAccount).some((v) => v)) {
            updateData.bankAccount = cleanData(form.value.bankAccount);
        }
        if (form.value.spouseInfo &&
            Object.values(form.value.spouseInfo).some((v) => v)) {
            updateData.spouseInfo = cleanData(form.value.spouseInfo);
        }
        if (form.value.children && form.value.children.length > 0) {
            updateData.children = form.value.children
                .map((child) => cleanData(child))
                .filter((c) => c && c.name);
        }
        if (form.value.parentsInfo &&
            (form.value.parentsInfo.father?.fullName ||
                form.value.parentsInfo.mother?.fullName)) {
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
            updateData.nationalityAcquisition = cleanData(form.value.nationalityAcquisition);
        }
        if (form.value.healthInfo && form.value.healthInfo.hasPhysicalInjury) {
            updateData.healthInfo = cleanData(form.value.healthInfo);
        }
        if (form.value.legalInfo && form.value.legalInfo.hasCriminalRecord) {
            updateData.legalInfo = cleanData(form.value.legalInfo);
        }
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });
        const response = await EmployeesService.updateEmployee(employeeId, updateData);
        if (response.success) {
            addToast(t('messages.saveSuccess'), "success");
            setTimeout(() => router.push(`/employees/${employeeId}`), 1500);
        }
        else {
            addToast(response.error || t('messages.saveError'), "error");
        }
    }
    catch (error) {
        console.error("Save error:", error);
        const errorMessage = error.response?.data?.message || error.message || t('messages.saveError');
        addToast(errorMessage, "error");
    }
    finally {
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
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['file-link']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-upload-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-upload-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-placeholder-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
/** @type {__VLS_StyleScopedClasses['child-edit-content']} */ ;
/** @type {__VLS_StyleScopedClasses['child-name-row']} */ ;
/** @type {__VLS_StyleScopedClasses['child-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['child-dob-input']} */ ;
/** @type {__VLS_StyleScopedClasses['child-documents-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-upload-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar-placeholder-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
/** @type {__VLS_StyleScopedClasses['child-edit-item']} */ ;
/** @type {__VLS_StyleScopedClasses['parent-edit-section']} */ ;
/** @type {__VLS_StyleScopedClasses['children-list-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['child-dob-input']} */ ;
/** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['status-select']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['parents-edit-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-right']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-name-container']} */ ;
/** @type {__VLS_StyleScopedClasses['name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['date-group']} */ ;
/** @type {__VLS_StyleScopedClasses['salary-group']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-name-container']} */ ;
/** @type {__VLS_StyleScopedClasses['name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-child-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-small-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['file-link-inline']} */ ;
/** @type {__VLS_StyleScopedClasses['file-link-inline']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-success']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-error']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-basic']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['tag']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-right']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
/** @type {__VLS_StyleScopedClasses['code-label']} */ ;
/** @type {__VLS_StyleScopedClasses['code-value']} */ ;
/** @type {__VLS_StyleScopedClasses['status-select']} */ ;
/** @type {__VLS_StyleScopedClasses['status-select']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-select']} */ ;
/** @type {__VLS_StyleScopedClasses['status-select']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['left-column']} */ ;
/** @type {__VLS_StyleScopedClasses['right-column']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-card']} */ ;
/** @type {__VLS_StyleScopedClasses['allowances-content']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['gross']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-info']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-name']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['education-item']} */ ;
/** @type {__VLS_StyleScopedClasses['training-item']} */ ;
/** @type {__VLS_StyleScopedClasses['work-item']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantor-card-item']} */ ;
/** @type {__VLS_StyleScopedClasses['skills-list']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['value-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['value-card']} */ ;
/** @type {__VLS_StyleScopedClasses['increase']} */ ;
/** @type {__VLS_StyleScopedClasses['value-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['value-card']} */ ;
/** @type {__VLS_StyleScopedClasses['new']} */ ;
/** @type {__VLS_StyleScopedClasses['decrease']} */ ;
/** @type {__VLS_StyleScopedClasses['value-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['value-diff']} */ ;
/** @type {__VLS_StyleScopedClasses['increase']} */ ;
/** @type {__VLS_StyleScopedClasses['value-diff']} */ ;
/** @type {__VLS_StyleScopedClasses['decrease']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['scanned-documents-card']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['has-file']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['view-link']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-doc-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-doc-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['file-info-note']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['parents-edit-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-label-group']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-right']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-name-container']} */ ;
/** @type {__VLS_StyleScopedClasses['name-input']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['child-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-entry']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-left']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-values-full']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-name-container']} */ ;
/** @type {__VLS_StyleScopedClasses['name-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "employee-edit" },
});
/** @type {__VLS_StyleScopedClasses['employee-edit']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('common.loading'));
}
else if (__VLS_ctx.employee) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: "/employees",
        ...{ class: "action-btn" },
    }));
    const __VLS_2 = __VLS_1({
        to: "/employees",
        ...{ class: "action-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    const { default: __VLS_5 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M15 18l-6-6 6-6",
    });
    (__VLS_ctx.$t('common.backToList'));
    // @ts-ignore
    [loading, $t, $t, employee,];
    var __VLS_3;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelEdit) },
        ...{ class: "action-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "18",
        y1: "6",
        x2: "6",
        y2: "18",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "6",
        y1: "6",
        x2: "18",
        y2: "18",
    });
    (__VLS_ctx.$t('common.cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveEmployee) },
        ...{ class: "action-btn primary" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "17 21 17 13 7 13 7 21",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "7 3 7 8 15 8",
    });
    (__VLS_ctx.saving ? __VLS_ctx.$t('common.saving') : __VLS_ctx.$t('common.saveEmployee'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-section" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-left" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.triggerProfileInput) },
        ...{ class: "employee-avatar-large" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ onError: (__VLS_ctx.handleImageError) },
        src: (__VLS_ctx.profilePreview || __VLS_ctx.employee?.profilePictureUrl || __VLS_ctx.getAvatarUrl(__VLS_ctx.employee?.fullName?.trim() || __VLS_ctx.employee?.fullNameEnglish?.trim() || 'Employee')),
        alt: (__VLS_ctx.employee?.fullName?.trim() || 'Employee'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "avatar-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['avatar-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "7 10 12 15 17 10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "15",
        x2: "12",
        y2: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleProfileUpload) },
        type: "file",
        ref: "profileInput",
        accept: "image/jpeg,image/png,image/jpg,image/gif,image/webp",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-basic" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-basic']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "edit-name-container" },
    });
    /** @type {__VLS_StyleScopedClasses['edit-name-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.firstName),
        placeholder: (__VLS_ctx.$t('employee.firstName')),
        ...{ class: "name-input" },
        title: (__VLS_ctx.$t('employee.firstName')),
    });
    /** @type {__VLS_StyleScopedClasses['name-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.middleName),
        placeholder: (__VLS_ctx.$t('employee.middleName')),
        ...{ class: "name-input" },
        title: (__VLS_ctx.$t('employee.middleName')),
    });
    /** @type {__VLS_StyleScopedClasses['name-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.lastName),
        placeholder: (__VLS_ctx.$t('employee.lastName')),
        ...{ class: "name-input" },
        title: (__VLS_ctx.$t('employee.lastName')),
    });
    /** @type {__VLS_StyleScopedClasses['name-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-tags" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-tags']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tag" },
    });
    /** @type {__VLS_StyleScopedClasses['tag']} */ ;
    (__VLS_ctx.getPositionName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tag" },
    });
    /** @type {__VLS_StyleScopedClasses['tag']} */ ;
    (__VLS_ctx.getDepartmentName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-right" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-code" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-code']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "code-label" },
    });
    /** @type {__VLS_StyleScopedClasses['code-label']} */ ;
    (__VLS_ctx.$t('common.employeeId'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "code-value" },
    });
    /** @type {__VLS_StyleScopedClasses['code-value']} */ ;
    (__VLS_ctx.employee.employeeId);
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.status),
        ...{ class: "status-select" },
        ...{ class: (__VLS_ctx.form.status) },
    });
    /** @type {__VLS_StyleScopedClasses['status-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "active",
    });
    (__VLS_ctx.$t('employee.active'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "on-leave",
    });
    (__VLS_ctx.$t('employee.onLeave'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "terminated",
    });
    (__VLS_ctx.$t('employee.terminated'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.$t('employee.department'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.getDepartmentName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "12 6 12 12 16 14",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.$t('employee.hireDate'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.form.hireDateEC || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.$t('employee.employmentType'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.getEmploymentTypeLabel(__VLS_ctx.form.employmentType));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 8c-3.31 0-6 2.69-6 6 0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6 0-3.31-2.69-6-6-6z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v2M22 12h-2M4 12H2M12 22v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.$t('employee.basicSalary'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.form.basicSalary
        ? `${__VLS_ctx.$t('payroll.basicSalary')} ${Number(__VLS_ctx.form.basicSalary).toLocaleString()}`
        : "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "content-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "left-column" },
    });
    /** @type {__VLS_StyleScopedClasses['left-column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('employee.personalInfo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.fullName'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.fullNameEnglish),
        placeholder: (__VLS_ctx.$t('employee.fullNamePlaceholder') || 'Enter full name'),
        title: (__VLS_ctx.$t('employee.fullName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.workEmail'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        placeholder: (__VLS_ctx.$t('employee.workEmail')),
        title: (__VLS_ctx.$t('employee.workEmail')),
    });
    (__VLS_ctx.form.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.personalEmail'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        placeholder: (__VLS_ctx.$t('employee.personalEmail')),
        title: (__VLS_ctx.$t('employee.personalEmail')),
    });
    (__VLS_ctx.form.personalEmail);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.phone'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "tel",
        placeholder: (__VLS_ctx.$t('employee.phone')),
        title: (__VLS_ctx.$t('employee.phone')),
    });
    (__VLS_ctx.form.phone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.dateOfBirth'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.dateOfBirthEC),
        placeholder: "DD/MM/YYYY",
        ...{ class: "ec-date-input" },
        title: (__VLS_ctx.$t('employee.dateOfBirth')),
    });
    /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "ec-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['ec-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.gender'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.gender),
        title: (__VLS_ctx.$t('employee.gender')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('common.select'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "male",
    });
    (__VLS_ctx.$t('employee.male'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "female",
    });
    (__VLS_ctx.$t('employee.female'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "other",
    });
    (__VLS_ctx.$t('employee.other'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.maritalStatus'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.maritalStatus),
        title: (__VLS_ctx.$t('employee.maritalStatus')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('common.select'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "single",
    });
    (__VLS_ctx.$t('employee.single'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "married",
    });
    (__VLS_ctx.$t('employee.married'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "divorced",
    });
    (__VLS_ctx.$t('employee.divorced'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "widowed",
    });
    (__VLS_ctx.$t('employee.widowed'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.nationality'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.nationality),
        title: (__VLS_ctx.$t('employee.nationality')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('common.select'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Ethiopian",
    });
    (__VLS_ctx.$t('nationality.ethiopian'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "American",
    });
    (__VLS_ctx.$t('nationality.american'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "British",
    });
    (__VLS_ctx.$t('nationality.british'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Canadian",
    });
    (__VLS_ctx.$t('nationality.canadian'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Australian",
    });
    (__VLS_ctx.$t('nationality.australian'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "German",
    });
    (__VLS_ctx.$t('nationality.german'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "French",
    });
    (__VLS_ctx.$t('nationality.french'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Italian",
    });
    (__VLS_ctx.$t('nationality.italian'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Spanish",
    });
    (__VLS_ctx.$t('nationality.spanish'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Kenyan",
    });
    (__VLS_ctx.$t('nationality.kenyan'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Eritrean",
    });
    (__VLS_ctx.$t('nationality.eritrean'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Somali",
    });
    (__VLS_ctx.$t('nationality.somali'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Sudanese",
    });
    (__VLS_ctx.$t('nationality.sudanese'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Other",
    });
    (__VLS_ctx.$t('nationality.other'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.nationalId'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.nationalId),
        placeholder: (__VLS_ctx.$t('employee.nationalId')),
        title: (__VLS_ctx.$t('employee.nationalId')),
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.triggerNationalIdUpload) },
        type: "button",
        ...{ class: "upload-small-btn" },
        title: (__VLS_ctx.$t('upload.title')),
    });
    /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
    (__VLS_ctx.nationalIdFile ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload'));
    if (__VLS_ctx.getDocumentUrl('national_id')) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.getDocumentUrl('national_id')),
            target: "_blank",
            ...{ class: "file-link-inline" },
        });
        /** @type {__VLS_StyleScopedClasses['file-link-inline']} */ ;
        (__VLS_ctx.$t('common.view'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleNationalIdSelect) },
        type: "file",
        ref: "nationalIdInput",
        accept: ".pdf,.jpg,.jpeg,.png",
        ...{ style: {} },
    });
    if (__VLS_ctx.nationalIdFile) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "field-hint success" },
        });
        /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['success']} */ ;
        (__VLS_ctx.$t('employee.fileSelected'));
        (__VLS_ctx.nationalIdFile.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "10",
        r: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('employee.birthPlace'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.region'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.birthPlace.region),
        placeholder: (__VLS_ctx.$t('address.region')),
        title: (__VLS_ctx.$t('address.region')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.city'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.birthPlace.city),
        placeholder: (__VLS_ctx.$t('address.city')),
        title: (__VLS_ctx.$t('address.city')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.subcity'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.birthPlace.subcity),
        placeholder: (__VLS_ctx.$t('address.subcity')),
        title: (__VLS_ctx.$t('address.subcity')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.district'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.birthPlace.district),
        placeholder: (__VLS_ctx.$t('address.district')),
        title: (__VLS_ctx.$t('address.district')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('company.currentCompany'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentCompany.companyName),
        placeholder: (__VLS_ctx.$t('company.namePlaceholder')),
        title: (__VLS_ctx.$t('company.name')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.tin'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentCompany.companyTin),
        placeholder: (__VLS_ctx.$t('company.tinPlaceholder')),
        title: (__VLS_ctx.$t('company.tin')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.phone'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "tel",
        placeholder: (__VLS_ctx.$t('company.phone')),
        title: (__VLS_ctx.$t('company.phone')),
    });
    (__VLS_ctx.form.currentCompany.companyPhone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.email'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        placeholder: (__VLS_ctx.$t('company.email')),
        title: (__VLS_ctx.$t('company.email')),
    });
    (__VLS_ctx.form.currentCompany.companyEmail);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.address'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentCompany.companyAddress),
        placeholder: (__VLS_ctx.$t('company.addressPlaceholder')),
        title: (__VLS_ctx.$t('company.address')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.poBox'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentCompany.poBox),
        placeholder: (__VLS_ctx.$t('company.poBoxPlaceholder')),
        title: (__VLS_ctx.$t('company.poBox')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('company.website'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "url",
        placeholder: "https://www.company.com",
        title: (__VLS_ctx.$t('company.website')),
    });
    (__VLS_ctx.form.currentCompany.website);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "10",
        r: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('address.currentAddress'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.region'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentAddress.region),
        placeholder: (__VLS_ctx.$t('address.region')),
        title: (__VLS_ctx.$t('address.region')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.subcity'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentAddress.subcity),
        placeholder: (__VLS_ctx.$t('address.subcity')),
        title: (__VLS_ctx.$t('address.subcity')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.kebele'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentAddress.kebele),
        placeholder: (__VLS_ctx.$t('address.kebele')),
        title: (__VLS_ctx.$t('address.kebele')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.district'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentAddress.district),
        placeholder: (__VLS_ctx.$t('address.district')),
        title: (__VLS_ctx.$t('address.district')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.poBox'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentAddress.poBox),
        placeholder: (__VLS_ctx.$t('address.poBox')),
        title: (__VLS_ctx.$t('address.poBox')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.houseNumber'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.currentAddress.houseNumber),
        placeholder: (__VLS_ctx.$t('address.houseNumber')),
        title: (__VLS_ctx.$t('address.houseNumber')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "10",
        r: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('address.permanentAddress'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.region'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.permanentAddress.region),
        placeholder: (__VLS_ctx.$t('address.region')),
        title: (__VLS_ctx.$t('address.region')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.subcity'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.permanentAddress.subcity),
        placeholder: (__VLS_ctx.$t('address.subcity')),
        title: (__VLS_ctx.$t('address.subcity')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.kebele'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.permanentAddress.kebele),
        placeholder: (__VLS_ctx.$t('address.kebele')),
        title: (__VLS_ctx.$t('address.kebele')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.district'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.permanentAddress.district),
        placeholder: (__VLS_ctx.$t('address.district')),
        title: (__VLS_ctx.$t('address.district')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.poBox'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.permanentAddress.poBox),
        placeholder: (__VLS_ctx.$t('address.poBox')),
        title: (__VLS_ctx.$t('address.poBox')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.houseNumber'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.permanentAddress.houseNumber),
        placeholder: (__VLS_ctx.$t('address.houseNumber')),
        title: (__VLS_ctx.$t('address.houseNumber')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card emergency-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['emergency-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M13.73 21a2 2 0 0 1-3.46 0",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('family.emergencyContact'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('family.contactName'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.emergencyContact.name),
        placeholder: (__VLS_ctx.$t('family.contactNamePlaceholder')),
        title: (__VLS_ctx.$t('family.contactName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('family.relationship'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.emergencyContact.relationship),
        title: (__VLS_ctx.$t('family.relationship')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('common.select'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Spouse",
    });
    (__VLS_ctx.$t('family.spouse'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Parent",
    });
    (__VLS_ctx.$t('family.parent'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Child",
    });
    (__VLS_ctx.$t('family.child'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Sibling",
    });
    (__VLS_ctx.$t('family.sibling'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Relative",
    });
    (__VLS_ctx.$t('family.relative'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Friend",
    });
    (__VLS_ctx.$t('family.friend'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('family.phoneNumber'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "tel",
        placeholder: (__VLS_ctx.$t('family.phoneNumber')),
        title: (__VLS_ctx.$t('family.phoneNumber')),
    });
    (__VLS_ctx.form.emergencyContact.phone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('family.alternatePhone'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "tel",
        placeholder: (__VLS_ctx.$t('family.alternatePhonePlaceholder')),
        title: (__VLS_ctx.$t('family.alternatePhone')),
    });
    (__VLS_ctx.form.emergencyContact.alternatePhone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "10",
        r: "3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('family.emergencyAddress'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.city'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.emergencyContactAddress.city),
        placeholder: (__VLS_ctx.$t('address.city')),
        title: (__VLS_ctx.$t('address.city')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.subcity'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.emergencyContactAddress.subcity),
        placeholder: (__VLS_ctx.$t('address.subcity')),
        title: (__VLS_ctx.$t('address.subcity')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.district'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.emergencyContactAddress.district),
        placeholder: (__VLS_ctx.$t('address.district')),
        title: (__VLS_ctx.$t('address.district')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('address.kebele'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.emergencyContactAddress.kebele),
        placeholder: (__VLS_ctx.$t('address.kebele')),
        title: (__VLS_ctx.$t('address.kebele')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M22 10v6M2 10l10-5 10-5-10 5z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M6 12v5c3 3 9 3 12 0v-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('education.title'));
    (__VLS_ctx.form.education.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "education-list-edit" },
    });
    /** @type {__VLS_StyleScopedClasses['education-list-edit']} */ ;
    for (const [edu, idx] of __VLS_vFor((__VLS_ctx.form.education))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "education-edit-item" },
        });
        /** @type {__VLS_StyleScopedClasses['education-edit-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-header" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('education.education'));
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeEducation(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, employee, employee, employee, employee, employee, cancelEdit, saveEmployee, saving, saving, triggerProfileInput, handleImageError, profilePreview, getAvatarUrl, handleProfileUpload, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, getPositionName, getDepartmentName, getDepartmentName, getEmploymentTypeLabel, triggerNationalIdUpload, nationalIdFile, nationalIdFile, nationalIdFile, getDocumentUrl, getDocumentUrl, handleNationalIdSelect, removeEducation,];
                } },
            ...{ class: "remove-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        (__VLS_ctx.$t('common.remove'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-fields" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-fields']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (edu.level),
            title: (__VLS_ctx.$t('education.level')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        (__VLS_ctx.$t('common.select'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "primary",
        });
        (__VLS_ctx.$t('education.primary'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "secondary",
        });
        (__VLS_ctx.$t('education.secondary'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "diploma",
        });
        (__VLS_ctx.$t('education.diploma'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "bachelor",
        });
        (__VLS_ctx.$t('education.bachelor'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "master",
        });
        (__VLS_ctx.$t('education.master'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "phd",
        });
        (__VLS_ctx.$t('education.phd'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "certificate",
        });
        (__VLS_ctx.$t('education.certificate'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (edu.institutionName),
            placeholder: (__VLS_ctx.$t('education.institutionPlaceholder')),
            title: (__VLS_ctx.$t('education.institutionName')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (edu.institutionAddress),
            placeholder: (__VLS_ctx.$t('education.institutionAddress')),
            title: (__VLS_ctx.$t('education.institutionAddress')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-group" },
        });
        /** @type {__VLS_StyleScopedClasses['date-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (edu.startDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('education.startDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (edu.endDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('education.endDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (edu.isCurrent);
        (__VLS_ctx.$t('education.currentlyStudying'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerEducationUpload(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, triggerEducationUpload,];
                } },
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('upload.title')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.$t('common.upload'));
        // @ts-ignore
        [$t, $t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addEducation) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('education.education'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('training.title'));
    (__VLS_ctx.form.training.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "training-list-edit" },
    });
    /** @type {__VLS_StyleScopedClasses['training-list-edit']} */ ;
    for (const [train, idx] of __VLS_vFor((__VLS_ctx.form.training))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "training-edit-item" },
        });
        /** @type {__VLS_StyleScopedClasses['training-edit-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-header" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('training.training'));
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeTraining(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, form, form, addEducation, removeTraining,];
                } },
            ...{ class: "remove-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        (__VLS_ctx.$t('common.remove'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-fields" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-fields']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (train.trainingName),
            placeholder: (__VLS_ctx.$t('training.trainingNamePlaceholder')),
            title: (__VLS_ctx.$t('training.trainingName')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (train.institutionName),
            placeholder: (__VLS_ctx.$t('training.institutionPlaceholder')),
            title: (__VLS_ctx.$t('training.institution')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (train.institutionAddress),
            placeholder: (__VLS_ctx.$t('training.institutionAddress')),
            title: (__VLS_ctx.$t('training.institutionAddress')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-group" },
        });
        /** @type {__VLS_StyleScopedClasses['date-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (train.startDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('training.startDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (train.endDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('training.endDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerTrainingUpload(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, triggerTrainingUpload,];
                } },
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('upload.title')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.$t('common.upload'));
        // @ts-ignore
        [$t, $t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addTraining) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('training.training'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card bank-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['bank-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('bank.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('bank.bankName'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.bankAccount.bankName),
        title: (__VLS_ctx.$t('bank.bankName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('common.selectBank'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Commercial Bank of Ethiopia",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Awash Bank",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Dashen Bank",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "United Bank",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Nib International Bank",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Hibret Bank",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Wegagen Bank",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('bank.accountNumber'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.bankAccount.accountNumber),
        placeholder: (__VLS_ctx.$t('bank.accountNumber')),
        title: (__VLS_ctx.$t('bank.accountNumber')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('bank.accountHolderName'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.bankAccount.accountHolderName),
        placeholder: (__VLS_ctx.$t('bank.accountHolderPlaceholder')),
        title: (__VLS_ctx.$t('bank.accountHolderName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('bank.branch'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.bankAccount.branch),
        placeholder: (__VLS_ctx.$t('bank.branchPlaceholder')),
        title: (__VLS_ctx.$t('bank.branch')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M3 21h18M3 10h18M5 6h14M8 3l-2 3h12l-2-3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('nationality.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('nationality.type'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.nationalityAcquisition.type),
        title: (__VLS_ctx.$t('nationality.type')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "by_birth",
    });
    (__VLS_ctx.$t('nationality.byBirth'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "by_law",
    });
    (__VLS_ctx.$t('nationality.byLaw'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "ethiopian_birth",
    });
    (__VLS_ctx.$t('nationality.ethiopianBirth'));
    if (__VLS_ctx.form.nationalityAcquisition.type === 'by_law') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t('nationality.naturalizationCert'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.triggerNaturalizationUpload) },
            type: "button",
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('upload.title')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.nationalityDocFile ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload'));
        if (__VLS_ctx.getDocumentUrl('naturalization_certificate')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                href: (__VLS_ctx.getDocumentUrl('naturalization_certificate')),
                target: "_blank",
                ...{ class: "file-link-inline" },
            });
            /** @type {__VLS_StyleScopedClasses['file-link-inline']} */ ;
            (__VLS_ctx.$t('common.view'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.handleNaturalizationSelect) },
            type: "file",
            ref: "naturalizationInput",
            accept: ".pdf,.jpg,.jpeg,.png",
            ...{ style: {} },
        });
        if (__VLS_ctx.nationalityDocFile) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
                ...{ class: "field-hint success" },
            });
            /** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['success']} */ ;
            (__VLS_ctx.$t('employee.fileSelected'));
            (__VLS_ctx.nationalityDocFile.name);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('healthLegal.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-legal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['health-legal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "health-section" },
    });
    /** @type {__VLS_StyleScopedClasses['health-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.$t('healthLegal.healthTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.form.healthInfo.hasPhysicalInjury);
    (__VLS_ctx.$t('healthLegal.hasInjury'));
    if (__VLS_ctx.form.healthInfo.hasPhysicalInjury) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (__VLS_ctx.form.healthInfo.injuryDescription),
            placeholder: (__VLS_ctx.$t('healthLegal.injuryPlaceholder')),
            rows: "2",
            title: (__VLS_ctx.$t('healthLegal.injuryDescription')),
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legal-section" },
    });
    /** @type {__VLS_StyleScopedClasses['legal-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.$t('healthLegal.legalTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.form.legalInfo.hasCriminalRecord);
    (__VLS_ctx.$t('healthLegal.hasCriminalRecord'));
    if (__VLS_ctx.form.legalInfo.hasCriminalRecord) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (__VLS_ctx.form.legalInfo.criminalRecordDescription),
            placeholder: (__VLS_ctx.$t('healthLegal.criminalPlaceholder')),
            rows: "2",
            title: (__VLS_ctx.$t('healthLegal.criminalDescription')),
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M5 8h10M9 4v4M11 12h8M15 8v4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M2 2h20v20H2z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('skills.languageTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "skills-list" },
    });
    /** @type {__VLS_StyleScopedClasses['skills-list']} */ ;
    for (const [lang, idx] of __VLS_vFor((__VLS_ctx.form.languageSkills))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "skill-tag" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['skill-tag']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (lang.language),
            ...{ style: {} },
            title: (__VLS_ctx.$t('skills.selectLanguage')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        (__VLS_ctx.$t('skills.selectLanguage'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
            label: (__VLS_ctx.$t('skills.ethiopianLanguages')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Amharic",
        });
        (__VLS_ctx.$t('skills.amharic'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Oromo",
        });
        (__VLS_ctx.$t('skills.oromo'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Tigrinya",
        });
        (__VLS_ctx.$t('skills.tigrinya'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Somali",
        });
        (__VLS_ctx.$t('skills.somali'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Sidamo",
        });
        (__VLS_ctx.$t('skills.sidamo'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Wolaytta",
        });
        (__VLS_ctx.$t('skills.wolaytta'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Afar",
        });
        (__VLS_ctx.$t('skills.afar'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Hadiyya",
        });
        (__VLS_ctx.$t('skills.hadiyya'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Gamo",
        });
        (__VLS_ctx.$t('skills.gamo'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Gurage",
        });
        (__VLS_ctx.$t('skills.gurage'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Kembata",
        });
        (__VLS_ctx.$t('skills.kembata'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Silt'e",
        });
        (__VLS_ctx.$t('skills.silte'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
            label: (__VLS_ctx.$t('skills.africanLanguages')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Swahili",
        });
        (__VLS_ctx.$t('skills.swahili'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Hausa",
        });
        (__VLS_ctx.$t('skills.hausa'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Yoruba",
        });
        (__VLS_ctx.$t('skills.yoruba'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Zulu",
        });
        (__VLS_ctx.$t('skills.zulu'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
            label: (__VLS_ctx.$t('skills.europeanLanguages')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "English",
        });
        (__VLS_ctx.$t('skills.english'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "French",
        });
        (__VLS_ctx.$t('skills.french'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Spanish",
        });
        (__VLS_ctx.$t('skills.spanish'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "German",
        });
        (__VLS_ctx.$t('skills.german'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Italian",
        });
        (__VLS_ctx.$t('skills.italian'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Russian",
        });
        (__VLS_ctx.$t('skills.russian'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.optgroup, __VLS_intrinsics.optgroup)({
            label: (__VLS_ctx.$t('skills.asianLanguages')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Chinese",
        });
        (__VLS_ctx.$t('skills.chinese'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Japanese",
        });
        (__VLS_ctx.$t('skills.japanese'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Korean",
        });
        (__VLS_ctx.$t('skills.korean'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Arabic",
        });
        (__VLS_ctx.$t('skills.arabic'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "Hindi",
        });
        (__VLS_ctx.$t('skills.hindi'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (lang.proficiency),
            ...{ style: {} },
            title: (__VLS_ctx.$t('skills.selectLevel')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        (__VLS_ctx.$t('skills.selectLevel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "basic",
        });
        (__VLS_ctx.$t('skills.basic'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "intermediate",
        });
        (__VLS_ctx.$t('skills.intermediate'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "advanced",
        });
        (__VLS_ctx.$t('skills.advanced'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "fluent",
        });
        (__VLS_ctx.$t('skills.fluent'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "native",
        });
        (__VLS_ctx.$t('skills.native'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeLanguage(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, form, form, form, form, form, form, form, form, form, form, form, form, form, getDocumentUrl, getDocumentUrl, addTraining, triggerNaturalizationUpload, nationalityDocFile, nationalityDocFile, nationalityDocFile, handleNaturalizationSelect, removeLanguage,];
                } },
            ...{ class: "remove-small-btn" },
            title: (__VLS_ctx.$t('common.remove')),
        });
        /** @type {__VLS_StyleScopedClasses['remove-small-btn']} */ ;
        // @ts-ignore
        [$t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addLanguage) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('skills.languageTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "other-skills" },
    });
    /** @type {__VLS_StyleScopedClasses['other-skills']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('skills.otherTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.form.otherSkills),
        placeholder: (__VLS_ctx.$t('skills.otherPlaceholder')),
        rows: "3",
        title: (__VLS_ctx.$t('skills.otherTitle')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "right-column" },
    });
    /** @type {__VLS_StyleScopedClasses['right-column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('employee.employmentInfo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.department'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.departmentId),
        title: (__VLS_ctx.$t('employee.department')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    (__VLS_ctx.$t('common.select'));
    for (const [dept] of __VLS_vFor((__VLS_ctx.departments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (dept.departmentId),
            value: (dept.departmentId),
        });
        (dept.name);
        // @ts-ignore
        [$t, $t, $t, $t, $t, $t, $t, $t, $t, form, form, addLanguage, departments,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.position'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.positionId),
        title: (__VLS_ctx.$t('employee.position')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    (__VLS_ctx.$t('common.select'));
    for (const [pos] of __VLS_vFor((__VLS_ctx.positions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (pos.positionId),
            value: (pos.positionId),
        });
        (pos.title);
        // @ts-ignore
        [$t, $t, $t, form, positions,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.employmentType'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.employmentType),
        title: (__VLS_ctx.$t('employee.employmentType')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "full-time",
    });
    (__VLS_ctx.$t('employee.fullTime'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "part-time",
    });
    (__VLS_ctx.$t('employee.partTime'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "contract",
    });
    (__VLS_ctx.$t('employee.contract'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "intern",
    });
    (__VLS_ctx.$t('employee.intern'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.hireDate'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.hireDateEC),
        placeholder: "DD/MM/YYYY",
        ...{ class: "ec-date-input" },
        title: (__VLS_ctx.$t('employee.hireDate')),
    });
    /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "ec-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['ec-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.manager'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.managerId),
        title: (__VLS_ctx.$t('employee.manager')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    (__VLS_ctx.$t('common.select'));
    for (const [mgr] of __VLS_vFor((__VLS_ctx.managers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (mgr.id),
            value: (mgr.id),
        });
        (mgr.fullName);
        (mgr.employeeId);
        // @ts-ignore
        [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, form, form, form, managers,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.workLocation'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.workLocation),
        placeholder: (__VLS_ctx.$t('employee.workLocationPlaceholder')),
        title: (__VLS_ctx.$t('employee.workLocation')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t('employee.shiftType'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.shiftType),
        title: (__VLS_ctx.$t('employee.shiftType')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "day",
    });
    (__VLS_ctx.$t('employee.dayShift'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "night",
    });
    (__VLS_ctx.$t('employee.nightShift'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card allowances-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['allowances-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 6v6l4 2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('employee.compensationAllowances'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowances-content" },
    });
    /** @type {__VLS_StyleScopedClasses['allowances-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item basic" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['basic']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.basicSalary'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "100",
        placeholder: (__VLS_ctx.$t('employee.basicSalary')),
        title: (__VLS_ctx.$t('employee.basicSalary')),
    });
    (__VLS_ctx.form.basicSalary);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.housingAllowance'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "100",
        placeholder: (__VLS_ctx.$t('employee.housingAllowance')),
        title: (__VLS_ctx.$t('employee.housingAllowance')),
    });
    (__VLS_ctx.form.housingAllowance);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.positionAllowance'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "100",
        placeholder: (__VLS_ctx.$t('employee.positionAllowance')),
        title: (__VLS_ctx.$t('employee.positionAllowance')),
    });
    (__VLS_ctx.form.positionAllowance);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.transportAllowance'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "100",
        placeholder: (__VLS_ctx.$t('employee.transportAllowance')),
        title: (__VLS_ctx.$t('employee.transportAllowance')),
    });
    (__VLS_ctx.form.transportAllowance);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.mobileAllowance'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "100",
        placeholder: (__VLS_ctx.$t('employee.mobileAllowance')),
        title: (__VLS_ctx.$t('employee.mobileAllowance')),
    });
    (__VLS_ctx.form.mobileAllowance);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item total" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['total']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.totalAllowances'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.totalAllowances));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item gross" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['gross']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t('employee.grossPay'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value gross-amount" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['gross-amount']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.grossPay));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('family.spouseTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-layout" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-layout']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.triggerSpouseProfileInput) },
        ...{ class: "spouse-avatar" },
        title: (__VLS_ctx.$t('family.profilePicture')),
    });
    /** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
    if (__VLS_ctx.spouseProfilePreview || __VLS_ctx.getDocumentWithIndex('spouse_profile', 0)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            ...{ onError: ((e) => { e.target.src = __VLS_ctx.getAvatarUrl(__VLS_ctx.form.spouseInfo.fullName || 'Spouse'); }) },
            src: (__VLS_ctx.spouseProfilePreview || __VLS_ctx.getDocumentWithIndex('spouse_profile', 0)),
            alt: (__VLS_ctx.form.spouseInfo.fullName),
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-avatar-placeholder" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-avatar-placeholder']} */ ;
        (__VLS_ctx.form.spouseInfo.fullName?.charAt(0) || "S");
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "avatar-upload-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['avatar-upload-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleSpouseProfileUpload) },
        type: "file",
        ref: "spouseProfileInput",
        ...{ style: {} },
        accept: "image/*",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-info" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-name" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-name']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.spouseInfo.fullName),
        placeholder: (__VLS_ctx.$t('family.spouseNamePlaceholder')),
        title: (__VLS_ctx.$t('family.spouseFullName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('family.tinNumber'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.spouseInfo.tinNumber),
        placeholder: (__VLS_ctx.$t('family.tinPlaceholder')),
        title: (__VLS_ctx.$t('family.tinNumber')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('family.dateOfBirth'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.spouseInfo.dateOfBirthEC),
        placeholder: "DD/MM/YYYY",
        ...{ class: "ec-date-input" },
        title: (__VLS_ctx.$t('family.dateOfBirth')),
    });
    /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('family.jobStatus'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.spouseInfo.jobStatus),
        title: (__VLS_ctx.$t('family.jobStatus')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('common.select'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "government",
    });
    (__VLS_ctx.$t('family.government'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "private",
    });
    (__VLS_ctx.$t('family.private'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "self-employed",
    });
    (__VLS_ctx.$t('family.business'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "unemployed",
    });
    (__VLS_ctx.$t('family.unemployed'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('family.companyName'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.spouseInfo.companyName),
        placeholder: (__VLS_ctx.$t('family.companyName')),
        title: (__VLS_ctx.$t('family.companyName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('family.companyAddress'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.spouseInfo.companyAddress),
        placeholder: (__VLS_ctx.$t('family.companyAddress')),
        title: (__VLS_ctx.$t('family.companyAddress')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spouse-document" },
    });
    /** @type {__VLS_StyleScopedClasses['spouse-document']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.triggerMarriageCertUpload) },
        ...{ class: "upload-small-btn" },
        title: (__VLS_ctx.$t('common.upload')),
    });
    /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
    (__VLS_ctx.$t('family.marriageCertificate'));
    if (__VLS_ctx.getDocumentWithIndex('marriage_certificate', 0)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.getDocumentWithIndex('marriage_certificate', 0)),
            target: "_blank",
            ...{ class: "file-link-inline" },
        });
        /** @type {__VLS_StyleScopedClasses['file-link-inline']} */ ;
        (__VLS_ctx.$t('common.view'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleMarriageCertUpload) },
        type: "file",
        ref: "marriageCertInput",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('family.childrenTitle'));
    (__VLS_ctx.form.children.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "children-list-edit" },
    });
    /** @type {__VLS_StyleScopedClasses['children-list-edit']} */ ;
    for (const [child, idx] of __VLS_vFor((__VLS_ctx.form.children))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "child-edit-item" },
        });
        /** @type {__VLS_StyleScopedClasses['child-edit-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-header" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('family.child'));
        (idx + 1);
        (child.name || __VLS_ctx.$t('family.child'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeChild(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, getAvatarUrl, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, form, formatCurrency, formatCurrency, totalAllowances, grossPay, triggerSpouseProfileInput, spouseProfilePreview, spouseProfilePreview, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, handleSpouseProfileUpload, triggerMarriageCertUpload, handleMarriageCertUpload, removeChild,];
                } },
            ...{ class: "remove-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        (__VLS_ctx.$t('common.remove'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "child-edit-content" },
        });
        /** @type {__VLS_StyleScopedClasses['child-edit-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerChildProfileUpload(idx);
                    // @ts-ignore
                    [$t, triggerChildProfileUpload,];
                } },
            ...{ class: "child-avatar-edit" },
            title: (__VLS_ctx.$t('common.upload')),
        });
        /** @type {__VLS_StyleScopedClasses['child-avatar-edit']} */ ;
        if (__VLS_ctx.childProfilePreviews[idx] || __VLS_ctx.getDocumentWithIndex('child_profile', idx)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                ...{ onError: ((e) => { e.target.src = __VLS_ctx.getAvatarUrl(child.name || __VLS_ctx.$t('family.child')); }) },
                src: (__VLS_ctx.childProfilePreviews[idx] || __VLS_ctx.getDocumentWithIndex('child_profile', idx)),
                alt: (child.name || __VLS_ctx.$t('family.child')),
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-avatar-placeholder-edit" },
            });
            /** @type {__VLS_StyleScopedClasses['child-avatar-placeholder-edit']} */ ;
            (child.name?.charAt(0) || '👶');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "avatar-upload-overlay" },
        });
        /** @type {__VLS_StyleScopedClasses['avatar-upload-overlay']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "child-info-edit" },
        });
        /** @type {__VLS_StyleScopedClasses['child-info-edit']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "child-name-row" },
        });
        /** @type {__VLS_StyleScopedClasses['child-name-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (child.name),
            placeholder: (__VLS_ctx.$t('family.childNamePlaceholder')),
            ...{ class: "child-name-input" },
            title: (__VLS_ctx.$t('family.childFullName')),
        });
        /** @type {__VLS_StyleScopedClasses['child-name-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (child.dateOfBirthEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "child-dob-input ec-date-input" },
            title: (__VLS_ctx.$t('family.dateOfBirth')),
        });
        /** @type {__VLS_StyleScopedClasses['child-dob-input']} */ ;
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "checkbox-group" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (child.hasMedicalCondition);
        (__VLS_ctx.$t('family.hasMedicalCondition'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (child.isAdopted);
        (__VLS_ctx.$t('family.isAdopted'));
        if (child.hasMedicalCondition) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                value: (child.medicalConditionNotes),
                placeholder: (__VLS_ctx.$t('family.medicalNotesPlaceholder')),
                rows: "2",
                ...{ class: "child-notes" },
                title: (__VLS_ctx.$t('family.medicalConditionNotes')),
            });
            /** @type {__VLS_StyleScopedClasses['child-notes']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "child-documents-section" },
        });
        /** @type {__VLS_StyleScopedClasses['child-documents-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "documents-status" },
        });
        /** @type {__VLS_StyleScopedClasses['documents-status']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "doc-status-item" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-status-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-label" },
        });
        /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
        (__VLS_ctx.$t('family.birthCertificate'));
        if (__VLS_ctx.getDocumentWithIndex('child_birth_certificate', idx)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-uploaded" },
            });
            /** @type {__VLS_StyleScopedClasses['status-uploaded']} */ ;
            (__VLS_ctx.$t('common.uploaded'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-missing" },
            });
            /** @type {__VLS_StyleScopedClasses['status-missing']} */ ;
            (__VLS_ctx.$t('common.missing'));
        }
        if (child.hasMedicalCondition) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "doc-status-item" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-status-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-label" },
            });
            /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
            (__VLS_ctx.$t('family.medicalReport'));
            if (__VLS_ctx.getDocumentWithIndex('child_medical_report', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-uploaded" },
                });
                /** @type {__VLS_StyleScopedClasses['status-uploaded']} */ ;
                (__VLS_ctx.$t('common.uploaded'));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-missing" },
                });
                /** @type {__VLS_StyleScopedClasses['status-missing']} */ ;
                (__VLS_ctx.$t('common.missing'));
            }
        }
        if (child.isAdopted) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "doc-status-item" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-status-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-label" },
            });
            /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
            (__VLS_ctx.$t('family.adoptionCertificate'));
            if (__VLS_ctx.getDocumentWithIndex('child_adoption_certificate', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-uploaded" },
                });
                /** @type {__VLS_StyleScopedClasses['status-uploaded']} */ ;
                (__VLS_ctx.$t('common.uploaded'));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-missing" },
                });
                /** @type {__VLS_StyleScopedClasses['status-missing']} */ ;
                (__VLS_ctx.$t('common.missing'));
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "child-documents-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['child-documents-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerChildDocUpload(idx, 'birth');
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, getAvatarUrl, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, childProfilePreviews, childProfilePreviews, triggerChildDocUpload,];
                } },
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('common.upload')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.getDocumentWithIndex('child_birth_certificate', idx) ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload'));
        (__VLS_ctx.$t('family.birthCertificate'));
        if (child.hasMedicalCondition) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.employee))
                            return;
                        if (!(child.hasMedicalCondition))
                            return;
                        __VLS_ctx.triggerChildDocUpload(idx, 'medical');
                        // @ts-ignore
                        [$t, $t, $t, $t, getDocumentWithIndex, triggerChildDocUpload,];
                    } },
                ...{ class: "upload-small-btn" },
                title: (__VLS_ctx.$t('common.upload')),
            });
            /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
            (__VLS_ctx.getDocumentWithIndex('child_medical_report', idx) ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload'));
            (__VLS_ctx.$t('family.medicalReport'));
        }
        if (child.isAdopted) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.employee))
                            return;
                        if (!(child.isAdopted))
                            return;
                        __VLS_ctx.triggerChildDocUpload(idx, 'adoption');
                        // @ts-ignore
                        [$t, $t, $t, $t, getDocumentWithIndex, triggerChildDocUpload,];
                    } },
                ...{ class: "upload-small-btn" },
                title: (__VLS_ctx.$t('common.upload')),
            });
            /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
            (__VLS_ctx.getDocumentWithIndex('child_adoption_certificate', idx) ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload'));
            (__VLS_ctx.$t('family.adoptionCertificate'));
        }
        if (__VLS_ctx.getDocumentWithIndex('child_birth_certificate', idx) || __VLS_ctx.getDocumentWithIndex('child_medical_report', idx) || __VLS_ctx.getDocumentWithIndex('child_adoption_certificate', idx) || __VLS_ctx.getDocumentWithIndex('child_profile', idx)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "view-documents" },
            });
            /** @type {__VLS_StyleScopedClasses['view-documents']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "view-label" },
            });
            /** @type {__VLS_StyleScopedClasses['view-label']} */ ;
            (__VLS_ctx.$t('common.view'));
            if (__VLS_ctx.getDocumentWithIndex('child_birth_certificate', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    href: (__VLS_ctx.getDocumentWithIndex('child_birth_certificate', idx)),
                    target: "_blank",
                    ...{ class: "file-link" },
                });
                /** @type {__VLS_StyleScopedClasses['file-link']} */ ;
                (__VLS_ctx.$t('common.viewBirthCertificate'));
            }
            if (__VLS_ctx.getDocumentWithIndex('child_medical_report', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    href: (__VLS_ctx.getDocumentWithIndex('child_medical_report', idx)),
                    target: "_blank",
                    ...{ class: "file-link" },
                });
                /** @type {__VLS_StyleScopedClasses['file-link']} */ ;
                (__VLS_ctx.$t('common.viewMedicalReport'));
            }
            if (__VLS_ctx.getDocumentWithIndex('child_adoption_certificate', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    href: (__VLS_ctx.getDocumentWithIndex('child_adoption_certificate', idx)),
                    target: "_blank",
                    ...{ class: "file-link" },
                });
                /** @type {__VLS_StyleScopedClasses['file-link']} */ ;
                (__VLS_ctx.$t('common.viewAdoptionCertificate'));
            }
            if (__VLS_ctx.getDocumentWithIndex('child_profile', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    href: (__VLS_ctx.getDocumentWithIndex('child_profile', idx)),
                    target: "_blank",
                    ...{ class: "file-link" },
                });
                /** @type {__VLS_StyleScopedClasses['file-link']} */ ;
                (__VLS_ctx.$t('family.profilePicture'));
            }
        }
        // @ts-ignore
        [$t, $t, $t, $t, $t, $t, $t, $t, $t, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addChild) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('family.child'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('family.parentsTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "parents-edit-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['parents-edit-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "parent-edit-section" },
    });
    /** @type {__VLS_StyleScopedClasses['parent-edit-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.$t('family.fatherInfo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.parentsInfo.father.fullName),
        placeholder: (__VLS_ctx.$t('family.fatherNamePlaceholder')),
        title: (__VLS_ctx.$t('family.fatherName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.parentsInfo.father.job),
        placeholder: (__VLS_ctx.$t('family.jobPlaceholder')),
        title: (__VLS_ctx.$t('family.jobOccupation')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        placeholder: (__VLS_ctx.$t('family.monthlyIncome')),
        title: (__VLS_ctx.$t('family.monthlyIncome')),
    });
    (__VLS_ctx.form.parentsInfo.father.monthlyIncome);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "parent-edit-section" },
    });
    /** @type {__VLS_StyleScopedClasses['parent-edit-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    (__VLS_ctx.$t('family.motherInfo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.parentsInfo.mother.fullName),
        placeholder: (__VLS_ctx.$t('family.motherNamePlaceholder')),
        title: (__VLS_ctx.$t('family.motherName')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.parentsInfo.mother.job),
        placeholder: (__VLS_ctx.$t('family.jobPlaceholder')),
        title: (__VLS_ctx.$t('family.jobOccupation')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        placeholder: (__VLS_ctx.$t('family.monthlyIncome')),
        title: (__VLS_ctx.$t('family.monthlyIncome')),
    });
    (__VLS_ctx.form.parentsInfo.mother.monthlyIncome);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "support-section" },
    });
    /** @type {__VLS_StyleScopedClasses['support-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "support-title" },
    });
    /** @type {__VLS_StyleScopedClasses['support-title']} */ ;
    (__VLS_ctx.$t('family.supportTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.parentsInfo.financialSupport),
        placeholder: (__VLS_ctx.$t('family.financialPlaceholder')),
        ...{ style: {} },
        title: (__VLS_ctx.$t('family.financialSupport')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.form.parentsInfo.otherSupport),
        placeholder: (__VLS_ctx.$t('family.otherPlaceholder')),
        ...{ style: {} },
        title: (__VLS_ctx.$t('family.otherSupport')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('employee.workExperience'));
    (__VLS_ctx.form.workExperience.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "work-list-edit" },
    });
    /** @type {__VLS_StyleScopedClasses['work-list-edit']} */ ;
    for (const [work, idx] of __VLS_vFor((__VLS_ctx.form.workExperience))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "work-edit-item" },
        });
        /** @type {__VLS_StyleScopedClasses['work-edit-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-header" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('employee.experience'));
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeWork(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, form, form, form, form, form, form, form, form, form, form, addChild, removeWork,];
                } },
            ...{ class: "remove-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        (__VLS_ctx.$t('common.remove'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-fields" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-fields']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (work.position),
            placeholder: (__VLS_ctx.$t('employee.positionPlaceholder')),
            title: (__VLS_ctx.$t('employee.positionTitle')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (work.companyName),
            placeholder: (__VLS_ctx.$t('employee.companyNamePlaceholder')),
            title: (__VLS_ctx.$t('employee.companyName')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (work.companyAddress),
            placeholder: (__VLS_ctx.$t('employee.companyAddressPlaceholder')),
            title: (__VLS_ctx.$t('company.address')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "date-group" },
        });
        /** @type {__VLS_StyleScopedClasses['date-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (work.startDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('employee.startDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (work.endDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('employee.endDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "salary-group" },
        });
        /** @type {__VLS_StyleScopedClasses['salary-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            placeholder: (__VLS_ctx.$t('employee.monthlySalary')),
            title: (__VLS_ctx.$t('employee.monthlySalary')),
        });
        (work.monthlySalary);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            placeholder: (__VLS_ctx.$t('employee.salaryWhenLeft')),
            title: (__VLS_ctx.$t('employee.salaryWhenLeft')),
        });
        (work.salaryWhenLeft);
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (work.terminationReason),
            placeholder: (__VLS_ctx.$t('employee.terminationPlaceholder')),
            rows: "2",
            title: (__VLS_ctx.$t('employee.reasonForLeaving')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "provident-group" },
        });
        /** @type {__VLS_StyleScopedClasses['provident-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
            'true-value': "yes",
            'false-value': "no",
        });
        (work.providentFundSubmitted);
        (__VLS_ctx.$t('employee.providentFundSubmitted'));
        if (work.providentFundSubmitted === 'yes') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "text",
                value: (work.providentFundStartDateEC),
                placeholder: "DD/MM/YYYY",
                ...{ class: "ec-date-input" },
                title: (__VLS_ctx.$t('employee.providentFundStartDate')),
            });
            /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerWorkUpload(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, triggerWorkUpload,];
                } },
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('common.upload')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.$t('employee.experienceLetter'));
        // @ts-ignore
        [$t, $t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addWork) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('employee.experience'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2L2 7l10 5 10-5-10-5z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M2 17l10 5 10-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M2 12l10 5 10-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('guarantee.title'));
    (__VLS_ctx.form.guaranteeInfo.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "guarantee-list-edit" },
    });
    /** @type {__VLS_StyleScopedClasses['guarantee-list-edit']} */ ;
    for (const [guarantor, idx] of __VLS_vFor((__VLS_ctx.form.guaranteeInfo))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "guarantor-edit-item" },
        });
        /** @type {__VLS_StyleScopedClasses['guarantor-edit-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-header" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('guarantee.guarantor'));
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeGuarantor(idx);
                    // @ts-ignore
                    [$t, $t, $t, $t, form, form, addWork, removeGuarantor,];
                } },
            ...{ class: "remove-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        (__VLS_ctx.$t('common.remove'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-fields" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-fields']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row-two" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.guarantorName),
            placeholder: (__VLS_ctx.$t('guarantee.guarantorNamePlaceholder')),
            title: (__VLS_ctx.$t('guarantee.guarantorName')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.guarantorJob),
            placeholder: (__VLS_ctx.$t('guarantee.jobPlaceholder')),
            title: (__VLS_ctx.$t('guarantee.guarantorJob')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row-two" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.guarantorOfficeName),
            placeholder: (__VLS_ctx.$t('guarantee.officeNamePlaceholder')),
            title: (__VLS_ctx.$t('guarantee.guarantorOfficeName')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.guarantorOfficeAddress),
            placeholder: (__VLS_ctx.$t('guarantee.addressPlaceholder')),
            title: (__VLS_ctx.$t('guarantee.guarantorOfficeAddress')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row-two" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.guaranteeLetterDateEC),
            placeholder: "Guarantee Letter Date (DD/MM/YYYY)",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('guarantee.letterDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.sdtLetterDateEC),
            placeholder: "SDT Letter Date (DD/MM/YYYY)",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('guarantee.sdtLetterDate')),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row-two" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row-two']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('guarantee.confirmationDate') || 'Confirmation Date');
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (guarantor.confirmedDateEC),
            placeholder: "DD/MM/YYYY",
            ...{ class: "ec-date-input" },
            title: (__VLS_ctx.$t('guarantee.confirmationDate') || 'Confirmation Date'),
        });
        /** @type {__VLS_StyleScopedClasses['ec-date-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "ec-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['ec-hint']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "edit-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerGuaranteeUpload(idx, 'guarantee');
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, triggerGuaranteeUpload,];
                } },
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('common.upload')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.$t('guarantee.guaranteeLetter'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerGuaranteeUpload(idx, 'sdt');
                    // @ts-ignore
                    [$t, $t, triggerGuaranteeUpload,];
                } },
            ...{ class: "upload-small-btn" },
            title: (__VLS_ctx.$t('common.upload')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-small-btn']} */ ;
        (__VLS_ctx.$t('guarantee.sdtLetter'));
        // @ts-ignore
        [$t, $t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addGuarantor) },
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('guarantee.guarantor'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card scanned-documents-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['scanned-documents-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M4 4h16v16H4V4z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M8 4v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 4v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M4 8h16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M4 16h16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 4v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('documents.scannedDocs') || 'Scanned Documents');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-count-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-count-badge']} */ ;
    (__VLS_ctx.scannedDocumentCount);
    (__VLS_ctx.$t('documents.files') || 'files');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "scanned-documents-content" },
    });
    /** @type {__VLS_StyleScopedClasses['scanned-documents-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "section-description" },
    });
    /** @type {__VLS_StyleScopedClasses['section-description']} */ ;
    (__VLS_ctx.$t('documents.scannedDocsHint') || 'Upload additional documents such as guarantee letters, employment letters, certificates, and other official documents.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "documents-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['documents-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "document-upload-item" },
        ...{ class: ({ 'has-file': __VLS_ctx.scannedDocs.guaranteeLetter }) },
    });
    /** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-file']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-info" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-label" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-label']} */ ;
    (__VLS_ctx.$t('guarantee.guaranteeLetter') || 'Guarantee Letter');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-status" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
    (__VLS_ctx.scannedDocs.guaranteeLetter ? __VLS_ctx.$t('common.uploaded') : __VLS_ctx.$t('common.missing'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.employee))
                    return;
                __VLS_ctx.triggerScannedDocUpload('guaranteeLetter');
                // @ts-ignore
                [$t, $t, $t, $t, $t, $t, $t, $t, addGuarantor, scannedDocumentCount, scannedDocs, scannedDocs, triggerScannedDocUpload,];
            } },
        type: "button",
        ...{ class: "upload-btn" },
        title: (__VLS_ctx.scannedDocs.guaranteeLetter ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
    });
    /** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "17 8 12 3 7 8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "3",
        x2: "12",
        y2: "15",
    });
    if (__VLS_ctx.getDocumentUrl('guarantee_letter') || __VLS_ctx.scannedDocs.guaranteeLetterUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.getDocumentUrl('guarantee_letter') || __VLS_ctx.scannedDocs.guaranteeLetterUrl),
            target: "_blank",
            ...{ class: "view-link" },
        });
        /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    }
    if (__VLS_ctx.scannedDocs.guaranteeLetter) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (__VLS_ctx.scannedDocs.guaranteeLetter.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.employee))
                    return;
                __VLS_ctx.handleScannedDocUpload($event, 'guaranteeLetter');
                // @ts-ignore
                [$t, $t, getDocumentUrl, getDocumentUrl, scannedDocs, scannedDocs, scannedDocs, scannedDocs, scannedDocs, handleScannedDocUpload,];
            } },
        type: "file",
        ref: "guaranteeLetterInput",
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "document-upload-item" },
        ...{ class: ({ 'has-file': __VLS_ctx.scannedDocs.employmentLetter }) },
    });
    /** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-file']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-info" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-label" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-label']} */ ;
    (__VLS_ctx.$t('documents.employmentLetter') || 'Employment Letter');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-status" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
    (__VLS_ctx.scannedDocs.employmentLetter ? __VLS_ctx.$t('common.uploaded') : __VLS_ctx.$t('common.missing'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.employee))
                    return;
                __VLS_ctx.triggerScannedDocUpload('employmentLetter');
                // @ts-ignore
                [$t, $t, $t, scannedDocs, scannedDocs, triggerScannedDocUpload,];
            } },
        type: "button",
        ...{ class: "upload-btn" },
        title: (__VLS_ctx.scannedDocs.employmentLetter ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
    });
    /** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "17 8 12 3 7 8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "3",
        x2: "12",
        y2: "15",
    });
    if (__VLS_ctx.getDocumentUrl('employment_letter') || __VLS_ctx.scannedDocs.employmentLetterUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.getDocumentUrl('employment_letter') || __VLS_ctx.scannedDocs.employmentLetterUrl),
            target: "_blank",
            ...{ class: "view-link" },
        });
        /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    }
    if (__VLS_ctx.scannedDocs.employmentLetter) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (__VLS_ctx.scannedDocs.employmentLetter.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.employee))
                    return;
                __VLS_ctx.handleScannedDocUpload($event, 'employmentLetter');
                // @ts-ignore
                [$t, $t, getDocumentUrl, getDocumentUrl, scannedDocs, scannedDocs, scannedDocs, scannedDocs, scannedDocs, handleScannedDocUpload,];
            } },
        type: "file",
        ref: "employmentLetterInput",
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "document-upload-item" },
        ...{ class: ({ 'has-file': __VLS_ctx.scannedDocs.other }) },
    });
    /** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['has-file']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-info" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-label-group" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-label-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        value: (__VLS_ctx.scannedDocs.otherName),
        placeholder: (__VLS_ctx.$t('documents.otherDocumentName') || 'Other document name...'),
        ...{ class: "doc-name-input" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "doc-status" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
    (__VLS_ctx.scannedDocs.other ? __VLS_ctx.$t('common.uploaded') : __VLS_ctx.$t('common.missing'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "doc-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.employee))
                    return;
                __VLS_ctx.triggerScannedDocUpload('other');
                // @ts-ignore
                [$t, $t, $t, scannedDocs, scannedDocs, scannedDocs, triggerScannedDocUpload,];
            } },
        type: "button",
        ...{ class: "upload-btn" },
        title: (__VLS_ctx.scannedDocs.other ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
    });
    /** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "17 8 12 3 7 8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "3",
        x2: "12",
        y2: "15",
    });
    if (__VLS_ctx.scannedDocs.other || __VLS_ctx.scannedDocs.otherName) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    if (!(__VLS_ctx.scannedDocs.other || __VLS_ctx.scannedDocs.otherName))
                        return;
                    __VLS_ctx.clearScannedDoc('other');
                    // @ts-ignore
                    [$t, $t, scannedDocs, scannedDocs, scannedDocs, clearScannedDoc,];
                } },
            type: "button",
            ...{ class: "remove-btn" },
            title: (__VLS_ctx.$t('common.remove')),
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
    }
    if (__VLS_ctx.getDocumentUrl('other_document') || __VLS_ctx.scannedDocs.otherUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.getDocumentUrl('other_document') || __VLS_ctx.scannedDocs.otherUrl),
            target: "_blank",
            ...{ class: "view-link" },
        });
        /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
    }
    if (__VLS_ctx.scannedDocs.other) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "file-name" },
        });
        /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
        (__VLS_ctx.scannedDocs.other.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.employee))
                    return;
                __VLS_ctx.handleScannedDocUpload($event, 'other');
                // @ts-ignore
                [$t, getDocumentUrl, getDocumentUrl, scannedDocs, scannedDocs, scannedDocs, scannedDocs, handleScannedDocUpload,];
            } },
        type: "file",
        ref: "otherInput",
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addScannedCustomDocument) },
        type: "button",
        ...{ class: "add-doc-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-doc-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "5",
        x2: "12",
        y2: "19",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "5",
        y1: "12",
        x2: "19",
        y2: "12",
    });
    (__VLS_ctx.$t('common.add'));
    (__VLS_ctx.$t('documents.customDocument') || 'Custom Document');
    for (const [doc, index] of __VLS_vFor((__VLS_ctx.scannedDocs.custom))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (`custom-${index}`),
            ...{ class: "document-upload-item custom-doc" },
            ...{ class: ({ 'has-file': doc.file }) },
        });
        /** @type {__VLS_StyleScopedClasses['document-upload-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['custom-doc']} */ ;
        /** @type {__VLS_StyleScopedClasses['has-file']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "doc-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "doc-info" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "text",
            value: (doc.name),
            placeholder: (__VLS_ctx.$t('documents.documentName') || 'Document name...'),
            ...{ class: "doc-name-input" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-name-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "doc-status" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-status']} */ ;
        (doc.file ? __VLS_ctx.$t('common.uploaded') : __VLS_ctx.$t('common.missing'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "doc-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.triggerScannedCustomUpload(index);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, scannedDocs, addScannedCustomDocument, triggerScannedCustomUpload,];
                } },
            type: "button",
            ...{ class: "upload-btn" },
            title: (doc.file ? __VLS_ctx.$t('common.edit') : __VLS_ctx.$t('common.upload')),
        });
        /** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "17 8 12 3 7 8",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "12",
            y1: "3",
            x2: "12",
            y2: "15",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.removeScannedCustomDocument(index);
                    // @ts-ignore
                    [$t, $t, removeScannedCustomDocument,];
                } },
            type: "button",
            ...{ class: "remove-btn" },
            title: (__VLS_ctx.$t('common.remove')),
        });
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        if (__VLS_ctx.getDocumentUrl('custom_document', index) || doc.url) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                href: (__VLS_ctx.getDocumentUrl('custom_document', index) || doc.url),
                target: "_blank",
                ...{ class: "view-link" },
            });
            /** @type {__VLS_StyleScopedClasses['view-link']} */ ;
        }
        if (doc.file) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            (doc.file.name);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.employee))
                        return;
                    __VLS_ctx.handleScannedCustomUpload($event, index);
                    // @ts-ignore
                    [$t, getDocumentUrl, getDocumentUrl, handleScannedCustomUpload,];
                } },
            ref: (el => __VLS_ctx.setScannedCustomInputRef(el, index)),
            type: "file",
            accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
            ...{ style: {} },
        });
        // @ts-ignore
        [setScannedCustomInputRef,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-info-note" },
    });
    /** @type {__VLS_StyleScopedClasses['file-info-note']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "12",
        x2: "12",
        y2: "16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "8",
        x2: "12.01",
        y2: "8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('documents.fileInfo') || 'Accepted formats: PDF, JPG, PNG, DOC, DOCX. Max size: 5MB per file.');
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "8",
        x2: "12",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "16",
        r: "0.5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('messages.noData'));
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        to: "/employees",
    }));
    const __VLS_8 = __VLS_7({
        to: "/employees",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    (__VLS_ctx.$t('common.returnToEmployees'));
    // @ts-ignore
    [$t, $t, $t,];
    var __VLS_9;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleEducationUpload) },
    type: "file",
    ref: "educationInput",
    ...{ style: {} },
    accept: ".pdf,.jpg,.jpeg,.png",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleTrainingUpload) },
    type: "file",
    ref: "trainingInput",
    ...{ style: {} },
    accept: ".pdf,.jpg,.jpeg,.png",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleWorkUpload) },
    type: "file",
    ref: "workInput",
    ...{ style: {} },
    accept: ".pdf,.jpg,.jpeg,.png",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleGuaranteeDocUpload) },
    type: "file",
    ref: "guaranteeInput",
    ...{ style: {} },
    accept: ".pdf,.jpg,.jpeg,.png",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleChildDocUpload) },
    type: "file",
    ref: "childDocInput",
    ...{ style: {} },
    accept: ".pdf,.jpg,.jpeg,.png",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleChildProfileUpload) },
    type: "file",
    ref: "childProfileInput",
    ...{ style: {} },
    accept: "image/*",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toast-container" },
});
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
for (const [toast] of __VLS_vFor((__VLS_ctx.toasts))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (toast.id),
        ...{ class: (`toast toast-${toast.type}`) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (toast.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeToast(toast.id);
                // @ts-ignore
                [handleEducationUpload, handleTrainingUpload, handleWorkUpload, handleGuaranteeDocUpload, handleChildDocUpload, handleChildProfileUpload, toasts, removeToast,];
            } },
    });
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
