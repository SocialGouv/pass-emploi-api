'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('action', 'commentaire', 'description')
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('action', 'description', 'commentaire')
  }
}
