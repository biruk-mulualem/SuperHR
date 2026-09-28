'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employeeCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      middleName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fullNameEnglish: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dateOfBirthEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dateOfBirthGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      maritalStatus: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: true
      },
      nationalId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      nationalIdDocument: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      workEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      personalEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      currentAddress: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      permanentAddress: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      birthPlace: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      workLocation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      currentCompany: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      positionId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      managerId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employmentType: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      employmentStatus: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      hireDateEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hireDateGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      confirmationDateEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      confirmationDateGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      terminationDateEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      terminationDateGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      shiftType: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      basicSalary: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      housingAllowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      positionAllowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      transportAllowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      mobileAllowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      bankAccount: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      emergencyContact: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      emergencyContactAddress: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      mothersFullName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      spouseInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      children: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      parentsInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      parentSupport: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      education: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      training: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      workExperience: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      languageSkills: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      otherSkills: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      nationalityAcquisition: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      healthInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      legalInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      guaranteeInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePictureUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePicturePublicId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('employees');
  }
};