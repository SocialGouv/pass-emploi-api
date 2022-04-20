'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('agence', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nomAgence: {
        field: 'nom_agence',
        type: Sequelize.STRING,
        allowNull: false
      },
      codePostal: {
        field: 'code_postal',
        type: Sequelize.STRING,
        allowNull: false
      },
      nomRegion: {
        field: 'nom_region',
        type: Sequelize.STRING,
        allowNull: false
      },
      codeDepartement: {
        field: 'code_departement',
        type: Sequelize.STRING,
        allowNull: false
      },
      structure: {
        field: 'structure',
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('agence')
  }
}
