'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      standardName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      barcode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      uomId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      conversionUomId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      conversionValue: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      costPrice: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      isActive: {
        type: Sequelize.VIRTUAL,
        allowNull: true
      },
      specType: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      specText: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specPdfName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      specPdfSize: {
        type: Sequelize.STRING,
        allowNull: true
      },
      specPdfUrl: {
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
    await queryInterface.dropTable('items');
  }
};