'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'action',
        'date_fin_reelle',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.sequelize.query(
        `UPDATE action SET date_fin_reelle = date_echeance WHERE statut = 'done'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('action', 'date_fin_reelle', {
        transaction
      })
    })
  }
}
