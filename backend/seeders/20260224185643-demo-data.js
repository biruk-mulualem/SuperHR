'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🌱 Starting HR System database seeding...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // =============================================
      // 1. CLEAR ALL EXISTING DATA (in correct order)
      // =============================================
      console.log('\n🗑️  Clearing existing data...');
      
      await queryInterface.sequelize.query('TRUNCATE TABLE "complaints" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "performance_reviews" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "payrolls" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "salaries" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "leave_balances" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "leave_requests" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "attendances" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "employee_documents" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "employees" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "positions" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "departments" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "roles" RESTART IDENTITY CASCADE');
      
      console.log('✅ All existing data cleared');

      // =============================================
      // 2. SEED ROLES
      // =============================================
      console.log('\n📋 Seeding roles...');
      await queryInterface.bulkInsert('roles', [
        { name: 'admin', description: 'System Administrator - Full system access', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'hr', description: 'HR Manager - Employee management, leave approvals', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'finance', description: 'Finance Officer - Salary and payroll management', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'employee', description: 'Regular Employee - View own data', is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 4 roles seeded');

      // =============================================
      // 3. SEED DEPARTMENTS
      // =============================================
      console.log('\n📋 Seeding departments...');
      await queryInterface.bulkInsert('departments', [
        { name: 'Information Technology', code: 'IT', description: 'Software development and IT infrastructure', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Human Resources', code: 'HR', description: 'Employee relations and talent management', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Finance', code: 'FIN', description: 'Financial management and accounting', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Sales', code: 'SALES', description: 'Sales and business development', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Marketing', code: 'MKT', description: 'Marketing and brand management', is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Customer Support', code: 'SUPPORT', description: 'Customer service and support', is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 6 departments seeded');

      // =============================================
      // 4. SEED POSITIONS
      // =============================================
      console.log('\n📋 Seeding positions...');
      await queryInterface.bulkInsert('positions', [
        { title: 'Software Engineer', code: 'SE', level: 'Senior', is_active: true, created_at: new Date(), updated_at: new Date() },
        { title: 'HR Generalist', code: 'HRG', level: 'Mid', is_active: true, created_at: new Date(), updated_at: new Date() },
        { title: 'Finance Analyst', code: 'FA', level: 'Senior', is_active: true, created_at: new Date(), updated_at: new Date() },
        { title: 'Sales Manager', code: 'SM', level: 'Manager', is_active: true, created_at: new Date(), updated_at: new Date() },
        { title: 'Marketing Specialist', code: 'MS', level: 'Mid', is_active: true, created_at: new Date(), updated_at: new Date() },
        { title: 'Support Agent', code: 'SA', level: 'Junior', is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 6 positions seeded');

      // =============================================
      // 5. GET IDs FOR REFERENCES
      // =============================================
      const roleMap = {};
      const roleResults = await queryInterface.sequelize.query(
        `SELECT role_id, name FROM "roles"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      roleResults.forEach(r => { roleMap[r.name] = r.role_id; });

      const deptMap = {};
      const deptResults = await queryInterface.sequelize.query(
        `SELECT department_id, name FROM "departments"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      deptResults.forEach(d => { deptMap[d.name] = d.department_id; });

      const positionMap = {};
      const positionResults = await queryInterface.sequelize.query(
        `SELECT position_id, title FROM "positions"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      positionResults.forEach(p => { positionMap[p.title] = p.position_id; });

      // =============================================
      // 6. SEED USERS
      // =============================================
      console.log('\n👥 Seeding users...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await queryInterface.bulkInsert('users', [
        // Admin
        { username: 'admin', email: 'admin@hrsystem.com', password_hash: hashedPassword, full_name: 'Alemu Bekele', role_id: roleMap['admin'], department_id: deptMap['Information Technology'], is_active: true, created_at: new Date(), updated_at: new Date() },
        
        // HR
        { username: 'tigist_hr', email: 'tigist.hr@hrsystem.com', password_hash: hashedPassword, full_name: 'Tigist Worku', role_id: roleMap['hr'], department_id: deptMap['Human Resources'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'mekdes_hr', email: 'mekdes.hr@hrsystem.com', password_hash: hashedPassword, full_name: 'Mekdes Ayele', role_id: roleMap['hr'], department_id: deptMap['Human Resources'], is_active: true, created_at: new Date(), updated_at: new Date() },
        
        // Finance
        { username: 'girma_finance', email: 'girma.finance@hrsystem.com', password_hash: hashedPassword, full_name: 'Girma Tadesse', role_id: roleMap['finance'], department_id: deptMap['Finance'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'hiwot_finance', email: 'hiwot.finance@hrsystem.com', password_hash: hashedPassword, full_name: 'Hiwot Tesfaye', role_id: roleMap['finance'], department_id: deptMap['Finance'], is_active: true, created_at: new Date(), updated_at: new Date() },
        
        // Employees
        { username: 'abebe_dev', email: 'abebe.dev@hrsystem.com', password_hash: hashedPassword, full_name: 'Abebe Demissie', role_id: roleMap['employee'], department_id: deptMap['Information Technology'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'azeb_dev', email: 'azeb.dev@hrsystem.com', password_hash: hashedPassword, full_name: 'Azeb Mulugeta', role_id: roleMap['employee'], department_id: deptMap['Information Technology'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'bekele_sales', email: 'bekele.sales@hrsystem.com', password_hash: hashedPassword, full_name: 'Bekele Fikre', role_id: roleMap['employee'], department_id: deptMap['Sales'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'chaltu_sales', email: 'chaltu.sales@hrsystem.com', password_hash: hashedPassword, full_name: 'Chaltu Hassen', role_id: roleMap['employee'], department_id: deptMap['Sales'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'derartu_marketing', email: 'derartu.marketing@hrsystem.com', password_hash: hashedPassword, full_name: 'Derartu Tulu', role_id: roleMap['employee'], department_id: deptMap['Marketing'], is_active: true, created_at: new Date(), updated_at: new Date() },
        { username: 'eyob_support', email: 'eyob.support@hrsystem.com', password_hash: hashedPassword, full_name: 'Eyob Girma', role_id: roleMap['employee'], department_id: deptMap['Customer Support'], is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      
      console.log('✅ 11 users seeded');

      // =============================================
      // 7. GET USER IDs
      // =============================================
      const userMap = {};
      const userResults = await queryInterface.sequelize.query(
        `SELECT user_id, username FROM "users"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      userResults.forEach(u => { userMap[u.username] = u.user_id; });

      // =============================================
      // 8. SEED EMPLOYEES WITH PROFILE PICTURES
      // =============================================
      console.log('\n👔 Seeding employees with profile pictures...');
      
      // Working profile picture URLs from randomuser.me API (real working images)
      const profilePics = [
        'https://randomuser.me/api/portraits/men/1.jpg',
        'https://randomuser.me/api/portraits/women/1.jpg',
        'https://randomuser.me/api/portraits/women/2.jpg',
        'https://randomuser.me/api/portraits/men/2.jpg',
        'https://randomuser.me/api/portraits/women/3.jpg',
        'https://randomuser.me/api/portraits/men/3.jpg',
        'https://randomuser.me/api/portraits/men/4.jpg',
        'https://randomuser.me/api/portraits/women/4.jpg',
        'https://randomuser.me/api/portraits/men/5.jpg',
        'https://randomuser.me/api/portraits/women/5.jpg',
        'https://randomuser.me/api/portraits/men/6.jpg',
        'https://randomuser.me/api/portraits/women/6.jpg',
        'https://randomuser.me/api/portraits/men/7.jpg',
        'https://randomuser.me/api/portraits/women/7.jpg',
        'https://randomuser.me/api/portraits/men/8.jpg',
        'https://randomuser.me/api/portraits/women/8.jpg',
        'https://randomuser.me/api/portraits/men/9.jpg',
        'https://randomuser.me/api/portraits/women/9.jpg',
        'https://randomuser.me/api/portraits/men/10.jpg',
        'https://randomuser.me/api/portraits/women/10.jpg'
      ];
      
      await queryInterface.bulkInsert('employees', [
        // Admin employee
        { 
          employee_code: 'EMP001', user_id: userMap['admin'], first_name: 'Alemu', last_name: 'Bekele',
          date_of_birth: '1985-05-15', gender: 'male', marital_status: 'married', nationality: 'Ethiopian',
          work_email: 'alemu.bekele@hrsystem.com', phone_number: '+251911000001',
          department_id: deptMap['Information Technology'], position_id: positionMap['Software Engineer'],
          hire_date: '2020-01-15', employment_type: 'full-time', employment_status: 'active', basic_salary: 25000,
          profile_picture_url: 'https://randomuser.me/api/portraits/men/32.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        // HR employees
        { 
          employee_code: 'EMP002', user_id: userMap['tigist_hr'], first_name: 'Tigist', last_name: 'Worku',
          date_of_birth: '1990-03-20', gender: 'female', marital_status: 'married', nationality: 'Ethiopian',
          work_email: 'tigist.worku@hrsystem.com', phone_number: '+251911000002',
          department_id: deptMap['Human Resources'], position_id: positionMap['HR Generalist'],
          hire_date: '2021-06-10', employment_type: 'full-time', employment_status: 'active', basic_salary: 18000,
          profile_picture_url: 'https://randomuser.me/api/portraits/women/68.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        { 
          employee_code: 'EMP003', user_id: userMap['mekdes_hr'], first_name: 'Mekdes', last_name: 'Ayele',
          date_of_birth: '1988-11-08', gender: 'female', marital_status: 'single', nationality: 'Ethiopian',
          work_email: 'mekdes.ayele@hrsystem.com', phone_number: '+251911000003',
          department_id: deptMap['Human Resources'], position_id: positionMap['HR Generalist'],
          hire_date: '2022-01-20', employment_type: 'full-time', employment_status: 'active', basic_salary: 17000,
          profile_picture_url: 'https://randomuser.me/api/portraits/women/45.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        // Finance employees
        { 
          employee_code: 'EMP004', user_id: userMap['girma_finance'], first_name: 'Girma', last_name: 'Tadesse',
          date_of_birth: '1982-07-25', gender: 'male', marital_status: 'married', nationality: 'Ethiopian',
          work_email: 'girma.tadesse@hrsystem.com', phone_number: '+251911000004',
          department_id: deptMap['Finance'], position_id: positionMap['Finance Analyst'],
          hire_date: '2019-03-01', employment_type: 'full-time', employment_status: 'active', basic_salary: 22000,
          profile_picture_url: 'https://randomuser.me/api/portraits/men/52.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        { 
          employee_code: 'EMP005', user_id: userMap['hiwot_finance'], first_name: 'Hiwot', last_name: 'Tesfaye',
          date_of_birth: '1992-09-12', gender: 'female', marital_status: 'single', nationality: 'Ethiopian',
          work_email: 'hiwot.tesfaye@hrsystem.com', phone_number: '+251911000005',
          department_id: deptMap['Finance'], position_id: positionMap['Finance Analyst'],
          hire_date: '2022-08-15', employment_type: 'full-time', employment_status: 'active', basic_salary: 19000,
          profile_picture_url: 'https://randomuser.me/api/portraits/women/55.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        // IT employees
        { 
          employee_code: 'EMP006', user_id: userMap['abebe_dev'], first_name: 'Abebe', last_name: 'Demissie',
          date_of_birth: '1995-02-18', gender: 'male', marital_status: 'single', nationality: 'Ethiopian',
          work_email: 'abebe.demissie@hrsystem.com', phone_number: '+251911000006',
          department_id: deptMap['Information Technology'], position_id: positionMap['Software Engineer'],
          hire_date: '2023-01-10', employment_type: 'full-time', employment_status: 'active', basic_salary: 15000,
          profile_picture_url: 'https://randomuser.me/api/portraits/men/75.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        { 
          employee_code: 'EMP007', user_id: userMap['azeb_dev'], first_name: 'Azeb', last_name: 'Mulugeta',
          date_of_birth: '1993-06-22', gender: 'female', marital_status: 'married', nationality: 'Ethiopian',
          work_email: 'azeb.mulugeta@hrsystem.com', phone_number: '+251911000007',
          department_id: deptMap['Information Technology'], position_id: positionMap['Software Engineer'],
          hire_date: '2023-03-15', employment_type: 'full-time', employment_status: 'active', basic_salary: 16000,
          profile_picture_url: 'https://randomuser.me/api/portraits/women/82.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        // Sales employees
        { 
          employee_code: 'EMP008', user_id: userMap['bekele_sales'], first_name: 'Bekele', last_name: 'Fikre',
          date_of_birth: '1991-10-30', gender: 'male', marital_status: 'single', nationality: 'Ethiopian',
          work_email: 'bekele.fikre@hrsystem.com', phone_number: '+251911000008',
          department_id: deptMap['Sales'], position_id: positionMap['Sales Manager'],
          hire_date: '2022-05-20', employment_type: 'full-time', employment_status: 'active', basic_salary: 20000,
          profile_picture_url: 'https://randomuser.me/api/portraits/men/91.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        { 
          employee_code: 'EMP009', user_id: userMap['chaltu_sales'], first_name: 'Chaltu', last_name: 'Hassen',
          date_of_birth: '1994-04-05', gender: 'female', marital_status: 'single', nationality: 'Ethiopian',
          work_email: 'chaltu.hassen@hrsystem.com', phone_number: '+251911000009',
          department_id: deptMap['Sales'], position_id: positionMap['Sales Manager'],
          hire_date: '2023-02-01', employment_type: 'full-time', employment_status: 'active', basic_salary: 18000,
          profile_picture_url: 'https://randomuser.me/api/portraits/women/26.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        // Marketing employee
        { 
          employee_code: 'EMP010', user_id: userMap['derartu_marketing'], first_name: 'Derartu', last_name: 'Tulu',
          date_of_birth: '1990-12-12', gender: 'female', marital_status: 'married', nationality: 'Ethiopian',
          work_email: 'derartu.tulu@hrsystem.com', phone_number: '+251911000010',
          department_id: deptMap['Marketing'], position_id: positionMap['Marketing Specialist'],
          hire_date: '2022-09-10', employment_type: 'full-time', employment_status: 'active', basic_salary: 17000,
          profile_picture_url: 'https://randomuser.me/api/portraits/women/33.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        },
        
        // Support employee
        { 
          employee_code: 'EMP011', user_id: userMap['eyob_support'], first_name: 'Eyob', last_name: 'Girma',
          date_of_birth: '1996-08-19', gender: 'male', marital_status: 'single', nationality: 'Ethiopian',
          work_email: 'eyob.girma@hrsystem.com', phone_number: '+251911000011',
          department_id: deptMap['Customer Support'], position_id: positionMap['Support Agent'],
          hire_date: '2023-06-01', employment_type: 'full-time', employment_status: 'active', basic_salary: 12000,
          profile_picture_url: 'https://randomuser.me/api/portraits/men/18.jpg',
          is_active: true, created_at: new Date(), updated_at: new Date() 
        }
      ]);
      
      console.log('✅ 11 employees seeded with profile pictures');

      // =============================================
      // 9. GET EMPLOYEE IDs
      // =============================================
      const employeeMap = {};
      const employeeResults = await queryInterface.sequelize.query(
        `SELECT employee_id, employee_code FROM "employees"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      employeeResults.forEach(e => { employeeMap[e.employee_code] = e.employee_id; });

      // =============================================
      // 10. SEED LEAVE BALANCES
      // =============================================
      console.log('\n📅 Seeding leave balances...');
      const currentYear = new Date().getFullYear();
      
      for (const employee of employeeResults) {
        await queryInterface.bulkInsert('leave_balances', [
          { 
            employee_id: employee.employee_id, 
            year: currentYear, 
            annual: JSON.stringify({ total: 20, used: 0, remaining: 20 }), 
            sick: JSON.stringify({ total: 12, used: 0, remaining: 12 }), 
            casual: JSON.stringify({ total: 10, used: 0, remaining: 10 }), 
            unpaid: JSON.stringify({ total: 0, used: 0, remaining: 0 }), 
            carried_over: 0, 
            created_at: new Date(), 
            updated_at: new Date() 
          }
        ]);
      }
      console.log('✅ 11 leave balances seeded');

      // =============================================
      // 11. SEED ATTENDANCE (Last 30 days)
      // =============================================
      console.log('\n📊 Seeding attendance records...');
      const today = new Date();
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        for (const employee of employeeResults) {
          const statuses = ['present', 'present', 'present', 'present', 'late', 'absent'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          await queryInterface.bulkInsert('attendances', [
            { 
              employee_id: employee.employee_id, 
              date: date, 
              check_in: status !== 'absent' ? new Date(date.setHours(9, Math.floor(Math.random() * 30), 0)) : null, 
              check_out: status !== 'absent' ? new Date(date.setHours(17, Math.floor(Math.random() * 30), 0)) : null, 
              status: status, 
              late_minutes: status === 'late' ? Math.floor(Math.random() * 60) : 0, 
              created_at: new Date(), 
              updated_at: new Date() 
            }
          ]);
        }
      }
      console.log('✅ Attendance records seeded');

      // =============================================
      // 12. SEED SALARIES
      // =============================================
      console.log('\n💰 Seeding salary records...');
      const salaries = [
        { employee_code: 'EMP001', basic: 25000, housing: 5000, transport: 2000, medical: 1500 },
        { employee_code: 'EMP002', basic: 18000, housing: 3600, transport: 1500, medical: 1200 },
        { employee_code: 'EMP003', basic: 17000, housing: 3400, transport: 1500, medical: 1200 },
        { employee_code: 'EMP004', basic: 22000, housing: 4400, transport: 1800, medical: 1500 },
        { employee_code: 'EMP005', basic: 19000, housing: 3800, transport: 1500, medical: 1200 },
        { employee_code: 'EMP006', basic: 15000, housing: 3000, transport: 1200, medical: 1000 },
        { employee_code: 'EMP007', basic: 16000, housing: 3200, transport: 1200, medical: 1000 },
        { employee_code: 'EMP008', basic: 20000, housing: 4000, transport: 1500, medical: 1200 },
        { employee_code: 'EMP009', basic: 18000, housing: 3600, transport: 1500, medical: 1200 },
        { employee_code: 'EMP010', basic: 17000, housing: 3400, transport: 1500, medical: 1200 },
        { employee_code: 'EMP011', basic: 12000, housing: 2400, transport: 1000, medical: 800 }
      ];
      
      for (const salary of salaries) {
        const employeeId = employeeMap[salary.employee_code];
        const netSalary = salary.basic + salary.housing + salary.transport + salary.medical;
        
        await queryInterface.bulkInsert('salaries', [
          { 
            employee_id: employeeId, 
            effective_date: '2024-01-01', 
            basic_salary: salary.basic, 
            housing_allowance: salary.housing, 
            transport_allowance: salary.transport, 
            medical_allowance: salary.medical, 
            deductions: JSON.stringify({ tax: salary.basic * 0.1, pension: salary.basic * 0.07, insurance: 500 }), 
            net_salary: netSalary - (salary.basic * 0.17 + 500), 
            currency: 'ETB', 
            payment_method: 'bank', 
            created_by: userMap['admin'], 
            created_at: new Date(), 
            updated_at: new Date() 
          }
        ]);
      }
      console.log('✅ 11 salary records seeded');

      // =============================================
      // 13. SEED LEAVE REQUESTS
      // =============================================
      console.log('\n📝 Seeding leave requests...');
      await queryInterface.bulkInsert('leave_requests', [
        { employee_id: employeeMap['EMP006'], leave_type: 'annual', start_date: '2024-04-10', end_date: '2024-04-15', total_days: 5, reason: 'Family vacation', status: 'pending', created_at: new Date(), updated_at: new Date() },
        { employee_id: employeeMap['EMP007'], leave_type: 'sick', start_date: '2024-03-25', end_date: '2024-03-26', total_days: 2, reason: 'Flu', status: 'approved', approved_by: employeeMap['EMP002'], approved_at: new Date(), created_at: new Date(), updated_at: new Date() },
        { employee_id: employeeMap['EMP008'], leave_type: 'casual', start_date: '2024-04-05', end_date: '2024-04-06', total_days: 2, reason: 'Personal matter', status: 'pending', created_at: new Date(), updated_at: new Date() },
        { employee_id: employeeMap['EMP010'], leave_type: 'annual', start_date: '2024-05-01', end_date: '2024-05-10', total_days: 10, reason: 'Long vacation', status: 'pending', created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 4 leave requests seeded');

      // =============================================
      // 14. SEED PERFORMANCE REVIEWS
      // =============================================
      console.log('\n⭐ Seeding performance reviews...');
      await queryInterface.bulkInsert('performance_reviews', [
        { 
          employee_id: employeeMap['EMP006'], reviewer_id: employeeMap['EMP001'], 
          review_period: JSON.stringify({ start: '2023-01-01', end: '2023-12-31' }), 
          rating: 4.5, strengths: JSON.stringify(['Technical skills', 'Team player']), 
          weaknesses: JSON.stringify(['Time management']), feedback: 'Excellent performance overall', 
          status: 'approved', created_at: new Date(), updated_at: new Date() 
        },
        { 
          employee_id: employeeMap['EMP007'], reviewer_id: employeeMap['EMP001'], 
          review_period: JSON.stringify({ start: '2023-01-01', end: '2023-12-31' }), 
          rating: 4.0, strengths: JSON.stringify(['Problem solving', 'Communication']), 
          weaknesses: JSON.stringify(['Documentation']), feedback: 'Good performance, needs improvement in documentation', 
          status: 'approved', created_at: new Date(), updated_at: new Date() 
        },
        { 
          employee_id: employeeMap['EMP008'], reviewer_id: employeeMap['EMP001'], 
          review_period: JSON.stringify({ start: '2023-01-01', end: '2023-12-31' }), 
          rating: 4.2, strengths: JSON.stringify(['Sales skills', 'Customer relations']), 
          weaknesses: JSON.stringify(['Reporting']), feedback: 'Strong sales performance', 
          status: 'approved', created_at: new Date(), updated_at: new Date() 
        }
      ]);
      console.log('✅ 3 performance reviews seeded');

      // =============================================
      // 15. UPDATE created_by for users
      // =============================================
      console.log('\n🔗 Updating user relationships...');
      for (const user of userResults) {
        if (user.username !== 'admin') {
          await queryInterface.sequelize.query(
            `UPDATE "users" SET created_by = :adminId WHERE user_id = :userId`,
            { replacements: { adminId: userMap['admin'], userId: user.user_id }, type: Sequelize.QueryTypes.UPDATE }
          );
        }
      }
      console.log('✅ User relationships updated');

      // =============================================
      // 16. DISPLAY SUMMARY
      // =============================================
      const finalCounts = await queryInterface.sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM "roles") as roles,
          (SELECT COUNT(*) FROM "departments") as departments,
          (SELECT COUNT(*) FROM "positions") as positions,
          (SELECT COUNT(*) FROM "users") as users,
          (SELECT COUNT(*) FROM "employees") as employees,
          (SELECT COUNT(*) FROM "attendances") as attendances,
          (SELECT COUNT(*) FROM "leave_requests") as leave_requests,
          (SELECT COUNT(*) FROM "leave_balances") as leave_balances,
          (SELECT COUNT(*) FROM "salaries") as salaries,
          (SELECT COUNT(*) FROM "performance_reviews") as performance_reviews
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log('\n📊 SEED DATA SUMMARY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Roles: ${finalCounts[0].roles}`);
      console.log(`✅ Departments: ${finalCounts[0].departments}`);
      console.log(`✅ Positions: ${finalCounts[0].positions}`);
      console.log(`✅ Users: ${finalCounts[0].users}`);
      console.log(`✅ Employees: ${finalCounts[0].employees} (with profile pictures)`);
      console.log(`✅ Attendance Records: ${finalCounts[0].attendances}`);
      console.log(`✅ Leave Requests: ${finalCounts[0].leave_requests}`);
      console.log(`✅ Leave Balances: ${finalCounts[0].leave_balances}`);
      console.log(`✅ Salary Records: ${finalCounts[0].salaries}`);
      console.log(`✅ Performance Reviews: ${finalCounts[0].performance_reviews}`);
      
      console.log('\n🔐 LOGIN CREDENTIALS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Admin:');
      console.log('    Username: admin');
      console.log('    Password: password123');
      console.log('    Name: Alemu Bekele');
      console.log('\n  HR Managers:');
      console.log('    tigist_hr / password123 (Tigist Worku)');
      console.log('    mekdes_hr / password123 (Mekdes Ayele)');
      console.log('\n  Finance Officers:');
      console.log('    girma_finance / password123 (Girma Tadesse)');
      console.log('    hiwot_finance / password123 (Hiwot Tesfaye)');
      console.log('\n  Employees:');
      console.log('    abebe_dev / password123 (Abebe Demissie)');
      console.log('    azeb_dev / password123 (Azeb Mulugeta)');
      console.log('    bekele_sales / password123 (Bekele Fikre)');
      console.log('    chaltu_sales / password123 (Chaltu Hassen)');
      console.log('    derartu_marketing / password123 (Derartu Tulu)');
      console.log('    eyob_support / password123 (Eyob Girma)');
      
      console.log('\n🖼️  PROFILE PICTURES:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('All employees have real profile pictures from randomuser.me API');
      console.log('Images are working and will display in the application');
      
      console.log('\n🎉 All HR system data seeded successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('\n🗑️  Removing all seeded data...');
    
    await queryInterface.sequelize.query('TRUNCATE TABLE "complaints" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "performance_reviews" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "payrolls" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "salaries" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "leave_balances" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "leave_requests" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "attendances" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "employee_documents" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "employees" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "positions" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "departments" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "roles" RESTART IDENTITY CASCADE');
    
    console.log('✅ All data removed successfully');
  }
};