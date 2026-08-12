'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('systemsettings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      settingId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      settingKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      settingValue: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dataType: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      isEditable: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      isEncrypted: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      version: {
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
    await queryInterface.dropTable('systemsettings');
  }
};