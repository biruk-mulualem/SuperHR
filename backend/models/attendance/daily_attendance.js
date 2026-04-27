// D:/SuperHR/backend/models/daily_attendance.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class daily_attendance extends Model {
        static associate(models) {
            daily_attendance.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
        }
    }
    
    daily_attendance.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        attendance_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        first_check_in: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_check_out: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        break_out_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        break_in_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        total_hours: {
            type: DataTypes.DECIMAL(5,2),
            defaultValue: 0,
        },
        late_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        break_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        morning_status: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        afternoon_status: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        is_half_day: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        half_day_type: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'daily_attendance',
        tableName: 'daily_attendance',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    
    return daily_attendance;
};