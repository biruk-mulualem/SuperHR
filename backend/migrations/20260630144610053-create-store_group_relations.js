module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_group_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
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
    await queryInterface.addConstraint('store_group_relations', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'store_group_relations_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_group_relations', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'store_group_relations_group_id_fkey',
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
    await queryInterface.dropTable('store_group_relations');
  }
};
