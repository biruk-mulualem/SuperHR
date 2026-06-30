module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('import_errors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      import_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      row_number: {
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.INTEGER,
      },
      error_type: {
        type: Sequelize.STRING,
      },
      error_message: {
        type: Sequelize.TEXT,
      },
      raw_data: {
        type: Sequelize.JSONB,
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      resolved_at: {
        type: Sequelize.DATE,
      },
      resolution_notes: {
        type: Sequelize.TEXT,
      },
    });
    await queryInterface.addConstraint('import_errors', {
      fields: ['import_batch_id'],
      ...{
      type: 'foreign key',
      name: 'import_errors_import_batch_id_fkey',
      references: {
        table: 'import_batches',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('import_errors');
  }
};
