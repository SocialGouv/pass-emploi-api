'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('evenement_engagement', 'code', {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('evenement_engagement', 'code')
  }
}
