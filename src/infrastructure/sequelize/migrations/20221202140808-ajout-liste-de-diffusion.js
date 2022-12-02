'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'liste-de-diffusion',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          idConseiller: {
            field: 'id_conseiller',
            type: Sequelize.STRING,
            references: {
              model: 'conseiller',
              key: 'id'
            },
            onDelete: 'CASCADE'
          },
          titre: {
            field: 'titre',
            type: Sequelize.STRING
          },
          dateDeCreation: {
            field: 'date_de_creation',
            type: Sequelize.DATE,
            allowNull: false
          }
        },
        { transaction }
      )
      await queryInterface.createTable(
        'liste-de-diffusion-beneficiaire-association',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
          },
          idBeneficiare: {
            field: 'id_beneficiaire',
            type: Sequelize.STRING,
            references: {
              model: 'jeune',
              key: 'id'
            },
            onDelete: 'CASCADE'
          },
          idListe: {
            field: 'id_liste',
            type: Sequelize.UUID,
            references: {
              model: 'liste-de-diffusion',
              key: 'id'
            },
            onDelete: 'CASCADE'
          },
          dateAjout: {
            field: 'date_ajout',
            type: Sequelize.DATE,
            allowNull: false
          }
        },
        { transaction }
      )
    })
  },

  down: async queryInterface => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('liste-de-diffusion-beneficiaire', {
        transaction
      })
      await queryInterface.dropTable('liste-de-diffusion', { transaction })
    })
  }
}
