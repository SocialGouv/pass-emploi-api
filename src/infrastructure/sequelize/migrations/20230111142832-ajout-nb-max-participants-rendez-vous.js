'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rendez_vous', 'nombre_max_participants', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rendez_vous', 'nombre_max_participants')
  }
}
