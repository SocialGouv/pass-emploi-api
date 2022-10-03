'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'suggestion',
      'date_mise_a_jour',
      'date_rafraichissement'
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'suggestion',
      'date_rafraichissement',
      'date_mise_a_jour'
    )
  }
}
