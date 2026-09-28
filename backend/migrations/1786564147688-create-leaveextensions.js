'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leaveextensions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      extensionId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      leaveRequestId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requestedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      originalEndDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      additionalDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requestedNewEndDate: {
        type: Sequelize.DATEONLY,
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
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      approvedDate: {
        type: Sequelize.DATEONLY,
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
      newEndDate: {
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
    await queryInterface.dropTable('leaveextensions');
  }
};