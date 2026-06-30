module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('request_group_processing', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processed', 'skipped'),
        allowNull: false,
        defaultValue: "pending",
      },
      remark: {
        type: Sequelize.TEXT,
      },
      processed_by: {
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('request_group_processing', {
      fields: ['request_id'],
      ...{
      type: 'foreign key',
      name: 'request_group_processing_request_id_fkey',
      references: {
        table: 'item_requests',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('request_group_processing', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'request_group_processing_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('request_group_processing', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'request_group_processing_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('request_group_processing', {
      fields: ['processed_by'],
      ...{
      type: 'foreign key',
      name: 'request_group_processing_processed_by_fkey',
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
    await queryInterface.dropTable('request_group_processing');
  }
};
