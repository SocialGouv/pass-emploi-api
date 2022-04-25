'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'rendez_vous_jeune_association',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          id_rendez_vous: {
            type: Sequelize.UUID,
            references: {
              model: 'rendez_vous',
              key: 'id'
            },
            allowNull: false
          },
          id_jeune: {
            type: Sequelize.STRING,
            references: {
              model: 'jeune',
              key: 'id'
            },
            onDelete: 'CASCADE',
            allowNull: false
          }
        },
        { transaction }
      )

      await queryInterface.sequelize.query(
        `INSERT INTO rendez_vous_jeune_association (id_rendez_vous, id_jeune) SELECT id, id_jeune FROM rendez_vous`,
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('rendez_vous_jeune_association')
  }
}
