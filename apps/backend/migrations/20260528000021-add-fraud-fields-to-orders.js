'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'fraud_score', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('orders', 'fraud_flags', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'risk_level', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low',
    });
    await queryInterface.addIndex('orders', ['risk_level']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orders', ['risk_level']);
    await queryInterface.removeColumn('orders', 'fraud_score');
    await queryInterface.removeColumn('orders', 'fraud_flags');
    await queryInterface.removeColumn('orders', 'risk_level');
  },
};
