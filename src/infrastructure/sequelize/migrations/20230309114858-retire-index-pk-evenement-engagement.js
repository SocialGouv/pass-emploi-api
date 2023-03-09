'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex(
        'evenement_engagement',
        'evenement_engagement_pkey',
        { transaction }
      )
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex('evenement_engagement', ['id'], {
        transaction,
        name: 'evenement_engagement_pkey'
      })
    })
  }
}
