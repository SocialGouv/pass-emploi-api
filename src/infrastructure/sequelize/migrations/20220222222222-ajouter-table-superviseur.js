'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('superviseur', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      email: {
        field: 'email',
        type: Sequelize.STRING,
        allowNull: false
      },
      structure: {
        field: 'structure',
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('superviseur')
  }
}
