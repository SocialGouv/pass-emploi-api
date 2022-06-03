'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'fichier',
        'id_createur',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'fichier',
        'type_createur',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('fichier', 'id_createur', {
        transaction
      })
      await queryInterface.removeColumn('fichier', 'type_createur', {
        transaction
      })
    })
  }
}
