'use strict'
const metiersRome = require('./data/metiers-rome.json')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async _transaction => {
        await queryInterface.bulkInsert('referentiel_metier_rome', metiersRome)
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async _transaction => {
        await queryInterface.bulkDelete('referentiel_metier_rome', null, {})
      }
    )
  }
}
