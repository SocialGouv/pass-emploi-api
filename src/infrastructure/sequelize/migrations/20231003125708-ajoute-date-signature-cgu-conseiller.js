'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('conseiller', 'date_signature_cgu', {
      type: Sequelize.DATE,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('conseiller', 'date_signature_cgu')
  }
}
