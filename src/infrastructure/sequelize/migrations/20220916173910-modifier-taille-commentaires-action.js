'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('commentaire_action', 'message', {
      type: Sequelize.STRING(2048),
      allowNull: false
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `update commentaire_action
         set message = substring(message from 1 for 255)`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'commentaire_action',
        'message',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
    })
  }
}
