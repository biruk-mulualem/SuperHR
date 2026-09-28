'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penaltyreductions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reduction_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      penalty_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      amount_reduced: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      percent_reduced: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      new_penalty_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      new_penalty_percent: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reduced_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      reduced_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('penaltyreductions');
  }
};