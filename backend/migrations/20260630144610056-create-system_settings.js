module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_settings', {
      setting_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      setting_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      data_type: {
        type: Sequelize.ENUM('json', 'string', 'number', 'boolean', 'array'),
        defaultValue: "json",
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
    await queryInterface.addConstraint('system_settings', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'system_settings_updated_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};
