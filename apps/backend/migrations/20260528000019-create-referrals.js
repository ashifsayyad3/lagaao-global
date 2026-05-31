'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add referral_code to users
    await queryInterface.addColumn('users', 'referral_code', {
      type:         Sequelize.STRING(16),
      allowNull:    true,
      unique:       true,
      comment:      'Unique shareable code used to refer new users',
    });

    // Create referrals table
    await queryInterface.createTable('referrals', {
      id:            { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      referrer_id:   {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      referred_id:   {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
        comment: 'One referral row per referred user',
      },
      code:          { type: Sequelize.STRING(16), allowNull: false },
      status:        {
        type: Sequelize.ENUM('pending', 'converted', 'rewarded', 'cancelled'),
        defaultValue: 'pending',
      },
      reward_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      rewarded_at:   { type: Sequelize.DATE, allowNull: true },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('referrals', ['referrer_id'], { name: 'idx_referrals_referrer' });
    await queryInterface.addIndex('referrals', ['code'],        { name: 'idx_referrals_code'    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('referrals');
    await queryInterface.removeColumn('users', 'referral_code');
  },
};
