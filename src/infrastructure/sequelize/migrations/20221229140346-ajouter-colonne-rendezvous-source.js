'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rendez_vous', 'source', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'PASS_EMPLOI'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rendez_vous', 'source')
  }
}
