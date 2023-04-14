'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'favori_offre_emploi',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        transaction
      )
      await queryInterface.addColumn(
        'favori_offre_engagement',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        transaction
      )
      await queryInterface.addColumn(
        'favori_offre_immersion',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        transaction
      )
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn(
        'favori_offre_emploi',
        'date_creation',
        {
          transaction
        }
      )
      await queryInterface.removeColumn(
        'favori_offre_engagement',
        'date_creation',
        {
          transaction
        }
      )
      await queryInterface.removeColumn(
        'favori_offre_immersion',
        'date_creation',
        {
          transaction
        }
      )
    })
  }
}
