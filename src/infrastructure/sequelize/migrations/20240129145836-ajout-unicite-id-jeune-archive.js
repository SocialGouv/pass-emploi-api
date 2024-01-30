'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('archive_jeune', 'id_jeune', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('archive_jeune', 'id_jeune', {
      type: Sequelize.STRING,
      allowNull: false
    })
  }
}
