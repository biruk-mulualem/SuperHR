'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leavetypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leaveTypeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      defaultDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isPaid: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      hasFixedLimit: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      isOneTime: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      requiresApproval: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      minNoticeDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      maxConsecutiveDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requiresDocumentation: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      genderRestriction: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      carryOverLimit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      carryOverExpiryYears: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      sortOrder: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('leavetypes');
  }
};