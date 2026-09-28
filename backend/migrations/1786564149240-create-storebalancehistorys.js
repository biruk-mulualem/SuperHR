'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('storebalancehistorys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      balanceId: {
        type: Sequelize.INTEGER,
        allowNull: true
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
      previousBalance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      newBalance: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      changeAmount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      transactionType: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      sourceStoreId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      destinationStoreId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      referenceType: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      referenceId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      changedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      remark: {
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
    await queryInterface.dropTable('storebalancehistorys');
  }
};