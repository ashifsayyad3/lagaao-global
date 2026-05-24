'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('Lagaao@123', 12);

    // Clean stale / unverified registrations
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email IN ('ashif.sayyad33@gmail.com','testuser@lagaao.com','customer@lagaao.com','vendor@lagaao.com','admin@lagaao.com')`
    );

    // Insert test users with pre-hashed passwords
    await queryInterface.sequelize.query(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, is_active, mfa_enabled, created_at, updated_at)
      VALUES
        ('Priya Patel',  'customer@lagaao.com', '9876500001', '${hash}', 'customer',    1, 1, 0, NOW(), NOW()),
        ('Rahul Sharma', 'vendor@lagaao.com',   '9876500002', '${hash}', 'vendor',      1, 1, 0, NOW(), NOW()),
        ('Super Admin',  'admin@lagaao.com',    '9876500003', '${hash}', 'super_admin', 1, 1, 0, NOW(), NOW())
    `);

    // Create vendor profile for the vendor user
    const [[vendorUser]] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'vendor@lagaao.com' LIMIT 1`
    );
    if (vendorUser) {
      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO vendor_profiles
          (user_id, store_name, store_slug, description, is_verified, is_active, created_at, updated_at)
        VALUES
          (${vendorUser.id}, 'Rahul Plants', 'rahul-plants', 'Premium quality plants from Rahul nursery', 1, 1, NOW(), NOW())
      `);
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email IN ('customer@lagaao.com','vendor@lagaao.com','admin@lagaao.com')`
    );
  },
};
