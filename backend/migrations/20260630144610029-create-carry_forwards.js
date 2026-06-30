module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('carry_forwards', {
      carry_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'cleared', 'written_off'),
        defaultValue: "pending",
      },
      cleared_in_period_id: {
        type: Sequelize.INTEGER,
      },
      cleared_at: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('carry_forwards', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'carry_forwards_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('carry_forwards', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'carry_forwards_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('carry_forwards', {
      fields: ['cleared_in_period_id'],
      ...{
      type: 'foreign key',
      name: 'carry_forwards_cleared_in_period_id_fkey',
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
    await queryInterface.dropTable('carry_forwards');
  }
};
