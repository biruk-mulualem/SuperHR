module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hold_releases', {
      release_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      release_type: {
        type: Sequelize.STRING,
      },
      release_percent: {
        type: Sequelize.DECIMAL,
      },
      release_amount: {
        type: Sequelize.DECIMAL,
      },
      release_reason: {
        type: Sequelize.TEXT,
      },
      released_by: {
        type: Sequelize.INTEGER,
      },
      released_at: {
        type: Sequelize.DATE,
      },
      applied_to_period_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('hold_releases', {
      fields: ['hold_id'],
      ...{
      type: 'foreign key',
      name: 'hold_releases_hold_id_fkey',
      references: {
        table: 'salary_holds',
        field: 'hold_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('hold_releases', {
      fields: ['released_by'],
      ...{
      type: 'foreign key',
      name: 'hold_releases_released_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('hold_releases', {
      fields: ['applied_to_period_id'],
      ...{
      type: 'foreign key',
      name: 'hold_releases_applied_to_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hold_releases');
  }
};
