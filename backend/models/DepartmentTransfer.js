'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DepartmentTransfer extends Model {
    static associate(models) {
      // DepartmentTransfer belongs to Employee
      DepartmentTransfer.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });

      // DepartmentTransfer belongs to From Department
      DepartmentTransfer.belongsTo(models.Department, {
        foreignKey: 'fromDepartmentId',
        as: 'fromDepartment'
      });

      // DepartmentTransfer belongs to To Department
      DepartmentTransfer.belongsTo(models.Department, {
        foreignKey: 'toDepartmentId',
        as: 'toDepartment'
      });

      // DepartmentTransfer belongs to Approver (User)
      DepartmentTransfer.belongsTo(models.User, {
        foreignKey: 'approvedBy',
        as: 'approver'
      });
    }

    // Helper methods
    getStatusLabel() {
      const labels = {
        active: 'Active',
        reversed: 'Reversed',
        completed: 'Completed'
      };
      return labels[this.status] || this.status;
    }

    getStatusColor() {
      const colors = {
        active: 'green',
        reversed: 'red',
        completed: 'blue'
      };
      return colors[this.status] || 'gray';
    }

    isActive() {
      return this.status === 'active';
    }

    isReversed() {
      return this.status === 'reversed';
    }

    isCompleted() {
      return this.status === 'completed';
    }
  }

  DepartmentTransfer.init(
    {
      transferId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'transfer_id',
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'employee_id',
        references: {
          model: 'employees',
          key: 'employee_id'
        }
      },
      fromDepartmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'from_department_id',
        references: {
          model: 'departments',
          key: 'department_id'
        }
      },
      toDepartmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'to_department_id',
        references: {
          model: 'departments',
          key: 'department_id'
        }
      },
      transferDateEC: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'transfer_date_ec',
        comment: 'Ethiopian calendar transfer date (DD/MM/YYYY)'
      },
      transferDateGC: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'transfer_date_gc',
        comment: 'Gregorian calendar transfer date'
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'reason'
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notes'
      },
      status: {
        type: DataTypes.ENUM('active', 'reversed', 'completed'),
        defaultValue: 'active',
        field: 'status'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      modelName: 'DepartmentTransfer',
      tableName: 'department_transfers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return DepartmentTransfer;
};