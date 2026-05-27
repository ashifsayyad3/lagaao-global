'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'shiprocket_order_id', {
      type: Sequelize.STRING(64), allowNull: true, after: 'estimated_delivery',
    });
    await queryInterface.addColumn('orders', 'shiprocket_shipment_id', {
      type: Sequelize.STRING(64), allowNull: true, after: 'shiprocket_order_id',
    });
    await queryInterface.addColumn('orders', 'awb_code', {
      type: Sequelize.STRING(64), allowNull: true, after: 'shiprocket_shipment_id',
    });
    await queryInterface.addColumn('orders', 'courier_name', {
      type: Sequelize.STRING(128), allowNull: true, after: 'awb_code',
    });
    await queryInterface.addColumn('orders', 'tracking_url', {
      type: Sequelize.STRING(512), allowNull: true, after: 'courier_name',
    });
    await queryInterface.addIndex('orders', ['awb_code']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'shiprocket_order_id');
    await queryInterface.removeColumn('orders', 'shiprocket_shipment_id');
    await queryInterface.removeColumn('orders', 'awb_code');
    await queryInterface.removeColumn('orders', 'courier_name');
    await queryInterface.removeColumn('orders', 'tracking_url');
  },
};
