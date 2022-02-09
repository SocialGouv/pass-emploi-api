'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'recherche',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        },
        { transaction }
      )
      await queryInterface.addColumn(
          'recherche',
          'date_derniere_recherche',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now')
          },
          { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('recherche', 'date_creation', {
        transaction
      })
      await queryInterface.removeColumn('recherche', 'date_derniere_recherche', {
        transaction
      })
    })
  }
}
