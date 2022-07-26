'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'action',
        'rappel',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        { transaction }
      )
      await queryInterface.renameColumn(
        'action',
        'date_limite',
        'date_echeance',
        { transaction }
      )

      await queryInterface.sequelize.query(
        `UPDATE action SET date_echeance = date_derniere_actualisation WHERE statut IN ('canceled', 'done')`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `UPDATE action SET date_echeance = date_creation + interval '3 month' WHERE statut NOT IN ('canceled', 'done')`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'action',
        'date_echeance',
        {
          type: Sequelize.DATE,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'action',
        'date_echeance',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.sequelize.query(
        `UPDATE action SET date_echeance = NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.renameColumn(
        'action',
        'date_echeance',
        'date_limite',
        { transaction }
      )
      await queryInterface.removeColumn('action', 'rappel', {
        transaction
      })
    })
  }
}
