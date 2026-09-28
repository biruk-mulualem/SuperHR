'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ImportBatch extends Model {
        static associate(models) {
            ImportBatch.hasMany(models.AttendanceRecord, { 
                foreignKey: 'import_batch_id',
                as: 'attendance_records'
            });
            ImportBatch.hasMany(models.ImportError, { 
                foreignKey: 'import_batch_id',
                as: 'import_errors'
            });
        }
    }

    ImportBatch.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_name'
        },
        file_path: {
            type: DataTypes.STRING(500),
            field: 'file_path'
        },
        import_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'import_date'
        },
        period_start: {
            type: DataTypes.DATEONLY,
            field: 'period_start'
        },
        period_end: {
            type: DataTypes.DATEONLY,
            field: 'period_end'
        },
        period_type: {
            type: DataTypes.STRING(20),
            field: 'period_type'
        },
        total_rows: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_rows'
        },
        success_rows: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'success_rows'
        },
        error_rows: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'error_rows'
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'processing',
            field: 'status'
        },
        imported_by: {
            type: DataTypes.INTEGER,
            field: 'imported_by'
        },
        notes: {
            type: DataTypes.TEXT,
            field: 'notes'
        },
        started_at: {
            type: DataTypes.DATE,
            field: 'started_at'
        },
        completed_at: {
            type: DataTypes.DATE,
            field: 'completed_at'
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
        modelName: 'ImportBatch',
        tableName: 'import_batches',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return ImportBatch;
};