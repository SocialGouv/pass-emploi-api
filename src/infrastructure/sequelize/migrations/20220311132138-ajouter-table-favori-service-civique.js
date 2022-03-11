'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('favori_offre_engagement', {
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
      domaine: {
        field: 'domaine',
        type: Sequelize.STRING,
        allowNull: false
      },
      titre: {
        field: 'titre',
        type: Sequelize.STRING,
        allowNull: false
      },
      ville: {
        field: 'ville',
        type: Sequelize.STRING,
        allowNull: true
      },
      organisation: {
        field: 'organisation',
        type: Sequelize.STRING,
        allowNull: true
      },
      dateDeDebut: {
        field: 'date_de_debut',
        type: Sequelize.STRING,
        allowNull: true
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('favori_offre_engagement')
  }
}
