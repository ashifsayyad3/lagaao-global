'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('support_tickets', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      ticket_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'orders', key: 'id' }, onDelete: 'SET NULL',
      },
      subject: { type: Sequelize.STRING(255), allowNull: false },
      category: {
        type: Sequelize.ENUM('order', 'payment', 'delivery', 'product', 'return', 'account', 'other'),
        allowNull: false, defaultValue: 'other',
      },
      status: {
        type: Sequelize.ENUM('open', 'pending_customer', 'pending_admin', 'resolved', 'closed'),
        allowNull: false, defaultValue: 'open',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false, defaultValue: 'medium',
      },
      assigned_to: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL',
      },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('support_tickets', ['user_id']);
    await queryInterface.addIndex('support_tickets', ['status']);
    await queryInterface.addIndex('support_tickets', ['priority']);
    await queryInterface.addIndex('support_tickets', ['ticket_number'], { unique: true });

    await queryInterface.createTable('support_messages', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      ticket_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'support_tickets', key: 'id' }, onDelete: 'CASCADE',
      },
      sender_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      sender_role: {
        type: Sequelize.ENUM('customer', 'admin'),
        allowNull: false,
      },
      body: { type: Sequelize.TEXT, allowNull: false },
      attachments: { type: Sequelize.JSON, allowNull: true },
      is_internal: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('support_messages', ['ticket_id']);
    await queryInterface.addIndex('support_messages', ['sender_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('support_messages');
    await queryInterface.dropTable('support_tickets');
  },
};
