'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up ({ context: queryInterface }) {
    const passwordHash = await bcrypt.hash('111111', 3);

    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('users', [{
      name: 'admin',
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    }], {});
  },

  async down ({ context: queryInterface }) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users', null, {});
  }
};
