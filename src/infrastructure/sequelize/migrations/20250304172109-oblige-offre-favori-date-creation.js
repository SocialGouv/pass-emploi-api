'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `delete from favori_offre_emploi where date_creation IS NULL`,
        { transaction }
      )
      await queryInterface.changeColumn(
        'favori_offre_emploi',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: false
        },
        { transaction }
      )

      await queryInterface.sequelize.query(
        `delete from favori_offre_immersion where date_creation IS NULL`,
        { transaction }
      )
      await queryInterface.changeColumn(
        'favori_offre_immersion',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: false
        },
        { transaction }
      )

      await queryInterface.sequelize.query(
        `delete from favori_offre_engagement where date_creation IS NULL`,
        { transaction }
      )
      await queryInterface.changeColumn(
        'favori_offre_engagement',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'favori_offre_emploi',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )

      await queryInterface.changeColumn(
        'favori_offre_immersion',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )

      await queryInterface.changeColumn(
        'favori_offre_engagement',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
    })
  }
}
