module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('charity_settings', {
      setting_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      setting_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: "main",
      },
      distribution_release: {
        type: Sequelize.JSONB,
      },
      defaults: {
        type: Sequelize.JSONB,
      },
      updated_by: {
        type: Sequelize.INTEGER,
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
    await queryInterface.addConstraint('charity_settings', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'charity_settings_updated_by_fkey',
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
    await queryInterface.dropTable('charity_settings');
  }
};
