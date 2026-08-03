// models/TerminationHistory.js
module.exports = (sequelize, DataTypes) => {
  const TerminationHistory = sequelize.define('TerminationHistory', {
    terminationHistoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: 'terminationHistoryId'
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employeeId'
    },
    terminationDateEC: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'terminationDateEC'
    },
    terminationDateGC: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'terminationDateGC'
    },
    terminationReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'terminationReason'
    },
    terminationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'terminationNotes'
    },
    rehireDateEC: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'rehireDateEC'
    },
    rehireDateGC: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'rehireDateGC'
    },
    rehireReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'rehireReason'
    },
    rehireNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rehireNotes'
    },
    isRehired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'isRehired'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'createdBy'
    }
  }, {
    tableName: 'TerminationHistories',
    timestamps: true,
    createdAt: 'createdAt',  // ← Explicitly tell Sequelize the column name
    updatedAt: 'updatedAt',  // ← Explicitly tell Sequelize the column name
    underscored: false       // ← Don't use snake_case
  });

  TerminationHistory.associate = function(models) {
    TerminationHistory.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    TerminationHistory.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return TerminationHistory;
};