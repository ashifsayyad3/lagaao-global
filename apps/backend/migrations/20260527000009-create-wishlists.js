'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wishlists', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'My Wishlist' },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('wishlists', ['user_id']);

    await queryInterface.createTable('wishlist_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      wishlist_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'wishlists', key: 'id' }, onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('wishlist_items', ['wishlist_id']);
    await queryInterface.addIndex('wishlist_items', ['product_id']);
    await queryInterface.addConstraint('wishlist_items', {
      fields: ['wishlist_id', 'product_id'],
      type: 'unique',
      name: 'uq_wishlist_product',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('wishlist_items');
    await queryInterface.dropTable('wishlists');
  },
};
