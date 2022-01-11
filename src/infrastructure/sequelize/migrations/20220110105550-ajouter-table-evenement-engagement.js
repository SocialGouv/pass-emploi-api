'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('evenement_engagement', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      dateEvenement: {
        field: 'date_evenement',
        type: Sequelize.DATE,
        allowNull: false
      },
      categorie: {
        field: 'categorie',
        type: Sequelize.STRING,
        allowNull: true
      },
      action: {
        field: 'action',
        type: Sequelize.STRING,
        allowNull: true
      },
      nom: {
        field: 'nom',
        type: Sequelize.STRING,
        allowNull: true
      },
      idUtilisateur: {
        field: 'id_utilisateur',
        type: Sequelize.STRING,
        allowNull: false
      },
      typeUtilisateur: {
        field: 'type_utilisateur',
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('evenement_engagement')
  }
}
