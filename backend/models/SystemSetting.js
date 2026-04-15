// models/SystemSetting.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemSetting extends Model {
    static associate(models) {
      // Optional: track who last updated the setting
      SystemSetting.belongsTo(models.User, { 
        foreignKey: 'updatedBy', 
        as: 'updater' 
      });
    }

    // Helper method to get a specific setting by key
    static async getSetting(key, defaultValue = null) {
      const setting = await this.findOne({ where: { settingKey: key } });
      return setting ? setting.settingValue : defaultValue;
    }

    // Helper method to set/update a setting
    static async setSetting(key, value, userId = null) {
      const [setting, created] = await this.findOrCreate({
        where: { settingKey: key },
        defaults: {
          settingKey: key,
          settingValue: value,
          updatedBy: userId,
          category: key.split('.')[0] // Extract category from key
        }
      });
      
      if (!created) {
        setting.settingValue = value;
        if (userId) setting.updatedBy = userId;
        await setting.save();
      }
      
      return setting;
    }

    // Helper method to get all settings grouped by category
    static async getAllSettingsGrouped() {
      const settings = await this.findAll();
      const grouped = {};
      
      settings.forEach(setting => {
        const category = setting.category;
        if (!grouped[category]) grouped[category] = {};
        grouped[category][setting.settingKey] = setting.settingValue;
      });
      
      return grouped;
    }

    // Get default attendance rules
    static getDefaultAttendanceRules() {
      return {
        // Work Schedule
        workSchedule: {
          expectedCheckIn: '06:20',
          expectedCheckOut: '18:00',
          lateThreshold: 5,
          gracePeriod: 15,
          earlyDepartureThreshold: 30,
          minWorkHours: 4,
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        
        // Break Rules
        breakRules: {
          lunchStart: '12:00',
          lunchEnd: '13:00',
          lunchDuration: 60,
          isLunchPaid: false,
          morningBreak: 15,
          afternoonBreak: 15,
          flexibleBreaks: false
        },
        
        // Overtime Rules
        overtimeRules: {
          threshold: 8,
          weekdayRate: 1.5,
          weekendRate: 2.0,
          holidayRate: 2.5,
          maxPerDay: 4,
          maxPerWeek: 20,
          approvalRequired: true,
          eligiblePositions: []
        },
        
        // Leave Rules
        leaveRules: {
          annual: 20,
          sick: 10,
          maternity: 90,
          paternity: 10,
          bereavement: 5,
          unpaid: true,
          maxConsecutive: 30,
          noticeDays: 3,
          carryover: true,
          maxCarryover: 30
        },
        
        // Holiday Rules
        holidayRules: {
          holidays: [
            { date: '2026-01-01', name: 'New Year', type: 'public' },
            { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
            { date: '2026-01-19', name: 'Timkat', type: 'religious' },
            { date: '2026-03-02', name: 'Adwa Victory Day', type: 'public' },
            { date: '2026-04-18', name: 'Good Friday', type: 'religious' },
            { date: '2026-04-20', name: 'Easter Monday', type: 'religious' },
            { date: '2026-05-01', name: 'Labour Day', type: 'public' },
            { date: '2026-05-05', name: 'Patriots Day', type: 'public' },
            { date: '2026-05-28', name: 'Derg Downfall Day', type: 'public' },
            { date: '2026-09-11', name: 'Ethiopian New Year', type: 'public' },
            { date: '2026-09-27', name: 'Meskel', type: 'religious' }
          ],
          holidayOvertimeRate: 2.5
        },
        
        // Field Work Rules
        fieldWorkRules: {
          consideredPresent: true,
          defaultHours: 8,
          requireCheckin: false,
          eligiblePositions: []
        },
        
        // Remote Work Rules
        remoteWorkRules: {
          allowed: true,
          maxDaysPerWeek: 2,
          approvalRequired: true,
          eligiblePositions: []
        },
        
        // Notification Rules
        notificationRules: {
          sendLateAlert: true,
          lateAlertMinutes: 30,
          sendAbsentAlert: true,
          absentAlertHour: 10,
          notifyManagers: true
        },
        
        // Report Rules
        reportRules: {
          autoGenerateWeekly: true,
          autoGenerateMonthly: true,
          weeklyReportDay: 'friday',
          monthlyReportDay: 25
        }
      };
    }
  }

  SystemSetting.init(
    {
      settingId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'setting_id',
      },
      settingKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'setting_key',
        validate: {
          notEmpty: { msg: 'Setting key is required' },
          is: {
            args: /^[a-zA-Z_][a-zA-Z0-9_.]*$/,
            msg: 'Setting key must be a valid identifier (letters, numbers, dots, underscores)'
          }
        }
      },
      settingValue: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'setting_value',
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'category',

      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
      },
      dataType: {
        type: DataTypes.ENUM('json', 'string', 'number', 'boolean', 'array'),
        defaultValue: 'json',
        field: 'data_type',
      },
      isEditable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_editable',
      },
      isEncrypted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_encrypted',
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'SystemSetting',
      tableName: 'system_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      
      // Hooks for data transformation
      hooks: {
        beforeSave: async (setting) => {
          // Increment version on change
          if (setting.changed('settingValue')) {
            setting.version += 1;
          }
        }
      }
    }
  );

  return SystemSetting;
};

