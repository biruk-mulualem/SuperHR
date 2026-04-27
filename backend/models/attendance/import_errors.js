'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class import_errors extends Model {
    static associate(models) {
      import_errors.belongsTo(models.import_batches, { foreignKey: 'import_batch_id', as: 'batch' });
    }
  }
  
  import_errors.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    import_batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    row_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employee_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    punch_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    error_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'import_errors',
    tableName: 'import_errors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  
  return import_errors;
};