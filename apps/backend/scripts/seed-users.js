#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt    = require('bcryptjs');
const mysql     = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const hash = await bcrypt.hash('Lagaao@123', 12);
  console.log('Password hash generated.');

  // Remove old unverified / stale test entries
  await conn.execute(
    `DELETE FROM users WHERE email IN (?,?,?,?,?)`,
    ['ashif.sayyad33@gmail.com','testuser@lagaao.com','customer@lagaao.com','vendor@lagaao.com','admin@lagaao.com']
  );
  console.log('Cleaned old test users.');

  // Insert fresh verified test users
  await conn.execute(
    `INSERT INTO users (name, email, phone, password_hash, role, is_verified, is_active, mfa_enabled, created_at, updated_at)
     VALUES
       (?,?,?,?,'customer',   1,1,0,NOW(),NOW()),
       (?,?,?,?,'vendor',     1,1,0,NOW(),NOW()),
       (?,?,?,?,'super_admin',1,1,0,NOW(),NOW())`,
    [
      'Priya Patel',  'customer@lagaao.com', '9876500001', hash,
      'Rahul Sharma', 'vendor@lagaao.com',   '9876500002', hash,
      'Super Admin',  'admin@lagaao.com',    '9876500003', hash,
    ]
  );
  console.log('Inserted 3 users.');

  // Create vendor profile
  const [[vendorRow]] = await conn.execute(`SELECT id FROM users WHERE email = ? LIMIT 1`, ['vendor@lagaao.com']);
  if (vendorRow) {
    await conn.execute(
      `INSERT IGNORE INTO vendor_profiles (user_id, store_name, store_slug, description, status, is_verified, created_at, updated_at)
       VALUES (?, 'Rahul Plants', 'rahul-plants', 'Premium quality plants from Rahul nursery', 'active', 1, NOW(), NOW())`,
      [vendorRow.id]
    );
    console.log(`Vendor profile created for user id=${vendorRow.id}`);
  }

  const [rows] = await conn.execute(`SELECT id, email, role, is_verified FROM users WHERE email IN (?,?,?)`,
    ['customer@lagaao.com','vendor@lagaao.com','admin@lagaao.com']);
  console.log('\n✅ Users ready:');
  rows.forEach(r => console.log(`  [${r.role}] ${r.email}  (id=${r.id}, verified=${r.is_verified})`));
  console.log('\n  Password for all accounts: Lagaao@123\n');

  await conn.end();
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
