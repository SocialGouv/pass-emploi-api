'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'structure_milo',
        'nom_region',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'structure_milo',
        'code_region',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'structure_milo',
        'nom_departement',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'structure_milo',
        'code_departement',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('structure_milo', 'nom_region', {
        transaction
      })
      await queryInterface.removeColumn('structure_milo', 'code_region', {
        transaction
      })
      await queryInterface.removeColumn('structure_milo', 'nom_departement', {
        transaction
      })
      await queryInterface.removeColumn('structure_milo', 'code_departement', {
        transaction
      })
    })
  }
}
