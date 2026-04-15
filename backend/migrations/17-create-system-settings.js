// migrations/20240101000000-create-system-settings.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_settings', {
      setting_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      data_type: {
        type: Sequelize.ENUM('json', 'string', 'number', 'boolean', 'array'),
        defaultValue: 'json',
      },
      is_editable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_encrypted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create indexes for better performance
    await queryInterface.addIndex('system_settings', ['setting_key']);
    await queryInterface.addIndex('system_settings', ['category']);
    await queryInterface.addIndex('system_settings', ['updated_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('system_settings');
  }
};