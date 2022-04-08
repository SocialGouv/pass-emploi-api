'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'rendez_vous',
        'createur',
        {
          type: Sequelize.JSONB,
          allowNull: true
        },
        { transaction }
      )

      const listeRendezVousSql = await queryInterface.sequelize.query(
        `SELECT rendez_vous.id, conseiller.id as id_conseiller, conseiller.nom as nom_conseiller, conseiller.prenom as prenom_conseiller
        FROM rendez_vous
        LEFT JOIN jeune ON jeune.id = rendez_vous.id_jeune
        LEFT JOIN conseiller ON conseiller.id = jeune.id_conseiller
        `,
        { transaction }
      )

      for (const rendezVousSql of listeRendezVousSql[0]) {
        const createur = {
          id: rendezVousSql.id_conseiller,
          nom: rendezVousSql.nom_conseiller,
          prenom: rendezVousSql.prenom_conseiller
        }
        await queryInterface.sequelize.query(
          `UPDATE rendez_vous SET createur = '${JSON.stringify(
            createur
          )}' where id = '${rendezVousSql.id}'`,
          {
            type: Sequelize.QueryTypes.UPDATE,
            transaction
          }
        )
      }

      await queryInterface.changeColumn(
        'rendez_vous',
        'createur',
        {
          type: Sequelize.JSONB,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('rendez_vous', 'createur')
  }
}
