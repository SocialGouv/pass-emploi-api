require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const agencesDoublons = require('./agences_doublons_170223.json')

sequelize.transaction(async transaction => {
  for (const { id_agence_doublon, id_agence_cible } of agencesDoublons) {
    await sequelize.query(
      `UPDATE rendez_vous SET id_agence = ? WHERE id_agence = ?`,
      {
        replacements: [id_agence_cible, id_agence_doublon],
        transaction
      }
    )

    await sequelize.query(
      `UPDATE conseiller SET id_agence = ? WHERE id_agence = ?`,
      {
        replacements: [id_agence_cible, id_agence_doublon],
        transaction
      }
    )

    await sequelize.query(`DELETE FROM agence WHERE id = ?`, {
      replacements: [id_agence_doublon],
      transaction
    })
  }
})
