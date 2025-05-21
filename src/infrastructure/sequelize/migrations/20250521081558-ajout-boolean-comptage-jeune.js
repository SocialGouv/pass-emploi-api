'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn(
        'jeune',
        'peut_voir_le_comptage_des_heures',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true
        }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn(
        'jeune',
        'peut_voir_le_comptage_des_heures'
      )
    })
  }
}
