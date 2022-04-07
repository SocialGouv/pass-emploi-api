'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'rendez_vous',
        'commentaire',
        {
          type: Sequelize.STRING(2048),
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `update rendez_vous set commentaire = '' where commentaire IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'rendez_vous',
        'commentaire',
        {
          type: Sequelize.STRING(2048),
          allowNull: false
        },
        { transaction }
      )
    })
  }
}
