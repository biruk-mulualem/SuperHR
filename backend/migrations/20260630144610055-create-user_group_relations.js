module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_group_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.addConstraint('user_group_relations', {
      fields: ['user_id'],
      ...{
      type: 'foreign key',
      name: 'user_group_relations_user_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('user_group_relations', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'user_group_relations_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_group_relations');
  }
};
