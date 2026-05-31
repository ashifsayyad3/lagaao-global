'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      balance: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_credited: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_debited:  { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      is_frozen: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('wallets', ['user_id'], { unique: true });

    await queryInterface.createTable('wallet_transactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      wallet_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'wallets', key: 'id' }, onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('credit', 'debit', 'refund', 'cashback', 'admin_credit', 'admin_debit'),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      balance_after: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      reference_type: { type: Sequelize.STRING(50), allowNull: true },  // 'order', 'refund', 'admin', etc.
      reference_id: { type: Sequelize.INTEGER, allowNull: true },
      meta: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('wallet_transactions', ['wallet_id']);
    await queryInterface.addIndex('wallet_transactions', ['user_id']);
    await queryInterface.addIndex('wallet_transactions', ['reference_type', 'reference_id']);
    await queryInterface.addIndex('wallet_transactions', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('wallet_transactions');
    await queryInterface.dropTable('wallets');
  },
};
