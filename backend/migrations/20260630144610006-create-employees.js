module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      employee_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      middle_name: {
        type: Sequelize.STRING,
      },
      full_name_english: {
        type: Sequelize.STRING,
      },
      date_of_birth_ec: {
        type: Sequelize.STRING,
      },
      date_of_birth_gc: {
        type: Sequelize.DATEONLY,
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
      },
      marital_status: {
        type: Sequelize.ENUM('single', 'married', 'divorced', 'widowed'),
      },
      nationality: {
        type: Sequelize.STRING,
      },
      national_id: {
        type: Sequelize.STRING,
      },
      national_id_document: {
        type: Sequelize.JSONB,
      },
      work_email: {
        type: Sequelize.STRING,
      },
      personal_email: {
        type: Sequelize.STRING,
      },
      phone_number: {
        type: Sequelize.STRING,
      },
      current_address: {
        type: Sequelize.JSONB,
      },
      permanent_address: {
        type: Sequelize.JSONB,
      },
      birth_place: {
        type: Sequelize.JSONB,
      },
      work_location: {
        type: Sequelize.STRING,
      },
      current_company: {
        type: Sequelize.JSONB,
      },
      department_id: {
        type: Sequelize.INTEGER,
      },
      position_id: {
        type: Sequelize.INTEGER,
      },
      manager_id: {
        type: Sequelize.INTEGER,
      },
      employment_type: {
        type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'intern'),
        defaultValue: "full-time",
      },
      employment_status: {
        type: Sequelize.ENUM('active', 'inactive', 'on-leave', 'terminated', 'retired'),
        defaultValue: "active",
      },
      hire_date_ec: {
        type: Sequelize.STRING,
      },
      hire_date_gc: {
        type: Sequelize.DATEONLY,
      },
      confirmation_date_ec: {
        type: Sequelize.STRING,
      },
      confirmation_date_gc: {
        type: Sequelize.DATEONLY,
      },
      termination_date_ec: {
        type: Sequelize.STRING,
      },
      termination_date_gc: {
        type: Sequelize.DATEONLY,
      },
      shift_type: {
        type: Sequelize.ENUM('day', 'night'),
        defaultValue: "day",
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      housing_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      position_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      transport_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      mobile_allowance: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      bank_account: {
        type: Sequelize.JSONB,
      },
      emergency_contact: {
        type: Sequelize.JSONB,
      },
      emergency_contact_address: {
        type: Sequelize.JSONB,
      },
      mothers_full_name: {
        type: Sequelize.STRING,
      },
      spouse_info: {
        type: Sequelize.JSONB,
      },
      children: {
        type: Sequelize.JSONB,
      },
      parents_info: {
        type: Sequelize.JSONB,
      },
      parent_support: {
        type: Sequelize.JSONB,
      },
      education: {
        type: Sequelize.JSONB,
      },
      training: {
        type: Sequelize.JSONB,
      },
      work_experience: {
        type: Sequelize.JSONB,
      },
      language_skills: {
        type: Sequelize.JSONB,
      },
      other_skills: {
        type: Sequelize.TEXT,
      },
      nationality_acquisition: {
        type: Sequelize.JSONB,
      },
      health_info: {
        type: Sequelize.JSONB,
      },
      legal_info: {
        type: Sequelize.JSONB,
      },
      guarantee_info: {
        type: Sequelize.JSONB,
      },
      profile_picture: {
        type: Sequelize.STRING,
      },
      profile_picture_url: {
        type: Sequelize.STRING,
      },
      profile_picture_public_id: {
        type: Sequelize.STRING,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addConstraint('employees', {
      fields: ['user_id'],
      ...{
      type: 'foreign key',
      name: 'employees_user_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('employees', {
      fields: ['department_id'],
      ...{
      type: 'foreign key',
      name: 'employees_department_id_fkey',
      references: {
        table: 'departments',
        field: 'department_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('employees', {
      fields: ['position_id'],
      ...{
      type: 'foreign key',
      name: 'employees_position_id_fkey',
      references: {
        table: 'positions',
        field: 'position_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('employees', {
      fields: ['manager_id'],
      ...{
      type: 'foreign key',
      name: 'employees_manager_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('employees');
  }
};
