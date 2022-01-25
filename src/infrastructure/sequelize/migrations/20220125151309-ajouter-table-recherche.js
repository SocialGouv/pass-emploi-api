'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recherche', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      titre: {
        field: 'titre',
        type: Sequelize.STRING,
        allowNull: false
      },
      metier: {
        field: 'metier',
        type: Sequelize.STRING,
        allowNull: false
      },
      localisation: {
        field: 'localisation',
        type: Sequelize.STRING,
        allowNull: false
      },
      criteres: {
        field: 'criteres',
        type: Sequelize.JSONB,
        allowNull: true
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('recherche')
  }
}
