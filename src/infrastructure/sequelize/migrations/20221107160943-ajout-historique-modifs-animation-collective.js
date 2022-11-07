'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('log_modification_rendez_vous', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      idRendezVous: {
        field: 'id_rendez_vous',
        type: Sequelize.UUID,
        references: {
          model: 'rendez_vous',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      date: {
        field: 'date',
        type: Sequelize.DATE,
        allowNull: false
      },
      auteur: {
        field: 'auteur',
        type: Sequelize.JSONB,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('log_modification_rendez_vous')
  }
}
