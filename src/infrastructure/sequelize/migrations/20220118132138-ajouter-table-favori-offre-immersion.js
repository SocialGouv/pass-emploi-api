'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('favori_offre_immersion', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      idJeune: {
        field: 'id_jeune',
        type: Sequelize.STRING,
        references: {
          model: 'jeune',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      idOffre: {
        field: 'id_offre',
        type: Sequelize.STRING,
        allowNull: false
      },
      metier: {
        field: 'metier',
        type: Sequelize.STRING,
        allowNull: false
      },
      nomEtablissement: {
        field: 'nom_etablissement',
        type: Sequelize.STRING,
        allowNull: false
      },
      secteurActivite: {
        field: 'secteur_activite',
        type: Sequelize.STRING,
        allowNull: false
      },
      ville: {
        field: 'ville',
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('favori_offre_immersion')
  }
}
