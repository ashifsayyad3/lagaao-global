'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id:    { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:       { type: Sequelize.STRING(50), allowNull: false },
      title:      { type: Sequelize.STRING(255), allowNull: false },
      body:       { type: Sequelize.TEXT, allowNull: false },
      channel:    { type: Sequelize.ENUM('in_app', 'push', 'sms', 'email'), defaultValue: 'in_app', allowNull: false },
      status:     { type: Sequelize.ENUM('pending', 'sent', 'failed', 'read'), defaultValue: 'pending', allowNull: false },
      is_read:    { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      data:       { type: Sequelize.TEXT, allowNull: true },
      read_at:    { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notifications', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
