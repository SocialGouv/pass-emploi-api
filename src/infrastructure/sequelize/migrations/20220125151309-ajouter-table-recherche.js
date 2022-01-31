'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recherche', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      idJeune: {
        field: 'id_jeune',
        type: Sequelize.STRING,
        references: {
          model: 'jeune',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      titre: {
        field: 'titre',
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        field: 'type',
        type: Sequelize.STRING,
        allowNull: false
      },
      metier: {
        field: 'metier',
        type: Sequelize.STRING,
        allowNull: true
      },
      localisation: {
        field: 'localisation',
        type: Sequelize.STRING,
        allowNull: true
      },
      criteres: {
        field: 'criteres',
        type: Sequelize.JSONB,
        allowNull: true
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('recherche')
  }
}
