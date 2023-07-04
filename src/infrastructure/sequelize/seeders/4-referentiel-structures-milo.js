'use strict'
const structuresMilo = require('./data/referentiel_structures_milo.json')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async _transaction => {
        await queryInterface.bulkInsert('structure_milo', structuresMilo)
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async _transaction => {
        await queryInterface.bulkDelete('structure_milo', null, {})
      }
    )
  }
}
