module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('deduction_applications', {
      application_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deduction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount_applied: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      submitted_by: {
        type: Sequelize.INTEGER,
      },
      submitted_by_name: {
        type: Sequelize.STRING,
      },
      contact: {
        type: Sequelize.STRING,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      application_date: {
        type: Sequelize.DATEONLY,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'applied'),
        defaultValue: "applied",
      },
      approval_reference: {
        type: Sequelize.STRING,
      },
      is_partial: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['deduction_id'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_deduction_id_fkey',
      references: {
        table: 'recurring_deductions',
        field: 'deduction_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['submitted_by'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_submitted_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('deduction_applications');
  }
};
