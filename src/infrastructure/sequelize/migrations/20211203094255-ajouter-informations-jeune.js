'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'jeune',
        'email',
        {
          type: Sequelize.STRING
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'jeune',
        'structure',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'PASS_EMPLOI'
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'jeune',
        'id_authentification',
        {
          type: Sequelize.STRING
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('jeune', 'email', { transaction })
      await queryInterface.removeColumn('jeune', 'structure', {
        transaction
      })
      await queryInterface.removeColumn('jeune', 'id_authentification', {
        transaction
      })
    })
  }
}
