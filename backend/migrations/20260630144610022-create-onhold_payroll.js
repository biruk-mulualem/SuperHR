module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('onhold_payroll', {
      onhold_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      hold_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      hold_reason: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "active",
      },
      total_held_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_released_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      months_on_hold: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('onhold_payroll', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_employee_id_fkey',
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
    await queryInterface.dropTable('onhold_payroll');
  }
};
