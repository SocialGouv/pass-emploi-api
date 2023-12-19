"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "agence",
      "nom_usuel",
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("agence", "nom_usuel")
  }
}
