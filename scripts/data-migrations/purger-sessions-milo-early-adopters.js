require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

const ID_STRUCTURE_EARLY_ADOPTERS_1 = '80620S00'

sequelize.transaction(async transaction => {
  const jeunesEarlyAdopters = (
    await sequelize.query(
      `SELECT * FROM jeune WHERE id_structure_milo IN (?)`,
      {
        replacements: [ID_STRUCTURE_EARLY_ADOPTERS_1],
        transaction
      }
    )
  )[0]

  for (jeune of jeunesEarlyAdopters) {
    await sequelize.query(
      `DELETE FROM rendez_vous 
      WHERE rendez_vous.id IN (SELECT rendez_vous.id FROM rendez_vous JOIN rendez_vous_jeune_association 
      ON 
      rendez_vous_jeune_association.id_rendez_vous = rendez_vous.id 
      AND
      rendez_vous_jeune_association.id_jeune = ?
      WHERE rendez_vous.type = 'SESSION_MILO')`,
      {
        replacements: [jeune.id],
        transaction
      }
    )
  }
})
