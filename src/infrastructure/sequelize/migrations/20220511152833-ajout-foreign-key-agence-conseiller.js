'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'conseiller',
        'id_agence',
        {
          type: Sequelize.STRING,
          references: {
            model: 'agence',
            key: 'id'
          },
          allowNull: true
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'conseiller',
        'id_agence',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
    })
  }
}
