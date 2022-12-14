'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jeune', 'timezone', {
      type: Sequelize.STRING,
      defaultValue: 'Europe/Paris',
      allowNull: false
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jeune', 'timezone')
  }
}
