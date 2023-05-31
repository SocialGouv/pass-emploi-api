require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const conseillersMiloDuCEJ = require('./extract_conseillers_milo_250523.json')
const conseillersMiloDuCEJEtLeurStructureDeReference = require('./structures_conseillers_milo_250523.json')

sequelize.transaction(async transaction => {
  for (const conseillerEtStructure of conseillersMiloDuCEJEtLeurStructureDeReference) {
    // si le conseiller a une structure, on rajoute cette structure au referentiel
    if (conseillerEtStructure.id_ml_principale) {
      const nomUsuelOuNull = conseillerEtStructure.nom_usuel
        ? conseillerEtStructure.nom_usuel
        : null
      await sequelize.query(
        `INSERT INTO structure_milo (id, nom_officiel, nom_usuel) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET nom_officiel = ?, nom_usuel = ?`,
        {
          replacements: [
            conseillerEtStructure.id_ml_principale,
            conseillerEtStructure.nom_officiel,
            nomUsuelOuNull,
            conseillerEtStructure.nom_officiel,
            nomUsuelOuNull
          ],
          transaction
        }
      )

      conseillerCEJ = conseillersMiloDuCEJ.find(
        conseillerMiloDuCEJ =>
          conseillerMiloDuCEJ.username === conseillerEtStructure.username
      )

      if (conseillerCEJ) {
        await sequelize.query(
          `UPDATE conseiller SET id_structure_milo = ? WHERE id = ?`,
          {
            replacements: [
              conseillerEtStructure.id_ml_principale,
              conseillerCEJ.id_bdd_cej
            ],
            transaction
          }
        )
      }
    }
  }
})
