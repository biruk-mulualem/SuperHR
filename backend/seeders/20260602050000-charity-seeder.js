'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Seed Charity Roles
    await queryInterface.bulkInsert('roles', [
      {
        name: 'charity_admin',
        description: 'Global administrator for the charity module',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'charity_teamleader',
        description: 'Leader for a specific distribution team',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ], { ignoreDuplicates: true });

    // 2. Seed 2 Teams
    await queryInterface.bulkInsert('charity_teams', [
      {
        name: 'Addis Distribution Team',
        description: 'Primary team for Addis Ababa region operations',
        members: JSON.stringify([]),
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Regional Support Team',
        description: 'Focuses on outlying areas and rural support',
        members: JSON.stringify([]),
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // Fetch the team IDs to associate beneficiaries
    const teams = await queryInterface.sequelize.query(
      `SELECT team_id from charity_teams ORDER BY team_id DESC LIMIT 2;`
    );
    
    // Postgres returns [rows, metadata]
    const teamIds = teams[0].map(t => t.team_id);
    const teamA = teamIds[1]; // Older of the two
    const teamB = teamIds[0]; // Newer of the two

    // 2. Seed 10 Beneficiaries (5 per team)
    const beneficiaries = [
      // Team A
      {
        fullname: 'Abebe Kebede',
        full_info: JSON.stringify({ location: { city: 'Addis Ababa', region: 'AA' }, contact: { phone: '+251911111111' } }),
        team_id: teamA,
        is_active: true,
        monthly_allocation: 3500,
        payment_method: 'bank',
        bank_info: JSON.stringify({ account_no: '1000123456789', bank: 'CBE' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Mulugeta Tesfaye',
        full_info: JSON.stringify({ location: { city: 'Addis Ababa' } }),
        team_id: teamA,
        is_active: true,
        monthly_allocation: 3000,
        payment_method: 'cash',
        bank_info: JSON.stringify({ account_no: '', bank: '' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Chala Gebre',
        full_info: JSON.stringify({}),
        team_id: teamA,
        is_active: true,
        monthly_allocation: 4000,
        payment_method: 'bank',
        bank_info: JSON.stringify({ account_no: '1000987654321', bank: 'Dashen' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Fatima Ahmed',
        full_info: JSON.stringify({ contact: { phone: '+251922222222' } }),
        team_id: teamA,
        is_active: true,
        monthly_allocation: 3000,
        payment_method: 'bank',
        bank_info: JSON.stringify({ account_no: '2000111122223', bank: 'BOA' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Sara Belay',
        full_info: JSON.stringify({}),
        team_id: teamA,
        is_active: false,
        monthly_allocation: 3000,
        payment_method: 'cash',
        bank_info: JSON.stringify({ account_no: '', bank: '' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      // Team B
      {
        fullname: 'Dawit Yohannes',
        full_info: JSON.stringify({ location: { city: 'Adama', region: 'Oromia' } }),
        team_id: teamB,
        is_active: true,
        monthly_allocation: 3200,
        payment_method: 'bank',
        bank_info: JSON.stringify({ account_no: '1000555566667', bank: 'CBE' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Hiwot Tadesse',
        full_info: JSON.stringify({}),
        team_id: teamB,
        is_active: true,
        monthly_allocation: 3000,
        payment_method: 'bank',
        bank_info: JSON.stringify({ account_no: '1000333344445', bank: 'CBE' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Samuel Ayele',
        full_info: JSON.stringify({}),
        team_id: teamB,
        is_active: true,
        monthly_allocation: 3000,
        payment_method: 'cash',
        bank_info: JSON.stringify({ account_no: '', bank: '' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Aster Molla',
        full_info: JSON.stringify({}),
        team_id: teamB,
        is_active: true,
        monthly_allocation: 5000,
        payment_method: 'bank',
        bank_info: JSON.stringify({ account_no: '8888777766665', bank: 'Hibret' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      },
      {
        fullname: 'Bekele Zewde',
        full_info: JSON.stringify({}),
        team_id: teamB,
        is_active: true,
        monthly_allocation: 3000,
        payment_method: 'cash',
        bank_info: JSON.stringify({ account_no: '', bank: '' }),
        deliveries: JSON.stringify([]),
        adjustments: JSON.stringify([]),
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('charity_beneficiaries', beneficiaries);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('charity_beneficiaries', null, {});
    await queryInterface.bulkDelete('charity_teams', null, {});
  }
};
