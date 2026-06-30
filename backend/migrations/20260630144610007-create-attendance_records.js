module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendance_records', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      import_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      late_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      half_day_absence: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      early_leave_days: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      imported_dates: {
        type: Sequelize.JSONB,
      },
      absence_days: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      normal_ot_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      weekend_ot_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      holiday_ot_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_days: {
        type: Sequelize.INTEGER,
      },
      raw_data: {
        type: Sequelize.JSONB,
      },
      is_valid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      validation_errors: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      period_year: {
        type: Sequelize.INTEGER,
      },
      period_month: {
        type: Sequelize.INTEGER,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('attendance_records', {
      fields: ['import_batch_id'],
      ...{
      type: 'foreign key',
      name: 'attendance_records_import_batch_id_fkey',
      references: {
        table: 'import_batches',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('attendance_records', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'attendance_records_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attendance_records');
  }
};
