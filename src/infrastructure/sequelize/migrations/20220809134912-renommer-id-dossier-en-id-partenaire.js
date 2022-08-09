'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('jeune', 'id_dossier', 'id_partenaire')
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('jeune', 'id_partenaire', 'id_dossier')
  }
}
