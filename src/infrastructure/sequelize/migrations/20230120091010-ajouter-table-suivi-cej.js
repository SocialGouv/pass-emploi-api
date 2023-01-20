'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('jeune_pe_cej', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('jeune_pe_cej')
  }
}
