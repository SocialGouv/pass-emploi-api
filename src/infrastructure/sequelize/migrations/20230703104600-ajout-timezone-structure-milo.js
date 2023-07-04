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
         set timezone = 'America/Guadeloupe'
         where code_departement = '971'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Martinique'
         where code_departement = '972'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Cayenne'
         where code_departement = '973'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'Indian/Reunion'
         where code_departement = '974'
            OR id = '23'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'Indian/Mayotte'
         where code_departement = '976'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'America/Marigot'
         where code_departement = '978'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update structure_milo
         set timezone = 'Europe/Paris'
         where timezone IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )

      await queryInterface.changeColumn(
        'structure_milo',
        'timezone',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
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
