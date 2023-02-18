require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const agencesMilo = require('../../src/infrastructure/sequelize/seeders/data/agences_milo_170223.json')

sequelize.transaction(async transaction => {
  for (const {
    id,
    nom_agence,
    nom_region,
    code_departement,
    structure
  } of agencesMilo) {
    await sequelize.query(
      `INSERT INTO agence (id, nom_agence, nom_region, code_departement, structure) VALUES (?, ?, ?, ?, ?)`,
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
})
