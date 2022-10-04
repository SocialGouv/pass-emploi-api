'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('referentiel_metier_rome', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
      },
      libelle: {
        field: 'libelle',
        type: Sequelize.STRING,
        allowNull: false
      },
      libelleSanitized: {
        field: 'libelle_sanitized',
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        field: 'code',
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('referentiel_metier_rome')
  }
}
