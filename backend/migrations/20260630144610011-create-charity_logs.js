module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('charity_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_id: {
        type: Sequelize.INTEGER,
      },
      details: {
        type: Sequelize.JSONB,
      },
      user_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('charity_logs', {
      fields: ['user_id'],
      ...{
      type: 'foreign key',
      name: 'charity_logs_user_id_fkey',
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
    await queryInterface.dropTable('charity_logs');
  }
};
