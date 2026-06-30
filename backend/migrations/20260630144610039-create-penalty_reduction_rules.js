module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('penalty_reduction_rules', {
      rule_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rule_type: {
        type: Sequelize.ENUM('amount', 'percent'),
        allowNull: false,
      },
      min_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      max_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      reduction_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('penalty_reduction_rules', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'penalty_reduction_rules_created_by_fkey',
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
    await queryInterface.dropTable('penalty_reduction_rules');
  }
};
