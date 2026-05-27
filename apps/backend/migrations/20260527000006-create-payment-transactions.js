'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Razorpay identifiers
      razorpay_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      razorpay_payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      razorpay_signature: {
        type: Sequelize.STRING(256),
        allowNull: true,
      },
      // Financial
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(8),
        allowNull: false,
        defaultValue: 'INR',
      },
      // Method & status
      method: {
        type: Sequelize.ENUM('upi', 'card', 'netbanking', 'cod', 'wallet'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('created', 'captured', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'created',
      },
      // Refund tracking
      refund_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Error details
      error_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      error_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Raw webhook/response payload
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('payment_transactions', ['order_id']);
    await queryInterface.addIndex('payment_transactions', ['user_id']);
    await queryInterface.addIndex('payment_transactions', ['razorpay_order_id']);
    await queryInterface.addIndex('payment_transactions', ['razorpay_payment_id']);
    await queryInterface.addIndex('payment_transactions', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_transactions');
  },
};
