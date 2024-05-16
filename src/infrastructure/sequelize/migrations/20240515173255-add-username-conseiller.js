'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('conseiller', 'username', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('conseiller', 'username')
  }
}
