'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('jeune', 'date_fin_cej', {
        type: Sequelize.DATE,
        allowNull: true
      })
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('jeune', 'date_fin_cej')
    })
  }
}
