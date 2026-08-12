'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('returnedpayments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      return_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      return_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      returned_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      penalty_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      resolved_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('returnedpayments');
  }
};