module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penalty_reductions', {
      reduction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      penalty_id: {
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
      amount_reduced: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      percent_reduced: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      new_penalty_amount: {
        type: Sequelize.DECIMAL,
      },
      new_penalty_percent: {
        type: Sequelize.DECIMAL,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      reduced_by: {
        type: Sequelize.INTEGER,
      },
      reduced_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['penalty_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_penalty_id_fkey',
      references: {
        table: 'attendance_records',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['reduced_by'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_reduced_by_fkey',
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
    await queryInterface.dropTable('penalty_reductions');
  }
};
