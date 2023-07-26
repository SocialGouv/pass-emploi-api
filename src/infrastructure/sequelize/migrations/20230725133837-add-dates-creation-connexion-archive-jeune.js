'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'archive_jeune',
        'date_creation',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'archive_jeune',
        'date_premiere_connexion',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('archive_jeune', 'date_creation', {
        transaction
      })
      await queryInterface.removeColumn(
        'archive_jeune',
        'date_premiere_connexion',
        {
          transaction
        }
      )
    })
  }
}
