module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('item_request_details', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      remark: {
        type: Sequelize.TEXT,
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
    await queryInterface.addConstraint('item_request_details', {
      fields: ['request_id'],
      ...{
      type: 'foreign key',
      name: 'item_request_details_request_id_fkey',
      references: {
        table: 'item_requests',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('item_request_details', {
      fields: ['item_id'],
      ...{
      type: 'foreign key',
      name: 'item_request_details_item_id_fkey',
      references: {
        table: 'items',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('item_request_details');
  }
};
