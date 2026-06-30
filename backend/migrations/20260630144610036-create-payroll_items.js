module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_items', {
      payroll_item_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      housing_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      position_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      transport_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_allowances: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      overtime_hours: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      overtime_pay: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      bonus_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      other_income: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      gross_pay: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      taxable_income: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      tax_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      tax_bracket_applied: {
        type: Sequelize.STRING,
      },
      pension_employee: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      pension_employer: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      absent_days: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      absent_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      late_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      late_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_penalties: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      loan_deduction: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      advance_deduction: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      cooperative_deduction: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      other_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      carry_forward_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      net_pay: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      is_on_hold: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      hold_id: {
        type: Sequelize.INTEGER,
      },
      hold_reason: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('payroll_items', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_items_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_items', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_items_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_items', {
      fields: ['hold_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_items_hold_id_fkey',
      references: {
        table: 'salary_holds',
        field: 'hold_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payroll_items');
  }
};
