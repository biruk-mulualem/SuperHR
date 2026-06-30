module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_to_store_relationships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      source_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      target_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: "active",
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
    await queryInterface.addConstraint('store_to_store_relationships', {
      fields: ['source_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_to_store_relationships_source_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_to_store_relationships', {
      fields: ['target_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_to_store_relationships_target_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('store_to_store_relationships');
  }
};
