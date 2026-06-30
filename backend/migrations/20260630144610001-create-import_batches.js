module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('import_batches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING,
      },
      import_date: {
        type: Sequelize.DATE,
      },
      period_start: {
        type: Sequelize.DATEONLY,
      },
      period_end: {
        type: Sequelize.DATEONLY,
      },
      period_type: {
        type: Sequelize.STRING,
      },
      total_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      success_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      error_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "processing",
      },
      imported_by: {
        type: Sequelize.INTEGER,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      started_at: {
        type: Sequelize.DATE,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('import_batches');
  }
};
