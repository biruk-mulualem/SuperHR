module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('charity_teams', {
      team_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      head: {
        type: Sequelize.INTEGER,
      },
      vice: {
        type: Sequelize.INTEGER,
      },
      members: {
        type: Sequelize.JSONB,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
      deleted_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['head'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_head_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['vice'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_vice_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_updated_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['deleted_by'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_deleted_by_fkey',
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
    await queryInterface.dropTable('charity_teams');
  }
};
