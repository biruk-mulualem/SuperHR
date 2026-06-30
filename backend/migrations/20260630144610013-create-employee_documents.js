module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('employee_documents');
  }
};
