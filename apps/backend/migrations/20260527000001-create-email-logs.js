'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_logs', {
      id:            { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id:       { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      type:          { type: Sequelize.STRING(50), allowNull: false },
      to_email:      { type: Sequelize.STRING(255), allowNull: false },
      subject:       { type: Sequelize.STRING(500), allowNull: false },
      status:        { type: Sequelize.ENUM('queued', 'sent', 'failed'), defaultValue: 'queued', allowNull: false },
      message_id:    { type: Sequelize.STRING(255), allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      retry_count:   { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      sent_at:       { type: Sequelize.DATE, allowNull: true },
      metadata:      { type: Sequelize.TEXT, allowNull: true },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('email_logs', ['status']);
    await queryInterface.addIndex('email_logs', ['type']);
    await queryInterface.addIndex('email_logs', ['to_email']);
    await queryInterface.addIndex('email_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('email_logs');
  },
};
