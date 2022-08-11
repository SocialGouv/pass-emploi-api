'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('commentaire_action', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      idAction: {
        field: 'id_action',
        type: Sequelize.UUID,
        references: {
          model: 'action',
          key: 'id'
        }
      },
      date: {
        field: 'date',
        type: Sequelize.DATE,
        allowNull: false
      },
      createur: {
        field: 'createur',
        type: Sequelize.JSONB,
        allowNull: false
      },
      message: {
        field: 'message',
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('commentaire_action')
  }
}