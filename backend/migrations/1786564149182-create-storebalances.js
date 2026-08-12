'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('storebalances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      balance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      minStockAlert: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
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
    await queryInterface.dropTable('storebalances');
  }
};