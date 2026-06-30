module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('positions', {
      position_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department_id: {
        type: Sequelize.INTEGER,
      },
      level: {
        type: Sequelize.STRING,
      },
      min_salary: {
        type: Sequelize.DECIMAL,
      },
      max_salary: {
        type: Sequelize.DECIMAL,
      },
      requirements: {
        type: Sequelize.JSONB,
      },
      responsibilities: {
        type: Sequelize.JSONB,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addConstraint('positions', {
      fields: ['department_id'],
      ...{
      type: 'foreign key',
      name: 'positions_department_id_fkey',
      references: {
        table: 'departments',
        field: 'department_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('positions');
  }
};
