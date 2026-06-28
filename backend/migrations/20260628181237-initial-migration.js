module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('import_batches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING,
      },
      import_date: {
        type: Sequelize.DATE,
      },
      period_start: {
        type: Sequelize.DATEONLY,
      },
      period_end: {
        type: Sequelize.DATEONLY,
      },
      period_type: {
        type: Sequelize.STRING,
      },
      total_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      success_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      error_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "processing",
      },
      imported_by: {
        type: Sequelize.INTEGER,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      started_at: {
        type: Sequelize.DATE,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('roles', {
      role_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
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
    await queryInterface.createTable('departments', {
      department_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      manager_id: {
        type: Sequelize.INTEGER,
      },
      parent_department_id: {
        type: Sequelize.INTEGER,
      },
      budget: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      location: {
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
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      department_id: {
        type: Sequelize.INTEGER,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_login: {
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.INTEGER,
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
    await queryInterface.createTable('positions', {
      position_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department_id: {
        type: Sequelize.INTEGER,
      },
      level: {
        type: Sequelize.STRING,
      },
      min_salary: {
        type: Sequelize.DECIMAL,
      },
      max_salary: {
        type: Sequelize.DECIMAL,
      },
      requirements: {
        type: Sequelize.JSONB,
      },
      responsibilities: {
        type: Sequelize.JSONB,
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
    await queryInterface.createTable('import_errors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      import_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      row_number: {
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.INTEGER,
      },
      error_type: {
        type: Sequelize.STRING,
      },
      error_message: {
        type: Sequelize.TEXT,
      },
      raw_data: {
        type: Sequelize.JSONB,
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      resolved_at: {
        type: Sequelize.DATE,
      },
      resolution_notes: {
        type: Sequelize.TEXT,
      },
    });
    await queryInterface.createTable('charity_teams', {
      team_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      head: {
        type: Sequelize.INTEGER,
      },
      vice: {
        type: Sequelize.INTEGER,
      },
      members: {
        type: Sequelize.JSONB,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
      deleted_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('charity_beneficiaries', {
      beneficiary_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fullname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      full_info: {
        type: Sequelize.JSONB,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      monthly_allocation: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'bank'),
        allowNull: false,
        defaultValue: "bank",
      },
      bank_info: {
        type: Sequelize.JSONB,
      },
      is_specialcase: {
        type: Sequelize.STRING,
      },
      deliveries: {
        type: Sequelize.JSONB,
      },
      adjustments: {
        type: Sequelize.JSONB,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
      deleted_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('charity_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_id: {
        type: Sequelize.INTEGER,
      },
      details: {
        type: Sequelize.JSONB,
      },
      user_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.createTable('charity_settings', {
      setting_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      setting_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: "main",
      },
      distribution_release: {
        type: Sequelize.JSONB,
      },
      defaults: {
        type: Sequelize.JSONB,
      },
      updated_by: {
        type: Sequelize.INTEGER,
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
    await queryInterface.createTable('employee_documents', {
      document_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      document_type: {
        type: Sequelize.ENUM('id_card', 'cv', 'degree', 'guarantee_letter', 'resume', 'id-card', 'passport', 'certificate', 'contract', 'performance-review', 'child_profile', 'child_birth_certificate', 'child_medical_report', 'child_adoption_certificate', 'profile_picture', 'education_certificate', 'training_certificate', 'experience_letter', 'sdt_letter', 'national_id', 'naturalization_certificate', 'health_document', 'legal_document', 'spouse_profile', 'marriage_certificate'),
        allowNull: false,
      },
      document_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_size: {
        type: Sequelize.INTEGER,
      },
      mime_type: {
        type: Sequelize.STRING,
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: "pending",
      },
      notes: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sub_type: {
        type: Sequelize.STRING,
      },
      index: {
        type: Sequelize.INTEGER,
      },
      description: {
        type: Sequelize.TEXT,
      },
      metadata: {
        type: Sequelize.JSONB,
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
    await queryInterface.createTable('leave_balances', {
      leave_balance_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      years_of_service: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      yearly_entitlement: {
        type: Sequelize.INTEGER,
        defaultValue: 16,
      },
      carried_over: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      carried_over_from_year: {
        type: Sequelize.INTEGER,
      },
      carried_over_expiry_date: {
        type: Sequelize.DATEONLY,
      },
      total_allocation: {
        type: Sequelize.INTEGER,
        defaultValue: 16,
      },
      used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      pending_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      available_days: {
        type: Sequelize.INTEGER,
        defaultValue: 16,
      },
      sick_used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      sick_alert_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      maternity_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      maternity_used_date: {
        type: Sequelize.DATEONLY,
      },
      paternity_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      paternity_used_date: {
        type: Sequelize.DATEONLY,
      },
      bereavement_used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      unpaid_used_this_year: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.createTable('leave_types', {
      leave_type_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      default_days: {
        type: Sequelize.INTEGER,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      has_fixed_limit: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_one_time: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      requires_approval: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      min_notice_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      max_consecutive_days: {
        type: Sequelize.INTEGER,
      },
      requires_documentation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      gender_restriction: {
        type: Sequelize.ENUM('male', 'female', 'none'),
        defaultValue: "none",
      },
      carry_over_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
      },
      carry_over_expiry_years: {
        type: Sequelize.INTEGER,
        defaultValue: 2,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.createTable('leave_extensions', {
      extension_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      leave_request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_date: {
        type: Sequelize.DATEONLY,
      },
      original_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      additional_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_new_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: "pending",
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      approved_date: {
        type: Sequelize.DATEONLY,
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
      new_end_date: {
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
    await queryInterface.createTable('letter_templates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      fields: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: false,
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
    await queryInterface.createTable('payroll_periods', {
      period_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      period_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
      },
      status: {
        type: Sequelize.ENUM('draft', 'processing', 'processed', 'paid', 'closed'),
        defaultValue: "draft",
      },
      processed_by: {
        type: Sequelize.INTEGER,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      total_employees: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_basic_salary: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_allowances: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_overtime: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_gross: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_tax: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_pension_employee: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_pension_employer: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_penalties: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_net: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('employee_penalties', {
      penalty_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
      },
      penalty_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      calculation_type: {
        type: Sequelize.ENUM('fixed', 'percent'),
        defaultValue: "fixed",
      },
      value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      calculated_amount: {
        type: Sequelize.DECIMAL,
      },
      reference: {
        type: Sequelize.STRING,
      },
      submitted_by: {
        type: Sequelize.STRING,
      },
      contact: {
        type: Sequelize.STRING,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'applied', 'cancelled', 'reduced'),
        defaultValue: "active",
      },
      original_value: {
        type: Sequelize.DECIMAL,
      },
      reduction_reason: {
        type: Sequelize.TEXT,
      },
      reduced_by: {
        type: Sequelize.STRING,
      },
      reduced_at: {
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
      penalty_date: {
        type: Sequelize.DATEONLY,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_label: {
        type: Sequelize.STRING,
      },
      reduced_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
    });
    await queryInterface.createTable('onhold_payroll', {
      onhold_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      hold_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      hold_reason: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "active",
      },
      total_held_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_released_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      months_on_hold: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('payroll_processing', {
      processing_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      month_year: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: "completed",
      },
      processed_by: {
        type: Sequelize.STRING,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      unclaimed_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      paid_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      unclaimed_file_name: {
        type: Sequelize.STRING,
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
    await queryInterface.createTable('payroll_history', {
      history_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payroll_processing_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      method: {
        type: Sequelize.STRING,
        defaultValue: "Bank Transfer",
      },
      transaction_id: {
        type: Sequelize.STRING,
      },
      processed_by: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "completed",
      },
      source: {
        type: Sequelize.STRING,
        defaultValue: "normal",
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('onhold_payroll_details', {
      detail_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      onhold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      allowances_total: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      overtime_pay: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      gross_pay: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      absent_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      late_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      other_penalties: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      tax: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      pension_7: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      pension_11: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      net_held_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      released_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "held",
      },
      payment_history_id: {
        type: Sequelize.INTEGER,
      },
      released_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('penalty_summaries', {
      summary_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      penalty_id: {
        type: Sequelize.INTEGER,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      penalty_type: {
        type: Sequelize.ENUM('percent', 'asset', 'other'),
        allowNull: false,
      },
      penalty_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      penalty_category: {
        type: Sequelize.STRING,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      deducted_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      current_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      original_percentage: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      deducted_percentage: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      current_percentage: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'partially_deducted', 'fully_deducted', 'cancelled'),
        defaultValue: "active",
      },
      last_reduction_date: {
        type: Sequelize.DATEONLY,
      },
      last_reduced_by: {
        type: Sequelize.STRING,
      },
      last_reduction_reason: {
        type: Sequelize.TEXT,
      },
      reference_document: {
        type: Sequelize.STRING,
      },
      submitted_by: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('penalty_deductions', {
      deduction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      summary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      penalty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deduction_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      deduction_type: {
        type: Sequelize.ENUM('percent_reduction', 'amount_reduction', 'full_reduction'),
        allowNull: false,
      },
      deduction_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      deduction_percentage: {
        type: Sequelize.DECIMAL,
      },
      previous_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      new_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      previous_percentage: {
        type: Sequelize.DECIMAL,
      },
      new_percentage: {
        type: Sequelize.DECIMAL,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      processed_by: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      approved_by: {
        type: Sequelize.STRING,
      },
      is_batch: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      batch_id: {
        type: Sequelize.STRING,
      },
      batch_rule_applied: {
        type: Sequelize.JSON,
      },
      reference: {
        type: Sequelize.STRING,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('returned_payroll', {
      returned_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payroll_processing_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      original_payment_id: {
        type: Sequelize.INTEGER,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      return_reason: {
        type: Sequelize.TEXT,
      },
      return_source: {
        type: Sequelize.STRING,
        defaultValue: "bulk",
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },
      paid_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      kept_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      payment_history_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('carry_forwards', {
      carry_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'cleared', 'written_off'),
        defaultValue: "pending",
      },
      cleared_in_period_id: {
        type: Sequelize.INTEGER,
      },
      cleared_at: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('compensation_history', {
      history_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      component_type: {
        type: Sequelize.STRING,
      },
      old_value: {
        type: Sequelize.DECIMAL,
      },
      new_value: {
        type: Sequelize.DECIMAL,
      },
      change_percent: {
        type: Sequelize.DECIMAL,
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('recurring_deductions', {
      deduction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deduction_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      deduction_type_value: {
        type: Sequelize.STRING,
        defaultValue: "fixed",
      },
      percentage_value: {
        type: Sequelize.DECIMAL,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
      },
      total_months: {
        type: Sequelize.INTEGER,
      },
      remaining_months: {
        type: Sequelize.INTEGER,
      },
      reference_number: {
        type: Sequelize.STRING,
      },
      submitted_by: {
        type: Sequelize.STRING,
      },
      contact: {
        type: Sequelize.STRING,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      date: {
        type: Sequelize.DATEONLY,
      },
      created_by_name: {
        type: Sequelize.STRING,
      },
      last_applied_period_id: {
        type: Sequelize.INTEGER,
      },
      last_applied_at: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: "active",
      },
      approved_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('deduction_applications', {
      application_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deduction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount_applied: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      submitted_by: {
        type: Sequelize.INTEGER,
      },
      submitted_by_name: {
        type: Sequelize.STRING,
      },
      contact: {
        type: Sequelize.STRING,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      application_date: {
        type: Sequelize.DATEONLY,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'applied'),
        defaultValue: "applied",
      },
      approval_reference: {
        type: Sequelize.STRING,
      },
      is_partial: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('salary_holds', {
      hold_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
      },
      hold_reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hold_duration_months: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
      },
      released_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
      },
      status: {
        type: Sequelize.ENUM('active', 'released', 'partially_released'),
        defaultValue: "active",
      },
      released_by: {
        type: Sequelize.INTEGER,
      },
      released_at: {
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('hold_releases', {
      release_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      release_type: {
        type: Sequelize.STRING,
      },
      release_percent: {
        type: Sequelize.DECIMAL,
      },
      release_amount: {
        type: Sequelize.DECIMAL,
      },
      release_reason: {
        type: Sequelize.TEXT,
      },
      released_by: {
        type: Sequelize.INTEGER,
      },
      released_at: {
        type: Sequelize.DATE,
      },
      applied_to_period_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('payment_sessions', {
      session_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      session_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_window_days: {
        type: Sequelize.INTEGER,
        defaultValue: 7,
      },
      unclaimed_window_days: {
        type: Sequelize.INTEGER,
        defaultValue: 14,
      },
      total_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      employee_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'expired'),
        defaultValue: "active",
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('payroll_items', {
      payroll_item_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      basic_salary: {
        type: Sequelize.DECIMAL,
        allowNull: false,
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
      total_allowances: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      overtime_hours: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      overtime_pay: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      bonus_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      other_income: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      gross_pay: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      taxable_income: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      tax_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      tax_bracket_applied: {
        type: Sequelize.STRING,
      },
      pension_employee: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      pension_employer: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      absent_days: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      absent_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      late_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      late_penalty: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_penalties: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      loan_deduction: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      advance_deduction: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      cooperative_deduction: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      other_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      carry_forward_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      net_pay: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      is_on_hold: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      hold_id: {
        type: Sequelize.INTEGER,
      },
      hold_reason: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('payment_transactions', {
      transaction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: Sequelize.INTEGER,
      },
      payroll_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.STRING,
      },
      transaction_reference: {
        type: Sequelize.STRING,
      },
      payment_date: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'returned'),
        defaultValue: "pending",
      },
      processed_by: {
        type: Sequelize.INTEGER,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('penalty_reductions', {
      reduction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      penalty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount_reduced: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      percent_reduced: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      new_penalty_amount: {
        type: Sequelize.DECIMAL,
      },
      new_penalty_percent: {
        type: Sequelize.DECIMAL,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      reduced_by: {
        type: Sequelize.INTEGER,
      },
      reduced_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('penalty_reduction_rules', {
      rule_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rule_type: {
        type: Sequelize.ENUM('amount', 'percent'),
        allowNull: false,
      },
      min_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      max_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      reduction_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('returned_payments', {
      return_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      return_reason: {
        type: Sequelize.STRING,
      },
      original_amount: {
        type: Sequelize.DECIMAL,
      },
      returned_amount: {
        type: Sequelize.DECIMAL,
      },
      penalty_amount: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'resolved', 'written_off'),
        defaultValue: "pending",
      },
      resolved_by: {
        type: Sequelize.INTEGER,
      },
      resolved_at: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('unclaimed_salaries', {
      unclaimed_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      days_overdue: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('unclaimed', 'claimed', 'written_off'),
        defaultValue: "unclaimed",
      },
      claimed_date: {
        type: Sequelize.DATEONLY,
      },
      claimed_by: {
        type: Sequelize.INTEGER,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('unclaimed_payroll', {
      unclaimed_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payroll_processing_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      days_overdue: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "unclaimed",
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: "Active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('groups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: "Active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('uom', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: "Active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      standard_name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      brand: {
        type: Sequelize.STRING,
      },
      model: {
        type: Sequelize.STRING,
      },
      barcode: {
        type: Sequelize.STRING,
        unique: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
      },
      uom_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      conversion_uom_id: {
        type: Sequelize.INTEGER,
      },
      conversion_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      cost_price: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Discontinued'),
        allowNull: false,
        defaultValue: "Active",
      },
      spec_type: {
        type: Sequelize.ENUM('text', 'pdf'),
        allowNull: false,
        defaultValue: "text",
      },
      spec_text: {
        type: Sequelize.TEXT,
      },
      spec_pdf_name: {
        type: Sequelize.STRING,
      },
      spec_pdf_size: {
        type: Sequelize.STRING,
      },
      spec_pdf_url: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('stores', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Closed'),
        allowNull: false,
        defaultValue: "Active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('item_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      request_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      asking_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      supplying_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_by_id: {
        type: Sequelize.INTEGER,
      },
      requested_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'finalized'),
        allowNull: false,
        defaultValue: "pending",
      },
      remark: {
        type: Sequelize.TEXT,
      },
      approved_at: {
        type: Sequelize.DATE,
      },
      finalized_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('item_request_details', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      remark: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('store_balances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      min_stock_alert: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: "Active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('store_balance_histories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      balance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      previous_balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      new_balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      change_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      transaction_type: {
        type: Sequelize.ENUM('Stock In', 'Stock Out'),
        allowNull: false,
      },
      source_store_id: {
        type: Sequelize.INTEGER,
      },
      destination_store_id: {
        type: Sequelize.INTEGER,
      },
      reference_type: {
        type: Sequelize.ENUM('purchase', 'transfer', 'adjustment', 'return', 'sale', 'initialization', 'request'),
        allowNull: false,
        defaultValue: "adjustment",
      },
      reference_id: {
        type: Sequelize.INTEGER,
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      remark: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.createTable('store_group_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('store_to_store_relationships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      source_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      target_store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('user_group_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.createTable('system_settings', {
      setting_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      setting_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      data_type: {
        type: Sequelize.ENUM('json', 'string', 'number', 'boolean', 'array'),
        defaultValue: "json",
      },
      is_editable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_encrypted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
    await queryInterface.addConstraint('departments', {
      fields: ['manager_id'],
      ...{
      type: 'foreign key',
      name: 'departments_manager_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('departments', {
      fields: ['parent_department_id'],
      ...{
      type: 'foreign key',
      name: 'departments_parent_department_id_fkey',
      references: {
        table: 'departments',
        field: 'department_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('users', {
      fields: ['role_id'],
      ...{
      type: 'foreign key',
      name: 'users_role_id_fkey',
      references: {
        table: 'roles',
        field: 'role_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('users', {
      fields: ['department_id'],
      ...{
      type: 'foreign key',
      name: 'users_department_id_fkey',
      references: {
        table: 'departments',
        field: 'department_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('positions', {
      fields: ['department_id'],
      ...{
      type: 'foreign key',
      name: 'positions_department_id_fkey',
      references: {
        table: 'departments',
        field: 'department_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
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
    await queryInterface.addConstraint('import_errors', {
      fields: ['import_batch_id'],
      ...{
      type: 'foreign key',
      name: 'import_errors_import_batch_id_fkey',
      references: {
        table: 'import_batches',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['head'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_head_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['vice'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_vice_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_updated_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_teams', {
      fields: ['deleted_by'],
      ...{
      type: 'foreign key',
      name: 'charity_teams_deleted_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['team_id'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_team_id_fkey',
      references: {
        table: 'charity_teams',
        field: 'team_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_updated_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_beneficiaries', {
      fields: ['deleted_by'],
      ...{
      type: 'foreign key',
      name: 'charity_beneficiaries_deleted_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_logs', {
      fields: ['user_id'],
      ...{
      type: 'foreign key',
      name: 'charity_logs_user_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('charity_settings', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'charity_settings_updated_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('employee_documents', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'employee_documents_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('employee_documents', {
      fields: ['uploaded_by'],
      ...{
      type: 'foreign key',
      name: 'employee_documents_uploaded_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('leave_balances', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'leave_balances_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
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
    await queryInterface.addConstraint('leave_extensions', {
      fields: ['leave_request_id'],
      ...{
      type: 'foreign key',
      name: 'leave_extensions_leave_request_id_fkey',
      references: {
        table: 'leave_requests',
        field: 'leave_request_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('leave_extensions', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'leave_extensions_approved_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('leave_extensions', {
      fields: ['rejected_by'],
      ...{
      type: 'foreign key',
      name: 'leave_extensions_rejected_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
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
    await queryInterface.addConstraint('payroll_periods', {
      fields: ['processed_by'],
      ...{
      type: 'foreign key',
      name: 'payroll_periods_processed_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('employee_penalties', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'employee_penalties_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('employee_penalties', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'employee_penalties_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('employee_penalties', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'employee_penalties_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('onhold_payroll', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_history', {
      fields: ['payroll_processing_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_history_payroll_processing_id_fkey',
      references: {
        table: 'payroll_processing',
        field: 'processing_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_history', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_history_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('onhold_payroll_details', {
      fields: ['onhold_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_details_onhold_id_fkey',
      references: {
        table: 'onhold_payroll',
        field: 'onhold_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('onhold_payroll_details', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_details_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('onhold_payroll_details', {
      fields: ['payment_history_id'],
      ...{
      type: 'foreign key',
      name: 'onhold_payroll_details_payment_history_id_fkey',
      references: {
        table: 'payroll_history',
        field: 'history_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('penalty_summaries', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_summaries_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
    }
    });
    await queryInterface.addConstraint('penalty_deductions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_deductions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_deductions', {
      fields: ['summary_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_deductions_summary_id_fkey',
      references: {
        table: 'penalty_summaries',
        field: 'summary_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['payroll_processing_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_payroll_processing_id_fkey',
      references: {
        table: 'payroll_processing',
        field: 'processing_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['original_payment_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_original_payment_id_fkey',
      references: {
        table: 'payroll_history',
        field: 'history_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('returned_payroll', {
      fields: ['payment_history_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payroll_payment_history_id_fkey',
      references: {
        table: 'payroll_history',
        field: 'history_id'
      },
    }
    });
    await queryInterface.addConstraint('carry_forwards', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'carry_forwards_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('carry_forwards', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'carry_forwards_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('carry_forwards', {
      fields: ['cleared_in_period_id'],
      ...{
      type: 'foreign key',
      name: 'carry_forwards_cleared_in_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('compensation_history', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'compensation_history_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('compensation_history', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'compensation_history_approved_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('recurring_deductions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'recurring_deductions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('recurring_deductions', {
      fields: ['approved_by'],
      ...{
      type: 'foreign key',
      name: 'recurring_deductions_approved_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['deduction_id'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_deduction_id_fkey',
      references: {
        table: 'recurring_deductions',
        field: 'deduction_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('deduction_applications', {
      fields: ['submitted_by'],
      ...{
      type: 'foreign key',
      name: 'deduction_applications_submitted_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['released_by'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_released_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('salary_holds', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'salary_holds_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('hold_releases', {
      fields: ['hold_id'],
      ...{
      type: 'foreign key',
      name: 'hold_releases_hold_id_fkey',
      references: {
        table: 'salary_holds',
        field: 'hold_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('hold_releases', {
      fields: ['released_by'],
      ...{
      type: 'foreign key',
      name: 'hold_releases_released_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('hold_releases', {
      fields: ['applied_to_period_id'],
      ...{
      type: 'foreign key',
      name: 'hold_releases_applied_to_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('payment_sessions', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'payment_sessions_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_sessions', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'payment_sessions_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('payroll_items', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_items_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_items', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_items_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payroll_items', {
      fields: ['hold_id'],
      ...{
      type: 'foreign key',
      name: 'payroll_items_hold_id_fkey',
      references: {
        table: 'salary_holds',
        field: 'hold_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['session_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_session_id_fkey',
      references: {
        table: 'payment_sessions',
        field: 'session_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['payroll_item_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_payroll_item_id_fkey',
      references: {
        table: 'payroll_items',
        field: 'payroll_item_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('payment_transactions', {
      fields: ['processed_by'],
      ...{
      type: 'foreign key',
      name: 'payment_transactions_processed_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['penalty_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_penalty_id_fkey',
      references: {
        table: 'attendance_records',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('penalty_reductions', {
      fields: ['reduced_by'],
      ...{
      type: 'foreign key',
      name: 'penalty_reductions_reduced_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('penalty_reduction_rules', {
      fields: ['created_by'],
      ...{
      type: 'foreign key',
      name: 'penalty_reduction_rules_created_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('returned_payments', {
      fields: ['transaction_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payments_transaction_id_fkey',
      references: {
        table: 'payment_transactions',
        field: 'transaction_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('returned_payments', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'returned_payments_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('returned_payments', {
      fields: ['resolved_by'],
      ...{
      type: 'foreign key',
      name: 'returned_payments_resolved_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['transaction_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_transaction_id_fkey',
      references: {
        table: 'payment_transactions',
        field: 'transaction_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['period_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_period_id_fkey',
      references: {
        table: 'payroll_periods',
        field: 'period_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('unclaimed_salaries', {
      fields: ['claimed_by'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_salaries_claimed_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('unclaimed_payroll', {
      fields: ['payroll_processing_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_payroll_payroll_processing_id_fkey',
      references: {
        table: 'payroll_processing',
        field: 'processing_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('unclaimed_payroll', {
      fields: ['employee_id'],
      ...{
      type: 'foreign key',
      name: 'unclaimed_payroll_employee_id_fkey',
      references: {
        table: 'employees',
        field: 'employee_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('items', {
      fields: ['category_id'],
      ...{
      type: 'foreign key',
      name: 'items_category_id_fkey',
      references: {
        table: 'categories',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('items', {
      fields: ['uom_id'],
      ...{
      type: 'foreign key',
      name: 'items_uom_id_fkey',
      references: {
        table: 'uom',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('items', {
      fields: ['conversion_uom_id'],
      ...{
      type: 'foreign key',
      name: 'items_conversion_uom_id_fkey',
      references: {
        table: 'uom',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('item_requests', {
      fields: ['asking_store_id'],
      ...{
      type: 'foreign key',
      name: 'item_requests_asking_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('item_requests', {
      fields: ['supplying_store_id'],
      ...{
      type: 'foreign key',
      name: 'item_requests_supplying_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('item_requests', {
      fields: ['requested_by_id'],
      ...{
      type: 'foreign key',
      name: 'item_requests_requested_by_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('item_request_details', {
      fields: ['request_id'],
      ...{
      type: 'foreign key',
      name: 'item_request_details_request_id_fkey',
      references: {
        table: 'item_requests',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('item_request_details', {
      fields: ['item_id'],
      ...{
      type: 'foreign key',
      name: 'item_request_details_item_id_fkey',
      references: {
        table: 'items',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balances', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balances_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balances', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'store_balances_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balances', {
      fields: ['item_id'],
      ...{
      type: 'foreign key',
      name: 'store_balances_item_id_fkey',
      references: {
        table: 'items',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['balance_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_balance_id_fkey',
      references: {
        table: 'store_balances',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['item_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_item_id_fkey',
      references: {
        table: 'items',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['source_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_source_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['destination_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_destination_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('store_balance_histories', {
      fields: ['changed_by'],
      ...{
      type: 'foreign key',
      name: 'store_balance_histories_changed_by_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('store_group_relations', {
      fields: ['store_id'],
      ...{
      type: 'foreign key',
      name: 'store_group_relations_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_group_relations', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'store_group_relations_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_to_store_relationships', {
      fields: ['source_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_to_store_relationships_source_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('store_to_store_relationships', {
      fields: ['target_store_id'],
      ...{
      type: 'foreign key',
      name: 'store_to_store_relationships_target_store_id_fkey',
      references: {
        table: 'stores',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('user_group_relations', {
      fields: ['user_id'],
      ...{
      type: 'foreign key',
      name: 'user_group_relations_user_id_fkey',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('user_group_relations', {
      fields: ['group_id'],
      ...{
      type: 'foreign key',
      name: 'user_group_relations_group_id_fkey',
      references: {
        table: 'groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    }
    });
    await queryInterface.addConstraint('system_settings', {
      fields: ['updated_by'],
      ...{
      type: 'foreign key',
      name: 'system_settings_updated_by_fkey',
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
    await queryInterface.dropTable('import_batches');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('departments');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('positions');
    await queryInterface.dropTable('employees');
    await queryInterface.dropTable('attendance_records');
    await queryInterface.dropTable('import_errors');
    await queryInterface.dropTable('charity_teams');
    await queryInterface.dropTable('charity_beneficiaries');
    await queryInterface.dropTable('charity_logs');
    await queryInterface.dropTable('charity_settings');
    await queryInterface.dropTable('employee_documents');
    await queryInterface.dropTable('leave_balances');
    await queryInterface.dropTable('leave_types');
    await queryInterface.dropTable('leave_requests');
    await queryInterface.dropTable('leave_extensions');
    await queryInterface.dropTable('leave_notifications');
    await queryInterface.dropTable('letter_templates');
    await queryInterface.dropTable('payroll_periods');
    await queryInterface.dropTable('employee_penalties');
    await queryInterface.dropTable('onhold_payroll');
    await queryInterface.dropTable('payroll_processing');
    await queryInterface.dropTable('payroll_history');
    await queryInterface.dropTable('onhold_payroll_details');
    await queryInterface.dropTable('penalty_summaries');
    await queryInterface.dropTable('penalty_deductions');
    await queryInterface.dropTable('returned_payroll');
    await queryInterface.dropTable('carry_forwards');
    await queryInterface.dropTable('compensation_history');
    await queryInterface.dropTable('recurring_deductions');
    await queryInterface.dropTable('deduction_applications');
    await queryInterface.dropTable('salary_holds');
    await queryInterface.dropTable('hold_releases');
    await queryInterface.dropTable('payment_sessions');
    await queryInterface.dropTable('payroll_items');
    await queryInterface.dropTable('payment_transactions');
    await queryInterface.dropTable('penalty_reductions');
    await queryInterface.dropTable('penalty_reduction_rules');
    await queryInterface.dropTable('returned_payments');
    await queryInterface.dropTable('unclaimed_salaries');
    await queryInterface.dropTable('unclaimed_payroll');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('groups');
    await queryInterface.dropTable('uom');
    await queryInterface.dropTable('items');
    await queryInterface.dropTable('stores');
    await queryInterface.dropTable('item_requests');
    await queryInterface.dropTable('item_request_details');
    await queryInterface.dropTable('store_balances');
    await queryInterface.dropTable('store_balance_histories');
    await queryInterface.dropTable('store_group_relations');
    await queryInterface.dropTable('store_to_store_relationships');
    await queryInterface.dropTable('user_group_relations');
    await queryInterface.dropTable('system_settings');
  }
};
