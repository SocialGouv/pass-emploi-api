'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'action',
        'qualification_code',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'action',
        'qualification_heures',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('action', 'qualification_heures', {
        transaction
      })
      await queryInterface.removeColumn('action', 'qualification_code', {
        transaction
      })
    })
  }
}
