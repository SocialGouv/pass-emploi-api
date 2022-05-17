'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'campagne',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          date_debut: {
            type: Sequelize.DATE,
            allowNull: false
          },
          date_fin: {
            type: Sequelize.DATE,
            allowNull: false
          },
          nom: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          }
        },
        {
          transaction
        }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('campagne')
  }
}
