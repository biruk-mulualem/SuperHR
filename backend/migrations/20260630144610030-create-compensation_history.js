module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('compensation_history', {
      history_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      component_type: {
        type: Sequelize.STRING,
      },
      old_value: {
        type: Sequelize.DECIMAL,
      },
      new_value: {
        type: Sequelize.DECIMAL,
      },
      change_percent: {
        type: Sequelize.DECIMAL,
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('compensation_history', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'compensation_history_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('compensation_history', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'compensation_history_approved_by_fkey',
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
    await queryInterface.dropTable('compensation_history');
  }
};
