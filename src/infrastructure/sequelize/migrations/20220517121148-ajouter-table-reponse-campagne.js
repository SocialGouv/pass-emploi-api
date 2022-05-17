'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'reponse_campagne',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true
          },
          id_jeune: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
          },
          structure_jeune: {
            type: Sequelize.STRING,
            allowNull: false
          },
          id_campagne: {
            type: Sequelize.UUID,
            primaryKey: true,
            references: {
              model: 'campagne',
              key: 'id'
            },
            onDelete: 'CASCADE',
            allowNull: false
          },
          date_reponse: {
            type: Sequelize.DATE,
            allowNull: false
          },
          date_creation_jeune: {
            type: Sequelize.DATE,
            allowNull: false
          },
          reponse_1: {
            type: Sequelize.STRING,
            allowNull: false
          },
          pourquoi_1: {
            type: Sequelize.STRING,
            allowNull: true
          },
          reponse_2: {
            type: Sequelize.STRING,
            allowNull: true
          },
          pourquoi_2: {
            type: Sequelize.STRING,
            allowNull: true
          }
        },
        {
          transaction
        }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reponse_campagne')
  }
}
