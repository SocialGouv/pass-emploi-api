'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('reponse_campagne', 'id')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('reponse_campagne', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true
    })
  }
}
