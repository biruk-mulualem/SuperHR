module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_history', {
      history_id: {
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
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      method: {
        type: Sequelize.STRING,
        defaultValue: "Bank Transfer",
      },
      transaction_id: {
        type: Sequelize.STRING,
      },
      processed_by: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "completed",
      },
      source: {
        type: Sequelize.STRING,
        defaultValue: "normal",
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('payroll_history', {
      fields: ['payroll_processing_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_history_payroll_processing_id_fkey',
      references: {
        table: 'payroll_processing',
        field: 'processing_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_history', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_history_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payroll_history');
  }
};
