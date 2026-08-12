'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('terminationhistorys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      terminationHistoryId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      terminationDateEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      terminationDateGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      terminationReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      terminationNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rehireDateEC: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rehireDateGC: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      rehireReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rehireNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isRehired: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      createdBy: {
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
    await queryInterface.dropTable('terminationhistorys');
  }
};