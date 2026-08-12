'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payrollperiods', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      period_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      processed_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_employees: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      total_basic_salary: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_allowances: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_overtime: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_gross: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_tax: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_pension_employee: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_pension_employer: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_penalties: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_net: {
        type: Sequelize.DECIMAL,
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
    await queryInterface.dropTable('payrollperiods');
  }
};