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
    if (!startEC)
        return 'Unknown';
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
    }
    else {
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
    if (years === 0 && months === 0)
        return 'Less than 1 month';
    if (years === 0)
        return `${months} months`;
    if (months === 0)
        return `${years} years`;
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
    }
    catch (error) {
        console.error('Failed to load termination history:', error);
        employmentHistory.value = [];
    }
    finally {
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
    }
    catch (error) {
        console.error('Failed to load department transfers:', error);
        departmentTransfers.value = [];
    }
    finally {
        loadingTransfers.value = false;
    }
};
// Transfer date helpers
const getTransferDay = (date) => {
    if (!date)
        return '--';
    const parts = date.split('/');
    return parts[0] || '--';
};
// Ethiopian month names
const getEthiopianMonthName = (date) => {
    if (!date)
        return '---';
    const parts = date.split('/');
    if (parts.length < 2)
        return '---';
    const month = parseInt(parts[1]);
    const monthNames = [
        'መስከረም', // 1 - Meskerem
        'ጥቅምት', // 2 - Tikimt
        'ህዳር', // 3 - Hidar
        'ታህሳስ', // 4 - Tahsas
        'ጥር', // 5 - Tir
        'የካቲት', // 6 - Yekatit
        'መጋቢት', // 7 - Megabit
        'ሚያዝያ', // 8 - Miazia
        'ግንቦት', // 9 - Genbot
        'ሰኔ', // 10 - Sene
        'ሐምሌ', // 11 - Hamle
        'ነሐሴ', // 12 - Nehase
        'ጳጉሜ' // 13 - Pagume
    ];
    if (month >= 1 && month <= 13) {
        return monthNames[month - 1];
    }
    return '---';
};
const getTransferYear = (date) => {
    if (!date)
        return '----';
    const parts = date.split('/');
    return parts[2] || '----';
};
// Helper method to get document URL by type (for single documents or first of indexed)
const getDocumentUrl = (type) => {
    const docs = employee.value?.documents;
    if (!docs)
        return null;
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
    if (!docs)
        return [];
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
        if (!children || !children[index])
            return `Child ${index + 1}`;
        return children[index].name || `Child ${index + 1}`;
    };
    // Helper to get guarantor name by index
    const getGuarantorName = (index) => {
        const guarantors = employeeData?.guaranteeInfo;
        if (!guarantors || !guarantors[index])
            return `Guarantor ${index + 1}`;
        return guarantors[index].guarantorName || `Guarantor ${index + 1}`;
    };
    // Helper to get education description
    const getEducationDescription = (index) => {
        const education = employeeData?.education;
        if (!education || !education[index])
            return `Entry ${index + 1}`;
        const edu = education[index];
        const level = getEducationLevelName(edu.level);
        return `${level} - ${edu.institutionName || 'Unknown Institution'}`;
    };
    // Helper to get training description
    const getTrainingDescription = (index) => {
        const training = employeeData?.training;
        if (!training || !training[index])
            return `Entry ${index + 1}`;
        const train = training[index];
        return `${train.trainingName || 'Training'} - ${train.institutionName || 'Unknown Institution'}`;
    };
    // Helper to get work experience description
    const getWorkDescription = (index) => {
        const work = employeeData?.workExperience;
        if (!work || !work[index])
            return `Entry ${index + 1}`;
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
    if (!employee.value)
        return 0;
    const housing = parseFloat(employee.value?.housingAllowance) || 0;
    const position = parseFloat(employee.value?.positionAllowance) || 0;
    const transport = parseFloat(employee.value?.transportAllowance) || 0;
    const mobile = parseFloat(employee.value?.mobileAllowance) || 0;
    return housing + position + transport + mobile;
});
const grossPay = computed(() => {
    if (!employee.value)
        return 0;
    const basic = parseFloat(employee.value?.basicSalary) || 0;
    return basic + totalAllowances.value;
});
// ========== FORMATTING FUNCTIONS ==========
const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "")
        return "—";
    const num = Number(value);
    if (isNaN(num))
        return "—";
    return `ETB ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value))
        return "0.0";
    return Number(value).toFixed(1);
};
// EC Date format: DD/MM/YYYY
const formatDate = (date) => {
    if (!date)
        return "—";
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
    }
    catch (e) {
        // ignore
    }
    return date;
};
// Calculate age from EC date (DD/MM/YYYY)
const calculateAgeFromEC = (dateOfBirthEC) => {
    if (!dateOfBirthEC)
        return "?";
    const parts = dateOfBirthEC.split('/');
    if (parts.length !== 3)
        return "?";
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
    }
    catch (error) {
        console.error("Failed to load compensation history:", error);
        compensationHistories.value = [];
    }
    finally {
        loadingHistory.value = false;
    }
};
const loadEmployeeData = async () => {
    loading.value = true;
    try {
        const result = await EmployeesService.getEmployeeById(employeeId);
        if (result.success && result.data)
            employee.value = result.data;
    }
    catch (error) {
        console.error("Error loading employee:", error);
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => {
    loadEmployeeData();
    loadCompensationHistory();
    loadTerminationHistory();
    loadDepartmentTransfers();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-action-btn-view']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-action-btn-view']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-action-btn-disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['department-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['department-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-row']} */ ;
/** @type {__VLS_StyleScopedClasses['current-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-row']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-row']} */ ;
/** @type {__VLS_StyleScopedClasses['historical-transfer']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['component-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['increase']} */ ;
/** @type {__VLS_StyleScopedClasses['component-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['decrease']} */ ;
/** @type {__VLS_StyleScopedClasses['new-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['increase']} */ ;
/** @type {__VLS_StyleScopedClasses['new-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['decrease']} */ ;
/** @type {__VLS_StyleScopedClasses['change-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['increase']} */ ;
/** @type {__VLS_StyleScopedClasses['change-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['decrease']} */ ;
/** @type {__VLS_StyleScopedClasses['history-content-full']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['period-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['hired']} */ ;
/** @type {__VLS_StyleScopedClasses['period-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['terminated']} */ ;
/** @type {__VLS_StyleScopedClasses['period-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rehired']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['hired']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['terminated']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rehired']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['hired']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['terminated']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rehired']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-text']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['col-date']} */ ;
/** @type {__VLS_StyleScopedClasses['col-component']} */ ;
/** @type {__VLS_StyleScopedClasses['col-old']} */ ;
/** @type {__VLS_StyleScopedClasses['col-new']} */ ;
/** @type {__VLS_StyleScopedClasses['col-change']} */ ;
/** @type {__VLS_StyleScopedClasses['col-period']} */ ;
/** @type {__VLS_StyleScopedClasses['col-status']} */ ;
/** @type {__VLS_StyleScopedClasses['col-dates']} */ ;
/** @type {__VLS_StyleScopedClasses['col-duration']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-col-section']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-col-description']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-col-date']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-col-from']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-col-to']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-col-reason']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-col-status']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-content-full']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-content']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-content']} */ ;
/** @type {__VLS_StyleScopedClasses['status-date']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['online-status']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['online-status']} */ ;
/** @type {__VLS_StyleScopedClasses['online-status']} */ ;
/** @type {__VLS_StyleScopedClasses['terminated']} */ ;
/** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['on-leave']} */ ;
/** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['terminated']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
/** @type {__VLS_StyleScopedClasses['gross']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
/** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
/** @type {__VLS_StyleScopedClasses['child-card']} */ ;
/** @type {__VLS_StyleScopedClasses['child-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['parent-card']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['history-content-full']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['history-empty-full']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-right']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['child-card']} */ ;
/** @type {__VLS_StyleScopedClasses['parent-card']} */ ;
/** @type {__VLS_StyleScopedClasses['parent-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['history-content-full']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['employment-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['documents-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantor-header']} */ ;
/** @type {__VLS_StyleScopedClasses['guarantor-documents']} */ ;
/** @type {__VLS_StyleScopedClasses['child-documents']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "employee-detail" },
});
/** @type {__VLS_StyleScopedClasses['employee-detail']} */ ;
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
    (__VLS_ctx.$t("common.loading") || "Loading employee information...");
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
    (__VLS_ctx.$t("common.backToList") || "Back to List");
    // @ts-ignore
    [loading, $t, $t, employee,];
    var __VLS_3;
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        to: (`/employees/${__VLS_ctx.employeeId}/edit`),
        ...{ class: "action-btn primary" },
    }));
    const __VLS_8 = __VLS_7({
        to: (`/employees/${__VLS_ctx.employeeId}/edit`),
        ...{ class: "action-btn primary" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
    const { default: __VLS_11 } = __VLS_9.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M17 3l4 4-7 7H10v-4l7-7z",
    });
    (__VLS_ctx.$t("common.editEmployee") || "Edit Employee");
    // @ts-ignore
    [$t, employeeId,];
    var __VLS_9;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-section" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-left" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-avatar-large" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ onError: (__VLS_ctx.handleImageError) },
        src: (__VLS_ctx.employee.profilePictureUrl || __VLS_ctx.getAvatarUrl(__VLS_ctx.employee.fullName)),
        alt: (__VLS_ctx.employee.fullName),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "online-status" },
        ...{ class: (__VLS_ctx.employee.status) },
    });
    /** @type {__VLS_StyleScopedClasses['online-status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-basic" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-basic']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.employee.fullName || __VLS_ctx.employee.fullNameEnglish);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-tags" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-tags']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tag" },
    });
    /** @type {__VLS_StyleScopedClasses['tag']} */ ;
    (__VLS_ctx.employee.position || "N/A");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tag" },
    });
    /** @type {__VLS_StyleScopedClasses['tag']} */ ;
    (__VLS_ctx.employee.departmentName || "N/A");
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
    (__VLS_ctx.$t("employee.employeeId") || "Employee ID");
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "code-value" },
    });
    /** @type {__VLS_StyleScopedClasses['code-value']} */ ;
    (__VLS_ctx.employee.employeeId);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-indicator" },
        ...{ class: (__VLS_ctx.employee.status) },
    });
    /** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
    (__VLS_ctx.getStatusLabel(__VLS_ctx.employee.status));
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
    (__VLS_ctx.$t("employee.department") || "Department");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.employee.departmentName || "N/A");
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
    (__VLS_ctx.$t("employee.hireDate") || "Hire Date");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.employee.hireDateEC));
    (__VLS_ctx.$t('calendar.ec') || 'E.C');
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
    (__VLS_ctx.$t("employee.employmentType") || "Employment Type");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.getEmploymentTypeLabel(__VLS_ctx.employee.employmentType));
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
    (__VLS_ctx.$t("employee.basicSalary") || "Basic Salary");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.employee.basicSalary));
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
    (__VLS_ctx.$t("employee.personalInfo") || "Personal Information");
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
    (__VLS_ctx.$t("employee.fullName") || "Full Name");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.fullNameEnglish || __VLS_ctx.employee.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.workEmail") || "Work Email");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.email || __VLS_ctx.employee.workEmail || "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.personalEmail") || "Personal Email");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.personalEmail || "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.phone") || "Phone");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.phone || __VLS_ctx.employee.phoneNumber || "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.dateOfBirth") || "Date of Birth");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.employee.dateOfBirthEC) || "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.gender") || "Gender");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.getGenderLabel(__VLS_ctx.employee.gender));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.maritalStatus") || "Marital Status");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.getMaritalStatusLabel(__VLS_ctx.employee.maritalStatus));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.nationality") || "Nationality");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.getNationalityLabel(__VLS_ctx.employee.nationality));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.nationalId") || "National ID (FAN)");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.nationalId || "—");
    if (__VLS_ctx.employee.birthPlace && Object.keys(__VLS_ctx.employee.birthPlace).length) {
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
        (__VLS_ctx.$t("employee.birthPlace") || "Birth Place");
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
        (__VLS_ctx.$t("address.region") || "Region");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.birthPlace.region || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.city") || "City");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.birthPlace.city || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.subcity") || "Subcity");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.birthPlace.subcity || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.district") || "District");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.birthPlace.district || "—");
    }
    if (__VLS_ctx.employee.currentCompany &&
        Object.keys(__VLS_ctx.employee.currentCompany).length) {
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
        (__VLS_ctx.$t("company.currentCompany") || "Current Company");
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
        (__VLS_ctx.$t("company.name") || "Company Name");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.companyName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("company.tin") || "TIN Number");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.companyTin || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("company.phone") || "Phone");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.companyPhone || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("company.email") || "Email");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.companyEmail || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("company.address") || "Address");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.companyAddress || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("company.poBox") || "PO Box");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.poBox || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("company.website") || "Website");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentCompany.website || "—");
    }
    if (__VLS_ctx.employee.currentAddress &&
        Object.keys(__VLS_ctx.employee.currentAddress).length) {
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
        (__VLS_ctx.$t("address.currentAddress") || "Current Address");
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
        (__VLS_ctx.$t("address.region") || "Region");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentAddress.region || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.subcity") || "Subcity");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentAddress.subcity || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.kebele") || "Kebele");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentAddress.kebele || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.district") || "District");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentAddress.district || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.poBox") || "PO Box");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentAddress.poBox || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.houseNumber") || "House Number");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.currentAddress.houseNumber || "—");
    }
    if (__VLS_ctx.employee.permanentAddress &&
        Object.keys(__VLS_ctx.employee.permanentAddress).length) {
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
        (__VLS_ctx.$t("address.permanentAddress") || "Permanent Address");
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
        (__VLS_ctx.$t("address.region") || "Region");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.permanentAddress.region || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.subcity") || "Subcity");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.permanentAddress.subcity || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.kebele") || "Kebele");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.permanentAddress.kebele || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.district") || "District");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.permanentAddress.district || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.poBox") || "PO Box");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.permanentAddress.poBox || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.houseNumber") || "House Number");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.permanentAddress.houseNumber || "—");
    }
    if (__VLS_ctx.employee.emergencyContact &&
        Object.keys(__VLS_ctx.employee.emergencyContact).length) {
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
        (__VLS_ctx.$t("family.emergencyContact") || "Emergency Contact");
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
        (__VLS_ctx.$t("family.contactName") || "Contact Name");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContact.name || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("family.relationship") || "Relationship");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.getRelationshipLabel(__VLS_ctx.employee.emergencyContact?.relationship));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("family.phoneNumber") || "Phone");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContact.phone || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("family.alternatePhone") || "Alternate Phone");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContact.alternatePhone || "—");
    }
    if (__VLS_ctx.employee.emergencyContactAddress &&
        Object.keys(__VLS_ctx.employee.emergencyContactAddress).length) {
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
        (__VLS_ctx.$t("family.emergencyAddress") || "Emergency Contact Address");
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
        (__VLS_ctx.$t("address.city") || "City");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContactAddress.city || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.subcity") || "Subcity");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContactAddress.subcity || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.district") || "District");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContactAddress.district || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("address.kebele") || "Kebele");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.emergencyContactAddress.kebele || "—");
    }
    if (__VLS_ctx.employee.education && __VLS_ctx.employee.education.length) {
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
        (__VLS_ctx.$t("education.title") || "Education");
        (__VLS_ctx.employee.education.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "education-list" },
        });
        /** @type {__VLS_StyleScopedClasses['education-list']} */ ;
        for (const [edu, idx] of __VLS_vFor((__VLS_ctx.employee.education))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "education-item" },
            });
            /** @type {__VLS_StyleScopedClasses['education-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "edu-header" },
            });
            /** @type {__VLS_StyleScopedClasses['edu-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.getEducationLevelLabel(edu.level));
            (edu.institutionName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "edu-details" },
            });
            /** @type {__VLS_StyleScopedClasses['edu-details']} */ ;
            (__VLS_ctx.formatDate(edu.startDateEC));
            (__VLS_ctx.$t("common.to") || "to");
            (edu.isCurrent ? "Present" : __VLS_ctx.formatDate(edu.endDateEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "edu-address" },
            });
            /** @type {__VLS_StyleScopedClasses['edu-address']} */ ;
            (edu.institutionAddress);
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, handleImageError, getAvatarUrl, getStatusLabel, formatDate, formatDate, formatDate, formatDate, getEmploymentTypeLabel, formatCurrency, getGenderLabel, getMaritalStatusLabel, getNationalityLabel, getRelationshipLabel, getEducationLevelLabel,];
        }
    }
    if (__VLS_ctx.employee.training && __VLS_ctx.employee.training.length) {
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
        (__VLS_ctx.$t("training.title") || "Training");
        (__VLS_ctx.employee.training.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "training-list" },
        });
        /** @type {__VLS_StyleScopedClasses['training-list']} */ ;
        for (const [train, idx] of __VLS_vFor((__VLS_ctx.employee.training))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "training-item" },
            });
            /** @type {__VLS_StyleScopedClasses['training-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "training-header" },
            });
            /** @type {__VLS_StyleScopedClasses['training-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (train.trainingName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "training-details" },
            });
            /** @type {__VLS_StyleScopedClasses['training-details']} */ ;
            (train.institutionName);
            (__VLS_ctx.formatDate(train.startDateEC));
            (__VLS_ctx.$t("common.to") || "to");
            (__VLS_ctx.formatDate(train.endDateEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "training-address" },
            });
            /** @type {__VLS_StyleScopedClasses['training-address']} */ ;
            (train.institutionAddress);
            // @ts-ignore
            [$t, $t, employee, employee, employee, employee, formatDate, formatDate,];
        }
    }
    if (__VLS_ctx.employee.bankAccount && Object.keys(__VLS_ctx.employee.bankAccount).length) {
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
        (__VLS_ctx.$t("bank.title") || "Bank Account");
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
        (__VLS_ctx.$t("bank.bankName") || "Bank Name");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.bankAccount.bankName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("bank.accountNumber") || "Account Number");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.bankAccount.accountNumber || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("bank.accountHolderName") || "Account Holder");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.bankAccount.accountHolderName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-item" },
        });
        /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-label" },
        });
        /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
        (__VLS_ctx.$t("bank.branch") || "Branch");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.employee.bankAccount.branch || "—");
    }
    if (__VLS_ctx.employee.nationalityAcquisition) {
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
        (__VLS_ctx.$t("nationality.title") || "Nationality Acquisition");
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
        (__VLS_ctx.$t("nationality.type") || "Type");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-value" },
        });
        /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
        (__VLS_ctx.getNationalityTypeLabel(__VLS_ctx.employee.nationalityAcquisition.type));
    }
    if (__VLS_ctx.employee.healthInfo || __VLS_ctx.employee.legalInfo) {
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
        (__VLS_ctx.$t("healthLegal.title") || "Health & Legal");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "health-legal-content" },
        });
        /** @type {__VLS_StyleScopedClasses['health-legal-content']} */ ;
        if (__VLS_ctx.employee.healthInfo) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "health-section" },
            });
            /** @type {__VLS_StyleScopedClasses['health-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            (__VLS_ctx.$t("healthLegal.healthTitle") || "Health Information");
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("healthLegal.physicalInjury") ||
                "Physical Injury/Disability");
            (__VLS_ctx.employee.healthInfo.hasPhysicalInjury ? __VLS_ctx.$t("common.yes") || "Yes" : __VLS_ctx.$t("common.no") || "No");
            if (__VLS_ctx.employee.healthInfo.injuryDescription) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                (__VLS_ctx.employee.healthInfo.injuryDescription);
            }
        }
        if (__VLS_ctx.employee.legalInfo) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "legal-section" },
            });
            /** @type {__VLS_StyleScopedClasses['legal-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            (__VLS_ctx.$t("healthLegal.legalTitle") || "Legal Information");
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("healthLegal.criminalRecord") || "Criminal Record");
            (__VLS_ctx.employee.legalInfo.hasCriminalRecord ? __VLS_ctx.$t("common.yes") || "Yes" : __VLS_ctx.$t("common.no") || "No");
            if (__VLS_ctx.employee.legalInfo.criminalRecordDescription) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                (__VLS_ctx.employee.legalInfo.criminalRecordDescription);
            }
        }
    }
    if (__VLS_ctx.employee.languageSkills && __VLS_ctx.employee.languageSkills.length) {
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
        (__VLS_ctx.$t("skills.title") || "Language Skills");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "skills-list" },
        });
        /** @type {__VLS_StyleScopedClasses['skills-list']} */ ;
        for (const [lang, idx] of __VLS_vFor((__VLS_ctx.employee.languageSkills))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "skill-tag" },
            });
            /** @type {__VLS_StyleScopedClasses['skill-tag']} */ ;
            (__VLS_ctx.getLanguageLabel(lang.language));
            (__VLS_ctx.getProficiencyLabel(lang.proficiency));
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, getNationalityTypeLabel, getLanguageLabel, getProficiencyLabel,];
        }
        if (__VLS_ctx.employee.otherSkills) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "other-skills" },
            });
            /** @type {__VLS_StyleScopedClasses['other-skills']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.$t("skills.otherTitle") || "Other Skills");
            (__VLS_ctx.employee.otherSkills);
        }
    }
    if (__VLS_ctx.employee.guaranteeInfo && __VLS_ctx.employee.guaranteeInfo.length) {
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
        (__VLS_ctx.$t("guarantee.title") || "Guarantors");
        (__VLS_ctx.employee.guaranteeInfo.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "guarantee-list" },
        });
        /** @type {__VLS_StyleScopedClasses['guarantee-list']} */ ;
        for (const [guarantor, idx] of __VLS_vFor((__VLS_ctx.employee.guaranteeInfo))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "guarantor-card-item" },
            });
            /** @type {__VLS_StyleScopedClasses['guarantor-card-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "guarantor-header" },
            });
            /** @type {__VLS_StyleScopedClasses['guarantor-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (guarantor.guarantorName);
            (guarantor.guarantorJob);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "guarantor-details" },
            });
            /** @type {__VLS_StyleScopedClasses['guarantor-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("guarantee.guarantorOfficeName") || "Office");
            (guarantor.guarantorOfficeName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("guarantee.guarantorOfficeAddress") || "Address");
            (guarantor.guarantorOfficeAddress);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("guarantee.letterNumber") || "Guarantee Letter");
            (guarantor.guaranteeLetterNo);
            (__VLS_ctx.formatDate(guarantor.guaranteeLetterDateEC));
            (__VLS_ctx.$t('calendar.ec') || 'E.C');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("guarantee.sdtLetterNumber") || "SDT Letter");
            (guarantor.sdtLetterNo);
            (__VLS_ctx.formatDate(guarantor.sdtLetterDateEC));
            (__VLS_ctx.$t('calendar.ec') || 'E.C');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("guarantee.confirmedDateEC") || "guarentee Confrimation Date ");
            (__VLS_ctx.formatDate(guarantor.confirmedDateEC));
            (__VLS_ctx.$t('calendar.ec') || 'E.C');
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, employee, employee, employee, employee, employee, employee, formatDate, formatDate, formatDate,];
        }
    }
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
    (__VLS_ctx.$t("employee.employmentInfo") || "Employment Information");
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
    (__VLS_ctx.$t("employee.department") || "Department");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.departmentName || "N/A");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.position") || "Position");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.position || "N/A");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.employmentType") || "Employment Type");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.getEmploymentTypeLabel(__VLS_ctx.employee.employmentType));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.hireDate") || "Hire Date");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.employee.hireDateEC));
    (__VLS_ctx.$t('calendar.ec') || 'E.C');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.manager") || "Manager");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.managerName || "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.workLocation") || "Work Location");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.employee.workLocation || "—");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-label" },
    });
    /** @type {__VLS_StyleScopedClasses['info-label']} */ ;
    (__VLS_ctx.$t("employee.shiftType") || "Shift Type");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "info-value" },
    });
    /** @type {__VLS_StyleScopedClasses['info-value']} */ ;
    (__VLS_ctx.getShiftTypeLabel(__VLS_ctx.employee.shiftType));
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
    (__VLS_ctx.$t("employee.compensationAllowances") ||
        "Compensation & Allowances");
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
    (__VLS_ctx.$t("employee.basicSalary") || "Basic Salary");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.employee.basicSalary));
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
    (__VLS_ctx.$t("employee.housingAllowance") || "Housing Allowance");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.employee.housingAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t("employee.positionAllowance") || "Position Allowance");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.employee.positionAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t("employee.transportAllowance") || "Transport Allowance");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.employee.transportAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-item" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-label" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-label']} */ ;
    (__VLS_ctx.$t("employee.mobileAllowance") || "Mobile Allowance");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.employee.mobileAllowance));
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
    (__VLS_ctx.$t("employee.totalAllowances") || "Total Allowances");
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
    (__VLS_ctx.$t("employee.grossPay") || "Gross Monthly Pay");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "allowance-value gross-amount" },
    });
    /** @type {__VLS_StyleScopedClasses['allowance-value']} */ ;
    /** @type {__VLS_StyleScopedClasses['gross-amount']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.grossPay));
    if (__VLS_ctx.employee.spouseInfo && Object.keys(__VLS_ctx.employee.spouseInfo).length) {
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
        (__VLS_ctx.$t("family.spouse") || "Spouse Information");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-layout" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-layout']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-avatar']} */ ;
        if (__VLS_ctx.getDocumentWithIndex('spouse_profile', 0) ||
            __VLS_ctx.getDocumentUrl('spouse_profile')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                ...{ onError: ((e) => (e.target.src = __VLS_ctx.getAvatarUrl(__VLS_ctx.employee.spouseInfo?.fullName || 'Spouse'))) },
                src: (__VLS_ctx.getDocumentWithIndex('spouse_profile', 0) ||
                    __VLS_ctx.getDocumentUrl('spouse_profile')),
                alt: (__VLS_ctx.employee.spouseInfo?.fullName || 'Spouse'),
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "spouse-avatar-placeholder" },
            });
            /** @type {__VLS_StyleScopedClasses['spouse-avatar-placeholder']} */ ;
            (__VLS_ctx.employee.spouseInfo?.fullName?.charAt(0) || "S");
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-info" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-name" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-name']} */ ;
        (__VLS_ctx.employee.spouseInfo.fullName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("family.tinNumber") || "TIN Number");
        (__VLS_ctx.employee.spouseInfo.tinNumber || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("family.dateOfBirth") || "Date of Birth");
        (__VLS_ctx.formatDate(__VLS_ctx.employee.spouseInfo.dateOfBirthEC) || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("family.jobStatus") || "Job Status");
        (__VLS_ctx.getJobStatusLabel(__VLS_ctx.employee.spouseInfo.jobStatus));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("family.companyName") || "Company Name");
        (__VLS_ctx.employee.spouseInfo.companyName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-detail" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-detail']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("family.companyAddress") || "Company Address");
        (__VLS_ctx.employee.spouseInfo.companyAddress || "—");
    }
    if (__VLS_ctx.employee.children && __VLS_ctx.employee.children.length) {
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
        (__VLS_ctx.$t("family.children") || "Children");
        (__VLS_ctx.employee.children.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "children-list" },
        });
        /** @type {__VLS_StyleScopedClasses['children-list']} */ ;
        for (const [child, idx] of __VLS_vFor((__VLS_ctx.employee.children))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "child-card" },
            });
            /** @type {__VLS_StyleScopedClasses['child-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['child-avatar']} */ ;
            if (__VLS_ctx.getDocumentWithIndex('child_profile', idx)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    ...{ onError: ((e) => (e.target.src = __VLS_ctx.getAvatarUrl(child.name))) },
                    src: (__VLS_ctx.getDocumentWithIndex('child_profile', idx)),
                    alt: (child.name),
                });
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "avatar-placeholder" },
                });
                /** @type {__VLS_StyleScopedClasses['avatar-placeholder']} */ ;
                (child.name?.charAt(0) || "C");
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-info" },
            });
            /** @type {__VLS_StyleScopedClasses['child-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-header" },
            });
            /** @type {__VLS_StyleScopedClasses['child-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "child-name" },
            });
            /** @type {__VLS_StyleScopedClasses['child-name']} */ ;
            (child.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "child-age" },
            });
            /** @type {__VLS_StyleScopedClasses['child-age']} */ ;
            (__VLS_ctx.calculateAgeFromEC(child.dateOfBirthEC));
            (__VLS_ctx.$t("family.years") || "years");
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-details" },
            });
            /** @type {__VLS_StyleScopedClasses['child-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "child-label" },
            });
            /** @type {__VLS_StyleScopedClasses['child-label']} */ ;
            (__VLS_ctx.$t("family.dateOfBirth") || "Date of Birth");
            (__VLS_ctx.formatDate(child.dateOfBirthEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "child-label" },
            });
            /** @type {__VLS_StyleScopedClasses['child-label']} */ ;
            (__VLS_ctx.$t("family.medicalCondition") || "Medical Condition");
            (child.hasMedicalCondition ? __VLS_ctx.$t("common.yes") || "Yes" : __VLS_ctx.$t("common.no") || "No");
            if (child.medicalConditionNotes) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "child-label" },
                });
                /** @type {__VLS_StyleScopedClasses['child-label']} */ ;
                (__VLS_ctx.$t("family.notes") || "Notes");
                (child.medicalConditionNotes);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "child-label" },
            });
            /** @type {__VLS_StyleScopedClasses['child-label']} */ ;
            (__VLS_ctx.$t("family.adopted") || "Adopted");
            (child.isAdopted ? __VLS_ctx.$t("common.yes") || "Yes" : __VLS_ctx.$t("common.no") || "No");
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, getAvatarUrl, getAvatarUrl, formatDate, formatDate, formatDate, getEmploymentTypeLabel, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, getShiftTypeLabel, totalAllowances, grossPay, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentWithIndex, getDocumentUrl, getDocumentUrl, getJobStatusLabel, calculateAgeFromEC,];
        }
    }
    if (__VLS_ctx.employee.parentsInfo &&
        (__VLS_ctx.employee.parentsInfo.father || __VLS_ctx.employee.parentsInfo.mother)) {
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
        (__VLS_ctx.$t("family.parents") || "Parents Information");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parents-container" },
        });
        /** @type {__VLS_StyleScopedClasses['parents-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-card" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-details" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-name" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-name']} */ ;
        (__VLS_ctx.employee.parentsInfo.father?.fullName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "parent-job" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-job']} */ ;
        (__VLS_ctx.employee.parentsInfo.father?.job || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "parent-income" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-income']} */ ;
        (__VLS_ctx.$t("family.monthlyIncome") || "Monthly Income");
        (__VLS_ctx.formatCurrency(__VLS_ctx.employee.parentsInfo.father?.monthlyIncome));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-card" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-details" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-name" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-name']} */ ;
        (__VLS_ctx.employee.parentsInfo.mother?.fullName || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "parent-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "parent-job" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-job']} */ ;
        (__VLS_ctx.employee.parentsInfo.mother?.job || "—");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "parent-income" },
        });
        /** @type {__VLS_StyleScopedClasses['parent-income']} */ ;
        (__VLS_ctx.$t("family.monthlyIncome") || "Monthly Income");
        (__VLS_ctx.formatCurrency(__VLS_ctx.employee.parentsInfo.mother?.monthlyIncome));
        if ((__VLS_ctx.employee.parentsInfo.financialSupport &&
            __VLS_ctx.employee.parentsInfo.financialSupport !== 'Monthly 0 ETB') ||
            (__VLS_ctx.employee.parentsInfo.otherSupport &&
                __VLS_ctx.employee.parentsInfo.otherSupport !== '') ||
            (__VLS_ctx.employee.parentSupport && __VLS_ctx.employee.parentSupport.length)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "support-section" },
            });
            /** @type {__VLS_StyleScopedClasses['support-section']} */ ;
            if (__VLS_ctx.employee.parentsInfo.financialSupport ||
                __VLS_ctx.employee.parentsInfo.otherSupport) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "simple-support" },
                });
                /** @type {__VLS_StyleScopedClasses['simple-support']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "support-title" },
                });
                /** @type {__VLS_StyleScopedClasses['support-title']} */ ;
                (__VLS_ctx.$t("family.supportProvided") || "Support Provided");
                if (__VLS_ctx.employee.parentsInfo.financialSupport &&
                    __VLS_ctx.employee.parentsInfo.financialSupport !== 'Monthly 0 ETB') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "support-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['support-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "support-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['support-icon']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "support-text" },
                    });
                    /** @type {__VLS_StyleScopedClasses['support-text']} */ ;
                    (__VLS_ctx.$t("family.financialSupport") || "Financial Support");
                    (__VLS_ctx.employee.parentsInfo.financialSupport);
                }
                if (__VLS_ctx.employee.parentsInfo.otherSupport &&
                    __VLS_ctx.employee.parentsInfo.otherSupport !== '') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "support-row" },
                    });
                    /** @type {__VLS_StyleScopedClasses['support-row']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "support-icon" },
                    });
                    /** @type {__VLS_StyleScopedClasses['support-icon']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "support-text" },
                    });
                    /** @type {__VLS_StyleScopedClasses['support-text']} */ ;
                    (__VLS_ctx.$t("family.otherSupport") || "Other Support");
                    (__VLS_ctx.employee.parentsInfo.otherSupport);
                }
            }
        }
    }
    if (__VLS_ctx.employee.workExperience && __VLS_ctx.employee.workExperience.length) {
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
        (__VLS_ctx.$t("employee.workExperience") || "Work Experience");
        (__VLS_ctx.employee.workExperience.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "work-list" },
        });
        /** @type {__VLS_StyleScopedClasses['work-list']} */ ;
        for (const [work, idx] of __VLS_vFor((__VLS_ctx.employee.workExperience))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "work-item" },
            });
            /** @type {__VLS_StyleScopedClasses['work-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "work-header" },
            });
            /** @type {__VLS_StyleScopedClasses['work-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (work.position);
            (__VLS_ctx.$t("common.at"));
            (work.companyName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "work-dates" },
            });
            /** @type {__VLS_StyleScopedClasses['work-dates']} */ ;
            (__VLS_ctx.formatDate(work.startDateEC));
            (__VLS_ctx.$t("common.to"));
            (__VLS_ctx.formatDate(work.endDateEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "work-details" },
            });
            /** @type {__VLS_StyleScopedClasses['work-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("employee.salary") || "Salary");
            (__VLS_ctx.formatCurrency(work.monthlySalary));
            (__VLS_ctx.formatCurrency(work.salaryWhenLeft));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.$t("employee.providentFund") || "Provident Fund");
            (work.providentFundSubmitted === "yes" ? __VLS_ctx.$t("common.yes") || "Yes" : __VLS_ctx.$t("common.no") || "No");
            if (work.terminationReason) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                (__VLS_ctx.$t("employee.reasonForLeaving") || "Reason for leaving");
                (work.terminationReason);
            }
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, employee, formatDate, formatDate, formatCurrency, formatCurrency, formatCurrency, formatCurrency,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card documents-card full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['documents-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
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
        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "14 2 14 8 20 8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t("documents.title") || "Employee Documents");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "history-count" },
    });
    /** @type {__VLS_StyleScopedClasses['history-count']} */ ;
    (__VLS_ctx.totalDocuments);
    (__VLS_ctx.$t("documents.files") || "files");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "documents-content" },
    });
    /** @type {__VLS_StyleScopedClasses['documents-content']} */ ;
    if (__VLS_ctx.allDocuments.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "documents-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['documents-empty']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.$t("documents.noFiles") || "No documents uploaded");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "documents-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['documents-hint']} */ ;
        (__VLS_ctx.$t("documents.hint") || "Employee documents will appear here when uploaded");
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "documents-table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['documents-table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "documents-table" },
        });
        /** @type {__VLS_StyleScopedClasses['documents-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "doc-col-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-col-icon']} */ ;
        (__VLS_ctx.$t("documents.type") || "Type");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "doc-col-name" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-col-name']} */ ;
        (__VLS_ctx.$t("documents.document") || "Document");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "doc-col-section" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-col-section']} */ ;
        (__VLS_ctx.$t("documents.section") || "Section");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "doc-col-description" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-col-description']} */ ;
        (__VLS_ctx.$t("documents.description") || "Description");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "doc-col-action" },
        });
        /** @type {__VLS_StyleScopedClasses['doc-col-action']} */ ;
        (__VLS_ctx.$t("documents.action") || "Action");
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [doc, idx] of __VLS_vFor((__VLS_ctx.allDocuments))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (idx),
                ...{ class: "document-row" },
            });
            /** @type {__VLS_StyleScopedClasses['document-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "doc-col-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-col-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "doc-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-icon']} */ ;
            (doc.icon);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "doc-col-name" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-col-name']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "doc-name" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-name']} */ ;
            (doc.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "doc-col-section" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-col-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "section-badge" },
                ...{ class: (doc.sectionClass) },
            });
            /** @type {__VLS_StyleScopedClasses['section-badge']} */ ;
            (doc.section);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "doc-col-description" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-col-description']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "doc-description" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-description']} */ ;
            (doc.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "doc-col-action" },
            });
            /** @type {__VLS_StyleScopedClasses['doc-col-action']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                href: (doc.url),
                target: "_blank",
                ...{ class: "doc-action-btn" },
                ...{ class: ({ 'doc-action-btn-view': doc.url, 'doc-action-btn-disabled': !doc.url }) },
            });
            /** @type {__VLS_StyleScopedClasses['doc-action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['doc-action-btn-view']} */ ;
            /** @type {__VLS_StyleScopedClasses['doc-action-btn-disabled']} */ ;
            if (doc.url) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    'stroke-width': "2",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                    d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
                    cx: "12",
                    cy: "12",
                    r: "3",
                });
            }
            if (doc.url) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.$t("common.view") || "View");
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.$t("common.noFile") || "No file");
            }
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, totalDocuments, allDocuments, allDocuments,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card transfer-history-card full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['transfer-history-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
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
        d: "M16 3h5v5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M8 3H3v5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 3l-7 7",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M3 21l7-7",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21h5v-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M8 21H3v-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t("employee.departmentTransfers") || "Department Transfer History");
    if (__VLS_ctx.departmentTransfers.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "history-count" },
        });
        /** @type {__VLS_StyleScopedClasses['history-count']} */ ;
        (__VLS_ctx.departmentTransfers.length);
        (__VLS_ctx.$t("employee.transfers") || "transfers");
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "transfer-content" },
    });
    /** @type {__VLS_StyleScopedClasses['transfer-content']} */ ;
    if (__VLS_ctx.loadingTransfers) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "transfer-loading" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-loading']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("common.loading") || "Loading...");
    }
    else if (__VLS_ctx.departmentTransfers.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "transfer-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-empty']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.$t("employee.noTransfers") || "No department transfers recorded");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "transfer-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-hint']} */ ;
        (__VLS_ctx.$t("employee.transferHint") || "When an employee changes departments, the transfer will be recorded here");
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "transfer-table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "transfer-table" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "transfer-col-date" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-col-date']} */ ;
        (__VLS_ctx.$t("employee.transferDate") || "Transfer Date");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "transfer-col-from" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-col-from']} */ ;
        (__VLS_ctx.$t("employee.fromDepartment") || "From Department");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "transfer-col-to" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-col-to']} */ ;
        (__VLS_ctx.$t("employee.toDepartment") || "To Department");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "transfer-col-reason" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-col-reason']} */ ;
        (__VLS_ctx.$t("employee.reason") || "Reason");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "transfer-col-status" },
        });
        /** @type {__VLS_StyleScopedClasses['transfer-col-status']} */ ;
        (__VLS_ctx.$t("employee.status") || "Status");
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [transfer, idx] of __VLS_vFor((__VLS_ctx.departmentTransfers))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (idx),
                ...{ class: "transfer-row" },
                ...{ class: ({
                        'current-transfer': transfer.isCurrent,
                        'historical-transfer': transfer.isHistorical && !transfer.isCurrent
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-row']} */ ;
            /** @type {__VLS_StyleScopedClasses['current-transfer']} */ ;
            /** @type {__VLS_StyleScopedClasses['historical-transfer']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "transfer-col-date" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-col-date']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "transfer-date-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-date-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "transfer-date-day" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-date-day']} */ ;
            (__VLS_ctx.getTransferDay(transfer.transferDateEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "transfer-date-month" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-date-month']} */ ;
            (__VLS_ctx.getEthiopianMonthName(transfer.transferDateEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "transfer-date-year" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-date-year']} */ ;
            (__VLS_ctx.getTransferYear(transfer.transferDateEC));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "transfer-col-from" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-col-from']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "department-badge from-dept" },
            });
            /** @type {__VLS_StyleScopedClasses['department-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['from-dept']} */ ;
            (transfer.fromDepartment || 'Unknown');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "transfer-arrow" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-arrow']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "transfer-col-to" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-col-to']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "department-badge to-dept" },
            });
            /** @type {__VLS_StyleScopedClasses['department-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['to-dept']} */ ;
            (transfer.toDepartment || 'Unknown');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "transfer-col-reason" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-col-reason']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "transfer-reason" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-reason']} */ ;
            (transfer.reason || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "transfer-col-status" },
            });
            /** @type {__VLS_StyleScopedClasses['transfer-col-status']} */ ;
            if (transfer.isCurrent) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-badge-transfer current" },
                });
                /** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
                /** @type {__VLS_StyleScopedClasses['current']} */ ;
                (__VLS_ctx.$t("employee.current") || "Current");
            }
            else if (transfer.isHistorical) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-badge-transfer historical" },
                });
                /** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
                /** @type {__VLS_StyleScopedClasses['historical']} */ ;
                (__VLS_ctx.$t("employee.historical") || "Historical");
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-badge-transfer" },
                    ...{ class: (transfer.status) },
                });
                /** @type {__VLS_StyleScopedClasses['status-badge-transfer']} */ ;
                (transfer.statusLabel);
            }
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, departmentTransfers, departmentTransfers, departmentTransfers, departmentTransfers, loadingTransfers, getTransferDay, getEthiopianMonthName, getTransferYear,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card history-card full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['history-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
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
        d: "M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t("compensation.history") || "Compensation Change History");
    if (__VLS_ctx.compensationHistories.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "history-count" },
        });
        /** @type {__VLS_StyleScopedClasses['history-count']} */ ;
        (__VLS_ctx.compensationHistories.length);
        (__VLS_ctx.$t("compensation.changes") || "changes");
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "history-content-full no-scroll" },
    });
    /** @type {__VLS_StyleScopedClasses['history-content-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
    if (__VLS_ctx.loadingHistory) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-loading-full" },
        });
        /** @type {__VLS_StyleScopedClasses['history-loading-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t("common.loading") || "Loading compensation history...");
    }
    else if (__VLS_ctx.compensationHistories.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-empty-full" },
        });
        /** @type {__VLS_StyleScopedClasses['history-empty-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.$t("compensation.noHistory") ||
            "No compensation changes recorded");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "history-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['history-hint']} */ ;
        (__VLS_ctx.$t("compensation.historyHint") ||
            "When salary or allowances are updated, changes will appear here");
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-table-wrapper no-scroll" },
        });
        /** @type {__VLS_StyleScopedClasses['history-table-wrapper']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "history-table" },
        });
        /** @type {__VLS_StyleScopedClasses['history-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-date" },
        });
        /** @type {__VLS_StyleScopedClasses['col-date']} */ ;
        (__VLS_ctx.$t("compensation.date") || "Date");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-component" },
        });
        /** @type {__VLS_StyleScopedClasses['col-component']} */ ;
        (__VLS_ctx.$t("compensation.component") || "Component");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-old" },
        });
        /** @type {__VLS_StyleScopedClasses['col-old']} */ ;
        (__VLS_ctx.$t("compensation.previous") || "Previous");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-new" },
        });
        /** @type {__VLS_StyleScopedClasses['col-new']} */ ;
        (__VLS_ctx.$t("compensation.new") || "New");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-change" },
        });
        /** @type {__VLS_StyleScopedClasses['col-change']} */ ;
        (__VLS_ctx.$t("compensation.change") || "Change");
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [history] of __VLS_vFor((__VLS_ctx.compensationHistories))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (history.id),
                ...{ class: (history.changeType) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-date" },
            });
            /** @type {__VLS_StyleScopedClasses['col-date']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "date-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['date-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "date-day" },
            });
            /** @type {__VLS_StyleScopedClasses['date-day']} */ ;
            (history.changeDay || '--');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "date-month" },
            });
            /** @type {__VLS_StyleScopedClasses['date-month']} */ ;
            (history.changeMonth || '---');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "date-year" },
            });
            /** @type {__VLS_StyleScopedClasses['date-year']} */ ;
            (history.changeYear || '----');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-component" },
            });
            /** @type {__VLS_StyleScopedClasses['col-component']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "component-badge" },
                ...{ class: (history.changeType) },
            });
            /** @type {__VLS_StyleScopedClasses['component-badge']} */ ;
            (__VLS_ctx.getComponentLabel(history.componentKey || history.component));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-old" },
            });
            /** @type {__VLS_StyleScopedClasses['col-old']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "old-amount" },
            });
            /** @type {__VLS_StyleScopedClasses['old-amount']} */ ;
            (__VLS_ctx.formatCurrency(history.oldValue));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-new" },
            });
            /** @type {__VLS_StyleScopedClasses['col-new']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "new-amount" },
                ...{ class: (history.changeType) },
            });
            /** @type {__VLS_StyleScopedClasses['new-amount']} */ ;
            (__VLS_ctx.formatCurrency(history.newValue));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-change" },
            });
            /** @type {__VLS_StyleScopedClasses['col-change']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "change-badge" },
                ...{ class: (history.changeType) },
            });
            /** @type {__VLS_StyleScopedClasses['change-badge']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "change-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['change-icon']} */ ;
            (history.changeType === "increase" ? "▲" : "▼");
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "change-percent" },
            });
            /** @type {__VLS_StyleScopedClasses['change-percent']} */ ;
            (history.changeType === "increase" ? "+" : "");
            (__VLS_ctx.formatPercentage(history.percentageChange));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "change-diff" },
            });
            /** @type {__VLS_StyleScopedClasses['change-diff']} */ ;
            (__VLS_ctx.formatCurrency(history.difference));
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, formatCurrency, formatCurrency, formatCurrency, compensationHistories, compensationHistories, compensationHistories, compensationHistories, loadingHistory, getComponentLabel, formatPercentage,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card employment-history-card full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['employment-history-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
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
        d: "M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    if (__VLS_ctx.employmentHistory.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "history-count" },
        });
        /** @type {__VLS_StyleScopedClasses['history-count']} */ ;
        (__VLS_ctx.employmentHistory.length);
        (__VLS_ctx.$t("compensation.changes") || "periods");
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "history-content-full no-scroll" },
    });
    /** @type {__VLS_StyleScopedClasses['history-content-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
    if (__VLS_ctx.loadingTerminationHistory) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-loading-full" },
        });
        /** @type {__VLS_StyleScopedClasses['history-loading-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else if (__VLS_ctx.employmentHistory.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-empty-full" },
        });
        /** @type {__VLS_StyleScopedClasses['history-empty-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "history-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['history-hint']} */ ;
        (__VLS_ctx.employee.hireDateEC);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "employment-table-wrapper no-scroll" },
        });
        /** @type {__VLS_StyleScopedClasses['employment-table-wrapper']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-scroll']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "employment-table" },
        });
        /** @type {__VLS_StyleScopedClasses['employment-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-period" },
        });
        /** @type {__VLS_StyleScopedClasses['col-period']} */ ;
        (__VLS_ctx.$t("employment.period") || "Period");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-status" },
        });
        /** @type {__VLS_StyleScopedClasses['col-status']} */ ;
        (__VLS_ctx.$t("employment.status") || "Status");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-dates" },
        });
        /** @type {__VLS_StyleScopedClasses['col-dates']} */ ;
        (__VLS_ctx.$t("employment.dates") || "Dates");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-duration" },
        });
        /** @type {__VLS_StyleScopedClasses['col-duration']} */ ;
        (__VLS_ctx.$t("employment.duration") || "Duration");
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "col-details" },
        });
        /** @type {__VLS_StyleScopedClasses['col-details']} */ ;
        (__VLS_ctx.$t("employment.details") || "Details");
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [event, index] of __VLS_vFor((__VLS_ctx.employmentHistory))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (index),
                ...{ class: (event.type) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-period" },
            });
            /** @type {__VLS_StyleScopedClasses['col-period']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "period-badge" },
                ...{ class: (event.type) },
            });
            /** @type {__VLS_StyleScopedClasses['period-badge']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "period-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['period-icon']} */ ;
            (event.icon);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "period-label" },
            });
            /** @type {__VLS_StyleScopedClasses['period-label']} */ ;
            (event.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-status" },
            });
            /** @type {__VLS_StyleScopedClasses['col-status']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-badge" },
                ...{ class: (event.type) },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (event.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-subtitle" },
            });
            /** @type {__VLS_StyleScopedClasses['status-subtitle']} */ ;
            (event.subtitle);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-dates" },
            });
            /** @type {__VLS_StyleScopedClasses['col-dates']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "date-range" },
            });
            /** @type {__VLS_StyleScopedClasses['date-range']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "start-date" },
            });
            /** @type {__VLS_StyleScopedClasses['start-date']} */ ;
            (event.startDate);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "end-date" },
            });
            /** @type {__VLS_StyleScopedClasses['end-date']} */ ;
            (event.endDate || 'Present');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "calendar-tag" },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-tag']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-duration" },
            });
            /** @type {__VLS_StyleScopedClasses['col-duration']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "duration-badge" },
                ...{ class: (event.type) },
            });
            /** @type {__VLS_StyleScopedClasses['duration-badge']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "duration-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['duration-icon']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "duration-text" },
            });
            /** @type {__VLS_StyleScopedClasses['duration-text']} */ ;
            (event.duration || 'Ongoing');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "col-details" },
            });
            /** @type {__VLS_StyleScopedClasses['col-details']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "details-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['details-cell']} */ ;
            if (event.details?.department) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-row" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-label" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-value" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
                (event.details.department);
            }
            if (event.details?.position) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-row" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-label" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-value" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
                (event.details.position);
            }
            if (event.details?.salary) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-row" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-label" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-value" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
                (__VLS_ctx.formatCurrency(event.details.salary));
            }
            if (event.details?.reason) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "detail-row reason-row" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
                /** @type {__VLS_StyleScopedClasses['reason-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-label" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "detail-value reason-text" },
                });
                /** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
                /** @type {__VLS_StyleScopedClasses['reason-text']} */ ;
                (event.details.reason);
            }
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, employee, formatCurrency, employmentHistory, employmentHistory, employmentHistory, employmentHistory, loadingTerminationHistory,];
        }
        if (__VLS_ctx.employee.status === 'active') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "current-status-banner" },
            });
            /** @type {__VLS_StyleScopedClasses['current-status-banner']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "status-indicator" },
            });
            /** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-dot" },
            });
            /** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-text" },
            });
            /** @type {__VLS_StyleScopedClasses['status-text']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-date" },
            });
            /** @type {__VLS_StyleScopedClasses['status-date']} */ ;
            (__VLS_ctx.employee.hireDateEC);
        }
    }
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
    (__VLS_ctx.$t("messages.employeeNotFound") || "Employee Not Found");
    let __VLS_12;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        to: "/employees",
    }));
    const __VLS_14 = __VLS_13({
        to: "/employees",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const { default: __VLS_17 } = __VLS_15.slots;
    (__VLS_ctx.$t("common.returnToEmployees") || "Return to Employees");
    // @ts-ignore
    [$t, $t, employee, employee,];
    var __VLS_15;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
