'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('redirect_rules', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      from_path:   { type: Sequelize.STRING(1000), allowNull: false },
      to_path:     { type: Sequelize.STRING(1000), allowNull: false },
      status_code: { type: Sequelize.INTEGER, defaultValue: 301, allowNull: false },
      is_active:   { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      hit_count:   { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    // Use prefix index — MySQL utf8mb4 limits full-column unique index on VARCHAR(1000)
    await queryInterface.sequelize.query(
      'ALTER TABLE `redirect_rules` ADD UNIQUE KEY `redirect_rules_from_path` (`from_path`(768));'
    );
    await queryInterface.addIndex('redirect_rules', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('redirect_rules');
  },
};
