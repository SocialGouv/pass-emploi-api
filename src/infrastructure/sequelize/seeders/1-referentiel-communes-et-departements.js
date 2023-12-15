'use strict'
const departements = require('./data/departements.json')
const communes = require('./data/communes.json')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async _transaction => {
        await queryInterface.bulkInsert('departement', departements)
        await queryInterface.bulkInsert('commune', communes)
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async _transaction => {
        await queryInterface.bulkDelete('departement', null, {})
        await queryInterface.bulkDelete('commune', null, {})
      }
    )
  }
}
