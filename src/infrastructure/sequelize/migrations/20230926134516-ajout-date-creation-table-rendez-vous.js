'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rendez_vous', 'date_creation', {
      type: Sequelize.DATE,
      allowNull: true
    })
    await queryInterface.changeColumn('rendez_vous', 'date_creation', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now')
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rendez_vous', 'date_creation')
  }
}
