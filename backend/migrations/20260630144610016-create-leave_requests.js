module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_requests', {
      leave_request_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      department_id: {
        type: Sequelize.INTEGER,
      },
      leave_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_type_name: {
        type: Sequelize.STRING,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      return_date: {
        type: Sequelize.DATEONLY,
      },
      total_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: "pending",
      },
      requested_date: {
        type: Sequelize.DATEONLY,
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      approved_date: {
        type: Sequelize.DATEONLY,
      },
      approval_notes: {
        type: Sequelize.TEXT,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
      },
      rejected_by: {
        type: Sequelize.INTEGER,
      },
      rejected_date: {
        type: Sequelize.DATEONLY,
      },
      hr_notes: {
        type: Sequelize.TEXT,
      },
      return_status: {
        type: Sequelize.ENUM('on_leave', 'returned', 'returned_late', 'overdue'),
        defaultValue: "on_leave",
      },
      actual_return_date: {
        type: Sequelize.DATEONLY,
      },
      days_late: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      return_confirmed_by: {
        type: Sequelize.INTEGER,
      },
      return_confirmed_date: {
        type: Sequelize.DATEONLY,
      },
      extension_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_extension_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_extended_date: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.addConstraint('leave_requests', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'leave_requests_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('leave_requests', {
      fields: ['department_id'],
      ...{
      type: 'foreign key',
      name: 'leave_requests_department_id_fkey',
      references: {
        table: 'departments',
        field: 'department_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('leave_requests', {
      fields: ['leave_type_id'],
      ...{
      type: 'foreign key',
      name: 'leave_requests_leave_type_id_fkey',
      references: {
        table: 'leave_types',
        field: 'leave_type_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('leave_requests', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'leave_requests_approved_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('leave_requests', {
      fields: ['rejected_by'],
      ...{
      type: 'foreign key',
      name: 'leave_requests_rejected_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('leave_requests', {
      fields: ['return_confirmed_by'],
      ...{
      type: 'foreign key',
      name: 'leave_requests_return_confirmed_by_fkey',
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
    await queryInterface.dropTable('leave_requests');
  }
};
