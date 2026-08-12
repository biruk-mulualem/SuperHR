'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penaltysummarys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      summary_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      penalty_id: {
        type: Sequelize.INTEGER,
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
      penalty_type: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      penalty_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      penalty_category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      deducted_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      current_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      original_percentage: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      deducted_percentage: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      current_percentage: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      last_reduction_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      last_reduced_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_reduction_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reference_document: {
        type: Sequelize.STRING,
        allowNull: true
      },
      submitted_by: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('penaltysummarys');
  }
};