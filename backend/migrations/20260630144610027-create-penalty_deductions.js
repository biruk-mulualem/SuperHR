module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penalty_deductions', {
      deduction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      summary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      penalty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deduction_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      deduction_type: {
        type: Sequelize.ENUM('percent_reduction', 'amount_reduction', 'full_reduction'),
        allowNull: false,
      },
      deduction_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      deduction_percentage: {
        type: Sequelize.DECIMAL,
      },
      previous_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      new_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      previous_percentage: {
        type: Sequelize.DECIMAL,
      },
      new_percentage: {
        type: Sequelize.DECIMAL,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      processed_by: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      approved_by: {
        type: Sequelize.STRING,
      },
      is_batch: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      batch_id: {
        type: Sequelize.STRING,
      },
      batch_rule_applied: {
        type: Sequelize.JSON,
      },
      reference: {
        type: Sequelize.STRING,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('penalty_deductions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_deductions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_deductions', {
      fields: ['summary_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_deductions_summary_id_fkey',
      references: {
        table: 'penalty_summaries',
        field: 'summary_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('penalty_deductions');
  }
};
