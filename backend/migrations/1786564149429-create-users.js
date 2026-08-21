// migrations/XXXXXX-seed-default-roles.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('roles', [
      {
        role_id: 1,
        name: 'Admin',
        description: 'System Administrator',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: 2,
        name: 'Manager',
        description: 'Department Manager',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: 3,
        name: 'Employee',
        description: 'Regular Employee',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  },
};