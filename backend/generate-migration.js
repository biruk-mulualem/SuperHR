const fs = require('fs');
const path = require('path');
const db = require('./models');

const models = db.sequelize.models;

function generateMigration() {
  // Determine a safe order to create tables by analyzing foreign keys
  const tableDeps = {};
  const tables = [];
  
  for (const modelName of Object.keys(models)) {
    const model = models[modelName];
    const tableName = model.tableName;
    tables.push(tableName);
    tableDeps[tableName] = [];
    
    for (const key of Object.keys(model.rawAttributes)) {
      const attr = model.rawAttributes[key];
      if (attr.references) {
        let refTable = attr.references.model;
        if (typeof refTable !== 'string') {
          if (refTable.tableName) refTable = refTable.tableName;
        }
        if (refTable && refTable !== tableName) {
          tableDeps[tableName].push(refTable);
        }
      }
    }
  }

  // Topological sort
  const sortedTables = [];
  const visited = {};
  const visiting = {};

  function visit(tableName) {
    if (visited[tableName]) return;
    if (visiting[tableName]) {
      console.warn(`Circular dependency detected involving table ${tableName}. You might need to manually adjust the migration.`);
      return;
    }
    visiting[tableName] = true;
    for (const dep of (tableDeps[tableName] || [])) {
      visit(dep);
    }
    visiting[tableName] = false;
    visited[tableName] = true;
    sortedTables.push(tableName);
  }

  for (const tableName of tables) {
    visit(tableName);
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir);
  } else {
    // Clean up old migration files, but preserve 'commands' file
    const files = fs.readdirSync(migrationsDir);
    for (const file of files) {
      if (file !== 'commands' && file !== 'commands.js' && file.endsWith('.js')) {
        fs.unlinkSync(path.join(migrationsDir, file));
      }
    }
  }

  let counter = 1;
  const timestampBase = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

  for (const tableName of sortedTables) {
    let targetModel = null;
    for (const modelName of Object.keys(models)) {
      if (models[modelName].tableName === tableName) {
        targetModel = models[modelName];
        break;
      }
    }

    if (!targetModel) continue;

    let upCode = `module.exports = {\n  up: async (queryInterface, Sequelize) => {\n`;
    let downCode = `  down: async (queryInterface, Sequelize) => {\n`;
    let constraintsCode = ``;

    let attrsCode = `{\n`;
    for (const key of Object.keys(targetModel.rawAttributes)) {
      const attr = targetModel.rawAttributes[key];
      
      if (attr.type && attr.type.constructor.name === 'VIRTUAL') {
        continue;
      }
      
      const fieldName = attr.field || key;
      attrsCode += `      ${fieldName}: {\n`;
      if (attr.type) {
        if (attr.type.constructor.name === 'ENUM') {
          const enumValues = attr.type.values.map(v => `'${v}'`).join(', ');
          attrsCode += `        type: Sequelize.ENUM(${enumValues}),\n`;
        } else {
          attrsCode += `        type: Sequelize.${attr.type.key || attr.type.constructor.name},\n`;
        }
      }
      if (attr.primaryKey) attrsCode += `        primaryKey: true,\n`;
      if (attr.autoIncrement) attrsCode += `        autoIncrement: true,\n`;
      if (attr.allowNull === false) attrsCode += `        allowNull: false,\n`;
      if (attr.unique) attrsCode += `        unique: true,\n`;
      if (attr.defaultValue !== undefined) {
        if (typeof attr.defaultValue === 'object') {
             // Handle Sequelize.NOW etc if possible, but safely fallback
        } else if (typeof attr.defaultValue === 'string') {
          attrsCode += `        defaultValue: "${attr.defaultValue}",\n`;
        } else {
          attrsCode += `        defaultValue: ${attr.defaultValue},\n`;
        }
      }
      
      if (attr.references) {
        let refTable = attr.references.model;
        if (typeof refTable !== 'string' && refTable.tableName) {
          refTable = refTable.tableName;
        }
        
        let constraintOpts = `{\n      type: 'foreign key',\n      name: '${tableName}_${fieldName}_fkey',\n      references: {\n        table: '${refTable}',\n        field: '${attr.references.key}'\n      },\n`;
        if (attr.onUpdate) constraintOpts += `      onUpdate: '${attr.onUpdate}',\n`;
        if (attr.onDelete) constraintOpts += `      onDelete: '${attr.onDelete}',\n`;
        constraintOpts += `    }`;
        
        constraintsCode += `    await queryInterface.addConstraint('${tableName}', {\n      fields: ['${fieldName}'],\n      ...${constraintOpts}\n    });\n`;
      }
      attrsCode += `      },\n`;
    }
    attrsCode += `    }`;

    upCode += `    await queryInterface.createTable('${tableName}', ${attrsCode});\n`;
    upCode += constraintsCode;
    upCode += `  },\n`;
    downCode += `    await queryInterface.dropTable('${tableName}');\n`;
    downCode += `  }\n};\n`;

    const paddedCounter = String(counter).padStart(3, '0');
    const filePath = path.join(migrationsDir, `${timestampBase}${paddedCounter}-create-${tableName}.js`);
    
    fs.writeFileSync(filePath, upCode + downCode);
    console.log(`Generated migration: ${filePath}`);
    
    counter++;
  }
  process.exit(0);
}

generateMigration();