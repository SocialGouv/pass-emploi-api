'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('archive_jeune', 'dispositif', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('archive_jeune', 'dispositif')
  }
}
