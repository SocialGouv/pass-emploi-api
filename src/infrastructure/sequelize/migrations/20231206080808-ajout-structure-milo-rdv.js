'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'id_structure_milo',
        {
          type: Sequelize.STRING,
          references: {
            model: 'structure_milo',
            key: 'id'
          },
          allowNull: true
        },
        { transaction }
      )
    })
  },

  down: async queryInterface => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('rendez_vous', 'id_structure_milo', {
        transaction
      })
    })
  }
}
