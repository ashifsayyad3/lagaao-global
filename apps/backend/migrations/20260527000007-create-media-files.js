'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('media_files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // File info
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      file_name:     { type: Sequelize.STRING(255), allowNull: false },
      mime_type:     { type: Sequelize.STRING(100), allowNull: false },
      size:          { type: Sequelize.INTEGER,     allowNull: false },
      // Storage
      storage:       { type: Sequelize.ENUM('local', 's3'), allowNull: false, defaultValue: 'local' },
      url:           { type: Sequelize.STRING(1000), allowNull: false },
      path:          { type: Sequelize.STRING(1000), allowNull: true },   // disk path for local
      bucket:        { type: Sequelize.STRING(255),  allowNull: true },   // S3 bucket
      key:           { type: Sequelize.STRING(1000), allowNull: true },   // S3 key
      // Associations (optional)
      entity_type: { type: Sequelize.STRING(64),  allowNull: true },  // product, banner, blog, etc.
      entity_id:   { type: Sequelize.INTEGER,      allowNull: true },
      // Image metadata
      width:       { type: Sequelize.INTEGER, allowNull: true },
      height:      { type: Sequelize.INTEGER, allowNull: true },
      alt_text:    { type: Sequelize.STRING(255), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('media_files', ['user_id']);
    await queryInterface.addIndex('media_files', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('media_files', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('media_files');
  },
};
