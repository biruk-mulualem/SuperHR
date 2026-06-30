module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('returned_payroll', {
      returned_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payroll_processing_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      original_payment_id: {
        type: Sequelize.INTEGER,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      return_reason: {
        type: Sequelize.TEXT,
      },
      return_source: {
        type: Sequelize.STRING,
        defaultValue: "bulk",
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },
      paid_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      kept_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      payment_history_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['payroll_processing_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_payroll_processing_id_fkey',
      references: {
        table: 'payroll_processing',
        field: 'processing_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['original_payment_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_original_payment_id_fkey',
      references: {
        table: 'payroll_history',
        field: 'history_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['payment_history_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_payment_history_id_fkey',
      references: {
        table: 'payroll_history',
        field: 'history_id'
      },
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('returned_payroll');
  }
};
