'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'rendez_vous',
        'modalite',
        {
          type: Sequelize.STRING(2048),
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'type',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'ENTRETIEN_INDIVIDUEL_CONSEILLER'
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'precision',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'adresse',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'organisme',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'presence_conseiller',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `update rendez_vous set modalite = '' where modalite IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'rendez_vous',
        'modalite',
        {
          type: Sequelize.STRING(2048),
          allowNull: false
        },
        { transaction }
      )
      await queryInterface.removeColumn('rendez_vous', 'type', {
        transaction
      })
      await queryInterface.removeColumn('rendez_vous', 'precision', {
        transaction
      })
      await queryInterface.removeColumn('rendez_vous', 'adresse', {
        transaction
      })
      await queryInterface.removeColumn('rendez_vous', 'organisme', {
        transaction
      })
      await queryInterface.removeColumn('rendez_vous', 'presence_conseiller', {
        transaction
      })
    })
  }
}
