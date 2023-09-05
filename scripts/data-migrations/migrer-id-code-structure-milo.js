require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

const idCodeStructure = require('./id-code-structure.json')

sequelize.transaction(async transaction => {
  await sequelize.query(`UPDATE jeune SET id_structure_milo = NULL`, {
    transaction
  })

  const structuresActuelles = await sequelize.query(
    `SELECT * FROM structure_milo`,
    {
      transaction
    }
  )

  for (const structureMilo of structuresActuelles[0]) {
    console.log('STRUUUUUUUUUUCTUREE', structureMilo.id)

    const codeStructure = idCodeStructure.find(
      structure => structure.id.toString() === structureMilo.id
    )?.code

    if (codeStructure) {
      console.log('trouvé', codeStructure)

      const conseillers = await sequelize.query(
        `SELECT id FROM conseiller WHERE id_structure_milo = ?`,
        {
          replacements: [structureMilo.id],
          transaction
        }
      )

      console.log(conseillers[0])
      await sequelize.query(
        `UPDATE conseiller SET id_structure_milo = NULL WHERE id_structure_milo = ?`,
        {
          replacements: [structureMilo.id],
          transaction
        }
      )

      await sequelize.query(`UPDATE structure_milo SET id = ? WHERE id = ?`, {
        replacements: [codeStructure, structureMilo.id],
        transaction
      })

      for (const conseiller of conseillers[0]) {
        await sequelize.query(
          `UPDATE conseiller SET id_structure_milo = ? WHERE id = ?`,
          {
            replacements: [codeStructure, conseiller.id],
            transaction
          }
        )
      }
    } else {
      await sequelize.query(
        `UPDATE conseiller SET id_structure_milo = NULL WHERE id_structure_milo = ?`,
        {
          replacements: [structureMilo.id],
          transaction
        }
      )
      await sequelize.query(`DELETE FROM structure_milo WHERE id = ?`, {
        replacements: [structureMilo.id],
        transaction
      })
    }
  }
})
