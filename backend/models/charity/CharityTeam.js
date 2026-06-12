'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityTeam extends Model {
    static associate(models) {
      // Who leads and vice-leads the team (employees)
      CharityTeam.belongsTo(models.Employee, {
        foreignKey: 'head',
        as: 'headMember',
      });
      CharityTeam.belongsTo(models.Employee, {
        foreignKey: 'vice',
        as: 'viceMember',
      });

      // Who created the team (user)
      CharityTeam.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });

      // Who last updated the team
      CharityTeam.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater',
      });

      // Who deleted the team
      CharityTeam.belongsTo(models.User, {
        foreignKey: 'deletedBy',
        as: 'deleter',
      });

      // Beneficiaries that belong to this team
      CharityTeam.hasMany(models.CharityBeneficiary, {
        foreignKey: 'teamId',
        as: 'beneficiaries',
      });
    }
  }

  CharityTeam.init(
    {
      teamId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'team_id',
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      head: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'employee_id' },
      },
      vice: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'employee_id' },
      },
      // Array of employee_id integers e.g. [3, 7, 12]
      members: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: { model: 'users', key: 'user_id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: { model: 'users', key: 'user_id' },
      },
      deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'deleted_by',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'CharityTeam',
      tableName: 'charity_teams',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return CharityTeam;
};
