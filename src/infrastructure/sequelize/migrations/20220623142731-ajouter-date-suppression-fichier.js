'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'fichier',
        'date_suppression',
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
      await queryInterface.removeColumn('fichier', 'date_suppression', {
        transaction
      })
    })
  }
}
