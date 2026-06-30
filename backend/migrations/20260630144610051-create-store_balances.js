module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_balances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      min_stock_alert: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: "Active",
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
    await queryInterface.addConstraint('store_balances', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balances_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balances', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'store_balances_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balances', {
      fields: ['item_id'],
      ...{
      type: 'foreign key',
      name: 'store_balances_item_id_fkey',
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
    await queryInterface.dropTable('store_balances');
  }
};
