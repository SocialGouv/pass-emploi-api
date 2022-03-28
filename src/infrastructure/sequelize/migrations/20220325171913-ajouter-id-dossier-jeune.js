'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'jeune',
        'id_dossier',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('jeune', 'id_dossier', {
        transaction
      })
    })
  }
}
