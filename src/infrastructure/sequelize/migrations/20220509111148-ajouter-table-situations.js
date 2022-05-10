'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'situations_milo',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          id_jeune: {
            type: Sequelize.STRING,
            references: {
              model: 'jeune',
              key: 'id'
            },
            onDelete: 'CASCADE',
            allowNull: false,
            unique: true
          },
          situation_courante: {
            type: Sequelize.JSONB,
            allowNull: true
          },
          situations: {
            type: Sequelize.ARRAY(Sequelize.JSONB),
            allowNull: false
          }
        },
        {
          transaction
        }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('situations_milo')
  }
}
