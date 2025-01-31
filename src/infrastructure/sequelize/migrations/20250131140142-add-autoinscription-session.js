'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('session_milo', 'autoinscription', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('session_milo', 'autoinscription')
  }
}
