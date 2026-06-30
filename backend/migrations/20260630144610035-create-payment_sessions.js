module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_sessions', {
      session_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      session_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_window_days: {
        type: Sequelize.INTEGER,
        defaultValue: 7,
      },
      unclaimed_window_days: {
        type: Sequelize.INTEGER,
        defaultValue: 14,
      },
      total_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      employee_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'expired'),
        defaultValue: "active",
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
    await queryInterface.addConstraint('payment_sessions', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'payment_sessions_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_sessions', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'payment_sessions_created_by_fkey',
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
    await queryInterface.dropTable('payment_sessions');
  }
};
