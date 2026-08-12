'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('returnedpayrolls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      returned_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      payroll_processing_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      month: {
        type: Sequelize.STRING,
        allowNull: true
      },
      original_payment_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      return_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      return_source: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paid_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      kept_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      payment_history_id: {
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
    await queryInterface.dropTable('returnedpayrolls');
  }
};