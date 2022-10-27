require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const agencesMilo = require('../../src/infrastructure/sequelize/seeders/data/agences_milo.json')
const agencesConseillers = require('./agences_conseillers.json')

sequelize.transaction(async transaction => {
  for (const {
    id,
    nom_agence,
    nom_region,
    code_departement,
    structure
  } of agencesMilo) {
    await sequelize.query(
      `INSERT INTO agence (id, nom_agence, nom_region, code_departement, structure) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nom_agence = ?`,
      {
        replacements: [
          id,
          nom_agence,
          nom_region,
          code_departement,
          structure,
          nom_agence
        ],
        transaction
      }
    )
  }

  for (const { id_conseiller, id_agence } of agencesConseillers) {
    if (id_agence) {
      await sequelize.query(
        `UPDATE conseiller SET id_agence = ? WHERE id = ? AND structure = 'MILO'`,
        {
          replacements: [id_agence, id_conseiller],
          transaction
        }
      )
    }
  }

  await sequelize.query(
    `UPDATE conseiller SET nom_manuel_agence = NULL WHERE structure = 'MILO'`,
    {
      transaction
    }
  )
})
