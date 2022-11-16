'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous_jeune_association',
        'present',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn(
        'rendez_vous_jeune_association',
        'present',
        {
          transaction
        }
      )
    })
  }
}
