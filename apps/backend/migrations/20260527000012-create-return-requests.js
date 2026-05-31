'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('return_requests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
      },
      order_item_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'order_items', key: 'id' }, onDelete: 'SET NULL',
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      reason: {
        type: Sequelize.ENUM(
          'damaged', 'wrong_item', 'not_as_described',
          'changed_mind', 'quality_issue', 'other'
        ),
        allowNull: false,
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      images: { type: Sequelize.JSON, allowNull: true },           // array of URLs
      status: {
        type: Sequelize.ENUM(
          'pending', 'under_review', 'approved', 'rejected',
          'pickup_scheduled', 'picked_up', 'refund_initiated', 'refund_completed', 'closed'
        ),
        allowNull: false, defaultValue: 'pending',
      },
      refund_method: {
        type: Sequelize.ENUM('original', 'wallet'),
        allowNull: true,
      },
      refund_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      refund_id: { type: Sequelize.STRING(64), allowNull: true },    // Razorpay refund ID
      admin_note: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL',
      },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      pickup_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('return_requests', ['order_id']);
    await queryInterface.addIndex('return_requests', ['user_id']);
    await queryInterface.addIndex('return_requests', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('return_requests');
  },
};
