'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fichier', 'id_message', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('fichier', 'id_message')
  }
}
