'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addConstraint('favori_offre_emploi', {
        fields: ['id_jeune', 'id_offre'],
        type: 'unique',
        name: 'favori_offre_emploi_id_jeune_id_offre_unique',
        transaction
      })
      await queryInterface.addIndex(
        'favori_offre_emploi',
        ['id_jeune', 'id_offre'],
        {
          name: 'favori_offre_emploi_id_jeune_id_offre_index',
          transaction
        }
      )

      await queryInterface.addConstraint('favori_offre_immersion', {
        fields: ['id_jeune', 'id_offre'],
        type: 'unique',
        name: 'favori_offre_immersion_id_jeune_id_offre_unique',
        transaction
      })
      await queryInterface.addIndex(
        'favori_offre_immersion',
        ['id_jeune', 'id_offre'],
        {
          name: 'favori_offre_immersion_id_jeune_id_offre_index',
          transaction
        }
      )

      await queryInterface.addConstraint('favori_offre_engagement', {
        fields: ['id_jeune', 'id_offre'],
        type: 'unique',
        name: 'favori_offre_engagement_id_jeune_id_offre_unique',
        transaction
      })
      await queryInterface.addIndex(
        'favori_offre_engagement',
        ['id_jeune', 'id_offre'],
        {
          name: 'favori_offre_engagement_id_jeune_id_offre_index',
          transaction
        }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint(
        'favori_offre_emploi',
        'favori_offre_emploi_id_jeune_id_offre_unique',
        { transaction }
      )
      await queryInterface.removeIndex(
        'favori_offre_emploi',
        'favori_offre_emploi_id_jeune_id_offre_index'
      )

      await queryInterface.removeConstraint(
        'favori_offre_immersion',
        'favori_offre_immersion_id_jeune_id_offre_unique',
        { transaction }
      )
      await queryInterface.removeIndex(
        'favori_offre_immersion',
        'favori_offre_immersion_id_jeune_id_offre_index'
      )

      await queryInterface.removeConstraint(
        'favori_offre_engagement',
        'favori_offre_engagement_id_jeune_id_offre_unique',
        { transaction }
      )
      await queryInterface.removeIndex(
        'favori_offre_engagement',
        'favori_offre_engagement_id_jeune_id_offre_index'
      )
    })
  }
}
