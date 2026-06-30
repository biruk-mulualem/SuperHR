module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_extensions', {
      extension_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      leave_request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_date: {
        type: Sequelize.DATEONLY,
      },
      original_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      additional_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_new_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: "pending",
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      approved_date: {
        type: Sequelize.DATEONLY,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
      },
      rejected_by: {
        type: Sequelize.INTEGER,
      },
      rejected_date: {
        type: Sequelize.DATEONLY,
      },
      new_end_date: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.addConstraint('leave_extensions', {
      fields: ['leave_request_id'],
      ...{
      type: 'foreign key',
      name: 'leave_extensions_leave_request_id_fkey',
      references: {
        table: 'leave_requests',
        field: 'leave_request_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('leave_extensions', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'leave_extensions_approved_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('leave_extensions', {
      fields: ['rejected_by'],
      ...{
      type: 'foreign key',
      name: 'leave_extensions_rejected_by_fkey',
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
    await queryInterface.dropTable('leave_extensions');
  }
};
