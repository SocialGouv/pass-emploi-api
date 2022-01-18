'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable(
      'favoris_offres_emploi',
      'favori_offre_emploi'
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable(
      'favori_offre_emploi',
      'favoris_offres_emploi'
    )
  }
}
