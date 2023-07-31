'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('session_milo', 'date_cloture', {
      type: Sequelize.DATE,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('session_milo', 'date_cloture')
  }
}
