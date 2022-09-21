'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suggestion', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      idFonctionnel: {
        field: 'id_fonctionnel',
        type: Sequelize.STRING,
        allowNull: false
      },
      source: {
        field: 'source',
        type: Sequelize.STRING,
        allowNull: false
      },
      idJeune: {
        field: 'id_jeune',
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'jeune',
          key: 'id'
        }
      },
      type: {
        field: 'type',
        type: Sequelize.STRING,
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
      dateCreation: {
        field: 'date_creation',
        type: Sequelize.DATE,
        allowNull: false
      },
      dateMiseAJour: {
        field: 'date_mise_a_jour',
        type: Sequelize.DATE,
        allowNull: false
      },
      dateSuppression: {
        field: 'date_suppression',
        type: Sequelize.DATE,
        allowNull: true
      },
      criteres: {
        field: 'criteres',
        type: Sequelize.JSONB,
        allowNull: true
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('suggestion')
  }
}
