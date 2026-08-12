'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('departmenttransfers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transferId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      fromDepartmentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      toDepartmentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      transferDateEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transferDateGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
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
    await queryInterface.dropTable('departmenttransfers');
  }
};