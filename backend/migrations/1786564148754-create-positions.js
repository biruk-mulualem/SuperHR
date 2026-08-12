'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('positions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      positionId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      level: {
        type: Sequelize.STRING,
        allowNull: true
      },
      minSalary: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      maxSalary: {
        type: Sequelize.DECIMAL,
        allowNull: true
      },
      requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      responsibilities: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable('positions');
  }
};