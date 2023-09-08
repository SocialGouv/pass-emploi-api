'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'conseiller',
        'date_maj_structure_milo',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn(
        'conseiller',
        'date_maj_structure_milo',
        {
          transaction
        }
      )
    })
  }
}
