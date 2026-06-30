module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_holds', {
      hold_id: {
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
      hold_reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hold_duration_months: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
      },
      released_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
      },
      status: {
        type: Sequelize.ENUM('active', 'released', 'partially_released'),
        defaultValue: "active",
      },
      released_by: {
        type: Sequelize.INTEGER,
      },
      released_at: {
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
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['released_by'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_released_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_created_by_fkey',
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
    await queryInterface.dropTable('salary_holds');
  }
};
