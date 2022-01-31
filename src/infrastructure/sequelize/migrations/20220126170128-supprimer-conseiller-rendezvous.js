'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('rendez_vous', 'id_conseiller', {
        transaction
      })
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'id_conseiller',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'conseiller',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        { transaction }
      )
      const jeunes = await queryInterface.sequelize.query(
        `SELECT id, id_conseiller FROM jeune`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      )
      for (const { id, id_conseiller } of jeunes) {
        await queryInterface.sequelize.query(
          `UPDATE rendez_vous SET id_conseiller = :id_conseiller WHERE id_jeune = :id`,
          {
            type: Sequelize.QueryTypes.UPDATE,
            replacements: { id, id_conseiller },
            transaction
          }
        )
      }
      await queryInterface.changeColumn(
        'rendez_vous',
        'id_conseiller',
        {
          type: Sequelize.STRING,
          allowNull: false,
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        { transaction }
      )
    })
  }
}
