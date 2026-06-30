module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_balance_histories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      balance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
      previous_balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      new_balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      change_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      transaction_type: {
        type: Sequelize.ENUM('Stock In', 'Stock Out'),
        allowNull: false,
      },
      source_store_id: {
        type: Sequelize.INTEGER,
      },
      destination_store_id: {
        type: Sequelize.INTEGER,
      },
      reference_type: {
        type: Sequelize.ENUM('purchase', 'transfer', 'adjustment', 'return', 'sale', 'initialization', 'request'),
        allowNull: false,
        defaultValue: "adjustment",
      },
      reference_id: {
        type: Sequelize.INTEGER,
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      remark: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['balance_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_balance_id_fkey',
      references: {
        table: 'store_balances',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['item_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_item_id_fkey',
      references: {
        table: 'items',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['source_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_source_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['destination_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_destination_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['changed_by'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_changed_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('store_balance_histories');
  }
};
