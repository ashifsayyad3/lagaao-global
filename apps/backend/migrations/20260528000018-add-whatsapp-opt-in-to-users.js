'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'whatsapp_opt_in', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'whatsapp_opt_in');
  },
};
