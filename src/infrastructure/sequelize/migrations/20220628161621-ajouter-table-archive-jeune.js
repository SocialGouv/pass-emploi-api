'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('archive_jeune', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      prenom: {
        field: 'prenom',
        type: Sequelize.STRING,
        allowNull: false
      },
      nom: {
        field: 'nom',
        type: Sequelize.STRING,
        allowNull: false
      },
      idJeune: {
        field: 'id_jeune',
        type: Sequelize.STRING,
        allowNull: false
      },
      motif: {
        field: 'motif',
        type: Sequelize.STRING,
        allowNull: false
      },
      commentaire: {
        field: 'commentaire',
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        field: 'email',
        type: Sequelize.STRING,
        allowNull: true
      },
      dateArchivage: {
        field: 'date_archivage',
        type: Sequelize.DATE,
        allowNull: false
      },
      donnees: {
        field: 'donnees',
        type: Sequelize.JSONB,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('archive_jeune')
  }
}
