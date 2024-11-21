'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('favori_offre_emploi', 'origine_nom', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('favori_offre_emploi', 'origine_logo_url', {
      type: Sequelize.STRING(1000),
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('favori_offre_emploi', 'origine_logo_url')
    await queryInterface.removeColumn('favori_offre_emploi', 'origine_nom')
  }
}
