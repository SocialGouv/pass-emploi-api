'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'referentiel_metier_rome',
      'appellation_code',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'referentiel_metier_rome',
      'appellation_code'
    )
  }
}
