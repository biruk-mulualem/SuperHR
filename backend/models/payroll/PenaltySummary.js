// models/PenaltySummary.js
module.exports = (sequelize, DataTypes) => {
  const PenaltySummary = sequelize.define('PenaltySummary', {
    summary_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' }
    },
    penalty_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    period_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    period_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    period_label: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    penalty_type: {
      type: DataTypes.ENUM('percent', 'asset', 'other'),
      allowNull: false
    },
    penalty_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    penalty_category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // For Asset & Other penalties (amount in ETB)
    original_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Original amount in ETB'
    },
    deducted_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total deducted amount in ETB'
    },
    current_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Current amount after deductions (original - deducted)'
    },
    
    // For Percent penalties (percentage value)
    original_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Original percentage'
    },
    deducted_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Total deducted percentage'
    },
    current_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Current percentage after deductions (original - deducted)'
    },
    
    // Status
    status: {
      type: DataTypes.ENUM('active', 'partially_deducted', 'fully_deducted', 'cancelled'),
      defaultValue: 'active'
    },
    
    // Last reduction info
    last_reduction_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    last_reduced_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    last_reduction_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Metadata
    reference_document: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    submitted_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'penalty_summaries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PenaltySummary;
};