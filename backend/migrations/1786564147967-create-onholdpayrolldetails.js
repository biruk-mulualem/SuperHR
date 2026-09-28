'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('onholdpayrolldetails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      detail_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      onhold_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      month: {
        type: Sequelize.STRING,
        allowNull: true
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      allowances_total: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      overtime_pay: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      gross_pay: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      absent_penalty: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      late_penalty: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      other_penalties: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      tax: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      pension_7: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      pension_11: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      net_held_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      released_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payment_history_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      released_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('onholdpayrolldetails');
  }
};