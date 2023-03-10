'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      // Clean PK
      await queryInterface.removeConstraint(
        'evenement_engagement',
        'evenement_engagement_pkey',
        { transaction }
      )
      await queryInterface.removeIndex(
        'evenement_engagement',
        'evenement_engagement_pkey',
        { transaction }
      )

      // Clean PK hebdo
      await queryInterface.removeConstraint(
        'evenement_engagement_hebdo',
        'evenement_engagement_hebdo_pkey',
        { transaction }
      )
      await queryInterface.removeIndex(
        'evenement_engagement_hebdo',
        'evenement_engagement_hebdo_pkey',
        { transaction }
      )
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      // Reset PK
      await queryInterface.addConstraint('evenement_engagement', {
        fields: ['id'],
        type: 'primary key',
        name: 'evenement_engagement_pkey',
        transaction
      })

      // Reset PK hebdo
      await queryInterface.addConstraint('evenement_engagement_hebdo', {
        fields: ['id'],
        type: 'primary key',
        name: 'evenement_engagement_hebdo_pkey',
        transaction
      })
    })
  }
}
