module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('onhold_payroll_details', {
      detail_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      onhold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      allowances_total: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      overtime_pay: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      gross_pay: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      absent_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      late_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      other_penalties: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      tax: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      pension_7: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      pension_11: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      net_held_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      released_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "held",
      },
      payment_history_id: {
        type: Sequelize.INTEGER,
      },
      released_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('onhold_payroll_details', {
      fields: ['onhold_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_details_onhold_id_fkey',
      references: {
        table: 'onhold_payroll',
        field: 'onhold_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('onhold_payroll_details', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_details_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('onhold_payroll_details', {
      fields: ['payment_history_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_details_payment_history_id_fkey',
      references: {
        table: 'payroll_history',
        field: 'history_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('onhold_payroll_details');
  }
};
