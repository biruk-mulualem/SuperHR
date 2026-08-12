'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penaltydeductions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      deduction_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      summary_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      penalty_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      deduction_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      deduction_type: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      deduction_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      deduction_percentage: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      previous_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      new_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      previous_percentage: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      new_percentage: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      processed_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      processed_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_batch: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      batch_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      batch_rule_applied: {
        type: Sequelize.JSON,
        allowNull: true
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('penaltydeductions');
  }
};