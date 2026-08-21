const { Employee, Department, Position, User,DepartmentTransfer, EmployeeDocument,CompensationHistory, Role ,TerminationHistory ,sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getDocumentFolder } = require('../middleware/uploadMiddleware');
const XLSX = require('xlsx');
const {
  isValidEthiopianDate,
  convertEthiopianToGregorian
} = require('../utils/dateConverter');
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// employeeController.js - at the very top

console.log('🔥 employeeController loaded, uploadDegree exists:', typeof exports.uploadDegree);
const generateEmployeeCode = async () => {
  const lastEmployee = await Employee.findOne({
    order: [['employeeId', 'DESC']],
    attributes: ['employeeCode']
  });
  
  if (lastEmployee && lastEmployee.employeeCode) {
    const lastNum = parseInt(lastEmployee.employeeCode.replace('EMP', ''));
    const newNum = lastNum + 1;
    return `EMP${String(newNum).padStart(3, '0')}`;
  }
  return 'EMP001';
};

// ============================================================================
// RELIABLE EC TO GC CONVERSION (No external dependencies)
// ============================================================================


// Advanced pagination helper
const getPagination = (page, size, defaultLimit = 10, maxLimit = 100) => {
  const limit = size ? Math.min(parseInt(size), maxLimit) : defaultLimit;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};

// Build dynamic search conditions
const buildSearchConditions = (search, fields = ['firstName', 'lastName', 'employeeCode', 'workEmail']) => {
  if (!search || !search.trim()) return {};
  
  return {
    [Op.or]: fields.map(field => ({
      [field]: { [Op.like]: `%${search.trim()}%` }
    }))
  };
};

// Build filter conditions
const buildFilterConditions = (filters) => {
  const conditions = {};
  
  if (filters.departmentId && filters.departmentId !== 'all') {
    conditions.departmentId = parseInt(filters.departmentId);
  }
  
  if (filters.employmentStatus && filters.employmentStatus !== 'all') {
    conditions.employmentStatus = filters.employmentStatus;
  }
  
  if (filters.employmentType && filters.employmentType !== 'all') {
    conditions.employmentType = filters.employmentType;
  }
  
  if (filters.positionId && filters.positionId !== 'all') {
    conditions.positionId = parseInt(filters.positionId);
  }
  
  return conditions;
};


// ============================================================================
// HELPER: UPDATE JSONB FIELD AFTER DOCUMENT UPLOAD
// ============================================================================

// ========== HELPER FUNCTIONS ==========

/**
 * Parse EC date string (DD/MM/YY or DD/MM/YYYY) to a number for comparison
 */
function parseECDateToNumber(dateStr) {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return 0;
  
  let day = parseInt(parts[0]);
  let month = parseInt(parts[1]);
  let year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
  
  // Handle 2-digit years (convert to 4-digit)
  if (year < 100) {
    year = 2000 + year;
  }
  
  return year * 10000 + month * 100 + day;
}

/**
 * Calculate age in months between two EC dates (DD/MM/YY or DD/MM/YYYY)
 * Ethiopian calendar has 13 months
 */
function calculateAgeInMonthsEC(fromDateEC, toDateEC) {
  if (!fromDateEC || !toDateEC) return null;
  
  // Parse the EC dates
  const fromParts = fromDateEC.split('/');
  const toParts = toDateEC.split('/');
  
  if (fromParts.length !== 3 || toParts.length !== 3) return null;
  
  let fromDay = parseInt(fromParts[0]);
  let fromMonth = parseInt(fromParts[1]);
  let fromYear = parseInt(fromParts[2]);
  
  let toDay = parseInt(toParts[0]);
  let toMonth = parseInt(toParts[1]);
  let toYear = parseInt(toParts[2]);
  
  if (isNaN(fromDay) || isNaN(fromMonth) || isNaN(fromYear) ||
      isNaN(toDay) || isNaN(toMonth) || isNaN(toYear)) {
    return null;
  }
  
  // Handle 2-digit years
  if (fromYear < 100) fromYear = 2000 + fromYear;
  if (toYear < 100) toYear = 2000 + toYear;
  
  // Validate dates
  if (fromMonth < 1 || fromMonth > 13 || toMonth < 1 || toMonth > 13) {
    return null;
  }
  if (fromDay < 1 || fromDay > 30 || toDay < 1 || toDay > 30) {
    return null;
  }
  
  // Calculate total months difference
  // Ethiopian calendar: 13 months in a year
  let months = (toYear - fromYear) * 13 + (toMonth - fromMonth);
  
  // Adjust for days
  if (toDay < fromDay) {
    months--;
  }
  
  // Handle negative months (if date is in the future)
  if (months < 0) months = 0;
  
  return months;
}

/**
 * Get numeric month value for a category label
 */
function getCategoryMonths(label) {
  const map = {
    '1 Month': 1,
    '3 Months': 3,
    '6 Months': 6,
    '9 Months': 9,
    '12 Months': 12,
    '> 12 Months': 13
  };
  return map[label] || 0;
}


/**
 * Get age category label
 */
function getAgeCategoryLabel(months) {
  if (months <= 1) return '1 Month';
  if (months <= 3) return '3 Months';
  if (months <= 6) return '6 Months';
  if (months <= 9) return '9 Months';
  if (months <= 12) return '12 Months';
  return '> 12 Months';
}



// employeeController.js

// ============================================================================
// HELPER: UPDATE JSONB FIELD AFTER DOCUMENT UPLOAD
// ============================================================================

