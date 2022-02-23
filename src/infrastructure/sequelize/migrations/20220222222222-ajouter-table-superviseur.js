'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('superviseur', {
      email: {
        field: 'email',
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      structure: {
        field: 'structure',
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('superviseur')
  }
}
