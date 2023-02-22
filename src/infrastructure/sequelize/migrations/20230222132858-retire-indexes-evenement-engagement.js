'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex(
        'evenement_engagement',
        'idx_evenement_engagement_id_utilisateur',
        { transaction }
      )
      await queryInterface.removeIndex(
        'evenement_engagement',
        'idx_evenement_engagement_type_utilisateur',
        { transaction }
      )
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex(
        'evenement_engagement',
        ['id_utilisateur'],
        {
          transaction,
          name: 'idx_evenement_engagement_id_utilisateur'
        }
      )

      await queryInterface.addIndex(
        'evenement_engagement',
        ['type_utilisateur'],
        {
          transaction,
          name: 'idx_evenement_engagement_type_utilisateur'
        }
      )
    })
  }
}
