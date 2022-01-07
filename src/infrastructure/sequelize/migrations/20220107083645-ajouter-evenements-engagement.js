'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'conseiller',
        'date_evenement_engagement',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'jeune',
        'date_evenement_engagement',
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
        'conseiller',
        'date_evenement_engagement',
        { transaction }
      )
      await queryInterface.removeColumn('jeune', 'date_evenement_engagement', {
        transaction
      })
    })
  }
}
