'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'suggestion',
        'metier',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.changeColumn(
        'suggestion',
        'localisation',
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
      await queryInterface.sequelize.query(
        `UPDATE suggestion SET metier = 'NULL', localisation = 'NULL' WHERE metier IS NULL OR localisation IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'suggestion',
        'metier',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
      await queryInterface.changeColumn(
        'suggestion',
        'localisation',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
    })
  }
}
