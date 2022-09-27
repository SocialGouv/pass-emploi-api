'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'suggestion',
        'date_creation_recherche',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn(
        'suggestion',
        'date_creation_recherche',
        {
          transaction
        }
      )
    })
  }
}