async function updateEmployeeJsonbField(employeeId, documentType, index, fileData) {
  const employee = await Employee.findByPk(employeeId);
  if (!employee) return;
  
  const updateData = {};
  
  switch(documentType) {
    // ========== PROFILE ==========
    case 'profile_picture':
      updateData.profilePictureUrl = fileData.fileUrl;
      break;
      
    // ========== NATIONAL ID / ID CARD ==========
    case 'national_id':
    case 'id_card':
    case 'passport':
      const nationalIdDoc = employee.nationalIdDocument || {};
      nationalIdDoc.documentUrl = fileData.fileUrl;
      nationalIdDoc.documentId = fileData.documentId;
      nationalIdDoc.fileName = fileData.fileName;
      nationalIdDoc.documentType = documentType;
      updateData.nationalIdDocument = nationalIdDoc;
      break;
      
    // ========== SPOUSE DOCUMENTS ==========
    case 'spouse_profile':
      const spouseInfo = employee.spouseInfo || {};
      spouseInfo.profilePictureUrl = fileData.fileUrl;
      spouseInfo.profilePictureDocumentId = fileData.documentId;
      spouseInfo.profilePictureFileName = fileData.fileName;
      updateData.spouseInfo = spouseInfo;
      break;
      
    case 'marriage_certificate':
      const spouseInfo2 = employee.spouseInfo || {};
      spouseInfo2.marriageCertificateUrl = fileData.fileUrl;
      spouseInfo2.marriageCertificateDocumentId = fileData.documentId;
      spouseInfo2.marriageCertificateFileName = fileData.fileName;
      updateData.spouseInfo = spouseInfo2;
      break;
      
    // ========== CHILD DOCUMENTS ==========
    case 'child_birth_certificate':
    case 'child_medical_report':
    case 'child_adoption_certificate':
    case 'child_profile':
      const children = employee.children || [];
      const childIdx = parseInt(index);
      if (children[childIdx]) {
        const fieldMap = {
          'child_birth_certificate': 'birthCertificateUrl',
          'child_medical_report': 'medicalReportUrl',
          'child_adoption_certificate': 'adoptionCertificateUrl',
          'child_profile': 'profilePictureUrl'
        };
        const field = fieldMap[documentType];
        children[childIdx][field] = fileData.fileUrl;
        children[childIdx][`${field.replace('Url', 'DocumentId')}`] = fileData.documentId;
        children[childIdx][`${field.replace('Url', 'FileName')}`] = fileData.fileName;
        updateData.children = children;
      }
      break;
      
    // ========== EDUCATION & CERTIFICATES ==========
    case 'education_certificate':
    case 'degree':
    case 'certificate':
      const education = employee.education || [];
      const eduIdx = parseInt(index);
      if (eduIdx !== null && !isNaN(eduIdx) && education[eduIdx]) {
        education[eduIdx].certificateUrl = fileData.fileUrl;
        education[eduIdx].certificateDocumentId = fileData.documentId;
        education[eduIdx].certificateFileName = fileData.fileName;
        updateData.education = education;
      } else if (eduIdx === -1 || (eduIdx !== null && !education[eduIdx])) {
        const newEducation = {
          level: documentType === 'degree' ? 'Degree' : 'Certificate',
          institutionName: '',
          institutionAddress: '',
          startDate: null,
          endDate: null,
          isCurrent: false,
          certificateUrl: fileData.fileUrl,
          certificateDocumentId: fileData.documentId,
          certificateFileName: fileData.fileName
        };
        education.push(newEducation);
        updateData.education = education;
      }
      break;
      
    // ========== CV / RESUME ==========
    case 'cv':
    case 'resume':
      const cvEducation = employee.education || [];
      const cvEntry = {
        level: 'CV/Resume',
        institutionName: 'N/A',
        institutionAddress: 'N/A',
        startDate: null,
        endDate: null,
        isCurrent: false,
        certificateUrl: fileData.fileUrl,
        certificateDocumentId: fileData.documentId,
        certificateFileName: fileData.fileName,
        isCV: true
      };
      cvEducation.push(cvEntry);
      updateData.education = cvEducation;
      break;
      
    // ========== TRAINING DOCUMENTS ==========
    case 'training_certificate':
      const training = employee.training || [];
      const trainIdx = parseInt(index);
      if (training[trainIdx]) {
        training[trainIdx].certificateUrl = fileData.fileUrl;
        training[trainIdx].certificateDocumentId = fileData.documentId;
        training[trainIdx].certificateFileName = fileData.fileName;
        updateData.training = training;
      }
      break;
      
    // ========== WORK EXPERIENCE DOCUMENTS ==========
    case 'experience_letter':
      const workExp = employee.workExperience || [];
      const workIdx = parseInt(index);
      if (workExp[workIdx]) {
        workExp[workIdx].documentUrl = fileData.fileUrl;
        workExp[workIdx].documentId = fileData.documentId;
        workExp[workIdx].documentFileName = fileData.fileName;
        updateData.workExperience = workExp;
      }
      break;
      
    // ========== GUARANTEE DOCUMENTS ==========
    // ✅ Each guarantor (index) has their own set of documents
    // ✅ When uploading a new document for a specific guarantor, it replaces the old one
    case 'guarantee_letter':
    case 'sdt_letter':
    case 'guarantee_other':
      const guarantees = employee.guaranteeInfo || [];
      const guarIdx = parseInt(index);
      
      // Make sure the guarantor exists at this index
      if (guarantees[guarIdx]) {
        const fieldMap = {
          'guarantee_letter': 'guaranteeLetterUrl',
          'sdt_letter': 'sdtLetterUrl',
          'guarantee_other': 'otherDocumentUrl'
        };
        const field = fieldMap[documentType];
        const docIdField = field.replace('Url', 'DocumentId');
        const fileNameField = field.replace('Url', 'FileName');
        
        // ✅ The old document was already deleted in uploadEmployeeDocument
        // So just update with new info
        guarantees[guarIdx][field] = fileData.fileUrl;
        guarantees[guarIdx][docIdField] = fileData.documentId;
        guarantees[guarIdx][fileNameField] = fileData.fileName;
        updateData.guaranteeInfo = guarantees;
        
        console.log(`✅ Updated ${documentType} for guarantor ${guarIdx}`);
      }
      break;
      
    // ========== PARENT SUPPORT DOCUMENTS ==========
    case 'parent_support_document':
      const parentSupport = employee.parentSupport || [];
      const parentIdx = parseInt(index);
      if (parentSupport[parentIdx]) {
        parentSupport[parentIdx].documentUrl = fileData.fileUrl;
        parentSupport[parentIdx].documentId = fileData.documentId;
        parentSupport[parentIdx].documentFileName = fileData.fileName;
        updateData.parentSupport = parentSupport;
      }
      break;
      
    // ========== NATIONALITY DOCUMENTS ==========
    case 'naturalization_certificate':
      const natAcq = employee.nationalityAcquisition || {};
      natAcq.documentUrl = fileData.fileUrl;
      natAcq.documentId = fileData.documentId;
      natAcq.documentFileName = fileData.fileName;
      updateData.nationalityAcquisition = natAcq;
      break;
      
    // ========== HEALTH DOCUMENTS ==========
    case 'health_document':
      const healthInfo = employee.healthInfo || {};
      healthInfo.documentUrl = fileData.fileUrl;
      healthInfo.documentId = fileData.documentId;
      healthInfo.documentFileName = fileData.fileName;
      updateData.healthInfo = healthInfo;
      break;
      
    // ========== LEGAL DOCUMENTS ==========
    case 'legal_document':
      const legalInfo = employee.legalInfo || {};
      legalInfo.documentUrl = fileData.fileUrl;
      legalInfo.documentId = fileData.documentId;
      legalInfo.documentFileName = fileData.fileName;
      updateData.legalInfo = legalInfo;
      break;
      
    // ========== CONTRACT & PERFORMANCE ==========
    case 'contract':
    case 'performance-review':
      // Store in a contracts array or separate JSONB field
      const contracts = employee.contracts || [];
      contracts.push({
        type: documentType,
        documentUrl: fileData.fileUrl,
        documentId: fileData.documentId,
        fileName: fileData.fileName,
        uploadedAt: new Date()
      });
      updateData.contracts = contracts;
      break;
      
    // ========== DEFAULT ==========
    default:
      console.warn(`Unknown document type in updateEmployeeJsonbField: ${documentType}`);
      break;
  }
  
  if (Object.keys(updateData).length > 0) {
    await employee.update(updateData);
    console.log(`✅ Employee ${employeeId} updated with ${documentType}${index !== undefined && index !== null ? ` (index: ${index})` : ''}`);
  }
}
// Build sorting options
const getSortingOptions = (sortBy, sortOrder) => {
  const allowedSortFields = ['employeeId', 'firstName', 'lastName', 'hireDate', 'employmentStatus', 'basicSalary'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'employeeId';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  return [[field, order]];
};

// Generate unique username
const generateUniqueUsername = async (email, firstName, lastName) => {
  let username = email ? email.split('@')[0] : `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  username = username.replace(/[^a-z0-9.]/g, '');
  
  let existingUser = await User.findOne({ where: { username } });
  let counter = 1;
  let originalUsername = username;
  
  while (existingUser) {
    username = `${originalUsername}${counter}`;
    existingUser = await User.findOne({ where: { username } });
    counter++;
  }
  
  return username;
};

// Delete file from disk
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Get file URL
const getFileUrl = (req, filename, subfolder) => {
  if (!filename) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${subfolder}/${filename}`;
};

// ============================================================================
// CREATE EMPLOYEE (FULLY UPDATED WITH ALL JSONB FIELDS + nationalIdDocument)
// ============================================================================



// ============================================================================
// UPDATE EMPLOYEE (WITH ALLOWANCES & COMPENSATION HISTORY + nationalIdDocument)
// ============================================================================
exports.updateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // ========== GET EMPLOYEE USING RAW QUERY ==========
    const employeeResult = await sequelize.query(
      `SELECT 
        employee_id, employee_code, user_id, first_name, last_name, middle_name,
        full_name_english, date_of_birth_ec, date_of_birth_gc, gender,
        marital_status, nationality, national_id, national_id_document,
        work_email, personal_email, phone_number, current_address,
        permanent_address, birth_place, work_location, current_company,
        department_id, position_id, manager_id, employment_type,
        employment_status, hire_date_ec, hire_date_gc, confirmation_date_ec,
        confirmation_date_gc, termination_date_ec, termination_date_gc,
        shift_type, basic_salary, housing_allowance, position_allowance,
        transport_allowance, mobile_allowance, bank_account,
        emergency_contact, emergency_contact_address, mothers_full_name,
        spouse_info, children, parents_info, parent_support, education,
        training, work_experience, language_skills, other_skills,
        nationality_acquisition, health_info, legal_info, guarantee_info,
        profile_picture, profile_picture_url, profile_picture_public_id,
        is_active
      FROM employees 
      WHERE employee_id = :id`,
      {
        replacements: { id: parseInt(id) },
        type: sequelize.QueryTypes.SELECT,
        plain: true
      }
    );
    
    if (!employeeResult) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    // Convert to a plain object
    const employee = employeeResult;

    const updates = req.body;

    // ========== STORE OLD DEPARTMENT FOR TRANSFER HISTORY ==========
    const oldDepartmentId = employee.department_id;
    const newDepartmentId = updates.departmentId ? parseInt(updates.departmentId) : oldDepartmentId;

    // ========== HANDLE STATUS CHANGE WITH AUTO DATES ==========
    if (updates.status !== undefined) {
      if (updates.status === 'terminated' && employee.employment_status !== 'terminated') {
        const today = new Date();
        const { convertGregorianToEthiopian } = require('../utils/dateConverter');
        
        const gcDate = today.toISOString().split('T')[0];
        const ecDate = convertGregorianToEthiopian(today);
        const ecDateStr = ecDate ? `${String(ecDate.day).padStart(2, '0')}/${String(ecDate.month).padStart(2, '0')}/${ecDate.year}` : null;
        
        if (!updates.terminationDateGC) updates.terminationDateGC = gcDate;
        if (!updates.terminationDateEC) updates.terminationDateEC = ecDateStr;
        if (!updates.terminationDate) updates.terminationDate = gcDate;
      } else if (updates.status === 'active' && employee.employment_status === 'terminated') {
        if (updates.clearTerminationDate !== false) {
          updates.terminationDateGC = null;
          updates.terminationDateEC = null;
          updates.terminationDate = null;
        }
      }
    }

    // Store old values for compensation tracking
    const oldValues = {
      basicSalary: employee.basic_salary,
      housingAllowance: employee.housing_allowance,
      positionAllowance: employee.position_allowance,
      transportAllowance: employee.transport_allowance,
      mobileAllowance: employee.mobile_allowance
    };

    // Handle profile picture update if file is uploaded
    let profilePictureUrl = employee.profile_picture_url;
    if (req.file) {
      if (employee.profile_picture_url) {
        const oldFileName = employee.profile_picture_url.split('/').pop();
        const oldFilePath = path.join(__dirname, '..', 'uploads', 'profiles', oldFileName);
        deleteFile(oldFilePath);
      }
      profilePictureUrl = getFileUrl(req, req.file.filename, 'profiles');
    }

    // Parse Address
    let currentAddress = employee.current_address;
    if (updates.address) {
      if (typeof updates.address === 'string') {
        currentAddress = { street: updates.address };
      } else if (typeof updates.address === 'object') {
        currentAddress = updates.address;
      }
    }

    // Parse Bank Account
    let bankAccount = employee.bank_account;
    if (updates.bankAccount) {
      if (typeof updates.bankAccount === 'string') {
        try { bankAccount = JSON.parse(updates.bankAccount); } catch (e) { bankAccount = {}; }
      } else if (typeof updates.bankAccount === 'object') {
        bankAccount = updates.bankAccount;
      }
    }

    // Parse Emergency Contact
    let emergencyContact = employee.emergency_contact;
    if (updates.emergencyContact) {
      if (typeof updates.emergencyContact === 'string') {
        try { emergencyContact = JSON.parse(updates.emergencyContact); } catch (e) { emergencyContact = {}; }
      } else if (typeof updates.emergencyContact === 'object') {
        emergencyContact = updates.emergencyContact;
      }
    }

    // Parse new JSONB fields
    let birthPlace = employee.birth_place;
    if (updates.birthPlace) {
      if (typeof updates.birthPlace === 'string') {
        try { birthPlace = JSON.parse(updates.birthPlace); } catch (e) { birthPlace = {}; }
      } else if (typeof updates.birthPlace === 'object') {
        birthPlace = updates.birthPlace;
      }
    }

    let spouseInfo = employee.spouse_info;
    if (updates.spouseInfo) {
      if (typeof updates.spouseInfo === 'string') {
        try { spouseInfo = JSON.parse(updates.spouseInfo); } catch (e) { spouseInfo = {}; }
      } else if (typeof updates.spouseInfo === 'object') {
        spouseInfo = updates.spouseInfo;
      }
    }

    let children = employee.children;
    if (updates.children) {
      if (typeof updates.children === 'string') {
        try { children = JSON.parse(updates.children); } catch (e) { children = []; }
      } else if (Array.isArray(updates.children)) {
        children = updates.children;
      }
    }

    let parentSupport = employee.parent_support;
    if (updates.parentSupport) {
      if (typeof updates.parentSupport === 'string') {
        try { parentSupport = JSON.parse(updates.parentSupport); } catch (e) { parentSupport = []; }
      } else if (Array.isArray(updates.parentSupport)) {
        parentSupport = updates.parentSupport;
      }
    }

    let education = employee.education;
    if (updates.education) {
      if (typeof updates.education === 'string') {
        try { education = JSON.parse(updates.education); } catch (e) { education = []; }
      } else if (Array.isArray(updates.education)) {
        education = updates.education;
      }
    }

    let training = employee.training;
    if (updates.training) {
      if (typeof updates.training === 'string') {
        try { training = JSON.parse(updates.training); } catch (e) { training = []; }
      } else if (Array.isArray(updates.training)) {
        training = updates.training;
      }
    }

    let workExperience = employee.work_experience;
    if (updates.workExperience) {
      if (typeof updates.workExperience === 'string') {
        try { workExperience = JSON.parse(updates.workExperience); } catch (e) { workExperience = []; }
      } else if (Array.isArray(updates.workExperience)) {
        workExperience = updates.workExperience;
      }
    }

    let languageSkills = employee.language_skills;
    if (updates.languageSkills) {
      if (typeof updates.languageSkills === 'string') {
        try { languageSkills = JSON.parse(updates.languageSkills); } catch (e) { languageSkills = []; }
      } else if (Array.isArray(updates.languageSkills)) {
        languageSkills = updates.languageSkills;
      }
    }

    let nationalityAcquisition = employee.nationality_acquisition;
    if (updates.nationalityAcquisition) {
      if (typeof updates.nationalityAcquisition === 'string') {
        try { nationalityAcquisition = JSON.parse(updates.nationalityAcquisition); } catch (e) { nationalityAcquisition = {}; }
      } else if (typeof updates.nationalityAcquisition === 'object') {
        nationalityAcquisition = updates.nationalityAcquisition;
      }
    }

    let healthInfo = employee.health_info;
    if (updates.healthInfo) {
      if (typeof updates.healthInfo === 'string') {
        try { healthInfo = JSON.parse(updates.healthInfo); } catch (e) { healthInfo = {}; }
      } else if (typeof updates.healthInfo === 'object') {
        healthInfo = updates.healthInfo;
      }
    }

    let legalInfo = employee.legal_info;
    if (updates.legalInfo) {
      if (typeof updates.legalInfo === 'string') {
        try { legalInfo = JSON.parse(updates.legalInfo); } catch (e) { legalInfo = {}; }
      } else if (typeof updates.legalInfo === 'object') {
        legalInfo = updates.legalInfo;
      }
    }

    let guaranteeInfo = employee.guarantee_info;
    if (updates.guaranteeInfo) {
      if (typeof updates.guaranteeInfo === 'string') {
        try { guaranteeInfo = JSON.parse(updates.guaranteeInfo); } catch (e) { guaranteeInfo = []; }
      } else if (Array.isArray(updates.guaranteeInfo)) {
        guaranteeInfo = updates.guaranteeInfo;
      }
    }

    let parentsInfo = employee.parents_info;
    if (updates.parentsInfo) {
      if (typeof updates.parentsInfo === 'string') {
        try { parentsInfo = JSON.parse(updates.parentsInfo); } catch (e) { parentsInfo = {}; }
      } else if (typeof updates.parentsInfo === 'object') {
        parentsInfo = updates.parentsInfo;
      }
    }

    let emergencyContactAddress = employee.emergency_contact_address;
    if (updates.emergencyContactAddress) {
      if (typeof updates.emergencyContactAddress === 'string') {
        try { emergencyContactAddress = JSON.parse(updates.emergencyContactAddress); } catch (e) { emergencyContactAddress = {}; }
      } else if (typeof updates.emergencyContactAddress === 'object') {
        emergencyContactAddress = updates.emergencyContactAddress;
      }
    }

    let currentCompany = employee.current_company;
    if (updates.currentCompany) {
      if (typeof updates.currentCompany === 'string') {
        try { currentCompany = JSON.parse(updates.currentCompany); } catch (e) { currentCompany = {}; }
      } else if (typeof updates.currentCompany === 'object') {
        currentCompany = updates.currentCompany;
      }
    }

    let permanentAddress = employee.permanent_address;
    if (updates.permanentAddress) {
      if (typeof updates.permanentAddress === 'string') {
        try { permanentAddress = JSON.parse(updates.permanentAddress); } catch (e) { permanentAddress = {}; }
      } else if (typeof updates.permanentAddress === 'object') {
        permanentAddress = updates.permanentAddress;
      }
    }

    let nationalIdDocument = employee.national_id_document;
    if (updates.nationalIdDocument) {
      if (typeof updates.nationalIdDocument === 'string') {
        try { nationalIdDocument = JSON.parse(updates.nationalIdDocument); } catch (e) { nationalIdDocument = {}; }
      } else if (typeof updates.nationalIdDocument === 'object') {
        nationalIdDocument = updates.nationalIdDocument;
      }
    }

    // Prepare update data
    const updateData = {};
    
    // Basic info
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.fullNameEnglish !== undefined) updateData.full_name_english = updates.fullNameEnglish;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.middleName !== undefined) updateData.middle_name = updates.middleName;
    if (updates.email !== undefined) updateData.work_email = updates.email;
    if (updates.personalEmail !== undefined) updateData.personal_email = updates.personalEmail;
    if (updates.phone !== undefined) updateData.phone_number = updates.phone;
    if (updates.dob !== undefined) updateData.date_of_birth = updates.dob;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.maritalStatus !== undefined) updateData.marital_status = updates.maritalStatus;
    if (updates.nationality !== undefined) updateData.nationality = updates.nationality;
    if (updates.nationalId !== undefined) updateData.national_id = updates.nationalId;
    
    // Employment
    if (updates.departmentId !== undefined) updateData.department_id = parseInt(updates.departmentId);
    if (updates.positionId !== undefined) updateData.position_id = parseInt(updates.positionId);
    if (updates.managerId !== undefined) updateData.manager_id = updates.managerId ? parseInt(updates.managerId) : null;
    if (updates.employmentType !== undefined) updateData.employment_type = updates.employmentType;
    
    // STATUS WITH AUTO DATES
    if (updates.status !== undefined) {
      updateData.employment_status = updates.status;
    }
    
    // HANDLE EC DATES WITH AUTO CONVERSION
    const { convertEthiopianToGregorian, isValidEthiopianDate } = require('../utils/dateConverter');

    // Handle Ethiopian Calendar dates - HIRE DATE
    if (updates.hireDateEC !== undefined) {
      if (updates.hireDateEC && !isValidEthiopianDate(updates.hireDateEC)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Invalid Ethiopian hire date: ${updates.hireDateEC}. Use format DD/MM/YYYY`
        });
      }
      updateData.hire_date_ec = updates.hireDateEC || null;
      
      if (updates.hireDateEC) {
        const gcDate = convertEthiopianToGregorian(updates.hireDateEC);
        updateData.hire_date_gc = gcDate;
        updateData.hire_date = gcDate;
      } else {
        updateData.hire_date_gc = null;
        updateData.hire_date = null;
      }
    }

    // Handle Ethiopian Calendar dates - DATE OF BIRTH
    if (updates.dateOfBirthEC !== undefined) {
      if (updates.dateOfBirthEC && !isValidEthiopianDate(updates.dateOfBirthEC)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Invalid Ethiopian date of birth: ${updates.dateOfBirthEC}. Use format DD/MM/YYYY`
        });
      }
      updateData.date_of_birth_ec = updates.dateOfBirthEC || null;
      
      if (updates.dateOfBirthEC) {
        const gcDate = convertEthiopianToGregorian(updates.dateOfBirthEC);
        updateData.date_of_birth_gc = gcDate;
        updateData.date_of_birth = gcDate;
      } else {
        updateData.date_of_birth_gc = null;
        updateData.date_of_birth = null;
      }
    }

    // Handle Ethiopian Calendar dates - CONFIRMATION DATE
    if (updates.confirmationDateEC !== undefined) {
      if (updates.confirmationDateEC && !isValidEthiopianDate(updates.confirmationDateEC)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Invalid Ethiopian confirmation date: ${updates.confirmationDateEC}. Use format DD/MM/YYYY`
        });
      }
      updateData.confirmation_date_ec = updates.confirmationDateEC || null;
      
      if (updates.confirmationDateEC) {
        const gcDate = convertEthiopianToGregorian(updates.confirmationDateEC);
        updateData.confirmation_date_gc = gcDate;
        updateData.confirmation_date = gcDate;
      } else {
        updateData.confirmation_date_gc = null;
        updateData.confirmation_date = null;
      }
    }

    // Handle Ethiopian Calendar dates - TERMINATION DATE
    if (updates.terminationDateEC !== undefined) {
      if (updates.terminationDateEC && !isValidEthiopianDate(updates.terminationDateEC)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Invalid Ethiopian termination date: ${updates.terminationDateEC}. Use format DD/MM/YYYY`
        });
      }
      updateData.termination_date_ec = updates.terminationDateEC || null;
      
      if (updates.terminationDateEC) {
        const gcDate = convertEthiopianToGregorian(updates.terminationDateEC);
        updateData.termination_date_gc = gcDate;
        updateData.termination_date = gcDate;
      } else {
        updateData.termination_date_gc = null;
        updateData.termination_date = null;
      }
    }
    
    // TERMINATION DATES (GC - for backward compatibility)
    if (updates.terminationDateGC !== undefined) updateData.termination_date_gc = updates.terminationDateGC;
    if (updates.terminationDate !== undefined) updateData.termination_date = updates.terminationDate;
    if (updates.hireDate !== undefined) updateData.hire_date = updates.hireDate;
    if (updates.confirmationDate !== undefined) updateData.confirmation_date = updates.confirmationDate || null;
    if (updates.workLocation !== undefined) updateData.work_location = updates.workLocation;
    
    // Addresses
    if (updates.mothersFullName !== undefined) updateData.mothers_full_name = updates.mothersFullName;
    
    // JSONB FIELDS
    updateData.birth_place = birthPlace;
    updateData.spouse_info = spouseInfo;
    updateData.children = children;
    updateData.parent_support = parentSupport;
    updateData.education = education;
    updateData.training = training;
    updateData.work_experience = workExperience;
    updateData.language_skills = languageSkills;
    if (updates.otherSkills !== undefined) updateData.other_skills = updates.otherSkills;
    updateData.nationality_acquisition = nationalityAcquisition;
    updateData.health_info = healthInfo;
    updateData.legal_info = legalInfo;
    updateData.guarantee_info = guaranteeInfo;
    updateData.parents_info = parentsInfo;
    updateData.emergency_contact_address = emergencyContactAddress;
    updateData.current_company = currentCompany;
    updateData.permanent_address = permanentAddress;
    updateData.national_id_document = nationalIdDocument;
    
    // COMPENSATION & ALLOWANCES
    let newBasicSalary = oldValues.basicSalary;
    let newHousingAllowance = oldValues.housingAllowance;
    let newPositionAllowance = oldValues.positionAllowance;
    let newTransportAllowance = oldValues.transportAllowance;
    let newMobileAllowance = oldValues.mobileAllowance;
    
    if (updates.basicSalary !== undefined) {
      newBasicSalary = parseFloat(updates.basicSalary);
      updateData.basic_salary = newBasicSalary;
    } else if (updates.salary !== undefined) {
      newBasicSalary = parseFloat(updates.salary);
      updateData.basic_salary = newBasicSalary;
    }
    
    if (updates.housingAllowance !== undefined) {
      newHousingAllowance = parseFloat(updates.housingAllowance) || 0;
      updateData.housing_allowance = newHousingAllowance;
    }
    
    if (updates.positionAllowance !== undefined) {
      newPositionAllowance = parseFloat(updates.positionAllowance) || 0;
      updateData.position_allowance = newPositionAllowance;
    }
    
    if (updates.transportAllowance !== undefined) {
      newTransportAllowance = parseFloat(updates.transportAllowance) || 0;
      updateData.transport_allowance = newTransportAllowance;
    }
    
    if (updates.mobileAllowance !== undefined) {
      newMobileAllowance = parseFloat(updates.mobileAllowance) || 0;
      updateData.mobile_allowance = newMobileAllowance;
    }
    
    // Set complex objects
    updateData.current_address = currentAddress;
    updateData.bank_account = bankAccount;
    updateData.emergency_contact = emergencyContact;
    if (profilePictureUrl !== employee.profile_picture_url) updateData.profile_picture_url = profilePictureUrl;

    // ========== FIX: Stringify JSONB fields before raw SQL update ==========
    const jsonbFields = [
      'current_address', 'permanent_address', 'birth_place', 'current_company',
      'bank_account', 'emergency_contact', 'emergency_contact_address',
      'national_id_document', 'spouse_info', 'children', 'parents_info',
      'parent_support', 'education', 'training', 'work_experience',
      'language_skills', 'nationality_acquisition', 'health_info', 
      'legal_info', 'guarantee_info', 'profile_picture', 'profile_picture_url',
      'profile_picture_public_id'
    ];

    // ========== UPDATE USING RAW QUERY ==========
    // Build the SET clause dynamically
    const setClauses = [];
    const replacements = { id: parseInt(id) };

    Object.keys(updateData).forEach(key => {
      const paramKey = `p_${key.replace(/[^a-zA-Z0-9_]/g, '')}`;
      let value = updateData[key];
      
      // Handle JSONB fields
      if (jsonbFields.includes(key)) {
        // If it's an object, stringify it
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          // For JSONB fields, use ::jsonb casting
          setClauses.push(`${key} = :${paramKey}::jsonb`);
        } else {
          // If null, just set to NULL
          setClauses.push(`${key} = NULL`);
          // Don't add to replacements
          return;
        }
      } else {
        // For non-JSONB fields
        setClauses.push(`${key} = :${paramKey}`);
      }
      
      replacements[paramKey] = value;
    });

    if (setClauses.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const updateQuery = `
      UPDATE employees 
      SET ${setClauses.join(', ')} 
      WHERE employee_id = :id
    `;

    await sequelize.query(updateQuery, {
      replacements: replacements,
      type: sequelize.QueryTypes.UPDATE,
      transaction
    });

    // ========== CREATE DEPARTMENT TRANSFER RECORD IF DEPARTMENT CHANGED ==========
    if (oldDepartmentId !== newDepartmentId && newDepartmentId !== undefined) {
      const today = new Date();
      const { convertGregorianToEthiopian } = require('../utils/dateConverter');
      
      const gcDate = today.toISOString().split('T')[0];
      const ecDate = convertGregorianToEthiopian(today);
      const ecDateStr = ecDate ? `${String(ecDate.day).padStart(2, '0')}/${String(ecDate.month).padStart(2, '0')}/${ecDate.year}` : null;
      
      // Get department names for reason
      const fromDept = await Department.findByPk(oldDepartmentId);
      const toDept = await Department.findByPk(newDepartmentId);
      
      // Create department transfer record using raw SQL
      await sequelize.query(
        `INSERT INTO department_transfers (
          employee_id, 
          from_department_id, 
          to_department_id, 
          transfer_date_ec, 
          transfer_date_gc, 
          reason, 
          approved_by, 
          status,
          created_at,
          updated_at
        ) VALUES (
          :employee_id, 
          :from_department_id, 
          :to_department_id, 
          :transfer_date_ec, 
          :transfer_date_gc, 
          :reason, 
          :approved_by, 
          :status,
          NOW(),
          NOW()
        )`,
        {
          replacements: {
            employee_id: parseInt(id),
            from_department_id: oldDepartmentId,
            to_department_id: newDepartmentId,
            transfer_date_ec: ecDateStr,
            transfer_date_gc: gcDate,
            reason: updates.departmentChangeReason || `Department transfer from ${fromDept?.name || 'Unknown'} to ${toDept?.name || 'Unknown'}`,
            approved_by: req.user?.userId || null,
            status: 'active'
          },
          type: sequelize.QueryTypes.INSERT,
          transaction
        }
      );
      
      console.log(`✅ Department transfer recorded: ${oldDepartmentId} → ${newDepartmentId}`);
    }

    // ========== LOG COMPENSATION CHANGES ==========
    const userId = req.user?.userId;
    const changes = [];

    const hasChanged = (oldVal, newVal) => {
      const oldNum = parseFloat(oldVal) || 0;
      const newNum = parseFloat(newVal) || 0;
      return oldNum !== newNum;
    };

    const calculateChangePercent = (oldVal, newVal) => {
      const oldNum = parseFloat(oldVal) || 0;
      const newNum = parseFloat(newVal) || 0;
      if (oldNum === 0) return newNum > 0 ? 100 : 0;
      return ((newNum - oldNum) / oldNum) * 100;
    };

    if (hasChanged(oldValues.basicSalary, newBasicSalary)) {
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Basic Salary',
        old_value: oldValues.basicSalary,
        new_value: newBasicSalary,
        change_percent: calculateChangePercent(oldValues.basicSalary, newBasicSalary),
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Basic salary updated from ${oldValues.basicSalary} to ${newBasicSalary}`,
        approved_by: userId
      }, { transaction });
      changes.push('Basic Salary');
    }
    
    if (hasChanged(oldValues.housingAllowance, newHousingAllowance)) {
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Housing Allowance',
        old_value: oldValues.housingAllowance,
        new_value: newHousingAllowance,
        change_percent: calculateChangePercent(oldValues.housingAllowance, newHousingAllowance),
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Housing allowance updated from ${oldValues.housingAllowance} to ${newHousingAllowance}`,
        approved_by: userId
      }, { transaction });
      changes.push('Housing Allowance');
    }
    
    if (hasChanged(oldValues.positionAllowance, newPositionAllowance)) {
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Position Allowance',
        old_value: oldValues.positionAllowance,
        new_value: newPositionAllowance,
        change_percent: calculateChangePercent(oldValues.positionAllowance, newPositionAllowance),
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Position allowance updated from ${oldValues.positionAllowance} to ${newPositionAllowance}`,
        approved_by: userId
      }, { transaction });
      changes.push('Position Allowance');
    }
    
    if (hasChanged(oldValues.transportAllowance, newTransportAllowance)) {
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Transport Allowance',
        old_value: oldValues.transportAllowance,
        new_value: newTransportAllowance,
        change_percent: calculateChangePercent(oldValues.transportAllowance, newTransportAllowance),
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Transport allowance updated from ${oldValues.transportAllowance} to ${newTransportAllowance}`,
        approved_by: userId
      }, { transaction });
      changes.push('Transport Allowance');
    }
    
    if (hasChanged(oldValues.mobileAllowance, newMobileAllowance)) {
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Mobile Allowance',
        old_value: oldValues.mobileAllowance,
        new_value: newMobileAllowance,
        change_percent: calculateChangePercent(oldValues.mobileAllowance, newMobileAllowance),
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Mobile allowance updated from ${oldValues.mobileAllowance} to ${newMobileAllowance}`,
        approved_by: userId
      }, { transaction });
      changes.push('Mobile Allowance');
    }

    // Update User's email and fullName if changed
    if (updates.email || updates.firstName || updates.lastName) {
      const user = await User.findByPk(employee.user_id, { transaction });
      if (user) {
        const userUpdates = {};
        if (updates.email) userUpdates.email = updates.email;
        if (updates.firstName || updates.lastName) {
          userUpdates.fullName = `${updates.firstName || employee.first_name} ${updates.lastName || employee.last_name}`;
        }
        await user.update(userUpdates, { transaction });
      }
    }

    // ✅ COMMIT THE TRANSACTION
    await transaction.commit();

    // ✅ FETCH UPDATED EMPLOYEE DATA (using raw query)
    const updatedEmployeeResult = await sequelize.query(
      `SELECT 
        employee_id, employee_code, user_id, first_name, last_name, middle_name,
        full_name_english, date_of_birth_ec, date_of_birth_gc, gender,
        marital_status, nationality, national_id, national_id_document,
        work_email, personal_email, phone_number, current_address,
        permanent_address, birth_place, work_location, current_company,
        department_id, position_id, manager_id, employment_type,
        employment_status, hire_date_ec, hire_date_gc, confirmation_date_ec,
        confirmation_date_gc, termination_date_ec, termination_date_gc,
        shift_type, basic_salary, housing_allowance, position_allowance,
        transport_allowance, mobile_allowance, bank_account,
        emergency_contact, emergency_contact_address, mothers_full_name,
        spouse_info, children, parents_info, parent_support, education,
        training, work_experience, language_skills, other_skills,
        nationality_acquisition, health_info, legal_info, guarantee_info,
        profile_picture, profile_picture_url, profile_picture_public_id,
        is_active
      FROM employees 
      WHERE employee_id = :id`,
      {
        replacements: { id: parseInt(id) },
        type: sequelize.QueryTypes.SELECT,
        plain: true
      }
    );
    
    const updatedEmployee = updatedEmployeeResult;

    // Calculate total allowances
    const housing = parseFloat(updatedEmployee.housing_allowance) || 0;
    const position = parseFloat(updatedEmployee.position_allowance) || 0;
    const transport = parseFloat(updatedEmployee.transport_allowance) || 0;
    const mobile = parseFloat(updatedEmployee.mobile_allowance) || 0;
    const totalAllowances = housing + position + transport + mobile;

    let message = 'Employee updated successfully';
    if (updates.status === 'terminated' && employee.employment_status !== 'terminated') {
      message = 'Employee terminated successfully';
    } else if (updates.status === 'active' && employee.employment_status === 'terminated') {
      message = 'Employee reactivated successfully';
    }
    if (changes.length > 0) {
      message += ` and ${changes.join(', ')} change(s) logged to compensation history`;
    }
    if (oldDepartmentId !== newDepartmentId && newDepartmentId !== undefined) {
      message += ' and department transfer recorded';
    }

    // Get department and position names for response
    let departmentName = null;
    let positionTitle = null;
    
    if (updatedEmployee.department_id) {
      const dept = await Department.findByPk(updatedEmployee.department_id);
      departmentName = dept?.name || null;
    }
    
    if (updatedEmployee.position_id) {
      const pos = await Position.findByPk(updatedEmployee.position_id);
      positionTitle = pos?.title || null;
    }

    res.status(200).json({
      success: true,
      message: message,
      data: { 
        id: updatedEmployee.employee_id,
        employeeId: updatedEmployee.employee_code,
        fullName: `${updatedEmployee.first_name} ${updatedEmployee.last_name}`,
        profilePicture: profilePictureUrl,
        basicSalary: updatedEmployee.basic_salary,
        status: updatedEmployee.employment_status,
        department: departmentName,
        position: positionTitle,
        // Return EC dates in response
        hireDateEC: updatedEmployee.hire_date_ec,
        dateOfBirthEC: updatedEmployee.date_of_birth_ec,
        confirmationDateEC: updatedEmployee.confirmation_date_ec,
        terminationDateEC: updatedEmployee.termination_date_ec,
        // Return GC dates too (for reference)
        hireDateGC: updatedEmployee.hire_date_gc,
        dateOfBirthGC: updatedEmployee.date_of_birth_gc,
        terminationDateGC: updatedEmployee.termination_date_gc,
        allowances: {
          housing: housing,
          position: position,
          transport: transport,
          mobile: mobile,
          total: totalAllowances
        },
        changesLogged: changes,
        departmentChanged: oldDepartmentId !== newDepartmentId && newDepartmentId !== undefined
      }
    });
    
  } catch (error) {
    // ✅ ONLY ROLLBACK IF TRANSACTION IS STILL ACTIVE
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    if (req.file) deleteFile(req.file.path);
    console.error('❌ Update employee error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};








// employeeController.js

// ============================================================================
// UPLOAD NATIONAL ID - DEDICATED ENDPOINT
// ============================================================================

/**
 * Upload National ID for an employee
 * POST /api/employees/upload-national-id
 */















// employeeController.js - uploadNationalId (UPDATED)

// ============================================================================
// UPLOAD NATIONAL ID - DEDICATED ENDPOINT (WITH DELETE)
// ============================================================================

exports.uploadNationalId = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { employeeId, idNumber } = req.body;
    const file = req.file;

    // ========== VALIDATION ==========
    if (!employeeId) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      });
    }

    if (!idNumber || !idNumber.trim()) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'National ID number is required'
      });
    }

    const cleanIdNumber = idNumber.trim();
    if (!/^\d+$/.test(cleanIdNumber)) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'ID number must contain only digits'
      });
    }

    if (!file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'ID document file is required'
      });
    }

    // File validation
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload PDF, JPG, or PNG files only.'
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB'
      });
    }

    // ========== FIND EMPLOYEE ==========
    const employee = await Employee.findByPk(employeeId, { transaction });
    
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    if (employee.employmentStatus !== 'active') {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Cannot upload ID for inactive employee'
      });
    }

    // ========== DELETE EXISTING NATIONAL ID DOCUMENT ==========
    const existingDoc = await EmployeeDocument.findOne({
      where: {
        employeeId: employeeId,
        documentType: 'national_id'
      },
      transaction
    });

    if (existingDoc) {
      console.log(`🗑️ Deleting old national ID document for employee ${employeeId}`);
      
      // Delete old file from disk
      if (existingDoc.filePath) {
        const oldFilePath = path.join(__dirname, '..', existingDoc.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`✅ Old file deleted: ${oldFilePath}`);
        }
      }
      
      // Delete old document record
      await existingDoc.destroy({ transaction });
      console.log(`✅ Old document record deleted: ${existingDoc.documentId}`);
    }

    // ========== CREATE NEW DOCUMENT ==========
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
    const userId = req.user?.userId;

    const newDocument = await EmployeeDocument.create({
      employeeId: employeeId,
      documentType: 'national_id',
      documentName: file.originalname,
      fileName: file.filename,
      documentNumber: cleanIdNumber,
      fileUrl: fileUrl,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId || null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    console.log(`✅ New national ID document created: ${newDocument.documentId}`);

    // ========== UPDATE EMPLOYEE RECORD ==========
    await employee.update({
      nationalId: cleanIdNumber,
      hasNationalId: true,
      updated_at: new Date()
    }, { transaction });

    // ========== COMMIT TRANSACTION ==========
    await transaction.commit();

    // ========== FETCH UPDATED EMPLOYEE ==========
    const updatedEmployee = await Employee.findByPk(employeeId, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] }
      ]
    });

    // ========== RESPONSE ==========
    res.status(200).json({
      success: true,
      message: 'National ID uploaded successfully',
      data: {
        employeeId: updatedEmployee.employeeId,
        employeeCode: updatedEmployee.employeeCode,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        department: updatedEmployee.Department?.name || 'N/A',
        position: updatedEmployee.Position?.title || 'N/A',
        nationalId: cleanIdNumber,
        hasNationalId: true,
        document: {
          id: newDocument.documentId,
          fileName: file.filename,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.mimetype,
          uploadedAt: newDocument.created_at
        }
      }
    });

  } catch (error) {
    // ========== ERROR HANDLING ==========
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    
    // Delete uploaded file if error occurred
    if (req.file) {
      try {
        const fs = require('fs');
        const path = require('path');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Error deleting file on rollback:', err);
      }
    }
    
    console.error('❌ Upload National ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload National ID. Please try again.'
    });
  }
};







// employeeController.js - uploadDegreeDocument (UPDATED)

// ============================================================================
// UPLOAD DEGREE - SIMPLIFIED (WITH DELETE)
// ============================================================================

exports.uploadDegreeDocument = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { employeeId } = req.body;
    const file = req.file;

    console.log('📥 Upload Degree - employeeId:', employeeId);

    // ========== VALIDATION ==========
    if (!employeeId) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      });
    }

    if (!file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Degree certificate file is required'
      });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload PDF, JPG, or PNG files only.'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB'
      });
    }

    // ========== FIND EMPLOYEE ==========
    const employeeIdNum = parseInt(employeeId);
    console.log('🔍 Searching for employee with ID:', employeeIdNum);

    const employee = await Employee.findByPk(employeeIdNum, { transaction });
    
    if (!employee) {
      console.log('❌ Employee not found for ID:', employeeIdNum);
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: `Employee not found with ID: ${employeeIdNum}`
      });
    }

    console.log('✅ Employee found:', {
      id: employee.employeeId,
      code: employee.employeeCode,
      name: `${employee.firstName} ${employee.lastName}`
    });

    // ========== DELETE EXISTING DEGREE DOCUMENT ==========
    const existingDoc = await EmployeeDocument.findOne({
      where: {
        employeeId: employeeIdNum,
        documentType: 'degree'
      },
      transaction
    });

    if (existingDoc) {
      console.log(`🗑️ Deleting old degree document for employee ${employeeIdNum}`);
      
      // Delete old file from disk
      if (existingDoc.filePath) {
        const oldFilePath = path.join(__dirname, '..', existingDoc.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`✅ Old file deleted: ${oldFilePath}`);
        }
      }
      
      // Delete old document record
      await existingDoc.destroy({ transaction });
      console.log(`✅ Old document record deleted: ${existingDoc.documentId}`);
    }

    // ========== CREATE NEW DOCUMENT ==========
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
    const userId = req.user?.userId;

    const newDocument = await EmployeeDocument.create({
      employeeId: employee.employeeId,
      documentType: 'degree',
      documentName: file.originalname,
      fileName: file.filename,
      fileUrl: fileUrl,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId || null,
      description: req.body.description || 'Degree Certificate',
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    console.log(`✅ New degree document created: ${newDocument.documentId}`);

    // ========== COMMIT ==========
    await transaction.commit();

    // ========== RESPONSE ==========
    res.status(200).json({
      success: true,
      message: 'Degree uploaded successfully',
      data: {
        employeeId: employee.employeeId,
        employeeCode: employee.employeeCode,
        fullName: `${employee.firstName} ${employee.lastName}`,
        document: {
          id: newDocument.documentId,
          fileName: file.filename,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.mimetype,
          uploadedAt: newDocument.created_at
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload Degree error:', error);
    
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    
    if (req.file) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload degree. Please try again.'
    });
  }
};










// ============================================================================
// TERMINATE EMPLOYEE - NO COMPENSATION HISTORY LOGGING
// ============================================================================
exports.terminateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    
    // Find the employee
    const employee = await Employee.findByPk(id);
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Check if already terminated
    if (employee.employmentStatus === 'terminated') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Employee is already terminated' 
      });
    }

    // Check if employee is an admin
    if (employee.user) {
      const user = await User.findByPk(employee.userId, { transaction });
      if (user && user.roleId === 1) {
        await transaction.rollback();
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot terminate an admin user.' 
        });
      }
    }

    // Prevent self-termination
    if (employee.userId === req.user.userId) {
      await transaction.rollback();
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot terminate your own account.' 
      });
    }

    // ========== SET TERMINATION DATES ==========
    const today = new Date();
    const { convertGregorianToEthiopian } = require('../utils/dateConverter');
    
    const gcDate = today.toISOString().split('T')[0];
    const ecDate = convertGregorianToEthiopian(today);
    const ecDateStr = ecDate ? 
      `${String(ecDate.day).padStart(2, '0')}/${String(ecDate.month).padStart(2, '0')}/${ecDate.year}` : 
      null;

    // Update employee
    await employee.update({
      employmentStatus: 'terminated',
      isActive: false,
      terminationDateGC: gcDate,
      terminationDateEC: ecDateStr,
      terminationDate: gcDate,
    }, { transaction });

    // ========== CREATE TERMINATION HISTORY ==========
    await TerminationHistory.create({
      employeeId: employee.employeeId,
      terminationDateEC: ecDateStr,
      terminationDateGC: gcDate,
      terminationReason: reason || 'Not specified',
      terminationNotes: notes || null,
      isRehired: false,
      createdBy: req.user?.userId || null
    }, { transaction });

    await transaction.commit();

    // Fetch updated employee with history
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] },
        { 
          model: TerminationHistory,
          as: 'terminationHistories',
          order: [['terminationDateEC', 'DESC']]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Employee terminated successfully',
      data: {
        id: updatedEmployee.employeeId,
        employeeId: updatedEmployee.employeeCode,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        status: updatedEmployee.employmentStatus,
        terminationDateGC: updatedEmployee.terminationDateGC,
        terminationDateEC: updatedEmployee.terminationDateEC,
        isActive: updatedEmployee.isActive,
        terminationHistory: updatedEmployee.terminationHistories || []
      }
    });
    
  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error('❌ Terminate employee error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ============================================================================
// REACTIVATE EMPLOYEE - NO COMPENSATION HISTORY LOGGING
// ============================================================================
exports.reactivateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    
    // Find the employee
    const employee = await Employee.findByPk(id);
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Check if already active
    if (employee.employmentStatus === 'active') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Employee is already active' 
      });
    }

    // Check if terminated (only terminated can be reactivated)
    if (employee.employmentStatus !== 'terminated') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Only terminated employees can be reactivated' 
      });
    }

    const today = new Date();
    const { convertGregorianToEthiopian } = require('../utils/dateConverter');
    
    const gcDate = today.toISOString().split('T')[0];
    const ecDate = convertGregorianToEthiopian(today);
    const ecDateStr = ecDate ? 
      `${String(ecDate.day).padStart(2, '0')}/${String(ecDate.month).padStart(2, '0')}/${ecDate.year}` : 
      null;

    // ========== FIND THE LATEST TERMINATION RECORD ==========
    const latestTermination = await TerminationHistory.findOne({
      where: { 
        employeeId: employee.employeeId,
        isRehired: false 
      },
      order: [['terminationDateGC', 'DESC']],
      transaction
    });

    if (!latestTermination) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'No termination record found for this employee' 
      });
    }

    // ========== UPDATE TERMINATION HISTORY ==========
    await latestTermination.update({
      rehireDateEC: ecDateStr,
      rehireDateGC: gcDate,
      rehireReason: reason || 'Reactivated',
      rehireNotes: notes || null,
      isRehired: true
    }, { transaction });

    // ========== UPDATE EMPLOYEE - SET NEW HIRE DATE ==========
    await employee.update({
      employmentStatus: 'active',
      isActive: true,
      
      // ✅ UPDATE HIRE DATE TO REACTIVATION DATE
      hireDateGC: gcDate,
      hireDateEC: ecDateStr,
      hireDate: gcDate,
      
      // Clear termination dates
      terminationDateGC: null,
      terminationDateEC: null,
      terminationDate: null,
    }, { transaction });

    await transaction.commit();

    // Fetch updated employee with history
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] },
        { 
          model: TerminationHistory,
          as: 'terminationHistories',
          order: [['terminationDateEC', 'DESC']]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Employee reactivated successfully',
      data: {
        id: updatedEmployee.employeeId,
        employeeId: updatedEmployee.employeeCode,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        status: updatedEmployee.employmentStatus,
        isActive: updatedEmployee.isActive,
        
        // New hire date (updated to reactivation date)
        hireDateGC: updatedEmployee.hireDateGC,
        hireDateEC: updatedEmployee.hireDateEC,
        
        terminationDateGC: updatedEmployee.terminationDateGC,
        terminationDateEC: updatedEmployee.terminationDateEC,
        terminationHistory: updatedEmployee.terminationHistories || []
      }
    });
    
  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error('❌ Reactivate employee error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


// ============================================================================
// GET EMPLOYEE TERMINATION HISTORY
// ============================================================================
exports.getTerminationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if employee exists
    const employee = await Employee.findByPk(id, {
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName']
    });

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Get termination history
    const { count, rows } = await TerminationHistory.findAndCountAll({
      where: { employeeId: id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['userId', 'fullName']
        }
      ],
      order: [['terminationDateGC', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response
    const history = rows.map(record => ({
      id: record.terminationHistoryId,
      terminationDateEC: record.terminationDateEC,
      terminationDateGC: record.terminationDateGC,
      terminationReason: record.terminationReason,
      terminationNotes: record.terminationNotes,
      isRehired: record.isRehired,
      rehireDateEC: record.rehireDateEC,
      rehireDateGC: record.rehireDateGC,
      rehireReason: record.rehireReason,
      rehireNotes: record.rehireNotes,
      createdBy: record.creator?.fullName || 'System',
      createdAt: record.createdAt
    }));

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.employeeId,
          employeeId: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`
        },
        history: history,
        summary: {
          totalTerminations: count,
          currentStatus: history.length > 0 && !history[0].isRehired ? 'terminated' : 'active',
          lastTermination: history.length > 0 ? history[0] : null
        }
      },
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get termination history error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


