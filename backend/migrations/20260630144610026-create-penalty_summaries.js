module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penalty_summaries', {
      summary_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      penalty_id: {
        type: Sequelize.INTEGER,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      penalty_type: {
        type: Sequelize.ENUM('percent', 'asset', 'other'),
        allowNull: false,
      },
      penalty_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      penalty_category: {
        type: Sequelize.STRING,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      deducted_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      current_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      original_percentage: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      deducted_percentage: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      current_percentage: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'partially_deducted', 'fully_deducted', 'cancelled'),
        defaultValue: "active",
      },
      last_reduction_date: {
        type: Sequelize.DATEONLY,
      },
      last_reduced_by: {
        type: Sequelize.STRING,
      },
      last_reduction_reason: {
        type: Sequelize.TEXT,
      },
      reference_document: {
        type: Sequelize.STRING,
      },
      submitted_by: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('penalty_summaries', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_summaries_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('penalty_summaries');
  }
};
