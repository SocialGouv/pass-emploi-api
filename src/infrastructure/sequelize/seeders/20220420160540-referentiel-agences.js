'use strict'
const agencesMilo = require('./data/agences_milo.json')
const agencesPE = require('./data/agences_pe.json')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.bulkInsert('agence', agencesMilo)
        await queryInterface.bulkInsert('agence', agencesPE)
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.bulkDelete('agence', null, {})
      }
    )
  }
}
