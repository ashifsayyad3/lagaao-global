'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flash_sales', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:         { type: Sequelize.STRING(255), allowNull: false },
      description:  { type: Sequelize.TEXT, allowNull: true },
      banner_image: { type: Sequelize.STRING(500), allowNull: true },
      start_at:     { type: Sequelize.DATE, allowNull: false },
      end_at:       { type: Sequelize.DATE, allowNull: false },
      is_active:    { type: Sequelize.BOOLEAN, defaultValue: true },
      max_per_user: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, comment: 'Max items per user (null = unlimited)' },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
      deleted_at:   { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('flash_sale_items', {
      id:              { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      flash_sale_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                         references: { model: 'flash_sales', key: 'id' }, onDelete: 'CASCADE' },
      product_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                         references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      variant_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
                         references: { model: 'product_variants', key: 'id' }, onDelete: 'SET NULL' },
      sale_price:      { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      original_price:  { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      stock_limit:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, comment: 'Max units available in flash sale' },
      sold:            { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      created_at:      { type: Sequelize.DATE, allowNull: false },
      updated_at:      { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('flash_sale_items', ['flash_sale_id', 'product_id', 'variant_id'], {
      unique: true, name: 'uq_flash_sale_product_variant',
    });
    await queryInterface.addIndex('flash_sales', ['start_at', 'end_at', 'is_active'], {
      name: 'idx_flash_sales_active',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('flash_sale_items');
    await queryInterface.dropTable('flash_sales');
  },
};
