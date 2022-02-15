'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'recherche',
        'etat_derniere_recherche',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'SUCCES'
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn(
        'recherche',
        'etat_derniere_recherche',
        {
          transaction
        }
      )
    })
  }
}
