'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      Employee.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Employee.belongsTo(models.Department, { foreignKey: 'departmentId' });
      Employee.belongsTo(models.Position, { foreignKey: 'positionId' });
      Employee.belongsTo(models.Employee, { foreignKey: 'managerId', as: 'manager' });
      Employee.hasMany(models.Employee, { foreignKey: 'managerId', as: 'subordinates' });
      Employee.hasMany(models.EmployeeDocument, { foreignKey: 'employeeId' });
      Employee.hasMany(models.AttendanceRecord, { foreignKey: 'employee_id', as: 'attendance_records' });
    }

    // Helper method to calculate total allowances
    getTotalAllowances() {
      return (this.housingAllowance || 0) + 
             (this.positionAllowance || 0) + 
             (this.transportAllowance || 0) +
             (this.mobileAllowance || 0);
    }

    // Helper method to calculate gross pay (without overtime)
    getGrossPay() {
      return (this.basicSalary || 0) + this.getTotalAllowances();
    }

    // Helper method to get full name
    getFullName() {
      return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`;
    }
  }

  Employee.init(
    {
      employeeId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'employee_id',
      },
      employeeCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'employee_code',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },

      
      // ========== BASIC PERSONAL INFORMATION ==========
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'last_name',
      },
      middleName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'middle_name',
      },// In Employee model
fullNameEnglish: {
  type: DataTypes.STRING(255),
  allowNull: true,
  field: 'full_name_english'
},
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth',
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
      },
      maritalStatus: {
        type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
        allowNull: true,
        field: 'marital_status',
      },
      nationality: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      nationalId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'national_id',
      },
      
      // ========== NATIONAL ID DOCUMENT (NEW) ==========
      nationalIdDocument: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'national_id_document',
        comment: 'National ID document: documentUrl, documentId, fileName'
      },
      
      // ========== CONTACT INFORMATION ==========
      workEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'work_email',
      },
      personalEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'personal_email',
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'phone_number',
      },
      
      // ========== ADDRESSES ==========
      currentAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'current_address',
        comment: 'Current address: region, subcity, kebele, district, poBox, houseNumber'
      },
      permanentAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'permanent_address',
        comment: 'Permanent address: region, city, subcity, district, houseNumber'
      },
      birthPlace: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'birth_place',
        comment: 'Birth place: region, city, subcity, district'
      },
      workLocation: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'work_location',
      },
      
      // ========== CURRENT COMPANY INFORMATION ==========
      currentCompany: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'current_company',
        comment: 'Current company: companyName, companyTin, companyPhone, companyEmail, companyAddress, poBox, website'
      },
      
      // ========== EMPLOYMENT DETAILS ==========
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'department_id',
      },
      positionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'position_id',
      },
      managerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'manager_id',
      },
      employmentType: {
        type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'intern'),
        defaultValue: 'full-time',
        field: 'employment_type',
      },
      employmentStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'on-leave', 'terminated', 'retired'),
        defaultValue: 'active',
        field: 'employment_status',
      },
      hireDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'hire_date',
      },
      confirmationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'confirmation_date',
      },
      terminationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'termination_date',
      },
      shiftType: {
        type: DataTypes.ENUM('day', 'night'),
        defaultValue: 'day',
        field: 'shift_type',
      },
      
      // ========== SALARY & ALLOWANCES ==========
      basicSalary: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'basic_salary',
      },
      housingAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'housing_allowance',
        comment: 'Housing allowance'
      },
      positionAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'position_allowance',
        comment: 'Position allowance'
      },
      transportAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'transport_allowance',
        comment: 'Transport allowance'
      },
      mobileAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'mobile_allowance',
        comment: 'Mobile allowance'
      },
      
      // ========== BANK ACCOUNT ==========
      bankAccount: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'bank_account',
        comment: 'Bank account: bankName, accountNumber, accountHolderName, branch'
      },
      
      // ========== EMERGENCY CONTACT ==========
      emergencyContact: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'emergency_contact',
        comment: 'Emergency contact: name, relationship, phone, alternatePhone'
      },
      emergencyContactAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'emergency_contact_address',
        comment: 'Emergency contact address: city, subcity, district, kebele'
      },
      
      // ========== FAMILY INFORMATION ==========
      mothersFullName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'mothers_full_name'
      },
      spouseInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'spouse_info',
        comment: 'Spouse: tinNumber, fullName, dateOfBirth, jobStatus, companyName, companyAddress, profilePictureDocumentId, marriageCertificateDocumentId, profilePictureUrl, marriageCertificateUrl'
      },
      children: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'children',
        comment: 'Array of children: name, dateOfBirth, hasMedicalCondition, medicalConditionNotes, isAdopted, birthCertificateDocumentId, medicalReportDocumentId, adoptionCertificateDocumentId, profilePictureDocumentId, birthCertificateUrl, medicalReportUrl, adoptionCertificateUrl, profilePictureUrl'
      },
      parentsInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'parents_info',
        comment: 'Parents: father {fullName, monthlyIncome, job}, mother {fullName, monthlyIncome, job}, financialSupport, otherSupport'
      },
      parentSupport: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'parent_support',
        comment: 'Array of parent support: parentType, supportType, amount, frequency, notes, documentId, documentUrl'
      },
      
      // ========== EDUCATION & TRAINING ==========
      education: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'education',
        comment: 'Array of education: level, institutionName, institutionAddress, startDate, endDate, isCurrent, certificateDocumentId, certificateUrl'
      },
      training: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'training',
        comment: 'Array of training: trainingName, institutionName, institutionAddress, startDate, endDate, certificateDocumentId, certificateUrl'
      },
      
      // ========== WORK EXPERIENCE ==========
      workExperience: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'work_experience',
        comment: 'Array of work experience: position, companyName, companyTin, companyType, companyAddress, startDate, endDate, monthlySalary, salaryWhenLeft, providentFundSubmitted, providentFundStartDate, terminationReason, documentId, documentUrl'
      },
      
      // ========== SKILLS ==========
      languageSkills: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'language_skills',
        comment: 'Array of languages: language, proficiency (basic/intermediate/advanced/fluent/native)'
      },
      otherSkills: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'other_skills'
      },
      
      // ========== NATIONALITY ACQUISITION ==========
      nationalityAcquisition: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'nationality_acquisition',
        comment: 'How acquired: type (by_birth/by_law/ethiopian_birth), documentId, documentUrl'
      },
      
      // ========== HEALTH & LEGAL ==========
      healthInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'health_info',
        comment: 'Health information: hasPhysicalInjury, injuryDescription'
      },
      legalInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'legal_info',
        comment: 'Legal information: hasCriminalRecord, criminalRecordDescription'
      },
      
      // ========== GUARANTEE INFORMATION ==========
      guaranteeInfo: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'guarantee_info',
        comment: 'Array of guarantors: guarantorName, guarantorJob, guarantorOfficeName, guarantorOfficeAddress, guaranteeLetterNo, guaranteeLetterDate, sdtLetterNo, sdtLetterDate, confirmedDate, guaranteeLetterUrl, sdtLetterUrl, otherDocumentUrl'
      },
      
      // ========== PROFILE PICTURE ==========
      profilePicture: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_picture',
      },
      profilePictureUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_picture_url',
      },
      profilePicturePublicId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'profile_picture_public_id',
      },
      
      // ========== STATUS FIELDS ==========
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      modelName: 'Employee',
      tableName: 'employees',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Employee;
};