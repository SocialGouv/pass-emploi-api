'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.renameTable(
        'log_api_partenaire',
        'cache_api_partenaire',
        { transaction }
      )
      await queryInterface.removeColumn('cache_api_partenaire', 'resultat', {
        transaction
      })
      await queryInterface.addConstraint('cache_api_partenaire', {
        fields: ['id_utilisateur', 'path_partenaire'],
        type: 'unique',
        name: 'cache_api_partenaire_id_utilisateur_path_unique',
        transaction
      })
      await queryInterface.addIndex(
        'cache_api_partenaire',
        ['id_utilisateur', 'path_partenaire'],
        {
          transaction,
          name: 'cache_api_partenaire_id_utilisateur_path_partenaire_index'
        }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex(
        'cache_api_partenaire',
        'cache_api_partenaire_id_utilisateur_path_partenaire_index',
        { transaction }
      )
      await queryInterface.removeConstraint(
        'cache_api_partenaire',
        'cache_api_partenaire_id_utilisateur_path_unique',
        { transaction }
      )
      await queryInterface.addColumn(
        'cache_api_partenaire',
        'resultat',
        {
          type: Sequelize.JSONB,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.renameTable(
        'cache_api_partenaire',
        'log_api_partenaire',
        {
          transaction
        }
      )
    })
  }
}
