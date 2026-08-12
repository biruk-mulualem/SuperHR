'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recurringdeductions', {
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
      deduction_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      deduction_type_value: {
        type: Sequelize.STRING,
        allowNull: true
      },
      percentage_value: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      total_months: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      remaining_months: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      submitted_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      created_by_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_applied_period_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      last_applied_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      approved_by: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('recurringdeductions');
  }
};