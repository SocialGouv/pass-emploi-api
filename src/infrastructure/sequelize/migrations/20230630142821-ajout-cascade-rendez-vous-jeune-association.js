'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint(
        'rendez_vous_jeune_association',
        'rendez_vous_jeune_association_id_rendez_vous_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('rendez_vous_jeune_association', {
        type: 'foreign key',
        fields: ['id_rendez_vous'],
        name: 'rendez_vous_jeune_association_id_rendez_vous_fkey',
        references: {
          table: 'rendez_vous',
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
        'rendez_vous_jeune_association',
        'rendez_vous_jeune_association_id_rendez_vous_fkey',
        { transaction }
      )
      await queryInterface.addConstraint('rendez_vous_jeune_association', {
        type: 'foreign key',
        fields: ['id_rendez_vous'],
        name: 'rendez_vous_jeune_association_id_rendez_vous_fkey',
        references: {
          table: 'rendez_vous',
          field: 'id'
        },
        transaction
      })
    })
  }
}
