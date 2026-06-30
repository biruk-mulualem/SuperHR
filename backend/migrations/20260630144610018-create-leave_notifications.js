module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_notifications', {
      notification_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_request_id: {
        type: Sequelize.INTEGER,
      },
      notification_type: {
        type: Sequelize.ENUM('reminder', 'overdue', 'expiry', 'approval', 'rejection', 'extension_approved', 'extension_rejected'),
        allowNull: false,
      },
      channel: {
        type: Sequelize.ENUM('email', 'sms', 'in_app'),
        defaultValue: "email",
      },
      subject: {
        type: Sequelize.STRING,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sent_date: {
        type: Sequelize.DATE,
      },
      read_at: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'failed', 'read'),
        defaultValue: "sent",
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
    await queryInterface.addConstraint('leave_notifications', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'leave_notifications_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('leave_notifications', {
      fields: ['leave_request_id'],
      ...{
      type: 'foreign key',
      name: 'leave_notifications_leave_request_id_fkey',
      references: {
        table: 'leave_requests',
        field: 'leave_request_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('leave_notifications');
  }
};
