'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add loyalty_balance to users
    await queryInterface.addColumn('users', 'loyalty_balance', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Create loyalty_points table
    await queryInterface.createTable('loyalty_points', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      points: { type: Sequelize.INTEGER, allowNull: false },
      type: {
        type: Sequelize.ENUM('earn', 'redeem', 'expire', 'admin'),
        allowNull: false,
      },
      description: { type: Sequelize.STRING(255), allowNull: false },
      reference_type: { type: Sequelize.STRING(50), allowNull: true },
      reference_id:   { type: Sequelize.INTEGER,   allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('loyalty_points', ['user_id']);
    await queryInterface.addIndex('loyalty_points', ['type']);
    await queryInterface.addIndex('loyalty_points', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('loyalty_points');
    await queryInterface.removeColumn('users', 'loyalty_balance');
  },
};
