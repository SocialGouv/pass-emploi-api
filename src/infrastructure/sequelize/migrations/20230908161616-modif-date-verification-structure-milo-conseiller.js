'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.renameColumn(
        'conseiller',
        'date_maj_structure_milo',
        'date_verification_structure_milo',
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.renameColumn(
        'conseiller',
        'date_verification_structure_milo',
        'date_maj_structure_milo',
        { transaction }
      )
    })
  }
}
