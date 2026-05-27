'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'wallet_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      after: 'discount',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'wallet_amount');
  },
};
