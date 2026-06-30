module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_processing', {
      processing_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      month_year: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: "completed",
      },
      processed_by: {
        type: Sequelize.STRING,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      unclaimed_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      paid_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      unclaimed_file_name: {
        type: Sequelize.STRING,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payroll_processing');
  }
};
