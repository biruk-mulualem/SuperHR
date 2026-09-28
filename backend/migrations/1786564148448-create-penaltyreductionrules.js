'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penaltyreductionrules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rule_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rule_type: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      min_value: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      max_value: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      reduction_value: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      created_by: {
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
    await queryInterface.dropTable('penaltyreductionrules');
  }
};