'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'id_partenaire',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'rendez_vous',
        'type_partenaire',
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
      await queryInterface.removeColumn('id_partenaire', 'source', {
        transaction
      })
      await queryInterface.removeColumn('type_partenaire', 'source', {
        transaction
      })
    })
  }
}
