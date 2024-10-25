'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('archive_jeune', 'date_fin_accompagnement', {
      type: Sequelize.DATE,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'archive_jeune',
      'date_fin_accompagnement'
    )
  }
}
