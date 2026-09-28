'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LeaveBalance extends Model {
    static associate(models) {
      LeaveBalance.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
    }
    
    // Ethiopian progressive entitlement calculation
    static calculateEthiopianEntitlement(yearsOfService) {
      if (yearsOfService <= 2) return 16;
      return 16 + Math.ceil((yearsOfService - 2) / 2);
    }
  }

  LeaveBalance.init({
    leaveBalanceId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'leave_balance_id',
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' },
      field: 'employee_id',
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    yearsOfService: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'years_of_service',
    },
    yearlyEntitlement: {
      type: DataTypes.INTEGER,
      defaultValue: 16,
      field: 'yearly_entitlement',
    },
    carriedOver: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'carried_over',
    },
    carriedOverFromYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'carried_over_from_year',
    },
    carriedOverExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'carried_over_expiry_date',
    },
    totalAllocation: {
      type: DataTypes.INTEGER,
      defaultValue: 16,
      field: 'total_allocation',
    },
    usedThisYear: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'used_this_year',
    },
    pendingDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'pending_days',
    },
    availableDays: {
      type: DataTypes.INTEGER,
      defaultValue: 16,
      field: 'available_days',
    },
    sickUsedThisYear: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sick_used_this_year',
    },
    sickAlertSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sick_alert_sent',
    },
    maternityUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'maternity_used',
    },
    maternityUsedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'maternity_used_date',
    },
    paternityUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'paternity_used',
    },
    paternityUsedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'paternity_used_date',
    },
    bereavementUsedThisYear: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'bereavement_used_this_year',
    },
    unpaidUsedThisYear: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'unpaid_used_this_year',
    },
  }, {
    sequelize,
    modelName: 'LeaveBalance',
    tableName: 'leave_balances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { unique: true, fields: ['employee_id', 'year'] },
      { fields: ['employee_id'] },
      { fields: ['year'] }
    ],
    
    hooks: {
      beforeCreate: async (balance, options) => {
        if (balance.employeeId) {
          const employee = await sequelize.models.Employee.findByPk(balance.employeeId);
          if (employee && employee.hireDate) {
            const hireYear = new Date(employee.hireDate).getFullYear();
            balance.yearsOfService = balance.year - hireYear;
            if (balance.yearsOfService < 0) balance.yearsOfService = 0;
            balance.yearlyEntitlement = LeaveBalance.calculateEthiopianEntitlement(balance.yearsOfService);
            balance.totalAllocation = balance.yearlyEntitlement + (balance.carriedOver || 0);
            balance.availableDays = balance.totalAllocation - (balance.usedThisYear || 0) - (balance.pendingDays || 0);
          }
        }
      },
      beforeUpdate: async (balance) => {
        if (balance.changed('usedThisYear') || balance.changed('pendingDays')) {
          balance.availableDays = (balance.totalAllocation || 0) - 
                                  (balance.usedThisYear || 0) - 
                                  (balance.pendingDays || 0);
        }
      }
    }
  });

  return LeaveBalance;
};