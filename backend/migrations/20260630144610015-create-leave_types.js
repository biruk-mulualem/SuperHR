module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_types', {
      leave_type_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      default_days: {
        type: Sequelize.INTEGER,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      has_fixed_limit: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_one_time: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      requires_approval: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      min_notice_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      max_consecutive_days: {
        type: Sequelize.INTEGER,
      },
      requires_documentation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      gender_restriction: {
        type: Sequelize.ENUM('male', 'female', 'none'),
        defaultValue: "none",
      },
      carry_over_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
      },
      carry_over_expiry_years: {
        type: Sequelize.INTEGER,
        defaultValue: 2,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.dropTable('leave_types');
  }
};
