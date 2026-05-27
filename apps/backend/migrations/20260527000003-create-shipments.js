'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipments', {
      id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      order_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      courier:            { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'pending' },
      tracking_number:    { type: Sequelize.STRING(200), allowNull: true },
      awb_number:         { type: Sequelize.STRING(200), allowNull: true },
      status:             {
        type: Sequelize.ENUM(
          'pending', 'label_created', 'picked_up', 'in_transit',
          'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled',
        ),
        defaultValue: 'pending', allowNull: false,
      },
      estimated_delivery: { type: Sequelize.DATE, allowNull: true },
      delivered_at:       { type: Sequelize.DATE, allowNull: true },
      failed_attempts:    { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      events_json:        { type: Sequelize.TEXT('medium'), allowNull: true },
      notes:              { type: Sequelize.TEXT, allowNull: true },
      created_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at:         { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('shipments', ['order_id'], { unique: true });
    await queryInterface.addIndex('shipments', ['status']);
    await queryInterface.addIndex('shipments', ['courier']);
    await queryInterface.addIndex('shipments', ['tracking_number']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shipments');
  },
};
