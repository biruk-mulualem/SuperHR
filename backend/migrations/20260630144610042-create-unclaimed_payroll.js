module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unclaimed_payroll', {
      unclaimed_id: {
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
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      days_overdue: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "unclaimed",
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
    await queryInterface.addConstraint('unclaimed_payroll', {
      fields: ['payroll_processing_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_payroll_payroll_processing_id_fkey',
      references: {
        table: 'payroll_processing',
        field: 'processing_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('unclaimed_payroll', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_payroll_employee_id_fkey',
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
    await queryInterface.dropTable('unclaimed_payroll');
  }
};
