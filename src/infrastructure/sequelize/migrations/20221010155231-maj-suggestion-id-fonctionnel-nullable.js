'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('suggestion', 'id_fonctionnel', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('suggestion', 'id_fonctionnel', {
      type: Sequelize.STRING,
      allowNull: false
    })
  }
}
