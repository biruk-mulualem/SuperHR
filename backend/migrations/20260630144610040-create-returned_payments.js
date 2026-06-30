module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('returned_payments', {
      return_id: {
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
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      return_reason: {
        type: Sequelize.STRING,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
      },
      returned_amount: {
        type: Sequelize.DECIMAL,
      },
      penalty_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'resolved', 'written_off'),
        defaultValue: "pending",
      },
      resolved_by: {
        type: Sequelize.INTEGER,
      },
      resolved_at: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('returned_payments', {
      fields: ['transaction_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payments_transaction_id_fkey',
      references: {
        table: 'payment_transactions',
        field: 'transaction_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('returned_payments', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payments_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payments', {
      fields: ['resolved_by'],
      ...{
      type: 'foreign key',
      name: 'returned_payments_resolved_by_fkey',
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
    await queryInterface.dropTable('returned_payments');
  }
};
