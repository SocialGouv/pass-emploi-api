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
      await queryInterface.addColumn(
        'suggestion',
        'id_recherche',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'recherche',
            key: 'id'
          }
        },
        { transaction }
      )
      await queryInterface.renameColumn(
        'suggestion',
        'date_suppression',
        'date_refus',
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
      await queryInterface.removeColumn('suggestion', 'id_recherche', {
        transaction
      })
      await queryInterface.renameColumn(
        'suggestion',
        'date_refus',
        'date_suppression',
        { transaction }
      )
    })
  }
}
