const { Employee, Department, Position, User, EmployeeDocument,CompensationHistory, Role ,sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate unique employee code
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
// CREATE EMPLOYEE (WITHOUT PROFILE PICTURE)
// ============================================================================

exports.createEmployee = async (req, res) => {
  try {
    // Parse form data - ADDED allowance fields
    const {
      firstName, lastName, middleName, email, phone, dob, gender,
      maritalStatus, nationality, departmentId, positionId, managerId,
      employmentType, hireDate, salary, address, workLocation,
      personalEmail, emergencyContact, bankAccount,
        housingAllowance, positionAllowance, transportAllowance, mobileAllowance  
    } = req.body;

    

    // Validate required fields
    if (!firstName || !lastName || !departmentId || !positionId || !employmentType || !hireDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, departmentId, positionId, employmentType, hireDate'
      });
    }

    // Check for duplicate email
    const existingEmployee = await Employee.findOne({ 
      where: { workEmail: email } 
    });
    
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        error: `Employee with email "${email}" already exists.`
      });
    }
    
    // Auto-create or find existing user
    let user = null;
    let isNewUser = false;
    
    if (email) {
      user = await User.findOne({ where: { email: email } });
    }
    
    if (!user) {
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
        createdBy: req.user.userId
      });
    }

    // Generate employee code
    const employeeCode = await generateEmployeeCode();
    
    // Parse basic salary
    const basicSalary = salary ? parseFloat(salary) : 0;
    
    // Use provided allowances or default to 0 (NO auto-calculation)
    const finalHousingAllowance = housingAllowance !== undefined && housingAllowance !== '' ? parseFloat(housingAllowance) : 0;
    const finalPositionAllowance = positionAllowance !== undefined && positionAllowance !== '' ? parseFloat(positionAllowance) : 0;
    const finalTransportAllowance = transportAllowance !== undefined && transportAllowance !== '' ? parseFloat(transportAllowance) : 0;
    const finalMobileAllowance = mobileAllowance !== undefined && mobileAllowance !== '' ? parseFloat(mobileAllowance) : 0;

    // Parse JSON strings
    let parsedEmergencyContact = emergencyContact;
    let parsedBankAccount = bankAccount;
    
    if (emergencyContact && typeof emergencyContact === 'string') {
      try { parsedEmergencyContact = JSON.parse(emergencyContact); } catch (e) { parsedEmergencyContact = {}; }
    }
    
    if (bankAccount && typeof bankAccount === 'string') {
      try { parsedBankAccount = JSON.parse(bankAccount); } catch (e) { parsedBankAccount = {}; }
    }

    // Create employee with allowances
    const employee = await Employee.create({
      employeeCode,
      userId: user.userId,
      firstName,
      lastName,
      middleName: middleName || null,
      workEmail: email,
      personalEmail: personalEmail || null,
      phoneNumber: phone,
      dateOfBirth: dob || null,
      gender: gender || null,
      maritalStatus: maritalStatus || null,
      nationality: nationality || null,
      departmentId: parseInt(departmentId),
      positionId: parseInt(positionId),
      managerId: managerId ? parseInt(managerId) : null,
      employmentType: employmentType,
      employmentStatus: 'active',
      hireDate: hireDate,
      basicSalary: basicSalary,
      housingAllowance: finalHousingAllowance,
      positionAllowance: finalPositionAllowance,
      transportAllowance: finalTransportAllowance,
      mobileAllowance: finalMobileAllowance, 
      currentAddress: address ? { street: address } : {},
      workLocation: workLocation || null,
      emergencyContact: parsedEmergencyContact || {},
      bankAccount: parsedBankAccount || {},
      profilePictureUrl: null,
      isActive: true
    });

    // Prepare response
    const responseData = {
      id: employee.employeeId,
      employeeId: employee.employeeCode,
      fullName: `${employee.firstName} ${employee.lastName}`,
      profilePicture: null,
      allowances: {
        housing: parseFloat(employee.housingAllowance) || 0,
        position: parseFloat(employee.positionAllowance) || 0,
        transport: parseFloat(employee.transportAllowance) || 0,
        total: (parseFloat(employee.housingAllowance) || 0) + 
               (parseFloat(employee.positionAllowance) || 0) + 
               (parseFloat(employee.transportAllowance) || 0)+
               (parseFloat(employee.mobileAllowance) || 0),
      },
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        isNewUser: isNewUser
      }
    };
    
    if (isNewUser) {
      responseData.message = `Employee created successfully. Default password is "password123".`;
    } else {
      responseData.message = 'Employee created and linked to existing user successfully';
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
  
  // Log Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    console.error('Validation errors:');
    error.errors.forEach((err, index) => {
      console.error(`  ${index + 1}. Field: ${err.path}`);
      console.error(`     Message: ${err.message}`);
      console.error(`     Value:`, err.value);
      console.error(`     Type: ${err.type}`);
    });
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Log unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    console.error('Unique constraint violation:');
    error.errors.forEach((err, index) => {
      console.error(`  ${index + 1}. ${err.message}`);
    });
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry error',
      details: error.errors.map(e => e.message)
    });
  }
  
  // Log other errors
  console.error('Full error object:', JSON.stringify(error, null, 2));
  if (error.parent) {
    console.error('Database error:', error.parent.message);
  }
  
  res.status(500).json({ 
    success: false, 
    error: error.message,
    details: error.parent?.message || null
  });
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
// UPDATE EMPLOYEE (WITH ALLOWANCES & COMPENSATION HISTORY)
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

    // Prepare update data
    const updateData = {};
    
    // Basic info
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.middleName !== undefined) updateData.middleName = updates.middleName;
    if (updates.email !== undefined) updateData.workEmail = updates.email;
    if (updates.personalEmail !== undefined) updateData.personalEmail = updates.personalEmail;
    if (updates.phone !== undefined) updateData.phoneNumber = updates.phone;
    if (updates.dob !== undefined) updateData.dateOfBirth = updates.dob;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.maritalStatus !== undefined) updateData.maritalStatus = updates.maritalStatus;
    if (updates.nationality !== undefined) updateData.nationality = updates.nationality;
    
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
    if (updates.permanentAddress !== undefined) updateData.permanentAddress = updates.permanentAddress;
    
    // ==============================================
    // COMPENSATION & ALLOWANCES
    // ==============================================
    
    let newBasicSalary = oldValues.basicSalary;
    let newHousingAllowance = oldValues.housingAllowance;
    let newPositionAllowance = oldValues.positionAllowance;
    let newTransportAllowance = oldValues.transportAllowance;
    let newMobileAllowance = oldValues.mobileAllowance;
    
    // Basic Salary
    if (updates.basicSalary !== undefined) {
      newBasicSalary = parseFloat(updates.basicSalary);
      updateData.basicSalary = newBasicSalary;
    } else if (updates.salary !== undefined) {
      newBasicSalary = parseFloat(updates.salary);
      updateData.basicSalary = newBasicSalary;
    }
    
    // Housing Allowance
    if (updates.housingAllowance !== undefined) {
      newHousingAllowance = parseFloat(updates.housingAllowance) || 0;
      updateData.housingAllowance = newHousingAllowance;
    }
    
    // Position Allowance
    if (updates.positionAllowance !== undefined) {
      newPositionAllowance = parseFloat(updates.positionAllowance) || 0;
      updateData.positionAllowance = newPositionAllowance;
    }
    
    // Transport Allowance
    if (updates.transportAllowance !== undefined) {
      newTransportAllowance = parseFloat(updates.transportAllowance) || 0;
      updateData.transportAllowance = newTransportAllowance;
    }
    
    // Mobile Allowance
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

    // ==============================================
    // LOG COMPENSATION CHANGES TO HISTORY TABLE
    // ONLY IF THERE IS AN ACTUAL CHANGE
    // ==============================================
    const userId = req.user?.userId;
    const changes = [];

    // Helper function to compare if values actually changed
    const hasChanged = (oldVal, newVal) => {
      const oldNum = parseFloat(oldVal) || 0;
      const newNum = parseFloat(newVal) || 0;
      return oldNum !== newNum;
    };

    // Helper function to safely calculate percentage change (prevents Infinity)
    const calculateChangePercent = (oldVal, newVal) => {
      const oldNum = parseFloat(oldVal) || 0;
      const newNum = parseFloat(newVal) || 0;
      
      // If old value is 0, percentage change is 100% if new > 0, or 0 if new is also 0
      if (oldNum === 0) {
        return newNum > 0 ? 100 : 0;
      }
      
      return ((newNum - oldNum) / oldNum) * 100;
    };

    // Check Basic Salary change
    if (hasChanged(oldValues.basicSalary, newBasicSalary)) {
      const changePercent = calculateChangePercent(oldValues.basicSalary, newBasicSalary);
      
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Basic Salary',
        old_value: oldValues.basicSalary,
        new_value: newBasicSalary,
        change_percent: changePercent,
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Basic salary updated from ${oldValues.basicSalary} to ${newBasicSalary}`,
        approved_by: userId
      }, { transaction });
      
      changes.push('Basic Salary');
    }
    
    // Check Housing Allowance change
    if (hasChanged(oldValues.housingAllowance, newHousingAllowance)) {
      const changePercent = calculateChangePercent(oldValues.housingAllowance, newHousingAllowance);
      
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Housing Allowance',
        old_value: oldValues.housingAllowance,
        new_value: newHousingAllowance,
        change_percent: changePercent,
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Housing allowance updated from ${oldValues.housingAllowance} to ${newHousingAllowance}`,
        approved_by: userId
      }, { transaction });
      
      changes.push('Housing Allowance');
    }
    
    // Check Position Allowance change
    if (hasChanged(oldValues.positionAllowance, newPositionAllowance)) {
      const changePercent = calculateChangePercent(oldValues.positionAllowance, newPositionAllowance);
      
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Position Allowance',
        old_value: oldValues.positionAllowance,
        new_value: newPositionAllowance,
        change_percent: changePercent,
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Position allowance updated from ${oldValues.positionAllowance} to ${newPositionAllowance}`,
        approved_by: userId
      }, { transaction });
      
      changes.push('Position Allowance');
    }
    
    // Check Transport Allowance change
    if (hasChanged(oldValues.transportAllowance, newTransportAllowance)) {
      const changePercent = calculateChangePercent(oldValues.transportAllowance, newTransportAllowance);
      
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Transport Allowance',
        old_value: oldValues.transportAllowance,
        new_value: newTransportAllowance,
        change_percent: changePercent,
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Transport allowance updated from ${oldValues.transportAllowance} to ${newTransportAllowance}`,
        approved_by: userId
      }, { transaction });
      
      changes.push('Transport Allowance');
    }
    
    // Check Mobile Allowance change
    if (hasChanged(oldValues.mobileAllowance, newMobileAllowance)) {
      const changePercent = calculateChangePercent(oldValues.mobileAllowance, newMobileAllowance);
      
      await CompensationHistory.create({
        employee_id: id,
        component_type: 'Mobile Allowance',
        old_value: oldValues.mobileAllowance,
        new_value: newMobileAllowance,
        change_percent: changePercent,
        effective_date: new Date().toISOString().split('T')[0],
        reason: updates.reason || `Mobile allowance updated from ${oldValues.mobileAllowance} to ${newMobileAllowance}`,
        approved_by: userId
      }, { transaction });
      
      changes.push('Mobile Allowance');
    }

    // Also update User's email and fullName if changed
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

    // Build response message
    let message = 'Employee updated successfully';
    if (changes.length > 0) {
      message += ` and ${changes.join(', ')} change(s) logged to compensation history`;
    } else {
      message += ' (no compensation changes detected)';
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

    const fileName = document.fileUrl.split('/').pop();
    deleteFile(path.join('uploads/documents/', fileName));
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

    // Build search conditions - improved full name search
    let searchCondition = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
      
      if (searchWords.length === 1) {
        // Single word search
        searchCondition = {
          [Op.or]: [
            { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
            { firstName: { [Op.iLike]: `%${searchTerm}%` } },
            { lastName: { [Op.iLike]: `%${searchTerm}%` } },
            { middleName: { [Op.iLike]: `%${searchTerm}%` } },
            { workEmail: { [Op.iLike]: `%${searchTerm}%` } },
            { phoneNumber: { [Op.iLike]: `%${searchTerm}%` } },
            { '$Department.name$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$Position.title$': { [Op.iLike]: `%${searchTerm}%` } }
          ]
        };
      } else {
        // Multiple words - each word must match at least one field
        const wordConditions = searchWords.map(word => ({
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${word}%` } },
            { lastName: { [Op.iLike]: `%${word}%` } },
            { middleName: { [Op.iLike]: `%${word}%` } },
            { employeeCode: { [Op.iLike]: `%${word}%` } },
            { workEmail: { [Op.iLike]: `%${word}%` } },
            { phoneNumber: { [Op.iLike]: `%${word}%` } },
            { '$Department.name$': { [Op.iLike]: `%${word}%` } },
            { '$Position.title$': { [Op.iLike]: `%${word}%` } }
          ]
        }));
        
        searchCondition = {
          [Op.and]: wordConditions
        };
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

    const whereCondition = {
      ...searchCondition,
      ...filterCondition
    };

    // Remove undefined values
    Object.keys(whereCondition).forEach(key => {
      if (whereCondition[key] === undefined || whereCondition[key] === '') {
        delete whereCondition[key];
      }
    });

    // Pagination
    const { limit: queryLimit, offset } = getPagination(page, limit, 10, 100);
    
    // Sorting
    const allowedSortFields = ['employeeId', 'firstName', 'lastName', 'hireDate', 'employmentStatus', 'basicSalary'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'employeeId';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Execute query
    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereCondition,
      attributes: [
        'employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName',
        'workEmail', 'phoneNumber', 'employmentType', 'employmentStatus',
        'hireDate', 'basicSalary', 'profilePictureUrl', 'departmentId', 'positionId', 'mobileAllowance'
      ],
      include: [
        { 
          model: Department, 
          attributes: ['departmentId', 'name', 'code'],
          required: false
        },
        { 
          model: Position, 
          attributes: ['positionId', 'title'],
          required: false
        },
        {
          model: Employee,
          as: 'manager',
          attributes: ['employeeId', 'firstName', 'lastName'],
          required: false
        }
      ],
      limit: queryLimit,
      offset: offset,
      order: [[sortField, sortDirection]],
      distinct: true,
      subQuery: false
    });

    // Format response
    const formattedEmployees = employees.map(emp => ({
      id: emp.employeeId,
      employeeId: emp.employeeCode,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      email: emp.workEmail,
      phone: emp.phoneNumber,
      departmentId: emp.departmentId,
      departmentName: emp.Department?.name,
      departmentCode: emp.Department?.code,
      position: emp.Position?.title,
      positionId: emp.positionId,
      employmentType: emp.employmentType,
      status: emp.employmentStatus,
      hireDate: emp.hireDate,
      salary: emp.basicSalary,
      mobileAllowance: emp.mobileAllowance,
      profilePictureUrl: emp.profilePictureUrl,
      managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null
    }));

    const totalPages = Math.ceil(count / queryLimit);
    const currentPage = parseInt(page);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    res.status(200).json({
      success: true,
      data: formattedEmployees,
      pagination: {
        total: count,
        page: currentPage,
        limit: queryLimit,
        totalPages: totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? currentPage + 1 : null,
        prevPage: hasPrevPage ? currentPage - 1 : null,
        startOffset: offset + 1,
        endOffset: Math.min(offset + queryLimit, count)
      },
      filters: {
        search: search || null,
        departmentId: departmentId !== 'all' ? departmentId : null,
        employmentStatus: employmentStatus !== 'all' ? employmentStatus : null,
        employmentType: employmentType !== 'all' ? employmentType : null,
        positionId: positionId !== 'all' ? positionId : null
      },
      sorting: {
        field: sortField,
        order: sortDirection
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
    
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      attributes: [
        'employeeId', 'employeeCode', 'firstName', 'lastName', 'middleName',
        'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
        'personalEmail', 'workEmail', 'phoneNumber', 'emergencyContact',
        'currentAddress', 'permanentAddress', 'departmentId', 'positionId',
        'managerId', 'employmentType', 'employmentStatus', 'hireDate',
        'confirmationDate', 'terminationDate', 'basicSalary',
        'housingAllowance', 'positionAllowance', 'transportAllowance','mobileAllowance',
        'bankAccount', 'workLocation', 'profilePictureUrl', 'isActive'
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
      attributes: ['documentId', 'documentType', 'documentName', 'fileUrl', 'fileSize', 'mimeType', 'created_at'],
      order: [['documentType', 'ASC'], ['created_at', 'DESC']]
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Group documents by type with full URLs
    const groupedDocuments = {
      id_card: null,
      cv: null,
      degree: null,
      guarantee_letters: []
    };

    documents.forEach(doc => {
      const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${baseUrl}${doc.fileUrl}`;
      
      const docData = {
        id: doc.documentId,
        type: doc.documentType,
        fileName: doc.documentName,
        fileUrl: fullUrl,
        size: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.created_at
      };

      if (doc.documentType === 'guarantee_letter') {
        groupedDocuments.guarantee_letters.push(docData);
      } else {
        groupedDocuments[doc.documentType] = docData;
      }
    });

    // Fix profile picture URL
    let profilePictureUrl = employee.profilePictureUrl;
    if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
      profilePictureUrl = `${baseUrl}${profilePictureUrl}`;
    }

    // Parse JSON fields if they are stored as strings
    let currentAddress = employee.currentAddress;
    let bankAccount = employee.bankAccount;
    let emergencyContact = employee.emergencyContact;

    if (typeof currentAddress === 'string') {
      try {
        currentAddress = JSON.parse(currentAddress);
      } catch (e) {
        currentAddress = { street: currentAddress };
      }
    }

    if (typeof bankAccount === 'string') {
      try {
        bankAccount = JSON.parse(bankAccount);
      } catch (e) {
        bankAccount = {};
      }
    }

    if (typeof emergencyContact === 'string') {
      try {
        emergencyContact = JSON.parse(emergencyContact);
      } catch (e) {
        emergencyContact = {};
      }
    }

    // Calculate total allowances
    const housingAllowance = parseFloat(employee.housingAllowance) || 0;
    const positionAllowance = parseFloat(employee.positionAllowance) || 0;
    const transportAllowance = parseFloat(employee.transportAllowance) || 0;
    const mobileAllowance = parseFloat(employee.mobileAllowance) || 0; 
    const totalAllowances = housingAllowance + positionAllowance + transportAllowance + mobileAllowance;
    const grossPay = (parseFloat(employee.basicSalary) || 0) + totalAllowances;

    res.status(200).json({
      success: true,
      data: {
        // Basic Info
        id: employee.employeeId,
        employeeId: employee.employeeCode,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        middleName: employee.middleName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        
        // Contact Info
        email: employee.workEmail,
        personalEmail: employee.personalEmail,
        phone: employee.phoneNumber,
        
        // Personal Details
        dob: employee.dateOfBirth,
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        nationality: employee.nationality,
        
        // Employment Details
        departmentId: employee.departmentId,
        departmentName: employee.Department?.name,
        departmentCode: employee.Department?.code,
        positionId: employee.positionId,
        position: employee.Position?.title,
        positionLevel: employee.Position?.level,
        managerId: employee.managerId,
        managerName: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null,
        employmentType: employee.employmentType,
        status: employee.employmentStatus,
        employmentStatus: employee.employmentStatus,
        hireDate: employee.hireDate,
        confirmationDate: employee.confirmationDate,
        terminationDate: employee.terminationDate,
        
        // Compensation & Allowances
        salary: employee.basicSalary,
        basicSalary: employee.basicSalary,
        housingAllowance: housingAllowance,
        positionAllowance: positionAllowance,
        transportAllowance: transportAllowance,
        mobileAllowance: mobileAllowance,
        totalAllowances: totalAllowances,
        grossPay: grossPay,
        
        // Location & Address
        workLocation: employee.workLocation,
        address: currentAddress?.street || '',
        currentAddress: currentAddress,
        permanentAddress: employee.permanentAddress,
        
        // Additional Info
        emergencyContact: emergencyContact,
        bankAccount: bankAccount,
        
        // Profile
        profilePicture: profilePictureUrl,
        profilePictureUrl: profilePictureUrl,
        isActive: employee.isActive,
        
        // Documents
        documents: groupedDocuments
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
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
exports.getEmployeeCompensationHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Use CompensationHistory directly (not db.CompensationHistory)
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

    // Format response for frontend
    const formattedHistories = histories.rows.map(history => ({
      id: history.history_id,
      employeeId: history.employee_id,
      component: history.component_type,
      oldValue: parseFloat(history.old_value),
      newValue: parseFloat(history.new_value),
      percentageChange: parseFloat(history.change_percent),
      changeDate: history.effective_date,
      reason: history.reason,
      submittedBy: history.approver?.fullName || 'System',
      changeType: history.new_value > history.old_value ? 'increase' : 'decrease',
      difference: Math.abs(parseFloat(history.new_value) - parseFloat(history.old_value))
    }));

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



