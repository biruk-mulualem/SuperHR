module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employee_penalties', {
      penalty_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
      },
      penalty_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      calculation_type: {
        type: Sequelize.ENUM('fixed', 'percent'),
        defaultValue: "fixed",
      },
      value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      calculated_amount: {
        type: Sequelize.DECIMAL,
      },
      reference: {
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
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'applied', 'cancelled', 'reduced'),
        defaultValue: "active",
      },
      original_value: {
        type: Sequelize.DECIMAL,
      },
      reduction_reason: {
        type: Sequelize.TEXT,
      },
      reduced_by: {
        type: Sequelize.STRING,
      },
      reduced_at: {
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
      penalty_date: {
        type: Sequelize.DATEONLY,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_label: {
        type: Sequelize.STRING,
      },
      reduced_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
    });
    await queryInterface.addConstraint('employee_penalties', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'employee_penalties_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('employee_penalties', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'employee_penalties_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('employee_penalties', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'employee_penalties_created_by_fkey',
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
    await queryInterface.dropTable('employee_penalties');
  }
};
