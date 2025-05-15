'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('reponse_campagne', 'reponse_5', {
        type: Sequelize.STRING,
        allowNull: true
      })
      await queryInterface.addColumn('reponse_campagne', 'pourquoi_5', {
        type: Sequelize.STRING,
        allowNull: true
      })
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('reponse_campagne', 'reponse_5')
      await queryInterface.removeColumn('reponse_campagne', 'pourquoi_5')
    })
  }
}
