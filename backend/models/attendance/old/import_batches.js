'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class import_batches extends Model {
    static associate(models) {
      import_batches.belongsTo(models.User, { foreignKey: 'processed_by', as: 'processor' });
      import_batches.hasMany(models.import_errors, { foreignKey: 'import_batch_id', as: 'errors' });
      import_batches.hasMany(models.machine_raw_imports, { foreignKey: 'import_batch_id', as: 'raw_imports' });
    }
  }
  
  import_batches.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    import_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    import_type: { type: DataTypes.STRING(20), defaultValue: 'daily' },
    total_records: { type: DataTypes.INTEGER, defaultValue: 0 },
    success_records: { type: DataTypes.INTEGER, defaultValue: 0 },
    error_records: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    processed_by: { type: DataTypes.INTEGER, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'import_batches',
    tableName: 'import_batches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  
  return import_batches;
};