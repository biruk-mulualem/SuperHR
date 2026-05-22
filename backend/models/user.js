"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Role association
      User.belongsTo(models.Role, { 
        foreignKey: "roleId" 
      });
      
      // Department association
      User.belongsTo(models.Department, { 
        foreignKey: "departmentId" 
      });
      
      // Employee association (one-to-one)
      User.hasOne(models.Employee, { 
        foreignKey: "userId", 
        as: "employee" 
      });
      
      // Documents uploaded by user
      User.hasMany(models.EmployeeDocument, { 
        foreignKey: "uploadedBy", 
        as: "uploadedDocuments" 
      });
      
    
    
    }

    // Instance method to validate password
    async validatePassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    }

    // Override toJSON to remove sensitive data
    toJSON() {
      const values = { ...this.get() };
      delete values.passwordHash;
      return values;
    }
  }

  User.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "user_id",
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          isAlphanumeric: true,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "full_name",
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "role_id",
        references: {
          model: "roles",
          key: "role_id",
        },
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "department_id",
        references: {
          model: "departments",
          key: "department_id",
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "created_by",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",

      hooks: {
        beforeCreate: async (user) => {
          if (user.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("passwordHash")) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
          }
        },
      },
    }
  );

  return User;
};