// models/RecurringDeduction.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecurringDeduction extends Model {
    static associate(models) {
      RecurringDeduction.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      RecurringDeduction.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
      });
      RecurringDeduction.hasMany(models.DeductionApplication, {
        foreignKey: 'deduction_id',
        as: 'applications'
      });
    }

    getRemainingMonths() {
      if (!this.start_date) return 0;
      const now = new Date();
      const start = new Date(this.start_date);
      const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + 
                           (now.getMonth() - start.getMonth());
      return Math.max(0, (this.total_months || 0) - monthsPassed);
    }

    isActive() {
      if (this.status !== 'active') return false;
      if (this.end_date && new Date(this.end_date) < new Date()) return false;
      if (this.remaining_months !== null && this.remaining_months <= 0) return false;
      return true;
    }
    
    // Calculate deduction amount based on government net pay
    calculateAmount(governmentNet) {
      if (this.deduction_type_value === 'percent') {
        return Math.floor(governmentNet * (this.percentage_value / 100));
      }
      return parseFloat(this.amount);
    }
    
    // Update remaining months after applying
    async decrementRemainingMonths(transaction) {
      if (this.remaining_months !== null && this.remaining_months > 0) {
        this.remaining_months -= 1;
        if (this.remaining_months === 0) {
          this.status = 'completed';
        }
        await this.save({ transaction });
      }
    }
  }

  RecurringDeduction.init({
    deduction_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    deduction_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'deduction_type'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    deduction_type_value: {
      type: DataTypes.STRING(20),
      defaultValue: 'fixed',
      field: 'deduction_type_value',
      validate: {
        isIn: [['fixed', 'percent']]
      }
    },
    percentage_value: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'percentage_value',
      validate: {
        min: 0,
        max: 100
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    total_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_months',
      validate: {
        min: 1
      }
    },
    remaining_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'remaining_months'
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'reference_number'
    },
    // Frontend additional fields
    submitted_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'submitted_by'
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'contact'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date'
    },
    created_by_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'created_by_name'
    },
    last_applied_period_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_applied_period_id'
    },
    last_applied_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_applied_at'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'RecurringDeduction',
    tableName: 'recurring_deductions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] },
      { fields: ['deduction_type'] },
      { fields: ['start_date'] },
      { fields: ['end_date'] }
    ],
    
    hooks: {
      beforeCreate: async (deduction) => {
        // Set remaining months if total_months is provided
        if (deduction.total_months && !deduction.remaining_months) {
          deduction.remaining_months = deduction.total_months;
        }
        
        // Set default date if not provided
        if (!deduction.date) {
          deduction.date = new Date().toISOString().split('T')[0];
        }
        
        // Validate percentage_value if type is percent
        if (deduction.deduction_type_value === 'percent' && !deduction.percentage_value) {
          throw new Error('Percentage value is required for percent type deductions');
        }
        
        // Validate amount if type is fixed
        if (deduction.deduction_type_value === 'fixed' && (!deduction.amount || deduction.amount <= 0)) {
          throw new Error('Amount is required for fixed type deductions');
        }
      },
      
      beforeUpdate: async (deduction) => {
        // Auto-update status based on remaining months
        if (deduction.remaining_months === 0) {
          deduction.status = 'completed';
        }
        
        // Update end_date based on total_months if start_date changed
        if (deduction.changed('start_date') && deduction.total_months) {
          const endDate = new Date(deduction.start_date);
          endDate.setMonth(endDate.getMonth() + deduction.total_months);
          deduction.end_date = endDate.toISOString().split('T')[0];
        }
      }
    }
  });

  return RecurringDeduction;
};