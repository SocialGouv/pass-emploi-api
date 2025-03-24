'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex(
        'favori_offre_emploi',
        ['date_creation', 'date_candidature'],
        {
          name: 'favori_offre_emploi_date_creation_date_candidature_index',
          transaction
        }
      )
      await queryInterface.addIndex(
        'favori_offre_immersion',
        ['date_creation', 'date_candidature'],
        {
          name: 'favori_offre_immersion_date_creation_date_candidature_index',
          transaction
        }
      )
      await queryInterface.addIndex(
        'favori_offre_engagement',
        ['date_creation', 'date_candidature'],
        {
          name: 'favori_offre_engagement_date_creation_date_candidature_index',
          transaction
        }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex(
        'favori_offre_emploi',
        'favori_offre_emploi_date_creation_date_candidature_index',
        { transaction }
      )
      await queryInterface.removeIndex(
        'favori_offre_immersion',
        'favori_offre_immersion_date_creation_date_candidature_index',
        { transaction }
      )
      await queryInterface.removeIndex(
        'favori_offre_engagement',
        'favori_offre_engagement_date_creation_date_candidature_index',
        { transaction }
      )
    })
  }
}
