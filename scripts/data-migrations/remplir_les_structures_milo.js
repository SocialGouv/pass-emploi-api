require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const conseillersMilo = require('./extract_conseillers_milo_250523.json')
const structuresConseillersMilo = require('./structures_conseillers_milo_260523.json')

sequelize.transaction(async transaction => {
  for (const conseiller of conseillersMilo) {
    structureMilo = structuresConseillersMilo.find(
      conseillerMilo => conseillerMilo.username === conseiller.username
    )

    if (structureMilo) {
      await sequelize.query(
        `INSERT INTO structure_milo (id, nom_officiel, nom_usuel) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`,
        {
          replacements: [
            structureMilo.id_ml_principale,
            structureMilo.nom_officiel,
            structureMilo.nom_usuel
          ],
          transaction
        }
      )
      await sequelize.query(
        `UPDATE conseiller SET id_structure_milo = ? WHERE conseiller.id = ?`,
        {
          replacements: [structureMilo.id_ml_principale, conseiller.id],
          transaction
        }
      )
    }
  }
})
