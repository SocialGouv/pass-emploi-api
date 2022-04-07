'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'createur',
        {
          type: Sequelize.JSONB,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('action', 'createur')
  }
}
