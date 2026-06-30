module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_transactions', {
      transaction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: Sequelize.INTEGER,
      },
      payroll_item_id: {
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
      payment_method: {
        type: Sequelize.STRING,
      },
      transaction_reference: {
        type: Sequelize.STRING,
      },
      payment_date: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'returned'),
        defaultValue: "pending",
      },
      processed_by: {
        type: Sequelize.INTEGER,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['session_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_session_id_fkey',
      references: {
        table: 'payment_sessions',
        field: 'session_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['payroll_item_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_payroll_item_id_fkey',
      references: {
        table: 'payroll_items',
        field: 'payroll_item_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['processed_by'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_processed_by_fkey',
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
    await queryInterface.dropTable('payment_transactions');
  }
};
