'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'jeune',
        'id_structure_milo',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'structure_milo',
            key: 'id'
          }
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('jeune', 'id_structure_milo', {
        transaction
      })
    })
  }
}