// ============================================================================
// GET ALL EMPLOYEES WITH PAGINATION, FILTERS, AND SEARCH
// ============================================================================

exports.getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'employeeId',
      sortOrder = 'DESC',
      search = '',
      departmentId = 'all',
      employmentStatus = 'all',
      employmentType = 'all',
      positionId = 'all'
    } = req.query;

    // Build search conditions
    let searchCondition = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
      
      if (searchWords.length === 1) {
        searchCondition = {
          [Op.or]: [
            { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
            { firstName: { [Op.iLike]: `%${searchTerm}%` } },
            { lastName: { [Op.iLike]: `%${searchTerm}%` } },
            { middleName: { [Op.iLike]: `%${searchTerm}%` } },
            { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
            { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
            { phoneNumber: { [Op.iLike]: `%${searchTerm}%` } },
            { nationalId: { [Op.iLike]: `%${searchTerm}%` } },
            { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$Position.title$': { [Op.iLike]: `%${searchTerm}%` } }
          ]
        };
      } else {
        const wordConditions = searchWords.map(word => ({
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${word}%` } },
            { lastName: { [Op.iLike]: `%${word}%` } },
            { middleName: { [Op.iLike]: `%${word}%` } },
            { fullNameEnglish: { [Op.iLike]: `%${word}%` } },
            { employeeCode: { [Op.iLike]: `%${word}%` } }
          ]
        }));
        searchCondition = { [Op.and]: wordConditions };
      }
    }

    // Build filter conditions
    let filterCondition = {};
    if (departmentId && departmentId !== 'all') {
      filterCondition.departmentId = parseInt(departmentId);
    }
    if (employmentStatus && employmentStatus !== 'all') {
      filterCondition.employmentStatus = employmentStatus;
    }
    if (employmentType && employmentType !== 'all') {
      filterCondition.employmentType = employmentType;
    }
    if (positionId && positionId !== 'all') {
      filterCondition.positionId = parseInt(positionId);
    }

    const whereCondition = { ...searchCondition, ...filterCondition };

    // Pagination
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);
    
    // Sorting - use GC dates for sorting
    const allowedSortFields = ['employeeId', 'firstName', 'lastName', 'fullNameEnglish', 'hireDateGC', 'employmentStatus', 'basicSalary'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'employeeId';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Execute query with BOTH calendars
    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereCondition,
      attributes: [
        'employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName', 'fullNameEnglish',
        'workEmail', 'phoneNumber', 'employmentType', 'employmentStatus',
        // Gregorian dates (for sorting/backend)
        'hireDateGC', 'dateOfBirthGC', 'confirmationDateGC', 'terminationDateGC',
        // Ethiopian dates (for display)
        'hireDateEC', 'dateOfBirthEC', 'confirmationDateEC', 'terminationDateEC',
        'basicSalary', 'profilePictureUrl', 'departmentId', 'positionId',
        'housingAllowance', 'positionAllowance', 'transportAllowance', 'mobileAllowance',
        'nationalId', 'nationality', 'gender', 'maritalStatus'
      ],
      include: [
        { model: Department, attributes: ['departmentId', 'name', 'code'], required: false },
        { model: Position, attributes: ['positionId', 'title'], required: false },
        { model: Employee, as: 'manager', attributes: ['employeeId', 'firstName', 'lastName'], required: false }
      ],
      limit: queryLimit,
      offset: offset,
      order: [[sortField, sortDirection]],
      distinct: true,
      subQuery: false
    });

    // Format employees with BOTH calendars
    const formattedEmployees = employees.map(emp => {
      const housing = parseFloat(emp.housingAllowance) || 0;
      const position = parseFloat(emp.positionAllowance) || 0;
      const transport = parseFloat(emp.transportAllowance) || 0;
      const mobile = parseFloat(emp.mobileAllowance) || 0;
      const totalAllowances = housing + position + transport + mobile;
      const grossPay = (parseFloat(emp.basicSalary) || 0) + totalAllowances;

      return {
        id: emp.employeeId,
        employeeId: emp.employeeCode,
        fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
        fullNameEnglish: emp.fullNameEnglish,
        firstName: emp.firstName,
        lastName: emp.lastName,
        middleName: emp.middleName,
        email: emp.workEmail,
        phone: emp.phoneNumber,
        nationalId: emp.nationalId,
        nationality: emp.nationality,
        gender: emp.gender,
        maritalStatus: emp.maritalStatus,
        // Ethiopian Calendar dates (Primary - for display)
        hireDateEC: emp.hireDateEC,
        dateOfBirthEC: emp.dateOfBirthEC,
        confirmationDateEC: emp.confirmationDateEC,
        terminationDateEC: emp.terminationDateEC,
        // Gregorian Calendar dates (Secondary - for sorting)
        hireDateGC: emp.hireDateGC,
        dateOfBirthGC: emp.dateOfBirthGC,
        confirmationDateGC: emp.confirmationDateGC,
        terminationDateGC: emp.terminationDateGC,
        departmentId: emp.departmentId,
        departmentName: emp.Department?.name,
        departmentCode: emp.Department?.code,
        position: emp.Position?.title,
        positionId: emp.positionId,
        employmentType: emp.employmentType,
        status: emp.employmentStatus,
        basicSalary: emp.basicSalary,
        housingAllowance: housing,
        positionAllowance: position,
        transportAllowance: transport,
        mobileAllowance: mobile,
        totalAllowances: totalAllowances,
        grossPay: grossPay,
        profilePictureUrl: emp.profilePictureUrl,
        managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null
      };
    });

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      data: formattedEmployees,
      pagination: {
        total: count,
        page: currentPage,
        limit: queryLimit,
        totalPages: totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// ============================================================================
// GET EMPLOYEE BY ID - RETURN ALL FIELDS (WITH INDEXED DOCUMENTS)
// ============================================================================
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      attributes: [
        // Primary and basic info
        'employeeId', 'employeeCode', 'userId', 'fullNameEnglish',
        'firstName', 'lastName', 'middleName',
        'gender', 'maritalStatus', 'nationality', 'nationalId',
        'personalEmail', 'workEmail', 'phoneNumber',
        
        // Addresses
        'currentAddress', 'permanentAddress', 'birthPlace', 'workLocation',
        
        // Emergency contact
        'emergencyContact', 'emergencyContactAddress',
        
        // Employment
        'departmentId', 'positionId', 'managerId',
        'employmentType', 'employmentStatus', 'shiftType',
        
        // ========== DATES - BOTH CALENDARS ==========
        // Ethiopian Calendar (Primary - for display)
        'hireDateEC', 'dateOfBirthEC', 'confirmationDateEC', 'terminationDateEC',
        // Gregorian Calendar (Secondary - for backend)
        'hireDateGC', 'dateOfBirthGC', 'confirmationDateGC', 'terminationDateGC',
        
        // Salary & Allowances
        'basicSalary', 'housingAllowance', 'positionAllowance', 
        'transportAllowance', 'mobileAllowance',
        
        // Financial
        'bankAccount', 'currentCompany',
        
        // Family
        'mothersFullName', 'spouseInfo', 'children', 'parentSupport', 'parentsInfo',
        
        // Education & Training
        'education', 'training', 'workExperience',
        
        // Skills
        'languageSkills', 'otherSkills',
        
        // Nationality
        'nationalityAcquisition',
        
        // Health & Legal
        'healthInfo', 'legalInfo',
        
        // Guarantee
        'guaranteeInfo',
        
        // National ID Documentu
        'nationalIdDocument',
        
        // Profile
        'profilePicture', 'profilePictureUrl', 'profilePicturePublicId',
        
        // Status
        'isActive', 'createdAt', 'updatedAt'
      ],
      include: [
        { model: Department, attributes: ['departmentId', 'name', 'code', 'description'] },
        { model: Position, attributes: ['positionId', 'title', 'level'] },
        { model: Employee, as: 'manager', attributes: ['employeeId', 'firstName', 'lastName', 'workEmail'] }
      ]
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Fetch documents
    const documents = await EmployeeDocument.findAll({
      where: { employeeId: employee.employeeId },
      attributes: ['documentId', 'documentType', 'index', 'documentName', 'fileUrl', 'fileSize', 'mimeType', 'created_at'],
      order: [['documentType', 'ASC'], ['index', 'ASC'], ['created_at', 'DESC']]
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Group documents
    const groupedDocuments = {};

    documents.forEach(doc => {
      const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${baseUrl}${doc.fileUrl}`;
      
      const docData = {
        id: doc.documentId,
        type: doc.documentType,
        index: doc.index,
        fileName: doc.documentName,
        fileUrl: fullUrl,
        size: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.created_at
      };

      if (doc.index !== null && doc.index !== undefined) {
        const indexedKey = `${doc.documentType}_${doc.index}`;
        groupedDocuments[indexedKey] = docData;
      } else {
        if (groupedDocuments[doc.documentType] && Array.isArray(groupedDocuments[doc.documentType])) {
          groupedDocuments[doc.documentType].push(docData);
        } else if (groupedDocuments[doc.documentType]) {
          const existing = groupedDocuments[doc.documentType];
          groupedDocuments[doc.documentType] = [existing, docData];
        } else {
          groupedDocuments[doc.documentType] = docData;
        }
      }
    });

    // Parse JSON fields
    let currentAddress = employee.currentAddress;
    let permanentAddress = employee.permanentAddress;
    let birthPlace = employee.birthPlace;
    let emergencyContact = employee.emergencyContact;
    let emergencyContactAddress = employee.emergencyContactAddress;
    let bankAccount = employee.bankAccount;
    let currentCompany = employee.currentCompany;
    let spouseInfo = employee.spouseInfo;
    let children = employee.children;
    let parentSupport = employee.parentSupport;
    let parentsInfo = employee.parentsInfo;
    let education = employee.education;
    let training = employee.training;
    let workExperience = employee.workExperience;
    let languageSkills = employee.languageSkills;
    let nationalityAcquisition = employee.nationalityAcquisition;
    let healthInfo = employee.healthInfo;
    let legalInfo = employee.legalInfo;
    let guaranteeInfo = employee.guaranteeInfo;
    let nationalIdDocument = employee.nationalIdDocument;

    // Parse stringified JSON (same as before)
    if (typeof currentAddress === 'string') { try { currentAddress = JSON.parse(currentAddress); } catch (e) { currentAddress = {}; } }
    if (typeof permanentAddress === 'string') { try { permanentAddress = JSON.parse(permanentAddress); } catch (e) { permanentAddress = {}; } }
    if (typeof birthPlace === 'string') { try { birthPlace = JSON.parse(birthPlace); } catch (e) { birthPlace = {}; } }
    if (typeof emergencyContact === 'string') { try { emergencyContact = JSON.parse(emergencyContact); } catch (e) { emergencyContact = {}; } }
    if (typeof emergencyContactAddress === 'string') { try { emergencyContactAddress = JSON.parse(emergencyContactAddress); } catch (e) { emergencyContactAddress = {}; } }
    if (typeof bankAccount === 'string') { try { bankAccount = JSON.parse(bankAccount); } catch (e) { bankAccount = {}; } }
    if (typeof currentCompany === 'string') { try { currentCompany = JSON.parse(currentCompany); } catch (e) { currentCompany = {}; } }
    if (typeof spouseInfo === 'string') { try { spouseInfo = JSON.parse(spouseInfo); } catch (e) { spouseInfo = {}; } }
    if (typeof children === 'string') { try { children = JSON.parse(children); } catch (e) { children = []; } }
    if (typeof parentSupport === 'string') { try { parentSupport = JSON.parse(parentSupport); } catch (e) { parentSupport = []; } }
    if (typeof parentsInfo === 'string') { try { parentsInfo = JSON.parse(parentsInfo); } catch (e) { parentsInfo = {}; } }
    if (typeof education === 'string') { try { education = JSON.parse(education); } catch (e) { education = []; } }
    if (typeof training === 'string') { try { training = JSON.parse(training); } catch (e) { training = []; } }
    if (typeof workExperience === 'string') { try { workExperience = JSON.parse(workExperience); } catch (e) { workExperience = []; } }
    if (typeof languageSkills === 'string') { try { languageSkills = JSON.parse(languageSkills); } catch (e) { languageSkills = []; } }
    if (typeof nationalityAcquisition === 'string') { try { nationalityAcquisition = JSON.parse(nationalityAcquisition); } catch (e) { nationalityAcquisition = {}; } }
    if (typeof healthInfo === 'string') { try { healthInfo = JSON.parse(healthInfo); } catch (e) { healthInfo = {}; } }
    if (typeof legalInfo === 'string') { try { legalInfo = JSON.parse(legalInfo); } catch (e) { legalInfo = {}; } }
    if (typeof guaranteeInfo === 'string') { try { guaranteeInfo = JSON.parse(guaranteeInfo); } catch (e) { guaranteeInfo = []; } }
    if (typeof nationalIdDocument === 'string') { try { nationalIdDocument = JSON.parse(nationalIdDocument); } catch (e) { nationalIdDocument = {}; } }

    // Fix profile picture URL
    let profilePictureUrl = employee.profilePictureUrl;
    if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
      profilePictureUrl = `${baseUrl}${profilePictureUrl}`;
    }

    // Calculate total allowances
    const housingAllowance = parseFloat(employee.housingAllowance) || 0;
    const positionAllowance = parseFloat(employee.positionAllowance) || 0;
    const transportAllowance = parseFloat(employee.transportAllowance) || 0;
    const mobileAllowance = parseFloat(employee.mobileAllowance) || 0;
    const totalAllowances = housingAllowance + positionAllowance + transportAllowance + mobileAllowance;
    const grossPay = (parseFloat(employee.basicSalary) || 0) + totalAllowances;

    // Return response with BOTH calendars
    res.status(200).json({
      success: true,
      data: {
        // IDs
        id: employee.employeeId,
        employeeId: employee.employeeCode,
        employeeCode: employee.employeeCode,
        userId: employee.userId,
        
        // Basic Info
        firstName: employee.firstName,
        lastName: employee.lastName,
        middleName: employee.middleName,
        fullName: `${employee.firstName} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName}`,
        fullNameEnglish: employee.fullNameEnglish,
        
        // Contact
        email: employee.workEmail,
        workEmail: employee.workEmail,
        personalEmail: employee.personalEmail,
        phone: employee.phoneNumber,
        phoneNumber: employee.phoneNumber,
        
        // Personal Details
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        nationality: employee.nationality,
        nationalId: employee.nationalId,
        
        // ========== DATES - BOTH CALENDARS ==========
        // Ethiopian Calendar (Primary - for display to users)
        hireDateEC: employee.hireDateEC,
        dateOfBirthEC: employee.dateOfBirthEC,
        confirmationDateEC: employee.confirmationDateEC,
        terminationDateEC: employee.terminationDateEC,
        
        // Gregorian Calendar (Secondary - for backend sorting/reports)
        hireDateGC: employee.hireDateGC,
        dateOfBirthGC: employee.dateOfBirthGC,
        confirmationDateGC: employee.confirmationDateGC,
        terminationDateGC: employee.terminationDateGC,
        
        // National ID Document
        nationalIdDocument: nationalIdDocument || null,
        
        // Addresses
        currentAddress: currentAddress,
        permanentAddress: permanentAddress,
        birthPlace: birthPlace,
        workLocation: employee.workLocation,
        
        // Emergency Contact
        emergencyContact: emergencyContact,
        emergencyContactAddress: emergencyContactAddress,
        
        // Employment
        departmentId: employee.departmentId,
        departmentName: employee.Department?.name,
        departmentCode: employee.Department?.code,
        positionId: employee.positionId,
        position: employee.Position?.title,
        positionLevel: employee.Position?.level,
        managerId: employee.managerId,
        managerName: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null,
        employmentType: employee.employmentType,
        employmentStatus: employee.employmentStatus,
        status: employee.employmentStatus,
        shiftType: employee.shiftType,
        
        // Salary & Allowances
        salary: employee.basicSalary,
        basicSalary: employee.basicSalary,
        housingAllowance: housingAllowance,
        positionAllowance: positionAllowance,
        transportAllowance: transportAllowance,
        mobileAllowance: mobileAllowance,
        totalAllowances: totalAllowances,
        grossPay: grossPay,
        
        // Financial
        bankAccount: bankAccount,
        currentCompany: currentCompany,
        
        // Family
        mothersFullName: employee.mothersFullName,
        spouseInfo: spouseInfo,
        children: children,
        parentSupport: parentSupport,
        parentsInfo: parentsInfo,
        
        // Education & Training
        education: education,
        training: training,
        workExperience: workExperience,
        
        // Skills
        languageSkills: languageSkills,
        otherSkills: employee.otherSkills,
        
        // Nationality
        nationalityAcquisition: nationalityAcquisition,
        
        // Health & Legal
        healthInfo: healthInfo,
        legalInfo: legalInfo,
        
        // Guarantee
        guaranteeInfo: guaranteeInfo,
        
        // Profile
        profilePicture: profilePictureUrl,
        profilePictureUrl: profilePictureUrl,
        profilePicturePublicId: employee.profilePicturePublicId,
        
        // Status
        isActive: employee.isActive,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
        
        // Documents with proper indexing
        documents: groupedDocuments
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
// ============================================================================
// UPLOAD PROFILE
// ============================================================================

exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log('=== uploadProfilePicture controller ===');
    console.log('req.params:', req.params);
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    
    const { id } = req.params;
    
   

    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!req.file) {
      console.log('No file in request!');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);

    // Delete old profile picture if exists
    if (employee.profilePictureUrl) {
      const oldFileName = employee.profilePictureUrl.split('/').pop();
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'profiles', oldFileName);
      deleteFile(oldFilePath);
    }

    const profilePictureUrl = getFileUrl(req, req.file.filename, 'profiles');
    await employee.update({ profilePictureUrl });

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { 
        profilePicture: profilePictureUrl,
        employeeId: employee.employeeCode,
        fullName: `${employee.firstName} ${employee.lastName}`
      }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload profile picture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// DELETE PROFILE PICTURE
// ============================================================================
exports.deleteProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    
    

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (employee.profilePictureUrl) {
      const oldFileName = employee.profilePictureUrl.split('/').pop();
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'profiles', oldFileName);
      deleteFile(oldFilePath);
      await employee.update({ profilePictureUrl: null });
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};




// ============================================================================
// UPLOAD ID CARD
// ============================================================================
exports.uploadIdCard = async (req, res) => {
  try {
    const { id } = req.params;
    
    

    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Delete old ID card if exists
    const existingDoc = await EmployeeDocument.findOne({
      where: { employeeId: id, documentType: 'id_card' }
    });

    if (existingDoc) {
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'documents', 'id_cards', path.basename(existingDoc.fileUrl));
      deleteFile(oldFilePath);
      await existingDoc.update({
        documentName: req.file.originalname,  // ✅ ADD THIS
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/id_cards/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      });
      var document = existingDoc;
    } else {
      var document = await EmployeeDocument.create({
        employeeId: id,
        documentType: 'id_card',
        documentName: req.file.originalname,  // ✅ ADD THIS
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/id_cards/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    res.status(200).json({
      success: true,
      message: 'ID Card uploaded successfully',
      data: {
        id: document.documentId,
        type: 'id_card',
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload ID card error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// UPLOAD CV/RESUME
// ============================================================================
exports.uploadCv = async (req, res) => {
  try {
    const { id } = req.params;
    
   

    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const existingDoc = await EmployeeDocument.findOne({
      where: { employeeId: id, documentType: 'cv' }
    });

    if (existingDoc) {
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'documents', 'cv_resumes', path.basename(existingDoc.fileUrl));
      deleteFile(oldFilePath);
      await existingDoc.update({
        documentName: req.file.originalname,  // ✅ ADD THIS
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/cv_resumes/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      });
      var document = existingDoc;
    } else {
      var document = await EmployeeDocument.create({
        employeeId: id,
        documentType: 'cv',
        documentName: req.file.originalname,  // ✅ ADD THIS
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/cv_resumes/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    res.status(200).json({
      success: true,
      message: 'CV/Resume uploaded successfully',
      data: {
        id: document.documentId,
        type: 'cv',
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload CV error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// UPLOAD DEGREE/CERTIFICATE
// ============================================================================
exports.uploadDegree = async (req, res) => {
  try {
    const { id } = req.params;
    
   

    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const existingDoc = await EmployeeDocument.findOne({
      where: { employeeId: id, documentType: 'degree' }
    });

    if (existingDoc) {
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'documents', 'degrees', path.basename(existingDoc.fileUrl));
      deleteFile(oldFilePath);
      await existingDoc.update({
        documentName: req.file.originalname,  // ✅ ADD THIS
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/degrees/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      });
      var document = existingDoc;
    } else {
      var document = await EmployeeDocument.create({
        employeeId: id,
        documentType: 'degree',
        documentName: req.file.originalname,  // ✅ ADD THIS
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/degrees/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    res.status(200).json({
      success: true,
      message: 'Degree/Certificate uploaded successfully',
      data: {
        id: document.documentId,
        type: 'degree',
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload degree error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// UPLOAD GUARANTEE LETTER
// ============================================================================
exports.uploadGuaranteeLetter = async (req, res) => {
  try {
    const { id } = req.params;
    
 

    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const document = await EmployeeDocument.create({
      employeeId: id,
      documentType: 'guarantee_letter',
      documentName: req.file.originalname,  // ✅ ADD THIS
      fileName: req.file.originalname,
      fileUrl: `/uploads/documents/guarantees/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    res.status(200).json({
      success: true,
      message: 'Guarantee letter uploaded successfully',
      data: {
        id: document.documentId,
        type: 'guarantee_letter',
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload guarantee letter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// GET ALL DOCUMENTS GROUPED BY TYPE
// ============================================================================
exports.getAllDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const documents = await EmployeeDocument.findAll({
      where: { employeeId: id },
      attributes: ['documentId', 'documentType', 'documentName', 'fileUrl', 'fileSize', 'mimeType', 'created_at'],
      order: [['documentType', 'ASC'], ['created_at', 'DESC']]
    });

    // Group documents by type with full URLs
    const grouped = {
      id_card: null,
      cv: null,
      degree: null,
      guarantee_letters: []
    };

    documents.forEach(doc => {
      // Convert relative path to full URL
      const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${baseUrl}${doc.fileUrl}`;
      
      const docData = {
        id: doc.documentId,
        type: doc.documentType,
        fileName: doc.documentName,
        fileUrl: fullUrl,  // ✅ Full URL here
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.created_at
      };

      if (doc.documentType === 'guarantee_letter') {
        grouped.guarantee_letters.push(docData);
      } else {
        grouped[doc.documentType] = docData;
      }
    });

    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// DELETE EMPLOYEE DOCUMENT
// ============================================================================
exports.deleteDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
  

    const document = await EmployeeDocument.findOne({
      where: { documentId, employeeId: id }
    });

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Get the correct file path
const fileUrl = document.fileUrl;
const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
const fullFilePath = path.join(__dirname, '..', relativePath);
deleteFile(fullFilePath);
    await document.destroy();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// GET EMPLOYEE DOCUMENTS
// ============================================================================
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const documents = await EmployeeDocument.findAll({
      where: { employeeId: id },
      attributes: ['documentId', 'documentType', 'documentName', 'fileUrl', 'fileSize', 'mimeType', 'created_at'],  // ✅ Changed 'fileName' to 'documentName'
      order: [['created_at', 'DESC']]
    });

    // Format for frontend
    const formattedDocuments = documents.map(doc => ({
      id: doc.documentId,
      type: doc.documentType,
      fileName: doc.documentName,  // ✅ Map documentName to fileName
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.created_at
    }));

    res.status(200).json({
      success: true,
      data: formattedDocuments
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ============================================================================
// DELETE EMPLOYEE (SOFT DELETE)
// ============================================================================
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
 

    const employee = await Employee.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'roleId']
      }]
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    // Check if the employee is an admin (roleId = 1 typically for admin)
    if (employee.user && employee.user.roleId === 1) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot delete or terminate an admin user. Admin accounts cannot be removed.' 
      });
    }
    
    // Prevent admin from deleting themselves
    if (employee.userId === req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot delete your own account.' 
      });
    }
    
    await employee.update({ 
      employmentStatus: 'terminated', 
      isActive: false,
      terminationDate: new Date()
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Employee terminated successfully' 
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
// ============================================================================
// GET EMPLOYEE STATISTICS - FIXED VERSION

// ============================================================================
// 1. KPI CARDS - Basic Overview Stats
// ============================================================================
exports.getKpiStats = async (req, res) => {
  try {
   

    const total = await Employee.count();
    const active = await Employee.count({ where: { employmentStatus: 'active' } });
    const onLeave = await Employee.count({ where: { employmentStatus: 'on-leave' } });
    const terminated = await Employee.count({ where: { employmentStatus: 'terminated' } });

    // Document compliance for KPI
    const activeEmployees = await Employee.findAll({
      where: { employmentStatus: 'active' },
      attributes: ['employeeId']
    });
    const employeeIds = activeEmployees.map(emp => emp.employeeId);
    
    const allDocuments = await EmployeeDocument.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        documentType: { [Op.in]: ['guarantee_letter', 'id_card', 'cv', 'degree'] }
      },
      attributes: ['employeeId', 'documentType']
    });

    const employeeDocsMap = {};
    allDocuments.forEach(doc => {
      if (!employeeDocsMap[doc.employeeId]) employeeDocsMap[doc.employeeId] = new Set();
      employeeDocsMap[doc.employeeId].add(doc.documentType);
    });

    const requiredDocs = ['guarantee_letter', 'id_card', 'cv', 'degree'];
    let fullyCompliant = 0;
    activeEmployees.forEach(emp => {
      const docs = employeeDocsMap[emp.employeeId] || new Set();
      const hasAll = requiredDocs.every(doc => docs.has(doc));
      if (hasAll) fullyCompliant++;
    });

    const missingDocs = activeEmployees.length - fullyCompliant;

    res.json({
      success: true,
      data: {
        total,
        active,
        onLeave,
        terminated,
        fullyCompliant,
        missingDocs,
        complianceRate: activeEmployees.length ? ((fullyCompliant / activeEmployees.length) * 100).toFixed(1) : '0'
      }
    });
  } catch (error) {
    console.error('Get KPI stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// 2. HIRING TRENDS
// ============================================================================
exports.getHiringTrends = async (req, res) => {
  try {
    const { departmentId, months } = req.query;
    
    console.log('📊 Hiring Trends Request (EC dates):', { departmentId, months });

    // ========== GET CURRENT EC YEAR ==========
    const { convertGregorianToEthiopian } = require('../utils/dateConverter');
    const today = new Date();
    const ecToday = convertGregorianToEthiopian(today);
    
    if (!ecToday) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not convert current date to Ethiopian calendar' 
      });
    }

    const currentECYear = ecToday.year;
    const currentECMonth = ecToday.month;
    
    console.log(`📅 Current EC Year: ${currentECYear}, Month: ${currentECMonth}`);

    // Build department filter
    let deptFilter = '';
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptFilter = `AND department_id = ${parseInt(departmentId)}`;
    }

    // Determine how many months to show (default: 12 months)
    let monthsToShow = 12;
    if (months && months !== 'all' && months !== 'undefined') {
      const parsedMonths = parseInt(months);
      if (!isNaN(parsedMonths) && parsedMonths > 0) {
        monthsToShow = Math.min(parsedMonths, 12); // Max 12 months for current year
      }
    }

    // ============================================================
    // QUERY FOR HIRES - Current Year Only (Monthly)
    // ============================================================
    const hiresQuery = `
      SELECT 
        SUBSTRING(hire_date_ec FROM 4 FOR 2) as month,
        SUBSTRING(hire_date_ec FROM 7 FOR 4) as year,
        COUNT(*) as hired
      FROM employees
      WHERE hire_date_ec IS NOT NULL 
        AND SUBSTRING(hire_date_ec FROM 7 FOR 4) = '${currentECYear}'
        ${deptFilter}
      GROUP BY SUBSTRING(hire_date_ec FROM 4 FOR 2), SUBSTRING(hire_date_ec FROM 7 FOR 4)
      ORDER BY month ASC
    `;
    
    console.log('📊 Hires Query (Current Year):', hiresQuery);
    
    const hiresByMonth = await sequelize.query(hiresQuery, { type: sequelize.QueryTypes.SELECT });
    console.log('📊 Hires result:', JSON.stringify(hiresByMonth, null, 2));

    // ============================================================
    // QUERY FOR TERMINATIONS - Current Year Only (Monthly)
    // ============================================================
    const terminationsQuery = `
      SELECT 
        SUBSTRING(termination_date_ec FROM 4 FOR 2) as month,
        SUBSTRING(termination_date_ec FROM 7 FOR 4) as year,
        COUNT(*) as terminated
      FROM employees
      WHERE termination_date_ec IS NOT NULL 
        AND SUBSTRING(termination_date_ec FROM 7 FOR 4) = '${currentECYear}'
        ${deptFilter}
      GROUP BY SUBSTRING(termination_date_ec FROM 4 FOR 2), SUBSTRING(termination_date_ec FROM 7 FOR 4)
      ORDER BY month ASC
    `;
    
    console.log('📊 Terminations Query (Current Year):', terminationsQuery);
    
    const terminationsByMonth = await sequelize.query(terminationsQuery, { type: sequelize.QueryTypes.SELECT });
    console.log('📊 Terminations result:', JSON.stringify(terminationsByMonth, null, 2));

    // ============================================================
    // COMBINE RESULTS - All 13 Months of Ethiopian Calendar
    // ============================================================
    // Ethiopian calendar has 13 months
    const ethiopianMonths = [
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'
    ];
    
    const monthNames = [
      'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 
      'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
    ];

    const hiresMap = {};
    hiresByMonth.forEach(h => { 
      hiresMap[parseInt(h.month)] = parseInt(h.hired); 
    });

    const terminationsMap = {};
    terminationsByMonth.forEach(t => { 
      terminationsMap[parseInt(t.month)] = parseInt(t.terminated); 
    });

    // ✅ BUILD ALL 13 MONTHS - Show all months with zeros for future months
    const formattedData = ethiopianMonths.map((month, index) => {
      const monthNum = parseInt(month);
      const monthName = monthNames[index] || `Month ${monthNum}`;
      const isFutureMonth = monthNum > currentECMonth;
      
      return {
        month: month,
        monthName: monthName,
        hired: hiresMap[monthNum] || 0,
        terminated: terminationsMap[monthNum] || 0,
        netChange: (hiresMap[monthNum] || 0) - (terminationsMap[monthNum] || 0),
        isFutureMonth: isFutureMonth // ✅ Flag to identify future months
      };
    });

    // ✅ DO NOT FILTER - Show all 13 months, even future ones with zeros
    // This way Nehase (month 12) and Pagume (month 13) will appear

    const totalHired = formattedData.reduce((sum, m) => sum + m.hired, 0);
    const totalTerminated = formattedData.reduce((sum, m) => sum + m.terminated, 0);
    const netGrowth = totalHired - totalTerminated;

    console.log('📊 Final data (all 13 months):', JSON.stringify(formattedData, null, 2));
    console.log(`📊 Year ${currentECYear}: Total Hired:`, totalHired, 'Total Terminated:', totalTerminated, 'Net Growth:', netGrowth);

    res.json({
      success: true,
      data: {
        year: currentECYear,
        currentMonth: currentECMonth,
        trends: formattedData,
        totalHired,
        totalTerminated,
        netGrowth
      }
    });
  } catch (error) {
    console.error('❌ Get hiring trends error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// 3. DEPARTMENT DISTRIBUTION
// ============================================================================

exports.getDepartmentDistribution = async (req, res) => {
  try {
    const { page = 1, limit = 10, departmentFilter } = req.query;
    
    // ========== GET ALL DEPARTMENT STATS ==========
    const allDepartmentStats = await Employee.findAll({
      attributes: [
        'departmentId',
        [Sequelize.fn('COUNT', Sequelize.col('Employee.employee_id')), 'count']
      ],
      include: [{ model: Department, attributes: ['name', 'code'] }],
      group: ['departmentId', 'Department.department_id', 'Department.name', 'Department.code'],
      where: { employmentStatus: 'active' },
      order: [[Sequelize.literal('count'), 'DESC']]
    });

    const totalActive = await Employee.count({ where: { employmentStatus: 'active' } });
    
    const allDepartments = allDepartmentStats.map((stat, index) => ({
      departmentId: stat.departmentId,
      departmentName: stat.Department?.name || 'Unknown',
      departmentCode: stat.Department?.code || null,
      count: parseInt(stat.dataValues.count),
      percentage: totalActive > 0 ? ((parseInt(stat.dataValues.count) / totalActive) * 100).toFixed(1) : '0',
      isTop10: index < 10
    }));

    // ========== GET TOP 10 DEPARTMENT IDs ==========
    const topDepartmentIds = allDepartments
      .filter(d => d.isTop10 && d.departmentId !== null)
      .map(d => d.departmentId);

    // ========== EMPLOYEE LIST ==========
    let whereCondition = { employmentStatus: 'active' };
    if (departmentFilter && departmentFilter !== 'all') {
      whereCondition.departmentId = parseInt(departmentFilter);
    }

    const { limit: queryLimit, offset } = getPagination(page, limit,10, 100);
    
    const { count, rows: employeesList } = await Employee.findAndCountAll({
      where: whereCondition,
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail', 
        'departmentId'
      ],
      include: [{ model: Department, attributes: ['name', 'code'] }],
      order: [['departmentId', 'ASC'], ['firstName', 'ASC']],
      limit: queryLimit,
      offset: offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        departments: allDepartments,
        topDepartmentIds: topDepartmentIds,
        employeesByDepartment: {}, // ✅ ALWAYS EMPTY - NO EMPLOYEES SENT
        pagination: {
          total: count,
          page: currentPage,
          limit: queryLimit,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    });
  } catch (error) {
    console.error('Get department distribution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ============================================================================
// GET DEPARTMENT EMPLOYEES (LAZY LOADING - ONLY WHEN EXPANDED)
// ============================================================================
// ============================================================================
// GET DEPARTMENT EMPLOYEES (LAZY LOADING - ONLY WHEN EXPANDED)
// ============================================================================
exports.getDepartmentEmployees = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query; // ✅ Changed default limit to 20

    console.log(`📊 Get Department Employees - Dept: ${departmentId}, Page: ${page}, Limit: ${limit}`);

    if (!departmentId || departmentId === 'all' || departmentId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Department ID is required'
      });
    }

    const deptId = parseInt(departmentId);

    // Build where condition
    let whereCondition = {
      employmentStatus: 'active',
      departmentId: deptId
    };

    // Add search condition
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { middleName: { [Op.iLike]: `%${searchTerm}%` } },
          { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
          { phoneNumber: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };
    }

    // Get paginated employees
    const { limit: queryLimit, offset } = getPagination(page, limit, 20, 100); // ✅ Changed default to 20
    
    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereCondition,
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail',
        'phoneNumber',
        'profilePictureUrl',
        'departmentId',
        'positionId'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'] 
        }
      ],
      order: [['firstName', 'ASC']],
      limit: queryLimit,
      offset: offset,
      distinct: true
    });

    // Format employees
    const formattedEmployees = employees.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      employeeCode: emp.employeeCode,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      email: emp.workEmail,
      phone: emp.phoneNumber,
      department: emp.Department?.name || 'Unknown',
      departmentCode: emp.Department?.code || null,
      position: emp.Position?.title || 'Unknown',
      profilePictureUrl: emp.profilePictureUrl || null
    }));

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);

    // Get department info
    const department = await Department.findByPk(deptId);

    res.json({
      success: true,
      data: {
        department: {
          id: department?.departmentId,
          name: department?.name,
          code: department?.code,
          totalEmployees: count
        },
        employees: formattedEmployees,
        pagination: {
          total: count,
          page: currentPage,
          limit: queryLimit,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get department employees error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ============================================================================
// 4. EMPLOYMENT TYPE DISTRIBUTION (WITH PAGINATION & FILTER)
// ============================================================================
// ============================================================================
// 4. EMPLOYMENT TYPE DISTRIBUTION (WITHOUT EMPLOYEES BY DEFAULT)
// ============================================================================
exports.getEmploymentTypeDistribution = async (req, res) => {
  try {
    const { page = 1, limit = 10, employmentTypeFilter = 'all' } = req.query;

    // Get type stats (overview - no pagination needed)
    const typeStats = await Employee.findAll({
      attributes: [
        'employmentType',
        [Sequelize.fn('COUNT', Sequelize.col('Employee.employee_id')), 'count']
      ],
      where: { employmentStatus: 'active' },
      group: ['employmentType']
    });

    const totalActive = await Employee.count({ where: { employmentStatus: 'active' } });
    
    const types = typeStats.map(stat => ({
      type: stat.employmentType,
      count: parseInt(stat.dataValues.count),
      percentage: totalActive > 0 ? ((parseInt(stat.dataValues.count) / totalActive) * 100).toFixed(1) : '0'
    }));

    // ========== EMPLOYEES BY TYPE - EMPTY BY DEFAULT ==========
    const employeesByType = {};

    res.json({
      success: true,
      data: {
        types, // Summary stats
        employeesByType: {}, // ✅ ALWAYS EMPTY - NO EMPLOYEES SENT
        pagination: {
          total: totalActive,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  } catch (error) {
    console.error('Get employment type distribution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// GET EMPLOYMENT TYPE EMPLOYEES (LAZY LOADING - ONLY WHEN EXPANDED)
// ============================================================================
exports.getTypeEmployees = async (req, res) => {
  try {
    const { type } = req.params;
    const { search = '', departmentId = 'all' } = req.query;

    console.log(`📊 Get Type Employees - Type: ${type}, Department: ${departmentId}, Search: "${search}"`);

    if (!type || type === 'all' || type === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Employment type is required'
      });
    }

    // Build where condition
    let whereCondition = {
      employmentStatus: 'active',
      employmentType: type
    };

    // Add department filter
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      whereCondition.departmentId = parseInt(departmentId);
    }

    // Add search condition
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { middleName: { [Op.iLike]: `%${searchTerm}%` } },
          { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
          { phoneNumber: { [Op.iLike]: `%${searchTerm}%` } },
          { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };
    }

    // Get ALL employees (no pagination - scrollable list)
    const employees = await Employee.findAll({
      where: whereCondition,
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail',
        'phoneNumber',
        'profilePictureUrl',
        'departmentId',
        'positionId'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'] 
        }
      ],
      order: [['firstName', 'ASC']]
    });

    // Format employees
    const formattedEmployees = employees.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      employeeCode: emp.employeeCode,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      email: emp.workEmail,
      phone: emp.phoneNumber,
      department: emp.Department?.name || 'Unknown',
      departmentCode: emp.Department?.code || null,
      position: emp.Position?.title || 'Unknown',
      profilePictureUrl: emp.profilePictureUrl || null
    }));

    // Get type info
    const typeLabel = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'intern': 'Intern'
    }[type] || type;

    res.json({
      success: true,
      data: {
        type: {
          name: type,
          label: typeLabel,
          totalEmployees: formattedEmployees.length
        },
        employees: formattedEmployees
      }
    });

  } catch (error) {
    console.error('❌ Get type employees error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
// ============================================================================
// 5. RECENT HIRES
// ============================================================================
exports.getRecentHires = async (req, res) => {
  try {
 

    const { days = 90, departmentId } = req.query;
    const recentDays = Math.min(parseInt(days), 365);
    
    let whereCondition = {
      employmentStatus: 'active',
      hire_date: { [Op.gte]: Sequelize.literal(`NOW() - INTERVAL '${recentDays} days'`) }
    };
    
    if (departmentId && departmentId !== 'all') {
      whereCondition.departmentId = parseInt(departmentId);
    }

    const recentHires = await Employee.findAll({
      where: whereCondition,
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'workEmail', 'hire_date', 'basicSalary'],
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] }
      ],
      order: [['hire_date', 'DESC']]
    });

    const formattedHires = recentHires.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.workEmail,
      department: emp.Department?.name,
      position: emp.Position?.title,
      hireDate: emp.hire_date,
      daysSinceHire: Math.floor((new Date() - new Date(emp.hire_date)) / (1000 * 60 * 60 * 24)),
      salary: emp.basicSalary
    }));

    res.json({
      success: true,
      data: { hires: formattedHires, daysRange: recentDays, count: formattedHires.length }
    });
  } catch (error) {
    console.error('Get recent hires error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ============================================================================
// 6. SALARY ANALYSIS (WITH PAGINATION FOR EMPLOYEE LIST)
// ============================================================================
exports.getSalaryAnalysis = async (req, res) => {
  try {
    const { departmentId, page = 1, limit = 10, salaryRange } = req.query;

    let deptCondition = '';
    if (departmentId && departmentId !== 'all') {
      deptCondition = `AND department_id = ${parseInt(departmentId)}`;
    }

    // Salary Overview
    const [salaryOverview] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_employees,
        ROUND(MIN(basic_salary)::numeric, 2) as min_salary,
        ROUND(MAX(basic_salary)::numeric, 2) as max_salary,
        ROUND(AVG(basic_salary)::numeric, 2) as avg_salary,
        ROUND(SUM(basic_salary)::numeric, 2) as total_salary_pool
      FROM employees
      WHERE employment_status = 'active' AND basic_salary > 0 ${deptCondition}
    `, { type: sequelize.QueryTypes.SELECT });

    // Salary by Department
    const salaryByDepartment = await sequelize.query(`
      SELECT 
        d.name as department_name,
        COUNT(e.employee_id) as employee_count,
        ROUND(AVG(e.basic_salary)::numeric, 2) as avg_salary,
        ROUND(MIN(e.basic_salary)::numeric, 2) as min_salary,
        ROUND(MAX(e.basic_salary)::numeric, 2) as max_salary
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.employment_status = 'active' AND e.basic_salary > 0
      GROUP BY d.department_id, d.name
      ORDER BY avg_salary DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // Salary Distribution Ranges
    const salaryDistribution = await sequelize.query(`
      SELECT 
        CASE 
          WHEN basic_salary < 5000 THEN 'Under 5K'
          WHEN basic_salary BETWEEN 5000 AND 10000 THEN '5K - 10K'
          WHEN basic_salary BETWEEN 10001 AND 20000 THEN '10K - 20K'
          WHEN basic_salary BETWEEN 20001 AND 30000 THEN '20K - 30K'
          WHEN basic_salary BETWEEN 30001 AND 50000 THEN '30K - 50K'
          WHEN basic_salary BETWEEN 50001 AND 75000 THEN '50K - 75K'
          ELSE '75K+'
        END as salary_range,
        COUNT(*) as employee_count
      FROM employees
      WHERE employment_status = 'active' AND basic_salary > 0 ${deptCondition}
      GROUP BY salary_range
      ORDER BY MIN(basic_salary)
    `, { type: sequelize.QueryTypes.SELECT });

    // Highest Paid (with pagination)
    const highestPaidQuery = `
      SELECT 
        e.employee_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as full_name,
        d.name as department_name,
        e.basic_salary
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.employment_status = 'active' AND e.basic_salary > 0 ${deptCondition}
      ORDER BY e.basic_salary DESC
    `;
    
    // Apply salary range filter if provided
    let salaryRangeCondition = '';
    if (salaryRange && salaryRange !== 'all') {
      switch(salaryRange) {
        case 'Under 5K':
          salaryRangeCondition = 'AND e.basic_salary < 5000';
          break;
        case '5K - 10K':
          salaryRangeCondition = 'AND e.basic_salary BETWEEN 5000 AND 10000';
          break;
        case '10K - 20K':
          salaryRangeCondition = 'AND e.basic_salary BETWEEN 10001 AND 20000';
          break;
        case '20K - 30K':
          salaryRangeCondition = 'AND e.basic_salary BETWEEN 20001 AND 30000';
          break;
        case '30K - 50K':
          salaryRangeCondition = 'AND e.basic_salary BETWEEN 30001 AND 50000';
          break;
        case '50K - 75K':
          salaryRangeCondition = 'AND e.basic_salary BETWEEN 50001 AND 75000';
          break;
        case '75K+':
          salaryRangeCondition = 'AND e.basic_salary > 75000';
          break;
      }
    }
    
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);
    
    const paginatedHighestPaidQuery = `
      ${highestPaidQuery}
      ${salaryRangeCondition}
      LIMIT ${queryLimit} OFFSET ${offset}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      WHERE e.employment_status = 'active' AND e.basic_salary > 0 ${deptCondition} ${salaryRangeCondition}
    `;
    
    const highestPaid = await sequelize.query(paginatedHighestPaidQuery, { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    const countResult = await sequelize.query(countQuery, { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    const total = parseInt(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        overview: salaryOverview[0] || {},
        byDepartment: salaryByDepartment,
        distribution: salaryDistribution,
        highestPaid,
        pagination: {
          total: total,
          page: currentPage,
          limit: queryLimit,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    });
  } catch (error) {
    console.error('Get salary analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ============================================================================
// IMPORT EMPLOYEES FROM EXCEL (ALL DATES ARE ALREADY EC)
// ============================================================================

exports.importEmployees = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Excel file uploaded. Please upload a .xlsx or .xls file.' 
      });
    }

    // 1. Read the Excel file using xlsx library
    const workbook = XLSX.readFile(req.file.path);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 2. Convert to JSON with raw: true to keep dates as numbers
    const employeesData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '',
      raw: true,
      dateNF: 'dd/mm/yyyy'
    });

    // 3. Delete the temp file from server disk
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    // 4. Validate data
    if (!employeesData || employeesData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'The Excel file is empty or invalid' 
      });
    }

    // Filter out empty rows
    const validRows = employeesData.filter(row => {
      return row['ስም'] || row['firstName'] || row['ኢሜይል'] || row['email'];
    });

    if (validRows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid data rows found. Please ensure your first row has headers and you have data below.' 
      });
    }

    // ============================================================
    // HELPER: Validate EC date (handles strings and numbers)
    // ============================================================
    function validateECDate(value) {
      if (!value) return null;
      
      let dateStr = String(value).trim();
      
      // If it's a number like "43101", it's an Excel serial
      if (/^\d+$/.test(dateStr) && dateStr.length >= 5) {
        try {
          const excelDate = parseInt(dateStr);
          const epoch = new Date(1899, 11, 30);
          const gcDate = new Date(epoch.getTime() + (excelDate - 1) * 86400000);
          
          const { convertGregorianToEthiopian } = require('../utils/dateConverter');
          const ethDate = convertGregorianToEthiopian(gcDate);
          
          if (ethDate) {
            return `${String(ethDate.day).padStart(2, '0')}/${String(ethDate.month).padStart(2, '0')}/${ethDate.year}`;
          }
          return null;
        } catch (e) {
          console.warn('Could not convert Excel serial:', dateStr);
          return null;
        }
      }
      
      // Check if it's already in DD/MM/YYYY format (Ethiopian)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const { isValidEthiopianDate } = require('../utils/dateConverter');
        if (isValidEthiopianDate(dateStr)) {
          return dateStr;
        }
        return null;
      }
      
      // If it's in YYYY-MM-DD format (Gregorian), convert to EC
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        try {
          const gcDate = new Date(dateStr);
          const { convertGregorianToEthiopian } = require('../utils/dateConverter');
          const ethDate = convertGregorianToEthiopian(gcDate);
          if (ethDate) {
            return `${String(ethDate.day).padStart(2, '0')}/${String(ethDate.month).padStart(2, '0')}/${ethDate.year}`;
          }
          return null;
        } catch (e) {
          console.warn('Could not convert YYYY-MM-DD to EC:', dateStr);
          return null;
        }
      }
      
      return dateStr;
    }

    // ============================================================
    // HELPER: Safe parse integer (returns null for invalid values)
    // ============================================================
    const safeParseInt = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (value === 'undefined' || value === 'null') return null;
      
      const parsed = parseInt(String(value), 10);
      return (!isNaN(parsed) && parsed > 0) ? parsed : null;
    };

    // ============================================================
    // HELPER: Safe parse float (returns 0 for invalid values)
    // ============================================================
    const safeParseFloat = (value) => {
      if (value === null || value === undefined || value === '') return 0;
      if (value === 'undefined' || value === 'null') return 0;
      
      const parsed = parseFloat(String(value).replace(/,/g, ''));
      return !isNaN(parsed) ? parsed : 0;
    };

    const results = {
      success: [],
      failed: [],
      total: validRows.length,
      successCount: 0,
      failedCount: 0
    };

    // 5. Iterate over VALID Excel rows and create employees
    for (const row of validRows) {
      try {
        // ========== GET EC DATES AND CONVERT TO STRING SAFELY ==========
        const rawHireDate = row['የተቀጠረበት ቀን'] || row['hireDateEC'] || row['hireDate'] || '';
        const rawDOB = row['የትውልድ ቀን'] || row['dateOfBirthEC'] || row['dob'] || '';
        const rawConfirmation = row['የማረጋገጫ ቀን'] || row['confirmationDateEC'] || '';
        const rawTermination = row['የማቋረጫ ቀን'] || row['terminationDateEC'] || '';

        // Convert to proper EC date strings
        const hireDateEC = validateECDate(rawHireDate);
        const dateOfBirthEC = validateECDate(rawDOB);
        const confirmationDateEC = validateECDate(rawConfirmation);
        const terminationDateEC = validateECDate(rawTermination);

        // ========== DEBUG LOG ==========
        console.log('📅 Date debug:', {
          rawHireDate,
          hireDateEC,
          rawDOB,
          dateOfBirthEC
        });

        // ========== VALIDATE EC DATES ==========
        const { isValidEthiopianDate } = require('../utils/dateConverter');
        
        if (hireDateEC && typeof hireDateEC === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(hireDateEC)) {
          if (!isValidEthiopianDate(hireDateEC)) {
            results.failed.push({ 
              data: row, 
              error: `Invalid Ethiopian hire date: ${hireDateEC}. Use format DD/MM/YYYY` 
            });
            results.failedCount++;
            continue;
          }
        } else if (hireDateEC && typeof hireDateEC === 'string' && !/^\d{2}\/\d{2}\/\d{4}$/.test(hireDateEC)) {
          console.warn(`⚠️ Date not in DD/MM/YYYY format: ${hireDateEC}`);
        }
        
        if (dateOfBirthEC && typeof dateOfBirthEC === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateOfBirthEC)) {
          if (!isValidEthiopianDate(dateOfBirthEC)) {
            results.failed.push({ 
              data: row, 
              error: `Invalid Ethiopian date of birth: ${dateOfBirthEC}. Use format DD/MM/YYYY` 
            });
            results.failedCount++;
            continue;
          }
        }

        // ========== MAP EXCEL HEADERS TO INTERNAL FIELDS ==========
        const empData = {
          // Basic Info - Ethiopian Names
          firstName: row['ስም'] || row['firstName'] || '',
          lastName: row['የአባት ስም'] || row['lastName'] || '',
          middleName: row['የአያት ስም'] || row['middleName'] || null,
          
          // English Full Name
          fullNameEnglish: row['የእንግሊዝኛ ሙሉ ስም'] || row['fullNameEnglish'] || null,
          
          // Contact Info
          email: row['ኢሜይል'] || row['email'] || '',
          personalEmail: row['የግል ኢሜይል'] || row['personalEmail'] || null,
          phone: row['ስልክ'] || row['phone'] || '',
          
          // ========== EC DATES (AS-IS FROM EXCEL) ==========
          hireDateEC: hireDateEC,
          dateOfBirthEC: dateOfBirthEC,
          confirmationDateEC: confirmationDateEC,
          terminationDateEC: terminationDateEC,
          
          // Employment - Using safeParseInt for optional fields
          departmentId: safeParseInt(row['ክፍል መለያ'] || row['departmentId']),
          positionId: safeParseInt(row['ሹመት መለያ'] || row['positionId']),
          // ✅ managerId is ALWAYS null - completely removed from import
          managerId: null,
          employmentType: row['የሥራ ዓይነት'] || row['employmentType'] || 'full-time',
          
          // Personal Details
          gender: row['ፆታ'] || row['gender'] || null,
          maritalStatus: row['የጋብቻ ሁኔታ'] || row['maritalStatus'] || null,
          nationality: row['ዜግነት'] || row['nationality'] || null,
          nationalId: row['ብሄራዊ መታወቂያ'] || row['nationalId'] || null,
          
          // Salary & Allowances - Using safeParseFloat
          basicSalary: safeParseFloat(row['መሰረታዊ ደሞዝ'] || row['salary']),
          housingAllowance: safeParseFloat(row['የቤት አበል'] || row['housingAllowance']),
          positionAllowance: safeParseFloat(row['የሹመት አበል'] || row['positionAllowance']),
          transportAllowance: safeParseFloat(row['የትራንስፖርት አበል'] || row['transportAllowance']),
          mobileAllowance: safeParseFloat(row['የሞባይል አበል'] || row['mobileAllowance']),
          
          // Address
          address: row['አድራሻ'] || row['address'] || null,
          workLocation: row['የሥራ ቦታ'] || row['workLocation'] || null
        };

        // Validate required fields
        if (!empData.firstName || !empData.lastName || !empData.email || !empData.phone || 
            !empData.departmentId || !empData.positionId || !empData.employmentType || !empData.hireDateEC) {
          results.failed.push({ 
            data: empData, 
            error: `Missing required fields: firstName=${empData.firstName}, lastName=${empData.lastName}, email=${empData.email}, phone=${empData.phone}, departmentId=${empData.departmentId}, positionId=${empData.positionId}, employmentType=${empData.employmentType}, hireDateEC=${empData.hireDateEC}` 
          });
          results.failedCount++;
          continue;
        }

        // Check for duplicate email
        const existingEmployee = await Employee.findOne({ where: { workEmail: empData.email } });
        if (existingEmployee) {
          results.failed.push({ data: empData, error: `Employee with email "${empData.email}" already exists` });
          results.failedCount++;
          continue;
        }

        // ========== AUTO-CREATE USER ACCOUNT ==========
        let user = await User.findOne({ where: { email: empData.email } });
        let isNewUser = false;
        let temporaryPassword = null;

        if (!user) {
          isNewUser = true;
          const username = await generateUniqueUsername(empData.email, empData.firstName, empData.lastName);
          temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
          const employeeRole = await Role.findOne({ where: { name: 'employee' } });
          const employeeRoleId = employeeRole ? employeeRole.roleId : 3;
          
          user = await User.create({
            username,
            email: empData.email,
            fullName: `${empData.firstName} ${empData.lastName}`,
            passwordHash: hashedPassword,
            roleId: employeeRoleId,
            departmentId: empData.departmentId || null,
            isActive: true,
            createdBy: req.user?.userId || null
          });
        }

        // Generate employee code
        const employeeCode = await generateEmployeeCode();

        // ========== CONVERT EC TO GC FOR BACKEND STORAGE ==========
        const { convertEthiopianToGregorian } = require('../utils/dateConverter');
        
        const hireDateGC = (hireDateEC && typeof hireDateEC === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(hireDateEC)) 
          ? convertEthiopianToGregorian(hireDateEC) 
          : null;
          
        const dobGC = (dateOfBirthEC && typeof dateOfBirthEC === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateOfBirthEC)) 
          ? convertEthiopianToGregorian(dateOfBirthEC) 
          : null;
          
        const confirmationGC = (confirmationDateEC && typeof confirmationDateEC === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(confirmationDateEC)) 
          ? convertEthiopianToGregorian(confirmationDateEC) 
          : null;
          
        const terminationGC = (terminationDateEC && typeof terminationDateEC === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(terminationDateEC)) 
          ? convertEthiopianToGregorian(terminationDateEC) 
          : null;

        // ========== CREATE EMPLOYEE ==========
        const employee = await Employee.create({
          employeeCode,
          userId: user.userId,
          firstName: empData.firstName,
          lastName: empData.lastName,
          middleName: empData.middleName || null,
          fullNameEnglish: empData.fullNameEnglish || `${empData.firstName} ${empData.lastName}`,
          workEmail: empData.email,
          personalEmail: empData.personalEmail || null,
          phoneNumber: empData.phone,
          
          // ========== EC DATES (PRIMARY - STORED AS-IS) ==========
          hireDateEC: hireDateEC,
          dateOfBirthEC: dateOfBirthEC,
          confirmationDateEC: confirmationDateEC,
          terminationDateEC: terminationDateEC,
          
          // ========== GC DATES (SECONDARY - CONVERTED FOR BACKEND) ==========
          hireDateGC: hireDateGC,
          dateOfBirthGC: dobGC,
          confirmationDateGC: confirmationGC,
          terminationDateGC: terminationGC,
          
          // Backward compatibility
          hireDate: hireDateGC,
          dateOfBirth: dobGC,
          confirmationDate: confirmationGC,
          terminationDate: terminationGC,
          
          gender: empData.gender || null,
          maritalStatus: empData.maritalStatus || null,
          nationality: empData.nationality || null,
          nationalId: empData.nationalId || null,
          departmentId: empData.departmentId,
          positionId: empData.positionId,
          // ✅ managerId is ALWAYS null - completely removed from import
          managerId: null,
          employmentType: empData.employmentType,
          employmentStatus: 'active',
          workLocation: empData.workLocation || null,
          basicSalary: empData.basicSalary || 0,
          housingAllowance: empData.housingAllowance || 0,
          positionAllowance: empData.positionAllowance || 0,
          transportAllowance: empData.transportAllowance || 0,
          mobileAllowance: empData.mobileAllowance || 0,
          currentAddress: empData.address ? { street: empData.address } : {},
          isActive: true
        });

        // Calculate totals
        const totalAllowances = (empData.housingAllowance || 0) + 
                               (empData.positionAllowance || 0) + 
                               (empData.transportAllowance || 0) + 
                               (empData.mobileAllowance || 0);

        results.success.push({
          id: employee.employeeId,
          employeeId: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          fullNameEnglish: employee.fullNameEnglish,
          email: employee.workEmail,
          hireDateEC: employee.hireDateEC,
          dateOfBirthEC: employee.dateOfBirthEC,
          basicSalary: empData.basicSalary || 0,
          allowances: {
            housing: empData.housingAllowance || 0,
            position: empData.positionAllowance || 0,
            transport: empData.transportAllowance || 0,
            mobile: empData.mobileAllowance || 0,
            total: totalAllowances
          },
          grossPay: (empData.basicSalary || 0) + totalAllowances,
          temporaryPassword: isNewUser ? temporaryPassword : null
        });
        
        results.successCount++;

      } catch (error) {
        console.error('Error importing employee:', error);
        results.failed.push({ 
          data: row, 
          error: error.message 
        });
        results.failedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed: ${results.successCount} successful, ${results.failedCount} failed`,
      data: results,
      summary: {
        total: results.total,
        success: results.successCount,
        failed: results.failedCount,
        successRate: results.total > 0 ? ((results.successCount / results.total) * 100).toFixed(1) : '0'
      }
    });

  } catch (error) {
    console.error('Import employees error:', error);
    if (req.file) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


exports.createEmployee = async (req, res) => {
  try {
    // Parse form data - ALL fields from frontend
    const {
      firstName, lastName, middleName, email, phone, dob, gender, fullNameEnglish,
      maritalStatus, nationality, nationalId, departmentId, positionId, managerId,
      employmentType, hireDate, salary, address, workLocation,
      personalEmail, emergencyContact, bankAccount,
      housingAllowance, positionAllowance, transportAllowance, mobileAllowance,
      birthPlace, mothersFullName, spouseInfo, children, parentSupport,
      education, training, workExperience, languageSkills, otherSkills,
      nationalityAcquisition, healthInfo, legalInfo, guaranteeInfo,
      parentsInfo, emergencyContactAddress, currentCompany, permanentAddress,
      nationalIdDocument,
      
      // ========== ETHIOPIAN CALENDAR DATES (from frontend) ==========
      hireDateEC,
      dateOfBirthEC,
      confirmationDateEC,
      terminationDateEC
    } = req.body;

    // ========== DEBUG LOGS ==========
    console.log('🔍 Backend received EC dates:', { 
      hireDateEC, 
      dateOfBirthEC,
      confirmationDateEC,
      terminationDateEC
    });
    console.log('🔍 Basic info:', { firstName, lastName, email, departmentId, positionId, employmentType });

    // ========== VALIDATE EC DATES ==========
    const { isValidEthiopianDate, convertEthiopianToGregorian } = require('../utils/dateConverter');

    // Validate EC dates if provided
    if (hireDateEC && !isValidEthiopianDate(hireDateEC)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Ethiopian hire date: ${hireDateEC}. Use format DD/MM/YYYY`
      });
    }
    
    if (dateOfBirthEC && !isValidEthiopianDate(dateOfBirthEC)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Ethiopian date of birth: ${dateOfBirthEC}. Use format DD/MM/YYYY`
      });
    }

    if (confirmationDateEC && !isValidEthiopianDate(confirmationDateEC)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Ethiopian confirmation date: ${confirmationDateEC}. Use format DD/MM/YYYY`
      });
    }

    if (terminationDateEC && !isValidEthiopianDate(terminationDateEC)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Ethiopian termination date: ${terminationDateEC}. Use format DD/MM/YYYY`
      });
    }

    // ========== CONVERT EC TO GC ==========
    const convertedHireDateGC = convertEthiopianToGregorian(hireDateEC);
    const convertedDobGC = convertEthiopianToGregorian(dateOfBirthEC);
    const convertedConfirmationGC = convertEthiopianToGregorian(confirmationDateEC);
    const convertedTerminationGC = convertEthiopianToGregorian(terminationDateEC);

    console.log('✅ Converted GC dates:', { 
      convertedHireDateGC, 
      convertedDobGC,
      convertedConfirmationGC,
      convertedTerminationGC
    });

    // Validate required fields
    if (!firstName || !lastName || !departmentId || !positionId || !employmentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, departmentId, positionId, employmentType'
      });
    }

    // Hire date is required (EC format)
    if (!hireDateEC) {
      return res.status(400).json({
        success: false,
        error: 'Hire date is required (Ethiopian calendar)'
      });
    }

    // Check for duplicate email
    if (email) {
      const existingEmployee = await Employee.findOne({ 
        where: { workEmail: email } 
      });
      
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          error: `Employee with email "${email}" already exists.`
        });
      }
    }
    
    // Auto-create or find existing user
    let user = null;
    let isNewUser = false;
    
    if (email) {
      user = await User.findOne({ where: { email: email } });
    }
    
    if (!user && email) {
      isNewUser = true;
      const username = await generateUniqueUsername(email, firstName, lastName);
      const defaultPassword = 'password123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const employeeRole = await Role.findOne({ where: { name: 'employee' } });
      const employeeRoleId = employeeRole ? employeeRole.roleId : 3;
      
      user = await User.create({
        username: username,
        email: email,
        fullName: `${firstName} ${lastName}`,
        passwordHash: hashedPassword,
        roleId: employeeRoleId,
        departmentId: departmentId || null,
        isActive: true,
        createdBy: req.user?.userId || null
      });
    }

    // Generate employee code
    const employeeCode = await generateEmployeeCode();
    
    // Parse basic salary
    const basicSalary = salary ? parseFloat(salary) : 0;
    
    // Parse allowances
    const finalHousingAllowance = housingAllowance !== undefined && housingAllowance !== '' ? parseFloat(housingAllowance) : 0;
    const finalPositionAllowance = positionAllowance !== undefined && positionAllowance !== '' ? parseFloat(positionAllowance) : 0;
    const finalTransportAllowance = transportAllowance !== undefined && transportAllowance !== '' ? parseFloat(transportAllowance) : 0;
    const finalMobileAllowance = mobileAllowance !== undefined && mobileAllowance !== '' ? parseFloat(mobileAllowance) : 0;

    // Parse JSON strings
    let parsedEmergencyContact = emergencyContact;
    let parsedBankAccount = bankAccount;
    let parsedBirthPlace = birthPlace;
    let parsedSpouseInfo = spouseInfo;
    let parsedChildren = children;
    let parsedParentSupport = parentSupport;
    let parsedEducation = education;
    let parsedTraining = training;
    let parsedWorkExperience = workExperience;
    let parsedLanguageSkills = languageSkills;
    let parsedNationalityAcquisition = nationalityAcquisition;
    let parsedHealthInfo = healthInfo;
    let parsedLegalInfo = legalInfo;
    let parsedGuaranteeInfo = guaranteeInfo;
    let parsedParentsInfo = parentsInfo;
    let parsedEmergencyContactAddress = emergencyContactAddress;
    let parsedCurrentCompany = currentCompany;
    let parsedPermanentAddress = permanentAddress;
    let parsedNationalIdDocument = nationalIdDocument;

    if (emergencyContact && typeof emergencyContact === 'string') {
      try { parsedEmergencyContact = JSON.parse(emergencyContact); } catch (e) { parsedEmergencyContact = {}; }
    }
    if (bankAccount && typeof bankAccount === 'string') {
      try { parsedBankAccount = JSON.parse(bankAccount); } catch (e) { parsedBankAccount = {}; }
    }
    if (birthPlace && typeof birthPlace === 'string') {
      try { parsedBirthPlace = JSON.parse(birthPlace); } catch (e) { parsedBirthPlace = {}; }
    }
    if (spouseInfo && typeof spouseInfo === 'string') {
      try { parsedSpouseInfo = JSON.parse(spouseInfo); } catch (e) { parsedSpouseInfo = {}; }
    }
    if (children && typeof children === 'string') {
      try { parsedChildren = JSON.parse(children); } catch (e) { parsedChildren = []; }
    }
    if (parentSupport && typeof parentSupport === 'string') {
      try { parsedParentSupport = JSON.parse(parentSupport); } catch (e) { parsedParentSupport = []; }
    }
    if (education && typeof education === 'string') {
      try { parsedEducation = JSON.parse(education); } catch (e) { parsedEducation = []; }
    }
    if (training && typeof training === 'string') {
      try { parsedTraining = JSON.parse(training); } catch (e) { parsedTraining = []; }
    }
    if (workExperience && typeof workExperience === 'string') {
      try { parsedWorkExperience = JSON.parse(workExperience); } catch (e) { parsedWorkExperience = []; }
    }
    if (languageSkills && typeof languageSkills === 'string') {
      try { parsedLanguageSkills = JSON.parse(languageSkills); } catch (e) { parsedLanguageSkills = []; }
    }
    if (nationalityAcquisition && typeof nationalityAcquisition === 'string') {
      try { parsedNationalityAcquisition = JSON.parse(nationalityAcquisition); } catch (e) { parsedNationalityAcquisition = {}; }
    }
    if (healthInfo && typeof healthInfo === 'string') {
      try { parsedHealthInfo = JSON.parse(healthInfo); } catch (e) { parsedHealthInfo = {}; }
    }
    if (legalInfo && typeof legalInfo === 'string') {
      try { parsedLegalInfo = JSON.parse(legalInfo); } catch (e) { parsedLegalInfo = {}; }
    }
    if (guaranteeInfo && typeof guaranteeInfo === 'string') {
      try { parsedGuaranteeInfo = JSON.parse(guaranteeInfo); } catch (e) { parsedGuaranteeInfo = []; }
    }
    if (parentsInfo && typeof parentsInfo === 'string') {
      try { parsedParentsInfo = JSON.parse(parentsInfo); } catch (e) { parsedParentsInfo = {}; }
    }
    if (emergencyContactAddress && typeof emergencyContactAddress === 'string') {
      try { parsedEmergencyContactAddress = JSON.parse(emergencyContactAddress); } catch (e) { parsedEmergencyContactAddress = {}; }
    }
    if (currentCompany && typeof currentCompany === 'string') {
      try { parsedCurrentCompany = JSON.parse(currentCompany); } catch (e) { parsedCurrentCompany = {}; }
    }
    if (permanentAddress && typeof permanentAddress === 'string') {
      try { parsedPermanentAddress = JSON.parse(permanentAddress); } catch (e) { parsedPermanentAddress = {}; }
    }
    if (nationalIdDocument && typeof nationalIdDocument === 'string') {
      try { parsedNationalIdDocument = JSON.parse(nationalIdDocument); } catch (e) { parsedNationalIdDocument = {}; }
    }

    // Create employee with ALL fields including Ethiopian calendar
    const employee = await Employee.create({
      // Basic Info
      employeeCode,
      userId: user ? user.userId : null,
      firstName,
      lastName,
      middleName: middleName || null,
      fullNameEnglish: fullNameEnglish || null,
      workEmail: email || null,
      personalEmail: personalEmail || null,
      phoneNumber: phone || null,
      
      // ========== DATES ==========
      // Ethiopian Calendar (Primary - from frontend)
      hireDateEC: hireDateEC || null,
      dateOfBirthEC: dateOfBirthEC || null,
      confirmationDateEC: confirmationDateEC || null,
      terminationDateEC: terminationDateEC || null,
      
      // Gregorian Calendar (Secondary - converted)
      hireDateGC: convertedHireDateGC,
      dateOfBirthGC: convertedDobGC,
      confirmationDateGC: convertedConfirmationGC,
      terminationDateGC: convertedTerminationGC,
      
      // Backward compatibility (old fields)
      hireDate: convertedHireDateGC,
      dateOfBirth: convertedDobGC,
      confirmationDate: convertedConfirmationGC,
      terminationDate: convertedTerminationGC,
      
      gender: gender || null,
      maritalStatus: maritalStatus || null,
      nationality: nationality || null,
      nationalId: nationalId || null,
      
      // National ID Document
      nationalIdDocument: parsedNationalIdDocument || {},
      
      // Employment
      departmentId: departmentId ? parseInt(departmentId) : null,
      positionId: positionId ? parseInt(positionId) : null,
      // ✅ managerId is OPTIONAL - set to null if not provided
      managerId: managerId ? parseInt(managerId) : null,
      employmentType: employmentType || null,
      employmentStatus: 'active',
      workLocation: workLocation || null,
      
      // Salary & Allowances
      basicSalary: basicSalary,
      housingAllowance: finalHousingAllowance,
      positionAllowance: finalPositionAllowance,
      transportAllowance: finalTransportAllowance,
      mobileAllowance: finalMobileAllowance,
      
      // Addresses
      currentAddress: address ? { street: address } : {},
      permanentAddress: parsedPermanentAddress || {},
      birthPlace: parsedBirthPlace || {},
      
      // Financial
      bankAccount: parsedBankAccount || {},
      
      // Emergency
      emergencyContact: parsedEmergencyContact || {},
      emergencyContactAddress: parsedEmergencyContactAddress || {},
      
      // Family
      mothersFullName: mothersFullName || null,
      spouseInfo: parsedSpouseInfo || {},
      children: parsedChildren || [],
      parentSupport: parsedParentSupport || [],
      parentsInfo: parsedParentsInfo || {},
      
      // Education & Training
      education: parsedEducation || [],
      training: parsedTraining || [],
      workExperience: parsedWorkExperience || [],
      
      // Skills
      languageSkills: parsedLanguageSkills || [],
      otherSkills: otherSkills || null,
      
      // Nationality
      nationalityAcquisition: parsedNationalityAcquisition || {},
      
      // Health & Legal
      healthInfo: parsedHealthInfo || {},
      legalInfo: parsedLegalInfo || {},
      
      // Guarantee
      guaranteeInfo: parsedGuaranteeInfo || [],
      
      // Company
      currentCompany: parsedCurrentCompany || {},
      
      // Profile
      profilePictureUrl: null,
      isActive: true
    });

    console.log('✅ Employee created successfully with ID:', employee.employeeId);
    console.log('📅 Stored EC dates:', { 
      hireDateEC: employee.hireDateEC, 
      dateOfBirthEC: employee.dateOfBirthEC 
    });
    console.log('📅 Stored GC dates:', { 
      hireDateGC: employee.hireDateGC, 
      dateOfBirthGC: employee.dateOfBirthGC 
    });

    // Prepare response
    const responseData = {
      id: employee.employeeId,
      employeeId: employee.employeeCode,
      fullName: `${employee.firstName} ${employee.lastName}`,
      profilePicture: null,
      
      // Return both calendars in response
      hireDateEC: employee.hireDateEC,
      hireDateGC: employee.hireDateGC,
      dateOfBirthEC: employee.dateOfBirthEC,
      dateOfBirthGC: employee.dateOfBirthGC,
      
      allowances: {
        housing: parseFloat(employee.housingAllowance) || 0,
        position: parseFloat(employee.positionAllowance) || 0,
        transport: parseFloat(employee.transportAllowance) || 0,
        mobile: parseFloat(employee.mobileAllowance) || 0,
        total: (parseFloat(employee.housingAllowance) || 0) + 
               (parseFloat(employee.positionAllowance) || 0) + 
               (parseFloat(employee.transportAllowance) || 0) +
               (parseFloat(employee.mobileAllowance) || 0),
      },
      user: user ? {
        id: user.userId,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        isNewUser: isNewUser
      } : null
    };
    
    if (isNewUser) {
      responseData.message = `Employee created successfully. Default password is "password123".`;
    } else if (user) {
      responseData.message = 'Employee created and linked to existing user successfully';
    } else {
      responseData.message = 'Employee created successfully without user account';
    }

    res.status(201).json({
      success: true,
      message: responseData.message,
      data: responseData
    });
    
  } catch (error) {
    console.error('=== CREATE EMPLOYEE ERROR DETAILS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry error',
        details: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};

// ==================== GET EMPLOYEE COMPENSATION HISTORY ====================
exports.getEmployeeCompensationHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Import your date converter functions
    const { convertGregorianToEthiopian, getEthiopianMonthName } = require('../utils/dateConverter');

    const histories = await CompensationHistory.findAndCountAll({
      where: { employee_id: employeeId },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'first_name', 'last_name', 'employee_code']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['userId', 'fullName']
        }
      ],
      order: [['effective_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response for frontend with Ethiopian Calendar dates
    const formattedHistories = histories.rows.map(history => {
      // Convert Gregorian date to Ethiopian Calendar
      let ethDate = null;
      let ethiopianDateStr = null;
      let ethDateParts = null;
      
      if (history.effective_date) {
        try {
          const dateObj = new Date(history.effective_date);
          if (!isNaN(dateObj.getTime())) {
            ethDate = convertGregorianToEthiopian(dateObj);
            if (ethDate) {
              ethiopianDateStr = `${String(ethDate.day).padStart(2, '0')}/${String(ethDate.month).padStart(2, '0')}/${ethDate.year}`;
              ethDateParts = {
                day: String(ethDate.day).padStart(2, '0'),
                month: ethDate.month,
                monthName: getEthiopianMonthName(ethDate.month, 'am'),
                monthNameEn: getEthiopianMonthName(ethDate.month, 'en'),
                year: ethDate.year
              };
            }
          }
        } catch (e) {
          console.error('Error converting date:', e);
        }
      }

      // Determine change type
      const oldVal = parseFloat(history.old_value) || 0;
      const newVal = parseFloat(history.new_value) || 0;
      const changeType = newVal > oldVal ? 'increase' : (newVal < oldVal ? 'decrease' : 'no_change');

      return {
        id: history.history_id,
        employeeId: history.employee_id,
        component: history.component_type,
        componentKey: history.component_type.replace(/\s+/g, '').toLowerCase(),
        oldValue: oldVal,
        newValue: newVal,
        percentageChange: parseFloat(history.change_percent) || 0,
        // Gregorian date (for backend/sorting)
        changeDate: history.effective_date,
        changeDateGC: history.effective_date,
        // Ethiopian Calendar date (for display)
        changeDateEC: ethiopianDateStr,
        changeDateECParts: ethDateParts,
        // For timeline display
        changeDay: ethDateParts?.day || '--',
        changeMonth: ethDateParts?.monthName || '---',
        changeMonthEn: ethDateParts?.monthNameEn || '---',
        changeYear: ethDateParts?.year || '----',
        reason: history.reason,
        submittedBy: history.approver?.fullName || 'System',
        changeType: changeType,
        difference: Math.abs(newVal - oldVal)
      };
    });

    res.json({
      success: true,
      data: formattedHistories,
      pagination: {
        total: histories.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalPages: Math.ceil(histories.count / limit)
      }
    });

  } catch (error) {
    console.error('Get employee compensation history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ============================================================================
// 8. GET HIRING DETAILS - FIXED (Checks status AND dates)
// ============================================================================

exports.getHiringDetails = async (req, res) => {
  try {
    const { departmentId, months } = req.query;
    
    console.log('📊 Hiring Details Request (EC dates):', { departmentId, months });
    
    // Build where conditions for HIRED - use hireDateEC
    let hireWhere = {
      hireDateEC: { [Op.ne]: null }
    };
    
    // Build where conditions for TERMINATED - Check status OR EC date
    let terminationWhere = {
      [Op.or]: [
        { employmentStatus: 'terminated' },
        { terminationDateEC: { [Op.ne]: null } }
      ]
    };
    
    // Add department filter
    if (departmentId && departmentId !== 'all' && departmentId !== 'null' && departmentId !== 'undefined') {
      const deptId = parseInt(departmentId);
      hireWhere.departmentId = deptId;
      terminationWhere.departmentId = deptId;
    }
    
    // ============================================================
    // EC DATE FILTER - Convert months to EC years/months
    // ============================================================
    if (months && months !== 'all' && months !== 'undefined' && months !== 'null') {
      const monthsValue = parseInt(months);
      if (!isNaN(monthsValue) && monthsValue > 0) {
        // Get current EC date
        const { convertGregorianToEthiopian } = require('../utils/dateConverter');
        const today = new Date();
        const ecToday = convertGregorianToEthiopian(today);
        
        if (ecToday) {
          // Calculate EC date months ago
          let targetECYear = ecToday.year;
          let targetECMonth = ecToday.month - monthsValue;
          
          while (targetECMonth <= 0) {
            targetECMonth += 13; // Ethiopian has 13 months
            targetECYear--;
          }
          
          // Create the date string for filtering (DD/MM/YYYY)
          const targetDateStr = `01/${String(targetECMonth).padStart(2, '0')}/${targetECYear}`;
          
          console.log(`📊 Filtering EC dates from: ${targetDateStr}`);
          
          // For hired employees: hireDateEC >= target date
          hireWhere.hireDateEC = { [Op.gte]: targetDateStr };
          
          // For terminated: we keep the OR condition with status check
          // Don't filter by date for terminated since we check status
        }
      }
    }
    
    console.log('📊 Hire Where (EC):', JSON.stringify(hireWhere, null, 2));
    console.log('📊 Termination Where (EC):', JSON.stringify(terminationWhere, null, 2));
    
    // Get hired employees (sorted by EC date)
    const hiredEmployees = await Employee.findAll({
      where: hireWhere,
      attributes: [
        'employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName', 
        'fullNameEnglish', 'workEmail', 'phoneNumber', 'basicSalary', 
        'profilePictureUrl', 'hireDateEC', 'hireDateGC'
      ],
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] }
      ],
      order: [['hireDateEC', 'DESC']]
    });
    
    // Get terminated employees (sorted by EC date)
    const terminatedEmployees = await Employee.findAll({
      where: terminationWhere,
      attributes: [
        'employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName',
        'fullNameEnglish', 'workEmail', 'phoneNumber', 'basicSalary',
        'profilePictureUrl', 'terminationDateEC', 'terminationDateGC', 'employmentStatus'
      ],
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] }
      ],
      order: [['terminationDateEC', 'DESC']]
    });
    
    // Format the response with EC dates
    const formattedHired = hiredEmployees.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      fullNameEnglish: emp.fullNameEnglish,
      email: emp.workEmail,
      phone: emp.phoneNumber,
      department: emp.Department?.name || 'Unknown',
      position: emp.Position?.title || 'Unknown',
      hireDate: emp.hireDateEC,  // EC date
      hireDateGC: emp.hireDateGC, // GC date for reference
      salary: emp.basicSalary,
      profilePictureUrl: emp.profilePictureUrl
    }));
    
    const formattedTerminated = terminatedEmployees.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      fullNameEnglish: emp.fullNameEnglish,
      email: emp.workEmail,
      phone: emp.phoneNumber,
      department: emp.Department?.name || 'Unknown',
      position: emp.Position?.title || 'Unknown',
      terminationDate: emp.terminationDateEC,  // EC date
      terminationDateGC: emp.terminationDateGC, // GC date for reference
      salary: emp.basicSalary,
      profilePictureUrl: emp.profilePictureUrl,
      status: emp.employmentStatus
    }));
    
    console.log(`📊 Found ${formattedHired.length} hired employees (EC)`);
    console.log(`📊 Found ${formattedTerminated.length} terminated employees (EC)`);
    
    res.json({
      success: true,
      data: {
        hired: formattedHired,
        terminated: formattedTerminated,
        summary: {
          totalHired: formattedHired.length,
          totalTerminated: formattedTerminated.length,
          netGrowth: formattedHired.length - formattedTerminated.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Get hiring details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// ============================================================================
// UPLOAD EMPLOYEE DOCUMENT - FULLY UPDATED (Supports multiple documents)
// ============================================================================

exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { subType, index, description, documentName } = req.body;
    const documentType = type;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // ================================================================
    // DOCUMENT TYPES THAT SUPPORT MULTIPLE DOCUMENTS (NO REPLACEMENT)
    // ================================================================
    const multiDocumentTypes = [
      'custom_document',
      'employment_letter',
      'other_document',
      'guarantee_letter',
      'sdt_letter',
      'guarantee_other'
    ];
    
    // ================================================================
    // HANDLE MULTI-DOCUMENT TYPES - ALWAYS CREATE NEW
    // ================================================================
    if (multiDocumentTypes.includes(documentType)) {
      console.log(`📄 Uploading ${documentType} for employee:`, id);
      
      // Find the next available index for this document type
      const existingDocs = await EmployeeDocument.findAll({
        where: {
          employeeId: id,
          documentType: documentType
        },
        attributes: ['index'],
        order: [['index', 'DESC']]
      });
      
      let nextIndex = 0;
      if (existingDocs.length > 0) {
        const maxIndex = Math.max(...existingDocs.map(doc => doc.index || 0));
        nextIndex = maxIndex + 1;
      }
      
      console.log(`📄 Next ${documentType} index: ${nextIndex}`);
      
      // Determine folder
      let folder = 'other_documents';
      if (documentType === 'guarantee_letter' || documentType === 'sdt_letter' || documentType === 'guarantee_other') {
        folder = 'guarantees';
      } else if (documentType === 'employment_letter') {
        folder = 'employment_letters';
      } else if (documentType === 'custom_document') {
        folder = 'other_documents';
      }
      
      const relativePath = `/uploads/documents/${folder}/${req.file.filename}`;
      const absoluteUrl = `${baseUrl}${relativePath}`;
      
      // Use custom name if provided, otherwise use original filename
      const customName = documentName || req.body.documentName || req.file.originalname;
      
      // ✅ CREATE NEW DOCUMENT (don't delete anything)
      const document = await EmployeeDocument.create({
        employeeId: id,
        documentType: documentType,
        subType: subType || null,
        index: nextIndex,
        documentName: customName,
        fileName: req.file.filename,
        fileUrl: absoluteUrl,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log(`✅ ${documentType} created with ID: ${document.documentId}, Index: ${nextIndex}`);
      
      // ================================================================
      // SPECIAL HANDLING FOR GUARANTEE DOCUMENTS - Update JSONB
      // ================================================================
      if (['guarantee_letter', 'sdt_letter', 'guarantee_other'].includes(documentType)) {
        const guarantees = employee.guaranteeInfo || [];
        const guarIdx = (index !== undefined && index !== null && index !== '' && index !== 'null') 
          ? parseInt(index) 
          : 0;
        
        const fieldMap = {
          'guarantee_letter': 'guaranteeLetterUrls',
          'sdt_letter': 'sdtLetterUrls',
          'guarantee_other': 'otherDocumentUrls'
        };
        const field = fieldMap[documentType];
        
        if (guarantees[guarIdx]) {
          // Initialize array if it doesn't exist
          if (!guarantees[guarIdx][field]) {
            guarantees[guarIdx][field] = [];
          }
          
          // ✅ Add new document to the array (don't replace)
          guarantees[guarIdx][field].push({
            documentId: document.documentId,
            fileUrl: absoluteUrl,
            fileName: req.file.originalname,
            uploadedAt: new Date().toISOString()
          });
          
          // For backward compatibility, keep the first URL as the main one
          if (!guarantees[guarIdx]['guaranteeLetterUrl'] && documentType === 'guarantee_letter') {
            guarantees[guarIdx]['guaranteeLetterUrl'] = absoluteUrl;
            guarantees[guarIdx]['guaranteeLetterDocumentId'] = document.documentId;
          }
          if (!guarantees[guarIdx]['sdtLetterUrl'] && documentType === 'sdt_letter') {
            guarantees[guarIdx]['sdtLetterUrl'] = absoluteUrl;
            guarantees[guarIdx]['sdtLetterDocumentId'] = document.documentId;
          }
          if (!guarantees[guarIdx]['otherDocumentUrl'] && documentType === 'guarantee_other') {
            guarantees[guarIdx]['otherDocumentUrl'] = absoluteUrl;
            guarantees[guarIdx]['otherDocumentDocumentId'] = document.documentId;
          }
          
          await employee.update({ guaranteeInfo: guarantees });
        }
      }
      
      // ================================================================
      // SPECIAL HANDLING FOR EMPLOYMENT LETTER - Update JSONB if needed
      // ================================================================
      if (documentType === 'employment_letter') {
        // You can store employment letters in a separate array in employee JSONB
        const employmentLetters = employee.employmentLetters || [];
        employmentLetters.push({
          documentId: document.documentId,
          fileUrl: absoluteUrl,
          fileName: req.file.originalname,
          description: description || null,
          uploadedAt: new Date().toISOString()
        });
        await employee.update({ employmentLetters: employmentLetters });
      }
      
      // ================================================================
      // SPECIAL HANDLING FOR OTHER DOCUMENT - Update JSONB if needed
      // ================================================================
      if (documentType === 'other_document') {
        const otherDocuments = employee.otherDocuments || [];
        otherDocuments.push({
          documentId: document.documentId,
          fileUrl: absoluteUrl,
          fileName: req.file.originalname,
          description: description || null,
          uploadedAt: new Date().toISOString()
        });
        await employee.update({ otherDocuments: otherDocuments });
      }
      
      return res.status(200).json({
        success: true,
        message: `${documentType} uploaded successfully`,
        data: {
          id: document.documentId,
          type: documentType,
          index: nextIndex,
          fileName: req.file.originalname,
          fileUrl: absoluteUrl,
          uploadedAt: document.created_at
        }
      });
    }
    
    // ================================================================
    // HANDLE SINGLE-DOCUMENT TYPES (Replace existing)
    // ================================================================
    // These types should have only ONE document
    const singleDocumentTypes = [
      'national_id', 'id_card', 'degree', 'cv', 'resume', 
      'education_certificate', 'training_certificate', 'experience_letter',
      'marriage_certificate', 'child_birth_certificate', 'child_medical_report',
      'child_adoption_certificate', 'child_profile', 'spouse_profile',
      'naturalization_certificate', 'health_document', 'legal_document',
      'profile_picture'
    ];
    
    if (singleDocumentTypes.includes(documentType)) {
      // Delete existing document if it exists
      let existingDoc = null;
      
      if (index !== undefined && index !== null && index !== '' && index !== 'null') {
        existingDoc = await EmployeeDocument.findOne({
          where: {
            employeeId: id,
            documentType: documentType,
            index: parseInt(index)
          }
        });
      } else {
        existingDoc = await EmployeeDocument.findOne({
          where: {
            employeeId: id,
            documentType: documentType
          }
        });
      }
      
      if (existingDoc) {
        console.log(`🗑️ Deleting old ${documentType} document for employee ${id}`);
        if (existingDoc.filePath) {
          const oldFilePath = path.join(__dirname, '..', existingDoc.filePath);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        await existingDoc.destroy();
      }
      
      // Create new document
      const folder = getDocumentFolder(documentType) || 'others';
      const relativePath = `/uploads/documents/${folder}/${req.file.filename}`;
      const absoluteUrl = `${baseUrl}${relativePath}`;
      
      const document = await EmployeeDocument.create({
        employeeId: id,
        documentType: documentType,
        subType: subType || null,
        index: (index !== undefined && index !== null && index !== '' && index !== 'null') 
          ? parseInt(index) 
          : null,
        documentName: req.file.originalname,
        fileName: req.file.filename,
        fileUrl: absoluteUrl,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Update JSONB field in Employee table
      await updateEmployeeJsonbField(id, documentType, index, {
        documentId: document.documentId,
        fileUrl: absoluteUrl,
        fileName: req.file.originalname
      });
      
      return res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document.documentId,
          type: documentType,
          fileName: req.file.originalname,
          fileUrl: absoluteUrl,
          uploadedAt: document.created_at
        }
      });
    }
    
    // ================================================================
    // HANDLE PROFILE PICTURE (Special case)
    // ================================================================
    if (documentType === 'profile_picture') {
      if (employee.profilePictureUrl) {
        const oldFileName = employee.profilePictureUrl.split('/').pop();
        const oldFilePath = path.join(__dirname, '..', 'uploads', 'profiles', oldFileName);
        deleteFile(oldFilePath);
      }
      
      const profilePictureUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;
      await employee.update({ profilePictureUrl });
      
      const document = await EmployeeDocument.create({
        employeeId: id,
        documentType: 'profile_picture',
        subType: subType || null,
        index: null,
        documentName: req.file.originalname,
        fileName: req.file.filename,
        fileUrl: profilePictureUrl,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          id: document.documentId,
          type: 'profile_picture',
          fileName: req.file.originalname,
          fileUrl: profilePictureUrl,
          uploadedAt: document.created_at
        }
      });
    }
    
    // ================================================================
    // DEFAULT: Create new document without deleting
    // ================================================================
    const folder = getDocumentFolder(documentType) || 'others';
    const relativePath = `/uploads/documents/${folder}/${req.file.filename}`;
    const absoluteUrl = `${baseUrl}${relativePath}`;
    
    const document = await EmployeeDocument.create({
      employeeId: id,
      documentType: documentType,
      subType: subType || null,
      index: (index !== undefined && index !== null && index !== '' && index !== 'null') 
        ? parseInt(index) 
        : null,
      documentName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl: absoluteUrl,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: description || null,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.documentId,
        type: documentType,
        fileName: req.file.originalname,
        fileUrl: absoluteUrl,
        uploadedAt: document.created_at
      }
    });
    
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ====================new endpoint for document compliance summary in the dashboard========================================

// ============================================================================
// 7e. COMPLIANCE SUMMARY (For Dashboard Cards)
// ============================================================================

exports.getComplianceSummary = async (req, res) => {
  try {
    const { departmentId } = req.query;

    let deptWhere = {};
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptWhere.departmentId = parseInt(departmentId);
    }

    // Get all active employees with their documents
    const activeEmployees = await Employee.findAll({
      where: { employmentStatus: 'active', ...deptWhere },
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName'],
      include: [
        { 
          model: EmployeeDocument,
          as: 'EmployeeDocuments',
          required: false,
          attributes: ['documentType', 'documentId', 'created_at']
        }
      ]
    });

    const totalEmployees = activeEmployees.length;

    // Initialize counters
    let idCardSubmitted = 0;
    let degreeSubmitted = 0;
    let guaranteeWithTwo = 0;
    let guaranteeWithOne = 0;
    let guaranteeWithZero = 0;
    let fullyCompliant = 0;

    // Process each employee
    activeEmployees.forEach(emp => {
      const docs = emp.EmployeeDocuments || [];
      
      let hasIdCard = false;
      let hasDegree = false;
      let guaranteeCount = 0;

      docs.forEach(doc => {
        switch(doc.documentType) {
          case 'id_card':
          case 'national_id':
            hasIdCard = true;
            break;
          case 'degree':
          case 'certificate':
          case 'education_certificate':
            hasDegree = true;
            break;
          case 'guarantee_letter':
            guaranteeCount++;
            break;
        }
      });

      if (hasIdCard) idCardSubmitted++;
      if (hasDegree) degreeSubmitted++;

      if (guaranteeCount >= 2) guaranteeWithTwo++;
      else if (guaranteeCount === 1) guaranteeWithOne++;
      else guaranteeWithZero++;

      if (hasIdCard && hasDegree && guaranteeCount >= 2) {
        fullyCompliant++;
      }
    });

    // ✅ Calculate rates with 2 decimal places (NO ROUNDING)
    const idCardRate = totalEmployees > 0 ? parseFloat(((idCardSubmitted / totalEmployees) * 100).toFixed(2)) : 0;
    const degreeRate = totalEmployees > 0 ? parseFloat(((degreeSubmitted / totalEmployees) * 100).toFixed(2)) : 0;
    const guaranteeRate = totalEmployees > 0 ? parseFloat(((guaranteeWithTwo / totalEmployees) * 100).toFixed(2)) : 0;
    const overallRate = totalEmployees > 0 ? parseFloat(((fullyCompliant / totalEmployees) * 100).toFixed(2)) : 0;
    const missingDocuments = totalEmployees - fullyCompliant;

    res.json({
      success: true,
      data: {
        totalEmployees,
        fullyCompliant,
        missingDocuments,
        overallRate,  // ✅ 2 decimal places, e.g., 38.46
        idCard: {
          submitted: idCardSubmitted,
          missing: totalEmployees - idCardSubmitted,
          rate: idCardRate  // ✅ 2 decimal places
        },
        degree: {
          submitted: degreeSubmitted,
          missing: totalEmployees - degreeSubmitted,
          rate: degreeRate  // ✅ 2 decimal places
        },
        guarantee: {
          withTwo: guaranteeWithTwo,
          needSecond: guaranteeWithOne,
          missing: guaranteeWithZero,
          rate: guaranteeRate  // ✅ 2 decimal places
        }
      }
    });

  } catch (error) {
    console.error('Get compliance summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// GET EMPLOYEES WITHOUT NATIONAL ID - SEQUELIZE VERSION
// ============================================================================

exports.getEmployeesWithoutNationalId = async (req, res) => {
  try {
    const { 
      departmentId, 
      search = '',
      page = 1,
      limit = 10
    } = req.query;

    console.log('🔍 Search query:', search);

    let deptFilter = '';
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptFilter = `AND e.department_id = ${parseInt(departmentId)}`;
    }

    let searchFilter = '';
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // ✅ Use correct table aliases: e for employees, d for departments, p for positions
      searchFilter = `
        AND (
          e.first_name ILIKE '%${searchTerm}%' OR
          e.last_name ILIKE '%${searchTerm}%' OR
          e.middle_name ILIKE '%${searchTerm}%' OR
          e.full_name_english ILIKE '%${searchTerm}%' OR
          e.employee_code ILIKE '%${searchTerm}%' OR
          e.work_email ILIKE '%${searchTerm}%' OR
          d.name ILIKE '%${searchTerm}%' OR
          p.title ILIKE '%${searchTerm}%'
        )
      `;
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      WHERE e.employment_status = 'active'
        AND (e.national_id IS NULL OR e.national_id = '')
        ${deptFilter}
        ${searchFilter}
    `;
    
    const countResult = await sequelize.query(countQuery, { 
      type: sequelize.QueryTypes.SELECT 
    });
    const total = parseInt(countResult[0]?.total || 0);

    console.log(`📊 Total employees matching search: ${total}`);

    // Pagination (10 per page)
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);

    // Get employees
    const employeesQuery = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.middle_name,
        e.full_name_english,
        e.work_email,
        e.phone_number,
        e.national_id,
        e.national_id_document,
        e.profile_picture_url,
        d.name as department_name,
        d.code as department_code,
        p.title as position_title
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      WHERE e.employment_status = 'active'
        AND (e.national_id IS NULL OR e.national_id = '')
        ${deptFilter}
        ${searchFilter}
      ORDER BY e.first_name ASC
      LIMIT ${queryLimit} OFFSET ${offset}
    `;
    
    const employees = await sequelize.query(employeesQuery, { 
      type: sequelize.QueryTypes.SELECT 
    });

    // Format response
    const formattedEmployees = employees.map(emp => ({
      id: emp.employee_id,
      employeeId: emp.employee_code,
      employeeCode: emp.employee_code,
      fullName: `${emp.first_name} ${emp.middle_name ? emp.middle_name + ' ' : ''}${emp.last_name}`,
      fullNameEnglish: emp.full_name_english || `${emp.first_name} ${emp.last_name}`,
      firstName: emp.first_name,
      lastName: emp.last_name,
      middleName: emp.middle_name,
      email: emp.work_email,
      phone: emp.phone_number,
      department: emp.department_name || 'Unknown',
      departmentCode: emp.department_code,
      position: emp.position_title || 'Unknown',
      hasNationalId: !!(emp.national_id && emp.national_id.trim() !== ''),
      hasDocument: !!(emp.national_id_document && Object.keys(emp.national_id_document).length > 0),
      profilePictureUrl: emp.profile_picture_url || null
    }));

    const totalPages = Math.ceil(total / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        employees: formattedEmployees,
        summary: {
          total: total,
          withoutNationalId: formattedEmployees.filter(e => !e.hasNationalId).length,
          withDocument: formattedEmployees.filter(e => e.hasDocument).length,
          withoutDocument: formattedEmployees.filter(e => !e.hasDocument).length
        },
        pagination: {
          total,
          page: currentPage,
          limit: queryLimit,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get employees without national ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// GET EMPLOYEES MISSING DEGREE - SEQUELIZE VERSION
// ============================================================================
exports.getDegreeMissing = async (req, res) => {
  try {
    const { 
      departmentId, 
      search = '',
      page = 1,
      limit = 10
    } = req.query;

    console.log('🔍 Degree Missing - Search query:', search);
    console.log('📊 Department filter:', departmentId);

    let deptWhere = {};
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptWhere.departmentId = parseInt(departmentId);
    }

    // ✅ Get all active employees
    const allActiveEmployees = await Employee.findAll({
      where: { employmentStatus: 'active', ...deptWhere },
      attributes: ['employeeId']
    });
    const allIds = allActiveEmployees.map(emp => emp.employeeId);

    // ✅ Get employees WITH degree documents (including education_certificate)
    const employeesWithDegree = await EmployeeDocument.findAll({
      where: { 
        documentType: ['degree', 'certificate', 'education_certificate'],
        employeeId: { [Op.in]: allIds.length ? allIds : [0] }
      },
      attributes: ['employeeId'],
      group: ['employeeId']
    });

    const employeeIdsWithDegree = employeesWithDegree.map(doc => doc.employeeId);

    // ✅ Get employees WITHOUT degree
    let employeeIds = allIds.filter(id => !employeeIdsWithDegree.includes(id));

    // ✅ Build search condition for Amharic name, English name, and Employee Code
    let searchCondition = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      // Get employees matching search from the filtered list
      const searchEmployees = await Employee.findAll({
        where: {
          employeeId: { [Op.in]: employeeIds.length ? employeeIds : [0] },
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${searchTerm}%` } },
            { lastName: { [Op.iLike]: `%${searchTerm}%` } },
            { middleName: { [Op.iLike]: `%${searchTerm}%` } },
            { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
            { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
            { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
            { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$Position.title$': { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        attributes: ['employeeId'],
        include: [
          { model: Department, attributes: ['name'] },
          { model: Position, attributes: ['title'] }
        ]
      });

      employeeIds = searchEmployees.map(emp => emp.employeeId);
    }

    // Get total count for pagination
    const total = employeeIds.length;

    // Pagination (10 per page)
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);
    const paginatedIds = employeeIds.slice(offset, offset + queryLimit);

    // Get paginated employees
    const employees = await Employee.findAll({
      where: {
        employeeId: { [Op.in]: paginatedIds.length ? paginatedIds : [0] },
        ...deptWhere
      },
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail', 
        'phoneNumber', 
        'nationalId', 
        'nationalIdDocument',
        'profilePictureUrl', 
        'departmentId', 
        'positionId'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'] 
        }
      ],
      order: [['firstName', 'ASC']]
    });

    // Format response
    const formattedEmployees = employees.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      employeeCode: emp.employeeCode,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      email: emp.workEmail,
      phone: emp.phoneNumber,
      department: emp.Department?.name || 'Unknown',
      departmentCode: emp.Department?.code || null,
      position: emp.Position?.title || 'Unknown',
      profilePictureUrl: emp.profilePictureUrl || null
    }));

    const totalPages = Math.ceil(total / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        employees: formattedEmployees,
        summary: {
          total: total,
          withDocument: allIds.length - total,
          withoutDocument: total
        },
        pagination: {
          total,
          page: currentPage,
          limit: queryLimit,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get employees missing degree error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// GET EMPLOYEES BY GUARANTEE STATUS - SEQUELIZE VERSION
// ============================================================================
exports.getGuaranteeStatus = async (req, res) => {
  try {
    const { 
      departmentId, 
      search = '',
      filter = 'missing', // 'missing', 'one', 'two', 'all'
      page = 1,
      limit = 10
    } = req.query;

    console.log('🔍 Guarantee Status - Search:', search);
    console.log('📊 Filter:', filter);
    console.log('📊 Department:', departmentId);

    let deptWhere = {};
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptWhere.departmentId = parseInt(departmentId);
    }

    // ✅ Get all active employees with their documents
    const whereCondition = {
      employmentStatus: 'active',
      ...deptWhere
    };

    // ✅ Build search condition
    let searchCondition = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      searchCondition = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { middleName: { [Op.iLike]: `%${searchTerm}%` } },
          { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
          { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$Position.title$': { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };
    }

    const finalWhere = search && search.trim() 
      ? { [Op.and]: [whereCondition, searchCondition] }
      : whereCondition;

    // ✅ Get all active employees with their documents
    const activeEmployees = await Employee.findAll({
      where: finalWhere,
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail', 
        'phoneNumber', 
        'nationalId', 
        'departmentId', 
        'positionId'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'] 
        },
        {
          model: EmployeeDocument,
          as: 'EmployeeDocuments',
          required: false,
          where: { documentType: 'guarantee_letter' },
          attributes: ['documentId', 'documentType', 'created_at']
        }
      ],
      order: [['firstName', 'ASC']]
    });

    // ✅ Process each employee to get guarantee count
    const processedEmployees = activeEmployees.map(emp => {
      const employeeData = {
        id: emp.employeeId,
        employeeId: emp.employeeCode,
        employeeCode: emp.employeeCode,
        fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
        fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        middleName: emp.middleName,
        email: emp.workEmail,
        phone: emp.phoneNumber,
        department: emp.Department?.name || 'Unknown',
        departmentCode: emp.Department?.code || null,
        position: emp.Position?.title || 'Unknown',
        profilePictureUrl: emp.profilePictureUrl || null
      };

      const guarantees = emp.EmployeeDocuments || [];
      const guaranteeCount = guarantees.length;

      return {
        ...employeeData,
        guaranteeCount: guaranteeCount,
        guarantees: guarantees.map(g => ({
          id: g.documentId,
          submittedDate: g.created_at
        }))
      };
    });

    // ✅ Filter by guarantee count
    let filteredEmployees = [];
    switch (filter) {
      case 'missing':
        filteredEmployees = processedEmployees.filter(e => e.guaranteeCount === 0);
        break;
      case 'one':
        filteredEmployees = processedEmployees.filter(e => e.guaranteeCount === 1);
        break;
      case 'two':
        filteredEmployees = processedEmployees.filter(e => e.guaranteeCount >= 2);
        break;
      default:
        filteredEmployees = processedEmployees;
    }

    // ✅ Pagination
    const total = filteredEmployees.length;
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);
    const paginatedEmployees = filteredEmployees.slice(offset, offset + queryLimit);

    const totalPages = Math.ceil(total / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        employees: paginatedEmployees,
        all: processedEmployees,
        missing: processedEmployees.filter(e => e.guaranteeCount === 0),
        needSecond: processedEmployees.filter(e => e.guaranteeCount === 1),
        withTwo: processedEmployees.filter(e => e.guaranteeCount >= 2),
        summary: {
          total: total,
          missing: processedEmployees.filter(e => e.guaranteeCount === 0).length,
          needSecond: processedEmployees.filter(e => e.guaranteeCount === 1).length,
          withTwo: processedEmployees.filter(e => e.guaranteeCount >= 2).length
        },
        pagination: {
          total,
          page: currentPage,
          limit: queryLimit,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get guarantee status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



exports.getGuaranteeAgeDistribution = async (req, res) => {
  try {
    const { 
      departmentId, 
      search = '',
      includeDetails = 'false'
    } = req.query;

    console.log('📊 Guarantee Age Distribution - Department:', departmentId);
    console.log('🔍 Search:', search);

    // Build where clause
    let deptWhere = {};
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptWhere.departmentId = parseInt(departmentId);
    }

    const whereCondition = {
      employmentStatus: 'active',
      ...deptWhere
    };

    // Build search condition
    let searchCondition = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      searchCondition = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { middleName: { [Op.iLike]: `%${searchTerm}%` } },
          { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
          { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$Position.title$': { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };
    }

    const finalWhere = search && search.trim() 
      ? { [Op.and]: [whereCondition, searchCondition] }
      : whereCondition;

    // Get all active employees with their documents
    const activeEmployees = await Employee.findAll({
      where: finalWhere,
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail',
        'departmentId',
        'positionId',
        'guaranteeInfo'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'] 
        }
      ],
      order: [['firstName', 'ASC']]
    });

    console.log(`📊 Found ${activeEmployees.length} active employees`);

    // ========== CURRENT EC DATE ==========
    const currentECDate = "28/11/2018";
    console.log(`📅 Current EC Date: ${currentECDate}`);

    // ========== DEFINE THE AGE CATEGORIES (in months) ==========
    const ageCategories = {
      '1 Month': { min: 0, max: 1, count: 0 },
      '3 Months': { min: 1.01, max: 3, count: 0 },
      '6 Months': { min: 3.01, max: 6, count: 0 },
      '9 Months': { min: 6.01, max: 9, count: 0 },
      '12 Months': { min: 9.01, max: 12, count: 0 },
      '> 12 Months': { min: 12.01, max: Infinity, count: 0 }
    };

    let totalAge = 0;
    let totalGuaranteeCount = 0;
    let oldest = 0;
    let youngest = Infinity;
    const allGuarantees = [];

    // ========== PROCESS EACH EMPLOYEE'S GUARANTEES ==========
    activeEmployees.forEach(emp => {
      const guaranteeInfo = emp.guaranteeInfo || [];
      
      // ✅ FILTER GUARANTEES THAT HAVE A VALID CONFIRMATION DATE (NOT guaranteeLetterDateEC)
      const validGuarantees = guaranteeInfo.filter(g => 
        g.confirmedDateEC && 
        g.confirmedDateEC.trim() !== '' &&
        g.confirmedDateEC !== 'undefined' &&
        g.confirmedDateEC !== 'null'
      );
      
      console.log(`👤 Employee ${emp.employeeCode}: ${validGuarantees.length} valid confirmed dates`);
      
      // ✅ PROCESS EACH GUARANTEE SEPARATELY
      validGuarantees.forEach((guarantee, index) => {
        // ✅ USE CONFIRMATION DATE INSTEAD OF GUARANTEE LETTER DATE
        const confirmationDateEC = guarantee.confirmedDateEC;
        
        console.log(`  📅 Guarantee ${index + 1}: Confirmed Date = ${confirmationDateEC}`);
        
        // Calculate age for this specific guarantee using confirmation date
        const ageInMonths = calculateAgeInMonthsEC(confirmationDateEC, currentECDate);
        
        console.log(`  📊 Age in months: ${ageInMonths}`);
        
        if (ageInMonths !== null && ageInMonths >= 0) {
          const guaranteeObj = {
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode,
            fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
            fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
            email: emp.workEmail,
            department: emp.Department?.name || 'Unknown',
            position: emp.Position?.title || 'Unknown',
            guaranteeIndex: index + 1,
            totalGuarantees: validGuarantees.length,
            confirmedDateEC: confirmationDateEC,  // ✅ Return confirmation date
            ageInMonths: Math.round(ageInMonths)
          };

          allGuarantees.push(guaranteeObj);

          // ✅ Categorize EACH guarantee separately
          let categorized = false;
          for (const [category, data] of Object.entries(ageCategories)) {
            if (ageInMonths >= data.min && ageInMonths <= data.max) {
              data.count++;
              categorized = true;
              console.log(`  ✅ Categorized as: ${category}`);
              break;
            }
          }
          
          if (!categorized) {
            console.log(`  ⚠️ Age ${ageInMonths} not categorized! Defaulting to > 12 Months`);
            ageCategories['> 12 Months'].count++;
          }

          totalAge += ageInMonths;
          totalGuaranteeCount++;
          if (ageInMonths > oldest) oldest = ageInMonths;
          if (ageInMonths < youngest) youngest = ageInMonths;
        } else {
          console.log(`  ⚠️ Invalid age calculation for guarantee ${index + 1}`);
        }
      });
    });

    console.log(`📊 Total guarantees processed: ${totalGuaranteeCount}`);
    console.log(`📊 Age categories:`, ageCategories);

    // ========== CREATE THE DISTRIBUTION ARRAY ==========
    const distribution = Object.entries(ageCategories).map(([label, data]) => ({
      label: label,
      months: getCategoryMonths(label),
      count: data.count,
      percentage: totalGuaranteeCount > 0 ? Math.round((data.count / totalGuaranteeCount) * 100) : 0
    }));

    // Sort by months
    distribution.sort((a, b) => a.months - b.months);

    console.log('📊 Final distribution:', JSON.stringify(distribution, null, 2));

    // ========== PREPARE RESPONSE ==========
    const response = {
      success: true,
      data: {
        distribution: distribution,
        summary: {
          totalGuarantees: totalGuaranteeCount,
          totalEmployeesWithGuarantees: activeEmployees.filter(e => 
            (e.guaranteeInfo || []).filter(g => 
              g.confirmedDateEC && 
              g.confirmedDateEC.trim() !== ''
            ).length > 0
          ).length,
          averageAgeMonths: totalGuaranteeCount > 0 ? Math.round(totalAge / totalGuaranteeCount) : 0,
          oldestAgeMonths: oldest,
          youngestAgeMonths: youngest === Infinity ? 0 : youngest,
          totalEmployees: activeEmployees.length,
          employeesWithoutGuarantees: activeEmployees.filter(e => 
            (e.guaranteeInfo || []).filter(g => 
              g.confirmedDateEC && 
              g.confirmedDateEC.trim() !== ''
            ).length === 0
          ).length,
          currentECDate: currentECDate
        },
        filters: {
          departmentId: departmentId || 'all',
          search: search || ''
        }
      }
    };

    // Include detailed guarantee list if requested
    if (includeDetails === 'true') {
      response.data.guarantees = allGuarantees;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Get guarantee age distribution error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};




// ============================================================================
// GET GUARANTEE AGE DETAILS (With Employee List)
// ============================================================================
exports.getGuaranteeAgeDetails = async (req, res) => {
  try {
    const { 
      departmentId, 
      search = '',
      ageRange = 'all',
      page = 1,
      limit = 10,
      includeDetails = 'true'
    } = req.query;

    console.log('📊 Guarantee Age Details - Department:', departmentId);
    console.log('🔍 Search:', search);
    console.log('📊 Age Range:', ageRange);

    // Build where clause
    let deptWhere = {};
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptWhere.departmentId = parseInt(departmentId);
    }

    const whereCondition = {
      employmentStatus: 'active',
      ...deptWhere
    };

    // Build search condition
    let searchCondition = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      searchCondition = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { middleName: { [Op.iLike]: `%${searchTerm}%` } },
          { fullNameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
          { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$Position.title$': { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };
    }

    const finalWhere = search && search.trim() 
      ? { [Op.and]: [whereCondition, searchCondition] }
      : whereCondition;

    // Get all active employees with their guarantee info
    const activeEmployees = await Employee.findAll({
      where: finalWhere,
      attributes: [
        'employeeId', 
        'employeeCode', 
        'firstName', 
        'lastName', 
        'middleName',
        'fullNameEnglish',
        'workEmail',
        'phoneNumber',
        'departmentId',
        'positionId',
        'profilePictureUrl',
        'guaranteeInfo'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'] 
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'] 
        }
      ],
      order: [['firstName', 'ASC']]
    });

    console.log(`📊 Found ${activeEmployees.length} active employees`);

    // ========== CURRENT EC DATE ==========
    const currentECDate = "28/11/2018";
    console.log(`📅 Current EC Date: ${currentECDate}`);

    // ========== AGE CATEGORIES ==========
    const ageCategories = [
      { label: '1 Month', months: 1, min: 0, max: 1 },
      { label: '3 Months', months: 3, min: 1.01, max: 3 },
      { label: '6 Months', months: 6, min: 3.01, max: 6 },
      { label: '9 Months', months: 9, min: 6.01, max: 9 },
      { label: '12 Months', months: 12, min: 9.01, max: 12 },
      { label: '> 12 Months', months: 13, min: 12.01, max: Infinity }
    ];

    // Process employees and build detailed list
    const employeeDetails = [];
    const distributionData = ageCategories.map(cat => ({
      ...cat,
      count: 0,
      employees: []
    }));

    // ========== GUARANTEE COUNT DISTRIBUTION ==========
    let zeroGuarantees = 0;
    let oneGuarantee = 0;
    let twoGuarantees = 0;
    let twoPlusGuarantees = 0;

    activeEmployees.forEach(emp => {
      const guaranteeInfo = emp.guaranteeInfo || [];
      
      // ✅ FILTER GUARANTEES THAT HAVE A VALID CONFIRMATION DATE (NOT guaranteeLetterDateEC)
      const validGuarantees = guaranteeInfo.filter(g => 
        g.confirmedDateEC && 
        g.confirmedDateEC.trim() !== '' &&
        g.confirmedDateEC !== 'undefined' &&
        g.confirmedDateEC !== 'null'
      );

      // ========== COUNT GUARANTEES PER EMPLOYEE ==========
      const guaranteeCount = validGuarantees.length;
      
      if (guaranteeCount === 0) {
        zeroGuarantees++;
      } else if (guaranteeCount === 1) {
        oneGuarantee++;
      } else if (guaranteeCount === 2) {
        twoGuarantees++;
      } else if (guaranteeCount >= 2) {
        twoPlusGuarantees++;
      }

      if (validGuarantees.length > 0) {
        // Process each guarantee
        validGuarantees.forEach((guarantee, index) => {
          // ✅ USE CONFIRMATION DATE INSTEAD OF GUARANTEE LETTER DATE
          const confirmationDateEC = guarantee.confirmedDateEC;
          const ageInMonths = calculateAgeInMonthsEC(confirmationDateEC, currentECDate);
          
          if (ageInMonths !== null && ageInMonths >= 0) {
            // Find which category this belongs to
            let categoryFound = false;
            for (const cat of distributionData) {
              if (ageInMonths >= cat.min && ageInMonths <= cat.max) {
                cat.count++;
                cat.employees.push({
                  id: emp.employeeId,
                  employeeId: emp.employeeCode,
                  employeeCode: emp.employeeCode,
                  fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
                  fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
                  firstName: emp.firstName,
                  lastName: emp.lastName,
                  email: emp.workEmail,
                  phone: emp.phoneNumber,
                  department: emp.Department?.name || 'Unknown',
                  departmentCode: emp.Department?.code || null,
                  position: emp.Position?.title || 'Unknown',
                  profilePictureUrl: emp.profilePictureUrl || null,
                  // ✅ RETURN CONFIRMATION DATE
                  confirmedDateEC: confirmationDateEC,
                  guaranteeIndex: index + 1,
                  totalGuarantees: validGuarantees.length,
                  ageInMonths: Math.round(ageInMonths),
                  guarantorName: guarantee.guarantorName || null,
                  guarantorOffice: guarantee.guarantorOfficeName || null
                });
                categoryFound = true;
                break;
              }
            }

            // If not categorized, add to > 12 Months
            if (!categoryFound) {
              const lastCat = distributionData[distributionData.length - 1];
              lastCat.count++;
              lastCat.employees.push({
                id: emp.employeeId,
                employeeId: emp.employeeCode,
                employeeCode: emp.employeeCode,
                fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
                fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.workEmail,
                phone: emp.phoneNumber,
                department: emp.Department?.name || 'Unknown',
                departmentCode: emp.Department?.code || null,
                position: emp.Position?.title || 'Unknown',
                profilePictureUrl: emp.profilePictureUrl || null,
                // ✅ RETURN CONFIRMATION DATE
                confirmedDateEC: confirmationDateEC,
                guaranteeIndex: index + 1,
                totalGuarantees: validGuarantees.length,
                ageInMonths: Math.round(ageInMonths),
                guarantorName: guarantee.guarantorName || null,
                guarantorOffice: guarantee.guarantorOfficeName || null
              });
            }

            // Add to full employee details list
            employeeDetails.push({
              id: emp.employeeId,
              employeeId: emp.employeeCode,
              employeeCode: emp.employeeCode,
              fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
              fullNameEnglish: emp.fullNameEnglish || `${emp.firstName} ${emp.lastName}`,
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.workEmail,
              phone: emp.phoneNumber,
              department: emp.Department?.name || 'Unknown',
              departmentCode: emp.Department?.code || null,
              position: emp.Position?.title || 'Unknown',
              profilePictureUrl: emp.profilePictureUrl || null,
              // ✅ RETURN CONFIRMATION DATE
              confirmedDateEC: confirmationDateEC,
              guaranteeIndex: index + 1,
              totalGuarantees: validGuarantees.length,
              ageInMonths: Math.round(ageInMonths),
              ageCategory: getAgeCategoryLabel(ageInMonths),
              guarantorName: guarantee.guarantorName || null,
              guarantorOffice: guarantee.guarantorOfficeName || null
            });
          }
        });
      }
    });

    // Build distribution for response
    const distribution = distributionData.map(cat => ({
      label: cat.label,
      months: cat.months,
      count: cat.count,
      percentage: employeeDetails.length > 0 ? Math.round((cat.count / employeeDetails.length) * 100) : 0,
      min: cat.min,
      max: cat.max,
      employees: includeDetails === 'true' ? cat.employees : undefined
    }));

    // Filter by age range if specified
    let filteredDetails = employeeDetails;
    if (ageRange && ageRange !== 'all') {
      const rangeCat = distributionData.find(c => c.label === ageRange);
      if (rangeCat) {
        filteredDetails = employeeDetails.filter(e => 
          e.ageInMonths >= rangeCat.min && e.ageInMonths <= rangeCat.max
        );
      }
    }

    // Calculate summary stats
    const totalAge = employeeDetails.reduce((sum, e) => sum + e.ageInMonths, 0);
    const oldest = employeeDetails.length > 0 ? Math.max(...employeeDetails.map(e => e.ageInMonths)) : 0;
    const youngest = employeeDetails.length > 0 ? Math.min(...employeeDetails.map(e => e.ageInMonths)) : 0;

    // ========== PAGINATION ==========
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);
    const paginatedEmployees = filteredDetails.slice(offset, offset + queryLimit);
    const total = filteredDetails.length;
    const totalPages = Math.ceil(total / queryLimit);
    const currentPage = parseInt(page);

    // ========== PREPARE RESPONSE ==========
    const response = {
      success: true,
      data: {
        distribution: distribution,
        employees: paginatedEmployees,
        summary: {
          // Existing stats
          totalGuarantees: employeeDetails.length,
          totalEmployeesWithGuarantees: activeEmployees.filter(e => 
            (e.guaranteeInfo || []).filter(g => 
              g.confirmedDateEC && 
              g.confirmedDateEC.trim() !== ''
            ).length > 0
          ).length,
          averageAgeMonths: employeeDetails.length > 0 ? Math.round(totalAge / employeeDetails.length) : 0,
          oldestAgeMonths: oldest,
          youngestAgeMonths: youngest,
          totalEmployees: activeEmployees.length,
          employeesWithoutGuarantees: activeEmployees.length - employeeDetails.length,
          currentECDate: currentECDate,
          
          // ✅ NEW: Guarantee Count Distribution
          guaranteeDistribution: {
            zero: zeroGuarantees,
            one: oneGuarantee,
            two: twoGuarantees,
            twoPlus: twoPlusGuarantees
          }
        },
        filters: {
          departmentId: departmentId || 'all',
          search: search || '',
          ageRange: ageRange || 'all'
        },
        pagination: {
          total: total,
          page: currentPage,
          limit: queryLimit,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Get guarantee age details error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};







/**
 * Create a new department transfer
 * POST /api/department-transfers
 */
exports.createDepartmentTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      employeeId,
      fromDepartmentId,
      toDepartmentId,
      transferDateEC,
      reason,
      approvedBy,
      notes
    } = req.body;

    const { Employee, Department, User, DepartmentTransfer } = sequelize.models;
    const { isValidEthiopianDate, convertEthiopianToGregorian } = require('../utils/dateConverter');

    // ========== VALIDATION ==========
    if (!employeeId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      });
    }

    if (!toDepartmentId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'To Department is required'
      });
    }

    if (!transferDateEC) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Transfer date is required'
      });
    }

    // Validate EC date format
    if (!isValidEthiopianDate(transferDateEC)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Invalid Ethiopian date format: ${transferDateEC}. Use DD/MM/YYYY`
      });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Check if employee is active
    if (employee.employmentStatus !== 'active') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer an inactive employee'
      });
    }

    // Use employee's current department as fromDepartment if not provided
    let fromDeptId = fromDepartmentId || employee.departmentId;

    // Check if fromDepartment exists
    const fromDept = await Department.findByPk(fromDeptId, { transaction });
    if (!fromDept) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'From Department not found'
      });
    }

    // Check if toDepartment exists
    const toDept = await Department.findByPk(toDepartmentId, { transaction });
    if (!toDept) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'To Department not found'
      });
    }

    // Check if departments are the same
    if (fromDeptId === toDepartmentId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'From and To departments cannot be the same'
      });
    }

    // Check if approvedBy user exists (if provided)
    if (approvedBy) {
      const approver = await User.findByPk(approvedBy, { transaction });
      if (!approver) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Approver not found'
        });
      }
    }

    // ========== CONVERT EC TO GC ==========
    const transferDateGC = convertEthiopianToGregorian(transferDateEC);

    // ========== STEP 1: CREATE TRANSFER RECORD ==========
    const transfer = await DepartmentTransfer.create({
      employeeId: parseInt(employeeId),
      fromDepartmentId: parseInt(fromDeptId),
      toDepartmentId: parseInt(toDepartmentId),
      transferDateEC: transferDateEC,
      transferDateGC: transferDateGC,
      reason: reason || `Department transfer from ${fromDept.name} to ${toDept.name}`,
      approvedBy: approvedBy || null,
      notes: notes || null,
      status: 'active'
    }, { transaction });

    // ========== STEP 2: UPDATE EMPLOYEE'S DEPARTMENT ==========
    await employee.update({
      departmentId: parseInt(toDepartmentId)
    }, { transaction });

    // ========== COMMIT BOTH CHANGES ==========
    await transaction.commit();

    // ========== FETCH CREATED TRANSFER ==========
    const createdTransfer = await DepartmentTransfer.findByPk(transfer.transferId, {
      include: [
        { 
          model: Employee, 
          as: 'employee',
          attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName', 'fullNameEnglish', 'workEmail']
        },
        { 
          model: Department, 
          as: 'fromDepartment',
          attributes: ['departmentId', 'code', 'name']
        },
        { 
          model: Department, 
          as: 'toDepartment',
          attributes: ['departmentId', 'code', 'name']
        },
        { 
          model: User, 
          as: 'approver',
          attributes: ['userId', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: `Employee successfully transferred from ${fromDept.name} to ${toDept.name}`,
      data: {
        transfer: {
          id: createdTransfer.transferId,
          employeeId: createdTransfer.employeeId,
          employeeCode: createdTransfer.employee?.employeeCode,
          employeeName: createdTransfer.employee ? 
            `${createdTransfer.employee.firstName} ${createdTransfer.employee.middleName ? createdTransfer.employee.middleName + ' ' : ''}${createdTransfer.employee.lastName}` : 
            'Unknown',
          fromDepartment: createdTransfer.fromDepartment?.name || 'Unknown',
          fromDepartmentCode: createdTransfer.fromDepartment?.code,
          toDepartment: createdTransfer.toDepartment?.name || 'Unknown',
          toDepartmentCode: createdTransfer.toDepartment?.code,
          transferDateEC: createdTransfer.transferDateEC,
          transferDateGC: createdTransfer.transferDateGC,
          reason: createdTransfer.reason,
          status: createdTransfer.status,
          approvedBy: createdTransfer.approvedBy,
          approverName: createdTransfer.approver?.fullName || 'System',
          createdAt: createdTransfer.createdAt
        },
        employeeUpdated: {
          id: employee.employeeId,
          employeeCode: employee.employeeCode,
          fullName: employee.getFullName ? employee.getFullName() : `${employee.firstName} ${employee.lastName}`,
          previousDepartment: fromDept.name,
          currentDepartment: toDept.name,
          departmentId: employee.departmentId
        }
      }
    });

  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error('❌ Create department transfer error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};




/**
 * Get all department transfers for an employee with current indicator
 * GET /api/employees/department-transfers/employee/:employeeId
 */
exports.getEmployeeDepartmentTransfers = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;

    const { DepartmentTransfer, Employee, Department, User } = sequelize.models;
    const { Op } = require('sequelize');

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId, {
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName', 'fullNameEnglish', 'workEmail', 'departmentId'],
      include: [
        { model: Department, attributes: ['departmentId', 'name', 'code'] }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Build where conditions - get ALL transfers (not just active)
    const where = { 
      employeeId: parseInt(employeeId)
    };

    // If status filter is provided, use it
    if (status && status !== 'all' && status !== 'undefined') {
      where.status = status;
    }

    // Get ALL transfers
    const transfers = await DepartmentTransfer.findAll({
      where,
      include: [
        { 
          model: Department, 
          as: 'fromDepartment',
          attributes: ['departmentId', 'code', 'name']
        },
        { 
          model: Department, 
          as: 'toDepartment',
          attributes: ['departmentId', 'code', 'name']
        },
        { 
          model: User, 
          as: 'approver',
          attributes: ['userId', 'fullName', 'email']
        }
      ],
      order: [['transferDateGC', 'ASC'], ['createdAt', 'ASC']] // Oldest first
    });

    // ✅ Find the CURRENT transfer (latest active one)
    const currentTransfer = transfers
      .filter(t => t.status === 'active')
      .sort((a, b) => {
        const dateA = a.transferDateEC.split('/').reverse().join('');
        const dateB = b.transferDateEC.split('/').reverse().join('');
        return dateB.localeCompare(dateA);
      })[0] || null;

    // Format transfers with isCurrent flag
    const formattedTransfers = transfers.map(transfer => {
      const isCurrent = currentTransfer && transfer.transferId === currentTransfer.transferId;
      
      return {
        id: transfer.transferId,
        fromDepartmentId: transfer.fromDepartmentId,
        fromDepartment: transfer.fromDepartment?.name || 'Unknown',
        fromDepartmentCode: transfer.fromDepartment?.code,
        toDepartmentId: transfer.toDepartmentId,
        toDepartment: transfer.toDepartment?.name || 'Unknown',
        toDepartmentCode: transfer.toDepartment?.code,
        transferDateEC: transfer.transferDateEC,
        transferDateGC: transfer.transferDateGC,
        reason: transfer.reason,
        notes: transfer.notes,
        status: transfer.status,
        statusLabel: transfer.getStatusLabel ? transfer.getStatusLabel() : transfer.status,
        approvedBy: transfer.approvedBy,
        approverName: transfer.approver?.fullName || 'System',
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
        isCurrent: isCurrent, // ✅ Flag to identify current transfer
        isHistorical: !isCurrent && transfer.status === 'active' // ✅ Historical active transfers
      };
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.employeeId,
          employeeId: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName}`,
          fullNameEnglish: employee.fullNameEnglish,
          email: employee.workEmail,
          currentDepartment: employee.Department?.name || 'Unknown',
          currentDepartmentId: employee.departmentId
        },
        transfers: formattedTransfers,
        currentTransferId: currentTransfer?.transferId || null,
        hasTransfer: transfers.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Get employee transfers error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


