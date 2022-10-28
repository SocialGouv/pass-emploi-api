'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'date_cloture',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'id_agence',
        {
          type: Sequelize.STRING,
          references: {
            model: 'agence',
            key: 'id'
          },
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('rendez_vous', 'date_cloture', {
        transaction
      })
      await queryInterface.removeColumn('rendez_vous', 'id_agence', {
        transaction
      })
    })
  }
}
