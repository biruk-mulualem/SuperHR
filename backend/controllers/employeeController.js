const { Employee, Department, Position, User, EmployeeDocument,CompensationHistory, Role ,sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getDocumentFolder } = require('../middleware/uploadMiddleware');

const {
  isValidEthiopianDate,
  convertEthiopianToGregorian
} = require('../utils/dateConverter');
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
      const idx = parseInt(index);
      if (children[idx]) {
        const fieldMap = {
          'child_birth_certificate': 'birthCertificateUrl',
          'child_medical_report': 'medicalReportUrl',
          'child_adoption_certificate': 'adoptionCertificateUrl',
          'child_profile': 'profilePictureUrl'
        };
        const field = fieldMap[documentType];
        children[idx][field] = fileData.fileUrl;
        children[idx][`${field.replace('Url', 'DocumentId')}`] = fileData.documentId;
        children[idx][`${field.replace('Url', 'FileName')}`] = fileData.fileName;
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
      const currentEducation = employee.education || [];
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
      currentEducation.push(cvEntry);
      updateData.education = currentEducation;
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
    case 'guarantee_letter':
    case 'sdt_letter':
    case 'guarantee_other':
      const guarantees = employee.guaranteeInfo || [];
      const guarIdx = parseInt(index);
      if (guarantees[guarIdx]) {
        const fieldMap = {
          'guarantee_letter': 'guaranteeLetterUrl',
          'sdt_letter': 'sdtLetterUrl',
          'guarantee_other': 'otherDocumentUrl'
        };
        const field = fieldMap[documentType];
        const docIdField = field.replace('Url', 'DocumentId');
        const fileNameField = field.replace('Url', 'FileName');
        
        guarantees[guarIdx][field] = fileData.fileUrl;
        guarantees[guarIdx][docIdField] = fileData.documentId;
        guarantees[guarIdx][fileNameField] = fileData.fileName;
        updateData.guaranteeInfo = guarantees;
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
      hireDateEC,           // Format: "DD/MM/YYYY"
      dateOfBirthEC,        // Format: "DD/MM/YYYY"
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

    // ========== VALIDATE EC DATES USING YOUR WORKING CONVERTER ==========
    // Import the validation function from your dateConverter
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

    // ========== CONVERT EC TO GC USING YOUR WORKING CONVERTER ==========
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
      
      // Gregorian Calendar (Secondary - converted by your working converter)
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
// ============================================================================
// UPDATE EMPLOYEE (WITH ALLOWANCES & COMPENSATION HISTORY + nationalIdDocument)
// ============================================================================
exports.updateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      if (req.file) deleteFile(req.file.path);
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const updates = req.body;

    // Store old values for compensation tracking
    const oldValues = {
      basicSalary: employee.basicSalary,
      housingAllowance: employee.housingAllowance,
      positionAllowance: employee.positionAllowance,
      transportAllowance: employee.transportAllowance,
      mobileAllowance: employee.mobileAllowance
    };

    // Handle profile picture update if file is uploaded
    let profilePictureUrl = employee.profilePictureUrl;
    if (req.file) {
      if (employee.profilePictureUrl) {
        const oldFileName = employee.profilePictureUrl.split('/').pop();
        const oldFilePath = path.join(__dirname, '..', 'uploads', 'profiles', oldFileName);
        deleteFile(oldFilePath);
      }
      profilePictureUrl = getFileUrl(req, req.file.filename, 'profiles');
    }

    // Parse Address
    let currentAddress = employee.currentAddress;
    if (updates.address) {
      if (typeof updates.address === 'string') {
        currentAddress = { street: updates.address };
      } else if (typeof updates.address === 'object') {
        currentAddress = updates.address;
      }
    }

    // Parse Bank Account
    let bankAccount = employee.bankAccount;
    if (updates.bankAccount) {
      if (typeof updates.bankAccount === 'string') {
        try { bankAccount = JSON.parse(updates.bankAccount); } catch (e) { bankAccount = {}; }
      } else if (typeof updates.bankAccount === 'object') {
        bankAccount = updates.bankAccount;
      }
    }

    // Parse Emergency Contact
    let emergencyContact = employee.emergencyContact;
    if (updates.emergencyContact) {
      if (typeof updates.emergencyContact === 'string') {
        try { emergencyContact = JSON.parse(updates.emergencyContact); } catch (e) { emergencyContact = {}; }
      } else if (typeof updates.emergencyContact === 'object') {
        emergencyContact = updates.emergencyContact;
      }
    }

    // Parse new JSONB fields
    let birthPlace = employee.birthPlace;
    if (updates.birthPlace) {
      if (typeof updates.birthPlace === 'string') {
        try { birthPlace = JSON.parse(updates.birthPlace); } catch (e) { birthPlace = {}; }
      } else if (typeof updates.birthPlace === 'object') {
        birthPlace = updates.birthPlace;
      }
    }

    let spouseInfo = employee.spouseInfo;
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

    let parentSupport = employee.parentSupport;
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

    let workExperience = employee.workExperience;
    if (updates.workExperience) {
      if (typeof updates.workExperience === 'string') {
        try { workExperience = JSON.parse(updates.workExperience); } catch (e) { workExperience = []; }
      } else if (Array.isArray(updates.workExperience)) {
        workExperience = updates.workExperience;
      }
    }

    let languageSkills = employee.languageSkills;
    if (updates.languageSkills) {
      if (typeof updates.languageSkills === 'string') {
        try { languageSkills = JSON.parse(updates.languageSkills); } catch (e) { languageSkills = []; }
      } else if (Array.isArray(updates.languageSkills)) {
        languageSkills = updates.languageSkills;
      }
    }

    let nationalityAcquisition = employee.nationalityAcquisition;
    if (updates.nationalityAcquisition) {
      if (typeof updates.nationalityAcquisition === 'string') {
        try { nationalityAcquisition = JSON.parse(updates.nationalityAcquisition); } catch (e) { nationalityAcquisition = {}; }
      } else if (typeof updates.nationalityAcquisition === 'object') {
        nationalityAcquisition = updates.nationalityAcquisition;
      }
    }

    let healthInfo = employee.healthInfo;
    if (updates.healthInfo) {
      if (typeof updates.healthInfo === 'string') {
        try { healthInfo = JSON.parse(updates.healthInfo); } catch (e) { healthInfo = {}; }
      } else if (typeof updates.healthInfo === 'object') {
        healthInfo = updates.healthInfo;
      }
    }

    let legalInfo = employee.legalInfo;
    if (updates.legalInfo) {
      if (typeof updates.legalInfo === 'string') {
        try { legalInfo = JSON.parse(updates.legalInfo); } catch (e) { legalInfo = {}; }
      } else if (typeof updates.legalInfo === 'object') {
        legalInfo = updates.legalInfo;
      }
    }

    let guaranteeInfo = employee.guaranteeInfo;
    if (updates.guaranteeInfo) {
      if (typeof updates.guaranteeInfo === 'string') {
        try { guaranteeInfo = JSON.parse(updates.guaranteeInfo); } catch (e) { guaranteeInfo = []; }
      } else if (Array.isArray(updates.guaranteeInfo)) {
        guaranteeInfo = updates.guaranteeInfo;
      }
    }

    let parentsInfo = employee.parentsInfo;
    if (updates.parentsInfo) {
      if (typeof updates.parentsInfo === 'string') {
        try { parentsInfo = JSON.parse(updates.parentsInfo); } catch (e) { parentsInfo = {}; }
      } else if (typeof updates.parentsInfo === 'object') {
        parentsInfo = updates.parentsInfo;
      }
    }

    let emergencyContactAddress = employee.emergencyContactAddress;
    if (updates.emergencyContactAddress) {
      if (typeof updates.emergencyContactAddress === 'string') {
        try { emergencyContactAddress = JSON.parse(updates.emergencyContactAddress); } catch (e) { emergencyContactAddress = {}; }
      } else if (typeof updates.emergencyContactAddress === 'object') {
        emergencyContactAddress = updates.emergencyContactAddress;
      }
    }

    let currentCompany = employee.currentCompany;
    if (updates.currentCompany) {
      if (typeof updates.currentCompany === 'string') {
        try { currentCompany = JSON.parse(updates.currentCompany); } catch (e) { currentCompany = {}; }
      } else if (typeof updates.currentCompany === 'object') {
        currentCompany = updates.currentCompany;
      }
    }

    let permanentAddress = employee.permanentAddress;
    if (updates.permanentAddress) {
      if (typeof updates.permanentAddress === 'string') {
        try { permanentAddress = JSON.parse(updates.permanentAddress); } catch (e) { permanentAddress = {}; }
      } else if (typeof updates.permanentAddress === 'object') {
        permanentAddress = updates.permanentAddress;
      }
    }

    let nationalIdDocument = employee.nationalIdDocument;  // ← ADDED
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
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    
if (updates.fullNameEnglish !== undefined) updateData.fullNameEnglish = updates.fullNameEnglish;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.middleName !== undefined) updateData.middleName = updates.middleName;
    if (updates.email !== undefined) updateData.workEmail = updates.email;
    if (updates.personalEmail !== undefined) updateData.personalEmail = updates.personalEmail;
    if (updates.phone !== undefined) updateData.phoneNumber = updates.phone;
    if (updates.dob !== undefined) updateData.dateOfBirth = updates.dob;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.maritalStatus !== undefined) updateData.maritalStatus = updates.maritalStatus;
    if (updates.nationality !== undefined) updateData.nationality = updates.nationality;
    if (updates.nationalId !== undefined) updateData.nationalId = updates.nationalId;
    
    // Employment
    if (updates.departmentId !== undefined) updateData.departmentId = parseInt(updates.departmentId);
    if (updates.positionId !== undefined) updateData.positionId = parseInt(updates.positionId);
    if (updates.managerId !== undefined) updateData.managerId = updates.managerId ? parseInt(updates.managerId) : null;
    if (updates.employmentType !== undefined) updateData.employmentType = updates.employmentType;
    if (updates.status !== undefined) updateData.employmentStatus = updates.status;
    if (updates.hireDate !== undefined) updateData.hireDate = updates.hireDate;
    if (updates.confirmationDate !== undefined) updateData.confirmationDate = updates.confirmationDate || null;
    if (updates.terminationDate !== undefined) updateData.terminationDate = updates.terminationDate || null;
    if (updates.workLocation !== undefined) updateData.workLocation = updates.workLocation;
    
    // Addresses
    if (updates.mothersFullName !== undefined) updateData.mothersFullName = updates.mothersFullName;
    
    // ========== NEW JSONB FIELDS ==========
    updateData.birthPlace = birthPlace;
    updateData.spouseInfo = spouseInfo;
    updateData.children = children;
    updateData.parentSupport = parentSupport;
    updateData.education = education;
    updateData.training = training;
    updateData.workExperience = workExperience;
    updateData.languageSkills = languageSkills;
    if (updates.otherSkills !== undefined) updateData.otherSkills = updates.otherSkills;
    updateData.nationalityAcquisition = nationalityAcquisition;
    updateData.healthInfo = healthInfo;
    updateData.legalInfo = legalInfo;
    updateData.guaranteeInfo = guaranteeInfo;
    updateData.parentsInfo = parentsInfo;
    updateData.emergencyContactAddress = emergencyContactAddress;
    updateData.currentCompany = currentCompany;
    updateData.permanentAddress = permanentAddress;
    updateData.nationalIdDocument = nationalIdDocument;  // ← ADDED
    
    // ========== COMPENSATION & ALLOWANCES ==========
    let newBasicSalary = oldValues.basicSalary;
    let newHousingAllowance = oldValues.housingAllowance;
    let newPositionAllowance = oldValues.positionAllowance;
    let newTransportAllowance = oldValues.transportAllowance;
    let newMobileAllowance = oldValues.mobileAllowance;
    
    if (updates.basicSalary !== undefined) {
      newBasicSalary = parseFloat(updates.basicSalary);
      updateData.basicSalary = newBasicSalary;
    } else if (updates.salary !== undefined) {
      newBasicSalary = parseFloat(updates.salary);
      updateData.basicSalary = newBasicSalary;
    }
    
    if (updates.housingAllowance !== undefined) {
      newHousingAllowance = parseFloat(updates.housingAllowance) || 0;
      updateData.housingAllowance = newHousingAllowance;
    }
    
    if (updates.positionAllowance !== undefined) {
      newPositionAllowance = parseFloat(updates.positionAllowance) || 0;
      updateData.positionAllowance = newPositionAllowance;
    }
    
    if (updates.transportAllowance !== undefined) {
      newTransportAllowance = parseFloat(updates.transportAllowance) || 0;
      updateData.transportAllowance = newTransportAllowance;
    }
    
    if (updates.mobileAllowance !== undefined) {
      newMobileAllowance = parseFloat(updates.mobileAllowance) || 0;
      updateData.mobileAllowance = newMobileAllowance;
    }
    
    // Set complex objects
    updateData.currentAddress = currentAddress;
    updateData.bankAccount = bankAccount;
    updateData.emergencyContact = emergencyContact;
    if (profilePictureUrl !== employee.profilePictureUrl) updateData.profilePictureUrl = profilePictureUrl;

    // Update employee
    await employee.update(updateData, { transaction });

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
      const user = await User.findByPk(employee.userId, { transaction });
      if (user) {
        const userUpdates = {};
        if (updates.email) userUpdates.email = updates.email;
        if (updates.firstName || updates.lastName) {
          userUpdates.fullName = `${updates.firstName || employee.firstName} ${updates.lastName || employee.lastName}`;
        }
        await user.update(userUpdates, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated employee data
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] }
      ]
    });

    // Calculate total allowances
    const housing = parseFloat(updatedEmployee.housingAllowance) || 0;
    const position = parseFloat(updatedEmployee.positionAllowance) || 0;
    const transport = parseFloat(updatedEmployee.transportAllowance) || 0;
    const mobile = parseFloat(updatedEmployee.mobileAllowance) || 0;
    const totalAllowances = housing + position + transport + mobile;

    let message = 'Employee updated successfully';
    if (changes.length > 0) {
      message += ` and ${changes.join(', ')} change(s) logged to compensation history`;
    }

    res.status(200).json({
      success: true,
      message: message,
      data: { 
        id: updatedEmployee.employeeId,
        employeeId: updatedEmployee.employeeCode,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        profilePicture: profilePictureUrl,
        basicSalary: updatedEmployee.basicSalary,
        allowances: {
          housing: housing,
          position: position,
          transport: transport,
          mobile: mobile,
          total: totalAllowances
        },
        changesLogged: changes
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    if (req.file) deleteFile(req.file.path);
    console.error('Update employee error:', error);
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
        
        // National ID Document
        'nationalIdDocument',
        
        // Profile
        'profilePicture', 'profilePictureUrl', 'profilePicturePublicId',
        
        // Status
        'isActive', 'created_at', 'updated_at'
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
    
    console.log('📊 Hiring Trends Request:', { departmentId, months });
    
    // Build department filter
    let deptFilter = '';
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined') {
      deptFilter = `AND department_id = ${parseInt(departmentId)}`;
    }

    // Determine date range based on months parameter
    let monthsValue = null;
    let isAllTime = false;
    
    if (months === 'all' || !months || months === 'undefined') {
      isAllTime = true;
    } else {
      monthsValue = parseInt(months);
      if (isNaN(monthsValue)) {
        isAllTime = true;
      }
    }
    
    console.log('📊 Is All Time:', isAllTime);
    console.log('📊 Months value:', monthsValue);
    console.log('📊 Department filter:', deptFilter);

    // ============================================================
    // QUERY FOR HIRES
    // ============================================================
    let hiresQuery = '';
    
    if (isAllTime) {
      // All time - show all hires
      hiresQuery = `
        SELECT 
          TO_CHAR(hire_date, 'YYYY-MM') as month,
          COUNT(*) as hired
        FROM employees
        WHERE hire_date IS NOT NULL ${deptFilter}
        GROUP BY TO_CHAR(hire_date, 'YYYY-MM')
        ORDER BY month ASC
      `;
    } else {
      // Filtered by months - only show hires within the selected time range
      hiresQuery = `
        SELECT 
          TO_CHAR(hire_date, 'YYYY-MM') as month,
          COUNT(*) as hired
        FROM employees
        WHERE hire_date IS NOT NULL ${deptFilter}
          AND hire_date >= CURRENT_DATE - INTERVAL '${monthsValue} months'
        GROUP BY TO_CHAR(hire_date, 'YYYY-MM')
        ORDER BY month ASC
      `;
    }
    
    const hiresByMonth = await sequelize.query(hiresQuery, { type: sequelize.QueryTypes.SELECT });

    // ============================================================
    // QUERY FOR TERMINATIONS
    // ============================================================
    let terminationsQuery = '';
    
    if (isAllTime) {
      // All time - show all terminations
      terminationsQuery = `
        SELECT 
          TO_CHAR(termination_date, 'YYYY-MM') as month,
          COUNT(*) as terminated
        FROM employees
        WHERE termination_date IS NOT NULL ${deptFilter}
        GROUP BY TO_CHAR(termination_date, 'YYYY-MM')
        ORDER BY month ASC
      `;
    } else {
      // Filtered by months - only show terminations within the selected time range
      terminationsQuery = `
        SELECT 
          TO_CHAR(termination_date, 'YYYY-MM') as month,
          COUNT(*) as terminated
        FROM employees
        WHERE termination_date IS NOT NULL ${deptFilter}
          AND termination_date >= CURRENT_DATE - INTERVAL '${monthsValue} months'
        GROUP BY TO_CHAR(termination_date, 'YYYY-MM')
        ORDER BY month ASC
      `;
    }
    
    const terminationsByMonth = await sequelize.query(terminationsQuery, { type: sequelize.QueryTypes.SELECT });

    console.log('📊 Hires result:', JSON.stringify(hiresByMonth, null, 2));
    console.log('📊 Terminations result:', JSON.stringify(terminationsByMonth, null, 2));

    // ============================================================
    // COMBINE RESULTS
    // ============================================================
    
    // Combine all months from both results
    const monthsSet = new Set();
    hiresByMonth.forEach(h => monthsSet.add(h.month));
    terminationsByMonth.forEach(t => monthsSet.add(t.month));
    
    const allMonths = Array.from(monthsSet).sort();

    // Create maps for quick lookup
    const hiresMap = {};
    hiresByMonth.forEach(h => { hiresMap[h.month] = parseInt(h.hired); });

    const terminationsMap = {};
    terminationsByMonth.forEach(t => { terminationsMap[t.month] = parseInt(t.terminated); });

    // Build final data array
    const formattedData = allMonths.map(month => ({
      month: month,
      hired: hiresMap[month] || 0,
      terminated: terminationsMap[month] || 0,
      netChange: (hiresMap[month] || 0) - (terminationsMap[month] || 0)
    }));

    const totalHired = formattedData.reduce((sum, m) => sum + m.hired, 0);
    const totalTerminated = formattedData.reduce((sum, m) => sum + m.terminated, 0);
    const netGrowth = totalHired - totalTerminated;

    console.log('📊 Final data:', JSON.stringify(formattedData, null, 2));
    console.log('📊 Total Hired:', totalHired, 'Total Terminated:', totalTerminated, 'Net Growth:', netGrowth);

    res.json({
      success: true,
      data: {
        trends: formattedData,
        totalHired,
        totalTerminated,
        netGrowth
      }
    });
  } catch (error) {
    console.error('Get hiring trends error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// 3. DEPARTMENT DISTRIBUTION
// ============================================================================
// ============================================================================
// 3. DEPARTMENT DISTRIBUTION (WITH PAGINATION)
// ============================================================================
exports.getDepartmentDistribution = async (req, res) => {
  try {
    const { page = 1, limit = 20, departmentFilter } = req.query;
    
    // Get department stats (overview - no pagination needed)
    const departmentStats = await Employee.findAll({
      attributes: [
        'departmentId',
        [Sequelize.fn('COUNT', Sequelize.col('Employee.employee_id')), 'count']
      ],
      include: [{ model: Department, attributes: ['name'] }],
      group: ['departmentId', 'Department.department_id', 'Department.name'],
      where: { employmentStatus: 'active' }
    });

    const totalActive = await Employee.count({ where: { employmentStatus: 'active' } });
    
    const departments = departmentStats.map(stat => ({
      departmentId: stat.departmentId,
      departmentName: stat.Department?.name || 'Unknown',
      count: parseInt(stat.dataValues.count),
      percentage: totalActive > 0 ? ((parseInt(stat.dataValues.count) / totalActive) * 100).toFixed(1) : '0'
    }));

    // Build filter for employees list
    let whereCondition = { employmentStatus: 'active' };
    if (departmentFilter && departmentFilter !== 'all') {
      whereCondition.departmentId = parseInt(departmentFilter);
    }

    // Get paginated employees list
    const { limit: queryLimit, offset } = getPagination(page, limit, 20, 100);
    
    const { count, rows: employeesList } = await Employee.findAndCountAll({
      where: whereCondition,
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'workEmail', 'departmentId'],
      include: [{ model: Department, attributes: ['name'] }],
      order: [['departmentId', 'ASC'], ['firstName', 'ASC']],
      limit: queryLimit,
      offset: offset,
      distinct: true
    });

    // Format employees by department for the paginated list
    const employeesByDepartment = {};
    employeesList.forEach(emp => {
      const deptName = emp.Department?.name || 'Unknown';
      if (!employeesByDepartment[deptName]) employeesByDepartment[deptName] = [];
      employeesByDepartment[deptName].push({
        id: emp.employeeId,
        employeeId: emp.employeeCode,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.workEmail
      });
    });

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        departments, // Summary stats
        employeesByDepartment, // Paginated employees
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
// 4. EMPLOYMENT TYPE DISTRIBUTION (WITH PAGINATION & FILTER)
// ============================================================================
exports.getEmploymentTypeDistribution = async (req, res) => {
  try {
    const { page = 1, limit = 20, employmentTypeFilter = 'all' } = req.query;

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

    // Build filter for employees list
    let whereCondition = { employmentStatus: 'active' };
    if (employmentTypeFilter && employmentTypeFilter !== 'all') {
      whereCondition.employmentType = employmentTypeFilter;
    }

    // Get paginated employees list
    const { limit: queryLimit, offset } = getPagination(page, limit, 20, 100);
    
    const { count, rows: employeesList } = await Employee.findAndCountAll({
      where: whereCondition,
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'workEmail', 'employmentType'],
      include: [{ model: Department, attributes: ['name'] }],
      order: [['employmentType', 'ASC'], ['firstName', 'ASC']],
      limit: queryLimit,
      offset: offset,
      distinct: true
    });

    // Format employees by type for the paginated list
    const employeesByType = {};
    employeesList.forEach(emp => {
      const type = emp.employmentType || 'Unknown';
      if (!employeesByType[type]) employeesByType[type] = [];
      employeesByType[type].push({
        id: emp.employeeId,
        employeeId: emp.employeeCode,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.workEmail,
        department: emp.Department?.name || 'Unknown'
      });
    });

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        types, // Summary stats
        employeesByType, // Paginated employees
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
    console.error('Get employment type distribution error:', error);
    res.status(500).json({ success: false, error: error.message });
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
    const { departmentId, page = 1, limit = 20, salaryRange } = req.query;

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
    
    const { limit: queryLimit, offset } = getPagination(page, limit, 20, 100);
    
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
// 7. DOCUMENT COMPLIANCE - REDESIGNED VERSION
// ============================================================================
exports.getDocumentCompliance = async (req, res) => {
  try {
    const { documentType, departmentId, guaranteeMonths } = req.query;

    let deptWhere = {};
    if (departmentId && departmentId !== 'all') {
      deptWhere.departmentId = parseInt(departmentId);
    }

    const activeEmployees = await Employee.findAll({
      where: { employmentStatus: 'active', ...deptWhere },
      attributes: ['employeeId', 'employeeCode', 'firstName', 'lastName', 'workEmail', 'departmentId'],
      include: [
        { model: Department, attributes: ['name'] },
        { model: Position, attributes: ['title'] },
        { 
          model: EmployeeDocument,
          as: 'EmployeeDocuments',
          required: false,
          separate: true
        }
      ]
    });

    const result = {
      id_card: { submitted: [], missing: [] },
      cv: { submitted: [], missing: [] },
      degree: { submitted: [], missing: [] },
      guarantee_letter: { all: [], missing: [], needSecond: [], withTwo: [] },
      summary: {
        activeEmployees: activeEmployees.length,
        fullyCompliant: 0,
        missingDocuments: 0,
        complianceRate: '0'
      }
    };

    let fullyCompliantCount = 0;

    activeEmployees.forEach(emp => {
      const employeeData = {
        id: emp.employeeId,
        employeeId: emp.employeeCode,
        fullName: `${emp.firstName} ${emp.lastName}`,
        department: emp.Department?.name || 'Unknown',
        position: emp.Position?.title || 'Unknown',
        email: emp.workEmail
      };

      const allDocs = emp.EmployeeDocuments || [];
      
      // Process ID Card
      const idCard = allDocs.find(d => d.documentType === 'id_card');
      if (idCard) {
        const monthsOld = calculateMonthsOld(idCard.created_at);
        result.id_card.submitted.push({
          ...employeeData,
          submittedDate: idCard.created_at,
          monthsOld: monthsOld,
          status: getDocumentStatus(monthsOld)  // ✅ ADD STATUS
        });
      } else {
        result.id_card.missing.push({
          ...employeeData,
          status: 'missing'  // ✅ ADD STATUS
        });
      }

      // Process CV
      const cv = allDocs.find(d => d.documentType === 'cv');
      if (cv) {
        const monthsOld = calculateMonthsOld(cv.created_at);
        result.cv.submitted.push({
          ...employeeData,
          submittedDate: cv.created_at,
          monthsOld: monthsOld,
          status: getDocumentStatus(monthsOld)  // ✅ ADD STATUS
        });
      } else {
        result.cv.missing.push({
          ...employeeData,
          status: 'missing'  // ✅ ADD STATUS
        });
      }

      // Process Degree
      const degree = allDocs.find(d => d.documentType === 'degree');
      if (degree) {
        const monthsOld = calculateMonthsOld(degree.created_at);
        result.degree.submitted.push({
          ...employeeData,
          submittedDate: degree.created_at,
          monthsOld: monthsOld,
          status: getDocumentStatus(monthsOld)  // ✅ ADD STATUS
        });
      } else {
        result.degree.missing.push({
          ...employeeData,
          status: 'missing'  // ✅ ADD STATUS
        });
      }

      // Process Guarantee Letters
      const guarantees = allDocs.filter(d => d.documentType === 'guarantee_letter');
      const guaranteeCount = guarantees.length;
      const latestGuarantee = guarantees[0];
      const latestAge = latestGuarantee ? calculateMonthsOld(latestGuarantee.created_at) : null;
      
      const guaranteeData = {
        ...employeeData,
        guaranteeCount: guaranteeCount,
        latestDate: latestGuarantee?.created_at || null,
        latestAge: latestAge,
        status: getGuaranteeStatus(guaranteeCount, latestAge),  // ✅ ADD STATUS
        guarantees: guarantees.map(g => ({
          id: g.documentId,
          submittedDate: g.created_at,
          monthsOld: calculateMonthsOld(g.created_at)
        }))
      };

      result.guarantee_letter.all.push(guaranteeData);
      
      if (guaranteeCount === 0) {
        result.guarantee_letter.missing.push(guaranteeData);
      }
      if (guaranteeCount === 1) {
        result.guarantee_letter.needSecond.push(guaranteeData);
      }
      if (guaranteeCount >= 2) {
        result.guarantee_letter.withTwo.push(guaranteeData);
      }

      // Check if fully compliant
      const hasAllDocuments = idCard && cv && degree && guaranteeCount >= 2;
      if (hasAllDocuments) {
        fullyCompliantCount++;
      }
    });

    const complianceRate = activeEmployees.length > 0 
      ? ((fullyCompliantCount / activeEmployees.length) * 100).toFixed(1) 
      : '0';

    result.summary = {
      activeEmployees: activeEmployees.length,
      fullyCompliant: fullyCompliantCount,
      missingDocuments: activeEmployees.length - fullyCompliantCount,
      complianceRate: complianceRate
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get document compliance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function for document status
function getDocumentStatus(monthsOld) {
  if (!monthsOld && monthsOld !== 0) return 'missing';
  if (monthsOld > 12) return 'expired';
  if (monthsOld > 6) return 'expiring_soon';
  if (monthsOld > 3) return 'recent';
  return 'valid';
}

// Helper function for guarantee status
function getGuaranteeStatus(guaranteeCount, latestAge) {
  if (guaranteeCount === 0) return 'no_guarantee';
  if (guaranteeCount === 1) return 'need_second';
  if (guaranteeCount >= 2) {
    if (latestAge > 12) return 'expired';
    if (latestAge > 6) return 'expiring_soon';
    return 'compliant';
  }
  return 'unknown';
}



function calculateMonthsOld(date) {
  const diff = new Date() - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
}




// ============================================================================
// IMPORT EMPLOYEES (BULK CREATE WITH USER ACCOUNTS & ALLOWANCES)
// ============================================================================
exports.importEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No employee data provided' 
      });
    }

    const results = {
      success: [],
      failed: [],
      total: employees.length,
      successCount: 0,
      failedCount: 0
    };

    for (const empData of employees) {
      try {
        // Validate required fields
        if (!empData.firstName || !empData.lastName || !empData.email || !empData.phone || 
            !empData.departmentId || !empData.positionId || !empData.employmentType || !empData.hireDate) {
          results.failed.push({
            data: empData,
            error: 'Missing required fields'
          });
          results.failedCount++;
          continue;
        }

        // Check for duplicate email
        const existingEmployee = await Employee.findOne({ 
          where: { workEmail: empData.email } 
        });
        
        if (existingEmployee) {
          results.failed.push({
            data: empData,
            error: `Employee with email "${empData.email}" already exists`
          });
          results.failedCount++;
          continue;
        }

        // Check if user already exists
        let user = await User.findOne({ where: { email: empData.email } });
        let isNewUser = false;
        let temporaryPassword = null;

        if (!user) {
          isNewUser = true;
          
          // Generate unique username
          const username = await generateUniqueUsername(empData.email, empData.firstName, empData.lastName);
          
          // Generate random temporary password
          temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
          
          // Get role ID for 'employee'
          const employeeRole = await Role.findOne({ where: { name: 'employee' } });
          const employeeRoleId = employeeRole ? employeeRole.roleId : 3;
          
          // Create new user
          user = await User.create({
            username: username,
            email: empData.email,
            fullName: `${empData.firstName} ${empData.lastName}`,
            passwordHash: hashedPassword,
            roleId: employeeRoleId,
            departmentId: empData.departmentId || null,
            isActive: true,
            createdBy: req.user.userId
          });
        }

        // Generate employee code
        const employeeCode = await generateEmployeeCode();

        // Parse basic salary
        const basicSalary = empData.salary ? parseFloat(empData.salary) : 0;
        
        // ========== FIXED: Use provided allowance values (default to 0) ==========
        // NO auto-calculation - use values from import or default to 0
        const housingAllowance = empData.housingAllowance !== undefined && empData.housingAllowance !== '' 
          ? parseFloat(empData.housingAllowance) 
          : 0;
        const positionAllowance = empData.positionAllowance !== undefined && empData.positionAllowance !== '' 
          ? parseFloat(empData.positionAllowance) 
          : 0;
        const transportAllowance = empData.transportAllowance !== undefined && empData.transportAllowance !== '' 
          ? parseFloat(empData.transportAllowance) 
          : 0;

        const mobileAllowance = empData.mobileAllowance !== undefined && empData.mobileAllowance !== ''  
          ? parseFloat(empData.mobileAllowance) 
          : 0;

        // Parse optional JSON fields
        let emergencyContact = {};
        let bankAccount = {};
        
        if (empData.emergencyContact) {
          try {
            emergencyContact = typeof empData.emergencyContact === 'string' 
              ? JSON.parse(empData.emergencyContact) 
              : empData.emergencyContact;
          } catch (e) {
            emergencyContact = {};
          }
        }
        
        if (empData.bankAccount) {
          try {
            bankAccount = typeof empData.bankAccount === 'string' 
              ? JSON.parse(empData.bankAccount) 
              : empData.bankAccount;
          } catch (e) {
            bankAccount = {};
          }
        }

        // Create employee with allowances
        const employee = await Employee.create({
          employeeCode,
          userId: user.userId,
          firstName: empData.firstName,
          lastName: empData.lastName,
          middleName: empData.middleName || null,
            fullNameEnglish: empData.fullNameEnglish || null,
          workEmail: empData.email,
          personalEmail: empData.personalEmail || null,
          phoneNumber: empData.phone,
          dateOfBirth: empData.dob || null,
          gender: empData.gender || null,
          maritalStatus: empData.maritalStatus || null,
          nationality: empData.nationality || null,
          departmentId: parseInt(empData.departmentId),
          positionId: parseInt(empData.positionId),
          managerId: empData.managerId ? parseInt(empData.managerId) : null,
          employmentType: empData.employmentType,
          employmentStatus: 'active',
          hireDate: empData.hireDate,
          basicSalary: basicSalary,
          housingAllowance: housingAllowance,
          positionAllowance: positionAllowance,
          transportAllowance: transportAllowance,
          mobileAllowance: mobileAllowance,
          currentAddress: empData.address ? { street: empData.address } : {},
          workLocation: empData.workLocation || null,
          emergencyContact: emergencyContact,
          bankAccount: bankAccount,
          profilePictureUrl: null,
          isActive: true
        });

        // Calculate total allowances for response
        const totalAllowances = housingAllowance + positionAllowance + transportAllowance + mobileAllowance;

        results.success.push({
          id: employee.employeeId,
          employeeId: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          email: employee.workEmail,
          basicSalary: basicSalary,
          allowances: {
            housing: housingAllowance,
            position: positionAllowance,
            transport: transportAllowance,
              mobile: mobileAllowance,
            total: totalAllowances
          },
          grossPay: basicSalary + totalAllowances,
          temporaryPassword: isNewUser ? temporaryPassword : null
        });
        
        results.successCount++;

      } catch (error) {
        console.error('Error importing employee:', error);
        results.failed.push({
          data: empData,
          error: error.message
        });
        results.failedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed: ${results.successCount} successful, ${results.failedCount} failed`,
      data: results
    });

  } catch (error) {
    console.error('Import employees error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};






// ==================== GET EMPLOYEE COMPENSATION HISTORY ====================
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
// 8. GET HIRING DETAILS (HIRED & TERMINATED EMPLOYEES)
// ============================================================================
exports.getHiringDetails = async (req, res) => {
  try {
    const { departmentId, months } = req.query;
    
    console.log('📊 Hiring Details Request:', { departmentId, months });
    
    // Build department filter
    let deptCondition = '';
    let deptWhere = {};
    if (departmentId && departmentId !== 'all' && departmentId !== 'null' && departmentId !== 'undefined') {
      const deptId = parseInt(departmentId);
      deptCondition = `AND e.department_id = ${deptId}`;
      deptWhere.departmentId = deptId;
    }

    // Determine date range
    let dateConditionHired = '';
    let dateConditionTerminated = '';
    let isAllTime = false;
    
    if (months && months !== 'all' && months !== 'undefined' && months !== 'null') {
      const monthsValue = parseInt(months);
      if (!isNaN(monthsValue)) {
        dateConditionHired = `AND e.hire_date >= CURRENT_DATE - INTERVAL '${monthsValue} months'`;
        dateConditionTerminated = `AND e.termination_date >= CURRENT_DATE - INTERVAL '${monthsValue} months'`;
      } else {
        isAllTime = true;
      }
    } else {
      isAllTime = true;
    }
    
    console.log('📊 Is All Time:', isAllTime);
    console.log('📊 Department condition:', deptCondition);
    
    // Get hired employees
    let hiredQuery = `
      SELECT 
        e.employee_id as id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as full_name,
        COALESCE(d.name, 'Unknown') as department,
        COALESCE(p.title, 'Unknown') as position,
        e.hire_date as hireDate,
        e.work_email as email,
        e.basic_salary as salary
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      WHERE e.hire_date IS NOT NULL
        ${deptCondition}
        ${dateConditionHired}
      ORDER BY e.hire_date DESC
    `;
    
    // Get terminated employees
    let terminatedQuery = `
      SELECT 
        e.employee_id as id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as full_name,
        COALESCE(d.name, 'Unknown') as department,
        COALESCE(p.title, 'Unknown') as position,
        e.termination_date as terminationDate,
        e.work_email as email,
        e.basic_salary as salary
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      WHERE e.termination_date IS NOT NULL
        ${deptCondition}
        ${dateConditionTerminated}
      ORDER BY e.termination_date DESC
    `;
    
    console.log('📊 Hired Query:', hiredQuery);
    console.log('📊 Terminated Query:', terminatedQuery);
    
    const hiredEmployees = await sequelize.query(hiredQuery, { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    const terminatedEmployees = await sequelize.query(terminatedQuery, { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log(`📊 Found ${hiredEmployees.length} hired employees`);
    console.log(`📊 Found ${terminatedEmployees.length} terminated employees`);
    
    res.json({
      success: true,
      data: {
        hired: hiredEmployees,
        terminated: terminatedEmployees,
        summary: {
          totalHired: hiredEmployees.length,
          totalTerminated: terminatedEmployees.length,
          netGrowth: hiredEmployees.length - terminatedEmployees.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Get hiring details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// ============================================================================
// GENERIC DOCUMENT UPLOAD HANDLER (NEW ENDPOINT)
// ============================================================================
exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { subType, index, description } = req.body;
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
    
    // ========== PROFILE PICTURES ==========
    if (documentType === 'profile_picture') {
      if (employee.profilePictureUrl) {
        const oldFileName = employee.profilePictureUrl.split('/').pop();
        const oldFilePath = path.join(__dirname, '..', 'uploads', 'profiles', oldFileName);
        deleteFile(oldFilePath);
      }
      
      // ✅ ABSOLUTE URL
      const profilePictureUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;
      await employee.update({ profilePictureUrl });
      
      const document = await EmployeeDocument.create({
        employeeId: id,
        documentType: 'profile_picture',
        subType: subType || null,
        index: index ? parseInt(index) : null,
        documentName: req.file.originalname,
        fileName: req.file.filename,
        fileUrl: profilePictureUrl,  // ✅ ABSOLUTE
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null
      });
      
      return res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          id: document.documentId,
          type: 'profile_picture',
          fileName: req.file.originalname,
          fileUrl: profilePictureUrl,  // ✅ ABSOLUTE
          uploadedAt: document.created_at
        }
      });
    }
    
    // ========== REGULAR DOCUMENTS ==========
    const folder = getDocumentFolder(documentType);
    
    if (!folder || folder === 'others') {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        error: `Unknown document type: ${documentType}`
      });
    }
    
    // ✅ ABSOLUTE URL for regular documents
    const relativePath = `/uploads/documents/${folder}/${req.file.filename}`;
    const absoluteUrl = `${baseUrl}${relativePath}`;
    
    const document = await EmployeeDocument.create({
      employeeId: id,
      documentType: documentType,
      subType: subType || null,
      index: index ? parseInt(index) : null,
      documentName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl: absoluteUrl,  // ✅ ABSOLUTE
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: description || null
    });
    
    // Update JSONB field with ABSOLUTE URL
    await updateEmployeeJsonbField(id, documentType, index, {
      documentId: document.documentId,
      fileUrl: absoluteUrl,  // ✅ ABSOLUTE
      fileName: req.file.originalname
    });
    
    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.documentId,
        type: documentType,
        fileName: req.file.originalname,
        fileUrl: absoluteUrl,  // ✅ ABSOLUTE
        uploadedAt: document.created_at
      }
    });
    
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};