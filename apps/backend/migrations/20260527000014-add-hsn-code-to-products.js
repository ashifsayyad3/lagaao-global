'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'hsn_code', {
      type: Sequelize.STRING(16),
      allowNull: true,
      defaultValue: '0602',
      after: 'tax_rate',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'hsn_code');
  },
};
