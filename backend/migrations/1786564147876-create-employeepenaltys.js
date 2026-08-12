'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employeepenaltys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      penalty_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      calculation_type: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      value: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      calculated_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      reference: {
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
      month: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      original_value: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      reduction_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reduced_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reduced_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      penalty_date: {
        type: Sequelize.DATEONLY,
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
      period_label: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reduced_amount: {
        type: Sequelize.DECIMAL,
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
    await queryInterface.dropTable('employeepenaltys');
  }
};