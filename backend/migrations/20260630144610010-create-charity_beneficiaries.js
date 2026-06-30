module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('charity_beneficiaries', {
      beneficiary_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fullname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      full_info: {
        type: Sequelize.JSONB,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      monthly_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'bank'),
        allowNull: false,
        defaultValue: "bank",
      },
      bank_info: {
        type: Sequelize.JSONB,
      },
      is_specialcase: {
        type: Sequelize.STRING,
      },
      deliveries: {
        type: Sequelize.JSONB,
      },
      adjustments: {
        type: Sequelize.JSONB,
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
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['team_id'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_team_id_fkey',
      references: {
        table: 'charity_teams',
        field: 'team_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_updated_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['deleted_by'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_deleted_by_fkey',
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
    await queryInterface.dropTable('charity_beneficiaries');
  }
};
