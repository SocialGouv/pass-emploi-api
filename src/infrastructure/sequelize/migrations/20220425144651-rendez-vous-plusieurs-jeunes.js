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
        {
          transaction,
          uniqueKeys: {
            rendez_vous_jeune_association_unique: {
              fields: ['id_rendez_vous', 'id_jeune']
            }
          }
        }
      )

      await queryInterface.sequelize.query(
        `INSERT INTO rendez_vous_jeune_association (id_rendez_vous, id_jeune) SELECT id, id_jeune FROM rendez_vous WHERE id_jeune IS NOT NULL`,
        { transaction }
      )

      await queryInterface.removeColumn('rendez_vous', 'id_jeune', {
        transaction
      })
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'id_jeune',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'jeune',
            key: 'id'
          }
        },
        { transaction }
      )
      await queryInterface.dropTable('rendez_vous_jeune_association', {
        transaction
      })
    })
  }
}
