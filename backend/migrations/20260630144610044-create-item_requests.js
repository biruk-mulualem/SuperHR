module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('item_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      request_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      asking_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      supplying_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_by_id: {
        type: Sequelize.INTEGER,
      },
      requested_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'finalized'),
        allowNull: false,
        defaultValue: "pending",
      },
      remark: {
        type: Sequelize.TEXT,
      },
      approved_at: {
        type: Sequelize.DATE,
      },
      finalized_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addConstraint('item_requests', {
      fields: ['asking_store_id'],
      ...{
      type: 'foreign key',
      name: 'item_requests_asking_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('item_requests', {
      fields: ['supplying_store_id'],
      ...{
      type: 'foreign key',
      name: 'item_requests_supplying_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('item_requests', {
      fields: ['requested_by_id'],
      ...{
      type: 'foreign key',
      name: 'item_requests_requested_by_id_fkey',
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
    await queryInterface.dropTable('item_requests');
  }
};
