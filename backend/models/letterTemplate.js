"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LetterTemplate extends Model {
    static associate(models) {
      // define association here if needed
    }
  }

  LetterTemplate.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fields: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          includeHeader: true,
          includeFooter: true,
          includeBackground: false,
        },
      },
    },
    {
      sequelize,
      modelName: "LetterTemplate",
      tableName: "letter_templates",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return LetterTemplate;
};
