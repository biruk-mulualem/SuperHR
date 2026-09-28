'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('holdreleases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      release_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      hold_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      release_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      release_percent: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      release_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      release_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      released_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      released_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      applied_to_period_id: {
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
    await queryInterface.dropTable('holdreleases');
  }
};