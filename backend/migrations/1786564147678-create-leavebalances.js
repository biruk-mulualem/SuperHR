'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leavebalances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leaveBalanceId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      yearsOfService: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      yearlyEntitlement: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      carriedOver: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      carriedOverFromYear: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      carriedOverExpiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      totalAllocation: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      usedThisYear: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      pendingDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      availableDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sickUsedThisYear: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sickAlertSent: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      maternityUsed: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      maternityUsedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      paternityUsed: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      paternityUsedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      bereavementUsedThisYear: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      unpaidUsedThisYear: {
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
    await queryInterface.dropTable('leavebalances');
  }
};