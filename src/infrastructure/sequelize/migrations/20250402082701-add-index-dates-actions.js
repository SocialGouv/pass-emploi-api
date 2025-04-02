'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex(
        'action',
        ['date_fin_reelle', 'date_debut', 'date_echeance'],
        {
          name: 'actions_dates_index',
          transaction
        }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex('action', 'actions_dates_index', {
        transaction
      })
    })
  }
}
