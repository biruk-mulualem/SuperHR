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
          normalOTRate: 1.5,
          weekendOTRate: 2.0,
          holidayOTRate: 2.5,
          maxPerDay: 4,
          maxPerWeek: 20,
       
          eligiblePositions: []
        },
        
        // Leave Rules
   // Updated comprehensive structure

  "leave.rules": {
    // ========== LEAVE TYPE CONFIGURATIONS ==========
    "annualLeave": {
      "baseDays": 16,
      "incrementInterval": 2,
      "incrementAmount": 1,
      "maxDays": null,
      "carryOverLimit": 10,
      "carryOverExpiryYears": 2,
      "minMonthsBeforeRequest": 6,
      "accrualType": "anniversary",
      "requiresApproval": true,
      "minNoticeDays": 7,
      "maxConsecutiveDays": 30
    },
    "sickLeave": {
      "hasFixedLimit": false,
      "requiresDoctorNoteAfter": 3,
      "alertThreshold": 15,
      "resetFrequency": "yearly",
      "requiresApproval": false,
      "minNoticeDays": 0
    },
    "maternityLeave": {
      "defaultDays": 90,
      "isPaid": true,
      "requiresApproval": true,
      "requiresDocumentation": true,
      "minNoticeDays": 30,
      "isOneTime": true,
      "genderRestriction": "female",
      "extensionAllowed": true,
      "maxExtensionDays": 30
    },
    "paternityLeave": {
      "defaultDays": 3,
      "isPaid": true,
      "requiresApproval": true,
      "minNoticeDays": 14,
      "isOneTime": true,
      "genderRestriction": "male",
      "mustTakeWithinDays": 30
    },
    "bereavementLeave": {
      "defaultDays": 3,
      "isPaid": true,
      "requiresApproval": true,
      "requiresDocumentation": true,
      "minNoticeDays": 0,
      "eligibleRelationships": ["spouse", "parent", "child", "sibling"],
      "immediateFamilyDays": 5,
      "isOneTime": false,
      "maxPerYear": 10
    },
    "unpaidLeave": {
      "isPaid": false,
      "requiresApproval": true,
      "requiresDirectorApproval": true,
      "minNoticeDays": 14,
      "maxConsecutiveDays": 30,
      "maxPerYear": 60,
      "requiresReason": true
    },

    // ========== YEAR-END PROCESSING ==========
    "yearEndProcessing": {
      "processingDate": "2026-12-31",
      "carryOverDeadline": "2026-12-15",
      "expiryNotificationDays": [60, 30, 14, 7, 3, 1],
      "autoCarryOver": true,
      "resetSickLeave": true,
      "notificationRecipients": ["hr", "employee", "manager"]
    },

    // ========== APPROVAL WORKFLOW ==========
    "approvalWorkflow": {
      "requiresManagerApproval": true,
      "requiresHrApproval": true,
      "autoApproveThresholdDays": 3,
      "autoApproveLeaveTypes": ["sick_leave"],
      "escalationDays": 7,
      "approvalChain": ["manager", "hr", "director"],
      "allowSelfCancellation": true,
      "cancellationDeadlineDays": 2,
      "rejectionReasonRequired": true
    },

    // ========== RETURN TRACKING ==========
    "returnTracking": {
      "enabled": true,
      "returnConfirmationRequired": true,
      "gracePeriodHours": 24,
      "overdueAlertDays": [1, 3, 5, 7],
      "allowEarlyReturn": true,
      "allowLateReturn": true,
      "requireReturnNotes": false,
      "autoMarkReturned": false,
      "overdueAction": "notify",
      "overdueEscalationDays": [1, 3, 5, 7]
    },

    // ========== NOTIFICATIONS ==========
    "notifications": {
      "reminderDaysBefore": [30, 14, 7, 3, 1],
      "overdueAlertDays": [1, 3, 5, 7],
      "expiryAlertDays": [60, 30, 14, 7],
      "pendingApprovalReminderDays": [3, 5, 7],
      "channels": ["email", "in_app"],
      "notifyOn": {
        "requestSubmitted": ["manager", "hr"],
        "requestApproved": ["employee"],
        "requestRejected": ["employee"],
        "extensionRequested": ["manager", "hr"],
        "extensionApproved": ["employee"],
        "extensionRejected": ["employee"],
        "returnOverdue": ["employee", "manager", "hr"],
        "balanceLow": ["employee"],
        "leaveExpiring": ["employee"],
        "carryOverApplied": ["employee"]
      }
    },

    // ========== BLACKOUT PERIODS ==========
    "blackoutPeriods": {
      "enabled": true,
      "global": [
        { "start": "2026-01-01", "end": "2026-01-07", "reason": "Year-end closing", "departments": ["all"] },
        { "start": "2026-03-15", "end": "2026-03-30", "reason": "Annual audit", "departments": ["all"] }
      ],
      "departmentSpecific": {
        "finance": [
          { "start": "2026-03-01", "end": "2026-03-31", "reason": "Tax filing period" },
          { "start": "2026-12-01", "end": "2026-12-31", "reason": "Year-end closing" }
        ],
        "operations": [
          { "start": "2026-06-01", "end": "2026-06-15", "reason": "System upgrade" }
        ]
      },
      "exceptionAllowed": true,
      "exceptionRequiresDirectorApproval": true
    },

    // ========== EXTENSIONS ==========
    "extensions": {
      "maxExtensionsPerLeave": 2,
      "maxTotalExtensionDays": 30,
      "extensionRequiresApproval": true,
      "extensionApprovalChain": ["manager", "hr"],
      "autoApproveExtensionDays": 2,
      "extensionReasonRequired": true,
      "doctorNoteRequiredForExtension": true,
      "allowedLeaveTypesForExtension": ["sick_leave"]
    },

    // ========== VALIDATION RULES ==========
    "validation": {
      "minDaysPerRequest": 1,
      "maxDaysPerRequest": 30,
      "minNoticeDaysPerType": {
        "annual": 7,
        "sick": 0,
        "maternity": 30,
        "paternity": 14,
        "bereavement": 0,
        "unpaid": 14
      },
      "overlapAllowed": false,
      "concurrentLeavesAllowed": true,
      "maxConcurrentEmployees": 3,
      "pendingRequestsBlockNew": true,
      "futureDateOnly": true,
      "maxFutureDays": 365,
      "weekendCounting": true,
      "holidayCounting": false
    }
  },

  // ========== ADD TAX RULES HERE ==========
    "tax.rules": {
      version: "1.0",
      effectiveFrom: "2024-01-01",
      legalReference: {
        incomeTaxProclamation: "No. 286/2002 as amended",
        pensionProclamation: "No. 715/2011 as amended by No. 908/2015"
      },
      employmentTax: {
        brackets: [
          { min: 0, max: 2000, rate: 0, deduction: 0, description: "Exempt" },
          { min: 2001, max: 4000, rate: 15, deduction: 0, description: "15% on amount over 2,000" },
          { min: 4001, max: 7000, rate: 20, deduction: 200, description: "20% minus 200" },
          { min: 7001, max: 10000, rate: 25, deduction: 550, description: "25% minus 550" },
          { min: 10001, max: 14000, rate: 30, deduction: 1050, description: "30% minus 1,050" },
          { min: 14001, max: null, rate: 35, deduction: 1750, description: "35% minus 1,750" }
        ],
        calculationFormula: "Tax = (Income × Rate ÷ 100) - Deduction",
        roundingMethod: "floor"
      },
      pension: {
        employeeRate: 7,
        employerRate: 11,
        monthlyCap: 15000,
        maxEmployeeContribution: 1050,
        maxEmployerContribution: 1650,
        calculationBase: "basic_salary_only",
        notes: "Any salary above 15,000 ETB is not subject to pension contribution"
      },
      exemptions: {
        transportAllowance: {
          isExempt: true,
          maxExemptAmount: 2200,
          alternativeLimit: "25_percent_of_salary",
          calculationMethod: "min_of_fixed_or_percentage"
        },
        medicalReimbursement: { isExempt: true },
        hardshipAllowance: { isExempt: true },
        travelReimbursement: { isExempt: true }
      },
      deadlines: {
        taxRemittanceDay: 8,
        pensionRemittanceDay: 10
      }
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

