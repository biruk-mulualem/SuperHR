'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leaverequests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leaveRequestId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      leaveTypeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      leaveTypeName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      returnDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      totalDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      requestedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      approvedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      approvalNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejectedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rejectedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      hrNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      returnStatus: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      actualReturnDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      daysLate: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      returnConfirmedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      returnConfirmedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      extensionCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      totalExtensionDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      lastExtendedDate: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.dropTable('leaverequests');
  }
};