'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('favori_offre_emploi', 'date_candidature', {
      type: Sequelize.DATE,
      allowNull: true
    })
    await queryInterface.addColumn(
      'favori_offre_immersion',
      'date_candidature',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    )
    await queryInterface.addColumn(
      'favori_offre_engagement',
      'date_candidature',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    )
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('favori_offre_emploi', 'date_candidature')
    await queryInterface.removeColumn(
      'favori_offre_immersion',
      'date_candidature'
    )
    await queryInterface.removeColumn(
      'favori_offre_engagement',
      'date_candidature'
    )
  }
}
