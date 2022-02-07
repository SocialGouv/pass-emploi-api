'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'action',
        'createur',
        {
          type: Sequelize.JSONB
        },
        { transaction }
      )

      const actionssql = await queryInterface.sequelize.query(
        `select id_createur, type_createur, id from action`,
        { transaction }
      )

      for (const actionsql of actionssql[0]) {
        if (actionsql.type_createur === 'jeune') {
          const jeuneSql = await queryInterface.sequelize.query(
            `select nom, prenom from jeune where id = '${actionsql.id_createur}'`,
            { transaction }
          )
          if (jeuneSql?.length && jeuneSql[0].length) {
            const jsonb = {
              id: actionsql.id_createur,
              nom: jeuneSql[0][0].nom,
              prenom: jeuneSql[0][0].prenom
            }
            await queryInterface.sequelize.query(
              `update action set createur = '${JSON.stringify(
                jsonb
              )}' where id = '${actionsql.id}'`,
              {
                type: Sequelize.QueryTypes.UPDATE,
                transaction
              }
            )
          }
        } else {
          const conseillerSql = await queryInterface.sequelize.query(
            `select nom, prenom from conseiller where id = '${actionsql.id_createur}'`,
            { transaction }
          )

          if (conseillerSql?.length && conseillerSql[0].length) {
            const jsonb = {
              id: actionsql.id_createur,
              nom: conseillerSql[0][0].nom,
              prenom: conseillerSql[0][0].prenom
            }
            await queryInterface.sequelize.query(
              `update action set createur = '${JSON.stringify(
                jsonb
              )}' where id = '${actionsql.id}'`,
              {
                type: Sequelize.QueryTypes.UPDATE,
                transaction
              }
            )
          }
        }
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('action', 'createur')
  }
}
