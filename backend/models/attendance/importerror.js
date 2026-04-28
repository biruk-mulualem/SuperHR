'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ImportError extends Model {
        static associate(models) {
            ImportError.belongsTo(models.ImportBatch, { 
                foreignKey: 'import_batch_id',
                as: 'import_batch'
            });
        }
    }

    ImportError.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        import_batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'import_batches',
                key: 'id'
            },
            field: 'import_batch_id'
        },
        row_number: {
            type: DataTypes.INTEGER,
            field: 'row_number'
        },
        employee_id: {
            type: DataTypes.INTEGER,
            field: 'employee_id'
        },
        error_type: {
            type: DataTypes.STRING(50),
            field: 'error_type'
        },
        error_message: {
            type: DataTypes.TEXT,
            field: 'error_message'
        },
        raw_data: {
            type: DataTypes.JSONB,
            field: 'raw_data'
        },
        is_resolved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_resolved'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        resolved_at: {
            type: DataTypes.DATE,
            field: 'resolved_at'
        },
        resolution_notes: {
            type: DataTypes.TEXT,
            field: 'resolution_notes'
        }
    }, {
        sequelize,
        modelName: 'ImportError',
        tableName: 'import_errors',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return ImportError;
};