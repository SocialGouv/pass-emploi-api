'use strict'
const agencesMilo = require('./data/agences_milo.json')
const agencesPE = require('./data/agences_pe.json')
const agenceMiloCEJ = {
  id: 9999,
  nom_agence: 'Agence Du CEJ MILO',
  nom_region: 'Pays de la Loire',
  structure: 'MILO',
  code_departement: 44,
  timezone: 'Europe/Paris'
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.bulkInsert('agence', agencesMilo, {
          transaction
        })
        await queryInterface.bulkInsert('agence', agencesPE, {
          transaction
        })
        await queryInterface.bulkInsert('agence', [agenceMiloCEJ], {
          transaction
        })
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.bulkDelete('agence', null, {
          transaction,
          cascade: true
        })
      }
    )
  }
}
