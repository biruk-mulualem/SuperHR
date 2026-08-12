'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendancerecords', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      import_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      late_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      half_day_absence: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      early_leave_days: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      imported_dates: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      absence_days: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      normal_ot_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      weekend_ot_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      holiday_ot_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      period_days: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_valid: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      validation_errors: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      period_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      period_month: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attendancerecords');
  }
};