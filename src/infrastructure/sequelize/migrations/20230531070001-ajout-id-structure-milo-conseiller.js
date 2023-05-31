'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'structure_milo',
        {
          id: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
          },
          nom_officiel: {
            type: Sequelize.STRING,
            allowNull: false
          },
          nom_usuel: {
            type: Sequelize.STRING,
            allowNull: true
          }
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'conseiller',
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
      await queryInterface.removeColumn('conseiller', 'id_structure_milo', {
        transaction
      })
      await queryInterface.dropTable('structure_milo', { transaction })
    })
  }
}
