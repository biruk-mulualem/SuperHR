// models/PenaltyDeduction.js
module.exports = (sequelize, DataTypes) => {
  const PenaltyDeduction = sequelize.define('PenaltyDeduction', {
    deduction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' }
    },
    summary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'penalty_summaries', key: 'summary_id' }
    },
    penalty_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deduction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    period_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    period_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    deduction_type: {
      type: DataTypes.ENUM('percent_reduction', 'amount_reduction', 'full_reduction'),
      allowNull: false
    },
    deduction_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    deduction_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    previous_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    new_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    previous_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    new_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    processed_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // REMOVE processed_by_id - it doesn't exist
    // processed_by_id: { type: DataTypes.INTEGER, allowNull: true },
    approved_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_batch: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    batch_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    batch_rule_applied: {
      type: DataTypes.JSON,
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'penalty_deductions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  PenaltyDeduction.associate = (db) => {
    PenaltyDeduction.belongsTo(db.Employee, {
      foreignKey: 'employee_id',
      as: 'Employee'
    });
    PenaltyDeduction.belongsTo(db.PenaltySummary, {
      foreignKey: 'summary_id',
      as: 'PenaltySummary'
    });
  };

  return PenaltyDeduction;
};