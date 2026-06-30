module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recurring_deductions', {
      deduction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deduction_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      deduction_type_value: {
        type: Sequelize.STRING,
        defaultValue: "fixed",
      },
      percentage_value: {
        type: Sequelize.DECIMAL,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
      },
      total_months: {
        type: Sequelize.INTEGER,
      },
      remaining_months: {
        type: Sequelize.INTEGER,
      },
      reference_number: {
        type: Sequelize.STRING,
      },
      submitted_by: {
        type: Sequelize.STRING,
      },
      contact: {
        type: Sequelize.STRING,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      date: {
        type: Sequelize.DATEONLY,
      },
      created_by_name: {
        type: Sequelize.STRING,
      },
      last_applied_period_id: {
        type: Sequelize.INTEGER,
      },
      last_applied_at: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: "active",
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('recurring_deductions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'recurring_deductions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('recurring_deductions', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'recurring_deductions_approved_by_fkey',
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
    await queryInterface.dropTable('recurring_deductions');
  }
};
