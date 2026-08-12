'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('importbatchs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      import_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      period_start: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      period_end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      period_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total_rows: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      success_rows: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      error_rows: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      imported_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
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
    await queryInterface.dropTable('importbatchs');
  }
};