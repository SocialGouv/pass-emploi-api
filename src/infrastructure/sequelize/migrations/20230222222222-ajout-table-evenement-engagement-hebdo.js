'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `CREATE TABLE evenement_engagement_hebdo (LIKE evenement_engagement INCLUDING ALL);`,
        { transaction }
      )
      await queryInterface.sequelize.query(
        `INSERT INTO evenement_engagement_hebdo SELECT * FROM evenement_engagement WHERE date_evenement BETWEEN (NOW() - INTERVAL '8 days') AND NOW();`,
        { transaction }
      )
      await queryInterface.addIndex(
        'evenement_engagement_hebdo',
        ['id_utilisateur'],
        {
          transaction,
          name: 'idx_evenement_engagement_hebdo_id_utilisateur'
        }
      )

      await queryInterface.addIndex(
        'evenement_engagement_hebdo',
        ['type_utilisateur'],
        {
          transaction,
          name: 'idx_evenement_engagement_hebdo_type_utilisateur'
        }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('evenement_engagement_hebdo')
  }
}
