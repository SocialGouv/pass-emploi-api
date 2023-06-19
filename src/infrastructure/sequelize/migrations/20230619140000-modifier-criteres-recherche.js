'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `UPDATE recherche SET criteres = '{}' WHERE criteres IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'recherche',
        'criteres',
        {
          type: Sequelize.JSONB,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'recherche',
        'criteres',
        {
          type: Sequelize.JSONB,
          allowNull: true
        },
        { transaction }
      )
    })
  }
}
