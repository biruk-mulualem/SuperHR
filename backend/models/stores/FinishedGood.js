// models/FinishedGood.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinishedGood extends Model {
    static associate(models) {
      FinishedGood.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'createdByUser',
        targetKey: 'userId'
      });
      FinishedGood.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updatedByUser',
        targetKey: 'userId'
      });
    }
  }

  FinishedGood.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      fgCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'fg_code'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255]
        }
      },
      type: {
        type: DataTypes.ENUM('Paint', 'Fiber'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Discontinued'),
        allowNull: false,
        defaultValue: 'Active'
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by'
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      modelName: 'FinishedGood',
      tableName: 'finished_goods',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        // ✅ Use beforeValidate - runs BEFORE validation checks
        beforeValidate: async (finishedGood) => {
          if (!finishedGood.fgCode) {
            const seqName = 'finished_goods_code_seq';
            const [result] = await sequelize.query(
              `SELECT nextval('"${seqName}"') as nextval`
            );
            const nextVal = parseInt(result[0].nextval);
            finishedGood.fgCode = `FG-${String(nextVal).padStart(3, '0')}`;
            console.log('✅ Generated FG Code:', finishedGood.fgCode);
          }
        },
        beforeUpdate: (finishedGood) => {
          // Prevent fgCode from being changed
          if (finishedGood.changed('fgCode')) {
            throw new Error('FG Code cannot be changed');
          }
        }
      }
    }
  );

  return FinishedGood;
};