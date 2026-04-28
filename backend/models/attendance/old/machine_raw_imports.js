'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class machine_raw_imports extends Model {
    static associate(models) {
      machine_raw_imports.belongsTo(models.import_batches, { foreignKey: 'import_batch_id', as: 'batch' });
      machine_raw_imports.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    }
  }
  
  machine_raw_imports.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    punch_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    punch_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    work_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    import_batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    row_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    has_error: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'machine_raw_imports',
    tableName: 'machine_raw_imports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  
  return machine_raw_imports;
};