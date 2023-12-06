require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

sequelize.transaction(async transaction => {
  const ACsRAW = await sequelize.query(
    `SELECT * FROM rendez_vous WHERE rendez_vous.type = 'ATELIER' OR rendez_vous.type = 'INFORMATION_COLLECTIVE'`
  )
  const ACs = ACsRAW[0]
  for (const AC of ACs) {
    const idStructureRaw = await sequelize.query(
      `SELECT conseiller.id_structure_milo AS id_structure_milo FROM conseiller WHERE conseiller.id = '${AC.createur.id}'`,
      { transaction }
    )
    const idStructure = idStructureRaw[0][0].id_structure_milo

    if (idStructure)
      await sequelize.query(
        `UPDATE rendez_vous SET id_structure_milo = '${idStructure}' WHERE rendez_vous.id = '${AC.id}'`
      )
  }
  await sequelize.query(
    `UPDATE rendez_vous SET date_suppression = NOW() WHERE (rendez_vous.type = 'ATELIER' OR rendez_vous.type = 'INFORMATION_COLLECTIVE') AND rendez_vous.id_structure_milo IS NULL`
  )

  await sequelize.query(`DELETE FROM rendez_vous_jeune_association WHERE id IN (SELECT rendez_vous_jeune_association.id FROM rendez_vous_jeune_association, jeune, rendez_vous 
    WHERE rendez_vous.id_structure_milo IS NOT null
    AND rendez_vous.id = rendez_vous_jeune_association.id_rendez_vous
    AND rendez_vous_jeune_association.id_jeune = jeune.id 
    AND jeune.id_structure_milo != rendez_vous.id_structure_milo)`)
})
