'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payrollprocessings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      processing_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      month_year: {
        type: Sequelize.STRING,
        allowNull: true
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM,
        allowNull: true
      },
      processed_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      unclaimed_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      paid_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      total_amount: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      unclaimed_file_name: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('payrollprocessings');
  }
};