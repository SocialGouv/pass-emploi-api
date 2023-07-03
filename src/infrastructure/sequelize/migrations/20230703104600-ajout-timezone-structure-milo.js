'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'structure_milo',
        'timezone',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )

      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'Europe/Paris'
         where LENGTH(code_departement) = 2`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Guadeloupe'
         where timezone IS NULL
           and nom_departement LIKE '%Guadeloupe%'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Martinique'
         where timezone IS NULL
           and nom_departement LIKE '%Martinique%'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Cayenne'
         where timezone IS NULL
           and nom_departement LIKE '%Guyane%'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'Indian/Reunion'
         where timezone IS NULL
           and nom_departement LIKE '%Réunion%'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'Indian/Mayotte'
         where timezone IS NULL
           and nom_departement LIKE '%Mayotte%'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Marigot'
         where timezone IS NULL
           and nom_departement LIKE '%Saint Martin%'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
    })
  },

  async down (queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('structure_milo', 'timezone', {
        transaction
      })
    })
  }
}
