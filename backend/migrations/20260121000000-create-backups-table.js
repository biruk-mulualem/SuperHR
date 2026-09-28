// migrations/20260121000000-create-backups-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM types first
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_backups_type') THEN
          CREATE TYPE "enum_backups_type" AS ENUM('full', 'table', 'partial');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_backups_format') THEN
          CREATE TYPE "enum_backups_format" AS ENUM('sql', 'json', 'csv');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_backups_status') THEN
          CREATE TYPE "enum_backups_status" AS ENUM('pending', 'completed', 'failed');
        END IF;
      END $$;
    `);

    // Create table
    await queryInterface.createTable('backups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_size: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('full', 'table', 'partial'),
        defaultValue: 'full',
        allowNull: false,
      },
      format: {
        type: Sequelize.ENUM('sql', 'json', 'csv'),
        defaultValue: 'sql',
        allowNull: false,
      },
      include_structure: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      },
      table_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      restored_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      restored_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('backups', ['created_at'], {
      name: 'idx_backups_created_at',
    });
    await queryInterface.addIndex('backups', ['type'], {
      name: 'idx_backups_type',
    });
    await queryInterface.addIndex('backups', ['status'], {
      name: 'idx_backups_status',
    });
    await queryInterface.addIndex('backups', ['deleted_at'], {
      name: 'idx_backups_deleted_at',
    });
    await queryInterface.addIndex('backups', ['created_by'], {
      name: 'idx_backups_created_by',
    });
    await queryInterface.addIndex('backups', ['table_name'], {
      name: 'idx_backups_table_name',
    });

    console.log('✅ Table backups created');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('backups');
    
    // Drop ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_backups_type";
      DROP TYPE IF EXISTS "enum_backups_format";
      DROP TYPE IF EXISTS "enum_backups_status";
    `);
    
    console.log('✅ Table backups dropped');
  },
};