/**
 * Update transfer status (reverse or complete)
 * PUT /api/department-transfers/:transferId/status
 */
exports.updateTransferStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { transferId } = req.params;
    const { status, notes } = req.body;

    const { Employee, DepartmentTransfer } = sequelize.models;

    // Validate status
    const validStatuses = ['active', 'reversed', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find transfer
    const transfer = await DepartmentTransfer.findByPk(transferId, { transaction });
    if (!transfer) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    // Check if transfer is already in target status
    if (transfer.status === status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Transfer is already ${status}`
      });
    }

    const oldStatus = transfer.status;

    // ========== UPDATE TRANSFER STATUS ==========
    await transfer.update({
      status: status,
      notes: notes || transfer.notes
    }, { transaction });

    // ========== IF REVERSING, REVERT EMPLOYEE'S DEPARTMENT ==========
    if (status === 'reversed' && oldStatus === 'active') {
      const employee = await Employee.findByPk(transfer.employeeId, { transaction });
      if (employee) {
        await employee.update({
          departmentId: transfer.fromDepartmentId
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated transfer
    const updatedTransfer = await DepartmentTransfer.findByPk(transferId, {
      include: [
        { 
          model: Employee, 
          as: 'employee',
          attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName', 'fullNameEnglish', 'workEmail']
        },
        { 
          model: Department, 
          as: 'fromDepartment',
          attributes: ['departmentId', 'code', 'name']
        },
        { 
          model: Department, 
          as: 'toDepartment',
          attributes: ['departmentId', 'code', 'name']
        }
      ]
    });

    const statusMessages = {
      active: 'Transfer reactivated',
      reversed: 'Transfer reversed, employee returned to previous department',
      completed: 'Transfer marked as completed'
    };

    res.json({
      success: true,
      message: statusMessages[status] || 'Transfer status updated',
      data: {
        id: updatedTransfer.transferId,
        employeeId: updatedTransfer.employeeId,
        employeeName: updatedTransfer.employee ? 
          `${updatedTransfer.employee.firstName} ${updatedTransfer.employee.middleName ? updatedTransfer.employee.middleName + ' ' : ''}${updatedTransfer.employee.lastName}` : 
          'Unknown',
        fromDepartment: updatedTransfer.fromDepartment?.name || 'Unknown',
        toDepartment: updatedTransfer.toDepartment?.name || 'Unknown',
        transferDateEC: updatedTransfer.transferDateEC,
        status: updatedTransfer.status,
        statusLabel: updatedTransfer.getStatusLabel ? updatedTransfer.getStatusLabel() : updatedTransfer.status,
        notes: updatedTransfer.notes,
        updatedAt: updatedTransfer.updatedAt
      }
    });

  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error('❌ Update transfer status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

