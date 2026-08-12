'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('itemrequests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      requestId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requestCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      askingStoreId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      supplyingStoreId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requestedById: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requestedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      finalizedAt: {
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
    await queryInterface.dropTable('itemrequests');
  }
};