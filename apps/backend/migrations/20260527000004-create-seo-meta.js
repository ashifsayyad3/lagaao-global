'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('seo_meta', {
      id:               { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      entity_type:      { type: Sequelize.STRING(30), allowNull: false },
      entity_id:        { type: Sequelize.INTEGER, allowNull: true },
      path:             { type: Sequelize.STRING(500), allowNull: true },
      meta_title:       { type: Sequelize.STRING(70), allowNull: true },
      meta_description: { type: Sequelize.STRING(160), allowNull: true },
      keywords:         { type: Sequelize.TEXT, allowNull: true },
      canonical_url:    { type: Sequelize.STRING(500), allowNull: true },
      og_image:         { type: Sequelize.STRING(500), allowNull: true },
      no_index:         { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      schema_markup:    { type: Sequelize.TEXT, allowNull: true },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('seo_meta', ['entity_type']);
    await queryInterface.addIndex('seo_meta', ['entity_id']);
    await queryInterface.addIndex('seo_meta', ['path']);
    await queryInterface.addIndex('seo_meta', ['entity_type', 'entity_id'], { unique: true, name: 'seo_meta_entity_unique' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('seo_meta');
  },
};
