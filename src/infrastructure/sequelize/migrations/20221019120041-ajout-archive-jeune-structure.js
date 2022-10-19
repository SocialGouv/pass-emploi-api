'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('archive_jeune', 'structure', {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('archive_jeune', 'structure')
  }
}
