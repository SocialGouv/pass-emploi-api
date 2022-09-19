'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('log_api_partenaire', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
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
      },
      date: {
        field: 'date',
        type: Sequelize.DATE,
        allowNull: false
      },
      pathPartenaire: {
        field: 'path_partenaire',
        type: Sequelize.STRING,
        allowNull: true
      },
      resultatPartenaire: {
        field: 'resultat_partenaire',
        type: Sequelize.JSONB,
        allowNull: true
      },
      resultat: {
        field: 'resultat',
        type: Sequelize.JSONB,
        allowNull: true
      },
      transactionId: {
        field: 'transaction_id',
        type: Sequelize.STRING,
        allowNull: true
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('log_api_partenaire')
  }
}
