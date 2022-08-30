'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint(
        'commentaire_action',
        'commentaire_action_id_action_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('commentaire_action', {
        type: 'foreign key',
        fields: ['id_action'],
        name: 'commentaire_action_id_action_fkey',
        references: {
          table: 'action',
          field: 'id'
        },
        onDelete: 'CASCADE',
        transaction
      })
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint(
        'commentaire_action',
        'commentaire_action_id_action_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('commentaire_action', {
        type: 'foreign key',
        fields: ['id_action'],
        name: 'commentaire_action_id_action_fkey',
        references: {
          table: 'action',
          field: 'id'
        },
        transaction
      })
    })
  }
}
