module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_periods', {
      period_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      period_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
      },
      status: {
        type: Sequelize.ENUM('draft', 'processing', 'processed', 'paid', 'closed'),
        defaultValue: "draft",
      },
      processed_by: {
        type: Sequelize.INTEGER,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      total_employees: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_basic_salary: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_allowances: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_overtime: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_gross: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_tax: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_pension_employee: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_pension_employer: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_penalties: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_net: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('payroll_periods', {
      fields: ['processed_by'],
      ...{
      type: 'foreign key',
      name: 'payroll_periods_processed_by_fkey',
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
    await queryInterface.dropTable('payroll_periods');
  }
};
