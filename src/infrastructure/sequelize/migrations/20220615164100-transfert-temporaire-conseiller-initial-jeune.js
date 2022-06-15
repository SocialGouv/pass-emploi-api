'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'jeune',
        'id_conseiller_initial',
        {
          type: Sequelize.STRING,
          references: {
            model: 'conseiller',
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
      await queryInterface.removeColumn('jeune', 'id_conseiller_initial', {
        transaction
      })
    })
  }
}
