'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('commentaire_action', 'id_action', {
      type: Sequelize.UUID,
      references: {
        model: 'action',
        key: 'id'
      },
      onDelete: 'CASCADE'
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('commentaire_action', 'id_action', {
      type: Sequelize.UUID,
      references: {
        model: 'action',
        key: 'id'
      },
      onDelete: 'NO ACTION'
    })
  }
}
