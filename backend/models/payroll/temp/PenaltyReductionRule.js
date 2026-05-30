// models/PenaltyReductionRule.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PenaltyReductionRule extends Model {
    static associate(models) {
      PenaltyReductionRule.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
    
    static async getAmountRules() {
      return this.findAll({
        where: { rule_type: 'amount', is_active: true },
        order: [['min_value', 'ASC']]
      });
    }
    
    static async getPercentRules() {
      return this.findAll({
        where: { rule_type: 'percent', is_active: true },
        order: [['min_value', 'ASC']]
      });
    }
    
    static applyRules(value, rules) {
      const rule = rules.find(r => 
        value >= r.min_value && value < r.max_value
      );
      return rule ? Math.min(rule.reduction_value, value) : 0;
    }
  }

  PenaltyReductionRule.init({
    rule_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rule_type: {
      type: DataTypes.ENUM('amount', 'percent'),
      allowNull: false,
      field: 'rule_type'
    },
    min_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'min_value'
    },
    max_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'max_value'
    },
    reduction_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'reduction_value'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
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
    modelName: 'PenaltyReductionRule',
    tableName: 'penalty_reduction_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PenaltyReductionRule;
};