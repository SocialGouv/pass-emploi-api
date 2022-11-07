'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint(
        'suggestion',
        'suggestion_id_jeune_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('suggestion', {
        type: 'foreign key',
        fields: ['id_jeune'],
        name: 'suggestion_id_jeune_fkey',
        references: {
          table: 'jeune',
          field: 'id'
        },
        onDelete: 'CASCADE',
        transaction
      })
      await queryInterface.removeConstraint(
        'suggestion',
        'suggestion_id_recherche_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('suggestion', {
        type: 'foreign key',
        fields: ['id_recherche'],
        name: 'suggestion_id_recherche_fkey',
        references: {
          table: 'recherche',
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
        'suggestion',
        'suggestion_id_jeune_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('suggestion', {
        type: 'foreign key',
        fields: ['id_jeune'],
        name: 'suggestion_id_jeune_fkey',
        references: {
          table: 'jeune',
          field: 'id'
        },
        transaction
      })
      await queryInterface.removeConstraint(
        'suggestion',
        'suggestion_id_recherche_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('suggestion', {
        type: 'foreign key',
        fields: ['id_recherche'],
        name: 'suggestion_id_recherche_fkey',
        references: {
          table: 'recherche',
          field: 'id'
        },
        transaction
      })
    })
  }
}
