'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('rendez_vous', 'id_conseiller', {
        transaction
      })
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'id_conseiller',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'conseiller',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        { transaction }
      )
    })
  }
}
