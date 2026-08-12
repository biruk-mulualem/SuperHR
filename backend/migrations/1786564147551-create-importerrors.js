'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('importerrors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      import_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      row_number: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      error_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolution_notes: {
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
    await queryInterface.dropTable('importerrors');
  }
};