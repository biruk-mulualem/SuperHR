'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Charity Teams Table
    await queryInterface.createTable('charity_teams', {
      team_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      head: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'employee_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      vice: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'employee_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      members: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deleted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
        allowNull: true,
      },
    });

    // 2. Charity Beneficiaries Table
    await queryInterface.createTable('charity_beneficiaries', {
      beneficiary_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullname: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      full_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'charity_teams', key: 'team_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      monthly_allocation: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'bank'),
        defaultValue: 'bank',
        allowNull: false,
      },
      bank_info: {
        type: Sequelize.JSONB,
        defaultValue: { account_no: '', bank: '' },
        allowNull: true,
      },
      is_specialcase: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      deliveries: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      adjustments: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deleted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
        allowNull: true,
      },
    });

    // 3. Charity Settings Table
    await queryInterface.createTable('charity_settings', {
      setting_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      setting_key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      distribution_release: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      defaults: {
        type: Sequelize.JSONB,
        defaultValue: {
          monthly_allocation: 3000,
          payment_method: 'bank',
          beneficiaries_special_cases: []
        },
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    // 4. Charity Logs Table
    await queryInterface.createTable('charity_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Insert default settings
    await queryInterface.bulkInsert('charity_settings', [{
      setting_key: 'main',
      distribution_release: JSON.stringify([]),
      defaults: JSON.stringify({
        monthly_allocation: 3000,
        payment_method: 'bank',
        beneficiaries_special_cases: ['Elderly', 'Disabled', 'Single Parent']
      }),
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('charity_logs');
    await queryInterface.dropTable('charity_settings');
    await queryInterface.dropTable('charity_beneficiaries');
    await queryInterface.dropTable('charity_teams');
    // Drop the ENUM type manually for PostgreSQL if needed
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_charity_beneficiaries_payment_method";');
  }
};
