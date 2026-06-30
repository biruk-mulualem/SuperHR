module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('departments', {
      department_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      manager_id: {
        type: Sequelize.INTEGER,
      },
      parent_department_id: {
        type: Sequelize.INTEGER,
      },
      budget: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      location: {
        type: Sequelize.STRING,
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
    await queryInterface.addConstraint('departments', {
      fields: ['manager_id'],
      ...{
      type: 'foreign key',
      name: 'departments_manager_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('departments', {
      fields: ['parent_department_id'],
      ...{
      type: 'foreign key',
      name: 'departments_parent_department_id_fkey',
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
    await queryInterface.dropTable('departments');
  }
};
