'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'mfa_backup_codes', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Hashed TOTP backup codes (one-time use)',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'mfa_backup_codes');
  },
};
