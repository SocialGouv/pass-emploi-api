'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('favoris_offres_emploi', {
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
      titre: {
        field: 'titre',
        type: Sequelize.STRING,
        allowNull: false
      },
      typeContrat: {
        field: 'type_contrat',
        type: Sequelize.STRING,
        allowNull: false
      },
      nomEntreprise: {
        field: 'nom_entreprise',
        type: Sequelize.STRING,
        allowNull: true
      },
      duree: {
        field: 'duree',
        type: Sequelize.STRING,
        allowNull: true
      },
      nomLocalisation: {
        field: 'localisation_nom',
        type: Sequelize.STRING,
        allowNull: true
      },
      codePostalLocalisation: {
        field: 'localisation_code_postal',
        type: Sequelize.STRING,
        allowNull: true
      },
      communeLocalisation: {
        field: 'localisation_commune',
        type: Sequelize.STRING,
        allowNull: true
      },
      isAlternance: {
        field: 'is_alternance',
        type: Sequelize.BOOLEAN,
        allowNull: true
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('favoris_offres_emploi')
  }
};
