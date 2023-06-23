require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

const referentielStructuresMilo = require('./referentiel_structures_milo.json')
const conseillersMiloDuCEJ = require('./conseillers_milo_cej.json')
const conseillersMiloDuCEJEtLeurStructureDeReference = require('./structures_conseillers_milo_cej.json')

sequelize.transaction(async transaction => {
  // Alimentation referentiel structures Milo
  for (const structureMilo of referentielStructuresMilo) {
    await sequelize.query(
      `INSERT INTO structure_milo (id, nom_officiel, nom_usuel, nom_region, code_region, nom_departement, code_departement) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nom_officiel = ?, nom_usuel = ?, nom_region = ?, code_region = ?, nom_departement = ?, code_departement = ?`,
      {
        replacements: [
          structureMilo.id,
          structureMilo.nom_officiel,
          structureMilo.nom_usuel ?? null,
          structureMilo.region,
          structureMilo.code_region,
          structureMilo.departement,
          structureMilo.code_departement,
          structureMilo.nom_officiel,
          structureMilo.nom_usuel ?? null,
          structureMilo.region,
          structureMilo.code_region,
          structureMilo.departement,
          structureMilo.code_departement
        ],
        transaction
      }
    )
  }

  for (const conseillerEtStructure of conseillersMiloDuCEJEtLeurStructureDeReference) {
    // si le conseiller a une structure Milo, on la rajoute au référentiel si elle n'existe pas
    if (conseillerEtStructure.id_ml_principale) {
      const nomUsuelOuNull = conseillerEtStructure.nom_usuel
        ? conseillerEtStructure.nom_usuel
        : null

      if (conseillerEtStructure.nom_officiel) {
        await sequelize.query(
          `INSERT INTO structure_milo (id, nom_officiel, nom_usuel) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`,
          {
            replacements: [
              conseillerEtStructure.id_ml_principale,
              conseillerEtStructure.nom_officiel,
              nomUsuelOuNull
            ],
            transaction
          }
        )
      }

      // rattachement entre conseiller Milo dans le CEJ et structure Milo
      conseillerCEJ = conseillersMiloDuCEJ.find(
        conseillerMiloDuCEJ =>
          conseillerMiloDuCEJ.login === conseillerEtStructure.username
      )

      if (conseillerCEJ) {
        await sequelize.query(
          `UPDATE conseiller SET id_structure_milo = ? WHERE id = ?`,
          {
            replacements: [
              conseillerEtStructure.id_ml_principale,
              conseillerCEJ.id_cej
            ],
            transaction
          }
        )
      }
    }
  }
})
