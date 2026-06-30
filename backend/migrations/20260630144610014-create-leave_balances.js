module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_balances', {
      leave_balance_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      years_of_service: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      yearly_entitlement: {
        type: Sequelize.INTEGER,
        defaultValue: 16,
      },
      carried_over: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      carried_over_from_year: {
        type: Sequelize.INTEGER,
      },
      carried_over_expiry_date: {
        type: Sequelize.DATEONLY,
      },
      total_allocation: {
        type: Sequelize.INTEGER,
        defaultValue: 16,
      },
      used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      pending_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      available_days: {
        type: Sequelize.INTEGER,
        defaultValue: 16,
      },
      sick_used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      sick_alert_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      maternity_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      maternity_used_date: {
        type: Sequelize.DATEONLY,
      },
      paternity_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      paternity_used_date: {
        type: Sequelize.DATEONLY,
      },
      bereavement_used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      unpaid_used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('leave_balances', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'leave_balances_employee_id_fkey',
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
    await queryInterface.dropTable('leave_balances');
  }
};
