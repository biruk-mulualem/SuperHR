const fs = require('fs');
const path = require('path');

// Helper function to recursively find all model files
function findModelFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      findModelFiles(filePath, fileList);
    } else if (file.endsWith('.js') && file !== 'index.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Helper function to get model name from file path
function getModelName(filePath) {
  const fileName = path.basename(filePath, '.js');
  // Convert to PascalCase (e.g., 'user' -> 'User', 'employee' -> 'Employee')
  return fileName.charAt(0).toUpperCase() + fileName.slice(1);
}

// Helper function to get table name
function getTableName(modelName) {
  // Convert to plural lowercase (e.g., 'User' -> 'users')
  return modelName.toLowerCase() + 's';
}

console.log('🔍 Scanning models (including subfolders)...');

const modelsDir = path.join(__dirname, 'models');
const migrationDir = path.join(__dirname, 'migrations');

// Create migrations directory if it doesn't exist
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
  console.log('✅ Created migrations directory');
}

// Find all model files recursively
const modelFiles = findModelFiles(modelsDir);
console.log(`📦 Found ${modelFiles.length} model(s)`);

// Display found models
modelFiles.forEach(file => {
  const relativePath = path.relative(modelsDir, file);
  console.log(`  - ${relativePath}`);
});

console.log('\n🔄 Generating migrations...\n');

modelFiles.forEach((filePath, index) => {
  try {
    const modelName = getModelName(filePath);
    const tableName = getTableName(modelName);
    const timestamp = Date.now() + index;
    const fileName = `${timestamp}-create-${tableName}.js`;
    
    // Read model content to extract fields
    const modelContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract field definitions
    const fieldRegex = /(\w+):\s*{\s*type:\s*(?:Sequelize\.|DataTypes\.)?(\w+)/g;
    const fields = [];
    let match;
    
    while ((match = fieldRegex.exec(modelContent)) !== null) {
      const fieldName = match[1];
      const fieldType = match[2];
      // Skip common fields that are automatically handled
      if (!['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(fieldName)) {
        // Skip associations
        const isAssociation = /belongsTo|hasMany|hasOne|belongsToMany/.test(
          modelContent.substring(Math.max(0, match.index - 50), Math.min(modelContent.length, match.index + 50))
        );
        if (!isAssociation) {
          fields.push({ name: fieldName, type: fieldType });
        }
      }
    }
    
    // Generate migration content
    const migrationContent = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('${tableName}', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
${fields.map(field => `      ${field.name}: {
        type: Sequelize.${field.type},
        allowNull: true
      },`).join('\n')}
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('${tableName}');
  }
};`;
    
    const migrationPath = path.join(migrationDir, fileName);
    fs.writeFileSync(migrationPath, migrationContent);
    
    console.log(`✅ Generated: ${fileName} (${modelName} → ${tableName}) - ${fields.length} fields`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ Migration generation complete!');
console.log(`📁 Location: ${migrationDir}`);
console.log('\n🚀 Next steps:');
console.log('  1. Review the generated migration files');
console.log('  2. Edit field definitions if needed');
console.log('  3. Run: npx sequelize-cli db:migrate');