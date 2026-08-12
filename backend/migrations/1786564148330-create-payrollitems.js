'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payrollitems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      payroll_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      housing_allowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      position_allowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      transport_allowance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_allowances: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      overtime_hours: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      overtime_pay: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      bonus_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      other_income: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      gross_pay: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      taxable_income: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      tax_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      tax_bracket_applied: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pension_employee: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      pension_employer: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      absent_days: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      absent_penalty: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      late_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      late_penalty: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_penalties: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      loan_deduction: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      advance_deduction: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      cooperative_deduction: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      other_deductions: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      carry_forward_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      net_pay: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      is_on_hold: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      hold_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      hold_reason: {
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
    await queryInterface.dropTable('payrollitems');
  }
};