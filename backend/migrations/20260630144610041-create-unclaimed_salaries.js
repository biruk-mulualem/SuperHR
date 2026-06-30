module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unclaimed_salaries', {
      unclaimed_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      days_overdue: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('unclaimed', 'claimed', 'written_off'),
        defaultValue: "unclaimed",
      },
      claimed_date: {
        type: Sequelize.DATEONLY,
      },
      claimed_by: {
        type: Sequelize.INTEGER,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['transaction_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_transaction_id_fkey',
      references: {
        table: 'payment_transactions',
        field: 'transaction_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['claimed_by'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_claimed_by_fkey',
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
    await queryInterface.dropTable('unclaimed_salaries');
  }
};
