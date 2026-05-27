'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('affiliates', {
      id:              { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id:         { type: Sequelize.INTEGER, allowNull: false, unique: true,
                         references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      code:            { type: Sequelize.STRING(32), allowNull: false, unique: true },
      commission_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 5.00 },
      status:          { type: Sequelize.ENUM('pending', 'active', 'suspended'), defaultValue: 'pending' },
      total_clicks:    { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      total_earnings:  { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      paid_out:        { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      notes:           { type: Sequelize.TEXT, allowNull: true },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at:      { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('affiliate_clicks', {
      id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      affiliate_id: { type: Sequelize.INTEGER, allowNull: false,
                      references: { model: 'affiliates', key: 'id' }, onDelete: 'CASCADE' },
      ip:           { type: Sequelize.STRING(45), allowNull: true },
      referrer_url: { type: Sequelize.STRING(512), allowNull: true },
      user_agent:   { type: Sequelize.STRING(512), allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('affiliate_conversions', {
      id:                { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      affiliate_id:      { type: Sequelize.INTEGER, allowNull: false,
                           references: { model: 'affiliates', key: 'id' }, onDelete: 'CASCADE' },
      order_id:          { type: Sequelize.INTEGER, allowNull: false, unique: true,
                           references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      order_total:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      commission_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status:            { type: Sequelize.ENUM('pending', 'approved', 'paid', 'cancelled'), defaultValue: 'pending' },
      created_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at:        { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('affiliate_clicks',      ['affiliate_id']);
    await queryInterface.addIndex('affiliate_conversions', ['affiliate_id']);
    await queryInterface.addIndex('affiliate_conversions', ['status']);
    await queryInterface.addIndex('affiliates',            ['code']);
    await queryInterface.addIndex('affiliates',            ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('affiliate_conversions');
    await queryInterface.dropTable('affiliate_clicks');
    await queryInterface.dropTable('affiliates');
  },
};
