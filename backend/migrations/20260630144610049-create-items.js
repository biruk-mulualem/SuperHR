module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      standard_name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      brand: {
        type: Sequelize.STRING,
      },
      model: {
        type: Sequelize.STRING,
      },
      barcode: {
        type: Sequelize.STRING,
        unique: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
      },
      uom_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      conversion_uom_id: {
        type: Sequelize.INTEGER,
      },
      conversion_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      cost_price: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Discontinued'),
        allowNull: false,
        defaultValue: "Active",
      },
      spec_type: {
        type: Sequelize.ENUM('text', 'pdf'),
        allowNull: false,
        defaultValue: "text",
      },
      spec_text: {
        type: Sequelize.TEXT,
      },
      spec_pdf_name: {
        type: Sequelize.STRING,
      },
      spec_pdf_size: {
        type: Sequelize.STRING,
      },
      spec_pdf_url: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('items', {
      fields: ['category_id'],
      ...{
      type: 'foreign key',
      name: 'items_category_id_fkey',
      references: {
        table: 'categories',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
    await queryInterface.addConstraint('items', {
      fields: ['uom_id'],
      ...{
      type: 'foreign key',
      name: 'items_uom_id_fkey',
      references: {
        table: 'uom',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    }
    });
    await queryInterface.addConstraint('items', {
      fields: ['conversion_uom_id'],
      ...{
      type: 'foreign key',
      name: 'items_conversion_uom_id_fkey',
      references: {
        table: 'uom',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('items');
  }
};
