'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'agence',
        'code_region',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'agence',
        'nom_departement',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'agence',
        'timezone',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )

      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'America/Guadeloupe'
       where code_departement = '971'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'America/Martinique'
       where code_departement = '972'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'America/Cayenne'
       where code_departement = '973'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'Indian/Reunion'
       where code_departement = '974'
          OR id = '23'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'Indian/Mayotte'
       where code_departement = '976'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'America/Marigot'
       where code_departement = '978'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `update agence
       set timezone = 'Europe/Paris'
       where timezone IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )

      await queryInterface.changeColumn(
        'agence',
        'timezone',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('agence', 'code_region', {
        transaction
      })
      await queryInterface.removeColumn('agence', 'nom_departement', {
        transaction
      })
      await queryInterface.removeColumn('agence', 'timezone', { transaction })
    })
  }
}
