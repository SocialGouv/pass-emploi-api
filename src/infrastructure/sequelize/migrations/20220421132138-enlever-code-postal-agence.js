'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('agence', 'code_postal')
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('agence', 'code_postal', {
      type: Sequelize.STRING,
      allowNull: true
    })
  }
}
